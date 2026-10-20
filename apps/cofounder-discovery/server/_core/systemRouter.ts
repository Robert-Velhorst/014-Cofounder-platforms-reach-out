import { z } from "zod";
import {
  notifyOwner,
  TITLE_MAX_LENGTH,
  CONTENT_MAX_LENGTH,
} from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "title is required")
          .max(TITLE_MAX_LENGTH),
        content: z
          .string()
          .trim()
          .min(1, "content is required")
          .max(CONTENT_MAX_LENGTH),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
