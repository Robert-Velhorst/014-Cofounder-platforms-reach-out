import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { EventEmitter } from "node:events";
import {
  BROWSER_JOURNEY_STAGES,
  BROWSER_ONBOARDING_STAGES,
  BROWSER_ACCOUNT_RIGHTS_STAGES,
  hasSyntheticCjkGlyphs,
  validateBrowserFixtureDatabase,
  redactBrowserFailure,
  browserJourneyFailureDiagnostics,
  validateBrowserJourneyReceipt,
} from "../apps/cofounder-discovery/scripts/browser-journey-policy.mjs";
import {
  SYNTHETIC_PROFILE,
  assertSyntheticPrivateProfile,
  runSyntheticOnboardingJourney,
} from "../apps/cofounder-discovery/scripts/browser-onboarding-journey.mjs";
import {
  assertSyntheticDeletionRow,
  assertSyntheticDeletionWire,
  runSyntheticAccountRightsJourney,
} from "../apps/cofounder-discovery/scripts/browser-journey-account-rights.mjs";
import {
  COLD_ASSET_CLIENTS,
  COLD_ASSET_CONCURRENCY,
  COLD_ASSET_PHASE,
  measureColdAssetBurst,
  validateColdAssetEvidence,
  runColdAssetCompatibility,
  captureColdAssetSnapshot,
} from "../apps/cofounder-discovery/scripts/browser-cold-assets.mjs";

const root = new URL("../", import.meta.url);
const driverPath = new URL(
  "apps/cofounder-discovery/scripts/browser-journey.mjs",
  root,
);
const driver = readFileSync(driverPath, "utf8");
const onboardingPath = new URL(
  "apps/cofounder-discovery/scripts/browser-onboarding-journey.mjs",
  root,
);
const onboarding = readFileSync(onboardingPath, "utf8");
const accountRightsPath = new URL(
  "apps/cofounder-discovery/scripts/browser-journey-account-rights.mjs",
  root,
);
const accountRights = readFileSync(accountRightsPath, "utf8");
const fixture = readFileSync(
  new URL("scripts/browser-journey.integration.test.mjs", root),
  "utf8",
);
const workflow = readFileSync(
  new URL(".github/workflows/ci.yml", root),
  "utf8",
);
const dockerfile = readFileSync(new URL("Dockerfile", root), "utf8");
const manifest = JSON.parse(
  readFileSync(new URL("package.json", root), "utf8"),
);
const owner = "123e4567-e89b-42d3-a456-426614174000";
const secret = "a".repeat(64);
const url = `mysql://cofounder:${secret}@127.0.0.1:3306/cofounder_test`;

test("browser fixture configuration admits only its canonical synthetic database and owner", () => {
  assert.equal(
    validateBrowserFixtureDatabase(url, owner).hostname,
    "127.0.0.1",
  );
  for (const invalid of [
    null,
    42,
    "",
    url + "\n",
    " " + url,
    url.replace("127.0.0.1", "localhost"),
    url.replace("127.0.0.1", "db.internal"),
    url.replace("mysql:", "https:"),
    url.replace("cofounder:", "root:"),
    url.replace("3306", "3307"),
    url.replace("cofounder_test", "cofounder"),
    url + "?ssl=false",
    url + "#extra",
    url.replace(secret, "password"),
    url.replace(secret, secret.toUpperCase()),
  ]) {
    assert.throws(
      () => validateBrowserFixtureDatabase(invalid, owner),
      (error) =>
        error.message === "browser_journey_config_refused" &&
        !error.message.includes(secret),
    );
  }
  for (const invalidOwner of [
    undefined,
    "",
    "label",
    owner.replace("42d3", "12d3"),
    owner + "suffix",
  ])
    assert.throws(
      () => validateBrowserFixtureDatabase(url, invalidOwner),
      /browser_journey_config_refused/,
    );
});

test("browser failure diagnostics redact registered credentials before limiting output", () => {
  const message = `operation ${url} credential ${secret} ${"x".repeat(3000)}`;
  const redacted = redactBrowserFailure(message, [url, secret]);
  assert.ok(redacted.includes("[redacted]"));
  assert.ok(!redacted.includes(url) && !redacted.includes(secret));
  assert.equal(redacted.length, 2048);
  assert.equal(redactBrowserFailure(undefined, []), "unknown_failure");
});

