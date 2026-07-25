import * as db from "./db";
import { batchCalculateCompatibility } from "./matching-engine";
import {
  generateOutreachMessage,
  generateFollowUpMessage,
} from "./messaging-engine";
import type { Prospect } from "../drizzle/schema";

/**
 * Campaign Automation Engine
 * Automates prospect discovery, matching, and outreach workflows
 */

export interface CampaignConfig {
  userId: number;
  name: string;
  minCompatibilityScore: number;
  maxProspectsPerDay: number;
  autoSendMessages: boolean;
  followUpEnabled: boolean;
  followUpDelayDays: number;
  targetPlatforms: string[];
}

export interface CampaignMetrics {
  prospectsDiscovered: number;
  prospectsMatched: number;
  messagesSent: number;
  responsesReceived: number;
  meetingsScheduled: number;
  successRate: number;
}

/**
 * Run automated campaign discovery pipeline
 */
export async function runCampaignDiscovery(config: CampaignConfig): Promise<{
  discovered: number;
  matched: number;
  messagesGenerated: number;
}> {
  console.log(`Running campaign discovery for user ${config.userId}`);

  // Get user profile
  const userProfile = await db.getUserProfile(config.userId);
  if (!userProfile) {
    throw new Error("User profile not found");
  }

  // Get all prospects
  const allProspects = await db.getAllProspects();

  // Filter prospects not already matched
  const existingMatches = await db.getUserMatches(config.userId);
  const existingProspectIds = new Set(
    existingMatches.map(m => m.match.prospectId)
  );
  const newProspects = allProspects.filter(p => !existingProspectIds.has(p.id));

  console.log(`Found ${newProspects.length} new prospects to evaluate`);

  // Calculate compatibility for all new prospects
  const userProfileData = {
    skills: userProfile.skills || [],
    industries: userProfile.targetIndustries || [],
    experience: userProfile.experience || "",
    lookingFor: userProfile.lookingFor || [],
    startupStage: userProfile.startupStage || "",
    location: userProfile.location || "",
  };

  const scoredProspects = batchCalculateCompatibility(
    userProfileData,
    newProspects
  );

  // Filter by minimum compatibility score
  const qualifiedProspects = scoredProspects.filter(
    ({ score }) => score.overall >= config.minCompatibilityScore
  );

  console.log(
    `${qualifiedProspects.length} prospects meet minimum score of ${config.minCompatibilityScore}%`
  );

  // Limit to max prospects per day
  const prospectsToProcess = qualifiedProspects.slice(
    0,
    config.maxProspectsPerDay
  );

  let messagesGenerated = 0;

  // Create matches and generate messages
  for (const { prospect, score } of prospectsToProcess) {
    try {
      // Create match record
      await db.createMatch({
        userId: config.userId,
        prospectId: prospect.id,
        overallScore: score.overall,
        skillsScore: score.breakdown.skills,
        industryScore: score.breakdown.industries,
        visionScore: score.breakdown.goals,
        workStyleScore: score.breakdown.workStyle,
        locationScore: score.breakdown.location,
        reasoning: score.highlights.join(", ") || "Compatible profile",
        recommendations: [
          "Discuss long-term vision and goals",
          "Clarify roles and responsibilities",
          "Explore equity and commitment expectations",
        ],
        successProbability: Math.min(95, score.overall - 5),
      });

      // Generate personalized message
      if (config.autoSendMessages) {
        const message = await generateOutreachMessage({
          senderName: "User", // User profile doesn't have name field
          senderSkills: userProfile.skills || [],
          senderIndustries: userProfile.targetIndustries || [],
          senderStartupStage: userProfile.startupStage || undefined,
          recipientName: prospect.name,
          recipientTitle: prospect.title || undefined,
          recipientSkills: prospect.skills || [],
          recipientIndustries: prospect.industries || [],
          recipientBio: prospect.bio || undefined,
          compatibilityScore: score,
        });

        // Store message (in production, this would also send it)
        console.log(
          `Generated message for ${prospect.name}: ${message.subject}`
        );
        messagesGenerated++;
      }
    } catch (error) {
      console.error(`Failed to process prospect ${prospect.id}:`, error);
    }
  }

  return {
    discovered: newProspects.length,
    matched: prospectsToProcess.length,
    messagesGenerated,
  };
}

/**
 * Run automated follow-up sequence
 */
export async function runFollowUpSequence(config: CampaignConfig): Promise<{
  followUpsSent: number;
}> {
  console.log(`Running follow-up sequence for user ${config.userId}`);

  if (!config.followUpEnabled) {
    return { followUpsSent: 0 };
  }

  // Get matches that need follow-up
  // In production, this would check message history and timing
  const matchResults = await db.getUserMatches(config.userId);

  // Filter matches that haven't responded and are past follow-up delay
  // This is simplified - production would track message history
  const needsFollowUp = matchResults.slice(0, 5); // Limit to 5 per run

  let followUpsSent = 0;

  for (const matchResult of needsFollowUp) {
    try {
      const { match, prospect } = matchResult;
      if (!prospect) continue;

      const userProfile = await db.getUserProfile(config.userId);
      if (!userProfile) continue;

      // Generate follow-up message
      const followUp = await generateFollowUpMessage(
        {
          senderName: "User", // User profile doesn't have name field
          senderSkills: userProfile.skills || [],
          senderIndustries: userProfile.targetIndustries || [],
          senderStartupStage: userProfile.startupStage || undefined,
          recipientName: prospect.name,
          recipientTitle: prospect.title || undefined,
          recipientSkills: prospect.skills || [],
          recipientIndustries: prospect.industries || [],
          recipientBio: prospect.bio || undefined,
          compatibilityScore: {
            overall: match.overallScore,
            breakdown: {
              skills: match.skillsScore || 70,
              industries: match.industryScore || 70,
              experience: 70,
              goals: match.visionScore || 70,
              location: match.locationScore || 70,
              workStyle: match.workStyleScore || 70,
              commitment: 70,
            },
            highlights: [],
            concerns: [],
          },
        },
        "Original outreach message", // Would fetch from database
        config.followUpDelayDays
      );

      console.log(
        `Generated follow-up for ${prospect.name}: ${followUp.subject}`
      );
      followUpsSent++;
    } catch (error) {
      console.error(`Failed to generate follow-up:`, error);
    }
  }

  return { followUpsSent };
}

