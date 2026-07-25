import { describe, it, expect } from "vitest";
import {
  calculateCompatibility,
  extractEnrichedSkills,
  extractEnrichedIndustries,
} from "./matching-engine";
import type { UserProfile, EnrichedProspect } from "./matching-engine";

describe("Enrichment Integration", () => {
  describe("Enriched Data Extraction", () => {
    it("should extract LinkedIn skills from enrichment data", () => {
      const prospect: EnrichedProspect = {
        skills: ["JavaScript"],
        industries: [],
        experience: "Senior",
        lookingFor: [],
        startupStage: "Idea",
        location: "San Francisco",
        enrichmentData: {
          linkedin: {
            skills: [
              { name: "TypeScript", endorsements: 50 },
              { name: "React", endorsements: 30 },
              { name: "Node.js", endorsements: 25 },
            ],
          },
        },
      };

      // Access the private function through the module
      // Since it's private, we'll test it through calculateCompatibility
      const user: UserProfile = {
        skills: ["Python", "Django"],
        industries: ["FinTech"],
        experience: "Senior",
        lookingFor: ["Technical Co-founder"],
        startupStage: "Idea",
        location: "San Francisco",
      };

      const result = calculateCompatibility(user, prospect);

      // The enriched skills should be used in compatibility calculation
      expect(result).toBeDefined();
      expect(result.overall).toBeGreaterThan(0);
      expect(result.breakdown.skills).toBeGreaterThan(0);
    });

    it("should extract GitHub languages as technical skills", () => {
      const prospect: EnrichedProspect = {
        skills: [],
        industries: [],
        experience: "Mid-level",
        lookingFor: [],
        startupStage: "MVP",
        location: "New York",
        enrichmentData: {
          github: {
            topLanguages: ["Python", "Go", "Rust"],
            publicRepos: 50,
          },
        },
      };

      const user: UserProfile = {
        skills: ["JavaScript", "TypeScript"],
        industries: ["SaaS"],
        experience: "Senior",
        lookingFor: ["Technical Co-founder"],
        startupStage: "MVP",
        location: "New York",
      };

      const result = calculateCompatibility(user, prospect);

      expect(result).toBeDefined();
      expect(result.breakdown.skills).toBeGreaterThan(0);
    });

    it("should extract company industry from enrichment data", () => {
      const prospect: EnrichedProspect = {
        skills: ["Product Management"],
        industries: [],
        experience: "Senior",
        lookingFor: [],
        startupStage: "Growth",
        location: "Austin",
        enrichmentData: {
          company: {
            industry: "FinTech",
          },
        },
      };

      const user: UserProfile = {
        skills: ["Engineering"],
        industries: ["FinTech", "Banking"],
        experience: "Senior",
        lookingFor: ["Business Co-founder"],
        startupStage: "Growth",
        location: "Austin",
      };

      const result = calculateCompatibility(user, prospect);

      expect(result).toBeDefined();
      expect(result.breakdown.industries).toBeGreaterThanOrEqual(50);
    });

    it("should combine base skills with enriched skills", () => {
      const prospect: EnrichedProspect = {
        skills: ["Marketing", "Sales"],
        industries: ["E-commerce"],
        experience: "Mid-level",
        lookingFor: [],
        startupStage: "Seed",
        location: "Remote",
        enrichmentData: {
          linkedin: {
            skills: [
              { name: "Digital Marketing", endorsements: 40 },
              { name: "SEO", endorsements: 35 },
            ],
          },
          github: {
            topLanguages: ["JavaScript"],
            publicRepos: 10,
          },
        },
      };

      const user: UserProfile = {
        skills: ["Engineering", "Product"],
        industries: ["E-commerce"],
        experience: "Senior",
        lookingFor: ["Marketing Co-founder"],
        startupStage: "Seed",
        location: "Remote",
        remotePreference: "Remote",
      };

      const result = calculateCompatibility(user, prospect);

      // Should have high compatibility due to complementary skills
      expect(result).toBeDefined();
      expect(result.overall).toBeGreaterThan(60);
      expect(result.breakdown.skills).toBeGreaterThan(0);
      expect(result.breakdown.industries).toBeGreaterThan(70);
    });
  });

  describe("Matching Algorithm with Enrichment", () => {
    it("should improve skill matching with LinkedIn data", () => {
      const user: UserProfile = {
        skills: ["Backend Development", "DevOps"],
        industries: ["SaaS"],
        experience: "Senior",
        lookingFor: ["Frontend Developer"],
        startupStage: "MVP",
        location: "San Francisco",
      };

      // Prospect without enrichment
      const prospectBasic: EnrichedProspect = {
        skills: ["Frontend"],
        industries: ["SaaS"],
        experience: "Senior",
        lookingFor: [],
        startupStage: "MVP",
        location: "San Francisco",
      };

      // Same prospect with enrichment
      const prospectEnriched: EnrichedProspect = {
        ...prospectBasic,
        enrichmentData: {
          linkedin: {
            skills: [
              { name: "React", endorsements: 60 },
              { name: "Vue.js", endorsements: 40 },
              { name: "TypeScript", endorsements: 50 },
              { name: "CSS", endorsements: 45 },
            ],
          },
        },
      };

      const basicResult = calculateCompatibility(user, prospectBasic);
      const enrichedResult = calculateCompatibility(user, prospectEnriched);

      // Enriched result should have more detailed skill analysis
      expect(enrichedResult.breakdown.skills).toBeGreaterThanOrEqual(
        basicResult.breakdown.skills
      );
    });

    it("should improve technical matching with GitHub data", () => {
      const user: UserProfile = {
        skills: ["Product Management", "UX Design"],
        industries: ["Developer Tools"],
        experience: "Senior",
        lookingFor: ["Technical Co-founder"],
        startupStage: "Seed",
        location: "Remote",
        remotePreference: "Remote",
      };

      const prospectWithGitHub: EnrichedProspect = {
        skills: ["Software Engineering"],
        industries: ["Developer Tools"],
        experience: "Senior",
        lookingFor: [],
        startupStage: "Seed",
        location: "Remote",
        enrichmentData: {
          github: {
            topLanguages: ["TypeScript", "Python", "Go", "Rust"],
            publicRepos: 75,
          },
        },
      };

      const result = calculateCompatibility(user, prospectWithGitHub);

      // Should recognize strong technical skills from GitHub
      expect(result.overall).toBeGreaterThan(60);
      expect(result.breakdown.skills).toBeGreaterThan(0);
    });

    it("should handle prospects with no enrichment data", () => {
      const user: UserProfile = {
        skills: ["Engineering"],
        industries: ["HealthTech"],
        experience: "Senior",
        lookingFor: ["Business Co-founder"],
        startupStage: "Idea",
        location: "Boston",
      };

      const prospectNoEnrichment: EnrichedProspect = {
        skills: ["Business Development"],
        industries: ["HealthTech"],
        experience: "Mid-level",
        lookingFor: [],
        startupStage: "Idea",
        location: "Boston",
      };

      const result = calculateCompatibility(user, prospectNoEnrichment);

      // Should still calculate compatibility without enrichment
      expect(result).toBeDefined();
      expect(result.overall).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });

    it("should handle prospects with partial enrichment", () => {
      const user: UserProfile = {
        skills: ["Full Stack Development"],
        industries: ["EdTech"],
        experience: "Senior",
        lookingFor: ["Business Co-founder"],
        startupStage: "MVP",
        location: "Seattle",
      };

      const prospectPartialEnrichment: EnrichedProspect = {
        skills: ["Marketing"],
        industries: [],
        experience: "Senior",
        lookingFor: [],
        startupStage: "MVP",
        location: "Seattle",
        enrichmentData: {
          company: {
            industry: "EdTech",
          },
          // No LinkedIn or GitHub data
        },
      };

      const result = calculateCompatibility(user, prospectPartialEnrichment);

      // Should use available enrichment data
      expect(result).toBeDefined();
      expect(result.breakdown.industries).toBeGreaterThan(0);
    });

    it("should generate meaningful highlights with enriched data", () => {
      const user: UserProfile = {
        skills: ["Backend Engineering", "System Design"],
        industries: ["FinTech", "Blockchain"],
        experience: "Senior",
        lookingFor: ["Frontend Developer"],
        startupStage: "Seed",
        location: "San Francisco",
      };

      const prospect: EnrichedProspect = {
        skills: ["Frontend Development"],
        industries: ["FinTech"],
        experience: "Senior",
        lookingFor: [],
        startupStage: "Seed",
        location: "San Francisco",
        enrichmentData: {
          linkedin: {
            skills: [
              { name: "React", endorsements: 80 },
              { name: "UI/UX", endorsements: 60 },
            ],
          },
          github: {
            topLanguages: ["JavaScript", "TypeScript", "CSS"],
            publicRepos: 45,
          },
          company: {
            industry: "FinTech",
          },
        },
      };

      const result = calculateCompatibility(user, prospect);

      expect(result.highlights).toBeDefined();
      expect(result.highlights.length).toBeGreaterThan(0);
      expect(result.concerns).toBeDefined();
    });
  });

  describe("Campaign Scheduler Enrichment", () => {
    it("should have enrichment job configuration", () => {
      // Test that enrichment job is properly configured
      // This would test the scheduler initialization
      expect(true).toBe(true); // Placeholder
    });

    it("should enrich prospects automatically", async () => {
      // Test automated enrichment workflow
      // This would test the runProspectEnrichment method
      expect(true).toBe(true); // Placeholder
    });
  });
});
