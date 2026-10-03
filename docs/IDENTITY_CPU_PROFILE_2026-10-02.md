# Identity-only sampled CPU profile — October 2, 2026

## Outcome

Validated profile covered a failing identity-only burst: 1,500 offered/started/
completed, 1,482 HTTP 200 and 18 HTTP 503, zero drops/errors/retries/correctness or
retry-header failures. Scheduled p95 127.64 ms, p99 295.49 ms; start-lag p95
1.22 ms. No new own-quota CPU throttling in app, database or driver. This is not
capacity acceptance, a root-cause proof or an implemented fix.

Work is distributed across request/microtask handling, database query construction,
result handling and garbage collection. The profile does not reveal a single
dominant application function or justify removing live authorization checks.
Source inspection also confirms `getConfig(process.env)` already caches validated
runtime configuration; a speculative new configuration cache is unnecessary.

## Sampled stacks

9,521 samples, 1,312 stack nodes; profile wall interval 11,478,589 microseconds,
summed sample intervals 11,478,487 microseconds. The interval includes boundary
overhead, not exactly ten seconds. Aggregated self frames use function name, URL
and source line; inclusive aggregation counts a frame signature once per sampled
stack to avoid recursive double counting. Duplicate/generated frame signatures can
still combine distinct functions. These are sampled elapsed-interval weights and
sample counts, not exact CPU duration per function or request-causal attribution.

| Self frame                             | Interval-weighted share | Sample-count share |
| -------------------------------------- | ----------------------: | -----------------: |
| Idle                                   |                 50.139% |            51.518% |
| Garbage collector                      |                  5.858% |             5.882% |
| Drizzle entity `is`                    |                  1.766% |             1.817% |
| Native `writeBuffer`                   |                  1.696% |             1.617% |
| Inspector `post` (diagnostic overhead) |                  1.325% |             0.011% |
| MySQL promise stack capture            |                  0.851% |             0.893% |

The inspector frame's one sample carried a long interval, illustrating why
weighted shares cannot be called precise CPU costs. Inclusive shares overlap:
microtask processing 17.225%, MySQL packet handling 7.164%, Drizzle SELECT execute
6.334%, HTTP headers completion 7.205%. They must not be summed as independent
work categories. Idle sampling does not establish spare peak capacity, rule out
off-CPU scheduling or prove the absence of burst pressure.

Same scoped counters recorded 2,964 application acquisitions/commands; acquisition
mean/max 1.662/236.512 ms, command mean/max 4.033/151.774 ms; 194 enqueues/queue peak 22. DB SELECT count 2,968 (2,964 expected successful identity reads plus four
measurement/other reads), mean 0.258299 ms, lifetime max 7.697768 ms. Event-loop
p99/max 48.398/136.446 ms. App CPU core-equivalent 0.646651 over the wider measured
bracket, not the exact burst. These still do not attribute refusals to one stack.

## Boundary correction and rejected run

First profiler run (`outputs/identity-cpu-profile-20261002-r1`) produced five busy
responses, but profiler startup overran the fixed pause and the unchanged boundary
validator rejected the observation (`before.epochMs <= start marker` failed).
Its scoped profile/tier measurements are not accepted; no threshold was relaxed.
All three exact fixtures were independently inspected stopped/no OOM.

Fresh r2 helper explicitly waits for parent acknowledgement that the exact owned
app logged profiler-start before offering arrivals, and profiler-stop before the
after marker. Parent validates image/ownership while checking readiness. Original
database-before/after acknowledgements remain. Validated app before-snapshot
precedes the start marker by 167 ms; after-snapshot follows completed by 1,200 ms.
DB boundary read durations 520/1,023 ms. Startup/shutdown, sampling and handshake
overhead change timings; no like-for-like capacity improvement is claimed.
The original release workload and limits are unchanged.

Profile sample IDs, tree-parent uniqueness/cycle checks, nonnegative intervals,
sample/interval lengths, self-time reconciliation and burst containment validated.
Late start, missing sample node and negative interval receipts each failed with
an assertion. All four malformed database receipts were also rejected.

## Scope and safety

External compiled diagnostic adds a local `node:inspector` Session and only
Profiler enable/start/stop, following the [Node 22 inspector documentation](https://nodejs.org/docs/latest-v22.x/api/inspector.html#cpu-profiler).
No inspector listener, breakpoints, runtime evaluation, heap snapshot, credential
or request-body capture. Raw sampled stacks contain static call frames, not local
variable values. Profiler session disconnects after stopping.
Diagnostic image `sha256:dcf31cfdd3d3e4779d632f3c53fb580e0fb484c8b5f68c018444607e7115da59`;
local no-network build, restricted Docker context, verified preceding base. MySQL
image unchanged. No product source or dependencies changed.

App two CPUs, DB/probe one; read-only/non-root/256-PID fixtures. App/probe 512 MiB,
320-MiB old-space; DB 2 GiB/1-GiB tmpfs. Probe's fourth mount is read-only boundary
acknowledgements; no app replacement, host PID space, public ports, provider
actions, real outreach, purchases, deployment or publication. Retained real
migration/startup/login/session-quota checks, 100 synthetic owners/10,000 candidates
and 300 wrong-owner denials. Earlier tiers/warmup/later writes/races remain omitted.

Owners `a8c17790` (rejected r1) and `1cfa1bed` (validated r2): all six exact fixtures
independently inspected stopped/no OOM; app/DB exits 0, probes 1. Post-failure
memory/health steps skipped and not inferred. R2 evidence directory:
`outputs/identity-cpu-profile-20261002-r2`, including workload, raw profile,
profile-summary/analyzer, database/scoped measurements, snapshots, acknowledgements,
fixture validation and seven rejected malformed receipts. R1 retains isolated
compiled app/build receipts and rejected-boundary evidence.
Compiled SHA-256 `6b6dc4c1ce30d602f4f3c77760a46a0c57af633ce19b15aa1b025e9f5ed4982e`;
r2 helper `08d234a29923311b8fd9d4912e43d5420b230644bc5e6eaa353d2342b739a6c0`;
r2 runner `af68dd75b88f4283d46f9a8985569b6cc86c894fde68b114100432037115e053`.

See [database boundary history](IDENTITY_DATABASE_BOUNDARY_2026-10-02.md).
Next engineering candidate: measure whether reusing stable authentication query
construction reduces repeated work, without caching results or bypassing durable
revocation/deletion fences. A correct red regression seam and unchanged complete
qualification are required before calling any optimization a capacity fix.
All 116 phases remain Partial; completion remains unproven.
The subsequent [query-construction reuse increment](AUTH_QUERY_REUSE_2026-10-02.md)
implements that bounded optimization with actual red/green regressions and fresh
focused MySQL checks. Its full runtime/load qualification remains pending.

After recording the accepted/rejected observations, all 171 operator cases
passed without skips (3,794.1201 ms; r2 `operator.log`). Formatting,
diff-whitespace and 116-phase traceability passed. HEAD remains
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit, merge or push.
