import { describe, it, expect } from "vitest";
import { analyzeMessageCharacteristics } from "../conversation-quality";

describe("Conversation Quality Scoring", () => {
  describe("analyzeMessageCharacteristics", () => {
    it("should detect professional tone", () => {
      const message =
        "Your background in product management is impressive. I would like to discuss potential collaboration opportunities.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.tone).toBe("professional");
    });

    it("should detect friendly tone", () => {
      const message =
        "I noticed your work on the FinTech project and I'd love to connect!";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.tone).toBe("friendly");
    });

    it("should detect enthusiastic tone", () => {
      const message =
        "Your project is amazing! I'm so excited about the possibility of working together!";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.tone).toBe("enthusiastic");
    });

    it("should detect casual tone", () => {
      const message =
        "Hey! I saw your profile and thought we might be a good match.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.tone).toBe("casual");
    });

    it("should detect skills focus area", () => {
      const message =
        "I noticed your expertise in React and Node.js matches what I'm looking for.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.focusArea).toBe("skills");
    });

    it("should detect industry focus area", () => {
      const message =
        "Your experience in the FinTech industry aligns perfectly with my goals.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.focusArea).toBe("industry");
    });

    it("should detect project focus area", () => {
      const message =
        "I saw the project you're building and it's exactly the kind of thing I want to work on.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.focusArea).toBe("project");
    });

    it("should detect experience focus area", () => {
      const message =
        "Your 10 years of background in software development is impressive.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.focusArea).toBe("experience");
    });

    it("should detect questions", () => {
      const message =
        "Would you be interested in discussing a potential partnership?";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.hasQuestion).toBe(true);
    });

    it("should detect no questions", () => {
      const message = "I think we could work well together.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.hasQuestion).toBe(false);
    });

    it("should detect personalization", () => {
      const message =
        "I noticed your recent work on the healthcare platform and I saw you're based in San Francisco.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.hasPersonalization).toBe(true);
    });

    it("should detect no personalization", () => {
      const message = "Looking for a co-founder to build a startup.";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.hasPersonalization).toBe(false);
    });

    it("should calculate message length", () => {
      const message = "Hello world";
      const characteristics = analyzeMessageCharacteristics(message);

      expect(characteristics.messageLength).toBe(11);
    });
  });
});
