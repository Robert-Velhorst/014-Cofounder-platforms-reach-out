# Scheduled synthetic arrival load — October 2, 2026

## Why this is separate

The existing [read/write load harness](SYNTHETIC_CUSTOMER_LOAD.md) waits for each
actor's response before its next request. Slow responses therefore reduce the
rate offered to the server. The added finite arrival scheduler keeps the original
arrival timetable independent of response completion. It does not change the
production service, authorization, work limits or provider gates. It complements,
not replaces, the retained closed-loop/write/race checks.

## Implementation and fixed rules

`scripts/synthetic-arrival-load.ts` inside the app validates at most 20,000 arrivals,
an interval of 1–1,000 ms, at most 100 outstanding operations and a bounded allowed
start delay. Intended arrival time is fixed at epoch plus index times interval.
Late or capacity-blocked arrivals are dropped, not buffered, postponed or retried.
Each actor already has a one-socket client; the integration explicitly drops a
busy actor before making another HTTP call, avoiding an unobserved client queue.
Completed promises are drained and rejections counted; no failure payload is logged.
The real HTTP calls retain their existing ten-second transport timeout.

Added tiers offer 50, 150 and 500 arrivals/second for ten seconds each, max 100
outstanding and max 50-ms start delay, round-robin across 100 synthetic owners.
Operations rotate across identity/profile/candidate-list/details/runtime-status/
catalogue. Arrival counts and owner coverage are reported, not inferred from an
aggregate success. Same local synthetic/empty-database/provider-off requirements
and one-CPU/512-MiB app limits as the existing harness apply.

Predefined acceptance:

- Every tier requires zero transport failures, correctness errors, late arrivals
  and malformed Retry-After headers, and at least one checked successful response.
- Normal 50/150 tiers require every offered request to start and only HTTP 200,
  with p95 measured from intended arrival through full response below 2,000 ms.
- The overload 500 tier allows HTTP 200/503 and explicitly reported capacity/busy-
  actor drops. A pass proves controlled behavior, not full offered-rate service.
- No automatic retries, arrival catch-up bursts, skipped failures or retroactive
  threshold changes. Existing closed-loop and write/race assertions remain intact.

Metrics distinguish offered, started, completed, transport-failed, late/capacity/
busy-actor drops, peak outstanding, start lag, service response time and intended-
arrival response time. Latency distributions exclude requests never started;
their explicit drop counts must accompany timings. Synchronous callback failures
count as started/failed but have no asynchronous response-duration sample.
This does not measure network-wide offered throughput or guarantee per-owner
fairness; owner min/max successes are diagnostic rather than a fairness gate.

## Verification status

Ten new scheduler cases and 17 retained load-helper cases passed across four
files without skips (27 total, 1.00 s). Tests prove independent cadence, capacity
and busy-actor drop accounting, rejection drain, late-arrival omission and bound
refusal before requests. Explicit strict TypeScript checking of both synthetic
scripts passed (these developer scripts are not normally included by the app's
tsconfig), and the ordinary app typecheck passed. Full host unit suite passed
1,019 cases across 99 files without skips in 135.49 seconds. These are source/unit
results, not a new production-image rebuild or a passing load gate.

The actual rehearsal completed **exit 1**: the predeclared 150-rate all-success
gate failed. The existing closed-loop/write/race cases still passed; they are not
used to hide this stronger workload's failure.

| Offered rate / 10-second tier | Started / offered | HTTP 200 / HTTP 503 | Client drops                  | Intended-arrival p95 / p99 | Result                                         |
| ----------------------------- | ----------------- | ------------------- | ----------------------------- | -------------------------- | ---------------------------------------------- |
| 50/s                          | 500 / 500         | 500 / 0             | 0                             | 16.28 / 28.40 ms           | Pass                                           |
| 150/s                         | 1,500 / 1,500     | 1,435 / 65          | 0                             | 258.00 / 451.96 ms         | Fail: 65 busy refusals                         |
| 500/s overload                | 3,908 / 5,000     | 1,346 / 2,562       | 3 capacity + 1,089 busy actor | 423.37 / 687.13 ms         | Pass for controlled overload, not full service |

Zero transport/correctness errors, malformed Retry-After headers, late-arrival
drops or automatic retries. Peak outstanding operations were 3/57/100; per-owner
successful counts ranged 5–5/13–15/7–19 respectively. These are diagnostic samples,
not fairness acceptance. At overload, dropping 1,092 unstarted requests is included
in the result; response latency alone would conceal those arrivals.

