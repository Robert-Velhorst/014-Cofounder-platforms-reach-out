import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  matches,
  outreachRecords,
  prospects,
  users,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";
import { resetConfigForTests } from "./config";
const declaration = {
  humanOriginal: true as const,
  rulesReviewed: true as const,
};
let owners: User[] = [],
  ids: number[] = [],
  candidates: number[] = [],
  creationKeys: string[] = [];
const api = (owner = 0, verified = true, requestId = randomUUID()) =>
  criticalPathRouter.createCaller({
    user: { ...owners[owner], emailVerified: verified ? 1 : 0 },
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
const identity = (owner = 0) => ({
  id: ids[owner],
  accountId: owners[owner].id,
});
const detail = (owner = 0) =>
  (api(owner).outreach as any).details(identity(owner));
const review = async () => ({
  ...identity(),
  expectedRevision: (await detail()).revision,
  notSent: true,
});
const reviseInput = async () => ({
  ...(await review()),
  body: "Revised human-original message.",
  subject: "Introduction",
  declaration,
  idempotencyKey: randomUUID(),
});
const revise = async (overrides = {}, caller = api()) =>
  (caller.outreach as any).revise({ ...(await reviseInput()), ...overrides });
const cancel = async (overrides = {}, caller = api()) =>
  (caller.outreach as any).cancel({ ...(await review()), ...overrides });
const rows = async () =>
  (await data.getDb())!
    .select()
    .from(outreachRecords)
    .where(eq(outreachRecords.userId, owners[0].id))
    .orderBy(outreachRecords.id);
const events = async () =>
  (await data.getDb())!
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.userId, owners[0].id),
        eq(auditEvents.action, "outreach.revise")
      )
    );
