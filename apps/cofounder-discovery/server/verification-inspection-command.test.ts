import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";

async function run(args: string[], url = "") {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/inspect-email-verification.ts", ...args],
    {
      env: { ...process.env, DATABASE_URL: url, DATABASE_URL_FILE: undefined },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", chunk => (stdout += chunk.toString()));
  child.stderr.on("data", chunk => (stderr += chunk.toString()));
  const code = await new Promise(resolve => {
    child.once("error", () => resolve(-1));
    child.once("close", resolve);
  });
  return { code, stdout, stderr };
}
describe("read-only verification inspection command", () => {
  it.each(
    [
      [],
      ["--apply", "--account-id", "1"],
      ["--read-only", "--account-id", "0"],
      ["--read-only", "--account-id", "2147483648"],
      ["--read-only", "--account-id", "1", "--confirm"],
      ["--read-only", "--account-id", "1", "--account-id", "2"],
    ].map(args => [args])
  )("fails closed for unsafe arguments %j", async args => {
    const result = await run(args);
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toEqual({
      mode: "read-only",
      reVerificationAuthorized: false,
      error: "verification_inspection_failed",
    });
  });
  it("does not print malformed credential-bearing database configuration", async () => {
    const result = await run(
      ["--read-only", "--account-id", "1"],
      "private-fixture-credential-not-a-url"
    );
    expect(result.code).toBe(1);
    expect(result.stdout + result.stderr).not.toContain(
      "private-fixture-credential"
    );
    expect(JSON.parse(result.stdout).reVerificationAuthorized).toBe(false);
  });
});
