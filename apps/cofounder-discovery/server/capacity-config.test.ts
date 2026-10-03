import { describe, expect, it } from "vitest";
import { getConfig } from "./config";

describe("bounded capacity configuration", () => {
  const fields = [
    "CAPACITY_ACCOUNTS",
    "CAPACITY_SESSIONS_PER_ACCOUNT",
    "CAPACITY_PROSPECTS_TOTAL",
    "CAPACITY_PROSPECTS_PER_ACCOUNT",
    "CAPACITY_OUTREACH_TOTAL",
    "CAPACITY_OUTREACH_PER_ACCOUNT",
    "CAPACITY_WORKSPACE_AUDIT_TOTAL",
    "CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT",
    "ACCOUNT_MAIL_DAILY_ATTEMPTS",
    "ACCOUNT_MAIL_MONTHLY_ATTEMPTS",
  ];
  it.each(fields)(
    "rejects invalid %s rather than silently removing its limit",
    field => {
      for (const value of ["-1", "1.5", "NaN", "Infinity", "10000001", ""]) {
        expect(() => getConfig({ NODE_ENV: "test", [field]: value })).toThrow(
          /Invalid runtime configuration/
        );
      }
    }
  );
  it.each(fields)("accepts a zero %s admission stop", field => {
    expect(getConfig({ NODE_ENV: "test", [field]: "0" })).toHaveProperty(
      field,
      0
    );
  });
});
