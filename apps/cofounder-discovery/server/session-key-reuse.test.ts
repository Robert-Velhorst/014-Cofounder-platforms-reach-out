import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./_core/sdk";
import { resetConfigForTests } from "./config";
import * as sessions from "./account-sessions";

let sequence = 0;
let secret: string;
const user = {
  id: 73,
  openId: "local:key-reuse-test",
  passwordHash: "fixture",
};
describe("bounded session signing-key reuse", () => {
  beforeEach(() => {
    secret = `synthetic-session-key-reuse-${++sequence}-at-least-32-characters`;
    vi.stubEnv("JWT_SECRET", secret);
    resetConfigForTests();
    vi.spyOn(sessions, "createAccountSession").mockResolvedValue(undefined);
    vi.spyOn(sessions, "getUserForAccountSession").mockResolvedValue(
      user as NonNullable<
        Awaited<ReturnType<typeof sessions.getUserForAccountSession>>
      >
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("imports once for signing and concurrent authentication without caching account checks", async () => {
    const imports = vi.spyOn(crypto.subtle, "importKey");
    const token = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    const req = { headers: { cookie: `${COOKIE_NAME}=${token}` } } as Request;
    const results = await Promise.all(
      Array.from({ length: 40 }, () => sdk.authenticateRequest(req))
    );
    expect(results.every(result => result.id === user.id)).toBe(true);
    expect(sessions.getUserForAccountSession).toHaveBeenCalledTimes(40);
    expect(imports).toHaveBeenCalledTimes(1);
    const key = await imports.mock.results[0].value;
    expect(key.extractable).toBe(false);
    expect(key.algorithm).toMatchObject({
      name: "HMAC",
      hash: { name: "SHA-256" },
    });
    expect([...key.usages].sort()).toEqual(["sign", "verify"]);
  });
  it("changes key with configuration and rejects tokens signed with the preceding key", async () => {
    const imports = vi.spyOn(crypto.subtle, "importKey");
    const oldToken = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    vi.stubEnv("JWT_SECRET", `${secret}-changed`);
    resetConfigForTests();
    await expect(sdk.verifySession(oldToken)).resolves.toBeNull();
    const newToken = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    await expect(sdk.verifySession(newToken)).resolves.toMatchObject({
      openId: user.openId,
    });
    expect(imports).toHaveBeenCalledTimes(2);
  });
  it("fails closed on key-import failure and permits a later retry", async () => {
    const token = await new SignJWT({ openId: user.openId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cofounder-discovery")
      .setAudience("cofounder-discovery-web")
      .setJti("synthetic-retry")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    const imports = vi.spyOn(crypto.subtle, "importKey");
    imports.mockRejectedValueOnce(new Error("synthetic key-import failure"));
    await expect(sdk.verifySession(token)).resolves.toBeNull();
    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: user.openId,
    });
    expect(imports).toHaveBeenCalledTimes(2);
  });
  it("still checks revoked sessions even when the key is warm", async () => {
    const token = await sdk.createSessionToken(user.openId, {
      credentialHash: user.passwordHash,
    });
    const req = { headers: { cookie: `${COOKIE_NAME}=${token}` } } as Request;
    await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({
      id: user.id,
    });
    vi.mocked(sessions.getUserForAccountSession).mockResolvedValue(undefined);
    await expect(sdk.authenticateRequest(req)).rejects.toThrow(
      "Invalid or revoked session"
    );
    expect(sessions.getUserForAccountSession).toHaveBeenCalledTimes(2);
  });
  it("shares the first in-flight import for concurrent cold verification", async () => {
    const token = await new SignJWT({ openId: user.openId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cofounder-discovery")
      .setAudience("cofounder-discovery-web")
      .setJti("synthetic-cold-import")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    const imports = vi.spyOn(crypto.subtle, "importKey");
    const results = await Promise.all(
      Array.from({ length: 40 }, () => sdk.verifySession(token))
    );
    expect(results.every(result => result?.openId === user.openId)).toBe(true);
    expect(imports).toHaveBeenCalledTimes(1);
  });
  it("does not let an older failed import evict the newer configured key", async () => {
    const nextSecret = `${secret}-next`;
    const token = await new SignJWT({ openId: user.openId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cofounder-discovery")
      .setAudience("cofounder-discovery-web")
      .setJti("synthetic-inflight-rotation")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(nextSecret));
    let rejectOld!: (error: Error) => void;
    const pending = new Promise<CryptoKey>((_resolve, reject) => {
      rejectOld = reject;
    });
    const imports = vi.spyOn(crypto.subtle, "importKey");
    imports.mockImplementationOnce(() => pending);
    const oldAttempt = sdk.verifySession(token);
    vi.stubEnv("JWT_SECRET", nextSecret);
    resetConfigForTests();
    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: user.openId,
    });
    rejectOld(new Error("synthetic preceding-import failure"));
    await expect(oldAttempt).resolves.toBeNull();
    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: user.openId,
    });
    expect(imports).toHaveBeenCalledTimes(2);
  });
});
