/**
 * AI Preference Learning System
 * Learns user preferences from "Not Interested" feedback
 */

import { getDb } from "./db";
import { prospects, matches } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface UserFeedback {
  userId: number;
  prospectId: number;
  feedbackType: "not_interested" | "interested" | "contacted";
  reason?: string;
  timestamp: Date;
}

export interface LearnedPreferences {
  userId: number;
  // Negative preferences (avoid these)
  avoidSkills: string[];
  avoidIndustries: string[];
  avoidLocations: string[];
  avoidExperienceLevels: string[];
  // Positive preferences (prefer these)
  preferSkills: string[];
  preferIndustries: string[];
  preferLocations: string[];
  preferExperienceLevels: string[];
  // Thresholds
  minCompatibilityScore: number;
  minEnrichmentScore: number;
}

/**
 * Record user feedback on a prospect
 */
export async function recordUserFeedback(
  feedback: UserFeedback
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update match status based on feedback
  await db
    .update(matches)
    .set({
      status:
        feedback.feedbackType === "not_interested"
          ? "not_interested"
          : feedback.feedbackType === "contacted"
            ? "contacted"
            : "viewed",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(matches.userId, feedback.userId),
        eq(matches.prospectId, feedback.prospectId)
      )
    );

  console.log(
    `[PREFERENCE-LEARNING] Recorded ${feedback.feedbackType} feedback for prospect ${feedback.prospectId}`
  );
}

/**
 * Analyze user feedback to learn preferences
 */
export async function learnUserPreferences(
  userId: number
): Promise<LearnedPreferences> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all matches with feedback
  const userMatches = await db
    .select({
      matchId: matches.id,
      prospectId: matches.prospectId,
      status: matches.status,
      overallScore: matches.overallScore,
      prospect: prospects,
    })
    .from(matches)
    .innerJoin(prospects, eq(matches.prospectId, prospects.id))
    .where(eq(matches.userId, userId));

  // Separate into rejected and accepted/contacted
  const rejectedMatches = userMatches.filter(
    m => m.status === "not_interested"
  );
  const positiveMatches = userMatches.filter(
    m => m.status === "contacted" || m.status === "interested"
  );

  // Extract patterns from rejected matches
  const avoidSkills = new Set<string>();
  const avoidIndustries = new Set<string>();
  const avoidLocations = new Set<string>();
  const avoidExperienceLevels = new Set<string>();

  for (const match of rejectedMatches) {
    const prospect = match.prospect;
    if (prospect.skills) {
      (prospect.skills as string[]).forEach(skill => avoidSkills.add(skill));
    }
    if (prospect.industries) {
      (prospect.industries as string[]).forEach(industry =>
        avoidIndustries.add(industry)
      );
    }
    if (prospect.location) {
      avoidLocations.add(prospect.location);
    }
    if (prospect.experience) {
      avoidExperienceLevels.add(prospect.experience);
    }
  }

  // Extract patterns from positive matches
  const preferSkills = new Set<string>();
  const preferIndustries = new Set<string>();
  const preferLocations = new Set<string>();
  const preferExperienceLevels = new Set<string>();

  for (const match of positiveMatches) {
    const prospect = match.prospect;
    if (prospect.skills) {
      (prospect.skills as string[]).forEach(skill => preferSkills.add(skill));
    }
    if (prospect.industries) {
      (prospect.industries as string[]).forEach(industry =>
        preferIndustries.add(industry)
      );
    }
    if (prospect.location) {
      preferLocations.add(prospect.location);
    }
    if (prospect.experience) {
      preferExperienceLevels.add(prospect.experience);
    }
  }

  // Calculate minimum thresholds
  const rejectedScores = rejectedMatches.map(m => m.overallScore || 0);
  const minCompatibilityScore =
    rejectedScores.length > 0
      ? Math.max(...rejectedScores) + 5 // Set threshold above highest rejected score
      : 70; // Default threshold

  const preferences: LearnedPreferences = {
    userId,
    avoidSkills: Array.from(avoidSkills),
    avoidIndustries: Array.from(avoidIndustries),
    avoidLocations: Array.from(avoidLocations),
    avoidExperienceLevels: Array.from(avoidExperienceLevels),
    preferSkills: Array.from(preferSkills),
    preferIndustries: Array.from(preferIndustries),
    preferLocations: Array.from(preferLocations),
    preferExperienceLevels: Array.from(preferExperienceLevels),
    minCompatibilityScore,
    minEnrichmentScore: 50, // Default threshold
  };

  console.log(`[PREFERENCE-LEARNING] Learned preferences for user ${userId}:`, {
    avoidCount:
      preferences.avoidSkills.length + preferences.avoidIndustries.length,
    preferCount:
      preferences.preferSkills.length + preferences.preferIndustries.length,
    minScore: preferences.minCompatibilityScore,
  });

  return preferences;
}

