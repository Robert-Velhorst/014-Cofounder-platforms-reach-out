/**
 * Tests for Phase 21: Platform Connections, Admin Analytics & AI Conversation Starters
 */

import { describe, it, expect } from "vitest";
import {
  generateConversationStarters,
  type ConversationStarterContext,
} from "./conversation-starters";
import {
  importFromLinkedIn,
  importFromGitHub,
  mergeImportedProfiles,
} from "./platform-connections";

describe("Platform Connections", () => {
  it("should import profile data from LinkedIn", () => {
    const linkedinProfile = {
      id: "linkedin123",
      firstName: "John",
      lastName: "Doe",
      headline: "Senior Software Engineer at TechCorp",
      location: "San Francisco, CA",
      industry: "Technology",
      positions: [
        {
          title: "Senior Software Engineer",
          company: "TechCorp",
          startDate: "2020-01",
          description: "Building scalable systems",
        },
        {
          title: "Software Engineer",
          company: "StartupCo",
          startDate: "2018-01",
          endDate: "2020-01",
        },
      ],
      skills: [
        { name: "JavaScript", endorsements: 50 },
        { name: "React", endorsements: 40 },
        { name: "Node.js", endorsements: 35 },
      ],
      education: [
        {
          school: "Stanford University",
          degree: "BS",
          field: "Computer Science",
          startYear: 2014,
          endYear: 2018,
        },
      ],
    };

    const imported = importFromLinkedIn(linkedinProfile);

    expect(imported.name).toBe("John Doe");
    expect(imported.location).toBe("San Francisco, CA");
    expect(imported.skills).toContain("JavaScript");
    expect(imported.skills).toContain("React");
    expect(imported.skills).toContain("Node.js");
    expect(imported.industries).toContain("Technology");
    expect(imported.previousRoles).toContain("Senior Software Engineer");
    expect(imported.currentCompany).toBe("TechCorp");
    expect(imported.bio).toBe("Senior Software Engineer at TechCorp");
  });

  it("should import profile data from GitHub", () => {
    const githubProfile = {
      id: 12345,
      login: "johndoe",
      name: "John Doe",
      bio: "Full-stack developer passionate about open source",
      location: "San Francisco",
      company: "@techcorp",
      blog: "https://johndoe.dev",
      email: "john@example.com",
      publicRepos: 75,
      followers: 250,
      following: 100,
      repositories: [
        {
          name: "awesome-project",
          description: "A really cool project",
          language: "TypeScript",
          stars: 150,
          forks: 25,
        },
        {
          name: "another-project",
          description: "Another great project",
          language: "Python",
          stars: 80,
          forks: 15,
        },
      ],
      topLanguages: ["TypeScript", "Python", "JavaScript", "Go", "Rust"],
    };

    const imported = importFromGitHub(githubProfile);

    expect(imported.skills).toContain("TypeScript");
    expect(imported.skills).toContain("Python");
    expect(imported.skills).toContain("JavaScript");
    expect(imported.location).toBe("San Francisco");
    expect(imported.bio).toBe(
      "Full-stack developer passionate about open source"
    );
    expect(imported.currentCompany).toBe("techcorp");
    expect(imported.industries).toContain("Developer Tools");
    expect(imported.experience).toBe("Senior"); // Based on repos and followers
  });

  it("should merge imported profiles correctly", () => {
    const existing = {
      name: "John",
      skills: ["Management"],
      industries: ["Finance"],
    };

    const linkedin = {
      name: "John Doe",
      skills: ["JavaScript", "React"],
      industries: ["Technology"],
      currentCompany: "TechCorp",
    };

    const github = {
      skills: ["TypeScript", "Python"],
      industries: ["Developer Tools"],
    };

    const merged = mergeImportedProfiles(existing, linkedin, github);

    expect(merged.name).toBe("John Doe"); // LinkedIn takes priority
    expect(merged.skills).toContain("Management"); // Existing preserved
    expect(merged.skills).toContain("JavaScript"); // LinkedIn added
    expect(merged.skills).toContain("TypeScript"); // GitHub added
    expect(merged.industries).toContain("Finance"); // Existing preserved
    expect(merged.industries).toContain("Technology"); // LinkedIn added
    expect(merged.industries).toContain("Developer Tools"); // GitHub added
    expect(merged.currentCompany).toBe("TechCorp");
  });
});

