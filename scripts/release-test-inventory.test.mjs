import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { assertCancelledMigrationReleased } from "./runtime-startup-observation.mjs";

test("cancelled migration observation preserves the shared deadline and every invariant", async () => {
  const safe = { waiting: 0, tables: 0, otherConnectionOwnsLock: true };
  await assertCancelledMigrationReleased({
    observe: () => safe,
    deadline: 3,
    now: () => 0,
  });
  let clock = 0,
    reads = 0;
  await assertCancelledMigrationReleased({
    observe: () => ({ ...safe, waiting: reads++ === 0 ? 1 : 0 }),
    deadline: 3,
    now: () => clock,
    pause: async () => {
      clock++;
    },
  });
  assert.equal(reads, 2);
  for (const bad of [
    { ...safe, tables: 1 },
    { ...safe, otherConnectionOwnsLock: false },
    { ...safe, waiting: 2 },
    { ...safe, waiting: -1 },
  ])
    await assert.rejects(
      assertCancelledMigrationReleased({
        observe: () => bad,
        deadline: 3,
        now: () => 0,
      }),
    );
  clock = 0;
  await assert.rejects(
    assertCancelledMigrationReleased({
      observe: () => ({ ...safe, waiting: 1 }),
      deadline: 3,
      now: () => clock,
      pause: async () => {
        clock++;
      },
    }),
    /database_connection_not_released/,
  );
  assert.equal(clock, 3);
  clock = 0;
  await assert.rejects(
    assertCancelledMigrationReleased({
      observe: () => {
        clock = 3;
        return safe;
      },
      deadline: 3,
      now: () => clock,
    }),
    /database_connection_not_released/,
  );
  await assert.rejects(
    assertCancelledMigrationReleased({
      observe: () => {
        throw new Error("observation_failed");
      },
      deadline: 3,
      now: () => 0,
    }),
    /observation_failed/,
  );
});

