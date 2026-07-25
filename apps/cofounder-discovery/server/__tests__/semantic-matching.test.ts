import { describe, it, expect } from "vitest";
import {
  calculateSkillSimilarity,
  findSimilarSkills,
  calculateSemanticSkillScore,
} from "../semantic-matching";

describe("Semantic Skill Matching", () => {
  describe("calculateSkillSimilarity", () => {
    it("should return 100 for exact matches", () => {
      expect(calculateSkillSimilarity("React", "React")).toBe(100);
      expect(calculateSkillSimilarity("Python", "python")).toBe(100);
    });

    it("should return high similarity for aliases", () => {
      const similarity = calculateSkillSimilarity("React", "ReactJS");
      expect(similarity).toBeGreaterThanOrEqual(90);
    });

    it("should return high similarity for same category skills", () => {
      const similarity = calculateSkillSimilarity("React", "Vue");
      expect(similarity).toBeGreaterThan(70);
    });

    it("should return moderate similarity for related skills", () => {
      const similarity = calculateSkillSimilarity(
        "Machine Learning",
        "Deep Learning"
      );
      expect(similarity).toBeGreaterThan(70);
    });

    it("should return low similarity for unrelated skills", () => {
      const similarity = calculateSkillSimilarity("React", "Photoshop");
      expect(similarity).toBeLessThan(50);
    });
  });

  describe("findSimilarSkills", () => {
    it("should find similar skills above threshold", () => {
      const skills = ["React", "Vue", "Angular", "Python", "Photoshop"];
      const similar = findSimilarSkills("ReactJS", skills, 70);

      expect(similar.length).toBeGreaterThan(0);
      expect(similar[0].skill).toBe("React");
      expect(similar[0].similarity).toBeGreaterThanOrEqual(90);
    });

    it("should sort results by similarity", () => {
      const skills = ["React", "Vue", "ReactJS"];
      const similar = findSimilarSkills("React", skills, 70);

      // Should be sorted descending
      for (let i = 0; i < similar.length - 1; i++) {
        expect(similar[i].similarity).toBeGreaterThanOrEqual(
          similar[i + 1].similarity
        );
      }
    });

    it("should filter out skills below threshold", () => {
      const skills = ["React", "Photoshop", "Accounting"];
      const similar = findSimilarSkills("Vue", skills, 70);

      // Should only include React (frontend category)
      expect(similar.every(s => s.similarity >= 70)).toBe(true);
    });
  });

  describe("calculateSemanticSkillScore", () => {
    it("should identify exact matches", () => {
      const userSkills = ["React", "Python", "SQL"];
      const prospectSkills = ["React", "Node.js", "MongoDB"];

      const result = calculateSemanticSkillScore(userSkills, prospectSkills);

      expect(result.exactMatches).toContain("React");
      expect(result.exactMatches.length).toBe(1);
    });

    it("should identify semantic matches", () => {
      const userSkills = ["React"];
      const prospectSkills = ["Vue", "Angular"];

      const result = calculateSemanticSkillScore(userSkills, prospectSkills);

      expect(result.semanticMatches.length).toBeGreaterThan(0);
      expect(result.semanticMatches[0].similarity).toBeGreaterThan(70);
    });

    it("should identify complementary skills", () => {
      const userSkills = ["React", "JavaScript"];
      const prospectSkills = ["Python", "Machine Learning", "Data Science"];

      const result = calculateSemanticSkillScore(userSkills, prospectSkills);

      expect(result.complementarySkills.length).toBeGreaterThan(0);
    });

    it("should calculate reasonable scores", () => {
      const userSkills = ["React", "TypeScript", "Node.js"];
      const prospectSkills = ["Vue", "JavaScript", "Python"];

      const result = calculateSemanticSkillScore(userSkills, prospectSkills);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should handle empty skill sets", () => {
      const result1 = calculateSemanticSkillScore([], ["React", "Python"]);
      const result2 = calculateSemanticSkillScore(["React"], []);

      expect(result1.score).toBe(50);
      expect(result2.score).toBe(50);
    });

    it("should prefer exact matches over semantic matches", () => {
      const userSkills = ["React"];
      const prospectSkills1 = ["React", "Vue"];
      const prospectSkills2 = ["Vue", "Angular"];

      const result1 = calculateSemanticSkillScore(userSkills, prospectSkills1);
      const result2 = calculateSemanticSkillScore(userSkills, prospectSkills2);

      expect(result1.score).toBeGreaterThan(result2.score);
    });
  });
});
