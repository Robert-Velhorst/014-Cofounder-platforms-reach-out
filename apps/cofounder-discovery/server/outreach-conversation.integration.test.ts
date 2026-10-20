import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  outreachRecords,
  prospects,
  users,
  type User,
} from "../drizzle/schema";
import { getDb } from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";
import { canTransition } from "./outreach-state";

let owners: User[] = [],
  ids: number[] = [],
  candidates: number[] = [];
const api = (owner = 0) =>
  criticalPathRouter.createCaller({
    user: owners[owner],
    requestId: randomUUID(),
    req: {},
    res: {},
  } as TrpcContext);
const identity = () => ({ id: ids[0], accountId: owners[0].id });
const review = async () => ({
  ...identity(),
  expectedRevision: (await api().outreach.details(identity())).revision,
  idempotencyKey: randomUUID(),
});
const command = async (action: string, extra = {}) => ({
  ...(await review()),
  action,
  ...extra,
});
const change = (input: unknown, owner = 0) =>
  (api(owner).outreach as any).conversation(input);
const list = (extra = {}, owner = 0) =>
  (api(owner).outreach as any).reminders({
    accountId: owners[owner].id,
    filter: "all",
    page: 1,
    pageSize: 2,
    ...extra,
  });
const row = async () =>
  (
    await (await getDb())!
      .select()
      .from(outreachRecords)
      .where(eq(outreachRecords.id, ids[0]))
  )[0];
const future = () => new Date(Date.now() + 3600000).toISOString();

