# Single-route arrival diagnostic — October 2, 2026

## Outcome

All three single-route samples failed the unchanged normal-arrival refusal/drop
rules. Mixed-route overlap is therefore not required for a failing sample, and
identity-only failure challenges attributing pressure solely to list/catalogue
work. This does not identify the root cause or establish a production fix.

| Route, 150 offered requests/s for 10 s | Offered | Completed | HTTP 200 | HTTP 503 | Same-actor starts suppressed | Scheduled response p95 |
| -------------------------------------- | ------: | --------: | -------: | -------: | ---------------------------: | ---------------------: |
| Catalogue                              |   1,500 |     1,365 |      865 |      500 |                          135 |              935.07 ms |
| Candidate list                         |   1,500 |     1,409 |      881 |      528 |                           91 |              756.24 ms |
| Identity (`auth.me`)                   |   1,500 |     1,500 |    1,453 |       47 |                            0 |              187.08 ms |

All started requests completed. Every sample recorded zero transport failures,
late/capacity start drops, automatic retries, correctness errors and invalid retry
headers. Start-lag p95 was respectively 1.83, 1.44 and 1.50 ms. Guarded busy
responses are failures of this normal-capacity gate, not evidence of corruption.

## Experiment and limits

These are fresh sequential synthetic fixtures, not simultaneous workloads. Only
the selected operation for the shortened 150/s burst changed, with 15 bounded
100-arrival client counters. The application image, admission/pool limits, RPC
parameters, owners, scheduled-arrival rules and resources were unchanged.
Real migration/startup, 100 synthetic accounts/10,000 candidates, real HTTP login,
durable login-quota checks, 600 six-route warmup calls and 300 initial wrong-owner
denials were retained. Earlier closed-loop/50/s tiers and later overload, writes
and races remain omitted, as in the previous shortened reproduction.

The selected route receives 1,500 offered calls rather than its share of the
six-route mixture. This is a different workload, not a like-for-like comparison
or full release qualification. One sample per route cannot establish stable
comparative performance. Identity still uses shared authentication/database work;
its failure does not exclude a database, scheduling, host or generator cause.
Counter overhead is also unquantified. No cache, safety limit or app source was
changed based on these results. Next diagnosis should examine shared pressure
during the identity-only failure before proposing route-specific optimizations.

## Safety and evidence

### Subsequent warmup-dependency reduction

Removed only the 600 six-route warmup calls, leaving real login, 300 wrong-owner
denials and the identity-only 150/s burst. Two fresh runs on the same original
image both failed. Earlier warmup calls are therefore not required for a failing
identity-only sample. No statistically reliable improvement/worsening or root
cause is claimed from these timings.

| Identity-only, no warmup | Offered | Completed | HTTP 200 | HTTP 503 | Actor-start drops | Scheduled p95 | Start-lag p95 |
| ------------------------ | ------: | --------: | -------: | -------: | ----------------: | ------------: | ------------: |
| First                    |   1,500 |     1,496 |    1,388 |      108 |                 4 |     394.00 ms |       1.53 ms |
| Repeat                   |   1,500 |     1,500 |    1,454 |       46 |                 0 |     176.48 ms |       1.18 ms |

All started calls completed; both recorded zero transport failures, automatic
retries, late/capacity drops, correctness errors and bad retry headers. All 15
blocks matched `auth.me`; their totals reconciled against each tier. Both logged
zero warmup calls and all 300 expected wrong-owner denials. Preparation/data and
the original release workload remain otherwise as described above; this is still
an incomplete minimization, not proof that every remaining input is necessary.

Evidence: `outputs/identity-no-warmup-20261002-r1`: first/repeat logs, comparison,
independent fixture receipts, analyzer/analysis, helper/runner diffs and initial/
final hashes. Owners `898a9902` and `fcf0e2f6`: all six exact fixtures independently
inspected stopped, no OOM, app/database exits 0 and probes 1. Bounds/image/mount
rules were unchanged. Post-failure health/memory steps were skipped, not inferred.
Diagnostic-only helper/runner hashes matched between runs. No app changes, real
outreach, provider actions, public ports, purchases, publication or deployment.

The next measurement should correlate identity-only refusals with shared database
acquisition/command waits and application scheduling, scoped to the failed burst.
Existing whole-load figures cannot substitute for that scoped observation.
This subsequently ran: [scoped identity measurement](IDENTITY_TIER_MEASUREMENT_2026-10-02.md)
reproduced 49 busy refusals, with database tails and scheduling delays; no cause
or fix is established.

After the reduction, all 171 operator cases passed without skips (3,836.4292 ms;
`outputs/identity-no-warmup-20261002-r1/operator.log`). Formatting, diff-whitespace
and original 116-phase traceability passed; all phases remain Partial. Helper:
`6dc5307affdf516003837492e11d2bd8f0e8ed91f7117d08c891f0cccbd32c12`;
runner: `f3824909f1c24ee9a74975b1b0ea0b633423c16ff6ccbaefa6a17f21cf8d8ebb`.
HEAD unchanged, no commit/merge/push.

Original runtime:
`sha256:d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2`.
MySQL:
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Each fixture stayed one CPU, non-root/read-only, 256 PIDs, no public ports or host
PID namespace. App/runner: 512 MiB, 320-MiB Node old-space; DB: 2 GiB with 1-GiB
data tmpfs. App had only two read-only secret mounts, no application replacement.
No external provider actions, real outreach, spending or deployment occurred.

Owners: catalogue `28c0d463`, list `15fc5401`, identity
`2dbec1c8`. All nine exact fixtures independently inspected stopped, no OOM;
app/DB exits 0 and probes 1. Post-load memory/health checks were skipped after the
failed probe and are not inferred. Block status/start/completion/drop totals
reconciled against each tier, with every block matching the selected route.

Evidence: `outputs/arrival-single-route-20261002-r1`, including three logs,
three fixture-inspection receipts, `comparison.json`, `analysis.log`, analyzer,
helper/runner diffs and initial/final hashes. Helper SHA-256:
`52652da4051e16ed0cf927bc279802f27a100e65fd95d91159a9bf17acb09afc`;
runner: `a34cbecd613d29da908d5a7b373bdb53463931354f6a73f54cea5c062843ff02`.
These are external diagnostic files, not product/release test replacements.

See [the preceding route correlation](ARRIVAL_ROUTE_DIAGNOSTIC_2026-10-02.md).
All 116 original phases remain Partial and completion remains unproven.

After recording these results, all 171 operator tests passed without skips
(3,989.8888 ms; `operator.log`). Formatting and diff-whitespace checks passed;
traceability remained valid for 116 Partial phases, `completionProven:false`.
Initial/final helper and runner hashes matched. Git HEAD remained
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit, merge or push occurred.
