import { z } from "zod";

/** A user declaration, not verification of platform rights or contact consent. */
export const importDeclarationSchema = z
  .object({
    collectionMethod: z.literal("direct_from_person"),
    rightsConfirmed: z.literal(true),
    // Store an opaque reference to evidence retained by the owner, not its contents.
    evidenceReference: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
        "Use a reference of letters, numbers, dots, underscores or hyphens; no URLs or private correspondence."
      ),
  })
  .strict();

export type ImportDeclaration = z.infer<typeof importDeclarationSchema>;
export const importProvenanceSchema = importDeclarationSchema
  .extend({
    version: z.literal("2026-09-13-direct-data-v1"),
    actorId: z.number().int().positive(),
    sourceId: z.string().min(1).max(80),
    importKey: z
      .string()
      .min(8)
      .max(80)
      .regex(/^[A-Za-z0-9:_-]+$/),
    requestHash: z.string().regex(/^[a-f0-9]{64}$/),
    declaredAt: z.iso.datetime(),
  })
  .strict();
export type ImportProvenance = z.infer<typeof importProvenanceSchema>;
