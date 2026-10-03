import { afterEach, describe, expect, it, vi } from "vitest";
import { closeDb, getUserByEmail, getUserByOpenId } from "./db";

describe("missing account database", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("does not mistake unavailable storage for a missing account", async () => {
    await closeDb();
    vi.stubEnv("DATABASE_URL", "");
    await expect(getUserByOpenId("local:test")).rejects.toThrow(/unavailable/i);
    await expect(getUserByEmail("test@example.invalid")).rejects.toThrow(
      /unavailable/i
    );
  });
});
