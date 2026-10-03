import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { accountMailJobs, accountMailQuotas } from "../drizzle/schema";
import { getConfig } from "./config";
import { getDb } from "./db";

type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
const batchSize = 100;
const terminal = ["accepted", "discarded", "failed"] as const;
const noLiveLease = () =>
  or(
    isNull(accountMailJobs.leaseUntil),
    lte(accountMailJobs.leaseUntil, sql`CURRENT_TIMESTAMP`)
  );
async function requireUtc(tx: Transaction) {
  // Existing queue/request writers bind UTC text with Drizzle's Date mapper.
  // Refuse destructive work if this connection would reinterpret that text.
  const [rows] = await tx.execute(
    sql`SELECT TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CURRENT_TIMESTAMP()) AS offset_seconds`
  );
  if (
    Number(
      (rows as unknown as Array<{ offset_seconds: number }>)[0]?.offset_seconds
    ) !== 0
  )
    throw new Error("retention_requires_utc_session");
}

/** Opt-in maintenance only. Each bounded phase commits independently. No provider
 * calls, user/token mutations, outreach history deletion or budget-counter reset. */
export async function cleanupAccountMail() {
  if (!getConfig().ENABLE_ACCOUNT_MAIL_RETENTION)
    return {
      status: "disabled" as const,
      expiredJobs: 0,
      deletedJobs: 0,
      deletedQuotas: 0,
    };
  try {
    const db = await getDb();
    if (!db) throw new Error("retention_storage_unavailable");
    const expiredJobs = await db.transaction(
      async tx => {
        await requireUtc(tx);
        const rows = await tx
          .select({ id: accountMailJobs.id, state: accountMailJobs.state })
          .from(accountMailJobs)
          .where(
            and(
              lte(accountMailJobs.expiresAt, sql`CURRENT_TIMESTAMP`),
              noLiveLease(),
              or(
                isNotNull(accountMailJobs.payload),
                inArray(accountMailJobs.state, ["queued", "sending"])
              )
            )
          )
          .orderBy(accountMailJobs.expiresAt, accountMailJobs.id)
          .limit(batchSize)
          .for("update", { skipLocked: true });
        for (const row of rows)
          await tx
            .update(accountMailJobs)
            .set({
              payload: null,
              leaseUntil: null,
              state:
                row.state === "queued" || row.state === "sending"
                  ? "discarded"
                  : row.state,
            })
            .where(eq(accountMailJobs.id, row.id));
        return rows.length;
      },
      { isolationLevel: "read committed" }
    );
    const deletedJobs = await db.transaction(
      async tx => {
        await requireUtc(tx);
        const rows = await tx
          .select({ id: accountMailJobs.id })
          .from(accountMailJobs)
          .where(
            and(
              inArray(accountMailJobs.state, Array.from(terminal)),
              isNull(accountMailJobs.payload),
              noLiveLease(),
              lt(
                accountMailJobs.expiresAt,
                sql`CURRENT_TIMESTAMP - INTERVAL 7 DAY`
              )
            )
          )
          .orderBy(accountMailJobs.expiresAt, accountMailJobs.id)
          .limit(batchSize)
          .for("update", { skipLocked: true });
        // A large IN list can become a full scan that locks a rival's rows.
        // Point deletes stay inside the already-selected primary-key locks.
        for (const row of rows)
          await tx
            .delete(accountMailJobs)
            .where(eq(accountMailJobs.id, row.id));
        return rows.length;
      },
      { isolationLevel: "read committed" }
    );
    const deletedQuotas = await db.transaction(
      async tx => {
        await requireUtc(tx);
        const rows = await tx
          .select({ key: accountMailQuotas.key })
          .from(accountMailQuotas)
          .where(
            and(
              lte(accountMailQuotas.expiresAt, sql`CURRENT_TIMESTAMP`),
              // Reviewed recovery/verification admission HMAC keys. Fixed dispatch keys and
              // unknown/future namespaces must survive even after their expiry.
              sql`REGEXP_LIKE(${accountMailQuotas.key}, '^[0-9a-f]{64}$', 'c')`
            )
          )
          .orderBy(accountMailQuotas.expiresAt, accountMailQuotas.key)
          .limit(batchSize)
          .for("update", { skipLocked: true });
        for (const row of rows)
          await tx
            .delete(accountMailQuotas)
            .where(eq(accountMailQuotas.key, row.key));
        return rows.length;
      },
      { isolationLevel: "read committed" }
    );
    return {
      status: "completed" as const,
      expiredJobs,
      deletedJobs,
      deletedQuotas,
    };
  } catch {
    throw new Error("Account mail retention failed.");
  }
}
