import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function integrationFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? integrationFiles(path)
      : entry.name.endsWith(".integration.test.ts")
        ? [path]
        : [];
  });
}

describe("database acceptance inventory", () => {
  it("includes every named database suite exactly once in the integration command", () => {
    const root = new URL("../", import.meta.url);
    const manifest = JSON.parse(
      readFileSync(new URL("package.json", root), "utf8")
    );
    const command = manifest.scripts["test:integration"] as string;
    const paths = command
      .split(/\s+/)
      .filter(value => value.endsWith(".test.ts"));
    const appDirectory = new URL("../", import.meta.url);
    const serverDirectory = new URL("./", import.meta.url);
    // URL conversion supports Windows paths and Linux container paths alike.
    const expected = integrationFiles(fileURLToPath(serverDirectory)).map(
      path => relative(fileURLToPath(appDirectory), path).replaceAll("\\", "/")
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(
      paths.filter(path => path.endsWith(".integration.test.ts")).sort()
    ).toEqual(expected.sort());
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every(path => existsSync(new URL(path, appDirectory)))).toBe(true);
    expect(command).toContain("REQUIRE_DATABASE_TESTS=true");
  });

  it("does not exclude partnership acceptance from the database release gate", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8")
    );
    expect(manifest.scripts["test:integration"]).toContain(
      "server/partnership-progress.integration.test.ts"
    );
  });
});
