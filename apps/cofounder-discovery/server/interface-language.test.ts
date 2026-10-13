import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LanguageProvider,
  localizedText,
  readUiLanguage,
  saveUiLanguage,
  UI_LANGUAGE_STORAGE_KEY,
  interfaceContentLanguage,
} from "../client/src/contexts/LanguageContext";
import { LanguageSelector } from "../client/src/components/LanguageSelector";
import Home from "../client/src/pages/Home";
import NotFound from "../client/src/pages/NotFound";
import { Router } from "wouter";

vi.mock("../client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

describe("English/Dutch interface language", () => {
  it("declares untranslated journey content as English even with a Dutch selection", () => {
    for (const path of ["/outreach", "/admin/security", "/dashboard"])
      expect(interfaceContentLanguage(path, "nl")).toBe("en");
    for (const path of [
      "/",
      "/login",
      "/404",
      "/unknown",
      "/verify-email",
      "/forgot-password",
      "/reset-password",
      "/onboarding",
    ])
      expect(interfaceContentLanguage(path, "nl")).toBe("nl");
  });
  it("reads only the versioned language key and defaults unknown values to English", () => {
    const getItem = vi.fn(() => "nl");
    expect(readUiLanguage({ getItem, setItem: vi.fn() })).toBe("nl");
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(getItem).toHaveBeenCalledWith(UI_LANGUAGE_STORAGE_KEY);
    for (const stored of [null, "", "de", "NL", '{"language":"nl"}'])
      expect(readUiLanguage({ getItem: () => stored, setItem: vi.fn() })).toBe(
        "en"
      );
    expect(readUiLanguage()).toBe("en");
  });
  it("tolerates blocked reads and writes without logging or storing account data", () => {
    const blocked = {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
    };
    expect(readUiLanguage(blocked)).toBe("en");
    expect(() => saveUiLanguage("nl", blocked)).not.toThrow();
    const setItem = vi.fn();
    saveUiLanguage("nl", { getItem: () => null, setItem });
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith(UI_LANGUAGE_STORAGE_KEY, "nl");
    saveUiLanguage("de" as "en", { getItem: () => null, setItem });
    expect(setItem).toHaveBeenCalledTimes(1);
  });
  it("selects original authored copy without translating or modifying user content", () => {
    expect(localizedText("en", "Sign in", "Inloggen")).toBe("Sign in");
    expect(localizedText("nl", "Sign in", "Inloggen")).toBe("Inloggen");
  });
  it.each(["en", "nl"] as const)(
    "renders an accessible selector and truthful partial-translation scope in %s",
    language => {
      const html = renderToStaticMarkup(
        createElement(LanguageProvider, {
          initialLanguage: language,
          children: createElement(LanguageSelector),
        })
      );
      expect(html).toContain('for="ui-language"');
      expect(html).toContain('aria-describedby="ui-language-scope"');
      expect(html).toContain('value="en"');
      expect(html).toContain('value="nl"');
      expect(html).toContain(
        language === "nl"
          ? "serverberichten blijven ongewijzigd/Engels"
          : "server messages remain unchanged/English"
      );
      expect(html).toContain(
        language === "nl"
          ? "bediening van de privé-accountexport"
          : "private account-export controls"
      );
      expect(html).toContain(
        language === "nl"
          ? "Oorspronkelijke gedownloade gegevens"
          : "Original downloaded data"
      );
      expect(html).not.toMatch(/value="(?:de|fr)"/);
      expect(html).toContain(
        language === "nl"
          ? "zoeken/filteren/sorteren/pagineren in de kandidatenlijst"
          : "candidate-list search/filter/order/pagination controls"
      );
      expect(html).toContain(
        language === "nl" ? "bron-/statuscodes" : "source/status codes"
      );
    }
  );
  it.each(["en", "nl"] as const)(
    "renders home and not-found copy in %s with original navigation",
    language => {
      const render = (screen: typeof Home | typeof NotFound) =>
        renderToStaticMarkup(
          createElement(LanguageProvider, {
            initialLanguage: language,
            children: createElement(Router, {
              ssrPath: "/",
              children: createElement(screen),
            }),
          })
        );
      const home = render(Home);
      const missing = render(NotFound);
      expect(home).toContain(
        language === "nl" ? "medeoprichter" : "co-founder research"
      );
      expect(home).toContain('href="/login"');
      expect(home).toContain('href="/api/health"');
      expect(missing).toContain(
        language === "nl" ? "Pagina niet gevonden" : "Page Not Found"
      );
      expect(home).toContain(
        language === "nl" ? "Eerlijke verzendstatus" : "Truthful delivery state"
      );
    }
  );
});
