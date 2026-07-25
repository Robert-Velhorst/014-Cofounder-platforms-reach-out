/**
 * Semantic Skill Matching Engine
 * Uses fuzzy matching and skill taxonomy to understand skill relationships
 */

// Skill taxonomy: groups of related skills
const SKILL_TAXONOMY: Record<string, string[]> = {
  // Frontend
  frontend: [
    "react",
    "vue",
    "angular",
    "svelte",
    "next.js",
    "nuxt",
    "frontend",
    "ui",
    "ux",
    "css",
    "html",
    "javascript",
    "typescript",
    "tailwind",
    "bootstrap",
  ],

  // Backend
  backend: [
    "node.js",
    "express",
    "fastify",
    "nest.js",
    "python",
    "django",
    "flask",
    "ruby",
    "rails",
    "php",
    "laravel",
    "java",
    "spring",
    "go",
    "rust",
    "backend",
    "api",
  ],

  // Mobile
  mobile: [
    "react native",
    "flutter",
    "swift",
    "kotlin",
    "ios",
    "android",
    "mobile",
    "app development",
  ],

  // Data & ML
  data_ml: [
    "machine learning",
    "deep learning",
    "ai",
    "data science",
    "python",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "pandas",
    "numpy",
    "ml",
    "nlp",
    "computer vision",
  ],

  // DevOps
  devops: [
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "ci/cd",
    "jenkins",
    "github actions",
    "terraform",
    "ansible",
    "devops",
    "cloud",
  ],

  // Database
  database: [
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "elasticsearch",
    "database",
    "db",
    "nosql",
  ],

  // Design
  design: [
    "figma",
    "sketch",
    "adobe xd",
    "photoshop",
    "illustrator",
    "ui/ux",
    "design",
    "branding",
    "graphic design",
    "product design",
  ],

  // Business
  business: [
    "product management",
    "project management",
    "agile",
    "scrum",
    "marketing",
    "sales",
    "business development",
    "strategy",
    "analytics",
  ],
};

// Common skill aliases
const SKILL_ALIASES: Record<string, string[]> = {
  react: ["reactjs", "react.js"],
  vue: ["vuejs", "vue.js"],
  "node.js": ["nodejs", "node"],
  "next.js": ["nextjs", "next"],
  "machine learning": ["ml", "ai"],
  "deep learning": ["dl", "neural networks"],
  "ui/ux": ["ui", "ux", "user experience", "user interface"],
  "product management": ["pm", "product manager"],
  javascript: ["js"],
  typescript: ["ts"],
};

/**
 * Normalize skill name for comparison
 */
function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#]/g, "");
}

/**
 * Check if two skills are aliases of each other
 */
function areSkillsAliases(skill1: string, skill2: string): boolean {
  const norm1 = skill1.toLowerCase().trim();
  const norm2 = skill2.toLowerCase().trim();

  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const allForms = [canonical, ...aliases];
    if (allForms.includes(norm1) && allForms.includes(norm2)) {
      return true;
    }
  }

  return false;
}

/**
 * Find which category a skill belongs to
 */
