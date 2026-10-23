import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { loginAttemptQuotas } from "../drizzle/schema";
import { getDb } from "./db";
import { getConfig } from "./config";
import { requireOutreachUtcSession } from "./outreach-clock";
import { retryRolledBackDeadlock } from "./transaction-deadlock";

function sourceAddress(value: string | undefined): string {
  const address = value?.trim().toLowerCase() || "";
  if (isIP(address) === 4) return address;
  if (isIP(address) === 6) {
    const normalized = new URL(
      `http://[${address.split("%")[0]}]`
    ).hostname.slice(1, -1);
    const mapped = /^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/.exec(normalized);
    if (mapped) {
      const high = parseInt(mapped[1], 16),
        low = parseInt(mapped[2], 16);
      return [high >> 8, high & 255, low >> 8, low & 255].join(".");
    }
    return normalized;
  }
  return "unknown";
}

const policies = {
  login: {
    global: "login-global-v1",
    domain: "cofounder-login-admission-v1",
    globalLimit: 1000,
    sourceLimit: 20,
    emailLimit: 10,
    windowSeconds: 900,
    unavailable: "Sign-in is temporarily unavailable. Please try again.",
    exhausted: "Too many sign-in attempts. Please try again later.",
  },
  registration: {
    global: "registration-global-v1",
    domain: "cofounder-registration-admission-v1",
    globalLimit: 100,
    sourceLimit: 5,
    emailLimit: 3,
    windowSeconds: 3600,
    unavailable: "Registration is temporarily unavailable. Please try again.",
    exhausted: "Too many registration attempts. Please try again later.",
  },
  passwordReset: {
    global: "password-reset-global-v1",
    domain: "cofounder-password-reset-admission-v1",
    globalLimit: 200,
    sourceLimit: 10,
    emailLimit: 10,
    windowSeconds: 900,
    unavailable:
      "Account recovery is temporarily unavailable. Please try again.",
    exhausted: "Too many recovery attempts. Please try again later.",
  },
  verificationRedemption: {
    global: "verification-redemption-global-v1",
    domain: "cofounder-verification-redemption-admission-v1",
    globalLimit: 200,
    sourceLimit: 10,
    emailLimit: 10,
    windowSeconds: 900,
    unavailable:
      "Email verification is temporarily unavailable. Please try again.",
    exhausted: "Too many verification attempts. Please try again later.",
  },
  haiFeed: {
    global: "hai-feed-global-v1",
    domain: "cofounder-hai-feed-admission-v1",
    globalLimit: 120,
    sourceLimit: 60,
    emailLimit: 60,
    windowSeconds: 60,
    unavailable: "Connector admission is temporarily unavailable.",
    exhausted: "Too many connector requests. Please try again later.",
  },
} as const;

/** Commit before account lookup/password work. All families share one mutex,
 * but have independent allowances. Never accept a caller-supplied policy/key. */
export async function admitAuthenticationAttempt(
  action: keyof typeof policies,
  identity: string,
  ip: string | undefined
) {
  const policy = policies[action];
  let admitted = false;
  const denied = new Error("auth_admission_denied");
  try {
    const secret = getConfig().JWT_SECRET;
    if (!secret) throw new Error();
    const subkey = createHmac("sha256", secret).update(policy.domain).digest();
    const key = (scope: string, value: string) =>
      createHmac("sha256", subkey)
        .update(JSON.stringify([scope, value]))
        .digest("hex");
    const quotas = [
      { key: policy.global, limit: policy.globalLimit },
      { key: key("ip", sourceAddress(ip)), limit: policy.sourceLimit },
      {
        // Bearer tokens are opaque and case-sensitive; email normalization must
        // never merge distinct bearer links or change the token being redeemed.
        key: key(
          action === "passwordReset" || action === "verificationRedemption"
            ? "token"
            : action === "haiFeed"
              ? "owner"
              : "email",
          action === "passwordReset" || action === "verificationRedemption"
            ? identity
            : identity.trim().toLowerCase()
        ),
        limit: policy.emailLimit,
      },
    ];
    subkey.fill(0);
    const db = await getDb();
    if (!db) throw new Error();
    admitted = await retryRolledBackDeadlock(() =>
      db.transaction(async tx => {
        await requireOutreachUtcSession(tx);
        // The existing login service row is the first lock for all families,
        // including cleanup. Each family has its own separate global budget.
        // These stable service keys are independent of secret rotation.
        await tx
          .insert(loginAttemptQuotas)
          .values({
            key: "login-global-v1",
            used: 0,
            expiresAt: sql`CURRENT_TIMESTAMP`,
          })
          .onDuplicateKeyUpdate({ set: { key: "login-global-v1" } });
        await tx
          .select()
          .from(loginAttemptQuotas)
          .where(eq(loginAttemptQuotas.key, "login-global-v1"))
          .for("update");
        // Read time after lock acquisition, never before a possibly long wait.
        const [clock] = await tx.execute(
          sql`SELECT UNIX_TIMESTAMP(CURRENT_TIMESTAMP) AS seconds`
        );
        const seconds = Number(
          (clock as unknown as Array<{ seconds: number }>)[0]?.seconds
        );
        if (!Number.isSafeInteger(seconds)) throw new Error();
        const now = new Date(seconds * 1000),
          expiresAt = new Date((seconds + policy.windowSeconds) * 1000);
        // Bounded opportunistic expiry, only for these security counters. Never
        // delete the service mutex or a live address/IP budget.
        await tx.execute(
          sql`DELETE FROM login_attempt_quotas WHERE quota_key NOT IN ('login-global-v1', 'registration-global-v1', 'password-reset-global-v1', 'verification-redemption-global-v1', 'hai-feed-global-v1') AND expires_at <= ${now} ORDER BY expires_at LIMIT 100`
        );
        const counters = [];
        for (const quota of quotas) {
          await tx
            .insert(loginAttemptQuotas)
            .values({ key: quota.key, used: 0, expiresAt })
            .onDuplicateKeyUpdate({ set: { key: quota.key } });
          const [row] = await tx
            .select()
            .from(loginAttemptQuotas)
            .where(eq(loginAttemptQuotas.key, quota.key))
            .for("update");
          if (
            !row ||
            !Number.isSafeInteger(row.used) ||
            row.used < 0 ||
            !Number.isFinite(row.expiresAt.getTime())
          )
            throw new Error();
          const used = row.expiresAt <= now ? 0 : row.used;
          if (used >= quota.limit) throw denied;
          counters.push({
            key: quota.key,
            used: used + 1,
            expiresAt: row.expiresAt <= now ? expiresAt : row.expiresAt,
          });
        }
        for (const counter of counters)
          await tx
            .update(loginAttemptQuotas)
            .set(counter)
            .where(eq(loginAttemptQuotas.key, counter.key));
        return true;
      })
    );
  } catch (error) {
    if (error !== denied)
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: policy.unavailable,
      });
  }
  if (!admitted)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: policy.exhausted,
    });
}