describe("reviewed conversation outcomes and internal reminders", () => {
  beforeEach(async () => {
    owners = [];
    ids = [];
    candidates = [];
    const db = (await getDb())!;
    for (let i = 0; i < 2; i++) {
      const [owner] = await db
        .insert(users)
        .values({ openId: `conversation-${randomUUID()}`, emailVerified: 1 })
        .$returningId();
      owners.push(
        (await db.select().from(users).where(eq(users.id, owner.id)))[0]
      );
      const [candidate] = await db
        .insert(prospects)
        .values({
          userId: owner.id,
          name: `Synthetic candidate ${i}`,
          platform: "manual",
          consentStatus: "opted_in",
          linkedInData: { secret: "never-return-provider-data" },
        })
        .$returningId();
      candidates.push(candidate.id);
      const [record] = await db
        .insert(outreachRecords)
        .values({
          userId: owner.id,
          prospectId: candidate.id,
          body: "Synthetic historical message",
          generationMode: "user_authored",
          idempotencyKey: randomUUID(),
          state: "confirmed_sent",
          confirmedSentAt: new Date(Date.now() - 86400000),
        })
        .$returningId();
      ids.push(record.id);
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    const db = (await getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db
        .delete(idempotencyRecords)
        .where(eq(idempotencyRecords.userId, owner.id));
      await db
        .delete(outreachRecords)
        .where(eq(outreachRecords.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("schedules and reschedules an internal reminder without changing sent history", async () => {
    const before = await row();
    await change(await command("schedule_reminder", { followUpAt: future() }));
    expect(await row()).toMatchObject({
      state: "confirmed_sent",
      confirmedSentAt: before.confirmedSentAt,
      body: before.body,
      followUpAt: expect.any(Date),
    });
    await change(
      await command("schedule_reminder", {
        followUpAt: new Date(Date.now() + 7200000).toISOString(),
      })
    );
    expect((await list()).total).toBe(1);
    expect((await list({ filter: "due" })).total).toBe(0);
    expect((await list({ filter: "scheduled" })).total).toBe(1);
  });
  it("rejects past dates at execution time, not at module initialization", async () => {
    await change(await command("schedule_reminder", { followUpAt: future() }));
    await expect(
      change(
        await command("schedule_reminder", {
          followUpAt: new Date(Date.now() - 1000).toISOString(),
        })
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("records a confirmed response, clears its old reminder, and permits a new internal reminder", async () => {
    await change(await command("schedule_reminder", { followUpAt: future() }));
    await expect(
      change(await command("record_response"))
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await change(await command("record_response", { confirmed: true }));
    const responseAt = (await row()).responseRecordedAt;
    expect(await row()).toMatchObject({
      state: "responded",
      followUpAt: null,
      responseRecordedAt: expect.any(Date),
    });
    await change(await command("schedule_reminder", { followUpAt: future() }));
    expect(await row()).toMatchObject({
      state: "responded",
      responseRecordedAt: responseAt,
    });
    await expect(
      change(await command("record_response", { confirmed: true }))
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("cancels reminders and closes while retaining timestamps and message content", async () => {
    await change(await command("schedule_reminder", { followUpAt: future() }));
    await change(await command("cancel_reminder"));
    expect((await row()).followUpAt).toBeNull();
    await change(await command("schedule_reminder", { followUpAt: future() }));
    await change(await command("close", { confirmed: true }));
    expect(await row()).toMatchObject({
      state: "closed",
      closedAt: expect.any(Date),
      confirmedSentAt: expect.any(Date),
      followUpAt: null,
      body: "Synthetic historical message",
    });
    expect((await list()).total).toBe(0);
    await expect(
      change(await command("schedule_reminder", { followUpAt: future() }))
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("replays identical retries once, even after closure, and rejects a reused key with different content", async () => {
    const input = await command("schedule_reminder", { followUpAt: future() });
    const results = await Promise.all([change(input), change(input)]);
    expect(results.filter(r => r.replayed)).toHaveLength(1);
    await change(await command("close", { confirmed: true }));
    expect(await change(input)).toMatchObject({
      replayed: true,
      outreach: { state: "closed", followUpAt: null },
    });
    await expect(
      change({
        ...input,
        followUpAt: new Date(Date.now() + 7200000).toISOString(),
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const events = await (await getDb())!
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.userId, owners[0].id),
          eq(auditEvents.action, "outreach.conversation")
        )
      );
    expect(events).toHaveLength(2);
    expect(JSON.stringify(events)).not.toContain(
      "Synthetic historical message"
    );
  });
  it("rejects stale review after another conversation or candidate change", async () => {
    const stale = await command("close", { confirmed: true });
    await change(await command("schedule_reminder", { followUpAt: future() }));
    await expect(change(stale)).rejects.toMatchObject({ code: "CONFLICT" });
    const staleCandidate = await command("close", { confirmed: true });
    await (await getDb())!
      .update(prospects)
      .set({ name: "Changed candidate" })
      .where(eq(prospects.id, candidates[0]));
    await expect(change(staleCandidate)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
  it("blocks cross-account records, changed accounts, and revoked stored verification", async () => {
    const input = await command("close", { confirmed: true });
    await expect(change(input, 1)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(change({ ...input, id: ids[1] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(list({ accountId: owners[1].id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await (await getDb())!
      .update(users)
      .set({ emailVerified: 0 })
      .where(eq(users.id, owners[0].id));
    await expect(change(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each(["opted_out", "archived"])(
    "suppresses %s reminders but still permits historical response and closure",
    async status => {
      await change(
        await command("schedule_reminder", { followUpAt: future() })
      );
      await (await getDb())!
        .update(prospects)
        .set(
          status === "archived"
            ? { archivedAt: new Date() }
            : { consentStatus: "opted_out" }
        )
        .where(eq(prospects.id, candidates[0]));
      expect((await list()).total).toBe(0);
      await expect(
        change(await command("schedule_reminder", { followUpAt: future() }))
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await change(await command("cancel_reminder"));
      await change(await command("record_response", { confirmed: true }));
      await change(await command("close", { confirmed: true }));
    }
  );
  it.each([
    "draft",
    "pending_review",
    "approved",
    "manual_action_required",
    "cancelled",
    "closed",
  ])("rejects conversation changes for %s records", async state => {
    await (await getDb())!
      .update(outreachRecords)
      .set({ state: state as any })
      .where(eq(outreachRecords.id, ids[0]));
    await expect(
      change(await command("record_response", { confirmed: true }))
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("requires recorded sent evidence and never returns old sent records to review", async () => {
    expect(canTransition("follow_up_due", "pending_review")).toBe(false);
    await (await getDb())!
      .update(outreachRecords)
      .set({ confirmedSentAt: null })
      .where(eq(outreachRecords.id, ids[0]));
    await expect(
      change(await command("schedule_reminder", { followUpAt: future() }))
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("paginates due reminders deterministically without another account or provider payloads", async () => {
    const db = (await getDb())!;
    await db
      .update(outreachRecords)
      .set({ followUpAt: new Date(Date.now() - 60000) })
      .where(eq(outreachRecords.id, ids[0]));
    await db
      .update(outreachRecords)
      .set({ followUpAt: new Date(Date.now() - 60000) })
      .where(eq(outreachRecords.id, ids[1]));
    for (let i = 0; i < 3; i++)
      await db.insert(outreachRecords).values({
        userId: owners[0].id,
        prospectId: candidates[0],
        body: "Hidden body",
        idempotencyKey: randomUUID(),
        state: "follow_up_due",
        confirmedSentAt: new Date(Date.now() - 86400000),
        followUpAt: new Date(Date.now() - 60000),
      });
    const first = await list({ filter: "due" }),
      second = await list({ filter: "due", page: 2 });
    expect(first.total).toBe(4);
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    const returned = [...first.items, ...second.items].map(r => r.id);
    expect(new Set(returned).size).toBe(4);
    expect(returned).not.toContain(ids[1]);
    expect(JSON.stringify(first)).not.toMatch(
      /never-return-provider-data|Hidden body|Synthetic historical message/
    );
    expect(first.items.every((r: any) => r.due)).toBe(true);
  });
  it("rolls back the change and retry receipt when its audit cannot persist", async () => {
    const db = (await getDb())!,
      constraint = `conversation_audit_${owners[0].id}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE audit_events ADD CONSTRAINT ${constraint} CHECK (NOT (user_id = ${owners[0].id} AND action = 'outreach.conversation'))`
      )
    );
    const input = await command("close", { confirmed: true });
    try {
      await expect(change(input)).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE audit_events DROP CHECK ${constraint}`)
      );
    }
    expect((await row()).state).toBe("confirmed_sent");
    expect(await change(input)).toMatchObject({
      replayed: false,
      outreach: { state: "closed" },
    });
  });
  it("rejects legacy unreviewed mutation payloads instead of leaving bypass routes", async () => {
    for (const method of ["recordResponse", "scheduleFollowUp", "close"]) {
      await expect(
        (api().outreach as any)[method]({ id: ids[0], followUpAt: future() })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });
  it("keeps recorded sent and response metrics after closure", async () => {
    await change(await command("record_response", { confirmed: true }));
    await change(await command("close", { confirmed: true }));
    expect(await api().analytics()).toMatchObject({
      confirmedSent: 1,
      responses: 1,
      responseRate: 100,
      counts: { closed: 1 },
    });
  });
  it("rejects non-UTC database sessions before misinterpreting reminder dates", async () => {
    const input = await command("schedule_reminder", { followUpAt: future() });
    const db = (await getDb())!,
      originalTransaction = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      originalTransaction(async tx => {
        const [rows] = await tx.execute(
          sql`SELECT @@session.time_zone AS zone`
        );
        const original = (rows as unknown as Array<{ zone: string }>)[0].zone;
        await tx.execute(sql`SET SESSION time_zone = '+02:00'`);
        try {
          return await callback(tx);
        } finally {
          await tx.execute(sql`SET SESSION time_zone = ${original}`);
        }
      }, config)
    );
    await expect(change(input)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    await expect(list()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    await expect(api().outreach.details(identity())).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect((await row()).followUpAt).toBeNull();
  });
  it("uses database time despite a fast application clock and rejects excessively distant reminders", async () => {
    const input = await command("schedule_reminder", { followUpAt: future() });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2035-01-01T00:00:00Z"));
    await change(input);
    await expect(
      change(await command("schedule_reminder", { followUpAt: future() }))
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
