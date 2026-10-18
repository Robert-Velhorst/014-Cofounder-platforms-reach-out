import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parseCookie as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getConfig } from "../config";
import { randomUUID } from "node:crypto";
import {
  createAccountSession,
  SESSION_CAPACITY_MESSAGE,
  getUserForAccountSession,
  revokeAccountSession,
} from "../account-sessions";
import { TRPCError } from "@trpc/server";

const SESSION_ISSUER = "cofounder-discovery";
const SESSION_AUDIENCE = "cofounder-discovery-web";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

export type SessionPayload = {
  openId: string;
  tokenId: string;
  name?: string | null;
};

class SessionService {
  private signingKey?: { secret: string; promise: Promise<CryptoKey> };

  private async getSecret() {
    const value = getConfig().JWT_SECRET;
    if (!value) throw new Error("JWT_SECRET is required for authentication");
    if (this.signingKey?.secret === value) return this.signingKey.promise;
    // Cache key material only, never users, sessions or authorization outcomes.
    // Share an in-flight import; keep at most the current configured key.
    const entry = {
      secret: value,
      promise: crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(value),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      ),
    };
    this.signingKey = entry;
    void entry.promise.catch(() => {
      // An older failure must not invalidate a newer configured key.
      if (this.signingKey === entry) this.signingKey = undefined;
    });
    return entry.promise;
  }

  async createSessionToken(
    openId: string,
    options: {
      credentialHash: string;
      expiresInMs?: number;
      name?: string | null;
    }
  ) {
    const now = Math.floor(Date.now() / 1000);
    const expires =
      now + Math.floor((options.expiresInMs ?? SESSION_DURATION_MS) / 1000);
    const tokenId = randomUUID();
    const token = await new SignJWT({ openId, name: options.name ?? null })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(SESSION_ISSUER)
      .setAudience(SESSION_AUDIENCE)
      .setIssuedAt(now)
      .setJti(tokenId)
      .setExpirationTime(expires)
      .sign(await this.getSecret());
    try {
      await createAccountSession(
        openId,
        options.credentialHash,
        tokenId,
        new Date(expires * 1000)
      );
    } catch (error) {
      if (error instanceof TRPCError && error.code === "UNAUTHORIZED")
        throw error;
      if (error instanceof TRPCError && error.code === "TOO_MANY_REQUESTS")
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: SESSION_CAPACITY_MESSAGE,
        });
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "Account service is temporarily unavailable. Please try again.",
      });
    }
    return token;
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, await this.getSecret(), {
        algorithms: ["HS256"],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      });
      if (
        typeof payload.openId !== "string" ||
        !payload.openId ||
        typeof payload.jti !== "string" ||
        !payload.jti
      )
        return null;
      return {
        openId: payload.openId,
        tokenId: payload.jti,
        name: typeof payload.name === "string" ? payload.name : null,
      };
    } catch {
      return null;
    }
  }

  async revokeRequestSession(req: Request) {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const session = await this.verifySession(cookies[COOKIE_NAME]);
    if (session) {
      try {
        await revokeAccountSession(session.tokenId);
      } catch {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Account service is temporarily unavailable. Please try again.",
        });
      }
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const session = await this.verifySession(cookies[COOKIE_NAME]);
    if (!session) throw ForbiddenError("Invalid or expired session");
    const user = await getUserForAccountSession(
      session.openId,
      session.tokenId
    );
    if (!user) throw ForbiddenError("Invalid or revoked session");
    return user;
  }
}

export const sdk = new SessionService();
