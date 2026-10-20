import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { auditEvents, userProfiles, users } from "../../drizzle/schema";
import * as db from "../db";

describe("Profile Update", () => {
  let testUserId: number;

  beforeAll(async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");
    const [created] = await database
      .insert(users)
      .values({
        openId: `profile-test-${Date.now()}-${Math.random()}`,
        email: `profile-${Date.now()}@test.invalid`,
        loginMethod: "test",
        // This suite exercises verified workspace storage, not inbox acceptance.
        emailVerified: 1,
      })
      .$returningId();
    testUserId = created.id;
  });

  afterAll(async () => {
    const database = await db.getDb();
    if (!database || !testUserId) return;
    await database
      .delete(auditEvents)
      .where(eq(auditEvents.userId, testUserId));
    await database
      .delete(userProfiles)
      .where(eq(userProfiles.userId, testUserId));
    await database.delete(users).where(eq(users.id, testUserId));
  });

  it("should create or update profile with all fields", async () => {
    const profile = await db.createOrUpdateProfile(testUserId, {
      location: "San Francisco, CA",
      timezone: "PST",
      availability: "Full-time",
      skills: ["JavaScript", "React", "TypeScript"],
      experience: "experienced",
      industries: ["FinTech", "HealthTech"],
      lookingFor: ["Technical Co-Founder", "CTO"],
      startupStage: "mvp",
      commitment: "full-time",
      workStyle: ["Fast-paced", "Data-driven"],
      values: ["Innovation", "Transparency"],
      communicationStyle: "collaborative",
      remotePreference: "hybrid",
    });

    expect(profile).toBeDefined();
    expect(profile.userId).toBe(testUserId);
    expect(profile.skills).toEqual(["JavaScript", "React", "TypeScript"]);
    expect(profile.industries).toEqual(["FinTech", "HealthTech"]);
    expect(profile.workStyle).toEqual(["Fast-paced", "Data-driven"]);
    expect(profile.values).toEqual(["Innovation", "Transparency"]);
    expect(profile.experience).toBe("experienced");
    expect(profile.startupStage).toBe("mvp");
    expect(profile.communicationStyle).toBe("collaborative");
    expect(profile.remotePreference).toBe("hybrid");
  });

  it("should update only specific fields", async () => {
    const updated = await db.createOrUpdateProfile(testUserId, {
      skills: ["Python", "Machine Learning", "AI"],
      industries: ["AI/ML", "EdTech"],
    });

    expect(updated.skills).toEqual(["Python", "Machine Learning", "AI"]);
    expect(updated.industries).toEqual(["AI/ML", "EdTech"]);
  });

  it("should retrieve updated profile", async () => {
    const profile = await db.getUserProfile(testUserId);

    expect(profile).toBeDefined();
    expect(profile?.userId).toBe(testUserId);
    expect(profile?.skills).toBeDefined();
    expect(profile?.industries).toBeDefined();
  });

  it("refuses profile mutation for a currently unverified synthetic owner", async () => {
    const database = (await db.getDb())!;
    const before = await db.getUserProfile(testUserId);
    await database
      .update(users)
      .set({ emailVerified: 0 })
      .where(eq(users.id, testUserId));
    try {
      await expect(
        db.createOrUpdateProfile(testUserId, { bio: "Must not persist" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await db.getUserProfile(testUserId)).toEqual(before);
    } finally {
      await database
        .update(users)
        .set({ emailVerified: 1 })
        .where(eq(users.id, testUserId));
    }
  });
});
