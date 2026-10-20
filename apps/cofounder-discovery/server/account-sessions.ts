import {
  and,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { accountSessions, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getConfig } from "./config";
export const SESSION_CAPACITY_MESSAGE =
  "Sign-in session limit reached. Sign out from another browser, or use password recovery to revoke previous sessions.";

const digest = (tokenId: string) =>
  createHash("sha256").update(tokenId).digest("hex");
async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account service is temporarily unavailable.",
    });
  return db;
}

export async function createAccountSession(
  openId: string,
  credentialHash: string,
  tokenId: string,
  expiresAt: Date
) {
  const db = await database();
  // Password recovery must use the same user lock before revoking sessions, so
  // a concurrent login using an old password cannot create a surviving session.
  await db.transaction(
    async tx => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1)
        .for("update");
      if (
        !user?.passwordHash ||
        user.passwordHash !== credentialHash ||
        user.deletionFencedAt !== null
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credentials changed. Please sign in again.",
        });
      }
      // A range DELETE on an empty session table takes gap locks which conflict
      // with first-session inserts for unrelated owners. Under the user lock,
      // identify existing expired rows with a non-locking read, then delete only
      // those primary keys. Never acquire an empty expiry-range lock.
      const expired = await tx
        .select({ tokenDigest: accountSessions.tokenDigest })
        .from(accountSessions)
        .where(
          and(
            eq(accountSessions.userId, user.id),
            lte(accountSessions.expiresAt, new Date())
          )
        );
      if (expired.length)
        await tx.delete(accountSessions).where(
          and(
            eq(accountSessions.userId, user.id),
            inArray(
              accountSessions.tokenDigest,
              expired.map(row => row.tokenDigest)
            )
          )
        );
      const [retained] = await tx
        .select({ total: sql<number>`COUNT(*)` })
        .from(accountSessions)
        .where(eq(accountSessions.userId, user.id));
      const total = Number(retained?.total);
      if (!Number.isSafeInteger(total) || total < 0)
        throw new Error("session_capacity_unavailable");
      if (total >= getConfig().CAPACITY_SESSIONS_PER_ACCOUNT)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: SESSION_CAPACITY_MESSAGE,
        });
      await tx
        .insert(accountSessions)
        .values({ userId: user.id, tokenDigest: digest(tokenId), expiresAt });
    },
    { isolationLevel: "read committed" }
  );
}

function prepareSessionLookup(db: Awaited<ReturnType<typeof database>>) {
  return db
    .select({ userId: accountSessions.userId })
    .from(accountSessions)
    .innerJoin(users, eq(users.id, accountSessions.userId))
    .where(
      and(
        eq(accountSessions.userId, sql.placeholder("userId")),
        isNull(users.deletionFencedAt),
        eq(accountSessions.tokenDigest, sql.placeholder("tokenDigest")),
        gt(accountSessions.expiresAt, sql.placeholder("now"))
      )
    )
    .limit(1)
    .prepare();
}

const sessionLookupQueries = new WeakMap<
  Awaited<ReturnType<typeof database>>,
  ReturnType<typeof prepareSessionLookup>
>();

export async function isAccountSessionActive(userId: number, tokenId: string) {
  const db = await database();
  let query = sessionLookupQueries.get(db);
  if (!query) {
    query = prepareSessionLookup(db);
    sessionLookupQueries.set(db, query);
  }
  // Bind a fresh cutoff with the original column encoder on every live read.
  // No session/revocation/deletion-fence outcome is retained between requests.
  const [session] = await query.execute({
    userId,
    tokenDigest: digest(tokenId),
    now: accountSessions.expiresAt.mapToDriverValue(new Date()),
  });
  return Boolean(session);
}

function prepareAuthenticatedUserLookup(
  db: Awaited<ReturnType<typeof database>>
) {
  return db
    .select(getTableColumns(users))
    .from(users)
    .innerJoin(accountSessions, eq(users.id, accountSessions.userId))
    .where(
      and(
        eq(users.openId, sql.placeholder("openId")),
        isNull(users.deletionFencedAt),
        eq(accountSessions.tokenDigest, sql.placeholder("tokenDigest")),
        gt(accountSessions.expiresAt, sql.placeholder("now"))
      )
    )
    .limit(1)
    .prepare();
}

const authenticatedUserQueries = new WeakMap<
  Awaited<ReturnType<typeof database>>,
  ReturnType<typeof prepareAuthenticatedUserLookup>
>();

export async function getUserForAccountSession(
  openId: string,
  tokenId: string
) {
  const db = await database();
  let query = authenticatedUserQueries.get(db);
  if (!query) {
    query = prepareAuthenticatedUserLookup(db);
    authenticatedUserQueries.set(db, query);
  }
  // One live statement checks the account and its durable session together.
  // Reuse only SQL/mapping, never rows or authentication decisions.
  const [user] = await query.execute({
    openId,
    tokenDigest: digest(tokenId),
    now: accountSessions.expiresAt.mapToDriverValue(new Date()),
  });
  return user;
}

export async function revokeAccountSession(tokenId: string) {
  const db = await database();
  await db
    .delete(accountSessions)
    .where(eq(accountSessions.tokenDigest, digest(tokenId)));
}
