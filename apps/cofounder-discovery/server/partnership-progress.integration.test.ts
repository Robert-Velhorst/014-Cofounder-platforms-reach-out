import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import * as tables from "../drizzle/schema";
import { getDb } from "./db";
import { hashPassword } from "./auth-password";
import { criticalPathRouter } from "./critical-path-router";
import { exportAccountData } from "./account-export";
import type { TrpcContext } from "./_core/context";
let owners: tables.User[] = [],
  candidates: number[] = [],
  assessments: number[] = [];
const password = "Synthetic-Progress-Password42";
const api = (index = 0) =>
  criticalPathRouter.createCaller({
    user: owners[index],
    requestId: randomUUID(),
    req: {},
    res: {},
  } as TrpcContext);
const target = (index = 0) => ({
  accountId: owners[index].id,
  prospectId: candidates[index],
});
async function command(index = 0) {
  return {
    ...target(index),
    expectedReview: (await api(index).progress.list(target(index))).review,
    outcome: "still_talking" as const,
    notes: "Synthetic owner report only",
    confirmation: true as const,
    idempotencyKey: randomUUID(),
  };
}
describe("owned reviewed partnership progress with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    candidates = [];
    assessments = [];
    const db = (await getDb())!,
      passwordHash = await hashPassword(password);
    for (let index = 0; index < 2; index++) {
      const [created] = await db
        .insert(tables.users)
        .values({ openId: randomUUID(), emailVerified: 1, passwordHash })
        .$returningId();
      const [owner] = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, created.id));
      owners.push(owner);
      const [candidate] = await db
        .insert(tables.prospects)
        .values({
          userId: owner.id,
          name: `Synthetic progress candidate ${index}`,
          consentStatus: "opted_out",
        })
        .$returningId();
      candidates.push(candidate.id);
      const [assessment] = await db
        .insert(tables.matches)
        .values({
          userId: owner.id,
          prospectId: candidate.id,
          overallScore: 50,
        })
        .$returningId();
      assessments.push(assessment.id);
    }
  });
  afterEach(async () => {
    const db = (await getDb())!;
    for (const owner of owners) {
      await db
        .delete(tables.auditEvents)
        .where(eq(tables.auditEvents.userId, owner.id));
      await db
        .delete(tables.idempotencyRecords)
        .where(eq(tables.idempotencyRecords.userId, owner.id));
      await db
        .delete(tables.accountExportQuotas)
        .where(eq(tables.accountExportQuotas.userId, owner.id));
      await db
        .delete(tables.partnershipOutcomes)
        .where(eq(tables.partnershipOutcomes.userId, owner.id));
    }
    for (const owner of owners) {
      await db
        .delete(tables.matches)
        .where(eq(tables.matches.userId, owner.id));
      await db
        .delete(tables.prospects)
        .where(eq(tables.prospects.userId, owner.id));
      await db.delete(tables.users).where(eq(tables.users.id, owner.id));
    }
  });
  it("records a private report without changing opt-out, assessment or send state, and includes it in private export", async () => {
    const saved = await api().progress.record(await command());
    expect(saved).toMatchObject({
      replayed: false,
      outcome: {
        notes: "Synthetic owner report only",
        outcome: "still_talking",
      },
    });
    const view = await api().progress.list(target());
    expect(view.history).toHaveLength(1);
    expect(view.notice).toContain("Owner-reported");
    const db = (await getDb())!;
    const [candidate] = await db
      .select()
      .from(tables.prospects)
      .where(eq(tables.prospects.id, candidates[0]));
    expect(candidate.consentStatus).toBe("opted_out");
    const [assessment] = await db
      .select()
      .from(tables.matches)
      .where(eq(tables.matches.id, assessments[0]));
    expect(assessment.status).toBe("discovered");
    expect(await db.select().from(tables.outreachRecords)).toHaveLength(0);
    const exported = await exportAccountData({
      userId: owners[0].id,
      accountId: owners[0].id,
      credentialHash: owners[0].passwordHash,
      requestId: randomUUID(),
      password,
      confirmation: true,
    });
    expect(JSON.parse(exported.json).data.partnershipOutcomes).toMatchObject([
      { notes: "Synthetic owner report only" },
    ]);
  });
  it("replays concurrent identical retries once and rejects reused keys with changed content", async () => {
    const input = await command();
    const results = await Promise.all([
      api().progress.record(input),
      api().progress.record(input),
    ]);
    expect(results.map(result => result.replayed).sort()).toEqual([
      false,
      true,
    ]);
    expect(new Set(results.map(result => result.outcome.id)).size).toBe(1);
    await expect(
      api().progress.record({ ...input, notes: "changed" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const db = (await getDb())!;
    expect(await db.select().from(tables.partnershipOutcomes)).toHaveLength(1);
    expect(await db.select().from(tables.idempotencyRecords)).toHaveLength(1);
  });
  it("rejects stale candidate or progress review and preserves earlier reports", async () => {
    const input = await command(),
      stale = { ...input, idempotencyKey: randomUUID() };
    await api().progress.record(input);
    await expect(api().progress.record(stale)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    const fresh = await command();
    await (await getDb())!
      .update(tables.prospects)
      .set({ name: "Changed after review" })
      .where(eq(tables.prospects.id, candidates[0]));
    await expect(api().progress.record(fresh)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect((await api().progress.list(target())).history).toHaveLength(1);
  });
  it("rejects other accounts, absent assessments, changed credentials and deletion fences", async () => {
    const input = await command();
    await expect(api(1).progress.record(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      api().progress.list({ ...target(), prospectId: candidates[1] })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const db = (await getDb())!;
    await db
      .delete(tables.matches)
      .where(eq(tables.matches.id, assessments[0]));
    await expect(api().progress.record(await command())).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    await db
      .update(tables.users)
      .set({ passwordHash: "changed-fixture" })
      .where(eq(tables.users.id, owners[0].id));
    await expect(api().progress.list(target())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await db
      .update(tables.users)
      .set({
        passwordHash: owners[0].passwordHash,
        deletionFencedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(tables.users.id, owners[0].id));
    await expect(api().progress.list(target())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("fails closed on an existing cross-owner assessment reference", async () => {
    await (await getDb())!.insert(tables.partnershipOutcomes).values({
      userId: owners[0].id,
      prospectId: candidates[0],
      matchId: assessments[1],
      outcome: "still_talking",
      notes: "Never expose this broken row",
    });
    await expect(api().progress.list(target())).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
  it("rolls outcome and receipt back when audit persistence fails", async () => {
    const db = (await getDb())!,
      input = await command(),
      name = "progress_audit_" + randomUUID().replaceAll("-", "");
    await db.execute(
      sql.raw(
        `ALTER TABLE audit_events ADD CONSTRAINT ${name} CHECK (action <> 'partnership.progress')`
      )
    );
    try {
      await expect(api().progress.record(input)).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    } finally {
      await db.execute(sql.raw(`ALTER TABLE audit_events DROP CHECK ${name}`));
    }
    expect(await db.select().from(tables.partnershipOutcomes)).toHaveLength(0);
    expect(await db.select().from(tables.idempotencyRecords)).toHaveLength(0);
    expect((await api().progress.record(input)).replayed).toBe(false);
  });
  it("paginates retained reports and refuses growth at the per-candidate cap without deleting history", async () => {
    const db = (await getDb())!;
    await db.insert(tables.partnershipOutcomes).values(
      Array.from({ length: 50 }, (_, index) => ({
        userId: owners[0].id,
        prospectId: candidates[0],
        matchId: assessments[0],
        outcome: "still_talking" as const,
        notes: `Historical report ${index}`,
      }))
    );
    const first = await api().progress.list(target());
    expect(first.history).toHaveLength(20);
    expect(first.nextBeforeId).not.toBeNull();
    const second = await api().progress.list({
      ...target(),
      beforeId: first.nextBeforeId!,
    });
    expect(second.history).toHaveLength(20);
    const third = await api().progress.list({
      ...target(),
      beforeId: second.nextBeforeId!,
    });
    expect(third.history).toHaveLength(10);
    expect(third.nextBeforeId).toBeNull();
    expect(
      new Set(
        [...first.history, ...second.history, ...third.history].map(
          row => row.id
        )
      ).size
    ).toBe(50);
    await expect(api().progress.record(await command())).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await db.select().from(tables.partnershipOutcomes)).toHaveLength(50);
  });

  it("serializes different simultaneous reports against the same reviewed head", async () => {
    const first = await command(),
      second = {
        ...first,
        idempotencyKey: randomUUID(),
        outcome: "timing_not_right" as const,
      };
    const results = await Promise.allSettled([
      api().progress.record(first),
      api().progress.record(second),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    const rejected = results.find(
      result => result.status === "rejected"
    ) as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: "CONFLICT" });
    expect(
      await (await getDb())!.select().from(tables.partnershipOutcomes)
    ).toHaveLength(1);
  });

  it("counts legacy retained reports in the account cap without removing or exposing them", async () => {
    const db = (await getDb())!;
    const [extra] = await db
      .insert(tables.prospects)
      .values({
        userId: owners[0].id,
        name: "Synthetic legacy progress candidate",
      })
      .$returningId();
    const [assessment] = await db
      .insert(tables.matches)
      .values({ userId: owners[0].id, prospectId: extra.id, overallScore: 50 })
      .$returningId();
    await db.insert(tables.partnershipOutcomes).values(
      Array.from({ length: 500 }, () => ({
        userId: owners[0].id,
        prospectId: extra.id,
        matchId: assessment.id,
        outcome: "still_talking" as const,
      }))
    );
    const view = await api().progress.list(target());
    expect(view.history).toHaveLength(0);
    await expect(api().progress.record(await command())).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await db.select().from(tables.partnershipOutcomes)).toHaveLength(
      500
    );
  });

  it("does not present edited historical content as an exact approved retry", async () => {
    const input = await command();
    const saved = await api().progress.record(input);
    const db = (await getDb())!;
    await db
      .update(tables.partnershipOutcomes)
      .set({ notes: "Unreviewed legacy edit" })
      .where(eq(tables.partnershipOutcomes.id, saved.outcome.id));
    await expect(api().progress.record(input)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect((await api().progress.list(target())).notice).toContain(
      "unreviewed provenance"
    );
  });
});
