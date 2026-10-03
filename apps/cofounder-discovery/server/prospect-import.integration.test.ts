import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  prospects,
  users,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";

let owners: User[] = [];
const csv =
  "name,platform,consentStatus\nSynthetic one,manual,unknown\nSynthetic two,manual,opted_out";
const caller = (index = 0, requestId = randomUUID()) =>
  criticalPathRouter.createCaller({
    user: owners[index],
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
const input = (text = csv, key = randomUUID(), ownerIndex = 0) => ({
  csv: text,
  idempotencyKey: key,
  accountId: owners[ownerIndex].id,
  declaration: {
    collectionMethod: "direct_from_person" as const,
    rightsConfirmed: true as const,
    evidenceReference: "synthetic-record-001",
  },
});
async function ownedRows() {
  const db = (await data.getDb())!;
  return db.select().from(prospects).where(eq(prospects.userId, owners[0].id));
}
describe("atomic CSV import with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `import-${randomUUID()}`,
          name: "Synthetic import owner",
          emailVerified: 1,
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
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
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("rolls back every row and receipt if the real audit insert fails", async () => {
    const request = input();
    const result = await caller(0, "x".repeat(65))
      .prospects.importCsv(request)
      .catch(error => error);
    expect(await ownedRows()).toHaveLength(0);
    expect(result).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(
      await data.getIdempotencyRecord(
        owners[0].id,
        "prospect.import_csv",
        request.idempotencyKey
      )
    ).toBeNull();
    expect(await caller().prospects.importCsv(request)).toMatchObject({
      imported: 2,
      skipped: 0,
      replayed: false,
    });
  });
  it("commits one batch for two simultaneous retries, including records without URLs", async () => {
    // Force the old split read/write implementation to observe the absent key twice.
    const read = data.getIdempotencyRecord;
    let reads = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    vi.spyOn(data, "getIdempotencyRecord").mockImplementation(
      async (...args) => {
        const result = await read(...args);
        if (++reads <= 2) {
          if (reads === 2) release();
          await gate;
        }
        return result;
      }
    );
    const request = input();
    const results = await Promise.allSettled([
      caller().prospects.importCsv(request),
      caller().prospects.importCsv(request),
    ]);
    expect(results.every(item => item.status === "fulfilled")).toBe(true);
    expect(
      results
        .flatMap(item =>
          item.status === "fulfilled" ? [item.value.replayed] : []
        )
        .sort()
    ).toEqual([false, true]);
    expect(await ownedRows()).toHaveLength(2);
    const db = (await data.getDb())!;
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(1);
  });
  it("rejects a key reused with different contents without changing existing prospects", async () => {
    const request = input();
    await caller().prospects.importCsv(request);
    await expect(
      caller().prospects.importCsv({
        ...request,
        csv: "name,platform\nDifferent person,manual",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await ownedRows()).map(row => row.name)).toEqual([
      "Synthetic one",
      "Synthetic two",
    ]);
  });
  it("preserves archived opt-outs when a duplicate profile appears in another import", async () => {
    const db = (await data.getDb())!;
    const [original] = await db
      .insert(prospects)
      .values({
        userId: owners[0].id,
        name: "Do not replace",
        profileUrl: "https://github.com/synthetic-import",
        consentStatus: "opted_out",
        archivedAt: new Date(),
      })
      .$returningId();
    const result = await caller().prospects.importCsv(
      input(
        "name,platform,profileUrl,consentStatus\nChanged name,github-collaboration,https://github.com/synthetic-import,opted_in\nNew contact,manual,,unknown"
      )
    );
    expect(result).toMatchObject({ imported: 1, skipped: 1 });
    const [row] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.id, original.id));
    expect(row).toMatchObject({
      name: "Do not replace",
      consentStatus: "opted_out",
    });
    expect(row.archivedAt).not.toBeNull();
  });
  it("isolates identical import keys across customers", async () => {
    const request = input();
    const results = await Promise.allSettled([
      caller(0).prospects.importCsv(request),
      caller(1).prospects.importCsv({ ...request, accountId: owners[1].id }),
    ]);
    expect(results.every(item => item.status === "fulfilled")).toBe(true);
    for (let i = 0; i < 2; i++)
      expect((await caller(i).prospects.list()).total).toBe(2);
  });
  it("returns the committed result after reconnect without duplicating manual contacts", async () => {
    const request = input();
    await caller().prospects.importCsv(request);
    await data.closeDb();
    expect(await caller().prospects.importCsv(request)).toMatchObject({
      imported: 2,
      skipped: 0,
      replayed: true,
    });
    expect(await ownedRows()).toHaveLength(2);
  });
  it("does not silently bless a legacy receipt that has no request binding", async () => {
    const request = input();
    const db = (await data.getDb())!;
    await db.insert(idempotencyRecords).values({
      userId: owners[0].id,
      operation: "prospect.import_csv",
      idempotencyKey: request.idempotencyKey,
      result: { imported: 1, skipped: 0 },
    });
    await expect(caller().prospects.importCsv(request)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await ownedRows()).toHaveLength(0);
  });
  it("reports invalid CSV as a client error before writing any row", async () => {
    await expect(
      caller().prospects.importCsv(
        input("name,consentStatus\nValid,unknown\nInvalid,nope")
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await ownedRows()).toHaveLength(0);
  });

  it.each([
    undefined,
    {
      collectionMethod: "platform_export",
      rightsConfirmed: true,
      evidenceReference: "ref-001",
    },
    {
      collectionMethod: "scraped",
      rightsConfirmed: true,
      evidenceReference: "ref-001",
    },
    {
      collectionMethod: "direct_from_person",
      rightsConfirmed: false,
      evidenceReference: "ref-001",
    },
    {
      collectionMethod: "direct_from_person",
      rightsConfirmed: true,
      evidenceReference: "",
    },
    {
      collectionMethod: "direct_from_person",
      rightsConfirmed: true,
      evidenceReference: "x".repeat(121),
    },
    {
      collectionMethod: "direct_from_person",
      rightsConfirmed: true,
      evidenceReference: "https://private.example/token",
    },
    {
      collectionMethod: "direct_from_person",
      rightsConfirmed: true,
      evidenceReference: "ref-001",
      approvedByPlatform: true,
    },
  ])(
    "rejects an absent, unsupported or malformed declaration before storing data: %j",
    async declaration => {
      await expect(
        caller().prospects.importCsv({ ...input(), declaration } as any)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(await ownedRows()).toHaveLength(0);
    }
  );

  it.each([
    ["mystery", ""],
    ["", ""],
    ["manual", "https://linkedin.com/in/synthetic"],
    ["github-collaboration", "https://linkedin.com/in/synthetic"],
    ["f6s", "https://f6s.com/synthetic"],
    ["facebook-founder-groups", ""],
    ["slack-founder-groups", ""],
    ["", "https://github.com.attacker.example/synthetic"],
    ["github-collaboration", "http://github.com/synthetic"],
  ])(
    "rejects the entire file for an unreviewed or mismatched source %s %s",
    async (platform, url) => {
      await expect(
        caller().prospects.importCsv(
          input(
            `name,platform,profileUrl\nPermitted,manual,\nHeld,${platform},${url}`
          )
        )
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await ownedRows()).toHaveLength(0);
    }
  );

  it("binds imports to the account that reviewed the data", async () => {
    await expect(caller(1).prospects.importCsv(input())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller().prospects.importCsv({ ...input(), accountId: undefined } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await caller(1).prospects.list()).total).toBe(0);
    expect(await ownedRows()).toHaveLength(0);
  });

  it("persists server-owned provenance without promoting a declaration to outreach consent", async () => {
    const request = input(
      "name,platform,profileUrl,consentStatus\nPrivate supplied data,linkedin,https://linkedin.com/in/synthetic,unknown\nSuppression,manual,,opted_out"
    );
    await caller().prospects.importCsv(request);
    await data.closeDb();
    const rows = await ownedRows();
    expect(rows).toHaveLength(2);
    expect(
      rows.find(row => row.name === "Private supplied data")?.consentStatus
    ).toBe("unknown");
    expect(rows.find(row => row.name === "Suppression")?.consentStatus).toBe(
      "opted_out"
    );
    for (const row of rows) {
      expect(row.importProvenance).toMatchObject({
        actorId: owners[0].id,
        collectionMethod: "direct_from_person",
        rightsConfirmed: true,
        evidenceReference: "synthetic-record-001",
        importKey: request.idempotencyKey,
        sourceId: row.platform === "linkedin" ? "linkedin" : "manual",
      });
      expect(row.importProvenance?.declaredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(row.importProvenance?.requestHash).toMatch(/^[a-f0-9]{64}$/);
    }
    const db = (await data.getDb())!;
    const audits = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, owners[0].id));
    expect(JSON.stringify(audits)).not.toContain("synthetic-record-001");
    expect(JSON.stringify(audits)).not.toContain("Private supplied data");
    expect(
      (await caller().prospects.list()).items.find(
        row => row.name === "Suppression"
      )?.draftPolicy.allowed
    ).toBe(false);
  });

  it("rejects a changed declaration under the same key and preserves original provenance", async () => {
    const request = input();
    await caller().prospects.importCsv(request);
    await expect(
      caller().prospects.importCsv({
        ...request,
        declaration: {
          ...request.declaration,
          evidenceReference: "different-reference",
        },
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await ownedRows())[0].importProvenance?.evidenceReference).toBe(
      "synthetic-record-001"
    );
    expect(await caller().prospects.importCsv(request)).toMatchObject({
      replayed: true,
    });
  });

  it("does not fabricate provenance on legacy rows or overwrite duplicate declarations", async () => {
    const db = (await data.getDb())!;
    await db
      .insert(prospects)
      .values({ userId: owners[0].id, name: "Legacy", sourceKind: "csv" });
    const request = input(
      "name,platform,profileUrl\nPerson,github-collaboration,https://github.com/synthetic-provenance"
    );
    await caller().prospects.importCsv(request);
    const duplicate = {
      ...input(request.csv),
      declaration: {
        ...request.declaration,
        evidenceReference: "different-reference",
      },
    };
    expect(await caller().prospects.importCsv(duplicate)).toMatchObject({
      imported: 0,
      skipped: 1,
    });
    const rows = await ownedRows();
    expect(
      rows.find(row => row.name === "Legacy")?.importProvenance
    ).toBeNull();
    expect(
      rows.find(row => row.name === "Person")?.importProvenance
        ?.evidenceReference
    ).toBe("synthetic-record-001");
  });

  it.each(["prospects", "idempotency_records"])(
    "rolls back the whole batch after a real %s write failure",
    async table => {
      const db = (await data.getDb())!;
      const constraint = `import_fault_${randomUUID().replaceAll("-", "")}`;
      // Synthetic-only constraint, scoped to this unique fixture owner. The second
      // prospect or final receipt write fails inside the actual MySQL transaction.
      const predicate =
        table === "prospects" ? " OR name <> 'Synthetic two'" : "";
      await db.execute(
        sql.raw(`ALTER TABLE ${table} ADD CONSTRAINT ${constraint}
          CHECK (user_id <> ${owners[0].id}${predicate})`)
      );
      const request = input();
      try {
        await expect(
          caller().prospects.importCsv(request)
        ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
        expect(await ownedRows()).toHaveLength(0);
        expect(
          await db
            .select()
            .from(auditEvents)
            .where(eq(auditEvents.userId, owners[0].id))
        ).toHaveLength(0);
        expect(
          await data.getIdempotencyRecord(
            owners[0].id,
            "prospect.import_csv",
            request.idempotencyKey
          )
        ).toBeNull();
      } finally {
        await db.execute(
          sql.raw(`ALTER TABLE ${table} DROP CHECK ${constraint}`)
        );
      }
      expect(await caller().prospects.importCsv(request)).toMatchObject({
        imported: 2,
        skipped: 0,
        replayed: false,
      });
    }
  );

  it("applies migration 0027 without fabricating evidence or changing existing data", async () => {
    const db = (await data.getDb())!;
    const table = `synthetic_import_migration_${randomUUID().replaceAll("-", "")}`;
    await db.execute(sql.raw(`CREATE TABLE ${table} LIKE prospects`));
    try {
      await db.execute(
        sql.raw(`ALTER TABLE ${table} DROP COLUMN import_provenance`)
      );
      await db.execute(
        sql.raw(`INSERT INTO ${table} (name, source_kind, consent_status)
        VALUES ('Existing suppression', 'csv', 'opted_out')`)
      );
      const migration = await readFile(
        new URL("../drizzle/0027_import_provenance.sql", import.meta.url),
        "utf8"
      );
      await db.execute(sql.raw(migration.replaceAll("`prospects`", table)));
      const [rows] = await db.execute(
        sql.raw(
          `SELECT name, source_kind, consent_status, import_provenance FROM ${table}`
        )
      );
      expect(rows).toMatchObject([
        {
          name: "Existing suppression",
          source_kind: "csv",
          consent_status: "opted_out",
          import_provenance: null,
        },
      ]);
    } finally {
      // Only this uniquely named synthetic fixture table is removed.
      await db.execute(sql.raw(`DROP TABLE ${table}`));
    }
  });
});
