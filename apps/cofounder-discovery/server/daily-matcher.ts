/**
 * Daily Greedy Matching Scheduler
 * Automatically finds and creates top-N matches for active campaigns
 * Uses greedy algorithm: 99% → 98% → 97%... (highest scores first)
 */

import { getDb } from "./db";
import { campaigns, userProfiles, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  scoreAllProspects,
  selectTopNMatches,
  createMatches,
  type QueuedMatch,
} from "./match-queue";
// import { logAIActivity } from './db'; // TODO: Implement AI activity logging

export interface MatchingResult {
  campaignId: number;
  campaignName: string;
  matchesCreated: number;
  topScore: number;
  avgScore: number;
  status: "success" | "no_prospects" | "error";
  error?: string;
}

/**
 * Run matching for a single campaign
 */
export async function runCampaignMatching(
  campaignId: number,
  userId: number
): Promise<MatchingResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get campaign details
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign || campaign.length === 0) {
      throw new Error("Campaign not found");
    }

    const campaignData = campaign[0];

    // Get user profile
    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!userProfile || userProfile.length === 0) {
      throw new Error("User profile not found");
    }

    const profile = userProfile[0];

    // Convert to UserProfile format for matching engine
    const userProfileData = {
      skills: profile.skills || [],
      industries: profile.industries || [],
      experience: profile.experience || "",
      lookingFor: profile.lookingFor || [],
      startupStage: profile.startupStage || "",
      location: profile.location || "",
      timezone: profile.timezone || undefined,
      commitment: profile.commitment || undefined,
      workStyle: profile.workStyle || undefined,
      values: profile.values || undefined,
      remotePreference: profile.remotePreference || undefined,
    };

    // Score all uncontacted prospects
    const scoredMatches = await scoreAllProspects(
      userId,
      userProfileData,
      campaignId,
      1000 // Score up to 1000 prospects
    );

    if (scoredMatches.length === 0) {
      // TODO: Log activity
      // await logAIActivity(userId, campaignId, 'campaign_run', {
      //   result: 'no_prospects',
      //   message: 'No uncontacted prospects available',
      // });

      return {
        campaignId,
        campaignName: campaignData.name,
        matchesCreated: 0,
        topScore: 0,
        avgScore: 0,
        status: "no_prospects",
      };
    }

    // Select top N using greedy algorithm
    const topMatches = await selectTopNMatches(
      scoredMatches,
      campaignData.dailyMatchLimit || 5,
      campaignData.minCompatibilityScore || 70
    );

    if (topMatches.length === 0) {
      // TODO: Log activity
      // await logAIActivity(userId, campaignId, 'campaign_run', {
      //   result: 'no_qualified_matches',
      //   message: `No prospects met minimum score of ${campaignData.minCompatibilityScore}%`,
      // });

      return {
        campaignId,
        campaignName: campaignData.name,
        matchesCreated: 0,
        topScore: scoredMatches[0]?.compatibilityScore.overall || 0,
        avgScore: 0,
        status: "no_prospects",
      };
    }

    // Create matches in database
    const matchIds = await createMatches(
      userId,
      topMatches,
      campaignData.automationMode || "semi_automatic"
    );

    // Calculate stats
    const topScore = topMatches[0].compatibilityScore.overall;
    const avgScore = Math.round(
      topMatches.reduce((sum, m) => sum + m.compatibilityScore.overall, 0) /
        topMatches.length
    );

    // Update campaign last_run_at
    await db
      .update(campaigns)
      .set({ lastRunAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    // TODO: Log activity for each match
    // for (const match of topMatches) {
    //   await logAIActivity(userId, campaignId, 'match_created', {
    //     prospectId: match.prospectId,
    //     prospectName: match.prospect.name,
    //     compatibilityScore: match.compatibilityScore.overall,
    //     highlights: match.compatibilityScore.highlights,
    //   });
    // }

    return {
      campaignId,
      campaignName: campaignData.name,
      matchesCreated: matchIds.length,
      topScore,
      avgScore,
      status: "success",
    };
  } catch (error) {
    console.error(
      `Error running campaign matching for campaign ${campaignId}:`,
      error
    );

    return {
      campaignId,
      campaignName: "Unknown",
      matchesCreated: 0,
      topScore: 0,
      avgScore: 0,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run matching for all active campaigns
 */
export async function runDailyMatching(): Promise<MatchingResult[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get all active campaigns
  const activeCampaigns = await db
    .select({
      campaign: campaigns,
      user: users,
    })
    .from(campaigns)
    .leftJoin(users, eq(campaigns.userId, users.id))
    .where(eq(campaigns.status, "active"));

  const results: MatchingResult[] = [];

  for (const { campaign, user } of activeCampaigns) {
    if (!user) continue;

    const result = await runCampaignMatching(campaign.id, user.id);
    results.push(result);

    // Add delay between campaigns to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Manual trigger for testing
 * Runs matching immediately for a specific campaign
 */
export async function runMatchingNow(
  campaignId: number,
  userId: number
): Promise<MatchingResult> {
  return await runCampaignMatching(campaignId, userId);
}
