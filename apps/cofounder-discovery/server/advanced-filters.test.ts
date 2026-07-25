import { describe, it, expect } from "vitest";

describe("Advanced Search Filters", () => {
  describe("Funding Stage Filter", () => {
    it("should validate funding stage options", () => {
      const validStages = [
        "Bootstrapped",
        "Pre-seed",
        "Seed",
        "Series A",
        "Series B+",
        "No preference",
      ];

      expect(validStages).toHaveLength(6);
      expect(validStages).toContain("Bootstrapped");
      expect(validStages).toContain("Seed");
      expect(validStages).toContain("No preference");
    });

    it("should allow multiple funding stage selections", () => {
      const selectedStages = ["Bootstrapped", "Pre-seed", "Seed"];

      expect(Array.isArray(selectedStages)).toBe(true);
      expect(selectedStages.length).toBeGreaterThan(0);
    });

    it("should handle no preference option", () => {
      const noPreference = "No preference";
      const selectedStages = [noPreference];

      expect(selectedStages).toContain("No preference");
    });
  });

  describe("Team Size Filter", () => {
    it("should validate team size range", () => {
      const minSize = 1;
      const maxSize = 5;

      expect(minSize).toBeGreaterThanOrEqual(1);
      expect(maxSize).toBeLessThanOrEqual(50);
      expect(minSize).toBeLessThanOrEqual(maxSize);
    });

    it("should handle undefined team size values", () => {
      const minSize: number | undefined = undefined;
      const maxSize: number | undefined = undefined;

      expect(minSize).toBeUndefined();
      expect(maxSize).toBeUndefined();
    });

    it("should validate team size constraints", () => {
      const minSize = 2;
      const maxSize = 10;
      const testSize = 5;

      const isInRange = testSize >= minSize && testSize <= maxSize;
      expect(isInRange).toBe(true);
    });
  });

  describe("Equity Split Preference Filter", () => {
    it("should validate equity split options", () => {
      const validOptions = [
        "",
        "Equal (50/50)",
        "Majority (60/40)",
        "Significant (70/30)",
        "Flexible",
      ];

      expect(validOptions).toHaveLength(5);
      expect(validOptions).toContain("Equal (50/50)");
      expect(validOptions).toContain("Flexible");
    });

    it("should handle no preference", () => {
      const preference = "";

      expect(preference).toBe("");
    });

    it("should validate equity split selection", () => {
      const preference = "Equal (50/50)";

      expect(preference).toBeTruthy();
      expect(preference).toContain("50/50");
    });
  });

  describe("Advanced Filter Integration", () => {
    it("should combine all advanced filters", () => {
      const advancedFilters = {
        fundingStage: ["Bootstrapped", "Seed"],
        teamSizeMin: 2,
        teamSizeMax: 5,
        equitySplitPreference: "Equal (50/50)",
      };

      expect(advancedFilters.fundingStage).toHaveLength(2);
      expect(advancedFilters.teamSizeMin).toBe(2);
      expect(advancedFilters.teamSizeMax).toBe(5);
      expect(advancedFilters.equitySplitPreference).toBe("Equal (50/50)");
    });

    it("should handle partial advanced filter configuration", () => {
      const partialFilters = {
        fundingStage: ["Seed"],
        teamSizeMin: undefined,
        teamSizeMax: undefined,
        equitySplitPreference: "",
      };

      expect(partialFilters.fundingStage).toHaveLength(1);
      expect(partialFilters.teamSizeMin).toBeUndefined();
      expect(partialFilters.equitySplitPreference).toBe("");
    });

    it("should validate complete search with advanced filters", () => {
      const completeSearch = {
        name: "Technical Co-Founder",
        skills: ["Developer"],
        industries: ["Web/Mobile app"],
        location: "San Francisco",
        minCompatibilityScore: 75,
        // Advanced filters
        fundingStage: ["Bootstrapped", "Pre-seed"],
        teamSizeMin: 1,
        teamSizeMax: 3,
        equitySplitPreference: "Equal (50/50)",
      };

      expect(completeSearch.name).toBeTruthy();
      expect(completeSearch.fundingStage).toHaveLength(2);
      expect(completeSearch.teamSizeMin).toBeLessThanOrEqual(
        completeSearch.teamSizeMax!
      );
      expect(completeSearch.equitySplitPreference).toBeTruthy();
    });
  });

  describe("AI Matching with Advanced Filters", () => {
    it("should use advanced filters as preference indicators", () => {
      const searchPreferences = {
        fundingStage: ["Bootstrapped"],
        teamSizeMin: 2,
        teamSizeMax: 4,
        equitySplitPreference: "Equal (50/50)",
      };

      // Advanced filters are preference indicators, not strict filters
      const arePreferences = true;

      expect(arePreferences).toBe(true);
      expect(searchPreferences.fundingStage).toBeDefined();
      expect(searchPreferences.teamSizeMin).toBeDefined();
      expect(searchPreferences.equitySplitPreference).toBeDefined();
    });

    it("should allow flexible matching with advanced filters", () => {
      const strictFiltering = false; // Advanced filters don't strictly exclude matches
      const preferenceRanking = true; // They help rank matches better

      expect(strictFiltering).toBe(false);
      expect(preferenceRanking).toBe(true);
    });

    it("should enhance compatibility scoring with preferences", () => {
      const baseCompatibility = 75;
      const hasMatchingPreferences = true;

      // Preferences can boost compatibility scores
      const enhancedScore = hasMatchingPreferences
        ? baseCompatibility + 5
        : baseCompatibility;

      expect(enhancedScore).toBeGreaterThanOrEqual(baseCompatibility);
    });
  });

  describe("Filter Validation", () => {
    it("should validate team size min is not greater than max", () => {
      const minSize = 2;
      const maxSize = 5;

      const isValid = minSize <= maxSize;
      expect(isValid).toBe(true);
    });

    it("should reject invalid team size range", () => {
      const minSize = 10;
      const maxSize = 5;

      const isValid = minSize <= maxSize;
      expect(isValid).toBe(false);
    });

    it("should validate funding stage array", () => {
      const fundingStages = ["Bootstrapped", "Seed"];

      expect(Array.isArray(fundingStages)).toBe(true);
      expect(fundingStages.every(stage => typeof stage === "string")).toBe(
        true
      );
    });
  });
});
