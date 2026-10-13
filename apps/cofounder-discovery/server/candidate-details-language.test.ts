import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  language: "en",
  blocked: false,
  error: false,
  row: null as any,
}));
vi.mock("../client/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: fixture.language,
    text: (en: string, nl: string) => (fixture.language === "nl" ? nl : en),
  }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      prospects: {
        details: {
          useQuery: () => ({
            data: {
              prospect: fixture.row,
              revision: "revision-1",
              sourcePolicy: { reason: "Original server explanation" },
              provenanceStatus: "missing",
              optOutEvents: [],
              history: [],
            },
            isFetching: false,
            isError: fixture.error,
            error: { message: "Original server error" },
            refetch: vi.fn(),
          }),
        },
        optOut: { useMutation: () => ({ isPending: false }) },
        archive: { useMutation: () => ({ isPending: false }) },
        restore: { useMutation: () => ({ isPending: false }) },
      },
    },
  },
}));
vi.mock("../client/src/components/PartnershipProgress", () => ({
  PartnershipProgress: () =>
    createElement("section", { lang: "en" }, "Separate progress tool"),
}));
vi.mock("../client/src/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => createElement("div", null, children),
  DialogContent: ({ children, lang }: any) =>
    createElement("article", { lang }, children),
  DialogHeader: ({ children }: any) => createElement("header", null, children),
  DialogTitle: ({ children }: any) => createElement("h1", null, children),
  DialogDescription: ({ children }: any) => createElement("p", null, children),
}));
import { CandidateDetails } from "../client/src/components/CandidateDetails";
function render(
  language: string,
  options: {
    blocked?: boolean;
    wrongOwner?: boolean;
    optedOut?: boolean;
    archived?: boolean;
    malformed?: boolean;
    error?: boolean;
  } = {}
) {
  fixture.language = language;
  fixture.error = options.error ?? false;
  fixture.row = {
    id: 1,
    userId: options.wrongOwner ? 8 : 7,
    name: "Original candidate",
    bio: "Original biography",
    title: "Original role",
    location: "Original place",
    skills: options.malformed ? [4] : ["Original skill"],
    industries: [],
    consentStatus: options.optedOut ? "opted_out" : "unknown",
    platform: "Original platform",
    sourceKind: "manual",
    importedAt: "invalid-date",
    archivedAt: options.archived ? "2026-10-02T08:00:00Z" : null,
  };
  return renderToStaticMarkup(
    createElement(CandidateDetails, {
      id: 1,
      accountId: 7,
      accountBlocked: options.blocked ?? false,
      onClose: vi.fn(),
      onChanged: vi.fn(),
    })
  );
}
describe("candidate detail panel language and safety presentation", () => {
  it("retains English labels, original data and unchecked actions", () => {
    const html = render("en");
    expect(html).toContain("Candidate details");
    expect(html).toContain("Archive candidate");
    expect(html).toContain("Record opt-out");
    expect(html).not.toContain('checked=""');
    expect(html).toContain("Original biography");
  });
  it("renders the complete parent panel in Dutch without translating retained data", () => {
    const html = render("nl");
    expect(html).toContain('lang="nl"');
    for (const label of [
      "Kandidaatdetails",
      "Kandidaatprofiel",
      "Archiefstatus",
      "Kandidaat archiveren",
      "Bronregistratie",
      "Contactstatus",
      "Opt-out registreren",
      "Recente kandidaatwijzigingen",
      "Toestemming niet vastgesteld",
      "Onherkenbare datum",
    ])
      expect(html).toContain(label);
    expect(html).toContain("Original biography");
    expect(html).toContain("Original platform");
    expect(html).toContain('<p lang="en"');
    expect(html).toContain("Original server explanation");
    expect(html).toContain('lang="en">Separate progress tool');
  });
  it("keeps archived opt-out records suppressed, with a separate restore acknowledgement", () => {
    const html = render("nl", { archived: true, optedOut: true });
    expect(html).toContain("Kandidaat herstellen");
    expect(html).toContain("Niet contacteren");
    expect(html).not.toContain("Opt-out registreren");
    expect(html).not.toContain('checked=""');
  });
  it.each([{ blocked: true }, { wrongOwner: true }])(
    "conceals private data when account identity is unavailable %#",
    options => {
      const html = render("nl", options);
      expect(html).not.toContain("Original biography");
      expect(html).toContain("Het account kon niet worden geverifieerd");
    }
  );
  it("preserves malformed lists and English server errors without exposing malformed values", () => {
    const html = render("nl", { malformed: true, error: true });
    expect(html).toContain("Onherkenbare opgeslagen lijst");
    expect(html).toContain("Original server error");
    expect(html).toContain("Kandidaat opnieuw laden");
  });
});
