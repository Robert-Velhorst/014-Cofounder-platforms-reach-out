import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  openSync,
  readSync,
  fstatSync,
  closeSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fail = () => {
  throw new Error("release_inventory_unavailable");
};
const app = "apps/cofounder-discovery";
const fixed = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  ".gitattributes",
  "Dockerfile",
  ".dockerignore",
  "scripts/browser-journey.integration.test.mjs",
  "scripts/browser-journey.test.mjs",
  `${app}/package.json`,
  `${app}/tsconfig.json`,
  `${app}/vite.config.ts`,
];
const requiredArtifacts = [
  "index.js",
  "migrate.js",
  "start-runtime.js",
  "inspect-email-verification.js",
  "require-account-reverification.js",
  "admin-enrollment.js",
  "process-account-deletion.js",
  "public/index.html",
].map((path) => `${app}/dist/${path}`);
const requiredMigrations = [`${app}/drizzle/meta/_journal.json`];
const sourceDirectories = [
  "client/src",
  "server",
  "shared",
  "scripts",
  "drizzle",
].map((path) => `${app}/${path}`);

export function inspectRelease(root, git = execFileSync) {
  const base = realpathSync(root);
  let totalBytes = 0;
  let directoryCount = 0;
  const files = new Map();
  function inspect(path, role) {
    if (files.has(path)) return;
    if (files.size >= 4096) fail();
    const absolute = join(base, ...path.split("/"));
    const stat = lstatSync(absolute);
    const rel = relative(base, realpathSync(absolute));
    if (
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      isAbsolute(rel) ||
      rel === ".." ||
      rel.startsWith(`..${sep}`) ||
      stat.size > 40 * 1024 * 1024
    )
      fail();
    const bytes = readFileSync(absolute);
    totalBytes += bytes.length;
    if (bytes.length !== stat.size || totalBytes > 256 * 1024 * 1024) fail();
    files.set(path, { path, role, bytes: bytes.length, sha256: sha256(bytes) });
  }
  function walk(path, role) {
    if (++directoryCount > 4096) fail();
    const absolute = join(base, ...path.split("/"));
    const rel = relative(base, realpathSync(absolute));
    if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)) fail();
    if (lstatSync(absolute).isSymbolicLink()) fail();
    const entries = readdirSync(absolute, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    for (const entry of entries) {
      if (entry.isSymbolicLink()) fail();
      if (
        entry.name.startsWith(".") ||
        ["node_modules", "coverage", "logs", "tmp", "temp"].includes(entry.name)
      )
        continue;
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) walk(child, role);
      else if (
        role === "built-artifact" ||
        /\.(ts|tsx|js|mjs|css|html|json|sql)$/.test(entry.name)
      )
        inspect(child, role);
    }
  }
  fixed.forEach((path) => inspect(path, "selected-build-input"));
  sourceDirectories.forEach((path) => walk(path, "application-source"));
  requiredArtifacts.forEach((path) => inspect(path, "built-artifact"));
  requiredMigrations.forEach((path) => inspect(path, "application-source"));
  walk(`${app}/dist`, "built-artifact");
  const versions = ["package.json", `${app}/package.json`].map((path) => {
    const bytes = readFileSync(join(base, ...path.split("/")));
    if (sha256(bytes) !== files.get(path).sha256) fail();
    const parsed = JSON.parse(bytes.toString("utf8"));
    if (
      typeof parsed.version !== "string" ||
      !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(parsed.version)
    )
      fail();
    return { package: path, version: parsed.version };
  });
  const head = git("git", ["-C", base, "rev-parse", "HEAD"], {
    encoding: "utf8",
    timeout: 5000,
    maxBuffer: 1024 * 1024,
  }).trim();
  if (!/^[a-f0-9]{40}$/.test(head)) fail();
  const dirty = Boolean(
    git(
      "git",
      ["-C", base, "status", "--porcelain", "--untracked-files=normal"],
      { encoding: "utf8", timeout: 5000, maxBuffer: 1024 * 1024 },
    ).trim(),
  );
  const inventory = [...files.values()].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
  return {
    format: "cofounder-release-inventory/v1",
    checkout: { head, dirty },
    versions,
    inventoryDigest: sha256(JSON.stringify(inventory)),
    inventory,
    scope: "selected_build_inputs_application_source_and_local_dist",
    excluded: [
      "environment_and_secret_files",
      "node_modules",
      "root_operator_sources_and_docs",
      "host_and_provider_state",
      "container_layers_and_registry",
    ],
    buildProvenanceVerified: false,
    testAcceptanceVerified: false,
    productionAcceptanceProven: false,
    note: "Hashes identify observed local files, not a causal source-to-build attestation. Package namespaces may have different versions. Rebuild and requalify after changes; do not use an old receipt for new hashes.",
  };
}

const roles = new Set([
  "application-source",
  "selected-build-input",
  "built-artifact",
]);
const manifestLimit = 2 * 1024 * 1024;

