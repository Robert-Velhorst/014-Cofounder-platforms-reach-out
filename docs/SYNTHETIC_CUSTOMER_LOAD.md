# Synthetic authenticated read-load and export-burst checks

Subsequent [scheduled-arrival extension](SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md)
preserves the workload below and adds independent arrival times/drop accounting.
Its real run failed the predeclared 150/s all-success gate; a passing closed-loop
receipt must not be interpreted as a passing scheduled-arrival capacity gate.

Latest exact 68-source runtime passed all five tiers/30,000 baseline
requests, 200 paired-edit races and 400 wrong-owner mutation refusals, with
independent stored-row/audit evidence and no automatic retries. Overload mostly
returned controlled busy refusals, not 100-user successful capacity. See the
[current package results and limits](INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-runtime-readwrite-load).

Earlier corrected-client run on the exact Hong Kong/64-source runtime passed all
predefined checks: 30,000 baseline requests, 200 paired-edit races with independent
storage/audit checks and 400 wrong-owner mutation refusals. No retries or relaxed
thresholds; the synthetic pool now expires idle connections before the server hint.
Earlier failed runs are preserved. See [current-image pass and diagnosis limits](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-corrected-client-exact-image-load-pass).
The earlier [help/63-source read/write and paired-edit pass](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-current-image-readwrite-and-competing-edit-load)
is historical evidence, not acceptance of the new image.

The current harness also includes real saved workspace changes, unchanged replay,
stale-review and cross-owner mutation checks. The following read/export history is
preserved, not silently relabeled as write coverage. See the
[current exact-runtime read/write qualification](WORKSPACE_WRITE_LOAD_2026-10-02.md)
for the new predefined workflow, results, fixed resource limits and startup risk.

This is a local release diagnostic, not a hosted capacity guarantee or public-beta
launch approval. It does not call email, AI or co-founder platforms.

## Safety and reproducibility

The harness is `apps/cofounder-discovery/scripts/synthetic-customer-load.ts`.
Bundle it with the application's esbuild into an **external output directory**
using `--bundle --platform=node --format=esm --packages=external`. Do not put the
bundle in the production `dist` directory. Mount the bundle at
`/app/synthetic-customer-load.mjs` in a separate runner using the reviewed runtime
image so package resolution uses its pruned dependencies.

Use a new disposable MySQL database with tmpfs storage, no published ports and
`--network none`. Both the application and runner join that database's network
namespace. No live/customer database may be used. The harness requires
`RUN_SYNTHETIC_CUSTOMER_LOAD=true`, a database URL with host `127.0.0.1` and database
`cofounder_test`, and every application table empty. Migrate first. Provide the
database URL through a protected read-only `DATABASE_URL_FILE` mount; provide
the application JWT through its own protected mount. Never log either secret.

Run the application in production mode with all provider, mail, registration and
legacy gates closed, outreach paused, `TRUST_PROXY=false`, and the normal
32-outstanding-work limit. A suitable declared test envelope is one CPU,
512 MiB memory/swap, 256 PIDs, read-only root, no added capabilities, non-root
UID 1000 and 320 MiB Node old-space. These are local container limits, not a host
or database sizing recommendation. The database and runner have separate limits.

Run `node /app/synthetic-customer-load.mjs`. It makes real HTTP requests to the
application at loopback port 3000 (or explicitly supplied `PORT`). Each actor
uses a distinct actual 127.0.1.x source address; no forwarded-IP spoofing and no
disabled login guards. Record image ID, resource settings, stdout and exit code.
Stop only these task-owned fixtures afterwards. Keep failed receipts too.

## Workload and predefined acceptance rules

- Direct synthetic fixtures: 100 verified accounts, 100 private profiles and
  10,000 manual candidates (100/account). Fixture setup deliberately bypasses
  signup, mailbox verification and the candidate-intake permission workflow.
  Synthetic accounts share one random fixture-only password hash; real HTTP
  logins still execute password verification and create durable signed sessions.
- Login setup: 100 real logins, at concurrency five, reported separately. Require
  exactly 100 committed global admissions, including any rolled-back deadlock
  retries. Wait for application readiness before requiring empty tables.
- Warmup: 600 requests; identity, profile, paginated candidates, candidate details,
  runtime status and source catalogue. All must return correct owner-scoped data.
- Isolation: 300 negative requests checking another account's profile/list and
  another owner's candidate ID. Require 403/403/404 and no result data.
- Measured tiers: 5, 20 and 100 concurrent actor loops, sequential requests per
  actor, ten six-operation rounds per account, 6,000 requests/tier. No browser
  think time, retries or response caching. This is a closed-loop workload, not
  an open-loop arrival-rate or long-running soak test.
- Normal tiers (5/20): require only HTTP 200 responses, no transport/correctness
  errors and successful-response p95 below 2,000 ms.
