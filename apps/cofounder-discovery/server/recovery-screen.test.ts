import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import Login from "../client/src/pages/Login";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";

const result = vi.hoisted(() => ({
  isSuccess: false,
  error: null as { message: string } | null,
}));
vi.mock("../client/src/lib/trpc", () => {
  const mutation = () => ({
    ...result,
    variables: { token: "a".repeat(43) },
    isPending: false,
    mutate: vi.fn(),
    reset: vi.fn(),
    data: {
      success: true,
      message: "If this address has an account, check your email.",
    },
  });
  return {
    trpc: {
      useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
      auth: {
        login: { useMutation: mutation },
        register: { useMutation: mutation },
        requestPasswordReset: { useMutation: mutation },
        resetPassword: { useMutation: mutation },
      },
    },
  };
});

const render = (component: React.ComponentType, path: string) =>
  renderToStaticMarkup(
    createElement(Router, { ssrPath: path }, createElement(component))
  );
async function screen(name: "ForgotPassword" | "ResetPassword") {
  // The missing screen is the regression, not a failing import before assertions.
  const path = "../client/src/pages/AccountRecovery";
  const module = await import(path).catch(() => null);
  expect(module?.[name]).toBeTypeOf("function");
  return module[name] as React.ComponentType;
}
describe("recovery screens", () => {
  it("rejects duplicate reset tokens instead of selecting the first", async () => {
    vi.stubGlobal("window", {
      location: { hash: `#token=${"a".repeat(43)}&token=${"b".repeat(43)}` },
    });
    const html = render(await screen("ResetPassword"), "/reset-password");
    expect(html).toContain("This reset link is missing or invalid");
    expect(html).not.toContain('type="password"');
  });
  it("renders Dutch recovery and preserves server-provided status as English", async () => {
    const component = await screen("ForgotPassword");
    const dutch = () =>
      renderToStaticMarkup(
        createElement(LanguageProvider, {
          initialLanguage: "nl",
          children: createElement(Router, {
            ssrPath: "/forgot-password",
            children: createElement(component),
          }),
        })
      );
    expect(dutch()).toContain("Je account herstellen");
    expect(dutch()).toContain("Herstellink aanvragen");
    result.isSuccess = true;
    expect(dutch()).toContain('lang="en"');
    expect(dutch()).toContain(
      "If this address has an account, check your email."
    );
  });
  it("renders Dutch reset controls without exposing the bearer token", async () => {
    const token = "a".repeat(43);
    vi.stubGlobal("window", { location: { hash: `#token=${token}` } });
    const component = await screen("ResetPassword");
    const html = renderToStaticMarkup(
      createElement(LanguageProvider, {
        initialLanguage: "nl",
        children: createElement(Router, {
          ssrPath: "/reset-password",
          children: createElement(component),
        }),
      })
    );
    expect(html).toContain("Nieuw wachtwoord bevestigen");
    expect(html.match(/type="password"/g)).toHaveLength(2);
    expect(html).not.toContain(token);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    result.isSuccess = false;
    result.error = null;
  });
  it("offers recovery from sign-in", () => {
    expect(render(Login, "/login")).toContain('href="/forgot-password"');
  });
  it("requests only an email address without asking for the old password", async () => {
    const html = render(await screen("ForgotPassword"), "/forgot-password");
    expect(html).toContain('type="email"');
    expect(html).toContain("Request reset link");
    expect(html).not.toContain('type="password"');
  });
  it("does not present a reset form when the link is missing or malformed", async () => {
    vi.stubGlobal("window", { location: { hash: "#token=invalid" } });
    const html = render(await screen("ResetPassword"), "/reset-password");
    expect(html).toContain('href="/forgot-password"');
    expect(html).not.toContain('type="password"');
  });
  it("requires a matching confirmation and never renders the token into markup", async () => {
    const token = "a".repeat(43);
    vi.stubGlobal("window", { location: { hash: `#token=${token}` } });
    const html = render(await screen("ResetPassword"), "/reset-password");
    expect(html.match(/type="password"/g)).toHaveLength(2);
    expect(html).toContain("Confirm new password");
    expect(html).toContain("Change password");
    expect(html).not.toContain(token);
  });
  it("offers normal sign-in after success rather than automatic workspace access", async () => {
    result.isSuccess = true;
    vi.stubGlobal("window", { location: { hash: `#token=${"a".repeat(43)}` } });
    const html = render(await screen("ResetPassword"), "/reset-password");
    expect(html).toContain("Password changed");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('href="/outreach"');
    expect(html).not.toContain('type="password"');
  });
  it("does not let an older link's success mask a newly opened reset link", async () => {
    result.isSuccess = true;
    vi.stubGlobal("window", { location: { hash: `#token=${"b".repeat(43)}` } });
    const html = render(await screen("ResetPassword"), "/reset-password");
    expect(html).toContain("Confirm new password");
    expect(html).not.toContain("Password changed");
  });
});
