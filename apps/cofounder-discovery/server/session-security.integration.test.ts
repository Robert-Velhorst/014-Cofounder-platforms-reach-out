import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { accountSessions, users } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { closeDb, createLocalUser, getDb } from "./db";
import { hashPassword } from "./auth-password";
import { resetConfigForTests } from "./config";
import { SignJWT } from "jose";

describe("persistent sessions with MySQL", () => {
  const openId = `local:${randomUUID()}`;
  let userId: number;
  let credentialHash: string;
  const request = (token: string) =>
    ({ headers: { cookie: `${COOKIE_NAME}=${token}` } }) as Request;
  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", "test-session-secret-with-at-least-32-characters");
    resetConfigForTests();
    credentialHash = await hashPassword("AccountSessionTest42");
    const user = await createLocalUser({
      openId,
      email: `session-${randomUUID()}@example.invalid`,
      passwordHash: credentialHash,
      loginMethod: "local",
    });
    userId = user!.id;
  });
  afterAll(async () => {
    const db = await getDb();
    if (db) await db.delete(users).where(eq(users.openId, openId));
    await closeDb();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  beforeEach(async () => {
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "10");
    resetConfigForTests();
    await (await getDb())!
      .delete(accountSessions)
      .where(eq(accountSessions.userId, userId));
  });
  it("binds the signed account to its own live session and rejects server-side expiry", async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_session_test_database_required");
    const token = await sdk.createSessionToken(openId, { credentialHash });
    const payload = (await sdk.verifySession(token))!;
    const foreign = (await createLocalUser({
      openId: `joined-foreign:${randomUUID()}`,
      email: `joined-foreign-${randomUUID()}@example.invalid`,
      passwordHash: credentialHash,
      loginMethod: "local",
    }))!;
    try {
      const forged = await new SignJWT({ openId: foreign.openId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("cofounder-discovery")
        .setAudience("cofounder-discovery-web")
        .setJti(payload.tokenId)
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
      await expect(sdk.authenticateRequest(request(forged))).rejects.toThrow(
        /session/i
      );
      await expect(
        sdk.authenticateRequest(request(token))
      ).resolves.toMatchObject({ id: userId, openId });
      await closeDb();
      await expect(
        sdk.authenticateRequest(request(token))
      ).resolves.toMatchObject({ id: userId, openId });
      const database = (await getDb())!;
      await database
        .update(accountSessions)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(accountSessions.userId, userId));
      expect(await sdk.verifySession(token)).not.toBeNull();
      await expect(sdk.authenticateRequest(request(token))).rejects.toThrow(
        /session/i
      );
    } finally {
      await (await getDb())!.delete(users).where(eq(users.id, foreign.id));
    }
  });
  it("refuses concurrent sign-ins beyond the retained-session cap without revoking admitted sessions", async () => {
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "2");
    resetConfigForTests();
    const results = await Promise.allSettled(
      Array.from({ length: 3 }, () =>
        sdk.createSessionToken(openId, { credentialHash })
      )
    );
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(2);
    const denied = results.find(
      r => r.status === "rejected"
    ) as PromiseRejectedResult;
    expect(denied.reason).toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(
      await (await getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, userId))
    ).toHaveLength(2);
    for (const result of results)
      if (result.status === "fulfilled")
        await expect(
          sdk.authenticateRequest(request(result.value))
        ).resolves.toMatchObject({ id: userId });
    await closeDb();
    await expect(
      sdk.createSessionToken(openId, { credentialHash })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
  it("stops session growth at zero without invalidating an existing browser", async () => {
    const token = await sdk.createSessionToken(openId, { credentialHash });
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "0");
    resetConfigForTests();
    await expect(
      sdk.createSessionToken(openId, { credentialHash })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(
      sdk.authenticateRequest(request(token))
    ).resolves.toMatchObject({ id: userId });
    expect(
      await (await getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, userId))
    ).toHaveLength(1);
  });
  it("reuses capacity after own expiry without removing another owner's session", async () => {
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "1");
    resetConfigForTests();
    const database = (await getDb())!;
    const other = await createLocalUser({
      openId: "session-cap:" + randomUUID(),
      email: randomUUID() + "@example.invalid",
      passwordHash: credentialHash,
      loginMethod: "local",
    });
    try {
      const otherToken = await sdk.createSessionToken(other!.openId, {
        credentialHash,
      });
      await sdk.createSessionToken(openId, {
        credentialHash,
        expiresInMs: -60_000,
      });
      const replacement = await sdk.createSessionToken(openId, {
        credentialHash,
      });
      expect(
        await database
          .select()
          .from(accountSessions)
          .where(eq(accountSessions.userId, userId))
      ).toHaveLength(1);
      await expect(
        sdk.authenticateRequest(request(replacement))
      ).resolves.toMatchObject({ id: userId });
      await expect(
        sdk.authenticateRequest(request(otherToken))
      ).resolves.toMatchObject({ id: other!.id });
    } finally {
      await database.delete(users).where(eq(users.id, other!.id));
    }
  });
  it("rolls back expired-row cleanup if session admission is stopped", async () => {
    await sdk.createSessionToken(openId, {
      credentialHash,
      expiresInMs: -60_000,
    });
    const database = (await getDb())!;
    const before = await database
      .select()
      .from(accountSessions)
      .where(eq(accountSessions.userId, userId));
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "0");
    resetConfigForTests();
    await expect(
      sdk.createSessionToken(openId, { credentialHash })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(
      await database
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, userId))
    ).toEqual(before);
  });

  it("preserves sessions across database reconnection, but rejects revoked cookies", async () => {
    const token = await sdk.createSessionToken(openId, { credentialHash });
    await closeDb();
    await expect(
      sdk.authenticateRequest(request(token))
    ).resolves.toMatchObject({ id: userId });
    await sdk.revokeRequestSession(request(token));
    await closeDb();
    await expect(sdk.authenticateRequest(request(token))).rejects.toThrow(
      /session/
    );
  });

  it("enforces server-side expiry even when JWT lifetime remains", async () => {
    const token = await sdk.createSessionToken(openId, { credentialHash });
    const db = (await getDb())!;
    await db
      .update(accountSessions)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(accountSessions.userId, userId));
    await expect(sdk.authenticateRequest(request(token))).rejects.toThrow(
      /session/
    );
  });

  it("refuses to issue a session from stale password credentials", async () => {
    await expect(
      sdk.createSessionToken(openId, {
        credentialHash: "previous-password-hash",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("reads account changes, deletion fences and revocation live after warming lookup plans", async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_session_test_database_required");
    const database = (await getDb())!;
    const token = await sdk.createSessionToken(openId, { credentialHash });
    const req = request(token);
    const original = await sdk.authenticateRequest(req);
    await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({
      id: userId,
    });
    try {
      await database
        .update(users)
        .set({ name: "Changed synthetic owner" })
        .where(eq(users.id, userId));
      await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({
        id: userId,
        name: "Changed synthetic owner",
      });
      await database
        .update(users)
        .set({ deletionFencedAt: new Date() })
        .where(eq(users.id, userId));
      await expect(sdk.authenticateRequest(req)).rejects.toThrow(/session/i);
      await database
        .update(users)
        .set({ deletionFencedAt: null })
        .where(eq(users.id, userId));
      await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({
        id: userId,
      });
      await sdk.revokeRequestSession(req);
      await expect(sdk.authenticateRequest(req)).rejects.toThrow(/session/i);
    } finally {
      await database
        .update(users)
        .set({ name: original.name, deletionFencedAt: null })
        .where(eq(users.id, userId));
    }
  });
  it("cleans existing expired rows without removing a still-active session", async () => {
    const active = await sdk.createSessionToken(openId, { credentialHash });
    await sdk.createSessionToken(openId, {
      credentialHash,
      expiresInMs: -60_000,
    });
    const replacement = await sdk.createSessionToken(openId, {
      credentialHash,
    });
    const rows = await (await getDb())!
      .select({ expiresAt: accountSessions.expiresAt })
      .from(accountSessions)
      .where(eq(accountSessions.userId, userId));
    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.expiresAt.getTime() > Date.now())).toBe(true);
    await expect(
      sdk.authenticateRequest(request(active))
    ).resolves.toMatchObject({ id: userId });
    await expect(
      sdk.authenticateRequest(request(replacement))
    ).resolves.toMatchObject({ id: userId });
  });
  it("creates cold sessions for distinct owners concurrently without a range-lock deadlock", async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_session_test_database_required");
    const database = (await getDb())!;
    const owners: Array<{ id: number; openId: string }> = [];
    try {
      for (let n = 0; n < 5; n++) {
        const owner = await createLocalUser({
          openId: `session-race:${randomUUID()}`,
          email: `session-race-${randomUUID()}@example.invalid`,
          passwordHash: credentialHash,
          loginMethod: "local",
        });
        owners.push({ id: owner!.id, openId: owner!.openId });
      }
      for (let round = 0; round < 10; round++) {
        await database.delete(accountSessions).where(
          inArray(
            accountSessions.userId,
            owners.map(owner => owner.id)
          )
        );
        const results = await Promise.allSettled(
          owners.map(owner =>
            sdk.createSessionToken(owner.openId, { credentialHash })
          )
        );
        expect(results.map(result => result.status)).toEqual(
          Array(5).fill("fulfilled")
        );
        expect(
          await database
            .select({ userId: accountSessions.userId })
            .from(accountSessions)
            .where(
              inArray(
                accountSessions.userId,
                owners.map(owner => owner.id)
              )
            )
        ).toHaveLength(5);
      }
    } finally {
      if (owners.length)
        await database.delete(users).where(
          inArray(
            users.id,
            owners.map(owner => owner.id)
          )
        );
    }
  });
});
