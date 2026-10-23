import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { auditEvents, prospects, users } from "../drizzle/schema";
import { getDb } from "./db";
import {
  MAX_CSV_EXPORT_ROWS,
  MAX_CSV_EXPORT_BYTES,
  prospectsToCsv,
} from "./prospect-csv";
import { candidateStorageError } from "./candidate-workspace";

export async function exportActiveCandidates(input: {
  userId: number;
  accountId: number;
  requestId: string;
}) {
  if (input.accountId !== input.userId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "The signed-in account changed. Refresh before exporting.",
    });
  try {
    const db = await getDb();
    if (!db) throw new Error("candidate_storage_unavailable");
    return await db.transaction(
      async tx => {
        const [owner] = await tx
          .select({
            id: users.id,
            emailVerified: users.emailVerified,
            deletionFencedAt: users.deletionFencedAt,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1)
          .for("share");
        if (!owner || owner.emailVerified !== 1)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "A current verified account is required to export.",
          });
        assertAccountWorkAllowed(owner);
        const ownedActive = and(
          eq(prospects.userId, input.userId),
          isNull(prospects.archivedAt)
        );
        // Inspect sizes before loading legacy TEXT/JSON payloads. Both reads use
        // the same snapshot, so concurrent edits cannot bypass this memory bound.
        const sizes = await tx
          .select({
            bytes: sql<number>`COALESCE(OCTET_LENGTH(${prospects.name}),0) + COALESCE(OCTET_LENGTH(${prospects.title}),0) + COALESCE(OCTET_LENGTH(${prospects.location}),0) + COALESCE(OCTET_LENGTH(${prospects.bio}),0) + COALESCE(OCTET_LENGTH(${prospects.skills}),0) + COALESCE(OCTET_LENGTH(${prospects.industries}),0) + COALESCE(OCTET_LENGTH(${prospects.platform}),0) + COALESCE(OCTET_LENGTH(${prospects.profileUrl}),0) + COALESCE(OCTET_LENGTH(${prospects.consentStatus}),0)`,
          })
          .from(prospects)
          .where(ownedActive)
          .orderBy(asc(prospects.id))
          .limit(MAX_CSV_EXPORT_ROWS + 1);
        if (
          sizes.length > MAX_CSV_EXPORT_ROWS ||
          sizes.reduce((sum, row) => sum + Number(row.bytes), 0) >
            MAX_CSV_EXPORT_BYTES
        )
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message:
              "CSV export exceeds 10000 active candidates or 8388608 bytes; no partial file was produced.",
          });
        // Project only the nine documented CSV columns, never raw provider payloads.
        const rows = await tx
          .select({
            name: prospects.name,
            title: prospects.title,
            location: prospects.location,
            bio: prospects.bio,
            skills: prospects.skills,
            industries: prospects.industries,
            platform: prospects.platform,
            profileUrl: prospects.profileUrl,
            consentStatus: prospects.consentStatus,
          })
          .from(prospects)
          .where(ownedActive)
          .orderBy(asc(prospects.id))
          .limit(MAX_CSV_EXPORT_ROWS + 1);
        let csv: string;
        try {
          csv = prospectsToCsv(
            rows.map(row => ({
              name: row.name,
              title: row.title ?? undefined,
              location: row.location ?? undefined,
              bio: row.bio ?? undefined,
              skills: row.skills ?? [],
              industries: row.industries ?? [],
              platform: row.platform ?? undefined,
              profileUrl: row.profileUrl ?? undefined,
              consentStatus: row.consentStatus,
            }))
          );
        } catch (error) {
          if (error instanceof RangeError)
            throw new TRPCError({
              code: "PAYLOAD_TOO_LARGE",
              message: error.message,
            });
          throw error;
        }
        const metadata = {
          scope: "active" as const,
          rowCount: rows.length,
          byteLength: Buffer.byteLength(csv, "utf8"),
          format: "spreadsheet-csv-v1" as const,
        };
        await tx.insert(auditEvents).values({
          userId: input.userId,
          requestId: input.requestId,
          action: "prospect.export",
          outcome: "success",
          entityType: "account",
          entityId: String(input.userId),
          metadata,
        });
        return {
          ...metadata,
          accountId: input.userId,
          csv,
          filename: `cofounder-active-candidates-${new Date().toISOString().slice(0, 10)}.csv`,
        };
      },
      { isolationLevel: "repeatable read" }
    );
  } catch (error) {
    return candidateStorageError(error);
  }
}
import { assertAccountWorkAllowed } from "./account-work-fence";
