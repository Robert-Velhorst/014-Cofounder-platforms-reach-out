import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  language: "en",
  review: null as any,
  error: false,
  fetching: false,
}));
vi.mock("../client/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: fixture.language,
    text: (en: string, nl: string) => (fixture.language === "nl" ? nl : en),
  }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      outreach: {
        details: {
          useQuery: () => ({
            data: fixture.review,
            isError: fixture.error,
            isFetching: fixture.fetching,
            error: { message: "Original server error" },
            refetch: vi.fn(),
          }),
        },
        cancel: { useMutation: () => ({ isPending: false }) },
      },
    },
  },
}));
vi.mock("../client/src/components/ConversationControls", () => ({
  ConversationControls: () => null,
}));
vi.mock("../client/src/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => createElement("div", null, children),
  DialogContent: ({ children, lang, closeLabel }: any) =>
    createElement(
      "article",
      { lang },
      children,
      createElement("button", null, closeLabel)
    ),
  DialogHeader: ({ children }: any) => createElement("header", null, children),
  DialogTitle: ({ children }: any) => createElement("h1", null, children),
  DialogDescription: ({ children }: any) => createElement("p", null, children),
}));
import { OutreachDraftManager } from "../client/src/components/OutreachDraftManager";
function render(
  language = "en",
  overrides: Record<string, any> = {},
  props = {}
) {
  fixture.language = language;
  fixture.error = overrides.error ?? false;
  fixture.fetching = overrides.fetching ?? false;
  fixture.review = {
    outreach: {
      id: 1,
      userId: 7,
      body: "Original private message",
      subject: "Original subject",
      state: "draft",
      revisesId: 4,
      confirmedSentAt: null,
      responseRecordedAt: null,
      closedAt: null,
      ...overrides.outreach,
    },
    prospect: { userId: 7, name: "Original candidate", ...overrides.prospect },
    revision: "a".repeat(64),
    replacementId: 9,
    canChange: true,
    revisionPolicy: { allowed: true, reason: "Original source policy" },
    ...overrides.review,
  };
  return renderToStaticMarkup(
    createElement(OutreachDraftManager, {
      id: 1,
      accountId: 7,
      accountBlocked: false,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      onChanged: vi.fn(),
      ...props,
    })
  );
}
describe("outreach manager language and retained safety controls", () => {
  it("keeps the English workflow and an unchecked cancellation acknowledgement", () => {
    const html = render();
    expect(html).toContain("Manage outreach");
    expect(html).toContain("Cancel unsent draft");
    expect(html).toContain("Original private message");
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Cancel unsent draft/);
  });
  it("translates controls and safeguards without translating retained text or policy", () => {
    const html = render("nl");
    for (const text of [
      "Bericht en contact beheren",
      "Bericht herzien",
      "Niet-verzonden concept annuleren",
      "Deze tool verzendt geen berichten",
      "bewaar de geschiedenis",
      "Vorige versie",
      "Vervanging",
      "Sluiten",
      "Onderwerp",
      "Concept",
    ])
      expect(html).toContain(text);
    expect(html).toContain('lang="nl"');
    expect(html).toContain('lang="en">Original source policy');
    expect(html).toContain("Original private message");
    expect(html).toContain("Original subject");
    expect(html).not.toContain('checked=""');
  });
  it.each([{ accountBlocked: true }, { accountId: 8 }])(
    "conceals another or unavailable account %#",
    props => {
      const html = render("nl", {}, props);
      expect(html).toContain("Privégegevens en acties blijven verborgen");
      expect(html).not.toContain("Original private message");
      expect(html).not.toContain("Bericht herzien");
    }
  );
  it("retains English server errors and blocks action while refreshing", () => {
    const html = render("nl", { error: true, fetching: true });
    expect(html).toContain('lang="en">Original server error');
    expect(html).toContain("Berichtgegevens opnieuw laden");
    expect(html).toContain("Berichtgegevens vernieuwen…");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Bericht herzien/);
  });
  it("retains closed history with missing and invalid date fallbacks", () => {
    const html = render("nl", {
      outreach: {
        state: "closed",
        confirmedSentAt: "invalid",
        closedAt: "2026-10-02T08:00:00Z",
      },
      review: { canChange: false },
    });
    expect(html).toContain(
      "Dit gesprek is gesloten. De geschiedenis blijft bewaard."
    );
    expect(html).toContain("Niet beschikbaar");
    expect(html).toContain("Niet vastgelegd");
    expect(html).not.toContain("Invalid Date");
    expect(html).not.toContain("Niet-verzonden concept annuleren");
  });
});
