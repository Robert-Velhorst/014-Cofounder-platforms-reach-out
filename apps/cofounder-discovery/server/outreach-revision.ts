import { createHash, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  auditEvents,
  idempotencyRecords,
  matches,
  outreachRecords,
  prospects,
  users,
  type OutreachRecord,
} from "../drizzle/schema";
import {
  outreachCancelSchema,
  outreachReviseSchema,
  isUnsentOutreachState,
} from "../shared/outreach-revision";
import {
  candidateReviewProjection,
  candidateRevision,
} from "./candidate-review";
import { getDb } from "./db";
import { requireOutreachUtcSession } from "./outreach-clock";
import {
  declareOutreachSource,
  resolveOutreachSource,
} from "./outreach-source-policy";
import { availableCapacity } from "./capacity";

type Identity = { id: number; accountId: number; userId: number };
type Command = (
  z.infer<typeof outreachCancelSchema> | z.infer<typeof outreachReviseSchema>
) & { userId: number; requestId: string };
const operation = "outreach.revise";
function requireAccount(input: Identity) {
  if (
    ![input.id, input.userId, input.accountId].every(
      value => Number.isSafeInteger(value) && value > 0
    )
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A valid outreach record and reviewed account are required.",
    });
  if (input.accountId !== input.userId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "The signed-in account changed. Reload before changing this outreach.",
    });
}
function storageError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "Outreach storage is temporarily unavailable. Please try again.",
  });
}
export function outreachRevision(
  record: OutreachRecord,
  prospect: Parameters<typeof candidateRevision>[0]
) {
  const fields = (Object.keys(record) as (keyof OutreachRecord)[])
    .sort()
    .map(key => [key, record[key]]);
  return createHash("sha256")
    .update(JSON.stringify([fields, candidateRevision(prospect)]))
    .digest("hex");
}
function canChange(record: OutreachRecord) {
  return (
    isUnsentOutreachState(record.state) &&
    !record.confirmedSentAt &&
    !record.responseRecordedAt &&
    !record.closedAt
  );
}

export async function getOutreachDetails(input: Identity) {
  requireAccount(input);
  try {
    const db = await getDb();
    if (!db) throw new Error("outreach_storage_unavailable");
    return await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
        const [record] = await tx
          .select()
          .from(outreachRecords)
          .where(
            and(
              eq(outreachRecords.id, input.id),
              eq(outreachRecords.userId, input.userId)
            )
          )
          .limit(1);
        if (!record)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Outreach record not found.",
          });
        const [prospect] = await tx
          .select(candidateReviewProjection)
          .from(prospects)
          .where(
            and(
              eq(prospects.id, record.prospectId),
              eq(prospects.userId, input.userId)
            )
          )
          .limit(1);
        if (!prospect)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found in this account.",
          });
        const [replacement] = await tx
          .select({ id: outreachRecords.id })
          .from(outreachRecords)
          .where(
            and(
              eq(outreachRecords.revisesId, record.id),
              eq(outreachRecords.userId, input.userId)
            )
          )
          .limit(1);
        return {
          outreach: record,
          prospect: {
            id: prospect.id,
            userId: prospect.userId,
            name: prospect.name,
            platform: prospect.platform,
            profileUrl: prospect.profileUrl,
            consentStatus: prospect.consentStatus,
            archivedAt: prospect.archivedAt,
          },
          revision: outreachRevision(record, prospect),
          replacementId: replacement?.id ?? null,
          canChange: canChange(record),
          revisionPolicy: resolveOutreachSource(prospect),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" }
    );
  } catch (error) {
    return storageError(error);
  }
}

