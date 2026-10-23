import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import * as admission from "./verification-redemption-admission";
import * as data from "./db";
import type { TrpcContext } from "./_core/context";

describe("verification redemption admission boundary", () => {
  const token = "Ab".repeat(21) + "C";
  const cookie = vi.fn();
  const api = () =>
    appRouter.createCaller({
      user: null,
      requestId: "synthetic-verification",
      req: { ip: "192.0.2.1", headers: {} },
      res: { cookie },
    } as unknown as TrpcContext);
  afterEach(() => {
    vi.restoreAllMocks();
    cookie.mockClear();
  });
  it.each(["TOO_MANY_REQUESTS", "SERVICE_UNAVAILABLE"] as const)(
    "stops %s before token lookup or mutation",
    async code => {
      const gate = vi
        .spyOn(admission, "admitVerificationRedemptionAttempt")
        .mockRejectedValue(
          new TRPCError({ code, message: "Safe verification refusal" })
        );
      const verify = vi.spyOn(data, "verifyEmailToken");
      await expect(api().auth.verifyEmail({ token })).rejects.toMatchObject({
        code,
      });
      expect(gate).toHaveBeenCalledWith(token, "192.0.2.1");
      expect(verify).not.toHaveBeenCalled();
      expect(cookie).not.toHaveBeenCalled();
    }
  );
  it("does not charge malformed or extra-field requests", async () => {
    const gate = vi.spyOn(admission, "admitVerificationRedemptionAttempt");
    await expect(
      api().auth.verifyEmail({ token: "bad" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api().auth.verifyEmail({ token, emailVerified: 1 } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(gate).not.toHaveBeenCalled();
  });
  it("preserves the exact token after admission and never signs in", async () => {
    const gate = vi
      .spyOn(admission, "admitVerificationRedemptionAttempt")
      .mockResolvedValue();
    const verify = vi
      .spyOn(data, "verifyEmailToken")
      .mockResolvedValue({ email: "synthetic@example.invalid" } as any);
    await expect(api().auth.verifyEmail({ token })).resolves.toEqual({
      success: true,
      email: "synthetic@example.invalid",
    });
    expect(gate).toHaveBeenCalledWith(token, "192.0.2.1");
    expect(verify).toHaveBeenCalledWith(token, "synthetic-verification");
    expect(cookie).not.toHaveBeenCalled();
  });
});
