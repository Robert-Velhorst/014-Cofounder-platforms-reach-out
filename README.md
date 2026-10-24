# Reviewed orphan source variants — 2026-10-24

Five unreferenced TypeScript source blobs are preserved byte-for-byte here before
any future authorized local cleanup. This is an inert historical archive, not a
new feature, deployment, current source tree or production integration.

The files cover legacy outreach routing, platform automation/scraping, encryption
and the original port-safety regression tests. Current versions already exist at
the paths recorded in PRESERVATION_MANIFEST.json. The tests were initially
misidentified by content as engines.test.ts; comparison found the correct current
counterpart, port-safety.test.ts, with the same three checks and formatting changes.
No original surviving tree-path association exists for these five blobs; filenames
were assigned by content comparison. This is not recovery of original filenames.

The encryption variant predates the current readRuntimeSecret file-secret support.
Never replace the current implementation with these older helpers or enable
provider automation on the strength of this archive. Platform rights and live
provider acceptance are not established. No module was executed or installed.

All five files passed TypeScript stripping followed by JavaScript syntax checking
with the locally installed Node v25.2.1. This is not type checking or a test-suite
run. Private-key/provider-token/credential-URL/email/operator-literal checks found
no selected private material. One explicitly synthetic, non-production secret in
the test fixture was manually reviewed. Pattern checks are not a security audit.

The manifest records exact Git blobs, byte counts and SHA-256 values. The original
bytes are intentionally preserved rather than silently prettified or modernized.
Two other orphan tests contained unresolved merge-conflict markers and failed
syntax checking; four orphan documents also contained conflicts. Those snapshots
were not copied. A fifth document was a superseded README. The other 133 orphan
blobs matched the previously reviewed import inventory, whose selected reusable
references are separately preserved under archive/local-preservation-20261024/import-reference.

Local erasure is still blocked by the execution environment. This archive does not
claim that the local checkout, cache, bundle or private test secrets were removed.
