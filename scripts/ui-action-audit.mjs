// Read-only structural UI evidence. This does not infer authorization or execution.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectApiSurface } from "./api-surface-audit.mjs";

const repo = fileURLToPath(new URL("../", import.meta.url));
const ts = createRequire(
  new URL("../apps/cofounder-discovery/package.json", import.meta.url),
)("typescript");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function inspectUiActions(root = repo, api = inspectApiSurface(root)) {
  const client = join(root, "apps/cofounder-discovery/client/src");
  const visited = new Set(),
    inputs = [],
    actions = [];
  function visit(path) {
    path = resolve(path);
    if (visited.has(path)) return;
    visited.add(path);
    const bytes = readFileSync(path);
    const source = relative(root, path).replaceAll("\\", "/");
    const tree = ts.createSourceFile(
      path,
      bytes.toString("utf8"),
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    if (tree.parseDiagnostics.length)
      throw Error(`Unparseable UI source: ${source}`);
    inputs.push({ path: source, sha256: digest(bytes) });
    function localModule(specifier) {
      const stem = specifier.startsWith(".")
        ? resolve(dirname(path), specifier)
        : specifier.startsWith("@/")
          ? join(client, specifier.slice(2))
          : specifier.startsWith("@shared/")
            ? join(root, "apps/cofounder-discovery/shared", specifier.slice(8))
            : null;
      if (!stem) return;
      const target = [
        stem,
        stem + ".ts",
        stem + ".tsx",
        join(stem, "index.ts"),
        join(stem, "index.tsx"),
      ].find((p) => /\.tsx?$/.test(p) && existsSync(p));
      if (!target) throw Error(`Unresolved UI import in ${source}`);
      visit(target);
    }
    function walk(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        localModule(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0])
      )
        localModule(node.arguments[0].text);
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const attributes = node.attributes.properties;
        const names = attributes
          .filter(ts.isJsxAttribute)
          .map((a) => a.name.getText(tree));
        const events = names.filter((name) => /^on[A-Z]/.test(name));
        const tag = node.tagName.getText(tree);
        const navigation = names.includes("href") || names.includes("to");
        const implicitSubmit =
          tag === "button" || tag === "Button" || tag === "form";
        if (events.length || navigation || implicitSubmit) {
          actions.push({
            source,
            line:
              tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
            tag,
            events: events.sort(compare),
            navigation,
            possibleImplicitSubmit: implicitSubmit,
            disabledAttribute: names.includes("disabled"),
            spreadAttributes: attributes.some(ts.isJsxSpreadAttribute),
            expressionDigest: digest(node.getText(tree)),
          });
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(tree);
  }
  visit(join(client, "App.tsx"));
  inputs.sort((a, b) => compare(a.path, b.path));
  actions.sort((a, b) => compare(a.source, b.source) || a.line - b.line);
  return {
    format: "cofounder-ui-actions-v1",
    scope:
      "App local import/export/literal dynamic-import closure; JSX event attributes, navigation and possible implicit buttons/forms. Same-file API references are review leads, not handler-to-endpoint or data-effect proof. Spread/library/runtime controls and non-JSX imperative actions require manual review. No execution, permissions, usability or completion claim.",
    totals: {
      inputFiles: inputs.length,
      actionElements: actions.length,
      eventAttributes: actions.reduce(
        (sum, action) => sum + action.events.length,
        0,
      ),
      navigationElements: actions.filter((action) => action.navigation).length,
      spreadActionElements: actions.filter((action) => action.spreadAttributes)
        .length,
    },
    apiInputDigest: api.inputDigest,
    apiReferences: api.routes
      .flatMap((route) =>
        route.clientHooks
          .filter(
            (ref) =>
              ref.reachableFromApp && visited.has(resolve(root, ref.source)),
          )
          .map((ref) => ({
            operation: route.operation,
            source: ref.source,
            line: ref.line,
            hook: ref.hook,
          })),
      )
      .sort(
        (a, b) =>
          compare(a.source, b.source) ||
          a.line - b.line ||
          compare(a.operation, b.operation),
      ),
    inputFiles: inputs,
    inputDigest: digest(JSON.stringify(inputs)),
    actions,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(inspectUiActions(), null, 2));
