import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  truncateSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { createCipheriv } from "node:crypto";
import { fileURLToPath } from "node:url";
import { confinedRestoreGrants } from "./recovery-restore-authority.mjs";

const restoreGrants =
  "GRANT USAGE ON *.* TO `cofounder`@`%`\nGRANT ALL PRIVILEGES ON `cofounder\\_test`.* TO `cofounder`@`%`";
for (const marker of [undefined, "unapproved-private-input@example.invalid"]) {
  test(`restored application probe refuses ${marker === undefined ? "missing" : "wrong"} fixture authorization before network access`, () => {
    const probe = fileURLToPath(
      new URL("./recovery-application-probe.mjs", import.meta.url),
    );
    const result = spawnSync(process.execPath, [probe], {
      encoding: "utf8",
      timeout: 5000,
      env: marker === undefined ? {} : { RECOVERY_APPLICATION_FIXTURE: marker },
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.deepEqual(JSON.parse(result.stderr), {
      event: "restored_application_failed",
      phase: "fixture_configuration",
    });
  });
}
test("accepts explicit target-only grants without active roles or delegation", () => {
  assert.equal(
    confinedRestoreGrants(restoreGrants, "cofounder_test", "NONE"),
    true,
  );
  assert.equal(
    confinedRestoreGrants(
      "GRANT CREATE, INSERT, SELECT ON `cofounder\\_test`.* TO `cofounder`@`%`",
      "cofounder_test",
      "NONE",
    ),
    true,
  );
});
for (const [name, grants, role = "NONE"] of [
  ["server-wide reads", restoreGrants.replace("USAGE", "SELECT")],
  ["server-wide writes", restoreGrants.replace("USAGE", "ALL PRIVILEGES")],
  ["dynamic global powers", restoreGrants.replace("USAGE", "SYSTEM_USER")],
  [
    "foreign database",
    restoreGrants.replace("cofounder\\_test", "anothercustomer"),
  ],
  [
    "wildcard database scope",
    restoreGrants.replace("`cofounder\\_test`.*", "*.*"),
  ],
  ["database delegation", restoreGrants + " WITH GRANT OPTION"],
  [
    "role grant",
    restoreGrants + "\nGRANT `operator_role`@`%` TO `cofounder`@`%`",
  ],
  ["active role", restoreGrants, "`operator_role`@`%`"],
  [
    "proxy grant",
    restoreGrants + "\nGRANT PROXY ON `root`@`localhost` TO `cofounder`@`%`",
  ],
  ["empty", ""],
  ["usage only", "GRANT USAGE ON *.* TO `cofounder`@`%`"],
  ["unknown syntax", "unexpected private text"],
  [
    "unknown database privilege",
    restoreGrants.replace("ALL PRIVILEGES", "UNKNOWN POWER"),
  ],
  [
    "unescaped underscore wildcard",
    restoreGrants.replace("cofounder\\_test", "cofounder_test"),
  ],
  ["oversized", "x".repeat(65537)],
]) {
  test("rejects restore authority: " + name, () => {
    assert.equal(confinedRestoreGrants(grants, "cofounder_test", role), false);
  });
}

const script = fileURLToPath(
  new URL("./database-recovery.mjs", import.meta.url),
);
let folder, keyFile, file, temporaryRoot;
beforeEach(() => {
  temporaryRoot = realpathSync(tmpdir());
  folder = mkdtempSync(join(temporaryRoot, "cofounder-recovery-unit-"));
  keyFile = join(folder, "key");
  file = join(folder, "backup.cfb");
  writeFileSync(keyFile, Buffer.alloc(32, 7));
});
afterEach(() => {
  assert.equal(realpathSync(folder), resolve(folder));
  assert.equal(dirname(realpathSync(folder)), temporaryRoot);
  assert.match(basename(folder), /^cofounder-recovery-unit-[a-zA-Z0-9]+$/);
  rmSync(folder, { recursive: true, force: true });
});
function run(...args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    timeout: 15000,
  });
}
function artifact() {
  const magic = Buffer.from("CFBACK01");
  const metadata = Buffer.from(
    JSON.stringify({
      version: 1,
      database: "cofounder_test",
      sourceContainerId: "a".repeat(64),
      createdAt: "2026-10-01T00:00:00.000Z",
    }),
  );
  const size = Buffer.alloc(4);
  size.writeUInt32BE(metadata.length);
  const header = Buffer.concat([magic, size, metadata]);
  const iv = Buffer.alloc(12, 3);
  const cipher = createCipheriv("aes-256-gcm", Buffer.alloc(32, 7), iv);
  cipher.setAAD(header);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from("CREATE TABLE recovery_probe (id INT);")),
    cipher.final(),
  ]);
  return Buffer.concat([header, iv, encrypted, cipher.getAuthTag()]);
}
test("creates a random key without replacing an existing key", () => {
  const target = join(folder, "new-key");
  const first = run("keygen", "--key-file", target);
  assert.equal(first.status, 0, first.stderr);
  const saved = readFileSync(target);
  assert.equal(saved.length, 32);
  assert.notDeepEqual(saved, Buffer.alloc(32));
  assert.equal(run("keygen", "--key-file", target).status, 1);
  assert.deepEqual(readFileSync(target), saved);
});
test("authenticates a complete known-format artifact without a database or plaintext output", () => {
  writeFileSync(file, artifact());
  const result = run("verify", "--file", file, "--key-file", keyFile);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).event, "backup_verified");
  assert.doesNotMatch(
    result.stdout + result.stderr,
    /CREATE TABLE|recovery_probe|cofounder_test/,
  );
});
for (const damage of [
  "ciphertext",
  "header",
  "tag",
  "truncated",
  "trailing",
  "wrong-key",
]) {
  test(`rejects ${damage} before any restore operation with content-free errors`, () => {
    let bytes = artifact();
    if (damage === "ciphertext") bytes[bytes.length - 20] ^= 1;
    if (damage === "header") bytes[25] ^= 1;
    if (damage === "tag") bytes[bytes.length - 1] ^= 1;
    if (damage === "truncated") bytes = bytes.subarray(0, bytes.length - 10);
    if (damage === "trailing")
      bytes = Buffer.concat([bytes, Buffer.from("extra")]);
    if (damage === "wrong-key") writeFileSync(keyFile, Buffer.alloc(32, 8));
    writeFileSync(file, bytes);
    const result = run("verify", "--file", file, "--key-file", keyFile);
    assert.equal(result.status, 1);
    assert.equal(
      JSON.parse(result.stderr).code,
      "backup_authentication_failed",
    );
    assert.equal(result.stdout, "");
  });
}
for (const args of [
  [],
  ["backup"],
  ["restore-isolated"],
  ["verify", "--wat", "secret"],
  ["keygen", "--key-file", "a", "--key-file", "b"],
]) {
  test(`rejects incomplete or ambiguous arguments ${JSON.stringify(args)}`, () => {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(
      JSON.parse(result.stderr).code,
      "recovery_configuration_invalid",
    );
    assert.equal(existsSync(file), false);
  });
}
test("rejects a short encryption key without publishing an artifact", () => {
  writeFileSync(keyFile, "Never-print-secret");
  writeFileSync(file, artifact());
  const result = run("verify", "--file", file, "--key-file", keyFile);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).code, "recovery_key_invalid");
  assert.doesNotMatch(result.stderr, /Never-print-secret/);
});
test("rejects an oversized artifact before allocating or decrypting its contents", () => {
  writeFileSync(file, Buffer.alloc(0));
  truncateSync(file, 65 * 1024 * 1024);
  const result = run("verify", "--file", file, "--key-file", keyFile);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).code, "backup_authentication_failed");
  assert.equal(result.stdout, "");
});
test(
  "legacy PowerShell backup entrypoint requires explicit encrypted-backup configuration",
  { skip: process.platform !== "win32" },
  () => {
    const wrapper = fileURLToPath(
      new URL("./backup-database.ps1", import.meta.url),
    );
    const result = spawnSync(
      "pwsh",
      ["-NoProfile", "-NonInteractive", "-File", wrapper],
      { encoding: "utf8", timeout: 15000 },
    );
    assert.equal(result.status, 1);
    assert.match(
      result.stdout + result.stderr,
      /recovery_configuration_invalid/,
    );
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /cofounder-local-only|mysqldump|\.sql/,
    );
  },
);
