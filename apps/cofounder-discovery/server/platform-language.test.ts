import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlatformCatalogue } from "../client/src/components/PlatformCatalogue";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
import { publicPlatformCatalogue } from "./platform-catalogue";

function render(language: "en" | "nl", records = publicPlatformCatalogue()) {
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(PlatformCatalogue, { records }),
    })
  );
}
describe("platform catalogue authored language", () => {
  it.each(["en", "nl"] as const)(
    "preserves discovery-only boundaries and source evidence in %s",
    language => {
      const records = publicPlatformCatalogue();
      const original = JSON.stringify(records);
      const html = render(language, records);
      expect(html).toContain('lang="' + language + '"');
      expect(html).toContain(
        language === "nl"
          ? "Waar vind je een medeoprichter?"
          : "Where to find a co-founder"
      );
      expect(html).toContain(
        language === "nl" ? "Niet gekoppeld" : "Not connected"
      );
      expect(html).toContain(
        language === "nl" ? "geen geverifieerde groep" : "not a verified group"
      );
      expect(html).toContain(
        language === "nl"
          ? "niet alle platforms wereldwijd"
          : "not every platform worldwide"
      );
      expect(html).toContain(
        language === "nl"
          ? "AI bewerkte berichten zijn verboden"
          : "AI-edited posts prohibited"
      );
      expect(html).toContain('value="dedicated"');
      expect(html).not.toContain('value="permission-required"'); // permission mode is informational, not an actionable control
      for (const record of records) {
        expect(html).toContain(
          'href="' + record.url.replaceAll("&", "&amp;") + '"'
        );
        expect(html).toContain(
          record.restrictions
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#x27;")
        );
      }
      expect(html).toContain('<dd lang="en"');
      expect(JSON.stringify(records)).toBe(original);
      expect(html).not.toMatch(
        />\s*(Connect|Generate|Send|Koppelen|Genereren|Verzenden)\s*</
      );
    }
  );
  it("renders Dutch empty-state guidance without inventing coverage or permissions", () => {
    const html = render("nl", []);
    expect(html).toContain("Geen bronnen passen bij deze filters");
    expect(html).toContain("0 van 0");
    expect(html).toContain("geen toestemming of garantie");
    expect(html).not.toContain("href=");
  });
});
