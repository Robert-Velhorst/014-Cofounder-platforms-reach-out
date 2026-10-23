import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { accountSessions, auditEvents, users } from "../drizzle/schema";
import { getDb } from "./db";
import { requireOutreachUtcSession } from "./outreach-clock";

const targetSchema = z
  .object({
    accountId: z.number().int().min(1).max(2147483647),
    expectedEmail: z
      .string()
      .email()
      .max(320)
      .refine(v => v === v.trim().toLowerCase()),
  })
  .strict();
const reference = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/);
const approvalSchema = targetSchema
  .extend({
    operationId: z.string().uuid(),
    reviewDigest: z.string().regex(/^[a-f0-9]{64}$/),
    reviewedAt: z.string().datetime(),
    operatorRef: reference,
    approvalRef: reference,
    confirmRequireVerification: z.literal(true),
    confirmMailRecoveryReady: z.literal(true),
    confirmAdminAccessLoss: z.boolean(),
  })
  .strict();
export type ReverificationApproval = z.infer<typeof approvalSchema>;
const action = "account.reverification.required";
function fail(code: string): never {
  throw new Error(`reverification_${code}`);
}

/** Local operator primitive only; intentionally no HTTP route or automatic mail.
 * Operator authority and mailbox/recovery readiness must be independently reviewed.
 */
export async function reviewAccountReverification(
  input: z.infer<typeof targetSchema>
) {
  const target = targetSchema.parse(input);
  const db = await getDb();
  if (!db) fail("storage_unavailable");
  return db.transaction(
    async tx => {
      await requireOutreachUtcSession(tx);
      const [owner] = await tx
        .select()
        .from(users)
        .where(eq(users.id, target.accountId));
      if (!owner || owner.email?.trim().toLowerCase() !== target.expectedEmail)
        fail("target_ineligible");
      const sessions = await tx
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, owner.id))
        .orderBy(accountSessions.tokenDigest);
      const [latest] = await tx
        .select({ id: auditEvents.id })
        .from(auditEvents)
        .where(eq(auditEvents.userId, owner.id))
        .orderBy(desc(auditEvents.id))
        .limit(1);
      const reviewedAt = new Date().toISOString();
      const eligible =
        owner.emailVerified === 1 &&
        !!owner.passwordHash &&
        owner.deletionFencedAt === null;
      return {
        mode: "check" as const,
        accountId: owner.id,
        role: owner.role,
        eligible,
        reviewedAt,
        expiresAt: new Date(Date.parse(reviewedAt) + 600000).toISOString(),
        reviewDigest: digest(owner, sessions, latest?.id ?? null, reviewedAt),
        sessionRecordCount: sessions.length,
        administratorAccessWillBeLost: owner.role === "admin",
        applied: false as const,
        mailSent: false as const,
        warning:
          "Review only, not mutation authority. Missing evidence does not classify legacy accounts. Independently verify operator authority, account history, reachable inbox, working verification delivery and recovery before separately approved application. Never apply in CI or bulk.",
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" }
  );
}
function digest(
  owner: typeof users.$inferSelect,
  sessions: (typeof accountSessions.$inferSelect)[],
  latest: number | null,
  reviewedAt: string
) {
  // Opaque review fingerprint only; never output the security-bearing snapshot.
  return createHash("sha256")
    .update(JSON.stringify({ version: 1, owner, sessions, latest, reviewedAt }))
    .digest("hex");
}
export async function requireAccountReverification(
  input: ReverificationApproval
) {
  const approval = approvalSchema.parse(input);
  const db = await getDb();
  if (!db) fail("storage_unavailable");
  return db.transaction(
    async tx => {
      await requireOutreachUtcSession(tx);
      // First owner lock serializes supported session/token issuance and account writes.
      const [owner] = await tx
        .select()
        .from(users)
        .where(eq(users.id, approval.accountId))
        .for("update");
      if (
        !owner ||
        owner.email?.trim().toLowerCase() !== approval.expectedEmail
      )
        fail("target_ineligible");
      const receiptMetadata = {
        version: 1,
        reviewDigest: approval.reviewDigest,
        reviewedAt: approval.reviewedAt,
        operatorRef: approval.operatorRef,
        approvalRef: approval.approvalRef,
        confirmAdminAccessLoss: approval.confirmAdminAccessLoss,
        mailRecoveryReadinessAcknowledged: true,
      };
      const [receipt] = await tx
        .select()
        .from(auditEvents)
        .where(
          and(
            eq(auditEvents.userId, owner.id),
            eq(auditEvents.action, action),
            eq(auditEvents.entityType, "account_reverification"),
            eq(auditEvents.entityId, approval.operationId),
            eq(auditEvents.outcome, "success")
          )
        )
        .limit(1);
      if (receipt) {
        if (
          JSON.stringify(receipt.metadata) !== JSON.stringify(receiptMetadata)
        ) {
          // MySQL JSON may reorder object keys; compare each exact field instead.
          if (
            !receipt.metadata ||
            Object.keys(receipt.metadata).length !==
              Object.keys(receiptMetadata).length ||
            Object.entries(receiptMetadata).some(
              ([key, value]) => receipt.metadata![key] !== value
            )
          )
            fail("operation_conflict");
        }
        return {
          accountId: owner.id,
          operationId: approval.operationId,
          applied: true,
          alreadyApplied: true,
          currentVerifiedFlag: owner.emailVerified === 1,
          mailSent: false,
        };
      }
      const age = Date.now() - Date.parse(approval.reviewedAt);
      if (!Number.isFinite(age) || age < 0 || age > 600000)
        fail("review_stale");
      if (
        owner.emailVerified !== 1 ||
        !owner.passwordHash ||
        owner.deletionFencedAt !== null
      )
        fail("target_ineligible");
      if (owner.role === "admin" && !approval.confirmAdminAccessLoss)
        fail("admin_acknowledgement_required");
      const sessions = await tx
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, owner.id))
        .orderBy(accountSessions.tokenDigest);
      const [latest] = await tx
        .select({ id: auditEvents.id })
        .from(auditEvents)
        .where(eq(auditEvents.userId, owner.id))
        .orderBy(desc(auditEvents.id))
        .limit(1);
      if (
        digest(owner, sessions, latest?.id ?? null, approval.reviewedAt) !==
        approval.reviewDigest
      )
        fail("review_stale");
      await tx
        .update(users)
        .set({
          emailVerified: 0,
          verificationToken: null,
          verificationTokenExpiry: null,
          verificationEmailDigest: null,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        })
        .where(eq(users.id, owner.id));
      await tx
        .delete(accountSessions)
        .where(eq(accountSessions.userId, owner.id));
      await tx
        .insert(auditEvents)
        .values({
          userId: owner.id,
          requestId: approval.operationId,
          action,
          entityType: "account_reverification",
          entityId: approval.operationId,
          outcome: "success",
          metadata: receiptMetadata,
        });
      return {
        accountId: owner.id,
        operationId: approval.operationId,
        applied: true,
        alreadyApplied: false,
        currentVerifiedFlag: false,
        mailSent: false,
      };
    },
    { isolationLevel: "read committed" }
  );
}
