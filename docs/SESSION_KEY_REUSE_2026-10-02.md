# Bounded session-key reuse — October 2, 2026

## What changed and why

The actual session SDK supplied raw HMAC bytes to `jose` for every signing and
verification operation. The installed library imports those bytes into WebCrypto
on each operation. A regression test through the real SDK signing/authentication
path observed **41 imports** for one signing operation plus 40 concurrent
authentications. All 40 user lookups and durable-session checks also executed.
This is evidence of redundant key import, not proof that it caused the earlier
[scheduled-arrival load failures](SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md).

`server/_core/sdk.ts` now holds at most the current configured key-import promise.
Concurrent calls share the first import. The imported key is non-extractable,
HMAC/SHA-256, with signing/verification usages. When `getConfig()` returns a
different secret, the current entry is replaced; failed imports are discarded
so later calls can retry. An older failing promise cannot discard a newer entry.

This does **not** add live environment/file-secret reloading. The configuration
loader retains its existing startup cache; production secret rotation still
requires the established configuration/restart/operator procedure. Tests explicitly
reset configuration to exercise a changed-secret boundary, not claim live rotation.
No user, account, session or permission decision is cached. JWT algorithm/issuer/
audience/expiry/required-claim validation and every durable revocation/deletion-
fence lookup remain on their existing paths. Admission limits are unchanged.
Key material stays process-local; no persistent key cache, logs or provider calls.

## Regression evidence

The new test file exercises real JOSE/WebCrypto signing and verification.
Focused units replace unavailable database boundaries and inject key-import
failures only in the two designated failure/race cases; this is not SQL integration
proof. Before implementation: four cases ran, two failed, two passed (1.47 s).
Failures were 41 imports versus required 1 and 4 versus required 2 across configured
secret change. The failed receipt is retained, not overwritten.

After implementation, six new cases plus retained session/cookie/login cases
passed: **32 cases / four files**, 7.80 s. App typecheck also passed.
New cases cover bounded warm/cold concurrent import, non-extractability and key
algorithm/usages, old-token refusal after configured change, failed-import retry,
warm-key revoked-session refusal, and stale in-flight failure after a newer key.
The 40-request authentication case still requires 40 user and 40 durable-session
checks. No signing/verification result is mocked; database outcomes are controlled
unit fixtures, not live acceptance evidence.

## Package and original-workload verification

A fresh local runtime candidate was built successfully using the repository
Dockerfile: typecheck, **1,025 unit cases / 100 files without skips** (102.85 s),
application build, frozen dependency installation and pruned deployment passed.
Exact runtime image:
`sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`.
Default startup remains `node dist/start-runtime.js`, runtime user `node`;
packaged Node 22.23.3.
The first `--network=none` attempt failed fetching the package-manager runtime;
it is a build-environment failure, not an application test verdict. Its receipt
is preserved; a normal-network build is separate. No paid services or deployment.

Original full synthetic load helper/runner are retained byte-for-byte, including
all closed-loop read/write/race/isolation and independent 50/150/500-arrival tiers.
No CPU profiler, database tracing or production source replacement mount is used
in that acceptance run. Original thresholds/resources remain unchanged.
Real-workload results are separate from the focused/packaged units. The unchanged
full acceptance run finished **exit 1** because the 150/s all-success gate remains
failed. The optimization therefore removes measured import redundancy, but does
not prove higher capacity, resolve the root cause or qualify the public release.

| Scheduled rate | Offered / started | HTTP 200 / 503 | Client drops | Scheduled p95 / p99 (ms) | Verdict                  |
| -------------- | ----------------: | -------------: | -----------: | -----------------------: | ------------------------ |
| 50/s           |         500 / 500 |        500 / 0 |            0 |            35.52 / 68.07 | Pass                     |
| 150/s          |     1,500 / 1,500 |    1,375 / 125 |            0 |          419.00 / 512.96 | Fail                     |
| 500/s          |     5,000 / 3,917 |  1,418 / 2,499 |        1,083 |          390.67 / 763.42 | Controlled overload only |

The 500/s drops comprise 7 in-flight-capacity and 1,076 busy-actor drops, not
unobserved requests or successful capacity. No tier had late arrivals, transport
failures, correctness errors, malformed Retry-After headers or automatic retries.

Retained closed-loop checks also ran, not substituted for the failure:

- Read concurrency 5 and 20: 6,000 HTTP 200 each, successful p95/p99
  79.03/126.33 and 288.90/411.91 ms. Concurrency 100 controlled overload:
  1,007 HTTP 200 / 4,993 HTTP 503, not all-success capacity.
