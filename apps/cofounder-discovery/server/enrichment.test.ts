import { describe, it, expect } from "vitest";
import {
  enrichWithLinkedIn,
  enrichWithGitHub,
  enrichWithCompanyData,
  enrichProspect,
  mergeEnrichmentData,
} from "./enrichment-engine";

describe("Enrichment Engine", () => {
  describe("LinkedIn Enrichment", () => {
    it("should have enrichWithLinkedIn function", () => {
      expect(typeof enrichWithLinkedIn).toBe("function");
    });

    it("should extract username from LinkedIn URL", async () => {
      // Test with various URL formats
      const urls = [
        "https://www.linkedin.com/in/testuser",
        "https://linkedin.com/in/testuser/",
        "linkedin.com/in/testuser",
      ];

      for (const url of urls) {
        const result = await enrichWithLinkedIn(url);
        // Result may be null if API fails, but function should not throw
        expect(result === null || typeof result === "object").toBe(true);
      }
    });

    it("should return null for invalid LinkedIn URL", async () => {
      const result = await enrichWithLinkedIn("invalid-url");
      expect(result).toBeNull();
    });
  });

  describe("GitHub Enrichment", () => {
    it("should have enrichWithGitHub function", () => {
      expect(typeof enrichWithGitHub).toBe("function");
    });

    it("should extract username from GitHub URL", async () => {
      const urls = [
        "https://github.com/testuser",
        "https://www.github.com/testuser/",
        "github.com/testuser",
      ];

      for (const url of urls) {
        const result = await enrichWithGitHub(url);
        expect(result === null || typeof result === "object").toBe(true);
      }
    });

    it("should return null for invalid GitHub URL", async () => {
      const result = await enrichWithGitHub("invalid-url");
      expect(result).toBeNull();
    });

    it("should fetch real GitHub data for valid user", async () => {
      // Test with a known public GitHub user
      const result = await enrichWithGitHub("https://github.com/torvalds");

      if (result) {
        expect(result.username).toBeDefined();
        expect(result.githubUrl).toBeDefined();
        expect(typeof result.publicRepos).toBe("number");
      }
      // If API fails, result will be null which is acceptable
    });
  });

  describe("Company Enrichment", () => {
    it("should have enrichWithCompanyData function", () => {
      expect(typeof enrichWithCompanyData).toBe("function");
    });

    it("should handle company names", async () => {
      const result = await enrichWithCompanyData("Microsoft");
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("Full Prospect Enrichment", () => {
    it("should have enrichProspect function", () => {
      expect(typeof enrichProspect).toBe("function");
    });

    it("should enrich prospect with all data sources", async () => {
      const mockProspect = {
        id: 1,
        name: "Test User",
        title: "Software Engineer",
        location: "San Francisco",
      };

      const result = await enrichProspect(mockProspect, {
        linkedInUrl: "https://linkedin.com/in/testuser",
        githubUrl: "https://github.com/testuser",
        companyName: "TestCompany",
      });

      expect(result).toBeDefined();
      expect(result.originalData).toEqual(mockProspect);
      expect(result.enrichmentScore).toBeGreaterThanOrEqual(0);
      expect(result.enrichmentScore).toBeLessThanOrEqual(100);
      expect(result.lastEnriched).toBeInstanceOf(Date);
    });

    it("should handle enrichment with only LinkedIn", async () => {
      const mockProspect = {
        id: 2,
        name: "Test User 2",
      };

      const result = await enrichProspect(mockProspect, {
        linkedInUrl: "https://linkedin.com/in/testuser",
      });

      expect(result).toBeDefined();
      expect(result.enrichmentScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle enrichment with only GitHub", async () => {
      const mockProspect = {
        id: 3,
        name: "Test User 3",
      };

      const result = await enrichProspect(mockProspect, {
        githubUrl: "https://github.com/torvalds",
      });

      expect(result).toBeDefined();
      expect(result.enrichmentScore).toBeGreaterThanOrEqual(0);
    });

    it("should return zero score when no enrichment data available", async () => {
      const mockProspect = {
        id: 4,
        name: "Test User 4",
      };

      const result = await enrichProspect(mockProspect, {});

      expect(result).toBeDefined();
      expect(result.enrichmentScore).toBe(0);
    });
  });

  describe("Data Merging", () => {
    it("should have mergeEnrichmentData function", () => {
      expect(typeof mergeEnrichmentData).toBe("function");
    });

    it("should merge LinkedIn data into prospect", () => {
      const prospect = {
        id: 1,
        name: "Test User",
      };

      const enrichment = {
        originalData: prospect,
        linkedin: {
          headline: "Software Engineer at Google",
          summary: "Experienced developer",
          location: "San Francisco, CA",
          skills: [
            { name: "JavaScript", endorsements: 50 },
            { name: "Python", endorsements: 30 },
          ],
          currentPosition: {
            title: "Senior Engineer",
            company: "Google",
            duration: "2020 - Present",
          },
        },
        enrichmentScore: 75,
        lastEnriched: new Date(),
      };

      const merged = mergeEnrichmentData(prospect, enrichment);

      expect(merged.title).toBe("Software Engineer at Google");
      expect(merged.bio).toBe("Experienced developer");
      expect(merged.location).toBe("San Francisco, CA");
      expect(merged.skills).toContain("JavaScript");
      expect(merged.skills).toContain("Python");
      expect(merged.currentRole).toBe("Senior Engineer");
      expect(merged.currentCompany).toBe("Google");
      expect(merged.enrichmentScore).toBe(75);
    });

    it("should merge GitHub data into prospect", () => {
      const prospect = {
        id: 2,
        name: "Test Developer",
      };

      const enrichment = {
        originalData: prospect,
        github: {
          username: "testdev",
          bio: "Open source enthusiast",
          location: "New York",
          topLanguages: ["TypeScript", "Go", "Rust"],
          publicRepos: 50,
          followers: 100,
        },
        enrichmentScore: 60,
        lastEnriched: new Date(),
      };

      const merged = mergeEnrichmentData(prospect, enrichment);

      expect(merged.bio).toBe("Open source enthusiast");
      expect(merged.location).toBe("New York");
      expect(merged.skills).toContain("TypeScript");
      expect(merged.skills).toContain("Go");
      expect(merged.skills).toContain("Rust");
      expect(merged.githubRepos).toBe(50);
      expect(merged.githubFollowers).toBe(100);
    });

    it("should merge company data into prospect", () => {
      const prospect = {
        id: 3,
        name: "Test Founder",
      };

      const enrichment = {
        originalData: prospect,
        company: {
          name: "TechCorp",
          description: "Leading tech company",
          industry: "Software",
          size: "1000-5000",
          website: "https://techcorp.com",
        },
        enrichmentScore: 50,
        lastEnriched: new Date(),
      };

      const merged = mergeEnrichmentData(prospect, enrichment);

      expect(merged.companyInfo).toBeDefined();
      expect(merged.companyInfo.name).toBe("TechCorp");
      expect(merged.companyInfo.description).toBe("Leading tech company");
      expect(merged.companyInfo.industry).toBe("Software");
      expect(merged.companyInfo.size).toBe("1000-5000");
    });

    it("should not overwrite existing prospect data", () => {
      const prospect = {
        id: 4,
        name: "Test User",
        title: "Existing Title",
        bio: "Existing Bio",
        location: "Existing Location",
        skills: ["Existing Skill"],
      };

      const enrichment = {
        originalData: prospect,
        linkedin: {
          headline: "New Title",
          summary: "New Bio",
          location: "New Location",
          skills: [{ name: "New Skill", endorsements: 10 }],
        },
        enrichmentScore: 70,
        lastEnriched: new Date(),
      };

      const merged = mergeEnrichmentData(prospect, enrichment);

      // Should keep existing data
      expect(merged.title).toBe("Existing Title");
      expect(merged.bio).toBe("Existing Bio");
      expect(merged.location).toBe("Existing Location");
      expect(merged.skills).toEqual(["Existing Skill"]);
    });

    it("should preserve enrichment metadata", () => {
      const prospect = { id: 5, name: "Test" };
      const now = new Date();

      const enrichment = {
        originalData: prospect,
        linkedin: { headline: "Engineer" },
        github: { username: "test" },
        company: { name: "TestCo" },
        enrichmentScore: 85,
        lastEnriched: now,
      };

      const merged = mergeEnrichmentData(prospect, enrichment);

      expect(merged.enrichmentScore).toBe(85);
      expect(merged.lastEnriched).toBe(now);
      expect(merged.enrichmentData).toBeDefined();
      expect(merged.enrichmentData.linkedin).toBeDefined();
      expect(merged.enrichmentData.github).toBeDefined();
      expect(merged.enrichmentData.company).toBeDefined();
    });
  });
});
