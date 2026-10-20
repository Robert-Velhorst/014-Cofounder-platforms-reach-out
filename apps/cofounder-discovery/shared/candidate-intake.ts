import { z } from "zod";
import { candidateFieldsSchema } from "./candidate-input";
import { importDeclarationSchema } from "./import-declaration";

export const candidateIntakeSchema = z
  .object({
    accountId: z.number().int().positive(),
    candidate: candidateFieldsSchema
      .extend({
        name: z.string().trim().min(1).max(255),
        platform: z.string().trim().min(1).max(50),
        profileUrl: z.string().trim().url().max(500).nullable().optional(),
        consentStatus: z
          .enum(["unknown", "legitimate_interest", "opted_in", "opted_out"])
          .default("unknown"),
      })
      .strict(),
    declaration: importDeclarationSchema,
  })
  .strict();

export const candidateAddSchema = candidateIntakeSchema
  .extend({
    reviewToken: z.string().regex(/^[a-f0-9]{64}$/),
    resolution: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("create_new"),
          distinctPersonConfirmed: z.literal(true),
        })
        .strict(),
      z
        .object({
          kind: z.literal("use_existing"),
          candidateId: z.number().int().positive(),
        })
        .strict(),
    ]),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(80)
      .regex(/^[A-Za-z0-9:_-]+$/),
  })
  .strict();
export type CandidateIntake = z.infer<typeof candidateIntakeSchema>;
export type CandidateAdd = z.infer<typeof candidateAddSchema>;
