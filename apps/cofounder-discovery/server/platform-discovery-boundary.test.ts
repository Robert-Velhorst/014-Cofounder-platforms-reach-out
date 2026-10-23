import { describe, expect, it, vi } from "vitest";

vi.mock("./platform-catalogue", async importOriginal => {
  const actual = await importOriginal<typeof import("./platform-catalogue")>();
  return {
    ...actual,
    publicPlatformCatalogue: () => [
      ...actual.publicPlatformCatalogue(),
      {
        ...actual.publicPlatformCatalogue()[0],
        id: "new-listing-without-workflow-review",
        name: "Synthetic discovery source",
        aliases: [],
        url: "https://discovery.example.invalid/",
        workflowReview: undefined,
      },
    ],
  };
});

import { resolveOutreachSource } from "./outreach-source-policy";

describe("discovery listing is not workflow admission", () => {
  it("fails closed when a newly listed source lacks a separate workflow review", () => {
    expect(
      resolveOutreachSource({
        platform: "new-listing-without-workflow-review",
        profileUrl: "https://discovery.example.invalid/",
      })
    ).toMatchObject({ allowed: false, destinationUrl: null });
  });
});
