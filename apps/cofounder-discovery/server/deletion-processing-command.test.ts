import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";

async function command(args: string[]) {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/process-account-deletion.ts", ...args],
    {
      env: { ...process.env, DATABASE_URL: "" },
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
  "42",
  "--expected-email",
  "admin@example.invalid",
  "--request-key",
  "2199da0b-a175-4325-8f14-c13575672c01",
  "--expected-revision",
  "1",
];
describe("reviewed deletion-processing command", () => {
  it("provides help without storage or processing", async () => {
    const result = await command(["--help"]);
    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout).toContain("--confirm-suspend-account");
    expect(result.stdout).toContain("does not erase");
  });
  it.each(
    [
      [],
      ["--suspend", ...target],
      ["--check", ...target, "--erase"],
      ["--check", ...target, "--account-id", "43"],
      ["--check", ...target.map(v => (v === "42" ? "1e2" : v))],
      ["--check", ...target.map(v => (v === "1" ? "0" : v))],
      [
        "--suspend",
        ...target,
        "--operator-ref",
        "op",
        "--approval-ref",
        "review with private details",
        "--confirm-suspend-account",
      ],
    ].map(args => [args])
  )("refuses malformed or unapproved arguments %#", async args => {
    const result = await command(args);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
      '"error":"deletion_processing_arguments_invalid"'
    );
    expect(result.stdout).not.toContain("admin@example.invalid");
    expect(result.stderr).toBe("");
  });
  it("fails closed without configured storage", async () => {
    const result = await command(["--check", ...target]);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
      '"error":"deletion_processing_storage_unavailable"'
    );
    expect(result.stdout).not.toContain("admin@example.invalid");
  });
});
