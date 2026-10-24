// Explicit integration command only. Never copies real project files except
// .dockerignore; all fixture files contain the same content-free synthetic text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  realpathSync,
  lstatSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, relative, isAbsolute, sep } from "node:path";
import {
  REQUIRED_CONTEXT_FILES,
  EXCLUDED_CONTEXT_FILES,
  assertBuildContextRules,
  assertSyntheticContextPaths,
} from "./build-context-policy.mjs";

test(
  "actual BuildKit excludes synthetic private artifacts and preserves required source",
  { timeout: 90000 },
  () => {
    const rules = readFileSync(
      new URL("../.dockerignore", import.meta.url),
      "utf8",
    );
    assertBuildContextRules(rules);
    const temporaryRoot = realpathSync(tmpdir());
    const root = mkdtempSync(join(temporaryRoot, "cofounder-build-context-"));
    const owner = randomUUID();
    writeFileSync(join(root, ".owner"), owner, { flag: "wx", mode: 0o600 });
    let exportMayStillBeActive = false;
    try {
      assert.ok(!root.includes(","), "synthetic_context_export_path_refused");
      const context = join(root, "context"),
        output = join(root, "export");
      mkdirSync(context);
      writeFileSync(join(context, ".dockerignore"), rules, { flag: "wx" });
      writeFileSync(
        join(context, "Dockerfile"),
        "FROM scratch\nCOPY . /visible/\n",
        { flag: "wx" },
      );
      for (const path of [
        ...REQUIRED_CONTEXT_FILES,
        ...EXCLUDED_CONTEXT_FILES,
      ]) {
        const target = join(context, path);
        const inside = relative(context, target);
        assert.ok(
          inside &&
            !isAbsolute(inside) &&
            inside !== ".." &&
            !inside.startsWith(".." + sep),
          "synthetic_context_fixture_path_refused",
        );
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, "# synthetic-build-context-fixture-only\n", {
          flag: "wx",
          mode: 0o600,
        });
      }
      exportMayStillBeActive = true;
      const result = spawnSync(
        "docker",
        [
          "buildx",
          "build",
          "--pull=false",
          "--no-cache",
          "--network=none",
          "--output",
          `type=local,dest=${output}`,
          context,
        ],
        {
          encoding: "utf8",
          shell: false,
          timeout: 60000,
          maxBuffer: 1024 * 1024,
        },
      );
      if (result.error || result.signal || result.status === null)
        throw new Error("synthetic_build_context_observation_incomplete");
      exportMayStillBeActive = false;
      // Docker output is untrusted and not needed to print synthetic file contents.
      assert.equal(result.status, 0, "synthetic_build_context_build_failed");
      const visible = join(output, "visible"),
        paths = [];
      let entries = 0;
      function walk(directory, depth = 0) {
        assert.ok(
          depth <= 8 && paths.length <= 128,
          "synthetic_context_export_bounds_exceeded",
        );
        assert.ok(
          !lstatSync(directory).isSymbolicLink(),
          "synthetic_context_export_link_refused",
        );
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          assert.ok(
            ++entries <= 256,
            "synthetic_context_export_bounds_exceeded",
          );
          const target = join(directory, entry.name);
          assert.ok(
            !entry.isSymbolicLink(),
            "synthetic_context_export_link_refused",
          );
          if (entry.isDirectory()) walk(target, depth + 1);
          else {
            assert.ok(entry.isFile(), "synthetic_context_export_type_refused");
            paths.push(relative(visible, target).split("\\").join("/"));
            assert.ok(
              paths.length <= 128,
              "synthetic_context_export_bounds_exceeded",
            );
          }
        }
      }
      walk(visible);
      console.log(JSON.stringify(assertSyntheticContextPaths(paths.sort())));
    } finally {
      if (exportMayStillBeActive) {
        // A timed-out client is not proof the builder stopped. No replacement or
        // cleanup is attempted; retain this synthetic scratch for inspection.
        console.error(
          JSON.stringify({
            event: "synthetic_context_recovery_required",
            scratch: root,
          }),
        );
      } else {
        // Remove only this new, verified synthetic scratch root; retain uncertainty.
        assert.equal(
          dirname(realpathSync(root)),
          temporaryRoot,
          "synthetic_context_cleanup_parent_refused",
        );
        assert.ok(
          basename(root).startsWith("cofounder-build-context-"),
          "synthetic_context_cleanup_name_refused",
        );
        assert.ok(
          !lstatSync(root).isSymbolicLink(),
          "synthetic_context_cleanup_link_refused",
        );
        assert.equal(
          readFileSync(join(root, ".owner"), "utf8"),
          owner,
          "synthetic_context_cleanup_owner_refused",
        );
        rmSync(root, { recursive: true });
      }
    }
  },
);
