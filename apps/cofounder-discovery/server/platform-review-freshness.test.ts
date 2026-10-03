import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  platformReviewFreshness,
  filterPlatforms,
} from "../shared/platform-catalogue";
import { PlatformCatalogue } from "../client/src/components/PlatformCatalogue";
import { publicPlatformCatalogue } from "./platform-catalogue";

afterEach(() => vi.useRealTimers());

describe("catalogue editorial review reminders", () => {
  it.each([
    ["2026-10-02", "2026-10-02", "within-window", 0],
    ["2026-09-03", "2026-10-02", "within-window", 29],
    ["2026-09-02", "2026-10-02", "review-due", 30],
    ["2024-02-29", "2024-03-30", "review-due", 30],
    ["2025-12-31", "2026-01-30", "review-due", 30],
  ])("uses UTC calendar days: %s to %s", (review, asOf, state, ageDays) => {
    expect(platformReviewFreshness(review, asOf)).toEqual({ state, ageDays });
  });
  it.each([
    "",
    "2026-02-30",
    "2026-9-05",
    "2026-10-03",
    "not-a-date",
    "2026-09-05T00:00:00Z",
  ])("does not certify invalid/future review dates: %s", review => {
    expect(platformReviewFreshness(review, "2026-10-02")).toEqual({
      state: "unknown",
      ageDays: null,
    });
  });
  it("rejects invalid reference dates", () => {
    expect(platformReviewFreshness("2026-09-05", "2026-02-30")).toEqual({
      state: "unknown",
      ageDays: null,
    });
  });
  it("renders reminders without hiding records or implying permission", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T23:59:59Z"));
    const records = publicPlatformCatalogue();
    const stale = { ...records[0], reviewedAt: "2026-09-05" };
    const recent = { ...records[1], reviewedAt: "2026-10-02" };
    const invalid = { ...records[2], reviewedAt: "2026-02-30" };
    const html = renderToStaticMarkup(
      createElement(PlatformCatalogue, { records: [stale, recent, invalid] })
    );
    expect(html).toContain("Review due — recheck access, cost and rules");
    expect(html).toContain("Review date needs checking");
    expect(html).toContain("30 days ago");
    expect(html).toContain("3 days ago");
    expect(html).toContain("3 of 3");
    expect(html).toContain("No verified live");
    expect(html).toContain("2026-10-05");
    expect(filterPlatforms([stale], stale.name, "all")).toEqual([stale]);
  });
});
