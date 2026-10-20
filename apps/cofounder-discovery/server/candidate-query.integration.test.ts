import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { prospects, users, type User } from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";
import { candidateSorts } from "../shared/candidate-query";

let owners: User[] = [],
  ids: number[] = [];
const api = (index = 0, verified = true) =>
  criticalPathRouter.createCaller({
    user: { ...owners[index], emailVerified: verified ? 1 : 0 },
    requestId: randomUUID(),
    req: {},
    res: {},
  } as TrpcContext);
describe("literal candidate search and ordering on real MySQL", () => {
  beforeEach(async () => {
    owners = [];
    ids = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: randomUUID(),
          name: "Synthetic search owner",
          emailVerified: 1,
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
    }
    const inserted = await db
      .insert(prospects)
      .values([
        {
          userId: owners[0].id,
          name: "Alpha",
          importedAt: new Date("2026-01-01"),
        },
        {
          userId: owners[0].id,
          name: "Alpha",
          importedAt: new Date("2026-01-01"),
        },
        {
          userId: owners[0].id,
          name: "Zulu",
          importedAt: new Date("2026-02-01"),
        },
        {
          userId: owners[0].id,
          name: "100% actual",
          title: "under_score",
          location: "equal=place\\town",
          importedAt: new Date("2026-03-01"),
          consentStatus: "opted_out" as const,
        },
        {
          userId: owners[0].id,
          name: "Archived",
          archivedAt: new Date(),
          importedAt: new Date("2026-04-01"),
        },
        { userId: owners[1].id, name: "Foreign 100% actual" },
      ])
      .$returningId();
    ids = inserted.map(row => row.id);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it.each(candidateSorts)(
    "paginates %s with deterministic ties and no foreign/archived default rows",
    async sort => {
      const expected =
        sort === "newest"
          ? [ids[3], ids[2], ids[1], ids[0]]
          : sort === "oldest"
            ? [ids[0], ids[1], ids[2], ids[3]]
            : sort === "name_asc"
              ? [ids[3], ids[0], ids[1], ids[2]]
              : [ids[2], ids[1], ids[0], ids[3]];
      const pages = await Promise.all(
        [1, 2].map(page =>
          api().prospects.list({
            sort,
            page,
            pageSize: 2,
            accountId: owners[0].id,
          })
        )
      );
      expect(pages.flatMap(page => page.items.map(row => row.id))).toEqual(
        expected
      );
      for (const result of pages) {
        expect(result.total).toBe(4);
        expect(result.sort).toBe(sort);
      }
    }
  );
  it.each(["%", "_", "=", "\\", "100%"])(
    "searches %s literally across name/title/location",
    async query => {
      const result = await api().prospects.list({ query });
      expect(result.total).toBe(1);
      expect(result.items.map(row => row.id)).toEqual([ids[3]]);
      expect(result.items[0].consentStatus).toBe("opted_out");
      expect(result.items[0].draftPolicy.allowed).toBe(false);
    }
  );
  it("keeps archive filters, ordinary substring search and SQL-like text scoped", async () => {
    expect((await api().prospects.list({ query: " alpha " })).total).toBe(2);
    expect(
      (await api().prospects.list({ status: "archived" })).items.map(
        row => row.id
      )
    ).toEqual([ids[4]]);
    expect((await api().prospects.list({ status: "all" })).total).toBe(5);
    expect((await api().prospects.list({ query: "' OR 1=1 --" })).total).toBe(
      0
    );
    expect((await api().prospects.list({ page: 1000000 })).items).toEqual([]);
  });
  it("refuses unverified and mismatched-account access and arbitrary sorting", async () => {
    await expect(api(0, false).prospects.list({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      api(1).prospects.list({ accountId: owners[0].id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api().prospects.list({ sort: "name;DROP" } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(api().prospects.list({ page: 1000001 })).rejects.toMatchObject(
      { code: "BAD_REQUEST" }
    );
  });
  it("reads count and rows from one snapshot while another connection deletes a candidate", async () => {
    const db = (await data.getDb())!,
      pool = db.$client,
      acquire = pool.getConnection.bind(pool);
    const instrumented = new WeakSet<object>();
    let intercepted = false;
    let captured!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => {
      captured = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    vi.spyOn(pool, "getConnection").mockImplementation((callback: any) =>
      acquire((error: any, connection: any) => {
        if (connection && !instrumented.has(connection)) {
          instrumented.add(connection);
          const query = connection.query.bind(connection);
          vi.spyOn(connection, "query").mockImplementation((...args: any[]) => {
            const statement =
              typeof args[0] === "string" ? args[0] : args[0]?.sql;
            if (!intercepted && /^select count\(\*\)/i.test(statement ?? "")) {
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
    const reading = api().prospects.list({ sort: "oldest" });
    try {
      await Promise.race([
        ready,
        reading.then(() => {
          throw new Error("Count was not intercepted");
        }),
      ]);
      await db.delete(prospects).where(eq(prospects.id, ids[0]));
    } finally {
      release();
    }
    const original = await reading;
    expect(original.total).toBe(4);
    expect(original.items.map(row => row.id)).toEqual([
      ids[0],
      ids[1],
      ids[2],
      ids[3],
    ]);
    expect((await api().prospects.list({})).total).toBe(3);
  });
});
