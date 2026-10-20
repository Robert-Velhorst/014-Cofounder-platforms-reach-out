import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { haiFeedHandler } from "./hai-connector";
import { admitHaiFeedAttempt } from "./hai-feed-admission";
import * as admission from "./hai-feed-admission";
import * as shared from "./auth-attempt-admission";
import * as data from "./db";
import { resetConfigForTests } from "./config";
import { resetRateLimitsForTests } from "./rate-limit";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  resetConfigForTests();
  resetRateLimitsForTests();
});
describe("HAI shared admission boundary", () => {
  it.each([0, -1, NaN, 1.5, 2_147_483_648])(
    "rejects invalid owner %s before shared storage",
    owner => {
      const gate = vi.spyOn(shared, "admitAuthenticationAttempt");
      expect(() => admitHaiFeedAttempt(owner, "192.0.2.1")).toThrow(TRPCError);
      expect(gate).not.toHaveBeenCalled();
    }
  );
  it("uses owner identity rather than the bearer", async () => {
    const gate = vi
      .spyOn(shared, "admitAuthenticationAttempt")
      .mockResolvedValue();
    await admitHaiFeedAttempt(42, "192.0.2.1");
    expect(gate).toHaveBeenCalledWith("haiFeed", "42", "192.0.2.1");
  });
  it.each(["TOO_MANY_REQUESTS", "SERVICE_UNAVAILABLE"] as const)(
    "maps %s without reading owner/events or exposing private error text",
    async code => {
      vi.stubEnv(
        "HAI_CONNECTOR_TOKEN",
        "synthetic-hai-token-at-least-32-characters"
      );
      vi.stubEnv("HAI_CONNECTOR_TOKEN_FILE", undefined);
      vi.stubEnv("HAI_CONNECTOR_USER_ID", "42");
      resetConfigForTests();
      const gate = vi
        .spyOn(admission, "admitHaiFeedAttempt")
        .mockRejectedValue(
          new TRPCError({ code, message: "synthetic-private-storage-error" })
        );
      const getDb = vi.spyOn(data, "getDb");
      const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
      res.status.mockReturnValue(res);
      await haiFeedHandler(
        {
          ip: "192.0.2.1",
          query: {},
          header: () => "Bearer synthetic-hai-token-at-least-32-characters",
        } as any,
        res as any,
        vi.fn()
      );
      expect(gate).toHaveBeenCalledWith(42, "192.0.2.1");
      expect(getDb).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(
        code === "TOO_MANY_REQUESTS" ? 429 : 503
      );
      expect(res.json).toHaveBeenCalledWith({
        error:
          code === "TOO_MANY_REQUESTS"
            ? "rate_limited"
            : "database_unavailable",
      });
      expect(res.setHeader).toHaveBeenCalledWith(
        "cache-control",
        "private, no-store"
      );
      if (code === "TOO_MANY_REQUESTS")
        expect(res.setHeader).toHaveBeenCalledWith("retry-after", 60);
    }
  );
});
