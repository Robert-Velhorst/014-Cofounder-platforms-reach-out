# Fresh local container qualification: October 2 2026

Status: dated earlier-source packaged runtime and full database regression passed
locally. Later notification/tunnel repairs require renewed qualification. The
[new Node 22 packaging checkpoint](OWNER_SAFETY_NODE22_PACKAGING_2026-10-02.md)
covers fresh builds and bounded probes, not fresh database or hosted acceptance.
Neither receipt establishes public-beta launch approval or a published release.

## Exact local artifacts

| Artifact               | Docker-observed immutable identifier                                      | Size              |
| ---------------------- | ------------------------------------------------------------------------- | ----------------- |
| Runtime                | `sha256:f1b6ebc2a59392a4e8039c708ab43d99af1d44dc59b7339851e52fc2eb3cc4a1` | 223,440,296 bytes |
| Integration test image | `sha256:0c7281188daaa28adccc67a08d0488ce42e7602d2bfa842d9e5d87d9a1d47bb1` | 280,187,824 bytes |

Local tags: cofounder-local-qualified-runtime-20261002 and
cofounder-local-qualified-tests-20261002. Tests used the observed identifiers,
not mutable tags. Neither image was uploaded. Local Docker identifiers do not
establish registry availability, signatures or committed-source/hosted-CI provenance.

Both were built from the current dirty checkout through the actual Dockerfile,
using the frozen workspace lockfile and pinned Node base:
`node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`.
Dependency installation downloaded the locked package manager/packages; this was
not a fully offline build. Production pruning used the offline dependency store.
No dependency versions were changed.

Observed HEAD: `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`,
branch agent/public-saas-beta, working tree dirty. HEAD alone does not identify
the tested uncommitted contents. Selected local source/artifact inventory remained
513 files with digest
`639759218b642ebf51e4795b67dd420c92c43f616bf7dacf44bd532ce6227af8`.
That [inventory's exclusions](RELEASE_INVENTORY.md) and three false acceptance
flags remain applicable; it is not complete causal build/test attestation.

## Packaged content comparison

Recursive hashes of every regular file in dist and drizzle matched exactly across
the two new images: 116 files, 6,799,156 bytes. Comparison used sorted
[path, byte length, SHA-256] entries and SHA-256 of their JSON serialization:
`8fc171459f2f77d4ce90ae276b0c416240122447098fa34710737c2b344df14a`.

All same-named local dist/drizzle files also matched. The local build folder has
two additional older, non-entrypoint files, dist/scripts/migrate.js and
dist/server/_core/index.js, which are absent from both fresh images because the
build context excludes local dist. They were preserved, not silently deleted or
treated as packaged artifacts. This comparison covers build/migration files,
not dependency contents or all image layers; production dependencies are pruned
while the test image retains test tools.

## Actual acceptance

- Runtime build passed type checking, all 706 unit tests across 71 files without
  skips (105.55 seconds), application compilation and production pruning.
- Packaged integration image ran its actual default migration/test command against
  an isolated synthetic MySQL database with no host application source, dist or
  migration mounts. Corrected full run: 712 tests across 42 files passed, no skips,
  in 246.31 seconds, terminal exit 0.
- The first packaged run failed because the runner supplied a synthetic root
  password that did not match the existing fixture. It reported 678 passed and
  34 skipped after the migration-suite setup error; it is not acceptance evidence.
  Only the runner setting changed, not either image or the database password.
  The complete command was rerun, not just the failed group.
- The actual pruned runtime used its packaged migration/startup command and
  mounted synthetic database/session secret files against a separate isolated
  database. Only secrets and the read-only QA smoke script were mounted.
  Smoke passed database readiness, compiled assets/headers, API error/body/origin
  boundaries, protected catalogue/progress/export routes, disabled legacy/provider
  routes and unauthenticated refusal of both private preset endpoints.
  Migration 0038 and the required operator bundles were present; application
  source, development tooling and .env paths were absent.
- Observed runtime restrictions: user 1000:1000, read-only root, dropped capabilities,
  no-new-privileges, one CPU, 512 MiB memory and memory-swap, 320 MiB old-space
  setting, 256 PIDs, bounded temporary mount and no published ports. This was
  isolated loopback HTTP, not a hosted TLS/proxy path or complete production
  Compose exercise.
- Shutdown emitted started/completed events, exited 0 and was not OOM-killed.
- Nineteen deployment-model/release-test contract tests passed. Production
  dependency advisory lookup reported zero known vulnerabilities across 549
  dependencies at this check; this is not an OS/base-image scan or certification.

The integration runner's two CPU/two GiB limits are test resources, not measured
production customer capacity. No real email/provider request, private customer
account or browser journey was used. The earlier connected browser acceptance
receipts remain separately dated, not fresh-image browser qualification.

## Cleanup and remaining gates

The runtime database and full-suite database each had zero aggregate records in
seven checked customer-data tables: users, audit events, account sessions, account
mail jobs, prospects, outreach records and workspace presets. This does not assert
that every table was empty; migration/shared control rows can remain.
Both owned tmpfs databases were stopped after exact-identity/isolation inspection,
discarding only their synthetic temporary data. Runtime stopped cleanly; no live
test handle remains. Images and older stopped containers were preserved.

The deployment-patterns skill guided separation of build, artifact comparison,
packaged tests and bounded runtime acceptance. No commit, push, merge, registry
upload, publication, deployment, purchase, permission change or real sending
occurred. The €100/month ceiling is planning-only, not a provider bill or purchase
approval.

This supersedes the older [local candidate](LOCAL_RELEASE_CANDIDATE_2026-10-02.md)
only for the current checks recorded here. The full goal remains incomplete:
approved committed-source/version/release provenance, hosted CI/branch protections,
image security review, controller/support/privacy/retention/licensing decisions,
real hosting/TLS/private database/remote recovery/alerts, live mail/provider rights,
worldwide coverage and customer/operator pilot remain open. The original matrix
still has 113 Partial/three Missing/zero Implemented phases.
