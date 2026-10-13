import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  capacityLocks,
  auditEvents,
  type InsertAuditEvent,
  outreachRecords,
  prospects,
  users,
} from "../drizzle/schema";
import { getConfig } from "./config";
import type { getDb } from "./db";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Resource = "accounts" | "prospects" | "outreach" | "workspace_audit";

// Protective opt-out, authentication, recovery and privacy events are exempt.
// Historical rows for these actions count regardless of outcome or age.
export const WORKSPACE_AUDIT_ACTIONS = [
  "profile.save",
  "prospect.add",
  "prospect.edit",
  "prospect.archive",
  "prospect.restore",
  "prospect.qualify",
  "prospect.import_csv",
  "outreach.draft",
  "outreach.transition",
  "outreach.cancel",
  "outreach.revise",
  "outreach.conversation",
  "partnership.progress",
  "workspace.presets.saved",
] as const;

export function isWorkspaceAuditAction(action: string) {
  return (WORKSPACE_AUDIT_ACTIONS as readonly string[]).includes(action);
}

/** Owner-locked READ COMMITTED mutation only. Take this resource LAST.
 * Failure rolls back both the workspace mutation and its receipts. Never prune
 * history to make room, or use this gate for security/privacy/opt-out records.
 */
export async function appendWorkspaceAudit(
  tx: Transaction,
  event: InsertAuditEvent
) {
  if (
    !isWorkspaceAuditAction(event.action) ||
    !Number.isSafeInteger(event.userId) ||
    event.userId! <= 0
  )
    throw new Error("invalid_workspace_audit_event");
  await lockCapacityResource(tx, "workspace_audit");
  const actions = inArray(auditEvents.action, [...WORKSPACE_AUDIT_ACTIONS]);
  const [total] = await tx
    .select({ n: sql<number>`count(*)` })
    .from(auditEvents)
    .where(actions);
  const [owned] = await tx
    .select({ n: sql<number>`count(*)` })
    .from(auditEvents)
    .where(and(actions, eq(auditEvents.userId, event.userId!)));
  const config = getConfig();
  if (
    checkedCount(total?.n) >= config.CAPACITY_WORKSPACE_AUDIT_TOTAL ||
    checkedCount(owned?.n) >= config.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT
  )
    throwCapacityReached("workspace_audit");
  await tx.insert(auditEvents).values(event);
}

/** Use in a READ COMMITTED transaction, held through insertion and commit.
 * Owner-scoped writers lock their owner first, then their resource. Account
 * creation takes only the accounts resource; never take another owner's lock
 * while holding a resource lock. No network calls belong inside this scope.
 */
export async function lockCapacityResource(
  tx: Transaction,
  resource: Resource
) {
  // The duplicate-key UPDATE takes the same exclusive InnoDB row lock even
  // without a value change. A first-use race serializes on the primary key.
  await tx
    .insert(capacityLocks)
    .values({ resource })
    .onDuplicateKeyUpdate({ set: { resource } });
}

function checkedCount(value: unknown) {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0)
    throw new Error("invalid_capacity_count");
  return count;
}

/** Returns the number of NEW rows the caller may add in this transaction.
 * Replays and duplicate-only imports should not call this growth gate.
 * Archived, opted-out, closed and legacy rows all remain in the accounting.
 */
export async function availableCapacity(
  tx: Transaction,
  resource: Exclude<Resource, "workspace_audit">,
  userId?: number
) {
  if (
    resource !== "accounts" &&
    (!Number.isSafeInteger(userId) || userId! <= 0)
  )
    throw new Error("capacity_owner_required");
  await lockCapacityResource(tx, resource);
  const config = getConfig();
  const table =
    resource === "accounts"
      ? users
      : resource === "prospects"
        ? prospects
        : outreachRecords;
  const [total] = await tx.select({ n: sql<number>`count(*)` }).from(table);
  const totalLimit =
    resource === "accounts"
      ? config.CAPACITY_ACCOUNTS
      : resource === "prospects"
        ? config.CAPACITY_PROSPECTS_TOTAL
        : config.CAPACITY_OUTREACH_TOTAL;
  let available = totalLimit - checkedCount(total?.n);
  if (resource !== "accounts") {
    const ownedTable = resource === "prospects" ? prospects : outreachRecords;
    const [owned] = await tx
      .select({ n: sql<number>`count(*)` })
      .from(ownedTable)
      .where(eq(ownedTable.userId, userId!));
    const ownerLimit =
      resource === "prospects"
        ? config.CAPACITY_PROSPECTS_PER_ACCOUNT
        : config.CAPACITY_OUTREACH_PER_ACCOUNT;
    available = Math.min(available, ownerLimit - checkedCount(owned?.n));
  }
  if (available <= 0) throwCapacityReached(resource);
  return available;
}

export function throwCapacityReached(resource: Resource): never {
  const operation =
    resource === "accounts"
      ? "New account registration"
      : resource === "prospects"
        ? "New candidate intake"
        : resource === "outreach"
          ? "New outreach records"
          : "Audited workspace changes";
  throw new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: `${operation} reached a configured beta capacity limit. No new records from this request were saved. Existing data is preserved; contact the operator before retrying.`,
  });
}
