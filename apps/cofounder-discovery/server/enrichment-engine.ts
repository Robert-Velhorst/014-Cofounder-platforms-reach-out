import { callDataApi } from "./_core/dataApi";

/**
 * Prospect Enrichment Engine
 * Automatically enhances prospect profiles with LinkedIn, GitHub, and company data
 */

export interface EnrichmentResult {
  success: boolean;
  enrichedFields: string[];
  errors: string[];
  source: "linkedin" | "github" | "company" | "combined";
  confidence: number; // 0-100
  timestamp: Date;
}

export interface LinkedInEnrichment {
  headline?: string;
  summary?: string;
  location?: string;
  currentPosition?: {
    title: string;
    company: string;
    duration: string;
  };
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    years: string;
  }>;
  skills?: Array<{
    name: string;
    endorsements: number;
  }>;
  profilePicture?: string;
  linkedInUrl?: string;
}

export interface GitHubEnrichment {
  username?: string;
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  email?: string;
  blog?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  topLanguages?: string[];
  topRepositories?: Array<{
    name: string;
    description?: string;
    stars: number;
    language?: string;
    url: string;
  }>;
  contributions?: number;
  githubUrl?: string;
}

export interface CompanyEnrichment {
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  founded?: string;
  headquarters?: string;
  specialties?: string[];
  employeeCount?: number;
  linkedInUrl?: string;
  crunchbaseUrl?: string;
}

export interface EnrichedProspect {
  originalData: any;
  linkedin?: LinkedInEnrichment;
  github?: GitHubEnrichment;
  company?: CompanyEnrichment;
  enrichmentScore: number; // 0-100, how complete the enrichment is
  lastEnriched: Date;
}

/**
 * Extract LinkedIn username from various URL formats
 */
function extractLinkedInUsername(url: string): string | null {
  if (!url) return null;

  // Handle various LinkedIn URL formats
  const patterns = [
    /linkedin\.com\/in\/([^\/\?]+)/,
    /linkedin\.com\/pub\/([^\/\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // If it's just a username without URL
  if (!url.includes("/") && !url.includes(".")) {
    return url;
  }

  return null;
}

/**
 * Extract GitHub username from various formats
 */
function extractGitHubUsername(url: string): string | null {
  if (!url) return null;

  // Handle various GitHub URL formats
  const patterns = [/github\.com\/([^\/\?]+)/, /github\.io\/([^\/\?]+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] !== "orgs") return match[1];
  }

  // If it's just a username
  if (!url.includes("/") && !url.includes(".")) {
    return url;
  }

  return null;
}

/**
 * Enrich prospect with LinkedIn data
 */
export async function enrichWithLinkedIn(
  linkedInUrl: string
): Promise<LinkedInEnrichment | null> {
  try {
    const username = extractLinkedInUsername(linkedInUrl);
    if (!username) {
      console.log("Could not extract LinkedIn username from:", linkedInUrl);
      return null;
    }

    console.log(`Enriching with LinkedIn data for: ${username}`);

    const response: any = await callDataApi(
      "LinkedIn/get_user_profile_by_username",
      {
        query: { username },
      }
    );

    if (!response || response.success === false) {
      console.log("LinkedIn API returned no data");
      return null;
    }

    // Extract relevant fields
    const enrichment: LinkedInEnrichment = {
      headline: response.headline,
      summary: response.summary,
      location: response.geo?.full,
      profilePicture: response.profilePicture,
      linkedInUrl: `https://www.linkedin.com/in/${username}`,
    };

    // Current position
    if (response.position && response.position.length > 0) {
      const current = response.position[0];
      enrichment.currentPosition = {
        title: current.title,
        company: current.companyName,
        duration: `${current.start?.year || ""} - ${current.end?.year || "Present"}`,
      };
    }

    // Experience
    if (response.position && response.position.length > 0) {
      enrichment.experience = response.position.slice(0, 5).map((pos: any) => ({
        title: pos.title,
        company: pos.companyName,
        duration: `${pos.start?.year || ""} - ${pos.end?.year || "Present"}`,
        description: pos.description,
      }));
    }

    // Education
    if (response.educations && response.educations.length > 0) {
      enrichment.education = response.educations.map((edu: any) => ({
        school: edu.schoolName,
        degree: edu.degree,
        field: edu.fieldOfStudy,
        years: `${edu.start?.year || ""} - ${edu.end?.year || ""}`,
      }));
    }

    // Skills
    if (response.skills && response.skills.length > 0) {
      enrichment.skills = response.skills
        .sort(
          (a: any, b: any) =>
            (b.endorsementsCount || 0) - (a.endorsementsCount || 0)
        )
        .slice(0, 10)
        .map((skill: any) => ({
          name: skill.name,
          endorsements: skill.endorsementsCount || 0,
        }));
    }

    console.log(`LinkedIn enrichment successful for ${username}`);
    return enrichment;
  } catch (error) {
    console.error("LinkedIn enrichment error:", error);
    return null;
  }
}

/**
 * Enrich prospect with GitHub data
 */
export async function enrichWithGitHub(
  githubUrl: string
): Promise<GitHubEnrichment | null> {
  try {
    const username = extractGitHubUsername(githubUrl);
    if (!username) {
      console.log("Could not extract GitHub username from:", githubUrl);
      return null;
    }

    console.log(`Enriching with GitHub data for: ${username}`);

    // Fetch user profile
    const userResponse = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CoFounder-Discovery-Platform",
        },
      }
    );

    if (!userResponse.ok) {
      console.log(`GitHub API error: ${userResponse.status}`);
      return null;
    }

    const userData = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CoFounder-Discovery-Platform",
        },
      }
    );

    const repos = reposResponse.ok ? await reposResponse.json() : [];

    // Extract top languages from repositories
    const languages = new Map<string, number>();
    repos.forEach((repo: any) => {
      if (repo.language) {
        languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
      }
    });

    const topLanguages = Array.from(languages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    const enrichment: GitHubEnrichment = {
      username: userData.login,
      name: userData.name,
      bio: userData.bio,
      company: userData.company,
      location: userData.location,
      email: userData.email,
      blog: userData.blog,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      topLanguages,
      githubUrl: userData.html_url,
    };

    // Top repositories
    if (repos.length > 0) {
      enrichment.topRepositories = repos.slice(0, 5).map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        url: repo.html_url,
      }));
    }

    console.log(`GitHub enrichment successful for ${username}`);
    return enrichment;
  } catch (error) {
    console.error("GitHub enrichment error:", error);
    return null;
  }
}

