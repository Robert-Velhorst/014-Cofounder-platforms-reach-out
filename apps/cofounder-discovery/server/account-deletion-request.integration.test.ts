import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  accountDeletionRequests,
  auditEvents,
  users,
  type User,
} from "../drizzle/schema";
import { resetConfigForTests } from "./config";
import { appRouter } from "./routers";
import { closeDb, getDb, getUserById } from "./db";
import { hashPassword } from "./auth-password";
import type { TrpcContext } from "./_core/context";

const password = "SyntheticDeletionRequest123!";
let credentialHash: string;
let owners: User[] = [];
const api = (index = 0) =>
  appRouter.createCaller({
    user: owners[index],
    requestId: randomUUID(),
    req: {},
    res: {},
  } as TrpcContext);
const request = (overrides = {}, index = 0) =>
  (api(index).accountData as any).requestDeletion({
    accountId: owners[index].id,
    password,
    confirmation: "REQUEST ACCOUNT DELETION",
    expectedRevision: 0,
    requestKey: randomUUID(),
    ...overrides,
  });
const status = (index = 0) =>
  (api(index).accountData as any).deletionStatus({
    accountId: owners[index].id,
  });
const withdraw = (current: any, overrides = {}) =>
  (api().accountData as any).withdrawDeletion({
    accountId: owners[0].id,
    password,
    confirmation: true,
    requestKey: current.requestKey,
    expectedRevision: current.revision,
    ...overrides,
  });

