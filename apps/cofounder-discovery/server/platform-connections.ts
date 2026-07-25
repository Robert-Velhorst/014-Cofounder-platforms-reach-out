/**
 * Platform Connections Engine
 * Handles OAuth integration and profile import from LinkedIn and GitHub
 */

import { makeRequest } from "./_core/map";

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  positions?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: Array<{
    name: string;
    endorsements?: number;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
  }>;
}

export interface GitHubProfile {
  id: number;
  login: string;
  name?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  email?: string;
  publicRepos: number;
  followers: number;
  following: number;
  repositories?: Array<{
    name: string;
    description?: string;
    language?: string;
    stars: number;
    forks: number;
  }>;
  topLanguages?: string[];
}

export interface ImportedProfile {
  name?: string;
  location?: string;
  skills: string[];
  experience?: string;
  industries: string[];
  previousRoles: string[];
  bio?: string;
  currentCompany?: string;
  education?: string[];
}

/**
 * Generate LinkedIn OAuth URL
 */
export function getLinkedInAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;

  if (!clientId) {
    throw new Error("LinkedIn OAuth not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email w_member_social",
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Exchange LinkedIn authorization code for access token
 */
export async function exchangeLinkedInCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth not configured");
  }

  const response = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Fetch LinkedIn profile data
 */
export async function fetchLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  // Fetch basic profile
  const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error(
      `LinkedIn profile fetch failed: ${profileResponse.statusText}`
    );
  }

  const profile = await profileResponse.json();

  // Note: Full profile data (positions, skills, education) requires additional API calls
  // and LinkedIn Partner Program access. For demo, we'll use basic profile data.

  return {
    id: profile.sub,
    firstName: profile.given_name || "",
    lastName: profile.family_name || "",
    headline: profile.headline,
    location: profile.locale,
    // Additional fields would be populated with proper LinkedIn API access
  };
}

/**
 * Generate GitHub OAuth URL
 */
export function getGitHubAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    throw new Error("GitHub OAuth not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "read:user user:email",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange GitHub authorization code for access token
 */
export async function exchangeGitHubCode(
  code: string
): Promise<{ accessToken: string }> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth not configured");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `GitHub OAuth error: ${data.error_description || data.error}`
    );
  }

  return {
    accessToken: data.access_token,
  };
}

/**
 * Fetch GitHub profile data
 */
