import { describe, expect, it } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import {
  candidateQuerySchema,
  literalCandidateSearch,
  candidateSorts,
} from "../shared/candidate-query";
import { candidateOrdering, candidateTextFilter } from "./candidate-query";

describe("bounded literal candidate search and explicit ordering", () => {
  it("keeps compatible optional/default input and explicit sorts", () => {
    expect(candidateQuerySchema.parse(undefined)).toBeUndefined();
    expect(candidateQuerySchema.parse({})).toMatchObject({
      query: "",
      page: 1,
      pageSize: 25,
      status: "active",
      sort: "newest",
    });
    for (const sort of candidateSorts)
      expect(candidateQuerySchema.parse({ sort })?.sort).toBe(sort);
  });
  it.each([
    { page: 0 },
    { page: 1000001 },
    { page: 1.5 },
    { pageSize: 101 },
    { sort: "raw SQL" },
    { query: "x".repeat(101) },
    { accountId: 2147483648 },
    { hidden: "private" },
  ])("rejects invalid query %#", input => {
    expect(candidateQuerySchema.safeParse(input).success).toBe(false);
  });
  it.each([
    ["%", "%=%%"],
    ["_", "%=_%"],
    ["=", "%==%"],
    ["a%_=b", "%a=%=_==b%"],
    ["quote'\\", "%quote'\\%"],
  ])("escapes literal query %s", (input, output) => {
    expect(literalCandidateSearch(input)).toBe(output);
  });
  it("binds search text as parameters with explicit escape, never raw SQL", () => {
    const dialect = new MySqlDialect(),
      query = "' OR 1=1 -- %_=";
    const result = dialect.sqlToQuery(candidateTextFilter(query)!);
    expect(result.sql).not.toContain(query);
    expect(result.sql.match(/ESCAPE '='/g)).toHaveLength(3);
    expect(result.params).toEqual(Array(3).fill(literalCandidateSearch(query)));
    expect(candidateTextFilter("")).toBeUndefined();
  });
  it.each(candidateSorts)("gives %s a deterministic ID tie-breaker", sort => {
    const compiled = new MySqlDialect().sqlToQuery(
      sql.join(candidateOrdering(sort), sql.raw(", "))
    );
    expect(compiled.sql).toMatch(/\x60prospects\x60\.\x60id\x60 (asc|desc)$/);
    expect(compiled.params).toEqual([]);
  });
});
