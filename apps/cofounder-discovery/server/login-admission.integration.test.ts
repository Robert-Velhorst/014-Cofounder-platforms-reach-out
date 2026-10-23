import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { sql, eq } from "drizzle-orm";
import { appRouter } from "./routers";
import * as db from "./db";
import { users, accountSessions, loginAttemptQuotas } from "../drizzle/schema";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { hashPassword } from "./auth-password";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";

let email: string, ownerId: number;
const password = "Synthetic-login-Password!42";
function caller(ip: string) {
  let cookie = false;
  const api = appRouter.createCaller({
    user: null,
    requestId: randomUUID(),
    req: { ip, protocol: "http", headers: {}, get: () => "localhost" },
    res: {
      cookie: () => {
        cookie = true;
      },
    },
  } as unknown as TrpcContext);
  return {
    login: (address = email, value = password) =>
      api.auth.login({ email: address, password: value }),
    hasCookie: () => cookie,
  };
}
describe("durable public login admission", () => {
  beforeEach(async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_login_test_database_required");
    await (await db.getDb())!.delete(loginAttemptQuotas);
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-login-admission-secret-at-least-32-chars"
    );
    resetConfigForTests();
    email = `${randomUUID()}@example.invalid`;
    const owner = await db.createLocalUser({
      openId: `login-${randomUUID()}`,
      email,
      name: "Synthetic login",
      loginMethod: "local",
      passwordHash: await hashPassword(password),
      emailVerified: 1,
    });
    ownerId = owner!.id;
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await (await db.getDb())!.delete(users).where(eq(users.id, ownerId));
    await (await db.getDb())!.delete(loginAttemptQuotas);
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("limits one email even when attempts rotate across source addresses", async () => {
    for (let i = 0; i < 10; i++)
      await expect(
        caller(`198.51.100.${i + 1}`).login(email, "wrong")
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const attempt = caller("203.0.113.90");
    await expect(attempt.login()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(attempt.hasCookie()).toBe(false);
    expect(
      await (await db.getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, ownerId))
    ).toHaveLength(0);
  });
  it("admits concurrent distinct identities from cold quota storage without losing or doubling attempts", async () => {
    const database = (await db.getDb())!;
    for (let round = 0; round < 10; round++) {
      await database.delete(loginAttemptQuotas);
      const results = await Promise.allSettled(
        Array.from({ length: 5 }, (_, n) =>
          caller(`198.51.100.${n + 1}`).login(
            `cold-${round}-${n}@example.invalid`,
            "wrong"
          )
        )
      );
      expect(
        results.every(
          result =>
            result.status === "rejected" &&
            result.reason.code === "UNAUTHORIZED"
        )
      ).toBe(true);
      const rows = await database.select().from(loginAttemptQuotas);
      expect(rows).toHaveLength(11);
      expect(rows.find(row => row.key === "login-global-v1")?.used).toBe(5);
      expect(
        rows
          .filter(row => row.key !== "login-global-v1")
          .every(row => row.used === 1)
      ).toBe(true);
    }
  });
  it("normalizes the login address and counts successful attempts rather than resetting the window", async () => {
    for (let i = 0; i < 10; i++) await caller(`192.0.2.${i + 1}`).login();
    await expect(
      caller("203.0.113.91").login(` ${email.toUpperCase()} `)
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
  it("admits only one concurrent final account attempt", async () => {
    for (let i = 0; i < 9; i++)
      await expect(
        caller(`198.51.100.${i + 60}`).login(email, "wrong")
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const attempts = await Promise.allSettled([
      caller("203.0.113.92").login(),
      caller("203.0.113.93").login(),
    ]);
    expect(
      attempts.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(
      attempts
        .filter(result => result.status === "rejected")
        .map(result => (result as PromiseRejectedResult).reason.code)
    ).toEqual(["TOO_MANY_REQUESTS"]);
  });
  it("does not accumulate new IP rows or extend windows when an address is already blocked", async () => {
    for (let i = 0; i < 10; i++)
      await expect(
        caller("192.0.2.100").login(email, "wrong")
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const before = await (await db.getDb())!.select().from(loginAttemptQuotas);
    for (let i = 0; i < 5; i++)
      await expect(
        caller(`203.0.113.${120 + i}`).login()
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await (await db.getDb())!.select().from(loginAttemptQuotas)).toEqual(
      before
    );
  });
  it("bounds attempts against unknown addresses by source IP and stores no raw identities", async () => {
    for (let i = 0; i < 20; i++)
      await expect(
        caller("192.0.2.101").login(`unknown-${i}@example.invalid`)
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller("192.0.2.101").login()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    const rows = await (await db.getDb())!.select().from(loginAttemptQuotas);
    expect(JSON.stringify(rows)).not.toMatch(
      /unknown-|example.invalid|192\.0\.2|Synthetic-login/
    );
    expect(
      rows.every(
        row => row.key === "login-global-v1" || /^[a-f0-9]{64}$/.test(row.key)
      )
    ).toBe(true);
  });
  it("reopens an expired database-clock window without changing the password or existing sessions", async () => {
    // This case tests login-attempt expiry, independently of retained-session admission.
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "100");
    resetConfigForTests();
    for (let i = 0; i < 10; i++) await caller("192.0.2.102").login();
    await expect(caller("192.0.2.102").login()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await (await db.getDb())!.execute(
      sql`UPDATE login_attempt_quotas SET expires_at = CURRENT_TIMESTAMP - INTERVAL 1 SECOND`
    );
    await expect(caller("192.0.2.102").login()).resolves.toMatchObject({
      id: ownerId,
    });
    const rows = await (await db.getDb())!.select().from(loginAttemptQuotas);
    expect(rows).toHaveLength(3);
    expect(rows.every(row => row.used === 1)).toBe(true);
  });
  it("refuses new identities at the service limit without growing storage", async () => {
    await caller("192.0.2.103").login();
    await (await db.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 1000 })
      .where(eq(loginAttemptQuotas.key, "login-global-v1"));
    const before = await (await db.getDb())!.select().from(loginAttemptQuotas);
    await expect(
      caller("192.0.2.104").login("new@example.invalid")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await (await db.getDb())!.select().from(loginAttemptQuotas)).toEqual(
      before
    );
  });
  it("fails closed without a cookie when admission storage is unavailable", async () => {
    vi.spyOn(db, "getDb").mockResolvedValueOnce(null);
    const attempt = caller("192.0.2.105");
    await expect(attempt.login()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Sign-in is temporarily unavailable. Please try again.",
    });
    expect(attempt.hasCookie()).toBe(false);
  });
  it("uses the committed allowance in a fresh Node process", async () => {
    for (let i = 0; i < 10; i++)
      await expect(
        caller(`192.0.2.${140 + i}`).login(email, "wrong")
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const result = await promisify(execFile)(
      process.execPath,
      [
        createRequire(import.meta.url).resolve("tsx/cli"),
        fileURLToPath(
          new URL("./test-fixtures/login-attempt.ts", import.meta.url)
        ),
      ],
      { env: { ...process.env, LOGIN_TEST_EMAIL: email }, timeout: 10000 }
    );
    expect(JSON.parse(result.stdout)).toEqual({ code: "TOO_MANY_REQUESTS" });
  });
  it.each([
    ["192.0.2.201", "::ffff:192.0.2.201"],
    ["2001:db8::1", "2001:0db8:0000:0000:0000:0000:0000:0001"],
  ])(
    "shares the source allowance between equivalent IP forms %s and %s",
    async (first, second) => {
      for (let i = 0; i < 20; i++)
        await expect(
          caller(first).login(`ip-form-${i}@example.invalid`)
        ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(caller(second).login()).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
    }
  );
  it("admits only one simultaneous last service slot across different addresses", async () => {
    await caller("192.0.2.160").login();
    await (await db.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 999 })
      .where(eq(loginAttemptQuotas.key, "login-global-v1"));
    const results = await Promise.allSettled([
      caller("192.0.2.161").login("absent-one@example.invalid"),
      caller("192.0.2.162").login("absent-two@example.invalid"),
    ]);
    expect(
      results
        .map(result => (result as PromiseRejectedResult).reason.code)
        .sort()
    ).toEqual(["TOO_MANY_REQUESTS", "UNAUTHORIZED"]);
  });
  it("prunes only a bounded batch of expired counters during a committed admission", async () => {
    await (await db.getDb())!.insert(loginAttemptQuotas).values(
      Array.from({ length: 105 }, (_, i) => ({
        key: `synthetic-expired-${i}`,
        used: 1,
        expiresAt: new Date("2020-01-01T00:00:00Z"),
      }))
    );
    await caller("192.0.2.163").login();
    const rows = await (await db.getDb())!.select().from(loginAttemptQuotas);
    expect(
      rows.filter(row => row.key.startsWith("synthetic-expired-"))
    ).toHaveLength(5);
    expect(rows).toHaveLength(8);
  });
  // Reverting to process-local counters would admit the post-restart login;
  // trusting forwarded headers here would admit the final unknown-address login.
  it("enforces persisted admission through the compiled HTTP server after restart", async () => {
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
      // Attach a handler immediately even if startup fails before readiness.
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
            child.kill("SIGKILL");
          await closed;
        },
      };
    };
    let server = start();
    const login = (loginEmail: string, loginPassword: string, ip: number) =>
      fetch(`${origin}/api/trpc/auth.login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          "x-forwarded-for": `198.51.100.${ip}`,
        },
        body: JSON.stringify({
          json: { email: loginEmail, password: loginPassword },
        }),
        signal: AbortSignal.timeout(5000),
      });
    try {
      await server.ready();
      const valid = await login(email, password, 1);
      expect(valid.status).toBe(200);
      expect(valid.headers.get("set-cookie")).not.toBe(null);
      await valid.text();
      for (let i = 0; i < 9; i++) {
        const denied = await login(email, "wrong", i + 2);
        expect(denied.status).toBe(401);
        await denied.text();
      }
      await server.stop();
      server = start();
      await server.ready();
      const blocked = await login(email, password, 20);
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("set-cookie")).toBe(null);
      expect(await blocked.json()).toMatchObject({
        error: { json: { data: { code: "TOO_MANY_REQUESTS" } } },
      });
      for (let i = 0; i < 10; i++) {
        const absent = await login(
          `http-absent-${i}@example.invalid`,
          password,
          i + 30
        );
        expect(absent.status).toBe(401);
        await absent.text();
      }
      const ipBlocked = await login("http-new@example.invalid", password, 90);
      expect(ipBlocked.status).toBe(429);
      expect(ipBlocked.headers.get("set-cookie")).toBe(null);
      await ipBlocked.text();
    } finally {
      await server.stop();
    }
  }, 30000);
});
