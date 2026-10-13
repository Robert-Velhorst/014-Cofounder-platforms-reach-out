// Read-only structural evidence. Does not import/run application modules or handlers.
import { createRequire } from "node:module";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const repo = fileURLToPath(new URL("../", import.meta.url));
const ts = createRequire(join(repo, "apps/cofounder-discovery/package.json"))(
  "typescript",
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const localName = (node) =>
  ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : null;
const chain = (node) =>
  ts.isIdentifier(node)
    ? [node.text]
    : ts.isPropertyAccessExpression(node)
      ? [...chain(node.expression), node.name.text]
      : [];

export function inspectApiSurface(root = repo) {
  const app = join(root, "apps/cofounder-discovery"),
    cache = new Map(),
    evidence = new Map();
  function source(path) {
    path = resolve(path);
    if (!cache.has(path)) {
      const bytes = readFileSync(path),
        tree = ts.createSourceFile(
          path,
          bytes.toString("utf8"),
          ts.ScriptTarget.Latest,
          true,
          path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
      if (tree.parseDiagnostics.length)
        throw Error(`Unparseable source: ${relative(root, path)}`);
      cache.set(path, tree);
      evidence.set(relative(root, path).replaceAll("\\", "/"), hash(bytes));
    }
    return cache.get(path);
  }
  // Bind the documented admission/boundary/HTTP wrapper to its exact source too.
  for (const path of ["server/_core/trpc.ts", "server/_core/index.ts"]) {
    const file = join(app, path);
    if (existsSync(file)) source(file);
  }
  function modulePath(from, specifier) {
    const stem = specifier.startsWith(".")
      ? resolve(dirname(from), specifier)
      : specifier.startsWith("@/")
        ? join(app, "client/src", specifier.slice(2))
        : specifier.startsWith("@shared/")
          ? join(app, "shared", specifier.slice(8))
          : null;
    if (!stem) return null;
    const found = [
      stem,
      stem + ".ts",
      stem + ".tsx",
      join(stem, "index.ts"),
      join(stem, "index.tsx"),
    ].find((p) => existsSync(p) && /\.tsx?$/.test(p));
    if (!found)
      throw Error(
        `Unresolved local import ${specifier} in ${relative(root, from)}`,
      );
    return found;
  }
  function bindings(tree) {
    const values = new Map(),
      imports = new Map();
    for (const statement of tree.statements) {
      if (ts.isVariableStatement(statement))
        for (const d of statement.declarationList.declarations)
          if (ts.isIdentifier(d.name) && d.initializer)
            values.set(d.name.text, d.initializer);
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.importClause?.namedBindings &&
        ts.isNamedImports(statement.importClause.namedBindings)
      )
        for (const e of statement.importClause.namedBindings.elements)
          imports.set(e.name.text, {
            symbol: e.propertyName?.text || e.name.text,
            module: statement.moduleSpecifier.text,
          });
    }
    return { values, imports };
  }
  const routes = [],
    stack = new Set();
  function walkRouter(path, node, prefix) {
    const tree = source(path),
      { values, imports } = bindings(tree);
    if (ts.isIdentifier(node)) {
      const key = path + ":" + node.text;
      if (stack.has(key)) throw Error(`Router cycle ${key}`);
      stack.add(key);
      if (values.has(node.text))
        walkRouter(path, values.get(node.text), prefix);
      else {
        const binding = imports.get(node.text),
          target = binding && modulePath(path, binding.module);
        if (!target) throw Error(`Unresolved router ${prefix}: ${node.text}`);
        walkRouter(target, ts.factory.createIdentifier(binding.symbol), prefix);
      }
      stack.delete(key);
      return;
    }
    if (
      !ts.isCallExpression(node) ||
      !ts.isIdentifier(node.expression) ||
      node.expression.text !== "router" ||
      node.arguments.length !== 1 ||
      !ts.isObjectLiteralExpression(node.arguments[0])
    )
      throw Error(`Unsupported router shape at ${prefix}`);
    for (const property of node.arguments[0].properties) {
      if (!ts.isPropertyAssignment(property))
        throw Error(`Unsupported router property at ${prefix}`);
      const name = localName(property.name);
      if (!name) throw Error("Computed route name");
      const operation = [prefix, name].filter(Boolean).join("."),
        value = property.initializer;
      if (
        ts.isCallExpression(value) &&
        ts.isPropertyAccessExpression(value.expression) &&
        ["query", "mutation", "subscription"].includes(
          value.expression.name.text,
        )
      ) {
        let base = value;
        while (ts.isCallExpression(base) || ts.isPropertyAccessExpression(base))
          base = base.expression;
        if (!ts.isIdentifier(base))
          throw Error(`Unknown procedure boundary ${operation}`);
        const procedureAliases = [];
        while (values.has(base.text)) {
          if (procedureAliases.includes(base.text))
            throw Error(`Procedure alias cycle ${operation}`);
          procedureAliases.push(base.text);
          base = values.get(base.text);
          while (
            ts.isCallExpression(base) ||
            ts.isPropertyAccessExpression(base)
          )
            base = base.expression;
          if (!ts.isIdentifier(base))
            throw Error(`Unknown alias boundary ${operation}`);
        }
        const boundary = imports.get(base.text)?.symbol || base.text;
        if (
          ![
            "publicProcedure",
            "protectedProcedure",
            "verifiedProcedure",
            "adminProcedure",
            "adminIdentityProcedure",
          ].includes(boundary)
        )
          throw Error(`Unknown procedure boundary ${boundary}`);
        const line =
          tree.getLineAndCharacterOfPosition(property.getStart(tree)).line + 1;
        routes.push({
          operation,
          kind: value.expression.name.text,
          boundary,
          procedureAliases,
          source: relative(root, path).replaceAll("\\", "/"),
          line,
          handlerDigest: hash(value.getText(tree)),
          clientHooks: [],
        });
      } else walkRouter(path, value, operation);
    }
  }
  const entry = join(app, "server/routers.ts");
  walkRouter(entry, ts.factory.createIdentifier("appRouter"), "");
  const names = new Set(routes.map((r) => r.operation));
  if (names.size !== routes.length) throw Error("Duplicate operation");
  const policy = source(join(app, "server/route-policy.ts"));
  const prefixes = bindings(policy).values.get("SAFE_PREFIXES");
  const operations = bindings(policy).values.get("SAFE_OPERATIONS");
  if (
    !(
      operations &&
      ts.isArrayLiteralExpression(operations) &&
      operations.elements.every(ts.isStringLiteral)
    ) &&
    !(
      prefixes &&
      ts.isArrayLiteralExpression(prefixes) &&
      prefixes.elements.every(ts.isStringLiteral)
    )
  )
    throw Error("Unknown route admission policy");
  const exact = [];
  function policyVisit(n) {
    if (
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
      ts.isIdentifier(n.left) &&
      n.left.text === "name" &&
      ts.isStringLiteral(n.right)
    )
      exact.push(n.right.text);
    ts.forEachChild(n, policyVisit);
  }
  if (operations) exact.push(...operations.elements.map((n) => n.text));
  else policyVisit(policy); // Historical prefix-policy fixtures only.
  for (const route of routes)
    route.defaultPolicyAdmitted =
      exact.includes(route.operation) ||
      (!operations &&
        prefixes.elements.some((p) => route.operation.startsWith(p.text)));
  const reachable = new Set();
  function visitClient(path) {
    if (reachable.has(path)) return;
    reachable.add(path);
    const tree = source(path);
    function visit(n) {
      let spec;
      if (
        ts.isImportDeclaration(n) &&
        ts.isStringLiteral(n.moduleSpecifier) &&
        !n.importClause?.isTypeOnly
      )
        spec = n.moduleSpecifier.text;
      else if (
        ts.isCallExpression(n) &&
        n.expression.kind === ts.SyntaxKind.ImportKeyword &&
        n.arguments.length === 1 &&
        ts.isStringLiteral(n.arguments[0])
      )
        spec = n.arguments[0].text;
      if (spec) {
        const target = modulePath(path, spec);
        if (target) visitClient(target);
      }
      ts.forEachChild(n, visit);
    }
    visit(tree);
  }
  visitClient(join(app, "client/src/App.tsx"));
  const unknownClientHooks = [];
  function inspectClient(path) {
    const tree = source(path),
      aliases = new Map([["trpc", ["trpc"]]]);
    function collect(n) {
      if (
        ts.isVariableDeclaration(n) &&
        ts.isIdentifier(n.name) &&
        n.initializer
      ) {
        const init = n.initializer;
        if (
          ts.isPropertyAccessExpression(init) &&
          init.name.text === "client" &&
          ts.isCallExpression(init.expression) &&
          chain(init.expression.expression).join(".") === "trpc.useUtils"
        )
          aliases.set(n.name.text, ["client"]);
        else {
          const parts = chain(init);
          if (aliases.has(parts[0]))
            aliases.set(n.name.text, [
              ...aliases.get(parts[0]),
              ...parts.slice(1),
            ]);
        }
      }
      ts.forEachChild(n, collect);
    }
    collect(tree);
    function visit(n) {
      if (ts.isCallExpression(n)) {
        let parts = chain(n.expression);
        if (aliases.has(parts[0]))
          parts = [...aliases.get(parts[0]), ...parts.slice(1)];
        if (
          (parts[0] === "trpc" &&
            ["useQuery", "useMutation", "useInfiniteQuery"].includes(
              parts.at(-1),
            )) ||
          (parts[0] === "client" && ["query", "mutate"].includes(parts.at(-1)))
        ) {
          const operation = parts.slice(1, -1).join(".");
          const ref = {
            source: relative(root, path).replaceAll("\\", "/"),
            line: tree.getLineAndCharacterOfPosition(n.getStart(tree)).line + 1,
            hook: parts.at(-1),
            reachableFromApp: reachable.has(path),
          };
          const record = routes.find((r) => r.operation === operation);
          if (record) record.clientHooks.push(ref);
          else unknownClientHooks.push({ operation, ...ref });
        }
      }
      ts.forEachChild(n, visit);
    }
    visit(tree);
  }
  function files(folder) {
    for (const dirent of readdirSync(folder, { withFileTypes: true })) {
      const p = join(folder, dirent.name);
      if (dirent.isDirectory()) files(p);
      else if (/\.tsx?$/.test(p) && !/(test|spec)\.[cm]?tsx?$/.test(p))
        inspectClient(p);
    }
  }
  files(join(app, "client/src"));
  // Directory enumeration differs on Windows/Linux; receipt order must not.
  const compareReference = (a, b) =>
    a.source < b.source ? -1 : a.source > b.source ? 1 : a.line - b.line;
  for (const route of routes) route.clientHooks.sort(compareReference);
  unknownClientHooks.sort(compareReference);
  // Bind admission claims to exact policy bytes: this projection is not the middleware itself.
  const inputFiles = [...evidence]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([path, sha256]) => ({ path, sha256 }));
  return {
    format: "cofounder-api-surface-v1",
    scope:
      "static tRPC declarations and direct hooks/simple imperative-client aliases; import closure is structural, no execution or complete data-effect proof",
    policySourceDigest: hash(readFileSync(join(app, "server/route-policy.ts"))),
    totals: {
      operations: routes.length,
      defaultPolicyAdmitted: routes.filter((r) => r.defaultPolicyAdmitted)
        .length,
      defaultPolicyDenied: routes.filter((r) => !r.defaultPolicyAdmitted)
        .length,
      reachableHookReferences: routes
        .flatMap((r) => r.clientHooks)
        .filter((h) => h.reachableFromApp).length,
      unknownClientHooks: unknownClientHooks.length,
    },
    routes: routes.sort((a, b) => a.operation.localeCompare(b.operation, "en")),
    unknownClientHooks,
    inputFiles,
    inputDigest: hash(JSON.stringify(inputFiles)),
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(inspectApiSurface(), null, 2));
