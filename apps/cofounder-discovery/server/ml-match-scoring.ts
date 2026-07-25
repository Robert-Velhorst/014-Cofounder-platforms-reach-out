/**
 * ML-Based Match Scoring System
 * Learns from successful partnerships to improve matching accuracy
 */

import { getDb } from "./db";

const getDbInstance = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
};
import {
  partnershipOutcomes,
  matches,
  conversationAnalytics,
  type InsertPartnershipOutcome,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import type { CompatibilityScore } from "./matching-engine";

export interface MLFeatures {
  // Compatibility scores
  skillsScore: number;
  industriesScore: number;
  goalsScore: number;
  experienceScore: number;
  locationScore: number;
  workstyleScore: number;
  commitmentScore: number;
  overallScore: number;

  // Engagement metrics
  messagesSent: number;
  messagesReceived: number;
  avgResponseTime: number; // hours
  conversationLength: number; // days

  // Profile completeness
  userProfileCompleteness: number; // 0-100
  prospectProfileCompleteness: number; // 0-100

  // Enrichment quality
  hasLinkedInData: boolean;
  hasGitHubData: boolean;
  enrichmentScore: number;
}

export interface PartnershipPrediction {
  successProbability: number; // 0-100
  confidence: "high" | "medium" | "low";
  keyFactors: string[];
  recommendation:
    | "highly_recommended"
    | "recommended"
    | "proceed_with_caution"
    | "not_recommended";
}

/**
 * Track partnership outcome
 */
export async function trackPartnershipOutcome(
  userId: number,
  prospectId: number,
  matchId: number,
  outcome:
    | "partnership_formed"
    | "still_talking"
    | "not_interested"
    | "no_response"
    | "timing_not_right",
  notes?: string
): Promise<void> {
  // Get engagement metrics
  const db = await getDbInstance();
  const analytics = await db
    .select()
    .from(conversationAnalytics)
    .where(
      and(
        eq(conversationAnalytics.userId, userId),
        eq(conversationAnalytics.prospectId, prospectId)
      )
    );

  const totalMessages = analytics.length;
  const totalMeetings = 0; // TODO: Track meetings separately

  // Calculate days to outcome
  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  const daysToOutcome =
    match.length > 0
      ? Math.floor(
          (Date.now() - match[0].matchedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  await db.insert(partnershipOutcomes).values({
    userId,
    prospectId,
    matchId,
    outcome,
    outcomeDate: new Date(),
    notes,
    totalMessages,
    totalMeetings,
    daysToOutcome,
  });
}

/**
 * Extract ML features from a match
 */
export async function extractMLFeatures(
  userId: number,
  prospectId: number,
  compatibilityScore: CompatibilityScore
): Promise<MLFeatures> {
  // Get conversation analytics
  const db = await getDbInstance();
  const analytics = await db
    .select()
    .from(conversationAnalytics)
    .where(
      and(
        eq(conversationAnalytics.userId, userId),
        eq(conversationAnalytics.prospectId, prospectId)
      )
    );

  const messagesSent = analytics.length;
  const messagesReceived = analytics.filter(a => a.respondedAt !== null).length;

  // Calculate average response time
  const responseTimes = analytics
    .filter(a => a.responseTime !== null)
    .map(a => a.responseTime!);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length /
        3600 // convert to hours
      : 0;

  // Calculate conversation length
  const sortedAnalytics = analytics.sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
  );
  const conversationLength =
    sortedAnalytics.length >= 2
      ? Math.floor(
          (sortedAnalytics[sortedAnalytics.length - 1].sentAt.getTime() -
            sortedAnalytics[0].sentAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return {
    // Compatibility scores
    skillsScore: compatibilityScore.breakdown.skills,
    industriesScore: compatibilityScore.breakdown.industries,
    goalsScore: compatibilityScore.breakdown.goals,
    experienceScore: compatibilityScore.breakdown.experience,
    locationScore: compatibilityScore.breakdown.location,
    workstyleScore: compatibilityScore.breakdown.workStyle,
    commitmentScore: compatibilityScore.breakdown.commitment,
    overallScore: compatibilityScore.overall,

    // Engagement metrics
    messagesSent,
    messagesReceived,
    avgResponseTime,
    conversationLength,

    // Profile completeness (simplified)
    userProfileCompleteness: 85, // TODO: Calculate actual completeness
    prospectProfileCompleteness: 80,

    // Enrichment quality (simplified)
    hasLinkedInData: true, // TODO: Check actual enrichment
    hasGitHubData: false,
    enrichmentScore: 75,
  };
}

/**
 * Predict partnership success using rule-based model
 * (In production, this would use a trained ML model)
 */
export async function predictPartnershipSuccess(
  userId: number,
  prospectId: number,
  compatibilityScore: CompatibilityScore
): Promise<PartnershipPrediction> {
  const features = await extractMLFeatures(
    userId,
    prospectId,
    compatibilityScore
  );

  // Rule-based scoring (placeholder for ML model)
  let score = 0;
  const keyFactors: string[] = [];

  // Compatibility score weight: 40%
  score += features.overallScore * 0.4;
  if (features.overallScore >= 85) {
    keyFactors.push("Exceptional compatibility score");
  }

  // Engagement weight: 30%
  const engagementScore = Math.min(
    100,
    (features.messagesReceived / Math.max(1, features.messagesSent)) * 100
  );
  score += engagementScore * 0.3;
  if (engagementScore >= 70) {
    keyFactors.push("Strong engagement and responsiveness");
  }

  // Response time weight: 15%
  const responseTimeScore =
    features.avgResponseTime > 0 && features.avgResponseTime < 24
      ? 100
      : features.avgResponseTime < 48
        ? 75
        : features.avgResponseTime < 72
          ? 50
          : 25;
  score += responseTimeScore * 0.15;
  if (responseTimeScore >= 75) {
    keyFactors.push("Quick response times");
  }

  // Conversation length weight: 15%
  const conversationLengthScore = Math.min(
    100,
    (features.conversationLength / 14) * 100
  ); // 14 days = 100%
  score += conversationLengthScore * 0.15;
  if (features.conversationLength >= 7) {
    keyFactors.push("Sustained conversation over time");
  }

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  if (features.messagesSent >= 10 && features.conversationLength >= 7) {
    confidence = "high";
  } else if (features.messagesSent >= 5 && features.conversationLength >= 3) {
    confidence = "medium";
  }

  // Determine recommendation
  let recommendation: PartnershipPrediction["recommendation"] =
    "not_recommended";
  if (score >= 80) {
    recommendation = "highly_recommended";
  } else if (score >= 65) {
    recommendation = "recommended";
  } else if (score >= 50) {
    recommendation = "proceed_with_caution";
  }

  // Add specific insights
  if (features.skillsScore >= 85) {
    keyFactors.push("Excellent skill complementarity");
  }
  if (features.goalsScore >= 85) {
    keyFactors.push("Aligned partnership goals");
  }
  if (features.industriesScore >= 85) {
    keyFactors.push("Shared industry focus");
  }

  return {
    successProbability: Math.round(score),
    confidence,
    keyFactors: keyFactors.length > 0 ? keyFactors : ["Limited data available"],
    recommendation,
  };
}

/**
 * Get training data for ML model
 */
export async function getMLTrainingData(): Promise<
  Array<{
    features: MLFeatures;
    outcome: number; // 1 for success, 0 for failure
  }>
> {
  const db = await getDbInstance();
  const outcomes = await db.select().from(partnershipOutcomes);

  const trainingData = [];

  for (const outcome of outcomes) {
    // Get match details
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, outcome.matchId))
      .limit(1);

    if (match.length === 0) continue;

    // Extract features
    const compatibilityScore: CompatibilityScore = {
      overall: match[0].overallScore,
      breakdown: {
        skills: match[0].skillsScore ?? 0,
        industries: match[0].industryScore ?? 0,
        goals: match[0].visionScore ?? 0,
        experience: match[0].skillsScore ?? 0, // Using skillsScore as proxy
        location: match[0].locationScore ?? 0,
        workStyle: match[0].workStyleScore ?? 0,
        commitment: match[0].overallScore ?? 0, // Using overallScore as proxy
      },
      highlights: [],
      concerns: [],
    };

    const features = await extractMLFeatures(
      outcome.userId,
      outcome.prospectId,
      compatibilityScore
    );

    // Label: 1 for partnership_formed, 0 for others
    const label = outcome.outcome === "partnership_formed" ? 1 : 0;

    trainingData.push({
      features,
      outcome: label,
    });
  }

  return trainingData;
}

/**
 * Get ML model statistics
 */
export async function getMLModelStats() {
  const db = await getDbInstance();
  const outcomes = await db.select().from(partnershipOutcomes);

  const totalOutcomes = outcomes.length;
  const partnerships = outcomes.filter(
    o => o.outcome === "partnership_formed"
  ).length;
  const stillTalking = outcomes.filter(
    o => o.outcome === "still_talking"
  ).length;
  const notInterested = outcomes.filter(
    o => o.outcome === "not_interested"
  ).length;
  const noResponse = outcomes.filter(o => o.outcome === "no_response").length;

  return {
    totalOutcomes,
    partnerships,
    stillTalking,
    notInterested,
    noResponse,
    successRate:
      totalOutcomes > 0 ? Math.round((partnerships / totalOutcomes) * 100) : 0,
    hasEnoughDataForTraining: totalOutcomes >= 50, // Minimum 50 outcomes for training
  };
}
