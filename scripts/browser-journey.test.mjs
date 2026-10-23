import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  BROWSER_JOURNEY_STAGES,
  validateBrowserFixtureDatabase,
  redactBrowserFailure,
  browserJourneyFailureDiagnostics,
  validateBrowserJourneyReceipt,
} from "../apps/cofounder-discovery/scripts/browser-journey-policy.mjs";

const root = new URL("../", import.meta.url);
const driverPath = new URL(
  "apps/cofounder-discovery/scripts/browser-journey.mjs",
  root,
);
const driver = readFileSync(driverPath, "utf8");
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
test("browser receipt refuses skipped/reordered stages, fabricated provider work and unexplained errors", () => {
  assert.equal(validateBrowserJourneyReceipt(receipt()).stages.length, 24);
  for (const change of [
    { passed: false },
    { transport: "hosted-https-verified" },
    { stages: BROWSER_JOURNEY_STAGES.slice(1) },
    { stages: [...BROWSER_JOURNEY_STAGES].reverse() },
    { stages: Array(24).fill(BROWSER_JOURNEY_STAGES[0]) },
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

test("browser code parses and refuses execution before loading browser/database packages without authorization", () => {
  for (const path of [
    driverPath,
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
