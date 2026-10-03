import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { admitRegistrationAttempt } from "./registration-admission";
import { admitLoginAttempt } from "./login-admission";
import * as data from "./db";
import { loginAttemptQuotas, users } from "../drizzle/schema";
import { resetConfigForTests } from "./config";
import { appRouter } from "./routers";
import * as passwords from "./auth-password";
import type { TrpcContext } from "./_core/context";

describe("durable public registration admission", () => {
  let email: string;
  const rows = async () =>
    (await data.getDb())!
      .select()
      .from(loginAttemptQuotas)
      .orderBy(loginAttemptQuotas.key);
  const globalRow = async () =>
    (await rows()).find(row => row.key === "registration-global-v1")!;
  const caller = (ip: string, cookie = vi.fn()) =>
    appRouter.createCaller({
      user: null,
      requestId: randomUUID(),
      req: { ip, headers: {}, protocol: "http", get: () => undefined },
      res: { cookie },
    } as unknown as TrpcContext);
  beforeEach(async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_registration_test_database_required");
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-registration-secret-at-least-32-characters"
    );
    vi.stubEnv("ENABLE_REGISTRATION", "true");
    resetConfigForTests();
    await (await data.getDb())!.delete(loginAttemptQuotas);
    email = `${randomUUID()}@example.invalid`;
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    await db.delete(users).where(eq(users.email, email));
    await db.delete(loginAttemptQuotas);
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("limits one normalized address across rotating sources without growing rejected rows", async () => {
    for (let i = 0; i < 3; i++)
      await admitRegistrationAttempt(email, `192.0.2.${i + 1}`);
    const before = await rows();
    await expect(
      admitRegistrationAttempt(` ${email.toUpperCase()} `, "198.51.100.90")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toEqual(before);
    const encoded = JSON.stringify(before);
    expect(encoded).not.toContain(email);
    expect(encoded).not.toContain("192.0.2.");
  });
  it.each([
    ["192.0.2.99", "::ffff:192.0.2.99"],
    ["2001:db8::1", "2001:0db8:0000:0000:0000:0000:0000:0001"],
    [undefined, "invalid-source"],
  ])(
    "shares five source attempts between equivalent source forms %s and %s",
    async (first, second) => {
      for (let i = 0; i < 5; i++)
        await admitRegistrationAttempt(`source-${i}@example.invalid`, first);
      await expect(
        admitRegistrationAttempt(email, second)
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
      expect((await globalRow()).used).toBe(5);
    }
  );
  it("serializes cold storage concurrency without losing or doubling allowances", async () => {
    for (let round = 0; round < 5; round++) {
      await (await data.getDb())!.delete(loginAttemptQuotas);
      const results = await Promise.allSettled(
        Array.from({ length: 6 }, (_, i) =>
          admitRegistrationAttempt(
            `cold-${round}-${i}@example.invalid`,
            "192.0.2.20"
          )
        )
      );
      expect(
        results.filter(result => result.status === "fulfilled")
      ).toHaveLength(5);
      expect(
        results.find(result => result.status === "rejected")
      ).toMatchObject({ reason: { code: "TOO_MANY_REQUESTS" } });
      expect((await globalRow()).used).toBe(5);
      expect(await rows()).toHaveLength(8);
    }
  });
  it("admits only one concurrent final global slot and preserves rollback", async () => {
    await admitRegistrationAttempt(email, "192.0.2.30");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 99 })
      .where(eq(loginAttemptQuotas.key, "registration-global-v1"));
    const results = await Promise.allSettled([
      admitRegistrationAttempt("last-a@example.invalid", "192.0.2.31"),
      admitRegistrationAttempt("last-b@example.invalid", "192.0.2.32"),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect((await globalRow()).used).toBe(100);
    const before = await rows();
    await expect(
      admitRegistrationAttempt("new@example.invalid", "192.0.2.33")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toEqual(before);
  });
  it("reopens an expired hour using database time without extending active windows", async () => {
    for (let i = 0; i < 3; i++)
      await admitRegistrationAttempt(email, "192.0.2.40");
    const originalExpiry = (await globalRow()).expiresAt;
    await (await data.getDb())!.execute(
      sql`UPDATE login_attempt_quotas SET expires_at = CURRENT_TIMESTAMP - INTERVAL 1 SECOND`
    );
    await admitRegistrationAttempt(email, "192.0.2.40");
    expect((await globalRow()).used).toBe(1);
    expect((await globalRow()).expiresAt >= originalExpiry).toBe(true);
    const expiry = (await globalRow()).expiresAt;
    await admitRegistrationAttempt(email, "192.0.2.41");
    expect((await globalRow()).expiresAt).toEqual(expiry);
  });
  it("keeps registration and login budgets independent, including expired global rows", async () => {
    for (let i = 0; i < 3; i++)
      await admitRegistrationAttempt(email, "192.0.2.50");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ expiresAt: new Date("2020-01-01T00:00:00Z") })
      .where(eq(loginAttemptQuotas.key, "registration-global-v1"));
    await admitLoginAttempt(email, "192.0.2.50");
    expect((await globalRow()).used).toBe(3);
    expect(
      (await rows()).find(row => row.key === "login-global-v1")?.used
    ).toBe(1);
    // Expiring only the service window must not reset this address's live limit.
    await expect(
      admitRegistrationAttempt(email, "192.0.2.50")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await globalRow()).used).toBe(3);
    await admitRegistrationAttempt(
      "independent-new@example.invalid",
      "192.0.2.50"
    );
    expect((await globalRow()).used).toBe(1);
    expect(
      (await rows()).find(row => row.key === "login-global-v1")?.used
    ).toBe(1);
  });
  it("retains the global ceiling through JWT secret rotation", async () => {
    await admitRegistrationAttempt(email, "192.0.2.60");
    await (await data.getDb())!
      .update(loginAttemptQuotas)
      .set({ used: 100 })
      .where(eq(loginAttemptQuotas.key, "registration-global-v1"));
    vi.stubEnv("JWT_SECRET", "synthetic-rotated-secret-at-least-32-characters");
    resetConfigForTests();
    await expect(
      admitRegistrationAttempt(email, "192.0.2.60")
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await globalRow()).used).toBe(100);
  });
  it("prunes at most 100 expired identity rows and never either service row", async () => {
    await admitRegistrationAttempt(email, "192.0.2.70");
    await (await data.getDb())!.insert(loginAttemptQuotas).values(
      Array.from({ length: 105 }, (_, i) => ({
        key: `registration-expired-${i}`,
        used: 1,
        expiresAt: new Date("2020-01-01T00:00:00Z"),
      }))
    );
    await admitRegistrationAttempt(email, "192.0.2.70");
    expect(
      (await rows()).filter(row => row.key.startsWith("registration-expired-"))
    ).toHaveLength(5);
    expect(
      (await rows()).filter(row => row.key.endsWith("global-v1"))
    ).toHaveLength(2);
  });
  it("fails closed before password hashing, account creation and cookie issuance", async () => {
    vi.spyOn(data, "getDb").mockResolvedValueOnce(null);
    const hash = vi.spyOn(passwords, "hashPassword");
    const create = vi.spyOn(data, "createLocalUser");
    const cookie = vi.fn();
    await expect(
      caller("192.0.2.80", cookie).auth.register({
        name: "Synthetic founder",
        email,
        password: "SyntheticPassword42!",
      })
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Registration is temporarily unavailable. Please try again.",
    });
    expect(hash).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
    expect(await data.getUserByEmail(email)).toBeNull();
  });
  it("counts successful and duplicate registrations without resetting allowance", async () => {
    const input = {
      name: "Synthetic founder",
      email,
      password: "SyntheticPassword42!",
    };
    const cookie = vi.fn();
    await caller("192.0.2.81", cookie).auth.register(input);
    expect(cookie).toHaveBeenCalledOnce();
    expect((await globalRow()).used).toBe(1);
    for (let i = 0; i < 2; i++)
      await expect(
        caller(`192.0.2.${82 + i}`).auth.register(input)
      ).rejects.toMatchObject({ code: "CONFLICT" });
    const hash = vi.spyOn(passwords, "hashPassword");
    await expect(
      caller("192.0.2.84").auth.register(input)
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(hash).not.toHaveBeenCalled();
    expect((await globalRow()).used).toBe(3);
  });
  it("uses committed address allowance in a fresh process after reconnect", async () => {
    for (let i = 0; i < 3; i++)
      await admitRegistrationAttempt(email, `192.0.2.${90 + i}`);
    await data.closeDb();
    const result = await promisify(execFile)(
      process.execPath,
      [
        createRequire(import.meta.url).resolve("tsx/cli"),
        fileURLToPath(
          new URL("./test-fixtures/registration-attempt.ts", import.meta.url)
        ),
      ],
      {
        env: { ...process.env, REGISTRATION_TEST_EMAIL: email },
        timeout: 10000,
      }
    );
    expect(JSON.parse(result.stdout)).toEqual({ code: "TOO_MANY_REQUESTS" });
    expect((await globalRow()).used).toBe(3);
  });

  it("enforces admission through the current compiled HTTP server after restart, ignoring forged proxy headers", async () => {
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
    const register = (address: string, password: string, forgedIp: number) =>
      fetch(`${origin}/api/trpc/auth.register`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          "x-forwarded-for": `198.51.100.${forgedIp}`,
        },
        body: JSON.stringify({
          json: { name: "Synthetic founder", email: address, password },
        }),
        signal: AbortSignal.timeout(5000),
      });
    try {
      await server.ready();
      const valid = await register(email, "SyntheticPassword42!", 1);
      expect(valid.status).toBe(200);
      expect(valid.headers.get("set-cookie")).not.toBe(null);
      await valid.text();
      for (let i = 0; i < 4; i++) {
        const weak = await register(`weak-${i}@example.invalid`, "weak", i + 2);
        expect(weak.status).toBe(400);
        expect(weak.headers.get("set-cookie")).toBe(null);
        await weak.text();
      }
      expect((await globalRow()).used).toBe(5);
      const before = await rows();
      await server.stop();
      server = start();
      await server.ready();
      const blocked = await register(
        "post-restart@example.invalid",
        "SyntheticPassword42!",
        99
      );
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("set-cookie")).toBe(null);
      expect(await blocked.json()).toMatchObject({
        error: { json: { data: { code: "TOO_MANY_REQUESTS" } } },
      });
      expect(await rows()).toEqual(before);
      expect(
        await data.getUserByEmail("post-restart@example.invalid")
      ).toBeNull();
      expect((await data.getUserByEmail(email))?.emailVerified).toBe(0);
    } finally {
      await server.stop();
    }
  }, 30000);
});
