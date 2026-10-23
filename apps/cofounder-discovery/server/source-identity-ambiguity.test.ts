import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlatformRecord } from "../shared/platform-catalogue";

function source(patch: Partial<PlatformRecord> = {}): PlatformRecord {
  return {
    id: "linkedin",
    name: "Synthetic reviewed source",
    url: "https://reviewed.example.invalid/",
    aliases: [],
    category: "community",
    kind: "source",
    audience: "Synthetic fixture",
    access: "Synthetic fixture",
    pricingStatus: "unknown",
    pricing: "Unverified",
    assistance: "manual-discovery",
    aiPostDrafts: "unverified",
    restrictions: "Synthetic fixture",
    evidence: ["https://reviewed.example.invalid/"],
    reviewedAt: "2026-10-23",
    workflowReview: "manual-reviewed",
    reviewer: "Synthetic unit fixture",
    integration: {
      implemented: false,
      permissionVerified: false,
      liveVerified: false,
    },
    ...patch,
  };
}
async function policy(records: PlatformRecord[]) {
  vi.resetModules();
  // Explicit catalogue double tests future collision handling, not a claim of
  // a current catalogue collision or actual provider/browser/database behavior.
  vi.doMock("./platform-catalogue", () => ({
    publicPlatformCatalogue: () => records,
  }));
  return import("./outreach-source-policy");
}
afterEach(() => {
  vi.doUnmock("./platform-catalogue");
  vi.resetModules();
});
const original = {
  actorId: 42,
  body: "Original synthetic review",
  generationMode: "user_authored" as const,
};
const acknowledgement = { humanOriginal: true, rulesReviewed: true };
const now = new Date("2026-10-23T00:00:00Z");

