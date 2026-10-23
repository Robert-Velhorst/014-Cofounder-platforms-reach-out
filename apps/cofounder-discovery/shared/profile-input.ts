import { z } from "zod";

const text = (limit: number) =>
  z.string().trim().max(limit).nullable().optional();
const signals = z
  .array(z.string().trim().min(1).max(120))
  .max(50)
  .transform(items => {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })
  .nullable()
  .optional();

// Public-directory publication needs a separate reviewed consent workflow.
// Internal import callers may carry metadata; this allowlist never writes it.
export const profilePatchSchema = z.object({
  location: text(255),
  timezone: text(100),
  availability: text(50),
  bio: text(5000),
  skills: signals,
  experience: text(50),
  industries: signals,
  previousRoles: signals,
  lookingFor: signals,
  startupStage: text(50),
  commitment: text(50),
  targetIndustries: signals,
  businessModel: signals,
  workStyle: signals,
  values: signals,
  communicationStyle: text(50),
  equityExpectation: text(50),
  fundingPreference: signals,
  remotePreference: text(50),
  completeness: z.number().int().min(0).max(100).optional(),
  isPublic: z
    .literal(false, {
      error:
        "Profile publication is not available. Save a private profile instead.",
    })
    .optional(),
});
export const profileInputSchema = profilePatchSchema
  .extend({
    accountId: z.number().int().positive().optional(),
  })
  .strict();

export function profileCompleteness(profile: Record<string, unknown>) {
  const fields = [
    "location",
    "skills",
    "experience",
    "industries",
    "lookingFor",
    "targetIndustries",
    "workStyle",
    "values",
  ];
  return Math.round(
    (fields.filter(field => {
      const value = profile[field];
      return Array.isArray(value)
        ? value.some(item => typeof item === "string" && item.trim())
        : typeof value === "string" && value.trim();
    }).length /
      fields.length) *
      100
  );
}
