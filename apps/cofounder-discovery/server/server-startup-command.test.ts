import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "esbuild";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

let fixtureDirectory: string;
beforeAll(async () => {
  // Compile the current real entrypoint; do not depend on stale local dist.
  // An empty public directory only satisfies static-path registration; these
  // tests never serve a client or claim customer/browser acceptance.
  fixtureDirectory = await mkdtemp(join(process.cwd(), ".startup-fixture-"));
  await mkdir(join(fixtureDirectory, "public"));
  await build({
    entryPoints: ["server/_core/index.ts"],
    platform: "node",
    packages: "external",
    bundle: true,
    format: "esm",
    outfile: join(fixtureDirectory, "index.mjs"),
    logLevel: "silent",
  });
});
afterAll(async () => {
  if (fixtureDirectory)
    await rm(fixtureDirectory, { recursive: true, force: true });
});

async function run(overrides: NodeJS.ProcessEnv) {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (name.endsWith("_FILE")) delete env[name];
  }
  Object.assign(
    env,
    {
      NODE_ENV: "production",
      APP_MODE: "production",
      HOST: "127.0.0.1",
      PORT: "3000",
      PUBLIC_ORIGIN: "http://localhost:3000",
      DATABASE_URL:
        "mysql://synthetic:fixture-password@127.0.0.1:1/cofounder_test",
      JWT_SECRET: "synthetic-startup-only-session-secret-not-for-deployment",
      ENABLE_ACCOUNT_MAIL_WORKER: "false",
      ENABLE_ACCOUNT_MAIL_RETENTION: "false",
      ENABLE_OWNER_NOTIFICATIONS: "false",
      ENABLE_PLATFORM_AUTOMATION: "false",
      ENABLE_UNSAFE_LEGACY_ROUTES: "false",
      RESEND_API_KEY: "",
      AUTH_MAIL_ENCRYPTION_SECRET: "",
      AUTH_EMAIL_FROM: "",
      HAI_CONNECTOR_TOKEN: "",
      CREDENTIAL_ENCRYPTION_SECRET: "",
      OPENAI_API_KEY: "",
      DOTENV_CONFIG_PATH: "nonexistent-startup-test.env",
    },
    overrides
  );
  const child = spawn(process.execPath, [join(fixtureDirectory, "index.mjs")], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 15000,
  });
  let stdout = "",
    stderr = "";
  child.stdout.on("data", chunk => {
    stdout += String(chunk);
  });
  child.stderr.on("data", chunk => {
    stderr += String(chunk);
  });
  const result = await new Promise<{
    code: number | null;
    signal: string | null;
  }>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  return { ...result, stdout, stderr };
}

describe("real application startup failure boundary", () => {
  it("rejects invalid configuration with only a fixed fatal event", async () => {
    const result = await run({ JWT_SECRET: "synthetic-private-short" });
    expect(result.code).toBe(1);
    expect(result.signal).toBe(null);
    expect(result.stdout).toBe("");
    expect(result.stderr.trim()).toBe(
      JSON.stringify({ level: "fatal", event: "startup_failed" })
    );
  }, 20000);

  it("fails on an occupied production port without fallback, workers or raw socket errors", async () => {
    const owner = createServer();
    await new Promise<void>(resolve => owner.listen(0, "127.0.0.1", resolve));
    try {
      const address = owner.address();
      if (!address || typeof address === "string")
        throw new Error("fixture_address");
      const result = await run({
        PORT: String(address.port),
        PUBLIC_ORIGIN: `http://localhost:${address.port}`,
      });
      expect(result.code).toBe(1);
      expect(result.signal).toBe(null);
      expect(result.stdout).toBe("");
      expect(result.stderr.trim()).toBe(
        JSON.stringify({ level: "fatal", event: "startup_failed" })
      );
      expect(owner.listening).toBe(true);
    } finally {
      await new Promise<void>(resolve => owner.close(() => resolve()));
    }
  }, 20000);
});
