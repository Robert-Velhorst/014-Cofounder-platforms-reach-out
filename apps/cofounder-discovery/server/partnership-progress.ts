import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import {
  users,
  prospects,
  matches,
  partnershipOutcomes,
  idempotencyRecords,
  auditEvents,
} from "../drizzle/schema";
import {
  progressListSchema,
  progressRecordSchema,
} from "../shared/partnership-progress";
import { getDb } from "./db";
import { requireOutreachUtcSession } from "./outreach-clock";
import { assertAccountWorkAllowed } from "./account-work-fence";
import {
  candidateReviewProjection,
  candidateRevision,
} from "./candidate-review";

type Actor = { userId: number; credentialHash: string | null };
type Tx = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
const operation = "partnership.progress";
const projection = {
  id: partnershipOutcomes.id,
  matchId: partnershipOutcomes.matchId,
  outcome: partnershipOutcomes.outcome,
  notes: partnershipOutcomes.notes,
  outcomeDate: partnershipOutcomes.outcomeDate,
  createdAt: partnershipOutcomes.createdAt,
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
function failure(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "Partnership progress is temporarily unavailable. No change is confirmed; refresh before retrying the same action.",
  });
}
async function review(
  tx: Tx,
  actor: Actor,
  input: { accountId: number; prospectId: number },
  write: boolean
) {
  if (actor.userId !== input.accountId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your signed-in account changed. Refresh before continuing.",
    });
  await requireOutreachUtcSession(tx);
  const [owner] = await tx
    .select({
      verified: users.emailVerified,
      deletionFencedAt: users.deletionFencedAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, actor.userId))
    .for(write ? "update" : "share");
  if (owner?.verified !== 1 || owner.passwordHash !== actor.credentialHash)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "A current verified account is required.",
    });
  assertAccountWorkAllowed(owner);
  const [candidate] = await tx
    .select(candidateReviewProjection)
    .from(prospects)
    .where(
      and(
        eq(prospects.id, input.prospectId),
        eq(prospects.userId, actor.userId)
      )
    )
    .for("share");
  if (!candidate)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Candidate not found in this account.",
    });
  const [broken] = await tx
    .select({ id: partnershipOutcomes.id })
    .from(partnershipOutcomes)
    .leftJoin(
      matches,
      and(
        eq(matches.id, partnershipOutcomes.matchId),
        eq(matches.userId, actor.userId),
        eq(matches.prospectId, input.prospectId)
      )
    )
    .where(
      and(
        eq(partnershipOutcomes.userId, actor.userId),
        eq(partnershipOutcomes.prospectId, input.prospectId),
        isNull(matches.id)
      )
    )
    .limit(1);
  if (broken) throw new Error("progress_ownership_review_required");
  const [assessment] = await tx
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.userId, actor.userId),
        eq(matches.prospectId, input.prospectId)
      )
    )
    .orderBy(desc(matches.id))
    .limit(1);
  const [latest] = await tx
    .select(projection)
    .from(partnershipOutcomes)
    .where(
      and(
        eq(partnershipOutcomes.userId, actor.userId),
        eq(partnershipOutcomes.prospectId, input.prospectId)
      )
    )
    .orderBy(desc(partnershipOutcomes.id))
    .limit(1);
  return {
    assessmentId: assessment?.id ?? null,
    token: hash([
      candidateRevision(candidate),
      assessment?.id ?? null,
      latest ?? null,
    ]),
  };
}

export async function listPartnershipProgress(
  input: z.infer<typeof progressListSchema> & Actor
) {
  const { userId, credentialHash, ...raw } = input;
  const command = progressListSchema.parse(raw);
  try {
    const db = await getDb();
    if (!db) throw new Error("storage_unavailable");
    return await db.transaction(
      async tx => {
        const current = await review(
          tx,
          { userId, credentialHash },
          command,
          false
        );
        const rows = await tx
          .select(projection)
          .from(partnershipOutcomes)
          .where(
            and(
              eq(partnershipOutcomes.userId, userId),
              eq(partnershipOutcomes.prospectId, command.prospectId),
              command.beforeId
                ? lt(partnershipOutcomes.id, command.beforeId)
                : undefined
            )
          )
          .orderBy(desc(partnershipOutcomes.id))
          .limit(21);
        return {
          accountId: userId,
          prospectId: command.prospectId,
          assessmentAvailable: current.assessmentId !== null,
          review: current.token,
          history: rows.slice(0, 20),
          nextBeforeId: rows.length > 20 ? rows[19].id : null,
          notice:
            "Owner-reported progress is not independently verified. Legacy history may have unreviewed provenance. No agreement, consent, provider action or send is verified.",
        };
      },
      { isolationLevel: "repeatable read" }
    );
  } catch (error) {
    failure(error);
  }
}

