# Development dependency advisory correction and package qualification

October 2, 2026. This is a bounded local dependency and compatibility checkpoint,
not a security certification, hosted CI result or production release. Existing
dirty work was preserved; original manifests and lockfile were copied into the
external receipt folder before modification. No commit, push, merge, deployment,
provider action, real message or spending occurred.

## What changed and why

The initial production-only registry audit passed: zero advisories, 549 reported
dependency entries. The full workspace audit exited 1 with seven advisories and
eight affected-version occurrences: six moderate, one high and one critical.
They came from development/test dependency paths, not the pruned runtime:

- Vitest 2.1.9 included the affected Vitest/mocker versions and Vite 5.4.21,
  with esbuild 0.21.5. Vitest is now pinned to **4.1.11**; its mocker is 4.1.11
  and it uses the already locked Vite 7.3.6. Old Vite/vite-node/esbuild copies
  disappear from the lockfile.
- Drizzle Kit 0.31.10 included `@esbuild-kit/core-utils` 3.3.2 with esbuild
  0.18.20. The narrow root override `@esbuild-kit/core-utils>esbuild: 0.25.12`
  replaces only that dependency. The installed core-utils code uses esbuild's
  `transform`, `transformSync` and version, not its development server. The
  deprecated loader remains; replacing the entire migration tool is separate work.
- CI now runs `pnpm audit --audit-level moderate` after frozen installation and
  before application tests, in addition to its unchanged production/high gate.
  A local contract test rejects a production-only substitution, weaker high-only
  threshold, `|| true`, conditional execution or ignored failures. This is source
  verification, not evidence of a successful GitHub Actions run.