/**
 * Apply learned preferences to filter prospects
 */
export async function applyPreferenceFilter(
  userId: number,
  prospectIds: number[]
): Promise<number[]> {
  if (prospectIds.length === 0) return [];

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const preferences = await learnUserPreferences(userId);

  // Get prospect details
  const prospectDetails = await db
    .select()
    .from(prospects)
    .where(inArray(prospects.id, prospectIds));

  // Filter prospects based on learned preferences
  const filteredProspects = prospectDetails.filter(prospect => {
    // Check if prospect has avoided attributes
    const hasAvoidedSkill = preferences.avoidSkills.some(skill =>
      ((prospect.skills as string[]) || []).includes(skill)
    );
    const hasAvoidedIndustry = preferences.avoidIndustries.some(industry =>
      ((prospect.industries as string[]) || []).includes(industry)
    );
    const hasAvoidedLocation = preferences.avoidLocations.includes(
      prospect.location || ""
    );
    const hasAvoidedExperience = preferences.avoidExperienceLevels.includes(
      prospect.experience || ""
    );

    // Skip if has too many avoided attributes
    const avoidCount = [
      hasAvoidedSkill,
      hasAvoidedIndustry,
      hasAvoidedLocation,
      hasAvoidedExperience,
    ].filter(Boolean).length;

    if (avoidCount >= 2) {
      console.log(
        `[PREFERENCE-LEARNING] Filtering out prospect ${prospect.id} (${avoidCount} avoided attributes)`
      );
      return false;
    }

    // Check enrichment quality
    if (
      prospect.enrichmentScore &&
      prospect.enrichmentScore < preferences.minEnrichmentScore
    ) {
      console.log(
        `[PREFERENCE-LEARNING] Filtering out prospect ${prospect.id} (low enrichment: ${prospect.enrichmentScore}%)`
      );
      return false;
    }

    return true;
  });

  return filteredProspects.map(p => p.id);
}

/**
 * Get preference insights for user dashboard
 */
export async function getPreferenceInsights(userId: number): Promise<{
  totalFeedback: number;
  rejectedCount: number;
  contactedCount: number;
  topAvoidedSkills: string[];
  topPreferredSkills: string[];
  filteringEnabled: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userMatches = await db
    .select({
      status: matches.status,
    })
    .from(matches)
    .where(eq(matches.userId, userId));

  const rejectedCount = userMatches.filter(
    m => m.status === "not_interested"
  ).length;
  const contactedCount = userMatches.filter(
    m => m.status === "contacted"
  ).length;

  const preferences = await learnUserPreferences(userId);

  return {
    totalFeedback: userMatches.length,
    rejectedCount,
    contactedCount,
    topAvoidedSkills: preferences.avoidSkills.slice(0, 5),
    topPreferredSkills: preferences.preferSkills.slice(0, 5),
    filteringEnabled: rejectedCount >= 3, // Enable after 3+ rejections
  };
}
