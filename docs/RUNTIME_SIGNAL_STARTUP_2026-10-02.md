# Signal-aware runtime startup checkpoint

October 2, 2026. Local synthetic qualification only; no public deployment,
purchase, provider change, publication or original-phase completion.

## Finding and repair

The earlier workspace-load attempt exited137 without an out-of-memory event
when stopped during startup. A controlled reproduction with the old packaged
runtime confirmed a concrete failure window: the real migrator waited on a
test-owned MySQL advisory lock, and a three-second container stop required forced
termination. This reproduces the locked-migration window, not every possible
cause of the earlier load attempt.

The production container now starts `node dist/start-runtime.js`, replacing the
shell migration/server handoff. The supervisor launches the packaged migrator,
then the packaged server only after successful migration and absent cancellation.
It forwards SIGTERM/SIGINT, waits for the child's actual close, retains failed
server drain or unexpected child failure, and has a fixed28-second shutdown
deadline. Repeated signals do not extend the deadline; failure to forward a signal
or deadline escalation fails closed. Logs contain fixed phases/codes, not raw
child errors. Build and release-inventory gates require the startup artifact.

Waiting for actual child closure matters: a successful signal-delivery call is
not proof of exit. See the [Node22 child-process documentation](https://nodejs.org/download/release/latest-jod/docs/api/child_process.html).

## Actual package and checks

- Fresh runtime image: `sha256:31f3252b20c6ba5c7edc4ac0869e833dd5bf72b9dfb9cb8fb498b251b7af87d9`,
  223,493,059bytes; default user `node`, command `node dist/start-runtime.js`.
- Fresh integration-test image: `sha256:ea96073c1ac528bcf1dff19ac404e6e82234660edcb458eb050d3d4363fd6fc8`,
  280,692,763bytes. This is a test image, not the nonroot production artifact.
- Both image builds completed successfully. Runtime build requires typecheck,
  unit tests, production build and production-only dependency packaging.
- Focused supervisor regression suite:14tests/one file passed on the host;
  current host application build and typecheck passed. Cases include cancellation
  before/during migration, handoff cancellation, SIGTERM/SIGINT propagation,
  genuine failed drain, fixed deadline, exited-PID protection and error privacy.
- Current host operator/audit suite:167tests/11files passed, no skips.

## Repeatable release regression and current parity

The reproduction is now a repository test, not only an external one-off helper:
`pnpm test:runtime-startup:integration`. Set `RUNTIME_STARTUP_TEST_IMAGE` to the
reviewed installed runtime image and optionally `RUNTIME_STARTUP_DATABASE_IMAGE`
to the installed database identity. Defaults reuse the already-built recovery
runtime and installed MySQL image. The test never implicitly pulls an image or
touches an existing database. It runs once in `pnpm test:all` and once in the
prepared CI verify job after the production runtime build. Hosted CI has not run.

The actual new release regression passed one test in47,466.4832ms. With the lock
held, both SIGTERM and SIGINT stopped the default runtime with exit0, no tables,
no remaining waiters and no server launch; the independent observer still saw
the lock owned by another connection. After releasing the holder, another
default-command runtime applied migrations, served real `/api/health` and
`/api/ready` with200 and the expected status, then stopped0 with both
`shutdown_completed` and parent `runtime_stopped` acknowledgments. Independent
inspection confirmed all five test fixtures stopped0/noOOM/no public ports:

- TERM runtime `c6f59e2ab77fabb45408828e99e1bb82513678b1777a318b99763337a07b8cc2`.
- INT runtime `bb4f4c11bee6756647404d3d51f09668c52156e2b96ef0000ff0fe17cad6cad8`.
- Normal runtime `96f29d16098a7c7395f4175779fae399380223d004042efaa3397ea53bcc22a6`.
- Holder `56eaacc9c1d0d8a5f19ceccbc2019f359c3e00d9ad349c64402c41158232c083`.
- Database `93d2e9f1cf952932a611d81acdd80901eacdc30dfaa2ff69d2be22ff742e0954`.

Application containers had zero mounts; the holder had one read-only synthetic
probe, not replacement application code. All used bounded resources, nonroot,
read-only filesystem and dropped capabilities. Current host operator gates then
passed168tests/11files/no skips in7,445.6709ms, including the new CI ordering check.

Three separate nonroot network-disabled package probes also passed: both images
contained identical116compiled application/migration files,6,958,981bytes, digest
`adba172f742cbbe843e66aeba7143b2ecb3440c67cb63af8f1dd3689fe37ce5e`.
The runtime lacked application source and development tools; direct compiled
server checks covered invalid configuration, occupied-port refusal, HTTP
liveness and clean shutdown. These direct checks do not substitute for the
default-command regression above. Probe fixtures `bad1cb06...`, `79d64338...` and
`6216388c...` independently stopped0/noOOM/no public ports. Each mounted only the
external observation helpers, not application replacements.

Selected host inventory before the later load-diagnostic edit:549files, digest
`1803f24d42d780e9baab63f574fa3f315bbd88916d90bc5ca54a6103677d69ad`.
The new root release-test/CI wiring was added after these immutable images were
built; their application/migration parity is not whole-checkout build provenance.
The inventory excludes root scripts/docs and cannot establish causal build,
hosted tests or production acceptance.

## Fresh mandatory database qualification

The new exact test image completed the migration command and mandatory database
suite with724tests/43files passed, no skips or failures, in316.11seconds
(326.757seconds including the fixture's command startup). This was a fresh
isolated MySQL database, not the older image's repeat. The image carried its own
application, compiled artifacts and tests; zero source mounts or public ports.
Cases include migration startup/history refusal, account/session/recovery,
ownership fences, admission, import/export, review/edit workflows and presets.
This broad local suite is not every requirement, provider or hosted path.

Final independent inspection confirmed test container
`c70430b62210e2d51f3e187e183b3dbf8ca8eb49913b31d4f1729bdfc8a07944`
and database
`c9500e9cd4d8a18e32c25ff89039a13b788fde12ebfaf17c45904c9e8c7e62d1`
both stopped0/noOOM/no public ports/no mounts. Fixtures were retained, not deleted.

## New-runtime encrypted recovery rehearsal

The repository's full-schema encrypted backup/isolated restore test passed with
the new exact test/runtime identities in46,783.6551ms (one test/no skips). It
checked schema/migration and binary/UTF-8 preservation, unchanged source data,
authenticated-ciphertext refusal, empty-target/restricted-grant requirements,
and a restored actual default-command application. The application probe confirmed
two synthetic owners, two owner-scoped candidates, real login, revoked historical
sessions and zero provider actions. This is not real inbox verification or a
customer-data rehearsal.

Independent final inspection confirmed these exact three fixtures stopped0,
noOOM and no public ports:

- Application `848ade46e8e8942e0801d161f9060ea1aaf29da5613b434b3e73286a15a5c594`,
  exact new runtime, one read-only observation helper and no application replacement.
- Source `f075b8697c70522f0ff45d8af328b389d4265ff6b326cfb05f35cd118659f88d`.
- Target `78135ca55ad20cf3ff832846fa5c59c94e15bdd30cf18c3efe1a3e0be3471223`.

Application logs independently included normal migration/server launch and both
child `shutdown_completed` and parent `runtime_stopped`. The two database fixtures
had no mounts. Test-created temporary backup/key files were removed by the
rehearsal's existing cleanup; no user source data or retained containers were
deleted. Independent off-host storage, separate key custody, actual hosted
recovery objectives and operator execution remain unverified.

The new real-container fixture used the exact runtime's default command with no
application source or compiled-file mounts. MySQL8.4.11 was an isolated temporary
database; the test-owned lock holder mounted one read-only observation helper.
No public ports or provider communication; bounded resources, read-only
filesystems, dropped capabilities, nonroot users and synthetic credentials.

Before stopping, an independent database observer confirmed exactly one real
migrator waiting on the owned lock and zero tables. The new runtime stopped
within the three-second stop grace with exit0, noOOM, no server-start event, no
migrations-applied event, zero remaining migration waiters and still zero tables.
Its logs recorded migration launching, stopping and stopped. The lock remained
owned by the separate holder until cleanup.

Independent final inspection confirmed all six baseline/new containers stopped,
noOOM and no published ports. Baseline app retained exit137; baseline database and
holder exited0. All three new fixtures exited0. No containers or data were deleted.

Fixture identities:

| Fixture | Exact container ID |
| --- | --- |
| New runtime | `62bcdfbbdd3460281bc53a6c1b3434c09d80e37b851776050972b42892288f96` |
| New lock holder | `a05ed4ba1ee52332ef11fb0ad4bf36649a63db4345c779c86f32aef5b29c187b` |
| New database | `3e6c8ee5876c357efc4b8ee7096f59cefc34cd8cddff8ab23ebb7de54ff628fc` |
| Baseline runtime | `19bf7edf5297920a83b599ae72b85e5e2629ef723e99b17040697f778077ab65` |
| Baseline lock holder | `d296def57dc3ad683a04d68487c3c464b0dd7a5924ac0f5109384c40db6e8c80` |
| Baseline database | `7a636a52e48af573771d27f15bb02b5eef53da96b289a6a41d269b1095a2a100` |

External local fixture helpers: `outputs/runtime-signal-20261002-r1/runner.mjs`
and `probe.mjs`, outside the repository. Baseline used the earlier exact runtime
`sha256:eaa6752ebb72e68c3bc7b629b9dc1554238291cee77e4deb771470b037626859`.

## Remaining acceptance and budget boundary

### Current connected browser acceptance

The exact new runtime passed23connected Chromium stages in isolated Playwright
using the existing installed QA image69de0b53...; Browser skill/plugin was absent.
The fixed local origin was `http://localhost:13216` inside a network-disabled
container namespace, not a publicly accessible endpoint. Main desktop1365×1000
and mobile375×812 were checked; login also used768/1440 and catalogue768 widths.
This does not mean every page/browser/tablet was covered.

The flow exercised real login, source-catalogue alias search, individually
declared intake, retained candidate correction, assessment, draft review and
manual preparation, a synthetic manual-completion record, reminder/response/
close history, archive/restore/opt-out, reported partnership progress, unsent
revision/cancellation and private account download. Real HTTP account mismatch
and anonymous refusals were observed, not substituted responses.

One import reply was deliberately lost after the actual server committed it.
The UI locked the CSV/declaration; an unchanged retry sent the exact same request
and produced one candidate, not a duplicate. A denied source produced no imported
rows; allowing input edits required explicit existing-record review and a fresh
declaration. Oversized20MiB retained export refused without a partial download.
Tests used synthetic preverified accounts, not real verification email. No
external provider action, real send or fabricated RPC result occurred.

Page identity/title, meaningful workspace, no Vite overlay, real interactions,
desktop/mobile screenshots and console checks passed. Unexpected errors and
outside-origin requests were zero; eight diagnostics from intentionally exercised
refusals/lost reply were separately accounted for, not hidden. Screenshots were
visually inspected: recovery text and controls wrap without clipping. The CSV
form still mixes English labels/legal descriptions with Dutch recovery notices;
this remains a known incomplete language surface, not full bilingual acceptance.

Independent final inspection: QA `e1167bd359aad06ab41e38b1b363093e09292cd93457bb4365aad90106e16ef7`,
runtime `1c87e59872df076d3f83324a77cec9afaac418a92907d625aca55751811b7b5b` and
DB `5c6e3f044f798e23a1847e0554ee37ad920729cbb895a5744866aee433ebaf50`
all stopped0/noOOM/no public ports. App/DB had zero mounts. QA mounted only its
external driver/output directory, not application code. Both child/parent clean
shutdown acknowledgments appeared in the real runtime logs.

External browser driver SHA256
`4d590a916f46baa736961ba144f6484f24f339c53eb9ccaf28c2bde1adeab5bb`;
runner `b66cd9ff558103b09a753cd696024ad601e548db67fc6e5b2dc60193b3d312a7`.
Helpers/screenshots are outside the repository under
`outputs/runtime-signal-browser-20261002-r1`. The runner now attempts every owned
cleanup without masking a primary failure and uses the actual30-second stop
budget; no runtime code changed for this browser run. Cleanup does not delete
retained containers or user data.

### New-runtime bounded read/write load

The new exact runtime also completed the synthetic load in session34526/exit0,
using100accounts/10,000candidates, real HTTP login and18,000measured reads plus
12,000write-workflow requests. Setup directly seeded synthetic accounts/data,
bypassing signup, email verification and intake. All100logins and exactly100
durable admissions passed; login p95480.14ms. Separate600warmup reads and300
cross-owner read denials passed. No provider action or customer data.

The predetermined normal successful-response p95 limit remained2,000ms, without
raised capacity limits or automatic retries. Closed-loop actor concurrency is not
an open-loop arrival rate or a simultaneous-user capacity guarantee.

| Workload | Actor loops | Requests | Success / expected refusal | Success p95 | Success p99 | Wave duration |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| Reads | 5 | 6,000 | 6,000 / 0 | 70.66ms | 102.56ms | 29.02s |
| Reads | 20 | 6,000 | 6,000 / 0 | 196.28ms | 301.76ms | 27.46s |
| Read overload | 100 | 6,000 | 885 / 5,115 busy503 | 791.22ms | 1,236.02ms | 8.44s |
| Write workflow | 5 | 6,000 | 5,000 / 1,000 stale409 | 68.78ms | 120.92ms | 31.55s |
| Write workflow | 20 | 6,000 | 5,000 / 1,000 stale409 | 237.38ms | 365.87ms | 32.11s |

Transport/correctness/retry-header errors were zero. The overload result proves
predefined orderly refusal, not100simultaneous successful users or fairness.
Each write wave committed3,000changes, observed1,000unchanged replays and refused
1,000stale edits. Independent database reconnection verified all10,000rows after
each wave and per-owner/action audit totals.400cross-owner mutation denials left
all10,000candidate/6,000audit rows unchanged.

The harness diagnostic now says `auditOwnerActionCountsVerified`, replacing
`auditExactlyOnceVerified`: matching totals do not establish each event's causal
identity, content or exactly-once execution. No workload or acceptance thresholds
changed. Dedicated strict TypeScript checking, formatting and seven harness
regressions passed (21ms cases/405ms total). The current diagnostic was separately
bundled and executed; the older immutable test image does not attest to this
later test-entrypoint label change. No production API/UI/compiled application
change occurred for this repeat.

Application limits:1CPU/512MiBmemory-and-swap/320MiBNodeoldspace, nonroot/read-only,
zero application replacements, only two read-only synthetic secret files.
Database1CPU/2GiBmemory-and-swap/1GiBtemporary data filesystem; runner1CPU/512MiB
and one additional read-only load helper. Networknone/shared namespace/no ports.
Charged cgroup peaks: app243,363,840bytes, DB760,242,176bytes, zero max/oom/oom_kill
events. Temporary database storage is included; this is not disk-backed hosted
capacity proof. Post-load health/readiness returned200; actual default runtime
recorded both child and parent clean shutdown acknowledgments.

Independent final inspection confirmed runner
`6e196f8e876d67e6c8b7971b547cc0d8801b5a8e4267885e5001552c3a840d48`,
app `20390839e11a84a7a0767967fdd83a121d08f2da25939a58bbcd6b3c9a0c75fb`
and DB `2fb663f7d26567ed6b524581e8e8dca9534c3612826aeddce7b60703de7ebb90`
stopped0/noOOM/no public ports. None was deleted. External helpers are under
`outputs/runtime-signal-load-20261002-r1`; bundle SHA256
`d4a40bdbda583712d1e1fbe0073fd43ccb09ad590d1fac16d5c56ff287807bea`.
Load-entry source SHA256
`6a0c9889834bbab8656def90bddfa45e5b381aaa4d18e750272a34f767fc02d8`;
finite-workload helper remainsb9c22389.... Current selected host inventory549files,
digest `e044a2792d7ccb0904e413fc56dd05b62044327dc1039c4839a640c77a9dd131`,
not causal build provenance. Final host operator suite168/no skips passed
3,187.1712ms. The live production-dependency audit reported no known vulnerabilities
at this checkpoint; that is not an exhaustive security guarantee.

This proves cancellation while waiting before schema changes, not rollback of
already committed MySQL DDL or safe interruption at every migration point.
SIGTERM/SIGINT now have both controller and real-container coverage for the
locked-migration window. Deadline escalation remains controller regression
evidence, not real-container coverage of every failure path. Hosted resource
contention and shutdown timing remain unverified.

Current connected browser and bounded load checks are now repeated for the new
image; earlier receipts retain their original image scope. Hosted ingress/TLS,
real inbox/provider/operator acceptance, independent off-host backup/key custody,
long-running/open-loop soak, same-account writers, overload fairness and the
representative signup/import/outreach/mail/deletion workload remain open. Mixed
CSV language and worldwide source/channel coverage also remain unfinished.
The full116-phase matrix remains
Partial, not complete.

Robert confirmed an initial EUR100/month operating ceiling. EUR80 operations and
EUR20 contingency remain planning allocations, not purchase approval or proven
provider billing enforcement. See [the operating-budget boundary](OPERATING_BUDGET.md).