/**
 * Enrich with company data
 */
export async function enrichWithCompanyData(
  companyName: string
): Promise<CompanyEnrichment | null> {
  try {
    console.log(`Enriching with company data for: ${companyName}`);

    const response: any = await callDataApi("LinkedIn/get_company_details", {
      query: { username: companyName.toLowerCase().replace(/\s+/g, "-") },
    });

    if (!response || !response.success) {
      console.log("Company API returned no data");
      return null;
    }

    const data = response.data;

    const enrichment: CompanyEnrichment = {
      name: data.name,
      description: data.description,
      website: data.website,
      industry: data.industries?.[0],
      size: data.staffCountRange,
      headquarters: data.headquarter?.city || data.headquarter?.country,
      specialties: data.specialities,
      employeeCount: data.staffCount,
      linkedInUrl: data.linkedinUrl,
      crunchbaseUrl: data.crunchbaseUrl,
    };

    console.log(`Company enrichment successful for ${companyName}`);
    return enrichment;
  } catch (error) {
    console.error("Company enrichment error:", error);
    return null;
  }
}

/**
 * Calculate enrichment score based on available data
 */
function calculateEnrichmentScore(enriched: EnrichedProspect): number {
  let score = 0;
  let maxScore = 0;

  // LinkedIn scoring (40 points max)
  if (enriched.linkedin) {
    maxScore += 40;
    if (enriched.linkedin.headline) score += 5;
    if (enriched.linkedin.summary) score += 5;
    if (enriched.linkedin.location) score += 5;
    if (enriched.linkedin.currentPosition) score += 10;
    if (enriched.linkedin.experience && enriched.linkedin.experience.length > 0)
      score += 5;
    if (enriched.linkedin.education && enriched.linkedin.education.length > 0)
      score += 5;
    if (enriched.linkedin.skills && enriched.linkedin.skills.length > 0)
      score += 5;
  }

  // GitHub scoring (30 points max)
  if (enriched.github) {
    maxScore += 30;
    if (enriched.github.bio) score += 5;
    if (enriched.github.location) score += 5;
    if (enriched.github.publicRepos && enriched.github.publicRepos > 0)
      score += 5;
    if (enriched.github.topLanguages && enriched.github.topLanguages.length > 0)
      score += 5;
    if (
      enriched.github.topRepositories &&
      enriched.github.topRepositories.length > 0
    )
      score += 10;
  }

  // Company scoring (30 points max)
  if (enriched.company) {
    maxScore += 30;
    if (enriched.company.description) score += 10;
    if (enriched.company.industry) score += 5;
    if (enriched.company.size) score += 5;
    if (enriched.company.website) score += 5;
    if (enriched.company.specialties && enriched.company.specialties.length > 0)
      score += 5;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Enrich a prospect with all available data sources
 */
export async function enrichProspect(
  prospect: any,
  options: {
    linkedInUrl?: string;
    githubUrl?: string;
    companyName?: string;
  }
): Promise<EnrichedProspect> {
  console.log(`Starting enrichment for prospect: ${prospect.name}`);

  const enriched: EnrichedProspect = {
    originalData: prospect,
    enrichmentScore: 0,
    lastEnriched: new Date(),
  };

  const enrichmentPromises: Promise<void>[] = [];

  // LinkedIn enrichment
  if (options.linkedInUrl) {
    enrichmentPromises.push(
      enrichWithLinkedIn(options.linkedInUrl).then(data => {
        if (data) enriched.linkedin = data;
      })
    );
  }

  // GitHub enrichment
  if (options.githubUrl) {
    enrichmentPromises.push(
      enrichWithGitHub(options.githubUrl).then(data => {
        if (data) enriched.github = data;
      })
    );
  }

  // Company enrichment
  if (options.companyName) {
    enrichmentPromises.push(
      enrichWithCompanyData(options.companyName).then(data => {
        if (data) enriched.company = data;
      })
    );
  }

  // Wait for all enrichments to complete
  await Promise.allSettled(enrichmentPromises);

  // Calculate enrichment score
  enriched.enrichmentScore = calculateEnrichmentScore(enriched);

  console.log(`Enrichment completed with score: ${enriched.enrichmentScore}`);
  return enriched;
}

/**
 * Merge enriched data into prospect record
 */
export function mergeEnrichmentData(
  prospect: any,
  enrichment: EnrichedProspect
): any {
  const merged = { ...prospect };

  // Merge LinkedIn data
  if (enrichment.linkedin) {
    if (enrichment.linkedin.headline && !merged.title) {
      merged.title = enrichment.linkedin.headline;
    }
    if (enrichment.linkedin.summary && !merged.bio) {
      merged.bio = enrichment.linkedin.summary;
    }
    if (enrichment.linkedin.location && !merged.location) {
      merged.location = enrichment.linkedin.location;
    }
    if (
      enrichment.linkedin.skills &&
      (!merged.skills || merged.skills.length === 0)
    ) {
      merged.skills = enrichment.linkedin.skills.map(s => s.name);
    }
    if (enrichment.linkedin.currentPosition) {
      merged.currentRole = enrichment.linkedin.currentPosition.title;
      merged.currentCompany = enrichment.linkedin.currentPosition.company;
    }
  }

  // Merge GitHub data
  if (enrichment.github) {
    if (enrichment.github.bio && !merged.bio) {
      merged.bio = enrichment.github.bio;
    }
    if (enrichment.github.location && !merged.location) {
      merged.location = enrichment.github.location;
    }
    if (
      enrichment.github.topLanguages &&
      (!merged.skills || merged.skills.length === 0)
    ) {
      merged.skills = enrichment.github.topLanguages;
    }
    merged.githubRepos = enrichment.github.publicRepos;
    merged.githubFollowers = enrichment.github.followers;
  }

  // Merge company data
  if (enrichment.company) {
    merged.companyInfo = {
      name: enrichment.company.name,
      description: enrichment.company.description,
      industry: enrichment.company.industry,
      size: enrichment.company.size,
      website: enrichment.company.website,
    };
  }

  // Add enrichment metadata
  merged.enrichmentScore = enrichment.enrichmentScore;
  merged.lastEnriched = enrichment.lastEnriched;
  merged.enrichmentData = {
    linkedin: enrichment.linkedin,
    github: enrichment.github,
    company: enrichment.company,
  };

  return merged;
}