/**
 * Calculate campaign performance metrics
 */
export async function calculateCampaignMetrics(
  userId: number,
  campaignId?: number
): Promise<CampaignMetrics> {
  // Get all matches for user
  const matchResults = await db.getUserMatches(userId);

  // In production, this would query actual message and response data
  // For now, we'll simulate metrics
  const prospectsMatched = matchResults.length;
  const messagesSent = Math.floor(prospectsMatched * 0.8); // 80% message rate
  const responsesReceived = Math.floor(messagesSent * 0.15); // 15% response rate
  const meetingsScheduled = Math.floor(responsesReceived * 0.4); // 40% meeting rate

  return {
    prospectsDiscovered: prospectsMatched + 50, // Simulated
    prospectsMatched,
    messagesSent,
    responsesReceived,
    meetingsScheduled,
    successRate:
      messagesSent > 0
        ? Math.round((responsesReceived / messagesSent) * 100)
        : 0,
  };
}

/**
 * Smart filtering based on user profile
 */
export function smartFilterProspects(
  prospects: Prospect[],
  userProfile: {
    skills?: string[];
    industries?: string[];
    location?: string;
    experience?: string;
    startupStage?: string;
  }
): Prospect[] {
  return prospects.filter(prospect => {
    // Filter by complementary skills (not exact matches)
    if (userProfile.skills && prospect.skills) {
      const userSkillSet = new Set(
        userProfile.skills.map(s => s.toLowerCase())
      );
      const prospectSkillSet = new Set(
        prospect.skills.map(s => s.toLowerCase())
      );

      // Look for prospects with different but relevant skills
      const hasComplementarySkills = Array.from(prospectSkillSet).some(
        skill => !userSkillSet.has(skill)
      );

      if (!hasComplementarySkills) return false;
    }

    // Filter by industry alignment
    if (userProfile.industries && prospect.industries) {
      const userIndustrySet = new Set(
        userProfile.industries.map(i => i.toLowerCase())
      );
      const prospectIndustrySet = new Set(
        prospect.industries.map(i => i.toLowerCase())
      );

      const hasIndustryMatch = Array.from(prospectIndustrySet).some(industry =>
        userIndustrySet.has(industry)
      );

      if (!hasIndustryMatch) return false;
    }

    // Filter by location compatibility (same city or remote)
    if (userProfile.location && prospect.location) {
      const sameLocation =
        userProfile.location.toLowerCase() === prospect.location.toLowerCase();
      const isRemote = prospect.location.toLowerCase().includes("remote");

      if (!sameLocation && !isRemote) {
        // Check if at least same country
        const userCountry = userProfile.location
          .split(",")
          .pop()
          ?.trim()
          .toLowerCase();
        const prospectCountry = prospect.location
          .split(",")
          .pop()
          ?.trim()
          .toLowerCase();

        if (userCountry !== prospectCountry) return false;
      }
    }

    return true;
  });
}

/**
 * Schedule automated campaign runs
 */
export interface CampaignSchedule {
  frequency: "daily" | "weekly" | "manual";
  timeOfDay: string; // HH:MM format
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export function shouldRunCampaign(
  schedule: CampaignSchedule,
  lastRun?: Date
): boolean {
  const now = new Date();

  if (schedule.frequency === "manual") {
    return false;
  }

  // Check if enough time has passed since last run
  if (lastRun) {
    const hoursSinceLastRun =
      (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

    if (schedule.frequency === "daily" && hoursSinceLastRun < 24) {
      return false;
    }

    if (schedule.frequency === "weekly" && hoursSinceLastRun < 168) {
      return false;
    }
  }

  // Check day of week for weekly campaigns
  if (schedule.frequency === "weekly" && schedule.daysOfWeek) {
    const currentDay = now.getDay();
    if (!schedule.daysOfWeek.includes(currentDay)) {
      return false;
    }
  }

  return true;
}

/**
 * Pause/resume campaign
 */
export interface CampaignStatus {
  id: number;
  active: boolean;
  pausedAt?: Date;
  pauseReason?: string;
}

export async function pauseCampaign(
  campaignId: number,
  reason: string
): Promise<void> {
  console.log(`Pausing campaign ${campaignId}: ${reason}`);
  // In production, update campaign status in database
}

export async function resumeCampaign(campaignId: number): Promise<void> {
  console.log(`Resuming campaign ${campaignId}`);
  // In production, update campaign status in database
}
