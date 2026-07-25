import { invokeLLM } from "./_core/llm";

/**
 * Profile Analysis and Data Extraction Engine
 * Enhances prospect data with AI-powered analysis
 */

export interface ProfileAnalysis {
  completeness: number;
  quality: number;
  strengths: string[];
  gaps: string[];
  suggestedImprovements: string[];
}

export interface ExtractedData {
  skills: string[];
  industries: string[];
  experience: string;
  startupStage: string;
  lookingFor: string[];
  location?: string;
  confidence: number;
}

/**
 * Skill taxonomy for normalization
 */
const SKILL_TAXONOMY: Record<string, string[]> = {
  Developer: [
    "developer",
    "programmer",
    "coder",
    "software engineer",
    "engineer",
  ],
  Designer: ["designer", "ui", "ux", "product designer", "graphic designer"],
  Marketer: ["marketer", "marketing", "growth", "seo", "content marketing"],
  Sales: ["sales", "business development", "bd", "account executive"],
  "Product Manager": ["product manager", "pm", "product", "product owner"],
  "Data Scientist": [
    "data scientist",
    "data analyst",
    "machine learning",
    "ml",
    "ai",
  ],
  DevOps: ["devops", "infrastructure", "cloud", "aws", "kubernetes"],
  "Mobile Developer": ["mobile", "ios", "android", "react native", "flutter"],
  "Frontend Developer": ["frontend", "front-end", "react", "vue", "angular"],
  "Backend Developer": ["backend", "back-end", "api", "server", "node"],
  "Full-Stack Developer": ["fullstack", "full-stack", "full stack"],
};

/**
 * Industry taxonomy for categorization
 */
const INDUSTRY_TAXONOMY: Record<string, string[]> = {
  FinTech: [
    "fintech",
    "finance",
    "banking",
    "payments",
    "crypto",
    "blockchain",
  ],
  HealthTech: ["healthtech", "health", "medical", "healthcare", "wellness"],
  EdTech: ["edtech", "education", "learning", "training", "e-learning"],
  "E-commerce": [
    "ecommerce",
    "e-commerce",
    "retail",
    "shopping",
    "marketplace",
  ],
  SaaS: ["saas", "software", "b2b", "enterprise", "platform"],
  Consumer: ["consumer", "b2c", "mobile app", "social", "entertainment"],
  "Web/Mobile App": ["web app", "mobile app", "app", "application"],
  "AI/ML": [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "deep learning",
  ],
  IoT: ["iot", "internet of things", "hardware", "embedded"],
  CleanTech: [
    "cleantech",
    "clean energy",
    "sustainability",
    "green",
    "renewable",
  ],
};

/**
 * Normalize skills using taxonomy
 */
export function normalizeSkills(rawSkills: string[]): string[] {
  const normalized = new Set<string>();

  for (const rawSkill of rawSkills) {
    const lowerSkill = rawSkill.toLowerCase().trim();

    // Find matching canonical skill
    for (const [canonical, variants] of Object.entries(SKILL_TAXONOMY)) {
      if (variants.some(variant => lowerSkill.includes(variant))) {
        normalized.add(canonical);
        break;
      }
    }

    // If no match found, keep original (capitalized)
    if (
      normalized.size === 0 ||
      !Array.from(normalized).some(s => s.toLowerCase() === lowerSkill)
    ) {
      normalized.add(rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1));
    }
  }

  return Array.from(normalized);
}

/**
 * Categorize industries using taxonomy
 */
export function categorizeIndustries(rawIndustries: string[]): string[] {
  const categorized = new Set<string>();

  for (const rawIndustry of rawIndustries) {
    const lowerIndustry = rawIndustry.toLowerCase().trim();

    // Find matching canonical industry
    for (const [canonical, variants] of Object.entries(INDUSTRY_TAXONOMY)) {
      if (variants.some(variant => lowerIndustry.includes(variant))) {
        categorized.add(canonical);
        break;
      }
    }

    // If no match found, keep original (capitalized)
    if (categorized.size === 0) {
      categorized.add(
        rawIndustry.charAt(0).toUpperCase() + rawIndustry.slice(1)
      );
    }
  }

  return Array.from(categorized);
}

/**
 * Infer experience level from text
 */
export function inferExperienceLevel(text: string): string {
  const lowerText = text.toLowerCase();

  const patterns = [
    {
      level: "10+ years",
      keywords: [
        "10+ years",
        "10 years",
        "decade",
        "senior",
        "veteran",
        "expert",
        "lead",
      ],
    },
    {
      level: "5-10 years",
      keywords: [
        "5-10 years",
        "5 years",
        "experienced",
        "mid-level",
        "intermediate",
      ],
    },
    {
      level: "3-5 years",
      keywords: ["3-5 years", "3 years", "4 years", "professional"],
    },
    {
      level: "0-2 years",
      keywords: [
        "0-2 years",
        "1 year",
        "2 years",
        "junior",
        "entry",
        "recent graduate",
        "new",
      ],
    },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
      return pattern.level;
    }
  }

  return "3-5 years"; // Default
}

/**
 * Detect startup stage from text
 */
export function detectStartupStage(text: string): string {
  const lowerText = text.toLowerCase();

  const stages = [
    {
      stage: "Idea",
      keywords: ["idea", "concept", "planning", "brainstorming"],
    },
    { stage: "MVP", keywords: ["mvp", "prototype", "beta", "minimum viable"] },
    {
      stage: "Early Stage",
      keywords: ["early stage", "launched", "live", "customers", "traction"],
    },
    {
      stage: "Growth",
      keywords: ["growth", "scaling", "expanding", "series a", "funded"],
    },
  ];

  for (const { stage, keywords } of stages) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return stage;
    }
  }

  return "Idea"; // Default
}

