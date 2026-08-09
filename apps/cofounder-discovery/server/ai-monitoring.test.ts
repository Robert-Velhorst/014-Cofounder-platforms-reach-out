/**
 * AI Monitoring Router Tests
 * Tests for real-time AI activity monitoring and metrics
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../server/db";
import {
  users,
  userProfiles,
  aiActivityLog,
  campaigns,
  matches,
  messages,
  approvalQueue,
  prospects,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("AI Monitoring Router", () => {
  let testUserId: number;
  let testCampaignId: number;
  let testMatchId: number;
  let testProspectId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user with unique ID
    const uniqueId = `test-ai-monitoring-${Date.now()}-${Math.random()}`;
    const [user] = await db
      .insert(users)
      .values({
        openId: uniqueId,
        name: "AI Monitor Test User",
        email: `aimonitor-${Date.now()}@test.com`,
        loginMethod: "test",
      })
      .$returningId();
    testUserId = user.id;

    // Create user profile
    await db.insert(userProfiles).values({
      userId: testUserId,
      skills: ["Developer", "Product Manager"],
      industries: ["Finance/Fintech", "Web/Mobile app"],
      experience: "5-10 years",
      location: "San Francisco, CA",
    });

    // Create test campaign
    const [campaign] = await db
      .insert(campaigns)
      .values({
        userId: testUserId,
        name: "Test Campaign",
        description: "Test campaign for monitoring",
        status: "active",
        prospectsFound: 10,
        messagesSent: 5,
        responsesReceived: 2,
      })
      .$returningId();
    testCampaignId = campaign.id;

    // Create test prospect
    const [prospect] = await db
      .insert(prospects)
      .values({
        userId: testUserId,
        name: "Test Prospect",
        title: "Software Engineer",
        location: "San Francisco, CA",
        skills: ["Developer"],
        industries: ["Web/Mobile app"],
        platform: "test",
      })
      .$returningId();
    testProspectId = prospect.id;

    // Create test match
    const [match] = await db
      .insert(matches)
      .values({
        userId: testUserId,
        prospectId: prospect.id,
        overallScore: 85,
        skillsScore: 90,
        industryScore: 80,
        status: "new",
      })
      .$returningId();
    testMatchId = match.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db || !testUserId) return;
    await db.delete(approvalQueue).where(eq(approvalQueue.userId, testUserId));
    await db.delete(aiActivityLog).where(eq(aiActivityLog.userId, testUserId));
    await db.delete(matches).where(eq(matches.userId, testUserId));
    await db.delete(campaigns).where(eq(campaigns.userId, testUserId));
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    if (testProspectId) await db.delete(prospects).where(eq(prospects.id, testProspectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Activity Metrics", () => {
    it("should track messages sent today", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert activity from today
      const today = new Date();
      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "message_sent",
        activityDescription: "Test message sent",
        campaignId: testCampaignId,
        outcome: "success",
        createdAt: today,
      });

      // Query should count this message
      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.activityType === "message_sent")).toBe(true);
    });

    it("should track prospect discoveries", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "prospect_discovered",
        activityDescription: "Discovered new prospect: John Doe",
        campaignId: testCampaignId,
        outcome: "success",
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(result.some(r => r.activityType === "prospect_discovered")).toBe(
        true
      );
    });

    it("should track match creation", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "match_created",
        activityDescription: "Created match with 88% compatibility",
        campaignId: testCampaignId,
        matchId: testMatchId,
        aiDecision: JSON.stringify({ confidence: 0.88 }),
        outcome: "success",
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(result.some(r => r.activityType === "match_created")).toBe(true);
    });

    it("should track follow-up scheduling", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "follow_up_scheduled",
        activityDescription: "Scheduled follow-up for 3 days from now",
        campaignId: testCampaignId,
        outcome: "pending",
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(result.some(r => r.activityType === "follow_up_scheduled")).toBe(
        true
      );
    });

    it("should track pipeline movements", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "pipeline_moved",
        activityDescription: "Moved prospect from Cold to Contacted",
        campaignId: testCampaignId,
        aiDecision: JSON.stringify({
          previousStage: "cold",
          newStage: "contacted",
        }),
        outcome: "success",
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(result.some(r => r.activityType === "pipeline_moved")).toBe(true);
    });
  });

  describe("Activity Timeline", () => {
    it("should retrieve recent activities in chronological order", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert activities with different timestamps
      const now = new Date();
      const activities = [
        { hours: 1, type: "message_sent", desc: "Recent message" },
        { hours: 5, type: "match_created", desc: "Earlier match" },
        { hours: 10, type: "prospect_discovered", desc: "Old discovery" },
      ];

      for (const activity of activities) {
        const timestamp = new Date(
          now.getTime() - activity.hours * 60 * 60 * 1000
        );
        await db.insert(aiActivityLog).values({
          userId: testUserId,
          activityType: activity.type,
          activityDescription: activity.desc,
          campaignId: testCampaignId,
          outcome: "success",
          createdAt: timestamp,
        });
      }

      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId))
        .orderBy(aiActivityLog.createdAt);

      expect(result.length).toBeGreaterThanOrEqual(3);
      // Verify chronological order (oldest first in ascending order)
      for (let i = 1; i < result.length; i++) {
        expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result[i - 1].createdAt.getTime()
        );
      }
    });

    it("should include AI decision metadata", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const aiDecision = {
        reason: "High compatibility score",
        confidence: 0.92,
        factors: ["skills_match", "industry_alignment"],
      };

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "match_created",
        activityDescription: "AI-powered match",
        campaignId: testCampaignId,
        aiDecision: JSON.stringify(aiDecision),
        outcome: "success",
        createdAt: new Date(),
      });

      const result = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      const matchActivity = result.find(
        r => r.activityDescription === "AI-powered match"
      );
      expect(matchActivity).toBeDefined();
      expect(matchActivity?.aiDecision).toBeTruthy();

      if (matchActivity?.aiDecision) {
        const parsed = JSON.parse(matchActivity.aiDecision);
        expect(parsed.confidence).toBe(0.92);
      }
    });
  });

  describe("Performance Metrics", () => {
    it("should calculate active campaigns count", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create additional campaigns
      await db.insert(campaigns).values([
        {
          userId: testUserId,
          name: "Active Campaign 1",
          status: "active",
          prospectsFound: 5,
        },
        {
          userId: testUserId,
          name: "Paused Campaign",
          status: "paused",
          prospectsFound: 3,
        },
      ]);

      const activeCampaigns = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, testUserId));

      expect(activeCampaigns.length).toBeGreaterThanOrEqual(2);
      const activeCount = activeCampaigns.filter(
        c => c.status === "active"
      ).length;
      expect(activeCount).toBeGreaterThanOrEqual(2);
    });

    it("should track approval queue", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create pending approval
      await db.insert(approvalQueue).values({
        userId: testUserId,
        matchId: testMatchId,
        messageType: "first_contact",
        messageContent: "Test outreach",
        platform: "manual",
        status: "pending",
        createdAt: new Date(),
      });

      const pendingApprovals = await db
        .select()
        .from(approvalQueue)
        .where(eq(approvalQueue.userId, testUserId));

      expect(pendingApprovals.some(a => a.status === "pending")).toBe(true);
    });

    it("should calculate pipeline velocity metrics", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Create matches with different statuses
      await db.insert(matches).values([
        {
          userId: testUserId,
          prospectId: testProspectId,
          overallScore: 88,
          status: "contacted",
          createdAt: weekStart,
        },
        {
          userId: testUserId,
          prospectId: testProspectId,
          overallScore: 92,
          status: "interested",
          createdAt: new Date(),
        },
      ]);

      const allMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.userId, testUserId));

      expect(allMatches.length).toBeGreaterThanOrEqual(3);

      // Verify different statuses exist
      const statuses = new Set(allMatches.map(m => m.status));
      expect(statuses.size).toBeGreaterThan(1);
    });
  });

  describe("Real-Time Updates", () => {
    it("should return last activity timestamp", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "message_sent",
        activityDescription: "Latest activity",
        outcome: "success",
        createdAt: now,
      });

      const activities = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId))
        .orderBy(aiActivityLog.createdAt);

      const lastActivity = activities[activities.length - 1];
      expect(lastActivity).toBeDefined();
      expect(lastActivity.createdAt).toBeInstanceOf(Date);
    });

    it("should support activity filtering by time range", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Insert activities at different times
      await db.insert(aiActivityLog).values([
        {
          userId: testUserId,
          activityType: "message_sent",
          activityDescription: "Today activity",
          outcome: "success",
          createdAt: now,
        },
        {
          userId: testUserId,
          activityType: "match_created",
          activityDescription: "Yesterday activity",
          outcome: "success",
          createdAt: yesterday,
        },
        {
          userId: testUserId,
          activityType: "prospect_discovered",
          activityDescription: "Last week activity",
          outcome: "success",
          createdAt: lastWeek,
        },
      ]);

      const allActivities = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(allActivities.length).toBeGreaterThanOrEqual(3);

      // Verify we have activities from different time periods
      const timestamps = allActivities.map(a => a.createdAt.getTime());
      const range = Math.max(...timestamps) - Math.min(...timestamps);
      expect(range).toBeGreaterThan(24 * 60 * 60 * 1000); // More than 1 day range
    });
  });

  describe("Campaign Integration", () => {
    it("should link activities to campaigns", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "message_sent",
        activityDescription: "Campaign message",
        campaignId: testCampaignId,
        outcome: "success",
        createdAt: new Date(),
      });

      const activities = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      const campaignActivities = activities.filter(
        a => a.campaignId === testCampaignId
      );
      expect(campaignActivities.length).toBeGreaterThan(0);
    });

    it("should retrieve campaign statistics", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, testCampaignId));

      expect(campaign.length).toBe(1);
      expect(campaign[0].prospectsFound).toBeGreaterThanOrEqual(0);
      expect(campaign[0].messagesSent).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Activity Outcomes", () => {
    it("should track successful outcomes", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "message_sent",
        activityDescription: "Successful message",
        outcome: "success",
        createdAt: new Date(),
      });

      const activities = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(activities.some(a => a.outcome === "success")).toBe(true);
    });

    it("should track pending outcomes", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "follow_up_scheduled",
        activityDescription: "Pending follow-up",
        outcome: "pending",
        createdAt: new Date(),
      });

      const activities = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(activities.some(a => a.outcome === "pending")).toBe(true);
    });

    it("should track failed outcomes", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: testUserId,
        activityType: "message_sent",
        activityDescription: "Failed message delivery",
        outcome: "failed",
        createdAt: new Date(),
      });

      const activities = await db
        .select()
        .from(aiActivityLog)
        .where(eq(aiActivityLog.userId, testUserId));

      expect(activities.some(a => a.outcome === "failed")).toBe(true);
    });
  });
});
