// Read-only Compose model checks: never start containers or inspect host secrets.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  startupMigrationArguments,
  migrationVerificationOnly,
} from "../apps/cofounder-discovery/server/migration-startup-mode.ts";

test("migration startup never silently skips or accepts an unknown verification mode", () => {
  assert.deepEqual(startupMigrationArguments(undefined), []);
  assert.deepEqual(startupMigrationArguments("apply"), []);
  assert.deepEqual(startupMigrationArguments("verify"), ["--verify-only"]);
  for (const value of [
    "",
    "false",
    "skip",
    "VERIFY",
    "verify-only",
    " verify",
    "private-mode-value",
  ])
    assert.throws(
      () => startupMigrationArguments(value),
      /^Error: runtime_migration_mode_invalid$/,
    );
});
test("migration CLI recognizes only an explicit read-only flag and optional package separator", () => {
  for (const args of [[], ["--"]])
    assert.equal(migrationVerificationOnly(args), false);
  for (const args of [["--verify-only"], ["--", "--verify-only"]])
    assert.equal(migrationVerificationOnly(args), true);
  for (const args of [
    ["--skip"],
    ["--verify-only", "--verify-only"],
    ["--verify-only=false"],
    ["--verify-only", "private-value"],
    ["--", "--", "--verify-only"],
  ])
    assert.throws(
      () => migrationVerificationOnly(args),
      /^Error: migration_arguments_invalid$/,
    );
});