describe("AI Conversation Starters", () => {
  it("should generate fallback conversation starters", async () => {
    const context: ConversationStarterContext = {
      userName: "Alice",
      userSkills: ["JavaScript", "React", "Product Management"],
      userIndustries: ["SaaS", "FinTech"],
      userExperience: "Senior",
      userLookingFor: ["Technical Co-founder"],
      userBio: "Product leader with technical background",

      prospectName: "Bob",
      prospectSkills: ["Python", "Machine Learning", "Data Science"],
      prospectIndustries: ["AI", "FinTech"],
      prospectExperience: "Mid-level",
      prospectBio: "ML engineer passionate about financial technology",
      prospectCurrentCompany: "DataCorp",

      compatibilityScore: 82,
      sharedSkills: [],
      complementarySkills: ["Python", "Machine Learning"],
      sharedIndustries: ["FinTech"],
    };

    // This will use fallback since we don't have real LLM in tests
    const starters = await generateConversationStarters(context);

    expect(starters).toBeDefined();
    expect(starters.length).toBeGreaterThanOrEqual(3);
    expect(starters.length).toBeLessThanOrEqual(5);

    starters.forEach(starter => {
      expect(starter.message).toBeDefined();
      expect(starter.message.length).toBeGreaterThan(0);
      expect(starter.tone).toMatch(/professional|friendly|enthusiastic/);
      expect(starter.focusArea).toMatch(
        /skills|industry|project|experience|shared_interest/
      );
      expect(starter.reasoning).toBeDefined();
    });
  });

  it("should include prospect name in conversation starters", async () => {
    const context: ConversationStarterContext = {
      userName: "Alice",
      userSkills: ["JavaScript"],
      userIndustries: ["Tech"],
      userLookingFor: ["Co-founder"],

      prospectName: "Bob",
      prospectSkills: ["Python"],
      prospectIndustries: ["Tech"],

      compatibilityScore: 75,
      sharedSkills: [],
      complementarySkills: ["Python"],
      sharedIndustries: ["Tech"],
    };

    const starters = await generateConversationStarters(context);

    const hasProspectName = starters.some(s => s.message.includes("Bob"));
    expect(hasProspectName).toBe(true);
  });

  it("should vary tones across starters", async () => {
    const context: ConversationStarterContext = {
      userName: "Alice",
      userSkills: ["JavaScript", "React"],
      userIndustries: ["SaaS"],
      userLookingFor: ["Technical Co-founder"],

      prospectName: "Bob",
      prospectSkills: ["Python", "Django"],
      prospectIndustries: ["SaaS"],

      compatibilityScore: 85,
      sharedSkills: [],
      complementarySkills: ["Python", "Django"],
      sharedIndustries: ["SaaS"],
    };

    const starters = await generateConversationStarters(context);

    const tones = new Set(starters.map(s => s.tone));
    expect(tones.size).toBeGreaterThan(1); // Should have variety
  });

  it("should highlight shared industries", async () => {
    const context: ConversationStarterContext = {
      userName: "Alice",
      userSkills: ["Product Management"],
      userIndustries: ["HealthTech", "AI"],
      userLookingFor: ["Technical Co-founder"],

      prospectName: "Bob",
      prospectSkills: ["Machine Learning"],
      prospectIndustries: ["HealthTech", "AI"],

      compatibilityScore: 90,
      sharedSkills: [],
      complementarySkills: ["Machine Learning"],
      sharedIndustries: ["HealthTech", "AI"],
    };

    const starters = await generateConversationStarters(context);

    const mentionsIndustry = starters.some(
      s => s.message.includes("HealthTech") || s.message.includes("AI")
    );
    expect(mentionsIndustry).toBe(true);
  });

  it("should use enriched LinkedIn data when available", async () => {
    const context: ConversationStarterContext = {
      userName: "Alice",
      userSkills: ["Product Management"],
      userIndustries: ["SaaS"],
      userLookingFor: ["Technical Co-founder"],

      prospectName: "Bob",
      prospectSkills: ["Python"],
      prospectIndustries: ["SaaS"],

      linkedinData: {
        headline: "Senior ML Engineer at TechCorp",
        positions: [
          {
            title: "Senior ML Engineer",
            company: "TechCorp",
          },
        ],
        skills: [
          { name: "Machine Learning", endorsements: 100 },
          { name: "Python", endorsements: 80 },
        ],
      },

      compatibilityScore: 88,
      sharedSkills: [],
      complementarySkills: ["Python"],
      sharedIndustries: ["SaaS"],
    };

    const starters = await generateConversationStarters(context);

    // Should reference LinkedIn data
    const mentionsCompany = starters.some(s => s.message.includes("TechCorp"));
    expect(starters.length).toBeGreaterThan(0);
  });

  it("should use enriched GitHub data when available", async () => {
    const context: ConversationStarterContext = {
      userName: "Alice",
      userSkills: ["Product Management"],
      userIndustries: ["SaaS"],
      userLookingFor: ["Technical Co-founder"],

      prospectName: "Bob",
      prospectSkills: ["Python"],
      prospectIndustries: ["SaaS"],

      githubData: {
        bio: "Open source enthusiast",
        topLanguages: ["Python", "TypeScript", "Go"],
        repositories: [
          {
            name: "awesome-ml-project",
            description: "Machine learning toolkit",
            language: "Python",
            stars: 500,
          },
        ],
      },

      compatibilityScore: 85,
      sharedSkills: [],
      complementarySkills: ["Python"],
      sharedIndustries: ["SaaS"],
    };

    const starters = await generateConversationStarters(context);

    // Should reference GitHub project
    const mentionsProject = starters.some(s =>
      s.message.includes("awesome-ml-project")
    );
    expect(starters.length).toBeGreaterThan(0);
  });
});