describe("review-held account deletion requests with MySQL", () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (url.hostname !== "127.0.0.1" || url.pathname !== "/cofounder_test")
      throw new Error("isolated_database_required");
    credentialHash = await hashPassword(password);
  });
  beforeEach(async () => {
    vi.stubEnv("ENABLE_ACCOUNT_DELETION_REQUESTS", "true");
    resetConfigForTests();
    owners = [];
    const db = (await getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `deletion-request-${randomUUID()}`,
          emailVerified: 1,
          passwordHash: credentialHash,
        })
        .$returningId();
      owners.push((await getUserById(created.id))!);
    }
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    resetConfigForTests();
    vi.restoreAllMocks();
    const db = (await getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("starts with no request and explicitly disabled erasure", async () => {
    expect(await status()).toMatchObject({
      accountId: owners[0].id,
      status: "none",
      revision: 0,
      requestKey: null,
      deletionEnabled: false,
    });
  });
  it("persists a password-confirmed request without fencing or deleting the account", async () => {
    const key = randomUUID();
    const result = await request({ requestKey: key });
    expect(result).toMatchObject({
      accountId: owners[0].id,
      status: "pending_review",
      requestKey: key,
      revision: 1,
      deletionEnabled: false,
    });
    await closeDb();
    expect(await status()).toEqual(result);
    expect(await getUserById(owners[0].id)).toMatchObject({
      deletionFencedAt: null,
      passwordHash: credentialHash,
    });
    expect(await status(1)).toMatchObject({ status: "none" });
    expect(JSON.stringify(result)).not.toContain(credentialHash);
  });
  it("rejects a wrong password without creating a request", async () => {
    await expect(
      request({ password: "WrongPassword123!" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await status()).toMatchObject({ status: "none", revision: 0 });
  });
  it("requires the exact account and explicit confirmation", async () => {
    await expect(request({ accountId: owners[1].id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(request({ confirmation: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(await status()).toMatchObject({ status: "none" });
  });
  it("replays a lost response once without another request or audit", async () => {
    const key = randomUUID();
    const result = await request({ requestKey: key });
    expect(await request({ requestKey: key })).toEqual(result);
    const events = await (await getDb())!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, owners[0].id));
    expect(
      events.filter(row => row.action === "account.deletion.request")
    ).toHaveLength(1);
  });
  it("withdraws the reviewed request and does not reopen it on an old retry", async () => {
    const key = randomUUID();
    const result = await request({ requestKey: key });
    const cancelled = await withdraw(result);
    expect(cancelled).toMatchObject({
      status: "withdrawn",
      revision: 2,
      requestKey: key,
    });
    expect(await withdraw(result)).toEqual(cancelled);
    await expect(request({ requestKey: key })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await status()).toEqual(cancelled);
  });
  it("accepts only one of two distinct simultaneous submissions", async () => {
    const results = await Promise.allSettled([request(), request()]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
  });
  it("does not withdraw a different or outdated request", async () => {
    const current = await request();
    await expect(
      withdraw(current, { requestKey: randomUUID() })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      withdraw(current, { expectedRevision: 0 })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      withdraw(current, { accountId: owners[1].id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await status()).toEqual(current);
  });
  it("can submit a new request after a confirmed withdrawal", async () => {
    const current = await request();
    const cancelled = await withdraw(current);
    const next = await request({ expectedRevision: cancelled.revision });
    expect(next).toMatchObject({
      status: "pending_review",
      revision: 3,
      withdrawnAt: null,
    });
    expect(next.requestKey).not.toBe(current.requestKey);
  });
  it("counts wrong passwords durably and recovers after the database window expires", async () => {
    for (let i = 0; i < 5; i++)
      await expect(request({ password: "wrong" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    await closeDb();
    await expect(request()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await status()).toMatchObject({ status: "none" });
    await (await getDb())!
      .update(accountDeletionRequests)
      .set({
        attemptWindowExpiresAt: sql`DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 SECOND)`,
      })
      .where(eq(accountDeletionRequests.userId, owners[0].id));
    expect(await request()).toMatchObject({ status: "pending_review" });
  });
  it("rejects stale credentials, unverified accounts and fenced accounts under the owner lock", async () => {
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ passwordHash: "replacement-hash" })
      .where(eq(users.id, owners[0].id));
    await expect(request()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await db
      .update(users)
      .set({ passwordHash: credentialHash, emailVerified: 0 })
      .where(eq(users.id, owners[0].id));
    await expect(request()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db
      .update(users)
      .set({ emailVerified: 1, deletionFencedAt: new Date() })
      .where(eq(users.id, owners[0].id));
    await expect(request()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("does not accept new requests when intake is disabled but preserves withdrawal", async () => {
    const current = await request();
    vi.stubEnv("ENABLE_ACCOUNT_DELETION_REQUESTS", "false");
    resetConfigForTests();
    expect(await status()).toMatchObject({
      requestsEnabled: false,
      status: "pending_review",
    });
    await expect(request({}, 1)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await withdraw(current)).toMatchObject({ status: "withdrawn" });
  });
  it("rolls back request creation if its content-free audit fails", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    const spy = vi
      .spyOn(db, "transaction")
      .mockImplementation((callback, config) =>
        run(async tx => {
          const insert = tx.insert.bind(tx);
          vi.spyOn(tx, "insert").mockImplementation(table => {
            if (table === auditEvents)
              throw new Error("synthetic_audit_failure");
            return insert(table);
          });
          return callback(tx);
        }, config)
      );
    try {
      await expect(request()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    } finally {
      spy.mockRestore();
    }
    expect(await status()).toMatchObject({ status: "none", revision: 0 });
    const [row] = await db
      .select()
      .from(accountDeletionRequests)
      .where(eq(accountDeletionRequests.userId, owners[0].id));
    expect(row.attempts).toBe(1);
  });
  it("rechecks credentials after admission and before changing the request", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    let phase = 0;
    const spy = vi
      .spyOn(db, "transaction")
      .mockImplementation(async (callback, config) => {
        if (++phase === 2)
          await db
            .update(users)
            .set({ passwordHash: "replacement-hash" })
            .where(eq(users.id, owners[0].id));
        return run(callback, config);
      });
    try {
      await expect(request()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    } finally {
      spy.mockRestore();
    }
    const [row] = await db
      .select()
      .from(accountDeletionRequests)
      .where(eq(accountDeletionRequests.userId, owners[0].id));
    expect(row).toMatchObject({ status: "none", revision: 0, attempts: 1 });
  });
  it("rejects anonymous status and commands before persisting anything", async () => {
    const anonymous = appRouter.createCaller({
      user: null,
      req: {},
      res: {},
      requestId: randomUUID(),
    } as TrpcContext);
    await expect(
      anonymous.accountData.deletionStatus({ accountId: owners[0].id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      anonymous.accountData.requestDeletion({
        accountId: owners[0].id,
        password,
        confirmation: "REQUEST ACCOUNT DELETION",
        expectedRevision: 0,
        requestKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(
      await (await getDb())!
        .select()
        .from(accountDeletionRequests)
        .where(eq(accountDeletionRequests.userId, owners[0].id))
    ).toHaveLength(0);
  });
  it("requires the password again to withdraw and keeps the request on failure", async () => {
    const current = await request();
    await expect(
      withdraw(current, { password: "wrong" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await status()).toEqual(current);
  });
  it("exports the owner's request state without password-confirmation material", async () => {
    const current = await request();
    const result = await api().accountData.export({
      accountId: owners[0].id,
      password,
      confirmation: true,
    });
    const exported = JSON.parse(result.json);
    expect(exported.data.accountDeletionRequests).toHaveLength(1);
    expect(exported.data.accountDeletionRequests[0]).toMatchObject({
      userId: owners[0].id,
      requestKey: current.requestKey,
      status: "pending_review",
    });
    expect(result.json).not.toContain(password);
    expect(result.json).not.toContain(credentialHash);
  });
});
