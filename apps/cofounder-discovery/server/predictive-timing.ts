/**
 * Predictive Follow-Up Timing System
 * Analyzes response patterns to predict optimal follow-up times
 */

import { getDb } from "./db";

const getDbInstance = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
};
import {
  responsePatterns,
  conversationAnalytics,
  type InsertResponsePattern,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export interface TimingPrediction {
  optimalDay: number; // 0-6 (Sunday-Saturday)
  optimalHour: number; // 0-23
  confidence: "high" | "medium" | "low";
  expectedResponseRate: number;
  timezone: string;
}

/**
 * Update response patterns when a message is responded to
 */
export async function updateResponsePattern(
  prospectId: number,
  sentAt: Date,
  respondedAt: Date
): Promise<void> {
  const dayOfWeek = sentAt.getDay(); // 0-6
  const hourOfDay = sentAt.getHours(); // 0-23
  const responseTime = Math.floor(
    (respondedAt.getTime() - sentAt.getTime()) / 1000 / 60
  ); // minutes

  // Check if pattern exists
  const db = await getDbInstance();
  const existing = await db
    .select()
    .from(responsePatterns)
    .where(
      and(
        eq(responsePatterns.prospectId, prospectId),
        eq(responsePatterns.dayOfWeek, dayOfWeek),
        eq(responsePatterns.hourOfDay, hourOfDay)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing pattern
    const pattern = existing[0];
    const newResponseCount = pattern.responseCount + 1;
    const newTotalSent = pattern.totalSent + 1;

    // Calculate new average response time
    const currentAvg = pattern.avgResponseTime || 0;
    const newAvg = Math.floor(
      (currentAvg * pattern.responseCount + responseTime) / newResponseCount
    );

    await db
      .update(responsePatterns)
      .set({
        responseCount: newResponseCount,
        totalSent: newTotalSent,
        avgResponseTime: newAvg,
      })
      .where(eq(responsePatterns.id, pattern.id));
  } else {
    // Create new pattern
    await db.insert(responsePatterns).values({
      prospectId,
      dayOfWeek,
      hourOfDay,
      responseCount: 1,
      totalSent: 1,
      avgResponseTime: responseTime,
    });
  }
}

/**
 * Update pattern when a message is sent but not responded to
 */
export async function updatePatternNoResponse(
  prospectId: number,
  sentAt: Date
): Promise<void> {
  const dayOfWeek = sentAt.getDay();
  const hourOfDay = sentAt.getHours();

  const db = await getDbInstance();
  const existing = await db
    .select()
    .from(responsePatterns)
    .where(
      and(
        eq(responsePatterns.prospectId, prospectId),
        eq(responsePatterns.dayOfWeek, dayOfWeek),
        eq(responsePatterns.hourOfDay, hourOfDay)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(responsePatterns)
      .set({
        totalSent: existing[0].totalSent + 1,
      })
      .where(eq(responsePatterns.id, existing[0].id));
  } else {
    await db.insert(responsePatterns).values({
      prospectId,
      dayOfWeek,
      hourOfDay,
      responseCount: 0,
      totalSent: 1,
      avgResponseTime: null,
    });
  }
}

/**
 * Predict optimal follow-up time for a prospect
 */
export async function predictOptimalFollowUpTime(
  prospectId: number,
  timezone: string = "UTC"
): Promise<TimingPrediction> {
  // Get all response patterns for this prospect
  const db = await getDbInstance();
  const patterns = await db
    .select()
    .from(responsePatterns)
    .where(eq(responsePatterns.prospectId, prospectId));

  if (patterns.length === 0) {
    // No data, use general best practices
    return {
      optimalDay: 2, // Tuesday
      optimalHour: 10, // 10 AM
      confidence: "low",
      expectedResponseRate: 30,
      timezone,
    };
  }

  // Calculate response rate for each pattern
  const patternsWithRates = patterns.map(p => ({
    ...p,
    responseRate: p.totalSent > 0 ? (p.responseCount / p.totalSent) * 100 : 0,
  }));

  // Find pattern with highest response rate (minimum 2 sends)
  const qualifiedPatterns = patternsWithRates.filter(p => p.totalSent >= 2);

  if (qualifiedPatterns.length === 0) {
    // Not enough data, use pattern with best rate
    const bestPattern = patternsWithRates.sort(
      (a, b) => b.responseRate - a.responseRate
    )[0];
    return {
      optimalDay: bestPattern.dayOfWeek,
      optimalHour: bestPattern.hourOfDay,
      confidence: "low",
      expectedResponseRate: Math.round(bestPattern.responseRate),
      timezone,
    };
  }

  // Sort by response rate
  const sortedPatterns = qualifiedPatterns.sort(
    (a, b) => b.responseRate - a.responseRate
  );
  const bestPattern = sortedPatterns[0];

  // Determine confidence based on sample size and consistency
  const totalSamples = patterns.reduce((sum, p) => sum + p.totalSent, 0);
  let confidence: "high" | "medium" | "low" = "low";

  if (totalSamples >= 20 && bestPattern.totalSent >= 5) {
    confidence = "high";
  } else if (totalSamples >= 10 && bestPattern.totalSent >= 3) {
    confidence = "medium";
  }

  return {
    optimalDay: bestPattern.dayOfWeek,
    optimalHour: bestPattern.hourOfDay,
    confidence,
    expectedResponseRate: Math.round(bestPattern.responseRate),
    timezone,
  };
}

/**
 * Get next optimal follow-up datetime
 */
export async function getNextOptimalFollowUpTime(
  prospectId: number,
  timezone: string = "UTC",
  minHoursFromNow: number = 24
): Promise<Date> {
  const prediction = await predictOptimalFollowUpTime(prospectId, timezone);

  const now = new Date();
  const nextDate = new Date(now);

  // Find next occurrence of optimal day/hour
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  // Calculate days until optimal day
  let daysUntil = prediction.optimalDay - currentDay;
  if (daysUntil < 0) daysUntil += 7; // Next week
  if (daysUntil === 0 && currentHour >= prediction.optimalHour) {
    daysUntil = 7; // Same day but past optimal hour, go to next week
  }

  nextDate.setDate(nextDate.getDate() + daysUntil);
  nextDate.setHours(prediction.optimalHour, 0, 0, 0);

  // Ensure minimum hours from now
  const minDate = new Date(now.getTime() + minHoursFromNow * 60 * 60 * 1000);
  if (nextDate < minDate) {
    // If optimal time is too soon, go to next week
    nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate;
}

/**
 * Get timing analytics for a prospect
 */
export async function getTimingAnalytics(prospectId: number) {
  const db = await getDbInstance();
  const patterns = await db
    .select()
    .from(responsePatterns)
    .where(eq(responsePatterns.prospectId, prospectId));

  if (patterns.length === 0) {
    return {
      hasData: false,
      totalMessages: 0,
      patterns: [],
    };
  }

  const totalMessages = patterns.reduce((sum, p) => sum + p.totalSent, 0);
  const totalResponses = patterns.reduce((sum, p) => sum + p.responseCount, 0);
  const overallResponseRate =
    totalMessages > 0 ? (totalResponses / totalMessages) * 100 : 0;

  // Format patterns for display
  const formattedPatterns = patterns
    .map(p => ({
      day: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][p.dayOfWeek],
      hour: p.hourOfDay,
      sent: p.totalSent,
      responses: p.responseCount,
      responseRate:
        p.totalSent > 0 ? Math.round((p.responseCount / p.totalSent) * 100) : 0,
      avgResponseTime: p.avgResponseTime,
    }))
    .sort((a, b) => b.responseRate - a.responseRate);

  return {
    hasData: true,
    totalMessages,
    totalResponses,
    overallResponseRate: Math.round(overallResponseRate),
    patterns: formattedPatterns,
  };
}

/**
 * Get day name from number
 */
export function getDayName(dayNumber: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayNumber] || "Unknown";
}

/**
 * Format hour for display (12-hour format)
 */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