/** A new immutable record ID ensures stale action buttons cannot target new text. */
export async function changeOutreachDraft(
  input: Command,
  action: "revise" | "cancel"
) {
  requireAccount(input);
  const { userId, requestId, ...command } = input;
  const parsed =
    action === "revise"
      ? outreachReviseSchema.safeParse(command)
      : outreachCancelSchema.safeParse(command);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Valid reviewed outreach changes and not-sent confirmation are required.",
    });
  const revised =
    action === "revise" ? outreachReviseSchema.parse(parsed.data) : null;
  const requestHash = createHash("sha256")
    .update(JSON.stringify(parsed.data))
    .digest("hex");
  try {
    const db = await getDb();
    if (!db) throw new Error("outreach_storage_unavailable");
    return await db.transaction(
      async tx => {
        // Same account -> outreach -> prospect order as draft admission/transitions.
        const [owner] = await tx
          .select({
            id: users.id,
            deletionFencedAt: users.deletionFencedAt,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.id, userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found.",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        const whereRecord = and(
          eq(outreachRecords.id, input.id),
          eq(outreachRecords.userId, userId)
        );
        const [record] = await tx
          .select()
          .from(outreachRecords)
          .where(whereRecord)
          .limit(1)
          .for("update");
        if (!record)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Outreach record not found.",
          });
        const [prospect] = await tx
          .select(candidateReviewProjection)
          .from(prospects)
          .where(
            and(
              eq(prospects.id, record.prospectId),
              eq(prospects.userId, userId)
            )
          )
          .limit(1)
          .for("share");
        if (!prospect)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found in this account.",
          });
        if (revised) {
          const [receipt] = await tx
            .select()
            .from(idempotencyRecords)
            .where(
              and(
                eq(idempotencyRecords.userId, userId),
                eq(idempotencyRecords.operation, operation),
                eq(idempotencyRecords.idempotencyKey, revised.idempotencyKey)
              )
            )
            .limit(1)
            .for("update");
          if (receipt) {
            if (receipt.result.requestHash !== requestHash)
              throw new TRPCError({
                code: "CONFLICT",
                message:
                  "This revision key belongs to different reviewed content. Inspect your drafts before starting another revision.",
              });
            const childId = receipt.result.outreachId;
            if (
              typeof childId !== "number" ||
              !Number.isSafeInteger(childId) ||
              childId <= 0
            )
              throw new Error("invalid_revision_receipt");
            const [child] = await tx
              .select()
              .from(outreachRecords)
              .where(
                and(
                  eq(outreachRecords.id, childId),
                  eq(outreachRecords.userId, userId),
                  eq(outreachRecords.revisesId, record.id)
                )
              )
              .limit(1);
            if (!child) throw new Error("missing_revision_record");
            // Return its current state. Never revive a subsequently cancelled child.
            return { changed: false, replayed: true, outreach: child };
          }
        } else if (record.state === "cancelled") {
          return { changed: false, replayed: true, outreach: record };
        }
        if (!canChange(record))
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Only unsent, active drafts can be revised or cancelled. Historical sent records must be preserved.",
          });
        if (outreachRevision(record, prospect) !== input.expectedRevision)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This outreach or candidate changed after your review. Reload the latest details before continuing.",
          });
        if (!revised) {
          await tx
            .update(outreachRecords)
            .set({ state: "cancelled", closedAt: new Date() })
            .where(whereRecord);
          await appendWorkspaceAudit(tx, {
            userId,
            requestId,
            action: "outreach.cancel",
            outcome: "success",
            entityType: "outreach",
            entityId: String(record.id),
            metadata: { from: record.state, notSent: true },
          });
          const [updated] = await tx
            .select()
            .from(outreachRecords)
            .where(whereRecord);
          return { changed: true, replayed: false, outreach: updated };
        }
        if (revised.body === record.body && revised.subject === record.subject)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Change the message or subject before saving a new revision.",
          });
        const sourcePolicy = declareOutreachSource(
          {
            prospect,
            actorId: userId,
            body: revised.body,
            generationMode: "user_authored",
          },
          revised.declaration,
          new Date()
        );
        if (record.matchId !== null) {
          const [match] = await tx
            .select({ id: matches.id })
            .from(matches)
            .where(
              and(
                eq(matches.id, record.matchId),
                eq(matches.userId, userId),
                eq(matches.prospectId, record.prospectId)
              )
            )
            .limit(1)
            .for("share");
          if (!match)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Match not found for this candidate and account.",
            });
        }
        // Revisions retain the old record and therefore consume one additional slot.
        await availableCapacity(tx, "outreach", userId);
        const [created] = await tx
          .insert(outreachRecords)
          .values({
            userId,
            prospectId: record.prospectId,
            matchId: record.matchId,
            revisesId: record.id,
            body: revised.body,
            subject: revised.subject,
            generationMode: "user_authored",
            sourcePolicy,
            destinationUrl: sourcePolicy.destinationUrl,
            idempotencyKey: `revision:${randomUUID()}`,
            state: "draft",
          })
          .$returningId();
        await tx
          .update(outreachRecords)
          .set({ state: "cancelled", closedAt: new Date() })
          .where(whereRecord);
        await appendWorkspaceAudit(tx, {
          userId,
          requestId,
          action: operation,
          outcome: "success",
          entityType: "outreach",
          entityId: String(record.id),
          metadata: {
            from: record.state,
            replacementId: created.id,
            sourceId: sourcePolicy.sourceId,
            notSent: true,
          },
        });
        await tx.insert(idempotencyRecords).values({
          userId,
          operation,
          idempotencyKey: revised.idempotencyKey,
          result: { requestHash, outreachId: created.id },
        });
        const [child] = await tx
          .select()
          .from(outreachRecords)
          .where(
            and(
              eq(outreachRecords.id, created.id),
              eq(outreachRecords.userId, userId)
            )
          );
        if (!child) throw new Error("missing_new_revision");
        return { changed: true, replayed: false, outreach: child };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return storageError(error);
  }
}
import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";
import { appendWorkspaceAudit } from "./capacity";
