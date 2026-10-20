# October 2 help and 63-source package qualification

Historical 63-source receipt: the later Cyberport/CSAA addition has its own
[64-source package/database/startup checkpoint](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).
The browser, recovery and load results below qualify these 63-source images,
not the newer ones. Original failures and subsequent corrections are preserved.

This is local synthetic evidence, not public-beta release approval. Fresh images
include the reachable bilingual help page and current source; no application
replacement mounts were used for browser checks. No GitHub publication, provider
action, deployment or purchase occurred. All 116 original phases remain Partial.

## Exact artifacts and passing checks

- Runtime image: `sha256:8158088468691661e9df89e18d602e0256096ee9bcb2bd337c7456cfd39462ef`.
- Integration-test image: `sha256:3191deb41d99e9af01dbf549e510ddfbedfb825efba7c9615e93bb22cb2e6ad1`.
- Database image: `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
- QA image: `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`.
- Runtime build: typecheck, 979 unit cases across 96 files (116.52s), production
  build (Vite 4.64s), pruned production dependencies; terminal exit 0.
- Mandatory database suite: 724 cases across 43 files, no skips, 306.20s;
  helper elapsed 311.606s, terminal exit 0. Fresh temporary storage, no real data.
- Both images contain identical 117-file `dist`/`drizzle` inventories,
  6,982,040 bytes, digest
  `0aa9220e80ffff02836b32045dbf447ffa8981c2c9ac872a46a51f36f50015b8`.
  Node 22.23.3 and runtime UID 1000 verified. Runtime source/dev tools absent;
  the test image intentionally retains source. This is artifact parity, not a
  cryptographic source-to-build provenance attestation.
- Direct compiled-server probes passed private invalid-configuration refusal,
  occupied-port refusal without fallback, actual liveness and clean TERM exit.
  These bypass migration startup and cannot qualify the default command.
- Real Chromium on the exact runtime/default command passed anonymous `/help`,
  five topics, English/Dutch switch and reload persistence, local anchors,
  keyboard link focus, actual new tab with null opener and desktop/mobile
  viewports (1365x1000 and 375x812). Zero account API requests, outside-origin
  requests or unexpected console/page errors. No mocked RPC or live account.
  The mobile screenshot was inspected: readable wrapping, vertically scrolling
  content and the existing long translation notice above the page. This is not
  a complete accessibility certification.
- Selected host inventory before/after: 556 files, unchanged digest
  `48c066dad45a6836572fa171d05ecfa506b336258c345bf0e8ce95a963907eaf`.
  It excludes documentation, root operator sources, dependencies and host state.
- Final host operator suite: 168 cases, no skips, 3,378.0754ms, exit 0.
  Whitespace checks passed. Requirement integrity passed with all 116 phases
  Partial and `completionProven:false`; this is traceability, not completion.

## Initial failed default-startup regression (retained)

`scripts/runtime-startup.integration.test.mjs` exited 1: one failed test, no skips,
19,598.9914ms. TERM cancellation passed its checkpoint. Following INT cancellation,
the runtime stopped with exit 0, no OOM, no migration/server handoff and no tables
created, but the immediate independent database observation was:

```json
{"waiting":1,"tables":0,"otherConnectionOwnsLock":true}
```

The required `waiting:0` assertion failed. The subsequent normal startup/drain
portion was therefore not reached in this regression run. Browser default startup
success does not replace this cancellation test. Source inspection shows that
the supervisor forwards signals and waits for child closure, while the migration
process relies on process termination during `GET_LOCK`; the persistence timing
of the database wait is not yet established. It must not be called harmless,
fixed or green. No timeout was increased, assertion weakened, case skipped or
rerun substituted for this failure. Next: measure the exact cancelled database
connection's lifecycle under the same signal, then resolve and requalify the
appropriate runtime/test boundary with the original failure retained.

## Subsequent cancellation diagnosis and corrected acceptance

The initial failure above is historical and was not discarded. Separate synthetic
diagnostics ran one INT cancellation, six alternating TERM/INT cancellations,
then twenty alternating cancellations on the exact same runtime/database images.
Seven of those 27 cancellations initially showed a waiter, subsequently zero;
all observations retained zero tables and the separate holder's lock. Latest
zero-wait observation was 1,792ms after the process-exit/log checks, not a latency
measurement from the signal. Diagnostic loops deliberately allowed observation
up to 65 seconds: their passing results are not acceptance under the original
three-second cancellation budget.

The [exact MySQL 8.4.11 source](https://github.com/mysql/mysql-server/blob/mysql-8.4.11/sql/mdl.cc#L3205)
checks client connectivity during one-second metadata-lock waits and then removes
a disconnected user-lock waiter. Thus process closure and the database's cleanup
observation need not be simultaneous. This source evidence plus the reproduced
transient explains the faulty immediate-observation assumption; it is not a claim
that every database/host disconnect will meet the same bound.

Only root test tooling changed; application/migration/runtime source and images
are unchanged. `runtime-startup-observation.mjs` requires zero waiters under an
absolute deadline established before signalling. It asserts no DDL, continued
holder ownership and at most the single expected waiter on every observation.
The existing three-second cancellation allowance is now shared by process exit
and database cleanup, rather than renewed after process exit. Permanent waiters,
late zero observations, DDL, lost holder, invalid waiter counts and observation
errors are tested refusals. No larger cancellation or migration timeout, test
skip, global database KILL, permission expansion or production workaround.

Corrected exact-image acceptance passed twice with no skips: 26,966.8075ms and
25,028.5873ms. Both runs reached TERM/INT cancellation, normal default migration,
real HTTP health/readiness and parent/child drain. Second-run cancellation elapsed
from the signal boundary: TERM 1,053ms and INT 962ms, both within 3,000ms.
The five second-run fixtures were independently inspected, stopped 0/no OOM/no
ports; application/database mounts zero, holder helper mount only.

Raw diagnosis/corrected logs are under
`outputs/migration-cancel-diagnostic-20261002-r1/` outside the repository. The
41 first-diagnostic/corrected-run fixtures were independently inspected as well:
stopped 0/no OOM/no ports; retained, not deleted. Root operator suite now passes
169 cases without skips (4,609.4946ms). Selected application/build inventory is
unchanged; it does not include these changed root test tools. Requirement and
whitespace checks pass, still all 116 phases Partial. This closes the local
bounded startup-observation defect, not public hosting/operator acceptance.

Second-run IDs: TERM app
`22fbe903c6bcb700b6951a7c27d038751db495d304d1feb5cd86b66bf1d3d8f2`, INT app
`b29b5a93d3baaf346acd373a119bfc6445d164586bfde19e4386908bce0f55a9`, normal app
`1029b8811aa43653b00fad3afcc8478784b8de8aa099c937cff89b31378e5aeb`, holder
`a7a7d41b89609cc009392c0aa4a311b7382e3f1c874e3a42473d4cc533c669b3`, database
`a3b8b3f85ee64c45350c9ce124a8d4be290282df36c0e5e3773b86824fa43064`.

## Fixture and receipt scope

### Subsequent current-image read/write and competing-edit load

A fresh isolated run qualified the current exact runtime above, using its actual
default migration/start command, no source/compiled replacement mounts and no
published ports. Previous build receipts remain historical; their acceptance was
not transferred. The current source helper was freshly bundled outside app `dist`.
Application and runner each had one CPU, 512 MiB memory/swap, 320 MiB Node old-space,
non-root UID 1000, read-only root, dropped capabilities and 256 PIDs. MySQL had one
CPU, 2 GiB memory/swap, 1 GiB temporary data storage, UID 999 and network none.
The app/runner joined that fixture's isolated loopback network. Mail, registration,
deletion, providers and legacy paths stayed disabled; outreach stayed paused.

100 preverified synthetic accounts/private profiles and 10,000 manual candidates
were inserted directly into a freshly migrated empty database. All 100 real HTTP
logins passed (p95 477.16 ms), with exactly one durable global admission each;
600 warmup reads and 300 cross-owner read refusals passed. Direct fixtures bypass
signup, inbox verification and intake permission; they do not qualify those paths.

| Workload | Concurrent actor loops | Requests | Successful p95 / p99 | Result |
| --- | --- | --- | --- | --- |
| Reads | 5 | 6,000 | 74.73 / 109.18 ms | All 200; 31.18 seconds |
| Reads | 20 | 6,000 | 231.87 / 337.19 ms | All 200; 31.61 seconds |
| Read overload | 100 | 6,000 | 1201.33 / 1765.77 ms | 900 success; 5,100 busy 503; 10.95 seconds |
| Write workflows | 5 | 6,000 | 74.82 / 118.54 ms | 5,000 success; 1,000 expected stale 409; 33.67 seconds |
| Write workflows | 20 | 6,000 | 241.55 / 395.63 ms | 5,000 success; 1,000 expected stale 409; 32.16 seconds |

All five tiers passed unchanged predefined rules, with zero transport/correctness
errors and valid overload Retry-After headers. Normal-tier successful-response
p95 stayed below the fixed 2,000 ms threshold. No raised limits, retries, think
time or response caching. Overload passing proves orderly refusal, not capacity
for 100 simultaneous successful operations. This is a finite closed-loop workload,
not an open-loop arrival-rate test, continuous throughput guarantee or live SLO.

Each write tier exercised review/edit/unchanged replay/stale conflict/archive/
restore. Independently reconnected storage verified all 10,000 candidate rows,
including 9,900 untouched rows, expected titles/restored state and preserved
non-title fields. Each tier committed 3,000 changes, 1,000 unchanged replays and
1,000 refused stale edits. Per-owner/action audit counts matched; those aggregate
checks alone do not establish universal causal exactly-once behavior.

Paired independent sockets then passed 100 different-title races and 100 identical
title races (400 edit requests, five account pairs concurrently). Both requests
finished sending before either response header arrived; this proves wire overlap,
not a server transaction barrier or deterministic lock order. Each different
patch race had one changed 200/one stale 409; each identical race had one changed
200/one unchanged 200 with matching revision. Independent storage verified 200
winning request-to-audit receipts, all previous audit rows, all candidate rows
and untouched fields. A final 400 foreign-owner mutations were refused, preserving
all 10,000 candidates and 6,200 audit rows. No automatic retries.

Post-load health/readiness both returned 200. Cgroup peaks: application 248,717,312
bytes; database 761,442,304 bytes (including temporary storage). No max/OOM events.
Actual runtime logs acknowledged child shutdown and parent stop. Three retained
fixtures independently inspected exited 0/no OOM/no ports:

- Runner `79547cc9852a10014ac71b1fbc4b1d139e48f480301614bd3ecba83637bb6dbe`.
- Runtime `93e28ff42ae7433be28e3c856da8fa864272f613c094f37997c05df0055c6440`.
- Database `359b91e9e0931139859372f0bfe0f97630db86d0560b1f049deb75102d667086`.

App mounts were two read-only synthetic secret files only; database had none.
Runner mounted those files plus the test helper, not an application replacement.
Raw logs: external `outputs/help63-load-20261002-r1/`. Bundle SHA256
`1020228eead5e1e430e6be88e83fd3310054b2e10708abe7f1a2856f496dd170`;
runner `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
Source entry `f4aec6164c0ff5101fbd2064b48dd970e3e764da5bee5120c282c6fd37a1e144`,
write helper `b9c223890331e473330a527a226e569e9a618f3fe29e992c1506063d26b6d858`,
race helper `7908647f44c1249b63ffbdd8cdced1ea0e83b9a050e0e0dbba3356b27b511a3c`.
15 focused harness cases passed (719 ms), 169 operator cases passed without skips
(2,937.6767ms). Selected 556-file application/build digest remained
`48c066dad45a6836572fa171d05ecfa506b336258c345bf0e8ce95a963907eaf`;
root tools/docs excluded, no causal build attestation implied. No app source changed.

