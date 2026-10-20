import { z } from "zod";

export const deletionStatusSchema = z
  .object({ accountId: z.number().int().positive().max(2_147_483_647) })
  .strict();
const command = deletionStatusSchema.extend({
  password: z.string().min(1).max(128),
  expectedRevision: z.number().int().min(0).max(2_147_483_646),
  requestKey: z.string().uuid(),
});
export const deletionRequestSchema = command
  .extend({ confirmation: z.literal("REQUEST ACCOUNT DELETION") })
  .strict();
export const deletionWithdrawalSchema = command
  .extend({ confirmation: z.literal(true) })
  .strict();
