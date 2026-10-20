import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import * as tables from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { hashPassword } from "./auth-password";
import type { TrpcContext } from "./_core/context";
let owners: tables.User[] = [],
  candidates: number[] = [],
  matchIds: number[] = [];
const password = "SyntheticExportPass123!";
const api = (owner = 0) =>
  appRouter.createCaller({
    user: owners[owner],
    req: { ip: "127.0.0.1" },
    res: {},
    requestId: randomUUID(),
  } as TrpcContext);
const download = (extra = {}, owner = 0) =>
  (api(owner) as any).accountData.export({
    accountId: owners[owner].id,
    password,
    confirmation: true,
    ...extra,
  });
describe("private account JSON export with MySQL", () => {
  it("rejects a third generation without charging its quota and reopens capacity after successful exports", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    let release!: () => void,
      ready!: () => void,
      waiting = 0;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const admitted = new Promise<void>(resolve => {
      ready = resolve;
    });
    const interception = vi
      .spyOn(db, "transaction")
      .mockImplementation(async (callback, config) => {
        if (config?.isolationLevel === "repeatable read") {
          if (++waiting === 2) ready();
          await gate;
        }
        return run(callback, config);
      });
    const running = Promise.all([download(), download({}, 1)]);
    try {
      await Promise.race([
        admitted,
        running.then(() => {
          throw new Error("Exports did not reach the held generation boundary");
        }),
      ]);
      await expect(download()).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });
      const [quota] = await db
        .select()
        .from(tables.accountExportQuotas)
        .where(eq(tables.accountExportQuotas.userId, owners[0].id));
      expect(quota.attempts).toBe(1);
    } finally {
      release();
      await running;
      interception.mockRestore();
    }
    await expect(download()).resolves.toMatchObject({
      accountId: owners[0].id,
    });
    const [quota] = await db
      .select()
      .from(tables.accountExportQuotas)
      .where(eq(tables.accountExportQuotas.userId, owners[0].id));
    expect(quota.attempts).toBe(2);
  });
  it("keeps a consistent snapshot while an independent writer changes candidate content", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        if (config?.isolationLevel === "repeatable read") {
          await tx
            .select({ bio: tables.prospects.bio })
            .from(tables.prospects)
            .where(eq(tables.prospects.id, candidates[0]));
          await db
            .update(tables.prospects)
            .set({ bio: "Changed after snapshot" })
            .where(eq(tables.prospects.id, candidates[0]));
        }
        return callback(tx);
      }, config)
    );
    const result = JSON.parse((await download()).json);
    expect(result.data.prospects[0].bio).toBe("=Original text remains exact");
    expect(
      (
        await db
          .select()
          .from(tables.prospects)
          .where(eq(tables.prospects.id, candidates[0]))
      )[0].bio
    ).toBe("Changed after snapshot");
  });
  beforeEach(async () => {
    owners = [];
    candidates = [];
    matchIds = [];
    const db = (await getDb())!,
      passwordHash = await hashPassword(password);
    for (let i = 0; i < 2; i++) {
      const [owner] = await db
        .insert(tables.users)
        .values({
          openId: `account-export-${randomUUID()}`,
          name: `Private owner ${i}`,
          emailVerified: 1,
          passwordHash,
          verificationToken: `secret-verification-${i}`,
          verificationEmailDigest: `secret-verification-email-binding-${i}`,
          githubAccessToken: `secret-oauth-${i}`,
        })
        .$returningId();
      owners.push(
        (
          await db
            .select()
            .from(tables.users)
            .where(eq(tables.users.id, owner.id))
        )[0]
      );
      await db
        .insert(tables.userProfiles)
        .values({ userId: owner.id, bio: `Owner bio ${i}` });
      const [candidate] = await db
        .insert(tables.prospects)
        .values({
          userId: owner.id,
          name: `Private candidate ${i}`,
          bio: "=Original text remains exact",
          consentStatus: "opted_out",
          archivedAt: new Date(),
          linkedInData: { providerSecret: "raw-sensitive-payload" },
        })
        .$returningId();
      candidates.push(candidate.id);
      const [match] = await db
        .insert(tables.matches)
        .values({
          userId: owner.id,
          prospectId: candidate.id,
          overallScore: 77,
          reasoning: `Private fit ${i}`,
        })
        .$returningId();
      matchIds.push(match.id);
      await db.insert(tables.leadScores).values({
        matchId: match.id,
        responseLikelihood: 0.5,
        engagementScore: 42,
        priorityRank: 1,
        factors: `Private factors ${i}`,
      });
      await db.insert(tables.stageTransitions).values({
        matchId: match.id,
        toStage: "contacted",
        reason: `Private transition ${i}`,
      });
      await db
        .insert(tables.responsePatterns)
        .values({ prospectId: candidate.id, dayOfWeek: 1, hourOfDay: 12 });
      await db.insert(tables.outreachRecords).values({
        userId: owner.id,
        prospectId: candidate.id,
        body: `Private message ${i}`,
        state: "closed",
        idempotencyKey: randomUUID(),
        closedAt: new Date(),
      });
      await db.insert(tables.accountSessions).values({
        userId: owner.id,
        tokenDigest: `secret-session-${i}-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 3600000),
      });
      await db.insert(tables.platformCredentials).values({
        userId: owner.id,
        platform: "y_combinator",
        encryptedUsername: "secret-encrypted-user",
        encryptedPassword: "secret-encrypted-password",
        encryptedSessionData: "secret-encrypted-session",
        lastError: "secret-provider-error",
      });
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    const db = (await getDb())!;
    for (let i = 0; i < owners.length; i++) {
      for (const table of [tables.leadScores, tables.stageTransitions])
        await db.delete(table).where(eq(table.matchId, matchIds[i]));
      await db
        .delete(tables.responsePatterns)
        .where(eq(tables.responsePatterns.prospectId, candidates[i]));
      for (const table of [
        tables.outreachRecords,
        tables.matches,
        tables.prospects,
        tables.userProfiles,
        tables.platformCredentials,
        tables.accountSessions,
        tables.auditEvents,
      ])
        await db.delete(table).where(eq(table.userId, owners[i].id));
      // Quotas deliberately survive export failure; the fixture owner owns them.
      const quotaTable = (tables as any).accountExportQuotas;
      if (quotaTable)
        await db.delete(quotaTable).where(eq(quotaTable.userId, owners[i].id));
      await db.delete(tables.users).where(eq(tables.users.id, owners[i].id));
    }
  });
  it("exports exact owned account/profile, archived opt-outs, sent history and indirectly owned records", async () => {
    const result = await download(),
      json = JSON.parse(result.json);
    expect(result).toMatchObject({
      accountId: owners[0].id,
      format: "cofounder-account-v1",
      byteLength: Buffer.byteLength(result.json),
    });
    expect(json.data.users).toMatchObject([{ name: "Private owner 0" }]);
    expect(json.data.userProfiles).toMatchObject([{ bio: "Owner bio 0" }]);
    expect(json.data.prospects).toMatchObject([
      {
        name: "Private candidate 0",
        bio: "=Original text remains exact",
        consentStatus: "opted_out",
        archivedAt: expect.any(String),
      },
    ]);
    expect(json.data.outreachRecords).toMatchObject([
      { body: "Private message 0", state: "closed" },
    ]);
    expect(json.data.leadScores).toMatchObject([
      { factors: "Private factors 0" },
    ]);
    expect(json.data.stageTransitions).toMatchObject([
      { reason: "Private transition 0" },
    ]);
    expect(json.data.responsePatterns).toHaveLength(1);
    expect(result.json).not.toMatch(
      /Private owner 1|Private candidate 1|Private message 1|Private factors 1/
    );
  });
  it("accounts for every category and discloses redactions without returning credential material", async () => {
    const result = await download(),
      json = JSON.parse(result.json);
    expect(result.json).not.toMatch(
      /secret-verification|secret-oauth|secret-session|secret-encrypted|secret-provider-error|raw-sensitive-payload|scrypt\$/
    );
    expect(json.data.platformCredentials).toMatchObject([
      { platform: "y_combinator", status: "untested" },
    ]);
    expect(json.data.accountSessions).toHaveLength(1);
    expect(json.categories.prospects.excludedFields).toHaveProperty(
      "linkedInData"
    );
    expect(json.categories.users.excludedFields).toHaveProperty("passwordHash");
    expect(json.categories.users.excludedFields).toHaveProperty(
      "verificationEmailDigest"
    );
    expect(json.data.users[0]).not.toHaveProperty("verificationEmailDigest");
    expect(json.categories.accountMailQuotas).toMatchObject({
      scope: "service",
      included: false,
    });
    expect(json.categories.capacityLocks).toMatchObject({
      scope: "service",
      included: false,
    });
    expect(json.categories.mlModelVersions).toMatchObject({
      scope: "service",
      included: false,
    });
    expect(json.categories.usagePricing).toMatchObject({
      scope: "service",
      included: false,
    });
    expect(json.categories.loginAttemptQuotas).toMatchObject({
      scope: "service",
      included: false,
    });
    expect(json.data).not.toHaveProperty("loginAttemptQuotas");
    expect(Object.keys(json.categories)).toHaveLength(43);
    expect(json.categories.workspacePresets).toMatchObject({
      scope: "account",
      included: true,
      count: 0,
      fields: ["userId", "revision", "settings", "updatedAt"],
    });
  });
  it("requires the current verified account, explicit confirmation and correct password", async () => {
    await expect(download({ accountId: owners[1].id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(download({ confirmation: false })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      download({ password: "wrong-password" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await (await getDb())!
      .update(tables.users)
      .set({ emailVerified: 0 })
      .where(eq(tables.users.id, owners[0].id));
    await expect(download()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects stale credential context after a password change", async () => {
    await (await getDb())!
      .update(tables.users)
      .set({ passwordHash: await hashPassword("ChangedExportPass456!") })
      .where(eq(tables.users.id, owners[0].id));
    await expect(
      download({ password: "ChangedExportPass456!" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("limits password/export attempts durably, including wrong passwords", async () => {
    for (let i = 0; i < 5; i++)
      await expect(
        download({ password: "wrong-password" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(download()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    // Another account has its own allowance.
    expect((await download({}, 1)).accountId).toBe(owners[1].id);
  });
  it("does not return a file when its success audit cannot commit", async () => {
    const db = (await getDb())!,
      constraint = `account_export_audit_${owners[0].id}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE audit_events ADD CONSTRAINT ${constraint} CHECK (NOT (user_id = ${owners[0].id} AND action = 'account.export'))`
      )
    );
    try {
      await expect(download()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE audit_events DROP CHECK ${constraint}`)
      );
    }
    const result = await download();
    expect(result.json).toContain("Private owner 0");
    const events = await db
      .select()
      .from(tables.auditEvents)
      .where(
        and(
          eq(tables.auditEvents.userId, owners[0].id),
          eq(tables.auditEvents.action, "account.export")
        )
      );
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("Private message");
  });
  it("rejects an oversized legacy export without a partial download", async () => {
    const db = (await getDb())!;
    // Several bounded TEXT rows exercise the aggregate preflight, not a synthetic limit override.
    for (let i = 0; i < 400; i++)
      await db.insert(tables.outreachRecords).values({
        userId: owners[0].id,
        prospectId: candidates[0],
        body: "x".repeat(60000),
        idempotencyKey: randomUUID(),
      });
    await expect(download()).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
  });
  it("fails closed on a non-UTC session rather than exporting misleading timestamps", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        const [rows] = await tx.execute(
          sql`SELECT @@session.time_zone AS zone`
        );
        const zone = (rows as unknown as Array<{ zone: string }>)[0].zone;
        await tx.execute(sql`SET SESSION time_zone = '+02:00'`);
        try {
          return await callback(tx);
        } finally {
          await tx.execute(sql`SET SESSION time_zone = ${zone}`);
        }
      }, config)
    );
    await expect(download()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
  it.each(["column", "table"])(
    "rejects unreviewed database-only %s additions",
    async kind => {
      const db = (await getDb())!;
      await db.execute(
        sql.raw(
          kind === "column"
            ? "ALTER TABLE users ADD COLUMN export_unreviewed_secret TEXT"
            : "CREATE TABLE export_unreviewed_records (id INT PRIMARY KEY, user_id INT, private_data TEXT)"
        )
      );
      try {
        await expect(download()).rejects.toMatchObject({
          code: "SERVICE_UNAVAILABLE",
        });
      } finally {
        await db.execute(
          sql.raw(
            kind === "column"
              ? "ALTER TABLE users DROP COLUMN export_unreviewed_secret"
              : "DROP TABLE export_unreviewed_records"
          )
        );
      }
    }
  );
  it("admits only one simultaneous final attempt, then recovers after database-clock expiry", async () => {
    for (let i = 0; i < 4; i++)
      await expect(
        download({ password: "wrong-password" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const results = await Promise.allSettled([download(), download()]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    await (await getDb())!
      .update(tables.accountExportQuotas)
      .set({ expiresAt: sql`DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 SECOND)` })
      .where(eq(tables.accountExportQuotas.userId, owners[0].id));
    expect((await download()).accountId).toBe(owners[0].id);
  });
  it("rejects more than 100000 small records even when their raw bytes fit", async () => {
    const db = (await getDb())!;
    const digits =
      "(SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9)";
    const nonce = randomUUID();
    await db.execute(
      sql.raw(
        `INSERT INTO account_sessions (token_digest,user_id,expires_at) SELECT SHA2(CONCAT('${nonce}',a.n,b.n,c.n,d.n,e.n,f.n),256),${owners[0].id},DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 HOUR) FROM ${digits} a CROSS JOIN ${digits} b CROSS JOIN ${digits} c CROSS JOIN ${digits} d CROSS JOIN ${digits} e CROSS JOIN ${digits} f LIMIT 100001`
      )
    );
    await expect(download()).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
  });
});