- Write concurrency 5 and 20: 6,000 requests each, 5,000 HTTP 200 and 1,000
  expected stale HTTP 409 each. Every tier independently verified 10,000 candidate
  rows and owner/action audit counts; 3,000 committed changes, 1,000 unchanged
  replays and 1,000 stale conflicts per tier. Successful p95/p99
  92.63/142.58 and 326.23/474.52 ms.
- 200 paired same-owner races (400 edit requests) verified independent sockets/
  actual wire overlap, 200 committed changes, 100 stale conflicts, 100 unchanged
  replays and 200 winning-request audit receipts.
- 400 wrong-owner mutations were denied; independent final queries retained
  10,000 candidate rows and 6,200 audit rows unchanged by those attempts.

Owner `5e65dcde`; independent inspection confirmed exact image/user/owner IDs,
all three fixtures stopped (app/database 0, runner 1), no OOM/public ports and
correct CPU/memory/read-only mount limits. App only mounted its two synthetic
credential files; no executable/probe replacements. Post-load health/memory
observations were skipped on the failed runner and are not inferred from older
passing fixtures. No user material deleted or unrelated services changed.

The candidate now has fresh full mandatory database and compiled-file parity
evidence, described below. A fresh 24-stage connected browser workflow also passed;
it is not every UI action or complete accessibility acceptance. Fresh isolated
encrypted recovery also passed, with the limits below. Hosted/provider/operator
acceptance remains open. Previous artifact
receipts retain their original immutable image scope and are not transferred to
this candidate. Further controlled capacity work must retain the unchanged
original thresholds.

## Fresh database acceptance and package parity

The repository's `integration-test` target was freshly built from the current
working tree; exact image
`sha256:e95d76a6c828fdf738a72913a385498f27bafdd46cc0a0b3991f667e0c414d8a`.
It ran migrations followed by the unmodified `test:integration` command with
`REQUIRE_DATABASE_TESTS=true`. **724 cases across 43 files passed, with no skips**,
300.41 seconds (owned attachment elapsed 306.976 seconds). This is local synthetic
database acceptance, not hosted or live-provider proof.

The nine session-security cases exercise the actual SDK with MySQL: retained
capacity, reconnect followed by cookie revocation, server-side expiry, stale
credentials and concurrent distinct-owner admission. Seven password-recovery cases
cover one-use concurrent redemption, existing-session invalidation, stale-login
races and other-owner isolation. The 32 account-work-fence cases cover reviewed
processing, durable-session refusal after fencing, token/queue/write boundaries
and rollback. These are retained tests, not six new SQL cache-specific cases;
the six key-import/race tests remain the separate unit evidence above. No new
claim of a directly instrumented warm-key SDK deletion race is made.

MySQL image
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`
ran as UID 999:999, read-only, with an isolated tmpfs database and `network=none`.
The test container shared only that private network namespace, with zero mounts
and no public ports. Both had two CPU/2-GiB limits, dropped capabilities,
no-new-privileges and 512-PID limits. The test container intentionally uses a
writable test layer/root for operator-permission cases; this is not the
production-hardening model. No provider accounts, real inboxes or user data used.

Separate non-root read-only network-disabled fixtures compared all `dist` and
`drizzle` files from the runtime and fresh test image: **117 files, 7,026,390 bytes**,
identical digest
`2d9c828105ed1afaf5d573c27223ee06d82b2068d253f2b655b88fd87db6e67e`.
Both used Node 22.23.3 and UID 1000. Selected app-source and development-tool paths
are absent from the runtime. Parity covers compiled application/migrations only,
not all dependencies, OS contents, an SBOM or vulnerability acceptance. Only the
read-only external inspection helper was mounted in these two parity fixtures.

Independent inspection confirmed all four exact database/parity fixtures stopped
exit 0, no OOM and no public ports. Database owner `b58bad13`, parity owner
`0b2fc269-df03-4a03-8b77-bb1777487331`; evidence in the same output directory:
`integration-build.log`, `database.log`, `parity.log`, copied helpers and
`database-parity-fixture-inspection.json`. Stopped fixtures retained; no user
material deleted. Neither these passes nor the earlier unit passes override the
unchanged failed 150/s full-load gate.

## Fresh connected browser workflow

The existing complete-workflow helpers were copied byte-for-byte to external
`outputs/session-key-reuse-browser-20261002-r1` and run against the exact candidate
using its default startup command, not a replacement application mount. All
**24 stages passed** through real HTTP/MySQL: login, catalogue, reviewed intake,
correction/unsaved-input preservation, assessment, original drafts, review/manual
preparation, synthetic completion recording, reminders/response/history,
archive/restore/opt-out, owner-reported progress, private account export,
revision/cancellation and CSV retry/refusal handling.

Browser plugin was absent; existing Playwright 1.62.1/Chromium 148.0.7778.0 used,
no dependencies installed. URL `http://localhost:13216` within isolated fixture;
1365×1000 desktop, 375×812 mobile plus selected 768×1024/1440×1000 checks.
Identity/nonblank/no-overlay and actual state interactions passed. Zero unexpected
console/page errors, RPC mocks, external requests or real sends; eight exact
expected refusal/network diagnostics and one deliberately lost real response.
The unchanged CSV retry preserved identical request bytes and one committed row.
There is one synthetic manual-completion record, not delivery/inbox verification.