describe("source identity ambiguity refuses rather than inheriting admission", () => {
  it.each([false, true])(
    "refuses shared normalized labels in either record order (reverse=%s)",
    async reverse => {
      const records = [
        source({ aliases: [" Shared Identity "] }),
        source({
          id: "held",
          name: "Synthetic discovery",
          url: "https://held.example.invalid/",
          aliases: ["shared identity"],
          workflowReview: "discovery-only",
        }),
      ];
      const p = await policy(reverse ? [...records].reverse() : records);
      for (const platform of ["shared identity", "  SHARED IDENTITY  "]) {
        expect(p.resolveOutreachSource({ platform }).allowed).toBe(false);
        expect(() =>
          p.declareOutreachSource(
            { ...original, prospect: { platform } },
            acknowledgement,
            now
          )
        ).toThrow();
      }
      // Explicit non-ambiguous identity still has its original bounded decision.
      expect(p.resolveOutreachSource({ platform: "linkedin" }).allowed).toBe(
        true
      );
      expect(p.resolveOutreachSource({ platform: "held" }).allowed).toBe(false);
    }
  );

  it.each([false, true])(
    "refuses shared normalized hosts even when the label is reviewed (reverse=%s)",
    async reverse => {
      const records = [
        source({ url: "https://www.shared.example.invalid/manual" }),
        source({
          id: "held",
          name: "Synthetic discovery",
          url: "https://shared.example.invalid/discovery",
          workflowReview: "discovery-only",
        }),
      ];
      const p = await policy(reverse ? [...records].reverse() : records);
      for (const profileUrl of [
        "https://shared.example.invalid/manual",
        "https://www.shared.example.invalid/discovery",
      ]) {
        for (const platform of [undefined, "linkedin", "manual", "held"])
          expect(
            p.resolveOutreachSource({ platform, profileUrl })
          ).toMatchObject({ allowed: false, destinationUrl: null });
        expect(() =>
          p.declareOutreachSource(
            { ...original, prospect: { platform: "linkedin", profileUrl } },
            acknowledgement,
            now
          )
        ).toThrow();
      }
      expect(p.resolveOutreachSource({ platform: "linkedin" }).allowed).toBe(
        true
      );
    }
  );

  it("does not restore a collision when a third source repeats the last identity", async () => {
    const records = [
      source({ aliases: ["Shared"] }),
      source({
        id: "held",
        name: "Synthetic discovery",
        url: "https://held.example.invalid/",
        aliases: ["shared"],
        workflowReview: "discovery-only",
      }),
      source({
        id: "third",
        name: "Synthetic third",
        url: "https://third.example.invalid/",
        aliases: ["SHARED"],
      }),
    ];
    const p = await policy(records);
    expect(p.resolveOutreachSource({ platform: "shared" }).allowed).toBe(false);
    const hostRecords = records.map(row => ({
      ...row,
      url: "https://shared.example.invalid/",
    }));
    const q = await policy(hostRecords);
    expect(
      q.resolveOutreachSource({ profileUrl: "https://shared.example.invalid/" })
        .allowed
    ).toBe(false);
  });

  it.each([false, true])(
    "refuses duplicate IDs regardless of which permission comes first (reverse=%s)",
    async reverse => {
      const records = [
        source(),
        source({
          name: "Duplicate identity",
          url: "https://held.example.invalid/",
          workflowReview: "discovery-only",
        }),
      ];
      const p = await policy(reverse ? [...records].reverse() : records);
      for (const prospect of [
        { platform: "linkedin" },
        { platform: "Synthetic reviewed source" },
        { profileUrl: "https://reviewed.example.invalid/" },
        { profileUrl: "https://held.example.invalid/" },
      ])
        expect(p.resolveOutreachSource(prospect)).toMatchObject({
          allowed: false,
          sourceId: "linkedin",
          destinationUrl: null,
        });
    }
  );

  it.each(["manual", "f6s"])(
    "does not let catalogue records claim reserved ID %s",
    async id => {
      const p = await policy([source({ id })]);
      for (const prospect of [
        { platform: id },
        { profileUrl: "https://reviewed.example.invalid/" },
      ])
        expect(p.resolveOutreachSource(prospect).allowed).toBe(false);
    }
  );

  it.each(["manual", "f6s", "ycombinator"])(
    "keeps reserved/legacy label %s unresolved on collision",
    async alias => {
      const p = await policy([source({ aliases: [alias] })]);
      expect(p.resolveOutreachSource({ platform: alias }).allowed).toBe(false);
      expect(p.resolveOutreachSource({ platform: "linkedin" }).allowed).toBe(
        true
      );
    }
  );

  it("does not let the legacy StartHawk route override another source sharing that host", async () => {
    const p = await policy([
      source({ id: "foundercloud", url: "https://foundercloud.com/" }),
      source({
        id: "held",
        name: "Synthetic held source",
        url: "https://www.starthawk.io/",
        workflowReview: "discovery-only",
      }),
    ]);
    expect(
      p.resolveOutreachSource({
        platform: "foundercloud",
        profileUrl: "https://starthawk.io/profile/synthetic",
      }).allowed
    ).toBe(false);
    expect(
      p.resolveOutreachSource({
        platform: "foundercloud",
        profileUrl: "https://foundercloud.com/",
      }).allowed
    ).toBe(true);
  });

  it("preserves repeated same-source aliases and current bounded special scopes", async () => {
    const p = await policy([
      source({
        aliases: ["Synthetic reviewed source", " LINKEDIN ", "linkedin"],
      }),
      source({
        id: "foundercloud",
        name: "Synthetic foundercloud",
        url: "https://foundercloud.com/",
      }),
      source({
        id: "reddit-cofounder",
        name: "Synthetic reddit",
        url: "https://www.reddit.com/r/cofounder/",
      }),
    ]);
    expect(p.resolveOutreachSource({ platform: " LINKEDIN " }).allowed).toBe(
      true
    );
    expect(
      p.resolveOutreachSource({
        profileUrl: "https://starthawk.io/profile/synthetic",
      }).allowed
    ).toBe(true);
    expect(
      p.resolveOutreachSource({
        profileUrl: "https://reddit.com/r/cofounder/comments/synthetic/",
      }).allowed
    ).toBe(true);
    expect(
      p.resolveOutreachSource({ profileUrl: "https://reddit.com/r/startups/" })
        .allowed
    ).toBe(false);
    expect(p.resolveOutreachSource({ platform: "manual" }).allowed).toBe(true);
    expect(
      p.resolveOutreachSource({ profileUrl: "https://f6s.com/synthetic" })
        .allowed
    ).toBe(false);
  });
});
