# Isolated pool-wait diagnostic — October 2, 2026

## Finding and decision

The first aggregate diagnostic's full unchanged synthetic workload failed its 150-requests/second
all-success gate: 1,426 HTTP 200 and 74 HTTP 503 responses. All requests started
and completed, with no late/capacity/actor drops. Aggregate measurements show
both connection-pool waiting and substantial application processing/scheduling
pressure. They do not identify a single root cause or justify a production fix.

The next measurement must isolate the failing arrival tier and distinguish
connection acquisition, command completion and application scheduling there.
Do not enlarge the production pool, remove account/session checks, increase
admission limits or relax acceptance thresholds from these aggregate observations.

## Subsequent tier-specific boundary measurement

A second isolated diagnostic reproduced the failure with **1,475 HTTP 200 and
25 HTTP 503** at 150/s, still a failed all-success gate. All 1,500 requests started
and completed with no late/capacity/actor drops, no automatic retries, correctness,
transport or retry-header errors. Scheduled p95 143.00 ms, p99 393.74 ms; start-lag
p95 1.16 ms. This does not establish improvement, a fixed cause or supported capacity.

The full RPC/read/write/race/isolation workload and thresholds were retained,
but the external helper gained two boundary markers and 100-ms diagnostic pauses.
The generator shared only the owned app container's private PID namespace. It
required UID 1000 and exactly one UID-1000 process with the exact two-argument
`/app/dist/index.js` command before sending SIGUSR2. No host PID namespace,
privileged mode, host process signals or new public endpoint. The diagnostic
image's dedicated handler emitted cumulative aggregate snapshots and reset only
interval maxima/event-loop histograms—not work, admission or pool state.
This is not byte-identical release qualification; boundary quiet time and
instrumentation can affect scheduling. No application-source or production setting changed.

Three actual snapshots were retained: before the tier, after completion, and
shutdown. The receipt analyzer verified exact sequence/reasons, timestamp
bracketing, unchanged ten-connection pool, zero active acquisitions/commands at
both boundaries, matching started/settled totals and histogram counts. The first
snapshot preceded the generator's start marker by 100 ms; the second followed
completion by 1 ms. The measured interval was 10,159.459 ms, including the small
boundary margins. No unfinished earlier measured work crossed either boundary.
Thus these differences exclude earlier overload and later writes, unlike the
first whole-workload aggregate.

| 150/s interval measurement    | Acquisition | Connection command completion |
| ----------------------------- | ----------: | ----------------------------: |
| Started and settled           |       3,750 |                         5,950 |
| Mean milliseconds             |       2.196 |                         2.767 |
| Interval maximum milliseconds |     171.992 |                       160.589 |
| Summed occupied milliseconds  |   8,235.773 |                    16,461.840 |

There were **229 enqueue events** (6.107% of acquisition starts), peak queue
**22**, zero synchronous command errors. Acquisition and command counts are
not one-to-one or request counts. CPU delta was 6,328,145 user + 740,896 system
microseconds: **0.696 CPU-core equivalent** over this interval. Event-loop
histogram since the first snapshot, at 20-ms resolution: p50 20.152, p95 35.258,
p99 53.281, maximum 118.555 ms. It includes the short boundary idle margin and
does not directly measure CPU throttling or database-server execution.

These numbers contradict treating the earlier 46.393% whole-load queued-acquisition
fraction or 0.934-core average as this tier's figures. They do not show sustained
full-core saturation in the measured interval, but averages hide short processing,
pool or scheduling bursts. Long-tail waits and transient queue growth remain.
Per-route/time-window correlation and a smaller red-capable reproduction are the
next diagnostic step before proposing a fix. No security check, limiter, queue
ceiling, pool connection count or arrival threshold was changed.

Retained closed-loop tiers 5/20 each passed 6,000 HTTP 200; concurrency 100 returned
888 HTTP 200/5,112 controlled HTTP 503. Scheduled 50/s passed all 500 responses.
500/s started 3,938/5,000 (1,524 HTTP 200/2,414 HTTP 503), with 1,062 actor drops
and no late/capacity drops; controlled overload passed, not 500/s customer capacity.
Both write tiers passed 3,000 committed changes, 1,000 unchanged replays and
1,000 stale conflicts each, including independent rows/audits. All 200 paired
edit races and 400 wrong-owner mutation refusals passed; final 10,000 candidates
and 6,200 audit rows were preserved. These do not override the failed 150/s gate.