Five selected screenshots were visually inspected: first desktop/mobile workspace,
mobile stored progress, desktop account export and mobile uncertain CSV result.
Lengthy guidance remains above most mobile workspace content; mixed Dutch/English
and vertical scrolling remain limitations. No frontend source changed, no claim
that all 230 inventoried actions/accessibility/browsers/devices are accepted.

Three exact owner-labelled fixtures (`7edbe3bc`) independently inspected stopped
exit 0/no OOM/no public ports. Non-root/read-only two-CPU/2-GiB fixtures; network-
disabled database with private namespace shared by app/QA. App/database mounts
zero; QA mounts only external output and two read-only existing local fonts.
No user data/providers/mail; synthetic manual preparation only. External `QA.md`,
`browser-run.log`, screenshots/helpers and `final-fixture-inspection.json` retain
scope and exact IDs. Runner hash
`992b84bc3cff3e0a231f6c498f77f80d1228c2efff6774c923418d51ba8414e1`;
browser hash `e3498cd6bc5b3a47ba0b8773160a23ea48e3f258cb41a1b733e31e37334c6d32`.
This two-CPU browser pass does not override the failed one-CPU 150/s load gate.

## Full-workload two-CPU differential

Subsequently the same candidate ran the entire original workload with only its
owned application CPU allowance changed from one to two. A byte comparison
confirmed only that Docker argument and its matching receipt field changed in
the external runner; the full load bundle remained byte-identical. Database and
load runner stayed at one CPU, application stayed at 512 MiB/320-MiB old-space,
all thresholds/admission limits and source/runtime images unchanged. This is a
local diagnostic resource comparison, not a production configuration change.

The prediction that a second application CPU alone clears the full 150/s gate
was contradicted by this run: **1,393 HTTP 200 / 107 HTTP 503** out of all 1,500
offered/started requests, no drops/retries/transport/correctness/header errors.
Scheduled p95/p99 were 377.49/469.01 ms. The 50/s tier passed all 500, p95/p99
24.22/77.97 ms. At 500/s, 3,957 started of 5,000 offered, with 1,569 HTTP 200,
2,388 HTTP 503 and 1,043 busy-actor drops; controlled-overload rules passed only.
This does not prove CPU pressure absent, that database waiting is the cause or
that 107 versus the earlier 125 refusals is a reproducible improvement. Shared
host scheduling and database/runner CPU allowances were not separately isolated.

Retained checks ran fully: read concurrency 5/20 each 6,000 HTTP 200; concurrency
100 returned 856 HTTP 200/5,144 HTTP 503 within overload rules. Write concurrency
5/20 each 5,000 HTTP 200/1,000 expected stale HTTP 409, with 3,000 changes,
1,000 unchanged replays and independently checked rows/audits per tier. Two hundred
same-owner paired races retained 200 changes/100 stale conflicts/100 replays,
actual socket overlap and 200 winning receipts; 400 wrong-owner writes denied
with 10,000 candidates/6,200 audit rows unchanged. These passes do not replace
the failed arrival gate.

Owner `9bf153f9`; independent exact-ID inspection confirmed app/database stopped
0, load runner 1, no OOM/public ports and the actual 2/1/1 CPU allowances. App only
mounted two read-only synthetic secrets; default runtime startup unchanged.
Post-load health/memory steps were skipped after runner failure and are not
inferred from prior passing runs. No unrelated services changed or material deleted.
External evidence `outputs/session-key-reuse-two-cpu-load-20261002-r1`:
`load.log`, `result-summary.json`, `fixture-inspection.json`, `helper-comparison.json`.
Load hash `53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`;
modified runner `39b4ef6dc8a4ba86b424936704f2c0963f5c626e2bb8128c6d3284dfb5d3f8d4`.

