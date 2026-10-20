import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectUiActions } from "./ui-action-audit.mjs";

const emptyApi = { routes: [], inputDigest: "synthetic" };
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), "cofounder-ui-audit-"));
  const folder = join(root, "apps/cofounder-discovery/client/src");
  mkdirSync(folder, { recursive: true });
  try {
    run(root, folder);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("current UI inventory covers current source bytes rather than stale receipts", () => {
  const actual = inspectUiActions();
  const expected = JSON.parse(
    readFileSync(
      new URL("../docs/UI_ACTION_INVENTORY_2026-10-20.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(actual, expected);
  assert.ok(actual.totals.actionElements > 0);
});
test("walks literal lazy imports and re-exports once, ignoring comments and unreachable pages", () =>
  fixture((root, folder) => {
    writeFileSync(
      join(folder, "App.tsx"),
      'import "./barrel"; const p=import("./Panel"); // <button onClick={fake}/>\nexport const App=()=> <a href="/login">Login</a>;',
    );
    writeFileSync(join(folder, "barrel.ts"), 'export * from "./Panel";');
    writeFileSync(
      join(folder, "Panel.tsx"),
      'import "./barrel"; export const Panel=()=> <form onSubmit={save}><Button disabled onClick={review} {...props}/><input onChange={edit}/></form>;',
    );
    writeFileSync(
      join(folder, "Legacy.tsx"),
      "export const Legacy=()=> <button onClick={send}/>;",
    );
    const result = inspectUiActions(root, emptyApi);
    assert.equal(result.totals.inputFiles, 3);
    assert.equal(result.totals.actionElements, 4);
    assert.equal(result.totals.eventAttributes, 3);
    assert.equal(result.totals.navigationElements, 1);
    assert.equal(result.totals.spreadActionElements, 1);
    assert.equal(
      result.actions.find((a) => a.tag === "Button").disabledAttribute,
      true,
    );
    assert.ok(result.actions.every((a) => !a.source.endsWith("Legacy.tsx")));
  }));
test("same-file references are review leads, not guessed event bindings or source content", () =>
  fixture((root, folder) => {
    writeFileSync(
      join(folder, "App.tsx"),
      'export const App=()=> <button onClick={()=> secret("synthetic-private-marker")}>Go</button>;',
    );
    const source = "apps/cofounder-discovery/client/src/App.tsx";
    const result = inspectUiActions(root, {
      inputDigest: "synthetic",
      routes: [
        {
          operation: "auth.logout",
          clientHooks: [
            { source, line: 1, hook: "useMutation", reachableFromApp: true },
          ],
        },
      ],
    });
    assert.deepEqual(result.apiReferences, [
      { operation: "auth.logout", source, line: 1, hook: "useMutation" },
    ]);
    assert.equal(
      JSON.stringify(result).includes("synthetic-private-marker"),
      false,
    );
  }));
test("refuses unresolved local modules and malformed source", () =>
  fixture((root, folder) => {
    writeFileSync(join(folder, "App.tsx"), 'import "./Missing";');
    assert.throws(
      () => inspectUiActions(root, emptyApi),
      /Unresolved UI import/,
    );
    writeFileSync(join(folder, "App.tsx"), "export const App=()=> <button");
    assert.throws(
      () => inspectUiActions(root, emptyApi),
      /Unparseable UI source/,
    );
  }));
test("event changes alter input and expression digests without executing the handler", () =>
  fixture((root, folder) => {
    const path = join(folder, "App.tsx");
    writeFileSync(path, "export const App=()=> <button onClick={first}/>;");
    const before = inspectUiActions(root, emptyApi);
    writeFileSync(path, "export const App=()=> <button onClick={second}/>;");
    const after = inspectUiActions(root, emptyApi);
    assert.notEqual(before.inputDigest, after.inputDigest);
    assert.notEqual(
      before.actions[0].expressionDigest,
      after.actions[0].expressionDigest,
    );
    assert.deepEqual(after, inspectUiActions(root, emptyApi));
  }));
