import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  assessBudget,
  budgetOptions,
  readBudgetPlan,
} from "./production-budget.mjs";

const categories = [
  "hosting",
  "database",
  "email",
  "ai_api",
  "storage_backup",
  "traffic",
  "domain",
  "monitoring",
];
function plan() {
  return {
    version: 1,
    currency: "EUR",
    categories: categories.map((category) => ({
      category,
      status: "capped",
      monthlyCeilingCents: 1000,
      taxInclusive: true,
      reviewedAt: "2026-10-02",
      evidenceReference: "synthetic-local-cap-review",
    })),
  };
}

test("exact EUR 80 envelope retains EUR 20 reserve without purchase authority", () => {
  assert.deepEqual(assessBudget(plan(), "2026-10-02"), {
    status: "within_declared_envelope",
    monthlyCeilingCents: 8000,
    reserveCents: 2000,
    limitCents: 10000,
    issues: [],
    providerEnforcementVerified: false,
  });
});
test("one cent over envelope fails without spending the reserve", () => {
  const input = plan();
  input.categories[0].monthlyCeilingCents++;
  assert.equal(assessBudget(input, "2026-10-02").status, "over_envelope");
});
test("unconfigured cost is unknown rather than zero", () => {
  const input = plan();
  input.categories[0] = { category: "hosting", status: "unconfigured" };
  const result = assessBudget(input, "2026-10-02");
  assert.equal(result.status, "incomplete");
  assert.equal(result.monthlyCeilingCents, null);
  assert.deepEqual(result.issues, [
    { category: "hosting", reason: "unconfigured" },
  ]);
});
test("optional disabled AI is zero but required hosting cannot be disabled", () => {
  const input = plan();
  input.categories[3] = { category: "ai_api", status: "disabled" };
  assert.equal(assessBudget(input, "2026-10-02").monthlyCeilingCents, 7000);
  input.categories[0] = { category: "hosting", status: "disabled" };
  assert.equal(assessBudget(input, "2026-10-02").status, "incomplete");
});
test("bundled services count their reviewed provider cap once", () => {
  const input = plan();
  input.categories[1] = {
    category: "database",
    status: "included",
    includedIn: "hosting",
  };
  assert.equal(assessBudget(input, "2026-10-02").monthlyCeilingCents, 7000);
  input.categories[0] = {
    category: "hosting",
    status: "included",
    includedIn: "database",
  };
  assert.throws(() => assessBudget(input, "2026-10-02"), /invalid_budget_plan/);
});
test("inclusion cannot mask unconfigured or disabled underlying service", () => {
  const input = plan();
  input.categories[1] = {
    category: "database",
    status: "included",
    includedIn: "hosting",
  };
  input.categories[0] = { category: "hosting", status: "unconfigured" };
  assert.equal(assessBudget(input, "2026-10-02").status, "incomplete");
});
test("30-day or invalid evidence cannot pass", () => {
  for (const date of ["2026-09-02", "2026-02-30", "2026-10-03", "bad"]) {
    const input = plan();
    input.categories[0].reviewedAt = date;
    assert.equal(assessBudget(input, "2026-10-02").status, "incomplete");
  }
  const input = plan();
  input.categories[0].reviewedAt = "2026-09-03";
  assert.equal(
    assessBudget(input, "2026-10-02").status,
    "within_declared_envelope",
  );
});
test("rejects missing/duplicate categories, extra fields, non EUR and invalid money", () => {
  for (const mutate of [
    (p) => p.categories.pop(),
    (p) => p.categories.push(p.categories[0]),
    (p) => (p.currency = "USD"),
    (p) => (p.limitCents = 20000),
    (p) => (p.categories[0].secret = "private-value"),
    (p) => (p.categories[0].monthlyCeilingCents = -1),
    (p) => (p.categories[0].monthlyCeilingCents = 0.5),
    (p) => (p.categories[0].monthlyCeilingCents = Number.MAX_SAFE_INTEGER),
  ]) {
    const input = plan();
    mutate(input);
    assert.throws(
      () => assessBudget(input, "2026-10-02"),
      /invalid_budget_plan/,
    );
  }
});
test("tax uncertainty and absent cap reference remain incomplete", () => {
  const input = plan();
  input.categories[0].taxInclusive = false;
  input.categories[1].evidenceReference = "";
  const result = assessBudget(input, "2026-10-02");
  assert.equal(result.status, "incomplete");
  assert.equal(JSON.stringify(result).includes("synthetic"), false);
});
test("options require one explicit file and reject repeated or unknown flags", () => {
  assert.deepEqual(budgetOptions(["--plan", "local.json"]), {
    plan: "local.json",
  });
  for (const args of [
    [],
    ["--plan"],
    ["--plan", "a", "--plan", "b"],
    ["--limit", "200"],
    ["--plan", "a", "extra"],
  ])
    assert.throws(() => budgetOptions(args), /invalid_budget_options/);
});

test("shared multi-hop bundle neither double-counts nor allows cycles", () => {
  const input = plan();
  input.categories[1] = {
    category: "database",
    status: "included",
    includedIn: "hosting",
  };
  input.categories[4] = {
    category: "storage_backup",
    status: "included",
    includedIn: "database",
  };
  assert.equal(assessBudget(input, "2026-10-02").monthlyCeilingCents, 6000);
  input.categories[0] = {
    category: "hosting",
    status: "included",
    includedIn: "storage_backup",
  };
  assert.throws(() => assessBudget(input, "2026-10-02"), /invalid_budget_plan/);
});

