import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { accountMailJobs, loginAttemptQuotas, users } from "../drizzle/schema";
import { closeDb, createLocalUser, getDb, getUserByOpenId } from "./db";
import { hashPassword, verifyPassword } from "./auth-password";
import { appRouter } from "./routers";
import { sdk } from "./_core/sdk";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";

describe("password recovery with MySQL", () => {
  const newPassword = "ReplacementPassword42";
  let openId: string;
  let credentialHash: string;
  let token: string;
  let userId: number;
  const request = (cookie: string) =>
    ({ headers: { cookie: `${COOKIE_NAME}=${cookie}` } }) as Request;
  const caller = () =>
    appRouter.createCaller({
      user: null,
      req: { ip: openId, headers: {} },
      res: {},
      requestId: "reset-test",
    } as unknown as TrpcContext);
  beforeAll(() => {
    vi.stubEnv(
      "AUTH_MAIL_ENCRYPTION_SECRET",
      "synthetic-mail-encryption-secret-for-reset-tests"
    );
    vi.stubEnv("JWT_SECRET", "test-session-secret-with-at-least-32-characters");
    resetConfigForTests();
  });
  beforeEach(async () => {
    // Independent lifecycle cases use synthetic non-IP request labels, which
    // intentionally share the unknown-source bucket. Isolate their admission
    // fixture; the durable-budget suite tests cumulative/concurrent limits.
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_password_recovery_database_required");
    await (await getDb())!.delete(loginAttemptQuotas);
    openId = `local:${randomUUID()}`;
    credentialHash = await hashPassword("PreviousPassword42");
    token = randomBytes(32).toString("base64url");
    const user = await createLocalUser({
      openId,
      email: `${randomUUID()}@example.invalid`,
      passwordHash: credentialHash,
      emailVerified: 0,
      loginMethod: "local",
      passwordResetToken: createHash("sha256").update(token).digest("hex"),
      passwordResetTokenExpiry: new Date(Date.now() + 60_000),
    });
    userId = user!.id;
  });
  afterEach(async () => {
    const db = await getDb();
    if (db) await db.delete(users).where(eq(users.openId, openId));
  });
  afterAll(async () => {
    await (await getDb())!.delete(loginAttemptQuotas);
    await closeDb();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });

  it("accepts only one concurrent redemption and invalidates all existing sessions", async () => {
    await (await getDb())!
      .update(users)
      .set({ verificationEmailDigest: "a".repeat(64) })
      .where(eq(users.id, userId));
    const first = await sdk.createSessionToken(openId, { credentialHash });
    const second = await sdk.createSessionToken(openId, { credentialHash });
    const outcomes = await Promise.allSettled([
      caller().auth.resetPassword({ token, password: newPassword }),
      caller().auth.resetPassword({ token, password: newPassword }),
    ]);
    expect(
      outcomes.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    const updated = (await getUserByOpenId(openId))!;
    expect(updated.passwordResetToken).toBeNull();
    expect(updated.verificationEmailDigest).toBeNull();
    expect(updated.passwordResetTokenExpiry).toBeNull();
    expect(updated.emailVerified).toBe(1);
    expect(await verifyPassword(newPassword, updated.passwordHash!)).toBe(true);
    expect(
      await verifyPassword("PreviousPassword42", updated.passwordHash!)
    ).toBe(false);
    await expect(sdk.authenticateRequest(request(first))).rejects.toThrow(
      /session/
    );
    await expect(sdk.authenticateRequest(request(second))).rejects.toThrow(
      /session/
    );
  });

  it("leaves passwords and sessions unchanged when a link has expired", async () => {
    const existing = await sdk.createSessionToken(openId, { credentialHash });
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ passwordResetTokenExpiry: new Date(Date.now() - 60_000) })
      .where(eq(users.id, userId));
    await expect(
      caller().auth.resetPassword({ token, password: newPassword })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await getUserByOpenId(openId))?.passwordHash).toBe(credentialHash);
    await expect(
      sdk.authenticateRequest(request(existing))
    ).resolves.toMatchObject({ id: userId });
  });

  it("does not accept an ordinary email-verification token for password recovery", async () => {
    const verificationToken = randomBytes(32).toString("base64url");
    const db = (await getDb())!;
    await db
      .update(users)
      .set({
        verificationToken: createHash("sha256")
          .update(verificationToken)
          .digest("hex"),
        verificationTokenExpiry: new Date(Date.now() + 60_000),
      })
      .where(eq(users.id, userId));
    await expect(
      caller().auth.resetPassword({
        token: verificationToken,
        password: newPassword,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await getUserByOpenId(openId))?.passwordHash).toBe(credentialHash);
  });

  it("prevents a racing login with the old password from surviving recovery", async () => {
    const [reset, login] = await Promise.allSettled([
      caller().auth.resetPassword({ token, password: newPassword }),
      sdk.createSessionToken(openId, { credentialHash }),
    ]);
    expect(reset.status).toBe("fulfilled");
    if (login.status === "fulfilled")
      await expect(
        sdk.authenticateRequest(request(login.value))
      ).rejects.toThrow(/session/);
    else expect(login.reason).toMatchObject({ code: "UNAUTHORIZED" });
    const updated = (await getUserByOpenId(openId))!;
    const newSession = await sdk.createSessionToken(openId, {
      credentialHash: updated.passwordHash!,
    });
    await expect(
      sdk.authenticateRequest(request(newSession))
    ).resolves.toMatchObject({ id: userId });
  });

  it("does not revoke another customer's sessions", async () => {
    const otherOpenId = `local:${randomUUID()}`;
    const other = await createLocalUser({
      openId: otherOpenId,
      email: `${randomUUID()}@example.invalid`,
      passwordHash: credentialHash,
      loginMethod: "local",
    });
    try {
      const otherSession = await sdk.createSessionToken(otherOpenId, {
        credentialHash,
      });
      await caller().auth.resetPassword({ token, password: newPassword });
      await expect(
        sdk.authenticateRequest(request(otherSession))
      ).resolves.toMatchObject({ id: other!.id });
      expect((await getUserByOpenId(otherOpenId))?.passwordHash).toBe(
        credentialHash
      );
    } finally {
      const db = (await getDb())!;
      await db.delete(users).where(eq(users.openId, otherOpenId));
    }
  });

  it("commits a private password-change notification with the successful reset", async () => {
    await caller().auth.resetPassword({ token, password: newPassword });
    const db = (await getDb())!;
    const notices = await db
      .select()
      .from(accountMailJobs)
      .where(eq(accountMailJobs.userId, userId));
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({
      kind: "password_changed",
      state: "queued",
    });
    expect(notices[0].payload).not.toContain(newPassword);
    expect(notices[0].payload).not.toContain(
      (await getUserByOpenId(openId))!.email!
    );
  });

  it("rolls back password and token changes if session invalidation fails", async () => {
    const existing = await sdk.createSessionToken(openId, { credentialHash });
    const session = (await sdk.verifySession(existing))!;
    const db = (await getDb())!;
    // This uniquely named fixture table references only our synthetic session.
    // Its RESTRICT constraint makes the real session DELETE fail inside MySQL.
    const fixture = sql.identifier(
      `reset_rollback_${randomUUID().replaceAll("-", "")}`
    );
    await db.execute(
      sql`CREATE TABLE ${fixture} (token_digest varchar(64) PRIMARY KEY, FOREIGN KEY (token_digest) REFERENCES account_sessions(token_digest) ON DELETE RESTRICT)`
    );
    try {
      await db.execute(
        sql`INSERT INTO ${fixture} (token_digest) VALUES (${createHash("sha256").update(session.tokenId).digest("hex")})`
      );
      await expect(
        caller().auth.resetPassword({ token, password: newPassword })
      ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
      const unchanged = (await getUserByOpenId(openId))!;
      expect(unchanged.passwordHash).toBe(credentialHash);
      expect(unchanged.passwordResetToken).toBe(
        createHash("sha256").update(token).digest("hex")
      );
      expect(
        await db
          .select()
          .from(accountMailJobs)
          .where(eq(accountMailJobs.userId, userId))
      ).toHaveLength(0);
      await expect(
        sdk.authenticateRequest(request(existing))
      ).resolves.toMatchObject({ id: userId });
    } finally {
      await db.execute(sql`DROP TABLE ${fixture}`);
    }
  });
});
