import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import {
  auditEvents,
  idempotencyRecords,
  outreachRecords,
  prospects,
  users,
  type OutreachRecord,
} from "../drizzle/schema";
import {
  conversationCommandSchema,
  reminderListSchema,
  isOpenConversation,
  type ConversationCommand,
} from "../shared/outreach-conversation";
import { candidateReviewProjection } from "./candidate-review";
import { outreachRevision } from "./outreach-revision";
import { getDb } from "./db";
import { requireOutreachUtcSession } from "./outreach-clock";

const operation = "outreach.conversation";
function requireAccount(userId: number, accountId: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0 || userId !== accountId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "The signed-in account changed. Reload before continuing.",
    });
}
function storageError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "Conversation storage is temporarily unavailable. Retry the same action safely.",
  });
}

/** Internal history only. No message generation, provider calls or send queue. */
export async function changeConversation(
  input: ConversationCommand & { userId: number; requestId: string }
) {
  requireAccount(input.userId, input.accountId);
  const { userId, requestId, ...raw } = input;
  const parsed = conversationCommandSchema.safeParse(raw);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A valid reviewed conversation action is required.",
    });
  const command = parsed.data;
  const requestHash = createHash("sha256")
    .update(JSON.stringify(command))
    .digest("hex");
  try {
    const db = await getDb();
    if (!db) throw new Error("conversation_storage_unavailable");
    return await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
        // Serialize with candidate edits/opt-outs and outreach admission/transitions.
        const [owner] = await tx
          .select({
            verified: users.emailVerified,
            deletionFencedAt: users.deletionFencedAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .for("update");
        if (owner?.verified !== 1)
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Verify the current account before changing conversation records.",
          });
        assertAccountWorkAllowed(owner);
        const owned = and(
          eq(outreachRecords.id, command.id),
          eq(outreachRecords.userId, userId)
        );
        const [record] = await tx
          .select()
          .from(outreachRecords)
          .where(owned)
          .limit(1)
          .for("update");
        if (!record)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Outreach record not found in this account.",
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
          .limit(1)
          .for("update");
        if (receipt) {
          if (receipt.result.requestHash !== requestHash)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This retry key belongs to different content. Reload the conversation before making another change.",
            });
          if (
            receipt.result.outreachId !== record.id ||
            receipt.result.action !== command.action
          )
            throw new Error("invalid_conversation_receipt");
          return { replayed: true, outreach: record };
        }
        if (outreachRevision(record, prospect) !== command.expectedRevision)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This conversation or candidate changed after review. Reload the latest details before continuing.",
          });
        if (
          !isOpenConversation(record.state) ||
          !record.confirmedSentAt ||
          record.closedAt
        )
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Only open conversations with recorded sent confirmation can be updated here.",
          });
        const [clock] = await tx
          .select({
            nowMs: sql<number>`UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000`,
          })
          .from(users)
          .where(eq(users.id, userId));
        const nowMs = Number(clock?.nowMs);
        if (!Number.isFinite(nowMs))
          throw new Error("conversation_clock_unavailable");
        // Normalize old follow_up_due rows: due-ness now derives from the date.
        const updates: Partial<OutreachRecord> = {
          state: record.responseRecordedAt ? "responded" : "confirmed_sent",
        };
        switch (command.action) {
          case "schedule_reminder": {
            if (prospect.archivedAt || prospect.consentStatus === "opted_out")
              throw new TRPCError({
                code: "FORBIDDEN",
                message:
                  "Reminders are unavailable for archived or opted-out candidates. History can still be recorded or closed.",
              });
            const at = new Date(command.followUpAt);
            // MySQL TIMESTAMP precision is seconds. Reject rather than truncate into the past.
            const atMs = Math.floor(at.getTime() / 1000) * 1000;
            if (
              !Number.isFinite(atMs) ||
              atMs <= nowMs ||
              atMs > nowMs + 366 * 86400000
            )
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Choose a future reminder within the next 366 days.",
              });
            updates.followUpAt = new Date(atMs);
            break;
          }
          case "cancel_reminder":
            if (!record.followUpAt)
              throw new TRPCError({
                code: "CONFLICT",
                message:
                  "There is no reminder to cancel. Reload the conversation.",
              });
            updates.followUpAt = null;
            break;
          case "record_response":
            if (record.responseRecordedAt)
              throw new TRPCError({
                code: "CONFLICT",
                message: "A response has already been recorded.",
              });
            updates.state = "responded";
            updates.responseRecordedAt = new Date(nowMs);
            updates.followUpAt = null;
            break;
          case "close":
            updates.state = "closed";
            updates.closedAt = new Date(nowMs);
            updates.followUpAt = null;
            break;
        }
        await tx.update(outreachRecords).set(updates).where(owned);
        await appendWorkspaceAudit(tx, {
          userId,
          requestId,
          action: operation,
          outcome: "success",
          entityType: "outreach",
          entityId: String(record.id),
          metadata: {
            action: command.action,
            from: record.state,
            to: updates.state,
            followUpAt: updates.followUpAt?.toISOString() ?? null,
          },
        });
        await tx.insert(idempotencyRecords).values({
          userId,
          operation,
          idempotencyKey: command.idempotencyKey,
          result: {
            requestHash,
            outreachId: record.id,
            action: command.action,
          },
        });
        const [updated] = await tx.select().from(outreachRecords).where(owned);
        if (!updated) throw new Error("missing_conversation_record");
        return { replayed: false, outreach: updated };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return storageError(error);
  }
}

