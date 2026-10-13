import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateExport } from "../client/src/components/CandidateExport";
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    criticalPath: { prospects: { exportCsv: { useMutation: () => ({}) } } },
  },
}));
describe("candidate export presentation", () => {
  it("explains a failed account check instead of silently disabling export", () => {
    const html = renderToStaticMarkup(
      createElement(CandidateExport, { accountId: 1, accountBlocked: true })
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Refresh your workspace before exporting");
  });
  it("labels the limited export scope without claiming a complete privacy export", () => {
    const html = renderToStaticMarkup(
      createElement(CandidateExport, { accountId: 1, accountBlocked: false })
    );
    expect(html).toContain("Export active candidates");
    expect(html).toContain("excludes archived candidates");
    expect(html).toContain("not a lossless backup or full privacy export");
    expect(html).not.toContain('role="alert"');
  });
});
