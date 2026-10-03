# Workspace read/write load qualification — dated checkpoints

Current 68-source exact-package read/write baseline and paired-edit race evidence
is in the [latest package checkpoint](INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-runtime-readwrite-load).
The preceding 67-source exact-package read/write baseline and paired-edit race evidence
is in the [October 2 package checkpoint](FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-package-readwrite-load-qualification).
The results below retain their own historical artifact identities; they do not
automatically transfer acceptance to later packages or establish hosted capacity.

October 2, 2026. This extends the real synthetic customer load harness, not the
production API. It addresses the original brief's representative concurrency,
ownership, retained-data and retry requirements; it is not full production
acceptance, real-user testing or a hosting/cost recommendation.

Subsequent evidence: [the signal-aware startup checkpoint](RUNTIME_SIGNAL_STARTUP_2026-10-02.md)
reproduces an old-image locked-migration stop failure and verifies cancellation
and normal startup/shutdown on a new runtime. It does not retroactively change
these load results or transfer their acceptance to the new image.

## Changes and predefined rules

The existing read harness retains its 100 accounts / 10,000 candidates, 100 real
HTTP logins, 600 warmup reads, 300 cross-owner read refusals and 6,000 measured
requests at each concurrency tier5/20/100. The read rules are unchanged: normal
tiers require only200/correct owner data/p95 under2,000ms; overload may return
bounded503 with validRetry-After. Orderly rejection is not support for100
simultaneous successful operations.

Two additional workspace-write tiers use5 and20 concurrent actor loops, ten
rounds/account. Each round has six real HTTP operations:

1. Read the owner's candidate and current content-bound review revision.
2. Save a unique synthetic title correction, requiring a new revision.
3. Repeat the exact saved payload/revision, requiring no further change.
4. Submit a different patch with the old revision, requiring409/no result.
5. Archive with the current revision and explicit confirmation.
6. Restore with the archive's revision and explicit confirmation.

Each tier must complete6,000requests,3,000committed changes,1,000unchanged replays
and1,000stale-review refusals. All successful-response p95 must remain below
2,000ms. No automatic retries or raised capacity/outstanding-work limits; a
transport, unexpected status or correctness failure fails the diagnostic. Only
the explicit unchanged replay is intentional repeat behavior. Active workers are
drained after failure before closing database connections/sockets; queued actors
are not started after a failure has been observed.

After each tier, a new independent MySQL connection checks all10,000candidate
rows: the100target titles match their owner's final round, archived state is
restored, all other target fields except the normal update timestamp are
preserved, and the9,900untouched records remain byte/value-equivalent. Per-owner
edit/archive/restore audit counts must be exactly10each after tier5 and20each
after tier20. These count checks alone are not complete audit-metadata or causal
exactly-once proof.

Finally400mutation attempts check supplied-account mismatch and another owner's
candidate with a real valid review. Expected403/404and no results; complete
candidate and audit-table snapshots must remain unchanged after those refusals.
Provider, mail, registration, deletion and legacy paths stay disabled, outreach
stays paused and no source/contact rights are changed.

## Harness verification and artifact boundary

Backend-patterns guidance kept the tests on real authenticated HTTP, owner-scoped
review/mutation transactions and independently reconnected persisted storage.
Seven harness unit regressions passed442ms total (19ms cases): exact operation
counts, replay/stale-review expectations, wrong-owner review, fixed latency rule,
bounded inputs, in-flight-worker draining and non-mutating percentile calculation.
These unit fixtures model the test harness only; they are not production results.
A dedicated strict TypeScript check of the standalone load entry point passed;
the ordinary app tsconfig does not include this script.

Bundle the entry point outside productiondist using the existing esbuild with
`--bundle --platform=node --format=esm --packages=external`. Mount the resulting
test-only helper at`/app/synthetic-customer-load.mjs` in a separate runner so its
external imports resolve against the pruned runtime dependencies. Never replace
the application's compiled files, seed a customer database or implicitly pull
images. The harness requires its explicit synthetic opt-in, numeric loopback
database/cofounder_test, application readiness and every non-migration table empty.
Fixture insertion deliberately bypasses signup, inbox verification and intake
permission workflow; those are not timed or qualified by this diagnostic.

Exact runtime image:
`sha256:eaa6752ebb72e68c3bc7b629b9dc1554238291cee77e4deb771470b037626859`.
Exact database image:
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Application:1CPU/512MiBmemory-and-swap/320MiBNodeoldspace/non-root1000/read-only/
droppedcapabilities/no-new-privileges/256PIDs. Database:1CPU/2GiBmemory-and-swap/
1GiBtmpfs/non-root999/read-only/droppedcapabilities. Runner:1CPU/512MiBmemory/
320MiBNodeoldspace/non-root/read-only. Database networknone; app/runner share its
isolated namespace, no ports are published. Application mounts only two read-only
synthetic secret files, no source or compiled replacements. The runner's additional
read-only test-helper mount is not a production integration.

