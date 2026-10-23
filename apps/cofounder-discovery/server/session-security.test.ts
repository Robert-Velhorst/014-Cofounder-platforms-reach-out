import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./_core/sdk";
import { appRouter } from "./routers";
import * as db from "./db";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";
import * as sessions from "./account-sessions";
import { TRPCError } from "@trpc/server";

describe("server-side session invalidation", () => {
  const user = {
    id: 42,
    openId: "local:session-test",
    name: "Founder",
    passwordHash: "test-credential",
  };
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "test-session-secret-with-at-least-32-characters");
    resetConfigForTests();
    // Only replace the unavailable database boundary, not signing, request
    // authentication or the logout route. MySQL persistence has its own suite.
    const active = new Set<string>();
    vi.spyOn(sessions, "createAccountSession").mockImplementation(
      async (openId, credentialHash, tokenId) => {
        if (openId !== user.openId || credentialHash !== user.passwordHash)
          throw new Error("wrong account credentials");
        active.add(tokenId);
      }
    );
    vi.spyOn(sessions, "getUserForAccountSession").mockImplementation(
      async (openId, tokenId) =>
        openId === user.openId && active.has(tokenId)
          ? (user as never)
          : undefined
    );
    vi.spyOn(sessions, "revokeAccountSession").mockImplementation(
      async tokenId => {
        active.delete(tokenId);
      }
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });

  it("rejects a copied cookie after successful logout", async () => {
    const token = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
      name: user.name,
    });
    const req = {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
      protocol: "http",
      get: () => undefined,
    } as unknown as Request;
    await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({
      id: 42,
    });
    const caller = appRouter.createCaller({
      req,
      res: { clearCookie: vi.fn() },
      user,
      requestId: "logout-test",
    } as unknown as TrpcContext);
    await caller.auth.logout();
    await expect(sdk.authenticateRequest(req)).rejects.toThrow(/session/i);
  });

  it("does not issue a token or disclose database details when session persistence fails", async () => {
    vi.spyOn(sessions, "createAccountSession").mockRejectedValue(
      new Error("private database connection details")
    );
    await expect(
      sdk.createSessionToken(user.openId, { credentialHash: user.passwordHash })
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Account service is temporarily unavailable. Please try again.",
    });
  });
  it("returns a fixed recovery path for capacity errors without disclosing storage details", async () => {
    vi.spyOn(sessions, "createAccountSession").mockRejectedValue(
      new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "private database values",
      })
    );
    await expect(
      sdk.createSessionToken(user.openId, { credentialHash: user.passwordHash })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message:
        "Sign-in session limit reached. Sign out from another browser, or use password recovery to revoke previous sessions.",
    });
  });
  it("refuses registration at a zero session ceiling before creating a stranded account", async () => {
    vi.stubEnv("ENABLE_REGISTRATION", "true");
    vi.stubEnv("CAPACITY_SESSIONS_PER_ACCOUNT", "0");
    resetConfigForTests();
    const lookup = vi.spyOn(db, "getUserByEmail").mockResolvedValue(undefined);
    const create = vi
      .spyOn(db, "createLocalUser")
      .mockResolvedValue(user as never);
    const cookie = vi.fn();
    const caller = appRouter.createCaller({
      req: { ip: "synthetic-session-stop", headers: {} },
      res: { cookie },
      user: null,
      requestId: "synthetic-session-stop",
    } as unknown as TrpcContext);
    await expect(
      caller.auth.register({
        name: "Synthetic founder",
        email: "synthetic@example.invalid",
        password: "SyntheticPassword42!",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(lookup).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
  });

  it("does not revoke another browser's session on logout", async () => {
    const first = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    const second = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    await sdk.revokeRequestSession({
      headers: { cookie: `${COOKIE_NAME}=${first}` },
    } as Request);
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `${COOKIE_NAME}=${second}` },
      } as Request)
    ).resolves.toMatchObject({ id: 42 });
  });

  it("does not report successful server logout when revocation storage fails", async () => {
    const token = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    vi.spyOn(sessions, "revokeAccountSession").mockRejectedValue(
      new Error("storage unavailable; private database connection")
    );
    const caller = appRouter.createCaller({
      req: { headers: { cookie: `${COOKIE_NAME}=${token}` } },
      res: { clearCookie: vi.fn() },
      user,
      requestId: "failed-logout",
    } as unknown as TrpcContext);
    await expect(caller.auth.logout()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Account service is temporarily unavailable. Please try again.",
    });
  });

  it("rejects authentication when session storage is unavailable", async () => {
    const token = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    vi.spyOn(sessions, "getUserForAccountSession").mockRejectedValue(
      new Error("storage unavailable")
    );
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `${COOKIE_NAME}=${token}` },
      } as Request)
    ).rejects.toThrow(/storage unavailable/);
  });
});
