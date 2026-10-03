import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ pending: false }));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      prospects: {
        previewIntake: { useMutation: () => ({ isPending: fixture.pending }) },
        add: { useMutation: () => ({ isPending: false }) },
      },
    },
  },
}));
vi.mock("../client/src/components/ui/dialog", () => ({
  useDialogComposition: () => ({
    isComposing: false,
    justEndedComposing: () => false,
    setComposing: () => {},
    markCompositionEnd: () => {},
  }),
  Dialog: ({ children }: any) => createElement("div", null, children),
  DialogContent: ({ children, lang }: any) =>
    createElement("article", { lang }, children),
  DialogHeader: ({ children }: any) => createElement("header", null, children),
  DialogTitle: ({ children }: any) => createElement("h1", null, children),
  DialogDescription: ({ children }: any) => createElement("p", null, children),
}));
import { CandidateIntake } from "../client/src/components/CandidateIntake";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
function render(language: "en" | "nl", blocked = false, pending = false) {
  fixture.pending = pending;
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(CandidateIntake, {
        accountId: 7,
        accountBlocked: blocked,
        onClose: vi.fn(),
        onOpen: vi.fn(),
        onChanged: vi.fn(),
      }),
    })
  );
}
describe("candidate intake language and safety presentation", () => {
  it.each(["en", "nl"] as const)(
    "labels all initial fields in %s",
    language => {
      const html = render(language);
      expect(html).toContain(`lang="${language}"`);
      const labels =
        language === "nl"
          ? [
              "Kandidaat toevoegen",
              "Naam kandidaat",
              "Rol of titel",
              "Locatie",
              "Achtergrond",
              "Vaardigheden (één per regel)",
              "Ervaring",
              "Sectoren (één per regel)",
              "Huidig bedrijf",
              "Zoekt (één per regel)",
              "Startupfase",
              "Bronplatform-ID of naam",
              "Profiel-URL (optioneel)",
              "Bewijsreferentie",
              "Vastgelegde contactstatus",
              "Mogelijke duplicaten bekijken",
            ]
          : [
              "Add candidate",
              "Candidate name",
              "Role / title",
              "Evidence reference",
              "Recorded contact status",
              "Preview possible duplicates",
            ];
      for (const label of labels) expect(html).toContain(label);
      expect(html).toContain('for="intake-name"');
      expect(html).toContain('value="manual"');
      expect(html).not.toContain('checked=""');
      expect(html).toMatch(/max[Ll]ength="10000"/);
    }
  );
  it("keeps declarations distinct from contact approval and preserves protocol values", () => {
    const html = render("nl");
    expect(html).toContain("geen platformgoedkeuring of toestemming");
    expect(html).toContain("geen toestemming verondersteld");
    expect(html).toContain("geen correspondentie of geheimen");
    for (const value of [
      "unknown",
      "legitimate_interest",
      "opted_in",
      "opted_out",
    ])
      expect(html).toContain(`value="${value}"`);
    expect(html).toContain("Afgemeld — niet contacteren");
  });
  it.each(["en", "nl"] as const)(
    "conceals the input form when the account is blocked in %s",
    language => {
      const html = render(language, true);
      expect(html).toContain('role="alert"');
      expect(html).toContain(
        language === "nl"
          ? "Je invoer blijft in dit tabblad behouden"
          : "Your input is retained in this tab"
      );
      expect(html).not.toContain('id="intake-name"');
      expect(html).not.toContain('value="manual"');
      expect(html).not.toContain("Preview possible duplicates");
    }
  );
  it("uses the selected language while preview is pending and disables the inputs", () => {
    const html = render("nl", false, true);
    expect(html).toContain("Kandidaten controleren…");
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("Checking candidates…");
  });
});