Evidence: `outputs/tier-pool-diagnostic-20261002-r1`, including `load.log`,
`snapshots.jsonl`, `tier-measurement.json`, `analysis.log`, `fixture-inspection.json`,
`workload-summary.json`, `hashes.json`, three code diffs and external `analyze.mjs`.
Three deliberately corrupted receipt copies (late pre-boundary timestamp,
unfinished acquisition, wrong histogram total) each failed an assertion with exit
1 and emitted no accepted measurement; `negative-receipts.json` and their uniquely
owned directories are retained. These are analyzer negative checks, not additional
load runs or app scenarios.

Diagnostic image `sha256:5c00369c215fc309d342215f280d2cd101b6094ce617336b685cce0e7cca7cd0`;
compiled diagnostic hash `99b2d66697164ca785c1d87cd6f349c29ee28690809d6e822fe6d6624e228f53`;
marked load helper `728daf78153e98abf702c20e85108bc5bad1e1932017bd8317f61aadbb88f3f8`;
external runner `b39bb2c28b93731eb55e7774c9f6882df5fe039b8618047fadcd034daa99c710`.
Original runtime, unchanged MySQL, CPU/memory/PID/old-space ceilings are those
listed below. Owner `70530416`; all three exact fixtures independently inspected
stopped, no OOM/public ports, app/database exit 0 and runner exit 1. The extra
PID namespace was verified to reference only that exact owned app ID. No app
replacement mounts. Post-load health/memory steps remained skipped after failure.
Owner-labelled assembly container
`67992c6f5f5c221a451193ac206091d8168339d8f2e5cfd0adc2cd34cd4ef9f2`
was network-disabled, created stopped and never started. All diagnostic artifacts
stay local, clearly marked and not used by default tests or release configuration.
No publication, deployment, provider action, spending or phase-completion claim.
After recording this boundary measurement, all 171 operator cases passed without
skips (3,709.9322 ms), `operator.log` in its evidence directory. Formatting,
diff-whitespace and 116-phase traceability checks passed; completion remains
unproven. Original runtime/SDK/admission-helper hashes and Git HEAD remain unchanged.

## Scope and preserved controls

A subsequent [staged reproduction reduction](ARRIVAL_REPRO_MINIMIZATION_2026-10-02.md)
retained the failure on the original uninstrumented runtime without earlier load
tiers. The final reduced helper failed twice, runner lifetimes about 28 seconds
plus external setup/cleanup. It is a diagnostic loop, not replacement acceptance
or proof of a root cause; its original six-route burst remains to correlate.

An external compiled copy from original runtime
`sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`
was instrumented into local diagnostic image
`sha256:9518a4e2f03fae3a982f16b83d625baa9c5064827cb3e2b538a738ded9f86e7d`.
It is not a release candidate. Application source and original image stayed unchanged.
Only bounded aggregate instrumentation was added to the real application's pool
creation/connection methods and shutdown. No SQL, row values, identities, headers,
cookies, credentials or error objects were collected. One aggregate JSON record
is emitted after pool shutdown. Callback arguments/receivers, command returns,
admission/security decisions and original error handling are preserved.

The three diagnostic predictions were: queued acquisitions/long acquisition waits
for pool pressure; longer command completion for command pressure; event-loop
delays for scheduling pressure. This is an instrumented measurement, not a
single-variable resource benchmark. Measurement overhead remains a limitation.
The established full failing workload was retained rather than prematurely
minimized; a fast minimized regression/root-cause loop remains unfinished.

Load/runner remained byte-identical to the original qualification harness.
Application/database/runner stayed one CPU each, app/runner 512 MiB, app old-space
320 MiB, database 2 GiB with 1-GiB tmpfs, 256 PIDs, non-root/read-only. Database
network was disabled; other fixtures shared only its namespace. No public ports,
application replacement mounts, providers, purchases or shared-service changes.
The app had only two read-only synthetic-secret mounts. Production defaults and
all workload/arrival/correctness thresholds were unchanged.

## Instrumentation qualification

The unchanged maintained authentication-admission integration ran first against
the diagnostic image. It passed without skips: 20,664.9358 ms (process
20,767.2375 ms), including held real MySQL authentication queries, excess refusal,
disconnect-through-settlement accounting, recovered capacity and health/readiness.
Its preflight counters settled cleanly: 13 acquisitions, 34 connection commands,
zero queued acquisitions or synchronous command errors. This small check is not
capacity proof or an exhaustive instrumentation-equivalence test.

## Full-workload measurements

Actual runtime pool: connection limit **10**, waiting enabled, driver queue limit
**0** (no driver queue-size ceiling). The separate application-work ceiling
remained 32; a zero driver queue limit does not mean no waiting or unlimited
admitted application work. Observed peak acquisition queue was **22**.

