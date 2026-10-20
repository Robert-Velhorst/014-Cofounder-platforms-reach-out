import { z } from "zod";
import { outreachDetailSchema } from "./outreach-revision";

const reviewedCommand = outreachDetailSchema.extend({
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
  idempotencyKey: z
    .string()
    .min(8)
    .max(80)
    .regex(/^[A-Za-z0-9:_-]+$/),
});
export const responseCommandSchema = reviewedCommand
  .extend({ confirmed: z.literal(true) })
  .strict();
export const reminderCommandSchema = reviewedCommand
  .extend({ followUpAt: z.string().datetime({ offset: true }) })
  .strict();
export const closeCommandSchema = responseCommandSchema;
export const conversationCommandSchema = z.discriminatedUnion("action", [
  responseCommandSchema
    .extend({ action: z.literal("record_response") })
    .strict(),
  reminderCommandSchema
    .extend({ action: z.literal("schedule_reminder") })
    .strict(),
  reviewedCommand.extend({ action: z.literal("cancel_reminder") }).strict(),
  closeCommandSchema.extend({ action: z.literal("close") }).strict(),
]);
export type ConversationCommand = z.infer<typeof conversationCommandSchema>;
export const reminderListSchema = z
  .object({
    accountId: z.number().int().positive(),
    filter: z.enum(["due", "scheduled", "all"]).default("due"),
    page: z.number().int().min(1).max(100000).default(1),
    pageSize: z.number().int().min(1).max(100).default(25),
  })
  .strict();
export function isOpenConversation(state: string) {
  return ["confirmed_sent", "responded", "follow_up_due"].includes(state);
}
