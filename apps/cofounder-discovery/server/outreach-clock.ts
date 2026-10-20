import { sql } from "drizzle-orm";
import type { getDb } from "./db";
type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];

/** Drizzle maps TIMESTAMP through UTC text. Refuse a session which would
 * reinterpret stored dates; never change a shared connection's timezone here. */
export async function requireOutreachUtcSession(tx: Transaction) {
  const [rows] = await tx.execute(
    sql`SELECT TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CURRENT_TIMESTAMP()) AS offset_seconds`
  );
  if (
    Number(
      (rows as unknown as Array<{ offset_seconds: number }>)[0]?.offset_seconds
    ) !== 0
  )
    throw new Error("outreach_requires_utc_session");
}