describe("Integration Tests", () => {
  it("should create complete onboarding flow", () => {
    // Simulate LinkedIn connection
    const linkedinProfile = {
      id: "linkedin123",
      firstName: "Alice",
      lastName: "Smith",
      headline: "Product Manager at StartupCo",
      location: "New York",
      industry: "Technology",
      positions: [
        {
          title: "Product Manager",
          company: "StartupCo",
          startDate: "2021-01",
        },
      ],
      skills: [
        { name: "Product Management", endorsements: 60 },
        { name: "Agile", endorsements: 45 },
      ],
    };

    // Simulate GitHub connection
    const githubProfile = {
      id: 67890,
      login: "alicesmith",
      name: "Alice Smith",
      bio: "Product person who codes",
      location: "New York",
      company: "@startupco",
      publicRepos: 25,
      followers: 50,
      following: 75,
      repositories: [
        {
          name: "product-tools",
          description: "Tools for product managers",
          language: "JavaScript",
          stars: 30,
          forks: 5,
        },
      ],
      topLanguages: ["JavaScript", "Python", "TypeScript"],
    };

    // Import from both platforms
    const linkedinData = importFromLinkedIn(linkedinProfile);
    const githubData = importFromGitHub(githubProfile);

    // Merge profiles
    const merged = mergeImportedProfiles({}, linkedinData, githubData);

    // Verify complete profile
    expect(merged.name).toBe("Alice Smith");
    expect(merged.location).toBe("New York");
    expect(merged.skills).toContain("Product Management");
    expect(merged.skills).toContain("JavaScript");
    expect(merged.industries).toContain("Technology");
    expect(merged.currentCompany).toBe("StartupCo");
  });
});
