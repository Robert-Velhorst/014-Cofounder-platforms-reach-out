import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createHmac, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { eq, sql } from "drizzle-orm";
import * as tables from "../drizzle/schema";
import { getDb } from "./db";
import { requestPasswordReset } from "./account-mail-queue";
import { resetConfigForTests } from "./config";
import { inspectAccountDeletion } from "./account-deletion-preflight";

const require = createRequire(import.meta.url);
let owners: number[] = [],
  candidates: number[] = [];
let mailKeys: string[] = [],
  mailIds: string[] = [];
let matchIds: number[] = [];
async function inspect(
  id = owners[0],
  extraEnv: Record<string, string> = {},
  args?: string[]
) {
  const child = spawn(
    process.execPath,
    [
      require.resolve("tsx/cli"),
      "scripts/inspect-account-deletion.ts",
      ...(args ?? ["--read-only", "--account-id", String(id)]),
    ],
    {
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 12000,
    }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", chunk => (stdout += chunk.toString()));
  child.stderr.on("data", chunk => (stderr += chunk.toString()));
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  return { code, stdout, stderr, report: () => JSON.parse(stdout.trim()) };
}
describe("operator-only read-only account deletion preflight", () => {
  beforeAll(() => {
    const target = new URL(process.env.DATABASE_URL!);
    expect(target.pathname).toBe("/cofounder_test");
    expect(target.hostname).toBe("127.0.0.1");
  });
  beforeEach(async () => {
    const db = (await getDb())!;
    owners = [];
    candidates = [];
    mailKeys = [];
    mailIds = [];
    matchIds = [];
    for (let i = 0; i < 2; i++) {
      const [owner] = await db
        .insert(tables.users)
        .values({
          openId: randomUUID(),
          email: `deletion-${randomUUID()}@example.invalid`,
          name: `Never-print-owner-${i}`,
          emailVerified: 1,
        })
        .$returningId();
      owners.push(owner.id);
      const [candidate] = await db
        .insert(tables.prospects)
        .values({
          userId: owner.id,
          name: `Never-print-candidate-${i}`,
          bio: "Never-print-private-content",
        })
        .$returningId();
      candidates.push(candidate.id);
    }
  });
  afterEach(async () => {
    const db = (await getDb())!;
    for (const id of matchIds) {
      await db
        .delete(tables.leadScores)
        .where(eq(tables.leadScores.matchId, id));
      await db
        .delete(tables.stageTransitions)
        .where(eq(tables.stageTransitions.matchId, id));
    }
    for (const id of candidates)
      await db
        .delete(tables.responsePatterns)
        .where(eq(tables.responsePatterns.prospectId, id));
    for (const id of owners)
      await db
        .update(tables.outreachRecords)
        .set({ revisesId: null })
        .where(eq(tables.outreachRecords.userId, id));
    for (const id of mailIds)
      await db
        .delete(tables.accountMailJobs)
        .where(eq(tables.accountMailJobs.id, id));
    for (const key of mailKeys)
      await db
        .delete(tables.accountMailQuotas)
        .where(eq(tables.accountMailQuotas.key, key));
    for (const id of owners)
      await db.delete(tables.messages).where(eq(tables.messages.userId, id));
    for (const id of owners) {
      for (const table of [
        tables.outreachRecords,
        tables.matches,
        tables.accountMailJobs,
        tables.resourceUsage,
        tables.auditEvents,
        tables.prospects,
      ])
        await db.delete(table).where(eq(table.userId, id));
      await db.delete(tables.users).where(eq(tables.users.id, id));
    }
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetConfigForTests();
  });
  it("counts only the requested owner's data without writing or claiming erasure authorization", async () => {
    const result = await inspect();
    expect(result.code, result.stderr).toBe(0);
    const report = result.report();
    expect(report).toMatchObject({
      mode: "read-only",
      accountId: owners[0],
      deletionAuthorized: false,
      categories: { users: 1, prospects: 1, accountSessions: 0 },
      issues: [],
    });
    expect(Object.keys(report.categories)).toHaveLength(38);
    expect(report.categories).toHaveProperty("workspacePresets");
    expect(report).not.toHaveProperty("deleteSql");
    expect(result.stdout).not.toContain("Never-print");
    const db = (await getDb())!;
    expect(await db.select().from(tables.prospects)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: candidates[0] }),
        expect.objectContaining({ id: candidates[1] }),
      ])
    );
    expect(
      await db
        .select()
        .from(tables.auditEvents)
        .where(eq(tables.auditEvents.userId, owners[0]))
    ).toHaveLength(0);
  });
  it("detects another owner's sender reference without exposing their record or content", async () => {
    const db = (await getDb())!;
    await db.insert(tables.messages).values({
      userId: owners[1],
      senderId: owners[0],
      prospectId: candidates[1],
      recipientId: candidates[1],
      content: "Never-print-foreign-message",
      body: "Never-print-foreign-body",
    });
    const result = await inspect();
    expect(result.code, result.stderr).toBe(0);
    expect(result.report().issues).toContainEqual({
      code: "cross_owner_reference",
      category: "messages",
      field: "senderId",
      direction: "incoming",
    });
    expect(result.report().categories.messages).toBe(0);
    expect(result.stdout).not.toContain("Never-print");
    expect(
      await db
        .select()
        .from(tables.messages)
        .where(eq(tables.messages.userId, owners[1]))
    ).toHaveLength(1);
  });
  it("does not mistake a recipient number collision for ownership", async () => {
    const db = (await getDb())!;
    await db.insert(tables.messages).values({
      userId: owners[1],
      senderId: owners[1],
      prospectId: candidates[1],
      recipientId: owners[0],
      content: "Never-print",
      body: "Never-print",
    });
    const result = await inspect();
    expect(result.code, result.stderr).toBe(0);
    expect(result.report().categories.messages).toBe(0);
    expect(result.report().issues).toEqual([]);
  });
  it("requires retention review for even zero-cost legacy financial usage", async () => {
    await (await getDb())!.insert(tables.resourceUsage).values({
      userId: owners[0],
      resourceType: "llm_api_call",
      baseCost: 0,
      markedUpCost: 0,
    });
    const result = await inspect();
    expect(result.code, result.stderr).toBe(0);
    expect(result.report().issues).toContainEqual({
      code: "retention_review",
      category: "resourceUsage",
    });
  });
  it("finds encrypted recovery mail before a worker assigns its owner, without decrypting into output", async () => {
    const secret = randomUUID() + randomUUID();
    vi.stubEnv("AUTH_MAIL_ENCRYPTION_SECRET", secret);
    vi.stubEnv("RESEND_API_KEY", "synthetic-never-send");
    vi.stubEnv("AUTH_EMAIL_FROM", "test@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://example.invalid");
    resetConfigForTests();
    vi.stubGlobal("fetch", () => {
      throw new Error("unexpected_provider_call");
    });
    const db = (await getDb())!;
    const [owner] = await db
      .select()
      .from(tables.users)
      .where(eq(tables.users.id, owners[0]));
    const ip = randomUUID();
    mailKeys = ["global", `ip:${ip}`, `email:${owner.email}`].map(scope =>
      createHmac("sha256", secret)
        .update(`recovery-quota:${scope}`)
        .digest("hex")
    );
    await requestPasswordReset(owner.email!, ip);
    const jobs = await db
      .select()
      .from(tables.accountMailJobs)
      .where(eq(tables.accountMailJobs.quotaKey, mailKeys[2]));
    mailIds = jobs.map(job => job.id);
    const result = await inspect();
    expect(result.code, result.stderr).toBe(0);
    expect(result.report()).toMatchObject({
      categories: { accountMailJobs: 1 },
      issues: expect.arrayContaining([
        { code: "mail_work_pending", category: "accountMailJobs" },
      ]),
    });
    expect(result.stdout).not.toContain(owner.email!);
    expect(result.stdout).not.toContain(secret);
    expect(
      (
        await db
          .select()
          .from(tables.accountMailJobs)
          .where(eq(tables.accountMailJobs.id, mailIds[0]))
      )[0]
    ).toMatchObject({
      userId: null,
      state: "queued",
      payload: jobs[0].payload,
    });
    const unavailable = await inspect(owners[0], {
      AUTH_MAIL_ENCRYPTION_SECRET: "",
    });
    expect(unavailable.code).toBe(0);
    expect(unavailable.report().issues).toContainEqual({
      code: "mail_attribution_unresolved",
      category: "accountMailJobs",
    });
  });
  it("refuses an unknown live table instead of claiming complete coverage", async () => {
    const db = (await getDb())!;
    await db.execute(
      sql`CREATE TABLE deletion_preflight_unknown (id INT PRIMARY KEY, user_id INT)`
    );
    try {
      const result = await inspect();
      expect(result.code).toBe(1);
      expect(result.report()).toEqual({
        mode: "read-only",
        deletionAuthorized: false,
        error: "deletion_schema_review_required",
      });
    } finally {
      await db.execute(sql`DROP TABLE deletion_preflight_unknown`);
    }
  });
  it.each([0, 1, 2, 3])("rejects unsafe CLI argument case %i", async index => {
    const args = [
      ["--account-id", String(owners[0])],
      ["--read-only", "--account-id", "-1"],
      ["--read-only", "--account-id", "1 OR 1=1"],
      ["--read-only", "--account-id", String(owners[0]), "--delete"],
    ][index];
    const result = await inspect(owners[0], {}, args);
    expect(result.code).toBe(1);
    expect(result.report().error).toBe("invalid_read_only_arguments");
  });
  it("requires an existing account", async () => {
    const result = await inspect(2147483647);
    expect(result.code).toBe(1);
    expect(result.report().error).toBe("deletion_account_not_found");
  });
  it("does not print connection secrets when database configuration is malformed", async () => {
    const result = await inspect(owners[0], {
      DATABASE_URL: "malformed-private-connection-secret",
    });
    expect(result.code).toBe(1);
    expect(result.stdout + result.stderr).not.toContain(
      "malformed-private-connection-secret"
    );
    expect(result.report().deletionAuthorized).toBe(false);
  });
  it("uses a database-enforced read-only transaction", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        await expect(
          tx
            .update(tables.users)
            .set({ name: "Should not be written" })
            .where(eq(tables.users.id, owners[0]))
        ).rejects.toMatchObject({
          cause: { code: "ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION" },
        });
        return callback(tx);
      }, config)
    );
    expect((await inspectAccountDeletion(owners[0])).categories.users).toBe(1);
    expect(
      (
        await db
          .select()
          .from(tables.users)
          .where(eq(tables.users.id, owners[0]))
      )[0].name
    ).toBe("Never-print-owner-0");
  });
  it("keeps a stable snapshot while an independent connection creates another owned record", async () => {
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        await tx
          .select({ id: tables.users.id })
          .from(tables.users)
          .where(eq(tables.users.id, owners[0]));
        await db
          .insert(tables.prospects)
          .values({ userId: owners[0], name: "Concurrent fixture" });
        return callback(tx);
      }, config)
    );
    expect((await inspectAccountDeletion(owners[0])).categories.prospects).toBe(
      1
    );
    expect(
      await db
        .select()
        .from(tables.prospects)
        .where(eq(tables.prospects.userId, owners[0]))
    ).toHaveLength(2);
  });
  it("rejects a removed live foreign key even though table and column names match", async () => {
    const db = (await getDb())!;
    const [rows] = await db.execute(
      sql`SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='messages' AND COLUMN_NAME='senderId' AND REFERENCED_TABLE_NAME='users'`
    );
    const name = (rows as unknown as { name: string }[])[0].name;
    await db.execute(
      sql`ALTER TABLE messages DROP FOREIGN KEY ${sql.identifier(name)}`
    );
    try {
      const result = await inspect();
      expect(result.code).toBe(1);
      expect(result.report().error).toBe("deletion_schema_review_required");
    } finally {
      await db.execute(
        sql`ALTER TABLE messages ADD CONSTRAINT ${sql.identifier(name)} FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION`
      );
    }
  });
  it("reports possible provider delivery for an owned accepted job without changing it", async () => {
    const db = (await getDb())!,
      id = randomUUID();
    await db.insert(tables.accountMailJobs).values({
      id,
      userId: owners[0],
      kind: "password_changed",
      quotaKey: randomUUID(),
      state: "accepted",
      attempts: 1,
      providerId: "Never-print-provider-id",
      expiresAt: new Date(Date.now() + 60000),
    });
    const result = await inspect();
    expect(result.code, result.stdout).toBe(0);
    expect(result.report().issues).toContainEqual({
      code: "mail_delivery_review",
      category: "accountMailJobs",
    });
    expect(result.stdout).not.toContain("Never-print-provider-id");
    expect(
      (
        await db
          .select()
          .from(tables.accountMailJobs)
          .where(eq(tables.accountMailJobs.id, id))
      )[0].state
    ).toBe("accepted");
  });
  it("resolves indirect ownership through matches and prospects without including the second account", async () => {
    const db = (await getDb())!;
    for (let i = 0; i < 2; i++) {
      const [match] = await db
        .insert(tables.matches)
        .values({
          userId: owners[i],
          prospectId: candidates[i],
          overallScore: 77,
        })
        .$returningId();
      matchIds.push(match.id);
      await db.insert(tables.leadScores).values({
        matchId: match.id,
        responseLikelihood: 0.5,
        engagementScore: 42,
        priorityRank: 1,
        factors: "Never-print-indirect-content",
      });
      await db
        .insert(tables.stageTransitions)
        .values({ matchId: match.id, toStage: "contacted" });
      await db
        .insert(tables.responsePatterns)
        .values({ prospectId: candidates[i], dayOfWeek: 1, hourOfDay: 12 });
    }
    const result = await inspect();
    expect(result.code, result.stdout).toBe(0);
    expect(result.report()).toMatchObject({
      categories: {
        matches: 1,
        leadScores: 1,
        stageTransitions: 1,
        responsePatterns: 1,
      },
      issues: [],
    });
    expect(result.stdout).not.toContain("Never-print-indirect-content");
  });
  it("distinguishes an own revision chain from a cross-account logical message-parent link", async () => {
    const db = (await getDb())!;
    const [original] = await db
      .insert(tables.outreachRecords)
      .values({
        userId: owners[0],
        prospectId: candidates[0],
        body: "Never-print",
        idempotencyKey: randomUUID(),
      })
      .$returningId();
    await db.insert(tables.outreachRecords).values({
      userId: owners[0],
      prospectId: candidates[0],
      revisesId: original.id,
      body: "Never-print-revision",
      idempotencyKey: randomUUID(),
    });
    const [message] = await db
      .insert(tables.messages)
      .values({
        userId: owners[0],
        senderId: owners[0],
        prospectId: candidates[0],
        recipientId: candidates[0],
        body: "Never-print",
        content: "Never-print",
      })
      .$returningId();
    await db.insert(tables.messages).values({
      userId: owners[1],
      senderId: owners[1],
      prospectId: candidates[1],
      recipientId: candidates[1],
      parentMessageId: message.id,
      body: "Never-print",
      content: "Never-print",
    });
    const result = await inspect();
    expect(result.code, result.stdout).toBe(0);
    expect(result.report().categories.outreachRecords).toBe(2);
    expect(result.report().issues).toEqual([
      {
        code: "cross_owner_reference",
        category: "messages",
        field: "parent_message_id",
        direction: "incoming",
      },
    ]);
  });
});
