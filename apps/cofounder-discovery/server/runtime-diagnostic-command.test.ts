import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

async function run(args: string[], overrides: NodeJS.ProcessEnv = {}) {
  const env = { ...process.env };
  for (const name of [
    "DATABASE_URL",
    "JWT_SECRET",
    "CREDENTIAL_ENCRYPTION_SECRET",
    "AUTH_MAIL_ENCRYPTION_SECRET",
    "RESEND_API_KEY",
    "HAI_CONNECTOR_TOKEN",
  ]) {
    delete env[name];
    delete env[`${name}_FILE`];
  }
  Object.assign(
    env,
    {
      NODE_ENV: "test",
      APP_MODE: "test",
      DATABASE_URL: "",
      JWT_SECRET: "synthetic-doctor-secret-with-at-least-32-characters",
      PUBLIC_ORIGIN: "https://private-fixture.invalid",
      ENABLE_PLATFORM_AUTOMATION: "false",
      ENABLE_UNSAFE_LEGACY_ROUTES: "false",
      DOTENV_CONFIG_PATH: "nonexistent-doctor-test.env",
    },
    overrides
  );
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/doctor.ts", ...args],
    { env, stdio: ["ignore", "pipe", "pipe"], timeout: 10000 }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", chunk => {
    stdout += chunk;
  });
  child.stderr.on("data", chunk => {
    stderr += chunk;
  });
  const code = await new Promise(resolve => {
    child.once("error", () => resolve(-1));
    child.once("close", resolve);
  });
  return { code, stdout, stderr };
}
describe("real doctor command privacy", () => {
  it("withholds a malformed database URL without contacting any provider", async () => {
    const result = await run([], {
      DATABASE_URL: "private-fixture-not-a-database-url",
    });
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).runtimeChecksPassed).toBe(false);
    expect(result.stdout + result.stderr).not.toContain(
      "private-fixture-not-a-database-url"
    );
  });
  it.each([
    ["private-argument"],
    ["--allow-missing-runtime", "--allow-missing-runtime"],
  ])(
    "rejects unsupported arguments before secret loading: %j",
    async (...args) => {
      const result = await run(args as string[], {
        JWT_SECRET_FILE: "private-secret-file",
      });
      expect(result.code).toBe(1);
      expect(JSON.parse(result.stdout).error).toBe(
        "invalid_diagnostic_arguments"
      );
      expect(result.stdout + result.stderr).not.toMatch(
        /private-argument|private-secret-file/
      );
    }
  );
  it.each([false, true])(
    "reports missing storage without pretending runtime passed: %s",
    async allow => {
      const result = await run(allow ? ["--allow-missing-runtime"] : []);
      expect(result.code).toBe(allow ? 0 : 1);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: allow,
        runtimeChecksPassed: false,
        productionAcceptanceProven: false,
      });
      expect(result.stdout + result.stderr).not.toMatch(
        /private-fixture|synthetic-doctor-secret/
      );
    }
  );
  it("catches invalid mounted configuration without an import-time stack", async () => {
    const result = await run([], { JWT_SECRET_FILE: "private-secret-file" });
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).checks[0].name).toBe("configuration");
    expect(result.stderr).toBe("");
    expect(result.stdout).not.toMatch(
      /private-secret-file|synthetic-doctor-secret/
    );
  });
});
