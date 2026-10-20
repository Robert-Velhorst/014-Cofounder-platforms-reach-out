import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  matches,
  outreachRecords,
  prospects,
  userProfiles,
  users,
  type User,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { criticalPathRouter } from "./critical-path-router";
import { getDb } from "./db";
import * as data from "./db";

function context(user: User): TrpcContext {
  return {
    user,
    requestId: `critical-path-test-${Date.now()}-${Math.random()}`,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("critical path database integration", () => {
  const run = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  let firstUser: User;
  let secondUser: User;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const ids = await db
      .insert(users)
      .values([
        {
          openId: `critical-first-${run}`,
          email: `critical-first-${run}@test.invalid`,
          name: "First Founder",
          loginMethod: "test",
          emailVerified: 1,
        },
        {
          openId: `critical-second-${run}`,
          email: `critical-second-${run}@test.invalid`,
          name: "Second Founder",
          loginMethod: "test",
          emailVerified: 1,
        },
      ])
      .$returningId();
    const rows = await db.select().from(users);
    firstUser = rows.find(user => user.id === ids[0].id)!;
    secondUser = rows.find(user => user.id === ids[1].id)!;
    await db.insert(userProfiles).values({
      userId: firstUser.id,
      skills: ["TypeScript"],
      lookingFor: ["TypeScript"],
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db || !firstUser || !secondUser) return;
    for (const user of [firstUser, secondUser]) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, user.id));
      await db
        .delete(idempotencyRecords)
        .where(eq(idempotencyRecords.userId, user.id));
      await db
        .delete(outreachRecords)
        .where(eq(outreachRecords.userId, user.id));
      await db.delete(matches).where(eq(matches.userId, user.id));
      await db.delete(prospects).where(eq(prospects.userId, user.id));
      await db.delete(userProfiles).where(eq(userProfiles.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });

  it("imports idempotently, isolates owners, and completes assisted outreach", async () => {
    const first = criticalPathRouter.createCaller(context(firstUser));
    const second = criticalPathRouter.createCaller(context(secondUser));
    const csv = [
      "name,title,skills,platform,profileUrl,consentStatus",
      "Ada Founder,CTO,TypeScript,manual,,opted_in",
    ].join("\n");

    const initial = await first.prospects.importCsv({
      csv,
      accountId: firstUser.id,
      declaration: {
        collectionMethod: "direct_from_person",
        rightsConfirmed: true,
        evidenceReference: "synthetic-contact-001",
      },
      idempotencyKey: `import-${run}`,
    });
    const replay = await first.prospects.importCsv({
      csv,
      accountId: firstUser.id,
      declaration: {
        collectionMethod: "direct_from_person",
        rightsConfirmed: true,
        evidenceReference: "synthetic-contact-001",
      },
      idempotencyKey: `import-${run}`,
    });
    expect(initial).toMatchObject({ imported: 1, skipped: 0, replayed: false });
    expect(replay).toMatchObject({ imported: 1, skipped: 0, replayed: true });

    const firstList = await first.prospects.list();
    const secondList = await second.prospects.list();
    expect(firstList.total).toBe(1);
    expect(secondList.total).toBe(0);

    const prospect = firstList.items[0];
    const qualification = await first.qualify({
      prospectId: prospect.id,
      idempotencyKey: `qualify-${run}`,
    });
    expect(qualification.match?.userId).toBe(firstUser.id);

    const draft = await first.outreach.draft({
      prospectId: prospect.id,
      matchId: qualification.match!.id,
      body: "Would you like to discuss collaborating on our next project?",
      declaration: { humanOriginal: true, rulesReviewed: true },
      idempotencyKey: `draft-${run}`,
    });
    expect(draft.outreach?.state).toBe("draft");

    const pending = await first.outreach.submitReview({
      id: draft.outreach!.id,
    });
    const approved = await first.outreach.approve({ id: draft.outreach!.id });
    const manual = await first.outreach.prepareManualSend({
      id: draft.outreach!.id,
    });
    expect(
      await first.outreach.manualAction({ id: draft.outreach!.id })
    ).toEqual({
      body: "Would you like to discuss collaborating on our next project?",
      destinationUrl: null,
    });
    await expect(
      second.outreach.manualAction({ id: draft.outreach!.id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const db = (await getDb())!;
    await db
      .update(prospects)
      .set({ consentStatus: "opted_out" })
      .where(eq(prospects.id, prospect.id));
    await expect(
      first.outreach.manualAction({ id: draft.outreach!.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    // Historical confirmation remains possible; it does not authorize a new send.
    const sent = await first.outreach.confirmSent({
      id: draft.outreach!.id,
      confirmation: true,
      externalReference: `manual-test-${run}`,
    });
    expect(pending?.state).toBe("pending_review");
    expect(approved?.state).toBe("approved");
    expect(manual?.state).toBe("manual_action_required");
    expect(sent?.state).toBe("confirmed_sent");
    expect((await second.outreach.list()).length).toBe(0);
  });

  async function freshDraft(label: string) {
    const db = (await getDb())!;
    const [created] = await db
      .insert(prospects)
      .values({
        userId: firstUser.id,
        name: `Synthetic ${label}`,
        platform: "manual",
        consentStatus: "opted_in",
      })
      .$returningId();
    const first = criticalPathRouter.createCaller(context(firstUser));
    const { outreach } = await first.outreach.draft({
      prospectId: created.id,
      body: "Synthetic human-written message for database verification.",
      declaration: { humanOriginal: true, rulesReviewed: true },
      idempotencyKey: `${label}-${run}`,
    });
    return { first, id: outreach!.id };
  }

  it("commits only one concurrent transition and one success audit", async () => {
    const { first, id } = await freshDraft("concurrent");
    // Schedule the old nonlocking reader's two real DB snapshots before either
    // writer continues. The replacement transactional reader must serialize them.
    const originalRead = data.getOutreachRecord;
    let reads = 0;
    let release!: () => void;
    const bothRead = new Promise<void>(resolve => {
      release = resolve;
    });
    const spy = vi
      .spyOn(data, "getOutreachRecord")
      .mockImplementation(async (...args) => {
        const row = await originalRead(...args);
        if (++reads <= 2) {
          if (reads === 2) release();
          await bothRead;
        }
        return row;
      });
    let outcomes;
    try {
      outcomes = await Promise.allSettled([
        first.outreach.submitReview({ id }),
        first.outreach.submitReview({ id }),
      ]);
    } finally {
      spy.mockRestore();
    }
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(
      1
    );
    expect(outcomes.find(item => item.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
    const db = (await getDb())!;
    const events = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.userId, firstUser.id),
          eq(auditEvents.entityId, String(id)),
          eq(auditEvents.action, "outreach.transition"),
          eq(auditEvents.outcome, "success")
        )
      );
    expect(events).toHaveLength(1);
    const rejected = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.userId, firstUser.id),
          eq(auditEvents.entityId, String(id)),
          eq(auditEvents.action, "outreach.transition"),
          eq(auditEvents.outcome, "rejected")
        )
      );
    expect(rejected).toHaveLength(1);
    expect((await data.getOutreachRecord(id, firstUser.id))?.state).toBe(
      "pending_review"
    );
  });

  it("rolls back a state change when the actual MySQL audit insert fails", async () => {
    const { id } = await freshDraft("audit-failure");
    // Exceed the real audit column's limit to fail INSERT, without replacing
    // transaction/storage behavior or introducing production fault hooks.
    const failing = criticalPathRouter.createCaller({
      ...context(firstUser),
      requestId: "x".repeat(65),
    });
    await expect(failing.outreach.submitReview({ id })).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Outreach storage is temporarily unavailable. Please try again.",
    });
    expect((await data.getOutreachRecord(id, firstUser.id))?.state).toBe(
      "draft"
    );
    const db = (await getDb())!;
    const events = await db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.userId, firstUser.id),
          eq(auditEvents.entityId, String(id)),
          eq(auditEvents.action, "outreach.transition")
        )
      );
    expect(events).toHaveLength(0);
  });

  it("waits for an in-flight opt-out and rejects preparation using the committed consent", async () => {
    const { first, id } = await freshDraft("optout-race");
    await first.outreach.submitReview({ id });
    await first.outreach.approve({ id });
    const db = (await getDb())!;
    const row = (await data.getOutreachRecord(id, firstUser.id))!;
    let locked!: () => void;
    let release!: () => void;
    const ready = new Promise<void>(resolve => {
      locked = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const optout = db.transaction(async tx => {
      await tx
        .update(prospects)
        .set({ consentStatus: "opted_out" })
        .where(eq(prospects.id, row.prospectId));
      locked();
      await gate;
    });
    await Promise.race([ready, optout]);
    const preparation = first.outreach.prepareManualSend({ id }).then(
      value => ({ value }),
      error => ({ error })
    );
    try {
      // NOWAIT fails only if the actual preparation transaction already holds
      // the outreach row while it waits behind the prospect's opt-out lock.
      await vi.waitFor(
        async () => {
          await expect(
            db.transaction(tx =>
              tx
                .select()
                .from(outreachRecords)
                .where(eq(outreachRecords.id, id))
                .for("update", { noWait: true })
            )
          ).rejects.toMatchObject({ cause: { code: "ER_LOCK_NOWAIT" } });
        },
        { timeout: 5_000 }
      );
    } finally {
      release();
      const [optoutResult] = await Promise.allSettled([optout, preparation]);
      if (optoutResult.status === "rejected") throw optoutResult.reason;
    }
    expect(await preparation).toMatchObject({ error: { code: "FORBIDDEN" } });
    expect((await data.getOutreachRecord(id, firstUser.id))?.state).toBe(
      "approved"
    );
  });
});