function validateObservedInventory(report) {
  if (
    report?.format !== "cofounder-release-inventory/v1" ||
    report.scope !==
      "selected_build_inputs_application_source_and_local_dist" ||
    typeof report.inventoryDigest !== "string" ||
    !/^[a-f0-9]{64}$/.test(report.inventoryDigest) ||
    !Array.isArray(report.inventory) ||
    report.inventory.length === 0 ||
    report.inventory.length > 4096
  )
    fail();
  let previous = "",
    bytes = 0;
  for (const row of report.inventory) {
    if (
      !row ||
      Object.keys(row).sort().join(",") !== "bytes,path,role,sha256" ||
      typeof row.path !== "string" ||
      row.path.length > 1024 ||
      row.path.startsWith("/") ||
      /[\\:\u0000-\u001f\u007f]/.test(row.path) ||
      row.path
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      row.path <= previous ||
      !roles.has(row.role) ||
      !Number.isSafeInteger(row.bytes) ||
      row.bytes < 0 ||
      row.bytes > 40 * 1024 * 1024 ||
      typeof row.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(row.sha256)
    )
      fail();
    previous = row.path;
    bytes += row.bytes;
    if (bytes > 256 * 1024 * 1024) fail();
  }
  if (sha256(JSON.stringify(report.inventory)) !== report.inventoryDigest)
    fail();
}

// Identity comparison only. A caller-supplied manifest is not trusted acceptance evidence.
export function compareReleaseInventories(baseline, current) {
  validateObservedInventory(baseline);
  validateObservedInventory(current);
  const before = new Map(baseline.inventory.map((row) => [row.path, row]));
  const after = new Map(current.inventory.map((row) => [row.path, row]));
  const changes = { added: 0, removed: 0, modified: 0 };
  const changedRoles = {
    "application-source": 0,
    "selected-build-input": 0,
    "built-artifact": 0,
  };
  for (const [path, row] of after) {
    const old = before.get(path);
    if (!old) {
      changes.added++;
      changedRoles[row.role]++;
    } else if (
      old.sha256 !== row.sha256 ||
      old.bytes !== row.bytes ||
      old.role !== row.role
    ) {
      changes.modified++;
      changedRoles[row.role]++;
      if (old.role !== row.role) changedRoles[old.role]++;
    }
  }
  for (const [path, row] of before)
    if (!after.has(path)) {
      changes.removed++;
      changedRoles[row.role]++;
    }
  const same = baseline.inventoryDigest === current.inventoryDigest;
  return {
    format: "cofounder-release-comparison/v1",
    status: same ? "same_observed_inventory" : "inventory_changed",
    baselineDigest: baseline.inventoryDigest,
    currentDigest: current.inventoryDigest,
    changes,
    changedRoles,
    buildProvenanceVerified: false,
    testAcceptanceVerified: false,
    productionAcceptanceProven: false,
    note: "Compares scoped file identity only, not checkout identity, authenticated receipts, source-to-build causality, tests or deployment approval. Requalify changed artifacts; a matching caller-supplied baseline cannot approve a release.",
  };
}

function readBaseline(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > manifestLimit)
    fail();
  const fd = openSync(path, "r");
  try {
    if (!fstatSync(fd).isFile()) fail();
    const buffer = Buffer.alloc(manifestLimit + 1);
    let used = 0,
      count;
    while (
      used < buffer.length &&
      (count = readSync(fd, buffer, used, buffer.length - used, null)) > 0
    )
      used += count;
    if (used > manifestLimit) fail();
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        buffer.subarray(0, used),
      ),
    );
  } finally {
    closeSync(fd);
  }
}

export function runInventory(args, root, inspect = inspectRelease) {
  if (args.length === 1 && args[0] === "--help")
    return {
      code: 0,
      output:
        "Usage: pnpm release:inventory [--compare <saved-inventory.json>]\nRead-only local hashes/comparison; no build, test, upload or release approval.\n",
    };
  const comparing =
    args.length === 2 &&
    args[0] === "--compare" &&
    typeof args[1] === "string" &&
    args[1].length > 0 &&
    !args[1].startsWith("--");
  if (args.length && !comparing)
    return {
      code: 1,
      output: '{"ok":false,"error":"invalid_inventory_arguments"}\n',
    };
  try {
    if (comparing) {
      const baseline = readBaseline(args[1]);
      validateObservedInventory(baseline);
      const comparison = compareReleaseInventories(baseline, inspect(root));
      return {
        code: comparison.status === "same_observed_inventory" ? 0 : 1,
        output: JSON.stringify(comparison, null, 2) + "\n",
      };
    }
    return {
      code: 0,
      output: JSON.stringify(inspect(root), null, 2) + "\n",
    };
  } catch {
    return {
      code: 1,
      output: '{"ok":false,"error":"release_inventory_unavailable"}\n',
    };
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const result = runInventory(
    args,
    resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  );
  process.stdout.write(result.output);
  process.exitCode = result.code;
}
