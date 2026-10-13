import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CandidateExport } from "../client/src/components/CandidateExport";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
const mutateAsync = vi.fn();
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    criticalPath: {
      prospects: { exportCsv: { useMutation: () => ({ mutateAsync }) } },
    },
  },
}));
function render(language: "en" | "nl", accountBlocked = false) {
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(CandidateExport, {
        accountId: 4,
        accountBlocked,
      }),
    })
  );
}
describe("candidate CSV export language and scope", () => {
  it.each(["en", "nl"] as const)(
    "renders %s labels without initiating export",
    language => {
      const html = render(language);
      expect(html).toContain(`lang="${language}"`);
      expect(html).toContain(
        language === "nl"
          ? "Actieve kandidaten exporteren"
          : "Export active candidates"
      );
      expect(html).toContain('type="button"');
      expect(html).toContain("max-w-full whitespace-normal");
      expect(mutateAsync).not.toHaveBeenCalled();
    }
  );
  it("Dutch guidance retains exclusions, formula defense and export limits", () => {
    const html = render("nl");
    for (const term of [
      "afgemelde personen",
      "gearchiveerde kandidaten",
      "zoekopdracht wordt genegeerd",
      "text: ",
      "verliesvrije back-up",
      "volledige privacy-export",
      "10.000",
      "8 MiB",
      "zonder gedeeltelijk bestand",
    ])
      expect(html).toContain(term);
  });
  it.each(["en", "nl"] as const)(
    "refuses an unverified account in %s before interaction",
    language => {
      const html = render(language, true);
      expect(html).toContain('disabled=""');
      expect(html).toContain('role="alert"');
      expect(html).toContain(
        language === "nl"
          ? "Je account kon niet worden geverifieerd"
          : "Could not verify your account"
      );
      expect(mutateAsync).not.toHaveBeenCalled();
    }
  );
});