function getSkillCategory(skill: string): string | null {
  const normalized = skill.toLowerCase().trim();

  for (const [category, skills] of Object.entries(SKILL_TAXONOMY)) {
    // Check for exact match or if skill contains category keyword
    if (
      skills.some(s => {
        const normS = s.toLowerCase();
        return (
          normalized === normS ||
          normalized.includes(normS) ||
          normS.includes(normalized) ||
          // Check word boundaries
          new RegExp(`\\b${normS}\\b`, "i").test(normalized)
        );
      })
    ) {
      return category;
    }
  }

  return null;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate semantic similarity between two skills
 * Returns a score from 0-100
 */
export function calculateSkillSimilarity(
  skill1: string,
  skill2: string
): number {
  const norm1 = skill1.toLowerCase().trim();
  const norm2 = skill2.toLowerCase().trim();

  // Exact match
  if (norm1 === norm2) return 100;

  // Check aliases
  if (areSkillsAliases(skill1, skill2)) return 95;

  // Check if they're in the same category
  const cat1 = getSkillCategory(skill1);
  const cat2 = getSkillCategory(skill2);

  if (cat1 && cat2 && cat1 === cat2) {
    // Same category gets base score of 75
    const distance = levenshteinDistance(
      normalizeSkill(skill1),
      normalizeSkill(skill2)
    );
    const maxLen = Math.max(skill1.length, skill2.length);
    const fuzzyScore = Math.max(0, 100 - (distance / maxLen) * 100);

    // Combine category bonus with fuzzy score
    return Math.round(Math.min(90, 75 + fuzzyScore * 0.15));
  }

  // Different categories or no category, use fuzzy matching
  const distance = levenshteinDistance(
    normalizeSkill(skill1),
    normalizeSkill(skill2)
  );
  const maxLen = Math.max(skill1.length, skill2.length);
  const similarity = Math.max(0, 100 - (distance / maxLen) * 100);

  return Math.round(similarity);
}

/**
 * Find semantically similar skills from a list
 */
export function findSimilarSkills(
  targetSkill: string,
  skillList: string[],
  threshold: number = 70
): Array<{ skill: string; similarity: number }> {
  const similarities = skillList.map(skill => ({
    skill,
    similarity: calculateSkillSimilarity(targetSkill, skill),
  }));

  return similarities
    .filter(({ similarity }) => similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate semantic skill match score between two skill sets
 * Returns enhanced score that accounts for semantic similarity
 */
export function calculateSemanticSkillScore(
  userSkills: string[],
  prospectSkills: string[]
): {
  score: number;
  exactMatches: string[];
  semanticMatches: Array<{
    userSkill: string;
    prospectSkill: string;
    similarity: number;
  }>;
  complementarySkills: string[];
} {
  if (!userSkills?.length || !prospectSkills?.length) {
    return {
      score: 50,
      exactMatches: [],
      semanticMatches: [],
      complementarySkills: prospectSkills,
    };
  }

  const exactMatches: string[] = [];
  const semanticMatches: Array<{
    userSkill: string;
    prospectSkill: string;
    similarity: number;
  }> = [];
  const matchedProspectSkills = new Set<string>();

  // Find exact matches first
  for (const userSkill of userSkills) {
    for (const prospectSkill of prospectSkills) {
      if (userSkill.toLowerCase() === prospectSkill.toLowerCase()) {
        exactMatches.push(prospectSkill);
        matchedProspectSkills.add(prospectSkill);
      }
    }
  }

  // Find semantic matches for non-exact matches
  for (const userSkill of userSkills) {
    let bestMatch: { skill: string; similarity: number } | null = null;

    for (const prospectSkill of prospectSkills) {
      // Skip if already exactly matched
      if (matchedProspectSkills.has(prospectSkill)) continue;

      const similarity = calculateSkillSimilarity(userSkill, prospectSkill);

      // Consider it a semantic match if similarity >= 70%
      if (
        similarity >= 70 &&
        (!bestMatch || similarity > bestMatch.similarity)
      ) {
        bestMatch = { skill: prospectSkill, similarity };
      }
    }

    if (bestMatch) {
      semanticMatches.push({
        userSkill,
        prospectSkill: bestMatch.skill,
        similarity: bestMatch.similarity,
      });
      matchedProspectSkills.add(bestMatch.skill);
    }
  }

  // Complementary skills are those not matched
  const complementarySkills = prospectSkills.filter(
    skill => !matchedProspectSkills.has(skill)
  );

  // Calculate score
  // Exact matches: highest weight
  // Semantic matches: weighted by similarity
  // Complementary skills: bonus for diversity
  const exactMatchScore = (exactMatches.length / prospectSkills.length) * 100;
  const semanticMatchScore = semanticMatches.reduce(
    (sum, match) => sum + match.similarity / prospectSkills.length,
    0
  );
  const complementaryBonus = Math.min(
    30,
    (complementarySkills.length / prospectSkills.length) * 30
  );

  const totalScore = Math.min(
    100,
    exactMatchScore * 0.5 + semanticMatchScore * 0.3 + complementaryBonus
  );

  return {
    score: Math.round(totalScore),
    exactMatches,
    semanticMatches,
    complementarySkills,
  };
}

/**
 * Batch calculate semantic similarities for multiple skill pairs
 */
export function batchCalculateSkillSimilarities(
  skillPairs: Array<{ skill1: string; skill2: string }>
): number[] {
  return skillPairs.map(({ skill1, skill2 }) =>
    calculateSkillSimilarity(skill1, skill2)
  );
}
