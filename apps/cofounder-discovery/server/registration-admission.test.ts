import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import * as admission from "./registration-admission";
import * as db from "./db";
import * as passwords from "./auth-password";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";

describe("registration admission route boundary", () => {
  const cookie = vi.fn();
  const input = {
    name: "Synthetic founder",
    email: "new@example.invalid",
    password: "SyntheticPassword42!",
  };
  const api = () =>
    appRouter.createCaller({
      user: null,
      requestId: "synthetic-registration",
      req: { ip: "192.0.2.1", headers: {} },
      res: { cookie },
    } as unknown as TrpcContext);
  beforeEach(() => {
    cookie.mockClear();
    vi.stubEnv("ENABLE_REGISTRATION", "true");
    resetConfigForTests();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it.each(["TOO_MANY_REQUESTS", "SERVICE_UNAVAILABLE"] as const)(
    "stops %s before lookup, password work, creation or cookie",
    async code => {
      const gate = vi
        .spyOn(admission, "admitRegistrationAttempt")
        .mockRejectedValue(
          new TRPCError({ code, message: "Safe admission refusal" })
        );
      const lookup = vi.spyOn(db, "getUserByEmail");
      const hash = vi.spyOn(passwords, "hashPassword");
      const create = vi.spyOn(db, "createLocalUser");
      await expect(api().auth.register(input)).rejects.toMatchObject({ code });
      expect(gate).toHaveBeenCalledWith(input.email, "192.0.2.1");
      expect(lookup).not.toHaveBeenCalled();
      expect(hash).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(cookie).not.toHaveBeenCalled();
    }
  );
  it.each(["disabled", "session-zero"])(
    "does not charge admission when registration is %s",
    async stop => {
      vi.stubEnv(
        stop === "disabled"
          ? "ENABLE_REGISTRATION"
          : "CAPACITY_SESSIONS_PER_ACCOUNT",
        stop === "disabled" ? "false" : "0"
      );
      resetConfigForTests();
      const gate = vi.spyOn(admission, "admitRegistrationAttempt");
      await expect(api().auth.register(input)).rejects.toMatchObject({
        code: stop === "disabled" ? "FORBIDDEN" : "TOO_MANY_REQUESTS",
      });
      expect(gate).not.toHaveBeenCalled();
      expect(cookie).not.toHaveBeenCalled();
    }
  );
  it("charges well-formed attempts before password validation", async () => {
    const gate = vi
      .spyOn(admission, "admitRegistrationAttempt")
      .mockResolvedValue();
    const lookup = vi.spyOn(db, "getUserByEmail");
    await expect(
      api().auth.register({ ...input, password: "weak" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(gate).toHaveBeenCalledOnce();
    expect(lookup).not.toHaveBeenCalled();
  });
  it("does not charge malformed registration input", async () => {
    const gate = vi.spyOn(admission, "admitRegistrationAttempt");
    await expect(
      api().auth.register({ ...input, email: "not-an-email" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(gate).not.toHaveBeenCalled();
  });
});
