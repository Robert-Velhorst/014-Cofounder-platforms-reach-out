import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  accountSessions,
  adminMfaState,
  adminPasskeys,
  auditEvents,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { getConfig } from "./config";
import { requireOutreachUtcSession } from "./outreach-clock";
import { verifyPassword } from "./auth-password";
import {
  adminRegistrationOptions,
  adminAuthenticationOptions,
  verifyAdminRegistration,
  verifyAdminAuthentication,
} from "./admin-webauthn";

export type AdminActor = {
  userId: number;
  tokenId: string;
  credentialHash: string | null;
  requestId: string;
};
type OperatorActor = Omit<AdminActor, "tokenId">;
type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
type Owner = typeof users.$inferSelect;
type Session = typeof accountSessions.$inferSelect;
type State = typeof adminMfaState.$inferSelect;
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const invalid = () =>
  new TRPCError({
    code: "BAD_REQUEST",
    message: "Passkey verification failed. Start again.",
  });
const forbidden = () =>
  new TRPCError({
    code: "FORBIDDEN",
    message: "Current administrator verification is required.",
  });
const unavailable = () =>
  new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "Administrator security is temporarily unavailable. Start again later.",
  });
const clearChallenge = {
  challengeId: null,
  challenge: null,
  purpose: null,
  sessionDigest: null,
  origin: null,
  challengeExpiresAt: null,
};

async function clock(tx: Transaction) {
  const [rows] = await tx.execute(
    sql`SELECT UNIX_TIMESTAMP(CURRENT_TIMESTAMP) AS seconds`
  );
  const seconds = Number(
    (rows as unknown as Array<{ seconds: number }>)[0]?.seconds
  );
  if (!Number.isSafeInteger(seconds)) throw unavailable();
  return new Date(seconds * 1000);
}
async function withOwner<T>(
  actor: OperatorActor,
  operation: (tx: Transaction, owner: Owner) => Promise<T>
): Promise<T> {
  try {
    if (
      !Number.isSafeInteger(actor.userId) ||
      actor.userId < 1 ||
      !actor.credentialHash
    )
      throw forbidden();
    const db = await getDb();
    if (!db) throw unavailable();
    return await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
        // Same first lock as recovery, session creation and deletion fencing.
        const [owner] = await tx
          .select()
          .from(users)
          .where(eq(users.id, actor.userId))
          .for("update");
        if (
          !owner ||
          owner.role !== "admin" ||
          owner.emailVerified !== 1 ||
          owner.deletionFencedAt !== null
        )
          throw forbidden();
        if (owner.passwordHash !== actor.credentialHash)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Account credentials changed. Sign in again.",
          });
        return operation(tx, owner);
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}
async function withSession<T>(
  actor: AdminActor,
  operation: (
    tx: Transaction,
    owner: Owner,
    session: Session,
    now: Date
  ) => Promise<T>
) {
  return withOwner(actor, async (tx, owner) => {
    if (
      typeof actor.tokenId !== "string" ||
      !actor.tokenId ||
      actor.tokenId.length > 128
    )
      throw forbidden();
    const [session] = await tx
      .select()
      .from(accountSessions)
      .where(
        and(
          eq(accountSessions.userId, owner.id),
          eq(accountSessions.tokenDigest, digest(actor.tokenId))
        )
      )
      .for("update");
    const now = await clock(tx);
    activeSession(session, now);
    return operation(tx, owner, session, now);
  });
}
function activeSession(
  session: Session | undefined,
  now: Date
): asserts session is Session {
  if (!session || session.expiresAt <= now)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in again before administrator verification.",
    });
}
async function securityState(tx: Transaction, userId: number, now: Date) {
  await tx
    .insert(adminMfaState)
    .values({
      userId,
      userHandle: randomBytes(32).toString("base64url"),
      attempts: 0,
      attemptWindowExpiresAt: now,
    })
    .onDuplicateKeyUpdate({ set: { userId } });
  const [state] = await tx
    .select()
    .from(adminMfaState)
    .where(eq(adminMfaState.userId, userId))
    .for("update");
  if (!state) throw unavailable();
  return state;
}
async function reserve(tx: Transaction, state: State, now: Date) {
  const attempts = state.attemptWindowExpiresAt <= now ? 0 : state.attempts;
  if (!Number.isSafeInteger(attempts) || attempts < 0) throw unavailable();
  if (attempts >= 10)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many administrator verification attempts. Try again later.",
    });
  await tx
    .update(adminMfaState)
    .set({
      attempts: attempts + 1,
      attemptWindowExpiresAt:
        attempts === 0
          ? new Date(now.getTime() + 900000)
          : state.attemptWindowExpiresAt,
    })
    .where(eq(adminMfaState.userId, state.userId));
}
// Return expected rejection across commit, preserving the reserved allowance.
async function outcome<T>(operation: () => Promise<T>) {
  try {
    return { value: await operation(), error: null };
  } catch (error) {
    if (error instanceof TRPCError) return { value: null, error };
    throw error;
  }
}
function unwrap<T>(result: { value: T | null; error: TRPCError | null }): T {
  if (result.error) throw result.error;
  return result.value as T;
}
async function passkeys(tx: Transaction, userId: number) {
  return tx
    .select()
    .from(adminPasskeys)
    .where(eq(adminPasskeys.userId, userId));
}
function elevated(session: Session, now: Date) {
  if (!session.adminVerifiedUntil || session.adminVerifiedUntil <= now)
    throw forbidden();
}
async function audit(
  tx: Transaction,
  actor: OperatorActor,
  action: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  await tx.insert(auditEvents).values({
    userId: actor.userId,
    requestId: actor.requestId,
    action: `admin.mfa.${action}`,
    entityType: "admin_passkey",
    entityId,
    outcome: "success",
    metadata,
  });
}
async function invalidateElevations(tx: Transaction, userId: number) {
  await tx
    .update(accountSessions)
    .set({ adminVerifiedUntil: null })
    .where(eq(accountSessions.userId, userId));
  await tx
    .update(adminMfaState)
    .set(clearChallenge)
    .where(eq(adminMfaState.userId, userId));
}

