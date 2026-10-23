import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import Onboarding, { ProfileForm } from "../client/src/pages/Onboarding";
import { LanguageProvider } from "../client/src/contexts/LanguageContext";
import type { UserProfile } from "../drizzle/schema";

const account = vi.hoisted(() => ({
  loading: false,
  error: null as Error | null,
}));
const mutation = vi.hoisted(() => vi.fn());
vi.mock("../client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({ ...account, user: null, refresh: vi.fn() }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ profile: { get: { setData: vi.fn() } } }),
    profile: {
      create: {
        useMutation: () => ({ isPending: false, mutateAsync: mutation }),
      },
    },
  },
}));
const render = (language: "en" | "nl", child: React.ReactNode) =>
  renderToStaticMarkup(
    createElement(LanguageProvider, {
      initialLanguage: language,
      children: createElement(Router, {
        ssrPath: "/onboarding",
        children: child,
      }),
    })
  );
describe("profile setup language", () => {
  it.each(["en", "nl"] as const)(
    "renders setup controls in %s without saving",
    language => {
      const html = render(
        language,
        createElement(ProfileForm, {
          ownerId: 7,
          initialProfile: null,
          disabled: false,
        })
      );
      expect(html).toContain(
        language === "nl" ? "Je zoekprofiel" : "Your co-founder search profile"
      );
      expect(html).toContain(
        language === "nl" ? "Softwareontwikkelaar" : "Developer"
      );
      expect(html).toContain('value="first-time"');
      expect(html).toContain('for="location"');
      expect(html).toContain(
        language === "nl" ? "Niet-opgeslagen wijzigingen" : "Unsaved edits"
      );
      expect(mutation).not.toHaveBeenCalled();
    }
  );
  it("retains saved location and canonical selections under Dutch labels", () => {
    const html = render(
      "nl",
      createElement(ProfileForm, {
        ownerId: 7,
        initialProfile: {
          location: "Synthetic Place",
          skills: ["Developer"],
          experience: "experienced",
        } as UserProfile,
        disabled: true,
      })
    );
    expect(html).toContain('value="Synthetic Place"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Softwareontwikkelaar");
    expect(html).toContain('disabled=""');
    expect(html).toContain('value="experienced" selected=""');
    expect(mutation).not.toHaveBeenCalled();
  });
  it("renders Dutch account uncertainty without exposing the underlying error", () => {
    account.error = new Error("private internal diagnostic");
    const html = render("nl", createElement(Onboarding));
    account.error = null;
    expect(html).toContain("Account opnieuw controleren");
    expect(html).not.toContain("private internal diagnostic");
  });
});
