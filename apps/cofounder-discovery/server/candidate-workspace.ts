import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auditEvents, prospects, users } from "../drizzle/schema";
import { importProvenanceSchema } from "../shared/import-declaration";
import { getDb } from "./db";
import { resolveOutreachSource } from "./outreach-source-policy";
import {
  candidateReviewProjection,
  candidateRevision,
} from "./candidate-review";
import { candidateEditableFields } from "../shared/candidate-input";

type OwnedCandidate = { id: number; userId: number; accountId: number };
export function requireCandidateAccount(input: OwnedCandidate) {
  if (
    ![input.id, input.accountId, input.userId].every(
      value => Number.isSafeInteger(value) && value > 0
    )
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A valid candidate and reviewed account are required.",
    });
  if (input.accountId !== input.userId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "The signed-in account changed. Reload before viewing or changing this candidate.",
    });
}
export function candidateStorageError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "Candidate storage is temporarily unavailable. Please retry.",
  });
}

export async function getCandidateDetails(input: OwnedCandidate) {
  requireCandidateAccount(input);
  try {
    const db = await getDb();
    if (!db) throw new Error("candidate_storage_unavailable");
    // A concurrent opt-out must not mix old candidate status with new history.
    return await db.transaction(
      async tx => {
        // Explicit user-facing projection: no raw enrichment/provider payloads.
        const [row] = await tx
          .select(candidateReviewProjection)
          .from(prospects)
          .where(
            and(eq(prospects.id, input.id), eq(prospects.userId, input.userId))
          )
          .limit(1);
        if (!row)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found in this account.",
          });
        const parsed = importProvenanceSchema.safeParse(row.importProvenance);
        const recorded = parsed.success && parsed.data.actorId === input.userId;
        const optOutEvents = await tx
          .select({
            id: auditEvents.id,
            action: auditEvents.action,
            createdAt: auditEvents.createdAt,
          })
          .from(auditEvents)
          .where(
            and(
              eq(auditEvents.userId, input.userId),
              eq(auditEvents.entityType, "prospect"),
              eq(auditEvents.entityId, String(input.id)),
              eq(auditEvents.action, "prospect.opt_out"),
              eq(auditEvents.outcome, "success")
            )
          )
          .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
          .limit(20);
        const historyRows = await tx
          .select({
            id: auditEvents.id,
            action: auditEvents.action,
            createdAt: auditEvents.createdAt,
            metadata: auditEvents.metadata,
          })
          .from(auditEvents)
          .where(
            and(
              eq(auditEvents.userId, input.userId),
              eq(auditEvents.entityType, "prospect"),
              eq(auditEvents.entityId, String(input.id)),
              eq(auditEvents.outcome, "success"),
              inArray(auditEvents.action, [
                "prospect.edit",
                "prospect.archive",
                "prospect.restore",
                "prospect.opt_out",
              ])
            )
          )
          .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
          .limit(20);
        return {
          history: historyRows.map(({ metadata, ...event }) => ({
            ...event,
            fields:
              event.action === "prospect.edit" &&
              Array.isArray(metadata?.fields)
                ? candidateEditableFields.filter(field =>
                    (metadata.fields as unknown[]).includes(field)
                  )
                : [],
          })),
          revision: candidateRevision(row),
          prospect: { ...row, importProvenance: recorded ? parsed.data : null },
          provenanceStatus: recorded
            ? ("recorded" as const)
            : row.importProvenance === null
              ? ("missing" as const)
              : ("invalid" as const),
          sourcePolicy: resolveOutreachSource(row),
          optOutEvents,
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" }
    );
  } catch (error) {
    return candidateStorageError(error);
  }
}

/** Idempotent one-way suppression. Restoring contact needs a separate evidence workflow. */
export async function recordCandidateOptOut(
  input: OwnedCandidate & { requestId: string; confirmed: true }
) {
  requireCandidateAccount(input);
  if (input.confirmed !== true)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Confirm the opt-out before saving.",
    });
  try {
    const db = await getDb();
    if (!db) throw new Error("candidate_storage_unavailable");
    return await db.transaction(
      async tx => {
        // Same account-first serialization as draft creation and outreach preparation.
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
        const [row] = await tx
          .select({ id: prospects.id, consentStatus: prospects.consentStatus })
          .from(prospects)
          .where(
            and(eq(prospects.id, input.id), eq(prospects.userId, input.userId))
          )
          .limit(1)
          .for("update");
        if (!row)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found in this account.",
          });
        if (row.consentStatus === "opted_out")
          return { changed: false, consentStatus: "opted_out" as const };
        await tx
          .update(prospects)
          .set({ consentStatus: "opted_out" })
          .where(
            and(eq(prospects.id, input.id), eq(prospects.userId, input.userId))
          );
        await tx.insert(auditEvents).values({
          userId: input.userId,
          requestId: input.requestId,
          action: "prospect.opt_out",
          outcome: "success",
          entityType: "prospect",
          entityId: String(input.id),
          metadata: { from: row.consentStatus, to: "opted_out" },
        });
        return { changed: true, consentStatus: "opted_out" as const };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return candidateStorageError(error);
  }
}
import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";
