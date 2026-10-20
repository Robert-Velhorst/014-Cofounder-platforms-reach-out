import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { eq, sql } from "drizzle-orm";
import { accountDeletionRequests, users } from "../drizzle/schema";
import { getDb } from "./db";
import { inspectAccountDeletion } from "./account-deletion-preflight";
import { listDeletionRequests } from "./account-deletion-review";

const require = createRequire(import.meta.url);
let owners: number[] = [];
const keys = [
  "2199da0b-a175-4325-8f14-c13575672c01",
  "2199da0b-a175-4325-8f14-c13575672c02",
  "2199da0b-a175-4325-8f14-c13575672c03",
];
async function command(args = ["--read-only", "--limit", "2"], env = {}) {
  const child = spawn(
    process.execPath,
    [
      require.resolve("tsx/cli"),
      "scripts/list-account-deletion-requests.ts",
      ...args,
    ],
    {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 12000,
    }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", value => (stdout += value.toString()));
  child.stderr.on("data", value => (stderr += value.toString()));
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  return { code, stdout, stderr, report: () => JSON.parse(stdout.trim()) };
}
async function seed(
  index: number,
  status: "none" | "pending_review" | "withdrawn" = "pending_review"
) {
  const db = (await getDb())!;
  await db.insert(accountDeletionRequests).values({
    userId: owners[index],
    status,
    requestKey: status === "none" ? null : keys[index],
    revision: status === "none" ? 0 : status === "withdrawn" ? 2 : 1,
    requestedAt: status === "none" ? null : new Date("2026-09-30T12:00:00Z"),
    withdrawnAt:
      status === "withdrawn" ? new Date("2026-09-30T13:00:00Z") : null,
    attempts: 4,
    attemptWindowExpiresAt: new Date("2026-10-01T12:00:00Z"),
  });
}

describe("read-only operator deletion request queue", () => {
  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (url.hostname !== "127.0.0.1" || url.pathname !== "/cofounder_test")
      throw new Error("isolated_database_required");
  });
  beforeEach(async () => {
    owners = [];
    const db = (await getDb())!;
    for (let index = 0; index < 3; index++) {
      const [row] = await db
        .insert(users)
        .values({
          openId: `deletion-review-${randomUUID()}`,
          email: `never-print-${randomUUID()}@example.invalid`,
          name: "Never-print-private-name",
          passwordHash: "Never-print-credential-hash",
          emailVerified: 1,
        })
        .$returningId();
      owners.push(row.id);
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    const db = (await getDb())!;
    for (const id of owners) await db.delete(users).where(eq(users.id, id));
  });
  it("lists only pending requests without private content, quota data or mutation", async () => {
    await seed(0);
    await seed(1, "withdrawn");
    await seed(2, "none");
    const db = (await getDb())!;
    const before = await db.select().from(accountDeletionRequests);
    const result = await command();
    expect(result.code, result.stderr).toBe(0);
    expect(result.report()).toMatchObject({
      mode: "read-only",
      deletionAuthorized: false,
      nextAfterAccountId: null,
      requests: [
        {
          accountId: owners[0],
          requestKey: keys[0],
          revision: 1,
          status: "pending_review",
          requestedAt: "2026-09-30T12:00:00Z",
          accountFenced: false,
        },
      ],
    });
    expect(result.report().requests).toHaveLength(1);
    expect(result.stdout).not.toMatch(
      /Never-print|never-print|password|email|attempts|attemptWindow/
    );
    expect(await db.select().from(accountDeletionRequests)).toEqual(before);
  });
  it("paginates by account ID without overlap or silently truncating the remaining page", async () => {
    await seed(2);
    await seed(0);
    await seed(1);
    const first = await command();
    expect(first.code, first.stderr).toBe(0);
    expect(first.report().requests.map((row: any) => row.accountId)).toEqual(
      owners.slice(0, 2)
    );
    expect(first.report().nextAfterAccountId).toBe(owners[1]);
    const second = await command([
      "--read-only",
      "--limit",
      "2",
      "--after-account-id",
      String(owners[1]),
    ]);
    expect(second.code, second.stderr).toBe(0);
    expect(second.report().requests.map((row: any) => row.accountId)).toEqual([
      owners[2],
    ]);
    expect(second.report().nextAfterAccountId).toBeNull();
  });
  it("returns an explicit empty page without pretending deletion is enabled", async () => {
    const result = await command(["--read-only"]);
    expect(result.code, result.stderr).toBe(0);
    expect(result.report()).toMatchObject({
      requests: [],
      nextAfterAccountId: null,
      deletionAuthorized: false,
    });
  });
  it("retains fenced and currently unverified owners in the operator review queue", async () => {
    await seed(0);
    await (await getDb())!
      .update(users)
      .set({ deletionFencedAt: new Date(), emailVerified: 0 })
      .where(eq(users.id, owners[0]));
    const result = await command();
    expect(result.code, result.stderr).toBe(0);
    expect(result.report().requests).toMatchObject([
      { accountId: owners[0], accountFenced: true },
    ]);
  });
  it("includes request state and work fence in the same account ownership snapshot", async () => {
    await seed(0);
    const report = await inspectAccountDeletion(owners[0]);
    expect(report).toMatchObject({
      request: {
        status: "pending_review",
        requestKey: keys[0],
        revision: 1,
        requestedAt: "2026-09-30T12:00:00Z",
        withdrawnAt: null,
      },
      accountFenced: false,
      deletionAuthorized: false,
    });
  });
  it("distinguishes withdrawn requests from absent or quota-only request rows", async () => {
    await seed(0, "withdrawn");
    await seed(1, "none");
    expect(await inspectAccountDeletion(owners[0])).toMatchObject({
      request: {
        status: "withdrawn",
        revision: 2,
        withdrawnAt: "2026-09-30T13:00:00Z",
      },
    });
    for (const id of owners.slice(1))
      expect(await inspectAccountDeletion(id)).toMatchObject({
        request: {
          status: "none",
          revision: 0,
          requestKey: null,
          requestedAt: null,
          withdrawnAt: null,
        },
      });
  });
  it.each([
    [],
    ["--limit", "2"],
    ["--read-only", "--limit", "101"],
    ["--read-only", "--limit", "0"],
    ["--read-only", "--after-account-id", "2147483648"],
    ["--read-only", "--after-account-id", "1 OR 1=1"],
    ["--read-only", "--delete"],
    ["--read-only", "--limit", "2", "--limit", "3"],
  ])("refuses unsafe or ambiguous arguments case %#", async (...args) => {
    const result = await command(args);
    expect(result.code).toBe(1);
    expect(result.report()).toEqual({
      mode: "read-only",
      deletionAuthorized: false,
      error: "invalid_read_only_arguments",
    });
  });
  it("returns a secret-safe failure for malformed storage configuration", async () => {
    const result = await command(["--read-only"], {
      DATABASE_URL: "never-print-database-secret",
    });
    expect(result.code).toBe(1);
    expect(result.stdout + result.stderr).not.toContain(
      "never-print-database-secret"
    );
    expect(result.report()).toMatchObject({
      deletionAuthorized: false,
      error: "deletion_storage_unavailable",
    });
  });
  it.each([
    { requestKey: null },
    { requestKey: "not-a-valid-reference" },
    { revision: 0 },
    { requestedAt: null },
    { withdrawnAt: new Date("2026-09-30T13:00:00Z") },
  ])(
    "refuses to publish malformed pending request metadata case %#",
    async patch => {
      await seed(0);
      await (await getDb())!
        .update(accountDeletionRequests)
        .set(patch)
        .where(eq(accountDeletionRequests.userId, owners[0]));
      await expect(listDeletionRequests()).rejects.toThrow(
        "deletion_request_review_required"
      );
      await expect(inspectAccountDeletion(owners[0])).rejects.toThrow(
        "deletion_request_review_required"
      );
    }
  );
  it("validates the lookahead record instead of returning a plausible incomplete page", async () => {
    await seed(0);
    await seed(1);
    await (await getDb())!
      .update(accountDeletionRequests)
      .set({ requestKey: null })
      .where(eq(accountDeletionRequests.userId, owners[1]));
    await expect(listDeletionRequests({ limit: 1 })).rejects.toThrow(
      "deletion_request_review_required"
    );
  });
  it("runs in a database-enforced read-only transaction", async () => {
    await seed(0);
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        await expect(
          tx
            .update(users)
            .set({ name: "Must not change" })
            .where(eq(users.id, owners[0]))
        ).rejects.toMatchObject({
          cause: { code: "ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION" },
        });
        return callback(tx);
      }, config)
    );
    expect((await listDeletionRequests()).requests).toHaveLength(1);
    expect(
      (await db.select().from(users).where(eq(users.id, owners[0])))[0].name
    ).toBe("Never-print-private-name");
  });
  it("keeps pending state in its snapshot while an independent connection withdraws it", async () => {
    await seed(0);
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        await tx
          .select()
          .from(accountDeletionRequests)
          .where(eq(accountDeletionRequests.userId, owners[0]));
        await db
          .update(accountDeletionRequests)
          .set({
            status: "withdrawn",
            revision: 2,
            withdrawnAt: new Date("2026-09-30T13:00:00Z"),
          })
          .where(eq(accountDeletionRequests.userId, owners[0]));
        return callback(tx);
      }, config)
    );
    expect((await listDeletionRequests()).requests).toMatchObject([
      { requestKey: keys[0], revision: 1 },
    ]);
    vi.restoreAllMocks();
    expect((await listDeletionRequests()).requests).toEqual([]);
    expect(await inspectAccountDeletion(owners[0])).toMatchObject({
      request: { status: "withdrawn", revision: 2 },
    });
  });
  it("rejects a non-UTC session rather than reinterpreting request dates", async () => {
    await seed(0);
    const db = (await getDb())!,
      run = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      run(async tx => {
        await tx.execute(sql`SET SESSION time_zone = '+02:00'`);
        try {
          return await callback(tx);
        } finally {
          await tx.execute(sql`SET SESSION time_zone = '+00:00'`);
        }
      }, config)
    );
    await expect(listDeletionRequests()).rejects.toThrow(
      "deletion_requires_utc_session"
    );
  });
});
