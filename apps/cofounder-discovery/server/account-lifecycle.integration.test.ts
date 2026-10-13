import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { users, auditEvents } from "../drizzle/schema";
import { appRouter } from "./routers";
import { closeDb, getDb, getUserByEmail } from "./db";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";

describe("account lifecycle with MySQL", () => {
  const email = `lifecycle-${randomUUID()}@example.invalid`;
  const password = "AccountTestPassword42";
  const cookie = vi.fn();
  const request = {
    ip: email,
    protocol: "http",
    headers: {},
    get: () => undefined,
  };
  const caller = () =>
    appRouter.createCaller({
      req: request,
      res: { cookie, clearCookie: vi.fn() },
      user: null,
      requestId: "account-test",
    } as unknown as TrpcContext);

  beforeAll(() => {
    vi.stubEnv("ENABLE_REGISTRATION", "true");
    vi.stubEnv("PUBLIC_ORIGIN", "http://localhost:3014");
    vi.stubEnv("JWT_SECRET", "test-account-session-secret-with-32-characters");
    vi.stubEnv("RESEND_API_KEY", "test-resend-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    resetConfigForTests();
  });
  afterEach(() => vi.unstubAllGlobals());
  afterAll(async () => {
    const database = await getDb();
    const owner = database ? await getUserByEmail(email) : undefined;
    if (database && owner) {
      await database
        .delete(auditEvents)
        .where(eq(auditEvents.userId, owner.id));
      await database.delete(users).where(eq(users.id, owner.id));
    }
    await closeDb();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });

  it("requires proof of email ownership rather than marking registration verified", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ id: "test-mail-accepted" }), {
            status: 200,
          })
      )
    );
    await caller().auth.register({ name: "Test Founder", email, password });
    const account = await getUserByEmail(email);
    expect(account?.emailVerified).toBe(0);
  });
  it("does not create an account or cookie when session growth is explicitly stopped", async () => {
    const stoppedEmail = "session-stop-" + randomUUID() + "@example.invalid";
    const priorCookies = cookie.mock.calls.length;
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "0");
    resetConfigForTests();
    try {
      await expect(
        caller().auth.register({
          name: "Synthetic stopped registration",
          email: stoppedEmail,
          password,
        })
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
      expect((await getUserByEmail(stoppedEmail)) === null).toBe(true);
      expect(cookie.mock.calls.length).toBe(priorCookies);
    } finally {
      const partial = await getUserByEmail(stoppedEmail);
      if (partial)
        await (await getDb())!.delete(users).where(eq(users.id, partial.id));
      vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "10");
      resetConfigForTests();
    }
  });

  it("delivers a hashed, expiring, one-use token without returning it to the caller", async () => {
    let mail: { text: string } | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        mail = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ id: "test-mail-accepted" }), {
          status: 200,
        });
      })
    );
    const account = await getUserByEmail(email);
    const authenticated = appRouter.createCaller({
      req: request,
      res: { cookie },
      user: account,
      requestId: "verification-test",
    } as unknown as TrpcContext);
    const result = await authenticated.auth.sendVerificationEmail();
    expect(result).not.toHaveProperty("token");
    expect(mail?.text).toContain("/verify-email#token=");
    const token = mail!.text.match(/#token=([A-Za-z0-9_-]+)/)![1];
    expect(token).toHaveLength(43);
    const stored = await getUserByEmail(email);
    expect(stored?.verificationToken).toBe(
      createHash("sha256").update(token).digest("hex")
    );
    const results = await Promise.allSettled([
      caller().auth.verifyEmail({ token }),
      caller().auth.verifyEmail({ token }),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect((await getUserByEmail(email))?.emailVerified).toBe(1);
  });

  it("rejects expired verification tokens", async () => {
    const database = (await getDb())!;
    const token = "a".repeat(43);
    await database
      .update(users)
      .set({
        verificationToken: createHash("sha256").update(token).digest("hex"),
        verificationTokenExpiry: new Date(Date.now() - 60_000),
      })
      .where(eq(users.email, email));
    await expect(caller().auth.verifyEmail({ token })).rejects.toThrow(
      /Invalid or expired/
    );
  });
});
