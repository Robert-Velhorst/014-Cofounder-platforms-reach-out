import { z } from "zod";

export const presetSettingsSchema = z
  .object({
    templates: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            name: z.string().trim().min(1).max(80),
            body: z.string().trim().min(1).max(10000),
            humanOriginal: z.literal(true),
          })
          .strict()
      )
      .max(20),
    defaultTemplateId: z.string().uuid().nullable(),
    search: z.string().trim().max(100),
    candidateStatus: z.enum(["active", "archived", "all"]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      new Set(value.templates.map(item => item.id)).size !==
      value.templates.length
    )
      ctx.addIssue({ code: "custom", message: "Template IDs must be unique." });
    if (
      new Set(value.templates.map(item => item.name.toLowerCase())).size !==
      value.templates.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Template names must be unique.",
      });
    if (
      value.defaultTemplateId &&
      !value.templates.some(item => item.id === value.defaultTemplateId)
    )
      ctx.addIssue({
        code: "custom",
        message: "The default template must exist.",
      });
    if (new TextEncoder().encode(JSON.stringify(value)).length > 80000)
      ctx.addIssue({
        code: "custom",
        message: "Saved defaults exceed the 80000-byte limit.",
      });
  });
export type PresetSettings = z.infer<typeof presetSettingsSchema>;
export const emptyPresetSettings = (): PresetSettings => ({
  templates: [],
  defaultTemplateId: null,
  search: "",
  candidateStatus: "active",
});
export const presetsReadSchema = z
  .object({ accountId: z.number().int().positive().max(2147483647) })
  .strict();
export const presetsSaveSchema = presetsReadSchema
  .extend({
    expectedRevision: z.number().int().min(0).max(2147483646),
    settings: presetSettingsSchema,
    confirmation: z.literal(true),
  })
  .strict();
