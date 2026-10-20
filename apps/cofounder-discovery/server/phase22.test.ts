/**
 * Tests for Phase 22: Conversation History & Success Metrics
 * Real disposable-MySQL fixtures; disabled legacy routes are invoked directly.
 * Foreign keys alone do not enforce customer ownership.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  users,
  prospects,
  campaigns,
  conversationStartersHistory,
  successMetrics,
  type User,
} from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  saveConversationStarter,
  markStarterAsCopied,
  markStarterAsUsed,
  getConversationStartersHistory,
  getStarterEffectivenessStats,
  recordSuccessMetric,
  getSuccessMetrics,
  getSuccessMetricsStats,
} from "./db";

let fixtureOwners: User[] = [];
let fixtureProspects: number[] = [];
let fixtureCampaigns: number[] = [];
beforeEach(async () => {
  fixtureOwners = [];
  fixtureProspects = [];
  fixtureCampaigns = [];
  const db = (await getDb())!;
  if (!db) throw new Error("Disposable database required");
  for (let i = 0; i < 2; i++) {
    const [id] = await db
      .insert(users)
      .values({
        openId: `legacy-history-${randomUUID()}`,
        emailVerified: 1,
      })
      .$returningId();
    const [owner] = await db.select().from(users).where(eq(users.id, id.id));
    fixtureOwners.push(owner);
    const [prospect] = await db
      .insert(prospects)
      .values({
        userId: owner.id,
        name: "Synthetic legacy contact",
        platform: "manual",
      })
      .$returningId();
    fixtureProspects.push(prospect.id);
    const [campaign] = await db
      .insert(campaigns)
      .values({
        userId: owner.id,
        name: "Synthetic disabled legacy campaign",
        automationMode: "manual",
        autoMessageEnabled: false,
      })
      .$returningId();
    fixtureCampaigns.push(campaign.id);
  }
});
afterEach(async () => {
  const db = (await getDb())!;
  for (const owner of fixtureOwners) {
    await db.delete(successMetrics).where(eq(successMetrics.userId, owner.id));
    await db
      .delete(conversationStartersHistory)
      .where(eq(conversationStartersHistory.userId, owner.id));
  }
  for (const owner of fixtureOwners) {
    await db.delete(campaigns).where(eq(campaigns.userId, owner.id));
    await db.delete(prospects).where(eq(prospects.userId, owner.id));
    await db.delete(users).where(eq(users.id, owner.id));
  }
});
const legacyCaller = (i: number) =>
  appRouter.createCaller({
    user: fixtureOwners[i],
    requestId: randomUUID(),
    req: {},
    res: {},
  } as TrpcContext);

describe("Legacy starter ownership boundary", () => {
  it("returns a sanitized storage failure and preserves retained data", async () => {
    const db = (await getDb())!;
    const held = `legacy_metrics_unavailable_${randomUUID().replaceAll("-", "")}`;
    await db.execute(sql.raw(`RENAME TABLE success_metrics TO ${held}`));
    try {
      await expect(
        recordSuccessMetric({
          userId: fixtureOwners[0].id,
          prospectId: fixtureProspects[0],
          metricType: "message_sent",
          notes: "Synthetic private note must not leak",
        })
      ).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        message: "Legacy history storage is temporarily unavailable.",
      });
    } finally {
      await db.execute(sql.raw(`RENAME TABLE ${held} TO success_metrics`));
    }
    expect(await getSuccessMetrics(fixtureOwners[0].id)).toEqual([]);
    expect(
      await recordSuccessMetric({
        userId: fixtureOwners[0].id,
        prospectId: fixtureProspects[0],
        metricType: "message_sent",
      })
    ).toBeGreaterThan(0);
  });

  it("refuses foreign links during starter and metric creation without adding rows", async () => {
    await expect(
      saveConversationStarter({
        userId: fixtureOwners[0].id,
        prospectId: fixtureProspects[1],
        message: "Must not save",
        tone: "professional",
        focusArea: "skills",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    for (const links of [
      { prospectId: fixtureProspects[1] },
      { campaignId: fixtureCampaigns[1] },
      { prospectId: fixtureProspects[0], campaignId: fixtureCampaigns[1] },
    ])
      await expect(
        recordSuccessMetric({
          userId: fixtureOwners[0].id,
          ...links,
          metricType: "message_sent",
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await getConversationStartersHistory(fixtureOwners[0].id)).toEqual(
      []
    );
    expect(await getSuccessMetrics(fixtureOwners[0].id)).toEqual([]);
  });

  it("refuses another owner's used update and preserves timestamps on concurrent retries", async () => {
    const starterId = await saveConversationStarter({
      userId: fixtureOwners[0].id,
      prospectId: fixtureProspects[0],
      message: "Synthetic original",
      tone: "professional",
      focusArea: "skills",
    });
    await expect(
      legacyCaller(1).conversationStarters.markUsed({ starterId })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await Promise.all([
      markStarterAsCopied(starterId, fixtureOwners[0].id),
      markStarterAsCopied(starterId, fixtureOwners[0].id),
      markStarterAsUsed(starterId, fixtureOwners[0].id),
    ]);
    const [saved] = await getConversationStartersHistory(fixtureOwners[0].id);
    expect(saved).toMatchObject({ wasCopied: 1, wasUsed: 1 });
    // MySQL timestamps have second precision; immediate rewrites could otherwise
    // look unchanged. Seed retained historical timestamps to make retry proof
    // independent of scheduling or waiting for the next clock tick.
    await (await getDb())!
      .update(conversationStartersHistory)
      .set({
        copiedAt: new Date("2020-01-01T12:00:00Z"),
        usedAt: new Date("2020-01-02T12:00:00Z"),
      })
      .where(eq(conversationStartersHistory.id, starterId));
    const [preserved] = await getConversationStartersHistory(
      fixtureOwners[0].id
    );
    await markStarterAsCopied(starterId, fixtureOwners[0].id);
    await markStarterAsUsed(starterId, fixtureOwners[0].id);
    const [retried] = await getConversationStartersHistory(fixtureOwners[0].id);
    expect(retried.copiedAt).toEqual(preserved.copiedAt);
    expect(retried.usedAt).toEqual(preserved.usedAt);
    expect(await getConversationStartersHistory(fixtureOwners[1].id)).toEqual(
      []
    );
  });

  it.each(["unverified", "fenced"] as const)(
    "checks live account suspension: %s",
    async state => {
      const starterId = await saveConversationStarter({
        userId: fixtureOwners[0].id,
        prospectId: fixtureProspects[0],
        message: "Synthetic retained",
        tone: "professional",
        focusArea: "skills",
      });
      await (await getDb())!
        .update(users)
        .set(
          state === "unverified"
            ? { emailVerified: 0 }
            : { deletionFencedAt: new Date() }
        )
        .where(eq(users.id, fixtureOwners[0].id));
      for (const write of [
        () => legacyCaller(0).conversationStarters.markCopied({ starterId }),
        () => legacyCaller(0).conversationStarters.markUsed({ starterId }),
        () =>
          legacyCaller(0).conversationStarters.saveStarter({
            prospectId: fixtureProspects[0],
            message: "Denied",
            tone: "friendly",
            focusArea: "skills",
          }),
        () =>
          legacyCaller(0).successMetrics.record({ metricType: "message_sent" }),
      ])
        await expect(write()).rejects.toMatchObject({ code: "FORBIDDEN" });
      const [saved] = await getConversationStartersHistory(fixtureOwners[0].id);
      expect(saved).toMatchObject({ wasCopied: 0, wasUsed: 0 });
      expect(
        await getConversationStartersHistory(fixtureOwners[0].id)
      ).toHaveLength(1);
      expect(await getSuccessMetrics(fixtureOwners[0].id)).toEqual([]);
    }
  );

  it("refuses mutation of a historical wrong-owner prospect link", async () => {
    const [id] = await (await getDb())!
      .insert(conversationStartersHistory)
      .values({
        userId: fixtureOwners[0].id,
        prospectId: fixtureProspects[1],
        message: "Synthetic historical mis-link",
        tone: "professional",
        focusArea: "skills",
      })
      .$returningId();
    await expect(
      markStarterAsUsed(id.id, fixtureOwners[0].id)
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const [saved] = await getConversationStartersHistory(fixtureOwners[0].id);
    expect(saved.wasUsed).toBe(0);
  });

  it("refuses another owner's copied update through the actual router", async () => {
    const starterId = await saveConversationStarter({
      userId: fixtureOwners[0].id,
      prospectId: fixtureProspects[0],
      message: "Synthetic owned original",
      tone: "professional",
      focusArea: "skills",
    });
    await expect(
      legacyCaller(1).conversationStarters.markCopied({ starterId })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const [saved] = await (await getDb())!
      .select()
      .from(conversationStartersHistory)
      .where(eq(conversationStartersHistory.id, starterId));
    expect(saved.wasCopied).toBe(0);
  });
});

describe("Conversation History Tracking", () => {
  let testUserId: number;
  let testProspectId: number;
  let testStarterId: number;

  beforeEach(() => {
    testUserId = fixtureOwners[0].id;
    testProspectId = fixtureProspects[0];
  });

  it("should save conversation starter", async () => {
    const starterId = await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Hi! I noticed your work in AI and would love to connect.",
      tone: "professional",
      focusArea: "skills",
      reasoning: "Shared interest in AI technology",
      compatibilityScore: 85,
      enrichmentScore: 75,
    });

    expect(starterId).toBeGreaterThan(0);
    testStarterId = starterId;
  });

  it("should mark starter as copied", async () => {
    const starterId = await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Test message",
      tone: "friendly",
      focusArea: "industry",
    });

    await markStarterAsCopied(starterId, testUserId);

    const history = await getConversationStartersHistory(testUserId, 1);
    expect(history[0].wasCopied).toBe(1);
    expect(history[0].copiedAt).toBeDefined();
  });

  it("should mark starter as used", async () => {
    const starterId = await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Test message",
      tone: "enthusiastic",
      focusArea: "project",
    });

    await markStarterAsUsed(starterId, testUserId);

    const history = await getConversationStartersHistory(testUserId, 1);
    expect(history[0].wasUsed).toBe(1);
    expect(history[0].usedAt).toBeDefined();
  });

  it("should retrieve conversation history", async () => {
    // Save multiple starters
    await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Message 1",
      tone: "professional",
      focusArea: "skills",
    });

    await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Message 2",
      tone: "friendly",
      focusArea: "industry",
    });

    const history = await getConversationStartersHistory(testUserId, 10);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].message).toBeDefined();
  });

  it("should calculate effectiveness stats", async () => {
    // Create starters with different outcomes
    const starter1 = await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Message 1",
      tone: "professional",
      focusArea: "skills",
    });
    await markStarterAsCopied(starter1, testUserId);
    await markStarterAsUsed(starter1, testUserId);

    const starter2 = await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Message 2",
      tone: "friendly",
      focusArea: "industry",
    });
    await markStarterAsCopied(starter2, testUserId);

    const starter3 = await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Message 3",
      tone: "enthusiastic",
      focusArea: "project",
    });

    const stats = await getStarterEffectivenessStats(testUserId);

    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.copied).toBeGreaterThanOrEqual(2);
    expect(stats.used).toBeGreaterThanOrEqual(1);
    expect(stats.copyRate).toBeGreaterThan(0);
    expect(stats.useRate).toBeGreaterThan(0);
    expect(stats.byTone).toBeDefined();
    expect(stats.byFocusArea).toBeDefined();
  });

  it("should group stats by tone", async () => {
    await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Professional message",
      tone: "professional",
      focusArea: "skills",
    });

    await saveConversationStarter({
      userId: testUserId,
      prospectId: testProspectId,
      message: "Friendly message",
      tone: "friendly",
      focusArea: "industry",
    });

    const stats = await getStarterEffectivenessStats(testUserId);

    expect(stats.byTone["professional"]).toBeDefined();
    expect(stats.byTone["friendly"]).toBeDefined();
    expect(stats.byTone["professional"].total).toBeGreaterThan(0);
    expect(stats.byTone["friendly"].total).toBeGreaterThan(0);
  });
});

describe("Success Metrics Tracking", () => {
  let testUserId: number;
  let testProspectId: number;
  let testCampaignId: number;

  beforeEach(() => {
    testUserId = fixtureOwners[0].id;
    testProspectId = fixtureProspects[0];
    testCampaignId = fixtureCampaigns[0];
  });

  it("should record message sent metric", async () => {
    const metricId = await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      campaignId: testCampaignId,
      metricType: "message_sent",
      notes: "Initial outreach message",
    });

    expect(metricId).toBeGreaterThan(0);
  });

  it("should record message responded metric", async () => {
    const metricId = await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "message_responded",
      notes: "Prospect replied positively",
    });

    expect(metricId).toBeGreaterThan(0);
  });

  it("should record meeting scheduled metric", async () => {
    const metricId = await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "meeting_scheduled",
      notes: "Coffee meeting scheduled for next week",
    });

    expect(metricId).toBeGreaterThan(0);
  });

  it("should record partnership formed metric", async () => {
    const metricId = await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "partnership_formed",
      notes: "Agreed to co-found startup together",
      value: 1,
    });

    expect(metricId).toBeGreaterThan(0);
  });

  it("should retrieve success metrics", async () => {
    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "message_sent",
    });

    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "message_responded",
    });

    const metrics = await getSuccessMetrics(testUserId);
    expect(metrics.length).toBeGreaterThanOrEqual(2);
  });

  it("should filter metrics by type", async () => {
    await recordSuccessMetric({
      userId: testUserId,
      metricType: "meeting_scheduled",
    });

    const metrics = await getSuccessMetrics(testUserId, {
      metricType: "meeting_scheduled",
    });

    expect(metrics.length).toBeGreaterThanOrEqual(1);
    expect(metrics[0].metricType).toBe("meeting_scheduled");
  });

  it("should calculate success metrics stats", async () => {
    // Create a full funnel
    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "message_sent",
    });

    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "message_responded",
    });

    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "meeting_scheduled",
    });

    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "meeting_completed",
    });

    await recordSuccessMetric({
      userId: testUserId,
      prospectId: testProspectId,
      metricType: "partnership_formed",
    });

    const stats = await getSuccessMetricsStats(testUserId);

    expect(stats.messagesSent).toBeGreaterThanOrEqual(1);
    expect(stats.messagesResponded).toBeGreaterThanOrEqual(1);
    expect(stats.meetingsScheduled).toBeGreaterThanOrEqual(1);
    expect(stats.meetingsCompleted).toBeGreaterThanOrEqual(1);
    expect(stats.partnershipsFormed).toBeGreaterThanOrEqual(1);
    expect(stats.responseRate).toBeGreaterThan(0);
    expect(stats.meetingConversionRate).toBeGreaterThan(0);
    expect(stats.partnershipSuccessRate).toBeGreaterThan(0);
  });

  it("should handle zero division in stats", async () => {
    const stats = await getSuccessMetricsStats(fixtureOwners[1].id); // Owned empty fixture

    expect(stats.messagesSent).toBe(0);
    expect(stats.responseRate).toBe(0);
    expect(stats.meetingConversionRate).toBe(0);
    expect(stats.partnershipSuccessRate).toBe(0);
  });

  it("should calculate response rate correctly", async () => {
    const newUserId = fixtureOwners[1].id;

    // 10 messages sent, 3 responded
    for (let i = 0; i < 10; i++) {
      await recordSuccessMetric({
        userId: newUserId,
        metricType: "message_sent",
      });
    }

    for (let i = 0; i < 3; i++) {
      await recordSuccessMetric({
        userId: newUserId,
        metricType: "message_responded",
      });
    }

    const stats = await getSuccessMetricsStats(newUserId);

    expect(stats.messagesSent).toBe(10);
    expect(stats.messagesResponded).toBe(3);
    expect(stats.responseRate).toBe(30);
  });
});

describe("Integration: Conversation History + Success Metrics", () => {
  it("should track complete user journey", async () => {
    const userId = fixtureOwners[0].id;
    const prospectId = fixtureProspects[0];

    // 1. Generate conversation starter
    const starterId = await saveConversationStarter({
      userId,
      prospectId,
      message: "Hi! Love your work in FinTech.",
      tone: "professional",
      focusArea: "industry",
      compatibilityScore: 88,
    });

    // 2. User copies the starter
    await markStarterAsCopied(starterId, userId);

    // 3. User sends message
    await recordSuccessMetric({
      userId,
      prospectId,
      metricType: "message_sent",
    });

    // 4. User marks starter as used
    await markStarterAsUsed(starterId, userId);

    // 5. Prospect responds
    await recordSuccessMetric({
      userId,
      prospectId,
      metricType: "message_responded",
    });

    // 6. Meeting scheduled
    await recordSuccessMetric({
      userId,
      prospectId,
      metricType: "meeting_scheduled",
    });

    // 7. Meeting completed
    await recordSuccessMetric({
      userId,
      prospectId,
      metricType: "meeting_completed",
    });

    // 8. Partnership formed
    await recordSuccessMetric({
      userId,
      prospectId,
      metricType: "partnership_formed",
    });

    // Verify conversation history
    const history = await getConversationStartersHistory(userId, 10);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].wasCopied).toBe(1);
    expect(history[0].wasUsed).toBe(1);

    // Verify success metrics
    const stats = await getSuccessMetricsStats(userId);
    expect(stats.messagesSent).toBeGreaterThanOrEqual(1);
    expect(stats.messagesResponded).toBeGreaterThanOrEqual(1);
    expect(stats.meetingsScheduled).toBeGreaterThanOrEqual(1);
    expect(stats.partnershipsFormed).toBeGreaterThanOrEqual(1);
    expect(stats.responseRate).toBe(100); // 1/1 = 100%
  });
});
