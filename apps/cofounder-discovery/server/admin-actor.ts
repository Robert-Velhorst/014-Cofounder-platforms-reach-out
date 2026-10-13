import { COOKIE_NAME } from "../shared/const";
import { parse } from "cookie";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import type { TrpcContext } from "./_core/context";
import type { AdminActor } from "./admin-mfa";

/** Only verified cookie claims identify a session; request input cannot select it.
 * Durable role, credentials, fence and session checks happen in admin-mfa. */
export async function adminActor(ctx: TrpcContext): Promise<AdminActor> {
  if (!ctx.user || ctx.user.role !== "admin" || ctx.user.emailVerified !== 1)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Verified administrator account required.",
    });
  const session = await sdk.verifySession(
    parse(ctx.req.headers.cookie ?? "")[COOKIE_NAME]
  );
  if (!session || session.openId !== ctx.user.openId)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in again before administrator verification.",
    });
  return {
    userId: ctx.user.id,
    credentialHash: ctx.user.passwordHash,
    tokenId: session.tokenId,
    requestId: ctx.requestId,
  };
}
