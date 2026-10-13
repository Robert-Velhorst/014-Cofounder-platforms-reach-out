import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { and, eq, lte, or } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { accountMailJobs, accountMailQuotas, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getConfig } from "./config";
import { requireAccountMail } from "./account-mail";
import { reserveAccountMailAttempt } from "./account-mail-budget";

function queueSecret() {
  const secret = getConfig().AUTH_MAIL_ENCRYPTION_SECRET;
  if (!secret)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Account recovery is not configured. Contact the service operator.",
    });
  return secret;
}

function sealPayload(id: string, payload: object, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    iv
  );
  cipher.setAAD(Buffer.from(`account-mail:${id}`));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

const requestResponse = () => ({
  success: true as const,
  message:
    "If this address has an account and the request is within service limits, a reset link will be emailed. Check your inbox and spam folder. If needed, try again later.",
});

type AccountMailTransaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];

export async function queuePasswordChanged(
  tx: AccountMailTransaction,
  user: { id: number; email: string }
) {
  const secret = queueSecret();
  const id = randomUUID();
  const now = Date.now();
  await tx.insert(accountMailJobs).values({
    id,
    userId: user.id,
    kind: "password_changed",
    quotaKey: createHmac("sha256", secret)
      .update(`recovery-quota:email:${user.email.toLowerCase()}`)
      .digest("hex"),
    payload: sealPayload(id, { email: user.email }, secret),
    availableAt: new Date(Math.floor(now / 1000) * 1000),
    // All delivery attempts stay inside the provider's 24-hour retry window.
    expiresAt: new Date(now + 23 * 60 * 60 * 1000),
  });
}

export async function requestPasswordReset(email: string, ip: string) {
  requireAccountMail();
  const secret = queueSecret();
  // This operation deliberately does not query users or wait for external mail.
  const normalized = email.trim().toLowerCase();
  const key = (scope: string) =>
    createHmac("sha256", secret)
      .update(`recovery-quota:${scope}`)
      .digest("hex");
  const now = new Date();
  const quotas = [
    { key: key("global"), limit: 200, window: 24 * 60 * 60 * 1000 },
    { key: key(`ip:${ip}`), limit: 10, window: 60 * 60 * 1000 },
    { key: key(`email:${normalized}`), limit: 3, window: 60 * 60 * 1000 },
  ];
  try {
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    await db.transaction(async tx => {
      const counters = [];
      // Every admission locks the service row first, then IP, then address.
      // The small beta prefers serial correctness over an in-memory fast path.
      for (const quota of quotas) {
        const expiresAt = new Date(now.getTime() + quota.window);
        await tx
          .insert(accountMailQuotas)
          .values({ key: quota.key, used: 0, expiresAt })
          .onDuplicateKeyUpdate({ set: { key: quota.key } });
        const [row] = await tx
          .select()
          .from(accountMailQuotas)
          .where(eq(accountMailQuotas.key, quota.key))
          .for("update");
        const used = row.expiresAt <= now ? 0 : row.used;
        if (used >= quota.limit) return;
        counters.push({
          key: quota.key,
          used: used + 1,
          expiresAt: row.expiresAt <= now ? expiresAt : row.expiresAt,
        });
      }
      for (const counter of counters)
        await tx
          .update(accountMailQuotas)
          .set(counter)
          .where(eq(accountMailQuotas.key, counter.key));
      const id = randomUUID();
      await tx.insert(accountMailJobs).values({
        id,
        quotaKey: quotas[2].key,
        kind: "password_reset",
        payload: sealPayload(id, { email: normalized }, secret),
        // TIMESTAMP(0) rounds fractional values up; an immediate job must
        // never accidentally be scheduled into the next second.
        availableAt: new Date(Math.floor(now.getTime() / 1000) * 1000),
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
      });
    });
    return requestResponse();
  } catch {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account recovery is temporarily unavailable. Please try again.",
    });
  }
}

const mailMessage = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()).length(1),
  subject: z.string(),
  text: z.string(),
});
const mailPayload = z.object({
  email: z.string().email(),
  token: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .optional(),
  message: mailMessage.optional(),
});

export function openAccountMailPayload(
  id: string,
  payload: string,
  secret: string
) {
  const [version, iv, tag, ciphertext, extra] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra)
    throw new Error("invalid_mail_payload");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    Buffer.from(iv, "base64url")
  );
  decipher.setAAD(Buffer.from(`account-mail:${id}`));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return mailPayload.parse(
    JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(ciphertext, "base64url")),
        decipher.final(),
      ]).toString("utf8")
    )
  );
}

