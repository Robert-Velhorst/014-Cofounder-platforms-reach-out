# Identity-only CPU quota experiment — October 2, 2026

## Result: two application CPUs are not a reliable fix

Added read-only cgroup CPU counters at the same diagnostic boundaries to separate
application-quota observations from test-driver observations. The one-CPU sample
failed. Changing only the app allowance to two CPUs produced one pass, then an
unchanged repeat failed. Retain both results; do not promote the first pass to
capacity approval or claim the observed throttling is the sole cause.

All samples offered/started/completed 1,500 real authenticated identity requests
at 150/s for 10 s, with zero late/capacity/actor drops, transport failures, retries,
correctness errors or bad retry headers. Same no-warmup helper and diagnostic
image; database/driver remained one CPU and all safety/memory limits unchanged.

| Sample                       | HTTP 200 / 503 | Scheduled p95 | App throttled periods / periods | App throttled time | Driver throttled time |
| ---------------------------- | -------------: | ------------: | ------------------------------: | -----------------: | --------------------: |
| App 1 CPU                    |     1,484 / 16 |     156.79 ms |                        14 / 101 |         849,706 us |                  0 us |
| App 2 CPUs, first            |      1,500 / 0 |      68.67 ms |                         2 / 101 |          23,057 us |                  0 us |
| App 2 CPUs, unchanged repeat |    1,368 / 132 |     468.33 ms |                         2 / 101 |          74,022 us |                  0 us |

The application quota was `100000 100000`, then `200000 100000`; driver quota
remained `100000 100000`. Counter deltas, not startup totals, are reported.
Start-lag p95 respectively 1.33/1.21/1.17 ms. The counters show own-cgroup bandwidth
throttling, not total host/ancestor interference; absence of driver throttling
does not exclude other driver or host effects. These semantics follow the
[Linux kernel cgroup-v2 CPU documentation](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html#cpu).
Do not interpret summed throttled time as request latency or proof of CPU saturation.

## Scoped timing observations

| Sample         | Acquisition count, mean / max | Command mean / max | Enqueues / queue peak | App CPU core-equivalent | Event-loop p99 / max |
| -------------- | ----------------------------- | ------------------ | --------------------- | ----------------------: | -------------------- |
| 1 CPU          | 2,968; 2.250 / 197.493 ms     | 4.752 / 103.346 ms | 217 / 22              |                   0.719 | 57.901 / 102.236 ms  |
| 2 CPUs, first  | 3,000; 0.365 / 101.640 ms     | 2.370 / 70.844 ms  | 92 / 10               |                   0.702 | 35.488 / 49.381 ms   |
| 2 CPUs, repeat | 2,736; 12.425 / 193.529 ms    | 9.316 / 100.410 ms | 407 / 22              |                   0.834 | 82.117 / 97.911 ms   |

Two acquisitions/commands per successful call reconciled in each sample. All
boundary work had settled; zero synchronous command errors. Before/after snapshots
bracketed completed bursts; interval lengths 10,100.604/10,101.329/10,141.020 ms,
including quiet signal margins. Cgroup observations have their own timestamped
windows, not assumed exact simultaneous readings. Event-loop monitor resolution
20 ms. Pool acquisition includes callback scheduling/setup; command lifetime is
not pure SQL execution. Aggregates have no per-refusal causal attribution.
The repeat contradicts a reliable quota-only solution and emphasizes shared
database waiting/scheduling still to distinguish. Database CPU throttling and
server SQL execution were not measured in this experiment.

## Scope and safety

External-only compiled diagnostic app adds fixed reads of `cpu.stat`/`cpu.max`
to the previous scoped pool diagnostic. Probe reads only its own cgroup at the
boundary. Both retain two same-UID private-PID signals/100-ms quiet margins.
No host PID access or instrumentation in product source. New isolated image:
`sha256:8fb0d26d987d1c8421c24ea426490882ca61a4f48e863656399bb0514ee0cc51`,
based on verified previous diagnostic `5c00369c215fc309d342215f280d2cd101b6094ce617336b685cce0e7cca7cd0`.
Not a release candidate. Initial Dockerfile hash-as-FROM attempt failed metadata
resolution; successful build used the verified existing local tag, legacy builder,
network disabled, and an allowlist context containing only Dockerfile/index.js.
No runtime dependency or safety-limit change.

Retained real migration/startup/login, durable login-quota checks, 100 synthetic
owners/10,000 candidates and 300 wrong-owner denials. Earlier tiers, warmup and
later writes/races/overload remain omitted; original full release gate unchanged.
Read-only/non-root/256-PID fixtures; app/probe 512 MiB/320-MiB old-space, DB
2 GiB/1-GiB tmpfs, no app replacement mounts/public ports/provider actions/real
outreach/spending/deployment/publication. MySQL exact image unchanged. Changing
isolated app CPU was a diagnostic comparison, not production sizing approval.

Owners `e8f89502`, `b3753efa`, `d5df4e0c`: all nine exact fixtures independently
inspected stopped/no OOM. App/DB exits 0; probes 1/0/1 respectively. Only the passed
sample reached post-load memory/health observations; both health/readiness were
200 there. Failed samples skipped those steps and are not inferred.

Evidence directories: `outputs/identity-cpu-quota-20261002-r1`,
`outputs/identity-cpu-quota-two-app-cpu-20261002-r1` and `...-r2`, each with workload,
snapshots, validated tier measurement, analysis and fixture receipts. Primary
directory retains isolated build receipts, Dockerfile, compiled/helper diffs and
hashes. Five deliberately invalid receipts (late snapshot, unfinished boundary,
wrong bin sum, wrong quota, decreasing CPU counter) were rejected with assertions.
The two-CPU helper/runner were byte-identical on repeat.

Compiled diagnostic SHA-256 `a9e81418cc282240bfb03a79f7c2dfb8da77ff19a36dd7b5022e7c2daa5bea9c`;
helper `9b6dd4b9b0aa8f9f6e593052ef623aac99cd9100f46dd5dd5a45b882656d8829`;
one-CPU runner `fdb6ed5c682a5008162d70057896de9a6e71acff7006195db7bfc5d1fe9aebe4`;
two-CPU runner `ce73bd8a9fbee5d11fb8511bcdea73960f394ffa8457d5f9cd56c9fadb4b10e4`.
See [preceding measurement](IDENTITY_TIER_MEASUREMENT_2026-10-02.md).
All 116 original phases remain Partial and completion remains unproven.
Subsequent [database boundary measurement](IDENTITY_DATABASE_BOUNDARY_2026-10-02.md)
failed with 117 busy responses, no new DB throttling and short measured SELECTs;
delays outside those server-side events remain to isolate.

After recording all three outcomes, all 171 operator cases passed without skips
(6,792.2211 ms; primary evidence directory `operator.log`). Formatting,
diff-whitespace and 116-phase traceability checks passed. Git HEAD remains
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit, merge or push.
