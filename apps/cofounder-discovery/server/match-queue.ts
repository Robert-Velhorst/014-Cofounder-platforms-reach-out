/**
 * Match Queue Management System
 * Handles deduplication, status tracking, and match lifecycle
 */

import { getDb } from "./db";
import { matches, prospects, campaigns } from "../drizzle/schema";
import { eq, and, inArray, notInArray, sql, desc, gte } from "drizzle-orm";
import {
  calculateCompatibility,
  type UserProfile,
  type CompatibilityScore,
} from "./matching-engine";

export interface QueuedMatch {
  prospectId: number;
  prospect: any;
  compatibilityScore: CompatibilityScore;
  campaignId?: number;
}

/**
 * Get all prospect IDs that have already been matched for a user
 * Includes all statuses except 'rejected' prospects outside cooldown period
 */
export async function getMatchedProspectIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get all matched prospects (excluding old rejected ones past cooldown)
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - 90); // 90 day cooldown

  const matchedProspects = await db
    .select({ prospectId: matches.prospectId })
    .from(matches)
    .where(
      and(
        eq(matches.userId, userId),
        // Include all statuses, but for rejected ones, only if within cooldown period
        sql`(${matches.status} != 'rejected' OR ${matches.rejectedAt} >= ${cooldownDate})`
      )
    );

  return matchedProspects.map(m => m.prospectId);
}

/**
 * Get uncontacted prospects for a user
 * Excludes prospects that have already been matched
 */
export async function getUncontactedProspects(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get already matched prospect IDs
  const matchedIds = await getMatchedProspectIds(userId);

  // Get prospects that haven't been matched yet
  let query = db.select().from(prospects).orderBy(desc(prospects.importedAt));

  if (matchedIds.length > 0) {
    query = query.where(notInArray(prospects.id, matchedIds)) as any;
  }

  if (limit) {
    query = query.limit(limit) as any;
  }

  return await query;
}

/**
 * Check if a prospect has already been matched for a user
 */
export async function isProspectMatched(
  userId: number,
  prospectId: number
): Promise<boolean> {
  const matchedIds = await getMatchedProspectIds(userId);
  return matchedIds.includes(prospectId);
}

/**
 * Score all uncontacted prospects for a user
 * Returns prospects sorted by compatibility score (highest first)
 */
export async function scoreAllProspects(
  userId: number,
  userProfile: UserProfile,
  campaignId?: number,
  limit?: number
): Promise<QueuedMatch[]> {
  // Get uncontacted prospects
  const uncontactedProspects = await getUncontactedProspects(userId, limit);

  if (uncontactedProspects.length === 0) {
    return [];
  }

  // Calculate compatibility for each prospect
  const scoredMatches: QueuedMatch[] = uncontactedProspects.map(prospect => {
    const compatibilityScore = calculateCompatibility(userProfile, prospect);

    return {
      prospectId: prospect.id,
      prospect,
      compatibilityScore,
      campaignId,
    };
  });

  // Sort by overall score (highest first) - greedy algorithm
  scoredMatches.sort(
    (a, b) => b.compatibilityScore.overall - a.compatibilityScore.overall
  );

  return scoredMatches;
}

/**
 * Select top N matches using greedy algorithm
 * Prioritizes highest compatibility scores first (99% → 98% → 97%...)
 * Applies diversity filter to avoid clustering
 */