This closes bounded current-image read/write and paired-edit load qualification,
not archive/restore/fence races, more than two writers per record, long soak,
simultaneous exports/workers, whole-product signup/import/outreach/deletion load,
hosted networking/storage, real customer pilot or EUR 100/month hosting capacity.
No real account/provider action, purchase, deployment or GitHub publication.
All 116 phases remain Partial; full completion is unproven.

### Subsequent account-mail replay prevention

Worker inspection found a separate revival path: a restored queued reset request
can generate a fresh token, bypassing the old-link expiry safeguards. Restored
password-change notices can also retry delivery acknowledged after the snapshot.
The regression seeded four future-valid queued/stale-leased jobs across both kinds
with valid encrypted address payloads, plus accepted/failed/discarded history.
After backup the source active jobs were marked synthetically acknowledged.
Old restore revived four replayable jobs: expected zero, observed four; exit 1,
44,524.0454ms. No real delivery was simulated as an actual provider receipt.

Root restore now requires `state`/`expires_at` on the `account_mail_jobs` base table,
expires only queued/sending jobs using the session-local clock and checks zero
unexpired active jobs before success. It does not delete rows, decrypt payloads,
change attempts/leases/provider IDs, alter terminal records, reset quotas or issue
tokens. Missing/incompatible schema or failed checks produce the private
`restored_account_mail_invalidation_failed` code; keep any imported target isolated.
Direct/manual SQL imports do not apply these safeguards.

