import { TRPCError } from "@trpc/server";
import { admitAuthenticationAttempt } from "./auth-attempt-admission";

/** Charge authenticated attempts before owner/event reads, never bearer values. */
export function admitHaiFeedAttempt(ownerId: number, ip: string | undefined) {
  if (!Number.isSafeInteger(ownerId) || ownerId < 1 || ownerId > 2_147_483_647)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Connector admission is temporarily unavailable.",
    });
  return admitAuthenticationAttempt("haiFeed", String(ownerId), ip);
}