Correction to the initial source-boundary inference: authentication precedes
procedure admission, but the real `_core/index.ts` entry point separately wraps
`createContext(options)` in `applicationWork.run(...)`. Looking at only the generic
transport wrapper missed that production call site. Authentication and procedure
work share the existing tracker; no duplicate limiter was required or added.
The direct runtime test below confirms pre-authentication refusal and retained
accounting after disconnect. The supposed missing general admission guard is
therefore not a finding or a supported explanation for the load failures.

After recording the differential evidence, all 170 operator tests passed without
skips (5,822.9245 ms), `operator.log` in that output directory. Formatting,
diff-whitespace and the full 116-phase traceability check passed; completion
remains false.

## Direct authentication-admission qualification

The existing exact runtime ran a new external real-HTTP/MySQL test with its
supported `API_MAX_ACTIVE_WORK=2` configuration in an owned synthetic fixture.
No application code, admission defaults or production configuration changed.
Normal startup migrated the empty database; a synthetic owner signed in through
the real password/JWT path. A temporary root connection held `LOCK TABLES users
WRITE` only in the isolated fixture, while a separate observer counted pending
application `SELECT ... FROM users` queries without logging query text/payloads.

Two actual `auth.me` requests reached the held database. A third returned HTTP
503 with a positive Retry-After and the normal public busy message; observer count
remained exactly two. Aborting the first client did not release its unfinished
authentication: another excess request still returned 503 and the query count
remained two. After unlocking, the remaining admitted request returned its own
user and subsequent authentication succeeded; pending queries returned to zero.
This directly demonstrates the production entry point's existing guard, not
an SDK mock, simulated signature, missing-guard fix or root cause of 150/s load.

The external helper releases its table lock in `finally`, waits for held requests
and closes both test connections. Providers/mail/automation stayed disabled;
zero public ports, source replacements or real data. All three exact fixtures
independently inspected stopped 0/no OOM; one CPU each, app/runner 512 MiB and
320-MiB old-space, DB 2 GiB/1-GiB database tmpfs. App had only two read-only synthetic
secret mounts; QA alone added the read-only test helper. Owner `09bd524e`.
Post-test health/readiness both HTTP 200; fixture lifetime cgroup memory peaks
app 144,412,672 / database 722,972,672 bytes with zero memory max/OOM events.
These are small-test observations, not production or full-workload sizing proof.

Evidence `outputs/authentication-admission-20261002-r1`: `admission.log`,
`fixture-inspection.json`, `helper-hashes.json` and external helpers. Runner hash
`8e35d26bfe3ecee416bad6af96f588b19a883bc96dca18c97d45363f85563830`;
test hash `d7454d9061f889bfafebd0633342e26f8c324d6f9242d087784ad118ac4eb78f`.
The maintained `work-admission.test.ts` covers tracker reservation/settlement;
this new external test exercises current packaged server wiring with real DB waits.
The initial external test had not yet been promoted or mutation-tested. It has now
been promoted and missing-guard mutation-tested as described below.
The unchanged full-load gate remains failed;
authentication/procedure stage handoff and other scheduling causes remain to measure.

After correcting the records, all 170 operator cases passed without skips
(3,688.4172 ms), `operator.log` in that output directory. Formatting, whitespace
and 116-phase traceability checks passed; the full goal remains incomplete.

## Maintained authentication-admission regression and local CI wiring

Added `scripts/authentication-admission.integration.test.mjs` and its private
`authentication-admission-probe.mjs` helper. Root
`pnpm test:authentication-admission:integration` and `pnpm test:all` now include it.
The local CI workflow runs it after building the existing recovery production
runtime target. A new release-contract case requires that build order and mandatory
unskipped inclusion. Nothing has been committed, pushed or run on hosted GitHub CI.

The maintained probe preserves the real runtime/HTTP/JWT/MySQL blocked-query,
disconnect-through-settlement and capacity-reuse checks. It adds phase-only
failure reporting, immediately observes held-request rejections and checks both
health/readiness. The orchestrator resolves already available images before
creating scratch files/fixtures; no implicit pull. It validates exact ownership,
image, user, CPU/memory/PID limits, capability drop, no-new-privileges, read-only
root, exact read-only mount destinations and no public ports during cleanup.
Only its validated own temporary credential directory is removed; containers
are retained. No application or production admission/resource configuration changed.

Two local runs against the same exact candidate/MySQL images passed one real
integration case each, no skips: 19,344.1868 ms (process 19,416.6964 ms), then
21,470.7659 ms (process 21,552.8291 ms) after strengthened fixture assertions.
The second uses final maintained source hashes:
orchestrator `5d5988391f417cafb3247f8c8f6c22e43407348539b1aa1d72da8c736a2a723a`;
probe `cf2f79aac30ce3f0ad1ca62993125c6bc2b0d1305cee6aadf27eef06d92f6567`.
A deliberate nonexistent-runtime-image invocation returned the expected test
exit 1 before fixture creation; its failed receipt is retained, not counted as a
normal regression pass or a missing-guard mutation result.

