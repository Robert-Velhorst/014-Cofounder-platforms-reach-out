import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PartnershipProgress } from "../client/src/components/PartnershipProgress";
const state = vi.hoisted(() => ({
  data: undefined as any,
  error: false,
  fetching: false,
  language: "en",
}));
vi.mock("../client/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: state.language,
    text: (en: string, nl: string) => (state.language === "nl" ? nl : en),
  }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    criticalPath: {
      progress: {
        list: {
          useQuery: () => ({
            data: state.data,
            isError: state.error,
            isFetching: state.fetching,
          }),
        },
        record: { useMutation: () => ({ isPending: false }) },
      },
    },
  },
}));
const render = (blocked = false) =>
  renderToStaticMarkup(
    createElement(PartnershipProgress, {
      accountId: 1,
      prospectId: 2,
      blocked,
      onBusy: () => {},
      onDirty: () => {},
    })
  );
beforeEach(() => {
  state.language = "en";
  state.error = false;
  state.fetching = false;
  state.data = {
    accountId: 1,
    prospectId: 2,
    assessmentAvailable: true,
    review: "a".repeat(64),
    history: [],
    nextBeforeId: null,
    notice: "Legacy history may have unreviewed provenance.",
  };
});
describe("private partnership progress surface", () => {
  it("renders Dutch controls with original outcome values and unchecked review", () => {
    state.language = "nl";
    const html = render();
    expect(html).toContain('lang="nl"');
    expect(html).toContain('aria-label="Voortgang van de samenwerking"');
    expect(html).toContain("Er worden geen berichten verstuurd");
    expect(html).toContain("Opt-outs blijven ongewijzigd");
    expect(html).toContain("50 rapporten per kandidaat en 500 per account");
    expect(html).toContain("Mijn gerapporteerde voortgang");
    expect(html).toContain("Privévoortgangsnotities (optioneel)");
    expect(html).toContain(
      "Ik heb deze kandidaat, de geschiedenis en dit rapport beoordeeld"
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Voortgang vastleggen/);
    expect(html).not.toMatch(/type="checkbox"[^>]*checked/);
    for (const value of [
      "partnership_formed",
      "still_talking",
      "not_interested",
      "no_response",
      "timing_not_right",
    ])
      expect(html).toContain(`value="${value}"`);
  });
  it("translates all Dutch history outcomes while preserving original notes and server notice", () => {
    state.language = "nl";
    state.data.history = [
      "partnership_formed",
      "still_talking",
      "not_interested",
      "no_response",
      "timing_not_right",
    ].map((outcome, index) => ({
      id: index + 1,
      outcome,
      notes: "Original private café notes",
      outcomeDate: null,
    }));
    const html = render();
    for (const label of [
      "Samenwerking gevormd (mijn rapport)",
      "Nog in gesprek",
      "Geen interesse",
      "Geen reactie",
      "Nu niet het juiste moment",
      "Datum niet vastgelegd",
    ])
      expect(html).toContain(label);
    expect(html).toContain("Original private café notes");
    expect(html).toContain(
      'lang="en">Legacy history may have unreviewed provenance.'
    );
  });
  it("uses Dutch date presentation and labels invalid legacy dates without guessing", () => {
    state.language = "nl";
    const date = "2026-10-02T08:00:00Z";
    state.data.history = [
      { id: 1, outcome: "still_talking", notes: "", outcomeDate: date },
      { id: 2, outcome: "no_response", notes: "", outcomeDate: "bad-date" },
    ];
    const html = render();
    expect(html).toContain(
      new Intl.DateTimeFormat("nl-NL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date))
    );
    expect(html).toContain("Datum niet beschikbaar");
    expect(html).not.toContain("Invalid Date");
  });
  it("translates loading, failure and unavailable assessment states", () => {
    state.language = "nl";
    state.fetching = true;
    expect(render()).toContain("Voortgangsgeschiedenis controleren…");
    state.error = true;
    expect(render()).toContain(
      "De voortgangsgeschiedenis kon niet worden gecontroleerd"
    );
    expect(render()).not.toContain("<form");
    state.error = false;
    state.fetching = false;
    state.data.assessmentAvailable = false;
    expect(render()).toContain(
      "Beoordeel deze kandidaat voordat je voortgang vastlegt"
    );
  });
  it("conceals blocked and wrong-owner Dutch history", () => {
    state.language = "nl";
    state.data.history = [
      {
        id: 1,
        outcome: "still_talking",
        notes: "private-marker",
        outcomeDate: null,
      },
    ];
    expect(render(true)).toContain("Voortgang is verborgen");
    expect(render(true)).not.toContain("private-marker");
    state.data.accountId = 8;
    expect(render()).not.toContain("private-marker");
    state.data.accountId = 1;
    state.data.prospectId = 8;
    expect(render()).not.toContain("private-marker");
  });
  it("requires explicit review and discloses report-only semantics and retained limits", () => {
    const html = render();
    expect(html).toContain("No messages are sent");
    expect(html).toContain("Opt-outs remain unchanged");
    expect(html).toContain("50 reports per candidate and 500 per account");
    expect(html).toContain("I reviewed this candidate, history and report");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Record progress/);
  });
  it("conceals cached foreign or blocked account content", () => {
    state.data.history = [
      {
        id: 3,
        outcome: "still_talking",
        notes: "private-marker",
        outcomeDate: null,
      },
    ];
    expect(render(true)).not.toContain("private-marker");
    state.data.accountId = 99;
    expect(render()).not.toContain("private-marker");
    state.data.accountId = 1;
    state.data.prospectId = 99;
    expect(render()).not.toContain("private-marker");
  });
  it("keeps legacy null dates and text safe, without implying verified history", () => {
    state.data.history = [
      {
        id: 3,
        outcome: "partnership_formed",
        notes: "<script>not executable</script>",
        outcomeDate: null,
      },
    ];
    const html = render();
    expect(html).toContain("Date not recorded");
    expect(html).toContain("Partnership formed (my report)");
    expect(html).toContain("unreviewed provenance");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
  it("withholds the form without assessment or checked storage", () => {
    state.data.assessmentAvailable = false;
    expect(render()).toContain("Assess this candidate");
    expect(render()).not.toContain("<form");
    state.error = true;
    expect(render()).not.toContain("<form");
  });
});
