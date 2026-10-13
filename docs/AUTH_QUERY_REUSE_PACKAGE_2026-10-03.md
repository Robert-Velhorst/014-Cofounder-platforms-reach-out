# Authentication query reuse: packaged qualification — October 3, 2026

## Result

Fresh production build, mandatory database acceptance and compiled-package parity
passed. The original full load still failed normal 150-request/second acceptance:
95 busy refusals and three actor-start drops. Query-construction reuse is verified,
but is not a verified capacity fix. No phase or public-production approval follows.
The runs began October 2 UTC and completed after midnight in Europe/Amsterdam.

This qualifies the implementation described in
[authentication query construction reuse](AUTH_QUERY_REUSE_2026-10-02.md), which
continues to query live account/session data on every request. No authorization
result cache, changed admission threshold, profiler or extra application CPU.

## Exact packages and correctness checks

Production runtime image:
`sha256:27a756d9ffb85aa87c23032a58a4cefb20ea02f5267b9bcc203869fe1cff03f3`.
Fresh repository Docker build passed typecheck, all 1,030 unit cases across 101
files without skips (105.95 s), application compilation and production dependency
packaging. Tests execute inside Node 22.23.3; the host orchestration uses Node
25.2.1, not the application runtime.

Mandatory database image:
`sha256:05ca01fdfc71da07f7f8910f260fa08f77f6d7832672affcc2850c49aa706e3f`.
The unchanged full gate passed migrations and all 725 cases across 43 files,
without skips (310.42 s; attached process elapsed 319.092 s). This includes the
new warm-query session case, not just the preceding focused ten-case suite.

Runtime/test comparison passed for all 117 compiled application and migration
files, 7,027,756 bytes, common digest
`3002ee3768e2b82d74d35237907166d655288ac1a8660387624f2bf42381032c`.
Both inspections ran as UID 1000 on Node 22.23.3. Source directories, environment
file and development test/build tools were absent from the production runtime.
This is `dist`/`drizzle` parity, not dependency-SBOM or supply-chain attestation.

## Unchanged full workload

The original helper and runner were copied byte-for-byte, then checked unchanged
before and after execution. Helper SHA256:
`53b2b48d2433aad71e8f413dfaefa7f53e9a3f5f20870d37792bef00ed919e3e`;
runner SHA256:
`3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
Product `db.ts` and `account-sessions.ts` hashes also stayed unchanged during
qualification; their values remain in the implementation report and receipts.

All retained setup, 100 real synthetic-account logins, 10,000 candidate rows,
600 warmup reads, initial wrong-owner denials, six-route mix, closed-loop tiers,
scheduled arrivals, write tiers and competing-write/isolation checks ran. Full
database/build/parity activity had ended before the load fixture started.
No shortened routes, instrumentation, retries or relaxed thresholds/resources.

Application: one CPU, 512 MiB, 320-MiB Node old-space limit, UID 1000, read-only,
256 PIDs. Database: one CPU, 2 GiB, 1-GiB data tmpfs, UID 999, read-only. Driver:
one CPU, 512 MiB, UID 1000, read-only. Isolated owned database network namespace,
no public ports/host PID sharing/application replacement mounts or provider work.

| Scheduled rate | Offered | Started/completed | HTTP 200 | HTTP 503 | Actor drops | Outcome                               |
| -------------- | ------: | ----------------: | -------: | -------: | ----------: | ------------------------------------- |
| 50/s           |     500 |               500 |      500 |        0 |           0 | Passed normal acceptance              |
| 150/s          |   1,500 |             1,497 |    1,402 |       95 |           3 | Failed normal acceptance              |
| 500/s          |   5,000 |             4,175 |    2,247 |    1,928 |         825 | Passed controlled-overload rules only |

Each scheduled tier lasted ten seconds. All reported zero transport failures,
late/capacity drops, incorrect responses, malformed retry headers and automatic
retries. Actor drops are distinct and retained above. Scheduled response p95 at
150/s was 291.02 ms; that latency does not cancel its refusal/drop failures.
500/s is not proof of serving 500 successful requests per second.

Closed-loop read tiers at concurrency 5/20/100 passed their original rules:
6,000 HTTP 200 responses at 5 and at 20; 654 successful responses and 5,346 busy
refusals at 100 (controlled overload). Both 6,000-request write tiers at 5/20
passed, checking persisted rows and owner/action audit counts. Each produced
3,000 committed changes, 1,000 unchanged replays and 1,000 expected stale conflicts.
Competing writes retained 100 different-patch and 100 identical-patch races,
400 edit requests, independent sockets/overlap and 200 winning audit receipts.
All 400 cross-owner mutations were denied; 10,000 candidate rows and 6,200 audit
rows remained unchanged by those attempts.

The probe and orchestration correctly exited 1 for the failed capacity tier.
The original runner then skipped post-load readiness and cgroup-memory-peak
observations; these must not be claimed as passed. All remaining write/race
checks finished before the exit. A lower busy count than a previous single run
does not prove a repeatable throughput improvement or isolate the root cause.

## Fixture provenance and retained evidence

Database owner `11c7fe14`: both exact fixtures independently inspected stopped
exit 0/no OOM, no source mounts/public ports, two CPUs/2 GiB/512 PIDs. The database
is UID 999/read-only/network disabled; its test joins only that owned namespace.
The integration package retains development tooling and its build-stage user;
it is not the hardened production runtime.

Parity owner `ac151b17-aba4-4aa5-83a7-2a2418671de3`: both exact fixtures stopped
exit 0/no OOM, UID 1000/read-only, one CPU/512 MiB/128 PIDs/network disabled;
one read-only inspection-helper mount each, no source mounts/public ports.

Load owner `30d861f8`: all three exact fixtures independently inspected stopped,
no OOM, application/database exit 0 and probe exit 1. Image identities, ownership,
CPU/memory/swap/PID limits, users, read-only roots, namespaces and exact mounts
were checked independently. No source mount or application replacement.

Evidence folders relative to the task workspace:
`outputs/auth-query-reuse-qualification-20261002-r1` (build/database/parity logs,
image ID, initial/final hashes, independent database/parity receipts, operator
log) and `outputs/auth-query-reuse-load-20261002-r1` (unchanged helper/runner,
load log and independent fixture receipt). Seven owned fixtures retained stopped;
nothing deleted. Before documentation, all 171 operator cases passed without
skips (5,422.568 ms).

After documentation, all 171 operator cases passed again without skips
(3,121.2405 ms; `operator-final.log`). Formatting and diff-whitespace checks passed;
traceability validated all 116 original phases as Partial, `completionProven:false`.
HEAD stayed `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.

## Remaining release gates

The current capacity gate remains red. Fresh connected-browser/recovery checks
have not been run on this image; earlier 24-stage browser/recovery receipts belong
to the previous package. All-UI/accessibility, soak/representative hosted capacity,
remote recovery, live inbox/provider permissions, privacy/operator decisions,
worldwide source completeness and deployment acceptance remain open. All 116
original phases remain Partial; completion remains unproven.

Robert's EUR 100/month initial operating ceiling is planning-only. No purchase,
provider action, actual outreach, publishing, deployment, permission change,
commit, merge or push occurred. Existing unrelated work remains preserved.