Independent inspection confirmed all six retained fixtures stopped exit 0, no
OOM/public ports. Owners `ed47039a-0bf0-412b-8c75-1534f155ba7f` and
`ab5e3f87-43cd-4a20-b491-12297efe98b6`. Receipts in the same authentication output
directory: `maintained-integration.log`, `maintained-integration-repeat.log`,
`missing-image-refusal.log`, `maintained-fixture-inspection.json`. Initial post-
wiring operator checks passed 171 cases, no skips (3,006.6918 ms),
`operator-maintained.log`; final documentation checks recorded separately.

No fresh production package build was needed to exercise the maintained test
against unchanged packaged application code; root test/CI/helper changes are not
a newly built release image. Hosted CI,
full-stage occupancy measurement and the failed full-workload gate remain open.
Final maintained-script syntax, formatting, diff-whitespace and 116-phase checks
passed. All 171 operator cases passed without skips (3,841.2766 ms),
`operator-maintained-final.log`. No phase was marked complete.

## Missing-authentication-guard mutation qualification

The unchanged maintained integration test was run against an isolated local
mutation image, then the original candidate. Only the compiled context callback
in an external copy changed from `applicationWork.run(() => createContext2(options))`
to `createContext2(options)`. Procedure admission and all other application code
were retained. The production image, application source, maintained probe and
orchestrator were not modified. This intentionally defective image is not a
release candidate and was not published.

The mutation image `sha256:ad5f3bdf3da3452b01ff401d8c46b1592f65bfa9faa2f12aa488409b7d6b7e29`
failed the real integration case as expected (35,022.2791 ms; process
35,095.3705 ms). Its retained probe reported exactly
`authentication_admission_failed`, phase `excess_before_database`: the excess
request did not receive the required immediate busy response while authentication
queries were held. This is a targeted negative result, not a generic startup
failure or evidence that the actual product lacks its guard.

The same unchanged test then passed against the original exact runtime
`sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`
(21,262.0368 ms; process 21,329.7192 ms), without skips. It confirmed excess
503/Retry-After before another blocked query, disconnected work remaining counted,
settlement releasing capacity, and final health/readiness. Zero provider actions.

All six retained fixtures independently inspected stopped/no OOM/no public ports;
the intended red probe exited 1, the other five exited 0. Owners
`2e52c557-a301-4757-a4eb-50db27211313` and
`339ed687-c209-47e3-be13-de31c35b58be`. The separate mutation assembly container
`b098a6e7e376e8e3be6e8b3b525c317e97c07c4bdc436d1b5b3af6c129dfb2a7`
was created stopped, owner-labelled, network-disabled and never started. It and
the mutation image are retained locally for review, not selected by default tests.

Receipts in `outputs/authentication-admission-mutation-20261002-r1`:
`mutant-test.log`, `mutant-probe.log`, `original-test.log`, `mutation.diff`,
`hashes.json`, `fixture-inspection.json`. Original compiled file SHA-256
`a7bd6ba017ef31fecda06a930f06bf2dff40acfb5bc78d559da85e08d2c61f73`;
mutated copy `7281a4470c0f41b920cc756d057e5ab8d0f44cf0649022f56d0b9d1460abcfae`.
Maintained script hashes remain those recorded above. The first attempted copy
from a previously stopped fixture could not find the file; no copy or edit took
place there. Assembly instead used a newly created stopped container from the
verified original image. No unrelated containers or user data were changed.

This qualifies this regression's sensitivity to removal of context admission,
not every guard mutation, full stage-occupancy diagnosis, hosted CI or capacity.
The unchanged 150/s gate remains failed and all 116 original phases remain Partial.
After updating the README and verification ledgers, all 171 operator cases passed
without skips (4,205.9332 ms), `operator.log` in the mutation output directory.
Formatting, diff-whitespace and traceability checks passed; `completionProven`
remains false. Git HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.
No commit, push, merge, deployment, provider action or spending.

## Isolated aggregate work-stage diagnostic

A separate diagnostic image was assembled from the same original candidate,
with aggregate counters only in compiled `createWorkTracker` and explicit
`context`/`procedure` labels at the two real call sites. It is not a new release
candidate. No limiter, queue, cancellation, resource ceiling, security decision
or acceptance threshold changed. No periodic logging, payloads, identities,
headers, tokens or query text were collected. One bounded three-stage record was
emitted after graceful tracker shutdown. Timing overhead from counters remains a
limitation; these timings cannot certify production capacity.

