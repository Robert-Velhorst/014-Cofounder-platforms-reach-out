import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { admitHaiFeedAttempt } from "./hai-feed-admission";
import { admitLoginAttempt } from "./login-admission";
import { admitRegistrationAttempt } from "./registration-admission";
import { admitPasswordResetAttempt } from "./password-reset-admission";
import { admitVerificationRedemptionAttempt } from "./verification-redemption-admission";
import * as data from "./db";
import { loginAttemptQuotas } from "../drizzle/schema";
import { resetConfigForTests } from "./config";

describe("durable HAI feed admission with isolated MySQL", () => {
  it("enforces shared admission through the compiled HTTP server after restart despite forged proxy headers", async () => {
    for (let i = 0; i < 59; i++)
      await admitHaiFeedAttempt(314159, `192.0.2.${i + 1}`);
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
    const address = probe.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_port");
    const port = address.port;
    await new Promise<void>(resolve => probe.close(() => resolve()));
    const origin = `http://127.0.0.1:${port}`;
    const token = "synthetic-hai-compiled-token-at-least-32-characters";
    const start = () => {
      const inheritedEnv = { ...process.env };
      // Absent file configuration, not an invalid empty file/direct-secret pair.
      delete inheritedEnv.HAI_CONNECTOR_TOKEN_FILE;
      const child = spawn(process.execPath, ["dist/index.js"], {
        env: {
          ...inheritedEnv,
          NODE_ENV: "production",
          APP_MODE: "production",
          HOST: "127.0.0.1",
          PORT: String(port),
          PUBLIC_ORIGIN: origin,
          TRUST_PROXY: "false",
          ENABLE_ACCOUNT_MAIL_WORKER: "false",
          ENABLE_ACCOUNT_MAIL_RETENTION: "false",
          ENABLE_PLATFORM_AUTOMATION: "false",
          ENABLE_UNSAFE_LEGACY_ROUTES: "false",
          OPENAI_API_KEY: "",
          RESEND_API_KEY: "",
          HAI_CONNECTOR_TOKEN: token,
          HAI_CONNECTOR_USER_ID: "314159",
          HAI_CONNECTOR_INCLUDE_CONTENT: "false",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let started = false;
      child.stdout.on("data", chunk => {
        if (String(chunk).includes('"event":"server_started"')) started = true;
      });
      child.stderr.resume();
      const closed = new Promise<void>((resolve, reject) => {
        child.once("close", () => resolve());
        child.once("error", reject);
      });
      void closed.catch(() => {});
      return {
        ready: () =>
          vi.waitFor(
            () => {
              expect(child.exitCode).toBe(null);
              expect(started).toBe(true);
            },
            { timeout: 10000 }
          ),
        stop: async () => {
          if (child.exitCode === null && child.signalCode === null)
            child.kill("SIGTERM");
          await closed;
          expect(child.exitCode).toBe(0);
        },
      };
    };
    let server = start();
    const request = (ip: string) =>
      fetch(`${origin}/api/integrations/hai/feed`, {
        headers: { authorization: `Bearer ${token}`, "x-forwarded-for": ip },
        signal: AbortSignal.timeout(5000),
      });
    try {
      await server.ready();
      const admitted = await request("198.51.100.1");
      expect(admitted.status).toBe(403);
      expect(await admitted.json()).toEqual({
        error: "hai_account_unavailable",
      });
      expect((await globalRow()).used).toBe(60);
      const before = await rows();
      await server.stop();
      server = start();
      await server.ready();
      const denied = await request("198.51.100.2");
      expect(denied.status).toBe(429);
      expect(denied.headers.get("retry-after")).toBe("60");
      expect(denied.headers.get("cache-control")).toBe("private, no-store");
      expect(await denied.json()).toEqual({ error: "rate_limited" });
      expect(await rows()).toEqual(before);
    } finally {
      await server.stop();
    }
  }, 30000);
  const rows = async () =>
    (await data.getDb())!
      .select()
      .from(loginAttemptQuotas)
      .orderBy(loginAttemptQuotas.key);
  const globalRow = async () =>
    (await rows()).find(row => row.key === "hai-feed-global-v1")!;
  beforeEach(async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_hai_admission_database_required");
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-hai-admission-secret-at-least-32-characters"
    );
    resetConfigForTests();
    await (await data.getDb())!.delete(loginAttemptQuotas);
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    await (await data.getDb())!.delete(loginAttemptQuotas);
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("limits one owner across sources and stores only purpose-keyed digests", async () => {
    for (let i = 0; i < 60; i++)
      await admitHaiFeedAttempt(314159, `192.0.2.${i + 1}`);
    const before = await rows();
    await expect(
      admitHaiFeedAttempt(314159, "198.51.100.1")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toEqual(before);
    const encoded = JSON.stringify(before);
    expect(encoded).not.toContain("314159");
    expect(encoded).not.toContain("192.0.2.");
    expect(
      before
        .filter(
          row =>
            row.key !== "login-global-v1" && row.key !== "hai-feed-global-v1"
        )
        .every(row => /^[a-f0-9]{64}$/.test(row.key))
    ).toBe(true);
  });
  it("limits a source across owners and equivalent IP forms", async () => {
    for (let i = 0; i < 60; i++)
      await admitHaiFeedAttempt(1000 + i, "192.0.2.99");
    const before = await rows();
    await expect(
      admitHaiFeedAttempt(2000, "::ffff:192.0.2.99")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toEqual(before);
  });
  it("admits exactly one concurrent final service slot and rolls back refused counters", async () => {
    await admitHaiFeedAttempt(1, "192.0.2.1");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 119 })
      .where(eq(loginAttemptQuotas.key, "hai-feed-global-v1"));
    const results = await Promise.allSettled([
      admitHaiFeedAttempt(2, "192.0.2.2"),
      admitHaiFeedAttempt(3, "192.0.2.3"),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect((await globalRow()).used).toBe(120);
    expect(await rows()).toHaveLength(6);
  });
  it("admits exactly one concurrent final owner slot", async () => {
    for (let i = 0; i < 59; i++) await admitHaiFeedAttempt(1, "192.0.2.1");
    const results = await Promise.allSettled([
      admitHaiFeedAttempt(1, "192.0.2.2"),
      admitHaiFeedAttempt(1, "192.0.2.3"),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect((await globalRow()).used).toBe(60);
  });
  it("uses database time, resets expired windows and never extends live expiry", async () => {
    for (let i = 0; i < 60; i++) await admitHaiFeedAttempt(1, "192.0.2.1");
    const before = await rows();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2035-01-01T00:00:00Z"));
    await expect(admitHaiFeedAttempt(1, "192.0.2.1")).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await rows()).toEqual(before);
    vi.useRealTimers();
    await (await data.getDb())!.execute(
      sql`UPDATE login_attempt_quotas SET expires_at = CURRENT_TIMESTAMP - INTERVAL 1 SECOND`
    );
    await admitHaiFeedAttempt(1, "192.0.2.1");
    expect((await globalRow()).used).toBe(1);
    const expiry = (await globalRow()).expiresAt;
    await admitHaiFeedAttempt(1, "192.0.2.2");
    expect((await globalRow()).expiresAt).toEqual(expiry);
  });
  it("preserves stable HAI budget during other families' cleanup, without consuming their allowances", async () => {
    await admitHaiFeedAttempt(1, "192.0.2.1");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ expiresAt: new Date("2020-01-01T00:00:00Z") })
      .where(eq(loginAttemptQuotas.key, "hai-feed-global-v1"));
    await admitLoginAttempt("synthetic@example.invalid", "192.0.2.1");
    await admitRegistrationAttempt("synthetic@example.invalid", "192.0.2.1");
    await admitPasswordResetAttempt("synthetic-case-token", "192.0.2.1");
    await admitVerificationRedemptionAttempt(
      "synthetic-case-token",
      "192.0.2.1"
    );
    const values = await rows();
    expect(values.filter(row => row.key.endsWith("-global-v1"))).toHaveLength(
      5
    );
    expect(
      values
        .filter(row => row.key.endsWith("-global-v1"))
        .every(row => row.used === 1)
    ).toBe(true);
    expect((await globalRow()).expiresAt).toEqual(
      new Date("2020-01-01T00:00:00Z")
    );
  });
  it("retains global ceiling through secret rotation", async () => {
    await admitHaiFeedAttempt(1, "192.0.2.1");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 120 })
      .where(eq(loginAttemptQuotas.key, "hai-feed-global-v1"));
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-rotated-hai-secret-at-least-32-characters"
    );
    resetConfigForTests();
    await expect(admitHaiFeedAttempt(2, "192.0.2.2")).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect((await globalRow()).used).toBe(120);
  });
  it.each(["storage", "secret", "counter"])(
    "fails closed for %s without echoing private data",
    async failure => {
      if (failure === "storage")
        vi.spyOn(data, "getDb").mockResolvedValueOnce(null);
      if (failure === "secret") {
        vi.stubEnv("JWT_SECRET", "");
        resetConfigForTests();
      }
      if (failure === "counter") {
        await admitHaiFeedAttempt(1, "192.0.2.1");
        await (await data.getDb())!
          .update(loginAttemptQuotas)
          .set({ used: -1 })
          .where(eq(loginAttemptQuotas.key, "hai-feed-global-v1"));
      }
      const before = failure === "storage" ? [] : await rows();
      await expect(admitHaiFeedAttempt(2, "192.0.2.2")).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        message: "Connector admission is temporarily unavailable.",
      });
      expect(await rows()).toEqual(before);
    }
  );
  it("uses committed owner allowance in a fresh process after reconnect", async () => {
    for (let i = 0; i < 60; i++)
      await admitHaiFeedAttempt(314159, `192.0.2.${i + 1}`);
    await data.closeDb();
    const result = await promisify(execFile)(
      process.execPath,
      [
        createRequire(import.meta.url).resolve("tsx/cli"),
        fileURLToPath(
          new URL("./test-fixtures/hai-feed-attempt.ts", import.meta.url)
        ),
      ],
      { env: process.env, timeout: 10000 }
    );
    expect(JSON.parse(result.stdout)).toEqual({ code: "TOO_MANY_REQUESTS" });
    expect((await globalRow()).used).toBe(60);
  });
});
