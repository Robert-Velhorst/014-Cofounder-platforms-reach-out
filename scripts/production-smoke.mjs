// Run inside a disposable production container with synthetic MySQL and all
// provider workers disabled. This is read-only HTTP acceptance, not a deployment.
// Example: docker compose exec -T app node --input-type=module < scripts/production-smoke.mjs
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

assert.equal(process.env.NODE_ENV, "production");
assert.equal(process.versions.node, "26.12.1");
assert.equal(process.env.ENABLE_OWNER_NOTIFICATIONS, "false");
assert.equal(typeof process.getuid, "function", "Linux runtime required");
assert.notEqual(
  process.getuid(),
  0,
  "production must run without root privileges",
);
for (const path of [
  ".env",
  "server",
  "client",
  "node_modules/vite",
  "node_modules/vitest",
  "node_modules/tsx",
  "node_modules/typescript",
]) {
  assert.equal(
    existsSync(`/app/${path}`),
    false,
    `unexpected runtime development/secret path: ${path}`,
  );
}
const base = `http://127.0.0.1:${process.env.PORT || "3000"}`;
for (const path of [
  "dist/inspect-email-verification.js",
  "dist/require-account-reverification.js",
  "dist/admin-enrollment.js",
  "dist/process-account-deletion.js",
  "drizzle/0037_verification_email_binding.sql",
  "drizzle/0038_workspace_presets.sql",
])
  assert.equal(
    existsSync(`/app/${path}`),
    true,
    `Required release file missing: ${path}`,
  );
const request = (path, options = {}) =>
  fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(3000) });
let live;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    live = await request("/api/health");
    if (live.ok) break;
  } catch {
    /* bounded startup wait only */
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
assert.equal(live?.status, 200, "runtime did not start");
assert.deepEqual(await live.json(), {
  status: "ok",
  mode: "production",
  outreachPaused: process.env.OUTREACH_PAUSED === "true",
  platformAutomation: "disabled",
  legacyRoutes: "disabled",
  databaseConfigured: true,
  haiConnector: "disabled",
});
const ready = await request("/api/ready");
assert.equal(ready.status, 200);
assert.deepEqual(await ready.json(), { status: "ready" });
const page = await request("/");
assert.equal(page.status, 200);
assert.equal(page.headers.get("x-frame-options"), "DENY");
assert.equal(page.headers.get("x-content-type-options"), "nosniff");
assert.equal(page.headers.get("cache-control"), "no-cache");
const html = await page.text();
const asset = html.match(/src="(\/assets\/[^"<>]+\.js)"/);
assert.ok(asset, "compiled browser entry missing");
const js = await request(asset[1]);
assert.equal(js.status, 200);
assert.match(js.headers.get("cache-control") || "", /immutable/);
assert.ok((await js.text()).length > 1000, "compiled browser entry empty");
const auth = await request("/api/trpc/auth.me");
assert.equal(auth.status, 200);
assert.deepEqual(await auth.json(), { result: { data: { json: null } } });
const rejected = await request(
  `/api/trpc/${Array(21).fill("auth.me").join(",")}?batch=1`,
);
assert.equal(rejected.status, 400);
assert.match(await rejected.text(), /Batch call exceeds maximum size/);
assert.equal((await request("/api/trpc/scheduler.getJobs")).status, 403);
for (const path of ["conversationStarters.getHistory", "successMetrics.list"])
  assert.equal((await request(`/api/trpc/${path}`)).status, 403);
for (const path of ["criticalPath.platforms"])
  assert.equal((await request(`/api/trpc/${path}`)).status, 401);
for (const path of ["accountData.export", "criticalPath.prospects.exportCsv"]) {
  const accountExport = await request(`/api/trpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: {} }),
  });
  assert.equal(accountExport.status, 401);
}
assert.equal((await request("/api/integrations/hai/feed")).status, 503);
// This retained provider route is privileged independently of legacy gates.
// Do not send or enable a provider to prove unauthenticated refusal.
const ownerNotification = await request("/api/trpc/system.notifyOwner", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ json: { title: "Synthetic", content: "Never send" } }),
});
assert.equal(ownerNotification.status, 403);
// Recent customer surfaces must stay protected in the pruned production bundle,
// not only in a source-level router test. These requests contain no private data.
const progressRead = await request("/api/trpc/criticalPath.progress.list");
assert.equal(progressRead.status, 401);
assert.equal(progressRead.headers.get("cache-control"), "private, no-store");
const progressWrite = await request("/api/trpc/criticalPath.progress.record", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ json: {} }),
});
assert.equal(progressWrite.status, 401);
assert.equal(progressWrite.headers.get("cache-control"), "private, no-store");
// Private reusable defaults must also remain inaccessible without a session in
// the actual pruned runtime, including its write endpoint.
for (const [path, options] of [
  ["criticalPath.presets.read", {}],
  [
    "criticalPath.presets.save",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: {} }),
    },
  ],
]) {
  const response = await request(`/api/trpc/${path}`, options);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
}
const origin = await request("/api/trpc/auth.logout", {
  method: "POST",
  headers: {
    origin: "https://untrusted.example.invalid",
    "content-type": "application/json",
  },
  body: "{}",
});
assert.equal(origin.status, 403);
assert.equal((await origin.json()).error, "origin_rejected");
for (const [path, status, error] of [
  ["/api/not-a-route", 404, "api_not_found"],
  ["/api/trpc/auth.%ZZ", 400, "invalid_request_path"],
]) {
  const response = await request(path);
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const requestId = response.headers.get("x-request-id");
  assert.match(requestId || "", /^[a-f0-9-]{36}$/);
  assert.deepEqual(await response.json(), { error, requestId });
}
const malformed = await request("/api/trpc/auth.login", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-request-id": "synthetic-private-caller-content",
  },
  body: '{"private-body":',
});
assert.equal(malformed.status, 400);
assert.match(malformed.headers.get("x-request-id") || "", /^[a-f0-9-]{36}$/);
assert.equal((await malformed.json()).error, "invalid_request_body");
const oversizedBody = await request("/api/trpc/auth.login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ privateBody: "x".repeat(1024 * 1024) }),
});
assert.equal(oversizedBody.status, 413);
assert.equal((await oversizedBody.json()).error, "request_body_too_large");
console.log(
  JSON.stringify({
    event: "production_smoke_passed",
    node: process.versions.node,
    openssl: process.versions.openssl,
    uid: process.getuid(),
    nonRoot: true,
    providersDisabled: true,
    databaseReady: true,
    compiledClient: true,
  }),
);