The first post-fix rehearsal passed restore/application checks but failed worker
probe setup: ESM could not locate `tsx` from `/app`. Retained exit 1,
69,268.9529ms. The helper now starts from the test package's actual app directory;
no dependency installation, image change, application replacement or softened
assertion. Final full rehearsal passed exit 0, 71,623.3459ms, no skips.

Actual worker source from the exact test image, against the restored database,
returned four `discarded` results then `idle`. A throwing, counted synthetic
fetch guard observed zero provider-call attempts; the enclosing network was the
owned network-none database fixture. No real provider/inbox was involved. Worker
cleared those four payloads/leases; retained terminal records and identity/kind/
attempts/provider/creation metadata matched. No budget reservation rows were
created and reset-token fields remained unchanged. This qualifies the worker
selection/discard path, not compiled production-worker startup or live delivery.
The exact production runtime/default command separately passed HTTP old reset/
verification-link refusal, unchanged two-owner login/isolation and all earlier
schema-object, unsafe-target, session and source-preservation recovery checks.

169 operator cases passed without skips (4,697.0082ms). Selected 556-file
application/build digest stayed
`48c066dad45a6836572fa171d05ecfa506b336258c345bf0e8ce95a963907eaf`;
root tools/docs excluded, no causal build attestation implied. CLI SHA256
`85819a0dbcc9d9bdfe9936704355e7f4ac4c4f1aed80e21f28f6da69bb418034`,
harness `e02c5afef68cf76ff3bbad3940983b041480ade5ad3d906ef983a0cbd0f08154`,
mail probe `87e0b566827f3d81a982c6978145c05af3a0cae7f9151ef4047e903a285246d8`.
Logs outside repo: `outputs/help63-mail-restore-20261002-r1/`.

