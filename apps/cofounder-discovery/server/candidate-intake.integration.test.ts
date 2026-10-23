import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  prospects,
  users,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";

let owners: User[] = [];
const caller = (index = 0, requestId = randomUUID()) =>
  criticalPathRouter.createCaller({
    user: owners[index],
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
const input = () => ({
  accountId: owners[0].id,
  candidate: {
    name: "Synthetic person",
    platform: "manual",
    consentStatus: "unknown" as const,
  },
  declaration: {
    collectionMethod: "direct_from_person" as const,
    rightsConfirmed: true as const,
    evidenceReference: "meeting-001",
  },
});
async function rows() {
  return (await data.getDb())!
    .select()
    .from(prospects)
    .where(eq(prospects.userId, owners[0].id));
}
async function seed(value: Record<string, unknown> = {}, index = 0) {
  const [row] = await (await data.getDb())!
    .insert(prospects)
    .values({
      name: "Synthetic person",
      userId: owners[index].id,
      platform: "manual",
      ...value,
    })
    .$returningId();
  return row.id;
}
async function request(value = input()) {
  const preview = await caller().prospects.previewIntake(value);
  return {
    ...value,
    reviewToken: preview.reviewToken,
    resolution: {
      kind: "create_new" as const,
      distinctPersonConfirmed: true as const,
    },
    idempotencyKey: randomUUID(),
  };
}

describe("reviewed individual candidate intake with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [id] = await db
        .insert(users)
        .values({
          openId: `intake-${randomUUID()}`,
          name: "Synthetic intake owner",
          emailVerified: 1,
        })
        .$returningId();
      owners.push(
        (await db.select().from(users).where(eq(users.id, id.id)))[0]
      );
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
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("previews without writes and adds a private owned record with direct-data evidence", async () => {
    const value = input();
    const preview = await caller().prospects.previewIntake(value);
    expect(preview).toMatchObject({
      candidates: [],
      hasMore: false,
      exactProfileId: null,
    });
    expect(await rows()).toHaveLength(0);
    const result = await caller().prospects.add(await request(value));
    const [saved] = await rows();
    expect(result).toEqual({
      candidateId: saved.id,
      created: true,
      replayed: false,
    });
    expect(saved).toMatchObject({
      userId: owners[0].id,
      name: "Synthetic person",
      sourceKind: "manual",
      consentStatus: "unknown",
      archivedAt: null,
      importProvenance: {
        actorId: owners[0].id,
        collectionMethod: "direct_from_person",
        evidenceReference: "meeting-001",
        sourceId: "manual",
      },
    });
    const details = await caller().prospects.details({
      id: saved.id,
      accountId: owners[0].id,
    });
    expect(details.provenanceStatus).toBe("recorded");
  });
  it("offers owned archived opt-outs without raw provider or declaration payloads", async () => {
    const id = await seed({
      consentStatus: "opted_out",
      archivedAt: new Date(),
      linkedInData: { secret: "never-render" },
    });
    await seed({}, 1);
    const preview = await caller().prospects.previewIntake(input());
    expect(preview.candidates).toHaveLength(1);
    expect(preview.candidates[0]).toMatchObject({
      id,
      consentStatus: "opted_out",
      matchKind: "name",
    });
    expect(JSON.stringify(preview)).not.toMatch(
      /linkedInData|never-render|importProvenance/
    );
  });
  it("reuses a reviewed existing candidate without changing consent, evidence or timestamps, even at capacity zero", async () => {
    const id = await seed({
      consentStatus: "opted_out",
      archivedAt: new Date(),
    });
    const original = (await rows())[0];
    const value = await request();
    vi.stubEnv("CAPACITY_PROSPECTS_PER_ACCOUNT", "0");
    resetConfigForTests();
    const result = await caller().prospects.add({
      ...value,
      resolution: { kind: "use_existing", candidateId: id },
    });
    expect(result).toEqual({
      candidateId: id,
      created: false,
      replayed: false,
    });
    expect(await rows()).toEqual([original]);
  });
  it("requires reuse for an existing profile URL even when names differ", async () => {
    const id = await seed({
      name: "Earlier name",
      platform: "github-collaboration",
      profileUrl: "https://github.com/synthetic-intake",
    });
    const value = input();
    Object.assign(value.candidate, {
      platform: "github-collaboration",
      profileUrl: "https://github.com/synthetic-intake",
    });
    const preview = await caller().prospects.previewIntake(value);
    expect(preview.exactProfileId).toBe(id);
    expect(preview.candidates[0].matchKind).toBe("profile_url");
    await expect(
      caller().prospects.add(await request(value))
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await rows()).toHaveLength(1);
  });
  it("allows explicitly distinct people sharing a name without merging", async () => {
    await seed();
    await caller().prospects.add(await request());
    expect(await rows()).toHaveLength(2);
  });
  it("does not substitute a name match for an exact archived opted-out profile", async () => {
    const exact = await seed({
      name: "Old name",
      platform: "github-collaboration",
      profileUrl: "https://github.com/synthetic-exact",
      consentStatus: "opted_out",
      archivedAt: new Date(),
    });
    const other = await seed();
    const value = input();
    Object.assign(value.candidate, {
      platform: "github-collaboration",
      profileUrl: "https://github.com/synthetic-exact",
    });
    const reviewed = await request(value);
    await expect(
      caller().prospects.add({
        ...reviewed,
        resolution: { kind: "use_existing", candidateId: other },
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      await data.getIdempotencyRecord(
        owners[0].id,
        "prospect.add",
        reviewed.idempotencyKey
      )
    ).toBeNull();
    expect(
      await (await data.getDb())!
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(0);
    expect(
      await caller().prospects.add({
        ...reviewed,
        resolution: { kind: "use_existing", candidateId: exact },
      })
    ).toMatchObject({ candidateId: exact, created: false });
    expect((await rows()).find(row => row.id === exact)?.consentStatus).toBe(
      "opted_out"
    );
  });
  it("rejects stale reviews after source, consent or same-second candidate changes", async () => {
    const id = await seed();
    const value = await request();
    await (await data.getDb())!
      .update(prospects)
      .set({ consentStatus: "opted_out" })
      .where(eq(prospects.id, id));
    await expect(caller().prospects.add(value)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await rows()).toHaveLength(1);
  });
  it("rejects a preview when another same-name candidate appeared, including concurrent adds", async () => {
    const value = await request();
    const results = await Promise.allSettled([
      caller().prospects.add(value),
      caller().prospects.add({ ...value, idempotencyKey: randomUUID() }),
    ]);
    expect(results.filter(row => row.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(row => row.status === "rejected")).toMatchObject([
      { reason: { code: "CONFLICT" } },
    ]);
    expect(await rows()).toHaveLength(1);
  });
  it("replays one committed addition after reconnect and capacity changes, but rejects changed payloads", async () => {
    const value = await request();
    const result = await caller().prospects.add(value);
    await data.closeDb();
    vi.stubEnv("CAPACITY_PROSPECTS_PER_ACCOUNT", "0");
    resetConfigForTests();
    expect(await caller().prospects.add(value)).toEqual({
      ...result,
      replayed: true,
    });
    await expect(
      caller().prospects.add({
        ...value,
        candidate: { ...value.candidate, name: "Different" },
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await rows()).toHaveLength(1);
    expect(
      await (await data.getDb())!
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(1);
  });
  it("rolls back the candidate, audit and receipt when the real SQL audit insert fails", async () => {
    const value = await request();
    await expect(
      caller(0, "x".repeat(65)).prospects.add(value)
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(await rows()).toHaveLength(0);
    expect(
      await data.getIdempotencyRecord(
        owners[0].id,
        "prospect.add",
        value.idempotencyKey
      )
    ).toBeNull();
    expect(await caller().prospects.add(value)).toMatchObject({
      created: true,
    });
  });
  it("blocks new records at capacity without partial data", async () => {
    const value = await request();
    vi.stubEnv("CAPACITY_PROSPECTS_PER_ACCOUNT", "0");
    resetConfigForTests();
    await expect(caller().prospects.add(value)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await rows()).toHaveLength(0);
  });
  it("rejects cross-account, unverified and unreviewed existing IDs", async () => {
    const foreign = await seed({}, 1);
    const value = await request();
    await expect(
      caller(1).prospects.previewIntake(input())
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(1).prospects.add(value)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller().prospects.add({
        ...value,
        resolution: { kind: "use_existing", candidateId: foreign },
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    owners[0] = { ...owners[0], emailVerified: 0 };
    await expect(
      caller().prospects.previewIntake(input())
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it.each([
    { platform: "manual", profileUrl: "https://linkedin.com/in/person" },
    { platform: "f6s" },
    { platform: "unknown-source" },
    { platform: "discord" },
  ])("rejects unreviewed or mismatched source: %j", async source => {
    const value = input();
    Object.assign(value.candidate, source);
    await expect(caller().prospects.previewIntake(value)).rejects.toMatchObject(
      { code: "FORBIDDEN" }
    );
    expect(await rows()).toHaveLength(0);
  });
  it.each([
    { name: "" },
    { name: "x".repeat(256) },
    { bio: "x".repeat(10001) },
    { userId: 99 },
    { sourceKind: "provider" },
    { importProvenance: {} },
    { skills: [""] },
  ])("rejects invalid or protected candidate fields: %j", async patch => {
    const value = input();
    Object.assign(value.candidate, patch);
    await expect(caller().prospects.previewIntake(value)).rejects.toMatchObject(
      { code: "BAD_REQUEST" }
    );
  });
  it("binds review to the entire input and requires declaration and distinct-person confirmation", async () => {
    const value = await request();
    await expect(
      caller().prospects.add({
        ...value,
        candidate: { ...value.candidate, name: "Changed after review" },
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      caller().prospects.add({
        ...value,
        resolution: { kind: "create_new", distinctPersonConfirmed: false },
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller().prospects.previewIntake({
        ...input(),
        declaration: { ...input().declaration, rightsConfirmed: false },
      } as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("bounds duplicate suggestions and does not permit adding while matches are truncated", async () => {
    for (let i = 0; i < 22; i++) await seed();
    const preview = await caller().prospects.previewIntake(input());
    expect(preview.candidates).toHaveLength(20);
    expect(preview.hasMore).toBe(true);
    await expect(caller().prospects.add(await request())).rejects.toMatchObject(
      { code: "CONFLICT" }
    );
  });
});
