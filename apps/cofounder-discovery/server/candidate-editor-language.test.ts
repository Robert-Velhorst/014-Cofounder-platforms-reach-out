import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CandidateEditor } from "../client/src/components/CandidateEditor";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      prospects: { edit: { useMutation: () => ({ isPending: false }) } },
    },
  },
}));
const review = {
  revision: "a".repeat(64),
  prospect: {
    id: 2,
    userId: 4,
    name: "Original candidate",
    title: "Original title",
    location: "Original location",
    bio: "Original biography",
    skills: ["Original skill"],
    experience: "Original experience",
    industries: ["Original industry"],
    currentCompany: "Original company",
    lookingFor: ["Original goal"],
    startupStage: "Original stage",
  },
} as any;
function render(language: "en" | "nl", overrides = {}) {
  return renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(CandidateEditor, {
        review,
        blocked: false,
        concealed: false,
        onDirty: () => {},
        onBusy: () => {},
        onCancel: () => {},
        onSaved: async () => {},
        ...overrides,
      }),
    })
  );
}
describe("bilingual captured candidate corrections", () => {
  it.each(["en", "nl"] as const)(
    "renders labelled profile fields in %s without translating user content",
    language => {
      const html = render(language);
      expect(html).toContain(`lang="${language}"`);
      expect(html).toContain(
        language === "nl"
          ? "Kandidaatprofiel corrigeren"
          : "Correct candidate profile"
      );
      const labels =
        language === "nl"
          ? [
              "Naam kandidaat",
              "Rol of titel",
              "Locatie",
              "Biografie",
              "Vaardigheden (één per regel)",
              "Ervaring",
              "Sectoren (één per regel)",
              "Huidig bedrijf",
              "Zoekt (één per regel)",
              "Startupfase",
            ]
          : [
              "Candidate name",
              "Role or title",
              "Location",
              "Biography",
              "Skills (one per line)",
              "Experience",
              "Industries (one per line)",
              "Current company",
              "Looking for (one per line)",
              "Startup stage",
            ];
      for (const label of labels) expect(html).toContain(label);
      for (const value of [
        "Original candidate",
        "Original skill",
        "Original title",
        "Original goal",
      ])
        expect(html).toContain(value);
      expect(html).toContain('for="candidate-edit-name"');
      expect(html).toMatch(/max[Ll]ength="10000"/);
      expect(html).toContain(
        language === "nl" ? "contacttoestemming" : "contact permission"
      );
      expect(html).not.toContain('id="candidate-edit-consent');
    }
  );
  it("marks malformed retained lists for separate review without rewriting them", () => {
    const html = render("nl", {
      review: {
        ...review,
        prospect: {
          ...review.prospect,
          skills: "unrecognized-original",
          industries: [2],
        },
      },
    });
    expect(html.match(/Onherkende opgeslagen lijst/g)).toHaveLength(2);
    expect(html).toContain('id="candidate-edit-skills"');
    expect(html).not.toContain("unrecognized-original");
    expect(html).toContain("oorspronkelijke gegevens blijven behouden");
  });
  it("renders no private values while concealed and preserves blocked input guards", () => {
    expect(render("nl", { concealed: true })).toBe("");
    expect(render("nl", { blocked: true })).toContain('disabled=""');
    expect(render("nl", { blocked: true })).toContain("Original candidate");
  });
});
