import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criticalPathRouter } from "./critical-path-router";
import { TRPCError } from "@trpc/server";
import { assertTransition } from "./outreach-state";
import * as data from "./db";
import { resetConfigForTests } from "./config";
import { resetRateLimitsForTests } from "./rate-limit";
import type { TrpcContext } from "./_core/context";
import type { OutreachRecord, Prospect } from "../drizzle/schema";

const declaration = {
  humanOriginal: true as const,
  rulesReviewed: true as const,
};
const body =
  "I enjoyed working on the parser with you. Would you like to discuss a shared project?";
const caller = (id = 42) =>
  criticalPathRouter.createCaller({
    user: { id, name: "Synthetic Founder", emailVerified: 1 },
    requestId: "source-policy-test",
    req: {},
    res: {},
  } as TrpcContext);
let prospect: Prospect;
let records: OutreachRecord[];
const draft = (extra = {}) =>
  caller().outreach.draft({
    prospectId: 7,
    body,
    declaration,
    idempotencyKey: "policy-draft-01",
    ...extra,
  });

describe("outreach policy enforcement", () => {
  beforeEach(() => {
    vi.stubEnv("OUTREACH_PAUSED", "false");
    resetConfigForTests();
    resetRateLimitsForTests();
    prospect = {
      id: 7,
      userId: 42,
      name: "Synthetic Collaborator",
      platform: "HN",
      profileUrl: "https://news.ycombinator.com/user?id=example",
      consentStatus: "opted_in",
      archivedAt: null,
      skills: [],
      industries: [],
    } as Prospect;
    records = [];
    vi.spyOn(data, "getProspectById").mockImplementation(async (id, userId) =>
      id === prospect.id && userId === prospect.userId ? prospect : undefined
    );
    vi.spyOn(data, "getUserProfile").mockResolvedValue(undefined);
    vi.spyOn(data, "getUserMatches").mockResolvedValue([]);
    vi.spyOn(data, "createAuditEvent").mockResolvedValue(undefined);
    vi.spyOn(data, "createOutreachDraft").mockImplementation(
      async (input, authorize) => {
        if (
          input.prospectId !== prospect.id ||
          input.userId !== prospect.userId
        )
          throw new TRPCError({ code: "NOT_FOUND" });
        if (
          input.matchId !== undefined &&
          !(await data.getUserMatches(input.userId)).some(
            ({ match }) =>
              match.id === input.matchId &&
              match.userId === input.userId &&
              match.prospectId === input.prospectId
          )
        )
          throw new TRPCError({ code: "NOT_FOUND" });
        const existing = records.find(
          row =>
            row.userId === input.userId &&
            row.idempotencyKey === input.idempotencyKey
        );
        if (
          existing &&
          (existing.body !== input.body ||
            existing.prospectId !== input.prospectId ||
            (existing.matchId ?? null) !== (input.matchId ?? null))
        )
          throw new TRPCError({ code: "CONFLICT" });
        const sourcePolicy = authorize(prospect, existing);
        if (existing) return { outreach: existing, replayed: true };
        const record = {
          ...input,
          id: records.length + 1,
          state: "draft",
          generationMode: "user_authored",
          sourcePolicy,
          destinationUrl: sourcePolicy.destinationUrl,
        } as OutreachRecord;
        records.push(record);
        return { outreach: record, replayed: false };
      }
    );
    vi.spyOn(data, "getOutreachRecord").mockImplementation(async (id, userId) =>
      records.find(row => row.id === id && row.userId === userId)
    );
    vi.spyOn(data, "updateOutreachRecord").mockImplementation(
      async (id, userId, updates) => {
        const row = records.find(row => row.id === id && row.userId === userId);
        if (row) Object.assign(row, updates);
        return row;
      }
    );
    // This suite replaces storage only to exercise the router's policy callback.
    // Real locking, rollback and concurrent audit behavior have MySQL tests.
    vi.spyOn(data, "transitionOutreachRecord").mockImplementation(
      async (input, authorize) => {
        const current = records.find(
          row => row.id === input.id && row.userId === input.userId
        );
        if (!current || prospect.userId !== input.userId)
          throw new TRPCError({ code: "NOT_FOUND" });
        authorize(current, prospect);
        assertTransition(current.state, input.to);
        Object.assign(current, input.updates, { state: input.to });
        return current;
      }
    );
    vi.spyOn(data, "listOutreachRecords").mockImplementation(async userId =>
      records
        .filter(row => row.userId === userId && prospect.userId === userId)
        .map(outreach => ({ outreach, prospect }))
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetConfigForTests();
    resetRateLimitsForTests();
  });

  it("does not generate an HN template or create a record", async () => {
    await expect(
      caller().outreach.draft({
        prospectId: 7,
        idempotencyKey: "generated-hn-01",
      })
    ).rejects.toBeDefined();
    expect(records).toEqual([]);
  });
  it("requires explicit authorship and rule declarations before storing text", async () => {
    await expect(
      caller().outreach.draft({
        prospectId: 7,
        body,
        idempotencyKey: "missing-ack-01",
      })
    ).rejects.toBeDefined();
    expect(records).toEqual([]);
  });
  it("persists server-created human provenance and completes review/prepare", async () => {
    const created = await draft();
    expect(records[0]).toMatchObject({
      body,
      generationMode: "user_authored",
      sourcePolicy: {
        actorId: 42,
        sourceId: "hacker-news",
        humanOriginal: true,
        rulesReviewed: true,
      },
    });
    await caller().outreach.submitReview({ id: created.outreach!.id });
    await caller().outreach.approve({ id: created.outreach!.id });
    await caller().outreach.prepareManualSend({ id: created.outreach!.id });
    expect(records[0].state).toBe("manual_action_required");
  });
  it("does not admit another customer's prospect", async () => {
    await expect(
      caller(43).outreach.draft({
        prospectId: 7,
        body,
        declaration,
        idempotencyKey: "cross-owner-01",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(records).toEqual([]);
  });
  it.each(["F6S", "manual", "unreviewed", "discord-founder-groups"])(
    "rejects held/conflicting source %s before writing",
    async platform => {
      prospect.platform = platform;
      await expect(draft()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(records).toEqual([]);
    }
  );
  it("revalidates idempotency replay against current consent and submitted content", async () => {
    await draft();
    expect((await draft()).replayed).toBe(true);
    await expect(draft({ body: body + " replaced" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    prospect.consentStatus = "opted_out";
    await expect(draft()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(records).toHaveLength(1);
  });
  it.each([
    "opt-out",
    "archive",
    "source",
    "stored-destination",
    "body",
    "legacy",
  ])("revokes already-approved action after %s changes", async change => {
    await draft();
    records[0].state = "approved";
    if (change === "opt-out") prospect.consentStatus = "opted_out";
    if (change === "archive") prospect.archivedAt = new Date();
    if (change === "source")
      prospect.profileUrl = "https://news.ycombinator.com/user?id=someone-else";
    if (change === "stored-destination")
      records[0].destinationUrl = "https://evil.invalid/";
    if (change === "body") records[0].body += " changed";
    if (change === "legacy") Object.assign(records[0], { sourcePolicy: null });
    await expect(
      caller().outreach.prepareManualSend({ id: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(records[0].state).toBe("approved");
    expect((await caller().outreach.list())[0].actionPolicy.allowed).toBe(
      false
    );
  });
  it("refuses a match not owned by this customer/prospect", async () => {
    vi.mocked(data.getUserMatches).mockResolvedValue([
      { match: { id: 99, userId: 43, prospectId: 7 }, prospect } as any,
    ]);
    await expect(draft({ matchId: 99 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(records).toEqual([]);
  });
  it("freshly rechecks the prepared content before copy/open", async () => {
    await draft();
    records[0].state = "approved";
    await expect(
      caller().outreach.manualAction({ id: 1 })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    records[0].state = "manual_action_required";
    expect(await caller().outreach.manualAction({ id: 1 })).toMatchObject({
      body,
      destinationUrl: prospect.profileUrl,
    });
    await expect(
      caller(43).outreach.manualAction({ id: 1 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    prospect.consentStatus = "opted_out";
    await expect(
      caller().outreach.manualAction({ id: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("does not expose an eligible prepared action after opt-out", async () => {
    await draft();
    records[0].state = "manual_action_required";
    prospect.consentStatus = "opted_out";
    expect((await caller().outreach.list())[0].actionPolicy).toMatchObject({
      allowed: false,
    });
    expect(await caller(43).outreach.list()).toEqual([]);
  });
  it("blocks fresh copy/open when the operator pauses outreach", async () => {
    await draft();
    records[0].state = "manual_action_required";
    vi.stubEnv("OUTREACH_PAUSED", "true");
    resetConfigForTests();
    await expect(
      caller().outreach.manualAction({ id: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects an owned match attached to a different prospect", async () => {
    vi.mocked(data.getUserMatches).mockResolvedValue([
      { match: { id: 99, userId: 42, prospectId: 8 }, prospect } as any,
    ]);
    await expect(draft({ matchId: 99 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(records).toEqual([]);
  });
  it("accepts a match owned by this customer for this prospect", async () => {
    vi.mocked(data.getUserMatches).mockResolvedValue([
      { match: { id: 99, userId: 42, prospectId: 7 }, prospect } as any,
    ]);
    expect((await draft({ matchId: 99 })).outreach?.matchId).toBe(99);
  });
});
