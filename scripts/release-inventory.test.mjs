import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  inspectRelease,
  runInventory,
  compareReleaseInventories,
} from "./release-inventory.mjs";

const app = "apps/cofounder-discovery";
const git = (_cmd, args) =>
  args.includes("rev-parse") ? "a".repeat(40) : " M package.json\n";
function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), "cofounder-release-test-"));
  const put = (path, content) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  };
  for (const path of ["package.json", `${app}/package.json`])
    put(path, '{"version":"1.2.3"}');
  for (const path of [
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    ".gitattributes",
    "Dockerfile",
    ".dockerignore",
    `${app}/tsconfig.json`,
    `${app}/vite.config.ts`,
  ])
    put(path, "synthetic input");
  for (const dir of ["client/src", "server", "shared", "scripts", "drizzle"])
    mkdirSync(join(root, app, dir), { recursive: true });
  put(`${app}/server/example.ts`, "export const example = 1;");
  put(`${app}/drizzle/meta/_journal.json`, "{}");
  for (const path of [
    "index.js",
    "migrate.js",
    "start-runtime.js",
    "inspect-email-verification.js",
    "require-account-reverification.js",
    "admin-enrollment.js",
    "process-account-deletion.js",
    "public/index.html",
    "public/assets/example.js",
  ])
    put(`${app}/dist/${path}`, "synthetic artifact");
  try {
    return fn(root, put);
  } finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(root.includes("cofounder-release-test-"));
    rmSync(root, { recursive: true });
  }
}
test("stable inventory includes all local assets and separately declared versions", () =>
  fixture((root) => {
    const first = inspectRelease(root, git),
      second = inspectRelease(root, git);
    assert.deepEqual(first, second);
    assert.equal(first.checkout.dirty, true);
    assert.ok(
      first.inventory.some((row) =>
        row.path.endsWith("public/assets/example.js"),
      ),
    );
    assert.equal(
      first.inventoryDigest,
      createHash("sha256")
        .update(JSON.stringify(first.inventory))
        .digest("hex"),
    );
    assert.equal(first.buildProvenanceVerified, false);
    assert.equal(first.testAcceptanceVerified, false);
    assert.equal(first.productionAcceptanceProven, false);
  }));
test("source and built artifact changes independently invalidate the digest", () =>
  fixture((root, put) => {
    const before = inspectRelease(root, git);
    put(`${app}/server/example.ts`, "export const example = 2;");
    const changedSource = inspectRelease(root, git);
    assert.notEqual(before.inventoryDigest, changedSource.inventoryDigest);
    put(`${app}/dist/public/assets/example.js`, "changed artifact");
    assert.notEqual(
      changedSource.inventoryDigest,
      inspectRelease(root, git).inventoryDigest,
    );
  }));
test("does not include environment, logs, dependencies or arbitrary user data", () =>
  fixture((root, put) => {
    for (const path of [
      `${app}/server/.env`,
      `${app}/server/logs/private.json`,
      `${app}/server/node_modules/private.js`,
      `${app}/server/private.txt`,
      ".env",
    ])
      put(path, "PRIVATE_SENTINEL");
    const output = JSON.stringify(inspectRelease(root, git));
    assert.doesNotMatch(
      output,
      /PRIVATE_SENTINEL|private\.json|private\.js|private\.txt/,
    );
  }));

test("checkout byte policy is required, hashed and cannot silently disappear", () =>
  fixture((root, put) => {
    put(".gitattributes", "*.ts text eol=lf\n*.tsx text eol=lf\n");
    const before = inspectRelease(root, git);
    const row = before.inventory.find((item) => item.path === ".gitattributes");
    assert.ok(row);
    assert.equal(
      row.sha256,
      createHash("sha256")
        .update("*.ts text eol=lf\n*.tsx text eol=lf\n")
        .digest("hex"),
    );
    put(".gitattributes", "*.ts text eol=crlf\n");
    assert.notEqual(
      inspectRelease(root, git).inventoryDigest,
      before.inventoryDigest,
    );
    rmSync(join(root, ".gitattributes"));
    assert.throws(() => inspectRelease(root, git));
  }));

test("package-manager configuration is a required hashed build input, not disclosed content", () =>
  fixture((root, put) => {
    put(".npmrc", "inject-workspace-packages=true\n");
    const before = inspectRelease(root, git);
    const row = before.inventory.find((item) => item.path === ".npmrc");
    assert.ok(row);
    assert.equal(
      row.bytes,
      Buffer.byteLength("inject-workspace-packages=true\n"),
    );
    assert.equal(
      row.sha256,
      createHash("sha256")
        .update("inject-workspace-packages=true\n")
        .digest("hex"),
    );
    put(
      ".npmrc",
      "inject-workspace-packages=false\n//example.invalid/:_authToken=PRIVATE_SENTINEL\n",
    );
    const after = inspectRelease(root, git);
    assert.notEqual(after.inventoryDigest, before.inventoryDigest);
    assert.doesNotMatch(
      JSON.stringify(after),
      /PRIVATE_SENTINEL|_authToken|inject-workspace-packages/,
    );
    rmSync(join(root, ".npmrc"));
    assert.throws(() => inspectRelease(root, git));
  }));