Four main fixtures retained and independently inspected stopped 0/no OOM/no ports:
source `d9621b688f614a62456c813d6ea5e9a50d93b03a1c4883420db50de45f4e2bb5`,
target `3b976c7b9f2fd36b620ce126ab5777ebb6bb2cbb267849a829ce8d0895ea4ad4`,
refused binary target `bde0a5b82abd4377bc96c0e21ea35c3121e8854be0aeea2caf43390e4e51fe9d`,
runtime `ec25d1029eafffd75fe0bcccd3809c2ea78e323b73d9428efe65c77e5a0e0cf7`.
Runtime mount was a read-only observation helper; no database bind mounts. Owned
ephemeral migration/worker runners and generated temporary fixture key/backups
were removed by the existing fixture lifecycle; no real data/prior backups removed.

Post-backup mail acknowledgements and budget usage still need independent review;
expiry is not reconciliation or permission to resume old jobs. Account/address/
verified-status changes, deletion/suppression, provider credentials, independent
key recovery and hosted promotion remain open. All 116 phases remain Partial;
no commit/publication/deployment/live recovery/purchase performed.

### Subsequent email-verification authority invalidation

The next regression reproduced the same snapshot-revival defect for an email
verification link: an unverified synthetic account had a future-valid,
address-bound token at backup, the source token was cleared after backup, and
restore revived one active link. Required zero, observed one; exit 1,
40,691.2952ms. This failure is retained, not reclassified as a passing rehearsal.

Root isolated restore now requires both verification columns on the `users` base
table, expires timestamps using the session-local clock and checks zero active
links before reporting success. Digests, address binding, already-expired
timestamps and verified flags are preserved. Missing/incompatible schema or an
unsuccessful check reports `restored_email_verification_invalidation_failed` and
leaves the imported target isolated/unapproved. This is not a migration or an
automatic rollback, and direct/manual SQL imports do not apply this safeguard.

Expanded exact-image recovery passed, exit 0, 52,692.3193ms, no skips. The actual
compiled HTTP server refused the old validly formatted token with 400 and
`Invalid or expired verification token`; the pending account stayed unverified
and acquired no `auth.email_token_redeemed` audit. The two existing owners retained
their verified flags, original passwords and isolated candidates. Reset/session
revocation, schema-object roundtrip, unsafe-target and source-preservation checks
also passed. No RPC mocking, inbox contact, provider action or real account.

