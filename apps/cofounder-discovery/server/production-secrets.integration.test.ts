import { fork, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let directory = "";
let databaseFile = "";
let jwtFile = "";
beforeAll(() => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || new URL(databaseUrl).pathname !== "/cofounder_test")
    throw new Error("Synthetic cofounder_test database required");
  directory = mkdtempSync(join(tmpdir(), "cofounder-production-secret-test-"));
  databaseFile = join(directory, "database.secret");
  jwtFile = join(directory, "jwt.secret");
  writeFileSync(databaseFile, databaseUrl + "\n", { mode: 0o600 });
  writeFileSync(
    jwtFile,
    "synthetic-production-session-secret-over-32-characters\n",
    { mode: 0o600 }
  );
});
afterAll(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
});

function safeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABASE_URL: "",
    DATABASE_URL_FILE: databaseFile,
    JWT_SECRET: "",
    JWT_SECRET_FILE: jwtFile,
    AUTH_MAIL_ENCRYPTION_SECRET: "",
    AUTH_MAIL_ENCRYPTION_SECRET_FILE: undefined,
    RESEND_API_KEY: "",
    RESEND_API_KEY_FILE: undefined,
    HAI_CONNECTOR_TOKEN: "",
    HAI_CONNECTOR_TOKEN_FILE: undefined,
    HAI_CONNECTOR_USER_ID: "",
    OPENAI_API_KEY: "",
    ENABLE_ACCOUNT_MAIL_WORKER: "false",
    ENABLE_ACCOUNT_MAIL_RETENTION: "false",
    ENABLE_PLATFORM_AUTOMATION: "false",
    ENABLE_UNSAFE_LEGACY_ROUTES: "false",
    API_MAX_ACTIVE_WORK: "32",
  };
}

async function migrate(extra: NodeJS.ProcessEnv = {}) {
  const child = spawn(process.execPath, [resolve("dist/migrate.js")], {
    env: { ...safeEnv(), ...extra },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", value => (output += value.toString()));
  child.stderr.on("data", value => (output += value.toString()));
  const result = await new Promise<number | null>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Synthetic migration test exceeded deadline"));
    }, 12_000);
    child.once("error", reject);
    child.once("exit", code => {
      clearTimeout(timeout);
      resolve(code);
    });
  });
  return { result, output };
}

describe("compiled production mounted-secret path", () => {
  it("runs the compiled migration runner using only the database secret file", async () => {
    const { result, output } = await migrate();
    expect(result, output).toBe(0);
    expect(output).toContain('"event":"migrations_applied"');
    expect(output).not.toContain(databaseFile);
    expect(output).not.toContain(process.env.DATABASE_URL!);
  });

  it("fails migration configuration safely when the secret file is missing", async () => {
    const missing = join(directory, "private-missing.secret");
    const { result, output } = await migrate({ DATABASE_URL_FILE: missing });
    expect(result).toBe(1);
    expect(output).toContain("migration_configuration_invalid");
    expect(output).not.toContain(missing);
    expect(output).not.toContain(process.env.DATABASE_URL!);
  });

  it("serves compiled production routes, uses file-backed DB readiness and drains on signal", async () => {
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
    const address = probe.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_port");
    const port = address.port;
    await new Promise<void>(resolve => probe.close(() => resolve()));
    const base = `http://127.0.0.1:${port}`;
    const child = fork(resolve("server/test-fixtures/shutdown-server.ts"), {
      execArgv: ["--import", "tsx"],
      env: {
        ...safeEnv(),
        NODE_ENV: "production",
        APP_MODE: "production",
        SHUTDOWN_TEST_COMPILED: "true",
        PUBLIC_ORIGIN: base,
        HOST: "127.0.0.1",
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    let output = "";
    child.stdout?.on("data", value => (output += value.toString()));
    child.stderr?.on("data", value => (output += value.toString()));
    const exited = new Promise<number | null>(resolve =>
      child.once("exit", resolve)
    );
    const request = (path: string, options: RequestInit = {}) =>
      fetch(base + path, { ...options, signal: AbortSignal.timeout(3000) });
    try {
      await vi.waitFor(
        () => {
          expect(child.exitCode, output).toBe(null);
          expect(output).toContain('"event":"server_started"');
        },
        { timeout: 15_000 }
      );
      const live = await request("/api/health");
      expect(await live.json()).toMatchObject({
        status: "ok",
        mode: "production",
        databaseConfigured: true,
      });
      const ready = await request("/api/ready");
      expect(ready.status).toBe(200);
      expect(await ready.json()).toEqual({ status: "ready" });
      const page = await request("/outreach");
      expect(page.status).toBe(200);
      expect(await page.text()).toContain('<div id="root">');
      for (const [path, status, error] of [
        ["/api/not-a-route", 404, "api_not_found"],
        ["/api/trpc/auth.%ZZ", 400, "invalid_request_path"],
      ] as const) {
        const response = await request(path);
        expect(response.status).toBe(status);
        expect(await response.json()).toMatchObject({ error });
      }
      const malformed = await request("/api/trpc/auth.login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"private-body":',
      });
      expect(malformed.status).toBe(400);
      expect(await malformed.json()).toMatchObject({
        error: "invalid_request_body",
      });
      const large = await request("/api/trpc/auth.login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ privateBody: "x".repeat(1024 * 1024) }),
      });
      expect(large.status).toBe(413);
      const origin = await request("/api/trpc/auth.logout", {
        method: "POST",
        headers: { origin: "https://untrusted.example.invalid" },
      });
      expect(origin.status).toBe(403);
      expect(await origin.json()).toMatchObject({ error: "origin_rejected" });
      expect((await request("/api/oauth/callback")).status).toBe(410);
      const oversized = await request(
        `/api/trpc/${Array(21).fill("auth.me").join(",")}?batch=1`
      );
      expect(oversized.status).toBe(400);
      const auth = await request("/api/trpc/auth.me");
      expect(await auth.json()).toEqual({ result: { data: { json: null } } });
      if (process.platform === "win32") child.send("SIGTERM");
      else child.kill("SIGTERM");
      await vi.waitFor(() => expect(child.exitCode, output).toBe(0), {
        timeout: 5000,
      });
      expect(output).toContain('"event":"shutdown_completed"');
      expect(output).not.toContain(process.env.DATABASE_URL!);
      expect(output).not.toContain(databaseFile);
    } finally {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
      await exited;
    }
  }, 25_000);
});
