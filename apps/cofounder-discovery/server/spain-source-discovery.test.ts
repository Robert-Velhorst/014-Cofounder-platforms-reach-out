import { describe, expect, it } from "vitest";
import { publicPlatformCatalogue, filterPlatforms } from "./platform-catalogue";
import {
  resolveOutreachSource,
  declareOutreachSource,
} from "./outreach-source-policy";

describe("Spain CoFounder Match remains discovery, not account or contact permission", () => {
  it("publishes one distinct Spanish source with current public evidence and explicit limits", () => {
    const records = publicPlatformCatalogue();
    const source = records.find(row => row.id === "cofounder-match-spain");
    expect(source).toMatchObject({
      name: "CoFounder Match (Spain)",
      category: "dedicated",
      pricingStatus: "free-core",
      reviewedAt: "2026-10-23",
      workflowReview: "discovery-only",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(source!.access).toMatch(/18\+.*account.*inbox.*untested/);
    expect(source!.pricing).toMatch(/advertises.*free.*actual.*untested/i);
    expect(source!.restrictions).toMatch(/without consent.*spam/);
    expect(source!.restrictions).toMatch(/not external reuse.*unverified/);
    expect(source!.evidence).toEqual([
      "https://cofounder-match.com/",
      "https://cofounder-match.com/how-it-works",
      "https://cofounder-match.com/terms",
      "https://cofounder-match.com/privacy",
      "https://cofounder-match.com/register",
    ]);
    expect(
      records.filter(row => new URL(row.url).hostname === "cofounder-match.com")
    ).toHaveLength(1);
    expect(records.find(row => row.id === "cofound-biz")!.url).toBe(
      "https://www.cofound.biz/platform"
    );
    expect(
      records.some(row =>
        ["wefoundy", "cofound-lat", "cofound-space"].includes(row.id)
      )
    ).toBe(false);
  });

  it.each([
    "Spain España",
    "CoFounder Match España",
    "CoFounder Match Espana",
    "cofounder-match.com",
    "español",
  ])("finds the exact Spanish listing for %s", query => {
    expect(
      filterPlatforms(publicPlatformCatalogue(), query, "dedicated").map(
        row => row.id
      )
    ).toContain("cofounder-match-spain");
    expect(
      filterPlatforms(publicPlatformCatalogue(), query, "community").map(
        row => row.id
      )
    ).not.toContain("cofounder-match-spain");
  });

  it.each([
    ["cofounder-match-spain", "https://cofounder-match.com/"],
    ["CoFounder Match (Spain)", "https://cofounder-match.com/register"],
    ["CoFounder Match España", "https://www.cofounder-match.com/login"],
    ["CoFounder Match Espana", "https://cofounder-match.com/privacy"],
    [
      "cofounder-match.com",
      "https://cofounder-match.com/terms?review=synthetic",
    ],
  ])(
    "refuses label/URL/manual-label action bypasses for %s",
    (platform, profileUrl) => {
      for (const prospect of [
        { platform },
        { profileUrl },
        { platform, profileUrl },
      ]) {
        expect(resolveOutreachSource(prospect)).toMatchObject({
          allowed: false,
          destinationUrl: null,
          sourceId: "cofounder-match-spain",
        });
      }
      expect(
        resolveOutreachSource({ platform: "manual", profileUrl })
      ).toMatchObject({ allowed: false, destinationUrl: null });
      expect(() =>
        declareOutreachSource(
          {
            actorId: 42,
            prospect: { platform, profileUrl },
            body: "Original synthetic review",
            generationMode: "user_authored",
          },
          { humanOriginal: true, rulesReviewed: true },
          new Date("2026-10-23T00:00:00Z")
        )
      ).toThrow(/discovery-only/i);
    }
  );

  it("keeps the admitted manual set unchanged while growing only discovery", () => {
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    expect(records.filter(row => row.category === "dedicated")).toHaveLength(
      23
    );
    expect(records.filter(row => row.category === "community")).toHaveLength(
      24
    );
    expect(records.filter(row => row.category === "program")).toHaveLength(23);
    expect(
      records.filter(row => row.workflowReview === "manual-reviewed")
    ).toHaveLength(23);
    expect(
      records.filter(row => row.workflowReview === "discovery-only")
    ).toHaveLength(47);
  });
});
