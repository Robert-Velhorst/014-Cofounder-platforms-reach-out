import { afterEach, describe, expect, it, vi } from "vitest";
import { verificationAttemptQuotaKey } from "./verification-attempt-window";
import { resetConfigForTests } from "./config";
import { appRouter } from "./routers";
import * as mail from "./account-mail";
import type { TrpcContext } from "./_core/context";

describe("verification admission key and route boundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("derives stable purpose-separated pseudonymous owner keys", () => {
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-verification-secret-more-than-32-characters"
    );
    resetConfigForTests();
    const key = verificationAttemptQuotaKey(42);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(verificationAttemptQuotaKey(42)).toBe(key);
    expect(verificationAttemptQuotaKey(43)).not.toBe(key);
    vi.stubEnv(
      "JWT_SECRET",
      "synthetic-rotated-verification-secret-more-than-32-characters"
    );
    resetConfigForTests();
    expect(verificationAttemptQuotaKey(42)).not.toBe(key);
  });
  it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
    "refuses invalid owner identity %s",
    id => {
      vi.stubEnv(
        "JWT_SECRET",
        "synthetic-verification-secret-more-than-32-characters"
      );
      resetConfigForTests();
      expect(() => verificationAttemptQuotaKey(id)).toThrow(
        "verification_admission_unavailable"
      );
    }
  );
  it("fails closed without a shared signing secret", () => {
    vi.stubEnv("JWT_SECRET", "");
    resetConfigForTests();
    expect(() => verificationAttemptQuotaKey(42)).toThrow(
      "verification_admission_unavailable"
    );
  });
  it("does not reach mail admission for an unauthenticated request", async () => {
    const send = vi.spyOn(mail, "sendVerification");
    const api = appRouter.createCaller({
      user: null,
      req: {},
      res: {},
      requestId: "synthetic-verification",
    } as unknown as TrpcContext);
    await expect(api.auth.sendVerificationEmail()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(send).not.toHaveBeenCalled();
  });
});
