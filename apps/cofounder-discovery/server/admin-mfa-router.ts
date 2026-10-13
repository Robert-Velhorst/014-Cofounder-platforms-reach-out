import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminIdentityProcedure, router } from "./_core/trpc";
import {
  beginAdminEnrollment,
  finishAdminEnrollment,
  beginAdminStepUp,
  finishAdminStepUp,
  getAdminMfaStatus,
  removeAdminPasskey,
} from "./admin-mfa";

const account = z.object({ accountId: z.number().int().positive() }).strict();
const password = z.string().min(1).max(128);
const challengeId = z.string().uuid();
// The explicit account ID protects stale tabs; it never determines ownership.
const owned = adminIdentityProcedure
  .input(account.strip())
  .use(({ ctx, input, next }) => {
    if (input.accountId !== ctx.user.id)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Account changed. Reload administrator security.",
      });
    return next({ ctx });
  });
// No operator grant or lost-factor bypass is exposed over HTTP.
export const adminMfaRouter = router({
  status: owned
    .input(account)
    .query(({ ctx }) => getAdminMfaStatus(ctx.adminActor)),
  beginEnrollment: owned
    .input(
      account.extend({
        password,
        grant: z
          .string()
          .regex(/^[A-Za-z0-9_-]{43}$/)
          .optional(),
      })
    )
    .mutation(({ ctx, input }) => beginAdminEnrollment(ctx.adminActor, input)),
  finishEnrollment: owned
    .input(
      account.extend({
        challengeId,
        label: z.string().trim().min(1).max(80),
        response: z.unknown(),
      })
    )
    .mutation(({ ctx, input }) => finishAdminEnrollment(ctx.adminActor, input)),
  beginStepUp: owned
    .input(account)
    .mutation(({ ctx }) => beginAdminStepUp(ctx.adminActor)),
  finishStepUp: owned
    .input(account.extend({ challengeId, response: z.unknown() }))
    .mutation(({ ctx, input }) => finishAdminStepUp(ctx.adminActor, input)),
  removePasskey: owned
    .input(account.extend({ keyId: z.string().uuid(), password }))
    .mutation(({ ctx, input }) => removeAdminPasskey(ctx.adminActor, input)),
});
