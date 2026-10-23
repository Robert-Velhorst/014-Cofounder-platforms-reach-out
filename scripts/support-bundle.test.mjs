import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import {
  createSupportBundle,
  runSupportBundle,
  MAX_INPUT_BYTES,
} from "./support-bundle.mjs";

const input = () => ({
  version: 1,
  ownerAuthorized: true,
  area: "workspace",
  observations: [{ check: "preset_save", status: "conflict", requestId: null }],
});
const runtime = {
  versions: { node: "22.23.3" },
  platform: "win32",
  arch: "x64",
};
test("constructs a bounded, reviewable bundle with verifiable content digest", () => {
  const bundle = createSupportBundle(input(), runtime);
  const { integrity, ...payload } = bundle;
  assert.equal(
    integrity.payloadDigest,
    createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
  );
  assert.equal(bundle.sharing, "local_review_only_no_upload");
  assert.equal(bundle.observations.length, 1);
});
for (const key of [
  "email",
  "password",
  "token",
  "logs",
  "url",
  "path",
  "stack",
  "metadata",
  "accountId",
]) {
  test(`rejects ${key}, rather than attempting unreliable redaction`, () => {
    const value = input();
    value[key] = "PRIVATE_SENTINEL";
    assert.throws(
      () => createSupportBundle(value, runtime),
      /^Error: invalid_support_observations$/,
    );
    const nested = input();
    nested.observations[0][key] = "PRIVATE_SENTINEL";
    assert.throws(() => createSupportBundle(nested, runtime));
  });
}
test("rejects unsupported content, absent authorization, identifiers and unbounded rows", () => {
  const cases = [
    null,
    [],
    { ...input(), ownerAuthorized: false },
    { ...input(), area: "private-text" },
    { ...input(), observations: [] },
    { ...input(), observations: Array(21).fill(input().observations[0]) },
    {
      ...input(),
      observations: [
        { check: "preset_save", status: "private-text", requestId: null },
      ],
    },
    {
      ...input(),
      observations: [
        {
          check: "preset_save",
          status: "conflict",
          requestId: "private-address@example.invalid",
        },
      ],
    },
    {
      ...input(),
      observations: [{ check: "preset_save", status: "conflict" }],
    },
  ];
  for (const value of cases)
    assert.throws(() => createSupportBundle(value, runtime));
});
test("accepts only a UUIDv4 correlation identifier", () => {
  const value = input();
  value.observations[0].requestId = "e10f10c9-471e-4d88-b569-517ca558726a";
  assert.equal(
    createSupportBundle(value, runtime).observations[0].requestId,
    value.observations[0].requestId,
  );
});
test("runtime metadata is locally generated and constrained, not arbitrary strings", () => {
  for (const changed of [
    { ...runtime, platform: "private-host" },
    { ...runtime, arch: "private-text" },
    { ...runtime, versions: { node: "22.0.0-private" } },
  ])
    assert.throws(() => createSupportBundle(input(), changed));
});
test("help and missing authorization do not read input", async () => {
  let read = false;
  const source = {
    async *[Symbol.asyncIterator]() {
      read = true;
      throw new Error("private");
    },
  };
  for (const args of [
    [],
    ["--private-secret"],
    ["--confirm-owner-authorized", "extra"],
    ["--help"],
  ]) {
    let text = "";
    await runSupportBundle(args, source, {
      write: (value) => {
        text += value;
      },
    });
    assert.equal(read, false);
    assert.doesNotMatch(text, /private-secret/);
  }
});
test("rejects oversized or invalid UTF-8/JSON without reflecting payload", async () => {
  for (const bytes of [
    Buffer.alloc(MAX_INPUT_BYTES + 1, 65),
    Buffer.from([0xff]),
    Buffer.from("PRIVATE_SENTINEL"),
    Buffer.from(JSON.stringify({ ...input(), token: "PRIVATE_SENTINEL" })),
  ]) {
    let text = "";
    assert.equal(
      await runSupportBundle(
        ["--confirm-owner-authorized"],
        Readable.from([bytes]),
        {
          write: (value) => {
            text += value;
          },
        },
      ),
      1,
    );
    assert.equal(text, '{"ok":false,"error":"invalid_support_observations"}\n');
  }
});
test("real CLI consumes approved stdin and emits only the reviewable bundle", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("support-bundle.mjs", import.meta.url)),
      "--confirm-owner-authorized",
    ],
    {
      input: JSON.stringify(input()),
      encoding: "utf8",
      env: { ...process.env, SUPPORT_PRIVATE_SENTINEL: "DO_NOT_INCLUDE" },
      timeout: 5000,
    },
  );
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const bundle = JSON.parse(result.stdout);
  assert.equal(bundle.localGenerator.node, process.versions.node);
  assert.doesNotMatch(result.stdout, /DO_NOT_INCLUDE|SUPPORT_PRIVATE_SENTINEL/);
});

test("real CLI safely refuses invalid input, missing authority and excess bytes", () => {
  for (const [args, content, error] of [
    [[], JSON.stringify(input()), "owner_authorization_required"],
    [["--private-secret"], "PRIVATE_SENTINEL", "owner_authorization_required"],
    [
      ["--confirm-owner-authorized"],
      JSON.stringify({ ...input(), email: "PRIVATE_SENTINEL" }),
      "invalid_support_observations",
    ],
    [
      ["--confirm-owner-authorized"],
      "X".repeat(MAX_INPUT_BYTES + 1),
      "invalid_support_observations",
    ],
  ]) {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("support-bundle.mjs", import.meta.url)), ...args],
      {
        input: content,
        encoding: "utf8",
        timeout: 5000,
      },
    );
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.deepEqual(JSON.parse(result.stdout), { ok: false, error });
    assert.doesNotMatch(result.stdout, /PRIVATE_SENTINEL|private-secret/);
  }
});
