import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ language: "en" }));
vi.mock("../client/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: fixture.language,
    text: (en: string, nl: string) => (fixture.language === "nl" ? nl : en),
  }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    accountData: { export: { useMutation: () => ({}) } },
  },
}));
import { AccountDataExport } from "../client/src/components/AccountDataExport";
function render(language = "en", accountBlocked = false) {
  fixture.language = language;
  return renderToStaticMarkup(
    createElement(AccountDataExport, { accountId: 7, accountBlocked })
  );
}
describe("private account export language and safeguards", () => {
  it("preserves the English path and unchecked private-data confirmation", () => {
    const html = render();
    expect(html).toContain('aria-label="Private account export" lang="en"');
    expect(html).toContain("Your account data");
    expect(html).toContain("Current password");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Download account JSON/);
    expect(html).not.toContain('checked=""');
  });
  it("renders Dutch controls and the full private-data warnings", () => {
    const html = render("nl");
    for (const expected of [
      'aria-label="Privé-export van accountgegevens" lang="nl"',
      "Je accountgegevens",
      "Huidig wachtwoord",
      "Accountgegevens als JSON downloaden",
      "Ik begrijp dat dit bestand privégegevens van mijn account en kandidaten bevat",
      "niet versleuteld",
      "20 MiB / 100.000",
      "Vijf pogingen per 15 minuten",
      "geen volledige beoordeling van een juridisch inzageverzoek",
      "Accountverwijdering is hier nog niet ingeschakeld",
      "verwijdert, archiveert of wijzigt je gegevens niet",
    ])
      expect(html).toContain(expected);
    expect(html).not.toContain("Current password");
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>Accountgegevens als JSON downloaden/
    );
  });
  it.each(["en", "nl"])(
    "keeps blocked %s accounts unable to export",
    language => {
      const html = render(language, true);
      expect(html).toContain('role="alert"');
      expect(html).toContain('<fieldset disabled=""');
      expect(html).toContain(
        language === "nl"
          ? "Je account kon niet worden geverifieerd"
          : "Your account could not be verified"
      );
      expect(html).toContain('type="password"');
      expect(html).toContain('autoComplete="current-password"');
      expect(html).toContain('maxLength="128"');
      expect(html).not.toContain('checked=""');
    }
  );
});