The retained 30,000 closed-loop read/write baseline requests, 200 paired-edit
races and 400 wrong-owner mutation refusals passed with independent 10,000-row
and audit checks. Nevertheless the combined harness correctly returns nonzero.
The outer runner's post-load health and cgroup-memory sampling did **not** run
after that nonzero attachment; do not transfer those observations from the prior
successful receipt. App shutdown completed normally.

This is an observed capacity shortfall against a synthetic gate, not proof of
corruption or a diagnosed product bug. The application work limit remains 32,
and the test offered workload can accumulate more client requests than that.
Client outstanding count is not server active-work count; exact refusal cause
and per-route demand still need observation. Host unit tests ran concurrently
with this local experiment, so workstation contention is a plausible contributor,
not a verified explanation. A separate quiet-host repeat and demand/resource
analysis should precede any service-limit or hosting decision. No acceptance
threshold or production limit was changed in response to the failed result.

## Repeat without concurrent agent tests

The diagnostic repeat used byte-identical bundle/runner hashes, exact same
runtime/MySQL IDs, dataset, resource limits, order, timeouts and acceptance rules.
Only competing agent-launched unit/typecheck/build work was omitted. Other user
applications/services stayed running and were not stopped or inspected for content;
this is not a fully idle-host experiment. Diagnosis guidance required an unchanged
repeat before a fix. The full loop was retained for comparability first; a faster
minimal reproduction and per-route/refusal observation remain next, not achieved.

The second combined workload again terminated **exit 1**:

| Offered rate / 10-second tier | Started / offered | HTTP 200 / HTTP 503 | Client drops                   | Intended-arrival p95 / p99 | Result                                     |
| ----------------------------- | ----------------- | ------------------- | ------------------------------ | -------------------------- | ------------------------------------------ |
| 50/s                          | 500 / 500         | 500 / 0             | 0                              | 17.18 / 40.24 ms           | Pass                                       |
| 150/s                         | 1,444 / 1,500     | 1,282 / 162         | 56 busy actor                  | 522.00 / 760.68 ms         | Fail: busy responses and missed arrivals   |
| 500/s overload                | 3,635 / 5,000     | 1,009 / 2,626       | 11 capacity + 1,354 busy actor | 525.29 / 1,086.06 ms       | Controlled-overload pass, not full service |

Zero transport/correctness errors, late-arrival drops, malformed Retry-After
headers or retries. Peak outstanding 3/47/100; per-owner successes 5–5/12–14/4–14.
All five retained closed-loop/write tiers passed (30,000 baseline requests), as
did 200 paired-edit races and 400 wrong-owner mutations with independent stored
10,000-row/6,200-audit checks. Post-load health/memory sampling was again skipped
by the outer runner after the nonzero attachment; no such proof claimed here.

The 150/s failure occurred in both observed runs, including without concurrent
agent tests. Therefore their presence alone is not a sufficient explanation.
Variability and other host activity remain confounders; this does not isolate
server work admission, database waits, CPU throttling or per-route costs. No
product bug/root cause/fix or guaranteed capacity is claimed, and no guard or
threshold changed. The low-rate pass is a ten-second sample, not a production SLO.

