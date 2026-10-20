import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import * as tables from "../drizzle/schema";
import { getDb } from "./db";
import { hashPassword } from "./auth-password";
import { criticalPathRouter } from "./critical-path-router";
import { exportAccountData } from "./account-export";
import { inspectAccountDeletion } from "./account-deletion-preflight";
import { emptyPresetSettings } from "../shared/workspace-presets";
import type { TrpcContext } from "./_core/context";
import { resetConfigForTests } from "./config";
let owners: tables.User[] = [];
const password = "Synthetic-Preset-Password42";
const api = (index = 0) =>
  criticalPathRouter.createCaller({
    user: owners[index],
    req: {},
    res: {},
    requestId: randomUUID(),
  } as TrpcContext);
const target = (index = 0) => ({ accountId: owners[index].id });
const settings = () => ({
  ...emptyPresetSettings(),
  search: "Amsterdam",
  templates: [
    {
      id: randomUUID(),
      name: "My greeting",
      body: "Synthetic original text",
      humanOriginal: true as const,
    },
  ],
});
const command = () => ({
  ...target(),
  expectedRevision: 0,
  settings: settings(),
  confirmation: true as const,
});
describe("owner-scoped reusable presets with MySQL", () => {
  it("rolls back settings when durable audit capacity is exhausted, while preserving reads and exact retries", async () => {
    const input = command();
    await api().presets.save(input);
    const previous = process.env.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT;
    process.env.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT = "0";
    resetConfigForTests();
    try {
      await expect(
        api().presets.save({
          ...input,
          expectedRevision: 1,
          settings: emptyPresetSettings(),
        })
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
      expect((await api().presets.read(target())).revision).toBe(1);
      expect((await api().presets.save(input)).replayed).toBe(true);
    } finally {
      if (previous === undefined)
        delete process.env.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT;
      else process.env.CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT = previous;
      resetConfigForTests();
    }
  });
  it("fails closed on corrupt stored defaults without exposing their text", async () => {
    const input = command();
    await api().presets.save(input);
    await (await getDb())!
      .update(tables.workspacePresets)
      .set({
        settings: {
          ...emptyPresetSettings(),
          candidateStatus: "private-corrupt-sentinel",
        } as any,
      })
      .where(eq(tables.workspacePresets.userId, owners[0].id));
    await expect(api().presets.read(target())).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    try {
      await api().presets.read(target());
    } catch (error) {
      expect(String(error)).not.toContain("private-corrupt-sentinel");
    }
  });
  beforeEach(async () => {
    owners = [];
    const db = (await getDb())!,
      passwordHash = await hashPassword(password);
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(tables.users)
        .values({ openId: randomUUID(), emailVerified: 1, passwordHash })
        .$returningId();
      const [owner] = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, created.id));
      owners.push(owner);
    }
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    const db = (await getDb())!;
    for (const owner of owners) {
      await db
        .delete(tables.auditEvents)
        .where(eq(tables.auditEvents.userId, owner.id));
      await db
        .delete(tables.accountExportQuotas)
        .where(eq(tables.accountExportQuotas.userId, owner.id));
      await db
        .delete(tables.workspacePresets)
        .where(eq(tables.workspacePresets.userId, owner.id));
      await db.delete(tables.users).where(eq(tables.users.id, owner.id));
    }
  });
  it("reads virtual empty defaults without allocating a row", async () => {
    expect(await api().presets.read(target())).toEqual({
      revision: 0,
      settings: emptyPresetSettings(),
    });
    expect(
      await (await getDb())!
        .select()
        .from(tables.workspacePresets)
        .where(eq(tables.workspacePresets.userId, owners[0].id))
    ).toHaveLength(0);
  });
  it("saves, reloads and updates explicit private defaults", async () => {
    const input = command();
    const result = await api().presets.save(input);
    expect(result).toMatchObject({
      revision: 1,
      settings: input.settings,
      replayed: false,
    });
    expect(await api().presets.read(target())).toMatchObject({
      revision: 1,
      settings: input.settings,
    });
    expect(
      await api().presets.save({
        ...input,
        expectedRevision: 1,
        settings: { ...input.settings, search: "Utrecht" },
      })
    ).toMatchObject({ revision: 2 });
  });
  it("replays an exact lost-response retry without another audit", async () => {
    const input = command();
    await api().presets.save(input);
    expect(await api().presets.save(input)).toMatchObject({
      revision: 1,
      replayed: true,
    });
    const rows = await (await getDb())!
      .select()
      .from(tables.auditEvents)
      .where(eq(tables.auditEvents.userId, owners[0].id));
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows[0].metadata)).not.toContain(
      input.settings.templates[0].body
    );
  });
  it("rejects conflicting stale revisions without overwriting", async () => {
    const input = command();
    await api().presets.save(input);
    await expect(
      api().presets.save({
        ...input,
        settings: { ...input.settings, search: "Other" },
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await api().presets.read(target())).settings.search).toBe(
      "Amsterdam"
    );
  });
  it("serializes concurrent distinct saves under the owner lock", async () => {
    const input = command();
    const results = await Promise.allSettled([
      api().presets.save(input),
      api().presets.save({
        ...input,
        settings: { ...input.settings, search: "Other" },
      }),
    ]);
    expect(results.filter(item => item.status === "fulfilled")).toHaveLength(1);
    const rejection = results.find(
      item => item.status === "rejected"
    ) as PromiseRejectedResult;
    expect(rejection.reason.code).toBe("CONFLICT");
    expect((await api().presets.read(target())).revision).toBe(1);
  });
  it("never reads or writes another owner's settings", async () => {
    await api().presets.save(command());
    expect(
      (await api(1).presets.read(target(1))).settings.templates
    ).toHaveLength(0);
    await expect(api(1).presets.read(target())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(api(1).presets.save(command())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects stale verified context when the live account is unverified", async () => {
    await (await getDb())!
      .update(tables.users)
      .set({ emailVerified: 0 })
      .where(eq(tables.users.id, owners[0].id));
    await expect(api().presets.read(target())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(api().presets.save(command())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects a fenced account for reads and writes", async () => {
    await (await getDb())!
      .update(tables.users)
      .set({ deletionFencedAt: new Date() })
      .where(eq(tables.users.id, owners[0].id));
    await expect(api().presets.read(target())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(api().presets.save(command())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects a live password change despite a stale context", async () => {
    await (await getDb())!
      .update(tables.users)
      .set({ passwordHash: "changed-synthetic-hash" })
      .where(eq(tables.users.id, owners[0].id));
    await expect(api().presets.save(command())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects unauthenticated calls", async () => {
    const anonymous = criticalPathRouter.createCaller({
      user: null,
      req: {},
      res: {},
      requestId: randomUUID(),
    } as TrpcContext);
    await expect(anonymous.presets.read(target())).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("includes templates in private account export and read-only deletion review", async () => {
    const input = command();
    await api().presets.save(input);
    const exported = await exportAccountData({
      ...target(),
      userId: owners[0].id,
      credentialHash: owners[0].passwordHash,
      password,
      confirmation: true,
      requestId: randomUUID(),
    });
    const payload = JSON.parse(exported.json);
    expect(payload.data.workspacePresets).toHaveLength(1);
    expect(payload.data.workspacePresets[0].settings).toEqual(input.settings);
    const report = await inspectAccountDeletion(owners[0].id);
    expect(JSON.stringify(report)).toContain("workspacePresets");
    expect(JSON.stringify(report)).not.toContain(
      input.settings.templates[0].body
    );
  });
  it("permits reviewed removals without touching other account or outreach state", async () => {
    const input = command();
    await api().presets.save(input);
    await api().presets.save({
      ...input,
      expectedRevision: 1,
      settings: emptyPresetSettings(),
    });
    expect(
      (await api().presets.read(target())).settings.templates
    ).toHaveLength(0);
    expect((await api(1).presets.read(target(1))).revision).toBe(0);
  });
});