const root = new URL("../", import.meta.url);
test("audited TypeScript checkouts retain exact LF source bytes across platforms", () => {
  const paths = [
    "apps/cofounder-discovery/server/routers.ts",
    "apps/cofounder-discovery/client/src/App.tsx",
  ];
  const attributes = execFileSync(
    "git",
    ["check-attr", "eol", "--", ...paths],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split(/\r?\n/);
  assert.deepEqual(
    attributes,
    paths.map((path) => `${path}: eol: lf`),
  );
});
const manifest = JSON.parse(
  readFileSync(new URL("package.json", root), "utf8"),
);
const workflow = readFileSync(
  new URL(".github/workflows/ci.yml", root),
  "utf8",
);
const operators = [
  "test:api-audit",
  "test:ui-audit",
  "test:budget",
  "test:monitor",
  "test:recovery",
  "test:production-config",
  "test:hetzner-config",
  "test:hetzner-database",
  "test:release-contract",
  "test:requirements",
  "test:support",
  "test:release-inventory",
];
test("recovery acceptance builds both test and production targets before rehearsal", () => {
  const commands = activeVerifyCommands(workflow);
  const acceptance = commands.indexOf("pnpm test:recovery:integration");
  assert.ok(acceptance >= 0);
  for (const command of [
    "docker build --target integration-test --tag cofounder-recovery-test:local .",
    "docker build --target runtime --tag cofounder-recovery-runtime:local .",
  ]) {
    const index = commands.indexOf(command);
    assert.ok(
      index >= 0 && index < acceptance,
      "required recovery image not built before acceptance",
    );
  }
});

test("fresh-role database acceptance follows its custom image build and remains mandatory", () => {
  const commands = activeVerifyCommands(workflow);
  const build = commands.indexOf(
    "docker build --file Dockerfile.hetzner-database --tag cofounder-hetzner-database:local .",
  );
  const tested = commands.indexOf("pnpm test:hetzner-database:integration");
  assert.ok(build >= 0 && tested > build);
  assert.equal(
    commands.filter(
      (command) => command === "pnpm test:hetzner-database:integration",
    ).length,
    1,
  );
});

test("authentication admission uses the built production runtime and remains a mandatory CI gate", () => {
  const commands = activeVerifyCommands(workflow.replaceAll("\r\n", "\n"));
  const acceptance = commands.indexOf(
    "pnpm test:authentication-admission:integration",
  );
  const build = commands.indexOf(
    "docker build --target runtime --tag cofounder-recovery-runtime:local .",
  );
  assert.ok(build >= 0 && acceptance > build);
  assert.equal(
    manifest.scripts["test:authentication-admission:integration"],
    "node --test scripts/authentication-admission.integration.test.mjs",
  );
  const fixture = readFileSync(
    new URL("scripts/authentication-admission.integration.test.mjs", root),
    "utf8",
  );
  assert.match(fixture, /cofounder-recovery-runtime:local/);
  assert.match(fixture, /AUTH_ADMISSION_RUNTIME_IMAGE/);
  assert.match(fixture, /--pull=never/);
  assert.doesNotMatch(fixture, /\.skip\(/);
});

test("TLS acceptance builds the custom database and edge before the mandatory four-service rehearsal", () => {
  const commands = activeVerifyCommands(workflow);
  const acceptance = commands.indexOf("pnpm test:tls-ingress:integration");
  assert.ok(acceptance >= 0);
  for (const command of [
    "docker build --file Dockerfile.hetzner-database --tag cofounder-hetzner-database:local .",
    "docker build --file Dockerfile.hetzner-edge --tag cofounder-hetzner-edge:local .",
    "docker build --target runtime --tag cofounder-recovery-runtime:local .",
  ])
    assert.ok(
      commands.indexOf(command) >= 0 && commands.indexOf(command) < acceptance,
    );
});

// Deliberately checks this workflow's existing scalar-run step convention.
// This is not a general YAML parser or proof of a successful hosted CI run.
function activeVerifyCommands(source) {
  source = source.replaceAll("\r\n", "\n");
  const start = source.indexOf("\n  verify:\n");
  assert.notEqual(start, -1, "verify job missing");
  const rest = source.slice(start + 1);
  const next = rest.slice(1).search(/\n  [\w-]+:\n/);
  const job = next < 0 ? rest : rest.slice(0, next + 1);
  assert.doesNotMatch(
    job,
    /^    (?:if|continue-on-error):/m,
    "release verify job cannot be conditional or ignore failures",
  );
  const blocks = job.split(/^      - /m).slice(1);
  return blocks
    .filter((block) => !/^\s+(?:if|continue-on-error):/m.test(block))
    .flatMap((block) => {
      const match = block.match(/^(?:run:| {8}run:) ([^\n]+)\n?/m);
      return match ? [match[1].trim()] : [];
    });
}
function commands(value) {
  return value.split("&&").map((item) => item.trim());
}

test("ordinary local tests run every operator suite exactly once", () => {
  const steps = commands(manifest.scripts.test);
  for (const name of operators)
    assert.equal(
      steps.filter((step) => step === `pnpm ${name}`).length,
      1,
      `${name} absent/duplicated in root test`,
    );
  assert.equal(
    steps.filter(
      (step) => step === "pnpm --dir apps/cofounder-discovery test:unit",
    ).length,
    1,
  );
});
test("operator suite inventory cannot silently omit a new root test file", () => {
  const files = readdirSync(new URL("scripts/", root))
    .filter(
      (file) =>
        file.endsWith(".test.mjs") && !file.endsWith(".integration.test.mjs"),
    )
    .sort();
  const reviewed = operators
    .map((name) => {
      const command = manifest.scripts[name];
      assert.match(command, /^node --test scripts\/[\w-]+\.test\.mjs$/);
      return command.split("/").at(-1);
    })
    .sort();
  assert.deepEqual(reviewed, files);
});
test("all-tests command runs local gates before mandatory database/recovery acceptance", () => {
  assert.deepEqual(commands(manifest.scripts["test:all"]), [
    "pnpm test",
    "pnpm test:integration",
    "pnpm test:readiness:integration",
    "pnpm test:recovery:integration",
    "pnpm test:runtime-startup:integration",
    "pnpm test:authentication-admission:integration",
    "pnpm test:customer-load:integration",
    "pnpm test:hetzner-database:integration",
    "pnpm test:tls-ingress:integration",
  ]);
});
test("every root integration fixture runs exactly once locally and in CI", () => {
  const fixtures = readdirSync(new URL("scripts/", root))
    .filter((file) => file.endsWith(".integration.test.mjs"))
    .sort();
  const reviewed = Object.entries(manifest.scripts).filter(([, command]) =>
    /^node --test scripts\/[\w-]+\.integration\.test\.mjs$/.test(command),
  );
  assert.deepEqual(
    reviewed.map(([, command]) => command.split("/").at(-1)).sort(),
    fixtures,
  );
  const local = commands(manifest.scripts["test:all"]);
  const ci = activeVerifyCommands(workflow.replaceAll("\r\n", "\n"));
  for (const [name] of reviewed) {
    assert.equal(local.filter((step) => step === `pnpm ${name}`).length, 1);
    assert.equal(ci.filter((step) => step === `pnpm ${name}`).length, 1);
  }
});
test("verify CI job runs every operator suite and application/database acceptance", () => {
  const active = activeVerifyCommands(workflow.replaceAll("\r\n", "\n"));
  for (const name of operators)
    assert.equal(
      active.filter((step) => step === `pnpm ${name}`).length,
      1,
      `${name} absent/conditional/duplicated in CI`,
    );
  for (const name of [
    "check",
    "test:unit",
    "build",
    "db:migrate",
    "test:integration",
  ]) {
    assert.equal(
      active.filter(
        (step) => step === `pnpm --dir apps/cofounder-discovery ${name}`,
      ).length,
      1,
    );
  }
  assert.ok(
    active.indexOf("pnpm --dir apps/cofounder-discovery db:migrate") <
      active.indexOf("pnpm --dir apps/cofounder-discovery test:integration"),
  );
  assert.ok(active.includes("pnpm test:recovery:integration"));
  assert.ok(active.includes("pnpm test:readiness:integration"));
  assert.ok(active.includes("pnpm test:runtime-startup:integration"));
});

test("runtime startup acceptance follows the production artifact build", () => {
  const active = activeVerifyCommands(workflow.replaceAll("\r\n", "\n"));
  const built = active.indexOf(
    "docker build --target runtime --tag cofounder-recovery-runtime:local .",
  );
  const tested = active.indexOf("pnpm test:runtime-startup:integration");
  assert.ok(built >= 0 && tested > built);
});
test("CI checks development advisories without hiding failures or weakening the runtime gate", () => {
  function check(source) {
    const active = activeVerifyCommands(source.replaceAll("\r\n", "\n"));
    const full = active.indexOf("pnpm audit --audit-level moderate");
    assert.equal(
      active.filter((step) => step === "pnpm audit --audit-level moderate")
        .length,
      1,
    );
    assert.ok(full > active.indexOf("pnpm install --frozen-lockfile"));
    assert.ok(
      full < active.indexOf("pnpm --dir apps/cofounder-discovery test:unit"),
    );
    assert.ok(active.includes("pnpm audit --prod --audit-level high"));
  }
  check(workflow);
  for (const replacement of [
    "pnpm audit --prod --audit-level moderate",
    "pnpm audit --audit-level high",
    "pnpm audit --audit-level moderate || true",
  ]) {
    assert.throws(() =>
      check(workflow.replace("pnpm audit --audit-level moderate", replacement)),
    );
  }
  for (const ignored of ["if: false", "continue-on-error: true"]) {
    assert.throws(() =>
      check(
        workflow.replace(
          "run: pnpm audit --audit-level moderate",
          `run: pnpm audit --audit-level moderate\n        ${ignored}`,
        ),
      ),
    );
  }
});
test("CI database readiness requires an authenticated application-user TCP query", () => {
  assert.ok(
    workflow.includes(
      "--health-cmd=\"mysql --no-defaults --host=127.0.0.1 --protocol=TCP --connect-timeout=2 --user=cofounder --password=cofounder cofounder_test --execute='SELECT 1'\"",
    ),
  );
  assert.doesNotMatch(workflow, /mysqladmin ping/);
});
test("workflow command detection ignores conditional or commented-out steps", () => {
  const fixture =
    "\n  verify:\n    steps:\n      # - run: pnpm test:budget\n      - run: pnpm test:monitor\n        if: false\n      - run: pnpm test:production-config\n        continue-on-error: true\n      - run: pnpm test:recovery\n  other:\n    steps:\n      - run: pnpm test:budget\n";
  assert.deepEqual(activeVerifyCommands(fixture), ["pnpm test:recovery"]);
  assert.deepEqual(activeVerifyCommands(fixture.replaceAll("\n", "\r\n")), [
    "pnpm test:recovery",
  ]);
  assert.throws(() =>
    activeVerifyCommands(
      fixture.replace("    steps:", "    if: false\n    steps:"),
    ),
  );
});
