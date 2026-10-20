import { z } from "zod";

export const outreachDetailSchema = z
  .object({
    id: z.number().int().positive(),
    accountId: z.number().int().positive(),
  })
  .strict();
export const outreachCancelSchema = outreachDetailSchema
  .extend({
    expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    notSent: z.literal(true),
  })
  .strict();
export const outreachReviseSchema = outreachCancelSchema
  .extend({
    subject: z.string().trim().max(255).nullable(),
    body: z.string().trim().min(1).max(10000),
    declaration: z
      .object({
        humanOriginal: z.literal(true),
        rulesReviewed: z.literal(true),
      })
      .strict(),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(80)
      .regex(/^[A-Za-z0-9:_-]+$/),
  })
  .strict();
export function isUnsentOutreachState(state: string) {
  return [
    "draft",
    "pending_review",
    "approved",
    "manual_action_required",
  ].includes(state);
}
