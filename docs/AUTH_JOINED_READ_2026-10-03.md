# Live joined account/session lookup — October 3, 2026

## Implemented; capacity effect still unproven

The preceding [full packaged workload](AUTH_QUERY_REUSE_PACKAGE_2026-10-03.md)
remained red at 150/s: 95 busy refusals and three actor-start drops. SQL-construction
reuse alone did not clear that gate. This increment addresses a different measured
piece of redundant work: two serial database reads for every SDK authentication.
It does not claim that those reads are the sole root cause or that capacity is fixed.

Ranked hypotheses before this change were: serial account/session round trips
amplify acquisition/protocol scheduling; driver/event-loop delays can persist even
with one read; transient arrivals can exceed retained admission limits despite
adequate mean throughput. A single live join tests the first opportunity without
changing limits. Previous shortened samples are not fully minimal and do not prove
which remaining inputs are necessary. The original full workload remains the
release-capacity signal; the fast regression below measures actual duplicate reads,
not normal offered-load capacity.

## Product path and safety boundary

`sdk.authenticateRequest` still parses and validates the signed session before
database work. It now calls `getUserForAccountSession(openId, tokenId)` instead of
separate `getUserByOpenId` and `isAccountSessionActive` reads. One SQL statement
selects the same full user projection and joins its durable session with all of:

- Signed account open ID equals the user's unique open ID.
- Session user ID equals that user's ID.
- Token digest matches the signed session ID.
- Server-side session expiry is greater than a newly bound server timestamp.
- Account deletion fence is null.

Every request executes this statement against live rows. No account fields,
session/permission results, cookies or credentials are cached. A WeakMap reuses
only the SQL/row-mapping description for each database instance; a replaced pool
constructs its own plan. Failed construction is retried, failed execution propagates,
and each cutoff uses the existing column encoder. The installed MySQL2 adapter
uses `client.query`; this is not server-side binary prepared-statement reuse.

The original standalone lookup functions remain available for their other callers.
Session creation/revocation, signing-key validation, joins, expiry semantics,
work tracking and configured resource/admission limits are unchanged. A missing
account/session match now uses the same generic forbidden-session message rather
than distinguishing an unknown user; infrastructure errors remain errors and the
retained context tests verify generic service refusal, not anonymous success.

## Actual red/green and correctness evidence

New regression uses actual SDK/JWT signing and verification, actual Drizzle SQL
compilation, placeholder binding and row mapping. Only network I/O is controlled.
Pre-change run: four cases, three failed/one passed (1.23 s), including exactly
80 database reads for 40 concurrent authentications versus the expected 40.
The invalid-token case already passed with zero database reads.

Six final cases cover one live joined statement per concurrent authentication,
all owner/digest/fence/expiry predicates and fresh bindings, changed/missing rows,
advanced cutoff, infrastructure failure/retry, invalid token before DB access,
replacement database and construction retry. Exactly one compilation and 40
live reads are required; row results are not shared between requests.

The first post-change focused run had one test assertion error: Drizzle wraps a
driver failure and retains it as `cause`, rather than repeating its message in the
top-level error. Corrected the assertion to inspect that actual cause; no product
change was needed. This failed receipt is retained, not counted as a product bug.
Final focused suite: 44 cases/six files passed, 7.13 s. Full host typecheck passed;
all 1,036 unit cases/102 files passed without skips (125.55 s).

Fresh repository integration-test package compiled successfully. Exact image:
`sha256:e2af4d27a04ef80a17b530a51250dd4fe6b1e40d4a90f6073268041ed5e7ecd8`.
Migrations and all 11 real MySQL session cases passed without skips (2.56 s;
attached process elapsed 6.94 s). New case combines a correctly signed foreign
open ID with another owner's session ID and requires refusal; its legitimate
owner still authenticates, including after pool replacement. It then expires the
server-side session while the signed JWT remains valid and requires refusal.
Retained cases check revocation, deletion fence, live account-field changes,
capacity limits, reconnect behavior and cold cross-owner session creation.

Owner `24eafda4`: both exact database/test fixtures independently inspected stopped
exit 0/no OOM, two CPUs/2 GiB/512 PIDs, no source mounts/public ports. DB is UID
999/read-only/network disabled; test joins only that owned database namespace.
The integration package has development tooling/build-stage user, not production
hardening. The app itself was not deployed and no real data/provider was involved.

## Inventory and evidence

The operator check correctly rejected stale UI-inventory source fingerprints.
Regenerated using the existing builder and independently compared structure:
all 151 source paths, 230 actions, 206 event attributes, 26 navigation elements
and five spread actions unchanged. Only SDK/session source hashes and aggregate
digest changed. New input digest:
`327a21b53465945f3d5a93bc17cd5e5e972d87d73a317c780e6861c426d06344`.

Evidence: task-workspace `outputs/auth-joined-read-20261003-r1` contains pre-change
red, initial/final focused, typecheck/unit, fresh package build/image, migration/
focused MySQL, independent fixture, failed stale-inventory and inventory-validation
logs plus source hashes. SDK hash:
`8ff43c58f40c282c13b14d5991a3c0b8ac9cae5bdbec1d3a037da62403474c61`;
session module hash:
`d2a0c07cd67975d5b1debc5b62a38e037c5df2ad407af0bd6b5e57bd5ef1ecf2`.

After inventory/documentation changes, all 171 operator cases passed without
skips (3,152.8303 ms; `operator-final.log`). Formatting and diff-whitespace checks
passed. Traceability validated all 116 original phases as Partial and
`completionProven:false`. HEAD remains
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.

## Next acceptance and limits

Fresh production-runtime build, full mandatory database gate, compiled-package
parity, maintained authentication-admission check and the original unchanged full
load are still required. Current-image browser/recovery/soak and all-UI/accessibility
qualification remain pending. Previous package results cannot qualify this changed
candidate. No capacity improvement or public-release approval is claimed.

All 116 original phases remain Partial; the worldwide/public-beta goal is not
complete. Live hosting/inbox/provider permissions, privacy/operator decisions,
remote recovery and worldwide completeness remain open. EUR 100/month is still
planning-only. No purchase, actual outreach, provider mutation, deployment,
publishing, commit, merge, push or permission change; unrelated dirty work preserved.
