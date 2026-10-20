import { createHmac } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { accountMailQuotas } from "../drizzle/schema";
import { getConfig } from "./config";
import type { getDb } from "./db";

type Transaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];

export function verificationAttemptQuotaKey(userId: number) {
  const secret = getConfig().JWT_SECRET;
  if (!secret || !Number.isSafeInteger(userId) || userId <= 0)
    throw new Error("verification_admission_unavailable");
  return createHmac("sha256", secret)
    .update(JSON.stringify(["cofounder-verification-attempt-v1", userId]))
    .digest("hex");
}

/** Caller must hold the live owner lock first. This counter, shared dispatch
 * reservation and token replacement commit together, before provider I/O. */
export async function reserveVerificationAttempt(
  tx: Transaction,
  userId: number
) {
  const key = verificationAttemptQuotaKey(userId);
  await tx
    .insert(accountMailQuotas)
    .values({ key, used: 0, expiresAt: sql`CURRENT_TIMESTAMP` })
    .onDuplicateKeyUpdate({ set: { key } });
  const [row] = await tx
    .select({
      used: accountMailQuotas.used,
      expiryMs: sql<number>`UNIX_TIMESTAMP(${accountMailQuotas.expiresAt}) * 1000`,
    })
    .from(accountMailQuotas)
    .where(eq(accountMailQuotas.key, key))
    .for("update");
  const [clock] = await tx
    .select({ nowMs: sql<number>`UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000` })
    .from(accountMailQuotas)
    .where(eq(accountMailQuotas.key, key));
  const nowMs = Number(clock?.nowMs),
    expiryMs = Number(row?.expiryMs);
  if (
    !row ||
    !Number.isSafeInteger(row.used) ||
    row.used < 0 ||
    !Number.isFinite(expiryMs) ||
    !Number.isFinite(nowMs)
  )
    throw new Error("verification_admission_unavailable");
  const expired = expiryMs <= nowMs;
  const used = expired ? 0 : row.used;
  if (used >= 3)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Please wait before requesting another verification email. Existing links remain usable.",
    });
  await tx
    .update(accountMailQuotas)
    .set({
      used: used + 1,
      expiresAt: sql`FROM_UNIXTIME(${expired ? nowMs + 3_600_000 : expiryMs} / 1000)`,
    })
    .where(eq(accountMailQuotas.key, key));
}