/** Processes at most one durable job; external I/O never holds a database lock. */
export async function processNextAccountMail() {
  const config = requireAccountMail();
  const secret = queueSecret();
  const db = await getDb();
  if (!db) throw new Error("account_mail_storage_unavailable");
  const now = new Date();
  const claim = await db.transaction(async tx => {
    const [job] = await tx
      .select()
      .from(accountMailJobs)
      .where(
        or(
          and(
            eq(accountMailJobs.state, "queued"),
            lte(accountMailJobs.availableAt, now)
          ),
          and(
            eq(accountMailJobs.state, "sending"),
            lte(accountMailJobs.leaseUntil, now)
          )
        )
      )
      .orderBy(accountMailJobs.availableAt, accountMailJobs.id)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!job) return { status: "idle" as const };
    const finish = async (state: "discarded" | "failed") => {
      await tx
        .update(accountMailJobs)
        .set({ state, payload: null, leaseUntil: null })
        .where(eq(accountMailJobs.id, job.id));
      return { status: state };
    };
    if (job.expiresAt <= now) return finish("discarded");
    if (job.attempts >= 5 || !job.payload) return finish("failed");
    let payload: z.infer<typeof mailPayload>;
    try {
      payload = openAccountMailPayload(job.id, job.payload, secret);
    } catch {
      return finish("failed");
    }
    const [user] = await tx
      .select()
      .from(users)
      .where(
        job.userId ? eq(users.id, job.userId) : eq(users.email, payload.email)
      )
      .limit(1)
      .for("update");
    // Pool acquisition and user-row locking can wait. Never use the
    // pre-transaction clock to authorize a token or start a delivery lease.
    if (job.expiresAt <= new Date()) return finish("discarded");
    if (
      !user?.email ||
      user.deletionFencedAt !== null ||
      !user.passwordHash ||
      user.email.toLowerCase() !== payload.email.toLowerCase()
    )
      return finish("discarded");
    // Discard superseded retries before spending the shared dispatch allowance.
    if (
      job.kind === "password_reset" &&
      payload.message &&
      (!payload.token ||
        user.passwordResetToken !==
          createHash("sha256").update(payload.token).digest("hex"))
    )
      return finish("discarded");
    const reservation = await reserveAccountMailAttempt(tx, job.expiresAt);
    if (reservation.status === "expired") return finish("discarded");
    if (reservation.status === "exhausted") {
      await tx
        .update(accountMailJobs)
        .set({
          state: "queued",
          leaseUntil: null,
          availableAt: reservation.retryAt,
        })
        .where(eq(accountMailJobs.id, job.id));
      return { status: "budget_limited" as const };
    }
    if (job.kind === "password_changed") {
      // Retain the first outbound message on retries, including its sender and
      // recovery URL. This warning never issues another credential or token.
      if (!payload.message) {
        const recoveryUrl = new URL("/forgot-password", config.origin);
        payload = {
          email: user.email,
          message: {
            from: config.from,
            to: [user.email],
            subject: "Your CoFounder Outreach password changed",
            text: `Your CoFounder Outreach password was changed. All previous sign-in sessions were revoked.\n\nIf you did not make this change, secure your email account and request a new password reset here:\n${recoveryUrl}\n\nIf you made this change, no further action is needed.`,
          },
        };
      }
    } else if (!payload.message) {
      const token = randomBytes(32).toString("base64url");
      const url = new URL("/reset-password", config.origin);
      url.hash = `token=${token}`;
      payload = {
        email: user.email,
        token,
        message: {
          from: config.from,
          to: [user.email],
          subject: "Reset your CoFounder Outreach password",
          text: `Use this link to choose a new password:\n${url}\n\nThis link expires 30 minutes after the request and can only be used once. If you did not request it, ignore this message. Your password has not changed.`,
        },
      };
      await tx
        .update(users)
        .set({
          passwordResetToken: createHash("sha256").update(token).digest("hex"),
          passwordResetTokenExpiry: job.expiresAt,
        })
        .where(eq(users.id, user.id));
    }
    const attempt = job.attempts + 1;
    await tx
      .update(accountMailJobs)
      .set({
        userId: user.id,
        state: "sending",
        attempts: attempt,
        payload: sealPayload(job.id, payload, secret),
        leaseUntil: new Date(Date.now() + 60_000),
      })
      .where(eq(accountMailJobs.id, job.id));
    return {
      status: "send" as const,
      id: job.id,
      attempt,
      message: payload.message!,
    };
  });
  if (claim.status !== "send") return claim.status;
  const ownedClaim = and(
    eq(accountMailJobs.id, claim.id),
    eq(accountMailJobs.state, "sending"),
    eq(accountMailJobs.attempts, claim.attempt)
  );
  let providerId: string;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `account-mail/${claim.id}`,
      },
      body: JSON.stringify(claim.message),
    });
    if (!response.ok) throw new Error("provider_rejected");
    providerId = z
      .object({ id: z.string().min(1).max(255) })
      .parse(await response.json()).id;
  } catch {
    const failed = claim.attempt >= 5;
    await db
      .update(accountMailJobs)
      .set({
        state: failed ? "failed" : "queued",
        leaseUntil: null,
        availableAt: new Date(Date.now() + 30_000 * 2 ** (claim.attempt - 1)),
        ...(failed ? { payload: null } : {}),
      })
      .where(ownedClaim);
    return failed ? ("failed" as const) : ("retry" as const);
  }
  // If acknowledgement persistence fails, the lease expires and the same
  // idempotent message is retried. Never generate a new token for that retry.
  await db
    .update(accountMailJobs)
    .set({ state: "accepted", providerId, payload: null, leaseUntil: null })
    .where(ownedClaim);
  return "accepted" as const;
}