Repeat evidence directory:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/scheduled-arrivals-20261002-r2`.
`load.log`, `helper-hashes.json`, `final-fixture-inspection.json`; same bundle and
runner SHA-256 as below. Owner `2a88ad06`; all three exact IDs independently
checked against terminal receipts: expected images/users/owner/one-CPU/read-only
configuration, no OOM/public ports, all stopped; app/database exit 0, runner exit 1.

- App `cb7ab24d5f43854e41a09e2f802d5be9700f3f8ecf2a544ddfd9382e51edad47`
- Database `6841a17d6316e2e67805337fad4ac8c1cd6428b755e88c552dc631238fe7cea0`
- Runner `c5a0a0a71cb19ff78ecdd8898136cdbe78463d997ec30989153e9b72b94259d6`

No source-code changes, services stopped outside these fixtures, user material
deleted, publication, deployment or spending in this repeat.
After the repeat documentation updates, all 170 operator cases passed without
skips in 3,676.2593 ms (`operator.log` in the repeat evidence directory).
Formatting/diff-whitespace/requirements checks passed; 116 phases still Partial,
`completionProven:false`. The load gate remains failed despite green operator tests.

## Shorter diagnostic reproduction and refusal boundary

Diagnosis guidance prompted an external debug copy, not a change to the maintained
acceptance harness. r3 retains all synthetic setup, real login, warmup/isolation,
accounts/data/resource bounds and the same ten-second 150/s arrival gate. It omits
the closed-loop tiers, other arrival rates and subsequent write/race phases, and
adds only content-free per-operation timing/status and allowlisted refusal labels.
This is a shorter failing request loop, not an irreducible fixture or full test
acceptance. Unknown errors are labelled `other_refusal`; raw messages, credentials,
cookies and record content are never printed. Tagged instrumentation stays only
in explicitly named external `scheduled-arrivals-debug-*` directories.

r3 reproduced exit 1: 1,500 offered, 1,483 started, 1,358 HTTP 200, 125 HTTP 503,
17 busy-actor drops, peak outstanding 62. Intended-arrival p95/p99
455.24/704.36 ms. All 125 refusals matched the exact `Server is busy. Please try
again shortly.` response, uniquely located in the current `server/server-work.ts`
active-work admission branch. This identifies the refusal boundary, not the
cause of long-running admitted work. Identity/profile/candidate-list/catalogue
accounted for 57/34/27/7 refusals; details/runtime-status had zero in this sample.
Transport/correctness/retry-header/late-arrival errors and automatic retries zero.

r4 changes only the measured operation to `auth.me` (identity), preserving fixture
and timing/bounds. It also reproduced exit 1: all 1,500 arrivals started, 1,451 HTTP
200, 49 active-work-limit HTTP 503, no client drops, peak outstanding 52.
Intended-arrival p95/p99 170.70/456.59 ms, service p95/p99 169.30/456.01 ms.
Thus catalogue serialization, candidate list/detail processing and the six-route
mix are not necessary to reproduce this refusal. Shared authenticated request
handling remains in scope; no claim that account lookup itself is the root cause.

These diagnostic copies neither relax the 150/s gate nor replace earlier full
failures. They do not run writes/races or establish all retained data behavior.
Post-load health/memory sampling remained skipped by the runner on the nonzero
attachment. Production service/image code is unchanged. No fixes or capacity
guarantees are claimed.

Evidence under the task output directory:
`scheduled-arrivals-debug-20261002-r3` and `scheduled-arrivals-debug-20261002-r4`.
`load.log` retains each exact package/fixture receipt; r4 also contains
`combined-fixture-inspection.json` and `helper-hashes.json`. r3 bundle SHA-256
`b661bd1e021fdb3cef1f7f07b17eb7afe6fa0fd56a5d507c283a4f1973d1d781`;
r4 `50fddaa01f8e774fe1239892ef180aedc2180b74c1ea2ca32f725710d95e6f38`;
both use the unchanged runner hash listed below. Each was syntax-checked and
actually executed with `QUALIFICATION_RUNTIME_IMAGE` set to the exact current
runtime ID, then `node outputs/<diagnostic-directory>/runner.mjs` from task cwd.
Runtime/MySQL IDs and authority bounds are the same as the full experiments.

Independent inspection checked all six exact IDs/owner/image/non-root identities
against terminal receipts: stopped/no OOM/no public ports; both apps/databases
exit 0, both runners exit 1. Owners r3 `12b4ade3`, r4 `e78cf7fd`; no material deleted.
No tests/builds ran alongside these request phases; unrelated user services stayed
untouched. Background host variability remains possible.

Next discriminating work: further reduce fixture-only dependencies and observe
shared-path CPU scheduling, database waits, synchronous configuration/file reads
and runtime pauses separately. No cause is chosen from these candidates yet;
measurement must precede a production change and the original full gate must
still pass after any eventual fix.
After these diagnosis documentation updates, all 170 operator cases passed
without skips in 3,226.0295 ms (`operator.log` in r4). Formatting/diff-whitespace/
requirements checks passed; all 116 phases remain Partial, `completionProven:false`.

## CPU-resource differential: failing baseline, changed resource, return to baseline

Before testing, the candidate explanations were configuration/secret file reads,
database waits, CPU scheduling/resource constraints and runtime pauses. Code
inspection lowered the first: ordinary `getConfig(process.env)` caches resolved
configuration, and module-level identity-path secret values are read during
initialization, not reread by that module on every identity request. This is code
evidence, not a file-I/O trace or proof that all paths cache every secret. The
planned environment-versus-file differential was not run; no such outcome claimed.

Diagnosis then tested the falsifiable prediction that changing **only the owned
app's CPU allowance** from one to two would reduce identity-request refusals.
r5 uses the byte-identical r4 load bundle, same immutable runtime/MySQL IDs,
database/runner one-CPU settings, 512-MiB app memory, 320-MiB Node old-space,
credentials/mounts/dataset/150-scheduled-arrival rate and every request gate.
The active-work limit was not increased. Only the external runner changes the
app CPU setting and asserts Docker actually applies two CPUs; no production
Compose, image, service, provider or paid capacity was changed.

| Identity-only probe   | App CPU allowance | HTTP 200 / HTTP 503 | Client drops | Intended-arrival p95 / p99 | Peak outstanding | Result                          |
| --------------------- | ----------------- | ------------------- | ------------ | -------------------------- | ---------------- | ------------------------------- |
| r4 baseline           | 1                 | 1,451 / 49          | 0            | 170.70 / 456.59 ms         | 52               | Fail                            |
| r5 changed resource   | 2                 | 1,500 / 0           | 0            | 66.69 / 140.63 ms          | 28               | Pass for this diagnostic sample |
| r6 return to baseline | 1                 | 1,498 / 2           | 0            | 148.89 / 238.77 ms         | 39               | Fail                            |

All 1,500 arrivals started in each ten-second sample; zero transport/correctness/
late-arrival/retry-header errors and no retries. r6 uses exactly the original r4
runner and bundle bytes again. Its two refusals still matched active-work
admission. The A/B/A sequence supports CPU-resource sensitivity in this fixture,
not definitive kernel throttling, a CPU-only root cause, statistical reproducibility
or a production hosting requirement. Host/background timing and database effects
remain uncontrolled; no CPU-throttle trace or shared-path profile was collected.
The original full one-CPU gate remains failed; a two-CPU identity-only pass cannot
stand in for all routes, writes, exports, workers or longer running service.

r5 completed exit 0 and therefore the outer runner actually measured post-load
health/readiness HTTP 200 and cgroup peak memory (app 233,213,952 bytes; MySQL
743,264,256); all recorded memory events zero. r6 exited 1 and skipped those
post-load checks. No r5 memory/health observations are transferred to r6.

Evidence directories under the task output root:
`scheduled-arrivals-debug-20261002-r5` and `scheduled-arrivals-debug-20261002-r6`.
Both retain `load.log`; r6 retains `combined-fixture-inspection.json` and
`helper-hashes.json`. Independent read-only inspection checked all six exact IDs,
owner/image/user identities, configured CPU/memory, no OOM/public ports, all
stopped. r5 app/runner/database exit 0; r6 app/database exit 0 and runner exit 1.
Owners r5 `4bd468a5`, r6 `a634e6c4`; diagnostic instrumentation stays outside the
repo. No user material deleted or services changed outside these owned fixtures.

The production Compose app remains one CPU; the EUR 100/month plan is still not
an approved tax-inclusive hosting quote. A diagnostic second CPU is not authority
to resize a host or purchase capacity. Next: collect targeted CPU/database/runtime
observations at the shared path, then verify any justified fix against the original
full workload without weakening admission, permissions, limits or thresholds.
After these CPU-differential documentation updates, all 170 operator cases passed
without skips in 5,393.4615 ms (`operator.log` in r6). Formatting/diff-whitespace/
requirements checks passed; all 116 phases remain Partial, `completionProven:false`.

## Temporary runtime observations: passing one-CPU samples

Two further isolated identity-only runs, r7 and byte-identical r8, retained the
one-CPU app and existing dataset, admission rules and thresholds. A temporary
read-only Node import collected half-second numeric CPU-cgroup deltas, event-loop
delay/utilization and GC timing in the app child only. No production source/dist
was replaced. This adds observational overhead, so these are instrumented
diagnostics, not pristine package qualification or a product fix. Load markers
identify the measured start and completion/drain window; the ten-second offered
cadence can finish draining after ten seconds.

| Observation                                                |                    r7 |                    r8 |
| ---------------------------------------------------------- | --------------------: | --------------------: |
| Offered / started / HTTP 200                               | 1,500 / 1,500 / 1,500 | 1,500 / 1,500 / 1,500 |
| Refusals / drops / transport failures                      |             0 / 0 / 0 |             0 / 0 / 0 |
| Scheduled response p95 / p99 (ms)                          |        42.85 / 107.43 |       108.25 / 225.84 |
| Peak outstanding client requests                           |                    24 |                    25 |
| Fully contained runtime samples / elapsed sample time (ms) |         19 / 9,521.27 |        20 / 10,109.49 |
| CPU throttle periods / observed periods                    |                7 / 95 |              16 / 101 |
| Cgroup throttled time delta (ms)                           |               706.657 |               872.864 |
| Maximum sampled event-loop delay (ms)                      |                 72.88 |                 69.47 |
| Observed GC count / total duration (ms)                    |          782 / 472.54 |          818 / 675.13 |
| Maximum observed GC duration (ms)                          |                  3.77 |                 52.75 |

Aggregates above exclude sample intervals overlapping either marker boundary.
They are not exact whole-window totals; GC observer delivery may cross sample
boundaries. Cgroup counters cover all processes in the app container, whereas
GC/loop observations concern the app child. Event-loop histogram resolution is
10 ms. GC durations are observations, not proof of exclusive stop-the-world time;
throttled time is not equivalent to request latency or billable CPU usage.

Both diagnostic gates passed without correctness or Retry-After errors. This
confirms actual CPU throttling was present in these passing samples, but neither
reproduced earlier refusals. It therefore does not establish throttling as their
cause, exclude database waits, isolate GC as the cause, or prove that increasing
CPU fixes the original mixed workload. One-CPU identity behavior varies between
runs; previous A/B/A results must not become a deterministic CPU requirement.
Next useful evidence is database/authentication-path timing and a failing run
with aligned runtime observations, followed by any justified regression-backed
fix and rerun of the original full workload. No speculative limit increase.

Both health and readiness returned HTTP 200 after load. App memory peaks were
234,385,408 / 236,879,872 bytes; database peaks 744,124,416 / 738,312,192 bytes.
All observed memory event counters were zero. Independent inspection confirmed
all six exact owned fixtures stopped exit 0, no OOM or public ports, correct
immutable images/users, one CPU each, and read-only mount whitelists. App has
the additional probe mount; its command remains the original startup supervisor.
Owners r7 `d72fc774`, r8 `28d7e84e`. Only these owned fixtures were stopped;
no user material deleted, provider actions or spending.

Evidence: task-output directories `scheduled-arrivals-debug-20261002-r7` and
`scheduled-arrivals-debug-20261002-r8`, each with `load.log`,
`contained-window-summary.json`, `fixture-inspection.json`, `helper-hashes.json`.
The first also retains `HYPOTHESES.md`. Identical helper hashes for both runs:

- Load: `82b3dc73fa239b8be7ea061ae248ea4743ab1bec41383be473f6eeb4b85d1ffb`
- Runtime probe: `918dece6972e181ef8d271b2ab928d56fd2ad3a84781e2c5449f01fd09ad0c56`
- Runner: `68963f5fc1160e923cd3f048ad71b31c08c7db51e53843cf9edb67db276004b1`

Probe/load/runner syntax checks passed. No maintained executable code changed
in this observational increment. Full scheduled-arrival acceptance is still
failed; all 116 phases remain Partial and `completionProven:false`.
After documentation updates, all 170 operator cases passed without skips in
5,441.3172 ms (`operator.log` in r8). Formatting, diff-whitespace and requirements
validation passed. Branch/HEAD remain `agent/public-saas-beta` /
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; nothing committed or published.

## Database callback observations on a refusal-producing run

Diagnostic r9 changes only the existing temporary probe relative to r8: it
subscribes to the installed mysql2 query and pool-connection tracing channels.
Source inspection shows account identity authenticates the signed token, fetches
the user, and checks the durable session plus deletion fence. Neither lookup nor
the revocation/fence checks were removed or cached. No maintained code changed.
Strict fixture minimization is deferred for this probe: retaining the same owners,
rows and load bundle permits a one-variable comparison with r8. This is an
explicit diagnostic tradeoff, not a claim that every fixture row is load-bearing.

The probe measures from driver trace start to callback entry (`asyncStart`), not
the synchronous trace `end`. This matches the
[Node tracing callback lifecycle](https://raw.githubusercontent.com/nodejs/node/v22.23.0/doc/api/diagnostics_channel.md).
It does not serialize SQL, parameters, results, errors, addresses or credentials.
Weak-map correlation and bounded numeric buffers retain only timing/count data.
Three external probe tests passed for private-context non-emission, cross-sample
active-operation accounting and buffer/unmatched-event reporting. Actual positive
query/acquisition counts confirm the installed runtime emitted the subscribed
channels; a silent/inactive probe is not being treated as a zero-latency result.

All 1,500 arrivals started/completed, but only 1,423 returned 200; 77 returned 503
matching `server_work_limit`. No drops, transport/correctness/Retry-After errors
or retries. Scheduled response p95/p99 316.69/477.17 ms; peak outstanding 59.
The unchanged normal gate failed and runner exited 1.

Fully contained samples (18, covering 9,175.70 ms) recorded:

- Query callbacks: 2,617 completions, max 227.40 ms, summed durations 27,090.38 ms.
- Pool acquisitions: 2,613 completions, max 234.91 ms, peak 22 active acquisitions,
  summed durations 19,303.69 ms.
- Both collectors: zero observed callback errors, omitted or unmatched events.
- Cgroup: 38 throttled periods out of 92, throttled delta 1,649.607 ms.
- Runtime: max sampled loop delay 139.59 ms; observed GC total 865.87 ms,
  max GC duration 83.22 ms.

Completion counts exclude boundary-overlap sample intervals and operations can
cross intervals. Summed durations overlap across concurrent operations; they are
not wall-clock occupancy or additive portions of response time. Do not average
per-sample p95 values into a whole-run percentile. Pool acquisition includes queue,
connection and callback scheduling; query timing includes transport/driver/loop
delays, not exclusively server SQL. These measurements show delays at the driver
boundary during a failing instrumented run, but do not identify the primary cause
or rule out probe overhead. Next: separate server-side SQL time from client/runtime
scheduling, then validate any justified fix with the original full harness.

Independent inspection: owner `6a7f6495`, all three exact fixtures stopped;
app/database exit 0, runner exit 1, no OOM/public ports, correct images/users,
one CPU each and read-only mount whitelists. Post-load health/memory measurement
was skipped by the failed runner; no earlier passing observations are reused.
Evidence directory `scheduled-arrivals-debug-20261002-r9` retains `load.log`,
`contained-window-summary.json`, `sample-summary.json`, `fixture-inspection.json`,
`helper-hashes.json`, `meter-test.log` and `HYPOTHESES.md`. Load/runner remain
byte-identical to r8; only the app probe differs. Production limits/security
checks unchanged; no spending, deployment, publication or completion claim.
After documentation updates, all 170 operator cases passed without skips in
6,594.3534 ms (`operator.log`). The retained probe test receipt reports 3 passing
cases without skips in 107.9942 ms. Formatting/diff-whitespace/requirements checks
passed; all 116 phases remain Partial, `completionProven:false`, HEAD unchanged.

## Server SQL counters separate execution from callback delays

Diagnostic r11 retains r9 app probe, image/resources/dataset/request cadence and
unchanged acceptance. Its external load copy adds read-only Performance Schema
snapshots immediately before the measured window and after requests drain. A
separate observer connection uses only the fresh isolated database's synthetic
root credential; app permissions are unchanged. The observer does not reset
counters or mutate schema/data; normal synthetic setup still seeds its fixture.
No provider actions or production code replacement. The observer emits
fixed query-class labels and validated numeric columns, not SQL/digest/sample
text or values. Statement timing/aggregation semantics were checked against the
[MySQL statement-summary documentation](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-statement-summary-tables.html).

The preceding r10 observer used the TypeScript name `accountSessions` rather than
physical table `account_sessions`, so its category-presence assertion failed.
It is retained as a **probe failure**, not a product failure or valid separated
SQL result. r11 corrects that identifier and requires both categories to exist
before starting load; enabled/timed SELECT instrumentation and digest consumer
are also explicitly checked. The original failed receipt was not overwritten.

r11 offered/started/completed all 1,500 requests: 1,438 HTTP 200, 62 active-work
503 refusals. No drops, transport/correctness/Retry-After errors or retries.
Scheduled p95/p99 200.22/401.17 ms, peak outstanding 58; unchanged gate failed.

| Measured SQL class     | Window count | Mean execution (ms) | Summed execution (ms) | Fixture maximum upper bound (ms) | Window lock total (ms) |
| ---------------------- | -----------: | ------------------: | --------------------: | -------------------------------: | ---------------------: |
| User lookup            |        1,438 |             0.30176 |              433.9295 |                           8.9817 |                  2.852 |
| Durable session lookup |        1,438 |             0.25069 |              360.4982 |                          15.9538 |                  2.808 |

Counts/totals are after-minus-before; maxima are cumulative since fixture startup,
not differences or falsely labeled exact window maxima. Each category count
matches the 1,438 successful identity requests. Each examines 1,438 rows in the
window, with zero reported SQL errors/no-index events. Historical setup had
100 user-lookup no-index events; those were excluded by counter subtraction,
not suppressed or declared absent from the fixture.

Fully contained app samples (19 / 9,620.83 ms) observed query callback max
300.53 ms, acquisition max 359.62 ms, peak 26 acquisitions, loop delay max
208.80 ms; observed GC total 692.24 ms / max 14.39 ms. Cgroup throttle delta
991.681 ms across 17/96 periods. Numeric collectors reported no callback errors,
omitted or unmatched events. These callback durations include scheduling/driver/
transport, whereas the server statements were far shorter even using lifetime
upper bounds. Slow execution of these two SQL classes does not explain the largest
callback delays in this sample. This is not proof of a particular CPU function,
pool defect, host scheduler cause, or the absence of all database/network delays.
Instrumentation may affect timings; no fixes or relaxed gates are justified yet.
Next useful step: targeted application CPU profiling on the same red-capable path,
then regression-backed repair and the original full workload.

Six external tests passed without skips (97.1025 ms): retained probe tests plus
counter-delta tests for correct cumulative subtraction, explicit maximum scope,
missing/inactive/reset/nonfinite counter refusal and private-extra-field exclusion.
Actual SQL category counts and callback records validate that both probes were
active; generated analysis assertions also match SQL counts to HTTP success.

r10 owner `cc001fd8`, r11 owner `f4329b3c`; independent inspection confirms all
six exact fixtures stopped (apps/databases exit 0, runners 1), no OOM/public ports,
correct immutable images/users, one CPU and read-only mounts. Post-load health/
memory steps were skipped on failed runners; no earlier observations substituted.
No user material deleted. Evidence directories `scheduled-arrivals-debug-20261002-r10`
and `scheduled-arrivals-debug-20261002-r11` retain logs, helper hashes and fixture
inspection; r11 additionally retains `analysis-summary.json`, analysis source,
`probe-test.log`, delta tests and hypotheses. Its bundle SHA-256 is
`7f13a0290ca7f4bde0f340a9090fdb079dd562502998c1b5e7d66b2f3a2f9fb5`;
app probe and runner are byte-identical to r9. All 116 phases remain Partial,
full mixed-load acceptance still failed, production config and budget unchanged.
After documentation updates, all 170 operator cases passed without skips in
4,595.3689 ms (`operator.log` in r11). Formatting/diff-whitespace/requirements
checks passed; HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.
Nothing committed, published, deployed or purchased.

## In-process application CPU profile: distributed work, not a proven culprit

r12 retains r11 workload, SQL counters, runtime observations and one-CPU limits.
Its external app probe additionally uses the
[Node in-process CPU profiler](https://nodejs.org/api/inspector.html#cpu-profiler),
1,000-microsecond requested sampling interval. No remote debugger listener is
opened and no production code is replaced. After load, the runner signals only
the verified app child inside its owned container to stop/capture profiling, then
performs normal shutdown. Collection errors cannot skip stopping owned fixtures.
The profile contains code frames and timestamps, not SQL/request/heap values.

Observed normal gate **failed**: 1,500 offered, 1,465 started/completed, 1,263 HTTP
200 and 202 active-work 503 refusals; 35 busy-actor drops. No late/capacity drops,
transport/correctness/Retry-After errors or automatic retries. Scheduled p95/p99
570.51/711.10 ms, peak outstanding 76. Profiling adds overhead; increased refusal
counts relative to another run do not establish a causal effect size.

User/session server execution means 0.32073/0.29884 ms, fixture-wide maximum upper
bounds 3.3029/4.8526 ms; 1,263 statements each, matching successful requests,
zero SQL errors/no-index events. Fully contained runtime samples (18 / 9,413.08 ms)
observed query/acquisition callback maxima 276.27/400.28 ms, loop delay 191.89 ms,
observed GC total/max 981.76/80.02 ms, throttle delta 2,538.286 ms across 43/94
periods. Larger client-side delays remain separate from these SQL execution times.

Local analysis selects only fully contained sample intervals in the arrival
start/completion window, using a wall-clock anchor bracket around profiler start.
Its anchor width is 45 ms; analysis also evaluates both endpoints. The
[protocol profile format](https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/js_protocol.json)
defines sample-node IDs and microsecond deltas; counts are not weighted by long
gaps and are not exact CPU-time percentages. Whole profile: 19,336 samples;
selected midpoint: 7,467, represented elapsed 9,998.88 ms. There were 46 selected
intervals at least 10 ms, totaling 1,167.205 ms, max 80.231 ms. Such gaps cannot be
assigned exclusively to executing code or interpreted as host scheduler proof.

| Leaf category         | Samples | Share of selected samples |
| --------------------- | ------: | ------------------------: |
| Idle                  |   2,023 |                    27.09% |
| Node runtime          |   1,420 |                    19.02% |
| Garbage collection    |     775 |                    10.38% |
| Native / unattributed |     728 |                     9.75% |
| Query ORM             |     582 |                     7.79% |
| Database driver       |     513 |                     6.87% |
| Other dependencies    |     470 |                     6.29% |
| RPC framework         |     445 |                     5.96% |
| Token / crypto        |     289 |                     3.87% |
| Application bundle    |     145 |                     1.94% |
| Diagnostic probe      |      77 |                     1.03% |

Endpoint analyses selected 7,466 samples each; category shares were close (e.g.
GC 10.407% / 10.394%, ORM 7.849% / 7.782%). Categories are a coarse code-location
classification, not ownership of end-to-end latency. Inclusive stack percentages
overlap; do not sum them. The profile concerns the main isolate, not all native
threads, database processes, host scheduling or total container CPU. Direct probe
leaf share does not account for all tracing/profiler overhead. GC is visible but
not proven dominant; no single leaf function explains the failure.

Source inspection identifies repeated HMAC key imports during token verification
and query construction as possible optimization experiments, not established
root causes. Session verification/revocation/deletion fences must remain intact.
Next: bounded differential measurement of a concrete redundant operation or a
lower-overhead profile before any regression-backed implementation, then rerun
the original full workload. No speculative safety-limit or host resize.

Nine external probe/delta/profile-analysis cases passed without skips in 188.23 ms.
Profile tests check measured-window selection, unweighted long-gap accounting,
clock-anchor scope, missing/invalid samples and private-extra-field exclusion.
Actual profile capture, positive driver/SQL records and generated analysis
assertions passed. Owner `d771652c`; all three exact fixtures independently
inspected stopped (app/database 0, runner 1), no OOM/public ports, correct images/
users/resource limits/read-only mounts. Failed-run post-load health/memory was
skipped, not inferred from earlier runs.

Evidence directory `scheduled-arrivals-debug-20261002-r12` retains `load.log`
(including profile), `analysis-summary.json`, `profile-summary.json`, analysis
sources/logs, `probe-test.log`, hypotheses, hashes and fixture inspection.
Load is byte-identical to r11; probe SHA-256
`052470eaf37047953cbf33e655bff41ad8f962d84962479e5388effc3a5a1d66`,
runner `ad5dad319689842c8084c60fbd91543bcdb58b742b189ae76ce7a142841773f6`.
No maintained executable code changed, no user material deleted, provider actions,
publication, deployment or spending. Full gate and 116-phase goal remain incomplete.
After documentation updates, all 170 operator cases passed without skips in
4,600.0558 ms (`operator.log`). Formatting/diff-whitespace/requirements validation
passed; all 116 phases remain Partial, `completionProven:false`, HEAD unchanged.

## Reproduction and evidence

Bundle the current `apps/cofounder-discovery/scripts/synthetic-customer-load.ts`
with esbuild into an external output directory using the existing documented
flags. Do not install it in production `dist`, point it at customer data, expose
ports or enable email/AI/platform providers. The external owned-fixture runner
uses immutable runtime
`sha256:92b0d2481ab62d421f63ce1f9bd52613b383ae7959555a5c62d840b123506216`
and MySQL
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
The added developer-only helper is mounted only in the isolated load runner;
no production app source/dist is replaced. This is not a fresh runtime rebuild.

Evidence directory:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/scheduled-arrivals-20261002-r1`.
Record exact helper/runner hashes, terminal load receipt, typechecks, unit and
operator receipts and independent fixture inspection. Synthetic credential files
are private local fixtures; do not publish their values.

