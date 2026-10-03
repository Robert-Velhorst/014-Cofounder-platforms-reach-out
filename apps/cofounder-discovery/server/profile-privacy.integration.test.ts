import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { auditEvents, userProfiles, users, type User } from "../drizzle/schema";
import * as data from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

let owners: User[] = [];
const caller = (index = 0, requestId = randomUUID()) =>
  appRouter.createCaller({
    user: owners[index],
    requestId,
    req: {},
    res: {},
  } as TrpcContext);
async function rows(index = 0) {
  const db = (await data.getDb())!;
  return db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, owners[index].id));
}
describe("private account-scoped profiles with MySQL", () => {
  beforeEach(async () => {
    owners = [];
    const db = (await data.getDb())!;
    for (let i = 0; i < 2; i++) {
      const [created] = await db
        .insert(users)
        .values({ openId: `profile-privacy-${randomUUID()}`, emailVerified: 1 })
        .$returningId();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));
      owners.push(owner);
    }
  });
  afterEach(async () => {
    const db = (await data.getDb())!;
    for (const owner of owners) {
      await db.delete(auditEvents).where(eq(auditEvents.userId, owner.id));
      await db.delete(userProfiles).where(eq(userProfiles.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
  });
  it("creates a private profile and derives completeness instead of trusting the client", async () => {
    const result = await caller().profile.create({
      location: " Amsterdam ",
      completeness: 100,
    });
    expect(result).toMatchObject({
      userId: owners[0].id,
      location: "Amsterdam",
      isPublic: false,
      completeness: 13,
    });
  });
  it("uses a private database default even for an insert that omits visibility", async () => {
    const db = (await data.getDb())!;
    await db.insert(userProfiles).values({ userId: owners[0].id });
    expect((await rows())[0].isPublic).toBe(false);
  });
  it.each([
    { isPublic: true },
    { location: "x".repeat(256) },
    { availability: "x".repeat(51) },
    { skills: Array.from({ length: 51 }, (_, i) => `Skill ${i}`) },
    { skills: ["x".repeat(121)] },
    { skills: ["   "] },
    { completeness: -1 },
    { completeness: 4.5 },
    { userId: 123, location: "Injected" },
  ])(
    "rejects invalid or unsafe public profile input %j before persistence",
    async input => {
      await expect(caller().profile.create(input as any)).rejects.toMatchObject(
        { code: "BAD_REQUEST" }
      );
      expect(await rows()).toHaveLength(0);
    }
  );
  it("requires verified email for profile access", async () => {
    owners[0] = { ...owners[0], emailVerified: 0 };
    await expect(caller().profile.get()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller().profile.create({ location: "Amsterdam" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("binds an explicitly account-keyed read to the authenticated owner even for a missing profile", async () => {
    await expect(
      caller().profile.get({ accountId: owners[1].id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await caller().profile.get({ accountId: owners[0].id })).toBeNull();
  });
  it.each(["create", "update"] as const)(
    "rejects a stale editor's %s after the cookie account changes",
    async method => {
      await expect(
        caller(1).profile[method]({
          accountId: owners[0].id,
          location: "Account A's edit",
        } as any)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await rows(1)).toHaveLength(0);
      expect(
        await caller(1).profile[method]({
          accountId: owners[1].id,
          location: "Account B's edit",
        } as any)
      ).toMatchObject({ location: "Account B's edit", userId: owners[1].id });
    }
  );
  it("preserves omitted fields and isolates updates from other customers", async () => {
    await caller().profile.create({
      location: "Amsterdam",
      skills: ["TypeScript"],
    });
    await caller(1).profile.create({ location: "Berlin" });
    const updated = await caller().profile.update({
      skills: [" Rust ", "rust", "RUST"],
    });
    expect(updated).toMatchObject({
      location: "Amsterdam",
      skills: ["Rust"],
      completeness: 25,
    });
    expect((await caller(1).profile.get())?.location).toBe("Berlin");
  });
  it("keeps a single profile across concurrent initial writes and retains both patches", async () => {
    const results = await Promise.all([
      caller().profile.create({ location: "Amsterdam" }),
      caller().profile.update({ skills: ["Rust"] }),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(await rows()).toHaveLength(1);
    expect(await caller().profile.get()).toMatchObject({
      location: "Amsterdam",
      skills: ["Rust"],
      completeness: 25,
    });
  });
  it("reads and updates only the latest legacy duplicate without destroying the other row", async () => {
    const db = (await data.getDb())!;
    const [older] = await db
      .insert(userProfiles)
      .values({
        userId: owners[0].id,
        location: "Historic",
        skills: ["Keep"],
        isPublic: true,
      })
      .$returningId();
    const [latest] = await db
      .insert(userProfiles)
      .values({ userId: owners[0].id, location: "Current" })
      .$returningId();
    expect((await caller().profile.get())?.id).toBe(latest.id);
    expect((await caller().profile.update({ skills: ["Rust"] })).id).toBe(
      latest.id
    );
    expect((await rows()).find(item => item.id === older.id)).toMatchObject({
      location: "Historic",
      skills: ["Keep"],
      isPublic: true,
    });
  });
  it("rolls back a profile write if its audit cannot be stored", async () => {
    await expect(
      caller(0, "x".repeat(65)).profile.create({ location: "Amsterdam" })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(await rows()).toHaveLength(0);
  });
  it("does not persist profile field values in the success audit", async () => {
    await caller().profile.create({
      location: "Private city",
      bio: "Private biography",
    } as any);
    const db = (await data.getDb())!;
    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, owners[0].id));
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("profile.save");
    expect(JSON.stringify(events)).not.toContain("Private city");
    expect(JSON.stringify(events)).not.toContain("Private biography");
  });
  it("applies the real default migration without rewriting existing visibility or duplicate rows", async () => {
    const db = (await data.getDb())!;
    const migration = await readFile(
      new URL("../drizzle/0026_private_profile_default.sql", import.meta.url),
      "utf8"
    );
    await db.execute(
      sql.raw(
        "ALTER TABLE user_profiles ALTER COLUMN is_public SET DEFAULT true"
      )
    );
    try {
      const [legacy] = await db
        .insert(userProfiles)
        .values({ userId: owners[0].id, location: "Preserved" })
        .$returningId();
      await db.execute(sql.raw(migration));
      await db
        .insert(userProfiles)
        .values({ userId: owners[0].id, location: "New" });
      const saved = await rows();
      expect(saved).toHaveLength(2);
      expect(saved.find(item => item.id === legacy.id)).toMatchObject({
        location: "Preserved",
        isPublic: true,
      });
      expect(saved.find(item => item.id !== legacy.id)).toMatchObject({
        location: "New",
        isPublic: false,
      });
    } finally {
      await db.execute(sql.raw(migration));
    }
  });
  it.each(["createOrUpdateProfile", "updateUserProfile"] as const)(
    "prevents metadata reassignment through the internal %s helper",
    async helper => {
      await data[helper](owners[0].id, {
        userId: owners[1].id,
        location: "Owned",
        skills: [" Rust ", "rust"],
      });
      expect(await rows(1)).toHaveLength(0);
      expect((await rows())[0]).toMatchObject({
        userId: owners[0].id,
        location: "Owned",
        skills: ["Rust"],
        isPublic: false,
      });
    }
  );
});
