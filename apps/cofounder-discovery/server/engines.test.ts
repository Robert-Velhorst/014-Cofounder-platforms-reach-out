import { describe, it, expect } from "vitest";
import {
  calculateCompatibility,
  batchCalculateCompatibility,
} from "./matching-engine";
import {
  normalizeSkills,
  categorizeIndustries,
  inferExperienceLevel,
  detectStartupStage,
  analyzeProfile,
} from "./profile-analysis-engine";
import { deduplicateProfiles } from "./scraping-engine";
import { analyzeMessage } from "./messaging-engine";
import { smartFilterProspects, shouldRunCampaign } from "./campaign-engine";

describe("Matching Engine", () => {
  describe("calculateCompatibility", () => {
    it("should calculate overall compatibility score", () => {
      const user = {
        skills: ["Developer", "Designer"],
        industries: ["FinTech"],
        experience: "5-10 years",
        lookingFor: ["Co-Founder"],
        startupStage: "Idea",
        location: "San Francisco",
      };

      const prospect = {
        id: 1,
        name: "Test Prospect",
        title: "Product Manager",
        location: "San Francisco",
        bio: "Experienced PM",
        skills: ["Product Manager", "Marketing"],
        experience: "5-10 years",
        industries: ["FinTech"],
        lookingFor: ["Technical Co-Founder"],
        startupStage: "Idea",
        platform: "Test",
        profileUrl: "https://test.com",
        importedAt: new Date(),
        lastUpdated: new Date(),
      };

      const score = calculateCompatibility(user, prospect);

      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.breakdown).toHaveProperty("skills");
      expect(score.breakdown).toHaveProperty("industries");
      expect(score.breakdown).toHaveProperty("experience");
    });

    it("should generate highlights for high compatibility", () => {
      const user = {
        skills: ["Developer"],
        industries: ["FinTech"],
        experience: "5-10 years",
        lookingFor: ["Designer"],
        startupStage: "MVP",
        location: "San Francisco",
      };

      const prospect = {
        id: 1,
        name: "Test Prospect",
        title: "Designer",
        location: "San Francisco",
        bio: "UI/UX Designer",
        skills: ["Designer", "UI/UX"],
        experience: "5-10 years",
        industries: ["FinTech"],
        lookingFor: ["Developer"],
        startupStage: "MVP",
        platform: "Test",
        profileUrl: "https://test.com",
        importedAt: new Date(),
        lastUpdated: new Date(),
      };

      const score = calculateCompatibility(user, prospect);

      expect(score.highlights.length).toBeGreaterThan(0);
      expect(score.overall).toBeGreaterThan(60); // Adjusted expectation
    });

    it("should identify concerns for low compatibility", () => {
      const user = {
        skills: ["Developer"],
        industries: ["FinTech"],
        experience: "10+ years",
        lookingFor: ["Designer"],
        startupStage: "Idea",
        location: "San Francisco",
      };

      const prospect = {
        id: 1,
        name: "Test Prospect",
        title: "Developer",
        location: "New York",
        bio: "Junior Developer",
        skills: ["Developer"],
        experience: "0-2 years",
        industries: ["HealthTech"],
        lookingFor: ["Developer"],
        startupStage: "Growth",
        platform: "Test",
        profileUrl: "https://test.com",
        importedAt: new Date(),
        lastUpdated: new Date(),
      };

      const score = calculateCompatibility(user, prospect);

      expect(score.overall).toBeLessThan(70);
    });
  });

  describe("batchCalculateCompatibility", () => {
    it("should sort prospects by compatibility score", () => {
      const user = {
        skills: ["Developer"],
        industries: ["FinTech"],
        experience: "5-10 years",
        lookingFor: ["Designer"],
        startupStage: "MVP",
        location: "San Francisco",
      };

      const prospects = [
        {
          id: 1,
          name: "Low Match",
          title: "Developer",
          location: "Tokyo",
          bio: null,
          skills: ["Developer"],
          experience: "0-2 years",
          industries: ["HealthTech"],
          lookingFor: null,
          startupStage: null,
          platform: "Test",
          profileUrl: "https://test.com/1",
          importedAt: new Date(),
          lastUpdated: new Date(),
        },
        {
          id: 2,
          name: "High Match",
          title: "Designer",
          location: "San Francisco",
          bio: "Experienced designer",
          skills: ["Designer", "UI/UX"],
          experience: "5-10 years",
          industries: ["FinTech"],
          lookingFor: ["Developer"],
          startupStage: "MVP",
          platform: "Test",
          profileUrl: "https://test.com/2",
          importedAt: new Date(),
          lastUpdated: new Date(),
        },
      ];

      const results = batchCalculateCompatibility(user, prospects);

      expect(results[0].prospect.id).toBe(2); // High match first
      expect(results[0].score.overall).toBeGreaterThan(
        results[1].score.overall
      );
    });
  });
});

