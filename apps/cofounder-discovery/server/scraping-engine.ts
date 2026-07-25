/**
 * Enhanced Multi-Platform Scraping Engine
 * Collects co-founder prospects from multiple platforms
 */

export interface ScrapedProfile {
  name: string;
  title?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  industries?: string[];
  lookingFor?: string[];
  startupStage?: string;
  platform: string;
  profileUrl: string;
}

export interface ScrapeResult {
  success: boolean;
  profiles: ScrapedProfile[];
  errors: string[];
  platform: string;
  scrapedAt: Date;
}

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  requestsPerMinute: 10,
  retryAttempts: 3,
  retryDelay: 2000, // ms
};

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts: number = RATE_LIMITS.retryAttempts
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      const delay = RATE_LIMITS.retryDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Extract skills from text using common patterns
 */
function extractSkills(text: string): string[] {
  const skillKeywords = [
    "developer",
    "designer",
    "marketer",
    "sales",
    "product",
    "engineer",
    "frontend",
    "backend",
    "fullstack",
    "mobile",
    "web",
    "ui",
    "ux",
    "business development",
    "growth",
    "marketing",
    "seo",
    "content",
    "data",
    "analytics",
    "finance",
    "operations",
    "strategy",
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of skillKeywords) {
    if (lowerText.includes(skill)) {
      // Capitalize first letter
      found.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }

  return Array.from(new Set(found)); // Remove duplicates
}

/**
 * Extract industries from text
 */
function extractIndustries(text: string): string[] {
  const industryKeywords = [
    "fintech",
    "finance",
    "saas",
    "ecommerce",
    "e-commerce",
    "retail",
    "healthcare",
    "health",
    "education",
    "edtech",
    "marketplace",
    "social",
    "enterprise",
    "b2b",
    "b2c",
    "mobile app",
    "web app",
    "ai",
    "machine learning",
    "blockchain",
    "crypto",
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const industry of industryKeywords) {
    if (lowerText.includes(industry)) {
      found.push(industry.charAt(0).toUpperCase() + industry.slice(1));
    }
  }

  return Array.from(new Set(found));
}

/**
 * Infer experience level from text
 */
function inferExperience(text: string): string {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("10+ years") ||
    lowerText.includes("senior") ||
    lowerText.includes("veteran")
  ) {
    return "10+ years";
  }
  if (lowerText.includes("5-10 years") || lowerText.includes("experienced")) {
    return "5-10 years";
  }
  if (lowerText.includes("3-5 years") || lowerText.includes("mid-level")) {
    return "3-5 years";
  }
  if (
    lowerText.includes("0-2 years") ||
    lowerText.includes("junior") ||
    lowerText.includes("entry")
  ) {
    return "0-2 years";
  }

  return "3-5 years"; // Default
}

/**
 * Detect startup stage from text
 */
function detectStartupStage(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("idea stage") || lowerText.includes("just an idea")) {
    return "Idea";
  }
  if (lowerText.includes("mvp") || lowerText.includes("prototype")) {
    return "MVP";
  }
  if (lowerText.includes("early stage") || lowerText.includes("launched")) {
    return "Early Stage";
  }
  if (lowerText.includes("growth") || lowerText.includes("scaling")) {
    return "Growth";
  }

  return "Idea"; // Default
}

/**
 * Clean and validate scraped data
 */
function cleanProfile(profile: Partial<ScrapedProfile>): ScrapedProfile | null {
  if (!profile.name || !profile.profileUrl) {
    return null;
  }

  return {
    name: profile.name.trim(),
    title: profile.title?.trim(),
    location: profile.location?.trim(),
    bio: profile.bio?.trim(),
    skills: profile.skills || [],
    experience: profile.experience,
    industries: profile.industries || [],
    lookingFor: profile.lookingFor || [],
    startupStage: profile.startupStage,
    platform: profile.platform || "Unknown",
    profileUrl: profile.profileUrl,
  };
}

/**
 * Scrape CoFoundersLab
 * Note: This is a placeholder - actual implementation would use browser automation
 */