- Overload tier (100): allow HTTP 200 and bounded HTTP 503 with a positive integer
  Retry-After, require at least one success and no transport/correctness errors.
  Passing overload means orderly rejection, **not** support for 100 simultaneous
  successful operations. No post-result relaxation of these rules.
- Report all-response and successful-response p50/p95/p99, status totals,
  successful throughput and failures separately. Failure exits nonzero.

These rules describe the read tiers. The current harness additionally runs
candidate edit/replay/stale-conflict/archive/restore tiers and paired overlapping
edits, with independent persisted-data/audit checks. Their rules and historical
receipts are documented in [workspace write load](WORKSPACE_WRITE_LOAD_2026-10-02.md)
and [same-account competing-write qualification](CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-same-account-competing-write-qualification).

The harness does not time registration, intake, export, deletion,
background workers, mail, AI, real platform adapters or UI/static assets. It does
not prove full customer journey, browser-cookie enforcement, mobile/keyboard
accessibility, network latency, database backup recovery, production TLS, hosting
cost or worldwide-source completeness. Those remain separate release gates.

## Separate large account-export HTTP burst (2026-10-01)

This later checkpoint uses a separate external harness,
`outputs/account-export-load-20261001.cjs` in the local task output directory.
It is not the read-load harness above or a committed production command. Its
fixed loopback origin is `http://127.0.0.1:13014`; it requires
`E2E_DISPOSABLE_CONFIRM=local-isolated-mysql-test`, numeric loopback MySQL host,
database `cofounder_test` and no existing users. Migrate the new fixture first,
then verify database TCP readiness and application readiness before running.
`E2E_EXPORT_ROWS` permits only integers 160 through 340, default 160.

Eight verified owners, one candidate each and bounded 60000-character synthetic
drafts are direct test fixtures; real sequential HTTP logins obtain sessions.
Each of two waves issues eight concurrent authenticated `accountData.export`
requests. Files must parse, match account/marker/row/byte counts, account for all
42 categories, exclude other owners and password material and remain below the
unchanged 20 MiB ceiling. Busy responses must be 429 with the explicit generation
refusal and no export result. A previously refused owner then completes an export;
durable attempt and successful-audit counts must equal successful generations,
not all requests. Both health endpoints must return 200 after the burst.

Application envelope stayed at one CPU, 512 MiB memory/swap and 320 MiB Node
old-space, non-root UID 1000, read-only root, capability removal, no-new-privileges
and 256 PIDs. Current compiled artifacts were mounted read-only in the cached
current-dependency test image. This is not a new exact production-release image
or an execution of GitHub CI. No endpoint was published; application/client
joined the network-disabled database's loopback namespace. The client joined the
application PID namespace solely to sample `/proc/1/status` every 100 ms, in a
separate one-CPU/512-MiB container. App and client credentials were synthetic.

| Dataset / wave           | Successful files               | Busy refusals | Successful HTTP elapsed |
| ------------------------ | ------------------------------ | ------------- | ----------------------- |
| 160 drafts/owner, wave 1 | 2, approximately 9.68 MB each  | 6             | 1059–1174 ms            |
| 160 drafts/owner, wave 2 | 2, approximately 9.68 MB each  | 6             | 538–639 ms              |
| 340 drafts/owner, wave 1 | 2, approximately 20.55 MB each | 6             | 1623–1850 ms            |
| 340 drafts/owner, wave 2 | 2, approximately 20.55 MB each | 6             | 1157–1313 ms            |

Both final clients exited 0. Each run had four successful burst generations,
12 busy refusals and one successful recovery, with exactly five admitted attempts
and five success receipts. Recovery took 301 ms for the smaller fixture and
642 ms for the near-limit fixture. The largest recovery file was 20553197 bytes,
below the unchanged 20971520-byte ceiling. Largest sampled application RSS was
371096 KiB (42 samples) and 434936 KiB (72 samples), respectively. The near-limit
app cgroup reported `memory.peak=413122560`, `memory.max=536870912` and zero
`max`, `oom` and `oom_kill` events. RSS and charged cgroup memory measure different
things; neither should be silently substituted for the other. Timing is a small
local sample, not an SLO estimate or soak result.

Failed attempts remain part of the evidence. The first near-limit client ran
before app readiness and failed at startup without fixture data. Two later
near-limit seeding attempts killed the original one-GiB tmpfs MySQL fixture:
Docker recorded an OOM event and exit 137, with the app still running and not
OOM-killed. Smaller insert batches did not resolve that fixture limit. No export
had been attempted in those failed runs. A new, separate two-GiB database with
one-GiB tmpfs allowed the final near-limit test, retaining the original app limits.
That database reported peak charged memory 1208344576 bytes and no OOM events.
This does **not** prove a one-GiB production database sufficient: tmpfs database
files count against this fixture's memory, and disk-backed/provider/database
capacity still needs separate representative acceptance and budget approval.

