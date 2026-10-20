import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  prospects,
  users,
} from "../drizzle/schema";
import {
  candidateIntakeSchema,
  candidateAddSchema,
  type CandidateIntake,
  type CandidateAdd,
} from "../shared/candidate-intake";
import { getDb } from "./db";
import {
  candidateReviewProjection,
  candidateRevision,
} from "./candidate-review";
import { candidateStorageError } from "./candidate-workspace";
import { resolveOutreachSource } from "./outreach-source-policy";
import { availableCapacity } from "./capacity";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const operation = "prospect.add";
function checkAccount(accountId: number, userId: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0 || accountId !== userId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "The signed-in account changed. Review intake for the current account.",
    });
}
function sourceFor(input: CandidateIntake) {
  // Collection is separate from permission to contact; suppressions may be added.
  const source = resolveOutreachSource({
    platform: input.candidate.platform,
    profileUrl: input.candidate.profileUrl,
  });
  if (!source.allowed || !source.sourceId)
    throw new TRPCError({ code: "FORBIDDEN", message: source.reason });
  return source.sourceId;
}
async function reviewedMatches(
  tx: Transaction,
  input: CandidateIntake,
  lock: boolean
) {
  const owner = eq(prospects.userId, input.accountId);
  const profileQuery = input.candidate.profileUrl
    ? tx
        .select(candidateReviewProjection)
        .from(prospects)
        .where(and(owner, eq(prospects.profileUrl, input.candidate.profileUrl)))
        .limit(1)
    : null;
  const [exact] = profileQuery
    ? await (lock ? profileQuery.for("share") : profileQuery)
    : [];
  const namesQuery = tx
    .select(candidateReviewProjection)
    .from(prospects)
    .where(
      and(
        owner,
        eq(prospects.name, input.candidate.name),
        exact ? ne(prospects.id, exact.id) : undefined
      )
    )
    .orderBy(asc(prospects.id))
    .limit(21);
  const names = await (lock ? namesQuery.for("share") : namesQuery);
  const matches = exact ? [exact, ...names] : names;
  const hasMore = matches.length > 20;
  // Include the extra sentinel in the review hash, but expose at most 20 rows.
  const reviewToken = hash({
    version: "intake-v1",
    input,
    candidates: matches.map(candidateRevision),
    hasMore,
  });
  return {
    reviewToken,
    hasMore,
    exactProfileId: exact?.id ?? null,
    candidates: matches.slice(0, 20).map(row => ({
      id: row.id,
      name: row.name,
      title: row.title,
      location: row.location,
      platform: row.platform,
      profileUrl: row.profileUrl,
      consentStatus: row.consentStatus,
      archivedAt: row.archivedAt,
      matchKind:
        row.id === exact?.id ? ("profile_url" as const) : ("name" as const),
    })),
  };
}

/** POST-only preview: private candidate input must not be put in URL/query logs. */
export async function previewCandidateIntake(
  raw: CandidateIntake,
  userId: number
) {
  const parsed = candidateIntakeSchema.safeParse(raw);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid candidate intake.",
    });
  const input = parsed.data;
  checkAccount(input.accountId, userId);
  sourceFor(input);
  try {
    const db = await getDb();
    if (!db) throw new Error("intake_storage_unavailable");
    return await db.transaction(tx => reviewedMatches(tx, input, false), {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    });
  } catch (error) {
    return candidateStorageError(error);
  }
}

export async function addReviewedCandidate(
  raw: CandidateAdd,
  userId: number,
  requestId: string
) {
  const parsed = candidateAddSchema.safeParse(raw);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Review valid candidate data and select how to resolve duplicates.",
    });
  const input = parsed.data;
  checkAccount(input.accountId, userId);
  const reviewInput = {
    accountId: input.accountId,
    candidate: input.candidate,
    declaration: input.declaration,
  };
  const requestHash = hash(input);
  try {
    const db = await getDb();
    if (!db) throw new Error("intake_storage_unavailable");
    return await db.transaction(
      async tx => {
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
        const [receipt] = await tx
          .select()
          .from(idempotencyRecords)
          .where(
            and(
              eq(idempotencyRecords.userId, userId),
              eq(idempotencyRecords.operation, operation),
              eq(idempotencyRecords.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1)
          .for("update");
        if (receipt) {
          if (receipt.result.requestHash !== requestHash)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This intake key belongs to a different submission. Inspect saved candidates before starting again.",
            });
          const { candidateId, created } = receipt.result;
          if (
            typeof candidateId !== "number" ||
            !Number.isSafeInteger(candidateId) ||
            candidateId <= 0 ||
            typeof created !== "boolean"
          )
            throw new Error("invalid_intake_receipt");
          const [saved] = await tx
            .select({ id: prospects.id })
            .from(prospects)
            .where(
              and(eq(prospects.id, candidateId), eq(prospects.userId, userId))
            )
            .limit(1);
          if (!saved) throw new Error("intake_receipt_target_missing");
          return { candidateId, created, replayed: true };
        }
        const sourceId = sourceFor(reviewInput);
        const review = await reviewedMatches(tx, reviewInput, true);
        if (review.reviewToken !== input.reviewToken)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Candidate data or possible duplicates changed. Preview and review the latest details before saving.",
          });
        let candidateId: number;
        const created = input.resolution.kind === "create_new";
        if (input.resolution.kind === "use_existing") {
          const selectedId = input.resolution.candidateId;
          if (
            review.exactProfileId !== null &&
            selectedId !== review.exactProfileId
          )
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Reuse the existing matching profile. A name-only match cannot replace its source or contact history.",
            });
          const selected = review.candidates.find(row => row.id === selectedId);
          if (!selected)
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "Select a candidate shown in this account's reviewed suggestions.",
            });
          // Reuse is a navigation decision, never permission renewal or data merge.
          candidateId = selected.id;
        } else {
          if (review.exactProfileId !== null || review.hasMore)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "An existing profile or too many possible duplicates need review. Reuse an existing candidate or refine intake.",
            });
          await availableCapacity(tx, "prospects", userId);
          const [inserted] = await tx
            .insert(prospects)
            .values({
              ...input.candidate,
              userId,
              sourceKind: "manual",
              importProvenance: {
                ...input.declaration,
                version: "2026-09-13-direct-data-v1",
                actorId: userId,
                sourceId,
                importKey: input.idempotencyKey,
                requestHash,
                declaredAt: new Date().toISOString(),
              },
            })
            .$returningId();
          if (!inserted) throw new Error("intake_insert_missing");
          candidateId = inserted.id;
        }
        await appendWorkspaceAudit(tx, {
          userId,
          requestId,
          action: operation,
          outcome: "success",
          entityType: "prospect",
          entityId: String(candidateId),
          metadata: { created, sourceId, resolution: input.resolution.kind },
        });
        await tx.insert(idempotencyRecords).values({
          userId,
          operation,
          idempotencyKey: input.idempotencyKey,
          result: { requestHash, candidateId, created },
        });
        return { candidateId, created, replayed: false };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    return candidateStorageError(error);
  }
}
import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";
import { appendWorkspaceAudit } from "./capacity";
