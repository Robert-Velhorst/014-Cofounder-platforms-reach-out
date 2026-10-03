import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import VerifyEmail from "../client/src/pages/VerifyEmail";
import { Router } from "wouter";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";

const linkResult = vi.hoisted(() => ({
  isSuccess: false,
  data: undefined as { email: string } | undefined,
  variables: undefined as { token: string } | undefined,
}));
const accountResult = vi.hoisted(() => ({
  emailVerified: 1,
  error: null as { message: string } | null,
  isFetching: false,
}));
vi.mock("react", async importOriginal => {
  const react = await importOriginal<typeof React>();
  return { ...react, useState: vi.fn(react.useState) };
});

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    auth: {
      me: {
        useQuery: () => ({
          data: { id: 1, email: "current@example.invalid", emailVerified: accountResult.emailVerified },
          error: accountResult.error,
          isLoading: false,
          isFetching: accountResult.isFetching,
          refetch: vi.fn(),
        }),
      },
      verifyEmail: {
        useMutation: () => ({
          reset: vi.fn(),
          mutate: vi.fn(),
          ...linkResult,
          isPending: false,
          error: null,
        }),
      },
      sendVerificationEmail: {
        useMutation: () => ({
          mutate: vi.fn(),
          isSuccess: false,
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

describe("email verification screen account identity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    linkResult.isSuccess = false;
    linkResult.data = undefined;
    linkResult.variables = undefined;
    accountResult.emailVerified = 1;
    accountResult.error = null;
    accountResult.isFetching = false;
  });
  it.each([0, 1])("pauses cached account actions after query failure (verified=%s)", emailVerified => {
    accountResult.emailVerified = emailVerified;
    accountResult.error = { message: "Account check unavailable" };
    const markup = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/verify-email" }, React.createElement(VerifyEmail)));
    expect(markup).toContain("Check account again");
    expect(markup).toContain("Account-dependent actions are paused");
    expect(markup).not.toContain("Open workspace");
    expect(markup).not.toContain("Send a new verification link");
    expect(markup).not.toContain("Your email address is confirmed.");
    expect(markup).not.toContain("Request a verification link below");
  });
  it("keeps explicit public link confirmation available while account checking fails", () => {
    accountResult.error = { message: "Account check unavailable" };
    vi.stubGlobal("window", { location: { hash: `#token=${"a".repeat(43)}` } });
    const markup = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/verify-email" }, React.createElement(VerifyEmail)));
    expect(markup).toContain("Confirm email address");
    expect(markup).not.toContain("Send a new verification link");
  });
  it("uses sign-in instead of cached workspace access after link success and failed account check", () => {
    accountResult.error = { message: "Account check unavailable" };
    const token = "a".repeat(43);
    vi.stubGlobal("window", { location: { hash: `#token=${token}` } });
    linkResult.variables = { token };
    linkResult.data = { email: "current@example.invalid" };
    linkResult.isSuccess = true;
    const markup = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/verify-email" }, React.createElement(VerifyEmail)));
    expect(markup).toContain("Sign in to verified account");
    expect(markup).not.toContain("Open workspace");
  });
  it("keeps Dutch invalid/duplicate links separate from an already verified account", () => {
    vi.stubGlobal("window", {
      location: { hash: `#token=${"a".repeat(43)}&token=${"b".repeat(43)}` },
    });
    const markup = renderToStaticMarkup(
      React.createElement(LanguageProvider, {
        initialLanguage: "nl",
        children: React.createElement(Router, {
          ssrPath: "/verify-email",
          children: React.createElement(VerifyEmail),
        }),
      })
    );
    expect(markup).toContain("Deze bevestigingslink is ongeldig");
    expect(markup).not.toContain("E-mailadres bevestigen");
    expect(markup).not.toContain("Werkruimte openen");
    expect(markup).not.toContain("Je e-mailadres is bevestigd.");
  });
  it("requires Dutch explicit confirmation for a valid link without rendering its token", () => {
    const token = "a".repeat(43);
    vi.stubGlobal("window", { location: { hash: `#token=${token}` } });
    const markup = renderToStaticMarkup(
      React.createElement(LanguageProvider, {
        initialLanguage: "nl",
        children: React.createElement(Router, {
          ssrPath: "/verify-email",
          children: React.createElement(VerifyEmail),
        }),
      })
    );
    expect(markup).toContain("E-mailadres bevestigen");
    expect(markup).not.toContain("Werkruimte openen");
    expect(markup).not.toContain(token);
  });
  it("requires confirmation of an email link even when the current account is already verified", () => {
    vi.mocked(React.useState).mockReturnValueOnce([
      "another-accounts-token",
      vi.fn(),
    ]);
    const markup = renderToStaticMarkup(
      React.createElement(
        Router,
        { ssrPath: "/verify-email" },
        React.createElement(VerifyEmail)
      )
    );
    expect(markup).toContain("Confirm email address");
    expect(markup).not.toContain("Your email address is confirmed.");
  });
  it("offers sign-in for the verified link's account rather than the current unrelated workspace", () => {
    vi.mocked(React.useState).mockReturnValueOnce([
      "another-accounts-token",
      vi.fn(),
    ]);
    linkResult.isSuccess = true;
    linkResult.data = { email: "other@example.invalid" };
    linkResult.variables = { token: "another-accounts-token" };
    const markup = renderToStaticMarkup(
      React.createElement(
        Router,
        { ssrPath: "/verify-email" },
        React.createElement(VerifyEmail)
      )
    );
    expect(markup).toContain('href="/login"');
    expect(markup).not.toContain("Open workspace");
  });
  it("does not confirm a newer link using a previous link's successful response", () => {
    vi.mocked(React.useState).mockReturnValueOnce(["newer-token", vi.fn()]);
    linkResult.isSuccess = true;
    linkResult.data = { email: "current@example.invalid" };
    linkResult.variables = { token: "older-token" };
    const markup = renderToStaticMarkup(
      React.createElement(
        Router,
        { ssrPath: "/verify-email" },
        React.createElement(VerifyEmail)
      )
    );
    expect(markup).toContain("Confirm email address");
    expect(markup).not.toContain(
      "The email address from this link is confirmed."
    );
    expect(markup).not.toContain("Open workspace");
  });
  it("does not treat an invalid fragment as the signed-in account's verification", () => {
    vi.mocked(React.useState).mockReturnValueOnce(["", vi.fn()]);
    const markup = renderToStaticMarkup(
      React.createElement(
        Router,
        { ssrPath: "/verify-email" },
        React.createElement(VerifyEmail)
      )
    );
    expect(markup).toContain("This verification link is invalid");
    expect(markup).not.toContain("Confirm email address");
    expect(markup).not.toContain("Open workspace");
  });
});