169 operator cases passed without skips (3,838.3101ms). Selected application/build
inventory remains 556 files, digest
`48c066dad45a6836572fa171d05ecfa506b336258c345bf0e8ce95a963907eaf`;
this selection excludes root tools/docs and is not causal build attestation.
Root CLI SHA256 `ae8b7c90b5f821acb3b263ac9e58266f697da380da03eddca2647bbce07bb996`,
harness `99a505dd03abd63291e4183980d4a1de8cf80fcb901a51234572a7fc22b0f550`,
probe `fd403ff2e9f17bfac54d6c529f2808fd8749289207ed739d03f72ee2b46ce8f2`.
Logs outside repo: `outputs/help63-verification-restore-20261002-r1/`.

Four retained fixtures independently inspected exited 0/no OOM/no public ports:
source `86c3492dbe9dab733b6a560fc151cf5e02135b3cc70b95578b934031c556f565`,
target `e21f5db4df687f2949a2b9c1d2cbfcc511c3dbd5c21a207f8fd397d5928573a0`,
refused binary target `8e557a30e209d6c8b49bf9a94b1f9ae6ce69b14b514cad78270b06e4f9f92e24`,
runtime `e7439cb1a03c75003f49010f3c222307808d33d993e072baeb2bcf80bea2ed22`.
Runtime used the exact current image/default command, with only a read-only
observation helper mounted; no application replacement. Database fixtures had no
bind mounts. Only generated temporary fixture key/backups removed by the existing
test; no real data or prior backups removed.

This closes verification-link revival, not post-backup account reconciliation:
password/address changes, historical verified-status changes, queued mail,
deletion/suppression, provider credentials and independent key/secret recovery
remain open before promotion. All 116 phases remain Partial, completion unproven.
No commit, publication, deployment or live recovery occurred.

### Subsequent password-reset authority invalidation

The added regression failed against the preceding CLI: a synthetic reset link
was active in the snapshot, revoked in the source after backup and active again
in the restored target. Exact assertion observed one active link versus required
zero; exit 1, 36,372.6936ms. This was a real persisted-state defect, not an inbox
simulation or a test timing issue. Raw failure retained.

The isolated restore CLI now requires both reset columns on the `users` base
table, expires reset timestamps using the session-local clock and verifies zero
active reset links before emitting success. It preserves token digests and
already-expired timestamps; it does not clear accounts/passwords, contact users,
change privileges or reclassify verification. Missing/incompatible schema or a
failed expiry check reports `restored_password_reset_invalidation_failed` and
leaves the target unapproved, even though SQL import may already have occurred.

Current exact-image expanded recovery passed (48,316.6842ms), including all earlier
schema-object/binary-target/unsafe-target/session checks and a real HTTP request
with the old validly formatted raw reset token and a valid replacement password.
The compiled server returned 400 with the exact expired-link refusal; both owners
then signed in with their original passwords and retained isolated candidates.
Historical digests and the previously expired timestamp matched snapshot values;
source revocation remained unchanged. No provider action or real account used.

169 operator tests passed without skips (4,954.3609ms). Root tooling only changed;
selected 556-file application/build digest remains unchanged. New CLI SHA256
`6c2e84fd7a2ef623117911db0ea296e335faca0d6fafd2ec44a50bdb4c70705c`,
harness `3dd87c65a1f82f0af4401dfabbe3b51b9e72f373fdcc1dfcb08067c950301bd5`,
probe `03bea1179465a78280120696db145fc94edf389d5f9250843e1b1d82eded66a1`.
Logs: `outputs/help63-reset-restore-20261002-r1/` outside repo. Only generated
temporary fixture key/backups removed by the existing test; no real data removed.
Main fixtures retained and independently inspected stopped 0/no OOM/no ports.

This closes password-reset-link resurrection in this CLI, not every recovery
credential concern. Verification links, post-backup password changes/compromise,
provider credentials, queued mail, deletion/suppression state and independent
secret/key recovery remain subject to operator reconciliation before promotion.
All 116 phases remain Partial; no live restore/deployment/publication authorized.

### Subsequent exact-image connected customer workflow

The current runtime passed all 24 retained Chromium workflow stages, plus the
new Help/unsaved-draft checkpoint. Actual default migration/start command, no
application/source/frontend/backend replacement mounts, no public ports. Browser
plugin/skill absent; the existing isolated Playwright QA image was used without
dependency installation. Browser version 148.0.7778.0. Desktop 1365x1000, mobile
375x812 and selected login/catalogue tablet 768x1024 checks; login also 1440x1000.

