import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { eq, inArray, or, sql } from "drizzle-orm";
import {
  auditEvents,
  idempotencyRecords,
  outreachRecords,
  prospects,
  userProfiles,
  users,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import { criticalPathRouter } from "./critical-path-router";
import { appRouter } from "./routers";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";
import { appendWorkspaceAudit, WORKSPACE_AUDIT_ACTIONS } from "./capacity";

let owners: User[] = [];
let createdOpenIds: string[] = [];
let createdEmails: string[] = [];
const runChild = promisify(execFile);
const api = (i = 0, requestId = randomUUID()) =>
  criticalPathRouter.createCaller({
    user: owners[i],
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
const limit = (name: string, value: number) => {
  vi.stubEnv(name, String(value));
  resetConfigForTests();
};
const newUser = () => {
  const openId = `capacity-${randomUUID()}`;
  createdOpenIds.push(openId);
  const email = `${randomUUID()}@example.invalid`;
  createdEmails.push(email);
  return {
    openId,
    name: "Synthetic capacity owner",
    email,
    loginMethod: "local",
  };
};
const importInput = (
  i = 0,
  csv = "name,platform\nSynthetic candidate,manual",
  key = randomUUID()
) => ({
  accountId: owners[i].id,
  csv,
  idempotencyKey: key,
  declaration: {
    collectionMethod: "direct_from_person" as const,
    rightsConfirmed: true as const,
    evidenceReference: "synthetic-source-001",
  },
});
async function count(
  table: typeof users | typeof prospects | typeof outreachRecords
) {
  const db = (await data.getDb())!;
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(table);
  return Number(row.n);
}
async function ownedProspects(i = 0) {
  return (await data.getDb())!
    .select()
    .from(prospects)
    .where(eq(prospects.userId, owners[i].id));
}
async function candidate(i = 0) {
  const [row] = await (await data.getDb())!
    .insert(prospects)
    .values({
      userId: owners[i].id,
      name: "Synthetic contact",
      platform: "manual",
      consentStatus: "opted_in",
    })
    .$returningId();
  return row.id;
}
const draft = (prospectId: number, key = randomUUID()) => ({
  prospectId,
  body: "Synthetic human original message.",
  idempotencyKey: key,
  declaration: { humanOriginal: true as const, rulesReviewed: true as const },
});

describe("durable service and owner capacity with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    createdOpenIds = [];
    createdEmails = [];
    for (const field of [
      "CAPACITY_ACCOUNTS",
      "CAPACITY_PROSPECTS_TOTAL",
      "CAPACITY_PROSPECTS_PER_ACCOUNT",
      "CAPACITY_OUTREACH_TOTAL",
      "CAPACITY_OUTREACH_PER_ACCOUNT",
      "CAPACITY_WORKSPACE_AUDIT_TOTAL",
      "CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT",
    ])
      limit(field, 100000);
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({ ...newUser(), emailVerified: 1 })
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
      await db.delete(userProfiles).where(eq(userProfiles.userId, owner.id));
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db
        .delete(idempotencyRecords)
        .where(eq(idempotencyRecords.userId, owner.id));
      await db
        .delete(outreachRecords)
        .where(eq(outreachRecords.userId, owner.id));
      await db.delete(prospects).where(eq(prospects.userId, owner.id));
    }
    if (createdOpenIds.length)
      await db
        .delete(users)
        .where(
          or(
            inArray(users.openId, createdOpenIds),
            inArray(users.email, createdEmails)
          )
        );
    vi.unstubAllEnvs();
    resetConfigForTests();
  });

  async function workspaceAuditCount() {
    const [row] = await (await data.getDb())!
      .select({ n: sql<number>`count(*)` })
      .from(auditEvents)
      .where(inArray(auditEvents.action, [...WORKSPACE_AUDIT_ACTIONS]));
    return Number(row.n);
  }

  it("rolls back repeated profile edits when the owner's audit allowance is exhausted", async () => {
    limit("CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT", 1);
    await data.createOrUpdateProfile(owners[0].id, {
      bio: "Retained original",
    });
    await expect(
      data.createOrUpdateProfile(owners[0].id, { bio: "Must roll back" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    const [profile] = await (await data.getDb())!
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, owners[0].id));
    expect(profile.bio).toBe("Retained original");
    expect(await workspaceAuditCount()).toBe(1);
  });

  it.each([true, false])(
    "serializes the final audit slot across owners: %s",
    async differentOwners => {
      limit(
        "CAPACITY_WORKSPACE_AUDIT_TOTAL",
        (await workspaceAuditCount()) + 1
      );
      const results = await Promise.allSettled([
        data.createOrUpdateProfile(owners[0].id, { bio: "First attempt" }),
        data.createOrUpdateProfile(owners[differentOwners ? 1 : 0].id, {
          bio: "Second attempt",
        }),
      ]);
      expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
      expect(results.find(r => r.status === "rejected")).toMatchObject({
        reason: { code: "TOO_MANY_REQUESTS" },
      });
    }
  );

  it("preserves historical rejected receipts in accounting and permits opt-out at zero allowance", async () => {
    const db = (await data.getDb())!;
    await db.insert(auditEvents).values({
      userId: owners[0].id,
      action: "profile.save",
      outcome: "rejected",
      requestId: randomUUID(),
      createdAt: new Date("2020-01-01"),
    });
    limit("CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT", 1);
    await expect(
      data.createOrUpdateProfile(owners[0].id, { bio: "Denied" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    limit("CAPACITY_WORKSPACE_AUDIT_TOTAL", 0);
    const id = await candidate();
    expect(
      await api().prospects.optOut({
        id,
        accountId: owners[0].id,
        confirmed: true,
      })
    ).toMatchObject({ changed: true });
    expect(await workspaceAuditCount()).toBe(1);
  });

  it("does not charge an exact import replay or persist a rejected new import", async () => {
    limit("CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT", 1);
    const input = importInput();
    expect(await api().prospects.importCsv(input)).toMatchObject({
      imported: 1,
      replayed: false,
    });
    expect(await api().prospects.importCsv(input)).toMatchObject({
      imported: 1,
      replayed: true,
    });
    await expect(
      api().prospects.importCsv(
        importInput(0, "name,platform\nSecond candidate,manual")
      )
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await ownedProspects()).toHaveLength(1);
    expect(await workspaceAuditCount()).toBe(1);
    const receipts = await (await data.getDb())!
      .select()
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.userId, owners[0].id));
    expect(receipts).toHaveLength(1);
  });

  it("rollback releases the slot and protective security receipts do not consume it", async () => {
    const db = (await data.getDb())!;
    limit("CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT", 1);
    await expect(
      db.transaction(
        async tx => {
          await tx
            .select()
            .from(users)
            .where(eq(users.id, owners[0].id))
            .for("update");
          await appendWorkspaceAudit(tx, {
            userId: owners[0].id,
            requestId: randomUUID(),
            action: "profile.save",
            outcome: "success",
          });
          throw new Error("synthetic_rollback");
        },
        { isolationLevel: "read committed" }
      )
    ).rejects.toThrow("synthetic_rollback");
    await data.createAuditEvent({
      userId: owners[0].id,
      requestId: randomUUID(),
      action: "auth.email_token_redeemed",
      outcome: "success",
    });
    await data.createOrUpdateProfile(owners[0].id, {
      bio: "Slot still available",
    });
    expect(await workspaceAuditCount()).toBe(1);
    await expect(
      data.createAuditEvent({
        userId: owners[0].id,
        requestId: randomUUID(),
        action: "profile.save",
        outcome: "success",
      })
    ).rejects.toThrow("workspace_audit_requires_mutation_transaction");
  });

  it("shares the final workspace audit slot with fresh processes and preserves security at zero", async () => {
    limit("CAPACITY_WORKSPACE_AUDIT_TOTAL", (await workspaceAuditCount()) + 1);
    const child = (owner: User) =>
      runChild(
        process.execPath,
        [
          "--import",
          "tsx",
          fileURLToPath(
            new URL("./test-fixtures/capacity-child.ts", import.meta.url)
          ),
          String(owner.id),
          "workspace-audit",
        ],
        { env: process.env, timeout: 12000 }
      );
    const results = await Promise.all([child(owners[0]), child(owners[1])]);
    expect(
      results
        .map(r => JSON.parse(r.stdout.trim().split("\n").pop()!).code)
        .sort()
    ).toEqual(["ADMITTED", "TOO_MANY_REQUESTS"]);
    limit("CAPACITY_WORKSPACE_AUDIT_TOTAL", 0);
    const token = randomBytes(32).toString("base64url");
    await data.setVerificationToken(
      owners[0].id,
      token,
      new Date(Date.now() + 60000)
    );
    expect(await data.verifyEmailToken(token)).toMatchObject({
      id: owners[0].id,
    });
    expect(await workspaceAuditCount()).toBe(1);
  });

  it("admits only one simultaneous registration for the final service slot", async () => {
    const before = await count(users);
    limit("CAPACITY_ACCOUNTS", before + 1);
    const results = await Promise.allSettled([
      data.createLocalUser(newUser()),
      data.createLocalUser(newUser()),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect(await count(users)).toBe(before + 1);
  });
  it("blocks new legacy upserts at capacity while allowing an existing account update", async () => {
    limit("CAPACITY_ACCOUNTS", 0);
    await expect(data.upsertUser(newUser())).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await data.upsertUser({
      openId: owners[0].openId,
      name: "Preserved existing owner",
    });
    expect((await data.getUserByOpenId(owners[0].openId))?.name).toBe(
      "Preserved existing owner"
    );
  });
  it("rejects a second simultaneous registration for the same email", async () => {
    const first = newUser(),
      second = { ...newUser(), email: first.email };
    const results = await Promise.allSettled([
      data.createLocalUser(first),
      data.createLocalUser(second),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({
      reason: { code: "CONFLICT" },
    });
  });
  it("returns a capacity error through public registration without issuing a session", async () => {
    limit("CAPACITY_ACCOUNTS", 0);
    vi.stubEnv("ENABLE_REGISTRATION", "true");
    resetConfigForTests();
    const input = newUser();
    const cookie = vi.fn();
    const caller = appRouter.createCaller({
      user: null,
      requestId: randomUUID(),
      req: { ip: randomUUID(), headers: {} },
      res: { cookie },
    } as unknown as TrpcContext);
    await expect(
      caller.auth.register({
        name: input.name,
        email: input.email,
        password: "SyntheticPassword42!",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await data.getUserByEmail(input.email)).toBeNull();
    expect(cookie).not.toHaveBeenCalled();
  });
  it("rolls back an entire CSV when its new rows exceed owner capacity", async () => {
    limit("CAPACITY_PROSPECTS_PER_ACCOUNT", 1);
    const request = importInput(
      0,
      "name,platform\nFirst,manual\nSecond,manual"
    );
    await expect(api().prospects.importCsv(request)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await ownedProspects()).toHaveLength(0);
    expect(
      await data.getIdempotencyRecord(
        owners[0].id,
        "prospect.import_csv",
        request.idempotencyKey
      )
    ).toBeNull();
    expect(
      await (await data.getDb())!
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owners[0].id))
    ).toHaveLength(0);
    limit("CAPACITY_PROSPECTS_PER_ACCOUNT", 2);
    expect(await api().prospects.importCsv(request)).toMatchObject({
      imported: 2,
      replayed: false,
    });
  });
  it("serializes different-owner imports against the final global slot", async () => {
    const before = await count(prospects);
    limit("CAPACITY_PROSPECTS_TOTAL", before + 1);
    const results = await Promise.allSettled([
      api(0).prospects.importCsv(importInput(0)),
      api(1).prospects.importCsv(importInput(1)),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect(await count(prospects)).toBe(before + 1);
  });
  it("allows replay and duplicate-only intake at zero capacity without replacing an opt-out", async () => {
    const request = importInput(
      0,
      "name,platform,profileUrl,consentStatus\nOriginal,github-collaboration,https://github.com/synthetic-capacity,opted_out"
    );
    await api().prospects.importCsv(request);
    limit("CAPACITY_PROSPECTS_TOTAL", 0);
    limit("CAPACITY_PROSPECTS_PER_ACCOUNT", 0);
    expect(await api().prospects.importCsv(request)).toMatchObject({
      imported: 1,
      replayed: true,
    });
    expect(
      await api().prospects.importCsv({
        ...request,
        idempotencyKey: randomUUID(),
      })
    ).toMatchObject({ imported: 0, skipped: 1, replayed: false });
    expect(await ownedProspects()).toHaveLength(1);
    expect((await ownedProspects())[0]).toMatchObject({
      name: "Original",
      consentStatus: "opted_out",
    });
  });
  it("counts archived records and does not evade admission through the low-level prospect helper", async () => {
    const id = await candidate();
    await (await data.getDb())!
      .update(prospects)
      .set({ archivedAt: new Date(), consentStatus: "opted_out" })
      .where(eq(prospects.id, id));
    limit("CAPACITY_PROSPECTS_PER_ACCOUNT", 1);
    await expect(
      data.createProspect({
        userId: owners[0].id,
        name: "Extra",
        platform: "manual",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await ownedProspects()).toHaveLength(1);
    expect((await ownedProspects())[0].archivedAt).not.toBeNull();
  });
  it("allows another owner to use their own remaining allowance", async () => {
    limit("CAPACITY_PROSPECTS_PER_ACCOUNT", 1);
    await candidate(0);
    await expect(
      api(0).prospects.importCsv(importInput(0))
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(await api(1).prospects.importCsv(importInput(1))).toMatchObject({
      imported: 1,
    });
  });
  it("keeps available capacity after an audit failure rolls back a draft", async () => {
    const id = await candidate();
    const request = draft(id);
    limit("CAPACITY_OUTREACH_PER_ACCOUNT", 1);
    await expect(
      api(0, "x".repeat(65)).outreach.draft(request)
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(await api().outreach.draft(request)).toMatchObject({
      replayed: false,
    });
    await expect(api().outreach.draft(draft(id))).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });
  it("serializes different-owner drafts against the final global slot", async () => {
    const one = await candidate(0),
      two = await candidate(1);
    const before = await count(outreachRecords);
    limit("CAPACITY_OUTREACH_TOTAL", before + 1);
    const results = await Promise.allSettled([
      api(0).outreach.draft(draft(one)),
      api(1).outreach.draft(draft(two)),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({
      reason: { code: "TOO_MANY_REQUESTS" },
    });
    expect(await count(outreachRecords)).toBe(before + 1);
  });
  it("replays an existing draft and permits opt-out after capacity is reduced to zero", async () => {
    const id = await candidate();
    const request = draft(id);
    const saved = await api().outreach.draft(request);
    limit("CAPACITY_OUTREACH_TOTAL", 0);
    limit("CAPACITY_OUTREACH_PER_ACCOUNT", 0);
    limit("CAPACITY_PROSPECTS_TOTAL", 0);
    expect(await api().outreach.draft(request)).toMatchObject({
      outreach: { id: saved.outreach.id },
      replayed: true,
    });
    await expect(
      data.createOutreachRecord({
        userId: owners[0].id,
        prospectId: id,
        body: "Extra",
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(
      await api().prospects.optOut({
        id,
        accountId: owners[0].id,
        confirmed: true,
      })
    ).toMatchObject({ changed: true });
    expect(
      (await api().prospects.details({ id, accountId: owners[0].id })).prospect
        .consentStatus
    ).toBe("opted_out");
  });
  it("enforces the same candidate limit in a fresh Node process", async () => {
    limit("CAPACITY_PROSPECTS_PER_ACCOUNT", 1);
    await candidate();
    const { stdout } = await runChild(
      process.execPath,
      [
        "--import",
        "tsx",
        fileURLToPath(
          new URL("./test-fixtures/capacity-child.ts", import.meta.url)
        ),
        String(owners[0].id),
      ],
      { env: process.env, timeout: 12000 }
    );
    expect(JSON.parse(stdout.trim().split("\n").pop()!)).toEqual({
      code: "TOO_MANY_REQUESTS",
    });
    expect(await ownedProspects()).toHaveLength(1);
  });
  it("admits only one of two fresh processes competing for the final global candidate slot", async () => {
    const before = await count(prospects);
    limit("CAPACITY_PROSPECTS_TOTAL", before + 1);
    const child = (owner: User) =>
      runChild(
        process.execPath,
        [
          "--import",
          "tsx",
          fileURLToPath(
            new URL("./test-fixtures/capacity-child.ts", import.meta.url)
          ),
          String(owner.id),
        ],
        { env: process.env, timeout: 12000 }
      );
    const results = await Promise.all([child(owners[0]), child(owners[1])]);
    const codes = results
      .map(result => JSON.parse(result.stdout.trim().split("\n").pop()!).code)
      .sort();
    expect(codes).toEqual(["ADMITTED", "TOO_MANY_REQUESTS"]);
    expect(await count(prospects)).toBe(before + 1);
  });
  it("fails closed without the capacity migration while preserving existing records and opt-out", async () => {
    const db = (await data.getDb())!;
    const id = await candidate();
    const before = {
      accounts: await count(users),
      prospects: await count(prospects),
      outreach: await count(outreachRecords),
    };
    // Only this serial, isolated synthetic suite uses the database. Restore the
    // exact table in finally; no user data or capacity rows are dropped.
    const heldTable = `capacity_unavailable_${randomUUID().replaceAll("-", "")}`;
    await db.execute(sql.raw(`RENAME TABLE capacity_locks TO ${heldTable}`));
    try {
      await expect(data.createLocalUser(newUser())).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      await expect(
        api().prospects.importCsv(importInput())
      ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
      await expect(api().outreach.draft(draft(id))).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      expect({
        accounts: await count(users),
        prospects: await count(prospects),
        outreach: await count(outreachRecords),
      }).toEqual(before);
      expect(
        await api().prospects.optOut({
          id,
          accountId: owners[0].id,
          confirmed: true,
        })
      ).toMatchObject({ changed: true });
      expect(
        (await api().prospects.details({ id, accountId: owners[0].id }))
          .prospect.consentStatus
      ).toBe("opted_out");
    } finally {
      await db.execute(sql.raw(`RENAME TABLE ${heldTable} TO capacity_locks`));
    }
    expect(await api().prospects.importCsv(importInput())).toMatchObject({
      imported: 1,
    });
  });
});
