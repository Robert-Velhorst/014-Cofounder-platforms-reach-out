import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  auditEvents,
  matches,
  outreachRecords,
  prospects,
  users,
  type User,
} from "../drizzle/schema";
import { criticalPathRouter } from "./critical-path-router";
import * as data from "./db";
import { resetRateLimitsForTests } from "./rate-limit";
import type { TrpcContext } from "./_core/context";

const declaration = {
  humanOriginal: true as const,
  rulesReviewed: true as const,
};
const body = "Synthetic original message for admission verification.";
const runChild = promisify(execFile);
let owners: User[] = [];
let prospectIds: number[] = [];
const context = (user: User, requestId = randomUUID()) =>
  ({ user, requestId, req: {}, res: {} }) as TrpcContext;
const caller = (index = 0) =>
  criticalPathRouter.createCaller(context(owners[index]));
const draftInput = (index = 0, key = randomUUID()) => ({
  prospectId: prospectIds[index],
  body,
  declaration,
  idempotencyKey: key,
});

async function approvedDraft(index = 0) {
  const api = caller(index);
  const { outreach } = await api.outreach.draft(draftInput(index));
  await api.outreach.submitReview({ id: outreach!.id });
  await api.outreach.approve({ id: outreach!.id });
  return outreach!.id;
}
async function seedPreparations(count: number, index = 0) {
  const db = (await data.getDb())!;
  await db.insert(auditEvents).values(
    Array.from({ length: count }, () => ({
      userId: owners[index].id,
      requestId: randomUUID(),
      action: "outreach.transition",
      outcome: "success" as const,
      entityType: "outreach",
      metadata: { from: "approved", to: "manual_action_required" },
    }))
  );
}
async function preparationEvents(index = 0) {
  const db = (await data.getDb())!;
  return db
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.userId, owners[index].id),
        eq(auditEvents.action, "outreach.transition"),
        eq(auditEvents.outcome, "success"),
        sql`JSON_UNQUOTE(JSON_EXTRACT(${auditEvents.metadata}, '$.to')) = 'manual_action_required'`
      )
    );
}