The flow exercised real synthetic sign-in, 63-source catalogue/aliases/held-source
absence, individualized intake and duplicate reuse, Dutch candidate correction
and evidence preservation, assessment, original draft/declarations, review/
approval/manual preparation/copy, synthetic manual-completion receipt, local-time
reminders, responses, close/history, archive/restore/opt-out, private progress,
password-confirmed account JSON and candidate CSV, unsent revision/cancellation,
lost-response committed-import replay and blocked-source/oversized-export refusal.
Database observations checked persisted outcomes and absence of unwanted updates.
One real import response was fetched then deliberately aborted; retry retained
identical payload/declarations and one candidate, not a simulated RPC response.

Additional Help check opened the actual Dutch `/help` in a new tab from an
unsaved original-message editor; null opener, expected title/heading, unchanged
workspace URL, exact unsaved text and checked authorship declaration all passed.
Keyboard traversal now explicitly verifies the newly present Help link between
language selector and email input. These are observation-harness changes only;
no application fix or redesign was made in this checkpoint.

QA checks: intended URL/title, meaningful content, no framework overlay,
interaction/persistence and screenshot evidence passed. Eight specifically
matched refusal/fault diagnostics, zero unexpected errors, zero outside-origin
requests, zero provider actions and zero real sends. One synthetic completion
record is not delivery proof. Directly preverified synthetic users do not prove
real signup, email/inbox verification, password-recovery delivery or live consent.

Desktop/mobile workspace and composer screenshots were inspected: content wraps,
controls readable/reachable, no observed horizontal overflow. Existing global and
workspace translation notices occupy substantial mobile space; retained UX debt,
not a complete accessibility/translation certification. No visual redesign was
required by this qualification; other browsers/assistive technologies remain open.

External logs/screenshots/helpers: `outputs/help63-workflow-20261002-r1/`.
Driver SHA256 `78388da8b895e7ca48415a4d85879eea1825fe360fe32a0766f6e172186d294d`;
runner SHA256 `cb576911df7f896b40e7df0fd0cd21e6e05b8bb8145decc68a54f16b5cf82c39`.
Three exact fixtures independently inspected: stopped 0/no OOM/no ports, preserved:

- QA `95e506c6b4b0a0185a3052f48134b0df1461d7df66d86f36dd8bd51a528f762c`,
  helper/output mount only.
- Runtime `1d77af73f99cb5f5cb1228da7a1798c0ce784de2973b5c188e589ae0f4eeccdc`,
  zero mounts, exact current image above.
- Database `d2aa1e1ef9d979ae5570e2bf47a1c8cf911a1a6f78b8ffb304d10fab840d77a4`,
  zero bind mounts, temporary synthetic storage.

Selected 556-file application/build inventory unchanged. This does not prove
every retained UI/API path, all original phases, production capacity, independent
customer/operator acceptance or a public deployment. No commit/push/publication.
Final root operator checks: 169 cases, no skips, 4,205.5619ms, exit 0; whitespace
and requirement integrity passed, still 116 Partial and completion unproven.

### Subsequent expanded encrypted recovery

Current runtime/test images above passed the original recovery rehearsal
(37,704.4195ms), then an expanded full-schema rehearsal with the current operator
CLI (67,748.8678ms), no skips. The expanded run actually creates/restores a view,
stored procedure, trigger and enabled scheduled-event definition using the
confined account as definer. It compares their metadata/definitions, reads the
view, calls the procedure and proves the restored trigger's effect on one new
synthetic row. Source/target schedulers remain OFF and the event's sentinel row
remains absent; no scheduled execution is claimed or required.

Two intermediate expanded runs failed before backup/restore acceptance:
15,494.5895ms because the fixture scheduler defaulted ON, and 18,037.8575ms because
binary logging prevented confined-account trigger creation (error 1419).
Both raw failures retained. Dedicated rehearsal source/target now start with
`--event-scheduler=OFF --skip-log-bin`, with actual settings asserted. No SUPER
grant or permissive function-creator setting was used. The operator restore CLI
now rejects `@@GLOBAL.log_bin != 0` before any SQL import. A third fresh,
binary-logged target proves this refusal and zero imported tables. This is a
deliberate isolated-target preparation requirement, not an instruction to disable
logging or change permissions on a live database. Source backups may retain
binary logging. A configured replication recovery path remains unqualified.

