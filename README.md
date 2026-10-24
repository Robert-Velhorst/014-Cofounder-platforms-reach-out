# Historical co-founder import reference — 2026-10-24

This Git tag preserves eleven distinct source files recovered from the operator's
co-founder import archive before its authorized permanent local deletion. It is
an archival reference, **not the current application, a deployable package or a
production integration**. Nothing in this tree is imported by the active app.

Useful reference areas are template personalization, profile completeness and
compatibility scoring, feedback-weighted matching, duplicate normalization,
analytics/event aggregation, campaign design, AI draft/conversation design,
synthetic cost experiments and an experimental contribution/equity calculator.
These are retained as historical implementation material, not validated features.

The original source is preserved byte-for-byte. Its optimistic comments and names
are historical claims, not evidence: ML accuracy/probability claims are unproven;
benchmarks contain simulated workloads; provider APIs may be obsolete; profile
endpoints lack the current app's admission/privacy boundaries; campaign services
start background processing; analytics exports need injection/escaping review;
in-memory state and time/random identifiers are not production persistence or
security. The equity calculator is not legal, tax or financial advice.

Do not run these modules against real accounts, credentials, personal data or
external providers. Do not restore automated outreach/scraping or replace current
authentication, authorization or encryption with this historical implementation.
Any future port needs an isolated adaptation, tests and the current safety gates.

## Verification and provenance

`PRESERVATION_MANIFEST.json` records the original outer-archive SHA-256 and each
selected file's archive entry path, Git blob, SHA-256 and exact byte count. Repeated
copies in nested ZIPs were deduplicated by their Git blob. Selected bytes were
checked against the recursive inventory and scanned for private-key/token formats,
credential assignments, credential-bearing URLs and email literals. The only
selected email literals are `alice@example.com` and `bob@example.com` in the
equity calculator's explicit example block. No private `.env`, database export,
seeded contact data, credentials, binary, dependency tree or original prompt is
included. Pattern checks are not a complete security assessment.

All eleven files passed `node --check`; that is syntax validation only. No provider
calls, package installation, Docker build, server start or benchmark execution was
performed. No claim is made that these modules run with current dependencies.

## What was not carried forward

- Original imported-app revisions already replaced by the current TypeScript app;
  retaining their older UI/auth/storage paths would regress existing safeguards.
- Duplicate nested packages, generated Drizzle snapshots, lockfiles, vendor code,
  packaged executables and generated assets.
- Private environment files, database query output, seeds, original instructions
  and personal/runtime evidence.
- Speculative platform automation, mock integrations, unfinished mobile shells,
  unsupported auth/billing variants, and design prose masquerading as JavaScript.
  An XML `AccessDenied` response named `backend-integration.js` is not source code.

The archive tag is intentionally outside the active application's source tree.
It preserves selected reusable history without pretending that obsolete prototypes
are production-ready functionality.
