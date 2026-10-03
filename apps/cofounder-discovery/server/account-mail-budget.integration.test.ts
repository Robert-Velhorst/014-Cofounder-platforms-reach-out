import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { eq, inArray, sql } from "drizzle-orm";
import {
  accountMailJobs,
  accountMailQuotas,
  users,
  auditEvents,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { sendVerification } from "./account-mail";
import {
  processNextAccountMail,
  queuePasswordChanged,
  requestPasswordReset,
} from "./account-mail-queue";
import { resetConfigForTests } from "./config";
import { verificationAttemptQuotaKey } from "./verification-attempt-window";

const budgetKeys = [
  "account-mail:dispatch:day:v1",
  "account-mail:dispatch:month:v1",
];
const runChild = promisify(execFile);
let owners: User[] = [];
let secret: string;
let requestKeys: Set<string>;
let sent: Array<{
  body: { text: string; subject: string };
  key: string | null;
}>;
const limit = (daily: number, monthly = 100) => {
  vi.stubEnv("ACCOUNT_MAIL_DAILY_ATTEMPTS", String(daily));
  vi.stubEnv("ACCOUNT_MAIL_MONTHLY_ATTEMPTS", String(monthly));
  resetConfigForTests();
};
const quotaKey = (scope: string) => {
  const key = createHmac("sha256", secret)
    .update(`recovery-quota:${scope}`)
    .digest("hex");
  requestKeys.add(key);
  return key;
};
async function enqueue(index = 0, notice = false) {
  const user = owners[index];
  quotaKey(`email:${user.email}`);
  if (notice)
    await (await data.getDb())!.transaction(tx =>
      queuePasswordChanged(tx, { id: user.id, email: user.email! })
    );
  else {
    quotaKey("global");
    quotaKey(`ip:${user.openId}`);
    await requestPasswordReset(user.email!, user.openId);
  }
  const [job] = await (await data.getDb())!
    .select()
    .from(accountMailJobs)
    .where(eq(accountMailJobs.quotaKey, quotaKey(`email:${user.email}`)));
  return job;
}
async function budget() {
  const rows = await (await data.getDb())!
    .select()
    .from(accountMailQuotas)
    .where(inArray(accountMailQuotas.key, budgetKeys));
  return budgetKeys.map(key => rows.find(row => row.key === key)?.used ?? 0);
}
async function user(index = 0) {
  return (await data.getUserById(owners[index].id))!;
}
async function makeReady(id: string) {
  await (await data.getDb())!
    .update(accountMailJobs)
    .set({ availableAt: new Date(Date.now() - 1000) })
    .where(eq(accountMailJobs.id, id));
}
const verify = (index = 0) =>
  sendVerification({ id: owners[index].id, email: owners[index].email });

describe("shared durable account mail dispatch budget", () => {
  beforeEach(async () => {
    owners = [];
    requestKeys = new Set();
    sent = [];
    secret = randomUUID() + randomUUID();
    vi.stubEnv("AUTH_MAIL_ENCRYPTION_SECRET", secret);
    vi.stubEnv("RESEND_API_KEY", "synthetic-budget-provider-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://example.invalid");
    limit(100, 1000);
    const db = (await data.getDb())!;
    // This database is synthetic and test files run serially. These two exact
    // shared budget keys are reset only by this fixture, never by production.
    await db
      .delete(accountMailQuotas)
      .where(inArray(accountMailQuotas.key, budgetKeys));
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `mail-budget-${randomUUID()}`,
          email: `${randomUUID()}@example.invalid`,
          passwordHash: "synthetic-hash",
          emailVerified: 0,
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
      requestKeys.add(verificationAttemptQuotaKey(owner.id));
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        expect(url).toBe("https://api.resend.com/emails");
        sent.push({
          body: JSON.parse(String(init.body)),
          key: new Headers(init.headers).get("Idempotency-Key"),
        });
        return new Response(
          JSON.stringify({ id: `synthetic-ack-${sent.length}` }),
          { status: 200 }
        );
      })
    );
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    if (requestKeys.size) {
      await db
        .delete(accountMailJobs)
        .where(inArray(accountMailJobs.quotaKey, Array.from(requestKeys)));
      await db
        .delete(accountMailQuotas)
        .where(inArray(accountMailQuotas.key, Array.from(requestKeys)));
    }
    if (owners.length)
      await db.delete(auditEvents).where(
        inArray(
          auditEvents.userId,
          owners.map(owner => owner.id)
        )
      );
    for (const owner of owners)
      await db.delete(users).where(eq(users.id, owner.id));
    await db
      .delete(accountMailQuotas)
      .where(inArray(accountMailQuotas.key, budgetKeys));
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetConfigForTests();
  });
  it("shares the final daily verification slot across different accounts", async () => {
    limit(1);
    const results = await Promise.allSettled([verify(0), verify(1)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect(sent).toHaveLength(1);
    expect(await budget()).toEqual([1, 1]);
  });
  it("preserves a usable verification link when the monthly budget denies its replacement", async () => {
    limit(100, 1);
    await verify();
    const token = new URL(
      sent[0].body.text.match(/https:\/\/\S+/)![0]
    ).hash.slice("#token=".length);
    const before = (await user()).verificationToken;
    await expect(verify()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await user()).verificationToken).toBe(before);
    expect(await data.verifyEmailToken(token)).toMatchObject({
      id: owners[0].id,
    });
    expect(sent).toHaveLength(1);
  });
  it("charges uncertain provider failures without refunding an attempt", async () => {
    limit(1);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        sent.push({ body: { text: "failure", subject: "failure" }, key: null });
        throw new Error("synthetic network uncertainty");
      })
    );
    await expect(verify()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    await expect(verify(1)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(sent).toHaveLength(1);
    expect(await budget()).toEqual([1, 1]);
  });
  it("coordinates a queued recovery and direct verification against one shared slot", async () => {
    limit(1);
    const job = await enqueue(1);
    const results = await Promise.allSettled([
      verify(0),
      processNextAccountMail(),
    ]);
    expect(sent).toHaveLength(1);
    expect(await budget()).toEqual([1, 1]);
    const [stored] = await (await data.getDb())!
      .select()
      .from(accountMailJobs)
      .where(eq(accountMailJobs.id, job.id));
    if (
      results[1].status === "fulfilled" &&
      results[1].value === "budget_limited"
    ) {
      expect(stored).toMatchObject({
        state: "queued",
        attempts: 0,
        leaseUntil: null,
      });
      expect((await user(1)).passwordResetToken).toBeNull();
    } else {
      expect(stored).toMatchObject({ state: "accepted", attempts: 1 });
      expect(results[0]).toMatchObject({
        status: "rejected",
        reason: { code: "TOO_MANY_REQUESTS" },
      });
    }
  });
  it("defers a recovery retry without changing its attempt, token, message or idempotency key", async () => {
    limit(1);
    const job = await enqueue();
    const transport = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        await transport(url, init);
        throw new Error("synthetic lost response");
      })
    );
    expect(await processNextAccountMail()).toBe("retry");
    const token = (await user()).passwordResetToken;
    await makeReady(job.id);
    expect(await processNextAccountMail()).toBe("budget_limited");
    const [held] = await (await data.getDb())!
      .select()
      .from(accountMailJobs)
      .where(eq(accountMailJobs.id, job.id));
    expect(held).toMatchObject({
      state: "queued",
      attempts: 1,
      leaseUntil: null,
    });
    expect((await user()).passwordResetToken).toBe(token);
    expect(sent).toHaveLength(1);
    limit(2);
    await makeReady(job.id);
    vi.stubGlobal("fetch", transport);
    expect(await processNextAccountMail()).toBe("accepted");
    expect(sent[1]).toEqual(sent[0]);
    expect(await budget()).toEqual([2, 2]);
  });
  it("counts password-change notices and lets budget-deferred expired jobs be discarded", async () => {
    limit(0);
    const job = await enqueue(0, true);
    expect(await processNextAccountMail()).toBe("budget_limited");
    expect(sent).toHaveLength(0);
    expect(await budget()).toEqual([0, 0]);
    const db = (await data.getDb())!;
    const [held] = await db
      .select()
      .from(accountMailJobs)
      .where(eq(accountMailJobs.id, job.id));
    expect(held).toMatchObject({ state: "queued", attempts: 0 });
    await db
      .update(accountMailJobs)
      .set({
        expiresAt: new Date(Date.now() - 1000),
        availableAt: new Date(Date.now() - 1000),
      })
      .where(eq(accountMailJobs.id, job.id));
    expect(await processNextAccountMail()).toBe("discarded");
    expect(sent).toHaveLength(0);
    limit(1);
    await enqueue(1, true);
    expect(await processNextAccountMail()).toBe("accepted");
    expect(await budget()).toEqual([1, 1]);
    await expect(verify()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
  it("does not reset the monthly budget when only the daily window expires", async () => {
    limit(1, 1);
    await verify();
    const db = (await data.getDb())!;
    await db
      .update(accountMailQuotas)
      .set({ expiresAt: sql`CURRENT_TIMESTAMP - INTERVAL 1 SECOND` })
      .where(eq(accountMailQuotas.key, budgetKeys[0]));
    await expect(verify(1)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await db
      .update(accountMailQuotas)
      .set({ expiresAt: sql`CURRENT_TIMESTAMP - INTERVAL 1 SECOND` })
      .where(inArray(accountMailQuotas.key, budgetKeys));
    expect(await verify(1)).toMatchObject({ success: true });
    expect(await budget()).toEqual([1, 1]);
  });
  it("uses the database clock rather than an application's jumped-forward clock", async () => {
    limit(1, 1);
    await verify();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2035-01-01T00:00:00Z"));
    await expect(verify(1)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(sent).toHaveLength(1);
  });
  it("does not reset sending allowances when the queue encryption secret changes", async () => {
    limit(1);
    await verify();
    vi.stubEnv("AUTH_MAIL_ENCRYPTION_SECRET", randomUUID() + randomUUID());
    resetConfigForTests();
    await expect(verify(1)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await budget()).toEqual([1, 1]);
  });
  it("rolls back budget admission when verification token persistence fails", async () => {
    limit(1);
    const db = (await data.getDb())!;
    const constraint = `mail_budget_${owners[0].id}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE users ADD CONSTRAINT ${constraint} CHECK (openId <> '${owners[0].openId}' OR verificationToken IS NULL)`
      )
    );
    try {
      await expect(verify()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      expect(await budget()).toEqual([0, 0]);
      expect(sent).toHaveLength(0);
    } finally {
      await db.execute(sql.raw(`ALTER TABLE users DROP CHECK ${constraint}`));
    }
    expect(await verify()).toMatchObject({ success: true });
    expect(await budget()).toEqual([1, 1]);
  });
  it("fails closed when dispatch quota storage is unavailable without replacing an existing link", async () => {
    await verify();
    const before = (await user()).verificationToken;
    const db = (await data.getDb())!,
      held = `mail_budget_unavailable_${randomUUID().replaceAll("-", "")}`;
    await db.execute(sql.raw(`RENAME TABLE account_mail_quotas TO ${held}`));
    try {
      await expect(verify()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      expect((await user()).verificationToken).toBe(before);
      expect(sent).toHaveLength(1);
    } finally {
      await db.execute(sql.raw(`RENAME TABLE ${held} TO account_mail_quotas`));
    }
  });
  it("allows only one of two fresh processes to dispatch the last monthly attempt", async () => {
    limit(100, 1);
    const child = (owner: User) =>
      runChild(
        process.execPath,
        [
          "--import",
          "tsx",
          fileURLToPath(
            new URL("./test-fixtures/mail-budget-child.ts", import.meta.url)
          ),
          String(owner.id),
        ],
        { env: process.env, timeout: 12000 }
      );
    const results = await Promise.all([child(owners[0]), child(owners[1])]);
    expect(
      results
        .map(r => JSON.parse(r.stdout.trim().split("\n").pop()!).code)
        .sort()
    ).toEqual(["ACCEPTED", "TOO_MANY_REQUESTS"]);
    expect(await budget()).toEqual([1, 1]);
  });
  it("rejects stale account email before issuing a token or spending shared budget", async () => {
    await expect(
      sendVerification({ id: owners[0].id, email: "stale@example.invalid" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await user()).verificationToken).toBeNull();
    expect(sent).toHaveLength(0);
    expect(await budget()).toEqual([0, 0]);
  });
  it.each([
    { zone: "+02:00", ageHours: 25, usable: false },
    { zone: "-07:00", ageHours: 23, usable: true },
  ])(
    "retains the 24-hour verification contract with database session $zone",
    async ({ zone, ageHours, usable }) => {
      const db = (await data.getDb())!;
      const realTransaction = db.transaction.bind(db);
      // Actual MySQL session and Drizzle mapper, not a mocked timestamp result.
      // Restore the connection's timezone before returning it to the shared pool.
      vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
        realTransaction(async tx => {
          const [rows] = await tx.execute(
            sql`SELECT @@session.time_zone AS zone`
          );
          const originalZone = (rows as unknown as Array<{ zone: string }>)[0]
            .zone;
          await tx.execute(sql`SET SESSION time_zone = ${zone}`);
          try {
            return await callback(tx);
          } finally {
            await tx.execute(sql`SET SESSION time_zone = ${originalZone}`);
          }
        }, config)
      );
      const started = Date.now();
      await verify();
      const token = new URL(
        sent[0].body.text.match(/https:\/\/\S+/)![0]
      ).hash.slice("#token=".length);
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(started + ageHours * 60 * 60 * 1000));
      const verified = await data.verifyEmailToken(token);
      if (usable) expect(verified).toMatchObject({ id: owners[0].id });
      else expect(verified).toBeNull();
    }
  );
  it("rolls back the reset token, budget and payload when the queue claim write fails", async () => {
    limit(1);
    const db = (await data.getDb())!;
    await db
      .update(users)
      .set({
        passwordResetToken: "previous-reset-digest",
        passwordResetTokenExpiry: new Date(Date.now() + 60_000),
      })
      .where(eq(users.id, owners[0].id));
    const job = await enqueue();
    const constraint = `mail_claim_${owners[0].id}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE account_mail_jobs ADD CONSTRAINT ${constraint} CHECK (id <> '${job.id}' OR attempts = 0)`
      )
    );
    try {
      await expect(processNextAccountMail()).rejects.toThrow();
      expect((await user()).passwordResetToken).toBe("previous-reset-digest");
      const [held] = await db
        .select()
        .from(accountMailJobs)
        .where(eq(accountMailJobs.id, job.id));
      expect(held).toMatchObject({
        state: "queued",
        attempts: 0,
        payload: job.payload,
        leaseUntil: null,
      });
      expect(await budget()).toEqual([0, 0]);
      expect(sent).toHaveLength(0);
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE account_mail_jobs DROP CHECK ${constraint}`)
      );
    }
    expect(await processNextAccountMail()).toBe("accepted");
    expect(await budget()).toEqual([1, 1]);
    expect(sent).toHaveLength(1);
  });
});