The final rehearsal also retains corrupt-authentication, wrong target ID,
scheduled-execution, broad grants/delegation/roles, nonempty/source overwrite and
nontransactional backup refusals; binary/Unicode, schema/index/journal equality;
encrypted backup non-overwrite; Windows wrapper; session history preserved with
old sessions/admin approval expired; and actual restored two-owner login,
anonymous/cross-owner refusals and logout. No fake provider or inbox acceptance.

Only root operator CLI/test and documentation changed; runtime/application images
are unchanged. CLI SHA256
`9acfd20c85180f408f0a427abf3c0085f9da683f100981c3252f81e2e4c14950`,
integration harness SHA256
`973ed1aa248b6c2f1002778ab075e6c3b706aa77c2769217ba57518d416be4b4`.
Final 169 operator cases passed without skips in 7,703.0809ms. Logs retained under
`outputs/help63-recovery-20261002-r1/` outside the repository. The test removes
only its generated temporary key/backup directory and transient migration runner;
no real data or prior backup was removed. Main fixtures retained and independently
inspected, all stopped 0/no OOM/no ports:

- Source `51d000ecf99e9dfa8869bd27bb0bd0e6788a38dfe3c98bebfbdc024aca8f3213`.
- Target `83699f051d2b23e673a06f5bc81d86290fd819e2a2171b5f0eb493dfddf16bbc`.
- Refused binary-logged target `80bcea194955b6725aade2a907be2fdca5c97eefd8351edc73e7ed4fd2bbd9b0`.
- Runtime `697d13c18b8c26c3201b1e72ec20e19b8b808aaf85ceb2616bddbc86ac95288f`,
  mounting only the read-only observation helper, not application replacement.

Remote storage/retention/alerts, independent lost-key recovery, production-sized
dump/restore, operator promotion, application-secret recovery and reconciliation
of post-backup deletion/suppression/queued-action/reset-token state remain open.
The 64 MiB SQL ceiling is unchanged. This local rehearsal is not disaster-recovery
approval for live users.

Raw logs and synthetic helpers are retained locally under
`outputs/help63-package-20261002-r1/` outside the repository. Images/containers were
not deleted. Twelve exact fixture IDs were independently inspected after runs:
all stopped, exit 0, no OOM and no public ports. Application/database containers
had zero bind mounts; artifact probes, lock holder and QA each mounted only their
explicit helper/output path, never replacement application code.

- Database suite: test `109e08721c8df66337869381db208cb235f0af87427b2e5a3164a71bf59d6137`,
  database `f35fd218d355646417cfbfb5a1cdb07ed980a169ca20aa45f05b1bce3bde99d3`.
- Help browser: QA `6df64844c0cac2d7176c7b642cfdd49266f00579a4af407771cbac64aef0f865`,
  app `9eeb4e700cb8b338ddcc485f9962253fd26860a75693893786d0a11175b9fb08`,
  database `b8669254cd16ddc1e051db04eea0f7e85d376d72d3642657247eca7bfbeb70b6`.
- Artifact probes: runtime `5dbdeeb643961eb3d36cfb3431d06974ad9a11f5b1976da1dc163c4637940451`,
  test `9ab20ca72a8db5347e1b915bba52a9bfeded746a14517b0db3b0f422d4554616`,
  direct startup `e2e950a3ac2ca376a68183d66b08421834b54b015ad226a3f406b3ffd11eda7c`.
- Failed startup regression: TERM app `30d904b68c9f3ea45416aba37bcd39753fde6a6ad29dd7cc3d290990a5c79578`,
  INT app `4c61b3c34b2bf5d7818391d5ca278e28bdf2349b8d3d9c69b47dc01944737a98`,
  holder `2e26fafbb20fb93d3f7c9494f86a0900e73932cde32046f675a794c6e99a11b0`,
  database `988dded8964626dbc923af1395609ea3ee5ab22c6c9a52e66e91477345dbba36`.

Earlier bounded load/race checks retain their
[older exact-image scope](CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).
They were not rerun against this new runtime. Live email, approved privacy/operator
decisions, private hosting/HTTPS, restore operations, wider workflow/capacity and
worldwide platform permission acceptance remain open. EUR 100/month is a planning
ceiling only, not spending authority.
