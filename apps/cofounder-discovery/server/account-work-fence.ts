import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  accountSessions,
  accountDeletionRequests,
  auditEvents,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { requireOutreachUtcSession } from "./outreach-clock";

/** Call on a fresh account row under the transaction's UPDATE or SHARE lock.
 * A request-context snapshot is not sufficient to authorize a database write.
 */
export function assertAccountWorkAllowed(account: {
  deletionFencedAt: Date | null;
}) {
  if (account.deletionFencedAt !== null)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Account work is suspended pending deletion review.",
    });
}

/** Verified workspace mutations must check the live row under the owner lock,
 * not just the authenticated request snapshot. Recovery and account-rights
 * workflows deliberately retain their separate lower-privilege boundaries.
 */
export function assertVerifiedWorkspaceWorkAllowed(account: {
  deletionFencedAt: Date | null;
  emailVerified: number;
}) {
  assertAccountWorkAllowed(account);
  if (account.emailVerified !== 1)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Verify the current account before changing the workspace.",
    });
}

/** Internal preparation primitive, deliberately not routed or exposed by a CLI.
 * The eventual request workflow must first reauthenticate and confirm the exact
 * account. credentialHash is the server-observed hash, never client input.
 *
 * A committed fence serializes with supported account-owned write transactions.
 * It does NOT drain already claimed mail, erase data, establish retention policy,
 * or fence unsupported legacy/provider automation. Erasure remains unauthorized.
 */
export async function fenceAccountForDeletion(
  input: {
    userId: number;
    credentialHash: string;
  },
  review?: { requestId: string; approval: DeletionProcessingApproval }
) {
  try {
    if (
      !Number.isSafeInteger(input.userId) ||
      input.userId <= 0 ||
      input.userId > 2_147_483_647 ||
      !input.credentialHash
    )
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "A current authenticated account is required.",
      });
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    return await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
        // Same first lock as session issuance, recovery and supported owner writes.
        const [owner] = await tx
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!owner?.passwordHash || owner.passwordHash !== input.credentialHash)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Account credentials changed. Sign in again.",
          });
        if (review) {
          const approved = processingApprovalSchema.safeParse(review.approval);
          if (
            !approved.success ||
            owner.email !== approved.data.expectedEmail ||
            owner.emailVerified !== 1
          )
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Deletion processing target or approval does not match.",
            });
          const approval = approved.data;
          const [request] = await tx
            .select()
            .from(accountDeletionRequests)
            .where(eq(accountDeletionRequests.userId, owner.id))
            .for("update");
          if (
            !request ||
            request.status !== "pending_review" ||
            request.requestKey !== approval.requestKey ||
            request.revision !== approval.expectedRevision ||
            !request.requestedAt ||
            request.withdrawnAt !== null
          )
            throw new TRPCError({
              code: "CONFLICT",
              message: "Deletion request changed. Review again.",
            });
          const receipts = await tx
            .select({ metadata: auditEvents.metadata })
            .from(auditEvents)
            .where(
              and(
                eq(auditEvents.userId, owner.id),
                eq(auditEvents.action, "account.deletion.processing_started"),
                eq(auditEvents.entityId, approval.requestKey)
              )
            )
            .limit(2);
          const same = receipts.some(
            row =>
              row.metadata?.revision === approval.expectedRevision &&
              row.metadata.operatorRef === approval.operatorRef &&
              row.metadata.approvalRef === approval.approvalRef
          );
          if (receipts.length > 1)
            throw new TRPCError({
              code: "CONFLICT",
              message: "Duplicate processing evidence requires reconciliation.",
            });
          if (owner.deletionFencedAt) {
            if (!same)
              throw new TRPCError({
                code: "CONFLICT",
                message: "Account suspension requires operator reconciliation.",
              });
            return {
              fencedAt: owner.deletionFencedAt,
              deletionAuthorized: false as const,
              alreadyStarted: true,
            };
          }
          // A receipt without its fence is inconsistent, never permission to retry.
          if (receipts.length)
            throw new TRPCError({
              code: "CONFLICT",
              message: "Processing evidence requires reconciliation.",
            });
          await tx.insert(auditEvents).values({
            userId: owner.id,
            requestId: review.requestId,
            action: "account.deletion.processing_started",
            entityType: "account_deletion_request",
            entityId: approval.requestKey,
            outcome: "success",
            metadata: {
              revision: approval.expectedRevision,
              operatorRef: approval.operatorRef,
              approvalRef: approval.approvalRef,
              erasureAuthorized: false,
            },
          });
        }
        await tx
          .update(users)
          .set({
            deletionFencedAt: sql`COALESCE(${users.deletionFencedAt}, CURRENT_TIMESTAMP)`,
            passwordResetToken: null,
            passwordResetTokenExpiry: null,
            verificationToken: null,
            verificationTokenExpiry: null,
            verificationEmailDigest: null,
          })
          .where(eq(users.id, owner.id));
        await tx
          .delete(accountSessions)
          .where(eq(accountSessions.userId, owner.id));
        const [saved] = await tx
          .select({ fencedAt: users.deletionFencedAt })
          .from(users)
          .where(eq(users.id, owner.id));
        if (!saved?.fencedAt) throw new Error("account_fence_missing");
        return {
          fencedAt: saved.fencedAt,
          deletionAuthorized: false as const,
          ...(review ? { alreadyStarted: false } : {}),
        };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account deletion preparation is temporarily unavailable.",
    });
  }
}

const reference = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/);
export const processingApprovalSchema = z
  .object({
    expectedEmail: z
      .string()
      .email()
      .max(320)
      .refine(value => value === value.trim().toLowerCase()),
    requestKey: z.string().uuid(),
    expectedRevision: z.number().int().positive().max(2147483647),
    operatorRef: reference,
    approvalRef: reference,
    confirmSuspend: z.literal(true),
  })
  .strict();
export type DeletionProcessingApproval = z.infer<
  typeof processingApprovalSchema
>;
/** Operator-only processing preparation: exact reviewed request, not erasure or
 * authority to discard retained data. The CLI uses this reviewed path exclusively. */
export async function beginReviewedDeletionProcessing(input: {
  userId: number;
  credentialHash: string;
  requestId: string;
  approval: DeletionProcessingApproval;
}) {
  const result = await fenceAccountForDeletion(input, {
    requestId: input.requestId,
    approval: input.approval,
  });
  return { ...result, alreadyStarted: result.alreadyStarted ?? false };
}
