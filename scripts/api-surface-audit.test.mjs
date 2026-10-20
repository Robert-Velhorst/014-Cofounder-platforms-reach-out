import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { inspectApiSurface } from "./api-surface-audit.mjs";
const root = new URL("../", import.meta.url),
  audit = inspectApiSurface();
const ts = createRequire(
  new URL("../apps/cofounder-discovery/package.json", import.meta.url),
)("@typescript/typescript6");
const policy = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(
        readFileSync(
          new URL("apps/cofounder-discovery/server/route-policy.ts", root),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText,
    ).toString("base64")
);
test("committed audit snapshot matches current inspected source bytes and records", () => {
  const snapshot = JSON.parse(
    readFileSync(
      new URL("docs/API_SURFACE_INVENTORY_2026-10-20.json", root),
      "utf8",
    ),
  );
  assert.deepEqual(
    audit,
    snapshot,
    "Regenerate and review the source-derived inventory after changes; a stale snapshot is not current evidence.",
  );
});
test("every discovered operation agrees with actual pure route policy", () => {
  for (const route of audit.routes) {
    assert.equal(
      route.defaultPolicyAdmitted,
      policy.isSafeOperation(route.operation),
      route.operation,
    );
    assert.equal(
      policy.permitsTrpcUrl("/" + route.operation, false),
      route.defaultPolicyAdmitted,
    );
    assert.equal(policy.permitsTrpcUrl("/" + route.operation, true), true);
  }
});
test("authenticated alias and MFA owned boundary resolve to original procedures", () => {
  assert.equal(
    audit.routes.find((r) => r.operation === "criticalPath.platforms").boundary,
    "verifiedProcedure",
  );
  const mfa = audit.routes.find(
    (r) => r.operation === "auth.adminMfa.beginEnrollment",
  );
  assert.equal(mfa.boundary, "adminIdentityProcedure");
  assert.deepEqual(mfa.procedureAliases, ["owned"]);
});
test("reachable imperative MFA consumers and hook consumers are found", () => {
  const mfa = audit.routes.find(
    (r) => r.operation === "auth.adminMfa.beginEnrollment",
  );
  assert.ok(
    mfa.clientHooks.some((r) => r.reachableFromApp && r.hook === "mutate"),
  );
  assert.ok(
    audit.routes
      .find((r) => r.operation === "accountData.export")
      .clientHooks.some((r) => r.reachableFromApp),
  );
  assert.equal(audit.unknownClientHooks.length, 0);
});
test("legacy client references are not mistaken for supported reachable pages", () => {
  const denied = audit.routes.filter((r) => !r.defaultPolicyAdmitted);
  assert.ok(denied.length > 0);
  assert.ok(denied.some((r) => r.clientHooks.some((h) => !h.reachableFromApp)));
  assert.equal(
    denied.flatMap((r) => r.clientHooks).filter((h) => h.reachableFromApp)
      .length,
    0,
  );
});
test("line and handler/source digests bind each record to its exact inspected file", () => {
  for (const r of audit.routes) {
    assert.ok(r.line > 0);
    assert.match(r.handlerDigest, /^[a-f0-9]{64}$/);
    assert.ok(audit.inputFiles.some((f) => f.path === r.source));
    const line = readFileSync(new URL(r.source, root), "utf8").split(/\r?\n/)[
      r.line - 1
    ];
    assert.ok(line.includes(r.operation.split(".").at(-1)), r.operation);
  }
});
test("read-only audit is deterministic and does not claim functional verification", () => {
  assert.deepEqual(inspectApiSurface(), audit);
  assert.match(audit.scope, /no execution/);
  assert.match(audit.inputDigest, /^[a-f0-9]{64}$/);
});
test("client reference ordering does not depend on filesystem enumeration", () => {
  for (const route of audit.routes)
    assert.deepEqual(
      route.clientHooks,
      [...route.clientHooks].sort((a, b) =>
        a.source < b.source ? -1 : a.source > b.source ? 1 : a.line - b.line,
      ),
    );
});
function fixture(router, app = "export default function App() {}") {
  const directory = mkdtempSync(join(tmpdir(), "cofounder-api-audit-"));
  const base = join(directory, "apps/cofounder-discovery");
  mkdirSync(join(base, "server"), { recursive: true });
  mkdirSync(join(base, "client/src"), { recursive: true });
  writeFileSync(join(base, "server/routers.ts"), router);
  writeFileSync(
    join(base, "server/route-policy.ts"),
    "const SAFE_PREFIXES=['safe.'];export function isSafeOperation(name){return name==='exact.read'||SAFE_PREFIXES.some(p=>name.startsWith(p));}",
  );
  writeFileSync(join(base, "client/src/App.tsx"), app);
  return {
    directory,
    base,
    close: () => rmSync(directory, { recursive: true, force: true }),
  };
}
test("parser ignores fake endpoint strings/comments and follows inline nested routers", () => {
  const f = fixture(
    "// fake: publicProcedure.query(()=>1)\nconst sample='fake: router({})';export const appRouter=router({safe:router({read:publicProcedure.query(()=>1)}),legacy:publicProcedure.mutation(()=>2)});",
  );
  try {
    const r = inspectApiSurface(f.directory);
    assert.deepEqual(
      r.routes.map((x) => [x.operation, x.kind, x.defaultPolicyAdmitted]),
      [
        ["legacy", "mutation", false],
        ["safe.read", "query", true],
      ],
    );
  } finally {
    f.close();
  }
});
test("scanner refuses unsupported computed/spread router declarations rather than omitting them", () => {
  for (const body of [
    "{[dynamic]:publicProcedure.query(()=>1)}",
    "{...other}",
    "{bad:customProcedure.query(()=>1)}",
  ]) {
    const f = fixture(`export const appRouter=router(${body});`);
    try {
      assert.throws(() => inspectApiSurface(f.directory));
    } finally {
      f.close();
    }
  }
});
test("unresolved imports and unknown real client operations are explicit, not fake success", () => {
  const f = fixture(
    "export const appRouter=router({safe:router({read:publicProcedure.query(()=>1)})});",
    "trpc.safe.missing.useQuery();",
  );
  try {
    assert.equal(
      inspectApiSurface(f.directory).unknownClientHooks[0].operation,
      "safe.missing",
    );
    writeFileSync(join(f.base, "client/src/App.tsx"), "import './missing';");
    assert.throws(
      () => inspectApiSurface(f.directory),
      /Unresolved local import/,
    );
  } finally {
    f.close();
  }
});
