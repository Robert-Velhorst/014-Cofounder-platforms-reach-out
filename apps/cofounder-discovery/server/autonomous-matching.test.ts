import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, prospects, campaigns, matches } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const testRunId = `auto-${Date.now()}`;

let testUserId: number;
let testCampaignId: number;
let testProspectId: number;

beforeAll(async () => {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      openId: `test-auto-user-${testRunId}`,
      name: "Auto Test User",
      email: `auto-${testRunId}@test.com`,
      role: "user",
    })
    .$returningId();
  testUserId = user.id;

  // Create test campaign with automation settings
  const [campaign] = await db
    .insert(campaigns)
    .values({
      userId: testUserId,
      name: `Auto Test Campaign ${testRunId}`,
      status: "active",
      automationMode: "semi_automatic",
      dailyMatchLimit: 5,
      autoMessageEnabled: false,
    })
    .$returningId();
  testCampaignId = campaign.id;

  // Create test prospect
  const [prospect] = await db
    .insert(prospects)
    .values({
      name: `Auto Test Prospect ${testRunId}`,
      title: "CTO",
      location: "San Francisco",
      skills: ["React", "Node.js", "Python"],
      industries: ["SaaS", "FinTech"],
      platform: "founder_cloud",
      profileUrl: `https://foundercloud.com/profile-${testRunId}`,
    })
    .$returningId();
  testProspectId = prospect.id;
});

afterAll(async () => {
  const db = await getDb();
  if (!db) return;

  // Clean up in order
  await db.delete(matches).where(eq(matches.userId, testUserId));
  await db.delete(campaigns).where(eq(campaigns.userId, testUserId));
  await db.delete(prospects).where(eq(prospects.id, testProspectId));
  await db.delete(users).where(eq(users.id, testUserId));
});

describe("Campaign Automation Settings", () => {
  it("should create campaign with automation mode", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const result = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, testCampaignId))
      .limit(1);

    expect(result[0]).toBeDefined();
    expect(result[0].automationMode).toBe("semi_automatic");
    expect(result[0].dailyMatchLimit).toBe(5);
    expect(result[0].autoMessageEnabled).toBe(false);
  });

  it("should update automation mode", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    await db
      .update(campaigns)
      .set({ automationMode: "fully_automatic", dailyMatchLimit: 3 })
      .where(eq(campaigns.id, testCampaignId));

    const result = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, testCampaignId))
      .limit(1);

    expect(result[0].automationMode).toBe("fully_automatic");
    expect(result[0].dailyMatchLimit).toBe(3);
  });

  it("should reset to semi_automatic for test cleanup", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    await db
      .update(campaigns)
      .set({ automationMode: "semi_automatic" })
      .where(eq(campaigns.id, testCampaignId));

    const result = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, testCampaignId))
      .limit(1);

    expect(result[0].automationMode).toBe("semi_automatic");
  });
});

describe("Match Queue & Status Tracking", () => {
  let testMatchId: number;

  it("should create a match with queued status", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const [match] = await db
      .insert(matches)
      .values({
        userId: testUserId,
        prospectId: testProspectId,
        campaignId: testCampaignId,
        overallScore: 92,
        skillsScore: 88,
        industryScore: 95,
        visionScore: 90,
        status: "queued",
        reasoning: "Strong skill complementarity in React and Node.js",
      })
      .$returningId();
    testMatchId = match.id;

    expect(match.id).toBeDefined();
  });

  it("should find queued match in approval queue", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const result = await db
      .select()
      .from(matches)
      .where(and(eq(matches.userId, testUserId), eq(matches.status, "queued")));

    expect(result.length).toBeGreaterThan(0);
    const ourMatch = result.find(m => m.id === testMatchId);
    expect(ourMatch).toBeDefined();
    expect(ourMatch?.overallScore).toBe(92);
  });

  it("should transition match from queued to approved", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    await db
      .update(matches)
      .set({ status: "approved" })
      .where(eq(matches.id, testMatchId));

    const result = await db
      .select()
      .from(matches)
      .where(eq(matches.id, testMatchId))
      .limit(1);

    expect(result[0].status).toBe("approved");
  });

  it("should transition match from approved to contacted", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    const now = new Date();
    await db
      .update(matches)
      .set({ status: "contacted", contactedAt: now })
      .where(eq(matches.id, testMatchId));

    const result = await db
      .select()
      .from(matches)
      .where(eq(matches.id, testMatchId))
      .limit(1);

    expect(result[0].status).toBe("contacted");
    expect(result[0].contactedAt).toBeDefined();
  });

  it("should transition match to responded", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    await db
      .update(matches)
      .set({ status: "responded" })
      .where(eq(matches.id, testMatchId));

    const result = await db
      .select()
      .from(matches)
      .where(eq(matches.id, testMatchId))
      .limit(1);

    expect(result[0].status).toBe("responded");
  });

  it("should reject a match", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Create a second match to reject
    const [match2] = await db
      .insert(matches)
      .values({
        userId: testUserId,
        prospectId: testProspectId,
        campaignId: testCampaignId,
        overallScore: 75,
        skillsScore: 70,
        industryScore: 80,
        visionScore: 75,
        status: "queued",
      })
      .$returningId();

    await db
      .update(matches)
      .set({ status: "rejected" })
      .where(eq(matches.id, match2.id));

    const result = await db
      .select()
      .from(matches)
      .where(eq(matches.id, match2.id))
      .limit(1);

    expect(result[0].status).toBe("rejected");

    // Cleanup
    await db.delete(matches).where(eq(matches.id, match2.id));
  });
});

describe("Greedy Score Ordering", () => {
  it("should return matches ordered by overallScore descending", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Create multiple matches with different scores
    const scores = [85, 92, 78, 95, 88];
    const matchIds: number[] = [];

    for (const score of scores) {
      const [m] = await db
        .insert(matches)
        .values({
          userId: testUserId,
          prospectId: testProspectId,
          campaignId: testCampaignId,
          overallScore: score,
          skillsScore: score,
          industryScore: score,
          visionScore: score,
          status: "discovered",
        })
        .$returningId();
      matchIds.push(m.id);
    }

    const { desc } = await import("drizzle-orm");
    const result = await db
      .select({ score: matches.overallScore })
      .from(matches)
      .where(eq(matches.userId, testUserId))
      .orderBy(desc(matches.overallScore));

    // Verify descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score!).toBeGreaterThanOrEqual(result[i].score!);
    }

    // Cleanup
    for (const id of matchIds) {
      await db.delete(matches).where(eq(matches.id, id));
    }
  });
});

describe("Platform Credential Encryption", () => {
  it("should encrypt and decrypt credentials", async () => {
    const { encrypt, decrypt } = await import("./encryption");

    const original = "my-secret-password-123";
    const encrypted = encrypt(original);

    expect(encrypted).not.toBe(original);
    // Format is base64-encoded combined buffer (salt+iv+tag+ciphertext)
    expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    expect(Buffer.from(encrypted, "base64").length).toBeGreaterThan(0);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should produce different ciphertext for same input", async () => {
    const { encrypt } = await import("./encryption");

    const password = "same-password";
    const enc1 = encrypt(password);
    const enc2 = encrypt(password);

    // Different IVs should produce different ciphertext
    expect(enc1).not.toBe(enc2);
  });
});