export async function listReminders(
  input: z.infer<typeof reminderListSchema> & { userId: number }
) {
  requireAccount(input.userId, input.accountId);
  const { userId, ...raw } = input;
  const parsed = reminderListSchema.safeParse(raw);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Valid reminder filters are required.",
    });
  const { filter, page, pageSize } = parsed.data;
  try {
    const db = await getDb();
    if (!db) throw new Error("conversation_storage_unavailable");
    return await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
        const [owner] = await tx
          .select({
            verified: users.emailVerified,
            nowMs: sql<number>`UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000`,
          })
          .from(users)
          .where(eq(users.id, userId));
        if (owner?.verified !== 1)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Verify the current account before viewing reminders.",
          });
        const nowMs = Number(owner.nowMs);
        if (!Number.isFinite(nowMs))
          throw new Error("conversation_clock_unavailable");
        const at = new Date(nowMs);
        const where = and(
          eq(outreachRecords.userId, userId),
          eq(prospects.userId, userId),
          isNull(prospects.archivedAt),
          ne(prospects.consentStatus, "opted_out"),
          isNotNull(outreachRecords.confirmedSentAt),
          isNull(outreachRecords.closedAt),
          inArray(outreachRecords.state, [
            "confirmed_sent",
            "responded",
            "follow_up_due",
          ]),
          isNotNull(outreachRecords.followUpAt),
          filter === "due"
            ? lte(outreachRecords.followUpAt, at)
            : filter === "scheduled"
              ? gt(outreachRecords.followUpAt, at)
              : undefined
        );
        const [count] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(outreachRecords)
          .innerJoin(prospects, eq(prospects.id, outreachRecords.prospectId))
          .where(where);
        const rows = await tx
          .select({
            id: outreachRecords.id,
            prospectId: prospects.id,
            name: prospects.name,
            platform: prospects.platform,
            state: outreachRecords.state,
            followUpAt: outreachRecords.followUpAt,
          })
          .from(outreachRecords)
          .innerJoin(prospects, eq(prospects.id, outreachRecords.prospectId))
          .where(where)
          .orderBy(asc(outreachRecords.followUpAt), asc(outreachRecords.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize);
        return {
          accountId: userId,
          asOf: at,
          total: Number(count.total),
          page,
          pageSize,
          items: rows.map(row => ({
            ...row,
            due: !!row.followUpAt && row.followUpAt.getTime() <= nowMs,
          })),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" }
    );
  } catch (error) {
    return storageError(error);
  }
}
import { assertAccountWorkAllowed } from "./account-work-fence";
import { appendWorkspaceAudit } from "./capacity";