describe("Profile Analysis Engine", () => {
  describe("normalizeSkills", () => {
    it("should normalize skill variants to canonical forms", () => {
      const rawSkills = ["software engineer", "ui designer", "growth marketer"];
      const normalized = normalizeSkills(rawSkills);

      expect(normalized).toContain("Developer");
      expect(normalized).toContain("Designer");
      expect(normalized).toContain("Marketer");
    });

    it("should handle mixed case and spacing", () => {
      const rawSkills = ["  FRONTEND DEVELOPER  ", "full-stack", "DevOps"];
      const normalized = normalizeSkills(rawSkills);

      expect(normalized.length).toBeGreaterThan(0);
      expect(
        normalized.every(skill => skill[0] === skill[0].toUpperCase())
      ).toBe(true);
    });
  });

  describe("categorizeIndustries", () => {
    it("should categorize industry variants", () => {
      const rawIndustries = ["fintech", "healthtech", "saas"];
      const categorized = categorizeIndustries(rawIndustries);

      expect(categorized).toContain("FinTech");
      expect(categorized).toContain("HealthTech");
      expect(categorized).toContain("SaaS");
    });
  });

  describe("inferExperienceLevel", () => {
    it("should infer experience from text", () => {
      expect(inferExperienceLevel("Senior engineer with 10+ years")).toBe(
        "10+ years"
      );
      expect(
        inferExperienceLevel("Mid-level developer, 5 years experience")
      ).toBe("5-10 years");
      expect(inferExperienceLevel("Junior developer, recent graduate")).toBe(
        "0-2 years"
      );
    });
  });

  describe("detectStartupStage", () => {
    it("should detect startup stage from text", () => {
      expect(detectStartupStage("Just an idea, looking to build MVP")).toBe(
        "Idea"
      );
      expect(detectStartupStage("We have a working prototype")).toBe("MVP");
      expect(detectStartupStage("Launched 6 months ago, have customers")).toBe(
        "Early Stage"
      );
      expect(detectStartupStage("Scaling rapidly, Series A funded")).toBe(
        "Growth"
      );
    });
  });

  describe("analyzeProfile", () => {
    it("should calculate profile completeness", () => {
      const completeProfile = {
        name: "John Doe",
        title: "Software Engineer",
        location: "San Francisco",
        bio: "Experienced full-stack developer with 8 years in SaaS. Looking for a business co-founder to build the next big thing.",
        skills: ["Developer", "Product", "Design"],
        experience: "5-10 years",
        industries: ["SaaS", "FinTech"],
        lookingFor: ["Business Co-Founder"],
        startupStage: "Idea",
      };

      const analysis = analyzeProfile(completeProfile);

      expect(analysis.completeness).toBeGreaterThan(80);
      expect(analysis.quality).toBeGreaterThan(70);
      expect(analysis.strengths.length).toBeGreaterThan(0);
    });

    it("should identify gaps in incomplete profiles", () => {
      const incompleteProfile = {
        name: "Jane Doe",
      };

      const analysis = analyzeProfile(incompleteProfile);

      expect(analysis.completeness).toBeLessThan(50);
      expect(analysis.gaps.length).toBeGreaterThan(5);
      expect(analysis.suggestedImprovements.length).toBeGreaterThan(0);
    });
  });
});

