import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { eq, sql } from "drizzle-orm";
import * as db from "./db";
import {
  users,
  accountSessions,
  auditEvents,
  adminMfaState,
  adminPasskeys,
} from "../drizzle/schema";
import { hashPassword } from "./auth-password";
import { createAccountSession, revokeAccountSession } from "./account-sessions";
import { passkeyFixture } from "./test-fixtures/passkey";
import { resetConfigForTests } from "./config";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import { adminProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { exportAccountData } from "./account-export";
import * as notification from "./_core/notification";
import * as webauthn from "./admin-webauthn";
import {
  issueInitialAdminEnrollmentGrant,
  beginAdminEnrollment,
  finishAdminEnrollment,
  beginAdminStepUp,
  finishAdminStepUp,
  requireAdminStepUp,
  getAdminMfaStatus,
  removeAdminPasskey,
  inspectAdminRecovery,
  recoverAdminPasskeys,
} from "./admin-mfa";

describe("durable administrator passkey ceremonies", () => {
  let ownerId: number;
  let actor: {
    userId: number;
    tokenId: string;
    credentialHash: string;
    requestId: string;
  };
  let second: typeof actor;
  let fixture: ReturnType<typeof passkeyFixture>;
  const password = "Synthetic-Admin-Password!42";
  const digest = (token: string) =>
    createHash("sha256").update(token).digest("hex");
  beforeEach(async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_mfa_test_database_required");
    fixture = passkeyFixture();
    vi.stubEnv("PUBLIC_ORIGIN", fixture.origin);
    resetConfigForTests();
    const credentialHash = await hashPassword(password);
    const user = await db.createLocalUser({
      openId: `mfa-${randomUUID()}`,
      email: `${randomUUID()}@example.invalid`,
      name: "Synthetic admin",
      passwordHash: credentialHash,
      loginMethod: "local",
      emailVerified: 1,
    });
    ownerId = user!.id;
    await (await db.getDb())!
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, ownerId));
    actor = {
      userId: ownerId,
      tokenId: randomUUID(),
      credentialHash,
      requestId: randomUUID(),
    };
    second = { ...actor, tokenId: randomUUID() };
    for (const a of [actor, second])
      await createAccountSession(
        user!.openId,
        credentialHash,
        a.tokenId,
        new Date(Date.now() + 3600000)
      );
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await (await db.getDb())!
      .delete(auditEvents)
      .where(eq(auditEvents.userId, ownerId));
    await (await db.getDb())!.delete(users).where(eq(users.id, ownerId));
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  async function enroll(key = fixture) {
    const grant = await issueInitialAdminEnrollmentGrant({
      userId: ownerId,
      credentialHash: actor.credentialHash,
      requestId: actor.requestId,
    });
    const start = await beginAdminEnrollment(actor, {
      password,
      grant: grant.token,
    });
    const response = key.registration({ challenge: start.options.challenge });
    return {
      ...(await finishAdminEnrollment(actor, {
        challengeId: start.challengeId,
        response,
        label: "Test passkey",
      })),
      handle: start.options.user.id,
    };
  }
  async function stepUp(key = fixture) {
    const start = await beginAdminStepUp(actor);
    await finishAdminStepUp(actor, {
      challengeId: start.challengeId,
      response: key.authentication({
        challenge: start.options.challenge,
        userHandle: null,
        counter: 0,
      }),
    });
  }
  async function apiContext() {
    const [user] = await (await db.getDb())!
      .select()
      .from(users)
      .where(eq(users.id, ownerId));
    const token = await sdk.createSessionToken(user.openId, {
      credentialHash: actor.credentialHash,
    });
    actor.tokenId = (await sdk.verifySession(token))!.tokenId;
    return {
      user,
      requestId: actor.requestId,
      req: { headers: { cookie: `${COOKIE_NAME}=${token}` } },
      res: {},
    } as TrpcContext;
  }
  async function recoveryTarget() {
    const owner = await db.getUserById(ownerId);
    return { expectedEmail: owner!.email!, expectedOrigin: fixture.origin };
  }
  async function recoveryApproval() {
    const target = await recoveryTarget();
    const review = await inspectAdminRecovery(actor, target);
    return {
      ...target,
      reviewDigest: review.reviewDigest!,
      operatorRef: "operator-42",
      approvalRef: "identity-review-42",
      confirmAllPasskeysLost: true as const,
    };
  }
  it("reviews recovery without mutation and refuses a never-enrolled account", async () => {
    const target = await recoveryTarget();
    const empty = await inspectAdminRecovery(actor, target);
    expect(empty).toMatchObject({
      eligible: false,
      reviewDigest: null,
      passkeyCount: 0,
    });
    expect(
      await (await db.getDb())!
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, ownerId))
    ).toHaveLength(0);
    await enroll();
    const before = await (await db.getDb())!
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, ownerId));
    const review = await inspectAdminRecovery(actor, target);
    expect(review).toMatchObject({
      eligible: true,
      accountId: ownerId,
      passkeyCount: 1,
    });
    expect(review.reviewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await (await db.getDb())!
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, ownerId))
    ).toEqual(before);
    await expect(
      recoverAdminPasskeys(actor, {
        ...(await recoveryApproval()),
        reviewDigest: "0".repeat(64),
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("atomically revokes every session and lost key, preserving quotas, and permits replacement enrollment only after new login", async () => {
    const enrolled = await enroll();
    await stepUp();
    const backup = passkeyFixture();
    const addition = await beginAdminEnrollment(actor, { password });
    await finishAdminEnrollment(actor, {
      challengeId: addition.challengeId,
      label: "Also lost backup",
      response: backup.registration({ challenge: addition.options.challenge }),
    });
    await stepUp();
    const challenge = await beginAdminStepUp(second);
    const approval = await recoveryApproval();
    const database = (await db.getDb())!;
    const [before] = await database
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, ownerId));
    const grant = await recoverAdminPasskeys(actor, approval);
    expect(grant.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(
      await database
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, ownerId))
    ).toHaveLength(0);
    expect(
      await database
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, ownerId))
    ).toHaveLength(0);
    const [after] = await database
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, ownerId));
    expect(after).toMatchObject({
      attempts: before.attempts,
      attemptWindowExpiresAt: before.attemptWindowExpiresAt,
      challenge: null,
      challengeId: null,
      sessionDigest: null,
      bootstrapDigest: digest(grant.token),
    });
    expect(after.userHandle).not.toBe(enrolled.handle);
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      finishAdminStepUp(second, {
        challengeId: challenge.challengeId,
        response: fixture.authentication({
          challenge: challenge.options.challenge,
        }),
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const [event] = (
      await database
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, ownerId))
    ).filter(e => e.action === "admin.mfa.factors_recovered");
    expect(event.metadata).toMatchObject({
      operatorRef: approval.operatorRef,
      approvalRef: approval.approvalRef,
      removedPasskeys: 2,
      revokedSessions: 2,
      reviewDigest: approval.reviewDigest,
    });
    expect(JSON.stringify(event)).not.toContain(grant.token);
    const owner = (await db.getUserById(ownerId))!;
    actor.tokenId = randomUUID();
    await createAccountSession(
      owner.openId,
      actor.credentialHash,
      actor.tokenId,
      new Date(Date.now() + 3600000)
    );
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const replacement = passkeyFixture();
    const start = await beginAdminEnrollment(actor, {
      password,
      grant: grant.token,
    });
    await finishAdminEnrollment(actor, {
      challengeId: start.challengeId,
      label: "Replacement",
      response: replacement.registration({
        challenge: start.options.challenge,
      }),
    });
    await stepUp(replacement);
    await expect(requireAdminStepUp(actor)).resolves.toBeUndefined();
    await expect(recoverAdminPasskeys(actor, approval)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
  it("allows one winner for concurrent recovery and rejects replay without replacing its grant", async () => {
    await enroll();
    const approval = await recoveryApproval();
    const results = await Promise.allSettled([
      recoverAdminPasskeys(actor, approval),
      recoverAdminPasskeys(actor, approval),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    const winner = results.find(
      r => r.status === "fulfilled"
    ) as PromiseFulfilledResult<{ token: string }>;
    const [state] = await (await db.getDb())!
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, ownerId));
    expect(state.bootstrapDigest).toBe(digest(winner.value.token));
    await expect(recoverAdminPasskeys(actor, approval)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
  it("refuses changed factor inventory, mismatched targets and missing human confirmation without revocation", async () => {
    await enroll();
    const approval = await recoveryApproval();
    await expect(
      recoverAdminPasskeys(actor, {
        ...approval,
        confirmAllPasskeysLost: false,
      } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      recoverAdminPasskeys(actor, {
        ...approval,
        expectedEmail: "other@example.invalid",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      recoverAdminPasskeys(actor, {
        ...approval,
        operatorRef: "private identity details",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await (await db.getDb())!
      .update(adminPasskeys)
      .set({ counter: 8 })
      .where(eq(adminPasskeys.userId, ownerId));
    await expect(recoverAdminPasskeys(actor, approval)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(
      await (await db.getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, ownerId))
    ).toHaveLength(2);
    expect(
      await (await db.getDb())!
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, ownerId))
    ).toHaveLength(1);
  });
  it("rolls back factor removal, session revocation and grant issuance when the audit cannot commit", async () => {
    await enroll();
    const approval = await recoveryApproval();
    const database = (await db.getDb())!;
    const before = await database
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, ownerId));
    // The schema's request-id bound forces a genuine transactional insert failure.
    await expect(
      recoverAdminPasskeys({ ...actor, requestId: "x".repeat(1000) }, approval)
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(
      await database
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, ownerId))
    ).toEqual(before);
    expect(
      await database
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, ownerId))
    ).toHaveLength(1);
    expect(
      await database
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, ownerId))
    ).toHaveLength(2);
  });
  it("serializes recovery behind in-flight proof, rejects the changed review, then revokes that elevation", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    const approval = await recoveryApproval();
    const verify = webauthn.verifyAdminAuthentication;
    let pending!: Promise<{ error: unknown }>;
    vi.spyOn(webauthn, "verifyAdminAuthentication").mockImplementation(
      async input => {
        const result = await verify(input);
        // Queue recovery while real verification holds the owner lock. Awaiting
        // here would self-deadlock instead of exercising two concurrent callers.
        pending = recoverAdminPasskeys(actor, approval).then(
          () => ({ error: null }),
          error => ({ error })
        );
        return result;
      }
    );
    await expect(
      finishAdminStepUp(actor, {
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
          userHandle: null,
        }),
      })
    ).resolves.toHaveProperty("elevatedUntil");
    expect((await pending).error).toMatchObject({ code: "CONFLICT" });
    await expect(requireAdminStepUp(actor)).resolves.toBeUndefined();
    await recoverAdminPasskeys(actor, await recoveryApproval());
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(
      await (await db.getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, ownerId))
    ).toHaveLength(0);
  });
  it("requires durable step-up at the privileged API boundary, not just an administrator role", async () => {
    const ctx = await apiContext();
    const operation = vi.fn(() => "privileged-operation");
    const caller = router({
      operation: adminProcedure.mutation(operation),
    }).createCaller(ctx);
    await expect(caller.operation()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(operation).not.toHaveBeenCalled();
    await enroll();
    await stepUp();
    await expect(caller.operation()).resolves.toBe("privileged-operation");
    await revokeAccountSession(actor.tokenId);
    await expect(caller.operation()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(operation).toHaveBeenCalledTimes(1);
  });
  it("rejects missing and different-account cookies even when context contains an admin", async () => {
    const ctx = await apiContext();
    await enroll();
    await stepUp();
    const procedure = router({
      operation: adminProcedure.mutation(() => "forbidden"),
    });
    await expect(
      procedure
        .createCaller({ ...ctx, req: { headers: {} } as any })
        .operation()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      procedure
        .createCaller({
          ...ctx,
          user: { ...ctx.user!, openId: "another-account" },
        })
        .operation()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("denies a password-only admin session, then elevates only the session that proves the enrolled key", async () => {
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await enroll();
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await stepUp();
    await expect(requireAdminStepUp(actor)).resolves.toBeUndefined();
    await expect(requireAdminStepUp(second)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const status = await getAdminMfaStatus(actor);
    expect(status.passkeys).toHaveLength(1);
    expect(status.elevatedUntil).not.toBe(null);
    expect(JSON.stringify(status)).not.toContain(fixture.id);
  });
  it("requires a current password and an explicit bootstrap grant", async () => {
    await expect(
      beginAdminEnrollment(actor, { password })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const grant = await issueInitialAdminEnrollmentGrant({
      userId: ownerId,
      credentialHash: actor.credentialHash,
      requestId: actor.requestId,
    });
    await expect(
      beginAdminEnrollment(actor, { password: "wrong", grant: grant.token })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await getAdminMfaStatus(actor)).passkeys).toHaveLength(0);
  });
  it("routes account-bound enrollment and step-up without exposing an operator bootstrap endpoint", async () => {
    const caller = appRouter.createCaller(await apiContext()) as any;
    const mfa = caller.auth.adminMfa;
    const input = { accountId: ownerId };
    expect(await mfa.status(input)).toMatchObject({
      accountId: ownerId,
      passkeys: [],
      elevatedUntil: null,
    });
    await expect(mfa.status({ accountId: ownerId + 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      mfa.beginStepUp({ ...input, tokenId: second.tokenId })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const grant = await issueInitialAdminEnrollmentGrant(actor);
    const start = await mfa.beginEnrollment({
      ...input,
      password,
      grant: grant.token,
    });
    await mfa.finishEnrollment({
      ...input,
      challengeId: start.challengeId,
      label: "Browser key",
      response: fixture.registration({ challenge: start.options.challenge }),
    });
    const challenge = await mfa.beginStepUp(input);
    await mfa.finishStepUp({
      ...input,
      challengeId: challenge.challengeId,
      response: fixture.authentication({
        challenge: challenge.options.challenge,
        userHandle: start.options.user.id,
      }),
    });
    expect((await mfa.status(input)).elevatedUntil).not.toBe(null);
    expect(
      Object.keys(appRouter._def.procedures).filter(name =>
        name.startsWith("auth.adminMfa.")
      )
    ).toEqual([
      "auth.adminMfa.status",
      "auth.adminMfa.beginEnrollment",
      "auth.adminMfa.finishEnrollment",
      "auth.adminMfa.beginStepUp",
      "auth.adminMfa.finishStepUp",
      "auth.adminMfa.removePasskey",
    ]);
  });
  it("rejects concurrent replay even with a counterless authenticator", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    const payload = {
      challengeId: start.challengeId,
      response: fixture.authentication({
        challenge: start.options.challenge,
        userHandle: null,
        counter: 0,
      }),
    };
    const results = await Promise.allSettled([
      finishAdminStepUp(actor, payload),
      finishAdminStepUp(actor, payload),
    ]);
    expect(results.filter(x => x.status === "fulfilled")).toHaveLength(1);
    await expect(finishAdminStepUp(actor, payload)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
  it("consumes a failed assertion and does not permit retrying it with a correct signature", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    const response = fixture.authentication({
      challenge: start.options.challenge,
      userHandle: null,
    });
    const invalid = structuredClone(response);
    invalid.response.signature = "AA";
    await expect(
      finishAdminStepUp(actor, {
        challengeId: start.challengeId,
        response: invalid,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      finishAdminStepUp(actor, { challengeId: start.challengeId, response })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("does not allow another session to consume a challenge for elevation", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    await expect(
      finishAdminStepUp(second, {
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
          userHandle: null,
        }),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(requireAdminStepUp(second)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects expired challenges using database time", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    await (await db.getDb())!.execute(
      sql`UPDATE admin_mfa_state SET challenge_expires_at = CURRENT_TIMESTAMP - INTERVAL 1 SECOND WHERE user_id = ${ownerId}`
    );
    await expect(
      finishAdminStepUp(actor, {
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
          userHandle: null,
        }),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("requires renewed proof after the session step-up expires", async () => {
    await enroll();
    await stepUp();
    await (await db.getDb())!.execute(
      sql`UPDATE account_sessions SET admin_verified_until = CURRENT_TIMESTAMP - INTERVAL 1 SECOND WHERE token_digest = ${digest(actor.tokenId)}`
    );
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects revoked sessions and stale roles despite a previously valid step-up", async () => {
    await enroll();
    await stepUp();
    await revokeAccountSession(actor.tokenId);
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await (await db.getDb())!
      .update(users)
      .set({ role: "user" })
      .where(eq(users.id, ownerId));
    await expect(beginAdminStepUp(second)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("bounds failed password confirmations durably", async () => {
    for (let i = 0; i < 10; i++)
      await expect(
        beginAdminEnrollment(actor, { password: "wrong" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      beginAdminEnrollment(second, { password })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    const [rows] = await (await db.getDb())!.execute(
      sql`SELECT attempts FROM admin_mfa_state WHERE user_id = ${ownerId}`
    );
    expect((rows as any[])[0].attempts).toBe(10);
  });
  it("fails closed on unavailable storage", async () => {
    vi.spyOn(db, "getDb").mockResolvedValueOnce(null);
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
  it("requires step-up before adding another key and invalidates all elevations after a factor change", async () => {
    await enroll();
    await expect(
      beginAdminEnrollment(actor, { password })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await stepUp();
    const another = passkeyFixture();
    const start = await beginAdminEnrollment(actor, { password });
    await finishAdminEnrollment(actor, {
      challengeId: start.challengeId,
      response: another.registration({ challenge: start.options.challenge }),
      label: "Backup",
    });
    expect((await getAdminMfaStatus(actor)).passkeys).toHaveLength(2);
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("will not remove the last key or mint a bootstrap bypass for an enrolled account", async () => {
    const enrolled = await enroll();
    await stepUp();
    await expect(
      removeAdminPasskey(actor, { keyId: enrolled.keyId, password })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(
      issueInitialAdminEnrollmentGrant({
        userId: ownerId,
        credentialHash: actor.credentialHash,
        requestId: actor.requestId,
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
  it("denies owner notification before reaching its provider but leaves ordinary account access usable", async () => {
    const notify = vi.spyOn(notification, "notifyOwner");
    const caller = appRouter.createCaller(await apiContext());
    await expect(
      caller.system.notifyOwner({ title: "Synthetic", content: "Never send" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(notify).not.toHaveBeenCalled();
    expect(await caller.auth.me()).toMatchObject({ id: ownerId });
  });
  it("does not reuse a consumed challenge after storage fails in the final transaction", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    const input = {
      challengeId: start.challengeId,
      response: fixture.authentication({
        challenge: start.options.challenge,
        userHandle: null,
      }),
    };
    const real = await db.getDb();
    vi.spyOn(db, "getDb")
      .mockResolvedValueOnce(real)
      .mockResolvedValueOnce(null);
    await expect(finishAdminStepUp(actor, input)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    await expect(finishAdminStepUp(actor, input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("invalidates an earlier challenge when another session starts a new ceremony", async () => {
    await enroll();
    const old = await beginAdminStepUp(actor);
    const latest = await beginAdminStepUp(second);
    await expect(
      finishAdminStepUp(actor, {
        challengeId: old.challengeId,
        response: fixture.authentication({
          challenge: old.options.challenge,
          userHandle: null,
        }),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await finishAdminStepUp(second, {
      challengeId: latest.challengeId,
      response: fixture.authentication({
        challenge: latest.options.challenge,
        userHandle: null,
      }),
    });
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(requireAdminStepUp(second)).resolves.toBeUndefined();
  });
  it("rejects an expired bootstrap grant and a replaced grant", async () => {
    const original = await issueInitialAdminEnrollmentGrant(actor);
    const replacement = await issueInitialAdminEnrollmentGrant(actor);
    await expect(
      beginAdminEnrollment(actor, { password, grant: original.token })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await (await db.getDb())!.execute(
      sql`UPDATE admin_mfa_state SET bootstrap_expires_at = CURRENT_TIMESTAMP - INTERVAL 1 SECOND WHERE user_id = ${ownerId}`
    );
    await expect(
      beginAdminEnrollment(actor, { password, grant: replacement.token })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects a challenge from the other ceremony purpose", async () => {
    const grant = await issueInitialAdminEnrollmentGrant(actor);
    const start = await beginAdminEnrollment(actor, {
      password,
      grant: grant.token,
    });
    await expect(
      finishAdminStepUp(actor, {
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
        }),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("stores advancing counters and rejects a fresh assertion with a repeated nonzero counter", async () => {
    await enroll();
    for (const [counter, accepted] of [
      [1, true],
      [1, false],
      [2, true],
    ] as const) {
      const start = await beginAdminStepUp(actor);
      const completed = finishAdminStepUp(actor, {
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
          userHandle: null,
          counter,
        }),
      });
      if (!accepted)
        await expect(completed).rejects.toMatchObject({ code: "BAD_REQUEST" });
      else await expect(completed).resolves.toHaveProperty("elevatedUntil");
    }
    expect(
      (
        await (await db.getDb())!
          .select()
          .from(adminPasskeys)
          .where(eq(adminPasskeys.userId, ownerId))
      )[0].counter
    ).toBe(2);
  });
  it("rechecks database expiry after cryptographic verification, before granting elevation", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    const database = (await db.getDb())!;
    const transaction = database.transaction.bind(database);
    let activeTx: Parameters<Parameters<typeof database.transaction>[0]>[0];
    vi.spyOn(database, "transaction").mockImplementation((callback, config) =>
      transaction(async tx => {
        activeTx = tx;
        try {
          return await callback(tx);
        } finally {
          await tx.execute(sql`SET timestamp = 0`);
        }
      }, config)
    );
    const verify = webauthn.verifyAdminAuthentication;
    vi.spyOn(webauthn, "verifyAdminAuthentication").mockImplementation(
      async input => {
        const result = await verify(input);
        // MySQL session clock fault injection: no wall-clock sleeps or fake verifier.
        await activeTx.execute(sql`SET timestamp = UNIX_TIMESTAMP() + 180`);
        return result;
      }
    );
    await expect(
      finishAdminStepUp(actor, {
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
          userHandle: null,
        }),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("bounds elevation by session expiry and rejects changed credentials and fenced accounts", async () => {
    await enroll();
    await (await db.getDb())!.execute(
      sql`UPDATE account_sessions SET expires_at = CURRENT_TIMESTAMP + INTERVAL 60 SECOND WHERE token_digest = ${digest(actor.tokenId)}`
    );
    await stepUp();
    const [session] = await (await db.getDb())!
      .select()
      .from(accountSessions)
      .where(eq(accountSessions.tokenDigest, digest(actor.tokenId)));
    expect(session.adminVerifiedUntil).toEqual(session.expiresAt);
    await (await db.getDb())!
      .update(users)
      .set({ passwordHash: "changed-credential" })
      .where(eq(users.id, ownerId));
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await (await db.getDb())!
      .update(users)
      .set({ passwordHash: actor.credentialHash, deletionFencedAt: new Date() })
      .where(eq(users.id, ownerId));
    await expect(requireAdminStepUp(actor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("removes an owned backup only with fresh proof and password, clearing all session elevations", async () => {
    await enroll();
    await stepUp();
    const backup = passkeyFixture();
    const start = await beginAdminEnrollment(actor, { password });
    const added = await finishAdminEnrollment(actor, {
      challengeId: start.challengeId,
      label: "Backup",
      response: backup.registration({ challenge: start.options.challenge }),
    });
    await expect(
      removeAdminPasskey(actor, { keyId: added.keyId, password })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await stepUp();
    await expect(
      removeAdminPasskey(actor, { keyId: added.keyId, password: "wrong" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const secondStart = await beginAdminStepUp(second);
    await finishAdminStepUp(second, {
      challengeId: secondStart.challengeId,
      response: fixture.authentication({
        challenge: secondStart.options.challenge,
        counter: 0,
        userHandle: null,
      }),
    });
    await removeAdminPasskey(actor, { keyId: added.keyId, password });
    expect((await getAdminMfaStatus(actor)).passkeys).toHaveLength(1);
    for (const a of [actor, second])
      await expect(requireAdminStepUp(a)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
  });
  it("exports reviewed metadata but excludes credential IDs, keys, handles, challenges and grant digests", async () => {
    await enroll();
    const start = await beginAdminStepUp(actor);
    const [state] = await (await db.getDb())!
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, ownerId));
    const [key] = await (await db.getDb())!
      .select()
      .from(adminPasskeys)
      .where(eq(adminPasskeys.userId, ownerId));
    const exported = await exportAccountData({
      userId: actor.userId,
      credentialHash: actor.credentialHash,
      requestId: actor.requestId,
      accountId: ownerId,
      password,
      confirmation: true,
    });
    for (const secret of [
      fixture.id,
      state.userHandle,
      start.options.challenge,
      start.challengeId,
      key.publicKey,
      key.credentialDigest,
      actor.tokenId,
    ])
      expect(exported.json).not.toContain(secret);
    const data = JSON.parse(exported.json).data;
    expect(data.adminPasskeys).toHaveLength(1);
    expect(data.adminPasskeys[0].label).toBe("Test passkey");
    expect(data.adminMfaState).toHaveLength(1);
  });
  it("completes cookie-bound enrollment and one-use step-up through the compiled HTTP server across restart", async () => {
    const ctx = await apiContext();
    const cookie = ctx.req.headers.cookie!;
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
    const address = probe.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_port");
    const port = address.port;
    await new Promise<void>(resolve => probe.close(() => resolve()));
    const base = `http://127.0.0.1:${port}/api/trpc/`;
    const startServer = () => {
      const child = spawn(process.execPath, ["dist/index.js"], {
        env: {
          ...process.env,
          NODE_ENV: "production",
          APP_MODE: "production",
          HOST: "127.0.0.1",
          PORT: String(port),
          PUBLIC_ORIGIN: fixture.origin,
          TRUST_PROXY: "false",
          ENABLE_ACCOUNT_MAIL_WORKER: "false",
          ENABLE_ACCOUNT_MAIL_RETENTION: "false",
          ENABLE_PLATFORM_AUTOMATION: "false",
          ENABLE_UNSAFE_LEGACY_ROUTES: "false",
          OPENAI_API_KEY: "",
          RESEND_API_KEY: "",
          BUILT_IN_FORGE_API_URL: "",
          BUILT_IN_FORGE_API_KEY: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let ready = false;
      child.stdout.on("data", chunk => {
        if (String(chunk).includes('"event":"server_started"')) ready = true;
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
              expect(ready).toBe(true);
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
    const post = async (
      path: string,
      input: unknown,
      expectedStatus = 200,
      requestCookie = cookie,
      origin = fixture.origin
    ) => {
      const response = await fetch(base + path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          cookie: requestCookie,
        },
        body: JSON.stringify({ json: input }),
        signal: AbortSignal.timeout(5000),
      });
      expect(response.status).toBe(expectedStatus);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      return response.json();
    };
    let server = startServer();
    try {
      await server.ready();
      await post("auth.adminMfa.beginStepUp", { accountId: ownerId }, 403, "");
      await post(
        "system.notifyOwner",
        { title: "Synthetic", content: "Never send" },
        403
      );
      const grant = await issueInitialAdminEnrollmentGrant(actor);
      const enrollment = (
        await post("auth.adminMfa.beginEnrollment", {
          accountId: ownerId,
          password,
          grant: grant.token,
        })
      ).result.data.json;
      await post("auth.adminMfa.finishEnrollment", {
        accountId: ownerId,
        challengeId: enrollment.challengeId,
        label: "HTTP key",
        response: fixture.registration({
          challenge: enrollment.options.challenge,
        }),
      });
      const start = (
        await post("auth.adminMfa.beginStepUp", { accountId: ownerId })
      ).result.data.json;
      await server.stop();
      server = startServer();
      await server.ready();
      const proof = {
        accountId: ownerId,
        challengeId: start.challengeId,
        response: fixture.authentication({
          challenge: start.options.challenge,
          userHandle: enrollment.options.user.id,
        }),
      };
      const verified = (await post("auth.adminMfa.finishStepUp", proof)).result
        .data.json;
      expect(Date.parse(verified.elevatedUntil)).toBeGreaterThan(Date.now());
      await expect(requireAdminStepUp(actor)).resolves.toBeUndefined();
      await post("auth.adminMfa.finishStepUp", proof, 400);
      const response = await fetch(
        base +
          "auth.adminMfa.status?input=" +
          encodeURIComponent(JSON.stringify({ json: { accountId: ownerId } })),
        { headers: { cookie }, signal: AbortSignal.timeout(5000) }
      );
      expect(response.status).toBe(200);
      expect((await response.json()).result.data.json.passkeys).toHaveLength(1);
      await revokeAccountSession(actor.tokenId);
      await post("auth.adminMfa.beginStepUp", { accountId: ownerId }, 403);
    } finally {
      await server.stop();
    }
  }, 30000);
});
