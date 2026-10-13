import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  matches,
  prospects,
  userProfiles,
  users,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";

let owners: User[] = [];
let prospectIds: number[] = [];
const caller = (index = 0, requestId = randomUUID()) =>
  criticalPathRouter.createCaller({
    user: owners[index],
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
const request = (index = 0, key = randomUUID()) => ({
  prospectId: prospectIds[index],
  idempotencyKey: key,
});

describe("isolated and atomic qualification with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    prospectIds = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `qualify-${randomUUID()}`,
          name: "Synthetic qualification owner",
          emailVerified: 1,
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
      const skill = i === 0 ? "TypeScript" : "Rust";
      await db
        .insert(userProfiles)
        .values({ userId: owner.id, lookingFor: [skill] });
      const [prospect] = await db
        .insert(prospects)
        .values({
          userId: owner.id,
          name: `Synthetic prospect ${i}`,
          skills: [skill],
          platform: "manual",
          consentStatus: "opted_in",
        })
        .$returningId();
      prospectIds.push(prospect.id);
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db
        .delete(idempotencyRecords)
        .where(eq(idempotencyRecords.userId, owner.id));
      await db.delete(matches).where(eq(matches.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(userProfiles).where(eq(userProfiles.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });

  it.each(["match", "prospect"])(
    "returns the exact inserted %s even when another insert commits before readback",
    async kind => {
      const db = (await data.getDb())!;
      const target = kind === "match" ? matches : prospects;
      const insert = db.insert.bind(db);
      let arrived = 0;
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      // Preserve real SQL and results; only stage both INSERT completions before
      // either helper can issue its SELECT. This reproduces latest-row readback.
      vi.spyOn(db, "insert").mockImplementation(((table: any) => {
        const builder = insert(table);
        if (table !== target) return builder;
        const values = builder.values.bind(builder);
        builder.values = ((input: any) => {
          const query = values(input) as any;
          const then = query.then.bind(query);
          const barrier = async () => {
            if (++arrived === 2) release();
            await gate;
          };
          query.then = (resolve: any, reject: any) =>
            then(
              async (result: any) => {
                await barrier();
                return result;
              },
              async (error: unknown) => {
                await barrier();
                throw error;
              }
            ).then(resolve, reject);
          return query;
        }) as any;
        return builder;
      }) as any);
      const result =
        kind === "match"
          ? await Promise.all([
              data.createMatch({
                userId: owners[0].id,
                prospectId: prospectIds[0],
                overallScore: 65,
                reasoning: "Private first",
              }),
              data.createMatch({
                userId: owners[1].id,
                prospectId: prospectIds[1],
                overallScore: 55,
                reasoning: "Private second",
              }),
            ])
          : await Promise.all([
              data.createProspect({
                userId: owners[0].id,
                name: "First inserted",
              }),
              data.createProspect({
                userId: owners[0].id,
                name: "Second inserted",
              }),
            ]);
      expect(result[0]?.id).not.toBe(result[1]?.id);
      if (kind === "match") {
        expect(result[0]).toMatchObject({
          userId: owners[0].id,
          reasoning: "Private first",
        });
        expect(result[1]).toMatchObject({
          userId: owners[1].id,
          reasoning: "Private second",
        });
      } else {
        expect(result[0]).toMatchObject({ name: "First inserted" });
        expect(result[1]).toMatchObject({ name: "Second inserted" });
      }
    }
  );
  it("rolls back qualification and its receipt if audit persistence fails", async () => {
    const input = request();
    await expect(
      caller(0, "x".repeat(65)).qualify(input)
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(0);
    expect(
      await data.getIdempotencyRecord(
        owners[0].id,
        "prospect.qualify",
        input.idempotencyKey
      )
    ).toBeNull();
    expect((await caller().qualify(input)).replayed).toBe(false);
  });
  it("creates only one qualification when the same prospect is requested concurrently with different keys", async () => {
    // Regression scheduling for the former split read/insert path. The new
    // transaction deliberately bypasses this helper; its real lock behavior is
    // separately exercised by the in-flight opt-out test below.
    const read = data.getUserProfile;
    let arrived = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    vi.spyOn(data, "getUserProfile").mockImplementation(async id => {
      const profile = await read(id);
      if (++arrived <= 2) {
        if (arrived === 2) release();
        await gate;
      }
      return profile;
    });
    const results = await Promise.allSettled([
      caller().qualify(request()),
      caller().qualify(request()),
    ]);
    expect(results.every(item => item.status === "fulfilled")).toBe(true);
    expect(
      results
        .flatMap(item =>
          item.status === "fulfilled" ? [item.value.replayed] : []
        )
        .sort()
    ).toEqual([false, true]);
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(1);
    const db = (await data.getDb())!;
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(1);
  });
  it("binds a qualification key to its prospect", async () => {
    const input = request();
    await caller().qualify(input);
    const db = (await data.getDb())!;
    const [other] = await db
      .insert(prospects)
      .values({ userId: owners[0].id, name: "Another owned prospect" })
      .$returningId();
    await expect(
      caller().qualify({ ...input, prospectId: other.id })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(1);
  });
  it("rolls back the match and audit if the final receipt write fails", async () => {
    const db = (await data.getDb())!;
    const constraint = `qualification_fault_${randomUUID().replaceAll("-", "")}`;
    const input = request();
    await db.execute(
      sql.raw(
        `ALTER TABLE idempotency_records ADD CONSTRAINT ${constraint} CHECK (user_id <> ${owners[0].id})`
      )
    );
    try {
      await expect(caller().qualify(input)).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      expect(await data.getUserMatches(owners[0].id)).toHaveLength(0);
      expect(
        await db
          .select()
          .from(auditEvents)
          .where(eq(auditEvents.userId, owners[0].id))
      ).toHaveLength(0);
      expect(
        await data.getIdempotencyRecord(
          owners[0].id,
          "prospect.qualify",
          input.idempotencyKey
        )
      ).toBeNull();
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE idempotency_records DROP CHECK ${constraint}`)
      );
    }
    expect((await caller().qualify(input)).replayed).toBe(false);
  });
  it("observes an in-flight opt-out before creating an assessment", async () => {
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
      .qualify(request())
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
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(0);
  });
  it("does not replay an archived prospect's assessment", async () => {
    const input = request();
    await caller().qualify(input);
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({ archivedAt: new Date() })
      .where(eq(prospects.id, prospectIds[0]));
    await expect(caller().qualify(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
  it("replays simultaneous identical keys with one match and one receipt", async () => {
    const input = request();
    const result = await Promise.all([
      caller().qualify(input),
      caller().qualify(input),
    ]);
    expect(result.map(item => item.replayed).sort()).toEqual([false, true]);
    expect(result[0].match.id).toBe(result[1].match.id);
    const db = (await data.getDb())!;
    expect(
      await db
        .select()
        .from(idempotencyRecords)
        .where(eq(idempotencyRecords.userId, owners[0].id))
    ).toHaveLength(1);
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(1);
  });
  it("does not replay a prospect reassigned to another customer", async () => {
    const input = request();
    await caller().qualify(input);
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({ userId: owners[1].id })
      .where(eq(prospects.id, input.prospectId));
    await expect(caller().qualify(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
  it("revalidates match ownership when replaying a stored receipt", async () => {
    const foreign = await caller(1).qualify(request(1));
    const input = request();
    const db = (await data.getDb())!;
    await db.insert(idempotencyRecords).values({
      userId: owners[0].id,
      operation: "prospect.qualify",
      idempotencyKey: input.idempotencyKey,
      result: { prospectId: input.prospectId, matchId: foreign.match!.id },
    });
    await expect(caller().qualify(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(0);
  });
  it("isolates concurrent customers using an identical key", async () => {
    const key = randomUUID();
    const results = await Promise.allSettled([
      caller(0).qualify(request(0, key)),
      caller(1).qualify(request(1, key)),
    ]);
    expect(results.every(item => item.status === "fulfilled")).toBe(true);
    for (let i = 0; i < 2; i++)
      expect(results[i]).toMatchObject({
        value: { match: { userId: owners[i].id, prospectId: prospectIds[i] } },
      });
    await expect(caller(1).qualify(request(0))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
  it("does not inflate a local score when structured signals are duplicated", async () => {
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({
        skills: ["TypeScript", "typescript", " TypeScript "],
        industries: ["TypeScript"],
      })
      .where(eq(prospects.id, prospectIds[0]));
    expect((await caller().qualify(request())).match?.overallScore).toBe(65);
  });
  it("rejects qualification after opt-out, including replays", async () => {
    const input = request();
    await caller().qualify(input);
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({ consentStatus: "opted_out" })
      .where(eq(prospects.id, prospectIds[0]));
    await expect(caller().qualify(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller().qualify(request())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("replays the committed qualification after reconnect without changing its saved score", async () => {
    const input = request();
    const first = await caller().qualify(input);
    const db = (await data.getDb())!;
    await db
      .update(userProfiles)
      .set({ lookingFor: ["Unrelated"] })
      .where(eq(userProfiles.userId, owners[0].id));
    await data.closeDb();
    expect(await caller().qualify(input)).toMatchObject({
      replayed: true,
      match: { id: first.match!.id, overallScore: 65 },
    });
    expect(await data.getUserMatches(owners[0].id)).toHaveLength(1);
    expect(await caller().qualify(request())).toMatchObject({
      replayed: true,
      match: { id: first.match!.id, overallScore: 65 },
    });
  });
});