const directory = mkdtempSync(join(tmpdir(), "cofounder-compose-fixture-"));
const blankEnv = join(directory, "empty.env");
const syntheticSecret = join(directory, "synthetic.secret");
writeFileSync(blankEnv, "");
writeFileSync(syntheticSecret, "synthetic-only-not-a-real-key\n", {
  mode: 0o600,
});
after(() => rmSync(directory, { recursive: true, force: true }));
const image = `example.invalid/cofounder@sha256:${"a".repeat(64)}`;
test("production runtime launches migration/server through the signal-aware Node entry", () => {
  const dockerfile = readFileSync(
    new URL("../Dockerfile", import.meta.url),
    "utf8",
  );
  const command = dockerfile
    .split(/\r?\n/)
    .filter((line) => line.startsWith("CMD "))
    .at(-1);
  assert.deepEqual(JSON.parse(command.slice(4)), [
    "node",
    "dist/start-runtime.js",
  ]);
  const app = JSON.parse(
    readFileSync(
      new URL("../apps/cofounder-discovery/package.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(app.scripts.build.includes("esbuild scripts/start-runtime.ts"));
  assert.ok(app.scripts.build.includes("--outfile=dist/start-runtime.js"));
  assert.equal(
    app.scripts.start,
    "cross-env NODE_ENV=production node dist/start-runtime.js",
  );
  assert.equal(
    app.scripts["db:verify"],
    "tsx scripts/migrate.ts --verify-only",
  );
});
const env = {
  ...process.env,
  PRODUCTION_APP_IMAGE: image,
  PUBLIC_ORIGIN: "https://example.invalid",
  DATABASE_URL_SECRET_FILE: syntheticSecret,
  JWT_SECRET_FILE: syntheticSecret,
  RESEND_API_KEY_SECRET_FILE: syntheticSecret,
  AUTH_MAIL_ENCRYPTION_SECRET_FILE: syntheticSecret,
  AUTH_EMAIL_FROM: "sender@example.invalid",
  TRUST_PROXY: "false",
  API_MAX_ACTIVE_WORK: "32",
};

function model(extra = {}, mail = false) {
  const args = [
    "compose",
    "--env-file",
    blankEnv,
    "-f",
    fileURLToPath(new URL("../compose.production.yml", import.meta.url)),
  ];
  if (mail)
    args.push(
      "-f",
      fileURLToPath(new URL("../compose.production-mail.yml", import.meta.url)),
    );
  args.push("config", "--format", "json");
  return spawnSync("docker", args, {
    env: { ...env, ...extra },
    encoding: "utf8",
    timeout: 15_000,
  });
}

test("production Compose preserves explicit verify mode without silently repairing invalid values", () => {
  for (const [input, expected] of [
    [undefined, "apply"],
    ["apply", "apply"],
    ["verify", "verify"],
    ["", ""],
    ["skip", "skip"],
  ]) {
    const result = model({ STARTUP_MIGRATION_MODE: input });
    assert.equal(result.status, 0);
    assert.equal(
      JSON.parse(result.stdout).services.app.environment.STARTUP_MIGRATION_MODE,
      expected,
    );
  }
});

test("build context excludes local evidence and browser artifacts without dropping source fixtures", () => {
  const rules = readFileSync(
    new URL("../.dockerignore", import.meta.url),
    "utf8",
  )
    .split(/\r?\n/)
    .map((line) => line.trim());
  for (const rule of [
    "**/.secrets",
    "**/*.secret",
    "**/.env",
    "**/output",
    "**/outputs",
    "**/.playwright-cli",
    "**/playwright-report",
    "**/browser-artifacts",
  ])
    assert.ok(rules.includes(rule), `Missing build exclusion: ${rule}`);
  for (const rule of ["**/server", "**/test-fixtures", "**/drizzle"])
    assert.equal(
      rules.includes(rule),
      false,
      `Required source excluded: ${rule}`,
    );
});

test("workspace audit admission settings survive Compose including explicit stops", () => {
  const defaults = model({
    CAPACITY_WORKSPACE_AUDIT_TOTAL: undefined,
    CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT: undefined,
  });
  assert.equal(defaults.status, 0);
  const envDefaults = JSON.parse(defaults.stdout).services.app.environment;
  assert.equal(envDefaults.CAPACITY_WORKSPACE_AUDIT_TOTAL, "100000");
  assert.equal(envDefaults.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT, "10000");
  for (const value of ["0", "23", ""]) {
    const configured = model({
      CAPACITY_WORKSPACE_AUDIT_TOTAL: value,
      CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT: value,
    });
    assert.equal(configured.status, 0);
    const configuredEnv = JSON.parse(configured.stdout).services.app
      .environment;
    assert.equal(configuredEnv.CAPACITY_WORKSPACE_AUDIT_TOTAL, value);
    assert.equal(configuredEnv.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT, value);
  }
});
test("session admission preserves default, configured and explicit stop settings", () => {
  const defaults = model({ CAPACITY_SESSIONS_PER_ACCOUNT: undefined });
  assert.equal(defaults.status, 0);
  assert.equal(
    JSON.parse(defaults.stdout).services.app.environment
      .CAPACITY_SESSIONS_PER_ACCOUNT,
    "10",
  );
  for (const value of ["0", "3", ""]) {
    const configured = model({ CAPACITY_SESSIONS_PER_ACCOUNT: value });
    assert.equal(configured.status, 0);
    assert.equal(
      JSON.parse(configured.stdout).services.app.environment
        .CAPACITY_SESSIONS_PER_ACCOUNT,
      value,
    );
  }
});

test("production model has no embedded secrets, local DB defaults or public port", () => {
  const result = model();
  assert.equal(result.status, 0, "Compose configuration did not validate");
  const config = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(config.services), ["app"]);
  const app = config.services.app;
  assert.equal(app.image, image);
  assert.equal(app.user, "1000:1000");
  assert.equal(app.build, undefined);
  assert.equal(app.environment.NODE_ENV, "production");
  assert.equal(app.environment.APP_MODE, "production");
  assert.equal(app.environment.DATABASE_URL, undefined);
  assert.equal(app.environment.JWT_SECRET, undefined);
  assert.equal(app.environment.DATABASE_URL_FILE, "/run/secrets/database_url");
  assert.equal(app.environment.JWT_SECRET_FILE, "/run/secrets/jwt_secret");
  for (const key of [
    "ENABLE_REGISTRATION",
    "ENABLE_ACCOUNT_DELETION_REQUESTS",
    "ENABLE_ACCOUNT_MAIL_WORKER",
    "ENABLE_ACCOUNT_MAIL_RETENTION",
    "ENABLE_OWNER_NOTIFICATIONS",
    "ENABLE_UNSAFE_LEGACY_ROUTES",
    "ENABLE_PLATFORM_AUTOMATION",
  ])
    assert.equal(app.environment[key], "false");
  assert.equal(app.environment.OUTREACH_PAUSED, "true");
  assert.equal(app.environment.TRUST_PROXY, "false");
  assert.equal(app.environment.API_MAX_ACTIVE_WORK, "32");
  assert.equal(app.ports.length, 1);
  assert.equal(app.ports[0].host_ip, "127.0.0.1");
  assert.equal(app.read_only, true);
  assert.deepEqual(app.cap_drop, ["ALL"]);
  assert.deepEqual(app.security_opt, ["no-new-privileges:true"]);
  assert.equal(app.pids_limit, 256);
  assert.equal(Number(app.cpus), 1);
  assert.equal(Number(app.mem_limit), 512 * 1024 * 1024);
  assert.equal(Number(app.memswap_limit), Number(app.mem_limit));
  assert.equal(app.logging.driver, "local");
  assert.equal(app.logging.options["max-file"], "3");
  assert.deepEqual(app.secrets.map((s) => s.source).sort(), [
    "database_url",
    "jwt_secret",
  ]);
  assert.equal(result.stdout.includes("synthetic-only-not-a-real-key"), false);
});

for (const key of [
  "PRODUCTION_APP_IMAGE",
  "PUBLIC_ORIGIN",
  "DATABASE_URL_SECRET_FILE",
  "JWT_SECRET_FILE",
]) {
  test(`production model rejects missing ${key}`, () => {
    const result = model({ [key]: "" });
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(key));
  });
}

test("explicit mail overlay grants only mail secrets and keeps launch gates closed", () => {
  const result = model({}, true);
  assert.equal(result.status, 0, "Mail Compose configuration did not validate");
  const app = JSON.parse(result.stdout).services.app;
  assert.equal(app.environment.RESEND_API_KEY, undefined);
  assert.equal(app.environment.AUTH_MAIL_ENCRYPTION_SECRET, undefined);
  assert.equal(
    app.environment.RESEND_API_KEY_FILE,
    "/run/secrets/resend_api_key",
  );
  assert.equal(app.environment.ENABLE_ACCOUNT_MAIL_WORKER, "true");
  assert.equal(app.environment.ENABLE_REGISTRATION, "false");
  assert.equal(app.environment.ENABLE_ACCOUNT_MAIL_RETENTION, "false");
  assert.equal(app.environment.ENABLE_OWNER_NOTIFICATIONS, "false");
  assert.equal(app.environment.OUTREACH_PAUSED, "true");
  assert.deepEqual(app.secrets.map((s) => s.source).sort(), [
    "auth_mail_encryption_secret",
    "database_url",
    "jwt_secret",
    "resend_api_key",
  ]);
});

for (const key of [
  "RESEND_API_KEY_SECRET_FILE",
  "AUTH_MAIL_ENCRYPTION_SECRET_FILE",
  "AUTH_EMAIL_FROM",
]) {
  test(`mail overlay rejects missing ${key}`, () => {
    const result = model({ [key]: "" }, true);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(key));
  });
}
