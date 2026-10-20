import { open, lstat } from "node:fs/promises";
import { constants } from "node:fs";
import { pathToFileURL } from "node:url";

const CATEGORIES = [
  "hosting",
  "database",
  "email",
  "ai_api",
  "storage_backup",
  "traffic",
  "domain",
  "monitoring",
];
const invalid = () => {
  throw new Error("invalid_budget_plan");
};
function exactKeys(value, allowed) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key))
  )
    invalid();
}
function calendarDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? time
    : null;
}

// Checks operator declarations, not provider invoices, cap enforcement or authority.
export function assessBudget(plan, asOf) {
  exactKeys(plan, ["version", "currency", "categories"]);
  const today = calendarDay(asOf);
  if (
    plan.version !== 1 ||
    plan.currency !== "EUR" ||
    today === null ||
    !Array.isArray(plan.categories) ||
    plan.categories.length !== CATEGORIES.length
  )
    invalid();
  const rows = new Map();
  for (const row of plan.categories) {
    exactKeys(row, [
      "category",
      "status",
      "monthlyCeilingCents",
      "taxInclusive",
      "reviewedAt",
      "evidenceReference",
      "includedIn",
    ]);
    if (!CATEGORIES.includes(row.category) || rows.has(row.category)) invalid();
    const fields = {
      capped: [
        "category",
        "status",
        "monthlyCeilingCents",
        "taxInclusive",
        "reviewedAt",
        "evidenceReference",
      ],
      included: ["category", "status", "includedIn"],
      disabled: ["category", "status"],
      unconfigured: ["category", "status"],
    };
    if (!Object.hasOwn(fields, row.status)) invalid();
    exactKeys(row, fields[row.status]);
    if (fields[row.status].some((key) => !Object.hasOwn(row, key))) invalid();
    if (row.status === "capped") {
      if (
        !Number.isSafeInteger(row.monthlyCeilingCents) ||
        row.monthlyCeilingCents < 0 ||
        row.monthlyCeilingCents > 1_000_000 ||
        typeof row.taxInclusive !== "boolean" ||
        typeof row.reviewedAt !== "string" ||
        row.reviewedAt.length > 32 ||
        typeof row.evidenceReference !== "string" ||
        row.evidenceReference.length > 200
      )
        invalid();
    }
    if (
      row.status === "included" &&
      (!CATEGORIES.includes(row.includedIn) || row.includedIn === row.category)
    )
      invalid();
    rows.set(row.category, row);
  }
  const issues = [];
  let total = 0;
  for (const category of CATEGORIES) {
    const row = rows.get(category);
    if (row.status === "capped") {
      total += row.monthlyCeilingCents;
      const day = calendarDay(row.reviewedAt);
      if (day === null || day > today)
        issues.push({ category, reason: "invalid_review_date" });
      else if ((today - day) / 86_400_000 >= 30)
        issues.push({ category, reason: "review_due" });
      if (!row.taxInclusive)
        issues.push({ category, reason: "tax_unresolved" });
      if (!row.evidenceReference.trim())
        issues.push({ category, reason: "cap_evidence_missing" });
    } else if (row.status === "unconfigured")
      issues.push({ category, reason: "unconfigured" });
    else if (row.status === "disabled" && category !== "ai_api")
      issues.push({ category, reason: "required_service_disabled" });
    else if (row.status === "included") {
      const seen = new Set([category]);
      let target = rows.get(row.includedIn);
      while (target.status === "included") {
        if (seen.has(target.category)) invalid();
        seen.add(target.category);
        target = rows.get(target.includedIn);
      }
      if (target.status !== "capped")
        issues.push({ category, reason: "bundle_cap_unresolved" });
    }
  }
  return {
    status: issues.length
      ? "incomplete"
      : total > 8000
        ? "over_envelope"
        : "within_declared_envelope",
    monthlyCeilingCents: issues.length ? null : total,
    reserveCents: 2000,
    limitCents: 10000,
    issues,
    providerEnforcementVerified: false,
  };
}

export function budgetOptions(args) {
  if (
    args.length !== 2 ||
    args[0] !== "--plan" ||
    !args[1] ||
    args[1].startsWith("--")
  )
    throw new Error("invalid_budget_options");
  return { plan: args[1] };
}

export async function readBudgetPlan(file) {
  // Inspect before opening: ordinary special files must not block the checker.
  // Final-component links are refused; this is not a sandbox for parent paths.
  const expected = await lstat(file);
  if (!expected.isFile() || expected.isSymbolicLink() || expected.size > 32768)
    invalid();
  const flags =
    constants.O_RDONLY |
    (process.platform === "win32"
      ? 0
      : constants.O_NOFOLLOW | constants.O_NONBLOCK);
  const handle = await open(file, flags);
  try {
    const observed = await handle.stat();
    if (
      !observed.isFile() ||
      observed.dev !== expected.dev ||
      observed.ino !== expected.ino
    )
      invalid();
    // Read at most limit + 1, including files that grow after the stat call.
    const buffer = Buffer.alloc(32769);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        size,
        buffer.length - size,
        null,
      );
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > 32768) invalid();
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        buffer.subarray(0, size),
      ),
    );
  } finally {
    await handle.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const options = budgetOptions(process.argv.slice(2));
    const result = assessBudget(
      await readBudgetPlan(options.plan),
      new Date().toISOString().slice(0, 10),
    );
    console.log(JSON.stringify({ event: "budget_plan_assessment", ...result }));
    process.exitCode = result.status === "within_declared_envelope" ? 0 : 1;
  } catch {
    // No paths, raw values, evidence text or underlying filesystem/parser error.
    console.error(JSON.stringify({ event: "budget_plan_assessment_failed" }));
    process.exitCode = 2;
  }
}
