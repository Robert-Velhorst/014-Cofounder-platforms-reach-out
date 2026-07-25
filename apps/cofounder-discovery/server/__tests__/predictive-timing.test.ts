import { describe, it, expect } from "vitest";
import { getDayName, formatHour } from "../predictive-timing";

describe("Predictive Follow-Up Timing", () => {
  describe("getDayName", () => {
    it("should return correct day names", () => {
      expect(getDayName(0)).toBe("Sunday");
      expect(getDayName(1)).toBe("Monday");
      expect(getDayName(2)).toBe("Tuesday");
      expect(getDayName(3)).toBe("Wednesday");
      expect(getDayName(4)).toBe("Thursday");
      expect(getDayName(5)).toBe("Friday");
      expect(getDayName(6)).toBe("Saturday");
    });

    it("should handle invalid day numbers", () => {
      expect(getDayName(7)).toBe("Unknown");
      expect(getDayName(-1)).toBe("Unknown");
    });
  });

  describe("formatHour", () => {
    it("should format midnight correctly", () => {
      expect(formatHour(0)).toBe("12 AM");
    });

    it("should format noon correctly", () => {
      expect(formatHour(12)).toBe("12 PM");
    });

    it("should format morning hours correctly", () => {
      expect(formatHour(1)).toBe("1 AM");
      expect(formatHour(9)).toBe("9 AM");
      expect(formatHour(11)).toBe("11 AM");
    });

    it("should format afternoon/evening hours correctly", () => {
      expect(formatHour(13)).toBe("1 PM");
      expect(formatHour(18)).toBe("6 PM");
      expect(formatHour(23)).toBe("11 PM");
    });
  });
});