export async function selectTopNMatches(
  scoredMatches: QueuedMatch[],
  n: number,
  minScore: number = 70
): Promise<QueuedMatch[]> {
  // Filter by minimum score
  const qualifiedMatches = scoredMatches.filter(
    m => m.compatibilityScore.overall >= minScore
  );

  if (qualifiedMatches.length === 0) {
    return [];
  }

  // Apply diversity filter: avoid too many from same company/location
  const selected: QueuedMatch[] = [];
  const companyCount: Record<string, number> = {};
  const locationCount: Record<string, number> = {};

  for (const match of qualifiedMatches) {
    if (selected.length >= n) break;

    const company = match.prospect.currentCompany || "unknown";
    const location = match.prospect.location || "unknown";

    // Limit: max 2 prospects from same company, max 3 from same location
    const companyLimit = 2;
    const locationLimit = 3;

    if (
      (companyCount[company] || 0) < companyLimit &&
      (locationCount[location] || 0) < locationLimit
    ) {
      selected.push(match);
      companyCount[company] = (companyCount[company] || 0) + 1;
      locationCount[location] = (locationCount[location] || 0) + 1;
    }
  }

  // If we still need more and diversity filter was too strict, add remaining
  if (selected.length < n) {
    for (const match of qualifiedMatches) {
      if (selected.length >= n) break;
      if (!selected.includes(match)) {
        selected.push(match);
      }
    }
  }

  return selected;
}

/**
 * Create matches in the database with initial status
 * Status depends on campaign automation mode
 */
export async function createMatches(
  userId: number,
  queuedMatches: QueuedMatch[],
  automationMode: "fully_automatic" | "semi_automatic" | "manual"
): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Determine initial status based on automation mode
  let initialStatus: "discovered" | "queued" | "approved";
  if (automationMode === "fully_automatic") {
    initialStatus = "approved"; // Ready to contact immediately
  } else if (automationMode === "semi_automatic") {
    initialStatus = "queued"; // Needs approval
  } else {
    initialStatus = "discovered"; // Manual review
  }

  const matchIds: number[] = [];

  for (const queuedMatch of queuedMatches) {
    const result = await db.insert(matches).values({
      userId,
      prospectId: queuedMatch.prospectId,
      campaignId: queuedMatch.campaignId,
      overallScore: queuedMatch.compatibilityScore.overall,
      skillsScore: queuedMatch.compatibilityScore.breakdown.skills,
      industryScore: queuedMatch.compatibilityScore.breakdown.industries,
      visionScore: queuedMatch.compatibilityScore.breakdown.goals,
      workStyleScore: queuedMatch.compatibilityScore.breakdown.workStyle,
      locationScore: queuedMatch.compatibilityScore.breakdown.location,
      reasoning: queuedMatch.compatibilityScore.highlights.join("; "),
      recommendations: queuedMatch.compatibilityScore.highlights,
      status: initialStatus,
      lastScoredAt: new Date(),
    });

    matchIds.push(Number((result as any).insertId));
  }

  return matchIds;
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: number,
  status: string,
  additionalData?: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const updateData: any = { status };

  // Set appropriate timestamp based on status
  if (status === "approved") {
    updateData.approvedAt = new Date();
  } else if (status === "rejected") {
    updateData.rejectedAt = new Date();
  } else if (status === "contacted") {
    updateData.contactedAt = new Date();
  } else if (status === "responded") {
    updateData.responseReceivedAt = new Date();
  } else if (status === "meeting_scheduled") {
    updateData.meetingScheduledAt = new Date();
  } else if (status === "partnership_formed") {
    updateData.partnershipFormedAt = new Date();
  }

  // Merge additional data
  Object.assign(updateData, additionalData);

  await db.update(matches).set(updateData).where(eq(matches.id, matchId));
}

/**
 * Get matches by status for a user
 */
export async function getMatchesByStatus(
  userId: number,
  status: string | string[],
  campaignId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const statusArray = Array.isArray(status) ? status : [status];

  const conditions = [
    eq(matches.userId, userId),
    inArray(matches.status, statusArray as any),
  ];

  if (campaignId) {
    conditions.push(eq(matches.campaignId, campaignId));
  }

  const query = db
    .select({
      match: matches,
      prospect: prospects,
    })
    .from(matches)
    .leftJoin(prospects, eq(matches.prospectId, prospects.id))
    .where(and(...conditions))
    .orderBy(desc(matches.matchedAt));

  return await query;
}

/**
 * Get approval queue count for a user
 */
export async function getApprovalQueueCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(and(eq(matches.userId, userId), eq(matches.status, "queued")));

  return result[0]?.count || 0;
}