/** Internal operator primitive, deliberately NOT routed. An operator must first
 * establish identity/authority. This never resets or bypasses existing factors. */
export async function issueInitialAdminEnrollmentGrant(
  actor: OperatorActor,
  approval?: InitialAdminEnrollmentApproval
) {
  return withOwner(actor, async (tx, owner) => {
    if (approval) {
      assertEnrollmentTarget(owner, approval);
      if (
        !operatorReference.safeParse(approval.operatorRef).success ||
        !operatorReference.safeParse(approval.approvalRef).success
      )
        throw new Error("enrollment_arguments_invalid");
    }
    if ((await passkeys(tx, owner.id)).length)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "An enrolled account cannot use initial enrollment approval.",
      });
    const now = await clock(tx);
    const state = await securityState(tx, owner.id, now);
    // Human-operated issuance must never silently replace another operator's
    // live approval. The owner lock serializes concurrent CLI invocations.
    if (
      approval &&
      state.bootstrapDigest &&
      state.bootstrapExpiresAt &&
      state.bootstrapExpiresAt > now
    )
      throw new TRPCError({
        code: "CONFLICT",
        message: "Initial enrollment approval is already active.",
      });
    const token = randomBytes(32).toString("base64url"),
      expiresAt = new Date(now.getTime() + 600000);
    await tx
      .update(adminMfaState)
      .set({
        ...clearChallenge,
        bootstrapDigest: digest(token),
        bootstrapExpiresAt: expiresAt,
      })
      .where(eq(adminMfaState.userId, owner.id));
    await audit(
      tx,
      actor,
      "bootstrap_approved",
      String(owner.id),
      approval
        ? {
            operatorRef: approval.operatorRef,
            approvalRef: approval.approvalRef,
            origin: approval.expectedOrigin,
          }
        : {}
    );
    return { token, expiresAt: expiresAt.toISOString() };
  });
}