The ranked diagnostic predictions were: context-admission refusals for pressure
before authentication; prolonged procedure occupancy for procedure pressure;
procedure-admission refusals while context work remains active for handoff
competition. The existing repeatedly failing full workload was retained rather
than prematurely minimized: its refusal stage had not yet been located. This
diagnostic narrows the next measurement, not a completed root-cause diagnosis.

Diagnostic image `sha256:b601175f6054a0bac1065d2fa9e148b0f53cc354ba26e647fac28d1881464abf`.
Load and runner remained byte-identical to the original full-workload receipts:
`53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`
and `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
The external instrumented compiled file hash is
`9c690392a43f165228926f280497081fea19d0f886ed6e80c10cfb08b7cc5f46`.
Application/database/runner remained one CPU each; app/runner 512 MiB, app old-space
320 MiB, database 2 GiB/1-GiB tmpfs. No application replacement mounts or public ports.

The full runner exited 1 at its unchanged capacity gate. Closed-loop read tiers
5/20 each returned 6,000 successful responses; concurrency 100 returned 882 HTTP
200 and 5,118 controlled 503 responses. Scheduled 50/s returned 500/500 HTTP 200.
Scheduled 150/s returned 1,402 HTTP 200 and **98 HTTP 503**, with all 1,500 requests
started/completed and no actor/capacity/late drops; the all-success gate failed.
Scheduled 500/s started 3,963/5,000 (1,863 HTTP 200/2,100 HTTP 503), with 22
capacity and 1,015 actor drops; controlled-overload rules passed. No transport,
correctness or retry-header errors in these tiers. These variations from earlier
samples are not evidence of improvement from instrumentation.

Both write tiers passed: each 3,000 committed changes, 1,000 unchanged replays,
1,000 stale conflicts and independent row/audit checks. All 200 paired edit races
and 400 wrong-owner mutation refusals passed; final 10,000 candidate rows and
6,200 audit rows were independently preserved by the isolation checks.

Aggregate shutdown counters, across the **whole combined workload**, were:

| Stage                  | Admitted/settled | Budget refusals | Mean occupied ms | Maximum occupied ms |
| ---------------------- | ---------------: | --------------: | ---------------: | ------------------: |
| Authentication context |           31,047 |           7,316 |           35.073 |           1,324.696 |
| Procedure              |           31,047 |               0 |           30.073 |           1,329.115 |
| Other (readiness)      |                1 |               0 |           21.468 |              21.468 |

All active counters were zero at shutdown. The 7,316 context refusals exactly
match 5,118 + 98 + 2,100 busy responses from the three relevant tiers. Every
refusal occurred while some context work was active; 5,517 also occurred while
some procedure work was active. Those overlap counts are not exclusive and do
not establish how many of the 32 slots belonged to each stage at each refusal.
No procedure-stage refusal occurred in this sample, weighing against handoff
refusal as its explanation. It does **not** establish that authentication alone
caused the capacity failure: context and procedures share the same budget, and
their occupied times include scheduling and database waits. Tier-specific stage
durations, database pool/query waits, event-loop/CPU attribution and a minimized
repeat are still needed before a product fix or supported capacity is claimed.

Owner `c9a22401`; independent inspection confirmed the exact three fixtures
stopped, no OOM/public ports, app/database exit 0 and runner exit 1. Post-load
health/memory steps in the unchanged runner were skipped after the failure and
are not inferred. The owner-labelled assembly container
`b4761351cbfcf0d26ff30efeb4fcabd582438f8c92a65dbbb0dc8b783d1fbc89`
was network-disabled, stopped and never started. Both it and the diagnostic image
remain local review artifacts; default runtime/test tags were not replaced.

Evidence in `outputs/work-admission-stage-diagnostic-20261002-r1`: `load.log`,
`stage-metrics.json`, `workload-summary.json`, `fixture-inspection.json`,
`diagnostic.diff`, `diagnostic-hash.json`, external helpers. The unique
`DEBUG-stage-20261002` instrumentation exists only in that clearly marked external
diagnostic copy/image; a source search found none in repository apps/scripts.
No application source edit, publication, deployment, provider action or spending.
All 116 phases remain Partial; the full goal is still incomplete.
After recording the diagnostic, all 171 operator cases passed without skips
(3,024.9552 ms), `operator.log` in that evidence directory. Formatting, whitespace
and traceability checks passed. Original runtime and maintained admission-helper
hashes were rechecked unchanged; Git HEAD remains
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. No release acceptance is inferred.

## Database-only two-CPU full-workload differential

The unchanged full workload was repeated against the **original, uninstrumented**
runtime `sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`
and MySQL `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Only the self-created database CPU allowance changed from one to two. Application
and load generator stayed one CPU each. Memory, tmpfs, old-space, admission,
arrival rates and acceptance thresholds were unchanged. The external runner's
receipt reflects two DB CPUs; cleanup also asserts exact image IDs/CPU allowances.
No production Compose/resource setting or application source was changed.

