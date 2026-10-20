import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConversationControls } from "../client/src/components/ConversationControls";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      outreach: { conversation: { useMutation: () => ({ isPending: false }) } },
    },
  },
}));
const review = {
  outreach: {
    id: 1,
    userId: 1,
    state: "confirmed_sent",
    confirmedSentAt: new Date(),
    responseRecordedAt: null,
    followUpAt: null,
    closedAt: null,
  },
  prospect: { consentStatus: "opted_in", archivedAt: null },
  revision: "a".repeat(64),
} as any;
const render = (overrides = {}, language: "en" | "nl" = "en") =>
  renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(ConversationControls, {
        review,
        blocked: false,
        onBusy: () => {},
        onChanged: async () => {},
        ...overrides,
      }),
    })
  );
describe("conversation history controls", () => {
  it("handles invalid retained dates without formatting failures in Dutch", () => {
    const html = render(
      {
        review: {
          ...review,
          outreach: {
            ...review.outreach,
            confirmedSentAt: "invalid",
            responseRecordedAt: "invalid",
            followUpAt: "invalid",
          },
        },
      },
      "nl"
    );
    expect(html.match(/Niet beschikbaar/g)).toHaveLength(3);
    expect(html).not.toContain("Invalid Date");
  });
  it("keeps blocked controls disabled and hides a closed record in Dutch", () => {
    expect(render({ blocked: true }, "nl")).toContain('<fieldset disabled=""');
    expect(
      render(
        {
          review: {
            ...review,
            outreach: {
              ...review.outreach,
              state: "closed",
              closedAt: new Date(),
            },
          },
        },
        "nl"
      )
    ).toBe("");
  });
  it("renders the complete Dutch control panel with safety acknowledgements and local dates", () => {
    const html = render({}, "nl");
    expect(html).toContain('lang="nl"');
    for (const copy of [
      "Gesprek en vervolgactie",
      "Er worden geen berichten of meldingen verzonden",
      "Ik heb buiten deze tool een reactie ontvangen",
      "Reactie vastleggen",
      "Herinneringsdatum en -tijd",
      "Herinnering opslaan",
      "Gesprek sluiten en de geschiedenis bewaren",
      "verwijdert geen geschiedenis",
      "Je tijdzone",
    ])
      expect(html).toContain(copy);
    expect(html).toContain(
      new Date(review.outreach.confirmedSentAt).toLocaleString("nl-NL")
    );
    expect(html).not.toContain("Save reminder");
  });
  it("keeps Dutch history and cancellation controls when new reminders are suppressed", () => {
    const html = render(
      {
        review: {
          ...review,
          prospect: { ...review.prospect, archivedAt: new Date() },
          outreach: { ...review.outreach, followUpAt: new Date() },
        },
      },
      "nl"
    );
    expect(html).toContain("Nieuwe herinneringen zijn niet beschikbaar");
    expect(html).toContain("Herinnering annuleren");
    expect(html).toContain("Reactie vastleggen");
    expect(html).not.toContain("Herinnering opslaan");
  });
  it("offers explicit historical acknowledgments and internal-only reminders", () => {
    const html = render();
    expect(html).toContain("I received a response outside this tool");
    expect(html).toContain("Close this conversation and retain its history");
    expect(html).toContain("No messages or notifications are sent");
    expect(html).toContain("Save reminder");
  });
  it("does not offer conversation actions for an unsent record", () => {
    expect(
      render({
        review: { ...review, outreach: { ...review.outreach, state: "draft" } },
      })
    ).toBe("");
  });
  it("explains suppression but keeps history controls for opted-out candidates", () => {
    const html = render({
      review: {
        ...review,
        prospect: { ...review.prospect, consentStatus: "opted_out" },
      },
    });
    expect(html).toContain("New reminders are unavailable");
    expect(html).not.toContain("Save reminder");
    expect(html).toContain("Record response");
  });
});
