import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
const key = {
  keyId: "key-id",
  label: "Laptop key",
  createdAt: "2026-10-01T12:00:00Z",
  lastUsedAt: null,
  backedUp: false,
  deviceType: "singleDevice",
};
async function render(extra = {}) {
  const path = "../client/src/components/AdminSecurityPanel";
  const module = await import(path).catch(() => null);
  expect(module?.AdminSecurityPanel).toBeTypeOf("function");
  return renderToStaticMarkup(
    createElement(module.AdminSecurityPanel, {
      status: { accountId: 7, passkeys: [], elevatedUntil: null },
      ready: true,
      supported: true,
      phase: "idle",
      now: Date.parse("2026-10-01T12:01:00Z"),
      problem: "",
      notice: "",
      onEnroll: () => {},
      onVerify: () => {},
      onRemove: () => {},
      onCancel: () => {},
      onRefresh: () => {},
      ...extra,
    })
  );
}
describe("administrator security presentation", () => {
  it("requires an operator grant and current password for a first passkey, without asking for a device PIN", async () => {
    const html = await render();
    expect(html).toContain('id="enrollment-grant"');
    expect(html).toContain('id="enrollment-password"');
    expect(html).toContain('id="passkey-label"');
    expect(html).not.toContain('id="device-pin"');
    expect(html).toContain("Register passkey");
  });
  it("does not expose credential forms while status is unverified or storage failed", async () => {
    const html = await render({
      ready: false,
      problem: "Could not check security status.",
    });
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('type="password"');
    expect(html).toContain("Refresh security status");
  });
  it("explains unsupported browsers without offering an alternative weaker factor", async () => {
    const html = await render({ supported: false });
    expect(html).toContain("secure browser");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Send code");
  });
  it("offers passkey verification before additional enrollment and prevents removing the last factor", async () => {
    const html = await render({
      status: { accountId: 7, passkeys: [key], elevatedUntil: null },
    });
    expect(html).toContain("Verify with passkey");
    expect(html).not.toContain('id="enrollment-grant"');
    expect(html).not.toContain('id="enrollment-password"');
    expect(html).toContain("Keep at least one passkey");
  });
  it("stops presenting expired elevation as active", async () => {
    const html = await render({
      status: {
        accountId: 7,
        passkeys: [key],
        elevatedUntil: "2026-10-01T12:00:59Z",
      },
    });
    expect(html).toContain("Verification required");
    expect(html).not.toContain("Verification active");
  });
  it("shows additional enrollment only after server-confirmed unexpired elevation", async () => {
    const html = await render({
      status: {
        accountId: 7,
        passkeys: [key, { ...key, keyId: "backup", label: "Backup key" }],
        elevatedUntil: "2026-10-01T12:05:00Z",
      },
    });
    expect(html).toContain("Verification active");
    expect(html).toContain('id="enrollment-password"');
    expect(html).not.toContain('id="enrollment-grant"');
    expect(html).toContain("Confirm removal");
  });
  it("explains saving as non-cancellable instead of implying an accepted write was undone", async () => {
    const html = await render({ phase: "saving" });
    expect(html).toContain("Waiting for the server");
    expect(html).not.toContain("Cancel device prompt");
  });
});
