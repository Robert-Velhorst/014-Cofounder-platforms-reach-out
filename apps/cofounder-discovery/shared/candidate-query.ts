import { z } from "zod";

export const candidateSorts = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
] as const;
export type CandidateSort = (typeof candidateSorts)[number];
export const candidateQuerySchema = z
  .object({
    query: z.string().trim().max(100).default(""),
    page: z.number().int().min(1).max(1000000).default(1),
    pageSize: z.number().int().min(1).max(100).default(25),
    status: z.enum(["active", "archived", "all"]).default("active"),
    sort: z.enum(candidateSorts).default("newest"),
    accountId: z.number().int().positive().max(2147483647).optional(),
  })
  .strict()
  .optional();

// '=' is an explicit LIKE escape character, independent of MySQL backslash mode.
export function literalCandidateSearch(value: string) {
  return "%" + value.replace(/[=%_]/g, character => "=" + character) + "%";
}
