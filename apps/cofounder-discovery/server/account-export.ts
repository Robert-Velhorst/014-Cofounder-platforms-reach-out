import { TRPCError } from "@trpc/server";
import { eq, getTableName, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  accountExportQuotas,
  auditEvents,
  matches,
  prospects,
  users,
} from "../drizzle/schema";
import { accountExportSchema } from "../shared/account-export";
import { accountExportPlan } from "./account-export-inventory";
import { verifyPassword } from "./auth-password";
import { requireOutreachUtcSession } from "./outreach-clock";
import { getDb } from "./db";

const maxBytes = 20 * 1024 * 1024,
  maxRows = 100000;
// Bound concurrent generation per process. Do not queue private payloads or
// passwords here. This is separate from the durable account attempt quota.
let activeExports = 0;
type Input = z.infer<typeof accountExportSchema> & {
  userId: number;
  credentialHash: string | null;
  requestId: string;
};
type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
async function requireReviewedDatabaseSchema(
  tx: Transaction,
  plan: ReturnType<typeof accountExportPlan>
) {
  const [rows] = await tx.execute(
    sql`SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`
  );
  const actual = (
    rows as unknown as Array<{ table_name: string; column_name: string }>
  )
    .map(row => `${row.table_name}.${row.column_name}`)
    .sort();
  const expected = plan.flatMap(entry =>
    Object.values(entry.columns).map(
      column => `${getTableName(entry.table)}.${column.name}`
    )
  );
  // Drizzle bookkeeping is the sole non-product table permitted in this schema.
  expected.push(
    "__drizzle_migrations.id",
    "__drizzle_migrations.hash",
    "__drizzle_migrations.created_at"
  );
  if (JSON.stringify(actual) !== JSON.stringify(expected.sort()))
    throw new Error("account_export_live_schema_review_required");
}
function tooLarge(): never {
  throw new TRPCError({
    code: "PAYLOAD_TOO_LARGE",
    message:
      "Account export exceeds 20 MiB or 100000 records. No partial file was produced. An operator-assisted export is required.",
  });
}