describe("Scraping Engine", () => {
  describe("deduplicateProfiles", () => {
    it("should remove duplicate profiles", () => {
      const profiles = [
        {
          name: "John Doe",
          title: "Developer",
          location: "San Francisco",
          bio: "Full bio",
          skills: ["Developer"],
          experience: "5-10 years",
          industries: ["SaaS"],
          lookingFor: ["Co-Founder"],
          startupStage: "Idea",
          platform: "CoFoundersLab",
          profileUrl: "https://cofounderslab.com/john",
        },
        {
          name: "John Doe",
          location: "San Francisco",
          bio: "Short bio",
          skills: null,
          experience: null,
          industries: null,
          lookingFor: null,
          startupStage: null,
          platform: "FounderCloud",
          profileUrl: "https://foundercloud.com/john",
        },
      ];

      const deduplicated = deduplicateProfiles(profiles);

      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].bio).toBe("Full bio"); // Prefers more complete profile
    });
  });
});

describe("Messaging Engine", () => {
  describe("analyzeMessage", () => {
    it("should calculate message readability", () => {
      const message =
        "Hi John, I saw your profile and was impressed by your experience. Would you be open to a quick call?";
      const analysis = analyzeMessage(message);

      expect(analysis.readability).toBeGreaterThan(0);
      expect(analysis.readability).toBeLessThanOrEqual(100);
    });

    it("should detect positive sentiment", () => {
      const message =
        "I'm excited about the possibility of working together. Your skills are excellent!";
      const analysis = analyzeMessage(message);

      expect(analysis.sentiment).toBe("positive");
    });

    it("should detect call-to-action", () => {
      const message =
        "Would you be interested in scheduling a call to discuss this further?";
      const analysis = analyzeMessage(message);

      expect(analysis.callToActionPresent).toBe(true);
    });

    it("should estimate response rate", () => {
      const goodMessage =
        "Hi Sarah, I love your background in design. Our skills complement each other perfectly. Would you like to chat about potential collaboration?";
      const analysis = analyzeMessage(goodMessage);

      expect(analysis.estimatedResponseRate).toBeGreaterThan(40);
    });
  });
});

describe("Campaign Engine", () => {
  describe("smartFilterProspects", () => {
    it("should filter prospects with complementary skills", () => {
      const userProfile = {
        skills: ["Developer"],
        industries: ["FinTech"],
        location: "San Francisco",
      };

      const prospects = [
        {
          id: 1,
          name: "Designer",
          title: "Product Designer",
          location: "San Francisco",
          bio: null,
          skills: ["Designer", "UI/UX"],
          experience: "5-10 years",
          industries: ["FinTech"],
          lookingFor: null,
          startupStage: null,
          platform: "Test",
          profileUrl: "https://test.com/1",
          importedAt: new Date(),
          lastUpdated: new Date(),
        },
        {
          id: 2,
          name: "Another Developer",
          title: "Software Engineer",
          location: "San Francisco",
          bio: null,
          skills: ["Developer", "Backend"],
          experience: "5-10 years",
          industries: ["HealthTech"],
          lookingFor: null,
          startupStage: null,
          platform: "Test",
          profileUrl: "https://test.com/2",
          importedAt: new Date(),
          lastUpdated: new Date(),
        },
      ];

      const filtered = smartFilterProspects(prospects, userProfile);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(p => p.id === 1)).toBe(true); // Designer should match
    });
  });

  describe("shouldRunCampaign", () => {
    it("should respect daily frequency", () => {
      const schedule = {
        frequency: "daily" as const,
        timeOfDay: "09:00",
      };

      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(shouldRunCampaign(schedule, yesterday)).toBe(true);

      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(shouldRunCampaign(schedule, oneHourAgo)).toBe(false);
    });

    it("should not run manual campaigns automatically", () => {
      const schedule = {
        frequency: "manual" as const,
        timeOfDay: "09:00",
      };

      expect(shouldRunCampaign(schedule)).toBe(false);
    });
  });
});
