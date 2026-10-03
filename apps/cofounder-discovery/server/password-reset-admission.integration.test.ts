import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { admitPasswordResetAttempt } from "./password-reset-admission";
import { admitLoginAttempt } from "./login-admission";
import { admitRegistrationAttempt } from "./registration-admission";
import * as data from "./db";
import * as passwords from "./auth-password";
import * as recovery from "./password-recovery";
import { loginAttemptQuotas } from "../drizzle/schema";
import { resetConfigForTests } from "./config";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("durable reset-link redemption admission", () => {
  let token: string;
  const freshToken = () => randomBytes(32).toString("base64url");
  const rows = async () =>
    (await data.getDb())!
      .select()
      .from(loginAttemptQuotas)
      .orderBy(loginAttemptQuotas.key);
  const globalRow = async () =>
    (await rows()).find(row => row.key === "password-reset-global-v1")!;
  const api = (ip: string, cookie = vi.fn()) =>
    appRouter.createCaller({
      user: null,
      requestId: "synthetic-reset-admission",
      req: { ip, headers: {} },
      res: { cookie },
    } as unknown as TrpcContext);
  beforeEach(async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_reset_admission_database_required");
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-reset-admission-secret-at-least-32-characters"
    );
    resetConfigForTests();
    await (await data.getDb())!.delete(loginAttemptQuotas);
    token = freshToken();
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await (await data.getDb())!.delete(loginAttemptQuotas);
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("limits one link across rotating sources and stores no raw token or address", async () => {
    for (let i = 0; i < 10; i++)
      await admitPasswordResetAttempt(token, `192.0.2.${i + 1}`);
    const before = await rows();
    await expect(
      admitPasswordResetAttempt(token, "198.51.100.90")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toEqual(before);
    const encoded = JSON.stringify(before);
    expect(encoded).not.toContain(token);
    expect(encoded).not.toContain("192.0.2.");
  });
  it("does not merge case-distinct bearer tokens into the same allowance", async () => {
    const first = "aB".repeat(21) + "C",
      second = "Ab".repeat(21) + "c";
    for (let i = 0; i < 10; i++)
      await admitPasswordResetAttempt(first, `192.0.2.${i + 1}`);
    await admitPasswordResetAttempt(second, "198.51.100.91");
    expect((await globalRow()).used).toBe(11);
  });
  it.each([
    ["192.0.2.99", "::ffff:192.0.2.99"],
    ["2001:db8::1", "2001:0db8:0000:0000:0000:0000:0000:0001"],
    [undefined, "invalid-source"],
  ])(
    "shares ten attempts between equivalent source forms %s and %s",
    async (first, second) => {
      for (let i = 0; i < 10; i++)
        await admitPasswordResetAttempt(freshToken(), first);
      await expect(
        admitPasswordResetAttempt(token, second)
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
      expect((await globalRow()).used).toBe(10);
    }
  );
  it("admits ten of eleven cold concurrent requests without lost increments", async () => {
    for (let round = 0; round < 5; round++) {
      await (await data.getDb())!.delete(loginAttemptQuotas);
      const results = await Promise.allSettled(
        Array.from({ length: 11 }, () =>
          admitPasswordResetAttempt(freshToken(), "192.0.2.20")
        )
      );
      expect(
        results.filter(result => result.status === "fulfilled")
      ).toHaveLength(10);
      expect(
        results.find(result => result.status === "rejected")
      ).toMatchObject({ reason: { code: "TOO_MANY_REQUESTS" } });
      expect((await globalRow()).used).toBe(10);
      expect(await rows()).toHaveLength(13);
    }
  });
  it("admits only one concurrent final service slot and rolls back denied reservations", async () => {
    await admitPasswordResetAttempt(token, "192.0.2.30");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 199 })
      .where(eq(loginAttemptQuotas.key, "password-reset-global-v1"));
    const results = await Promise.allSettled([
      admitPasswordResetAttempt(freshToken(), "192.0.2.31"),
      admitPasswordResetAttempt(freshToken(), "192.0.2.32"),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect((await globalRow()).used).toBe(200);
    const before = await rows();
    await expect(
      admitPasswordResetAttempt(freshToken(), "192.0.2.33")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toEqual(before);
  });
  it("reopens an expired database-clock window without extending a live one", async () => {
    for (let i = 0; i < 10; i++)
      await admitPasswordResetAttempt(token, "192.0.2.40");
    await (await data.getDb())!.execute(
      sql`UPDATE login_attempt_quotas SET expires_at = CURRENT_TIMESTAMP - INTERVAL 1 SECOND`
    );
    await admitPasswordResetAttempt(token, "192.0.2.40");
    expect((await globalRow()).used).toBe(1);
    const expiry = (await globalRow()).expiresAt;
    await admitPasswordResetAttempt(token, "192.0.2.41");
    expect((await globalRow()).expiresAt).toEqual(expiry);
  });
  it("keeps login and registration independent and preserves all stable service rows", async () => {
    for (let i = 0; i < 10; i++)
      await admitPasswordResetAttempt(token, "192.0.2.50");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ expiresAt: new Date("2020-01-01T00:00:00Z") })
      .where(eq(loginAttemptQuotas.key, "password-reset-global-v1"));
    await admitLoginAttempt("independent@example.invalid", "192.0.2.50");
    await admitRegistrationAttempt("independent@example.invalid", "192.0.2.50");
    expect((await globalRow()).used).toBe(10);
    await expect(
      admitPasswordResetAttempt(token, "192.0.2.51")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await admitPasswordResetAttempt(freshToken(), "192.0.2.51");
    const values = await rows();
    expect(values.find(row => row.key === "login-global-v1")?.used).toBe(1);
    expect(values.find(row => row.key === "registration-global-v1")?.used).toBe(
      1
    );
    expect((await globalRow()).used).toBe(1);
  });
  it("retains the global ceiling through secret rotation", async () => {
    await admitPasswordResetAttempt(token, "192.0.2.60");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 200 })
      .where(eq(loginAttemptQuotas.key, "password-reset-global-v1"));
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-rotated-reset-secret-at-least-32-characters"
    );
    resetConfigForTests();
    await expect(
      admitPasswordResetAttempt(token, "192.0.2.60")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await globalRow()).used).toBe(200);
  });
  it("prunes at most 100 expired identity counters", async () => {
    await admitPasswordResetAttempt(token, "192.0.2.70");
    await (await data.getDb())!.insert(loginAttemptQuotas).values(
      Array.from({ length: 105 }, (_, i) => ({
        key: `reset-expired-${i}`,
        used: 1,
        expiresAt: new Date("2020-01-01T00:00:00Z"),
      }))
    );
    await admitPasswordResetAttempt(token, "192.0.2.70");
    expect(
      (await rows()).filter(row => row.key.startsWith("reset-expired-"))
    ).toHaveLength(5);
  });
  it("fails storage admission before hashing or resetting", async () => {
    vi.spyOn(data, "getDb").mockResolvedValueOnce(null);
    const hash = vi.spyOn(passwords, "hashPassword"),
      reset = vi.spyOn(recovery, "completePasswordReset"),
      cookie = vi.fn();
    await expect(
      api("192.0.2.80", cookie).auth.resetPassword({
        token,
        password: "SyntheticReplacement42!",
      })
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Account recovery is temporarily unavailable. Please try again.",
    });
    expect(hash).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    expect(await rows()).toHaveLength(0);
  });
  it("rejects malformed stored counters without resetting or echoing them", async () => {
    await admitPasswordResetAttempt(token, "192.0.2.81");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: -1 })
      .where(eq(loginAttemptQuotas.key, "password-reset-global-v1"));
    const before = await rows();
    await expect(
      admitPasswordResetAttempt(token, "192.0.2.82")
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Account recovery is temporarily unavailable. Please try again.",
    });
    expect(await rows()).toEqual(before);
  });
  it("uses committed link allowance in a fresh process after reconnect", async () => {
    for (let i = 0; i < 10; i++)
      await admitPasswordResetAttempt(token, `192.0.2.${90 + i}`);
    await data.closeDb();
    const result = await promisify(execFile)(
      process.execPath,
      [
        createRequire(import.meta.url).resolve("tsx/cli"),
        fileURLToPath(
          new URL("./test-fixtures/password-reset-attempt.ts", import.meta.url)
        ),
      ],
      {
        env: { ...process.env, RESET_ADMISSION_TEST_TOKEN: token },
        timeout: 10000,
      }
    );
    expect(JSON.parse(result.stdout)).toEqual({ code: "TOO_MANY_REQUESTS" });
    expect(result.stdout).not.toContain(token);
    expect(result.stderr).not.toContain(token);
    expect((await globalRow()).used).toBe(10);
  });
  it("enforces reset admission through the compiled HTTP server after restart despite forged proxy headers", async () => {
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
    const address = probe.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_port");
    const port = address.port;
    await new Promise<void>(resolve => probe.close(() => resolve()));
    const origin = `http://127.0.0.1:${port}`;
    const start = () => {
      const child = spawn(process.execPath, ["dist/index.js"], {
        env: {
          ...process.env,
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
    const reset = (resetToken: string, password: string, forgedIp: number) =>
      fetch(`${origin}/api/trpc/auth.resetPassword`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          "x-forwarded-for": `198.51.100.${forgedIp}`,
        },
        body: JSON.stringify({ json: { token: resetToken, password } }),
        signal: AbortSignal.timeout(5000),
      });
    try {
      await server.ready();
      for (let i = 0; i < 9; i++) {
        const weak = await reset(token, "weak", i + 1);
        expect(weak.status).toBe(400);
        expect(weak.headers.get("set-cookie")).toBe(null);
        await weak.text();
      }
      const invalid = await reset(token, "SyntheticReplacement42!", 10);
      expect(invalid.status).toBe(400);
      expect(invalid.headers.get("set-cookie")).toBe(null);
      expect(await invalid.json()).toMatchObject({
        error: { json: { data: { code: "BAD_REQUEST" } } },
      });
      expect((await globalRow()).used).toBe(10);
      const before = await rows();
      await server.stop();
      server = start();
      await server.ready();
      const blockedToken = freshToken();
      const blocked = await reset(blockedToken, "SyntheticReplacement42!", 99);
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("set-cookie")).toBe(null);
      const response = await blocked.text();
      expect(JSON.parse(response)).toMatchObject({
        error: { json: { data: { code: "TOO_MANY_REQUESTS" } } },
      });
      expect(response).not.toContain(token);
      expect(response).not.toContain(blockedToken);
      expect(await rows()).toEqual(before);
    } finally {
      await server.stop();
    }
  }, 30000);
});
