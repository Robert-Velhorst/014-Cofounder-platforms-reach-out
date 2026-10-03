import { z } from "zod";

const optionalText = (length: number) =>
  z.string().trim().max(length).nullable().optional();
const optionalList = z
  .array(z.string().trim().min(1).max(100))
  .max(50)
  .nullable()
  .optional();

/** Corrections are distinct from collection evidence and permission changes. */
export const candidateFieldsSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    title: optionalText(255),
    location: optionalText(255),
    bio: optionalText(10000),
    skills: optionalList,
    experience: optionalText(50),
    industries: optionalList,
    currentCompany: optionalText(255),
    lookingFor: optionalList,
    startupStage: optionalText(50),
  })
  .strict();
export const candidateEditableFields = Object.keys(candidateFieldsSchema.shape);
export const candidatePatchSchema = candidateFieldsSchema.refine(
  patch => Object.values(patch).some(value => value !== undefined),
  {
    message: "Supply at least one profile correction.",
  }
);
export type CandidatePatch = z.infer<typeof candidatePatchSchema>;

const reviewedCandidate = {
  id: z.number().int().positive(),
  accountId: z.number().int().positive(),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
};
export const candidateEditSchema = z
  .object({
    ...reviewedCandidate,
    patch: candidatePatchSchema,
  })
  .strict();
export const candidateArchiveSchema = z
  .object({
    ...reviewedCandidate,
    confirmed: z.literal(true),
  })
  .strict();