The primary advisories were read directly. Vitest's critical advisory concerns
exposed UI/API servers and certain Windows UI/Browser configurations, not an
ordinary one-shot Node test command. The later mocker advisory requires exposed
mocking plugins/HMR handling; its patch floor is 4.1.11. The esbuild advisory
concerns development-server CORS. No exploit was performed and no deployed
application compromise is inferred from these findings.
[Vitest critical advisory](https://github.com/advisories/GHSA-5xrq-8626-4rwp),
[Vitest/mocker advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9),
[esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

Both manifest comparisons against the pre-change copies showed exactly these two
dependency edits; scripts, existing overrides, database test inventory, timeouts
and exclusions were not weakened. Lockfile importer changes were confined to
Vitest, plus the narrow override and corresponding development dependency graph.

## Fresh checks

| Check                                      | Actual result                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Full workspace registry audit after change | Exit 0, zero advisories, 778 reported entries                                                                                                   |
| Production-only audit after change         | Exit 0, zero advisories, 549 reported entries                                                                                                   |
| Exact new CI audit command, run locally    | Exit 0                                                                                                                                          |
| Windows host typecheck                     | Exit 0                                                                                                                                          |
| Windows host unit suite                    | 987 cases / 97 files; exit 0; 145.65s                                                                                                           |
| Frozen Node 22 build typecheck/unit suite  | 987 cases / 97 files; build exit 0; unit duration 126.69s                                                                                       |
| Node 22 integration-test package build     | Exit 0                                                                                                                                          |
| Mandatory packaged MySQL suite             | Exit 0; 724 cases / 43 files; no skips; 291.00s, helper elapsed 297.475s                                                                        |
| Root operator suite after CI regression    | 170 cases; zero failures/skips; 5,460.1992ms                                                                                                    |
| Schema generation compatibility            | Host and Node 22 passed; actual 43-table schema and TypeScript configuration loaded; scratch output only, no database connection                |
| Runtime/test compiled migration parity     | 117 files; 6,992,219 bytes; equal digest below                                                                                                  |
| Pruned runtime                             | Node 22.23.3, UID 1000; sources and Vite/Vitest/tsx/TypeScript absent                                                                           |
| Compiled server probes                     | Private invalid-config and occupied-port refusal/no fallback, actual liveness and clean TERM shutdown passed                                    |
| Actual default startup                     | Migrations, health/readiness 200 and clean drain; locked-migration TERM/INT cancellation passed within unchanged three-second combined deadline |

Registry totals are tool-reported graph counts, not physical runtime package
counts. The full audit includes development dependencies even though its JSON
metadata reports `devDependencies: 0`. A clear audit means no registry-known
advisories returned at that time; it does not establish absence of vulnerabilities,
complete security review, policy compliance or future advisory status.

Actual installed images, independently resolved with Docker inspection:

- Runtime: `sha256:a80c8dd3fa31a71a7398a561072065257d823ca9ab8721c0eccef334a5b0d990`.
- Test: `sha256:c7dedb044844a2c06cbb740947dbd4766cbb5c39b3ebc51393970be9f8e39315`.
- MySQL: `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.

Compiled `dist`/`drizzle` digest:
`8ffd506d17f7571763fb65a27cb934c1899a65a9e0805b7d55b73e808b334aaa`.
The fresh runtime's 546 observed regular package roots and 538 root notice files
match the preceding inventory record-for-record, digest
`f8014b77878c15928a40c53f5bc2f69cae61f58d5edbf99a4ec58d02fb1be512`.
This is not a complete SBOM or licence approval; it does not overwrite older
image provenance or close the missing-notice/repository/imported-rights decisions
in [the third-party review](THIRD_PARTY_RELEASE_REVIEW_2026-10-02.md).

The actual default supervisor cancelled TERM in 767ms and INT in 631ms, retaining
the observer's lock, zero DDL and no server startup during cancellation. The
complete fixture case took 33,163.6496ms. It then applied migrations and verified
real HTTP readiness/liveness and clean shutdown. Owned fixtures use no public
ports or replacement application sources; read-only observer/helper mounts are
not application replacement. Startup fixtures were bounded at one CPU/1GiB;
database-suite bounds remain two CPU/2GiB. These are not capacity results.

All ten retained owned fixtures were independently checked stopped, exit 0, no
OOM and no public port bindings:

- Database suite: DB `4d4b7026d1fded72e25dcd49e694f0c20e762143770b54fe9023637d3b5054cd`,
  test `b70b7ec2fe5c1de9e476bad553c6c30135b72188fecaee04b78ec3e456a117cc`.
- Parity: runtime `d26551b7d20eabbef6f61526c84386e1097e50594a3ff59b1aa38a97b2565718`,
  test `ed60c7894a19ce7a7a462d372ade9bd899b1738ca847a92133bd465bcb820426`.
- Compiled startup: `a4af84efc1870e13698ebf80e0c60d0eee775af7250a6ba8eed3f2db8e606df9`.
- Default startup: DB `99261e2e0904902d18e07369b1b9f8f9503325b75d32c2fb08f6df85b2bd4dd1`,
  holder `a4a215ca1e789da474546081a639d9c31318ce47b531dfba87a11107cb553044`,
  TERM `12eb5121cb596c5a99d0aa6008927ac90048704f2a22792e34d212f680ab4c59`,
  INT `c11a0bbad7f2071856c060f34324a12fd8d4ff336bef9911330df3bb91940844`,
  active `a729e3576073965b1ee34cd68435af892d14378c479c86cebe124e848c0cabf0`.

Separate network-disabled, read-only disposable inventory/schema probes completed
successfully and were automatically removed. The generated host SQL is a scratch
compatibility artifact, not a new repository migration and was not applied.

## Receipts and limits

Retained local receipt folder: `outputs/dependency-review-20261002-r1/` alongside
the checkout, not part of the published application. It contains original
manifests/lockfile, audits, install/typecheck/units/builds, schema scratch generation,
inventory observations, parity/startup probes, database acceptance and operator
results. Prior advisory/failure observations are retained, not overwritten.

Key SHA-256 digests:

- Root manifest: `550863ef3c88dc34555f2c4fcd67dbc390a8b8681f492ab11a74f75f4b052997`.
- App manifest: `b0a25f0838bb3de05c6f70df573e38e0ac62c46188a3cccbc6e64812434d5961`.
- Lockfile: `ebe71c049b7f32776d8a25abfaa10d996c0be9cac897f73de20f3a85aee80020`.
- Initial full audit: `b94fc947132daee0fef73b8a3d70342e7293213b45e71c0a5985ed111a3fdb45`.
- Full audit after: `4d7c6bf627d4de28fd730d68bca2228a34c524033122b3a07d2bb6126b6c9023`.
- Production audit after: `b6d87389a58a7c41f9353378ee33e5475f1eb9675d4d85df7b3d84fea197e3f6`.
- Fresh runtime inventory: `3f73acab6fcd2adb4e7f5405c920389ecc6e74acf6971c584f2cb93992f2174a`.

Matching compiled files and observed runtime dependencies do not transfer old
browser/recovery/load receipts to the new image identities. Fresh connected checks
and hosted/operator/provider acceptance remain open. The EUR 100 ceiling is
planning only; no configured provider cap or tax-inclusive invoice is proven.
Worldwide source/member-access completeness and all 116 original phase acceptance
remain Partial. This correction closes the observed development dependency
advisories and bounded compatibility checks, not the full product goal.
