import { z } from "zod";
export const accountExportSchema = z
  .object({
    accountId: z.number().int().positive(),
    password: z.string().min(1).max(128),
    confirmation: z.literal(true),
  })
  .strict();
