import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";
import { MYSQL_RAW_BATCH_OPTIONS } from "./mysql-client-options.mjs";
import { confinedRuntimeDml } from "../apps/cofounder-discovery/server/runtime-database-authority.ts";

test("grant CLI requests raw batch text without weakening exact-schema escape validation", () => {
  assert.deepEqual(MYSQL_RAW_BATCH_OPTIONS, [
    "--batch",
    "--skip-column-names",
    "--raw",
  ]);
  assert.ok(Object.isFrozen(MYSQL_RAW_BATCH_OPTIONS));
  const grant =
    "GRANT SELECT, INSERT, UPDATE, DELETE ON `cofounder\\_test`.* TO `cofounder`@`%`";
  assert.equal(confinedRuntimeDml([grant], "cofounder_test", "NONE", ""), true);
  assert.equal(
    confinedRuntimeDml(
      [grant.replaceAll("\\", "\\\\")],
      "cofounder_test",
      "NONE",
      "",
    ),
    false,
  );
});

const directory = mkdtempSync(join(tmpdir(), "cofounder-mysql-unit-"));
after(() => rmSync(directory, { recursive: true, force: true }));
const shell =
  process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "bash";
const posix = (path) =>
  path
    .replaceAll("\\", "/")
    .replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
const validatePath = posix(
  fileURLToPath(
    new URL("../deploy/hetzner/mysql/validate-secrets.sh", import.meta.url),
  ),
);
const initPath = new URL(
  "../deploy/hetzner/mysql/initialize-roles.sh",
  import.meta.url,
);
const password = (char) => char.repeat(64);
const files = ["app", "root", "migrator"].map((name, index) => {
  const path = join(directory, name);
  writeFileSync(path, password(String(index + 1)));
  return posix(path);
});
const env = {
  ...process.env,
  MYSQL_DATABASE: "cofounder",
  MYSQL_USER: "cofounder",
  MYSQL_ROOT_HOST: "localhost",
  MYSQL_PASSWORD_FILE: files[0],
  MYSQL_ROOT_PASSWORD_FILE: files[1],
  MYSQL_MIGRATOR_PASSWORD_FILE: files[2],
  CF_VALIDATE: validatePath,
};
for (const key of [
  "MYSQL_PASSWORD",
  "MYSQL_ROOT_PASSWORD",
  "MYSQL_MIGRATOR_PASSWORD",
  "MYSQL_ALLOW_EMPTY_PASSWORD",
  "MYSQL_RANDOM_ROOT_PASSWORD",
  "MYSQL_ONETIME_PASSWORD",
])
  delete env[key];
function bash(script, extra = {}) {
  return spawnSync(shell, ["-euo", "pipefail", "-c", script], {
    env: { ...env, ...extra },
    encoding: "utf8",
    timeout: 10000,
  });
}
function validate(extra = {}) {
  const result = bash(
    'source "$CF_VALIDATE"; cofounder_mysql_configuration',
    extra,
  );
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
  return result.status;
}

test("pinned custom database sources a non-executable role initializer and validates shell syntax", () => {
  const dockerfile = readFileSync(
    new URL("../Dockerfile.hetzner-database", import.meta.url),
    "utf8",
  );
  assert.ok(dockerfile.includes(`FROM ${getCiMysqlImage()}`));
  assert.match(
    dockerfile,
    /COPY --chmod=0444 deploy\/hetzner\/mysql\/initialize-roles\.sh/,
  );
  assert.match(
    dockerfile,
    /ENTRYPOINT \["\/usr\/local\/bin\/cofounder-mysql-entrypoint"\]/,
  );
  for (const name of ["entrypoint", "initialize-roles", "validate-secrets"]) {
    const path = posix(
      fileURLToPath(
        new URL(`../deploy/hetzner/mysql/${name}.sh`, import.meta.url),
      ),
    );
    const checked = bash('bash -n "$CF_SCRIPT"', { CF_SCRIPT: path });
    assert.equal(checked.status, 0, checked.stderr);
  }
});

test("database initialization accepts only distinct file-backed hexadecimal passwords and fixed identities", () => {
  assert.equal(validate(), 0);
  assert.equal(validate({ MYSQL_DATABASE: "cofounder_test" }), 0);
  for (const extra of [
    { MYSQL_DATABASE: "mysql" },
    { MYSQL_DATABASE: "cofounder` ;" },
    { MYSQL_USER: "root" },
    { MYSQL_ROOT_HOST: "%" },
    { MYSQL_PASSWORD_FILE: "relative" },
    { MYSQL_ROOT_PASSWORD_FILE: "" },
    { MYSQL_MIGRATOR_PASSWORD_FILE: files[0] },
    { MYSQL_ROOT_PASSWORD_FILE: files[0] },
    ...[
      "MYSQL_PASSWORD",
      "MYSQL_ROOT_PASSWORD",
      "MYSQL_MIGRATOR_PASSWORD",
      "MYSQL_ALLOW_EMPTY_PASSWORD",
      "MYSQL_RANDOM_ROOT_PASSWORD",
      "MYSQL_ONETIME_PASSWORD",
    ].map((key) => ({ [key]: "" })),
  ])
    assert.notEqual(validate(extra), 0);
});

