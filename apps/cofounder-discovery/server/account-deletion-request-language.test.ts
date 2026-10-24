import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Render the actual panel and shared UI components. Query/mutation hooks are
// doubles: this suite is markup evidence, not browser or deletion acceptance.
const fixture = vi.hoisted(() => ({
  language: "en",
  data: {
    accountId: 7,
    status: "none",
    revision: 0,
    requestKey: null as string | null,
    requestedAt: null as string | null,
    withdrawnAt: null as string | null,
    requestsEnabled: true,
    deletionEnabled: false,
  },
  isError: false,
  isFetching: false,
  message: "",
  query: vi.fn(),
}));
vi.mock("../client/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: fixture.language,
    text: (en: string, nl: string) => (fixture.language === "nl" ? nl : en),
  }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    accountData: {
      deletionStatus: {
        useQuery: (...args: unknown[]) => {
          fixture.query(...args);
          return {
            data: fixture.data,
            isError: fixture.isError,
            isFetching: fixture.isFetching,
            error: { message: fixture.message },
          };
        },
      },
      requestDeletion: { useMutation: () => ({}) },
      withdrawDeletion: { useMutation: () => ({}) },
    },
  },
}));
import { AccountDeletionRequest } from "../client/src/components/AccountDeletionRequest";

function render(language = "en", accountBlocked = false) {
  fixture.language = language;
  return renderToStaticMarkup(
    createElement(AccountDeletionRequest, { accountId: 7, accountBlocked })
  );
}
beforeEach(() => {
  fixture.data = {
    accountId: 7,
    status: "none",
    revision: 0,
    requestKey: null,
    requestedAt: null,
    withdrawnAt: null,
    requestsEnabled: true,
    deletionEnabled: false,
  };
  fixture.isError = false;
  fixture.isFetching = false;
  fixture.message = "";
  fixture.query.mockClear();
});