/**
 * Extract structured data from unstructured profile text using AI
 */
export async function extractProfileData(
  profileText: string
): Promise<ExtractedData> {
  const prompt = `Extract structured information from this co-founder profile:

"${profileText}"

Extract and return ONLY a JSON object with these fields:
{
  "skills": ["list of skills"],
  "industries": ["list of industries"],
  "experience": "experience level (0-2 years, 3-5 years, 5-10 years, or 10+ years)",
  "startupStage": "startup stage (Idea, MVP, Early Stage, or Growth)",
  "lookingFor": ["what they're looking for in a co-founder"],
  "location": "location if mentioned, otherwise null"
}

Be specific and extract only information explicitly stated or strongly implied.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting structured data from unstructured text. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format");
    }

    const extracted = JSON.parse(content);

    // Normalize and categorize
    const normalized: ExtractedData = {
      skills: normalizeSkills(extracted.skills || []),
      industries: categorizeIndustries(extracted.industries || []),
      experience: extracted.experience || "3-5 years",
      startupStage: extracted.startupStage || "Idea",
      lookingFor: extracted.lookingFor || [],
      location: extracted.location || undefined,
      confidence: 85, // AI extraction confidence
    };

    return normalized;
  } catch (error) {
    console.error("Failed to extract profile data with AI:", error);

    // Fallback to rule-based extraction
    return {
      skills: normalizeSkills([]),
      industries: categorizeIndustries([]),
      experience: inferExperienceLevel(profileText),
      startupStage: detectStartupStage(profileText),
      lookingFor: ["Co-Founder"],
      confidence: 50,
    };
  }
}

/**
 * Analyze profile completeness and quality
 */
export function analyzeProfile(profile: {
  name?: string;
  title?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  industries?: string[];
  lookingFor?: string[];
  startupStage?: string;
}): ProfileAnalysis {
  let completeness = 0;
  let quality = 0;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const suggestedImprovements: string[] = [];

  // Check completeness (each field worth 10-15 points)
  if (profile.name) completeness += 10;
  else gaps.push("Missing name");

  if (profile.title) {
    completeness += 10;
    if (profile.title.length > 10) quality += 5;
  } else {
    gaps.push("Missing title/headline");
  }

  if (profile.location) {
    completeness += 10;
  } else {
    gaps.push("Missing location");
  }

  if (profile.bio) {
    completeness += 15;
    if (profile.bio.length > 100) {
      quality += 10;
      strengths.push("Detailed bio");
    } else {
      suggestedImprovements.push(
        "Expand bio with more details about experience and goals"
      );
    }
  } else {
    gaps.push("Missing bio");
    suggestedImprovements.push(
      "Add a bio describing your background and what you're looking for"
    );
  }

  if (profile.skills && profile.skills.length > 0) {
    completeness += 15;
    if (profile.skills.length >= 3) {
      quality += 10;
      strengths.push("Multiple skills listed");
    } else {
      suggestedImprovements.push("Add more skills to showcase your expertise");
    }
  } else {
    gaps.push("Missing skills");
  }

  if (profile.experience) {
    completeness += 10;
    quality += 5;
  } else {
    gaps.push("Missing experience level");
  }

  if (profile.industries && profile.industries.length > 0) {
    completeness += 10;
    if (profile.industries.length >= 2) {
      quality += 5;
      strengths.push("Multiple industry interests");
    }
  } else {
    gaps.push("Missing industry focus");
  }

  if (profile.lookingFor && profile.lookingFor.length > 0) {
    completeness += 10;
    quality += 10;
    strengths.push("Clear about what they're looking for");
  } else {
    gaps.push("Missing what they're looking for");
    suggestedImprovements.push(
      "Specify what type of co-founder you're seeking"
    );
  }

  if (profile.startupStage) {
    completeness += 10;
    quality += 5;
  } else {
    gaps.push("Missing startup stage");
  }

  // Calculate final quality score (0-100)
  quality += completeness / 2; // Completeness contributes to quality

  return {
    completeness: Math.min(100, completeness),
    quality: Math.min(100, quality),
    strengths,
    gaps,
    suggestedImprovements,
  };
}

/**
 * Enrich profile data with additional inferred information
 */
export async function enrichProfileData(profile: {
  bio?: string;
  title?: string;
  skills?: string[];
  industries?: string[];
}): Promise<{
  inferredSkills: string[];
  inferredIndustries: string[];
  inferredExperience: string;
  inferredStartupStage: string;
  confidence: number;
}> {
  const text = [profile.bio, profile.title].filter(Boolean).join(" ");

  if (!text) {
    return {
      inferredSkills: [],
      inferredIndustries: [],
      inferredExperience: "3-5 years",
      inferredStartupStage: "Idea",
      confidence: 0,
    };
  }

  // Extract additional data from text
  const extracted = await extractProfileData(text);

  // Merge with existing data
  const allSkills = [...(profile.skills || []), ...extracted.skills];
  const allIndustries = [
    ...(profile.industries || []),
    ...extracted.industries,
  ];

  return {
    inferredSkills: normalizeSkills(allSkills),
    inferredIndustries: categorizeIndustries(allIndustries),
    inferredExperience: extracted.experience,
    inferredStartupStage: extracted.startupStage,
    confidence: extracted.confidence,
  };
}

/**
 * Calculate profile quality score
 */
export function calculateProfileQuality(profile: {
  name?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  industries?: string[];
  experience?: string;
  lookingFor?: string[];
}): number {
  const analysis = analyzeProfile(profile);
  return analysis.quality;
}
