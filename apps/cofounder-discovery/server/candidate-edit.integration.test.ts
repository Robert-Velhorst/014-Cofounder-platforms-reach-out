import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { auditEvents, prospects, users, type User } from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";

let owners: User[] = [];
let ids: number[] = [];
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
const details = () => api().prospects.details(identity());
const reviewed = async () => ({
  ...identity(),
  expectedRevision: ((await details()) as any).revision,
});
const edit = async (
  patch: Record<string, unknown>,
  overrides = {},
  caller = api()
) =>
  (caller.prospects as any).edit({
    ...(await reviewed()),
    patch,
    ...overrides,
  });
const archive = async (overrides = {}, caller = api()) =>
  caller.prospects.archive({
    ...(await reviewed()),
    confirmed: true,
    ...overrides,
  } as any);
const restore = async (overrides = {}) =>
  (api().prospects as any).restore({
    ...(await reviewed()),
    confirmed: true,
    ...overrides,
  });
const events = async () =>
  (await data.getDb())!
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.userId, owners[0].id));
const stored = async () =>
  (
    await (await data.getDb())!
      .select()
      .from(prospects)
      .where(eq(prospects.id, ids[0]))
  )[0];

describe("reviewed candidate corrections and archive lifecycle with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    ids = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `candidate-edit-${randomUUID()}`,
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
          title: "CTO",
          bio: "Original supplied biography",
          skills: ["TypeScript", "Design"],
          platform: "manual",
          consentStatus: "opted_in",
          importProvenance: { historicalEvidence: "preserve-exactly" } as any,
          linkedInData: { privatePayload: "never-return-this" },
        })
        .$returningId();
      ids.push(candidate.id);
    }
  });
  afterEach(async () => {
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });

  it("returns a stable review token without exposing raw provider data", async () => {
    const first = await details();
    expect(first).toHaveProperty(
      "revision",
      expect.stringMatching(/^[a-f0-9]{64}$/)
    );
    expect(((await details()) as any).revision).toBe((first as any).revision);
    expect(JSON.stringify(first)).not.toContain("never-return-this");
  });
  it("patches only reviewed profile fields and preserves the import/source/consent record", async () => {
    const before = await stored();
    expect(
      await edit({
        name: " Corrected name ",
        title: null,
        skills: ["Rust"],
        bio: "Correction",
      })
    ).toMatchObject({ changed: true });
    const after = await stored();
    expect(after).toMatchObject({
      name: "Corrected name",
      title: null,
      skills: ["Rust"],
      bio: "Correction",
    });
    for (const key of [
      "userId",
      "platform",
      "profileUrl",
      "sourceKind",
      "consentStatus",
      "importProvenance",
      "importedAt",
      "linkedInData",
    ] as const)
      expect(after[key]).toEqual(before[key]);
    expect(await events()).toMatchObject([
      {
        action: "prospect.edit",
        metadata: { fields: ["bio", "name", "skills", "title"] },
      },
    ]);
    expect(JSON.stringify(await events())).not.toContain("Corrected name");
  });
  it("preserves unrelated malformed legacy fields during a correction", async () => {
    await (await data.getDb())!
      .update(prospects)
      .set({ skills: { legacy: "retained" } as any })
      .where(eq(prospects.id, ids[0]));
    await edit({ location: "Arnhem" });
    expect(await stored()).toMatchObject({
      location: "Arnhem",
      skills: { legacy: "retained" },
    });
  });
  it.each([
    {},
    { name: " " },
    { name: "x".repeat(256) },
    { experience: "x".repeat(51) },
    { bio: "x".repeat(10001) },
    { skills: [""] },
    { industries: Array(51).fill("SaaS") },
    { consentStatus: "opted_in" },
    { importProvenance: {} },
    { profileUrl: "https://example.com" },
    { userId: 1 },
  ])("rejects invalid or protected patch fields: %j", async patch => {
    await expect(edit(patch)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await stored()).name).toBe("Synthetic candidate");
    expect(await events()).toHaveLength(0);
  });
  it("does not duplicate audit events when a successful correction is retried", async () => {
    const review = await reviewed();
    await edit({ name: "Corrected" }, review);
    expect(await edit({ name: "Corrected" }, review)).toMatchObject({
      changed: false,
    });
    expect(await events()).toHaveLength(1);
  });
  it("rejects stale edits even when lastUpdated has the same second", async () => {
    const review = await reviewed();
    const before = await stored();
    await (await data.getDb())!
      .update(prospects)
      .set({ name: "Another tab", lastUpdated: before.lastUpdated })
      .where(eq(prospects.id, ids[0]));
    await expect(edit({ location: "Arnhem" }, review)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await stored()).toMatchObject({
      name: "Another tab",
      location: null,
    });
    expect(await events()).toHaveLength(0);
  });
  it("serializes competing edits without losing an update", async () => {
    const review = await reviewed();
    const results = await Promise.allSettled([
      edit({ name: "First" }, review),
      edit({ name: "Second" }, review),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(
      results.filter(result => result.status === "rejected")
    ).toMatchObject([{ reason: { code: "CONFLICT" } }]);
    expect(await events()).toHaveLength(1);
  });
  it("binds corrections to the reviewed account and verified owner", async () => {
    await expect(
      edit({ name: "Changed" }, { id: ids[1] })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      edit({ name: "Changed" }, { accountId: owners[1].id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      edit({ name: "Changed" }, {}, api(0, false))
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await events()).toHaveLength(0);
  });
  it("requires archive acknowledgement, reviewed account and ownership", async () => {
    await expect(archive({ confirmed: false })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(archive({ accountId: owners[1].id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(archive({ id: ids[1] })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(archive({ id: 2147483647 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(archive({}, api(0, false))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await stored()).archivedAt).toBeNull();
    expect(await events()).toHaveLength(0);
  });
  it("archives once, lists archived records separately and restores without clearing opt-out", async () => {
    await api().prospects.optOut({ ...identity(), confirmed: true });
    const review = await reviewed();
    expect(await archive(review)).toMatchObject({
      changed: true,
      archived: true,
    });
    expect(await archive(review)).toMatchObject({
      changed: false,
      archived: true,
    });
    expect((await api().prospects.list()).total).toBe(0);
    expect(
      await api().prospects.list({ status: "archived" } as any)
    ).toMatchObject({ total: 1, items: [{ id: ids[0] }] });
    expect(await api().prospects.list({ status: "all" } as any)).toMatchObject({
      total: 1,
    });
    expect(await restore()).toMatchObject({ changed: true, archived: false });
    expect(await restore()).toMatchObject({ changed: false, archived: false });
    expect(await stored()).toMatchObject({
      archivedAt: null,
      consentStatus: "opted_out",
    });
    expect((await details()).sourcePolicy.allowed).toBe(false);
    expect((await api().prospects.list()).total).toBe(1);
    expect((await events()).map(event => event.action).sort()).toEqual([
      "prospect.archive",
      "prospect.opt_out",
      "prospect.restore",
    ]);
  });
  it("requires a current review before archive or restore changes state", async () => {
    const review = await reviewed();
    await edit({ name: "New details" });
    await expect(archive(review)).rejects.toMatchObject({ code: "CONFLICT" });
    await archive();
    const archivedReview = await reviewed();
    await edit({ location: "Arnhem" });
    await expect(restore(archivedReview)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect((await stored()).archivedAt).not.toBeNull();
  });
  it("shows bounded successful candidate history without raw metadata or foreign events", async () => {
    const db = (await data.getDb())!;
    await edit({ location: "Arnhem" });
    await archive();
    await restore();
    await db.insert(auditEvents).values([
      {
        userId: owners[1].id,
        requestId: randomUUID(),
        action: "prospect.edit",
        entityType: "prospect",
        entityId: String(ids[0]),
        outcome: "success",
        metadata: { fields: ["name"] },
      },
      {
        userId: owners[0].id,
        requestId: randomUUID(),
        action: "prospect.edit",
        entityType: "prospect",
        entityId: String(ids[0]),
        outcome: "failed",
        metadata: { secret: "hidden-failure" },
      },
      {
        userId: owners[0].id,
        requestId: randomUUID(),
        action: "prospect.edit",
        entityType: "prospect",
        entityId: String(ids[0]),
        outcome: "success",
        metadata: {
          fields: ["name", "unknown-private-value", "name"],
          raw: "hidden-metadata",
        },
      },
    ]);
    const result = (await details()) as any;
    expect(result.history).toHaveLength(4);
    expect(result.history[0]).toMatchObject({
      action: "prospect.edit",
      fields: ["name"],
    });
    expect(JSON.stringify(result.history)).not.toMatch(
      /hidden-|unknown-private-value/
    );
    for (let i = 0; i < 22; i++) await edit({ location: `Synthetic ${i}` });
    expect(((await details()) as any).history).toHaveLength(20);
  });
  it("does not expose raw enrichment or unvalidated import data through any candidate list filter", async () => {
    for (const status of ["active", "all", "archived"] as const) {
      if (status === "archived") await archive();
      const result = await api().prospects.list({ status });
      expect(result.items).toHaveLength(1);
      expect(JSON.stringify(result)).not.toMatch(
        /never-return-this|preserve-exactly/
      );
      expect(result.items[0]).not.toHaveProperty("linkedInData");
      expect(result.items[0]).not.toHaveProperty("importProvenance");
    }
  });
  it.each(["edit", "archive", "restore"])(
    "rolls back %s when its audit insert fails",
    async action => {
      const db = (await data.getDb())!;
      if (action === "restore") await archive();
      const before = await stored();
      const eventCount = (await events()).length;
      const constraint = `candidate_edit_${randomUUID().replaceAll("-", "")}`;
      await db.execute(
        sql.raw(
          `ALTER TABLE audit_events ADD CONSTRAINT ${constraint} CHECK (NOT (user_id = ${owners[0].id} AND action = 'prospect.${action}'))`
        )
      );
      try {
        const result =
          action === "edit"
            ? edit({ name: "Must roll back" })
            : action === "archive"
              ? archive()
              : restore();
        await expect(result).rejects.toMatchObject({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Candidate storage is temporarily unavailable. Please retry.",
        });
        expect(await stored()).toEqual(before);
        expect(await events()).toHaveLength(eventCount);
      } finally {
        await db.execute(
          sql.raw(`ALTER TABLE audit_events DROP CHECK ${constraint}`)
        );
      }
    }
  );
});
