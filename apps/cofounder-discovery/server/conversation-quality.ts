/**
 * Conversation Quality Scoring System
 * Tracks and analyzes message performance to optimize future outreach
 */

import { getDb } from "./db";

const getDbInstance = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
};
import {
  conversationAnalytics,
  type InsertConversationAnalytic,
} from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface MessageCharacteristics {
  tone: "professional" | "friendly" | "enthusiastic" | "casual";
  focusArea:
    | "skills"
    | "industry"
    | "project"
    | "experience"
    | "shared_interest";
  messageLength: number;
  hasQuestion: boolean;
  hasPersonalization: boolean;
}

export interface ConversationMetrics {
  totalSent: number;
  totalResponses: number;
  responseRate: number;
  avgResponseTime: number; // minutes
  byTone: Record<string, { sent: number; responses: number; rate: number }>;
  byFocusArea: Record<
    string,
    { sent: number; responses: number; rate: number }
  >;
  bestPerformingTone: string;
  bestPerformingFocusArea: string;
}

/**
 * Analyze message characteristics using simple heuristics
 */
export function analyzeMessageCharacteristics(
  message: string
): MessageCharacteristics {
  const lowerMessage = message.toLowerCase();

  // Detect tone (order matters - check specific patterns first)
  let tone: MessageCharacteristics["tone"] = "professional";
  if (lowerMessage.includes("hey") || lowerMessage.includes("hi there")) {
    tone = "casual";
  } else if (
    lowerMessage.includes("i'd love") ||
    lowerMessage.includes("i noticed")
  ) {
    tone = "friendly";
  } else if (
    lowerMessage.includes("excited") ||
    lowerMessage.includes("amazing") ||
    lowerMessage.includes("!")
  ) {
    tone = "enthusiastic";
  }

  // Detect focus area
  let focusArea: MessageCharacteristics["focusArea"] = "shared_interest";
  if (
    lowerMessage.includes("skill") ||
    lowerMessage.includes("expertise") ||
    lowerMessage.includes("experience with")
  ) {
    focusArea = "skills";
  } else if (
    lowerMessage.includes("industry") ||
    lowerMessage.includes("fintech") ||
    lowerMessage.includes("saas")
  ) {
    focusArea = "industry";
  } else if (
    lowerMessage.includes("project") ||
    lowerMessage.includes("building") ||
    lowerMessage.includes("working on")
  ) {
    focusArea = "project";
  } else if (
    lowerMessage.includes("background") ||
    lowerMessage.includes("years")
  ) {
    focusArea = "experience";
  }

  return {
    tone,
    focusArea,
    messageLength: message.length,
    hasQuestion: message.includes("?"),
    hasPersonalization:
      lowerMessage.includes("i noticed") || lowerMessage.includes("i saw"),
  };
}

/**
 * Log a sent message for analytics
 */
export async function logMessageSent(
  userId: number,
  prospectId: number,
  messageId: number,
  message: string
): Promise<void> {
  const characteristics = analyzeMessageCharacteristics(message);

  const db = await getDbInstance();
  await db.insert(conversationAnalytics).values({
    userId,
    prospectId,
    messageId,
    tone: characteristics.tone,
    focusArea: characteristics.focusArea,
    messageLength: characteristics.messageLength,
    hasQuestion: characteristics.hasQuestion ? 1 : 0,
    hasPersonalization: characteristics.hasPersonalization ? 1 : 0,
    sentAt: new Date(),
  });
}

/**
 * Log a message response
 */
export async function logMessageResponse(
  messageId: number,
  responseQuality: "positive" | "neutral" | "negative"
): Promise<void> {
  const db = await getDbInstance();
  const analytics = await db
    .select()
    .from(conversationAnalytics)
    .where(eq(conversationAnalytics.messageId, messageId))
    .limit(1);

  if (analytics.length === 0) return;

  const sentAt = analytics[0].sentAt;
  const respondedAt = new Date();
  const responseTime = Math.floor(
    (respondedAt.getTime() - sentAt.getTime()) / 1000
  );

  await db
    .update(conversationAnalytics)
    .set({
      respondedAt,
      responseTime,
      responseQuality,
    })
    .where(eq(conversationAnalytics.messageId, messageId));
}

/**
 * Get conversation metrics for a user
 */
