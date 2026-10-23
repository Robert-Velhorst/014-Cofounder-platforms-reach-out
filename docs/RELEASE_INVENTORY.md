# Local release inventory

`pnpm release:inventory` prints a read-only JSON inventory of selected build inputs,
application sources/migrations and local compiled output. It never builds, installs,
tests, queries providers, writes a manifest, uploads, tags or publishes. Run after
the intended build; incomplete required artifacts fail with a fixed safe error.

The checkout HEAD and a dirty boolean accompany separately declared workspace and
application versions. The output includes repository-relative paths, byte lengths
and SHA-256 hashes; it excludes absolute host paths and remote URLs. The inventory
digest hashes JSON.stringify of the path-sorted inventory. No observation timestamp
is inserted, so identical contents yield identical digests.

## Included and excluded scope

Included fixed inputs: root package/lock/workspace manifests, .npmrc, .gitattributes, Dockerfile,
.dockerignore, application package/TypeScript/Vite configuration. Application
client/src, server, shared, scripts and drizzle directories include regular
TS/TSX/JS/MJS/CSS/HTML/JSON/SQL files. The local dist directory includes non-hidden
regular artifacts, including assets beyond the seven required entry files.

Other hidden entries, node_modules, coverage, logs, tmp/temp, environment files,
root operator source/docs, host configuration and registry/container layers are
outside this scope. The root .npmrc is now a required hashed input because Docker
copies it before dependency installation; missing/symlinked configuration fails.
The checkout byte policy in .gitattributes is also required and hashed. Audited
TypeScript is checked out as LF on Windows and Linux so the original exact-byte
API/UI snapshots agree without normalizing or weakening their digest checks.
Only its byte length and hash are reported, never its contents or configuration
values. User/global package-manager configuration and environment are not covered;
this is still **not a complete build-input attestation**. It is not a secret scanner:
misplaced secrets in ordinary source or compiled bundles are not detected. Hashes
and filenames can still reveal sensitive structure; review output before sharing.

Symlinks are rejected; selected file resolution must remain within the checkout.
The walker limits files and directories to 4096 each, each file to 40 MiB and total
read file content to 256 MiB. Local filesystem ownership remains a prerequisite;
this is not a hardened reader for a hostile concurrently changing filesystem.
Stop edits/builds during collection. It cannot prove an atomic whole-tree snapshot.

## Honest release evidence

Every report sets buildProvenanceVerified, testAcceptanceVerified and
productionAcceptanceProven to false. A hash identifies contents; it does not prove
which source caused a build, which artifact a test exercised, or that CI, signatures,
registry identity, providers or hosting were accepted. Changed source/build hashes
invalidate old receipts as current acceptance evidence. Preserve dated receipts;
do not silently rewrite their provenance or mark new contents qualified.

Before an actual release, decide the package/version/tag policy, review the
[unreleased change summary](../CHANGELOG.md), freeze exact inputs, build/test the
immutable artifact and bind the resulting receipts to its digest and committed
source. Approved publication, privacy, provider and hosted gates remain mandatory.
Do not use a mutable local Docker tag or this JSON alone to approve deployment.

`pnpm test:release-inventory` covers deterministic output, source/artifact changes,
excluded private fixtures, incomplete builds, symlink rejection, version/identity
validation and safe argument/failure responses. Root tests and CI include it;
configured CI is not a completed hosted run.

## Compare a saved observation with current files

From the repository root, use the full JSON output of an earlier inventory:

```sh
node scripts/release-inventory.mjs --compare <saved-inventory.json>
```

The package equivalent is `pnpm release:inventory --compare <saved-inventory.json>`.
This command reads the baseline and current selected files only. It does not save
or overwrite a manifest, rebuild, run tests, query providers or change deployment.
Pause edits/builds while collecting and comparing; filesystem ownership remains a
prerequisite, not an atomic snapshot or hostile-filesystem defence.

Exit **0** means `same_observed_inventory`, not a qualified release. Exit **1**
with `inventory_changed` means requalify the changed artifact; the report counts
added/removed/modified paths and changes by source/build-input/built-artifact role.
It emits hashes and fixed counts, not baseline filenames, contents or references.
Malformed/unreadable/inconsistent inventories also exit1 with a fixed error and
no underlying filesystem/JSON exception. Check the status, not only the exit code.

Baseline input is bounded to2MiB plus one detection byte, strict UTF8 and a regular
non-symlink file. Its v1 format/scope, nonempty sorted unique path records, exact
row fields, roles, safe relative path syntax, byte/hash limits and inventory digest
are validated. At most4096records,40MiB per recorded file and256MiB total are
accepted. Native-language path names are allowed. Baseline paths are map keys,
never filesystem targets. This parser does not authenticate the baseline: anyone
can create a new manifest and recompute its digest. Metadata outside inventory
is not compared, including checkoutHEAD/dirty state, version labels and claimed
acceptance flags. Package file contents themselves remain within the inventory.

Every comparison keeps the three provenance/acceptance flags false, even when a
supplied report claims otherwise. A source-only catalogue edit is detected without
a rebuild, but the tool cannot prove source caused output. Root operator scripts,
docs and external/runtime/container state remain excluded; therefore this new
comparison tool does not alter the selected application's digest. Bind operator
and acceptance harness bytes separately when producing real release evidence.

Local tests include the comparison handler in a real Node child process against
synthetic files, matching and modified baselines, catalogue-only invalidation,
changes by role, malformed and
tampered records, native names, bounded invalidUTF8 reads and fixed failure output.
Windows tests exercise directory-junction refusal; file-symlink creation requires
privileges unavailable on this host. The POSIX file-symlink branch is not claimed
verified by a Windows pass. No remote CI/provider/deployment acceptance inferred.
Synthetic Git identity is injected only in the test handler: ordinary CLI use
still inspects the real checkout. Tests do not need an existing application build
and therefore can run before the build step in CI.

## Dated local observation — 2026-10-02

The real CLI returned 513 selected files totaling 10,304,975 bytes. Inventory
digest: `639759218b642ebf51e4795b67dd420c92c43f616bf7dacf44bd532ce6227af8`.
HEAD was `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, with dirty checkout true.
Declared versions were workspace 2.0.0 and application 1.0.0. All three provenance,
test-acceptance and public-acceptance flags remained false. This observed digest
is invalid as an identity for later changed contents; rerun rather than assuming
this receipt remains current. Root docs/operator sources are excluded as above.
