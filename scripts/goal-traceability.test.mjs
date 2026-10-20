import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { auditGoalMatrix } from "./goal-traceability.mjs";

const matrix = readFileSync(
  new URL("../docs/GOAL_COMPLETION_MATRIX.md", import.meta.url),
  "utf8",
);
const row = matrix.split(/\r?\n/).find((line) => /^\|\s*000\s*\|/.test(line));
const cells = row
  .split("|")
  .slice(1, -1)
  .map((cell) => cell.trim());
const replace = (index, value) => {
  const changed = [...cells];
  changed[index] = value;
  return matrix.replace(row, "| " + changed.join(" | ") + " |");
};
test("all exact original phases have bounded statuses and existing evidence, not completion proof", () => {
  const result = auditGoalMatrix(matrix);
  assert.equal(result.phases, 116);
  assert.equal(result.completionProven, false);
  assert.equal(
    Object.values(result.statuses).reduce((sum, value) => sum + value, 0),
    116,
  );
});
test("missing phase cannot disappear into a broad range", () => {
  assert.throws(
    () => auditGoalMatrix(matrix.replace(row, "")),
    /phase_inventory_incomplete/,
  );
});
test("duplicate phase ID is rejected", () => {
  assert.throws(
    () => auditGoalMatrix(replace(0, "001")),
    /phase_inventory_incomplete/,
  );
});
test("mislabeled phase title is rejected", () => {
  assert.throws(
    () => auditGoalMatrix(replace(1, "Unrelated easy work")),
    /phase_title_mismatch/,
  );
});
test("Verified is not the original completion status vocabulary", () => {
  assert.throws(
    () => auditGoalMatrix(replace(2, "Verified")),
    /unsupported_phase_status/,
  );
});
test("existing evidence cannot be assumed when the file is missing", () => {
  assert.throws(() => auditGoalMatrix(matrix, () => false), /evidence_missing/);
});
test("evidence traversal is rejected before any filesystem lookup", () => {
  let reads = 0;
  assert.throws(
    () =>
      auditGoalMatrix(replace(3, "[Inspect](../../private)"), () => {
        reads++;
        return true;
      }),
    /evidence_outside_repository/,
  );
  assert.equal(reads, 0);
});
test("remote and encoded evidence paths cannot masquerade as repository proof", () => {
  for (const path of ["https://example.invalid/private", "%2e%2e/private"])
    assert.throws(
      () => auditGoalMatrix(replace(3, "[Inspect](" + path + ")")),
      /evidence_outside_repository/,
    );
});
test("phase closure criteria cannot be left blank", () => {
  assert.throws(
    () => auditGoalMatrix(replace(4, "")),
    /acceptance_boundary_missing/,
  );
});
test("extra user requirements cannot be dropped from the audit", () => {
  assert.throws(
    () =>
      auditGoalMatrix(
        matrix.replace(
          "## Additional accepted user requirements",
          "## Omitted",
        ),
      ),
    /source_or_additional_scope_missing/,
  );
});
test("every document artifact named by the original source must remain present", () => {
  assert.throws(
    () => auditGoalMatrix(matrix, (name) => name !== "docs/CODEX_WORKLOG.md"),
    /required_artifact_missing/,
  );
});
test("an Implemented claim is still not automated proof of goal completion", () => {
  assert.equal(
    auditGoalMatrix(replace(2, "Implemented")).completionProven,
    false,
  );
});
test("CLI errors do not echo private arguments or contact providers", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("./goal-traceability.mjs", import.meta.url)),
      "--secret",
      "synthetic-private-value",
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout), {
    valid: false,
    completionProven: false,
    error: "invalid_arguments",
  });
  assert.doesNotMatch(result.stdout + result.stderr, /synthetic-private-value/);
});
test("CLI accepts a package-manager separator without admitting unknown flags", () => {
  const script = fileURLToPath(
    new URL("./goal-traceability.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [script, "--"], {
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).completionProven, false);
  const invalid = spawnSync(
    process.execPath,
    [script, "--", "--secret", "synthetic-private-value"],
    { encoding: "utf8", timeout: 10000 },
  );
  assert.equal(invalid.status, 1);
  assert.doesNotMatch(
    invalid.stdout + invalid.stderr,
    /synthetic-private-value/,
  );
});
