import { describe, expect, it } from "vitest";
import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";

describe("live verified workspace boundary", () => {
  it.each([0, 2, -1, Number.NaN])(
    "refuses non-verified stored flag %s",
    emailVerified => {
      expect(() =>
        assertVerifiedWorkspaceWorkAllowed({
          deletionFencedAt: null,
          emailVerified,
        })
      ).toThrow("Verify the current account");
    }
  );
  it("allows the exact verified flag on an unfenced live row", () => {
    expect(() =>
      assertVerifiedWorkspaceWorkAllowed({
        deletionFencedAt: null,
        emailVerified: 1,
      })
    ).not.toThrow();
  });
  it("does not relax deletion suspension for a verified account", () => {
    expect(() =>
      assertVerifiedWorkspaceWorkAllowed({
        deletionFencedAt: new Date(),
        emailVerified: 1,
      })
    ).toThrow("suspended");
  });
});
