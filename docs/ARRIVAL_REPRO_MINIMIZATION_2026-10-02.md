# Shorter arrival-failure reproduction — October 2, 2026

## Result

The 150-requests/second all-success failure can be reproduced without the earlier
closed-loop load tiers or the preceding 50/s arrival tier. The final shorter
version failed twice, unchanged, on fresh isolated fixtures: 108 and 55 busy
responses out of 1,500 requests. Its load-runner container lifetime was 28.151
and 28.818 seconds, including its readiness/data/login/warmup checks and target
burst, but excluding earlier database setup and later container cleanup.

This provides a faster **diagnostic** feedback loop, not a production capacity
fix, a replacement acceptance test, a statistical reproduction-rate claim or a
proof that every remaining element is load-bearing. Refusal counts vary. The
original complete acceptance gate remains failed and unchanged.

## Staged reductions and observed evidence

Each reduction changed only an external copy of the existing synthetic helper.
The actual application was the original **uninstrumented** packaged runtime,
with no boundary pauses, PID sharing, debugger, source replacement or mock SDK.
Reductions were applied sequentially, after the previous owned run stopped.

| Trial     | Additional reduction                                          | 150/s HTTP 200 | HTTP 503 | Runner lifetime seconds |
| --------- | ------------------------------------------------------------- | -------------: | -------: | ----------------------: |
| r1        | Omit earlier closed-loop reads                                |          1,483 |       17 |                 120.367 |
| r2        | End immediately after 150/s; omit later overload/writes/races |          1,462 |       38 |                  38.076 |
| r3        | Omit preceding 50/s arrival tier                              |          1,392 |      108 |                  28.151 |
| r3 repeat | None; unchanged helper repeated                               |          1,445 |       55 |                  28.818 |

Every 150/s sample started/completed all 1,500 offered requests, without automatic
retries, transport/correctness/retry-header errors or late/capacity/actor drops.
Each failed because its predeclared normal-tier rule permits only HTTP 200, not
because of an unrelated fixture/startup failure. Final r3 scheduled response p95
347.39/229.71 ms; start-lag p95 1.12/1.16 ms. These timings are point-in-time samples,
not an optimization benchmark or supported customer throughput.

r1 retained all arrival tiers and all original write/race/isolation checks. Both
write tiers passed their 3,000 committed changes, 1,000 unchanged replays and
1,000 stale conflicts each, with independent rows/audits. All 200 paired edit
races and 400 wrong-owner mutation refusals passed, preserving final 10,000
candidate rows/6,200 audit rows. r2/r3 intentionally did **not** run those later
checks; r1's result is not represented as their result. The original complete
workload remains the required acceptance scope after any eventual fix.

## Retained real path and safety boundaries

A subsequent [route/block diagnostic](ARRIVAL_ROUTE_DIAGNOSTIC_2026-10-02.md)
ran the same shortened mix twice with bounded helper counters. Both remained
red; longer list/catalogue tails and cross-block overlap were measured, not
attributed as a root cause. Those helpers differ from r3 and retain their own hashes.

All variants retained a fresh-empty-database assertion, migration/default runtime
startup, 100 synthetic accounts/10,000 candidates, real scrypt password/HTTP login
for all owners, durable login-quota checks, 600 warmup requests and 300 initial
cross-owner denials. The target burst kept its original ten-second duration,
1,500 arrivals, six-route mix and actor selection, 100 maximum in-flight calls,
50-ms start-lag ceiling, per-actor overlap protection, HTTP/JWT/MySQL ownership
and response-correctness checks, positive busy Retry-After checks and no retries.
No real people/accounts, provider calls or membership-platform actions.

Runtime `sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`;
MySQL `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
App/database/runner one CPU each. App/runner 512 MiB, app old-space 320 MiB;
database 2 GiB/1-GiB tmpfs. Non-root/read-only, 256 PIDs, capability drop and
no-new-privileges, database networking disabled, no public ports. App retained
only two read-only synthetic-secret mounts; no application replacement mount.
Workers/providers/automation stayed disabled, outreach paused. No production
configuration, pool/admission ceiling or original acceptance threshold changed.

The runner records omitted stages and `releaseQualification:false`. r2/r3 leave
later code preserved in the external helper but exit its diagnostic block after
150/s, preserving normal connection cleanup and the actual failed gate exit.
The unchanged full production test/helper and release workflow were not weakened.

## Receipts, terminal state and next measurement

Evidence directories: `outputs/arrival-repro-minimization-20261002-r1`, `-r2`,
`-r3`. Each retains `load.log`, helper/runner, staged diffs, `hashes.json`,
`load.log.summary.json`, `load.log.fixture-inspection.json`. r3 also retains
`repeat.log`, its corresponding summary/inspection and `comparison.json`.
Owners: `be34fa79`, `91cd6ea8`, `19fc9b27`, `ddb33922`. Independent exact
ID/image/owner/resource inspection confirmed all **12 fixtures** stopped,
no OOM/public ports, app/database exit 0 and diagnostic runner exit 1.
Post-load health/memory steps were skipped after each red runner; they are not
inferred. Containers and helper receipts remain local review artifacts.

Final r3 helper SHA-256
`be585bdc93e72290df04d66762c5f8e65a9dd6ceb071c77e42f9d119c6bb64ed`;
runner `ce630a6bbe7ecdff4eca86982f245fa48ef1b42dcf3b72720b65e738b18b34ef`.
Both hashes were unchanged for the repeat. Earlier revision hashes are retained
in their separate receipts rather than treated as equivalent helpers.

The next safe diagnostic can use r3's real six-route burst to correlate refusals
with route/time-window, pool acquisition and event-loop delays. Further fixture,
route or concurrency reductions still need their own red check before they are
called minimal or used to justify a fix. The earlier full-load and tier-boundary
measurements remain in [the pool diagnostic report](POOL_WAIT_DIAGNOSTIC_2026-10-02.md).

No app source fix, publication, deployment, provider action, purchase or phase
completion is claimed. All 116 original phases remain Partial; the full goal
remains active and unproven.

After recording the reductions, all 171 operator cases passed without skips
(3,895.5612 ms), `operator.log` in the r3 directory. Formatting, diff-whitespace
and 116-phase traceability checks passed; `completionProven` remains false.
Original SDK and maintained admission-helper hashes were rechecked unchanged.
Git HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit/merge/push.
