import { z } from "zod";

export const progressListSchema = z
  .object({
    accountId: z.number().int().positive(),
    prospectId: z.number().int().positive(),
    beforeId: z.number().int().positive().optional(),
  })
  .strict();
export const progressRecordSchema = z
  .object({
    accountId: z.number().int().positive(),
    prospectId: z.number().int().positive(),
    expectedReview: z.string().regex(/^[a-f0-9]{64}$/),
    outcome: z.enum([
      "partnership_formed",
      "still_talking",
      "not_interested",
      "no_response",
      "timing_not_right",
    ]),
    notes: z.string().trim().max(2000),
    confirmation: z.literal(true),
    idempotencyKey: z.string().uuid(),
  })
  .strict();
