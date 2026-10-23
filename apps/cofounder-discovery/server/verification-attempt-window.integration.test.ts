import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { eq, inArray, sql } from "drizzle-orm";
import {
  accountMailQuotas,
  users,
  auditEvents,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { sendVerification } from "./account-mail";
import { resetConfigForTests } from "./config";
import { verificationAttemptQuotaKey } from "./verification-attempt-window";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dispatchKeys = [
  "account-mail:dispatch:day:v1",
  "account-mail:dispatch:month:v1",
];
let owners: User[] = [],
  keys: string[] = [],
  messages: string[] = [];
const ownerWindow = async (index = 0) =>
  (
    await (await data.getDb())!
      .select()
      .from(accountMailQuotas)
      .where(eq(accountMailQuotas.key, keys[index]))
  )[0];
const budget = async () =>
  (await data.getDb())!
    .select()
    .from(accountMailQuotas)
    .where(inArray(accountMailQuotas.key, dispatchKeys))
    .orderBy(accountMailQuotas.key);
const verify = (index = 0) =>
  sendVerification({ id: owners[index].id, email: owners[index].email });
const stored = async (index = 0) => (await data.getUserById(owners[index].id))!;

describe("shared verification hourly attempt window", () => {
  beforeEach(async () => {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error("isolated_verification_database_required");
    owners = [];
    keys = [];
    messages = [];
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-verification-window-shared-secret-more-than-32-characters"
    );
    vi.stubEnv("RESEND_API_KEY", "synthetic-verification-provider-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://example.invalid");
    vi.stubEnv("ACCOUNT_MAIL_DAILY_ATTEMPTS", "100");
    vi.stubEnv("ACCOUNT_MAIL_MONTHLY_ATTEMPTS", "1000");
    resetConfigForTests();
    const db = (await data.getDb())!;
    await db
      .delete(accountMailQuotas)
      .where(inArray(accountMailQuotas.key, dispatchKeys));
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `verification-window-${randomUUID()}`,
          email: `${randomUUID()}@example.invalid`,
          passwordHash: "synthetic-hash",
          emailVerified: 0,
        })
        .$returningId();
      owners.push((await data.getUserById(created.id))!);
      keys.push(verificationAttemptQuotaKey(created.id));
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        expect(url).toBe("https://api.resend.com/emails");
        messages.push(JSON.parse(String(init.body)).text);
        return new Response(
          JSON.stringify({ id: `synthetic-ack-${messages.length}` }),
          { status: 200 }
        );
      })
    );
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
    await db
      .delete(accountMailQuotas)
      .where(inArray(accountMailQuotas.key, [...keys, ...dispatchKeys]));
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetConfigForTests();
  });
  it("admits only three of four concurrent requests and records each admitted attempt once", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () => verify())
    );
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(3);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect((await ownerWindow()).used).toBe(3);
    expect(messages).toHaveLength(3);
    expect((await budget()).map(row => row.used)).toEqual([3, 3]);
  });
  it("preserves the existing usable token and all counters when a fourth replacement is refused", async () => {
    for (let i = 0; i < 3; i++) await verify();
    const before = await stored(),
      counter = await ownerWindow(),
      dispatch = await budget();
    await expect(verify()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await stored()).verificationToken).toBe(before.verificationToken);
    expect((await stored()).verificationTokenExpiry).toEqual(
      before.verificationTokenExpiry
    );
    expect(await ownerWindow()).toEqual(counter);
    expect(await budget()).toEqual(dispatch);
    expect(messages).toHaveLength(3);
    const token = new URL(messages[2].match(/https:\/\/\S+/)![0]).hash.slice(
      "#token=".length
    );
    expect(await data.verifyEmailToken(token)).toMatchObject({
      id: owners[0].id,
    });
  });
  it("charges three uncertain provider failures but makes no fourth transport attempt", async () => {
    const transport = vi.fn(async () => {
      throw new Error("synthetic-private-provider-failure");
    });
    vi.stubGlobal("fetch", transport);
    for (let i = 0; i < 3; i++)
      await expect(verify()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    await expect(verify()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(transport).toHaveBeenCalledTimes(3);
    expect((await ownerWindow()).used).toBe(3);
    expect((await budget()).map(row => row.used)).toEqual([3, 3]);
  });
  it("rolls back hourly admission when the shared service budget refuses replacement", async () => {
    await verify();
    const before = await ownerWindow(),
      token = (await stored()).verificationToken;
    vi.stubEnv("ACCOUNT_MAIL_DAILY_ATTEMPTS", "0");
    resetConfigForTests();
    await expect(verify()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await ownerWindow()).toEqual(before);
    expect((await stored()).verificationToken).toBe(token);
    expect(messages).toHaveLength(1);
    vi.stubEnv("ACCOUNT_MAIL_DAILY_ATTEMPTS", "100");
    resetConfigForTests();
    await verify();
    expect((await ownerWindow()).used).toBe(2);
  });
  it("rolls back owner/global counters when token persistence fails", async () => {
    const db = (await data.getDb())!,
      constraint = `verification_window_${owners[0].id}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE users ADD CONSTRAINT ${constraint} CHECK (openId <> '${owners[0].openId}' OR verificationToken IS NULL)`
      )
    );
    try {
      await expect(verify()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      expect(await ownerWindow()).toBeUndefined();
      expect(await budget()).toHaveLength(0);
      expect(messages).toHaveLength(0);
    } finally {
      await db.execute(sql.raw(`ALTER TABLE users DROP CHECK ${constraint}`));
    }
    await verify();
    expect((await ownerWindow()).used).toBe(1);
  });
  it("reopens only the expired owner's database-clock window", async () => {
    for (let i = 0; i < 3; i++) {
      await verify();
      await verify(1);
    }
    const second = await ownerWindow(1);
    await (await data.getDb())!
      .update(accountMailQuotas)
      .set({ expiresAt: sql`CURRENT_TIMESTAMP - INTERVAL 1 SECOND` })
      .where(eq(accountMailQuotas.key, keys[0]));
    await verify();
    expect((await ownerWindow()).used).toBe(1);
    await expect(verify(1)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await ownerWindow(1)).toEqual(second);
    expect((await budget()).map(row => row.used)).toEqual([7, 7]);
  });
  it("ignores an application's jumped-forward clock and does not extend a live window", async () => {
    await verify();
    const expiry = (await ownerWindow()).expiresAt;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2035-01-01T00:00:00Z"));
    await verify();
    await verify();
    await expect(verify()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await ownerWindow()).expiresAt).toEqual(expiry);
    expect(messages).toHaveLength(3);
  });
  it("refuses malformed owner counters without changing a link or dispatch budget", async () => {
    await verify();
    const token = (await stored()).verificationToken,
      dispatch = await budget();
    await (await data.getDb())!
      .update(accountMailQuotas)
      .set({ used: -1 })
      .where(eq(accountMailQuotas.key, keys[0]));
    await expect(verify()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Account email is temporarily unavailable. Please try again later.",
    });
    expect((await stored()).verificationToken).toBe(token);
    expect(await budget()).toEqual(dispatch);
    expect(messages).toHaveLength(1);
  });
  it.each(["email", "fence"])(
    "refuses stale %s state before charging either allowance",
    async kind => {
      if (kind === "fence")
        await (await data.getDb())!
          .update(users)
          .set({ deletionFencedAt: new Date() })
          .where(eq(users.id, owners[0].id));
      await expect(
        sendVerification({
          id: owners[0].id,
          email: kind === "email" ? "stale@example.invalid" : owners[0].email,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await ownerWindow()).toBeUndefined();
      expect(await budget()).toHaveLength(0);
      expect(messages).toHaveLength(0);
    }
  );
  it("fails closed without the shared secret before token replacement or transport", async () => {
    vi.stubEnv("JWT_SECRET", "");
    resetConfigForTests();
    await expect(verify()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect((await stored()).verificationToken).toBeNull();
    expect(messages).toHaveLength(0);
    expect(
      await (await data.getDb())!
        .select()
        .from(accountMailQuotas)
        .where(inArray(accountMailQuotas.key, keys))
    ).toHaveLength(0);
  });
  it("shares the last owner slot with two fresh processes after reconnect", async () => {
    await verify();
    await verify();
    await data.closeDb();
    const child = () =>
      promisify(execFile)(
        process.execPath,
        [
          "--import",
          "tsx",
          fileURLToPath(
            new URL("./test-fixtures/mail-budget-child.ts", import.meta.url)
          ),
          String(owners[0].id),
        ],
        { env: process.env, timeout: 12000 }
      );
    const results = await Promise.all([child(), child()]);
    expect(
      results
        .map(result => JSON.parse(result.stdout.trim().split("\n").pop()!).code)
        .sort()
    ).toEqual(["ACCEPTED", "TOO_MANY_REQUESTS"]);
    for (const result of results)
      expect(result.stdout + result.stderr).not.toContain(owners[0].email!);
    expect((await ownerWindow()).used).toBe(3);
    expect((await budget()).map(row => row.used)).toEqual([3, 3]);
  });
  it("enforces the same shared limit through the authenticated route without a local fallback", async () => {
    const api = () =>
      appRouter.createCaller({
        user: owners[0],
        req: { ip: randomUUID(), headers: {} },
        res: {},
        requestId: randomUUID(),
      } as unknown as TrpcContext);
    for (let i = 0; i < 3; i++) await api().auth.sendVerificationEmail();
    await data.closeDb();
    await expect(api().auth.sendVerificationEmail()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect((await ownerWindow()).used).toBe(3);
    expect(messages).toHaveLength(3);
  });
});
