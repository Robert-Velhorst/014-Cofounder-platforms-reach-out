import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Help from "../client/src/pages/Help";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
import { LanguageSelector } from "../client/src/components/LanguageSelector";

function render(language: "en" | "nl", child = createElement(Help)) {
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: child,
    })
  );
}
describe("public localized help without account data", () => {
  it.each(["en", "nl"] as const)(
    "has real guide anchors and content language in %s",
    language => {
      const html = render(language);
      expect(html).toContain(`lang="${language}"`);
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect(html.match(/<h2/g)).toHaveLength(5);
      for (const id of ["access", "workflow", "rights", "recovery", "data"]) {
        expect(html).toContain(`href="#${id}"`);
        expect(html).toContain(`id="${id}"`);
      }
      expect(html).not.toMatch(/<form|<input|https:\/\//);
    }
  );
  it("explains manual delivery, unfinished erasure and uncertain retries without fake support", () => {
    const html = render("en");
    expect(html).toContain("not provider-confirmed delivery");
    expect(html).toContain("review-held intake—not instant erasure");
    expect(html).toContain("unchanged retry");
    expect(html).toContain("No support inbox");
  });
  it("localizes the complete help body", () => {
    const html = render("nl");
    expect(html).toContain("CoFounder Outreach gebruiken");
    expect(html).toContain("bewaar- en verwijderbeleid");
    expect(html).not.toContain("Getting access");
    expect(html).not.toContain("When something fails");
  });
  it.each(["en", "nl"] as const)(
    "opens help separately with safe opener controls in %s",
    language => {
      const html = render(language, createElement(LanguageSelector));
      expect(html).toContain(
        'href="/help" target="_blank" rel="noopener noreferrer"'
      );
      expect(html).toContain(
        language === "en" ? "opens in a new tab" : "opent in een nieuw tabblad"
      );
    }
  );
});