test("database wrapper refuses alternate commands and invalid configuration before the official entrypoint", () => {
  const original = readFileSync(
    new URL("../deploy/hetzner/mysql/entrypoint.sh", import.meta.url),
    "utf8",
  );
  const dependency = "source /usr/local/lib/cofounder-validate-secrets.sh";
  assert.equal(original.split(dependency).length, 2);
  const wrapper = original.replace(dependency, 'source "$CF_VALIDATE"');
  // Stub only process replacement: run the actual wrapper and validator, never mysqld.
  const stub =
    'exec() { [[ "$#" -eq 2 && "$1" = /usr/local/bin/docker-entrypoint.sh && "$2" = mysqld ]] || exit 9; printf "%s" official_entrypoint_selected; };\n';
  const accepted = bash(stub + "set -- mysqld;\n" + wrapper);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(accepted.stdout, "official_entrypoint_selected");
  assert.equal(accepted.stderr, "");
  for (const prefix of [
    "set --;",
    "set -- sh;",
    "set -- mysqld --init-file=/unapproved;",
  ]) {
    const rejected = bash(stub + prefix + "\n" + wrapper);
    assert.equal(rejected.status, 1);
    assert.equal(rejected.stdout, "");
    assert.equal(
      rejected.stderr.trim(),
      "cofounder_database_configuration_refused",
    );
  }
  const rejected = bash(stub + "set -- mysqld;\n" + wrapper, {
    MYSQL_ROOT_HOST: "%",
  });
  assert.equal(rejected.status, 1);
  assert.equal(rejected.stdout, "");
  assert.equal(
    rejected.stderr.trim(),
    "cofounder_database_configuration_refused",
  );
});

test("password validation refuses CRLF, NUL, SQL delimiters, malformed hex and oversized files without output", () => {
  const candidate = join(directory, "candidate");
  for (const value of [
    "",
    password("a").slice(1),
    password("A"),
    password("g"),
    `${password("a")}\r\n`,
    `${password("a")}\n\n`,
    `${password("a")}\0`,
    `${password("a").slice(1)}'`,
    `\uFEFF${password("a")}`,
    `${password("a").slice(0, 32)}\n${password("a").slice(32)}`,
    "a".repeat(4096),
  ]) {
    writeFileSync(candidate, value);
    assert.notEqual(validate({ MYSQL_PASSWORD_FILE: posix(candidate) }), 0);
  }
  writeFileSync(candidate, `${password("a")}\n`);
  assert.equal(validate({ MYSQL_PASSWORD_FILE: posix(candidate) }), 0);
});

test("fresh initializer emits exact-schema role SQL and redacts SQL-driver failures", () => {
  const original = readFileSync(initPath, "utf8");
  const line = "source /usr/local/lib/cofounder-validate-secrets.sh";
  assert.equal(original.split(line).length, 2);
  const initializer = original.replace(line, 'source "$CF_VALIDATE"');
  const sqlFile = join(directory, "initialization.sql");
  const setup =
    'mysql_error() { printf "%s\\n" "$1" >&2; exit 1; };\ndocker_process_sql() { cat > "$CF_SQL"; };\n';
  const result = bash(setup + initializer, {
    MYSQL_DATABASE: "cofounder_test",
    CF_SQL: posix(sqlFile),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout + result.stderr, "");
  const sql = readFileSync(sqlFile, "utf8");
  assert.ok(
    sql.includes("REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'cofounder'@'%';"),
  );
  assert.ok(
    sql.includes(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON `cofounder\\_test`.* TO 'cofounder'@'%';",
    ),
  );
  assert.ok(
    sql.includes("CREATE USER 'cofounder_migrator'@'%'") &&
      sql.includes(password("3")),
  );
  assert.ok(
    sql.includes(
      "CREATE, ALTER, DROP, INDEX, REFERENCES ON `cofounder\\_test`.*",
    ),
  );
  assert.ok(!sql.includes("ON *.*") && !sql.includes("WITH GRANT OPTION"));
  const failed = bash(
    'mysql_error() { printf "%s\\n" "$1" >&2; exit 1; }; docker_process_sql() { printf "synthetic-private-sql" >&2; return 1; };\n' +
      initializer,
  );
  assert.equal(failed.status, 1);
  assert.equal(failed.stdout, "");
  assert.equal(
    failed.stderr.trim(),
    "cofounder_database_role_initialization_failed",
  );
});
