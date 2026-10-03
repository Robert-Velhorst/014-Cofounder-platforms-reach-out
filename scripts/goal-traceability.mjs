// Structural requirements integrity only. Never equate this with goal completion.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PHASE_TITLE_SHA256 =
  "b21ae280a4be7ecc78738010e10eb5fca354db7e7d92a8b5e3ba8adc346957db";
export const RETAINED_SOURCE_SHA256 =
  "8ab17fa2105d5955b455ddbab9c94c55435faafc5b1baa557b8b63610dbd9f78";
const root = fileURLToPath(new URL("../", import.meta.url));
const statuses = [
  "Implemented",
  "Partial",
  "Missing",
  "Blocked",
  "Not applicable",
];
const requiredArtifacts = [
  "TECHNICAL_AUDIT.md",
  "CRITICAL_PATH.md",
  "ACCEPTANCE_TESTS.md",
  "GOAL_COMPLETION_MATRIX.md",
  "FINAL_VERIFICATION_REPORT.md",
  "UI_ACTION_AUDIT.md",
  "API_USAGE_AUDIT.md",
  "SECURITY.md",
  "OPERATOR_RUNBOOK.md",
  "CODEX_WORKLOG.md",
  "CODEX_CHECKPOINTS.md",
  "TASK_GRAPH.md",
];
const fail = (code) => {
  throw new Error(code);
};
const digest = (value) => createHash("sha256").update(value).digest("hex");
const within = (value) =>
  value !== "" &&
  value !== ".." &&
  !value.startsWith("../") &&
  !value.startsWith("..\\") &&
  !isAbsolute(value);

function fileExists(name) {
  try {
    const path = realpathSync(resolve(root, name));
    return (
      within(relative(realpathSync(root), path)) && statSync(path).isFile()
    );
  } catch {
    return false;
  }
}
export function auditGoalMatrix(text, exists = fileExists) {
  if (typeof text !== "string" || text.length > 200000) fail("invalid_matrix");
  const rows = text
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d{3}\s*\|/.test(line))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  if (
    rows.length !== 116 ||
    rows.some(
      (row, index) =>
        row.length !== 5 || row[0] !== String(index).padStart(3, "0"),
    )
  )
    fail("phase_inventory_incomplete");
  if (
    digest(rows.map((row) => row[0] + " " + row[1]).join("\n")) !==
    PHASE_TITLE_SHA256
  )
    fail("phase_title_mismatch");
  if (
    !text.includes(RETAINED_SOURCE_SHA256) ||
    !text.includes("## Additional accepted user requirements")
  )
    fail("source_or_additional_scope_missing");
  const counts = Object.fromEntries(statuses.map((value) => [value, 0]));
  for (const row of rows) {
    if (!statuses.includes(row[2])) fail("unsupported_phase_status");
    if (row[4].length < 20) fail("acceptance_boundary_missing");
    const links = [...row[3].matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(
      (match) => match[1],
    );
    if (links.length === 0) fail("evidence_missing");
    for (const link of links) {
      if (/^(?:[a-z]+:|[\\/#])/i.test(link) || /[%?\\]/.test(link))
        fail("evidence_outside_repository");
      const name = relative(root, resolve(root, "docs", link)).replaceAll(
        "\\",
        "/",
      );
      if (!within(name)) fail("evidence_outside_repository");
      if (!exists(name)) fail("evidence_missing");
    }
    counts[row[2]]++;
  }
  for (const name of requiredArtifacts)
    if (!exists("docs/" + name)) fail("required_artifact_missing");
  return {
    valid: true,
    phases: rows.length,
    requiredArtifacts: requiredArtifacts.length,
    statuses: counts,
    completionProven: false,
  };
}

function main(args) {
  // pnpm may forward its explicit separator to the script.
  if (args[0] === "--") args = args.slice(1);
  if (
    args.length !== 0 &&
    !(args.length === 2 && args[0] === "--source" && args[1])
  )
    fail("invalid_arguments");
  if (args.length) {
    const path = resolve(args[1]);
    if (!statSync(path).isFile() || statSync(path).size > 512000)
      fail("invalid_retained_source");
    if (digest(readFileSync(path)) !== RETAINED_SOURCE_SHA256)
      fail("retained_source_mismatch");
  }
  console.log(
    JSON.stringify(
      auditGoalMatrix(
        readFileSync(resolve(root, "docs/GOAL_COMPLETION_MATRIX.md"), "utf8"),
      ),
    ),
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const allowed = [
      "invalid_matrix",
      "phase_inventory_incomplete",
      "phase_title_mismatch",
      "source_or_additional_scope_missing",
      "unsupported_phase_status",
      "acceptance_boundary_missing",
      "evidence_missing",
      "evidence_outside_repository",
      "required_artifact_missing",
      "invalid_arguments",
      "invalid_retained_source",
      "retained_source_mismatch",
    ];
    console.log(
      JSON.stringify({
        valid: false,
        completionProven: false,
        error: allowed.includes(error?.message)
          ? error.message
          : "requirements_check_failed",
      }),
    );
    process.exitCode = 1;
  }
}
