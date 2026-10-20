import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { auditEvents, prospects, users, type User } from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";
import { parseProspectCsv } from "./prospect-csv";

let owners: User[] = [];
let auditConstraint: string | undefined;
const caller = (index = 0, verified = true) =>
  criticalPathRouter.createCaller({
    user: { ...owners[index], emailVerified: verified ? 1 : 0 },
    req: {},
    res: {},
    requestId: randomUUID(),
  } as TrpcContext);
const exportMine = (input: unknown = { accountId: owners[0].id }) =>
  (caller().prospects.exportCsv as any)(input);
describe("account-bound candidate CSV export with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({
          openId: `export-${randomUUID()}`,
          name: "Synthetic export owner",
          emailVerified: 1,
        })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
      await db.insert(prospects).values({
        userId: owner.id,
        name: i ? "Other owner hidden" : "=1+2",
        platform: "manual",
        consentStatus: "opted_out",
        linkedInData: { secret: "raw-provider-must-not-export" },
      });
      await db.insert(prospects).values({
        userId: owner.id,
        name: "Archived hidden",
        archivedAt: new Date(),
        platform: "manual",
      });
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    if (auditConstraint) {
      await db.execute(
        sql.raw(`ALTER TABLE audit_events DROP CHECK ${auditConstraint}`)
      );
      auditConstraint = undefined;
    }
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("returns only owned active candidates with explicit scope and suppression intact", async () => {
    const result = await exportMine();
    expect(result).toMatchObject({
      accountId: owners[0].id,
      scope: "active",
      rowCount: 1,
      format: "spreadsheet-csv-v1",
    });
    expect(result.byteLength).toBe(Buffer.byteLength(result.csv, "utf8"));
    expect(parseProspectCsv(result.csv)).toMatchObject([
      { name: "text: =1+2", consentStatus: "opted_out" },
    ]);
    expect(result.csv).not.toMatch(/Other owner|Archived hidden|raw-provider/);
    expect(result.filename).toMatch(
      /^cofounder-active-candidates-\d{4}-\d{2}-\d{2}\.csv$/
    );
    const [original] = await (await data.getDb())!
      .select()
      .from(prospects)
      .where(eq(prospects.userId, owners[0].id));
    expect(original.name).toBe("=1+2");
  });
  it("records counts and scope without profile content in the export audit", async () => {
    await exportMine();
    const rows = await (await data.getDb())!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, owners[0].id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: "prospect.export",
      outcome: "success",
      metadata: { scope: "active", rowCount: 1 },
    });
    expect(JSON.stringify(rows)).not.toMatch(/=1\+2|raw-provider/);
  });
  it("returns no artifact when the real audit insert fails", async () => {
    const db = (await data.getDb())!;
    const name = `chk_export_${randomUUID().replaceAll("-", "")}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE audit_events ADD CONSTRAINT ${name} CHECK (action <> 'prospect.export' OR user_id <> ${owners[0].id})`
      )
    );
    auditConstraint = name;
    await expect(exportMine()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(0);
  });
  it("rejects final quoting overhead even when stored text fits the raw-byte preflight", async () => {
    const db = (await data.getDb())!;
    await db.insert(prospects).values(
      Array.from({ length: 900 }, () => ({
        userId: owners[0].id,
        name: "Synthetic quoted record",
        bio: '"'.repeat(5000),
        platform: "manual",
      }))
    );
    await expect(exportMine()).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(0);
  });
  it("rejects a stale reviewed account instead of exporting the new cookie owner", async () => {
    await expect(exportMine({ accountId: owners[1].id })).rejects.toMatchObject(
      { code: "FORBIDDEN" }
    );
  });
  it.each([
    undefined,
    {},
    { accountId: 0 },
    { accountId: 1, includeSecrets: true },
  ])("requires strict reviewed-account input: %j", async input => {
    await expect(
      (caller().prospects.exportCsv as any)(input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects an unverified caller", async () => {
    await expect(
      (caller(0, false).prospects.exportCsv as any)({ accountId: owners[0].id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rechecks stored verification instead of trusting a stale caller", async () => {
    const db = (await data.getDb())!;
    await db
      .update(users)
      .set({ emailVerified: 0 })
      .where(eq(users.id, owners[0].id));
    await expect(exportMine()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("exports an empty account as an explicit zero-row file", async () => {
    const db = (await data.getDb())!;
    await db.delete(prospects).where(eq(prospects.userId, owners[0].id));
    expect(await exportMine()).toMatchObject({
      rowCount: 0,
      csv: "name,title,location,bio,skills,industries,platform,profileUrl,consentStatus",
    });
  });
  it("detects the 10001st row instead of silently truncating at the export limit", async () => {
    const db = (await data.getDb())!;
    for (let i = 0; i < 10; i++)
      await db.insert(prospects).values(
        Array.from({ length: 1000 }, () => ({
          userId: owners[0].id,
          name: "Synthetic overflow",
        }))
      );
    await expect(exportMine()).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(0);
  });
  it("rejects an absent caller", async () => {
    const api = criticalPathRouter.createCaller({
      user: null,
      req: {},
      res: {},
      requestId: randomUUID(),
    } as TrpcContext);
    await expect(
      (api.prospects.exportCsv as any)({ accountId: owners[0].id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("does not turn unavailable storage into an empty successful file", async () => {
    vi.spyOn(data, "getDb").mockResolvedValue(null);
    await expect(exportMine()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
  it("refuses oversized bytes without a success audit or partial file", async () => {
    const db = (await data.getDb())!;
    await db.insert(prospects).values(
      Array.from({ length: 900 }, () => ({
        userId: owners[0].id,
        name: "Synthetic long record",
        bio: "é".repeat(5000),
        platform: "manual",
      }))
    );
    await expect(exportMine()).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(0);
  });
});