All final task-owned app/client/database containers were stopped, unpaused and
not OOM-killed; the original failed database retains its terminal OOM evidence.
No timeout, export size, attempt quota or application resource limit was relaxed.
No product fix was inferred from the test fixture failures. These bursts do not
cover 100000 small rows, worst-case escaping, slow clients, multiple instances,
mail/providers, registration/writes under simultaneous exports, extended soak,
all exported record categories populated, hosted TLS or worldwide launch readiness.

## Follow-up: slow export delivery boundary

The HTTP export guard now reserves two per-process response slots until server
`finish` or socket `close`, in addition to the existing generation semaphore.
It counts individual parsed tRPC calls in a batch and refuses before context work;
it never queues passwords or export payloads. Error/finish/close release is
idempotent and removes event listeners. This earlier checkpoint had no absolute
transfer deadline; the following section records that later implementation.
Neither checkpoint is a client-save receipt or fleet-wide fairness mechanism.

The initial Windows paused-reader test was not valid slow-write evidence: its
loopback kernel buffered even a 19-MiB response and the server had finished.
The corrected test accepts that as the finish path. On Linux it verifies actual
unfinished responses, and the saved original transport failed with HTTP 200
instead of 429 for the third export. Current transport passed. Eight focused
transport/batch checks passed on both Windows and Linux; they cover slow close
recovery, completed/error response release, counting each batch export, refusing
three exports before context, and preserving ordinary reads/batch-size bounds.
No case was skipped. TypeScript and production build passed; the full existing
unit command passed 532 tests across 54 files (71.91 s).

With `E2E_EXPORT_SLOW=true` and 340 rows per account, the rebuilt real application
also served two actual near-ceiling responses to paused Linux clients. The third
request returned the new download-busy 429, without charging an account attempt;
an ordinary authenticated read returned 200. Closing the held sockets allowed
another owner's export. Subsequent two-wave testing completed four large exports,
refused 12, and completed final recovery. Including the two held generations and
initial recovery, quotas and success receipts both totaled eight. Successful burst
requests took 1794–2284 ms, final recovery 1021 ms. The host concurrently ran native
unit tests; do not treat this as a controlled latency comparison with the earlier
burst. No latency SLO is inferred from these four requests.

The same 512-MiB/320-MiB app limits and separate two-GiB tmpfs fixture DB were
retained. App RSS sampling reached 463208 KiB over 124 samples; charged cgroup peak
was 430878720 bytes and memory-limit/OOM counters were zero. Actual exports still
passed content, owner, secret, manifest and byte/record checks; both health endpoints
passed after the burst. This earlier burst did not establish slow-client soak,
absolute download expiry (addressed separately below), fairness against clients retaining both slots,
fleet-wide admission, worst-case encoding or representative hosted capacity.

## Follow-up: absolute export response lifetime

Delivery slots now expire ten minutes after admission, including context and
generation time. The deadline is fixed, is not refreshed by writes/drain, is
unreferenced so it does not keep a stopped process alive, and is cleared on
finish/close. Expiry destroys the response and releases its slots once. Stale
callbacks are inert after release, so they cannot destroy a finished keep-alive
response or subtract from another lease. No private payload is stored by the
budget. Interrupted generation still has its independent semaphore and durable
attempt/audit semantics: socket destruction is not database cancellation or a
refund. There is no automatic retry. A file may not reach the customer even though
generation committed successfully. Node event-loop progress is necessary for
timer execution; proxy/host protection still needs separate acceptance.

Five controlled-time lifecycle tests plus nine transport/batch tests passed on
Windows and Linux. Clock checks prove no early expiry at 599999 ms, destruction
at 600000 ms, no progress-based renewal, timer/listener cleanup, repeat-event and
stale-callback safety, admission rejection without timers and re-admission. The
real Linux HTTP test invokes the exact scheduled callback against a backpressured
response and observes socket close and subsequent export admission. It does not
wait ten wall-clock minutes; fixed scheduling is verified separately with the
fake clock. Windows loopback can finish early and verifies the finish path.
These are local tests, not a ten-minute hosted slow-network soak, fairness policy
or an independently timed proxy/deployment acceptance test.

## Locking references for the cold-login regression

The observed session race is consistent with InnoDB's range/gap-lock model:
gap locks can prevent insertion even where no matching row exists. The repair
keeps the owner security lock but skips empty expiry deletion and targets existing
expired primary keys. See the [MySQL 8.4 locking reference](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html).

The separate defensive admission retry is limited to fully rolled-back deadlock
victims, not unknown failures. MySQL advises applications to be prepared to
re-issue transactions rolled back due to deadlocks; this implementation bounds
that work to three attempts. See [MySQL deadlock handling](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html).
