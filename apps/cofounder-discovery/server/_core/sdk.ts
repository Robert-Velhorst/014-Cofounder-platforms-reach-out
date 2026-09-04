import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getConfig } from "../config";

const SESSION_ISSUER = "cofounder-discovery";
const SESSION_AUDIENCE = "cofounder-discovery-web";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

export type SessionPayload = {
  openId: string;
  name?: string | null;
};

class SessionService {
  private getSecret() {
    const value = getConfig().JWT_SECRET;
    if (!value) throw new Error("JWT_SECRET is required for authentication");
    return new TextEncoder().encode(value);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string | null } = {}
  ) {
    const now = Math.floor(Date.now() / 1000);
    const expires = now + Math.floor((options.expiresInMs ?? SESSION_DURATION_MS) / 1000);
    return new SignJWT({ openId, name: options.name ?? null })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(SESSION_ISSUER)
      .setAudience(SESSION_AUDIENCE)
      .setIssuedAt(now)
      .setExpirationTime(expires)
      .sign(this.getSecret());
  }

  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSecret(), {
        algorithms: ["HS256"],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
      });
      if (typeof payload.openId !== "string" || !payload.openId) return null;
      return {
        openId: payload.openId,
        name: typeof payload.name === "string" ? payload.name : null,
      };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const session = await this.verifySession(cookies[COOKIE_NAME]);
    if (!session) throw ForbiddenError("Invalid or expired session");
    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
}

export const sdk = new SessionService();
