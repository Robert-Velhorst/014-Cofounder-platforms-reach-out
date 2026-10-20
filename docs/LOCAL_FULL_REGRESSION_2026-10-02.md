# Current local regression acceptance: October 2 2026

Status: all listed local gates passed. Public-beta release acceptance remains open.

## Verified outcomes

| Gate                                  | Result                                         | Observed duration                             |
| ------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| Root operator suites                  | 119 tests passed, no skips                     | 6.84 seconds                                  |
| Full application unit suites          | 706 tests across 71 files passed, no skips     | 104.79 seconds                                |
| Full database integration suites      | 712 tests across 42 files passed, no skips     | 267.32 seconds                                |
| MySQL readiness rehearsal             | One test passed, covering six readiness checks | 37.52 seconds                                 |
| Encrypted database recovery rehearsal | One full-schema backup/restore test passed     | 37.99 seconds                                 |
| Application type check                | Passed                                         | Not recorded                                  |
| Application production build          | Passed                                         | Vite stage 4.24 seconds; not total build time |

These are terminal successful results, not observations of still-running jobs.
The full suites cover the current private presets, cookie transport, server-owned
request correlation, safe diagnostic command and 48-record platform catalogue.
Earlier receipts in the delivery ledger remain historical; they are not additional
current test runs. The six readiness checks are cases inside one test, not six
separately counted Node tests.

## Environment and identity

Observed branch: `agent/public-saas-beta`; HEAD:
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; working tree dirty.
Tests include uncommitted source: HEAD alone does not identify what was tested.

Database integration used current server/shared/migration/compiled application
files mounted read-only into the existing dependency image
`sha256:0e2057419b80c6417c3a13ee707e76ab5b62af003629fddae372507e16a87a2e`.
The owned MySQL 8.4 fixture used tmpfs and no published ports. Current migrations,
through migration 0038, applied successfully before the full database run.
The recovery rehearsal used this same dependency image with current compiled
migration files and isolated, network-disabled source/target MySQL fixtures.
MySQL image observed locally:
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.

The build was rerun after the database suite. Read-only release inventory then
reported 513 selected files, 10,304,975 bytes, and the same selected-scope digest:
`639759218b642ebf51e4795b67dd420c92c43f616bf7dacf44bd532ce6227af8`.
Declared package versions remain workspace 2.0.0/application 1.0.0.
See [scope and exclusions](RELEASE_INVENTORY.md): root operator sources, docs,
environment files, dependencies, container layers and hosted/provider state are
not covered by this digest. It is not atomic or causal build/test attestation.
The inventory's three provenance/test/production acceptance flags remain false;
this separate manually recorded test receipt does not change those CLI flags.

## Recovery and cleanup

Readiness exercised authenticated probes, wrong credentials, missing schema,
socket-only startup and the old probe's false-positive cases. Recovery exercised
encrypted backup verification, tamper refusal, target authority/isolation,
full-schema migration/index/data restoration and refusal of unsafe/nonempty
restore targets. The Windows PowerShell backup wrapper was exercised locally.
No real customer backup, remote backup store, provider or inbox was used.

After the full suite, aggregate counts were zero for users, audit events, account
sessions, account mail jobs, prospects, outreach records and workspace presets.
This is a seven-table fixture check, not proof that every database table is empty;
migration history and shared control rows may remain. The exact owned fixture was
revalidated and stopped with exit code 0, discarding its temporary tmpfs data.
Both new readiness fixtures and both new recovery fixtures were observed stopped
with exit code 0. Recovery's temporary synthetic keys/backup files were removed by
the test's cleanup. Older stopped fixtures and unrelated services were untouched.

## Remaining launch gates

This is current local regression evidence, not a freshly built immutable Docker
release qualified end-to-end. Hosted CI, signed/approved release provenance,
registry/deployment, real TLS/proxy/cookie topology, real email/provider and
customer/operator acceptance remain unverified. It is not a new browser run.
Worldwide platform completeness and actual integration permissions remain open.
The original matrix remains 113 Partial/three Missing/zero Implemented phases.

Robert's €100/month initial ceiling remains planning-only: €80 recurring
allocation plus €20 reserve. Approved real prices, enforcement and purchases are
not established here. No commit, push, merge, publication, deployment, account
action, real sending, purchase or permission change occurred in this increment.
