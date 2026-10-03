import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { accountDeletionRequests, auditEvents, users } from "../drizzle/schema";
import {
  deletionRequestSchema,
  deletionStatusSchema,
  deletionWithdrawalSchema,
} from "../shared/account-deletion-request";
import { verifyPassword } from "./auth-password";
import { getConfig } from "./config";
import { getDb } from "./db";
import { assertAccountWorkAllowed } from "./account-work-fence";
import { requireOutreachUtcSession } from "./outreach-clock";

type Actor = {
  userId: number;
  credentialHash: string | null;
  requestId: string;
};
type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
type Row = typeof accountDeletionRequests.$inferSelect;

function view(accountId: number, row?: Row) {
  return {
    accountId,
    status: row?.status ?? "none",
    revision: row?.revision ?? 0,
    requestKey: row?.requestKey ?? null,
    requestedAt: row?.requestedAt?.toISOString() ?? null,
    withdrawnAt: row?.withdrawnAt?.toISOString() ?? null,
    requestsEnabled: getConfig().ENABLE_ACCOUNT_DELETION_REQUESTS,
    deletionEnabled: false as const,
  };
}
function checkAccount(accountId: number, actor: Actor) {
  if (accountId !== actor.userId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your signed-in account changed. Refresh before continuing.",
    });
}
async function lockOwner(
  tx: Transaction,
  actor: Actor,
  mode: "share" | "update"
) {
  await requireOutreachUtcSession(tx);
  const [owner] = await tx
    .select({
      id: users.id,
      verified: users.emailVerified,
      passwordHash: users.passwordHash,
      deletionFencedAt: users.deletionFencedAt,
    })
    .from(users)
    .where(eq(users.id, actor.userId))
    .for(mode);
  if (!owner || owner.verified !== 1)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "A current verified account is required.",
    });
  assertAccountWorkAllowed(owner);
  if (!owner.passwordHash || owner.passwordHash !== actor.credentialHash)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Account credentials changed. Sign in again.",
    });
  return { ...owner, passwordHash: owner.passwordHash };
}
function failure(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "Deletion request service is temporarily unavailable. Refresh status before retrying; no erasure was performed.",
  });
}
export async function getDeletionRequestStatus(
  raw: z.infer<typeof deletionStatusSchema>,
  actor: Actor
) {
  const input = deletionStatusSchema.parse(raw);
  checkAccount(input.accountId, actor);
  try {
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    return await db.transaction(
      async tx => {
        await lockOwner(tx, actor, "share");
        const [row] = await tx
          .select()
          .from(accountDeletionRequests)
          .where(eq(accountDeletionRequests.userId, actor.userId));
        return view(actor.userId, row);
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return failure(error);
  }
}

/** Intake only. No call to the fence, mail, deletion executor, or external service. */
export async function changeDeletionRequest(
  action: "request" | "withdraw",
  raw:
    | z.infer<typeof deletionRequestSchema>
    | z.infer<typeof deletionWithdrawalSchema>,
  actor: Actor
) {
  const parsed = (
    action === "request" ? deletionRequestSchema : deletionWithdrawalSchema
  ).safeParse(raw);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Confirm your current account, password and request.",
    });
  const input = parsed.data;
  checkAccount(input.accountId, actor);
  try {
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    // A separate committed admission window counts wrong passwords and failed
    // mutations. The account lock coordinates both commands across app processes.
    await db.transaction(
      async tx => {
        await lockOwner(tx, actor, "update");
        await tx
          .insert(accountDeletionRequests)
          .values({
            userId: actor.userId,
            attemptWindowExpiresAt: sql`CURRENT_TIMESTAMP`,
          })
          .onDuplicateKeyUpdate({ set: { userId: actor.userId } });
        const [row] = await tx
          .select({
            attempts: accountDeletionRequests.attempts,
            expired: sql<number>`${accountDeletionRequests.attemptWindowExpiresAt} <= CURRENT_TIMESTAMP`,
          })
          .from(accountDeletionRequests)
          .where(eq(accountDeletionRequests.userId, actor.userId))
          .for("update");
        const used = Number(row.expired) ? 0 : row.attempts;
        if (!Number.isSafeInteger(used) || used < 0)
          throw new Error("invalid_deletion_quota");
        if (used >= 5)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Deletion requests and withdrawals share five confirmation attempts per 15 minutes. Wait before trying again.",
          });
        await tx
          .update(accountDeletionRequests)
          .set({
            attempts: used + 1,
            ...(Number(row.expired)
              ? {
                  attemptWindowExpiresAt: sql`DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)`,
                }
              : {}),
          })
          .where(eq(accountDeletionRequests.userId, actor.userId));
      },
      { isolationLevel: "read committed" }
    );
    return await db.transaction(
      async tx => {
        const owner = await lockOwner(tx, actor, "update");
        if (!(await verifyPassword(input.password, owner.passwordHash)))
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Password confirmation failed. Check your current password and try again.",
          });
        const [row] = await tx
          .select()
          .from(accountDeletionRequests)
          .where(eq(accountDeletionRequests.userId, actor.userId))
          .for("update");
        if (!row || !Number.isSafeInteger(row.revision) || row.revision < 0)
          throw new Error("invalid_deletion_request");
        const sameKey = row.requestKey === input.requestKey;
        // Retry recognition is specific to the transition's original revision.
        if (
          sameKey &&
          row.revision === input.expectedRevision + 1 &&
          ((action === "request" && row.status === "pending_review") ||
            (action === "withdraw" && row.status === "withdrawn"))
        )
          return view(actor.userId, row);
        if (
          row.revision !== input.expectedRevision ||
          (action === "request" &&
            (row.status === "pending_review" || sameKey)) ||
          (action === "withdraw" &&
            (row.status !== "pending_review" || !sameKey))
        )
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "The deletion request changed. Refresh its status before continuing.",
          });
        if (
          action === "request" &&
          !getConfig().ENABLE_ACCOUNT_DELETION_REQUESTS
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Deletion request intake is disabled by the operator. No request was submitted.",
          });
        await tx
          .update(accountDeletionRequests)
          .set({
            revision: row.revision + 1,
            ...(action === "request"
              ? {
                  status: "pending_review" as const,
                  requestKey: input.requestKey,
                  requestedAt: sql`CURRENT_TIMESTAMP`,
                  withdrawnAt: null,
                }
              : {
                  status: "withdrawn" as const,
                  withdrawnAt: sql`CURRENT_TIMESTAMP`,
                }),
          })
          .where(eq(accountDeletionRequests.userId, actor.userId));
        await tx.insert(auditEvents).values({
          userId: actor.userId,
          requestId: actor.requestId,
          action: `account.deletion.${action}`,
          entityType: "account_deletion_request",
          entityId: input.requestKey,
          outcome: "success",
          metadata: { revision: row.revision + 1 },
        });
        const [saved] = await tx
          .select()
          .from(accountDeletionRequests)
          .where(eq(accountDeletionRequests.userId, actor.userId));
        if (!saved) throw new Error("deletion_request_missing");
        return view(actor.userId, saved);
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return failure(error);
  }
}
