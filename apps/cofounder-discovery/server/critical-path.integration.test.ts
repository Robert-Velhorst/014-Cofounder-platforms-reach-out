import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
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
        { openId: `critical-first-${run}`, email: `critical-first-${run}@test.invalid`, name: "First Founder", loginMethod: "test" },
        { openId: `critical-second-${run}`, email: `critical-second-${run}@test.invalid`, name: "Second Founder", loginMethod: "test" },
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
      await db.delete(idempotencyRecords).where(eq(idempotencyRecords.userId, user.id));
      await db.delete(outreachRecords).where(eq(outreachRecords.userId, user.id));
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
      "name,title,skills,profileUrl,consentStatus",
      `Ada Founder,CTO,TypeScript,https://example.invalid/${run},opted_in`,
    ].join("\n");

    const initial = await first.prospects.importCsv({
      csv,
      idempotencyKey: `import-${run}`,
    });
    const replay = await first.prospects.importCsv({
      csv,
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
      idempotencyKey: `draft-${run}`,
    });
    expect(draft.outreach?.state).toBe("draft");

    const pending = await first.outreach.submitReview({ id: draft.outreach!.id });
    const approved = await first.outreach.approve({ id: draft.outreach!.id });
    const manual = await first.outreach.prepareManualSend({ id: draft.outreach!.id });
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
});
