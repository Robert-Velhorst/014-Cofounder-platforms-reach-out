import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { randomUUID } from "node:crypto";
import { HttpError } from "@shared/_core/errors";
import { TRPCError } from "@trpc/server";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  requestId: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Missing/invalid sessions are anonymous; infrastructure failures are not.
    if (!(error instanceof HttpError && error.statusCode === 403)) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message:
          "Account service is temporarily unavailable. Please try again.",
      });
    }
    user = null;
  }

  // Correlation is server-owned. Never retain a caller's header in audit data.
  const responseId = opts.res.getHeader?.("x-request-id");
  const requestId =
    typeof responseId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      responseId
    )
      ? responseId
      : randomUUID();

  return {
    req: opts.req,
    res: opts.res,
    user,
    requestId,
  };
}
