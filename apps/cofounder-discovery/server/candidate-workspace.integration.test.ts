import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
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

let owners: User[] = [];
let ids: number[] = [];
const api = (owner = 0, requestId = randomUUID(), verified = true) =>
  criticalPathRouter.createCaller({
    user: { ...owners[owner], emailVerified: verified ? 1 : 0 },
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
const input = (owner = 0) => ({ id: ids[owner], accountId: owners[owner].id });
const optOut = (owner = 0) => ({ ...input(owner), confirmed: true as const });
const eventRows = async (owner = 0) =>
  (await data.getDb())!
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.userId, owners[owner].id),
        eq(auditEvents.action, "prospect.opt_out")
      )
    );

describe("candidate details and opt-out with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    ids = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `candidate-${randomUUID()}`,
          name: "Synthetic owner",
          emailVerified: 1,
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
      await api(i).prospects.importCsv({
        accountId: owner.id,
        csv: "name,title,location,bio,skills,industries,platform,consentStatus\nSynthetic candidate,CTO,Amsterdam,Original supplied biography,TypeScript|Design,SaaS,manual,opted_in",
        idempotencyKey: randomUUID(),
        declaration: {
          collectionMethod: "direct_from_person",
          rightsConfirmed: true,
          evidenceReference: "synthetic-source-001",
        },
      });
      const [row] = await db
        .select()
        .from(prospects)
        .where(eq(prospects.userId, owner.id));
      ids.push(row.id);
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
      await db
        .delete(outreachRecords)
        .where(eq(outreachRecords.userId, owner.id));
      await db.delete(matches).where(eq(matches.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });

  it("returns the owned candidate, source declaration and no raw enrichment payloads", async () => {
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({
        linkedInData: { privateToken: "must-not-leak" },
        githubData: { privateToken: "must-not-leak" },
      })
      .where(eq(prospects.id, ids[0]));
    const detail = await api()
      .prospects.details(input())
      .catch(error => ({ code: error.code }));
    expect(detail).toMatchObject({
      prospect: {
        id: ids[0],
        userId: owners[0].id,
        name: "Synthetic candidate",
        bio: "Original supplied biography",
        skills: ["TypeScript", "Design"],
        consentStatus: "opted_in",
        importProvenance: {
          evidenceReference: "synthetic-source-001",
          actorId: owners[0].id,
        },
      },
      provenanceStatus: "recorded",
      optOutEvents: [],
    });
    expect(JSON.stringify(detail)).not.toContain("must-not-leak");
    expect(detail).not.toHaveProperty("prospect.linkedInData");
    expect(detail).not.toHaveProperty("prospect.githubData");
  });

  it.each([null, { evidenceReference: "invalid-private-ref" }])(
    "does not present missing or malformed legacy provenance as recorded: %j",
    async provenance => {
      const db = (await data.getDb())!;
      await db
        .update(prospects)
        .set({ importProvenance: provenance as any })
        .where(eq(prospects.id, ids[0]));
      expect(
        await api()
          .prospects.details(input())
          .catch(error => ({ code: error.code }))
      ).toMatchObject({
        provenanceStatus: provenance === null ? "missing" : "invalid",
        prospect: { importProvenance: null },
      });
    }
  );

  it("does not expose a provenance declaration attributed to another account", async () => {
    const db = (await data.getDb())!;
    const [row] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, ids[1]));
    await db
      .update(prospects)
      .set({ importProvenance: row.importProvenance })
      .where(eq(prospects.id, ids[0]));
    expect(
      await api()
        .prospects.details(input())
        .catch(error => ({ code: error.code }))
    ).toMatchObject({
      provenanceStatus: "invalid",
      prospect: { importProvenance: null },
    });
  });

  it("preserves access to owned archived source evidence without restoring contact eligibility", async () => {
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({ archivedAt: new Date() })
      .where(eq(prospects.id, ids[0]));
    expect(
      await api()
        .prospects.details(input())
        .catch(error => ({ code: error.code }))
    ).toMatchObject({
      prospect: { id: ids[0] },
      sourcePolicy: { allowed: false },
    });
  });

  it("returns no candidate data and makes no change for a foreign or missing ID", async () => {
    for (const id of [ids[1], 2_000_000_000]) {
      await expect(
        api().prospects.details({ ...input(), id })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(
        api().prospects.optOut({ ...optOut(), id })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
    expect(await eventRows()).toHaveLength(0);
    const db = (await data.getDb())!;
    const [other] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, ids[1]));
    expect(other.consentStatus).toBe("opted_in");
  });

  it("rejects a stale account binding on both reads and opt-outs", async () => {
    await expect(api(1).prospects.details(input())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(api(1).prospects.optOut(optOut())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requires verified email for candidate access and suppression", async () => {
    await expect(
      api(0, randomUUID(), false).prospects.details(input())
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api(0, randomUUID(), false).prospects.optOut(optOut())
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it.each([
    { confirmed: false },
    { confirmed: undefined },
    { accountId: undefined },
    { id: 0 },
    { consentStatus: "opted_in" },
  ])("rejects incomplete or overbroad opt-out commands: %j", async invalid => {
    await expect(
      api().prospects.optOut({ ...optOut(), ...invalid } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await eventRows()).toHaveLength(0);
  });

  it("commits suppression and one audit, preserving data and preventing later outreach actions", async () => {
    const caller = api();
    const draft = await caller.outreach.draft({
      prospectId: ids[0],
      body: "Synthetic human-original draft.",
      declaration: { humanOriginal: true, rulesReviewed: true },
      idempotencyKey: randomUUID(),
    });
    const id = draft.outreach!.id;
    await caller.outreach.submitReview({ id });
    await caller.outreach.approve({ id });
    await caller.outreach.prepareManualSend({ id });
    expect(
      await caller.prospects
        .optOut(optOut())
        .catch(error => ({ code: error.code }))
    ).toMatchObject({ changed: true, consentStatus: "opted_out" });
    await data.closeDb();
    const detail = await caller.prospects.details(input());
    expect(detail).toMatchObject({
      prospect: {
        name: "Synthetic candidate",
        consentStatus: "opted_out",
        importProvenance: { evidenceReference: "synthetic-source-001" },
      },
      sourcePolicy: { allowed: false },
    });
    expect(detail.optOutEvents).toHaveLength(1);
    expect(detail.optOutEvents[0]).toMatchObject({
      action: "prospect.opt_out",
    });
    const events = await eventRows();
    expect(events).toHaveLength(1);
    expect(events[0].metadata).toEqual({ from: "opted_in", to: "opted_out" });
    expect(JSON.stringify(events)).not.toContain("Original supplied biography");
    await expect(caller.outreach.manualAction({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.qualify({ prospectId: ids[0], idempotencyKey: randomUUID() })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.outreach.draft({
        prospectId: ids[0],
        body: "Another synthetic draft.",
        declaration: { humanOriginal: true, rulesReviewed: true },
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rolls back suppression if the real audit insert fails, then allows safe retry", async () => {
    await expect(
      api(0, "x".repeat(65)).prospects.optOut(optOut())
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    const db = (await data.getDb())!;
    const [row] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, ids[0]));
    expect(row.consentStatus).toBe("opted_in");
    expect(await eventRows()).toHaveLength(0);
    expect(await api().prospects.optOut(optOut())).toMatchObject({
      changed: true,
    });
  });

  it("serializes simultaneous opt-outs and does not duplicate audit events on retry", async () => {
    const results = await Promise.allSettled([
      api().prospects.optOut(optOut()),
      api().prospects.optOut(optOut()),
    ]);
    expect(results.map(result => result.status)).toEqual([
      "fulfilled",
      "fulfilled",
    ]);
    expect(
      results
        .flatMap(result =>
          result.status === "fulfilled" ? [result.value.changed] : []
        )
        .sort()
    ).toEqual([false, true]);
    expect(await api().prospects.optOut(optOut())).toMatchObject({
      changed: false,
      consentStatus: "opted_out",
    });
    expect(await eventRows()).toHaveLength(1);
  });

  it("does not invent an event for an already imported opt-out", async () => {
    const db = (await data.getDb())!;
    await db
      .update(prospects)
      .set({ consentStatus: "opted_out" })
      .where(eq(prospects.id, ids[0]));
    expect(
      await api()
        .prospects.optOut(optOut())
        .catch(error => ({ code: error.code }))
    ).toMatchObject({ changed: false });
    expect(await eventRows()).toHaveLength(0);
  });

  it("orders equal-time candidates deterministically across pages", async () => {
    const db = (await data.getDb())!;
    const created = await db
      .insert(prospects)
      .values(
        Array.from({ length: 6 }, (_, index) => ({
          userId: owners[0].id,
          name: `Paged ${index}`,
          importedAt: new Date("2027-01-01T00:00:00Z"),
        }))
      )
      .$returningId();
    const first = await api().prospects.list({
      query: "Paged",
      page: 1,
      pageSize: 3,
    });
    const second = await api().prospects.list({
      query: "Paged",
      page: 2,
      pageSize: 3,
    });
    expect(first.items.map(row => row.id)).toEqual([
      created[5].id,
      created[4].id,
      created[3].id,
    ]);
    expect(second.items.map(row => row.id)).toEqual([
      created[2].id,
      created[1].id,
      created[0].id,
    ]);
    expect(first.total).toBe(6);
  });

  it("binds paginated requests to the account displayed in the workspace", async () => {
    await expect(
      api(1).prospects.list({
        accountId: owners[0].id,
        page: 1,
        pageSize: 50,
      } as any)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      (
        await api().prospects.list({
          accountId: owners[0].id,
          page: 1,
          pageSize: 50,
        } as any)
      ).items[0].userId
    ).toBe(owners[0].id);
  });

  it("reads candidate status and opt-out history from the same snapshot during a concurrent opt-out", async () => {
    const db = (await data.getDb())!;
    const pool = db.$client;
    const acquire = pool.getConnection.bind(pool);
    const instrumented = new WeakSet<object>();
    let intercepted = false;
    let captured!: () => void;
    let release!: () => void;
    const ready = new Promise<void>(resolve => {
      captured = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    // Only delay delivery of the first real candidate SELECT result. SQL, the
    // concurrent writer, connection leasing, and transaction snapshots stay real.
    vi.spyOn(pool, "getConnection").mockImplementation((callback: any) =>
      acquire((error: any, connection: any) => {
        if (connection && !instrumented.has(connection)) {
          instrumented.add(connection);
          const query = connection.query.bind(connection);
          vi.spyOn(connection, "query").mockImplementation((...args: any[]) => {
            const statement =
              typeof args[0] === "string" ? args[0] : args[0]?.sql;
            if (
              !intercepted &&
              /^select /i.test(statement ?? "") &&
              statement.includes("from `prospects`") &&
              statement.includes("`import_provenance`")
            ) {
              intercepted = true;
              const hold =
                (done: (...values: any[]) => void) =>
                (...values: any[]) => {
                  if (values[0]) return done(...values);
                  captured();
                  void gate.then(() => done(...values));
                };
              const last = args.length - 1;
              if (typeof args[last] === "function")
                args[last] = hold(args[last]);
              else args[0].onResult = hold(args[0].onResult);
            }
            return query(...args);
          });
        }
        callback(error, connection);
      })
    );
    const reading = api().prospects.details(input());
    try {
      await Promise.race([
        ready,
        reading.then(() => {
          throw new Error("Candidate SELECT was not intercepted");
        }),
      ]);
      expect(await api().prospects.optOut(optOut())).toMatchObject({
        changed: true,
      });
    } finally {
      release();
    }
    const before = await reading;
    expect(before.prospect.consentStatus).toBe("opted_in");
    expect(before.optOutEvents).toHaveLength(0);
    const after = await api().prospects.details(input());
    expect(after.prospect.consentStatus).toBe("opted_out");
    expect(after.optOutEvents).toHaveLength(1);
  });
});