| Measurement                  | Acquisition | Connection command completion |
| ---------------------------- | ----------: | ----------------------------: |
| Started and settled          |      83,915 |                       203,378 |
| Active at shutdown           |           0 |                             0 |
| Summed occupied milliseconds | 953,108.894 |                 1,350,846.862 |
| Mean milliseconds            |      11.358 |                         6.642 |
| Maximum milliseconds         |     996.413 |                       582.879 |

There were **38,931 enqueue events** (46.393% of acquisition starts) and no
synchronous command errors. Histogram bucket totals equal settled counts.
Acquisition measures invocation through callback, including queueing, initial
connection setup and event-loop scheduling. Connection-command duration measures
`query`/`execute` invocation through the driver's `end` event, including client
protocol/connection scheduling and callback processing—not pure database-server
execution. Transactions can reuse a connection for multiple commands, so these
counts and durations are not one-to-one or per-request averages. Summed occupied
time overlaps across concurrent work and must not be treated as CPU time.

From pool creation to shutdown: 225,082.174 ms elapsed; application process CPU
190,820,616 user + 19,409,417 system microseconds, about **0.934 CPU-core equivalent**
over that interval. Event-loop monitor resolution was 20 ms: p50 20.791, p95
52.986, p99 98.959, maximum 411.304 ms. These timer-delay observations have a
nominal sampling interval; they are not request latencies or direct CPU-throttling
measurements. No database/load-generator CPU attribution was collected.

The whole-load aggregates include overload, warmup and writes. They cannot prove
that pool waiting or CPU pressure caused the 150/s failure specifically. Likewise,
74 refusals versus earlier samples is not statistical improvement from instrumentation.

## Retained acceptance results

Closed-loop concurrency 5/20 each passed all 6,000 responses. Concurrency 100
returned 947 HTTP 200 and 5,053 controlled HTTP 503. Scheduled 50/s passed all
500 responses. Scheduled 150/s failed as stated above, scheduled response p95
288.23 ms and start-lag p95 1.13 ms. At 500/s, 4,015/5,000 started, 1,758 HTTP
200/2,257 HTTP 503, 985 actor drops and no late/capacity drops; controlled-overload
rules passed, not 500/s successful customer capacity. No transport, correctness
or retry-header errors were reported for those tiers.

Both write tiers passed their 3,000 committed changes, 1,000 unchanged replays
and 1,000 stale conflicts each, with independent rows/audit checks. All 200 paired
edit races and 400 wrong-owner mutation refusals passed. Final isolation checks
preserved 10,000 candidate rows and 6,200 audit rows. These do not override the
failed arrival gate. Post-load health/memory steps in the unchanged full runner
were skipped after its failure and are not inferred from the preflight.

## Evidence and terminal state

Evidence directory under the task output root:
`outputs/pool-wait-diagnostic-20261002-r1`. Retain `load.log`, `pool-metrics.json`,
`workload-summary.json`, `fixture-inspection.json`, `receipt-consistency.json`,
`instrumentation-admission-check.log`, `preflight-metrics.json`,
`instrumentation.diff`, `hashes.json`, external compiled copy/helpers.

Compiled diagnostic SHA-256
`c74d5cfb80e683690d33932ef1f215e58d3ab9a77e2bb43b9a0063e1ea379d76`;
unchanged full load
`53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`;
unchanged runner
`3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.

Owners `ca1decf7-c1b6-490c-9208-1f84262f5d8c` (preflight) and `5d154195`
(full load). All six exact fixtures independently inspected stopped, no OOM or
public ports. The full runner exited 1; all other fixtures exited 0. Inspection
and receipt checks confirmed exact images, owner labels, CPU/memory/PID limits,
users and read-only roots. The assembly container
`03a642ffed4e62e1d9c1ed415d6fac6360a119450de2b41d568c540aa8be954b`
was owner-labelled, network-disabled, created stopped and never started.
Diagnostic containers/image are retained locally, not selected by default tests.
`DEBUG-pool-wait-20261002` instrumentation exists only in the clearly marked
external diagnostic copy/image; repository apps/scripts contain none.

No production qualification, code fix, publication, deployment or spending is
claimed. All 116 original phases remain Partial; completion remains unproven.

After recording the findings, all 171 operator cases passed without skips
(3,977.7162 ms), `operator.log` in the diagnostic evidence directory. Formatting,
diff-whitespace and 116-phase traceability checks passed. Original runtime,
SDK and maintained admission-helper hashes were rechecked unchanged; Git HEAD
remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. These checks do not replace
the failed full-load acceptance gate.
