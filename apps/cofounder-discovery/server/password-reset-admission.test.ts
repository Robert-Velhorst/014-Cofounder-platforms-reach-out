import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import * as admission from "./password-reset-admission";
import * as passwords from "./auth-password";
import * as recovery from "./password-recovery";
import type { TrpcContext } from "./_core/context";

describe("reset redemption admission boundary", () => {
  const token = "Ab".repeat(21) + "C";
  const input = { token, password: "SyntheticReplacement42!" };
  const cookie = vi.fn();
  const api = () =>
    appRouter.createCaller({
      user: null,
      requestId: "synthetic-reset",
      req: { ip: "192.0.2.1", headers: {} },
      res: { cookie },
    } as unknown as TrpcContext);
  afterEach(() => {
    vi.restoreAllMocks();
    cookie.mockClear();
  });
  it.each(["TOO_MANY_REQUESTS", "SERVICE_UNAVAILABLE"] as const)(
    "stops %s before password work or reset",
    async code => {
      const gate = vi
        .spyOn(admission, "admitPasswordResetAttempt")
        .mockRejectedValue(
          new TRPCError({ code, message: "Safe recovery refusal" })
        );
      const hash = vi.spyOn(passwords, "hashPassword");
      const reset = vi.spyOn(recovery, "completePasswordReset");
      await expect(api().auth.resetPassword(input)).rejects.toMatchObject({
        code,
      });
      expect(gate).toHaveBeenCalledWith(token, "192.0.2.1");
      expect(hash).not.toHaveBeenCalled();
      expect(reset).not.toHaveBeenCalled();
      expect(cookie).not.toHaveBeenCalled();
    }
  );
  it("does not consume admission for malformed links", async () => {
    const gate = vi.spyOn(admission, "admitPasswordResetAttempt");
    await expect(
      api().auth.resetPassword({ ...input, token: "bad" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(gate).not.toHaveBeenCalled();
  });
  it("admits weak-password attempts before validation without invoking reset", async () => {
    const gate = vi
      .spyOn(admission, "admitPasswordResetAttempt")
      .mockResolvedValue();
    const reset = vi.spyOn(recovery, "completePasswordReset");
    await expect(
      api().auth.resetPassword({ ...input, password: "weak" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(gate).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();
  });
  it("passes the original case-sensitive token through after admission without signing in", async () => {
    const gate = vi
      .spyOn(admission, "admitPasswordResetAttempt")
      .mockResolvedValue();
    const reset = vi
      .spyOn(recovery, "completePasswordReset")
      .mockResolvedValue({ success: true });
    await expect(api().auth.resetPassword(input)).resolves.toEqual({
      success: true,
    });
    expect(gate).toHaveBeenCalledWith(token, "192.0.2.1");
    expect(reset).toHaveBeenCalledWith(token, input.password);
    expect(cookie).not.toHaveBeenCalled();
  });
});
