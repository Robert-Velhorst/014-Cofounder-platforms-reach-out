# Identity-only database boundary measurement — October 2, 2026

## Outcome

The diagnostic failed with 117 HTTP 503 responses: 1,500 offered, 1,496 started
and completed, 1,379 HTTP 200, four same-actor starts suppressed. No transport
failures, retries, late/capacity drops, correctness errors or invalid retry headers.
Scheduled p95 439.01 ms, p99 615.20 ms; driver start-lag p95 1.68 ms.

Database own-quota throttling did not increase during its bracketing window.
Measured server-side SELECT time was much shorter than the app-observed database
command lifetime. This challenges explaining this sample by slow measured SELECT
execution or the database's own CPU quota alone. It is not a complete causal
diagnosis, reliable fix or production acceptance.

## Direct database observations

Read-only root observations were confined to the exact uniquely owned synthetic
database. No grants, instrumentation configuration, resets or data mutations.
Performance Schema and `statement/sql/select` ENABLED/TIMED were verified on both
boundaries. Only numeric aggregate counts/timers were retained, no statement
texts, digests, rows or authentication payloads.

| Database observation                         |            Delta/value |
| -------------------------------------------- | ---------------------: |
| Own CPU quota                                |        `100000 100000` |
| CPU counter window                           |              10,994 ms |
| CPU usage                                    | 1,320,585 microseconds |
| CPU periods                                  |                    110 |
| New throttled periods / time                 |     0 / 0 microseconds |
| SELECT count                                 |                  2,762 |
| Expected successful identity reads           |                  2,758 |
| Additional measurement/other SELECTs         |                      4 |
| Summed SELECT time                           |          916.535533 ms |
| Mean SELECT time, including additional reads |            0.331838 ms |
| Cumulative SELECT maximum after burst        |            6.956631 ms |

The maximum is the database's cumulative maximum, not a subtracted interval
maximum. It is an upper bound for the timed SELECTs collected so far, including
preparation; no timing table was reset. Count coverage reconciles to two real
reads per successful identity plus four additional measurement/other SELECTs;
there is no per-statement identity mapping in this aggregate. Server timings are
event durations, not pure CPU time, and are not end-to-end RPC latency. Units and
aggregate semantics follow the [MySQL statement-summary documentation](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-statement-summary-tables.html)
and [event-timing documentation](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-timing.html).

App-side measured acquisition: 2,758, mean 14.707269 ms/max 232.772705 ms;
commands: 2,758, mean 13.026630 ms/max 134.532708 ms. Enqueues 675, queue peak 22,
zero synchronous command errors. Event-loop p99 88.866815 ms/max 130.482175 ms
(20-ms monitor resolution). Application own throttling: three periods/166,084
microseconds, driver none. Application CPU 0.837759 core-equivalent over its
10,972.874537-ms bracket, including disclosed boundary overhead.

Different scopes and observation overhead mean these averages are not an exact
per-request decomposition. Pool/command lifetimes include application/protocol/
callback scheduling, not only SQL. Ancestor/shared-host delays, processing before
or after timed statements and driver/socket scheduling remain unseparated.

## Boundary design and limitations

The external probe requests an observation before and after the burst, then
waits for the parent runner's acknowledgement in a fresh read-only-mounted
directory. The parent validates database owner/image/running state, reads its CPU
counters and SELECT summary, saves a receipt, then writes the acknowledgement.
Before/after DB observation durations were 458/581 ms. The first observation
completed before the burst start marker; the second started after all started
calls completed. Database counters therefore include boundary observation work.
Application snapshot-before preceded its marker by 100 ms; snapshot-after
followed completed marker by 670 ms, due to the database observation handshake.
The bracket is wider than the ten-second burst and must not be presented as an
exact ten-second CPU average. The handshake and extra reads can perturb timing.

Application/acquisition counters settled at both boundaries, and all route/block
totals, status/drop arithmetic, snapshot ordering and monotonic CPU/timer deltas
validated. Four malformed receipts (late DB-before, untimed SELECTs, decreasing DB
CPU count, insufficient SELECT coverage) each failed with an assertion.

## Scope, safety and evidence

Same isolated diagnostic image as the preceding CPU-quota comparison:
`sha256:8fb0d26d987d1c8421c24ea426490882ca61a4f48e863656399bb0514ee0cc51`.
MySQL: `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
App two CPUs, DB/probe one; app/probe 512 MiB/320-MiB Node old-space, DB
2 GiB/1-GiB tmpfs, read-only/non-root/256-PID fixtures. App has only its two
read-only secret mounts. Probe's fourth read-only mount contains only fresh
boundary acknowledgement files. Only owned private app PID namespace, no host
PID access, public ports, provider actions, spending or real outreach.

Retained real migrations/startup/login, durable login-quota checks, 100 synthetic
owners/10,000 candidates and 300 wrong-owner denials. No warmup/prior load tiers,
later overload/writes/races; original complete acceptance workload untouched.
No product code, authorization decisions, safety limits or database permissions
changed. Not a release package or sizing approval.

Owner `89ffe632`: all three exact fixtures independently inspected stopped,
no OOM; app/DB exits 0, probe exit 1. Post-failure memory/health steps skipped,
not inferred. Evidence: `outputs/identity-database-boundary-20261002-r1`, including
load log, database-before/after receipts, acknowledgement files, three app
snapshots, validated tier receipt/analyzer, fixture inspection, negative receipts,
helper/runner diffs and initial/final hashes.
Helper SHA-256 `7a89d8b23b360362195f143a73099b9b05b0ed65150dfd229566c9fb90560f64`;
runner `dcf35356e67296e9de445569e911ec6323d54e32c79228e863fc0f23b1edaf01`.

Next: isolate application processing/protocol/scheduling delays while preserving
live session revocation/deletion fences. SQL caching, dropping account checks or
raising admission limits is not justified by these measurements.
All 116 original phases remain Partial; completion remains unproven.
Subsequent [sampled application profile](IDENTITY_CPU_PROFILE_2026-10-02.md)
reproduced 18 busy refusals with no new own-quota throttling in app, DB or driver.
A mistimed first capture was rejected; explicit readiness acknowledgements made
the next observation valid. No single-function cause or capacity fix established.

After recording results and consolidating the README status/history links, all
171 operator cases passed without skips (4,202.6106 ms; evidence-directory
`operator.log`). Formatting, diff-whitespace and 116-phase traceability passed.
Initial/final helper/runner hashes matched. HEAD remains
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit, merge or push.

Diagnostic history: [pool timing](POOL_WAIT_DIAGNOSTIC_2026-10-02.md),
[shortened reproduction](ARRIVAL_REPRO_MINIMIZATION_2026-10-02.md),
[route correlation](ARRIVAL_ROUTE_DIAGNOSTIC_2026-10-02.md),
[single-route/no-warmup samples](ARRIVAL_SINGLE_ROUTE_DIAGNOSTIC_2026-10-02.md),
[scoped identity timing](IDENTITY_TIER_MEASUREMENT_2026-10-02.md),
[CPU quota comparison](IDENTITY_CPU_QUOTA_2026-10-02.md).
