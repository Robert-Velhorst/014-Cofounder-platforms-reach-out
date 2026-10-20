import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { accountMailQuotas, users } from "../drizzle/schema";
import { getConfig } from "./config";
import { getDb } from "./db";
import { reserveVerificationAttempt } from "./verification-attempt-window";

type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];

/** Reserve before external I/O, in the token/job transaction. Never refund an
 * uncertain delivery. Stable, non-secret keys survive process/key rotation. */
export async function reserveAccountMailAttempt(
  tx: Transaction,
  expiresAt?: Date
) {
  const config = getConfig();
  const windows = [
    {
      key: "account-mail:dispatch:day:v1",
      limit: config.ACCOUNT_MAIL_DAILY_ATTEMPTS,
    },
    {
      key: "account-mail:dispatch:month:v1",
      limit: config.ACCOUNT_MAIL_MONTHLY_ATTEMPTS,
    },
  ];
  const locked = [];
  // All dispatch paths lock the current account first, then day, then month.
  // No SKIP LOCKED: skipping an accounting row would bypass the shared ceiling.
  for (const window of windows) {
    await tx
      .insert(accountMailQuotas)
      .values({
        key: window.key,
        used: 0,
        expiresAt: sql`CURRENT_TIMESTAMP`,
      })
      .onDuplicateKeyUpdate({ set: { key: window.key } });
    const [row] = await tx
      .select({
        used: accountMailQuotas.used,
        expiryMs: sql<number>`UNIX_TIMESTAMP(${accountMailQuotas.expiresAt}) * 1000`,
      })
      .from(accountMailQuotas)
      .where(eq(accountMailQuotas.key, window.key))
      .for("update");
    if (
      !row ||
      !Number.isSafeInteger(row.used) ||
      row.used < 0 ||
      !Number.isFinite(Number(row.expiryMs))
    )
      throw new Error("invalid_account_mail_budget");
    locked.push({ ...window, ...row });
  }
  // Read only AFTER both locks: waiting across midnight must not use a stale
  // window. Epoch SQL also avoids dependence on application/session time zones.
  const [clock] = await tx
    .select({
      nowMs: sql<number>`UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000`,
    })
    .from(accountMailQuotas)
    .where(eq(accountMailQuotas.key, windows[0].key));
  const nowMs = Number(clock?.nowMs);
  if (!Number.isFinite(nowMs))
    throw new Error("account_mail_clock_unavailable");
  const now = new Date(nowMs);
  if (expiresAt && expiresAt.getTime() <= Math.max(nowMs, Date.now()))
    return { status: "expired" as const };
  const ends = [
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  ];
  const counters = locked.map((row, index) => ({
    key: row.key,
    limit: row.limit,
    used: Number(row.expiryMs) <= nowMs ? 0 : row.used,
    expiryMs:
      Number(row.expiryMs) <= nowMs ? ends[index] : Number(row.expiryMs),
  }));
  if (counters.some(row => row.used >= row.limit)) {
    // Recheck boundedly so an operator can raise a limit without rewriting jobs.
    // Expired jobs still get a cleanup turn while sending is paused.
    return {
      status: "exhausted" as const,
      retryAt: new Date(
        Math.min(nowMs + 60_000, expiresAt?.getTime() ?? Infinity)
      ),
    };
  }
  for (const counter of counters)
    await tx
      .update(accountMailQuotas)
      .set({
        used: counter.used + 1,
        expiresAt: sql`FROM_UNIXTIME(${counter.expiryMs} / 1000)`,
      })
      .where(eq(accountMailQuotas.key, counter.key));
  return { status: "reserved" as const, now };
}

/** Token replacement and shared budget commit together, before transport. */
export async function issueBudgetedVerificationToken(
  userId: number,
  email: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    return await db.transaction(
      async tx => {
        const [user] = await tx
          .select({
            email: users.email,
            deletionFencedAt: users.deletionFencedAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
          .for("update");
        if (!user)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found.",
          });
        if (
          user.deletionFencedAt !== null ||
          !user.email ||
          user.email.toLowerCase() !== email.toLowerCase()
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Account email changed. Reload and try again.",
          });
        await reserveVerificationAttempt(tx, userId);
        const reservation = await reserveAccountMailAttempt(tx);
        if (reservation.status !== "reserved")
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Account email sending is temporarily at its service limit. Existing links remain usable. Please try again later.",
          });
        const token = randomBytes(32).toString("base64url");
        await tx
          .update(users)
          .set({
            verificationToken: createHash("sha256").update(token).digest("hex"),
            verificationEmailDigest: createHash("sha256")
              .update(user.email.trim().toLowerCase())
              .digest("hex"),
            // Match the Date serializer used by token redemption. Unlike the
            // budget's epoch reads, this field is decoded by Drizzle as UTC text.
            verificationTokenExpiry: new Date(
              reservation.now.getTime() + 86_400_000
            ),
          })
          .where(eq(users.id, userId));
        return token;
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Account email is temporarily unavailable. Please try again later.",
    });
  }
}
