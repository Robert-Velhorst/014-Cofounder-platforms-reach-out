/**
 * Automation Router
 * tRPC procedures for match queue, approval workflow, and daily scheduler
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getApprovalQueueCount,
  getMatchesByStatus,
  updateMatchStatus,
} from "./match-queue";
import { runMatchingNow, type MatchingResult } from "./daily-matcher";

export const automationRouter = router({
  /**
   * Get approval queue count
   */
  getApprovalQueueCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getApprovalQueueCount(ctx.user.id);
    return { count };
  }),

  /**
   * Get matches in approval queue
   */
  getApprovalQueue: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const matches = await getMatchesByStatus(
        ctx.user.id,
        "queued",
        input.campaignId
      );
      return matches;
    }),

  /**
   * Approve a match
   */
  approveMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await updateMatchStatus(input.matchId, "approved");
      return { success: true };
    }),

  /**
   * Reject a match
   */
  rejectMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await updateMatchStatus(input.matchId, "rejected");
      return { success: true };
    }),

  /**
   * Bulk approve matches
   */
  bulkApproveMatches: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      for (const matchId of input.matchIds) {
        await updateMatchStatus(matchId, "approved");
      }
      return { success: true, count: input.matchIds.length };
    }),

  /**
   * Bulk reject matches
   */
  bulkRejectMatches: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      for (const matchId of input.matchIds) {
        await updateMatchStatus(matchId, "rejected");
      }
      return { success: true, count: input.matchIds.length };
    }),

  /**
   * Run matching now for a campaign (manual trigger)
   */
  runMatchingNow: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await runMatchingNow(input.campaignId, ctx.user.id);
      return result;
    }),

  /**
   * Get campaign automation settings
   */
  getCampaignSettings: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { campaigns } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const campaign = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, input.campaignId),
            eq(campaigns.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!campaign || campaign.length === 0) {
        throw new Error("Campaign not found");
      }

      return {
        automationMode: campaign[0].automationMode,
        dailyMatchLimit: campaign[0].dailyMatchLimit,
        autoMessageEnabled: campaign[0].autoMessageEnabled,
        minCompatibilityScore: campaign[0].minCompatibilityScore,
        lastRunAt: campaign[0].lastRunAt,
      };
    }),

  /**
   * Update campaign automation settings
   */
  updateCampaignSettings: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        automationMode: z
          .enum(["fully_automatic", "semi_automatic", "manual"])
          .optional(),
        dailyMatchLimit: z.number().min(1).max(20).optional(),
        autoMessageEnabled: z.boolean().optional(),
        minCompatibilityScore: z.number().min(50).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { campaigns } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const { campaignId, ...settings } = input;

      await db
        .update(campaigns)
        .set(settings)
        .where(
          and(eq(campaigns.id, campaignId), eq(campaigns.userId, ctx.user.id))
        );

      return { success: true };
    }),
});
