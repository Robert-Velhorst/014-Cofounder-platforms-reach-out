import type { Prospect } from "../drizzle/schema";

/**
 * Enhanced AI Matching Engine
 * Multi-dimensional compatibility scoring system with semantic skill matching
 */

import { calculateSemanticSkillScore } from "./semantic-matching";

export interface EnrichedProspect {
  skills: string[];
  industries: string[];
  experience: string;
  lookingFor: string[];
  startupStage: string;
  location: string;
  enrichmentData?: {
    linkedin?: {
      skills?: Array<{ name: string; endorsements: number }>;
      currentPosition?: { title: string; company: string };
      experience?: Array<{ title: string; company: string }>;
    };
    github?: {
      topLanguages?: string[];
      publicRepos?: number;
    };
    company?: {
      industry?: string;
    };
  };
}

export interface UserProfile {
  skills: string[];
  industries: string[];
  experience: string;
  lookingFor: string[];
  startupStage: string;
  location: string;
  timezone?: string;
  commitment?: string;
  workStyle?: string[];
  values?: string[];
  remotePreference?: string;
}

export interface CompatibilityScore {
  overall: number;
  breakdown: {
    skills: number;
    industries: number;
    experience: number;
    goals: number;
    location: number;
    workStyle: number;
    commitment: number;
  };
  highlights: string[];
  concerns: string[];
}

/**
 * Weights for different compatibility dimensions
 * Total should equal 100
 */
const WEIGHTS = {
  skills: 25,
  industries: 20,
  goals: 20,
  experience: 15,
  location: 10,
  workStyle: 5,
  commitment: 5,
};

/**
 * Extract enriched skills from prospect data
 */
function extractEnrichedSkills(prospect: EnrichedProspect): string[] {
  const skills = new Set<string>(prospect.skills || []);

  // Add LinkedIn skills
  if (prospect.enrichmentData?.linkedin?.skills) {
    prospect.enrichmentData.linkedin.skills.forEach(skill => {
      skills.add(skill.name);
    });
  }

  // Add GitHub languages as technical skills
  if (prospect.enrichmentData?.github?.topLanguages) {
    prospect.enrichmentData.github.topLanguages.forEach(lang => {
      skills.add(lang);
    });
  }

  return Array.from(skills);
}

/**
 * Extract enriched industries from prospect data
 */
function extractEnrichedIndustries(prospect: EnrichedProspect): string[] {
  const industries = new Set<string>(prospect.industries || []);

  // Add company industry
  if (prospect.enrichmentData?.company?.industry) {
    industries.add(prospect.enrichmentData.company.industry);
  }

  return Array.from(industries);
}

/**
 * Calculate skill complementarity score with semantic matching
 * Higher score when skills complement each other
 */
function calculateSkillScore(
  userSkills: string[],
  prospectSkills: string[]
): number {
  if (!userSkills?.length || !prospectSkills?.length) return 50;

  // Use semantic matching to find exact, similar, and complementary skills
  const semanticResult = calculateSemanticSkillScore(
    userSkills,
    prospectSkills
  );

  // Calculate traditional overlap for comparison
  const userSet = new Set(userSkills.map(s => s.toLowerCase()));
  const prospectSet = new Set(prospectSkills.map(s => s.toLowerCase()));
  const overlappingSkills = Array.from(prospectSet).filter(skill =>
    userSet.has(skill)
  );

  // Combine semantic score with complementary bonus
  const semanticScore = semanticResult.score;
  const complementaryBonus =
    (semanticResult.complementarySkills.length / prospectSkills.length) * 20;
  const overlapPenalty =
    overlappingSkills.length > prospectSkills.length * 0.7 ? -10 : 0;

  const finalScore = Math.min(
    100,
    Math.max(0, semanticScore + complementaryBonus + overlapPenalty)
  );

  return Math.round(finalScore);
}

/**
 * Calculate industry alignment score
 */
