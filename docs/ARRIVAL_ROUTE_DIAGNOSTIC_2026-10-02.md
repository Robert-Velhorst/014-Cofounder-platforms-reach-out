# Arrival-route correlation — October 2, 2026

## Finding, not a root-cause claim

Two runs of the shorter real-path reproduction with bounded client-side route
counters failed 150/s: **123** busy responses in the first, **200** in the repeat.
The repeat also suppressed **26 starts** because the same actor still had a prior
request in flight. The actor-overlap protection was retained, not bypassed.

Candidate-list and platform-catalogue blocks had long response tails in both
samples. Busy identity requests followed slower catalogue blocks; detail starts
overlapped slower list work. Profile and status requests received no busy responses
in these two samples. This is correlation of **requested routes**, not evidence
that each refused request's route was the work occupying server capacity. It does
not establish a route-specific fix, guaranteed route capacity or a benchmark trend.

## Verified counts

The receipt analyzer checked all 15 blocks, fixed route order, per-block
started/completed/status totals, aggregate route totals against the actual tier
receipt, and offered-minus-started against dropped counts. Each block offers 100
arrivals over about 0.667 seconds; blocks can overlap in execution. All rows below
show HTTP 200 / HTTP 503 **among started requests**, not offered capacity.

| Requested route                  | Offered each run | First 200 / 503 | Repeat 200 / 503 | Repeat starts suppressed |
| -------------------------------- | ---------------: | --------------: | ---------------: | -----------------------: |
| `auth.me`                        |              300 |        255 / 45 |         273 / 27 |                        0 |
| `profile.get`                    |              300 |         300 / 0 |          300 / 0 |                        0 |
| `criticalPath.prospects.list`    |              300 |        246 / 54 |         218 / 82 |                        0 |
| `criticalPath.prospects.details` |              200 |         195 / 5 |         123 / 51 |                       26 |
| `criticalPath.status`            |              200 |         200 / 0 |          200 / 0 |                        0 |
| `criticalPath.platforms`         |              200 |        181 / 19 |         160 / 40 |                        0 |

First run: all 1,500 offered requests started/completed; repeat: 1,474/1,500
started/completed. No late/capacity drops, automatic retries, transport,
correctness or Retry-After errors. The normal-tier all-success gate failed in both.
First/repeat scheduled response p95 404.76/487.19 ms, start-lag p95 1.22/1.30 ms.

Mean/max response ms by requested route, including busy responses:

| Route              |  First mean / max | Repeat mean / max |
| ------------------ | ----------------: | ----------------: |
| Identity           |  89.128 / 563.965 |  78.922 / 340.491 |
| Profile            |    6.778 / 56.134 |  36.622 / 196.117 |
| Candidate list     | 150.983 / 445.223 | 241.434 / 828.011 |
| Candidate details  |  20.838 / 166.897 | 162.254 / 552.792 |
| Runtime status     |     3.466 / 6.783 |   10.958 / 65.572 |
| Platform catalogue | 169.937 / 634.632 | 226.225 / 628.531 |

These are client HTTP-response measurements, not server procedure durations or
pure database execution. Their means also depend on the success/refusal mix.
Exact per-block status/timing records are retained; no per-request private data.
In the first sample, catalogue block 5 had 19 refusals followed by identity block
6 with 45. In the repeat, list block 8 had an 828-ms maximum; following detail
block 9 started only 74/100. That is consistent with requests crossing block
boundaries, not proof of a particular database query or CPU call-site cause.

## Source inspection and next falsifiable comparisons

The real catalogue handler calls `publicPlatformCatalogue()`, which maps static
reviewed records to public metadata. The source-policy module already initializes
its catalogue/label lookup at module load (`const sources = publicPlatformCatalogue()`);
the inspection does not support a claim that it rebuilds that lookup for every
candidate. No extra policy cache, account/session cache or permission shortcut
was added based on this correlation.

The next diagnostic comparisons should isolate one requested route while retaining
real authentication/ownership checks: catalogue-only, candidate-list-only and a
light identity control. Failure on catalogue-only would show the mixed-route
handoff is unnecessary for that sample; list-only would test the database/row
path; identity-only failure would challenge attributing pressure only to heavier
routes. These alter the workload mix and cannot certify the original full gate.
They subsequently ran: [all three single-route samples failed](ARRIVAL_SINGLE_ROUTE_DIAGNOSTIC_2026-10-02.md),
including identity-only. Their changed mix is not full release qualification.

## Scope, safety and receipts

The application stayed the original uninstrumented runtime
`sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`;
MySQL `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Only the external r3 shortened helper gained 15 bounded block counters; the
six-route RPC mix, actor selection, arrival rate and refusal/correctness rules
were unchanged. Counter overhead remains a limitation. No application source,
pool/admission/resource limit or production/release workload changed.

The earlier reductions remain disclosed: no prior closed-loop/50/s tiers, no
later overload/writes/races. Real migration/startup, fresh data assertion, 100
synthetic accounts/10,000 candidates, real login and durable login-quota checks,
600 warmup calls and 300 initial wrong-owner denials were retained. These runs
did not repeat the original full write/race/isolation qualification.

All three fixtures per run stayed one CPU, non-root/read-only, 256 PIDs; app/runner
512 MiB and app old-space 320 MiB, DB 2 GiB/1-GiB tmpfs. No public ports, host PID
namespace, application replacement, outside network/provider actions or spending.
Owners `bb66c951` and `07cd572e`: all six exact fixtures independently inspected
stopped, no OOM, app/database exit 0 and diagnostic runners exit 1. Post-load
health/memory steps were skipped after each failure and are not inferred.

Evidence directory: `outputs/arrival-route-diagnostic-20261002-r1`. Retain
`load.log`, `repeat.log`, their `.fixture-inspection.json` receipts,
`route-comparison.json`, `analysis.log`, `analyze.mjs`, `hashes.json`,
`final-hashes.json`, staged helper/runner diffs. Helper SHA-256
`647f4d17ecfd85cde4b98b4d9e5f46cfb617453612821263ede174602ce51e72`;
runner `cd319e9086fce5fa27cb251575008c8a7838bd0af0b0b848d7dda9ac37d84a3b`.
They were unchanged on the repeat. Earlier shortened-loop evidence is in
[the reduction report](ARRIVAL_REPRO_MINIMIZATION_2026-10-02.md).

No root-cause fix, full acceptance, publication, deployment or phase completion
is claimed. All 116 original phases remain Partial; the full goal remains open.

After recording the correlation, all 171 operator cases passed without skips
(3,715.4092 ms), `operator.log` in the evidence directory. Formatting,
diff-whitespace and 116-phase traceability checks passed; completion remains
unproven. Original runtime/SDK/admission-helper hashes were rechecked unchanged;
Git HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. No commit/merge/push.
