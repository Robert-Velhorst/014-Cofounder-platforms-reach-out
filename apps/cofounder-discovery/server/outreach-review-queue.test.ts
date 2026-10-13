import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OutreachReviewQueue } from "../client/src/components/OutreachReviewQueue";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
function render(
  language: "en" | "nl" = "en",
  state = "draft",
  options: Record<string, any> = {}
) {
  const item = {
    outreach: {
      id: 4,
      userId: 7,
      state,
      body: "Original exact message — café",
      subject: "Original subject",
      updatedAt: new Date("2026-10-02T09:00:00Z"),
      destinationUrl: "https://example.invalid/reviewed-only",
      ...options.outreach,
    },
    prospect: { name: "Original candidate", userId: 7, ...options.prospect },
    actionPolicy: options.noPolicy
      ? undefined
      : { allowed: !options.suppressed, reason: "Original source restriction" },
  };
  const handlers = Object.fromEntries(
    ["review", "approve", "prepare", "copy", "open", "confirm"].map(name => [
      name,
      vi.fn(),
    ])
  );
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(OutreachReviewQueue, {
        items: options.empty ? [] : ([item] as any),
        accountId: 7,
        blocked: options.blocked ?? false,
        pending: options.pending ?? false,
        handlers: handlers as any,
        onManage: vi.fn(),
      }),
    })
  );
}
describe("review queue language and explicit historical confirmation", () => {
  it("keeps English actions and original message text", () => {
    const html = render();
    expect(html).toContain("Review and assisted-send queue");
    expect(html).toContain("Submit review");
    expect(html).toContain("Original exact message — café");
    expect(html).toContain('aria-label="Manage outreach 4"');
    expect(html).not.toContain("I sent this");
  });
  it.each([
    ["draft", "Ter beoordeling indienen"],
    ["pending_review", "Goedkeuren"],
    ["approved", "Handmatige verzending voorbereiden"],
  ])("renders the Dutch %s transition", (state, label) => {
    const html = render("nl", state);
    expect(html).toContain('lang="nl"');
    expect(html).toContain("Beoordeling en handmatige contactvoorbereiding");
    expect(html).toContain(label);
    expect(html).toContain("Original exact message — café");
    expect(html).not.toContain("Ik heb dit verzonden");
  });
  it("requires an unchecked exact-message declaration, not a one-click confirmation", () => {
    const html = render("nl", "manual_action_required");
    expect(html).toContain("geen bewijs van aflevering");
    expect(html).toContain("verzend nu niets");
    expect(html).toContain("Bericht kopiëren");
    expect(html).toContain("Bestemming openen");
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Ik heb dit verzonden/);
  });
  it("keeps historical confirmation after suppression, without enabling copy or a new destination", () => {
    const html = render("nl", "manual_action_required", { suppressed: true });
    expect(html).toContain('lang="en">Original source restriction');
    expect(html).toContain("nieuwe verzending is niet toegestaan");
    expect(html).toContain("Ik heb dit exacte bericht daadwerkelijk");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Bericht kopiëren/);
    expect(html).not.toContain("Bestemming openen");
  });
  it.each([{ blocked: true }, { pending: true }, { noPolicy: true }])(
    "blocks a draft transition for unavailable state %#",
    options => {
      const html = render("nl", "draft", options);
      expect(html).toMatch(
        /<button[^>]*disabled=""[^>]*>Ter beoordeling indienen/
      );
    }
  );
  it.each([{ outreach: { userId: 8 } }, { prospect: { userId: 8 } }])(
    "conceals foreign retained records %#",
    options => {
      expect(render("nl", "draft", options)).not.toContain(
        "Original exact message"
      );
      expect(render("nl", "draft", options)).not.toContain(
        "Original candidate"
      );
    }
  );
  it.each(["cancelled", "closed", "confirmed_sent"])(
    "offers history but no workflow transition for %s",
    state => {
      const html = render("nl", state);
      expect(html).toContain("Bekijken / beheren");
      expect(html).not.toContain("Ik heb dit verzonden");
      expect(html).not.toContain("Ter beoordeling indienen");
      expect(html).not.toContain("Handmatige verzending voorbereiden");
    }
  );
  it("renders the Dutch empty queue without fabricated records", () => {
    const html = render("nl", "draft", { empty: true });
    expect(html).toContain(
      "Schrijf een kandidaatbericht om de wachtrij te starten"
    );
    expect(html).not.toContain("Original candidate");
  });
});