test("invalid current date fails closed", () => {
  assert.throws(
    () => assessBudget(plan(), "2026-02-30"),
    /invalid_budget_plan/,
  );
});

test("malformed UTF-8 in otherwise valid JSON is refused without reflecting its content", async () => {
  const folder = await mkdtemp(join(tmpdir(), "cofounder-budget-encoding-"));
  try {
    const file = join(folder, "plan.json");
    const input = plan();
    input.categories[0].evidenceReference = "synthetic-marker";
    const bytes = Buffer.from(JSON.stringify(input));
    bytes[bytes.indexOf("synthetic-marker")] = 0xff;
    await writeFile(file, bytes);
    await assert.rejects(readBudgetPlan(file));
    const script = fileURLToPath(
      new URL("./production-budget.mjs", import.meta.url),
    );
    const result = spawnSync(process.execPath, [script, "--plan", file], {
      encoding: "utf8",
      timeout: 5000,
    });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.deepEqual(JSON.parse(result.stderr), {
      event: "budget_plan_assessment_failed",
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("linked final input is refused without following it (Windows junction or Linux file symlink)", async () => {
  const folder = await mkdtemp(join(tmpdir(), "cofounder-budget-linked-"));
  try {
    const file = join(folder, "plan.json"),
      linked = join(folder, "linked-plan");
    await writeFile(file, JSON.stringify(plan()));
    await symlink(
      process.platform === "win32" ? folder : file,
      linked,
      process.platform === "win32" ? "junction" : "file",
    );
    await assert.rejects(readBudgetPlan(linked));
    assert.deepEqual(await readBudgetPlan(file), plan());
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("CLI handles real files, exit statuses, size and secret-safe failures", async () => {
  const folder = await mkdtemp(join(tmpdir(), "cofounder-budget-test-"));
  const script = fileURLToPath(
    new URL("./production-budget.mjs", import.meta.url),
  );
  const file = join(folder, "private-fixture.json");
  const run = (args) =>
    spawnSync(process.execPath, [script, ...args], {
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 8192,
    });
  const now = new Date().toISOString().slice(0, 10);
  try {
    const input = plan();
    input.categories.forEach((row) => (row.reviewedAt = now));
    await writeFile(file, JSON.stringify(input));
    assert.deepEqual(await readBudgetPlan(file), input);
    let result = run(["--plan", file]);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).providerEnforcementVerified, false);
    assert.equal(result.stdout.includes("synthetic-local-cap-review"), false);
    input.categories[0].monthlyCeilingCents++;
    await writeFile(file, JSON.stringify(input));
    result = run(["--plan", file]);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).status, "over_envelope");
    input.categories[0] = { category: "hosting", status: "unconfigured" };
    await writeFile(file, JSON.stringify(input));
    result = run(["--plan", file]);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).status, "incomplete");
    for (const content of [
      '{"credential":"private-credential",invalid}',
      "x".repeat(32769),
    ]) {
      await writeFile(file, content);
      result = run(["--plan", file]);
      assert.equal(result.status, 2);
      assert.equal(result.stdout, "");
      assert.deepEqual(JSON.parse(result.stderr), {
        event: "budget_plan_assessment_failed",
      });
    }
    for (const args of [
      ["--plan", join(folder, "private-missing.json")],
      ["--plan", folder],
      ["--credential", "private-credential"],
    ]) {
      result = run(args);
      assert.equal(result.status, 2);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr.includes("private"), false);
      assert.deepEqual(JSON.parse(result.stderr), {
        event: "budget_plan_assessment_failed",
      });
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("preserves valid Unicode and accepts exactly32KiB but refuses one byte more", async () => {
  const folder = await mkdtemp(join(tmpdir(), "cofounder-budget-boundary-"));
  try {
    const file = join(folder, "plan.json"),
      input = plan();
    input.categories[0].evidenceReference = "café — 東京 — 🌍";
    const original = Buffer.from(JSON.stringify(input));
    const padded = Buffer.concat([
      original,
      Buffer.alloc(32768 - original.length, 32),
    ]);
    await writeFile(file, padded);
    assert.deepEqual(await readBudgetPlan(file), input);
    await writeFile(file, Buffer.concat([padded, Buffer.from(" ")]));
    await assert.rejects(readBudgetPlan(file));
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("refuses special input before open (Linux FIFO, Windows directory)", async () => {
  const folder = await mkdtemp(join(tmpdir(), "cofounder-budget-special-"));
  try {
    let input = folder;
    if (process.platform !== "win32") {
      input = join(folder, "private-fifo");
      const creation = spawnSync("mkfifo", [input], {
        encoding: "utf8",
        timeout: 5000,
      });
      assert.equal(creation.status, 0, "synthetic FIFO creation failed");
    }
    const script = fileURLToPath(
      new URL("./production-budget.mjs", import.meta.url),
    );
    const result = spawnSync(process.execPath, [script, "--plan", input], {
      encoding: "utf8",
      timeout: 5000,
    });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.deepEqual(JSON.parse(result.stderr), {
      event: "budget_plan_assessment_failed",
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
