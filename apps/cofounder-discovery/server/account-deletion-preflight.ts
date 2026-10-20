import reviewedSchema from "./account-deletion-schema.json";
import {
  getTableColumns,
  getTableName,
  is,
  sql,
  Table,
  type SQL,
} from "drizzle-orm";
import { getTableConfig, type AnyMySqlTable } from "drizzle-orm/mysql-core";
import * as schema from "../drizzle/schema";
import { getDb } from "./db";
import { getConfig } from "./config";
import { openAccountMailPayload } from "./account-mail-queue";
import { readDeletionRequestSnapshot } from "./account-deletion-review";

type Reference = {
  columns: string[];
  table: string;
  foreignColumns: string[];
  onDelete?: string;
  onUpdate?: string;
};
type Shape = { table: string; columns: string[]; references: Reference[] };
// Static import embeds the reviewed manifest in compiled operator artifacts.
const reviewed: Record<string, Shape> = reviewedSchema;
// Independent deletion ownership review, not the downloadable-export allowlist.
// Values are database columns. @ entries resolve ownership through the parent.
const ownership: Record<string, string | null> = {
  workspacePresets: "user_id",
  adminMfaState: "user_id",
  adminPasskeys: "user_id",
  accountDeletionRequests: "user_id",
  accountExportQuotas: "user_id",
  accountMailJobs: "user_id",
  accountSessions: "user_id",
  aiActivityLog: "user_id",
  approvalQueue: "user_id",
  auditEvents: "user_id",
  automationJobs: "user_id",
  billingPeriods: "user_id",
  campaigns: "user_id",
  conversationAnalytics: "user_id",
  conversationStartersHistory: "user_id",
  conversations: "userId",
  guardrails: "user_id",
  idempotencyRecords: "user_id",
  invoices: "user_id",
  leadScores: "@match",
  matches: "user_id",
  messages: "user_id",
  outreachRecords: "user_id",
  partnershipOutcomes: "user_id",
  pipelineStages: "user_id",
  platformCredentials: "user_id",
  prospectNotes: "user_id",
  prospectTasks: "user_id",
  prospects: "user_id",
  resourceUsage: "user_id",
  responsePatterns: "@prospect",
  savedSearches: "userId",
  stageTransitions: "@match",
  successMetrics: "user_id",
  timelineEvents: "user_id",
  userPreferences: "user_id",
  userProfiles: "user_id",
  users: "id",
  accountMailQuotas: null,
  loginAttemptQuotas: null,
  capacityLocks: null,
  mlModelVersions: null,
  usagePricing: null,
};
type Issue = {
  code: string;
  category: string;
  field?: string;
  direction?: "incoming" | "outgoing";
};
const col = (alias: string, name: string) =>
  sql`${sql.identifier(alias)}.${sql.identifier(name)}`;
const canonical = (value: unknown) => JSON.stringify(value);
const action = (value?: string) =>
  !value || ["NO ACTION", "RESTRICT"].includes(value.toUpperCase())
    ? "restrict"
    : value.toLowerCase();
const signature = (table: string, reference: Reference) =>
  `${table}.${reference.columns.join(",")}>${reference.table}.${reference.foreignColumns.join(",")}:${action(reference.onDelete)}:${action(reference.onUpdate)}`;

/** Operator diagnostic only. No deletion authorization, SQL plan, row content,
 * session revocation, queue claim, provider request, or data mutation is produced. */