The prediction that extra database CPU alone would clear the 150/s all-success
gate was not supported in this sample. The runner completed the full workload
and exited 1 because 150/s returned **1,378 HTTP 200 and 122 HTTP 503**. All 1,500
requests started/completed, with no late/capacity/actor drops or transport,
correctness/retry-header errors. Scheduled response p95 was 392.20 ms; start-lag
p95 was 1.23 ms. Those observations do not support missed/late starts as this
tier's failure explanation, but do not exclude scheduling delays inside the
application/database or shared-host contention.

Scheduled 50/s passed all 500 responses. At 500/s, 4,171/5,000 started (1,891
HTTP 200/2,280 HTTP 503), with four capacity and 825 actor drops; controlled
overload passed, not 500/s successful customer capacity. Closed-loop read tiers
5/20 each passed all 6,000 responses. Concurrency 100 returned 880 HTTP 200 and
5,120 controlled HTTP 503 responses. Both write tiers passed 3,000 committed
changes, 1,000 unchanged replays and 1,000 stale conflicts each, with independent
row/audit checks. The 200 paired edit races and 400 wrong-owner mutation denials
passed with final 10,000 candidate/6,200 audit-row preservation. No retained gate
was removed or substituted for the failed arrival gate.

Uninstrumented full-workload comparisons on the same candidate, each one local
sample with independent fresh synthetic database:

| App CPUs | DB CPUs | Runner CPUs | 150/s HTTP 200 | 150/s HTTP 503 | Gate   |
| -------: | ------: | ----------: | -------------: | -------------: | ------ |
|        1 |       1 |           1 |          1,375 |            125 | Failed |
|        2 |       1 |           1 |          1,393 |            107 | Failed |
|        1 |       2 |           1 |          1,378 |            122 | Failed |

This is not a statistical benchmark or proof that CPU contributes nothing.
Neither single-service CPU increase alone cleared its observed gate. No minimum
supported hosting tier, real workload capacity, CPU-throttling attribution or
provider cost/production change is inferred. The prior aggregate diagnostic
located refusals at context admission; it did not measure this uninstrumented
sample's stage occupancy. Pool acquisition versus query/transaction execution
and application event-loop/CPU waits remain to distinguish. The installed host
driver's string-URL path creates a pool; its default ten-connection ceiling is a
source observation, not a measured bottleneck or authorization to enlarge it.

Owner `8fbf9cdd`. Independent exact-ID/image/owner/CPU inspection confirmed all
three retained fixtures stopped, app/database exit 0 and runner exit 1, no OOM
or public ports. App/runner 512 MiB; database 2 GiB/1-GiB tmpfs; 256 PIDs,
non-root/read-only. The app retained only its two read-only secret mounts,
without application replacement. Post-load health and memory steps were skipped
by the unchanged runner after its failure and are not inferred.

Evidence in `outputs/session-key-reuse-database-two-cpu-load-20261002-r1`:
`load.log`, `workload-summary.json`, `fixture-inspection.json`, `runner.diff`,
`helper-hashes.json`, external helpers. Load remained byte-identical:
`53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`.
Modified external runner hash:
`620bbec2c8f64fdc4bcb078071576940b835740500a60d60f163c991fea091dd`.
After updating the local records, all 171 operator cases passed without skips
(6,301.1056 ms), `operator.log` in that evidence directory. Formatting,
diff-whitespace and 116-phase traceability checks passed; completion remains
unproven. Git HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.
No publication, deployment, provider action, purchases or shared-service changes.
All 116 original phases remain Partial; no capacity fix or completion claim.

## Subsequent pool-wait diagnostic

The [separate canonical pool-wait report](POOL_WAIT_DIAGNOSTIC_2026-10-02.md)
records a diagnostic-image authentication preflight and unchanged full workload.
150/s still failed (1,426 HTTP 200/74 HTTP 503), while retained write/race/isolation
checks passed. Whole-load connection waiting and high application CPU/event-loop
delay were observed, not attributed as the tier's root cause. No production pool,
admission/resource setting, application source or release image changed.

## Fresh isolated encrypted recovery

