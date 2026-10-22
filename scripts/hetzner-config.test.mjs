import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateHetznerInputs } from "./hetzner-preflight.mjs";
import { tlsIngressOverride } from "./tls-ingress-config.mjs";
import { randomUUID } from "node:crypto";

const directory = mkdtempSync(join(tmpdir(), "cofounder-hetzner-model-"));
const blank = join(directory, "empty.env"),
  secret = join(directory, "synthetic.secret");
writeFileSync(blank, "");
writeFileSync(secret, "synthetic-fixture-only");
after(() => rmSync(directory, { recursive: true, force: true }));
const pinned = `example.invalid/cofounder@sha256:${"a".repeat(64)}`;
const env = {
  ...process.env,
  PRODUCTION_APP_IMAGE: pinned,
  PRODUCTION_EDGE_IMAGE: pinned,
  PRODUCTION_DATABASE_IMAGE: pinned,
  PUBLIC_HOSTNAME: "cofounder.example.invalid",
  PUBLIC_ORIGIN: "https://cofounder.example.invalid",
  DATABASE_URL_SECRET_FILE: secret,
  JWT_SECRET_FILE: secret,
  MYSQL_PASSWORD_SECRET_FILE: secret,
  MYSQL_ROOT_PASSWORD_SECRET_FILE: secret,
  HETZNER_DATA_ROOT: directory,
};
function model(extra = {}, override) {
  return spawnSync(
    "docker",
    [
      "compose",
      "--env-file",
      blank,
      "-f",
      fileURLToPath(new URL("../compose.hetzner.yml", import.meta.url)),
      ...(override ? ["-f", override] : []),
      "config",
      "--format",
      "json",
    ],
    {
      encoding: "utf8",
      timeout: 15000,
      env: { ...env, ...extra },
    },
  );
}
test("the exact TLS rehearsal removes all public ports and persistent stores before startup", () => {
  const owner = randomUUID(),
    caddyFile = join(directory, "Caddyfile");
  const override = join(directory, "override.yml");
  writeFileSync(caddyFile, "synthetic-model-only");
  writeFileSync(override, tlsIngressOverride(owner, caddyFile));
  const result = model({}, override);
  assert.equal(result.status, 0);
  const m = JSON.parse(result.stdout);
  for (const service of Object.values(m.services)) {
    assert.deepEqual(service.ports || [], []);
    assert.equal(service.labels["cofounder.synthetic-owner"], owner);
  }
  assert.deepEqual(m.services.database.volumes || [], []);
  assert.equal(
    m.services.database.environment.MYSQL_DATABASE,
    "cofounder_test",
  );
  assert.ok(
    m.services.database.tmpfs.some((value) =>
      value.startsWith("/var/lib/mysql:"),
    ),
  );
  assert.deepEqual(
    m.services.edge.volumes.map((v) => [
      v.type,
      v.source,
      v.target,
      v.read_only,
    ]),
    [["bind", caddyFile, "/etc/caddy/Caddyfile", true]],
  );
  for (const network of Object.values(m.networks)) {
    assert.equal(network.internal, true);
    assert.equal(network.labels["cofounder.synthetic-owner"], owner);
  }
  assert.throws(() => tlsIngressOverride("unapproved-owner", caddyFile));
  assert.throws(() => tlsIngressOverride(owner, "relative-config"));
});
test("preflight rejects mutable images, wrong origins and source/data overlap without creating services", () => {
  assert.doesNotThrow(() => validateHetznerInputs(env));
  for (const extra of [
    { PRODUCTION_APP_IMAGE: "cofounder:latest" },
    { PRODUCTION_DATABASE_IMAGE: "mysql:latest" },
    { PRODUCTION_EDGE_IMAGE: "caddy:latest" },
    { PUBLIC_HOSTNAME: "127.0.0.1", PUBLIC_ORIGIN: "https://127.0.0.1" },
    { PUBLIC_HOSTNAME: "example.invalid:8443" },
    { PUBLIC_HOSTNAME: "EXAMPLE.invalid" },
    { PUBLIC_HOSTNAME: "example.invalid\nmalformed" },
    { PUBLIC_ORIGIN: "http://cofounder.example.invalid" },
    { PUBLIC_ORIGIN: "https://other.example.invalid" },
    { PUBLIC_ORIGIN: "https://cofounder.example.invalid/path" },
    { HETZNER_DATA_ROOT: "relative-data" },
    { HETZNER_DATA_ROOT: fileURLToPath(new URL("../", import.meta.url)) },
  ])
    assert.throws(
      () => validateHetznerInputs({ ...env, ...extra }),
      /^Error: hetzner_/,
    );
});
test("preflight resolves directory junctions before excluding the checkout", () => {
  const link = join(directory, "checkout-link");
  symlinkSync(fileURLToPath(new URL("../", import.meta.url)), link, "junction");
  assert.throws(
    () => validateHetznerInputs({ ...env, HETZNER_DATA_ROOT: link }),
    /hetzner_data_directory_outside_checkout_required/,
  );
});
test("real preflight CLI validates quietly and never claims hosted or budget acceptance", () => {
  const script = fileURLToPath(
    new URL("./hetzner-preflight.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [script], {
    env,
    encoding: "utf8",
    timeout: 20000,
  });
  assert.equal(result.status, 0);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, "configuration_validated_only");
  for (const key of [
    "hostVerified",
    "dnsVerified",
    "tlsVerified",
    "backupVerified",
    "budgetVerified",
  ])
    assert.equal(receipt[key], false);
  assert.equal(result.stdout.includes(directory), false);
  assert.equal(result.stdout.includes("synthetic-fixture-only"), false);
  const refused = spawnSync(
    process.execPath,
    [script, "private-unapproved-argument"],
    { env, encoding: "utf8" },
  );
  assert.equal(refused.status, 1);
  assert.deepEqual(JSON.parse(refused.stdout), {
    status: "refused",
    reason: "hetzner_arguments_not_supported",
  });
});
test("Hetzner stack exposes only the edge and isolates private application/database traffic", () => {
  const result = model();
  assert.equal(result.status, 0, "hetzner_compose_model_invalid");
  const m = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(m.services).sort(), ["app", "database", "edge"]);
  const { app, database, edge } = m.services;
  assert.deepEqual(app.ports || [], []);
  assert.deepEqual(database.ports || [], []);
  assert.deepEqual(Object.keys(app.networks).sort(), ["database", "ingress"]);
  assert.deepEqual(Object.keys(database.networks), ["database"]);
  assert.deepEqual(Object.keys(edge.networks), ["ingress"]);
  assert.equal(m.networks.database.internal, true);
  assert.deepEqual(
    edge.ports.map((p) => [p.published, p.target]),
    [
      ["80", 8080],
      ["443", 8443],
    ],
  );
  assert.equal(app.environment.TRUST_PROXY, "true");
  assert.equal(
    app.environment.PUBLIC_ORIGIN,
    `https://${edge.environment.PUBLIC_HOSTNAME}`,
  );
  for (const [service, user, memory, cpus, pids] of [
    [app, "1000:1000", 512, 1, 256],
    [database, "999:999", 2048, 1, 256],
    [edge, "1000:1000", 256, 0.5, 128],
  ]) {
    assert.equal(service.image, pinned);
    assert.equal(service.build, undefined);
    assert.equal(service.user, user);
    assert.equal(service.read_only, true);
    assert.deepEqual(service.cap_drop, ["ALL"]);
    assert.deepEqual(service.security_opt, ["no-new-privileges:true"]);
    assert.equal(Number(service.mem_limit), memory * 1024 * 1024);
    assert.equal(service.memswap_limit, service.mem_limit);
    assert.equal(Number(service.cpus), cpus);
    assert.equal(service.pids_limit, pids);
  }
  for (const flag of [
    "ENABLE_REGISTRATION",
    "ENABLE_ACCOUNT_DELETION_REQUESTS",
    "ENABLE_ACCOUNT_MAIL_WORKER",
    "ENABLE_OWNER_NOTIFICATIONS",
    "ENABLE_UNSAFE_LEGACY_ROUTES",
    "ENABLE_PLATFORM_AUTOMATION",
  ])
    assert.equal(app.environment[flag], "false");
  assert.equal(app.environment.OUTREACH_PAUSED, "true");
  assert.deepEqual(database.secrets.map((s) => s.source).sort(), [
    "mysql_password",
    "mysql_root_password",
  ]);
  assert.equal(
    app.secrets.some((s) => s.source === "mysql_root_password"),
    false,
  );
  assert.deepEqual(
    database.volumes.map((v) => [v.type, v.target, v.bind.create_host_path]),
    [["bind", "/var/lib/mysql", false]],
  );
  assert.deepEqual(
    edge.volumes.map((v) => [v.type, v.target, v.bind.create_host_path]),
    [
      ["bind", "/data", false],
      ["bind", "/config", false],
    ],
  );
  assert.equal(result.stdout.includes("synthetic-fixture-only"), false);
});
for (const key of [
  "PRODUCTION_APP_IMAGE",
  "PRODUCTION_EDGE_IMAGE",
  "PRODUCTION_DATABASE_IMAGE",
  "PUBLIC_HOSTNAME",
  "PUBLIC_ORIGIN",
  "DATABASE_URL_SECRET_FILE",
  "JWT_SECRET_FILE",
  "MYSQL_PASSWORD_SECRET_FILE",
  "MYSQL_ROOT_PASSWORD_SECRET_FILE",
  "HETZNER_DATA_ROOT",
]) {
  test(`Hetzner model refuses missing ${key}`, () => {
    const result = model({ [key]: "" });
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes(key));
  });
}