export async function inspectAccountDeletion(accountId: number) {
  if (
    !Number.isSafeInteger(accountId) ||
    accountId < 1 ||
    accountId > 2147483647
  )
    throw new Error("invalid_read_only_arguments");
  const entries = Object.entries(schema)
    .filter(([, table]) => is(table, Table))
    .map(([key, value]) => {
      const table = value as AnyMySqlTable;
      const actual: Shape = {
        table: getTableName(table),
        columns: Object.values(getTableColumns(table))
          .map(column => column.name)
          .sort(),
        references: getTableConfig(table)
          .foreignKeys.map(fk => {
            const ref = fk.reference();
            return {
              columns: ref.columns.map(c => c.name),
              table: getTableName(ref.foreignTable),
              foreignColumns: ref.foreignColumns.map(c => c.name),
              onDelete: fk.onDelete,
              onUpdate: fk.onUpdate,
            };
          })
          .sort((a, b) => canonical(a).localeCompare(canonical(b))),
      };
      if (!(key in ownership) || canonical(actual) !== canonical(reviewed[key]))
        throw new Error("deletion_schema_review_required");
      return { key, ...actual };
    });
  if (
    entries.length !== Object.keys(reviewed).length ||
    entries.length !== Object.keys(ownership).length
  )
    throw new Error("deletion_schema_review_required");
  const byTable = new Map(entries.map(entry => [entry.table, entry.key]));
  function owned(key: string, alias: string): SQL {
    const owner = ownership[key];
    if (owner === "@match")
      return sql`EXISTS (SELECT 1 FROM matches AS own_match WHERE own_match.id = ${col(alias, "match_id")} AND own_match.user_id = ${accountId})`;
    if (owner === "@prospect")
      return sql`EXISTS (SELECT 1 FROM prospects AS own_prospect WHERE own_prospect.id = ${col(alias, "prospect_id")} AND own_prospect.user_id = ${accountId})`;
    return owner ? sql`${col(alias, owner)} = ${accountId}` : sql`FALSE`;
  }
  const db = await getDb();
  if (!db) throw new Error("deletion_storage_unavailable");
  return db.transaction(
    async tx => {
      const started = Date.now();
      async function rows<T>(query: SQL) {
        if (Date.now() - started > 30000)
          throw new Error("deletion_inspection_limit");
        const [result] = await tx.execute(query);
        return result as unknown as T[];
      }
      async function checkLiveSchema() {
        const columns = await rows<{ table_name: string; column_name: string }>(
          sql`SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`
        );
        const actual = columns
          .map(row => `${row.table_name}.${row.column_name}`)
          .sort();
        const expected = entries
          .flatMap(entry =>
            entry.columns.map(column => `${entry.table}.${column}`)
          )
          .concat([
            "__drizzle_migrations.id",
            "__drizzle_migrations.hash",
            "__drizzle_migrations.created_at",
          ])
          .sort();
        if (canonical(actual) !== canonical(expected))
          throw new Error("deletion_schema_review_required");
        const engines = await rows<{
          table_name: string;
          engine: string;
          kind: string;
        }>(
          sql`SELECT TABLE_NAME AS table_name, ENGINE AS engine, TABLE_TYPE AS kind FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`
        );
        if (
          engines.some(
            row => row.engine !== "InnoDB" || row.kind !== "BASE TABLE"
          )
        )
          throw new Error("deletion_schema_review_required");
        const references = await rows<{
          table_name: string;
          column_name: string;
          foreign_table: string;
          foreign_column: string;
          foreign_schema: string;
          schema_name: string;
          delete_rule: string;
          update_rule: string;
        }>(
          sql`SELECT k.TABLE_NAME AS table_name, k.COLUMN_NAME AS column_name, k.REFERENCED_TABLE_NAME AS foreign_table, k.REFERENCED_COLUMN_NAME AS foreign_column, k.REFERENCED_TABLE_SCHEMA AS foreign_schema, DATABASE() AS schema_name, r.DELETE_RULE AS delete_rule, r.UPDATE_RULE AS update_rule FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL`
        );
        const actualRefs = references
          .map(row =>
            signature(row.table_name, {
              columns: [row.column_name],
              table: row.foreign_table,
              foreignColumns: [row.foreign_column],
              onDelete: row.delete_rule,
              onUpdate: row.update_rule,
            })
          )
          .sort();
        const expectedRefs = entries
          .flatMap(entry =>
            entry.references.map(ref => signature(entry.table, ref))
          )
          .sort();
        if (
          references.some(row => row.foreign_schema !== row.schema_name) ||
          canonical(actualRefs) !== canonical(expectedRefs)
        )
          throw new Error("deletion_schema_review_required");
      }
      await checkLiveSchema();
      const [clock] = await rows<{
        offset_seconds: number;
        checked_at: string;
      }>(
        sql`SELECT TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CURRENT_TIMESTAMP()) AS offset_seconds, DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%sZ') AS checked_at`
      );
      if (Number(clock?.offset_seconds) !== 0)
        throw new Error("deletion_requires_utc_session");
      const [owner] = await rows<{
        email: string | null;
        account_fenced: number;
      }>(
        sql`SELECT email, deletion_fenced_at IS NOT NULL AS account_fenced FROM users WHERE id=${accountId}`
      );
      if (!owner) throw new Error("deletion_account_not_found");
      const request = await readDeletionRequestSnapshot(tx, accountId);
      const categories: Record<string, number | null> = {};
      const issues: Issue[] = [];
      const add = (issue: Issue) => {
        if (!issues.some(old => canonical(old) === canonical(issue)))
          issues.push(issue);
      };
      for (const entry of entries) {
        if (ownership[entry.key] === null) continue;
        const [count] = await rows<{ n: number | string }>(
          sql`SELECT /*+ MAX_EXECUTION_TIME(2000) */ COUNT(*) AS n FROM ${sql.identifier(entry.table)} AS c WHERE ${owned(entry.key, "c")}`
        );
        categories[entry.key] = Number(count.n);
        if (
          [
            "resourceUsage",
            "billingPeriods",
            "invoices",
            "auditEvents",
          ].includes(entry.key) &&
          Number(count.n) > 0
        )
          add({ code: "retention_review", category: entry.key });
        // Logical message ancestry is not enforced by a database foreign key.
        // recipientId is deliberately NOT treated as a user ID or an owner field.
        const refs =
          entry.key === "messages"
            ? [
                ...entry.references,
                {
                  columns: ["parent_message_id"],
                  table: "messages",
                  foreignColumns: ["id"],
                },
              ]
            : entry.references;
        for (const ref of refs) {
          const parent = byTable.get(ref.table);
          if (
            !parent ||
            ref.columns.length !== 1 ||
            ref.foreignColumns.length !== 1
          )
            throw new Error("deletion_schema_review_required");
          const condition = sql`${col("c", ref.columns[0])} = ${col("p", ref.foreignColumns[0])}`;
          for (const direction of ["incoming", "outgoing"] as const) {
            const boundary =
              direction === "incoming"
                ? sql`NOT COALESCE(${owned(entry.key, "c")}, FALSE) AND ${owned(parent, "p")}`
                : sql`${owned(entry.key, "c")} AND ${col("c", ref.columns[0])} IS NOT NULL AND NOT COALESCE(${owned(parent, "p")}, FALSE)`;
            const mismatch = await rows(
              sql`SELECT /*+ MAX_EXECUTION_TIME(2000) */ 1 FROM ${sql.identifier(entry.table)} AS c LEFT JOIN ${sql.identifier(ref.table)} AS p ON ${condition} WHERE ${boundary} LIMIT 1`
            );
            if (mismatch.length)
              add({
                code: "cross_owner_reference",
                category: entry.key,
                field: ref.columns[0],
                direction,
              });
          }
        }
      }
      // User-less recovery requests are deliberately not covered by user-ID FKs.
      // Inspect only the bounded encrypted queue, never message content in output.
      const jobs = await rows<{
        id: string;
        user_id: number | null;
        state: string;
        has_lease: number;
        attempts: number;
        provider_id: string | null;
        payload: string | null;
        payload_bytes: number | null;
      }>(
        sql`SELECT /*+ MAX_EXECUTION_TIME(2000) */ id, user_id, state, lease_until > CURRENT_TIMESTAMP AS has_lease, attempts, provider_id, CASE WHEN OCTET_LENGTH(payload) <= 65536 THEN payload ELSE NULL END AS payload, OCTET_LENGTH(payload) AS payload_bytes FROM account_mail_jobs WHERE user_id=${accountId} OR user_id IS NULL ORDER BY id LIMIT 1001`
      );
      let unresolvedMail = jobs.length > 1000;
      if (unresolvedMail)
        add({ code: "mail_scan_limit", category: "accountMailJobs" });
      const secret = getConfig().AUTH_MAIL_ENCRYPTION_SECRET;
      for (const job of jobs.slice(0, 1000)) {
        let belongs = job.user_id === accountId;
        if (job.user_id === null) {
          try {
            if (!secret || !job.payload || !owner.email)
              throw new Error("unattributed_mail");
            belongs =
              openAccountMailPayload(
                job.id,
                job.payload,
                secret
              ).email.toLowerCase() === owner.email.toLowerCase();
            if (belongs)
              categories.accountMailJobs =
                Number(categories.accountMailJobs) + 1;
          } catch {
            unresolvedMail = true;
          }
        }
        if (belongs) {
          if (["queued", "sending"].includes(job.state) || job.has_lease)
            add({ code: "mail_work_pending", category: "accountMailJobs" });
          if (job.attempts > 0 || job.provider_id)
            add({ code: "mail_delivery_review", category: "accountMailJobs" });
        }
      }
      if (unresolvedMail) {
        categories.accountMailJobs = null;
        add({
          code: "mail_attribution_unresolved",
          category: "accountMailJobs",
        });
      }
      await checkLiveSchema();
      return {
        mode: "read-only" as const,
        accountId,
        checkedAt: clock.checked_at,
        deletionAuthorized: false as const,
        request,
        accountFenced: Boolean(owner.account_fenced),
        categories,
        excludedServiceCategories: entries
          .filter(entry => ownership[entry.key] === null)
          .map(entry => entry.key),
        issues,
        remainingGates: [
          "operator_policy",
          "work_fence_and_session_revocation",
          "atomic_erasure_and_receipt",
          "external_stores_and_backup_restore_review",
        ],
        warning:
          "Snapshot diagnostic only. Recheck under the eventual deletion transaction; no account or data was changed.",
      };
    },
    {
      isolationLevel: "repeatable read",
      accessMode: "read only",
      // The first InnoDB data read establishes the repeatable-read snapshot.
      // Drizzle 0.45 joins combined START TRANSACTION options without the comma
      // MySQL requires, so do not combine accessMode/withConsistentSnapshot.
    }
  );
}
