import { describe, expect, it } from "vitest";
import { getConfig } from "./config";
import { hashPassword, validatePassword, verifyPassword } from "./auth-password";
import { parseProspectCsv, prospectsToCsv } from "./prospect-csv";
import { assertTransition, canTransition, createTemplateMessage } from "./outreach-state";
import { consumeRateLimit, resetRateLimitsForTests } from "./rate-limit";
import { getConfig } from "./config";
import { permitsTrpcUrl } from "./route-policy";

describe("release safety primitives", () => {
  it("treats empty optional connector variables as disabled", () => {
    const config = getConfig({
      NODE_ENV: "production",
      APP_MODE: "production",
      DATABASE_URL: "mysql://example.invalid/database",
      JWT_SECRET: "test-session-secret-with-at-least-32-characters",
      PUBLIC_ORIGIN: "https://example.invalid",
      HAI_CONNECTOR_TOKEN: "",
      HAI_CONNECTOR_USER_ID: "",
    });
    expect(config.HAI_CONNECTOR_TOKEN).toBeUndefined();
    expect(config.HAI_CONNECTOR_USER_ID).toBeUndefined();
  });
  it("fails closed for incomplete production configuration", () => {
    expect(() => getConfig({ NODE_ENV: "production", APP_MODE: "production" })).toThrow(/DATABASE_URL/);
  });

  it("defaults external automation and legacy routes off", () => {
    const config = getConfig({ NODE_ENV: "test", APP_MODE: "test" });
    expect(config.ENABLE_PLATFORM_AUTOMATION).toBe(false);
    expect(config.ENABLE_UNSAFE_LEGACY_ROUTES).toBe(false);
  });

  it("hashes and verifies strong passwords", async () => {
    const password = "CorrectHorse7Battery";
    expect(validatePassword(password)).toBeNull();
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword7", hash)).resolves.toBe(false);
  });

  it("round-trips bounded prospect CSV", () => {
    const rows = parseProspectCsv('name,title,skills,profileUrl,consentStatus\n"Ada, A.",CTO,TypeScript|AI,https://example.com/ada,opted_in');
    expect(rows[0]).toMatchObject({ name: "Ada, A.", skills: ["TypeScript", "AI"], consentStatus: "opted_in" });
    expect(parseProspectCsv(prospectsToCsv(rows))).toEqual(rows);
  });

  it("rejects unsafe state jumps", () => {
    expect(canTransition("draft", "confirmed_sent")).toBe(false);
    expect(() => assertTransition("draft", "confirmed_sent")).toThrow(/Invalid outreach transition/);
  });

  it("produces a transparent deterministic fallback", () => {
    expect(createTemplateMessage({ senderName: "Sam", prospectName: "Alex" })).toContain("No pressure");
  });

  it("rate limits repeated sensitive operations", () => {
    resetRateLimitsForTests();
    expect(consumeRateLimit("login:ip", { limit: 1, windowMs: 60_000 }, 1).allowed).toBe(true);
    expect(consumeRateLimit("login:ip", { limit: 1, windowMs: 60_000 }, 2).allowed).toBe(false);
  });

  it("exposes only hardened API groups by default", () => {
    expect(permitsTrpcUrl("/criticalPath.status,auth.me?batch=1", false)).toBe(true);
    expect(permitsTrpcUrl("/scraping.importProspects", false)).toBe(false);
    expect(permitsTrpcUrl("/scheduler.start", false)).toBe(false);
  });
});
