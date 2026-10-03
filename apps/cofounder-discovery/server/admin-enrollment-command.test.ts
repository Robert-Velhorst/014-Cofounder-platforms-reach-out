import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";

async function command(args: string[]) {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/admin-enrollment.ts", ...args],
    {
      env: {
        ...process.env,
        DATABASE_URL: "",
        PUBLIC_ORIGIN: "https://cofounder.example.invalid",
      },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", data => (stdout += data.toString()));
  child.stderr.on("data", data => (stderr += data.toString()));
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  return { code, stdout, stderr };
}
const target = [
  "--account-id",
  "12",
  "--expected-email",
  "admin@example.invalid",
  "--expected-origin",
  "https://cofounder.example.invalid",
];
describe("operator enrollment command argument boundary", () => {
  it("offers help without database access or issuing approval", async () => {
    const result = await command(["--help"]);
    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout).toContain("--check");
    expect(result.stdout).toContain("--confirm-initial-enrollment");
    expect(result.stdout).toContain("--output");
  });
  it.each(
    [
      [],
      ["--issue", ...target],
      ["--check", ...target, "--account-id", "13"],
      ["--check", ...target, "--output", "/tmp/secret.admin-grant"],
      ["--check", ...target, "--confirm-initial-enrollment"],
      ["--check", ...target, "--reset"],
      ["--help", "--issue"],
      ["--recover", ...target],
      ["--recovery-check", ...target, "--confirm-all-passkeys-lost"],
      [
        "--recover",
        ...target,
        "--operator-ref",
        "operator-42",
        "--approval-ref",
        "review-42",
        "--output",
        "/private/new.admin-grant",
        "--review-digest",
        "0".repeat(64),
        "--confirm-initial-enrollment",
      ],
      [
        "--recover",
        ...target,
        "--operator-ref",
        "operator-42",
        "--approval-ref",
        "review-42",
        "--output",
        "/private/new.admin-grant",
        "--review-digest",
        "not-a-digest",
        "--confirm-all-passkeys-lost",
      ],
      ["--check", ...target.map(v => (v === "12" ? "1e2" : v))],
      ["--check", ...target.map(v => (v === "12" ? "2147483648" : v))],
      [
        "--check",
        ...target.map(v =>
          v === "https://cofounder.example.invalid"
            ? "https://cofounder.example.invalid/path"
            : v
        ),
      ],
      [
        "--check",
        ...target.map(v =>
          v === "https://cofounder.example.invalid"
            ? "http://cofounder.example.invalid"
            : v
        ),
      ],
    ].map(args => [args])
  )(
    "rejects malformed, ambiguous or insufficient authority arguments %#",
    async args => {
      const result = await command(args);
      expect(result.code).toBe(1);
      expect(result.stdout).toContain('"error":"enrollment_arguments_invalid"');
      expect(result.stdout).toContain('"grantWritten":false');
      expect(result.stderr).toBe("");
    }
  );
  it("fails closed without storage and does not print account identity", async () => {
    const result = await command(["--check", ...target]);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('"error":"enrollment_storage_unavailable"');
    expect(result.stdout).toContain('"grantWritten":false');
    expect(result.stdout + result.stderr).not.toContain(
      "admin@example.invalid"
    );
  });
});
