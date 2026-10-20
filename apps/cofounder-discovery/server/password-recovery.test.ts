import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { closeDb } from "./db";
import { resetRateLimitsForTests } from "./rate-limit";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";
import * as admission from "./password-reset-admission";

const caller = () =>
  appRouter.createCaller({
    user: null,
    req: { ip: "recovery-test", headers: {} },
    res: {},
    requestId: "recovery-test",
  } as unknown as TrpcContext);

describe("password reset boundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetRateLimitsForTests();
    resetConfigForTests();
  });
  it("rejects malformed reset links", async () => {
    await expect(
      caller().auth.resetPassword({
        token: "bad",
        password: "NewPasswordForTest42",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects malformed email addresses before queuing a recovery request", async () => {
    await expect(
      caller().auth.requestPasswordReset({ email: "not-an-email" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not pretend recovery mail is available when its transport is unconfigured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    resetConfigForTests();
    await expect(
      caller().auth.requestPasswordReset({ email: "test@example.invalid" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
  it("rejects weak replacement passwords", async () => {
    // Isolate password validation; real durable admission has database coverage.
    vi.spyOn(admission, "admitPasswordResetAttempt").mockResolvedValue();
    await expect(
      caller().auth.resetPassword({ token: "a".repeat(43), password: "short" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not claim password recovery succeeded when storage is unavailable", async () => {
    await closeDb();
    vi.stubEnv("DATABASE_URL", "");
    await expect(
      caller().auth.resetPassword({
        token: "a".repeat(43),
        password: "NewPasswordForTest42",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});
