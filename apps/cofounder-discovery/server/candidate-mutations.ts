import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { auditEvents, prospects, users } from "../drizzle/schema";
import {
  candidateArchiveSchema,
  candidateEditSchema,
  type CandidatePatch,
} from "../shared/candidate-input";
import { getDb } from "./db";
import {
  candidateReviewProjection,
  candidateRevision,
} from "./candidate-review";
import {
  candidateStorageError,
  requireCandidateAccount,
} from "./candidate-workspace";

type Change = {
  id: number;
  userId: number;
  accountId: number;
  requestId: string;
  expectedRevision: string;
} & (
  | { action: "edit"; patch: CandidatePatch }
  | { action: "archive" | "restore"; confirmed: true }
);

export async function changeCandidate(input: Change) {
  requireCandidateAccount(input);
  const review = {
    id: input.id,
    accountId: input.accountId,
    expectedRevision: input.expectedRevision,
  };
  const parsed =
    input.action === "edit"
      ? candidateEditSchema.safeParse({ ...review, patch: input.patch })
      : candidateArchiveSchema.safeParse({
          ...review,
          confirmed: input.confirmed,
        });
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Valid reviewed candidate changes are required.",
    });
  try {
    const db = await getDb();
    if (!db) throw new Error("candidate_storage_unavailable");
    return await db.transaction(
      async tx => {
        // Serialize with opt-out, qualification and outreach preparation, account first.
        const [owner] = await tx
          .select({
            id: users.id,
            deletionFencedAt: users.deletionFencedAt,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found.",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        const filter = and(
          eq(prospects.id, input.id),
          eq(prospects.userId, input.userId)
        );
        const [row] = await tx
          .select(candidateReviewProjection)
          .from(prospects)
          .where(filter)
          .limit(1)
          .for("update");
        if (!row)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found in this account.",
          });

        const patch: CandidatePatch =
          input.action === "edit"
            ? candidateEditSchema.parse(parsed.data).patch
            : {};
        const fields = (Object.keys(patch) as (keyof CandidatePatch)[])
          .filter(
            key =>
              patch[key] !== undefined &&
              JSON.stringify(row[key]) !== JSON.stringify(patch[key])
          )
          .sort();
        const archived =
          input.action === "archive"
            ? true
            : input.action === "restore"
              ? false
              : row.archivedAt !== null;
        const changed =
          input.action === "edit"
            ? fields.length > 0
            : archived !== (row.archivedAt !== null);
        // A lost-response retry is harmless if the requested values are already saved.
        // Do not renew timestamps, permission receipts or audit events for a no-op.
        if (!changed)
          return { changed: false, archived, revision: candidateRevision(row) };
        if (candidateRevision(row) !== input.expectedRevision)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This candidate changed after your review. Reload the latest details before saving.",
          });
        await tx
          .update(prospects)
          .set(
            input.action === "edit"
              ? patch
              : { archivedAt: archived ? new Date() : null }
          )
          .where(filter);
        await appendWorkspaceAudit(tx, {
          userId: input.userId,
          requestId: input.requestId,
          action: `prospect.${input.action}`,
          outcome: "success",
          entityType: "prospect",
          entityId: String(input.id),
          metadata: input.action === "edit" ? { fields } : { archived },
        });
        const [updated] = await tx
          .select(candidateReviewProjection)
          .from(prospects)
          .where(filter);
        return {
          changed: true,
          archived,
          revision: candidateRevision(updated),
        };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return candidateStorageError(error);
  }
}
import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";
import { appendWorkspaceAudit } from "./capacity";