describe("review-held account deletion request language and initial safeguards", () => {
  it.each(["en", "nl"])(
    "renders honest %s warnings and unchecked controls",
    language => {
      const html = render(language);
      const expected =
        language === "nl"
          ? [
              'aria-label="Verzoek om accountverwijdering" lang="nl"',
              "Accountverwijdering aanvragen",
              "Automatische verwijdering is niet ingeschakeld",
              "back-ups moeten nog worden beoordeeld",
              "vijf wachtwoordbevestigingen per 15 minuten",
              "Er wordt geen e-mail of platformbericht verstuurd",
              "Er is geen verwijderverzoek vastgelegd",
              "Huidig wachtwoord voor verwijderverzoeken",
              "Ik vraag verwijdering van dit account aan",
              "Status van het verzoek vernieuwen",
              "Verwijderverzoek indienen",
            ]
          : [
              'aria-label="Account deletion request" lang="en"',
              "Request account deletion",
              "Automated deletion is not enabled",
              "backups still require review",
              "five password-confirmation attempts per 15 minutes",
              "No email or platform message is sent",
              "No deletion request is recorded",
              "Current password for deletion requests",
              "I request deletion of this account",
              "Refresh request status",
              "Submit deletion request",
            ];
      for (const item of expected) expect(html).toContain(item);
      expect(html).toContain('type="password"');
      expect(html).toContain('autoComplete="current-password"');
      expect(html).toContain('maxLength="128"');
      expect(html).not.toContain('checked=""');
      expect(html).not.toContain('<fieldset disabled=""');
      expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
      expect(fixture.query).toHaveBeenCalledWith(
        { accountId: 7 },
        { enabled: true, retry: false, staleTime: 0, gcTime: 0 }
      );
    }
  );

  it.each(["en", "nl"])(
    "keeps %s pending withdrawal available when intake is off",
    language => {
      Object.assign(fixture.data, {
        status: "pending_review",
        revision: 1,
        requestsEnabled: false,
        requestKey: "a6a38911-b48e-4352-bc45-fce05735c468",
        requestedAt: "2026-10-23T04:00:00.000Z",
      });
      const html = render(language);
      for (const item of language === "nl"
        ? [
            "Nog te beoordelen door de beheerder. Er is niets verwijderd.",
            "Nieuwe verzoeken zijn uitgeschakeld door de beheerder",
            "Ik wil dit openstaande verwijderverzoek intrekken",
            "Verwijderverzoek intrekken",
            "Referentie van het verzoek: ",
            "Ingediend: ",
          ]
        : [
            "Awaiting operator review. Nothing has been deleted.",
            "New request intake is disabled by the operator",
            "I want to withdraw this pending deletion request",
            "Withdraw deletion request",
            "Request reference: ",
            "Requested: ",
          ])
        expect(html).toContain(item);
      expect(html).toContain(fixture.data.requestKey!);
      expect(html).toContain('<time dateTime="2026-10-23T04:00:00.000Z">');
      expect(html).toContain(
        new Date(fixture.data.requestedAt!).toLocaleString(
          language === "nl" ? "nl-NL" : "en-GB"
        )
      );
      expect(html).not.toContain('<fieldset disabled=""');
      expect(html).not.toContain('checked=""');
      expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    }
  );

  it.each(["en", "nl"])(
    "renders %s withdrawn status without implying erasure",
    language => {
      Object.assign(fixture.data, {
        status: "withdrawn",
        revision: 2,
        requestsEnabled: false,
        requestKey: "a6a38911-b48e-4352-bc45-fce05735c468",
        requestedAt: "2026-10-23T04:00:00.000Z",
        withdrawnAt: "2026-10-23T04:01:00.000Z",
      });
      const html = render(language);
      expect(html).toContain(
        language === "nl"
          ? "Verzoek ingetrokken. Je account is niet verwijderd."
          : "Request withdrawn. Your account has not been deleted."
      );
      expect(html).toContain(
        language === "nl" ? "Ingetrokken: " : "Withdrawn: "
      );
      expect(html).toContain('<fieldset disabled=""');
      expect(html).toContain('<time dateTime="2026-10-23T04:01:00.000Z">');
    }
  );

  it.each(["en", "nl"])(
    "disables %s new intake when the operator has not enabled it",
    language => {
      fixture.data.requestsEnabled = false;
      const html = render(language);
      expect(html).toContain('<fieldset disabled=""');
      expect(html).not.toContain('checked=""');
    }
  );

  it.each(["en", "nl"])(
    "blocks an unverified %s account without displaying its request",
    language => {
      fixture.data.requestKey = "must-not-display";
      const html = render(language, true);
      expect(html).toContain(
        language === "nl"
          ? "Je account kon niet worden geverifieerd"
          : "Your account could not be verified"
      );
      expect(html).toContain('<fieldset disabled=""');
      expect(html).not.toContain("must-not-display");
      expect(fixture.query.mock.calls[0][1]).toMatchObject({ enabled: false });
    }
  );

  it.each(["en", "nl"])(
    "does not display a different account's stale %s row",
    language => {
      Object.assign(fixture.data, {
        accountId: 8,
        status: "pending_review",
        requestKey: "foreign-secret",
      });
      const html = render(language);
      expect(html).not.toContain("foreign-secret");
      expect(html).toContain(
        language === "nl"
          ? "Status van het verwijderverzoek laden…"
          : "Loading deletion request status…"
      );
      expect(html).toContain('<fieldset disabled=""');
    }
  );

  it.each(["en", "nl"])(
    "escapes the original service error in the %s panel",
    language => {
      fixture.isError = true;
      fixture.message = "Original <script>alert('unsafe')</script> & retry";
      const html = render(language);
      expect(html).toContain(
        language === "nl"
          ? "Originele melding van de dienst: "
          : "Service message (original): "
      );
      expect(html).toContain('<span lang="en">Original &lt;script&gt;');
      expect(html).not.toContain("<script>");
      expect(html).toContain('<fieldset disabled=""');
    }
  );

  it("disables controls while status is being refreshed", () => {
    fixture.isFetching = true;
    const html = render("nl");
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toMatch(/<button[^>]*type="button"[^>]*disabled=""/);
  });
});
