import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import {
  FRONTEND_WINDOW_MS,
  FRONTEND_CLIENT_LIMIT,
  FRONTEND_PROCESS_LIMIT,
} from "../shared/frontend-admission-policy.ts";

// Preserve the original customer population independently of admission limits.
export const COLD_ASSET_CLIENTS = 100;
export const COLD_ASSET_CONCURRENCY = 16;
export const COLD_ASSET_PHASE = "cold-static-assets-desktop-mobile-shared-nat";
const MAX_RESOURCES = 64;
const MAX_RESOURCE_BYTES = 8 * 1024 * 1024;
const MAX_SNAPSHOT_BYTES = 64 * 1024 * 1024;
const kinds = new Set(["document", "script", "stylesheet", "font", "image"]);
const sha = value => createHash("sha256").update(value).digest("hex");
const mime = value =>
  String(value ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
const refuse = () => {
  throw new Error("cold_asset_evidence_refused");
};

function validateResources(origin, resources) {
  let address;
  try {
    address = new URL(origin);
  } catch {
    refuse();
  }
  if (
    origin !== address.origin ||
    address.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(address.hostname) ||
    !address.port ||
    Number(address.port) < 1 ||
    !Array.isArray(resources) ||
    resources.length < 3 ||
    resources.length > MAX_RESOURCES
  )
    refuse();
  let total = 0;
  for (const row of resources) {
    if (
      !row ||
      typeof row.path !== "string" ||
      row.path.length > 2048 ||
      !row.path.startsWith("/") ||
      row.path.startsWith("//") ||
      /[?#%\\\s]/.test(row.path) ||
      !(
        (row.path === "/outreach" && row.kind === "document") ||
        (row.path === "/favicon.svg" && row.kind === "image") ||
        (/^\/assets\/[A-Za-z0-9_./-]+$/.test(row.path) &&
          row.kind !== "document")
      ) ||
      !kinds.has(row.kind) ||
      typeof row.mime !== "string" ||
      !row.mime ||
      !Number.isSafeInteger(row.bytes) ||
      row.bytes < 1 ||
      row.bytes > MAX_RESOURCE_BYTES ||
      typeof row.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(row.sha256)
    )
      refuse();
    const resolved = new URL(row.path, origin);
    if (resolved.origin !== origin || resolved.pathname !== row.path) refuse();
    total += row.bytes;
  }
  if (
    total > MAX_SNAPSHOT_BYTES ||
    !resources.some(
      row => row.kind === "document" && row.path === "/outreach"
    ) ||
    !resources.some(row => row.kind === "script") ||
    !resources.some(row => row.kind === "stylesheet")
  )
    refuse();
  return total;
}

async function digestResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) refuse();
  const hash = createHash("sha256");
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_RESOURCE_BYTES) refuse();
      hash.update(chunk.value);
    }
    return { bytes, sha256: hash.digest("hex") };
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// Reads only loopback static resources. Native transport tests may use an owned
// ephemeral HTTP port; the full browser entrypoint below requires its exact origin.
export async function measureColdAssetBurst(origin, resources) {
  const snapshotBytes = validateResources(origin, resources);
  const source = resources.map(row => ({ ...row }));
  const expectedRequests = COLD_ASSET_CLIENTS * source.length;
  let cursor = 0,
    started = 0,
    completed = 0,
    failed = 0,
    dropped = 0;
  let hashMismatches = 0,
    byteMismatches = 0,
    mimeMismatches = 0,
    transferredBytes = 0;
  let active = 0,
    peakInFlight = 0;
  const statuses = {};
  const began = performance.now();
  async function worker() {
    while (cursor < expectedRequests) {
      // Resource-major round-robin: do not finish one client before offering others.
      const index = cursor++;
      if (performance.now() - began >= FRONTEND_WINDOW_MS - 1) {
        dropped++;
        continue;
      }
      const resource = source[Math.floor(index / COLD_ASSET_CLIENTS)];
      started++;
      active++;
      peakInFlight = Math.max(peakInFlight, active);
      try {
        const remaining = FRONTEND_WINDOW_MS - (performance.now() - began) - 1;
        const response = await fetch(new URL(resource.path, origin), {
          method: "GET",
          redirect: "manual",
          signal: AbortSignal.timeout(
            Math.max(1, Math.floor(Math.min(5000, remaining)))
          ),
        });
        statuses[response.status] = (statuses[response.status] || 0) + 1;
        if (response.status !== 200) {
          failed++;
          await response.body?.cancel();
          continue;
        }
        const observed = await digestResponse(response);
        transferredBytes += observed.bytes;
        if (observed.sha256 !== resource.sha256) hashMismatches++;
        if (observed.bytes !== resource.bytes) byteMismatches++;
        if (mime(response.headers.get("content-type")) !== resource.mime)
          mimeMismatches++;
      } catch {
        failed++;
      } finally {
        active--;
        completed++;
      }
    }
  }
  await Promise.all(Array.from({ length: COLD_ASSET_CONCURRENCY }, worker));
  return {
    clients: COLD_ASSET_CLIENTS,
    assetRequestsPerClient: source.length,
    snapshotSha256: sha(JSON.stringify(source)),
    snapshotBytes,
    expectedRequests,
    started,
    completed,
    failed,
    dropped,
    statuses,
    hashMismatches,
    byteMismatches,
    mimeMismatches,
    transferredBytes,
    automaticRetries: 0,
    maximumInFlight: COLD_ASSET_CONCURRENCY,
    peakInFlight,
    durationMs: Math.ceil(performance.now() - began),
  };
}