test("rejects a nonregular linked package-manager configuration", () =>
  fixture((root, put) => {
    put("synthetic-config", "inject-workspace-packages=true\n");
    rmSync(join(root, ".npmrc"));
    // Windows file symlinks need privileges not required by this operator tool.
    // Exercise its fixed-input regular-file refusal using an unprivileged junction;
    // other platforms exercise the actual file-symlink refusal.
    symlinkSync(
      process.platform === "win32"
        ? join(root, app, "shared")
        : join(root, "synthetic-config"),
      join(root, ".npmrc"),
      process.platform === "win32" ? "junction" : undefined,
    );
    assert.throws(() => inspectRelease(root, git));
  }));
test("refuses incomplete artifacts", () =>
  fixture((root) => {
    rmSync(join(root, app, "dist/index.js"));
    assert.throws(() => inspectRelease(root, git));
  }));

test("refuses a release missing the signal-aware startup artifact", () =>
  fixture((root) => {
    rmSync(join(root, app, "dist/start-runtime.js"));
    assert.throws(() => inspectRelease(root, git));
  }));
test("refuses symlink directories before enumerating them", () =>
  fixture((root) => {
    const dir = join(root, app, "server/linked");
    symlinkSync(
      join(root, app, "shared"),
      dir,
      process.platform === "win32" ? "junction" : "dir",
    );
    assert.throws(() => inspectRelease(root, git));
  }));
test("refuses invalid version or repository identity", () =>
  fixture((root, put) => {
    assert.throws(() => inspectRelease(root, () => "PRIVATE_SENTINEL"));
    put("package.json", '{"version":"PRIVATE_SENTINEL"}');
    assert.throws(() => inspectRelease(root, git));
  }));
test("help and invalid arguments avoid touching the target", () => {
  assert.equal(runInventory(["--help"], "does-not-exist").code, 0);
  const result = runInventory(["--PRIVATE_SENTINEL"], "does-not-exist");
  assert.equal(result.code, 1);
  assert.doesNotMatch(result.output, /PRIVATE_SENTINEL/);
});
test("failure output withholds target paths and OS exception text", () => {
  const result = runInventory([], "PRIVATE_SENTINEL-does-not-exist");
  assert.deepEqual(JSON.parse(result.output), {
    ok: false,
    error: "release_inventory_unavailable",
  });
});

const rehash = (report) => ({
  ...report,
  inventoryDigest: createHash("sha256")
    .update(JSON.stringify(report.inventory))
    .digest("hex"),
});

test("matching inventory is identity only, never acceptance or checkout approval", () =>
  fixture((root) => {
    const baseline = inspectRelease(root, git);
    const current = {
      ...baseline,
      checkout: { head: "b".repeat(40), dirty: false },
      productionAcceptanceProven: true,
    };
    const result = compareReleaseInventories(baseline, current);
    assert.equal(result.status, "same_observed_inventory");
    assert.deepEqual(result.changes, { added: 0, removed: 0, modified: 0 });
    for (const key of [
      "buildProvenanceVerified",
      "testAcceptanceVerified",
      "productionAcceptanceProven",
    ])
      assert.equal(result[key], false);
    assert.match(result.note, /not checkout identity/);
  }));

test("catalogue-only source edits invalidate comparison even before rebuilding", () =>
  fixture((root, put) => {
    put(
      `${app}/server/platform-catalogue.ts`,
      'export const records = ["synthetic-old"];',
    );
    const baseline = inspectRelease(root, git);
    put(
      `${app}/server/platform-catalogue.ts`,
      'export const records = ["synthetic-new"];',
    );
    const result = compareReleaseInventories(
      baseline,
      inspectRelease(root, git),
    );
    assert.equal(result.status, "inventory_changed");
    assert.deepEqual(result.changes, { added: 0, removed: 0, modified: 1 });
    assert.equal(result.changedRoles["application-source"], 1);
    assert.equal(result.changedRoles["built-artifact"], 0);
  }));

