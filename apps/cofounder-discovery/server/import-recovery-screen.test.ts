import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ImportRecoveryNotice } from "../client/src/components/ImportRecoveryNotice";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
function render(language: "en" | "nl", uncertain: boolean, busy = false) {
  const onRelease = vi.fn();
  const html = renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(ImportRecoveryNotice, {
        uncertain,
        busy,
        onRelease,
      }),
    })
  );
  expect(onRelease).not.toHaveBeenCalled();
  return html;
}
describe("uncertain CSV import recovery presentation", () => {
  it.each(["en", "nl"] as const)(
    "warns without claiming failed storage in %s",
    language => {
      const html = render(language, true);
      expect(html).toContain('role="alert"');
      expect(html).toContain(`lang="${language}"`);
      expect(html).toContain(
        language === "nl"
          ? "kunnen al zijn opgeslagen"
          : "may already have been saved"
      );
      expect(html).toContain(
        language === "nl"
          ? "regels zonder profiel-URL"
          : "rows without profile URLs"
      );
      expect(html).toContain(
        language === "nl"
          ? "Bewerken toestaan na controle"
          : "Allow editing after checking"
      );
      expect(html).toContain('type="button"');
      expect(html).toContain("max-w-full whitespace-normal");
      expect(html).not.toContain('type="submit"');
    }
  );
  it("does not show an uncertain-result warning before failure or after recovery", () => {
    expect(render("en", false)).toBe("");
    expect(render("nl", false, true)).toBe("");
  });
  it("disables edit release while busy or account checks are unavailable", () => {
    expect(render("nl", true, true)).toContain('disabled=""');
    expect(render("nl", true, false)).not.toContain('disabled=""');
  });
});