export async function recordPartnershipProgress(
  input: z.infer<typeof progressRecordSchema> & Actor & { requestId: string }
) {
  const { userId, credentialHash, requestId, ...raw } = input;
  const command = progressRecordSchema.parse(raw),
    requestHash = hash(command);
  try {
    const db = await getDb();
    if (!db) throw new Error("storage_unavailable");
    return await db.transaction(
      async tx => {
        const current = await review(
          tx,
          { userId, credentialHash },
          command,
          true
        );
        const [receipt] = await tx
          .select()
          .from(idempotencyRecords)
          .where(
            and(
              eq(idempotencyRecords.userId, userId),
              eq(idempotencyRecords.operation, operation),
              eq(idempotencyRecords.idempotencyKey, command.idempotencyKey)
            )
          )
          .limit(1);
        if (receipt) {
          if (receipt.result.requestHash !== requestHash)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This retry key belongs to different content. Refresh before recording another outcome.",
            });
          const [saved] = await tx
            .select(projection)
            .from(partnershipOutcomes)
            .where(
              and(
                eq(partnershipOutcomes.id, Number(receipt.result.outcomeId)),
                eq(partnershipOutcomes.userId, userId),
                eq(partnershipOutcomes.prospectId, command.prospectId)
              )
            );
          if (
            !saved ||
            saved.outcome !== command.outcome ||
            saved.notes !== command.notes ||
            saved.matchId !== receipt.result.matchId
          )
            throw new Error("progress_receipt_invalid");
          return { replayed: true, outcome: saved };
        }
        if (current.token !== command.expectedReview)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Candidate, assessment or progress changed after review. Refresh before recording.",
          });
        if (!current.assessmentId)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Assess this candidate before recording partnership progress.",
          });
        const [counts] = await tx
          .select({
            total: sql<number>`count(*)`,
            candidate: sql<number>`COALESCE(SUM(${partnershipOutcomes.prospectId} = ${command.prospectId}),0)`,
          })
          .from(partnershipOutcomes)
          .where(eq(partnershipOutcomes.userId, userId));
        const total = Number(counts.total),
          candidateCount = Number(counts.candidate);
        if (
          ![total, candidateCount].every(
            value => Number.isSafeInteger(value) && value >= 0
          ) ||
          candidateCount > total
        )
          throw new Error("progress_capacity_unknown");
        if (total >= 500 || candidateCount >= 50)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Retained progress capacity reached (500 per account or 50 per candidate). No history was removed. Operator review is required.",
          });
        const [created] = await tx
          .insert(partnershipOutcomes)
          .values({
            userId,
            prospectId: command.prospectId,
            matchId: current.assessmentId,
            outcome: command.outcome,
            notes: command.notes,
            outcomeDate: sql`CURRENT_TIMESTAMP`,
          })
          .$returningId();
        const [saved] = await tx
          .select(projection)
          .from(partnershipOutcomes)
          .where(
            and(
              eq(partnershipOutcomes.id, created.id),
              eq(partnershipOutcomes.userId, userId)
            )
          );
        if (!saved) throw new Error("progress_readback_failed");
        await tx.insert(idempotencyRecords).values({
          userId,
          operation,
          idempotencyKey: command.idempotencyKey,
          result: {
            requestHash,
            outcomeId: created.id,
            matchId: current.assessmentId,
          },
        });
        await appendWorkspaceAudit(tx, {
          userId,
          requestId,
          action: operation,
          entityType: "partnership_outcome",
          entityId: String(created.id),
          outcome: "success",
          metadata: {
            prospectId: command.prospectId,
            matchId: current.assessmentId,
            reportedOutcome: command.outcome,
          },
        });
        return { replayed: false, outcome: saved };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    failure(error);
  }
}
import { appendWorkspaceAudit } from "./capacity";