test("comparison classifies added removed and modified files without reflecting their names", () =>
  fixture((root, put) => {
    const baseline = inspectRelease(root, git);
    put(`${app}/server/PRIVATE_SENTINEL.ts`, "synthetic source");
    put("Dockerfile", "new synthetic build input");
    rmSync(join(root, app, "dist/public/assets/example.js"));
    const result = compareReleaseInventories(
      baseline,
      inspectRelease(root, git),
    );
    assert.deepEqual(result.changes, { added: 1, removed: 1, modified: 1 });
    assert.deepEqual(result.changedRoles, {
      "application-source": 1,
      "selected-build-input": 1,
      "built-artifact": 1,
    });
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SENTINEL/);
  }));

test("comparison refuses malformed, tampered or ambiguously ordered inventories", () =>
  fixture((root) => {
    const baseline = inspectRelease(root, git);
    const invalid = [
      { ...baseline, format: "unknown" },
      { ...baseline, scope: "everything" },
      { ...baseline, inventoryDigest: "0".repeat(64) },
      { ...baseline, inventory: [] },
      rehash({
        ...baseline,
        inventory: Array.from({ length: 4097 }, (_, i) => ({
          ...baseline.inventory[0],
          path: `source/${String(i).padStart(5, "0")}.ts`,
        })),
      }),
      rehash({
        ...baseline,
        inventory: Array.from({ length: 7 }, (_, i) => ({
          ...baseline.inventory[0],
          path: `source/${i}.ts`,
          bytes: 40 * 1024 * 1024,
        })),
      }),
      rehash({
        ...baseline,
        inventory: [baseline.inventory[0], baseline.inventory[0]],
      }),
      rehash({ ...baseline, inventory: [...baseline.inventory].reverse() }),
    ];
    for (const override of [
      { path: "../PRIVATE_SENTINEL" },
      { path: "/private" },
      { path: "C:\\private" },
      { path: "a//b" },
      { path: "a/./b" },
      { path: "a\u0000b" },
      { path: "x".repeat(1025) },
      { role: "unknown" },
      { bytes: -1 },
      { bytes: 1.5 },
      { bytes: 41 * 1024 * 1024 },
      { sha256: "invalid" },
      { extra: true },
    ])
      invalid.push(
        rehash({
          ...baseline,
          inventory: [{ ...baseline.inventory[0], ...override }],
        }),
      );
    for (const report of invalid)
      assert.throws(() => compareReleaseInventories(report, baseline));
  }));

test("comparison supports native-language filenames without using them as filesystem targets", () =>
  fixture((root) => {
    const base = inspectRelease(root, git);
    const report = rehash({
      ...base,
      inventory: [{ ...base.inventory[0], path: "source/Қазақстан.ts" }],
    });
    assert.equal(
      compareReleaseInventories(report, report).status,
      "same_observed_inventory",
    );
  }));

test("comparison handler in a real child process uses synthetic files without requiring a checkout build", () =>
  fixture((root, put) => {
    const current = inspectRelease(root, git);
    const file = join(root, "baseline.json");
    put("baseline.json", JSON.stringify(current));
    const execute = () =>
      spawnSync(
        process.execPath,
        [
          fileURLToPath(
            new URL("./release-inventory-test-child.mjs", import.meta.url),
          ),
          file,
          root,
        ],
        { encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024 },
      );
    let result = execute();
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).status, "same_observed_inventory");
    const changed = structuredClone(current);
    changed.inventory[0].sha256 = "0".repeat(64);
    put("baseline.json", JSON.stringify(rehash(changed)));
    result = execute();
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).changes.modified, 1);
  }));

test("baseline reads are bounded, strict UTF8, regular-file-only and content-free on failure", () =>
  fixture((root, put) => {
    const file = join(root, "PRIVATE_SENTINEL.json");
    for (const bytes of [
      "PRIVATE_SENTINEL",
      Buffer.from([0xff]),
      Buffer.alloc(2 * 1024 * 1024 + 1),
    ]) {
      put("PRIVATE_SENTINEL.json", bytes);
      const result = runInventory(["--compare", file], "does-not-exist");
      assert.equal(result.code, 1);
      assert.deepEqual(JSON.parse(result.output), {
        ok: false,
        error: "release_inventory_unavailable",
      });
      assert.doesNotMatch(result.output, /PRIVATE_SENTINEL/);
    }
    assert.equal(runInventory(["--compare", root], "does-not-exist").code, 1);
    const linked = join(root, "linked-baseline.json");
    if (process.platform === "win32") {
      const target = join(root, "baseline-directory");
      mkdirSync(target);
      symlinkSync(target, linked, "junction");
    } else symlinkSync(file, linked);
    assert.equal(runInventory(["--compare", linked], "does-not-exist").code, 1);
    for (const args of [
      ["--compare"],
      ["--compare", ""],
      ["--compare", "--secret"],
      ["--compare", file, "extra"],
    ]) {
      assert.deepEqual(
        JSON.parse(runInventory(args, "does-not-exist").output),
        { ok: false, error: "invalid_inventory_arguments" },
      );
    }
  }));
