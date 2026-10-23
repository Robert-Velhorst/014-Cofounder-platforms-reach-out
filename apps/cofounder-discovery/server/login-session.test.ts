import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import { createTRPCQueryUtils } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import { Router } from "wouter";
import type { AppRouter } from "./routers";
import Login from "../client/src/pages/Login";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";

const hooks = vi.hoisted(() => ({
  utils: undefined as unknown,
  success: {} as Record<string, () => Promise<void>>,
  navigate: vi.fn(),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => hooks.utils,
    auth: Object.fromEntries(
      ["login", "register"].map(name => [
        name,
        {
          useMutation: (options: { onSuccess: () => Promise<void> }) => {
            hooks.success[name] = options.onSuccess;
            return { isPending: false, error: null, mutate: vi.fn() };
          },
        },
      ])
    ),
  },
}));
vi.mock("wouter", async importOriginal => ({
  ...(await importOriginal<typeof import("wouter")>()),
  useLocation: () => ["/login", hooks.navigate],
}));

describe("login session cache handoff", () => {
  const clients: QueryClient[] = [];
  afterEach(() => {
    for (const client of clients.splice(0)) client.clear();
    hooks.navigate.mockReset();
  });

  function setup(fail = false) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(queryClient);
    const account = {
      id: 17,
      name: "Synthetic owner",
      email: "owner@example.invalid",
      emailVerified: 1,
      role: "user",
      loginMethod: "email",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      lastSignedIn: new Date("2026-01-01T00:00:00Z"),
    };
    const client = createTRPCClient<AppRouter>({
      links: [
        () =>
          ({ op }) =>
            observable(observer => {
              if (op.path !== "auth.me") {
                observer.error(new Error("Unexpected procedure"));
                return;
              }
              if (fail) {
                observer.error(new Error("Synthetic session lookup failure"));
                return;
              }
              observer.next({ result: { data: account } });
              observer.complete();
            }),
      ],
    });
    const utils = createTRPCQueryUtils({ queryClient, client });
    hooks.utils = utils;
    return { utils, account };
  }

  for (const [language, label] of [
    ["en", "Sign in"],
    ["nl", "Inloggen"],
  ] as const) {
    it(`exposes the ${language} form title as the single responsive page heading`, () => {
      setup();
      const html = renderToStaticMarkup(
        createElement(
          LanguageProvider,
          { initialLanguage: language },
          createElement(Router, { ssrPath: "/login" }, createElement(Login))
        )
      );
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain(`<h1 id="account-form-title">${label}</h1>`);
      expect(html).toContain('aria-labelledby="account-form-title"');
      expect(html).toMatch(
        /<h2\b[^>]*>Find the right conversation|<h2\b[^>]*>Vind het juiste gesprek/
      );
    });
  }

  for (const action of ["login", "register"] as const) {
    it(`${action} refreshes an inactive signed-out account before navigation`, async () => {
      const { utils, account } = setup();
      // The real query was fetched while the workspace was mounted, then signed out.
      await utils.auth.me.fetch();
      utils.auth.me.setData(undefined, null);
      renderToStaticMarkup(
        createElement(Router, { ssrPath: "/login" }, createElement(Login))
      );
      hooks.navigate.mockImplementation(() =>
        expect(utils.auth.me.getData()).toEqual(account)
      );
      await hooks.success[action]();
      expect(hooks.navigate).toHaveBeenCalledWith(
        action === "login" ? "/outreach" : "/verify-email"
      );
    });

    it(`${action} does not navigate using stale account data when refresh fails`, async () => {
      const { utils } = setup(true);
      // Register the real query function without retaining an authenticated result.
      await utils.auth.me.fetch().catch(() => {});
      utils.auth.me.setData(undefined, null);
      renderToStaticMarkup(
        createElement(Router, { ssrPath: "/login" }, createElement(Login))
      );
      await expect(hooks.success[action]()).rejects.toThrow(
        "Synthetic session lookup failure"
      );
      expect(hooks.navigate).not.toHaveBeenCalled();
    });
  }
});
