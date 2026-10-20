import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const css = readFileSync(
  new URL("../client/src/index.css", import.meta.url),
  "utf8"
);
const dark = css.match(/\.dark\s*\{([^}]+)\}/)![1];
describe("primary control label contrast tokens", () => {
  it("uses the reviewed near-black label on dark-theme orange controls", () => {
    expect(dark).toMatch(/--primary-foreground:\s*#0a0a0a;/);
    expect(dark).toMatch(/--primary:\s*oklch\(0\.65 0\.25 40\);/);
  });
  it("keeps sidebar primary labels on the same reviewed pair", () => {
    expect(dark).toMatch(/--sidebar-primary-foreground:\s*#0a0a0a;/);
    expect(dark).toMatch(/--sidebar-primary:\s*oklch\(0\.65 0\.25 40\);/);
  });
  it("preserves light-theme primary colour tokens", () => {
    const light = css.match(/:root\s*\{([^}]+)\}/)![1];
    expect(light).toMatch(/--primary:\s*var\(--color-blue-700\);/);
    expect(light).toMatch(/--primary-foreground:\s*var\(--color-blue-50\);/);
  });
});
