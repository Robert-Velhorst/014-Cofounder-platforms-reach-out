import { describe, expect, it } from "vitest";

async function policy() {
  const path = "./outreach-source-policy";
  const module = await import(path).catch(() => null);
  expect(module?.resolveOutreachSource).toBeTypeOf("function");
  return module!;
}

const now = new Date("2026-09-06T12:00:00.000Z");
const input = {
  actorId: 42,
  body: "I maintain the parser we discussed. Would you like to work on the next release together?",
  generationMode: "user_authored" as const,
  prospect: {
    platform: "HN",
    profileUrl: "https://news.ycombinator.com/user?id=example",
    consentStatus: "opted_in",
  },
};
const declaration = { humanOriginal: true, rulesReviewed: true };

describe("outreach source policy", () => {
  it.each([
    ["HN", "https://news.ycombinator.com/user?id=example", "hacker-news"],
    ["  StartHawk  ", "https://www.foundercloud.com/", "foundercloud"],
    [
      "foundercloud",
      "https://www.starthawk.io/profile/example",
      "foundercloud",
    ],
    [
      "ycombinator",
      "https://www.ycombinator.com/cofounder-matching",
      "yc-cofounder",
    ],
    [
      "r/cofounder",
      "https://www.reddit.com/r/cofounder/comments/123/example/",
      "reddit-cofounder",
    ],
    [null, "https://www.linkedin.com/in/example", "linkedin"],
    ["manual", null, "manual"],
  ])(
    "resolves %s and %s to its canonical manual source",
    async (platform, profileUrl, sourceId) => {
      const { resolveOutreachSource } = await policy();
      expect(resolveOutreachSource({ platform, profileUrl })).toMatchObject({
        allowed: true,
        sourceId,
      });
    }
  );

  it.each([
    ["manual", "https://news.ycombinator.com/"],
    ["yc-cofounder", "https://news.ycombinator.com/"],
    ["HN", "https://news.ycombinator.com.evil.invalid/"],
    ["HN", "https://news.ycombinator.com@evil.invalid/"],
    ["HN", "https://person:password@news.ycombinator.com/"],
    ["HN", "https://news.ycombinator.com:444/"],
    ["HN", "javascript:alert(1)"],
    ["HN", "http://news.ycombinator.com/"],
    ["HN", "https://news.ycombinator.com./"],
    ["r/cofounder", "https://www.reddit.com/r/cofounder-other/"],
    ["r/cofounder", "https://www.reddit.com/r/startups/"],
    ["unreviewed", "https://www.linkedin.com/in/example"],
    ["manual", "https://unreviewed.invalid/profile"],
    [null, null],
    ["unknown", null],
  ])(
    "denies ambiguous or unsafe source %s at %s",
    async (platform, profileUrl) => {
      const { resolveOutreachSource } = await policy();
      const decision = resolveOutreachSource({ platform, profileUrl });
      expect(decision.allowed).toBe(false);
      expect(decision.reason.length).toBeGreaterThan(0);
    }
  );

  it.each([
    ["F6S", "https://www.f6s.com/"],
    [null, "https://f6s.com/profile/example"],
    ["discord-founder-groups", "https://discord.com/channels/123/456"],
    ["slack-founder-groups", null],
    ["facebook-founder-groups", "https://www.facebook.com/groups/example"],
  ])(
    "keeps research and unconfigured group holds closed for %s",
    async (platform, profileUrl) => {
      const { resolveOutreachSource } = await policy();
      expect(resolveOutreachSource({ platform, profileUrl }).allowed).toBe(
        false
      );
    }
  );

  it("creates a body-bound human declaration without treating it as provider permission", async () => {
    const { declareOutreachSource, assessOutreachSource } = await policy();
    const receipt = declareOutreachSource(input, declaration, now);
    expect(receipt).toMatchObject({
      actorId: 42,
      sourceId: "hacker-news",
      humanOriginal: true,
      rulesReviewed: true,
      reviewedAt: now.toISOString(),
    });
    expect(receipt).not.toHaveProperty("providerPermissionVerified");
    expect(JSON.stringify(receipt)).not.toContain(input.body);
    expect(assessOutreachSource(input, receipt, now).allowed).toBe(true);
  });

  it.each(["template", "ai"])(
    "rejects %s content even with a human declaration",
    async generationMode => {
      const { declareOutreachSource } = await policy();
      expect(() =>
        declareOutreachSource({ ...input, generationMode }, declaration, now)
      ).toThrow();
    }
  );

  it.each([
    { humanOriginal: false, rulesReviewed: true },
    { humanOriginal: true, rulesReviewed: false },
    {},
    null,
  ])("requires both explicit declarations: %j", async acknowledgement => {
    const { declareOutreachSource } = await policy();
    expect(() => declareOutreachSource(input, acknowledgement, now)).toThrow();
  });

  it("invalidates approvals when owner, body, source, destination or generation changes", async () => {
    const { declareOutreachSource, assessOutreachSource } = await policy();
    const receipt = declareOutreachSource(input, declaration, now);
    const variants = [
      { ...input, actorId: 43 },
      { ...input, body: input.body + " changed" },
      { ...input, generationMode: "template" },
      { ...input, prospect: { platform: "manual", profileUrl: null } },
      {
        ...input,
        prospect: {
          ...input.prospect,
          profileUrl: "https://news.ycombinator.com/user?id=someone-else",
        },
      },
      { ...input, prospect: { ...input.prospect, consentStatus: "opted_out" } },
      { ...input, prospect: { ...input.prospect, archivedAt: now } },
    ];
    for (const variant of variants)
      expect(assessOutreachSource(variant, receipt, now).allowed).toBe(false);
  });

  it("expires at 30 days and rejects future, stale, forged-shaped or missing receipts", async () => {
    const { declareOutreachSource, assessOutreachSource } = await policy();
    const receipt = declareOutreachSource(input, declaration, now);
    expect(
      assessOutreachSource(
        input,
        receipt,
        new Date(now.getTime() + 30 * 86400000 - 1)
      ).allowed
    ).toBe(true);
    expect(
      assessOutreachSource(
        input,
        receipt,
        new Date(now.getTime() + 30 * 86400000)
      ).allowed
    ).toBe(false);
    expect(
      assessOutreachSource(input, receipt, new Date(now.getTime() - 1)).allowed
    ).toBe(false);
    for (const invalid of [
      null,
      {},
      { ...receipt, version: "old-policy" },
      { ...receipt, reviewedAt: "invalid" },
      { ...receipt, actorId: 0 },
      { ...receipt, humanOriginal: false },
    ]) {
      expect(assessOutreachSource(input, invalid, now).allowed).toBe(false);
    }
  });

  it("will not mint a declaration for opted-out, archived, held or empty-content work", async () => {
    const { declareOutreachSource } = await policy();
    for (const variant of [
      { ...input, body: "  " },
      { ...input, actorId: 0 },
      { ...input, prospect: { ...input.prospect, consentStatus: "opted_out" } },
      { ...input, prospect: { ...input.prospect, archivedAt: now } },
      { ...input, prospect: { platform: "F6S" } },
    ])
      expect(() => declareOutreachSource(variant, declaration, now)).toThrow();
  });
});
