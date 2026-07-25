import { afterEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";
import { sendPlatformMessage, testPlatformLogin } from "./platform-automation";
import { scrapeAllPlatformsReal } from "./platform-scrapers";

const originalEncryptionSecret = process.env.CREDENTIAL_ENCRYPTION_SECRET;
const originalJwtSecret = process.env.JWT_SECRET;
const originalAutomationSetting = process.env.ENABLE_PLATFORM_AUTOMATION;

afterEach(() => {
  if (originalEncryptionSecret === undefined)
    delete process.env.CREDENTIAL_ENCRYPTION_SECRET;
  else process.env.CREDENTIAL_ENCRYPTION_SECRET = originalEncryptionSecret;

  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;

  if (originalAutomationSetting === undefined)
    delete process.env.ENABLE_PLATFORM_AUTOMATION;
  else process.env.ENABLE_PLATFORM_AUTOMATION = originalAutomationSetting;
});

describe("ported platform safety defaults", () => {
  it("does not encrypt credentials without an explicit secret", () => {
    delete process.env.CREDENTIAL_ENCRYPTION_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => encrypt("credential")).toThrow("CREDENTIAL_ENCRYPTION_SECRET");
  });

  it("encrypts and decrypts with an explicitly configured secret", () => {
    process.env.CREDENTIAL_ENCRYPTION_SECRET =
      "test-secret-that-is-long-and-not-a-production-secret";
    delete process.env.JWT_SECRET;

    expect(decrypt(encrypt("credential"))).toBe("credential");
  });

  it("does not contact platforms or query credentials while automation is disabled", async () => {
    delete process.env.ENABLE_PLATFORM_AUTOMATION;

    const sendResult = await sendPlatformMessage(
      1,
      "founder_cloud",
      "https://example.test/profile",
      "Hello"
    );
    const loginResult = await testPlatformLogin(1, "founder_cloud");
    const scrapedProfiles = await scrapeAllPlatformsReal();

    expect(sendResult.success).toBe(false);
    expect(loginResult.success).toBe(false);
    expect(sendResult.error).toContain("disabled");
    expect(loginResult.error).toContain("disabled");
    expect(scrapedProfiles).toEqual([]);
  });
});