export type InitialAdminEnrollmentTarget = {
  expectedEmail: string;
  expectedOrigin: string;
};
export type InitialAdminEnrollmentApproval = InitialAdminEnrollmentTarget & {
  operatorRef: string;
  approvalRef: string;
};
const operatorReference = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/);
function assertEnrollmentTarget(
  owner: Owner,
  target: InitialAdminEnrollmentTarget
) {
  let validOrigin = false;
  try {
    const url = new URL(target.expectedOrigin);
    validOrigin =
      url.origin === target.expectedOrigin &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" && url.hostname === "localhost")) &&
      getConfig().PUBLIC_ORIGIN === target.expectedOrigin;
  } catch {
    /* Deny malformed/missing configuration without printing it. */
  }
  if (!validOrigin || owner.email !== target.expectedEmail)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Enrollment target does not match.",
    });
}
/** Read-only eligibility snapshot; it creates neither state nor authority.
 * Issuance repeats these checks under the same owner lock. */
export async function inspectInitialAdminEnrollment(
  actor: OperatorActor,
  target: InitialAdminEnrollmentTarget
) {
  return withOwner(actor, async (tx, owner) => {
    assertEnrollmentTarget(owner, target);
    const now = await clock(tx);
    const [state] = await tx
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner.id));
    const enrolled = (await passkeys(tx, owner.id)).length > 0;
    const active = Boolean(
      state?.bootstrapDigest &&
      state.bootstrapExpiresAt &&
      state.bootstrapExpiresAt > now
    );
    return {
      accountId: owner.id,
      origin: target.expectedOrigin,
      eligible: !enrolled && !active,
      reason: enrolled ? "already_enrolled" : active ? "approval_active" : null,
    };
  });
}
export type AdminRecoveryApproval = InitialAdminEnrollmentApproval & {
  reviewDigest: string;
  confirmAllPasskeysLost: true;
};
function recoveryDigest(
  owner: Owner,
  origin: string,
  state: State,
  keys: Array<typeof adminPasskeys.$inferSelect>
) {
  // A stale-review guard, not operator authorization. Bind credential version,
  // generation and exact factor state, but not unrelated session activity.
  return digest(
    JSON.stringify({
      version: 1,
      accountId: owner.id,
      email: owner.email,
      credentialHash: owner.passwordHash,
      origin,
      userHandle: state.userHandle,
      keys: [...keys]
        .sort((a, b) => a.keyId.localeCompare(b.keyId))
        .map(key => ({
          keyId: key.keyId,
          credentialDigest: key.credentialDigest,
          credentialId: key.credentialId,
          publicKey: key.publicKey,
          counter: key.counter,
          label: key.label,
          transports: key.transports,
          deviceType: key.deviceType,
          backedUp: key.backedUp,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
        })),
    })
  );
}
/** Internal operator inspection only; no HTTP route, secret issuance or mutation. */
export async function inspectAdminRecovery(
  actor: OperatorActor,
  target: InitialAdminEnrollmentTarget
) {
  return withOwner(actor, async (tx, owner) => {
    assertEnrollmentTarget(owner, target);
    const keys = await passkeys(tx, owner.id);
    const [state] = await tx
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner.id));
    const eligible = keys.length > 0 && Boolean(state);
    return {
      accountId: owner.id,
      origin: target.expectedOrigin,
      eligible,
      passkeyCount: keys.length,
      reviewDigest: eligible
        ? recoveryDigest(owner, target.expectedOrigin, state!, keys)
        : null,
    };
  });
}
/** Lost-all-factors recovery requires independently authorized operator review.
 * Revocation, factor removal, replacement grant and audit commit together. */
