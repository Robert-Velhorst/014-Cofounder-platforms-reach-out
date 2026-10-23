import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";

type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
type RequestSnapshot = {
  status: "none" | "pending_review" | "withdrawn";
  requestKey: string | null;
  revision: number;
  requestedAt: string | null;
  withdrawnAt: string | null;
};
async function rows<T>(tx: Transaction, query: SQL) {
  const [result] = await tx.execute(query);
  return result as unknown as T[];
}
const projection = sql`status, request_key AS requestKey, revision,
  DATE_FORMAT(requested_at, '%Y-%m-%dT%H:%i:%sZ') AS requestedAt,
  DATE_FORMAT(withdrawn_at, '%Y-%m-%dT%H:%i:%sZ') AS withdrawnAt`;
function validate(row: RequestSnapshot): RequestSnapshot {
  const date = (value: string | null) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) &&
    Number.isFinite(Date.parse(value));
  const valid =
    row.status === "none"
      ? row.revision === 0 &&
        row.requestKey === null &&
        row.requestedAt === null &&
        row.withdrawnAt === null
      : ["pending_review", "withdrawn"].includes(row.status) &&
        Number.isSafeInteger(row.revision) &&
        row.revision >= (row.status === "withdrawn" ? 2 : 1) &&
        row.revision <= 2147483647 &&
        z.string().uuid().safeParse(row.requestKey).success &&
        date(row.requestedAt) &&
        (row.status === "pending_review"
          ? row.withdrawnAt === null
          : date(row.withdrawnAt));
  if (!valid) throw new Error("deletion_request_review_required");
  return row;
}

/** Must run in the caller's UTC, read-only snapshot. No authorization is granted. */
export async function readDeletionRequestSnapshot(
  tx: Transaction,
  accountId: number
): Promise<RequestSnapshot> {
  const [row] = await rows<RequestSnapshot>(
    tx,
    sql`SELECT ${projection} FROM account_deletion_requests WHERE user_id=${accountId}`
  );
  return validate(
    row ?? {
      status: "none",
      requestKey: null,
      revision: 0,
      requestedAt: null,
      withdrawnAt: null,
    }
  );
}

/** Operator-only local diagnostic. Intentionally not exposed through an HTTP route. */
export async function listDeletionRequests(
  input: { limit?: number; afterAccountId?: number } = {}
) {
  const limit = input.limit ?? 50,
    afterAccountId = input.afterAccountId ?? 0;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(afterAccountId) ||
    afterAccountId < 0 ||
    afterAccountId > 2147483647
  )
    throw new Error("invalid_read_only_arguments");
  const db = await getDb();
  if (!db) throw new Error("deletion_storage_unavailable");
  return db.transaction(
    async tx => {
      const [clock] = await rows<{ offset: number; checkedAt: string }>(
        tx,
        sql`SELECT TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CURRENT_TIMESTAMP()) AS offset,
        DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%sZ') AS checkedAt`
      );
      if (Number(clock?.offset) !== 0)
        throw new Error("deletion_requires_utc_session");
      const page = await rows<
        RequestSnapshot & { accountId: number; accountFenced: number }
      >(
        tx,
        sql`SELECT /*+ MAX_EXECUTION_TIME(2000) */ r.user_id AS accountId, ${projection},
        u.deletion_fenced_at IS NOT NULL AS accountFenced
        FROM account_deletion_requests r JOIN users u ON u.id=r.user_id
        WHERE r.status='pending_review' AND r.user_id > ${afterAccountId}
        ORDER BY r.user_id LIMIT ${limit + 1}`
      );
      page.forEach(validate);
      return {
        mode: "read-only" as const,
        deletionAuthorized: false as const,
        checkedAt: clock.checkedAt,
        requests: page.slice(0, limit).map(row => ({
          accountId: row.accountId,
          requestKey: row.requestKey,
          revision: row.revision,
          status: row.status,
          requestedAt: row.requestedAt,
          accountFenced: Boolean(row.accountFenced),
        })),
        nextAfterAccountId:
          page.length > limit ? page[limit - 1].accountId : null,
        warning:
          "Snapshot page only, ordered by account ID, not urgency. Repeat complete scans from the beginning; requests may change between pages. Inspect the current account and revalidate its request under the eventual processing transaction. No request was claimed, approved or processed.",
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" }
  );
}