async function advance(state: string) {
  if (state === "draft") return;
  await api().outreach.submitReview({ id: ids[0] });
  if (state === "pending_review") return;
  await api().outreach.approve({ id: ids[0] });
  if (state === "approved") return;
  await api().outreach.prepareManualSend({ id: ids[0] });
}
describe("immutable outreach revisions and cancellation with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    ids = [];
    candidates = [];
    creationKeys = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `revision-${randomUUID()}`,
          name: "Synthetic owner",
          emailVerified: 1,
        })
        .$returningId();
      owners.push(
        (await db.select().from(users).where(eq(users.id, created.id)))[0]
      );
      const [candidate] = await db
        .insert(prospects)
        .values({
          userId: created.id,
          name: "Synthetic candidate",
          platform: "manual",
          consentStatus: "opted_in",
          linkedInData: { secret: "never-render" },
        })
        .$returningId();
      candidates.push(candidate.id);
      creationKeys.push(randomUUID());
      const result = await api(i).outreach.draft({
        prospectId: candidate.id,
        body: "Original human message.",
        declaration,
        idempotencyKey: creationKeys[i],
      });
      ids.push(result.outreach.id);
    }
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    resetConfigForTests();
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db
        .delete(idempotencyRecords)
        .where(eq(idempotencyRecords.userId, owner.id));
      const owned = await db
        .select({ id: outreachRecords.id })
        .from(outreachRecords)
        .where(eq(outreachRecords.userId, owner.id))
        .orderBy(desc(outreachRecords.id));
      for (const row of owned)
        await db.delete(outreachRecords).where(eq(outreachRecords.id, row.id));
      await db.delete(matches).where(eq(matches.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("returns owner-bound reviewed details without raw provider payloads", async () => {
    const result = await detail();
    expect(result).toMatchObject({
      outreach: { id: ids[0], body: "Original human message." },
      prospect: { id: candidates[0] },
      revision: expect.stringMatching(/^[a-f0-9]{64}$/),
      replacementId: null,
    });
    expect(JSON.stringify(result)).not.toContain("never-render");
    await expect(
      (api().outreach as any).details({ ...identity(), id: ids[1] })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      (api().outreach as any).details({
        ...identity(),
        accountId: owners[1].id,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each(["draft", "pending_review", "approved", "manual_action_required"])(
    "revises %s into a fresh unapproved draft and preserves historical text",
    async state => {
      await advance(state);
      const original = (await rows())[0];
      const result = await revise();
      expect(result).toMatchObject({
        replayed: false,
        outreach: {
          revisesId: ids[0],
          state: "draft",
          approvedAt: null,
          confirmedSentAt: null,
          reviewNotes: null,
          followUpAt: null,
          body: "Revised human-original message.",
          subject: "Introduction",
          generationMode: "user_authored",
        },
      });
      expect(result.outreach.id).not.toBe(ids[0]);
      const [old] = await rows();
      expect(old).toMatchObject({
        body: original.body,
        state: "cancelled",
        sourcePolicy: original.sourcePolicy,
        approvedAt: original.approvedAt,
        idempotencyKey: original.idempotencyKey,
      });
      expect(await detail()).toMatchObject({
        replacementId: result.outreach.id,
      });
      const child = await (api().outreach as any).details({
        id: result.outreach.id,
        accountId: owners[0].id,
      });
      expect(child.revisionPolicy.allowed).toBe(true);
      expect(await events()).toMatchObject([
        { metadata: { replacementId: result.outreach.id, from: state } },
      ]);
      expect(JSON.stringify(await events())).not.toContain(
        "human-original message"
      );
      await expect(
        api().outreach.approve({ id: ids[0] })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(
        api().outreach.confirmSent({ id: ids[0], confirmation: true })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(
        api().outreach.manualAction({ id: ids[0] })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(
        api().outreach.prepareManualSend({ id: result.outreach.id })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      const retry = await api().outreach.draft({
        prospectId: candidates[0],
        body: "Original human message.",
        declaration,
        idempotencyKey: creationKeys[0],
      });
      expect(retry).toMatchObject({
        replayed: true,
        outreach: { id: ids[0], state: "cancelled" },
      });
    }
  );
  it("requires a fresh human-original source declaration for each replacement", async () => {
    await expect(
      revise({ declaration: { humanOriginal: false, rulesReviewed: true } })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await (await data.getDb())!
      .update(prospects)
      .set({ platform: "unreviewed-source" })
      .where(eq(prospects.id, candidates[0]));
    await expect(revise()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await rows()).toHaveLength(1);
  });
  it.each([
    { notSent: false },
    { body: " " },
    { body: "x".repeat(10001) },
    { subject: "x".repeat(256) },
    { state: "approved" },
  ])("rejects invalid or overbroad revision input %#", async invalid => {
    await expect(revise(invalid)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(await rows()).toHaveLength(1);
  });
  it("rejects unchanged text without creating a new retained record", async () => {
    await expect(
      revise({ body: "Original human message.", subject: null })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await rows()).toHaveLength(1);
  });
  it("rejects stale source or state reviews before creating a replacement", async () => {
    const input = await reviseInput();
    await api().outreach.submitReview({ id: ids[0] });
    await expect(revise(input)).rejects.toMatchObject({ code: "CONFLICT" });
    const fresh = await reviseInput();
    await (await data.getDb())!
      .update(prospects)
      .set({ name: "Changed source profile" })
      .where(eq(prospects.id, candidates[0]));
    await expect(revise(fresh)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("binds mutations to the verified reviewed owner account", async () => {
    await expect(revise({ id: ids[1] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(revise({ accountId: owners[1].id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(revise({}, api(0, false))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(cancel({ id: ids[1] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(cancel({ accountId: owners[1].id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(cancel({}, api(0, false))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("replays the same revision across reconnect without renewing its receipt or charging capacity", async () => {
    const input = await reviseInput();
    const first = await revise(input);
    await data.closeDb();
    vi.stubEnv("CAPACITY_OUTREACH_PER_ACCOUNT", "0");
    resetConfigForTests();
    const retry = await revise(input);
    expect(retry).toMatchObject({ replayed: true, outreach: first.outreach });
    expect(await rows()).toHaveLength(2);
    expect(await events()).toHaveLength(1);
    await expect(
      revise({ ...input, body: "Different payload" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("serializes simultaneous revisions of one parent", async () => {
    const input = await reviseInput();
    const results = await Promise.allSettled([
      revise(input),
      revise({
        ...input,
        idempotencyKey: randomUUID(),
        body: "Competing replacement",
      }),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(
      results.filter(result => result.status === "rejected")
    ).toMatchObject([{ reason: { code: "CONFLICT" } }]);
    expect(await rows()).toHaveLength(2);
    expect(await events()).toHaveLength(1);
  });
  it("rolls back both records and retry receipt when audit storage fails", async () => {
    const input = await reviseInput();
    await expect(
      revise(input, api(0, true, "x".repeat(65)))
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(await rows()).toMatchObject([
      { id: ids[0], state: "draft", body: "Original human message." },
    ]);
    const receipts = await (await data.getDb())!
      .select()
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.userId, owners[0].id));
    expect(receipts).toHaveLength(0);
    expect(await revise(input)).toMatchObject({ replayed: false });
  });
  it("fails capacity admission without cancelling the original", async () => {
    vi.stubEnv("CAPACITY_OUTREACH_PER_ACCOUNT", "1");
    resetConfigForTests();
    await expect(revise()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await rows()).toMatchObject([{ id: ids[0], state: "draft" }]);
  });
  it("cancels a prepared draft despite later opt-out/archive, and retries without duplicate audit", async () => {
    await advance("manual_action_required");
    await (await data.getDb())!
      .update(prospects)
      .set({ consentStatus: "opted_out", archivedAt: new Date() })
      .where(eq(prospects.id, candidates[0]));
    const input = await review();
    expect(await cancel(input)).toMatchObject({
      changed: true,
      outreach: { state: "cancelled" },
    });
    expect(await cancel(input)).toMatchObject({ changed: false });
    expect(await rows()).toHaveLength(1);
    await expect(
      api().outreach.manualAction({ id: ids[0] })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const cancellations = await (await data.getDb())!
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.userId, owners[0].id),
          eq(auditEvents.action, "outreach.cancel")
        )
      );
    expect(cancellations).toHaveLength(1);
  });
  it("requires not-sent confirmation and a current review for cancellation", async () => {
    await expect(cancel({ notSent: false })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    const input = await review();
    await api().outreach.submitReview({ id: ids[0] });
    await expect(cancel(input)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      cancel({}, api(0, true, "x".repeat(65)))
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect((await rows())[0].state).toBe("pending_review");
  });
  it.each(["confirmed_sent", "responded", "follow_up_due", "closed"])(
    "never revises or cancels historical %s records",
    async state => {
      await (await data.getDb())!
        .update(outreachRecords)
        .set({ state: state as any })
        .where(eq(outreachRecords.id, ids[0]));
      await expect(revise()).rejects.toMatchObject({ code: "CONFLICT" });
      await expect(cancel()).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await rows()).toHaveLength(1);
    }
  );
  it("does not expose provider data through the account-bound outreach list", async () => {
    expect(
      JSON.stringify(
        await api().outreach.list({ accountId: owners[0].id } as any)
      )
    ).not.toContain("never-render");
    await expect(
      api().outreach.list({ accountId: owners[1].id } as any)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("preserves sent history even if a legacy follow-up moved the state back to review", async () => {
    await (await data.getDb())!
      .update(outreachRecords)
      .set({ state: "pending_review", confirmedSentAt: new Date() })
      .where(eq(outreachRecords.id, ids[0]));
    expect((await detail()).canChange).toBe(false);
    await expect(revise()).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(cancel()).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("does not inherit a foreign match link from a malformed legacy record", async () => {
    const db = (await data.getDb())!;
    const [match] = await db
      .insert(matches)
      .values({
        userId: owners[1].id,
        prospectId: candidates[1],
        overallScore: 50,
      })
      .$returningId();
    await db
      .update(outreachRecords)
      .set({ matchId: match.id })
      .where(eq(outreachRecords.id, ids[0]));
    await expect(revise()).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await rows()).toHaveLength(1);
  });
});