export async function recoverAdminPasskeys(
  actor: OperatorActor,
  approval: AdminRecoveryApproval
) {
  return withOwner(actor, async (tx, owner) => {
    assertEnrollmentTarget(owner, approval);
    if (
      approval.confirmAllPasskeysLost !== true ||
      !operatorReference.safeParse(approval.operatorRef).success ||
      !operatorReference.safeParse(approval.approvalRef).success ||
      !z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .safeParse(approval.reviewDigest).success
    )
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Recovery approval is invalid.",
      });
    const keys = await passkeys(tx, owner.id);
    const [state] = await tx
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner.id))
      .for("update");
    if (
      !keys.length ||
      !state ||
      !timingSafeEqual(
        Buffer.from(approval.reviewDigest),
        Buffer.from(recoveryDigest(owner, approval.expectedOrigin, state, keys))
      )
    )
      throw new TRPCError({
        code: "CONFLICT",
        message: "Recovery review is no longer current. Review again.",
      });
    const sessions = await tx
      .select({ tokenDigest: accountSessions.tokenDigest })
      .from(accountSessions)
      .where(eq(accountSessions.userId, owner.id))
      .for("update");
    const now = await clock(tx),
      token = randomBytes(32).toString("base64url"),
      expiresAt = new Date(now.getTime() + 600000);
    await tx
      .delete(accountSessions)
      .where(eq(accountSessions.userId, owner.id));
    await tx.delete(adminPasskeys).where(eq(adminPasskeys.userId, owner.id));
    await tx
      .update(adminMfaState)
      .set({
        ...clearChallenge,
        userHandle: randomBytes(32).toString("base64url"),
        bootstrapDigest: digest(token),
        bootstrapExpiresAt: expiresAt,
        // Preserve the existing attempt window: recovery cannot replenish quotas.
      })
      .where(eq(adminMfaState.userId, owner.id));
    await audit(tx, actor, "factors_recovered", String(owner.id), {
      operatorRef: approval.operatorRef,
      approvalRef: approval.approvalRef,
      origin: approval.expectedOrigin,
      reviewDigest: approval.reviewDigest,
      removedPasskeys: keys.length,
      revokedSessions: sessions.length,
    });
    return { token, expiresAt: expiresAt.toISOString() };
  });
}
export async function beginAdminEnrollment(
  actor: AdminActor,
  input: { password: string; grant?: string }
) {
  return unwrap(
    await withSession(actor, async (tx, owner, session, now) => {
      const state = await securityState(tx, owner.id, now);
      await reserve(tx, state, now);
      return outcome(async () => {
        if (
          typeof input.password !== "string" ||
          input.password.length > 128 ||
          !(await verifyPassword(input.password, owner.passwordHash!))
        )
          throw forbidden();
        now = await clock(tx);
        activeSession(session, now);
        const keys = await passkeys(tx, owner.id);
        if (keys.length >= 5)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "At most five administrator passkeys may be enrolled.",
          });
        const purpose = keys.length ? "enroll" : "bootstrap";
        if (purpose === "enroll") elevated(session, now);
        else {
          if (
            !input.grant ||
            !/^[A-Za-z0-9_-]{43}$/.test(input.grant) ||
            !state.bootstrapDigest ||
            !state.bootstrapExpiresAt ||
            state.bootstrapExpiresAt <= now ||
            !timingSafeEqual(
              Buffer.from(digest(input.grant)),
              Buffer.from(state.bootstrapDigest)
            )
          )
            throw forbidden();
        }
        const options = await adminRegistrationOptions({
          userHandle: state.userHandle,
          userName: owner.email!,
          credentialIds: keys.map(key => key.credentialId),
        });
        const challengeId = randomUUID();
        await tx
          .update(adminMfaState)
          .set({
            challengeId,
            challenge: options.challenge,
            purpose,
            sessionDigest: session.tokenDigest,
            origin: getConfig().PUBLIC_ORIGIN!,
            challengeExpiresAt: new Date(now.getTime() + 120000),
          })
          .where(eq(adminMfaState.userId, owner.id));
        return { challengeId, options };
      });
    })
  );
}
export async function beginAdminStepUp(actor: AdminActor) {
  return unwrap(
    await withSession(actor, async (tx, owner, session, now) => {
      const state = await securityState(tx, owner.id, now);
      await reserve(tx, state, now);
      return outcome(async () => {
        const options = await adminAuthenticationOptions(
          (await passkeys(tx, owner.id)).map(key => key.credentialId)
        );
        const challengeId = randomUUID();
        await tx
          .update(adminMfaState)
          .set({
            challengeId,
            challenge: options.challenge,
            purpose: "authenticate",
            sessionDigest: session.tokenDigest,
            origin: getConfig().PUBLIC_ORIGIN!,
            challengeExpiresAt: new Date(now.getTime() + 120000),
          })
          .where(eq(adminMfaState.userId, owner.id));
        return { challengeId, options };
      });
    })
  );
}
function checkChallenge(
  state: State | undefined,
  session: Session,
  now: Date,
  challengeId: string,
  authenticate: boolean
) {
  if (
    !state ||
    state.challengeId !== challengeId ||
    state.sessionDigest !== session.tokenDigest ||
    !state.challengeExpiresAt ||
    state.challengeExpiresAt <= now ||
    state.origin !== getConfig().PUBLIC_ORIGIN ||
    (authenticate
      ? state.purpose !== "authenticate"
      : !["bootstrap", "enroll"].includes(state.purpose ?? ""))
  )
    throw invalid();
  return state;
}
async function claim(
  actor: AdminActor,
  challengeId: string,
  authenticate: boolean
) {
  return withSession(actor, async (tx, owner, session, now) => {
    const [state] = await tx
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner.id));
    checkChallenge(state, session, now, challengeId, authenticate);
    if (!state?.challenge) throw invalid();
    // Commit consumption before verification. A failed signature or subsequent
    // storage error cannot turn the challenge into a reusable proof.
    await tx
      .update(adminMfaState)
      .set({ challenge: null })
      .where(eq(adminMfaState.userId, owner.id));
    return { ...state, challenge: state.challenge };
  });
}
export async function finishAdminEnrollment(
  actor: AdminActor,
  input: { challengeId: string; response: unknown; label: string }
) {
  const claimed = await claim(actor, input.challengeId, false);
  return withSession(actor, async (tx, owner, session, now) => {
    const [row] = await tx
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner.id));
    const state = checkChallenge(row, session, now, input.challengeId, false);
    if (state.challenge !== null) throw invalid();
    const label = z.string().trim().min(1).max(80).safeParse(input.label);
    if (!label.success) throw invalid();
    const keys = await passkeys(tx, owner.id);
    if (keys.length >= 5) throw invalid();
    if (claimed.purpose === "bootstrap") {
      if (
        keys.length ||
        state.bootstrapDigest !== claimed.bootstrapDigest ||
        !state.bootstrapExpiresAt ||
        state.bootstrapExpiresAt <= now
      )
        throw invalid();
    } else elevated(session, now);
    const verified = await verifyAdminRegistration({
      response: input.response,
      challenge: claimed.challenge,
    });
    now = await clock(tx);
    activeSession(session, now);
    checkChallenge(state, session, now, input.challengeId, false);
    if (claimed.purpose === "bootstrap") {
      if (!state.bootstrapExpiresAt || state.bootstrapExpiresAt <= now)
        throw invalid();
    } else elevated(session, now);
    const credentialDigest = digest(verified.id);
    const [duplicate] = await tx
      .select({ id: adminPasskeys.keyId })
      .from(adminPasskeys)
      .where(eq(adminPasskeys.credentialDigest, credentialDigest));
    if (duplicate) throw invalid();
    const keyId = randomUUID();
    await tx.insert(adminPasskeys).values({
      keyId,
      userId: owner.id,
      credentialDigest,
      credentialId: verified.id,
      publicKey: Buffer.from(verified.publicKey).toString("base64url"),
      counter: verified.counter,
      label: label.data,
      transports: verified.transports ?? [],
      deviceType: verified.deviceType,
      backedUp: verified.backedUp,
    });
    await tx
      .update(adminMfaState)
      .set({ bootstrapDigest: null, bootstrapExpiresAt: null })
      .where(eq(adminMfaState.userId, owner.id));
    await invalidateElevations(tx, owner.id);
    await audit(tx, actor, "enrolled", keyId);
    return { keyId };
  });
}
export async function finishAdminStepUp(
  actor: AdminActor,
  input: { challengeId: string; response: unknown }
) {
  const claimed = await claim(actor, input.challengeId, true);
  return withSession(actor, async (tx, owner, session, now) => {
    const [row] = await tx
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner.id));
    const state = checkChallenge(row, session, now, input.challengeId, true);
    if (state.challenge !== null) throw invalid();
    const id = z
      .object({ id: z.string().min(1).max(1400) })
      .safeParse(input.response);
    if (!id.success) throw invalid();
    const [key] = await tx
      .select()
      .from(adminPasskeys)
      .where(
        and(
          eq(adminPasskeys.userId, owner.id),
          eq(adminPasskeys.credentialDigest, digest(id.data.id))
        )
      )
      .for("update");
    if (!key) throw invalid();
    const verified = await verifyAdminAuthentication({
      response: input.response,
      challenge: claimed.challenge,
      userHandle: state.userHandle,
      credential: {
        id: key.credentialId,
        publicKey: new Uint8Array(Buffer.from(key.publicKey, "base64url")),
        counter: key.counter,
      },
    });
    now = await clock(tx);
    activeSession(session, now);
    checkChallenge(state, session, now, input.challengeId, true);
    const until = new Date(
      Math.min(now.getTime() + 300000, session.expiresAt.getTime())
    );
    await tx
      .update(adminPasskeys)
      .set({
        counter: verified.counter,
        deviceType: verified.deviceType,
        backedUp: verified.backedUp,
        lastUsedAt: now,
      })
      .where(eq(adminPasskeys.keyId, key.keyId));
    await tx
      .update(accountSessions)
      .set({ adminVerifiedUntil: until })
      .where(eq(accountSessions.tokenDigest, session.tokenDigest));
    await tx
      .update(adminMfaState)
      .set(clearChallenge)
      .where(eq(adminMfaState.userId, owner.id));
    await audit(tx, actor, "verified", key.keyId);
    return { elevatedUntil: until.toISOString() };
  });
}
export async function requireAdminStepUp(actor: AdminActor) {
  await withSession(actor, async (tx, owner, session, now) => {
    elevated(session, now);
    if (!(await passkeys(tx, owner.id)).length) throw forbidden();
  });
}
export async function getAdminMfaStatus(actor: AdminActor) {
  return withSession(actor, async (tx, owner, session, now) => ({
    accountId: owner.id,
    elevatedUntil:
      session.adminVerifiedUntil && session.adminVerifiedUntil > now
        ? session.adminVerifiedUntil.toISOString()
        : null,
    passkeys: (await passkeys(tx, owner.id)).map(key => ({
      keyId: key.keyId,
      label: key.label,
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
      backedUp: key.backedUp,
      deviceType: key.deviceType,
    })),
  }));
}
export async function removeAdminPasskey(
  actor: AdminActor,
  input: { keyId: string; password: string }
) {
  return unwrap(
    await withSession(actor, async (tx, owner, session, now) => {
      const state = await securityState(tx, owner.id, now);
      await reserve(tx, state, now);
      return outcome(async () => {
        elevated(session, now);
        if (
          typeof input.password !== "string" ||
          input.password.length > 128 ||
          !(await verifyPassword(input.password, owner.passwordHash!))
        )
          throw forbidden();
        now = await clock(tx);
        activeSession(session, now);
        elevated(session, now);
        const keys = await passkeys(tx, owner.id);
        if (keys.length < 2)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Keep at least one administrator passkey. Lost-factor recovery needs operator review.",
          });
        if (!keys.some(key => key.keyId === input.keyId)) throw invalid();
        await tx
          .delete(adminPasskeys)
          .where(
            and(
              eq(adminPasskeys.userId, owner.id),
              eq(adminPasskeys.keyId, input.keyId)
            )
          );
        await invalidateElevations(tx, owner.id);
        await audit(tx, actor, "removed", input.keyId);
        return { removed: true as const };
      });
    })
  );
}