describe("durable outreach admission with MySQL", () => {
  beforeEach(async () => {
    resetRateLimitsForTests();
    const db = (await data.getDb())!;
    owners = [];
    prospectIds = [];
    for (let i = 0; i < 2; i++) {
      const key = randomUUID();
      const [created] = await db
        .insert(users)
        .values({
          openId: `admission-${key}`,
          email: `${key}@test.invalid`,
          name: "Synthetic admission owner",
          emailVerified: 1,
          loginMethod: "test",
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
      const [prospect] = await db
        .insert(prospects)
        .values({
          userId: owner.id,
          name: "Synthetic permitted contact",
          platform: "manual",
          consentStatus: "opted_in",
        })
        .$returningId();
      prospectIds.push(prospect.id);
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    resetRateLimitsForTests();
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db
        .delete(outreachRecords)
        .where(eq(outreachRecords.userId, owner.id));
      await db.delete(matches).where(eq(matches.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });

  it("replays simultaneous identical drafts with one row and one audit", async () => {
    // Stage the old split read/insert path after both real reads saw no row.
    // The atomic implementation bypasses this obsolete helper entirely.
    const read = data.findOutreachByIdempotency;
    let reads = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    vi.spyOn(data, "findOutreachByIdempotency").mockImplementation(
      async (...args) => {
        const result = await read(...args);
        if (++reads <= 2) {
          if (reads === 2) release();
          await gate;
        }
        return result;
      }
    );
    const input = draftInput();
    const outcomes = await Promise.allSettled([
      caller().outreach.draft(input),
      caller().outreach.draft(input),
    ]);
    expect(outcomes.every(item => item.status === "fulfilled")).toBe(true);
    const values = outcomes.flatMap(item =>
      item.status === "fulfilled" ? [item.value] : []
    );
    expect(values.map(item => item.replayed).sort()).toEqual([false, true]);
    expect(new Set(values.map(item => item.outreach!.id)).size).toBe(1);
    const db = (await data.getDb())!;
    expect(
      await db
        .select()
        .from(outreachRecords)
        .where(eq(outreachRecords.userId, owners[0].id))
    ).toHaveLength(1);
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(
          and(
            eq(auditEvents.userId, owners[0].id),
            eq(auditEvents.action, "outreach.draft")
          )
        )
    ).toHaveLength(1);
  });

  it("rolls back the draft when the real audit insert fails", async () => {
    const input = draftInput();
    const failing = criticalPathRouter.createCaller(
      context(owners[0], "x".repeat(65))
    );
    const error = await failing.outreach.draft(input).then(
      () => null,
      error => error
    );
    expect(await data.listOutreachRecords(owners[0].id)).toHaveLength(0);
    expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect((await caller().outreach.draft(input)).replayed).toBe(false);
  });

  it("binds replay to the original content and does not renew an expired receipt", async () => {
    const input = draftInput();
    const first = await caller().outreach.draft(input);
    await expect(
      caller().outreach.draft({ ...input, body: body + " changed" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const db = (await data.getDb())!;
    await db
      .update(outreachRecords)
      .set({
        sourcePolicy: {
          ...first.outreach!.sourcePolicy!,
          reviewedAt: new Date(
            Date.now() - 31 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      })
      .where(eq(outreachRecords.id, first.outreach!.id));
    await expect(caller().outreach.draft(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await data.listOutreachRecords(owners[0].id)).toHaveLength(1);
  });

  it("keeps identical idempotency keys separate between accounts", async () => {
    const key = randomUUID();
    const [first, second] = await Promise.all([
      caller(0).outreach.draft(draftInput(0, key)),
      caller(1).outreach.draft(draftInput(1, key)),
    ]);
    expect(first.outreach!.id).not.toBe(second.outreach!.id);
    expect(first.outreach!.userId).toBe(owners[0].id);
    expect(second.outreach!.userId).toBe(owners[1].id);
  });

  it("respects committed preparation usage after reconnect and memory reset", async () => {
    await seedPreparations(20);
    const id = await approvedDraft();
    await data.closeDb();
    resetRateLimitsForTests();
    await expect(
      caller().outreach.prepareManualSend({ id })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect((await data.getOutreachRecord(id, owners[0].id))?.state).toBe(
      "approved"
    );
  });

  it("locks consent before admitting a new draft and observes an in-flight opt-out", async () => {
    const db = (await data.getDb())!;
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
        .where(eq(prospects.id, prospectIds[0]));
      locked();
      await gate;
    });
    await Promise.race([ready, optout]);
    const pending = caller()
      .outreach.draft(draftInput())
      .then(
        value => ({ value }),
        error => ({ error })
      );
    try {
      await vi.waitFor(
        async () => {
          await expect(
            db.transaction(tx =>
              tx
                .select({ id: users.id })
                .from(users)
                .where(eq(users.id, owners[0].id))
                .for("update", { noWait: true })
            )
          ).rejects.toMatchObject({ cause: { code: "ER_LOCK_NOWAIT" } });
        },
        { timeout: 5_000 }
      );
    } finally {
      release();
      const [result] = await Promise.allSettled([optout, pending]);
      if (result.status === "rejected") throw result.reason;
    }
    expect(await pending).toMatchObject({ error: { code: "FORBIDDEN" } });
    expect(await data.listOutreachRecords(owners[0].id)).toHaveLength(0);
  });

  it("requires a match owned by this account and attached to this exact prospect", async () => {
    const db = (await data.getDb())!;
    const [foreign] = await db
      .insert(matches)
      .values({
        userId: owners[1].id,
        prospectId: prospectIds[1],
        overallScore: 50,
      })
      .$returningId();
    const [otherProspect] = await db
      .insert(prospects)
      .values({
        userId: owners[0].id,
        name: "Another synthetic contact",
        platform: "manual",
      })
      .$returningId();
    const [mismatched] = await db
      .insert(matches)
      .values({
        userId: owners[0].id,
        prospectId: otherProspect.id,
        overallScore: 50,
      })
      .$returningId();
    for (const matchId of [foreign.id, mismatched.id])
      await expect(
        caller().outreach.draft({ ...draftInput(), matchId })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await data.listOutreachRecords(owners[0].id)).toHaveLength(0);
    const [owned] = await db
      .insert(matches)
      .values({
        userId: owners[0].id,
        prospectId: prospectIds[0],
        overallScore: 50,
      })
      .$returningId();
    expect(
      (await caller().outreach.draft({ ...draftInput(), matchId: owned.id }))
        .outreach.matchId
    ).toBe(owned.id);
  });

  it("admits only one concurrent preparation when one daily slot remains", async () => {
    await seedPreparations(19);
    const ids = [await approvedDraft(), await approvedDraft()];
    const outcomes = await Promise.allSettled(
      ids.map(id => caller().outreach.prepareManualSend({ id }))
    );
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(
      1
    );
    expect(outcomes.find(item => item.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect(await preparationEvents()).toHaveLength(20);
  });

  it("does not charge invalid transitions against the daily allowance", async () => {
    await seedPreparations(19);
    const { outreach } = await caller().outreach.draft(draftInput());
    for (let i = 0; i < 20; i++)
      await expect(
        caller().outreach.prepareManualSend({ id: outreach!.id })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    await caller().outreach.submitReview({ id: outreach!.id });
    await caller().outreach.approve({ id: outreach!.id });
    expect(
      (await caller().outreach.prepareManualSend({ id: outreach!.id }))?.state
    ).toBe("manual_action_required");
    expect(await preparationEvents()).toHaveLength(20);
  });

  it("rolls back quota usage when audit persistence fails", async () => {
    await seedPreparations(19);
    const id = await approvedDraft();
    const failing = criticalPathRouter.createCaller(
      context(owners[0], "x".repeat(65))
    );
    await expect(
      failing.outreach.prepareManualSend({ id })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(await preparationEvents()).toHaveLength(19);
    expect((await caller().outreach.prepareManualSend({ id }))?.state).toBe(
      "manual_action_required"
    );
    expect(await preparationEvents()).toHaveLength(20);
  });

  it("ignores preparations older than 24 hours and isolates customer allowances", async () => {
    await seedPreparations(20);
    const secondId = await approvedDraft(1);
    expect(
      (await caller(1).outreach.prepareManualSend({ id: secondId }))?.state
    ).toBe("manual_action_required");
    const db = (await data.getDb())!;
    await db
      .update(auditEvents)
      .set({ createdAt: sql`DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 25 HOUR)` })
      .where(eq(auditEvents.userId, owners[0].id));
    const firstId = await approvedDraft();
    expect(
      (await caller().outreach.prepareManualSend({ id: firstId }))?.state
    ).toBe("manual_action_required");
  });

  it("enforces the daily allowance in a fresh Node process", async () => {
    await seedPreparations(20);
    const id = await approvedDraft();
    const { stdout } = await runChild(
      process.execPath,
      [
        "--import",
        "tsx",
        fileURLToPath(
          new URL("./test-fixtures/outreach-quota.ts", import.meta.url)
        ),
        String(owners[0].id),
        String(id),
      ],
      { env: process.env, timeout: 20_000 }
    );
    expect(JSON.parse(stdout.trim())).toEqual({ code: "TOO_MANY_REQUESTS" });
    expect((await data.getOutreachRecord(id, owners[0].id))?.state).toBe(
      "approved"
    );
  }, 30_000);
});