export async function fetchGitHubProfile(
  accessToken: string
): Promise<GitHubProfile> {
  // Fetch user profile
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) {
    throw new Error(`GitHub profile fetch failed: ${userResponse.statusText}`);
  }

  const user = await userResponse.json();

  // Fetch repositories
  const reposResponse = await fetch(
    `https://api.github.com/users/${user.login}/repos?sort=updated&per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  let repositories: any[] = [];
  let topLanguages: string[] = [];

  if (reposResponse.ok) {
    repositories = await reposResponse.json();

    // Extract top languages
    const languageCounts: Record<string, number> = {};
    repositories.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] =
          (languageCounts[repo.language] || 0) + 1;
      }
    });

    topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);
  }

  return {
    id: user.id,
    login: user.login,
    name: user.name,
    bio: user.bio,
    location: user.location,
    company: user.company,
    blog: user.blog,
    email: user.email,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    repositories: repositories.map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
    })),
    topLanguages,
  };
}

/**
 * Import profile data from LinkedIn
 */
export function importFromLinkedIn(
  linkedinProfile: LinkedInProfile
): Partial<ImportedProfile> {
  const imported: Partial<ImportedProfile> = {
    name: `${linkedinProfile.firstName} ${linkedinProfile.lastName}`.trim(),
    location: linkedinProfile.location,
    skills: [],
    industries: [],
    previousRoles: [],
    education: [],
  };

  // Extract skills
  if (linkedinProfile.skills) {
    imported.skills = linkedinProfile.skills.map(s => s.name);
  }

  // Extract industry
  if (linkedinProfile.industry) {
    imported.industries = [linkedinProfile.industry];
  }

  // Extract experience level from positions
  if (linkedinProfile.positions && linkedinProfile.positions.length > 0) {
    const totalYears = linkedinProfile.positions.reduce((sum, pos) => {
      // Simplified calculation - in production would parse dates properly
      return sum + 2; // Assume 2 years per position as placeholder
    }, 0);

    if (totalYears < 3) {
      imported.experience = "Junior";
    } else if (totalYears < 7) {
      imported.experience = "Mid-level";
    } else {
      imported.experience = "Senior";
    }

    // Extract previous roles
    imported.previousRoles = linkedinProfile.positions.map(p => p.title);

    // Get current company
    const currentPosition = linkedinProfile.positions.find(p => !p.endDate);
    if (currentPosition) {
      imported.currentCompany = currentPosition.company;
    }
  }

  // Extract education
  if (linkedinProfile.education) {
    imported.education = linkedinProfile.education.map(edu =>
      `${edu.degree || ""} ${edu.field || ""} - ${edu.school}`.trim()
    );
  }

  // Use headline as bio
  if (linkedinProfile.headline) {
    imported.bio = linkedinProfile.headline;
  }

  return imported;
}

/**
 * Import profile data from GitHub
 */
export function importFromGitHub(
  githubProfile: GitHubProfile
): Partial<ImportedProfile> {
  const imported: Partial<ImportedProfile> = {
    skills: [],
    industries: [],
    previousRoles: [],
  };

  // Extract technical skills from languages
  if (githubProfile.topLanguages) {
    imported.skills = githubProfile.topLanguages;
  }

  // Infer experience level from activity
  if (githubProfile.publicRepos > 50 || githubProfile.followers > 100) {
    imported.experience = "Senior";
  } else if (githubProfile.publicRepos > 20 || githubProfile.followers > 20) {
    imported.experience = "Mid-level";
  } else {
    imported.experience = "Junior";
  }

  // Use bio
  if (githubProfile.bio) {
    imported.bio = githubProfile.bio;
  }

  // Use location
  if (githubProfile.location) {
    imported.location = githubProfile.location;
  }

  // Use company
  if (githubProfile.company) {
    imported.currentCompany = githubProfile.company.replace("@", "");
  }

  // Infer industry as Developer Tools/Tech
  imported.industries = ["Developer Tools", "Technology"];

  return imported;
}

/**
 * Merge imported profiles with existing user profile
 */
export function mergeImportedProfiles(
  existing: Partial<ImportedProfile>,
  linkedin?: Partial<ImportedProfile>,
  github?: Partial<ImportedProfile>
): ImportedProfile {
  const merged: ImportedProfile = {
    name: existing.name,
    location: existing.location,
    skills: existing.skills || [],
    experience: existing.experience,
    industries: existing.industries || [],
    previousRoles: existing.previousRoles || [],
    bio: existing.bio,
    currentCompany: existing.currentCompany,
    education: existing.education,
  };

  // Merge LinkedIn data (priority)
  if (linkedin) {
    merged.name = linkedin.name || merged.name;
    merged.location = linkedin.location || merged.location;
    merged.experience = linkedin.experience || merged.experience;
    merged.bio = linkedin.bio || merged.bio;
    merged.currentCompany = linkedin.currentCompany || merged.currentCompany;

    if (linkedin.skills && linkedin.skills.length > 0) {
      merged.skills = Array.from(
        new Set([...merged.skills, ...linkedin.skills])
      );
    }

    if (linkedin.industries && linkedin.industries.length > 0) {
      merged.industries = Array.from(
        new Set([...merged.industries, ...linkedin.industries])
      );
    }

    if (linkedin.previousRoles && linkedin.previousRoles.length > 0) {
      merged.previousRoles = Array.from(
        new Set([...merged.previousRoles, ...linkedin.previousRoles])
      );
    }

    if (linkedin.education) {
      merged.education = linkedin.education;
    }
  }

  // Merge GitHub data (adds technical skills)
  if (github) {
    merged.location = merged.location || github.location;
    merged.bio = merged.bio || github.bio;
    merged.currentCompany = merged.currentCompany || github.currentCompany;

    if (github.skills && github.skills.length > 0) {
      merged.skills = Array.from(new Set([...merged.skills, ...github.skills]));
    }

    if (github.industries && github.industries.length > 0) {
      merged.industries = Array.from(
        new Set([...merged.industries, ...github.industries])
      );
    }
  }

  return merged;
}
