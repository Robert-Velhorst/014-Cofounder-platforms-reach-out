# Local publication and evidence audit — October 24, 2026

This is a public-safe preservation checkpoint, not certification that every local
file has been published or removed. Raw private archives, credentials, database
contents, machine-specific path inventories and personal data are not attached.

## Exact candidate and GitHub evidence

The inspected [PR #127](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/127)
head was `3c69446d4cd34c35c4d7e11b3dfa8025feab1efb`, independently read from local
Git, the remote branch and PR metadata. The working tree was clean before this
documentation update. Main remained `9e15816b2f34b06e69635ea475f2aa55f03c02d2`.

- [CI run 40029010718](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40029010718): successful `verify` and `container-smoke` jobs.
- [CodeQL run 40029006585](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40029006585): successful JavaScript/TypeScript and Actions analyses. Workflow success does not itself establish zero findings or closure of main alerts.

The inspected CI step results include successful dependency advisory checks,
type checking, release/requirements/API/UI contracts, the actual synthetic Docker
context privacy check, application unit tests and build, database migration and
integration tests, readiness, fresh database-role boundaries, backup/recovery,
startup and authentication admission, the complete synthetic customer workload,
actual HTTPS/session checks, and the complete synthetic browser journey. The
browser screenshot-retention step also succeeded. This audit did not visually
review those screenshots or independently inspect every assertion in those
jobs. It does not claim real-user, provider, production-host or operator acceptance.

These results belong to the exact source head above, not automatically to later
documentation or code commits. Fresh checks must be read for any later head.
The former Antler date failure was corrected from October 2 to October 23 in its
test assertion; no catalogue permission or production data was changed by that fix.
No local Docker build was performed for this follow-up.

### Follow-up documentation head: advisory gate failed

The documentation-only head `4c72d7b625e849fb7c8b8f73ac6e5f3eade77e18` was pushed
and read back from PR #127. Its
[CI run 40035740275](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40035740275)
failed at `Check production and development dependency advisories`.
`pnpm audit --audit-level moderate` reported one high-severity `body-parser`
finding, [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828),
through the Express dependency paths. It exited with code 1. This was not a
README assertion failure; the later verify steps did not run. Container smoke
and [CodeQL run 40035737235](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40035737235)
passed. No dependency change, audit suppression, local rebuild or merge was made
as part of recording this result. The previous source-head pass must not be
presented as current dependency-security clearance.

## Recovered container source comparison

Six previously preserved source copies were compared byte-for-byte against the
published candidate. All six match its tracked source: three copies of the
monitor, its test, the synthetic write-load script and its corresponding test.
They require no duplicate code port.

| Published source | SHA-256 of matching bytes |
| --- | --- |
| `scripts/production-monitor.mjs` | `f6299d77d53f2e954c2ed65ee361602317ad0ca7931a532b0af5e235f647f604` |
| `scripts/production-monitor.test.mjs` | `a3d37586e842ff4e52914efe9f54ac74873828071b9ac3c26681ae1c09367799` |
| `apps/cofounder-discovery/scripts/synthetic-workspace-write-load.ts` | `b9c223890331e473330a527a226e569e9a618f3fe29e992c1506063d26b6d858` |
| `apps/cofounder-discovery/server/synthetic-workspace-load.test.ts` | `e9382bda1d5e17c20059b5a9f0381cf025dc07c2c04b7f849baa010462bcd518` |

Compiled bundles and generated production dependency manifests were not treated
as new source merely because their bytes differ between builds. Their complete
disposition, along with other archives, still requires a separate preservation
review; this six-copy comparison does not cover all local artifacts.

## Historical Git recovery

The inspected older source checkpoint contains 736 manifest entries. This audit
has not yet proved that every snapshot entry or uncommitted patch is represented
remotely; its local copy must not be deleted on the strength of this section alone.

Of its four distinct bundled Git heads, these are ancestors of the inspected
PR #127 head:

- `2400c98cd47d7495e702136f9080124e8cdb8678`;
- `861f67eda01f94667f75ea6fa9c9858f498a256b`;
- `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.

The fourth, `1d0ff22b6ba4aa20613c25204c9c4101a5875872`, is not an ancestor of that
candidate. Its six divergent historical commits remain preserved by the remotely
verified annotated tag
`archive/consolidation-20261018/feature/project-based-messaging`, whose peeled
target is exactly that commit. Remote tag preservation is not a claim that the
legacy implementation was integrated into the current application.

## Local search and cleanup boundaries

A completed filesystem-name/metadata inventory started at both local drives and
exhausted its directory queue: 8,451,261 files and 1,193,872 directories. It recorded
903 co-founder name/generated-path matches, skipped 97,206 reparse points, and
encountered 121 access-denied and 301 disappeared/unavailable directories. Relevant
candidate contents were inspected separately. This is not a content search of
every file, an archive-by-archive audit, or proof that no local data remains.

Verified cleanup removed an obsolete dependency store of 34,807 files and
477,712,815 logical bytes while retaining and hash-checking surrounding source,
Git files and the separate test cache. A standalone historical desktop bundle
was compressed from 47,902,508 to 18,132,788 bytes; every archived entry matched
the original SHA-256 before the expanded copy was removed. Its recovery archive
still exists locally and has not been published. Combined logical file-size
reduction was 507,482,535 bytes, approximately 484 MiB. Physical space reclaimed
cannot be inferred from that figure amid hard links and concurrent disk activity.

Source repositories, backups, private data, database volumes, secrets, recovery
checkpoints and protected cleanup targets were not removed by this audit.
Other local dependency folders disappeared during concurrent activity and are
not counted as removals by this audit. No Docker mutations occurred in this cleanup.

## Still required before claiming complete local removal

1. Resolve whether the separate Changepreneurship project is also in scope.
2. Choose approved private preservation or explicit erasure for material that
   cannot safely be published in this public repository.
3. Compare every relevant remaining snapshot, local modification, archive and
   Git ref; port unique useful source or preserve approved historical material.
4. Verify remote preservation of each item before removing its local copies.
5. Separately review databases, Docker consumers/volumes, application state and
   embedded records in shared stores; never delete an entire shared store to
   remove one project's data.
6. Repeat the local audit after deletion, recording inaccessible locations and
   any remaining exceptions. Until then, the all-local-data-removal goal is open.

Passing CI and publishing this document do not complete those steps, approve a
public deployment, authorize purchases or messages, or complete the original
product's 116 phases.