export async function exportAccountData(input: Input) {
  const { userId, credentialHash, requestId, ...raw } = input;
  const parsed = accountExportSchema.safeParse(raw);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Confirm your current account and password before exporting.",
    });
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    userId !== parsed.data.accountId
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your signed-in account changed. Refresh before exporting.",
    });
  if (activeExports >= 2)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Account export is busy. No export was started. Please try again shortly.",
    });
  activeExports++;
  try {
    const plan = accountExportPlan();
    const db = await getDb();
    if (!db) throw new Error("account_export_storage_unavailable");
    // Commit admission separately: wrong passwords and failed exports must not
    // refund guesses. The account lock coordinates attempts across processes.
    await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
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
            message: "A current verified account is required to export.",
          });
        assertAccountWorkAllowed(owner);
        await tx
          .insert(accountExportQuotas)
          .values({ userId, attempts: 0, expiresAt: sql`CURRENT_TIMESTAMP` })
          .onDuplicateKeyUpdate({ set: { userId } });
        const [quota] = await tx
          .select({
            attempts: accountExportQuotas.attempts,
            expired: sql<number>`${accountExportQuotas.expiresAt} <= CURRENT_TIMESTAMP`,
          })
          .from(accountExportQuotas)
          .where(eq(accountExportQuotas.userId, userId))
          .for("update");
        const used = Number(quota.expired) ? 0 : quota.attempts;
        if (!Number.isSafeInteger(used) || used < 0)
          throw new Error("invalid_export_quota");
        if (used >= 5)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Account export permits five attempts per 15 minutes. Wait before trying again.",
          });
        await tx
          .update(accountExportQuotas)
          .set({
            attempts: used + 1,
            ...(Number(quota.expired)
              ? {
                  expiresAt: sql`DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)`,
                }
              : {}),
          })
          .where(eq(accountExportQuotas.userId, userId));
      },
      { isolationLevel: "read committed" }
    );
    return await db.transaction(
      async tx => {
        await requireOutreachUtcSession(tx);
        await requireReviewedDatabaseSchema(tx, plan);
        const [owner] = await tx
          .select({
            passwordHash: users.passwordHash,
            deletionFencedAt: users.deletionFencedAt,
            verified: users.emailVerified,
            nowMs: sql<number>`UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000`,
          })
          .from(users)
          .where(eq(users.id, userId))
          .for("share");
        if (owner?.verified !== 1)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "A current verified account is required to export.",
          });
        assertAccountWorkAllowed(owner);
        if (!owner.passwordHash || owner.passwordHash !== credentialHash)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "The account credentials changed. Sign in again before exporting.",
          });
        if (!(await verifyPassword(parsed.data.password, owner.passwordHash)))
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Password confirmation failed. Check your current password and try again.",
          });
        const generatedAt = new Date(Number(owner.nowMs));
        if (!Number.isFinite(generatedAt.getTime()))
          throw new Error("account_export_clock_unavailable");
        const data: Record<string, unknown[]> = {},
          categories: Record<string, unknown> = {};
        let totalRows = 0,
          rawBytes = 0;
        for (const entry of plan) {
          const { key, rule, table, columns, projection } = entry;
          if (rule.scope === "service") {
            categories[key] = {
              scope: "service",
              included: false,
              reason: rule.reason,
            };
            continue;
          }
          const owned =
            rule.scope === "match"
              ? inArray(
                  columns[rule.ownerField],
                  tx
                    .select({ id: matches.id })
                    .from(matches)
                    .where(eq(matches.userId, userId))
                )
              : rule.scope === "prospect"
                ? inArray(
                    columns[rule.ownerField],
                    tx
                      .select({ id: prospects.id })
                      .from(prospects)
                      .where(eq(prospects.userId, userId))
                  )
                : eq(columns[rule.ownerField], userId);
          const lengths = rule.fields.map(
            field =>
              sql`COALESCE(OCTET_LENGTH(CAST(${columns[field]} AS CHAR)),0)`
          );
          const [size] = await tx
            .select({
              rows: sql<number>`count(*)`,
              bytes: sql<number>`COALESCE(SUM(${sql.join(lengths, sql` + `)}),0)`,
            })
            .from(table)
            .where(owned);
          const rowCount = Number(size.rows),
            bytes = Number(size.bytes);
          if (
            ![rowCount, bytes].every(
              value => Number.isSafeInteger(value) && value >= 0
            )
          )
            throw new Error("invalid_export_preflight");
          totalRows += rowCount;
          rawBytes += bytes;
          if (totalRows > maxRows || rawBytes > maxBytes) tooLarge();
          const order = columns.id ?? columns.userId;
          const rows = await tx
            .select(projection)
            .from(table)
            .where(owned)
            .orderBy(order)
            .limit(maxRows + 1);
          if (rows.length !== rowCount)
            throw new Error("inconsistent_account_export_snapshot");
          data[key] = rows;
          categories[key] = {
            scope: rule.scope,
            included: true,
            count: rows.length,
            fields: rule.fields,
            excludedFields: rule.excludedFields,
          };
        }
        const format = "cofounder-account-v1" as const;
        const json = JSON.stringify({
          format,
          accountId: userId,
          generatedAt: generatedAt.toISOString(),
          scope:
            "Retained account-owned application records, including archived and legacy records, with disclosed security and unreviewed-payload exclusions. Not a database backup or a complete legal access-response determination.",
          categories,
          data,
        });
        const byteLength = Buffer.byteLength(json, "utf8");
        if (byteLength > maxBytes) tooLarge();
        await requireReviewedDatabaseSchema(tx, plan);
        await tx.insert(auditEvents).values({
          userId,
          requestId,
          action: "account.export",
          outcome: "success",
          entityType: "account",
          entityId: String(userId),
          metadata: {
            format,
            totalRows,
            byteLength,
            categoryCount: plan.length,
          },
        });
        return {
          accountId: userId,
          format,
          byteLength,
          totalRows,
          json,
          filename: `cofounder-account-${generatedAt.toISOString().slice(0, 10)}.json`,
        };
      },
      { isolationLevel: "repeatable read" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Account export is temporarily unavailable. No partial file was produced.",
    });
  } finally {
    activeExports--;
  }
}
import { assertAccountWorkAllowed } from "./account-work-fence";