export async function getConversationMetrics(
  userId: number
): Promise<ConversationMetrics> {
  const db = await getDbInstance();
  const analytics = await db
    .select()
    .from(conversationAnalytics)
    .where(eq(conversationAnalytics.userId, userId));

  if (analytics.length === 0) {
    return {
      totalSent: 0,
      totalResponses: 0,
      responseRate: 0,
      avgResponseTime: 0,
      byTone: {},
      byFocusArea: {},
      bestPerformingTone: "professional",
      bestPerformingFocusArea: "skills",
    };
  }

  const totalSent = analytics.length;
  const responded = analytics.filter(a => a.respondedAt !== null);
  const totalResponses = responded.length;
  const responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;

  // Calculate average response time
  const responseTimes = responded
    .filter(a => a.responseTime !== null)
    .map(a => a.responseTime!);
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.floor(
          responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length /
            60
        )
      : 0;

  // Analyze by tone
  const byTone: Record<
    string,
    { sent: number; responses: number; rate: number }
  > = {};
  const tones = ["professional", "friendly", "enthusiastic", "casual"];

  for (const tone of tones) {
    const toneMessages = analytics.filter(a => a.tone === tone);
    const toneResponses = toneMessages.filter(a => a.respondedAt !== null);
    const sent = toneMessages.length;
    const responses = toneResponses.length;
    const rate = sent > 0 ? (responses / sent) * 100 : 0;

    byTone[tone] = { sent, responses, rate };
  }

  // Analyze by focus area
  const byFocusArea: Record<
    string,
    { sent: number; responses: number; rate: number }
  > = {};
  const focusAreas = [
    "skills",
    "industry",
    "project",
    "experience",
    "shared_interest",
  ];

  for (const focusArea of focusAreas) {
    const focusMessages = analytics.filter(a => a.focusArea === focusArea);
    const focusResponses = focusMessages.filter(a => a.respondedAt !== null);
    const sent = focusMessages.length;
    const responses = focusResponses.length;
    const rate = sent > 0 ? (responses / sent) * 100 : 0;

    byFocusArea[focusArea] = { sent, responses, rate };
  }

  // Find best performing
  const bestPerformingTone =
    Object.entries(byTone)
      .filter(([_, stats]) => stats.sent >= 3) // Minimum 3 messages
      .sort((a, b) => b[1].rate - a[1].rate)[0]?.[0] || "professional";

  const bestPerformingFocusArea =
    Object.entries(byFocusArea)
      .filter(([_, stats]) => stats.sent >= 3)
      .sort((a, b) => b[1].rate - a[1].rate)[0]?.[0] || "skills";

  return {
    totalSent,
    totalResponses,
    responseRate: Math.round(responseRate * 10) / 10,
    avgResponseTime,
    byTone,
    byFocusArea,
    bestPerformingTone,
    bestPerformingFocusArea,
  };
}

/**
 * Get optimal message style based on user's historical performance
 */
export async function getOptimalMessageStyle(userId: number): Promise<{
  tone: MessageCharacteristics["tone"];
  focusArea: MessageCharacteristics["focusArea"];
  includeQuestion: boolean;
  includePersonalization: boolean;
}> {
  const metrics = await getConversationMetrics(userId);

  // If not enough data, use defaults
  if (metrics.totalSent < 5) {
    return {
      tone: "friendly",
      focusArea: "shared_interest",
      includeQuestion: true,
      includePersonalization: true,
    };
  }

  // Analyze question effectiveness
  const db = await getDbInstance();
  const analytics = await db
    .select()
    .from(conversationAnalytics)
    .where(eq(conversationAnalytics.userId, userId));

  const withQuestion = analytics.filter(a => a.hasQuestion === 1);
  const withQuestionResponses = withQuestion.filter(
    a => a.respondedAt !== null
  );
  const questionRate =
    withQuestion.length > 0
      ? (withQuestionResponses.length / withQuestion.length) * 100
      : 0;

  const withoutQuestion = analytics.filter(a => a.hasQuestion === 0);
  const withoutQuestionResponses = withoutQuestion.filter(
    a => a.respondedAt !== null
  );
  const noQuestionRate =
    withoutQuestion.length > 0
      ? (withoutQuestionResponses.length / withoutQuestion.length) * 100
      : 0;

  // Analyze personalization effectiveness
  const withPersonalization = analytics.filter(a => a.hasPersonalization === 1);
  const withPersonalizationResponses = withPersonalization.filter(
    a => a.respondedAt !== null
  );
  const personalizationRate =
    withPersonalization.length > 0
      ? (withPersonalizationResponses.length / withPersonalization.length) * 100
      : 0;

  const withoutPersonalization = analytics.filter(
    a => a.hasPersonalization === 0
  );
  const withoutPersonalizationResponses = withoutPersonalization.filter(
    a => a.respondedAt !== null
  );
  const noPersonalizationRate =
    withoutPersonalization.length > 0
      ? (withoutPersonalizationResponses.length /
          withoutPersonalization.length) *
        100
      : 0;

  return {
    tone: metrics.bestPerformingTone as MessageCharacteristics["tone"],
    focusArea:
      metrics.bestPerformingFocusArea as MessageCharacteristics["focusArea"],
    includeQuestion: questionRate > noQuestionRate,
    includePersonalization: personalizationRate > noPersonalizationRate,
  };
}

/**
 * Get conversation analytics dashboard data
 */
export async function getAnalyticsDashboard(userId: number) {
  const metrics = await getConversationMetrics(userId);
  const optimalStyle = await getOptimalMessageStyle(userId);

  // Get recent performance trend
  const db = await getDbInstance();
  const recentAnalytics = await db
    .select()
    .from(conversationAnalytics)
    .where(eq(conversationAnalytics.userId, userId))
    .orderBy(desc(conversationAnalytics.sentAt))
    .limit(20);

  const last20ResponseRate =
    recentAnalytics.length > 0
      ? (recentAnalytics.filter(a => a.respondedAt !== null).length /
          recentAnalytics.length) *
        100
      : 0;

  const trend =
    last20ResponseRate > metrics.responseRate
      ? "improving"
      : last20ResponseRate < metrics.responseRate
        ? "declining"
        : "stable";

  return {
    metrics,
    optimalStyle,
    recentPerformance: {
      last20Messages: recentAnalytics.length,
      last20ResponseRate: Math.round(last20ResponseRate * 10) / 10,
      trend,
    },
  };
}
