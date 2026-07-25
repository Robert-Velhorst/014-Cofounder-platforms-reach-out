/**
 * AI Monitoring Router
 * Real-time monitoring of AI automation activity
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  aiActivityLog,
  campaigns,
  matches,
  messages,
  approvalQueue,
  pipelineStages,
} from "../drizzle/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";

export const aiMonitoringRouter = router({
  /**
   * Get real-time activity metrics
   */
  getActivityMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const hourStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Messages sent today
    const messagesToday = await db
      .select({ count: count() })
      .from(aiActivityLog)
      .where(
        and(
          eq(aiActivityLog.userId, ctx.user.id),
          eq(aiActivityLog.activityType, "message_sent"),
          gte(aiActivityLog.createdAt, todayStart)
        )
      );

    // Messages sent this hour
    const messagesThisHour = await db
      .select({ count: count() })
      .from(aiActivityLog)
      .where(
        and(
          eq(aiActivityLog.userId, ctx.user.id),
          eq(aiActivityLog.activityType, "message_sent"),
          gte(aiActivityLog.createdAt, hourStart)
        )
      );

    // Pending approvals
    const pendingApprovals = await db
      .select({ count: count() })
      .from(approvalQueue)
      .where(
        and(
          eq(approvalQueue.userId, ctx.user.id),
          eq(approvalQueue.status, "pending")
        )
      );

    // Matches this week
    const matchesThisWeek = await db
      .select({ count: count() })
      .from(matches)
      .where(
        and(eq(matches.userId, ctx.user.id), gte(matches.createdAt, weekStart))
      );

    // Average compatibility of recent matches
    const avgCompatibility = await db
      .select({ avg: sql<number>`AVG(${matches.overallScore})` })
      .from(matches)
      .where(
        and(eq(matches.userId, ctx.user.id), gte(matches.createdAt, weekStart))
      );

    // Active campaigns
    const activeCampaigns = await db
      .select({ count: count() })
      .from(campaigns)
      .where(
        and(eq(campaigns.userId, ctx.user.id), eq(campaigns.status, "active"))
      );

    // Last activity time
    const lastActivity = await db
      .select({ timestamp: aiActivityLog.createdAt })
      .from(aiActivityLog)
      .where(eq(aiActivityLog.userId, ctx.user.id))
      .orderBy(desc(aiActivityLog.createdAt))
      .limit(1);

    return {
      messagesToday: messagesToday[0]?.count || 0,
      messagesThisHour: messagesThisHour[0]?.count || 0,
      pendingApprovals: pendingApprovals[0]?.count || 0,
      matchesThisWeek: matchesThisWeek[0]?.count || 0,
      avgCompatibility: Math.round(avgCompatibility[0]?.avg || 0),
      activeCampaigns: activeCampaigns[0]?.count || 0,
      lastActivityTime: lastActivity[0]?.timestamp || null,
    };
  }),

  /**
   * Get recent AI activity with optional filters
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        campaignId: z.number().optional(),
        dateRange: z
          .enum(["today", "week", "month", "all"])
          .optional()
          .default("all"),
        actionTypes: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build filter conditions
      const conditions = [eq(aiActivityLog.userId, ctx.user.id)];

      // Campaign filter
      if (input.campaignId) {
        conditions.push(eq(aiActivityLog.campaignId, input.campaignId));
      }

      // Date range filter
      if (input.dateRange !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (input.dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        conditions.push(gte(aiActivityLog.createdAt, startDate));
      }

      // Fetch activities
      let query = db
        .select()
        .from(aiActivityLog)
        .where(and(...conditions))
        .orderBy(desc(aiActivityLog.createdAt))
        .limit(input.limit);

      const activities = await query;

      // Filter by action types (client-side for simplicity with enum values)
      let filteredActivities = activities;
      if (input.actionTypes && input.actionTypes.length > 0) {
        filteredActivities = activities.filter(a =>
          input.actionTypes!.includes(a.activityType)
        );
      }

      return filteredActivities.map(activity => ({
        id: activity.id,
        actionType: activity.activityType,
        campaignName: activity.campaignId
          ? `Campaign ${activity.campaignId}`
          : null,
        campaignId: activity.campaignId,
        details: activity.activityDescription,
        timestamp: activity.createdAt,
      }));
    }),

  /**
   * Get AI performance metrics
   */
  getPerformanceMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Response rate (messages sent vs received)
    const totalMessages = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.userId, ctx.user.id));

    const responsesReceived = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.recipientId, ctx.user.id));

    const responseRate = totalMessages[0]?.count
      ? Math.round(
          (responsesReceived[0]?.count / totalMessages[0]?.count) * 100
        )
      : 0;

    // Meeting conversion rate (matches that led to meetings)
    const totalMatches = await db
      .select({ count: count() })
      .from(matches)
      .where(eq(matches.userId, ctx.user.id));

    const meetingsScheduled = await db
      .select({ count: count() })
      .from(matches)
      .where(
        and(eq(matches.userId, ctx.user.id), eq(matches.status, "interested"))
      );

    const meetingRate = totalMatches[0]?.count
      ? Math.round((meetingsScheduled[0]?.count / totalMatches[0]?.count) * 100)
      : 0;

    // Partnership rate
    const partnerships = await db
      .select({ count: count() })
      .from(matches)
      .where(
        and(eq(matches.userId, ctx.user.id), eq(matches.status, "contacted"))
      );

    const partnershipRate = totalMatches[0]?.count
      ? Math.round((partnerships[0]?.count / totalMatches[0]?.count) * 100)
      : 0;

    // Pipeline velocity (matches that moved status this week)
    const pipelineMovements = await db
      .select({ count: count() })
      .from(matches)
      .where(
        and(eq(matches.userId, ctx.user.id), gte(matches.updatedAt, weekStart))
      );

    // Active campaigns list
    const activeCampaignsList = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        prospectsContacted: campaigns.messagesSent,
      })
      .from(campaigns)
      .where(
        and(eq(campaigns.userId, ctx.user.id), eq(campaigns.status, "active"))
      )
      .limit(5);

    return {
      responseRate,
      meetingRate,
      partnershipRate,
      pipelineVelocity: 14, // Placeholder - would calculate from actual data
      pipelineMovements: pipelineMovements[0]?.count || 0,
      activeCampaignsList,
    };
  }),

  /**
   * Log AI activity (called by automation systems)
   */
  logActivity: protectedProcedure
    .input(
      z.object({
        actionType: z.string(),
        campaignId: z.number().optional(),
        matchId: z.number().optional(),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiActivityLog).values({
        userId: ctx.user.id,
        activityType: input.actionType,
        activityDescription:
          input.details || `${input.actionType.replace(/_/g, " ")}`,
        campaignId: input.campaignId || null,
        matchId: input.matchId || null,
        aiDecision: null,
        outcome: "success",
      });

      return { success: true };
    }),
});