The maintained `database-recovery.integration.test.mjs` ran unchanged against the
exact runtime/integration/MySQL images listed above. Its full-schema encrypted
backup/restore/application case passed without skips: **93,927.797 ms** (process
94,008.4313 ms). Separate recovery units passed **34 cases**, no skips,
2,780.3235 ms. This is one integration case with many explicit assertions, not
34 additional restore scenarios or a production recovery-time commitment.

Verified binary/UTF-8 rows, schema/index/migration-journal parity, view/procedure/
trigger/event definitions and execution safeguards. Scheduled events stayed off;
the test exercised the restored view/procedure and trigger. Damaged encrypted
artifacts, wrong exact-target IDs, enabled event scheduling, binary-logged targets,
broad/delegated/role grants, nontransactional source tables, existing backup
replacement, nonempty targets and in-place restores were refused. Source data
was preserved. The Windows encrypted-backup wrapper also ran in this host test.

Normal default runtime startup after restore passed real HTTP sign-in for two
synthetic owners, own-candidate visibility, wrong-owner/anonymous refusal,
logout/revocation and expired reset/verification-link refusal. Restored active
session authority, admin-verification windows and old links were invalidated while
historical digests/older expired timestamps were retained. The real queue worker
in the integration package discarded four expired restored jobs, cleared their
payloads/leases and reserved no delivery budget. Its synthetic transport guard
recorded zero provider attempts. This worker observation is test-package evidence,
not live mail or packaged worker deployment proof.

Owner `e8cbfe71`; independent inspection of four exact retained database/runtime
fixtures confirmed stopped exit 0, no OOM/public ports, non-root/read-only, two CPU
and 256 PIDs. Databases had 2-GiB memory limits, 1-GiB database tmpfs and disabled networking;
runtime used 1 GiB and only one read-only external HTTP probe mount. No application
source replacement or unrelated service changes. The test removed only its own
validated temporary encrypted-artifact/key directory; retained containers were not
deleted. No real/customer data or backup was removed.

Evidence in `outputs/session-key-reuse-20261002-r1`: `recovery.log`,
`recovery-unit.log`, `recovery-fixture-inspection.json`. Maintained helper hashes:
integration test `4c79bfbba262194b9ad55cc805e334a6b03c323a67b8e1d121b75ccf32acf2de`;
CLI `85819a0dbcc9d9bdfe9936704355e7f4ac4c4f1aed80e21f28f6da69bb418034`;
application probe `fd403ff2e9f17bfac54d6c529f2808fd8749289207ed739d03f72ee2b46ce8f2`;
mail probe `87e0b566827f3d81a982c6978145c05af3a0cae7f9151ef4047e903a285246d8`.

No off-host backup, independent key recovery, production-scale restore/cutover,
real inbox/provider or operator acceptance is proven. Post-backup password/address
changes, deletion/suppression requests and provider delivery/cost acknowledgements
still require reconciliation before promotion. Recovery passes do not override
the failed 150/s capacity gate or complete any original phase by themselves.

After recording recovery evidence, all 170 operator tests passed without skips
(4,898.4339 ms), `operator-recovery.log`. Formatting, whitespace and traceability
checks passed. All 116 original phases remain Partial; completion is not proven.

Evidence directories under the task output root: `session-key-reuse-20261002-r1`
and `session-key-reuse-load-20261002-r1`. Retain red/green/typecheck/build logs,
source/image/helper hashes, actual load receipt and owned-fixture inspection.

The first operator run passed 169/170 tests and correctly rejected the stale UI
source inventory. A recursive comparison against the freshly generated inventory
found only the SDK source hash and aggregate input digest changed; all action,
API-reference and other fields were identical. Those two generated fingerprints
were refreshed without changing or weakening the check. The repeat operator run
passed all 170 tests, no skips (5,683.2778 ms); retain both `operator.log` and
`operator-green.log`. This is static source-inventory verification, not a new
browser acceptance receipt.

After recording the fresh database/parity evidence, the operator suite passed
again: 170 cases, no skips (3,854.4342 ms), `operator-database.log`. Formatting,
diff-whitespace and 116-phase traceability checks passed; all phases remain
Partial and `completionProven` remains false.

No overall runtime acceptance, fixed root cause, supported customer capacity, production
release or complete worldwide platform coverage is claimed. The full 116-phase
goal remains incomplete; no commit, publication, deployment or spending.

Source SDK SHA-256 `23951bf69fc889a0abc062ea782396f935c8f814e0fb232eee0205570238d5c4`;
new test source `c295647ce2f224973b771713c14cb55e396707f61761e0dc441f96e9f22513d6`.
Load helper/runner remain `53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`
and `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
