import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { applicationWork } from "../server-work";
import { adminActor } from "../admin-actor";
import { requireAdminStepUp } from "../admin-mfa";
import { publicTrpcError } from "../public-trpc-error";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape }) => publicTrpcError(shape),
});

export const router = t.router;
export const publicProcedure = t.procedure.use(({ next }) =>
  applicationWork.run(next)
);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireUser);

export const verifiedProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.emailVerified !== 1) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Verify your email address before using the outreach workspace.",
      });
    }
    return next({ ctx });
  }
);

// Only MFA ceremonies may use this lower-privilege boundary. Business/admin
// actions must use adminProcedure, which also requires persistent step-up.
export const adminIdentityProcedure = publicProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    const actor = await adminActor(ctx);
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        adminActor: actor,
      },
    });
  })
);

export const adminProcedure = adminIdentityProcedure.use(
  async ({ ctx, next }) => {
    await requireAdminStepUp(ctx.adminActor);
    return next({ ctx });
  }
);
