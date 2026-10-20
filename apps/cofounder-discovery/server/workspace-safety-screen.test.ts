import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  WorkspaceModeBadge,
  WorkspaceSafetyStatus,
} from "../client/src/components/WorkspaceSafetyStatus";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";

function render(
  language: "en" | "nl",
  paused: boolean | undefined,
  failed: boolean,
  fetching: boolean
) {
  const retry = vi.fn();
  const props = { paused, failed, fetching, retry };
  const html = renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(
        "div",
        null,
        createElement(WorkspaceModeBadge, props),
        createElement(WorkspaceSafetyStatus, props)
      ),
    })
  );
  expect(retry).not.toHaveBeenCalled();
  return html;
}
describe("truthful workspace safety presentation", () => {
  it.each(["en", "nl"] as const)(
    "shows unknown state in %s instead of inferring assisted mode",
    language => {
      for (const props of [
        [undefined, false, false],
        [undefined, false, true],
        [false, true, false],
        [false, false, true],
      ] as const) {
        const html = render(language, ...props);
        expect(html).toContain(
          language === "nl"
            ? "Veiligheidsstatus onbekend"
            : "Safety status unknown"
        );
        expect(html).not.toContain(
          language === "nl" ? "Ondersteunde modus" : "Assisted mode"
        );
        expect(html).not.toContain(
          language === "nl"
            ? "Geen automatische verzending"
            : "No autonomous send"
        );
        expect(html).toContain('lang="' + language + '"');
      }
    }
  );
  it.each(["en", "nl"] as const)(
    "shows confirmed paused/unpaused state in %s",
    language => {
      expect(render(language, true, false, false)).toContain(
        language === "nl"
          ? "Veiligheidsstop is actief"
          : "Safety stop is active"
      );
      expect(render(language, false, false, false)).toContain(
        language === "nl"
          ? "Geen automatische verzending"
          : "No autonomous send"
      );
    }
  );
  it("disables retry while fetching and permits an explicit retry after failure", () => {
    expect(render("en", undefined, false, true)).toMatch(
      /<button[^>]* disabled=""/
    );
    expect(render("en", false, true, false)).not.toMatch(
      /<button[^>]* disabled=""/
    );
  });
});