test("browser stderr retains bounded known failures without raw Docker output or extra fields", () => {
  const failure = {
    event: "browser_journey_failed",
    stage: BROWSER_JOURNEY_STAGES[3],
    error: `operation ${url} ${secret} ${"x".repeat(3000)}`,
    consoleErrorCount: 2,
    externalRequestCount: 0,
    password: secret,
    stack: "private stack must not escape",
    completedStages: [secret],
  };
  const stderr = [
    `Docker raw error contains ${secret}`,
    "not JSON",
    JSON.stringify({ event: "unknown_event", error: secret }),
    JSON.stringify({ ...failure, stage: secret }),
    JSON.stringify({ ...failure, error: "x".repeat(17000) }),
    JSON.stringify(failure),
    JSON.stringify({
      event: "browser_journey_process_failure",
      stage: "startup",
      kind: "uncaughtException",
      consoleErrorCount: -1,
      externalRequestCount: 1e12,
      extra: secret,
    }),
    JSON.stringify({ event: "browser_journey_timeout", stage: "startup" }),
    JSON.stringify({ event: "browser_journey_rejected", stage: "startup" }),
  ].join("\n");
  const diagnostics = browserJourneyFailureDiagnostics(stderr, [url, secret]);
  assert.deepEqual(diagnostics, [
    {
      event: failure.event,
      stage: failure.stage,
      error: redactBrowserFailure(failure.error, [url, secret]),
      consoleErrorCount: 2,
      externalRequestCount: 0,
    },
    {
      event: "browser_journey_process_failure",
      stage: "startup",
      kind: "uncaughtException",
    },
    { event: "browser_journey_timeout", stage: "startup" },
    { event: "browser_journey_rejected", stage: "startup" },
  ]);
  const serialized = JSON.stringify(diagnostics);
  assert.ok(!serialized.includes(secret) && !serialized.includes(url));
  assert.ok(!serialized.includes("private stack"));
  assert.equal(diagnostics[0].error.length, 2048);
  assert.equal(
    browserJourneyFailureDiagnostics(
      Array(20).fill(JSON.stringify(failure)).join("\n"),
      [url, secret],
    ).length,
    8,
  );
  assert.deepEqual(browserJourneyFailureDiagnostics(undefined), []);
  assert.deepEqual(browserJourneyFailureDiagnostics("null\n42\n[]"), []);
  assert.match(fixture, /browserJourneyFailureDiagnostics\(\s*result.stderr/);
  assert.match(fixture, /fixtureSecrets.push\(value\)/);
  assert.doesNotMatch(fixture, /(?:write|error)\(result.stderr\)/);
});

function receipt() {
  return {
    passed: true,
    transport: "isolated-http-loopback",
    stages: [...BROWSER_JOURNEY_STAGES],
    onboardingStages: [...BROWSER_ONBOARDING_STAGES],
    accountRightsStages: [...BROWSER_ACCOUNT_RIGHTS_STAGES],
    coldAssets: coldEvidence(),
    rpcMocks: 0,
    responseFaultsInjected: 1,
    externalProviderActions: 0,
    realSends: 0,
    syntheticCompletionRecords: 1,
    verification: "synthetic-preverified-not-inbox",
    browser: "synthetic-test-version",
    errors: [],
    external: [],
  };
}

// Synthetic receipt shape only; successful validation is not a browser run.
function coldEvidence() {
  return {
    format: "cofounder-cold-assets/v1",
    scope: "cold-static-assets-not-rendered-browser-users",
    windowMs: 60_000,
    clientLimit: 1_200,
    processLimit: 6_000,
    scenarios: ["desktop", "mobile"].map((viewport) => ({
      viewport,
      freshWindowWaitMs: 61_000,
      clients: 100,
      assetRequestsPerClient: 3,
      snapshotSha256: "b".repeat(64),
      snapshotBytes: 30,
      expectedRequests: 300,
      started: 300,
      completed: 300,
      failed: 0,
      dropped: 0,
      statuses: { 200: 300 },
      hashMismatches: 0,
      byteMismatches: 0,
      mimeMismatches: 0,
      transferredBytes: 3_000,
      automaticRetries: 0,
      maximumInFlight: 16,
      peakInFlight: 16,
      durationMs: 100,
    })),
  };
}

// Event/DOM doubles isolate capture accounting. They do not run Chromium,
// render the product, exercise an inbox or produce screenshot evidence.
const captureOrigin = "http://127.0.0.1:13216";
const captureResources = [
  {
    path: "/outreach",
    kind: "document",
    mime: "text/html",
    body: "<html>Event fixture</html>",
  },
  {
    path: "/assets/a.js",
    kind: "script",
    mime: "text/javascript",
    body: "let synthetic = 1;",
  },
  {
    path: "/assets/a.css",
    kind: "stylesheet",
    mime: "text/css",
    body: "body{}",
  },
];
class CaptureEventDouble extends EventEmitter {
  bodyReads = 0;
  constructor(resources) {
    super();
    this.resources = resources;
  }
  async setViewportSize() {}
  async goto() {
    for (const resource of this.resources) {
      const request = {
        url: () => resource.url ?? captureOrigin + resource.path,
        method: () => resource.method ?? "GET",
        resourceType: () => resource.kind,
      };
      this.emit("request", request);
      if (resource.failed) {
        this.emit("requestfailed", request);
        continue;
      }
      if (!resource.noResponse)
        this.emit("response", {
          request: () => request,
          url: request.url,
          status: () => resource.status ?? 200,
          headers: () => ({
            "content-type": resource.mime,
            ...resource.headers,
          }),
          body: async () => {
            this.bodyReads++;
            if (resource.bodyError)
              throw new Error("synthetic private body diagnostic");
            return Buffer.isBuffer(resource.body)
              ? resource.body
              : Buffer.from(resource.body ?? "synthetic");
          },
        });
      if (resource.failureAfterResponse) this.emit("requestfailed", request);
      else if (!resource.unfinished) this.emit("requestfinished", request);
    }
  }
  getByRole() {
    return { waitFor: async () => {} };
  }
  async waitForLoadState() {}
  url() {
    return captureOrigin + "/outreach";
  }
  async title() {
    return "CoFounder Outreach";
  }
  locator() {
    return { count: async () => 0 };
  }
  async evaluate() {
    return true;
  }
  async screenshot() {
    return Buffer.alloc(0);
  }
}
async function captureEvents(resources) {
  const page = new CaptureEventDouble(resources);
  try {
    return await captureColdAssetSnapshot(page, captureOrigin, "desktop");
  } finally {
    for (const event of [
      "request",
      "response",
      "requestfinished",
      "requestfailed",
    ])
      assert.equal(page.listenerCount(event), 0);
  }
}

test("capture event accounting retains every completed resource including duplicate requests", async () => {
  const rows = await captureEvents([...captureResources, captureResources[2]]);
  assert.equal(rows.length, 4);
  assert.equal(rows.filter((row) => row.path === "/assets/a.css").length, 2);
  assert.equal(rows[0].sha256.length, 64);
});

test("capture includes an other-classified favicon without counting API/XHR as static resources", async () => {
  const rows = await captureEvents([
    ...captureResources,
    {
      path: "/favicon.svg",
      kind: "other",
      mime: "image/svg+xml",
      body: "<svg/>",
    },
    { path: "/api/health", kind: "fetch", noResponse: true, unfinished: true },
  ]);
  assert.equal(rows.length, 4);
  assert.equal(rows.find((row) => row.path === "/favicon.svg").kind, "image");
  await assert.rejects(
    captureEvents([
      ...captureResources,
      { path: "/favicon.svg", kind: "other", failed: true },
    ]),
    /cold_asset_capture_refused/,
  );
});

test("capture refuses a static font failure without response even when all essential files succeeded", async () => {
  await assert.rejects(
    captureEvents([
      ...captureResources,
      { path: "/assets/missing.woff2", kind: "font", failed: true },
    ]),
    (error) => error.message === "cold_asset_capture_refused",
  );
});

test("capture refuses omitted completion, missing responses and failures after headers", async () => {
  for (const changes of [
    { unfinished: true },
    { noResponse: true },
    { failureAfterResponse: true },
    { bodyError: true },
  ]) {
    await assert.rejects(
      captureEvents([
        ...captureResources,
        {
          path: "/assets/extra.png",
          kind: "image",
          mime: "image/png",
          ...changes,
        },
      ]),
      (error) => error.message === "cold_asset_capture_refused",
    );
  }
});

test("capture validates each started static destination before accepting an otherwise complete graph", async () => {
  for (const changes of [
    { path: "/api/health" },
    { path: "/%61pi/health" },
    { path: "/assets/../api/health" },
    { url: "https://external.example.invalid/assets/image.png" },
    { url: captureOrigin + "/assets/a.png?private=synthetic" },
    { url: "http://synthetic@127.0.0.1:13216/assets/a.png" },
    { method: "POST" },
    { status: 302 },
    { status: 404 },
    { status: 503 },
  ]) {
    await assert.rejects(
      captureEvents([
        ...captureResources,
        {
          path: "/assets/extra.png",
          kind: "image",
          mime: "image/png",
          ...changes,
        },
      ]),
      (error) => error.message === "cold_asset_capture_refused",
    );
  }
});

test("capture resource-count and declared-byte bounds stop additional response-body reads", async () => {
  const page = new CaptureEventDouble([
    ...captureResources,
    ...Array.from({ length: 62 }, (_, index) => ({
      path: `/assets/image-${index}.png`,
      kind: "image",
      mime: "image/png",
    })),
  ]);
  await assert.rejects(
    captureColdAssetSnapshot(page, captureOrigin, "mobile"),
    /cold_asset_capture_refused/,
  );
  assert.equal(page.bodyReads, 64);
  for (const length of [
    String(8 * 1024 * 1024 + 1),
    "invalid",
    "-1",
    "99999999999999999999",
  ]) {
    const declared = new CaptureEventDouble([
      ...captureResources,
      {
        path: "/assets/extra.png",
        kind: "image",
        mime: "image/png",
        headers: { "content-length": length },
      },
    ]);
    await assert.rejects(
      captureColdAssetSnapshot(declared, captureOrigin, "desktop"),
      /cold_asset_capture_refused/,
    );
    assert.equal(declared.bodyReads, 3);
  }
});

test("capture checks decoded-body and aggregate snapshot bytes rather than trusting headers", async () => {
  await assert.rejects(
    captureEvents([
      ...captureResources,
      {
        path: "/assets/large.png",
        kind: "image",
        mime: "image/png",
        body: Buffer.alloc(8 * 1024 * 1024 + 1),
        headers: { "content-length": "1" },
      },
    ]),
    /cold_asset_capture_refused/,
  );
  const body = Buffer.alloc(8 * 1024 * 1024, 1);
  await assert.rejects(
    captureEvents([
      ...captureResources,
      ...Array.from({ length: 8 }, (_, index) => ({
        path: `/assets/large-${index}.png`,
        kind: "image",
        mime: "image/png",
        body,
      })),
    ]),
    /cold_asset_capture_refused/,
  );
});

test("capture preflight rejects unexpected origins/viewports before page access", async () => {
  for (const [origin, viewport] of [
    ["https://production.example.invalid", "desktop"],
    [captureOrigin + "/", "desktop"],
    [captureOrigin, "../../outside"],
    [captureOrigin, undefined],
  ])
    await assert.rejects(
      captureColdAssetSnapshot(undefined, origin, viewport),
      /cold_asset_evidence_refused/,
    );
});

test("cold asset evidence refuses missing, reduced, retried or incomplete scenarios", () => {
  assert.equal(COLD_ASSET_CLIENTS, 100);
  assert.equal(COLD_ASSET_CONCURRENCY, 16);
  assert.equal(validateColdAssetEvidence(coldEvidence()).scenarios.length, 2);
  for (const changes of [
    { clients: 99 },
    { assetRequestsPerClient: 2 },
    { freshWindowWaitMs: 59_999 },
    { started: 299 },
    { completed: 299 },
    { failed: 1 },
    { dropped: 1 },
    { hashMismatches: 1 },
    { byteMismatches: 1 },
    { mimeMismatches: 1 },
    { automaticRetries: 1 },
    { transferredBytes: 2_999 },
    { durationMs: 60_000 },
    { statuses: { 200: 299, 429: 1 } },
    { snapshotSha256: "invalid" },
  ]) {
    const value = coldEvidence();
    Object.assign(value.scenarios[0], changes);
    assert.throws(
      () => validateColdAssetEvidence(value),
      /cold_asset_evidence_refused/,
    );
  }
  for (const changes of [
    { scope: "100-rendered-browser-users" },
    { clientLimit: 1_201 },
    { scenarios: coldEvidence().scenarios.reverse() },
    { scenarios: [] },
  ])
    assert.throws(() =>
      validateColdAssetEvidence({ ...coldEvidence(), ...changes }),
    );
  assert.throws(() =>
    validateBrowserJourneyReceipt({ ...receipt(), coldAssets: undefined }),
  );
});

async function withColdServer(run) {
  const bodies = [
    [
      "/outreach",
      "document",
      "text/html",
      "<html>Synthetic transport fixture</html>",
    ],
    [
      "/assets/test.js",
      "script",
      "text/javascript",
      "console.log('synthetic');",
    ],
    ["/assets/test.css", "stylesheet", "text/css", "body { color: black; }"],
  ];
  let mode = "normal";
  const counts = {};
  const resources = bodies.map(([path, kind, mime, body]) => ({
    path,
    kind,
    mime,
    bytes: Buffer.byteLength(body),
    sha256: createHash("sha256").update(body).digest("hex"),
  }));
  const server = createServer((request, response) => {
    counts[request.url] = (counts[request.url] || 0) + 1;
    if (mode === "quota") {
      response.writeHead(429, { "Retry-After": "1" }).end();
      return;
    }
    if (mode === "redirect") {
      response.writeHead(302, { Location: "/redirect-target" }).end();
      return;
    }
    const row = bodies.find(([path]) => path === request.url);
    if (!row) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": mode === "changed" ? "text/plain" : row[2],
    });
    response.end(mode === "changed" ? "changed" : row[3]);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run({
      origin: `http://127.0.0.1:${server.address().port}`,
      resources,
      counts,
      mode: (value) => {
        mode = value;
      },
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("cold transport offers all 100 asset sets without retries and checks actual bodies", async () => {
  await withColdServer(async ({ origin, resources, counts, mode }) => {
    const report = await measureColdAssetBurst(origin, resources);
    assert.deepEqual(counts, {
      "/outreach": 100,
      "/assets/test.js": 100,
      "/assets/test.css": 100,
    });
    assert.equal(report.expectedRequests, 300);
    assert.equal(report.started, 300);
    assert.equal(report.completed, 300);
    assert.equal(
      report.failed +
        report.dropped +
        report.hashMismatches +
        report.byteMismatches +
        report.mimeMismatches,
      0,
    );
    assert.equal(
      report.transferredBytes,
      100 * resources.reduce((sum, row) => sum + row.bytes, 0),
    );
    assert.ok(report.peakInFlight <= 16);
    mode("changed");
    const changed = await measureColdAssetBurst(origin, resources);
    assert.equal(changed.hashMismatches, 300);
    assert.equal(changed.byteMismatches, 300);
    assert.equal(changed.mimeMismatches, 300);
  });
});

test("cold transport neither retries quotas nor follows redirects", async () => {
  await withColdServer(async ({ origin, resources, counts, mode }) => {
    for (const [value, status] of [
      ["quota", 429],
      ["redirect", 302],
    ]) {
      mode(value);
      const report = await measureColdAssetBurst(origin, resources);
      assert.equal(report.started, 300);
      assert.equal(report.completed, 300);
      assert.equal(report.failed, 300);
      assert.deepEqual(report.statuses, { [status]: 300 });
      assert.equal(report.automaticRetries, 0);
    }
    assert.equal(
      Object.values(counts).reduce((a, b) => a + b, 0),
      600,
    );
    assert.equal(counts["/redirect-target"], undefined);
  });
});

test("cold capture refuses external, API, encoded, noncanonical and oversized inputs before IO", async () => {
  await withColdServer(async ({ origin, resources, counts }) => {
    for (const invalid of [
      "https://production.invalid",
      origin + "/",
      origin + "?x=1",
      "http://localhost",
    ]) {
      await assert.rejects(
        measureColdAssetBurst(invalid, resources),
        /cold_asset_evidence_refused/,
      );
    }
    for (const changes of [
      { path: "/api/health" },
      { path: "/%61pi/health" },
      { path: "/assets/../api/health" },
      { path: "//production.invalid/script" },
      { path: "/assets/test.js?cache=1" },
      { path: "/outreach", kind: "script" },
      { bytes: 8 * 1024 * 1024 + 1 },
    ]) {
      const source = structuredClone(resources);
      Object.assign(source[1], changes);
      await assert.rejects(
        measureColdAssetBurst(origin, source),
        /cold_asset_evidence_refused/,
      );
    }
    await assert.rejects(
      measureColdAssetBurst(origin, Array(65).fill(resources[0])),
    );
    assert.deepEqual(counts, {});
  });
  await assert.rejects(
    runColdAssetCompatibility({ origin: "https://production.invalid" }),
  );
});

test("cold assets extend all 24 plus six stages without resetting production thresholds", () => {
  const cold = readFileSync(
    new URL("apps/cofounder-discovery/scripts/browser-cold-assets.mjs", root),
    "utf8",
  );
  assert.ok(
    driver.indexOf("await runColdAssetCompatibility(") >
      driver.indexOf("await runSyntheticOnboardingJourney("),
  );
  assert.match(driver, /coldAssets,/);
  assert.match(cold, /FRONTEND_WINDOW_MS \+ 1000/);
  assert.doesNotMatch(
    cold,
    /x-forwarded-for|\.skip\(|route\.fulfill|createConnection|chromium\.launch/i,
  );
  const diagnostic = browserJourneyFailureDiagnostics(
    JSON.stringify({
      event: "browser_journey_failed",
      stage: COLD_ASSET_PHASE,
      error: "synthetic",
    }),
  );
  assert.equal(diagnostic[0].stage, COLD_ASSET_PHASE);
});
test("browser receipt refuses skipped/reordered stages, fabricated provider work and unexplained errors", () => {
  assert.equal(validateBrowserJourneyReceipt(receipt()).stages.length, 24);
  for (const change of [
    { passed: false },
    { transport: "hosted-https-verified" },
    { stages: BROWSER_JOURNEY_STAGES.slice(1) },
    { stages: [...BROWSER_JOURNEY_STAGES].reverse() },
    { stages: Array(24).fill(BROWSER_JOURNEY_STAGES[0]) },
    { onboardingStages: undefined },
    { onboardingStages: [] },
    { onboardingStages: [...BROWSER_ONBOARDING_STAGES].reverse() },
    { onboardingStages: Array(6).fill(BROWSER_ONBOARDING_STAGES[0]) },
    { accountRightsStages: undefined },
    { accountRightsStages: [] },
    { accountRightsStages: BROWSER_ACCOUNT_RIGHTS_STAGES.slice(1) },
    { accountRightsStages: [...BROWSER_ACCOUNT_RIGHTS_STAGES].reverse() },
    { accountRightsStages: Array(4).fill(BROWSER_ACCOUNT_RIGHTS_STAGES[0]) },
    { rpcMocks: 1 },
    { responseFaultsInjected: 0 },
    { externalProviderActions: 1 },
    { realSends: 1 },
    { syntheticCompletionRecords: 0 },
    { verification: "email-delivered" },
    { errors: ["unexpected"] },
    { external: ["https://provider.invalid/"] },
    { browser: "" },
  ])
    assert.throws(
      () => validateBrowserJourneyReceipt({ ...receipt(), ...change }),
      /complete_browser_journey_receipt_refused/,
    );
  for (const missing of [null, {}, undefined])
    assert.throws(() => validateBrowserJourneyReceipt(missing));
});

test("all 24 archived workflow stages remain explicit real driver actions", () => {
  const names = [...driver.matchAll(/await stage\(\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(names, BROWSER_JOURNEY_STAGES);
  assert.ok(Object.isFrozen(BROWSER_JOURNEY_STAGES));
  assert.match(driver, /await route\.fetch\(\)/);
  assert.match(driver, /await route\.abort\("failed"\)/);
  assert.doesNotMatch(driver, /route\.fulfill\(/);
  assert.match(driver, /assert\.deepEqual\(external, \[\]\)/);
  assert.match(driver, /assert\.deepEqual\(errors, \[\]\)/);
  assert.match(driver, /NotoSansCJK/);
  assert.match(driver, /NotoColorEmoji/);
  assert.doesNotMatch(driver, /MicrosoftJhengHei|SegoeUIEmoji|@sparticuz/);
  assert.match(driver, /WASL Network \(MENA\)/);
  assert.match(driver, /context\.on\("page"/);
  assert.match(driver, /serviceWorkers: "block"/);
});

test("actual CJK coverage accepts installed Noto/WenQuanYi but not missing, custom or last-resort glyphs", () => {
  const observed = {
    familyName: "WenQuanYi Zen Hei",
    postScriptName: "WenQuanYiZenHei",
    isCustomFont: false,
    glyphCount: 3,
  };
  assert.equal(
    hasSyntheticCjkGlyphs([
      { postScriptName: "LiberationSans", isCustomFont: false, glyphCount: 84 },
      observed,
    ]),
    true,
  );
  assert.equal(
    hasSyntheticCjkGlyphs([
      { ...observed, postScriptName: "NotoSansCJKtc-Regular" },
    ]),
    true,
  );
  for (const invalid of [
    undefined,
    [],
    [null],
    [{ ...observed, glyphCount: 0 }],
    [{ ...observed, glyphCount: 2 }],
    [{ ...observed, glyphCount: 4 }],
    [{ ...observed, isCustomFont: true }],
    [{ ...observed, postScriptName: "LastResort" }],
    [{ ...observed, postScriptName: "LiberationSans" }],
    [{ ...observed, postScriptName: "WenQuanYiZenHeiFake" }],
  ])
    assert.equal(hasSyntheticCjkGlyphs(invalid), false);
  assert.match(driver, /hasSyntheticCjkGlyphs\(renderedFonts\)/);
});

test("six onboarding stages extend rather than replace the original workflow", () => {
  assert.equal(BROWSER_JOURNEY_STAGES.length, 24);
  assert.equal(BROWSER_ONBOARDING_STAGES.length, 6);
  assert.ok(Object.isFrozen(BROWSER_ONBOARDING_STAGES));
  const names = [...onboarding.matchAll(/await stage\(\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(names, BROWSER_ONBOARDING_STAGES);
  assert.ok(
    driver.indexOf("await runSyntheticOnboardingJourney(") >
      driver.indexOf(
        '"oversized-retained-export-refused-without-partial-download"',
      ),
  );
  assert.match(driver, /onboardingStages,/);
  assert.match(onboarding, /context\.clearCookies\(\)/);
  assert.match(onboarding, /await login\(foreignEmail\)/);
  assert.match(onboarding, /profile\.create/);
  assert.match(onboarding, /isPublic: true/);
  assert.match(
    onboarding,
    /assert\.deepEqual\(await rows\(foreignOwner\), \[\]\)/,
  );
  assert.match(onboarding, /\/task-output\//);
  assert.doesNotMatch(
    onboarding,
    /route\.fulfill|INSERT INTO|UPDATE user_profiles|createConnection|chromium\.launch|\.skip\(/,
  );
  const failures = browserJourneyFailureDiagnostics(
    JSON.stringify({
      event: "browser_journey_failed",
      stage: BROWSER_ONBOARDING_STAGES[0],
      error: "synthetic failure",
    }),
  );
  assert.equal(failures[0].stage, BROWSER_ONBOARDING_STAGES[0]);
});

test("onboarding SQL assertions require one canonical private owned row with stable identity", () => {
  const row = {
    id: 3,
    user_id: 7,
    ...structuredClone(SYNTHETIC_PROFILE),
    is_public: 0,
    completeness: 100,
  };
  const location = SYNTHETIC_PROFILE.location;
  assert.equal(assertSyntheticPrivateProfile([row], 7, location), 3);
  const encoded = { ...row };
  for (const key of [
    "skills",
    "industries",
    "looking_for",
    "target_industries",
    "work_style",
    "values",
  ])
    encoded[key] = JSON.stringify(encoded[key]);
  assert.equal(assertSyntheticPrivateProfile([encoded], 7, location, 3), 3);
  for (const rows of [
    [],
    [row, row],
    [{ ...row, user_id: 8 }],
    [{ ...row, id: 0 }],
    [{ ...row, is_public: 1 }],
    [{ ...row, is_public: null }],
    [{ ...row, completeness: 13 }],
    [{ ...row, skills: ["Translated value"] }],
    [{ ...row, location: "Foreign profile" }],
  ])
    assert.throws(() => assertSyntheticPrivateProfile(rows, 7, location));
  assert.throws(() => assertSyntheticPrivateProfile([row], 7, location, 4));
});

test("four account rights stages preserve all 24+6 stages, side-effect boundaries and diagnostic reporting", () => {
  assert.equal(BROWSER_ACCOUNT_RIGHTS_STAGES.length, 4);
  assert.ok(Object.isFrozen(BROWSER_ACCOUNT_RIGHTS_STAGES));
  const names = [...accountRights.matchAll(/await stage\(\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(names, BROWSER_ACCOUNT_RIGHTS_STAGES);
  assert.ok(
    driver.indexOf("await runSyntheticAccountRightsJourney(") >
      driver.indexOf("await runSyntheticOnboardingJourney("),
  );
  assert.ok(
    driver.indexOf("await runColdAssetCompatibility(") >
      driver.indexOf("await runSyntheticAccountRightsJourney("),
  );
  assert.match(driver, /accountRightsStages,/);
  assert.match(accountRights, /deletion_fenced_at/);
  assert.match(accountRights, /account_mail_jobs/);
  assert.match(accountRights, /attempts: revision \+ 1/);
  assert.match(accountRights, /deletionEnabled: false/);
  assert.match(accountRights, /\/task-output\//);
  assert.match(accountRights, /await page\.reload\(\)/);
  assert.match(
    accountRights,
    /assert\.deepEqual\(state.counts, initial.counts\)/,
  );
  assert.doesNotMatch(
    accountRights,
    /route\.fulfill|INSERT INTO|UPDATE\s|DELETE FROM|createConnection|chromium\.launch|\.skip\(|clearCookies|process\.env/,
  );
  for (const stage of BROWSER_ACCOUNT_RIGHTS_STAGES) {
    const [failure] = browserJourneyFailureDiagnostics(
      JSON.stringify({
        event: "browser_journey_failed",
        stage,
        error: "synthetic",
      }),
    );
    assert.equal(failure.stage, stage);
  }
});

test("account rights row assertions reject foreign, changed, duplicated or incomplete review requests", () => {
  const key = "a6a38911-b48e-4352-bc45-fce05735c468";
  const row = {
    user_id: 7,
    request_key: key,
    status: "pending_review",
    revision: 1,
    attempts: 1,
    requested_at: new Date("2026-10-23T04:00:00.000Z"),
    withdrawn_at: null,
  };
  const expected = {
    status: "pending_review",
    revision: 1,
    attempts: 1,
    requestKey: key,
  };
  assert.equal(assertSyntheticDeletionRow([row], 7, expected), key);
  assert.equal(
    assertSyntheticDeletionRow(
      [
        {
          ...row,
          status: "withdrawn",
          revision: 2,
          attempts: 2,
          withdrawn_at: new Date("2026-10-23T04:01:00.000Z"),
        },
      ],
      7,
      { ...expected, status: "withdrawn", revision: 2, attempts: 2 },
    ),
    key,
  );
  for (const rows of [
    [],
    [row, row],
    [{ ...row, user_id: 8 }],
    [{ ...row, revision: 2 }],
    [{ ...row, attempts: 0 }],
    [{ ...row, status: "none" }],
    [{ ...row, request_key: "invalid" }],
    [{ ...row, request_key: "b6a38911-b48e-4352-bc45-fce05735c468" }],
    [{ ...row, requested_at: null }],
    [{ ...row, requested_at: "invalid" }],
    [{ ...row, withdrawn_at: new Date() }],
  ])
    assert.throws(() => assertSyntheticDeletionRow(rows, 7, expected));
  assert.throws(() =>
    assertSyntheticDeletionRow([{ ...row, status: "withdrawn" }], 7, {
      ...expected,
      status: "withdrawn",
    }),
  );
});

test("account rights wire assertions retain canonical request and withdrawal commands", () => {
  const key = "a6a38911-b48e-4352-bc45-fce05735c468";
  for (const action of ["request", "withdraw"]) {
    const operation =
      action === "request" ? "requestDeletion" : "withdrawDeletion";
    const command = {
      accountId: 7,
      password: "synthetic-only-password",
      expectedRevision: 1,
      requestKey: key,
      confirmation: action === "request" ? "REQUEST ACCOUNT DELETION" : true,
    };
    const request = {
      url: `http://localhost:13216/api/trpc/accountData.${operation}?batch=1`,
      method: "POST",
      body: { 0: { json: command } },
    };
    const expected = {
      action,
      accountId: 7,
      revision: 1,
      password: command.password,
      requestKey: key,
    };
    assert.equal(assertSyntheticDeletionWire(request, expected), key);
    for (const change of [
      { accountId: 8 },
      { expectedRevision: 0 },
      { password: "wrong" },
      {
        confirmation:
          action === "request" ? "ACCOUNTVERWIJDERING AANVRAGEN" : "true",
      },
      { requestKey: "invalid" },
      { extra: "field" },
    ])
      assert.throws(() =>
        assertSyntheticDeletionWire(
          { ...request, body: { 0: { json: { ...command, ...change } } } },
          expected,
        ),
      );
    for (const change of [
      { method: "GET" },
      { url: request.url.replace("localhost", "production.invalid") },
      { url: request.url.replace("?batch=1", "") },
      { body: { 0: { json: command }, 1: { json: command } } },
      { body: { json: command } },
    ])
      assert.throws(() =>
        assertSyntheticDeletionWire({ ...request, ...change }, expected),
      );
    assert.throws(() =>
      assertSyntheticDeletionWire(request, { ...expected, action: "erase" }),
    );
  }
});

test("account rights refuses invalid fixture origin, identities or credentials before any I/O", async () => {
  const base = {
    origin: "http://localhost:13216",
    owner: 1,
    foreignOwner: 2,
    password: "synthetic-only-password",
    onStage: () => {},
  };
  for (const changes of [
    { origin: "https://production.invalid" },
    { origin: "http://127.0.0.1:13216" },
    { owner: 0 },
    { owner: "1" },
    { foreignOwner: 1 },
    { foreignOwner: -1 },
    { password: "short" },
    { password: undefined },
    { password: "x".repeat(129) },
    { onStage: undefined },
  ])
    await assert.rejects(
      runSyntheticAccountRightsJourney({ ...base, ...changes }),
      assert.AssertionError,
    );
});

test("only the isolated browser fixture opts into review-held intake; erasure and providers stay off", () => {
  assert.equal(
    (fixture.match(/"ENABLE_ACCOUNT_DELETION_REQUESTS=true"/g) || []).length,
    1,
  );
  for (const flag of [
    "ENABLE_ACCOUNT_DELETION_WORKER",
    "ENABLE_ACCOUNT_MAIL_WORKER",
    "ENABLE_PLATFORM_AUTOMATION",
    "ENABLE_OWNER_NOTIFICATIONS",
  ])
    assert.ok(fixture.includes(`"${flag}=false"`));
  const config = readFileSync(
    new URL("apps/cofounder-discovery/server/config.ts", root),
    "utf8",
  );
  assert.match(config, /const booleanFromString[\s\S]*?default\("false"\)/);
  assert.match(config, /ENABLE_ACCOUNT_DELETION_REQUESTS: booleanFromString/);
});

test("onboarding refuses unexpected origin or owners before browser/database access", async () => {
  const base = { origin: "http://localhost:13216", owner: 1, foreignOwner: 2 };
  for (const changes of [
    { origin: "https://production.invalid" },
    { origin: "http://127.0.0.1:13216" },
    { owner: 0 },
    { owner: "1" },
    { foreignOwner: 1 },
    { foreignOwner: -2 },
  ])
    await assert.rejects(
      runSyntheticOnboardingJourney({ ...base, ...changes }),
      assert.AssertionError,
    );
});

test("browser code parses and refuses execution before loading browser/database packages without authorization", () => {
  for (const path of [
    driverPath,
    onboardingPath,
    accountRightsPath,
    new URL("apps/cofounder-discovery/scripts/browser-cold-assets.mjs", root),
    new URL("scripts/browser-journey.integration.test.mjs", root),
  ]) {
    const checked = spawnSync(
      process.execPath,
      ["--check", fileURLToPath(path)],
      { encoding: "utf8", timeout: 5000 },
    );
    assert.equal(checked.status, 0, checked.stderr);
  }
  const result = spawnSync(process.execPath, [fileURLToPath(driverPath)], {
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      RUN_SYNTHETIC_BROWSER_JOURNEY: "false",
      DATABASE_URL: url,
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /synthetic_browser_journey_not_authorized/);
  assert.doesNotMatch(result.stderr, /Cannot find module|Cannot find package/);
  assert.ok(!result.stdout.includes(secret) && !result.stderr.includes(secret));
});

test("browser fixture source declares network, ownership, mount and recovery invariants", () => {
  for (const invariant of [
    "--pull=never",
    '"--network", "none"',
    '"--read-only"',
    '"--cap-drop", "ALL"',
    '"no-new-privileges"',
    "MYSQL_DATABASE=cofounder_test",
    "BROWSER_JOURNEY_OWNER=",
    "pendingCreation",
    "validateBrowserJourneyReceipt",
    "provenOwner",
    "removed.has",
    "cofounder-browser-secrets-",
  ])
    assert.ok(
      fixture.replace(/\s+/g, "").includes(invariant.replace(/\s+/g, "")),
      invariant,
    );
  assert.doesNotMatch(
    fixture,
    /docker\("(?:pull|system|volume|network)"|--privileged|--ipc=host|--network.*host|--cap-add|docker\.sock|\.skip\(/,
  );
  assert.match(fixture, /realpathSync\(expected\[i\]\.source\)/);
  assert.match(
    fixture,
    /model\.Config\.Labels\["cofounder\.synthetic-owner"\]/,
  );
  assert.match(fixture, /model\.Image, fixture\.image/);
  assert.match(fixture, /model\.HostConfig\.NetworkMode/);
  assert.match(fixture, /!pendingCreation\s*&&\s*owned\.every/);
  assert.ok(
    fixture.indexOf("const runtime = image(") <
      fixture.indexOf("directory = mkdtempSync("),
  );
});

test("CI builds a separate browser target and runs mandatory browser acceptance before final audit", () => {
  assert.equal(
    manifest.scripts["test:browser-journey"],
    "node --test scripts/browser-journey.test.mjs",
  );
  assert.equal(
    manifest.scripts["test:browser-journey:integration"],
    "node --test scripts/browser-journey.integration.test.mjs",
  );
  assert.ok(manifest.scripts.test.includes("pnpm test:browser-journey &&"));
  assert.ok(
    manifest.scripts["test:all"].endsWith(
      "pnpm test:browser-journey:integration",
    ),
  );
  const build = workflow.indexOf(
    "run: docker build --target browser-test --tag cofounder-browser-test:local .",
  );
  const acceptance = workflow.indexOf(
    "run: pnpm test:browser-journey:integration",
  );
  assert.ok(build > 0 && acceptance > build);
  assert.ok(
    workflow.indexOf("run: pnpm audit --prod --audit-level high") > acceptance,
  );
  assert.match(dockerfile, /FROM integration-test AS browser-test/);
  assert.match(dockerfile, /pnpm exec playwright install --with-deps chromium/);
  assert.match(dockerfile, /fonts-noto-cjk fonts-noto-color-emoji/);
  assert.match(dockerfile, /dist\/synthetic-browser-catalogue\.cjs/);
  assert.match(
    workflow,
    /actions\/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9/,
  );
  assert.ok(workflow.includes("cofounder-browser-artifacts-*/*.png"));
  assert.match(workflow, /retention-days: 7/);
});
