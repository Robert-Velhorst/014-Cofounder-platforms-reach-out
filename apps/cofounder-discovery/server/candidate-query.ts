import { asc, desc, or, sql } from "drizzle-orm";
import { prospects } from "../drizzle/schema";
import {
  literalCandidateSearch,
  type CandidateSort,
} from "../shared/candidate-query";

export function candidateTextFilter(query: string) {
  if (!query) return undefined;
  const pattern = literalCandidateSearch(query);
  return or(
    sql`${prospects.name} LIKE ${pattern} ESCAPE '='`,
    sql`${prospects.title} LIKE ${pattern} ESCAPE '='`,
    sql`${prospects.location} LIKE ${pattern} ESCAPE '='`
  );
}
export function candidateOrdering(sort: CandidateSort) {
  switch (sort) {
    case "oldest":
      return [asc(prospects.importedAt), asc(prospects.id)];
    case "name_asc":
      return [asc(prospects.name), asc(prospects.id)];
    case "name_desc":
      return [desc(prospects.name), desc(prospects.id)];
    default:
      return [desc(prospects.importedAt), desc(prospects.id)];
  }
}
