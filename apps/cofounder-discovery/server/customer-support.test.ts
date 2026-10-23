import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createCustomerSupportPreview,
  supportChecks,
  supportStatuses,
} from "../shared/customer-support";
import { CustomerSupportBundle } from "../client/src/components/CustomerSupportBundle";

describe("customer-selected local support diagnostics", () => {
  it("constructs only explicit labels, with no inferred health or metadata", () => {
    const value = createCustomerSupportPreview({
      observations: [{ check: "candidate_save", status: "not_checked" }],
    });
    expect(value.observations).toEqual([
      { check: "candidate_save", status: "not_checked" },
    ]);
    expect(value.sharing).toBe("local_review_only_no_upload");
    expect(value.evidence).toContain("not_automatic_runtime_acceptance");
    expect(Object.keys(value)).toEqual([
      "format",
      "evidence",
      "observations",
      "exclusions",
      "sharing",
    ]);
  });
  it("accepts every supported check and status without arbitrary content", () => {
    for (const check of supportChecks)
      for (const status of supportStatuses) {
        expect(
          createCustomerSupportPreview({ observations: [{ check, status }] })
            .observations
        ).toEqual([{ check, status }]);
      }
  });
  it.each([
    null,
    {},
    { observations: [] },
    { observations: Array(21).fill({ check: "sign_in", status: "pass" }) },
    {
      observations: [{ check: "sign_in", status: "pass", message: "private" }],
    },
    { observations: [{ check: "https://private.invalid", status: "pass" }] },
    { observations: [{ check: "sign_in", status: "probably" }] },
    { observations: [{ check: "sign_in" }] },
    { observations: [{ check: "sign_in", status: "pass" }], accountId: 7 },
  ])("rejects malformed or private input %#", input => {
    expect(() => createCustomerSupportPreview(input)).toThrow();
  });
  it("starts unchecked with disabled download and exact preview", () => {
    const html = renderToStaticMarkup(
      createElement(CustomerSupportBundle, { blocked: false })
    );
    expect(html).toContain("not_checked");
    expect(html).toContain("Diagnostic JSON preview");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Download support JSON/);
    expect(html).not.toContain('checked=""');
    expect(html).not.toContain("<textarea");
  });
  it("blocks the whole control group when account verification is unavailable", () => {
    const html = renderToStaticMarkup(
      createElement(CustomerSupportBundle, { blocked: true })
    );
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toContain("Refresh before preparing");
  });
});