Selected host inventory after these test-source changes:
545files/digest38139f1311a29448b6d6b95c3e08eb2d01e36ea4cdf3e3ce3fd8f5a460f719bc.
This differs from the prior build's inventory because the load entry point, helper
and harness regressions changed. Runtime dependencies/compiled application/routes
did not change. Do not describe the old build as attesting to these new test sources.
Source SHA256:

- load entry1fd5c28d148c404b80b4131c035fdcfd58ecbbcc35c2fc14c60501647d1c0290;
- finite workloadb9c223890331e473330a527a226e569e9a618f3fe29e992c1506063d26b6d858;
- regressionse9382bda1d5e17c20059b5a9f0381cf025dc07c2c04b7f849baa010462bcd518.

## Failed attempts and unresolved startup observation

First execution76516 failed before workload requests because the helper directory
was mounted under/qualification, where externalmysql2could not resolve. The
fixture mount was corrected, not runtime dependencies or acceptance thresholds.
Owned94c8fdf8 runner6717c908... stopped1/noOOM, appd397c1a0... stopped137/noOOM,
database72cf0f95... stopped0/noOOM/no ports. The app logs show migrations applied
and server started, but no shutdown-completion receipt after the early stop.

The runtime's default shell command migrates before exec'ing the server; an early
shutdown during this transition needs independent diagnosis/acceptance. Existing
post-startup clean-signal receipts do not prove the migration/start transition.
This finding is not masked as an OOM, a successful shutdown or a diagnosed cause.

## Connected result and remaining scope

Corrected execution73105 finished exit0. Its external bundle SHA256 is
`b26f7cb75688ee58e187f35dfaa65280ac151f7fd1ce91108523052c09b59b63`.
The100real logins passed (p95684.12ms) with exactly100durable global admissions;
all600warmup reads and300negative read-isolation checks passed.

| Workload                 | Concurrent actor loops | Measured requests | HTTP success / expected refusal | Successful p95 | Successful p99 |
| ------------------------ | ---------------------: | ----------------: | ------------------------------- | -------------: | -------------: |
| Reads                    |                      5 |             6,000 | 6,000 / 0                       |        99.55ms |       154.94ms |
| Reads                    |                     20 |             6,000 | 6,000 / 0                       |       361.34ms |       534.97ms |
| Read overload            |                    100 |             6,000 | 890 / 5,110 busy503             |     2,040.90ms |     2,721.80ms |
| Workspace write workflow |                      5 |             6,000 | 5,000 / 1,000 stale409          |       140.06ms |       207.83ms |
| Workspace write workflow |                     20 |             6,000 | 5,000 / 1,000 stale409          |       370.74ms |       482.03ms |

All18,000measured reads had zero transport/correctness/retry-header errors. The
overload tier has no two-second success SLO; its successes exceeded that level.
Its pass proves only the predefined orderly-refusal rule, not100-user successful
capacity or fairness. Read tiers5/20 took44.37/45.83seconds; overload16.33seconds.
Write tiers5/20 took65.29/45.73seconds; each completed3,000changes,1,000exact
unchanged replays and1,000stale conflicts with no automatic retry, transport or
correctness error. All10,000persisted candidate rows were independently verified
after each tier, and per-owner/action audit counts matched. Final400cross-owner
mutations all refused and left10,000candidate rows/6,000audit rows unchanged.
This is30,000measured HTTP requests plus separate setup/warmup/isolation work,
not30,000independent users or complete browser journeys.

After load, liveness/readiness both returned200. App charged cgroup memory peak
was234,258,432bytes against536,870,912; database peak757,305,344against2,147,483,648.
Both cgroups reported0max/oom/oom_kill events. Charged memory includes fixture
tmpfs where applicable; this does not certify a disk-backed hosting configuration.
Current d360443f fixtures runner18402e00.../app20deb726.../DB2ab7f62e... independently
stopped0/noOOM/no public ports. App post-startup shutdown completed cleanly; this
does not resolve the failed early-transition shutdown noted above.

Current165host operator/audit cases passed/no skips7,500.4338ms after these source
changes. The seven harness regressions also passed on Linux/Node22.23.3 in621ms
(99ms cases), using exact testimage580539d6... with two current read-only test-source
mounts, networknone/bounded1CPU512MiB/defaulttest-root. This is a scoped harness
retest, not a new immutable full-suite build; its e4aa85fd... fixture independently
stopped0/noOOM/noports. In total all seven owned fixtures from this increment
were independently inspected terminal; the first failure keeps runnerexit1 and
appexit137 without OOM. None was deleted. Original926/724exact-package application
receipts remain dated and separate from these newer test sources.

No commit, merge, upload, public endpoint, provider signup, purchase, real account
verification, customer data or outreach occurred. Real hosted TLS/network latency,
long-running/open-loop soak, write overload/fairness, same-account concurrent
writers, representative signup/import/outreach/mail/deletion workloads, migration
upgrade/rollback, provider billing caps and worldwide catalogue completeness remain
separate acceptance requirements. All116original phases remainPartial.