export function validateColdAssetEvidence(value) {
  if (
    !value ||
    value.format !== "cofounder-cold-assets/v1" ||
    value.scope !== "cold-static-assets-not-rendered-browser-users" ||
    value.windowMs !== FRONTEND_WINDOW_MS ||
    value.clientLimit !== FRONTEND_CLIENT_LIMIT ||
    value.processLimit !== FRONTEND_PROCESS_LIMIT ||
    !Array.isArray(value.scenarios) ||
    value.scenarios.length !== 2
  )
    refuse();
  for (let index = 0; index < 2; index++) {
    const row = value.scenarios[index];
    if (
      !row ||
      row.viewport !== ["desktop", "mobile"][index] ||
      !Number.isFinite(row.freshWindowWaitMs) ||
      row.freshWindowWaitMs < FRONTEND_WINDOW_MS ||
      row.clients !== COLD_ASSET_CLIENTS ||
      !Number.isSafeInteger(row.assetRequestsPerClient) ||
      row.assetRequestsPerClient < 3 ||
      row.assetRequestsPerClient > MAX_RESOURCES ||
      row.expectedRequests !== row.clients * row.assetRequestsPerClient ||
      row.started !== row.expectedRequests ||
      row.completed !== row.expectedRequests ||
      row.failed !== 0 ||
      row.dropped !== 0 ||
      row.hashMismatches !== 0 ||
      row.byteMismatches !== 0 ||
      row.mimeMismatches !== 0 ||
      row.automaticRetries !== 0 ||
      row.maximumInFlight !== COLD_ASSET_CONCURRENCY ||
      !Number.isSafeInteger(row.peakInFlight) ||
      row.peakInFlight < 1 ||
      row.peakInFlight > COLD_ASSET_CONCURRENCY ||
      !Number.isFinite(row.durationMs) ||
      row.durationMs < 1 ||
      row.durationMs >= FRONTEND_WINDOW_MS ||
      !Number.isSafeInteger(row.snapshotBytes) ||
      row.snapshotBytes < 1 ||
      row.snapshotBytes > MAX_SNAPSHOT_BYTES ||
      row.transferredBytes !== row.clients * row.snapshotBytes ||
      typeof row.snapshotSha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(row.snapshotSha256) ||
      !row.statuses ||
      Object.keys(row.statuses).length !== 1 ||
      row.statuses["200"] !== row.expectedRequests
    )
      refuse();
  }
  return value;
}

async function captureAssets(page, origin, viewport) {
  await page.setViewportSize(
    viewport === "desktop"
      ? { width: 1365, height: 1000 }
      : { width: 375, height: 812 }
  );
  const rows = [],
    pending = [],
    failures = [];
  const capture = response => {
    const request = response.request();
    const kind = request.resourceType();
    if (!kinds.has(kind)) return;
    pending.push(
      (async () => {
        try {
          const url = new URL(response.url());
          if (
            url.origin !== origin ||
            request.method() !== "GET" ||
            url.search ||
            url.hash ||
            response.status() !== 200
          )
            refuse();
          const body = await response.body();
          if (body.length > MAX_RESOURCE_BYTES) refuse();
          rows.push({
            path: url.pathname,
            kind,
            mime: mime(response.headers()["content-type"]),
            bytes: body.length,
            sha256: sha(body),
          });
        } catch {
          failures.push("cold_asset_capture_failed");
        }
      })()
    );
  };
  page.on("response", capture);
  try {
    await page.goto(origin + "/outreach");
    await page
      .getByRole("button", { name: "Add individual candidate", exact: true })
      .waitFor();
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    assert.equal(new URL(page.url()).pathname, "/outreach");
    assert.equal(await page.title(), "CoFounder Outreach");
    assert.equal(await page.locator("vite-error-overlay").count(), 0);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    );
    await page.screenshot({ path: `/task-output/cold-assets-${viewport}.png` });
  } finally {
    page.off("response", capture);
    await Promise.all(pending);
  }
  assert.deepEqual(failures, []);
  rows.sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right), "en")
  );
  validateResources(origin, rows);
  // Deliberately retain duplicate requests: deduplicating would undercount a cold client.
  return rows;
}

export async function runColdAssetCompatibility({ page, origin, onPhase }) {
  assert.equal(process.env.RUN_SYNTHETIC_BROWSER_JOURNEY, "true");
  assert.equal(origin, "http://localhost:13216");
  onPhase(COLD_ASSET_PHASE);
  const desktop = await captureAssets(page, origin, "desktop");
  const mobile = await captureAssets(page, origin, "mobile");
  const scenarios = [];
  for (const [viewport, resources] of [
    ["desktop", desktop],
    ["mobile", mobile],
  ]) {
    // Let the existing client bucket expire naturally; do not restart/reset the
    // app, alter policy, spoof a forwarding header or retry a refused request.
    const waited = performance.now();
    await pause(FRONTEND_WINDOW_MS + 1000);
    const freshWindowWaitMs = Math.floor(performance.now() - waited);
    const scenario = {
      viewport,
      freshWindowWaitMs,
      ...(await measureColdAssetBurst(origin, resources)),
    };
    console.log(
      JSON.stringify({ event: "cold_static_asset_scenario", ...scenario })
    );
    scenarios.push(scenario);
  }
  const evidence = {
    format: "cofounder-cold-assets/v1",
    scope: "cold-static-assets-not-rendered-browser-users",
    windowMs: FRONTEND_WINDOW_MS,
    clientLimit: FRONTEND_CLIENT_LIMIT,
    processLimit: FRONTEND_PROCESS_LIMIT,
    scenarios,
  };
  return validateColdAssetEvidence(evidence);
}
