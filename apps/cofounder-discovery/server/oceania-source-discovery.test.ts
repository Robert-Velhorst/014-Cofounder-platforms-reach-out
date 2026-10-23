import { describe, expect, it } from "vitest";
import { publicPlatformCatalogue, filterPlatforms } from "./platform-catalogue";
import { resolveOutreachSource } from "./outreach-source-policy";

describe("Australia program discovery without an invented new matcher or permission", () => {
  it("enriches the existing Antler record with dated, region-specific source evidence", () => {
    const records = publicPlatformCatalogue();
    const row = records.find(item => item.id === "antler")!;
    expect(row).toMatchObject({
      name: "Antler",
      url: "https://www.antler.co/",
      category: "program",
      pricingStatus: "investment-terms",
      reviewedAt: "2026-10-23",
      workflowReview: "manual-reviewed",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(row.audience).toMatch(
      /Australia.*Sydney.*Melbourne.*Brisbane.*not a standalone/
    );
    expect(row.access).toMatch(
      /eight-week.*solo entrants.*investment is for teams/
    );
    expect(row.access).toMatch(
      /8 February 2027.*start date, not an application deadline/
    );
    expect(row.access).toMatch(/foreign-applicant\/visa eligibility.*untested/);
    expect(row.pricing).toMatch(
      /7 April 2026.*AU\$260,000.*12%.*not guaranteed/
    );
    expect(row.pricing).toMatch(/Australian fees.*unverified/);
    expect(row.restrictions).toMatch(
      /does not expand.*collection\/contact rights/
    );
    expect(row.restrictions).toMatch(
      /MENAP.*do not apply automatically to Australia/
    );
    expect(row.restrictions).toMatch(
      /contracting entity.*unresolved.*11 December 2020/
    );
    for (const url of [
      "https://www.antler.co/location/menap",
      "https://www.antler.co/location/australia",
      "https://www.antler.co/cohort-start-dates",
      "https://www.antler.co/blog/behind-the-scenes-a-look-inside-antlers-residency-in-australia",
      "https://www.antler.co/legal/privacy-policy",
    ])
      expect(row.evidence).toContain(url);
    expect(
      records.filter(item => new URL(item.url).hostname === "www.antler.co")
    ).toHaveLength(1);
  });

  it.each([
    "Antler Australia",
    "Antler Sydney",
    "Antler Melbourne",
    "Antler Brisbane",
  ])(
    "finds the existing program for %s without treating it as dedicated matching",
    query => {
      const records = publicPlatformCatalogue();
      expect(
        filterPlatforms(records, query, "program").map(row => row.id)
      ).toEqual(["antler"]);
      expect(
        filterPlatforms(records, query, "dedicated").map(row => row.id)
      ).not.toContain("antler");
      // Search enrichment is not a new approved action-label alias.
      expect(records.find(row => row.id === "antler")!.aliases).not.toContain(
        query
      );
      expect(resolveOutreachSource({ platform: query }).allowed).toBe(false);
    }
  );

  it("keeps held leads unpublished and existing admission/integration totals unchanged", () => {
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    expect(
      records.filter(row => row.workflowReview === "manual-reviewed")
    ).toHaveLength(23);
    expect(
      records.filter(row => row.workflowReview === "discovery-only")
    ).toHaveLength(47);
    expect(records.filter(row => row.category === "dedicated")).toHaveLength(
      23
    );
    for (const platform of [
      "Lineup",
      "lineup-nz",
      "ASIHUB",
      "AFC Connect",
      "ConnectX",
    ])
      expect(resolveOutreachSource({ platform }).allowed).toBe(false);
    expect(
      records.some(row =>
        [
          "lineup-nz",
          "asihub",
          "afc-connect",
          "connectx",
          "antler-australia",
        ].includes(row.id)
      )
    ).toBe(false);
    expect(resolveOutreachSource({ platform: "antler" })).toMatchObject({
      allowed: true,
      sourceId: "antler",
    });
    for (const row of records)
      expect(row.integration).toEqual({
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      });
  });
});