function calculateIndustryScore(
  userIndustries: string[],
  prospectIndustries: string[]
): number {
  if (!userIndustries?.length || !prospectIndustries?.length) return 50;

  const userSet = new Set(userIndustries.map(i => i.toLowerCase()));
  const prospectSet = new Set(prospectIndustries.map(i => i.toLowerCase()));

  const matches = Array.from(prospectSet).filter(industry =>
    userSet.has(industry)
  );

  // Perfect match: 100%, partial match: proportional
  const matchRatio =
    matches.length / Math.max(userIndustries.length, prospectIndustries.length);
  return matchRatio * 100;
}

/**
 * Calculate experience level compatibility
 */
function calculateExperienceScore(
  userExp: string,
  prospectExp: string
): number {
  if (!userExp || !prospectExp) return 50;

  const expLevels: Record<string, number> = {
    "0-2 years": 1,
    "3-5 years": 2,
    "5-10 years": 3,
    "10+ years": 4,
  };

  const userLevel = expLevels[userExp] || 2;
  const prospectLevel = expLevels[prospectExp] || 2;

  // Ideal: similar experience levels (within 1 level)
  const diff = Math.abs(userLevel - prospectLevel);

  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 60;
  return 40;
}

/**
 * Calculate goal alignment score
 */
function calculateGoalScore(
  userGoals: string[],
  prospectGoals: string[]
): number {
  if (!userGoals?.length || !prospectGoals?.length) return 50;

  const userSet = new Set(userGoals.map(g => g.toLowerCase()));
  const prospectSet = new Set(prospectGoals.map(g => g.toLowerCase()));

  // Check if prospect is looking for what user offers
  const matches = Array.from(prospectSet).filter(goal => userSet.has(goal));

  const matchRatio =
    matches.length / Math.max(userGoals.length, prospectGoals.length);
  return matchRatio * 100;
}

/**
 * Calculate location compatibility
 */
function calculateLocationScore(
  userLocation: string,
  prospectLocation: string,
  userRemote?: string,
  prospectRemote?: string
): number {
  // If both prefer remote, perfect match
  if (userRemote === "Remote" && prospectRemote === "Remote") return 100;

  // If locations not specified, assume moderate compatibility
  if (!userLocation || !prospectLocation) return 60;

  const userLoc = userLocation.toLowerCase();
  const prospectLoc = prospectLocation.toLowerCase();

  // Same city/region: high score
  if (userLoc === prospectLoc) return 100;

  // Same country: moderate score
  const userCountry = userLoc.split(",").pop()?.trim();
  const prospectCountry = prospectLoc.split(",").pop()?.trim();
  if (userCountry === prospectCountry) return 70;

  // Different locations but one is remote: good score
  if (userRemote === "Remote" || prospectRemote === "Remote") return 80;

  // Different locations, not remote: lower score
  return 40;
}

/**
 * Calculate work style compatibility
 */
function calculateWorkStyleScore(
  userStyle: string[],
  prospectStyle: string[]
): number {
  if (!userStyle?.length || !prospectStyle?.length) return 50;

  const userSet = new Set(userStyle.map(s => s.toLowerCase()));
  const prospectSet = new Set(prospectStyle.map(s => s.toLowerCase()));

  const matches = Array.from(prospectSet).filter(style => userSet.has(style));
  const matchRatio =
    matches.length / Math.max(userStyle.length, prospectStyle.length);

  return matchRatio * 100;
}

/**
 * Calculate commitment level compatibility
 */
function calculateCommitmentScore(
  userCommitment?: string,
  prospectCommitment?: string
): number {
  if (!userCommitment || !prospectCommitment) return 50;

  // Exact match is ideal
  if (userCommitment === prospectCommitment) return 100;

  // Full-time vs Part-time mismatch
  return 30;
}

/**
 * Generate compatibility highlights
 */