export async function scrapeCoFoundersLab(searchParams?: {
  skills?: string[];
  location?: string;
  limit?: number;
}): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: false,
    profiles: [],
    errors: [],
    platform: "CoFoundersLab",
    scrapedAt: new Date(),
  };

  try {
    // In production, this would use browser automation (Playwright/Puppeteer)
    // For demo, we'll simulate the scraping process

    console.log("Scraping CoFoundersLab with params:", searchParams);

    // Simulate API delay
    await sleep(1000);

    // Demo data - in production, this would be real scraped data
    const demoProfiles: Partial<ScrapedProfile>[] = [
      {
        name: "Sarah Chen",
        title: "Full-Stack Developer",
        location: "San Francisco, CA",
        bio: "Experienced full-stack developer with 8 years in SaaS. Looking for a technical co-founder to build the next big thing in fintech.",
        platform: "CoFoundersLab",
        profileUrl: "https://cofounderslab.com/profile/sarah-chen",
      },
      {
        name: "Michael Rodriguez",
        title: "Product Designer",
        location: "New York, NY",
        bio: "Senior product designer passionate about user experience. Seeking business-minded co-founder for health tech startup.",
        platform: "CoFoundersLab",
        profileUrl: "https://cofounderslab.com/profile/michael-rodriguez",
      },
    ];

    // Process and enrich profiles
    for (const profile of demoProfiles) {
      const bio = profile.bio || "";

      const enriched: Partial<ScrapedProfile> = {
        ...profile,
        skills: extractSkills(bio + " " + (profile.title || "")),
        industries: extractIndustries(bio),
        experience: inferExperience(bio),
        startupStage: detectStartupStage(bio),
        lookingFor: ["Co-Founder"], // Default
      };

      const cleaned = cleanProfile(enriched);
      if (cleaned) {
        result.profiles.push(cleaned);
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Scrape FounderCloud
 */
export async function scrapeFounderCloud(searchParams?: {
  industries?: string[];
  location?: string;
  limit?: number;
}): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: false,
    profiles: [],
    errors: [],
    platform: "FounderCloud",
    scrapedAt: new Date(),
  };

  try {
    console.log("Scraping FounderCloud with params:", searchParams);
    await sleep(1000);

    const demoProfiles: Partial<ScrapedProfile>[] = [
      {
        name: "Emily Watson",
        title: "Marketing Strategist",
        location: "Austin, TX",
        bio: "Growth marketer with 6 years experience scaling startups. Looking for technical co-founder for SaaS venture.",
        platform: "FounderCloud",
        profileUrl: "https://foundercloud.com/profile/emily-watson",
      },
    ];

    for (const profile of demoProfiles) {
      const bio = profile.bio || "";
      const enriched: Partial<ScrapedProfile> = {
        ...profile,
        skills: extractSkills(bio + " " + (profile.title || "")),
        industries: extractIndustries(bio),
        experience: inferExperience(bio),
        startupStage: detectStartupStage(bio),
        lookingFor: ["Co-Founder"],
      };

      const cleaned = cleanProfile(enriched);
      if (cleaned) {
        result.profiles.push(cleaned);
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Scrape Y Combinator Co-Founder Matching
 */
export async function scrapeYCombinator(searchParams?: {
  batch?: string;
  limit?: number;
}): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: false,
    profiles: [],
    errors: [],
    platform: "Y Combinator",
    scrapedAt: new Date(),
  };

  try {
    console.log("Scraping Y Combinator with params:", searchParams);
    await sleep(1000);

    const demoProfiles: Partial<ScrapedProfile>[] = [
      {
        name: "David Kim",
        title: "Software Engineer",
        location: "Mountain View, CA",
        bio: "Ex-Google engineer, 10+ years experience. Building AI-powered tools. Seeking business co-founder.",
        platform: "Y Combinator",
        profileUrl: "https://ycombinator.com/cofounder-matching/david-kim",
      },
    ];

    for (const profile of demoProfiles) {
      const bio = profile.bio || "";
      const enriched: Partial<ScrapedProfile> = {
        ...profile,
        skills: extractSkills(bio + " " + (profile.title || "")),
        industries: extractIndustries(bio),
        experience: inferExperience(bio),
        startupStage: detectStartupStage(bio),
        lookingFor: ["Co-Founder"],
      };

      const cleaned = cleanProfile(enriched);
      if (cleaned) {
        result.profiles.push(cleaned);
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Scrape all platforms in parallel
 */
export async function scrapeAllPlatforms(searchParams?: {
  skills?: string[];
  industries?: string[];
  location?: string;
  limit?: number;
}): Promise<{
  results: ScrapeResult[];
  totalProfiles: number;
  successfulPlatforms: number;
}> {
  const results = await Promise.allSettled([
    scrapeCoFoundersLab(searchParams),
    scrapeFounderCloud(searchParams),
    scrapeYCombinator(searchParams),
  ]);

  const scrapeResults: ScrapeResult[] = [];
  let totalProfiles = 0;
  let successfulPlatforms = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      scrapeResults.push(result.value);
      totalProfiles += result.value.profiles.length;
      if (result.value.success) {
        successfulPlatforms++;
      }
    }
  }

  return {
    results: scrapeResults,
    totalProfiles,
    successfulPlatforms,
  };
}

/**
 * Detect and remove duplicate profiles across platforms
 */
export function deduplicateProfiles(
  profiles: ScrapedProfile[]
): ScrapedProfile[] {
  const seen = new Map<string, ScrapedProfile>();

  for (const profile of profiles) {
    // Create a key based on name and location
    const key = `${profile.name.toLowerCase()}-${(profile.location || "").toLowerCase()}`;

    if (!seen.has(key)) {
      seen.set(key, profile);
    } else {
      // If duplicate, prefer the one with more complete data
      const existing = seen.get(key)!;
      const existingFields = Object.values(existing).filter(
        v => v && v !== ""
      ).length;
      const newFields = Object.values(profile).filter(
        v => v && v !== ""
      ).length;

      if (newFields > existingFields) {
        seen.set(key, profile);
      }
    }
  }

  return Array.from(seen.values());
}
