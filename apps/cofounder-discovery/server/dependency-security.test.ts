import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

// Exercise the parser actually resolved by Express, not a separately installed
// test version. Small advisory fixtures avoid resource-exhaustion payloads.
const require = createRequire(import.meta.url);
const expressRequire = createRequire(require.resolve("express"));
const qs = expressRequire("qs") as {
  parse(value: string, options: Record<string, unknown>): unknown;
  stringify(value: unknown): string;
};
describe("runtime query parser security regressions", () => {
  it("enforces comma-array limits for bracketed keys", () => {
    expect(() =>
      qs.parse("a[]=1,2,3,4", {
        comma: true,
        arrayLimit: 3,
        throwOnLimitExceeded: true,
      })
    ).toThrow(RangeError);
  });
  it("round-trips untrusted constructor properties without calling a non-function", () => {
    const parsed = qs.parse("x[constructor][isBuffer]=y", {
      plainObjects: true,
    });
    expect(qs.stringify(parsed)).toBe("x%5Bconstructor%5D%5BisBuffer%5D=y");
  });
});
