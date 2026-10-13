# Identity-only burst measurement — October 2, 2026

## Outcome

The no-warmup identity-only 150/s diagnostic failed again: 1,500 offered, started
and completed calls; 1,451 HTTP 200 and 49 HTTP 503. Zero drops, transport failures,
automatic retries, correctness errors or invalid retry headers. Scheduled-response
p95 175.10 ms, p99 505.46 ms; start-lag p95 1.15 ms, p99 2.60 ms.

The scoped measurements observed both database acquisition/command tails and
event-loop delay. They do not identify which caused the refusals. Average measured
CPU use was below one core, not proof of sustained saturation or spare peak
capacity. This is diagnostic evidence, not an application fix or release approval.

## Measurements scoped to this burst

Before/after cumulative snapshots bracketed the burst, with zero unfinished
acquisitions/commands at both boundaries. Snapshot-before precedes the start
marker by 100 ms; snapshot-after follows completed marker by 1 ms. Interval:
10,100.798138 ms, including the disclosed quiet boundary margin.

| Metric                    | Count |        Mean |       Maximum |
| ------------------------- | ----: | ----------: | ------------: |
| Pool acquisition          | 2,902 | 3.489897 ms | 146.969540 ms |
| Database command lifetime | 2,902 | 5.591503 ms | 215.068994 ms |

There were 275 enqueue events (9.476% of acquisitions), queue peak 22 and zero
synchronous command errors. Acquisition totals 10,127.680056 ms; command totals
16,226.542205 ms. These are overlapping summed durations, not elapsed runtime.
The 2,902 acquisition/command pairs reconcile to two live database reads per
successful identity request (user lookup, session/deletion-fence lookup). No
authorization decision or user/session result was cached or bypassed.

Application CPU: user 6,916,854 microseconds, system 463,413 microseconds;
0.730662 core-equivalent over the interval. Event-loop timer observations at
20-ms monitor resolution: p50 20.201471 ms, p95 32.849919 ms, p99 79.888383 ms,
maximum 142.606335 ms. These are not request latencies or CPU-throttle measures.
Acquisition time includes pool/setup/callback scheduling; command lifetime
includes protocol/callback scheduling and is not pure server SQL execution time.
The snapshot has no per-refusal attribution. Low driver start lag/no drops argues
against observed late-start failure here, but does not exclude other driver or
shared-host effects. One measured sample cannot establish causality.

## Experiment and safety

Reused the previously reviewed isolated tier-pool diagnostic image
`sha256:5c00369c215fc309d342215f280d2cd101b6094ce617336b685cce0e7cca7cd0`,
not the release image. Its aggregate counters and boundary snapshots change
measurement overhead. The external helper adds two same-UID signals and 100-ms
boundary pauses to the [no-warmup identity reproduction](ARRIVAL_SINGLE_ROUTE_DIAGNOSTIC_2026-10-02.md).
Real migration/startup, 100 synthetic accounts/10,000 candidates, real HTTP login,
durable login-quota checks and 300 wrong-owner denials remained. Earlier tiers,
warmup, later overload/writes/races are omitted. The original complete acceptance
workload, production app source and admission/pool/resource limits stayed unchanged.

All three fixtures: one CPU, read-only, non-root, 256 PIDs. App/probe 512 MiB,
320-MiB Node old-space; MySQL 2 GiB/1-GiB data tmpfs. Probe shares only its uniquely
owned app's private PID namespace, not host PID space; signal target requires
exact `/app/dist/index.js` arguments and UID 1000. App has only read-only secret
mounts, no application replacement. No public ports, provider actions, real
outreach, spending, deployment or publication. MySQL image unchanged:
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.

Owner `7cfc67d9`: all three exact fixtures independently inspected stopped/no OOM,
app/database exit 0, probe exit 1. Post-failure health/memory checks were skipped,
not inferred. Three snapshot sequences/reasons/timestamps, completed counts,
histogram sums/deltas and selected-route block totals validated. Deliberately
late before-snapshot, unfinished boundary and wrong-bin total receipts each
failed with an assertion; none was accepted.

Evidence: `outputs/identity-tier-pool-20261002-r1`: load log, three snapshots,
validated `tier-measurement.json`, analysis, fixture receipt/validation,
negative receipts, helper/runner diffs and initial/final hashes.
Helper SHA-256 `152d72ba79445460454ba1e58822f672cae672bf158f02dd0537a75ea18471e3`;
runner `fdb6ed5c682a5008162d70057896de9a6e71acff7006195db7bfc5d1fe9aebe4`;
reviewed diagnostic compiled app `99b2d66697164ca785c1d87cd6f349c29ee28690809d6e822fe6d6624e228f53`.
No temporary instrumentation was added to product source.

Next: distinguish SQL execution, process scheduling and shared-host/container
throttling during the failing burst. Do not remove durable revocation/fence checks,
increase safety limits or infer a route-specific cache fix from these averages.
All 116 phases remain Partial and completion remains unproven.
Subsequent [CPU quota counters/comparison](IDENTITY_CPU_QUOTA_2026-10-02.md)
found application throttling; a two-CPU pass failed on unchanged repeat. The cause
and reliable capacity fix remain unresolved.

After recording the measurement, all 171 operator cases passed without skips
(4,277.2574 ms; evidence-directory `operator.log`). Formatting, diff-whitespace
and 116-phase traceability checks passed. Initial/final helper/runner hashes
matched. HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit,
merge or push occurred.
