import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FollowUpQueue } from "../client/src/components/FollowUpQueue";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
import { outreachStates } from "./outreach-state";

const fixture = vi.hoisted(() => ({ query: {} as any }));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      outreach: {
        reminders: {
          useQuery: () => fixture.query,
        },
      },
    },
  },
}));
function render(language: "en" | "nl", query = {}, blocked = false) {
  fixture.query = { isFetching: false, isError: false, ...query };
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(FollowUpQueue, {
        accountId: 4,
        blocked,
        onManage: () => {},
      }),
    })
  );
}
const data = {
  accountId: 4,
  asOf: "2026-10-02T10:00:00.000Z",
  total: 1,
  items: [
    {
      id: 12,
      name: "Original user name",
      platform: "Original platform",
      due: true,
      followUpAt: "2026-10-02T09:00:00.000Z",
      state: "confirmed_sent",
    },
  ],
};
describe("localized internal reminder queue", () => {
  it.each(["en", "nl"] as const)(
    "labels the complete queue in %s without translating user content",
    language => {
      const html = render(language, { data });
      expect(html).toContain(`lang="${language}"`);
      expect(html).toContain(
        language === "nl" ? "Vervolgherinneringen" : "Follow-up reminders"
      );
      expect(html).toContain(
        language === "nl" ? "geen geplande berichten" : "not scheduled messages"
      );
      expect(html).toContain(
        language === "nl" ? "Herinnering 12 beheren" : "Manage reminder 12"
      );
      expect(html).toContain(
        language === "nl"
          ? "Handmatig verzenden bevestigd"
          : "Manual sending confirmed"
      );
      expect(html).toContain(
        language === "nl" ? "Vorige herinneringen" : "Previous reminders"
      );
      expect(html).toContain("Original user name");
      expect(html).toContain("Original platform");
      expect(html).not.toContain("confirmed sent");
      expect(html).toContain(
        new Date(data.asOf).toLocaleString(
          language === "nl" ? "nl-NL" : "en-GB"
        )
      );
      expect(html).toContain(
        language === "nl" ? "lokale tijdzone" : "local time zone"
      );
    }
  );
  it("renders Dutch loading, empty, unknown status and unavailable date states", () => {
    expect(render("nl", { isFetching: true })).toContain(
      "Herinneringen vernieuwen"
    );
    expect(render("nl", { data: { ...data, total: 0, items: [] } })).toContain(
      "Geen herinneringen in deze weergave"
    );
    const html = render("nl", {
      data: {
        ...data,
        items: [{ ...data.items[0], state: "future_status", followUpAt: null }],
      },
    });
    expect(html).toContain("Onbekende status");
    expect(html).toContain("Niet beschikbaar");
    expect(html).not.toContain("future status");
  });
  it("marks unchanged server errors as English inside the Dutch panel", () => {
    const html = render("nl", {
      isError: true,
      error: { message: "Server refusal" },
    });
    expect(html).toContain("Herinneringen konden niet worden geladen");
    expect(html).toContain('<span lang="en">Server refusal</span>');
    expect(html).toContain("Opnieuw proberen");
  });
  it("localizes account refusal and never exposes another account's reminders", () => {
    expect(render("nl", {}, true)).toContain("Bevestig je huidige account");
    expect(render("nl", { data: { ...data, accountId: 7 } })).not.toContain(
      "Original user name"
    );
  });
  it("has authored labels for every current state, without displaying raw enum names", () => {
    for (const state of outreachStates) {
      const html = render("nl", {
        data: { ...data, items: [{ ...data.items[0], state }] },
      });
      expect(html).not.toContain("Onbekende status");
      expect(html).not.toContain(state.replaceAll("_", " "));
    }
  });
});
