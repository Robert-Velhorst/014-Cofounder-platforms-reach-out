// Pure fixtures/observations; this module neither contacts Docker nor reads data.
import assert from "node:assert/strict";

export const REQUIRED_CONTEXT_RULES = Object.freeze([
  "**/.git",
  "**/.secrets",
  "**/*.secret",
  "**/.env",
  "**/.env.*",
  "!**/.env.example",
  "**/node_modules",
  "**/dist",
  "**/coverage",
  "**/test-results",
  "**/output",
  "**/outputs",
  "**/.playwright-cli",
  "**/playwright-report",
  "**/browser-artifacts",
  "**/.docker-deploy",
  "**/backups",
  "**/data",
  "**/debug-bundles",
  "**/*.pem",
  "**/*.key",
  "**/*.p12",
  "**/*.pfx",
  "**/*.admin-grant",
  "**/*.cfb",
  "**/*.partial",
  "**/*.pid",
  "**/*.log",
  "**/*.zip",
  "**/*.exe",
  "**/*.dmg",
  "**/*.AppImage",
]);

// Exact source contract, NOT an implementation of Docker's matching semantics.
// BuildKit acceptance uses the actual .dockerignore in the integration fixture.
export function assertBuildContextRules(text) {
  assert.equal(typeof text, "string", "build_context_rules_refused");
  const rules = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  assert.equal(
    rules.filter((rule) => rule.startsWith("!")).join("\n"),
    "!**/.env.example",
    "build_context_exception_review_required",
  );
  for (const rule of REQUIRED_CONTEXT_RULES)
    assert.ok(rules.includes(rule), "build_context_exclusion_missing");
  assert.ok(
    rules.indexOf("!**/.env.example") > rules.indexOf("**/.env.*"),
    "build_context_example_exception_misordered",
  );
  return rules;
}

export const REQUIRED_CONTEXT_FILES = Object.freeze([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  "apps/cofounder-discovery/.env.example",
  "apps/cofounder-discovery/package.json",
  "apps/cofounder-discovery/client/src/App.tsx",
  "apps/cofounder-discovery/server/example.ts",
  "apps/cofounder-discovery/shared/example.ts",
  "apps/cofounder-discovery/scripts/migrate.ts",
  "apps/cofounder-discovery/drizzle/0001_example.sql",
  "apps/cofounder-discovery/drizzle/meta/_journal.json",
  "apps/cofounder-discovery/server/test-fixtures/candidate.json",
  "deploy/hetzner/mysql/initialize-roles.sh",
]);

export const EXCLUDED_CONTEXT_FILES = Object.freeze([
  ...["", "nested/"].flatMap((prefix) =>
    [
      ".git/config",
      ".secrets/runtime",
      ".env",
      ".env.production",
      "runtime.secret",
      "backups/snapshot.sql",
      "data/candidates.json",
      "debug-bundles/diagnostics.json",
      ".docker-deploy/runtime.json",
      "private.pem",
      "private.key",
      "private.p12",
      "private.pfx",
      "access.admin-grant",
      "recovery.cfb",
      "recovery.partial",
      "process.pid",
      "diagnostics.log",
      "archive.zip",
      "installer.exe",
      "installer.dmg",
      "installer.AppImage",
      "node_modules/private/index.js",
      "dist/private.js",
      "coverage/private.json",
      "test-results/private.json",
      "output/private.json",
      "outputs/private.json",
      ".playwright-cli/private.json",
      "playwright-report/private.json",
      "browser-artifacts/private.png",
    ].map((path) => prefix + path),
  ),
]);

export function assertSyntheticContextPaths(paths) {
  const refuse = "synthetic_build_context_export_refused";
  assert.ok(Array.isArray(paths) && paths.length <= 128, refuse);
  assert.equal(new Set(paths).size, paths.length, refuse);
  const allowed = new Set([
    ...REQUIRED_CONTEXT_FILES,
    "Dockerfile",
    ".dockerignore",
  ]);
  for (const path of paths)
    assert.ok(typeof path === "string" && allowed.has(path), refuse);
  for (const path of REQUIRED_CONTEXT_FILES)
    assert.ok(paths.includes(path), refuse);
  return {
    format: "cofounder-synthetic-build-context-v1",
    requiredFiles: REQUIRED_CONTEXT_FILES.length,
    forbiddenFilesObserved: 0,
    scope: "synthetic-context-not-production-image-or-secret-scan",
  };
}