Helper source SHA-256
`61db501bc3108b3002fc81d7440d5b49760e394c2ac9a42be0acb3a173cbc84b`;
combined load source `6e25916fae490c4c66931672ef2906c1d82673ee40d91323b31c9e74284d8f37`;
mounted bundle `53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`;
unchanged runner `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
Terminal receipts: `load.log`, `unit.log`, `full-unit.log`, `typecheck.log`,
`script-typecheck.log`, `helper-hashes.json`, `final-fixture-inspection.json`.
Owner `62d3a141`; independent inspection confirmed exact owner/image/user IDs,
all stopped/no OOM/no public ports. App/database exit 0; runner exit 1 is the
retained load failure, not a clean passing test:

- App `f1cfe22a97b6d3a5edece6af05be74a140fe6f327848b4f8d9e7dcab72828d8f`
- Database `6958636c5e9f38c8ec38b353f990ed77c3a41827a34e6d07b3fad52a6ddca0fe`
- Runner `e64b85eae15060186dfeae14ceb5fc46cfe69455ac45b32fb0b9967c30e0e896`

No material deleted; stopped fixtures and failed receipts remain inspectable.
After documentation updates, all 170 operator cases passed without skips in
4,545.3619 ms (`operator.log`). Formatting, diff-whitespace and requirements
checks passed; all 116 phases remain Partial and `completionProven:false`.

## Remaining boundaries

Ten seconds per rate is not a longer soak, every route or a production SLO.
Writes/exports/workers are not concurrent with these read arrivals. Real network
latency/TLS, multiple instances/fairness, hosted CPU contention, signup/inbox,
cost enforcement, operator acceptance and worldwide source coverage remain open.
The 116-phase goal remains incomplete; no publication/deployment/spending.