function generateHighlights(
  user: UserProfile,
  prospect: Prospect,
  scores: CompatibilityScore["breakdown"]
): string[] {
  const highlights: string[] = [];

  if (scores.skills >= 80) {
    highlights.push("Highly complementary skill sets");
  }

  if (scores.industries >= 80) {
    highlights.push("Strong industry alignment");
  }

  if (scores.experience >= 80) {
    highlights.push("Similar experience levels");
  }

  if (scores.goals >= 80) {
    highlights.push("Aligned startup goals");
  }

  if (scores.location >= 80) {
    highlights.push("Compatible location/remote preferences");
  }

  return highlights;
}

/**
 * Generate compatibility concerns
 */
function generateConcerns(
  user: UserProfile,
  prospect: Prospect,
  scores: CompatibilityScore["breakdown"]
): string[] {
  const concerns: string[] = [];

  if (scores.skills < 50) {
    concerns.push("Limited skill complementarity");
  }

  if (scores.industries < 50) {
    concerns.push("Different industry focus");
  }

  if (scores.experience < 50) {
    concerns.push("Significant experience gap");
  }

  if (scores.location < 50) {
    concerns.push("Location mismatch without remote option");
  }

  return concerns;
}

/**
 * Main compatibility calculation function
 */
export function calculateCompatibility(
  user: UserProfile,
  prospect: Prospect | EnrichedProspect
): CompatibilityScore {
  // Extract enriched data if available
  const prospectSkills =
    "enrichmentData" in prospect
      ? extractEnrichedSkills(prospect as EnrichedProspect)
      : prospect.skills || [];

  const prospectIndustries =
    "enrichmentData" in prospect
      ? extractEnrichedIndustries(prospect as EnrichedProspect)
      : prospect.industries || [];

  // Calculate individual dimension scores
  const skillScore = calculateSkillScore(user.skills, prospectSkills);
  const industryScore = calculateIndustryScore(
    user.industries,
    prospectIndustries
  );
  const experienceScore = calculateExperienceScore(
    user.experience,
    prospect.experience || ""
  );
  const goalScore = calculateGoalScore(
    user.lookingFor,
    prospect.lookingFor || []
  );
  const locationScore = calculateLocationScore(
    user.location,
    prospect.location || "",
    user.remotePreference,
    undefined // Prospect remote preference would need to be added to schema
  );
  const workStyleScore = calculateWorkStyleScore(user.workStyle || [], []);
  const commitmentScore = calculateCommitmentScore(user.commitment, undefined);

  // Calculate weighted overall score
  const overall = Math.round(
    (skillScore * WEIGHTS.skills +
      industryScore * WEIGHTS.industries +
      goalScore * WEIGHTS.goals +
      experienceScore * WEIGHTS.experience +
      locationScore * WEIGHTS.location +
      workStyleScore * WEIGHTS.workStyle +
      commitmentScore * WEIGHTS.commitment) /
      100
  );

  const breakdown = {
    skills: Math.round(skillScore),
    industries: Math.round(industryScore),
    experience: Math.round(experienceScore),
    goals: Math.round(goalScore),
    location: Math.round(locationScore),
    workStyle: Math.round(workStyleScore),
    commitment: Math.round(commitmentScore),
  };

  const highlights = generateHighlights(user, prospect as Prospect, breakdown);
  const concerns = generateConcerns(user, prospect as Prospect, breakdown);

  return {
    overall,
    breakdown,
    highlights,
    concerns,
  };
}

/**
 * Batch calculate compatibility for multiple prospects
 */
export function batchCalculateCompatibility(
  user: UserProfile,
  prospects: Prospect[]
): Array<{ prospect: Prospect; score: CompatibilityScore }> {
  return prospects
    .map(prospect => ({
      prospect,
      score: calculateCompatibility(user, prospect),
    }))
    .sort((a, b) => b.score.overall - a.score.overall);
}
