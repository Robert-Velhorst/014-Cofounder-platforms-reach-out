import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";

async function run(args: string[], url = "") {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/require-account-reverification.ts", ...args],
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
describe("reviewed re-verification operator command", () => {
  it.each(
    [
      [],
      ["--bulk"],
      [
        "--check",
        "--account-id",
        "0",
        "--expected-email",
        "private@example.invalid",
      ],
      [
        "--check",
        "--account-id",
        "2147483648",
        "--expected-email",
        "private@example.invalid",
      ],
      [
        "--check",
        "--account-id",
        "1",
        "--expected-email",
        "private@example.invalid",
        "--confirm-require-verification",
      ],
      [
        "--check",
        "--account-id",
        "1",
        "--expected-email",
        "private@example.invalid",
        "--account-id",
        "2",
      ],
      [
        "--apply",
        "--account-id",
        "1",
        "--expected-email",
        "private@example.invalid",
      ],
    ].map(args => [args])
  )("rejects unsafe arguments %j without private output", async args => {
    const result = await run(args);
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      applied: false,
      mailSent: false,
      outcomeMayBeUncertain: false,
    });
    expect(result.stdout + result.stderr).not.toContain(
      "private@example.invalid"
    );
  });
  it("does not disclose a credential-bearing invalid storage setting", async () => {
    const result = await run(
      [
        "--check",
        "--account-id",
        "1",
        "--expected-email",
        "private@example.invalid",
      ],
      "private-fixture-credential-not-a-url"
    );
    expect(result.code).toBe(1);
    expect(result.stdout + result.stderr).not.toMatch(
      /private-fixture-credential|private@example.invalid/
    );
    expect(JSON.parse(result.stdout).applied).toBe(false);
  });
});
