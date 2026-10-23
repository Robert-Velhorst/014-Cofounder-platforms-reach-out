# Worldwide public beta delivery ledger

## October 23 read-only grant observation and rehearsal transport fix

Read-only queries against the exact retained synthetic database found that raw
runtime grant text passed the strict production guard and the migration identity
was rejected. Default MySQL batch output doubled schema-escape backslashes, so
the CLI rehearsal now explicitly requests raw output through shared immutable
options. A second read using those exact shared options passed. The production
grant parser and SQL accounts are unchanged. All 196 native operator/source tests
passed, including a regression that continues to reject double-escaped text.
[The scoped receipt](HETZNER_DATABASE_REHEARSAL.md) is a grant snapshot only;
permission denials, full migrations/app/TLS and the complete corrected rehearsal
remain unverified. The policy-blocked fixture was not deleted or replaced.

## October 23 fresh database rehearsal — failed local acceptance, retained fixture

The custom database artifact from `f0568b5` built locally. A maintained real
fresh-role gate is now wired after that build and before the remaining CI
rehearsals. All 195 native operator/source tests passed on Node 25.2.1, including
explicit synthetic-subnet validation and test-inventory wiring. This is not a
passing database result: local default pools were exhausted, then an explicit
isolated attempt failed on Docker inspection timeouts before permission acceptance.
Cleanup could not be verified; a subsequent native cleanup command was blocked by
policy and not retried. The owned synthetic fixture/network/scratch directory
remain for operator resolution. [Scope, observations and limits](HETZNER_DATABASE_REHEARSAL.md)
are authoritative; local recovery IDs/paths and diagnostics are not uploaded.
No real database or existing service was changed. Full application/MySQL/TLS
qualification and all original phases remain incomplete.

## October 23 isolated database identities — candidate, qualification pending

[PR #117](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/117)
continues the combined candidate without changing PR #116's pinned head. The
Hetzner profile now supplies a separate one-shot migration URL, gates the app on
that job, and gives the app only its restricted runtime URL and session key.
A pinned custom database artifact initializes exact-schema identities only on
fresh storage; the app refuses broad existing grants rather than changing them.
See [database roles](DATABASE_MIGRATION_ROLES.md) for the implementation, evidence
and remaining limits. All 193 native operator/source checks passed on the local
Node 25.2.1 host. Shell/model/native checks are not live database/TLS proof;
the expanded four-service rehearsal and full CI remain required. No phase is
completed and no provider, real database, deployment or budget was changed.

## October 23 combined source candidate — qualification pending

[The combined candidate receipt](BETA_CONSOLIDATION_2026-10-23.md) preserves the
exact histories of PRs 113–115, resolves documentation conflicts without dropping
either feature, and records the Windows/LF checkout-byte repair. All 182 root
native operator checks passed together with the original API/UI snapshots intact.
Whole combined-head application/database/build/load/TLS CI remains required; no
merge, production readiness, public deployment or phase completion is claimed.

## October 23 maintained customer-load gate

The [complete original workload is now a maintained mandatory CI/local gate](CUSTOMER_LOAD_ACCEPTANCE.md).
Implementation commit `84685b24c92b4519aee39553c289dc070f518561` passed
[CI run 39867347634](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39867347634):
1,036 app units, 726 database cases, operator/release checks, build, recovery,
startup, authentication admission and production container smoke. All 1,500
scheduled requests at 150/s returned 200, without drops, refusals, retries or
correctness errors. Both full write tiers and competing-write/owner-isolation
acceptance passed; post-load readiness/health were 200 and all three exact owned
load fixtures stopped 0/no OOM and were removed. The workload thresholds, stages
and one-CPU resource limits were retained. See the linked receipt for immutable
CI artifact identities, overload results, memory observations and source scope.

The implementation was merged through [PR #112](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/112)
at main commit `4f0a69653a5e8656e39825de217aecfc12023c08`; its
[post-merge CI](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39870898817)
also passed.
This is bounded CI acceptance, not a diagnosis of the old Windows-host failures,
sustained hosted capacity, published container release, deployment, live mail,
provider permission, human/privacy approval or whole-goal completion. All 116
original phases remain Partial; the EUR 100/month ceiling remains in force.

## October 3 live joined authentication read

[Implemented one live account/session join](AUTH_JOINED_READ_2026-10-03.md),
retaining signed owner, session ownership/digest, expiry and deletion-fence checks.
Actual SDK red/green proves 80 to 40 reads for 40 concurrent authentications,
without caching results. Six new cases, 44 focused cases, typecheck and all
1,036 units passed. Fresh real MySQL session package passed 11 cases, including
cross-owner session-ID mismatch and durable expiry with a still-valid JWT.
Two fixtures independently checked stopped 0/no OOM. Full fresh runtime/DB/parity/
admission/load and browser/recovery acceptance remain pending; previous package
receipts do not qualify this new candidate. No capacity fix or phase completion.
All 116 original phases Partial, worldwide beta goal active, EUR 100/month planning
only; no external writes, deployment, outreach, purchases or permissions changes.

## October 3 authentication-query packaged qualification

[Fresh runtime/full database/parity qualification](AUTH_QUERY_REUSE_PACKAGE_2026-10-03.md)
passed: 1,030 units, 725 database cases/43 files without skips and all 117 compiled
application/migration files identical. Unchanged full load on runtime
`27a756d9ffb85aa87c23032a58a4cefb20ea02f5267b9bcc203869fe1cff03f3` still
failed normal 150/s acceptance (95 busy refusals, three actor-start drops).
Original read/write/race/isolation checks passed their retained rules; 500/s is
controlled overload only. Seven owned fixtures independently checked stopped/no
OOM; post-load readiness/memory peaks skipped after red probe exit. Current-image
browser/recovery checks remain pending. No root-cause/capacity/release fix or
external action; all 116 original phases Partial and EUR 100/month planning-only.

## October 2 authentication query construction reuse

[Implemented reuse of the two authentication query descriptions](AUTH_QUERY_REUSE_2026-10-02.md),
not rows/session/permission outcomes. Actual red/green proves one construction
instead of 40, with all fresh reads/parameters. Five new/31 focused cases, host
typecheck and 1,030 units passed. Fresh MySQL package passed 10 session cases,
including warm-plan changes, deletion fence and revocation. Two fixtures stopped
0/no OOM. Full runtime/mandatory DB/parity/load qualification pending; previous
image receipts do not qualify this candidate. All 116 phases remain Partial.

## October 2 single-route diagnosis

[Catalogue, list and identity samples](ARRIVAL_SINGLE_ROUTE_DIAGNOSTIC_2026-10-02.md)
all failed normal 150/s rules; identity alone produced 47 busy refusals without
dropped starts. Shared pressure remains unresolved. Nine isolated fixtures stopped
and inspected/no OOM; application and release gate unchanged. All 116 phases
remain Partial; no publication, deployment, purchases or provider actions.
Two subsequent identity-only samples without the 600 warmup calls also failed
(108/46 busy refusals), with six additional exact fixtures stopped/no OOM.
This further narrows diagnosis without changing application or acceptance scope.
[Scoped identity measurement](IDENTITY_TIER_MEASUREMENT_2026-10-02.md) reproduced
49 busy refusals with both database tails and scheduling delays. Boundary and
malformed-receipt checks passed; three owned fixtures stopped/no OOM. No cause
or production fix established; no app/authority/scope changes.
[CPU quota observations](IDENTITY_CPU_QUOTA_2026-10-02.md) then found app throttling,
but two-CPU identity-only success did not repeat (132 busy refusals). Nine more
exact fixtures stopped/no OOM; this is not a reliable fix or production sizing.
[Database observations](IDENTITY_DATABASE_BOUNDARY_2026-10-02.md) reproduced 117
busy refusals without new DB throttling and with short measured SELECT times.
Three more fixtures stopped/no OOM. Shared app/protocol/scheduling delays remain
to isolate; no app or authority change and no production acceptance.
[Sampled profile](IDENTITY_CPU_PROFILE_2026-10-02.md) captured 18 busy refusals,
no new own app/DB/driver throttling. A mistimed first observation was rejected;
acknowledged fresh capture validated. Six more fixtures stopped/no OOM. No code
optimization or reliable capacity fix implemented from these distributed stacks.

## October 2 bounded session-key reuse increment

Implemented only process-local reuse of the current non-extractable HMAC key,
including shared in-flight import, configured-secret invalidation and failed-import
retry. Account/user/durable-session/fence decisions remain uncached. Actual red
test observed 41 imports versus 1; six new cases and 32 focused cases now pass.
Host typecheck and fresh runtime typecheck/1,025 units/100 files/build passed.
Unchanged original full load on d3d9c88da815add6bba3a721159cfdec4247cded61de4fdd4c396f5cb27433c2
still failed 150/s with 125 busy refusals; 50/s and original read/write/race/isolation
checks passed. 500/s is controlled overload, not offered-rate successful capacity.
Three exact owned fixtures inspected stopped (app/DB 0, runner 1), no OOM/public
ports. No safety limit changed, no root-cause fix or publication/deployment/spending.
Fresh candidate mandatory DB qualification subsequently passed 724 cases/43 files
without skips (300.41 s). Runtime/test compiled application and migration parity
passed (117 files/7,026,390 bytes); four exact owned fixtures stopped 0/no OOM/
public ports. Fresh connected browser qualification then passed all 24 retained
real HTTP/MySQL workflow stages; three exact fixtures stopped 0/no OOM/public
ports. No unexpected errors/external requests/real sends; deliberate refusals/
lost-response injection recorded separately. Five screenshots visually inspected;
lengthy mobile guidance/mixed-language remain limits. All-UI/accessibility,
hosted qualification and failed full-load capacity gate remain open. Fresh isolated
encrypted recovery subsequently passed one full integration case (93,927.797 ms)
plus 34 recovery units, including restored two-owner HTTP access/isolation/logout,
revoked links and four expired restored-job discards with zero transport attempts.
Four exact fixtures stopped 0/no OOM/public ports. Off-host key/backup recovery,
post-backup reconciliation and production-scale/operator acceptance remain open.
The subsequent entire workload repeat changed only the owned app's CPU allowance
to two; 150/s still failed with 107 busy refusals. Original read/write/race/owner-
isolation checks passed; three fixtures stopped app/database 0, runner 1, no OOM/
public ports. Database/runner CPU, memory and safety/arrival thresholds unchanged.
No production resource changes; extra CPU alone is not a verified fix. Correction:
the real server entry point already wraps authentication/account context in the
shared work tracker. A direct packaged-runtime HTTP/MySQL test confirmed excess
refusal before DB work, disconnect-through-settlement accounting and subsequent
capacity reuse. Three exact fixtures stopped 0/no OOM/public ports, readiness/
health 200. No duplicate limiter or load fix. The regression is now maintained,
root all-tests/CI wired locally and passed twice on the exact runtime, no skips
(19,344.1868 / 21,470.7659 ms). Six fixtures independently stopped 0/no OOM/ports;
missing-image refusal passed before creation. 171 operator cases passed after wiring.
An isolated missing-context-guard mutation subsequently failed at the intended
excess-before-database check (35,022.2791 ms); the unchanged regression passed again
against the original exact runtime (21,262.0368 ms). Six new fixtures independently
stopped/no OOM/no public ports, expected red probe 1/other five 0. Application source
and release image unchanged. No hosted CI execution/publication or capacity fix.
Subsequent aggregate-only isolated diagnostic preserved the complete workload and
limits; 150/s failed again with 98 busy refusals. All 7,316 work-budget refusals
across the combined load occurred at context admission, none at procedure admission.
This locates refusal, not underlying CPU/scheduling/database cause or a capacity fix.
Write/race/isolation checks passed; exact three fixtures independently stopped
app/database 0, runner 1/no OOM/ports. Diagnostic image is not a release candidate;
application source remains unchanged.
The subsequent original-runtime full-workload differential changed only the
isolated database to two CPUs; app/runner stayed one each. 150/s still failed
(1,378 HTTP 200/122 HTTP 503), with no late/dropped starts. Retained write/race/
isolation gates passed; exact three fixtures independently stopped app/database
0, runner 1/no OOM/ports. Extra database CPU alone is not a verified fix, nor was
extra application CPU alone. No production sizing, resource mutation or spending.
Subsequent [pool-wait diagnostic](POOL_WAIT_DIAGNOSTIC_2026-10-02.md) passed real
admission preflight and reproduced the unchanged full 150/s failure (74 refusals).
Whole-load pool waiting and app CPU/event-loop pressure are measured, not a proven
tier-specific cause. Write/race/isolation checks passed; six exact fixtures
independently stopped/no OOM/ports, full runner 1/others 0. No production changes.
Subsequent validated snapshots around 150/s still failed with 25 busy responses.
Tier-only waiting/CPU averages were lower than whole-load figures; transient queue
and tail delays remain, not an established root cause/fix. Retained write/race/
isolation checks passed; exact three fixtures stopped/no OOM/ports, app/database
0, runner 1. Analyzer refused three deliberately corrupted receipt copies. External
helper's boundary pauses/private owned PID namespace are diagnostic-only changes,
not byte-identical release acceptance, production configuration or publication.
Subsequent [shorter real-path reproduction](ARRIVAL_REPRO_MINIMIZATION_2026-10-02.md)
removed prior load stages sequentially and retained the 150/s failure on the
original uninstrumented app. Final helper failed twice (108/55 busy responses),
about 28 seconds per load runner plus external setup/cleanup. Twelve exact fixtures
independently stopped/no OOM/ports, app/database 0 and runners 1. Reduced variants
are diagnostic-only; original full acceptance and all 116 phases remain unfinished.
Subsequent [route/block diagnostic](ARRIVAL_ROUTE_DIAGNOSTIC_2026-10-02.md) failed
twice (123/200 busy responses, repeat 26 same-actor starts suppressed). Counters
reconciled; list/catalogue tails and cross-route overlap remain correlation.
Six exact fixtures independently stopped/no OOM/ports, app/database 0/runners 1.
No production change, isolated-route result, root-cause fix or full acceptance claim.
[Implementation, red/green and exact original-load evidence](SESSION_KEY_REUSE_2026-10-02.md).

## October 2 scheduled-arrival diagnostic increment

Implemented bounded independent arrival scheduling and integrated three read tiers
without replacing earlier read/write/race checks. Ten new scheduler tests and 17
retained helper cases passed; strict script/app typechecks and 1,019 host units/99
files passed. Real exact-runtime combined load returned exit 1: 50/s passed,
150/s failed with 65 HTTP 503 refusals, and 500/s passed only controlled overload
with 1,092 client drops. All original data/race checks passed; not substituted for
the new failure. App/database stopped exit 0, runner exit 1, no OOM/public ports.
No limit or acceptance threshold relaxed, no deployment/spending. Quiet-host
repeat and demand/refusal analysis remain necessary.
The byte-identical repeat without concurrent agent tests also exited 1 at 150/s:
162 busy responses and 56 busy-actor drops, while 50/s and all retained baseline/
race/isolation checks passed. Three further fixtures independently inspected:
app/database stopped 0, runner 1, no OOM/public ports. Other user services stayed
untouched; this is not an idle-host or root-cause proof. Minimal/per-route
diagnosis and hosted capacity remain open.
Shorter external diagnostic copies subsequently reproduced active-work-limit
refusals: 125 with the mixed read paths, then 49 using identity only. Other fixture/
rate/resource/gate settings unchanged; maintained harness/product code untouched.
Six more exact fixtures independently stopped (app/database 0, runners 1), no OOM/
public ports. Shared authenticated path is narrowed, but root cause/fix and full
acceptance remain unproven.
Identity-only CPU differential changed only the owned app CPU allowance: r4 one
CPU failed (49 refusals), r5 two CPUs passed (all 1,500), r6 one CPU failed again
(two refusals). Dataset/image/DB/runner/memory/admission/arrival rules unchanged.
This supports fixture resource sensitivity, not a proven root cause or full fix.
Six more fixtures independently stopped; r5 all exit 0, r6 app/database 0 and
runner 1, no OOM/public ports. No production Compose/hosting/budget change.
Two identical temporary runtime-probe runs then passed all 1,500 identity requests
under one CPU despite measured throttling. Both health/readiness checks returned
200 and all six owned fixtures independently stopped exit 0/no OOM/no public
ports. Earlier failures remain; run variability prevents a deterministic CPU
requirement or root-cause/fix claim. Probe remains outside production code;
database/auth-path timing and original full acceptance remain necessary.
The subsequent database-channel probe reproduced 77 active-work refusals. Actual
query/acquisition callback delays were observed, but include runtime scheduling
and are not pure SQL timing. Three probe tests passed; three exact owned fixtures
independently stopped (app/database 0, runner 1), no OOM/public ports. No auth/fence/
session check removed; maintained code and thresholds unchanged. Server-side SQL
versus client/runtime scheduling and regression-backed full acceptance remain open.
Corrected SQL-counter r11 reproduced 62 refusals but measured sub-0.31-ms average
SQL execution for both authentication lookups, lifetime maxima below 16 ms versus
300.53/359.62-ms query/acquisition callbacks. Larger delays therefore remain
outside those SQL execution times in this sample; targeted app profiling is next,
not a speculative pool/CPU change. Six probe tests passed. Preceding r10 physical-
table-name probe error retained as invalid measurement; six owned fixtures stopped
and inspected (apps/DBs 0, runners 1), no OOM/public ports. Full gate unchanged.
In-process CPU profile r12 then reproduced 202 busy refusals and 35 actor drops.
Main-isolate samples show distributed work and visible GC, not a proven culprit;
profiling overhead and sampling gaps preclude exact CPU/capacity inference.
Nine probe/analysis cases passed. Three owned fixtures independently stopped
(app/DB 0, runner 1), no OOM/public ports. No production code or limits changed;
concrete differential optimization experiments and original full acceptance next.
[Evidence and exact boundaries](SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md).

## October 2 Indonesia directory source increment

Added founderbro as discovery-only after reading its public directory and embedded
terms/privacy. Source now 68 records (21 dedicated/24 community/23 programme);
anti-scraping/bulk-export limits visible, no admission or integration expanded.
147 focused cases, typecheck/build, 1,009 host unit cases/98 files and 170 operator
cases passed without skips. Subsequent exact runtime/test packages passed 1,009
packaged units, 724 database cases, 117-file compiled/migration parity, compiled
startup probes and seven connected desktop/mobile catalogue stages. Four selected
captures visually inspected; all eight owned fixtures independently stopped exit
0/no OOM/no public ports. Subsequent 24-stage customer journey and actual default
startup/cancellation/readiness/drain passed on these exact IDs. Eight additional
owned fixtures independently stopped exit 0/no OOM/no public ports; five selected
captures visually inspected. Subsequent local encrypted recovery passed one full
case/106.33s and 34 unit cases: two restored owners isolated, stale authority refused,
four pending mail jobs discarded without provider attempts. Four recovery fixtures
independently stopped exit 0/no OOM/no public ports. Subsequent bounded read/write
load passed 30,000 baseline requests, 200 paired-edit races and 400 wrong-owner
mutation refusals with independent stored-row/audit proof. Three load fixtures
independently stopped exit 0/no OOM/no public ports. Overload mostly refused work;
whole-product/open-loop/soak/hosted load remains open for these new IDs;
preceding receipts keep their own scope.
No external writes or spending; all phases Partial.
[Research, counterevidence and source-check boundaries](PLATFORM_INDONESIA_REVIEW_2026-10-02.md).
[Exact-package qualification and limits](INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 candidate-list Dutch/English increment

Implemented candidate search/status/order, table/action/empty/loading/error and
pagination copy using the existing language context without changing query values,
state or authorization. Explicit region/defaults/code language tags preserve the
mixed-route disclosure. Final fresh runtime passed typecheck/build and 1,004 units
across 98 files; 36 focused and 170 operator cases also passed. The connected
seven-stage desktop/mobile run proved language-switch state/result preservation,
literal search, opt-out gates, mobile horizontal action access and details-dialog
open/close. Zero unexpected browser/HTTP diagnostics, RPC mocks or outbound sends;
all original candidate rows unchanged. Final owned fixtures stopped exit 0/no OOM.
Failed banner/QA-selector assumptions are retained and corrected, not excluded.
Subsequent exact-image checks passed 724 database cases/43 files, parity of 117
compiled/migration files, default startup and both migration-cancellation signals,
and the broader 24-stage customer journey. Three full journey runs passed; final
desktop/mobile reminder captures were corrected and visually inspected. All 19
owned qualification fixtures independently stopped exit 0 without OOM/public ports.
Subsequent current-image local encrypted recovery passed (one full case/73.81s and
34 unit cases): schema/data/objects retained, two restored owners logged in through
actual HTTP, old authority refused and four pending mail jobs discarded with zero
provider attempts. Four recovery fixtures independently stopped exit 0/no OOM.
Subsequent current-image closed-loop load passed all five tiers/30,000 baseline
requests, 200 paired-edit races and 400 wrong-owner mutation refusals with independent
stored-row/audit evidence. Overload mostly returned controlled busy refusals, not
100-user successful capacity. Three owned load fixtures stopped exit 0/no OOM.
Remote/operator recovery and whole-product/open-loop/soak/hosted load remain open.
All 116 phases remain Partial; no external writes, deployment or spending.
[Implementation, exact artifact, receipts and limits](CANDIDATE_WORKSPACE_LANGUAGE_2026-10-02.md).

## Preceding October 2 French-language dedicated discovery increment

Added three distinct matching discovery records: Cofondateur.fr, Cofoundr and
school-gated CoFoundry, after direct French-language first-party access/pricing/
policy reads. Source now has 67 records (21 dedicated, 23 community, 23 program),
23 manual-reviewed and 44 discovery-only. Paid commitments, beta/unfinished
operator identity and unconfirmed school availability remain visible; no source
was admitted to intake/import/outreach or enabled as an integration.
All 196 focused cases, typecheck/build, 997 full host units/97 files and 170 root
operator cases passed. Initial stale-count and stale-inventory failures were
diagnosed and retained; inventory action/API-reference records did not change.
Fresh exact-package checks now passed 997 packaged unit cases, 724 database cases, compiled parity,
default startup and six connected desktop/mobile catalogue stages. A subsequent
broader 24-stage connected journey passed twice on the unchanged artifact:
intake/corrections, original message review, manual records, reminders/history,
opt-out/progress, private export and safe uncertain-import replay. Visual review
caught a missing QA emoji font; the controlled read-only local-font rerun rendered
the actual stored glyph. Current-image encrypted local recovery subsequently
passed with schema objects, owned data, revoked session/link refusal and expired
mail discard. Current-package closed-loop read/write baseline and 200 paired-edit
races subsequently passed at 100 synthetic accounts/10,000 candidates, with
persisted-row/audit proof; overload mostly returned valid busy refusals. This is
not 100-user successful or hosted capacity. Remote/production-sized/operator
recovery, whole-product mixed/open-loop/soak load,
untested retained surfaces, actual customer/operator and native member acceptance
remain unqualified.
No external writes or spending;
worldwide completeness and all 116 phases remain Partial.
[Direct-source observations and verification limits](PLATFORM_FRANCE_REVIEW_2026-10-02.md).
[Fresh artifact and connected catalogue evidence](FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 development dependency advisory correction

The full registry audit exposed seven development-tool advisories missed by the
already clear production-only audit. Pinned Vitest 4.1.11 and narrowly replaced
core-utils' esbuild dependency with 0.25.12; both audit scopes are now clear.
Preserved prior manifests/lockfile and unchanged test inventory/timeouts. Windows
and Node 22 each passed 987 unit cases/97 files, plus typecheck/build, schema
generation compatibility and fresh compiled/default startup. All 170 operator
cases passed, including a new regression guarding the full-development CI audit.
The packaged database suite passed 724 cases/43 files without skips. No full-security
certification, hosted CI/deployment, publication, provider mutation or spending.
All 116 phases remain Partial; whole-product/live/operator gates remain open.
[Current dependency evidence and limits](DEPENDENCY_TOOLCHAIN_QUALIFICATION_2026-10-02.md).

## October 2 pool-client fresh package and operating preparation

New runtime/test images passed 987 unit cases/97 files, 724 mandatory database
cases/43 files/no skips, compiled parity and actual default startup/cancellation/
health/readiness/drain. All 169 operator cases passed. Ten owned fixtures retained
stopped exit 0/no OOM/no public ports; no source replacement. Added test regression
is now included in the full packaged unit suite, not merely host-focused checks.
Compiled payload matches preceding 64-source images, but no blanket transfer of
old browser/recovery/load acceptance. New-image connected checks remain open.
Prepared EUR 80 allocation plus EUR 20 reserve and primary-source provider
candidates; complete quotes/account caps remain unknown. Untouched budget example
correctly returned incomplete/total null/exit 1. No publication, deployment,
provider changes or spending; all 116 phases remain Partial.
[Fresh package evidence and remaining gates](POOL_CLIENT_NODE22_PACKAGE_QUALIFICATION_2026-10-02.md),
[budget preparation](OPERATING_BUDGET_CANDIDATES_2026-10-02.md).

## October 2 corrected synthetic client: bounded exact-image load pass

Safe diagnostic replays isolated reused-connection resets in overload; a real-HTTP
red/green regression showed the synthetic pool lacked idle expiry. Corrected only
the test client's pool (same keep-alive/socket/source-address limits, same request
deadline, no retries or threshold changes). All 17 focused cases and typecheck
passed; actual Node 22.23.3 verified peer-hint expiry and connection reuse.
Full replay on the unchanged exact 64-source runtime then passed 30,000 baseline
requests, 200 competing-edit races with independent storage/200 winning audit
receipts, and 400 cross-owner mutation refusals. All 169 operator cases passed.
Post-load health/readiness 200, no OOM, three fixtures retained stopped exit 0.
Earlier failures remain; original r1 race failure's precise cause is not proven.
Fresh package/full-suite qualification of the added regression, representative
whole-product/soak/hosted acceptance and all other production gates remain open.
No publication/deployment/spending; all 116 phases remain Partial.
[Current pass, fixed limits and retained failures](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-corrected-client-exact-image-load-pass).

## October 2 exact 64-source load: incomplete, retained failure

Fixed-resource exact-image run passed its 30,000 read/write baseline requests,
including independent 10,000-row and per-owner/action audit checks after both
write tiers. It then failed an assertion in the competing-edit phase and exited
1; precise cause remains undiagnosed. Cross-owner mutation checks, final race
storage/audit checks, post-load readiness and cgroup peak observations were not
reached. No widened thresholds, retries, app changes or spending. All 15 harness
and 169 operator cases passed independently; these do not override the failed run.
Three owned fixtures retained stopped/no OOM/no public ports (runner exit 1,
app/database exit 0). Full production acceptance remains open; all 116 phases
remain Partial.
[Exact metrics, receipts and limits](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-image-readwrite-load-incomplete).

## October 2 exact 64-source encrypted recovery

Full isolated rehearsal passed on the new runtime/test images (80,990.8545ms):
encrypted backup/restore, schema/index/journal/binary/UTF-8 preservation and unsafe
target refusals; actual compiled two-owner sign-in/isolation/logout, rejected old
reset/verification links, and four expired-mail jobs discarded with zero provider
attempts or new budget/reset authority. Test-package worker, not live-provider
or compiled-worker scheduling acceptance. All 169 operator checks passed; four
owned fixtures independently inspected stopped exit 0/no OOM/no ports, retained.
Only fresh disposable key/snapshot artifacts and ephemeral helpers were cleaned.
No app changes, external action or spending. Remote backups, independent keys,
post-snapshot reconciliation, current-image load and full production remain open.
[Exact recovery evidence and limitations](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-image-encrypted-recovery).

## October 2 Traditional Chinese QA font diagnosis

The unchanged exact runtime rendered 香港 and 數碼港 correctly when an existing
Windows font was mounted read-only into the isolated QA browser. Actual browser
font-use inspection verified three alias glyphs; desktop/mobile screenshots were
inspected. All 24 workflow stages passed again with zero unexpected errors,
external requests or real sends. Two helper failures (document registration and
localized font-name comparison) are preserved. No app font asset, dependency,
host setting or provider changed; no font redistribution or spending. This
resolves sampled QA glyph rendering, not all scripts/devices or native provider
workflows. Portable QA provisioning, recovery/load and full production remain open.
[Controlled comparison and exact receipts](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-traditional-chinese-font-diagnosis).

## October 2 exact 64-source connected workflow

24 real browser/HTTP/MySQL stages passed on the new immutable runtime/default
command: catalogue aliases/restrictions, reviewed intake/drafting, retained
conversation/reminders, opt-out, progress, private export and lost-import replay.
Zero mocked RPC/outside-origin requests/unexpected errors/real sends; eight
expected refusal/fault diagnostics. Desktop/mobile and selected tablet checks
passed. Three owned fixtures independently inspected stopped exit 0/no OOM/no
ports, retained. Screenshot inspection found missing Chinese glyphs despite
working Unicode alias search: native-script visual acceptance remains open.
No app edits/external actions/spending. Recovery/load on the new images and full
host/operator/provider acceptance remain open.
[Exact browser evidence and visual limitation](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-image-connected-customer-workflow).

## October 2 fresh 64-source package/database/startup checkpoint

New exact runtime/test images built successfully, including typecheck, 985 unit
cases and production build. Identical 117-file compiled/migration inventories
passed; runtime source/dev tools absent. Mandatory actual database suite passed
724 cases/43 files/no skips. Default startup passed locked-migration cancellation
under the unchanged three-second deadline, real health/readiness and orderly
drain. All 169 operator cases passed. Ten owned isolated fixtures independently
inspected stopped exit 0/no OOM/no ports and retained. No deployment/publication
or spending. Connected browser, recovery/load on these new images and full live
host/operator acceptance remain open; old 63-source receipts stay historical.
[Exact image IDs, raw receipts and boundaries](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 Hong Kong discovery source increment

Catalogue source now contains 64 routes (18 dedicated, 23 community/channel,
23 programme/event/ecosystem; 23 manual-reviewed and 41 discovery-only).
Cyberport/CSAA is one restricted Hong Kong ecosystem route, not a dedicated
matcher or working integration. English/Traditional Chinese public evidence,
corporate eligibility, unknown fees and changing programme obligations are
explicit; import/outreach remains denied. Local typecheck, 985 unit cases and
build passed; strengthened static-render/admission checks passed 154 cases.
The stale UI fingerprint failure is preserved; action-preserving regeneration
passed all 169 operator cases. Previous 63-source immutable/browser/database/
recovery/load receipts remain historical and do not qualify this addition.
No publication, membership, provider action, deployment or purchase occurred.
The EUR 100/month ceiling is planning only. All 116 phases remain Partial.
[Official evidence, local receipts and open qualification](PLATFORM_HONG_KONG_REVIEW_2026-10-02.md).

## October 2 current-image read/write and paired-edit load

Fresh current-runtime/default-command qualification passed the 30,000-request
read/write baseline, 200 paired-edit races and cross-owner read/write refusals.
Normal read/write p95 at five/twenty loops stayed below the unchanged two-second
threshold; overload yielded 900 successes/5,100 explicit busy responses, not
100-user successful capacity. Independent storage verified preserved candidates,
winning edit/audit receipts and wrong-owner refusal. Health and orderly shutdown
passed; no max/OOM events. 15 harness cases and 169 operator cases passed.
No app edits, provider actions, publication, purchase or deployment. Whole-product
load, soak, hosted capacity and the EUR 100/month operating proof remain open.
[Exact results, fixture IDs and scope](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-current-image-readwrite-and-competing-edit-load).

## October 2 restored account-mail replay prevention

Regression reproduced four account-mail jobs replayable after restore despite
post-snapshot synthetic acknowledgement (exit 1, 44,524.0454ms). Root restore now
expires queued/sending mail jobs, preserving rows, encrypted payloads, attempt/
lease history and terminal receipts. An intermediate worker-helper setup failure
is retained; corrected full rehearsal passed (71,623.3459ms). Actual test-package
worker discarded all four jobs, then was idle; zero counted provider attempts,
no fresh reset authority or budget reservation. Compiled default runtime also
retained earlier HTTP/login/isolation/recovery checks. 169 operator cases passed
without skips (4,697.0082ms). Application/image selection unchanged; no live mail,
external publication or deployment. Acknowledgement/budget/account/privacy
reconciliation and production acceptance remain open; all phases Partial.
[Exact scope, failures and passing evidence](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-account-mail-replay-prevention).

## October 2 restored email-verification revocation

Regression reproduced one revoked verification link revived by snapshot restore
(exit 1, 40,691.2952ms). Restore now expires verification authority, preserves
digests/address binding/older expired timestamps/verified flags, verifies zero
active links and withholds success on incompatible schema or failed checks.
Full exact-image expanded recovery passed (52,692.3193ms): actual HTTP 400 for the
old token, pending account still unverified/no successful redemption audit,
unchanged normal two-owner sign-in/isolation and earlier recovery checks.
169 operator tests passed without skips (3,838.3101ms). Application/build selection
unchanged; four fixtures independently stopped 0/no OOM/no public ports. Only
root tooling/tests/docs changed. Post-backup account/mail/privacy reconciliation
remains open; no live recovery, external action or publication. All phases Partial.
[Exact failure, pass and recovery limits](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-email-verification-authority-invalidation).

## October 2 restored password-reset revocation

New regression reproduced one active reset link revoked after snapshot but revived
by restore (exit 1, 36,372.6936ms). Root restore CLI now expires restored reset
authority, preserves digests/older expired timestamps, checks zero active links
and withholds success if required columns/verification are unavailable. Full
expanded recovery passed (48,316.6842ms), including actual compiled HTTP 400 for
the old validly formatted link and successful unchanged two-owner sign-in.
All 169 operator tests passed without skips in 4,954.3609ms. Only root recovery
tools/tests/docs changed; application/image inventory unchanged. Four fixtures
independently stopped 0/no OOM/no ports. Before/after logs retained outside repo;
no real data, live restore, publication or deployment. All phases remain Partial.
[Exact evidence and remaining credential/recovery limits](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-password-reset-authority-invalidation).

## October 2 current-image connected customer workflow

Exact help/63-source runtime passed all 24 retained Chromium workflow stages and
an added real Help popup preserving unsaved original-message text/declaration.
Native keyboard traversal includes the new Help link. Original individualized
intake/review/manual-action, history/reminders/opt-out/progress, revisions and
private JSON/CSV paths tested through real UI/API/database behavior. Committed
import reply deliberately lost and retried without duplicate; blocked/oversized
requests refused. No application replacement mounts or source edits. Eight
expected diagnostics, zero unexpected errors/outside requests/provider actions/
real sends. Directly preverified fixtures are not signup/inbox acceptance.
Three owned fixtures independently stopped 0/no OOM/no ports; kept, not deleted.
Desktop/mobile screenshots inspected; long duplicate translation notices remain
mobile UX debt. All phases still Partial and no public deployment.
[Exact flow, evidence and limitations](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-image-connected-customer-workflow).

## October 2 fresh-image expanded recovery

New help/63-source images passed encrypted recovery, then expanded schema-object
and application acceptance in 67,748.8678ms without skips. Real view/procedure/
trigger behavior, scheduled-event preservation with execution disabled and restored
two-owner login/isolation verified. Two intermediate fixture failures retained:
default scheduler ON and trigger creation blocked by binary logging. Dedicated
fixtures explicitly disable scheduler/binary logging; no broad privilege grants.
The restore CLI now rejects binary-logged targets before import, proven on a third
fresh target with zero tables. Final 169 operator tests passed, no skips. Four main
fixtures independently stopped 0/no OOM/no ports. Only generated temporary test
key/backups removed; no real data. All phases still Partial and no deployment.
[Exact current recovery evidence and remaining limits](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-expanded-encrypted-recovery).

## October 2 migration-cancellation observation diagnosis

Twenty-seven separate diagnostic cancellations reproduced seven transient
database waiters after clean client exit, all clearing without DDL or loss of
the separate holder's lock. Exact MySQL 8.4.11 source confirms periodic disconnect
checks. Root acceptance tooling now requires process exit and zero database
waiters under one unchanged three-second deadline established before signalling.
No production/source/image change, timeout increase, skip or global KILL.
Corrected exact-image acceptance passed twice, including normal migration,
health/readiness and parent/child drain; second-run TERM 1053ms, INT 962ms.
All 169 operator cases passed without skips. Original failure retained; local
startup observation resolved, not public launch approval. All phases Partial.
[Diagnosis, exact scope and retained receipts](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-cancellation-diagnosis-and-corrected-acceptance).

## October 2 fresh help/63-source images and startup gate failure

Fresh immutable images passed 979 unit cases/96 files, 724 mandatory database
cases/43 files without skips, compiled migration parity and exact-runtime
English/Dutch/mobile help checks without application replacement mounts. The
independent default-startup regression failed: after INT cancellation, the app
had stopped 0/no OOM/no DDL, but the database still reported one lock waiter.
Normal startup/drain in that test was not reached. Failure retained; no timeout
increase, weakened assertion or skip. All twelve owned fixtures independently
stopped 0/no OOM/no ports. Selected 556-file host inventory unchanged. No external
mutation or purchase. All 116 phases remain Partial.
[Exact identities, receipts, failure and next investigation](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 direct GitHub/main reconciliation

All open PR pages exhausted: zero open. Historical PR #1 merged September 4; remote
main and local HEAD both `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. The supplied
repository resolves to Robert-Velhorst/014-Cofounder-platforms-reach-out. Its old
green CI and README blob match the committed base, not later local changes.
No remote agent/public-saas-beta branch found. Before the report, 434 individual
pending entries: 65 modified, 369 untracked, none staged; ordinary 423 status entries
collapse directories. No bulk staging, author attribution or remote mutation.
Fresh 556-file selected inventory digest
`48c066dad45a6836572fa171d05ecfa506b336258c345bf0e8ce95a963907eaf`
matched itself; versus prior packaged observation: 21 added, 17 removed, five
modified paths. The 32 focused inventory/traceability tests passed without skips
in 869.0297 ms; whitespace and requirement integrity passed.
These hashes exclude docs/root tools/dependencies and prove neither causality nor
release acceptance. Changelog and README now expose the actual publication gap.
[Direct evidence and next boundary](GITHUB_REPOSITORY_STATE_2026-10-02.md).

## October 2 reachable English/Dutch customer help

Added public lazy-loaded `/help`, reachable from the shared language bar through
an explicitly labeled new-tab link with `noopener noreferrer`. This avoids
navigating an unsaved editor away merely to read instructions. Five bilingual
topics explain access/real verification, candidate/manual-message workflow,
permissions/opt-outs, retry/stale-review/uncertain-send recovery and private
exports/review-held deletion/support minimization. No support inbox, automatic
delivery, complete erasure or worldwide integration claim invented. The page
loads no account data and has no mutation controls or outside-provider links.

Six focused render tests, full typecheck and build passed; Vite built in 6.65s.
React guidance kept the help page lazy-loaded and copy derived from the existing
language context, without a new store, data-fetch chain or synchronization effect.
Existing visual styles were retained; no redesign/Image Gen assets were required.
Browser plugin absent; the existing isolated Playwright image was used, without
installing dependencies. Actual server readiness preceded Chromium validation on
`http://localhost:13216/help`, desktop 1365x1000/mobile 375x812. Page/title/content,
absence of framework overlay, zero console/page errors, language switch/reload,
local topic/back-to-top navigation, keyboard link focus and a real new-tab popup
with null opener passed. Zero account API/outside-origin requests and no live
accounts/provider actions. First screenshot captures followed an anchor jump;
the observation helper was corrected to capture scroll position zero and the
same checks were repeated, not represented as a product defect.

Scope: current compiled frontend mounted read-only on existing qualified runtime
`cf290a753e0d6d10f2fa658a5da3ecbdb760aa3d938226a666197994b8414334`,
not a new immutable image. The copied help chunk matches the host build SHA256
`0a780c9f44bfa8e23270c3bc73b6193460ff82bc6cc394a7c05c74fec1a010af`.
Raw screenshots/logs/helpers remain external in `outputs/help-page-20261002-r1/`.
Main-agent inspection of scroll-zero screenshots found readable desktop/mobile
wrapping and no horizontal overflow; mobile topics continue below the first
viewport. Final three owned fixtures independently inspected stopped 0/no OOM/
no public ports: QA `4d9deb285e8d42267ec42611362384f86fa83f5130ba1a6759c76d7f5f7d8f9a`,
app `2b5e31214c483759d1b38b4c61ae9259bda78e3aae92d78bc0ce6f28305d7a79`,
DB `39ff781b3c9f2c9e103b85372f2d146bcbab1d630ad3309a17206c0fd0ca4bbb`.
None were deleted. Earlier observation fixtures also stopped 0/no OOM/no ports.
Older exact-image receipts are retained; fresh packaging/full customer acceptance
remain open. The source inventories were regenerated mechanically: API remains
165 operations/58 admitted/107 denied/54 direct references/zero unknown, digest
`cdf9fe56c6f1e627e27172fc73e51027532b882b662ce5a60831f3e4986d06af`;
UI now 150 files/230 action elements/206 events/26 navigation elements/five spreads,
digest `b1f06038eba6eb1958c83014dafd80e6248abf95df9c345a50c0f5670414d941`.
Loop-generated links are not counted as individual runtime interactions by that
syntax inventory. All 168 host checks passed without skips in 3742.8938ms;
whitespace and requirement integrity passed. All 116 original phases remain
Partial. No data deletion, purchase, deployment, commit, merge or publication.

## October 2 README reader/navigation repair

The primary README now introduces the product, manual workflow, source coverage,
privacy/deletion limitations, supported architecture, local/developer setup and
remaining release requirements before historical evidence. The complete previous
README was preserved in root `README_REFERENCE.md` with an introductory historical
scope notice; existing detailed contracts were not discarded. Fourteen inbound
contract links in this ledger and account runbooks/design now point directly to
that reference. No app, configuration, provider, data, permission or publication
change occurred.

Documentation-skill fresh-reader review answered all eight user/developer questions
but identified database/mail setup, command-prefix and example-secret ambiguities.
The main README was clarified and re-read; no new material contradictions found.
This is reader testing, not behavioral verification. A local target/heading check
passed 56 README/inbound reference links. All 168 existing host operator tests
passed without skips in 5819.3655 ms; whitespace and requirement integrity passed.
All 116 original phases remain Partial, completion unproven. Full detail remains
available through the reference and canonical specialist documents. No GitHub
upload, commit or merge was performed.

## October 2 same-account overlapping edit qualification

Added a finite two-connection-per-account workload that rejects shared sockets
or non-overlapping wire timing rather than counting serialized requests as races.
The existing packaged runtime passed 100 different-title and 100 identical-title
races, one save/conflict or save/unchanged replay each. Independent storage checks
verified every candidate row and exactly 200 winning-request audit receipts with
owner/entity/action/title-only metadata. The 30,000-request baseline passed again;
400 foreign-owner refusals preserved all candidate and 6,200 audit rows. Three
owned fixtures independently stopped 0/no OOM/no ports. No runtime code changes,
provider actions, purchases or publication. Fifteen focused harness cases,
standalone/full typechecks and 168 host checks passed. Archive/restore races,
larger writer sets, account fences, open-loop traffic and soak remain unproven.
[Exact current-runtime evidence](CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 exact current-image bounded load qualification

The fresh 63-source runtime passed 30,000 measured closed-loop read/write requests
on 100 directly seeded synthetic accounts and 10,000 candidates. Normal read p95
97.56/209.95 ms and write p95 69.61/323.28 ms at five/twenty actor loops; no
transport/correctness errors or automatic retries. Independent database checks
verified every candidate row and audit owner/action counts after each write tier;
400 cross-owner mutation refusals preserved complete snapshots. Overload returned
1,024 successes and 4,976 valid busy 503s: not 100-user successful capacity.
Post-load health/readiness 200; exact three owned fixtures independently stopped
0/no OOM/no public ports, no application replacement mounts or provider actions.
Seven harness tests and strict typechecking passed. No purchase, deployment or
publication. Representative whole-product load, competing writers, open-loop
traffic and soak remain open. See the
[current package checkpoint](CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 exact current-image connected browser qualification

The fresh 63-source package passed 24 connected stages with zero replacement app
mounts: catalogue aliases/restrictions, held-source absence, Dutch unsent CSV
preservation and real CSV download, actual committed-reply loss/recovery with one
candidate, Communitech import refusal/zero rows, explicit edit acknowledgment,
individual intake/edit/review/manual completion, history/reminders/opt-out and
private JSON/export fences. Zero RPC mocks, zero unexpected diagnostics/outside
origins/real sends; one controlled committed-response fault and eight expected
diagnostics. Three owned fixtures independently stopped 0/no OOM/no ports. Current
desktop/mobile screenshots were inspected. No new application code, provider
action, permission, purchase or publication. Browser plugin absent; existing
isolated Playwright fallback used. Exact proof and broader untested acceptance
remain in the [current package checkpoint](CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

## October 2 fresh 63-source package qualification

The current CSV language interface and 63-record source catalogue were rebuilt
into fresh exact runtime/test artifacts. The configured runtime build passed
965 unit cases/94 files, and the mandatory fresh database suite passed 724 cases/
43 files with no skips. Compiled application/migration byte parity, nonroot
production packaging, private startup refusal, actual health/readiness and TERM/
INT migration cancellation/drain checks passed. Encrypted full-schema restore and
restored application login/ownership/session-revocation checks passed on these
new exact images; all three owned recovery fixtures independently stopped 0.
All 168 host operator checks
passed. Point-in-time production audit found no known vulnerabilities. This is
not current-image browser/load, hosted CI or public-release approval. The
[current package checkpoint](CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
retains exact identities, failure history, fixture states and open gates.
No scope reduction, provider action, purchase or GitHub publication occurred.

## October 2 Ontario discovery increment

Communitech is added as one indirect Ontario founder-community route, with
published eligibility, sold-out free-entry warning and separate paid-variant
uncertainty. Startup Canada is held internally after its terms required prior
link permission; no customer card, signup or permission request was made.
Current catalogue is 63 records: 18 dedicated, 23 community/channel, 22 program;
23 earlier manual-reviewed and 40 discovery-only. No source admission or provider
integration was expanded. [Source review and local proof](PLATFORM_CANADA_REVIEW_2026-10-02.md)
is authoritative for this increment; earlier package/browser receipts retain
their historical source counts. Full original scope remains incomplete and
EUR 100/month remains planning-only, not spending authorization.

## October2 CSV import/export language repair

Detailed authored EN/NL CSV labels, declarations, evidence/source restrictions,
retry and result guidance; adjacent CSV export copy and relocalizable count
notice.14focused cases/typecheck/finalVite3.73s and168host gates passed.24real
browser stages on host-compiled frontend/oldqualifiedbackend passed: unsent
language-switch preservation, actual owner-bound CSV download, committed lost
reply/samepayload replayonecandidate, forbidden source/edit review/oversized
account export. Six owned browser fixtures independently stopped0/noOOM/noports.
New immutable-package qualification remains open; other workspace/admin/server
language and full worldwide/hosted/provider acceptance are not removed.
[Canonical scope and evidence](CSV_IMPORT_RECOVERY_2026-10-02.md).

## October 2 signal-aware migration/server startup

Production default command now uses a bounded Node supervisor, forwarding stop
signals and refusing server launch after migration cancellation. Old immutable
runtime reproduced forced exit137 while waiting on a real test-owned migration
lock; new exact runtime31f3252b... stopped0 under the same three-second grace,
with zero schema changes/waiters/server launch. Repeatable release regression
passed real TERM/INT cancellation, normal default-command migration/startup,
health/readiness and clean shutdown.168currenthost checks passed/no skips.
Fresh mandatory database724tests43files/no skips passed316.11s;116compiled
application/migration file parity passed. All owned completed checks independently
stopped/noOOM/no public ports; no container deletion. New package
encrypted restore/application recovery passed46,783.6551ms on the new artifact;
three recovery fixtures independently stopped0/noOOM/noports. Fresh
browser23connected stages and30,000boundedread/write requests now passed;
100synthetic accounts/10,000candidates,400wrong-owner mutations refused/data
preserved. Normalwritep9568.78/237.38ms; read100overload885success5115busy503,
not100-user success capacity. Diagnostic label corrected from exactly-once to
owner/action count verification; strictTS/sevenharness cases and final168host
checks passed. Six new browser/load fixtures independently stopped0/noOOM/noports.
MixedCSVlanguage/hosted/provider/fullcoverage remain open; no116-phase
completion, production release or spending approval.
[Canonical signal/startup evidence](RUNTIME_SIGNAL_STARTUP_2026-10-02.md).

## October 2 current-artifact authenticated workspace write load

Existing fresh runtimeeaa6752e... under1CPU/512MiB/320MiBNodeoldspace; no compiled
application replacement.100real synthetic logins/10,000candidates,18,000reads and
12,000write-workflow requests passed;6,000saved changes,2,000unchanged replays,
2,000stale-review409; persisted10,000rows/per-owner audit counts checked.400write
owner-refusals preserved full candidate/audit snapshots. Readnormalp9599.55/361.34ms;
writenormalp95140.06/370.74ms; read100overload890success5110busy503 (not100-userSLO).
Sevenharness testsWindowsandLinuxNode22/dedicatedstrict typecheck/current165host
checks passed. All7ownedfixtures terminal/noOOM/noports; initialhelpermountfailure
retainedrunner1/app137/DB0. Earlydefaultmigration-start transition shutdown needs
diagnosis at that checkpoint; the newer signal/startup receipt above proves a
controlled locked-migration repair without retroactively changing the load image.
Selectedinventory38139f13.../
545files excludesrootdocs/providers and is notbuildprovenance. Original116Partial.
[Canonical current load evidence](WORKSPACE_WRITE_LOAD_2026-10-02.md).

## October 2 fresh CSV-recovery package qualification

Fresh exact runtime eaa6752e... and test580539d6... packages include current62-record
catalogue/intake/account-refresh/CSV recovery. Runtime build926unit90files/no skips,
typecheck/build;115dist-drizzle file parity; nonroot startup and23connected browser
stages passed without application replacements.165host checks passed;50portable
Linux cases passed separately. First mandatoryDB723pass/1fail remains recorded;
readiness cleanup deadlines/all-fixture cleanup repaired and real readiness passed.
Current encrypted full-schema restore/application recovery49349 also passed,
54171.5478ms/no skips/two real synthetic logins/session revocations/source preserved.
Unchanged mandatoryDB repeat13629 passed724tests/43files/no skips399.08s; first
failure retained, timing cause not diagnosed. All19currentowned fixtures stopped/
noOOM/noports; failures retain exit1. No application/dependency change this increment.
Full116Partial/public-production/provider/budget acceptance remains open.
[Authoritative current package receipt](CURRENT_CSV_PACKAGED_QUALIFICATION_2026-10-02.md).

## October 2 uncertain CSV import recovery

Client keeps failed/unconfirmed import payload/declaration locked for unchanged
receipt replay; explicit record-review confirmation allows editing, no submission.
Before-unload warning requested while pending/uncertain; tab-local identity remains.
Four new/current10focused tests passed; finaltype/build35956 terminal0/Vite7.00s;
root165/11files/no skips4244.8434ms. Broader926unit90files136.10s began before final
mobile wrapping/regression assertion; final focused/browser separately scoped.
Final83768 terminal0/23connected stages: actual backend commit then deliberately
lost browser response, byte-identical replay/one record; rejected import stored
none, decline/accept release/fresh rights enforced. Eight expected diagnostics/
zerounexpectederrors/outsideorigins/one response fault. All15owned fixtures terminal;
final3 independently stopped0/noOOM/noports; initial mobileoverflow fixed, two
export-fixture acknowledgment/locale errors corrected, screenshot viewport reset.
CurrentAPIc463e2f0.../UIe1926384.../225actions148files; selectedinventory2e837105.../
543files. No new endpoint/serverpermission/immutablepackage qualification or
externalprovider/spending/publication. [Canonical recovery proof](CSV_IMPORT_RECOVERY_2026-10-02.md).
Full116Partial remains.

## October 2 bilingual individual intake and duplicate review

CandidateIntake/OutreachConsole entry use existing language context. Thirteen
labels, declarations, review/create/reuse/refresh/edit controls, discard prompt
and pending/success/local fallback copy translated; original server errors lang=en.
Schema/permissions/review token/idempotency/storage unchanged. Six new rendering
regressions/current16focused passed; initial mock composition-hook omission fixed.
Finaltype/build12133 terminal0/Vite4.47s. Unit69853 terminal0/922tests89files/no
skips138.42s; root165/11files/no skips5392.964ms. Two connected21stage runs terminal0;
expanded50088 proved full-record reuse preservation and decline/accept discard.
All six owned fixtures independently stopped0/noOOM; compiled replacements are not
new immutable image qualification. Current API683bb193.../UIc20bab5b... snapshots
reviewed/refreshed with unchanged operation/action counts. Selectedinventory
005a6f5eff182d707304921f2b87899c472988fc7a1ba21e1b0b129a2f11dbe3/541files.
No provider/spending/commit/publication; full116Partial remains. Canonical
[proof, semantics and remaining acceptance](CANDIDATE_INTAKE_LANGUAGE_2026-10-02.md).

## October 2 Kenya/Nigeria discovery increment

Two community-network routes added without changing23manual-reviewed admissions:
62records/18dedicated22community22program/39discovery-only. Eight new alias/URL
admission regressions plus catalogue checks;158focused tests/type/build passed.
Connected synthetic browser21781 completed21stages/zeroRPCmocks/noexternalactions;
165rootoperator/audit tests11files/no skips3713.8998ms passed after UI closure
snapshot refresh. API4cc1faf0... unchanged/UIc2f774e2...; source-data change does
not add action elements. Current selected release inventory32382f425408f945ef214e96167e5003af264144d4bdc83cf689f52593c0cc20
covers540selected files; it is not image provenance or full-repository attestation.
Earlier immutable package predates these compiled replacements. No signup/send/
purchase/deployment/publication; full116Partial remains. Canonical
[review, acceptance and limits](PLATFORM_AFRICA_COMMUNITY_REVIEW_2026-10-02.md).

## October 2 budget-plan input hardening

Source confirmed lossy UTF-8 decoding and final-link following. New malformed
encoding regression initially14pass1fail; strict decoder/lstat-before-open/
opened identity check/Linux nofollow+nonblocking implemented. Four new tests;
final165roottests11files/noskips6283.9776ms. Linux17budgetcases/noskips759.933586ms:
actual symlink and FIFO rejection, exact32KiB/Unicode acceptance/onebyte excess
refusal, content-free CLI errors. Both own fixtures independently stopped0/noOOM,
read-only/network-none/nonroot/bounded, oldera187faca... Node with readonly external
scripts—not new application image qualification. Example still reports incomplete,
not zero-cost or under-budget proof. No app/dependencies/provider/paidcap changes;
full goal116Partial. Canonical [budget proof and boundaries](OPERATING_BUDGET.md).

## October 2 verification account-failure fix

Source review found cached auth.me data exposed workspace/resend controls after
failed refresh. Current VerifyEmail derives availability from successful query
state, hides cached verification/resend claims and offers EN/NL read-only retry;
public token confirmation remains separate. Four new regressions/current19cases,
type/build23947 terminal0/Vite8.60s, final four browser stages r3 passed using
simulated RPC responses. No actual mailbox/provider/database claim. r3 independently
stopped0/noOOM; desktop/mobile captures inspected. Initial typecheck nullable-data
failure corrected; first browser launch failed EACCES due noexec temp, replacement
isolated fixture explicitly uses executable tmp. No host/user settings changed.
Unit81939 terminal0/907tests88files/no skips156.98s began before final display
cleanup; focused final tests/browser are separately scoped. Final root161tests/
11files/no skips4196.5255ms. Current API4cc1faf0.../UI873b4440... snapshots refreshed,
223actionelements/204events/147files. Selected inventory85eee6b475fc60e8213b9c5d3fd85428bd3be14e7dcc85cc11b58020a72a527c.
Previous immutable images do not qualify this new UI source. Canonical
[proof and remaining acceptance](VERIFICATION_ACCOUNT_FAILURE_2026-10-02.md).

## October 2 current UI inventory and release gate

Added read-only scripts/ui-action-audit.mjs and five tests, source snapshot and
ordinary/declared CI gate. Current App closure147files/222actionelements/
203eventattributes/21navigation/5spread-action elements; digestcd56269a... .
Handler snippets/private values are not emitted; same-file API leads are not
guessed event bindings. Corrected old catalogue53 count to60 in UI_ACTION_AUDIT.
Final161root tests/11files/no skips/4223.0183ms, including actual import cycle,
drift, unresolved/malformed source refusal, nonexecution and content-exclusion.
Product-lens guidance prioritized lifecycle, candidate and administrator semantic
acceptance next; all222elements remain subject to applicable runtime review.
No application/runtime/dependency changes, new package, hosted CI or browser
acceptance inferred. Root package/CI changed after the following image receipts:
fresh selected inventory digest48264d89fc2ee467ea93113df7b3544ebcb81341d6d538fafec333d8af02aeea.
Prior c786f164... remains its dated build-input observation, not this checkout.
Full requirement scope remains116Partial/completionProvenfalse. Canonical
[current UI review and limits](UI_ACTION_AUDIT.md).

## October 2 combined current bounded local checks passed

Current mandatoryDB17486 terminal0:724tests43files/noskips279.78s/helper285.185s,
exacta187faca... . Bothddede2ad ownedtest/DB independently stopped0/noOOM. Real
migrations and current compiled server/ownership/quota/lifecycle/exports passed.
No hosted fleet/real provider/inbox/approved erasure inferred. Encryptedrecovery
98254 terminal0/one test/no skips/39815.1278ms/exacttesta187faca.../runtimed8e17b4f...:
actual restored two-owner login/isolation/revocation, schema and unsafe-target
refusals passed. All three927c83fc owned fixtures independently stopped0/noOOM.
Readiness80777 terminal0/one test/no skips31031.2686ms: actual CI/local/integration
authenticated TCP checks and bad-password/missing-schema/socket-only refusals.
Both owned readiness fixtures independently stopped0/noOOM. No inherited old724/restore receipt,
no real user data deletion. Canonical current evidence below supersedes the
historical progress observations that follow; they are not live handles.

Newest: test24346 terminal0/Vite19.44s/exacta187faca.../280702832bytes,115compiled-
migrationfiles/6935013bytes/5e2c54a6... matchruntime. Browser86028 terminal0/21stages/
7564c1b0: zero application/frontend/backend replacement mounts, actual customer
flow/current60catalogue/Dutch draft-queue-export/history/refusals. All3owned fixtures
independently stopped0/noOOM; current captures inspected.17Linux inventory tests/
noskips555.963965ms and10selectedhost/testsource hashes passed. Actualfile-symlink
refusal proven onLinux. MandatoryDBqualification17486 nowlive/exacta187faca...,
notyetpassing result; helperf81d7fa7... retained. Fullrecovery/hosted gates stillopen.

Latest:runtime41941 terminal0/prune546cachedzero-downloads/buildstep657.6s/new exact
d8e17b4f.../223493465bytes/usernode. Exact-ID artifactprobe passed at24346 start:
Node22.23.3/UID1000/115dist-drizzle/6935013bytes/5e2c54a6.../listed source-env-devtools
absent. Notwhole-layer/provenance/acceptance. Integration-test build24346 nowlive;
new browser/database/recovery stillpending. Prior diagnostic500didnot require
restart orsharedhost changes. Canonical document maintains historical observations.

Newer root inventory includes.npmrc hash/length without content; config changes/
missing/linked input refusal tested.156operator+API/no skips7190.3784ms passed.
InitialWindowsfile-symlink EPERM fixture uses unprivilegedjunction onWindows,
realfile-symlink elsewhere; no guard/privilege change. Selected540/10651167/c786f164...
Onlyrootaudittool/tests/docs changed; app/buildconfig unchanged. Build41941 new
progress317packages, remainslive. Diagnostic15248 terminal1 DockerAPI500; hostfree
space observed, internalDocker capacity/cause notproven. No restart/newimage claim.
Canonical combinedqualification below records exact evidence and pending sequence.

Fresh runtime build41941 passedtype/903unit88files/noskips110.03s/compileVite7.20s;
production pruning546cached/zero downloads last303added, handle remains live.
Host154operator+API/no skips3402.423ms passed. Readonly capacity observation15248
also live/no result. No new image identity or packaged acceptance yet; no restart/
broadcleanup/sharedhost change. Preparedzero-replacement21stagebrowser helper not
executed onnewimage. [Canonical live state and next steps](CURRENT_COMBINED_QUALIFICATION_2026-10-02.md).
All116Partial, no publication/deployment/purchase or completion claim.

## October 2 private account-export language

EN/NL export warnings/controls/local notices implemented; original JSON/server
errors remain unchanged. Password/review/current-account/fresh-auth/inflight/
mutationcleanup guards retained. Initial scope tests69pass2fail updated to reflect
current disclosure, final71tests10files/noskips6.60s/type/build13713 exit0/Vite12.40s/
API11pass/151inputs/9b92862f... . Browser93819 exit0/21stages: Dutch wrong-password
refusal/no download, actual exact original JSON/credentialsexcluded, language-
retained review/localnotice with no second download. All3owned325c361b independently
stopped0/noOOM; desktop/mobile/actions captures viewed. Two compiled readonlymounts,
notnewimmutable/fullsuite/restore. Source539/10651051/495334be... .
[Canonical export language evidence](ACCOUNT_EXPORT_LANGUAGE_2026-10-02.md).
No provider/erasure/publish/spending action; all116Partial and hosted acceptance open.

## October 2 Nordic discovery increment

Catalogue60=18dedicated/20community/22program. Danish Startup Group, Norrsken
Stockholm and Startuplab are indirect discovery-only routes; cost/access/permission
gaps explicit,23manual-reviewed IDs unchanged.149focused4files/no skips10.95s/type/
build62705 exit0/Vite6.56s/API11pass/snapshotunchanged. Browser86362 exit0/21stages,
41a04453 all3owned independently stopped0/noOOM; desktop/mobile/tablet inspected.
Actual alias/native-geography searches/cards/canonicallinks/Notconnected plus
retained customer flow passed. Two compiled readonly replacements (front+backend),
not new immutable/fullsuite/restore or public deployment. Selected538/10642644/
4aac87a3... . [Canonical research and verification](PLATFORM_NORDIC_REVIEW_2026-10-02.md).
EUR100/month planning only, worldwide scope and all116Partial phases remain open.

## October 2 review/manual-action queue safety and language

Dedicated EN/NL queue with per-record in-flight/current-account/pending guards,
original text/policy, fresh copy/destination lookup, and unchecked identity-bound
external-send declaration before confirmation. Historical confirmation after
suppression retained; no permission for new contact.67focused9files/noskips6.24s/
type61285 exit0/build Vite6.14s/API11pass/151inputs/6d7383ec... . Browser39590 exit0/
21stages: real Dutch review/approve/prepare, fresh clipboard exacttext/sentnull,
language-retained acknowledgement, synthetic confirmation and subsequent full
retained fixture. All3owned99172b27 independently stopped0/noOOM; captures viewed.
Initial68900 later modal-close timing failure corrected by waiting for cancelled
history/explicitClose, no guard waived. Onefrontreadonlymount, notnewimage/fullsuite/
restore proof. Selected538/10615607/68551f7b... . [Canonical results and open gates](OUTREACH_REVIEW_QUEUE_2026-10-02.md).
Full goal remains116Partial; no external actions/spending/production acceptance.

## October 2 connected unsent-draft management language

Manager/revision EN/NL labels, unsaved-change confirmation, safeguards, history,
local notices and date fallbacks implemented.52focused8files/no skips6.66s/type/
build14953 exit0/Vite5.96s/API11pass. Browser52215 exit0/21stages: actual revision
retains old text/cancelled state, creates unapproved draft, resets acknowledgements
on editing and cancels only after not-sent review; exact retained text/link/sentnull
verified in DB. Three68aaf2cc fixtures independently stopped0/noOOM; captures viewed.
Initial later export-tab navigation failure corrected in fixture, no guard waived.
One readonly compiled frontend mount, not new immutable package/fullsuite/restore.
Selected537/10599663/22963c0d... . Canonical [proof and limits](OUTREACH_MANAGER_LANGUAGE_2026-10-02.md).
EUR100/month remains planning-only; full production/worldwide/privacy scope remains.

## October 2 connected original-message language

Composer EN/NL named region/labels/acknowledgement/template controls/local fallback/
save-cancel disclosures implemented; original messages/IDs/server reasons retained.
46focused7files/no skips5.56s/type/build3362 terminal0/Vite4.65s/API11pass. Browser
67724 terminal0/20stages: actual cancel→DB0, language switch preserves inputs/review,
edit clears review, save exact text/state=draft/sentnull; existing subsequent flow
and private export passed. All3owned6d42558f independently stopped0/noOOM, viewport
captures viewed. Initial premature DB-read failure retained, test now awaits actual
editor-close completion; app save unchanged. Onecompiledfrontendreadonly mount,
notnewimage/fullsuite/restore. Current536/10585382/a3a48a40... . Canonical
[new source proof](ORIGINAL_MESSAGE_LANGUAGE_2026-10-02.md).
Wider draft review/import/account/admin/workspace/production scope still open.

## October 2 newer connected partnership-progress language

EN/NL authored progress surface/semantic local notices/locale dates implemented;
original notes/server explanations retained, guards/payload/policy unchanged.
40focused6files/no skips3.42s/type/build60367 terminal0/Vite4.93s/API11pass. Final
browser36472 terminal0/20stages: real assessment before opt-out, Dutch private report
save/retained original notes and acknowledgement, unchanged opt-out/send history,
English reopen and private export. Mobile label-wrap bounds proved/captures viewed.
All3ownedb3d4e7ad fixtures independently stopped0/noOOM. Initial fixture failure
without assessment retained; app prerequisite not bypassed. Onecompiledfrontend
readonly mount on c0dae360runtime, notnewimmutable/fullsuite/restore proof. Current
536/10578359/2ad009f7...; canonical [new source limits](CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md#newer-partnership-progress-language-source).
Continue wider functional/platform/privacy/operator/hosting goal;116Partial.

## October 2 current database and recovery qualification

Exact testa8f6c15c... migration/fullsuite55779 terminal0:724tests43files/no skips/
363.47s; all2owned1f6f18e6 fixtures independently stopped0/noOOM. Subsequently
recovery68987 terminal0/onefullschematest/no skips76265.8485ms: exactruntimec0dae360...
served restored two-owner login/private candidates/isolation/logout; historical
sessions invalidated/admin elevations cleared, schema/index/journal/UTF-8 preserved,
unsafe restore refusals passed. All3owned814bb2b2 fixtures independently stopped0/
noOOM. Readiness56632 terminal0/one realMySQL test/no skips33843.5117ms; bothowned
DBs independently stopped0/noOOM. No code/test/permission changes or publication.
Canonical [current proof and limits](CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md#current-database-recovery-and-readiness-qualification).
Source536/10566051/c24711c9... unchanged; whole116phase/worldwide/privacy/erasure/
hosted goal incomplete. The following dated checkpoints retain earlier status.

## October 2 combined immutable package

Runtimec0dae360... build92342 terminal0/type/856unit85files/no skips107.56s/
Vite5.21s/pruning; testa8f6c15c... build85372 terminal0/Vite3.86s. Both compiled
116files/6900057bytes/fd094816... matched. Browser97146 terminal0/18stages with
zero application/compiled replacements, actual Dutch archive→restore→opt-out and
metadata preservation. All3fixtures372e2d5d independently stopped0/noOOM. Host
143operator+11API checks pass; source536/10566051/c24711c9... unchanged. Canonical
[new package scope](CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md#new-immutable-package-checkpoint).
Database/restore not yet repeated on these images; older724/restore proof cannot
be inherited. Continue exact-image database/recovery and full original requirement
scope. No publication/production readiness;116Partial/completionProvenfalse.

## October 2 connected candidate-detail language

EN/NL parent panel/profile/archive/restore/source-import/contact/opt-out/history/
close labels implemented; original data/server explanations retained, English
progresschild explicitly bounded.31focused5files/no skips6.67s/type/build15795/
API11exact-snapshot passed. Browser98340 terminal0/18stages, actual acknowledgement
archive→restore→opt-out and retained profile/source metadata proved. Both compiled
backend/frontendreadonly mounted on4c912runtime, notnewimmutable. All3fixtures493c72ba
independently stopped0/noOOM; viewport captures viewed. Canonical
[detail language evidence](CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md).
New536/10,566,051/c24711c9... source still needs packaging/fullregression/restore;
whole translation/worldwide/privacy/operator/hosted/116phase goal incomplete.

## October 2 Caribbean discovery increment

TechBeach/Parallel18 added as indirect programs;57records18dedicated18community21program,
23manualreview IDs unchanged;31October additions discovery-only.146focused4files/
noskip5.81s/type/build99312 terminal0/APIscanner11pass; browser23946 terminal0/
17stages/current backendreadonlymount, notnewimmutable. All3fixtures10532b6e
independently stopped0/noOOM. Canonical [Caribbean review](PLATFORM_CARIBBEAN_REVIEW_2026-10-02.md).
KingstonBETA held after direct-read failures. Currentsource newer than imagesbelow;
packaging/regression still to repeat; fullworldwide/privacy/hosted/116phase incomplete.

## October 2 current candidate-language database and restore acceptance

Testimageb68937a8... build30084 terminal0, dist/drizzle116/6,881,429/2b9369ed...
matches currentruntime4c912409...; five changed source/test hashes matchhost.
Database10323 terminal0/724tests43files/no skips331.43s; unchanged two-process
migration2514mspass. Both3c192984 fixtures independently stopped0/noOOM. Sequential
recovery29389 terminal0/1fullschema/noskip44.7094031s; newest actualruntime proved
2ownerlogin/isolation/logout, schema/index/journal/binarypreservation and unsafe
restore refusals. All3fixtures4b90dd38 independently stopped0/noOOM. Only synthetic
temporary snapshot/key directory removed, no user data. Canonical subsequent
qualification in [candidate correction receipt](CANDIDATE_EDITOR_LANGUAGE_2026-10-02.md).
No remote recovery/wholecustomerjourney/erasure/liveprovider/hosted/fullgoal closure.

## October 2 candidate-profile correction language

English/Dutch editor and connected discard/save actions implemented; unchanged
source/import/consent/owner evidence verified in the actual database. Final25
focused tests/4files/no skips, type/build,11 API-scanner tests and17 isolated browser
stages passed. Browser used a read-only current compiled frontend over runtime26342;
all3 owned fixtures independently stopped0/noOOM. This source is newer than the
immutable images below; full packaging/regression/recovery remains to be repeated.
Subsequently runtime4c912409... build76263 terminal0/type/841unit84files/no skips/
118.43s/Vite7.3.6/3.89s/prune; browser7253 terminal0/17stages with zero replacement
mounts. All3e2db6eea fixtures independently stopped0/noOOM; actual viewport captures
viewed. Dist/drizzle116/6,881,429/2b9369ed... . This closes the replacement-frontend
gap for those stages; full database regression/restore still to be repeated.
See [canonical evidence and limitations](CANDIDATE_EDITOR_LANGUAGE_2026-10-02.md).
Whole-product language/visual/privacy/hosted/worldwide gates and116Partial remain.

## October 2 bilingual production runtime and current-artifact recovery

Runtime26342d31... build17205 terminal0/type/fullunit/build/prune; inspected usernode.
Compiled dist/drizzle matches qualified testimage1d08ad50...:116/6,879,836/
3ee381f4...; source/devtools absent in runtime. Browser12734 terminal0/16stages,
zero frontend/source mounts, actual Dutch history/reminder/close/export workflow;
all3fixture7ab30c72 independently stopped0/noOOM. Recovery29017 terminal0/1fullschema
test/noskip45.6994693s; actualnewserver2owners/login/isolation/logout, all3b1d54fdb
fixtures independently stopped0/noOOM. Canonical
[runtime receipt](BILINGUAL_RUNTIME_ACCEPTANCE_2026-10-02.md). Supersedes prior
mounted-frontend gap only for repeated stages; no broad accessibility/translation/
remote recovery/provider/privacy/hosted/fullgoal acceptance. No external actions.

## October 2 current bilingual locked test package

New integration-test image1d08ad50... build72480 terminal0; Node22.23.3/Vite7.3.6
inspected/four translation source-test hashes matchhost. No Viteversion mismatch:
earlier6.x figures were seconds. Isolated actualDB43585 terminal0/724tests43files/
no skips312.68s; unchanged two-processmigration2339mspass, both fixtures independently
stopped0/noOOM. Then exact-image type/unit48079 terminal0/837tests83files/no skips
144.49s. Canonical [test-package receipt](BILINGUAL_TEST_PACKAGE_2026-10-02.md).
No production-runtime rebuild/browser/recovery scope transferred. README now starts
with product/scope/navigation and separates dated evidence from current acceptance.
No live operations/publication/spending; full116phase goal incomplete.

## October 2 conversation control localization

English/Dutch conversation panel now wired, including acknowledgement/scheduling/
closure safety, locale dates, semantic success/error state and English server-error
boundary.21focused tests/type/build/16browser stages pass; Dutch real-HTTP response,
reminder and close database transitions verified.58585 terminal0, fixtureseb1c5a07
independently stopped0/noOOM. Current frontend mounted read-only; not new immutable
or broad retry/failure localization acceptance. API11pass/digest78fe5807...;
inventory534/10,519,674/1257bf49... . Canonical
[conversation receipt](CONVERSATION_LANGUAGE_2026-10-02.md). Broader bilingual,
privacy/erasure/provider/hosted/fullgoal gates remain open. No external changes.

## October 2 complete reminder-panel localization

English/Dutch reminder copy, state labels, accessible names, date locale and
error language boundaries now wired; original user content/query/approval state
preserved.17focused tests/type/build/16browser stages pass, final39335 terminal0,
3fixtures independently stopped0/noOOM. Browser checks selected-filter survival
through language switch and375px overflow; queue screenshot visually inspected.
Readonly compiled frontend mount, not new immutable qualification. Canonical
[reminder language receipt](REMINDER_LANGUAGE_2026-10-02.md). Static API snapshot
refreshed/11pass, current inventory534/10,510,909/9f3b751f... . Phase057 and whole
goal remain partial; no live changes/providers/sends/spending.

## October 2 accessibility repairs: exact production-image check

New runtime image ac37fba8... now includes both frontend repairs. Type check,
827 unit tests/82 files, build and 16 network-isolated real-HTTP browser stages
passed with zero source/frontend mounts. All three fixtures independently stopped
0/no OOM. First network-disabled build failed at Corepack download; normal-network
retry passed, so no offline reproducibility claim. Budget checker 13 tests passed;
EUR 100 ceiling remains planning only. See the
[canonical receipt](ACCESSIBILITY_PACKAGED_ACCEPTANCE_2026-10-02.md).
Full new-image database/recovery, whole accessibility, provider and hosted gates
remain open. No live changes, sends, spending or goal-completion claim.

## October 2 substantive lifecycle gate review

Reviewed current processing CLI/preflight, runbook, original requirement matrix and
retention draft. Account erasure remains absent: CLI successdataErased=false,
preflightdeletionAuthorized=false; no backend erasure, independent restore
suppression or approved category policy is established. Added a concrete owner
[decision handoff](ACCOUNT_RETENTION_ERASURE_POLICY.md#owner-decision-handoff--source-review-october-2-2026)
for controller/contact/reviewer/category/store values. No policy defaults accepted,
real account inspected/suspended/deleted or provider action taken. This is a launch
dependency, not a reason to mark the whole116phase goal complete or blocked while
other safe implementation work remains available.

## October 2 primary label contrast repair — newest source

Accessibility skill/browser measurement confirmed dark login primary text3.49:1;
near-black primary/sidebar label tokens retain orange backgrounds/light theme.
37focusedtests/4files/type/build and16browser stages pass; normal5.43/hover4.67:1,
all3fixtures independently stopped0/noOOM. Canonical
[contrast evidence](PRIMARY_LABEL_CONTRAST_REPAIR_2026-10-02.md) binds exact measurements,
failure/current trees/isolation/limits. Scoped readonlyfrontendmount, not immutable
image/fullWCAG/hosted qualification; global contrast and release gates still open.

## October 2 rendered heading and keyboard qualification

Newest frontend browser35060 passed15stages, including responsive headings/named
forms/native login Tab order/registration mode and all14workflow stages. Compiled
frontend mountedreadonly into retained backend, not newimmutableimage. First wrong-
mount fixture failure retained/corrected; all3finalfixtures independently stopped0/
noOOM. Canonical [repair evidence](RESPONSIVE_HEADING_REPAIR_2026-10-02.md#rendered-and-keyboard-qualification)
records tree/helper/image/fixture identities and limits. Full accessibility/visual
baseline/image/hosted acceptance remains open; no real sends/providers or spending.

## October 2 responsive heading repair — newest source state

Fixed mobile login's missing visible page heading and catalogue source-title
semantics; localized form h1/name and card h3, no shared-title/global behaviour
change. Accessibility skill guided inspection. Initial regressions failed3;
after repair34focused tests/3files/no skips, type/build and11APIaudit tests pass.
API counts unchanged; selected532/10,500,806/87f3d792... . Canonical
[repair evidence](RESPONSIVE_HEADING_REPAIR_2026-10-02.md) records exact digests,
failed observations and scope. Packaged receipt below predates this UI change;
fresh browser/keyboard/image verification required. No fullWCAG/production claim.

## October 2 current catalogue and route gate packaging

Previous turn improved release comparison; current turn freshlybuilt Node22 runtime
and integrationimages from current55record catalogue/exact58operation gate. Both
terminalexit0; runtime822units81files/no skips166.47seconds/typecheck/build/prune.
Inspectedimage identities, compiled/migration equality, realauthenticatedHTTP55
records/10intake refusals/6unknown-or-mixed route refusals/zero candidates/logOut
revocation, resource/isolation bounds and failures are canonical in
[packaged receipt](CENTRAL_ASIA_GATE_PACKAGED_ACCEPTANCE_2026-10-02.md).
Deployment-patterns skill guided nonroot/pruned/readonly checks, no hosted changes.

First mandatoryDBrun723pass/1migration-concurrency locktimeout369.08seconds;
not fullacceptance. Testwait3secs vs productiondefault60; builds overlapped,
contention plausible not proven. No deadline/guard/image weakening. Fixed external
helper failurecleanup (first failure left ownedDBrunning until verified/manualstop),
then forcedexit9 proved allownedfixturesstop. The unchanged isolated fullsuite rerun
completed session6196 terminalexit0:724passed/43files/zero skips353.18seconds,
runner361.096seconds. Both owned fixtures independently stopped/exit0/noOOM.
The formerly failing serialization case passed unchanged in2585ms. Earlier failure
remains recorded; contention cause and representative concurrent-start reliability
are not proven by this single successful rerun.
RootNode22image operatorattempt lacksDockerCLI (11fail,142pass,1Windowsskip);
Docker-independent9suite subset141pass/1Windowsskip/6.4985s. Host154operators
previouslypassed; no Linux/Node22full-suite or hosted CI success claimed.

Fresh exact-image encrypted recovery session73992 passed1test/no skips56.2871376s:
schema/index/journal/binary/UTF8 checks, unsafe-target/corruption/privilege refusals,
historical session invalidation and actual restored two-owner login/ownership/logout.
Windows encrypted-backup wrapper ran; three owned fixtures independently stopped0/
noOOM/no publicports. Canonical packaged receipt records IDs/hashes/isolation and
limits; no remote backup/production-scale/deletion reconciliation acceptance.

Selectedappinventory remains532/10,499,557/aa71d760...; root/docs/helpers/image
layers excluded. Current-image browser90315 passed14stages:55record/native-alias
catalogue, candidate/draft/manual preparation/conversation/reminder/private-export
flows, owner/anonymous and oversized/password refusals; noRPCmocks/real sends or
external requests. Three fixtures independently stopped0/noOOM. First harness
failure and details-state correction retained in canonical packaged receipt;
application bytes unchanged. Visual baseline INCONCLUSIVE; accessibility/WebVitals/
all-navigation and representativehosting/load, controller/
privacy/retention/billing and worldwide/liveprovider coverage remainopen.
All116phasesPartial, EUR100planning-only, no commit/push/merge/spend/deploy/send.

## October 2 read-only release comparison

Previous turn made concrete Central Asia catalogue progress. Reviewed the release
evidence gap: selected source/build inventory already includes catalogue bytes,
while API declaration audit intentionally does not. No demonstrated inventory
omission; the missing operator capability was automated comparison to a saved
observation. Extended existing release:inventory with --compare, no new suite or
provider integration. Validates bounded2MiB strictUTF8 baseline, v1scope, sorted
unique canonical rows/digest and recorded size/count limits; compares additions,
removals/modifications/roles without reflecting names/content. Matching remains
identity-only; all acceptanceflags false regardless of suppliedmetadata. HEAD,
dirty state and metadata claims are not release approval or compared identity.

Seven new tests (15inventorytotal) initially passed an actual CLI subprocess against
this checkout, matching exit0 and changedbaseline exit1, catalogue-only source change,
roles/counts, tamper/order/path/size/UTF8 refusals and native filenames. First full
operator run153/154 failed solely because Windows cannot create unprivileged file
symlinks. Replaced that fixture with a supported Windows directoryjunction, keeping
POSIX file-symlink testbranch; no permission changes or skippedtests. Final full
operator suite154/154 noskips3.208seconds/exit0 at that checkpoint. Final review
found the actual-checkout test required preexistingdist, incompatible with CI's
operator-before-build order. Changed only its test fixture: real Node child process
calls the same comparison handler against synthetic source/build files with Git
identity injection, no app build or existing checkout required. Production CLI
default still reads real Git/files. Subsequent23focused tests pass, zero skips.
Final full operator rerun154/154, zero skips,4.750686seconds/exit0. Current
release-inventory.mjs SHA256
07d13f7fa8ff2af9319b577bd299a8d315bb2dfa69bd4af1db75d3e10c81a0c7;
release-inventory.test.mjs SHA256
b5c98a2e8f9dfe15674bc4d8340c12650c7774dcdb834856db07e64e4fd47506.
App source/compiled bytes unchanged;
no app unit/build/database/browser/immutableimage/Node22 rerun in this increment.
Prior822units81files remain dated earlier evidence, not a newly run suite.

Canonical semantics/limits: [release inventory](RELEASE_INVENTORY.md#compare-a-saved-observation-with-current-files).
Selectedappinventory remains532files/10,499,557bytes/
aa71d7603278ad3c7d5b1a8d8714304d9b7cd6ab27924f023518039fe030be82:
root operator/docs are excluded, so do not use it to bind these changed scripts.
No publicwrite,commit,merge,purchase,provider action or releaseapproval occurred.
Full116phasesPartial; worldwide and productionacceptance remain open. EUR100/month
is planning-only. Safe follow-up remains fresh immutable-image qualification of
current catalogue plus exact route gate, not inheritance of olderimage receipts.

## October 2 Central Asia discovery increment

Previous goal turn only acknowledged the already-recorded budget: no progress.
Revalidated current worktree and continued an unrepresented regional tranche.
Deep-research primary-source review added Astana Hub (Kazakhstan) and Startup Base
(Uzbekistan) as indirect ecosystem routes, not dedicated co-founder matching.
The [thirteenth source supplement](PLATFORM_SOURCE_REVIEW.md#thirteenth-coverage-supplement-2026-10-02-central-asia)
is the authoritative source/method/uncertainty record. All source flags remain
false; both discovery-only; explicit23-source manual admission set unchanged.
Public catalogue55:18dedicated/18community/19programme. Six new ID/name/domain
variants refuse source resolution/intake/CSV/outreach before storage. Native
aliases, separate-category filtering, policy links and static rendering tested.

Focused138tests/5files passed without skips in4.72seconds. Root147operator checks
passed without skips in4.459seconds; API snapshot still matches150inspectedsource
files/165operations/58admitted/107denied/54App-graphreferences. Catalogue data is
not among that AST snapshot's inputs: its unchanged digest does not bind these
new records. Typecheck and production build passed (Vite11.56seconds). Fullunit
suite passed822tests/81files with zero skips in120.21seconds on hostNode25;
session66037 terminalexit0. Initial focused87/2files also passed; a misspelled
third-file filter did not run freshness checks in that first invocation, so the
subsequent explicit138/5file run is the complete focused receipt.

Current selected source/build inventory532files/10,499,557bytes,
digest aa71d7603278ad3c7d5b1a8d8714304d9b7cd6ab27924f023518039fe030be82.
No new immutableimage/database/browser/Node22/live-provider qualification this
increment; old receipts predate exactgate/catalogue/compiledchanges. Corrected
README wording that incorrectly called the earlier53-record image current.
All116originalphases remainPartial/completionProven=false. Widerworldwide/live
workflow/customer/deployment/privacy/billing acceptance stays open, not redefined
around55records. EUR100/month remains planning-only; no external writes or spends.

## October 2 exact named-operation admission

The previous goal turn supplied a source-derived165-operation audit. Reviewed
admitted API-only manual/conversation/profile paths: older conversation adapters
already use guarded changeConversation, no demonstrated bypass there. Found a
future-exposure risk instead: auth/profile/criticalPath/system prefix policy
automatically admitted any new declaration in those groups. Initial7policytests
reproduced5failures (four broad prefixes plus suffix/sibling case), with2passing.
This is preventive hardening, not proof an undeclared endpoint was exploitable.

Replaced broad prefixes with the exact58previously admitted declarations, retaining
all existing supported methods and107denied declarations. Extracted the existing
HTTP gate to createTrpcRouteAdmission and wired that same factory before tRPC in
the production entrypoint. Fixed403 envelope/cache/correlation behavior retained;
handler auth/verified/owner/fence/feature/admission checks remain independently
required. Unsafe legacy override remains unsupported production and is not enabled.
API-design skill guided explicit contract and error/method boundary consistency;
no public API redesign, endpoint removal or feature-scope reduction.

Final8new tests include real loopback HTTP against the actual admission middleware:
all58reach only a downstream fixture sentinel (NOT real handlers), six unknown/
mixedPOSTrequests403 without reaching it, cache/correlation checked. Pure cases
refuse five future groups, sibling/suffix names and mixed batches, preserve all
current165policydecisions and explicit legacy override. Focused19tests/3files
pass onWindows and Node22Linux, no skips. Linux1.87sec/exit0 uses cached71810827
integration image with only currentpolicy/test/snapshot mounted read-only, network
none/no public ports/capdrop/no-new-privileges/2CPU/1GiB/no extraswap/256PIDs/
64MiBnoexec tmpfs; disposable root/writable test layer for Vitest config, not runtime
hardening acceptance. No application startup, real handler/DB/provider actions.

Fullunit815/81files/no skips/108.27sec/exit0 in14588; type/production buildexit0
in98492;147operators/no skips/3.3053378sec/exit0. Initial formatter invocation used
wrong cwd and failed before formatting; correct root invocation completed before
full units. Scanner updated for exact-list projection and reviewed snapshot
regenerated:150inputsource files/digest
02293498ffb08248714f98c080abf712d764b37742ec0ffca2aa69b6b43ee986,
165/58/107/54graphreferences unchanged; source/policy/hash drift check passes.

Selected currentapp/build inventory532files/10,478,031bytes/digest
bfa963bba3e1b595a2218caa7f1bd9852d4ef5703deee69b835cfaf08e74d1e1;
all provenance/acceptance flagsfalse. Previous80da7dc0runtime/71810827test immutable
receipts predate changed gate/index/build bytes, cannot qualify current release.
Fresh exactimage/database/browser/recovery qualification is still required.
No live test handle, purchase/publication/commit/merge/deployment/real outreach.
All116originalphasesPartial; legal/controller/inbox/hosted/worldwide gates open.

## October 2 source-derived API and action audit

Replaced the short unsupported-surface audit with a read-only TypeScript AST
scanner and source-hashed inventory:165operations/58default-admitted/107denied,
54hook/simple imperative references inApp runtime-import graph, zero unknown or
graph-to-denied references. Resolves verified/protected alias and owned MFA base,
includes API-only declarations rather than treating absent controls as denial.
Complete declaration/consumer positions/digests and150inputfile hashes in
API_SURFACE_INVENTORY_2026-10-20.json; readable58-route map inAPI_USAGE_AUDIT.
UI_ACTION_AUDIT now covers current route/action/data-effect/failure categories;
corrected old1MB CSV claim to actual512KiB/1000data rows and documents accountData.

147root/operator checks/no skips/3.0224707sec/exit0;11new scanner tests include
snapshot drift, actual pure-policy agreement, aliases/imperative MFA consumers,
fake strings/comments, unsupported shapes and explicit unknown imports/calls.
Initial root inventory guard caught omitted ordinary suite wiring; added
pnpm test:api-audit to ordinary test/CI and reviewed inventory, preserving guard.
Initial Node22/Linux check caught Windows/Linux reference enumeration mismatch;
sorted references deterministically, regenerated reviewed snapshot, retained
unchanged inspectedsource hashes; final inventory also binds procedure-boundary
and HTTP-wrapper source. FinalNode22Linux scanner rerun passes11/no skips.
Scanner does not execute app modules or prove handler ownership/data-effect
semantics, complete dynamic call graphs or every UI state. CI configuration is
local preparation, not hosted CI execution.

Final150-source snapshot/HTTP-boundary binding rerun:147operators/no skips/
3.3944609sec/exit0; Node22Linux11scanner tests/no skips/1.129881835sec/exit0.
Node22 check uses cached71810827integration image with exactly the new two root
audit scripts and JSON snapshot mounted read-only; existing150app-source hashes
match current snapshot. UID1000/read-only/networknone/capdrop/no-new-privileges/
2CPU/1GiB/no extraswap/128PIDs/64MiBnoexec tmpfs, no provider actions. This is
operator-tool compatibility, not a rebuilt immutable release containing newtooling.

Rootpackage scripts changed selected release inventory to531files/10,469,976bytes/
676795583627a0e441e2f5c30233426c89321ad9ea2fc1cc4bf8797d4f538b43;
all provenance/acceptance flagsfalse. App handlers/client/build artifacts unchanged;
new root audit tooling/CI/manifest not qualified by older image provenance.
All116Partial; no publicwrites/deployment/spending/contact, no live test handle.

## October 2 ANZ current-image browser and recovery

Current80da7dc0 runtime passed14connected browser stages/session74825exit0,
including catalogue aliases/category/evidence/link restrictions and the real
candidate/draft/conversation/private-export journey. No RPC mocks/external
requests/real sends; synthetic preverified owners. Four reviewed intentional
403/413 diagnostics, no unexpected errors. Desktop1365x1000/mobile375x812
screenshots actually inspected; first viewport captured, no horizontal document
overflow in asserted mobile states. Browser plugin/skill pair absent; cached
regular Playwright fallback followed frontend-testing-debugging skill.

New71810827 test image/new80da7dc0 runtime also passed full-schema encrypted
isolated recovery/session59214:1test/no skips/35.2966342sec/exit0. Restored real
HTTP app supports two scoped synthetic logins; historical sessions remain
expired/admin step-up cleared. All browser/recovery fixtures independently
stopped0/noOOM, no live handles; temporary synthetic recovery files removed.
Exact IDs/hashes/bounds/limits in
[the canonical receipt](ANZ_PACKAGED_ACCEPTANCE_2026-10-02.md).
No application edits, full accessibility/hosted/mail/provider/legal/worldwide
coverage not proved; all116Partial. No release/spending/contact actions.

## October 2 ANZ current-image qualification

Fresh Node22 runtime and integration images build successfully; runtime build
passes807units/80files/no skips/92.76sec and type checking. Exact compiled dist/
migrations match116files/6,857,848bytes/digest1567de40.... Current production
HTTP smoke and authenticated53-record catalogue checks pass:3new discovery-only
records,6intake refusals including manual-URL laundering, zero candidates written,
anonymous/logout401. Runtime and its fresh DB stopped0/noOOM, session33616exit0.
No source mounts, public ports or provider requests. Canonical image IDs, probe
hashes, bounds, initial harness/build failures and qualification limits are in
[the packaged acceptance receipt](ANZ_PACKAGED_ACCEPTANCE_2026-10-02.md).
Required database suite session14608 passed724tests/43files/no skips/247.27sec/
exit0; test runner and its separate DB stopped0/noOOM. All owned fixtures are
terminal, no live handle. These local checks do not prove operator recovery.
Browser/recovery/hosted/provider/legal/worldwide gates remain open; all116Partial.

## October 2 Australia, New Zealand and Fiji discovery

Added three primary-source-supported local discovery records: startups.org.nz,
Fishburners and Fiji Innovation Hub. They remain community/programme routes,
not dedicated matching or connected integrations. Restricted scraping, paid
external access, expired Fiji2026 cohort and unknown admission/policies are
explicit. Held Lineup/Something New rather than asserting access from snippets.
Deep-research used available web tools; Firecrawl/Exa unavailable. Five English
queries and direct reads, no profiles/accounts/forms/messages/purchases or public
publication. [Canonical research](PLATFORM_SOURCE_REVIEW.md#twelfth-coverage-supplement-2026-10-02-australia-new-zealand-and-fiji)
preserves primary URLs, limits and open country/language/rights work.

Current catalogue53:18dedicated/18community-channel/17programme, plus heldF6S
internally. Nine new ID/name/domain admission cases remain closed through source
resolution, candidate intake, CSV import and outreach declaration. Final93focused
catalogue/static-render/review-date/admission tests pass/3files/no skips/3.80sec.
Type check and production build pass;807full units/80files/no skips/105.28sec/exit0
and136operator checks/no skips/2.746sec/exit0. Initial focus exposed one remaining
historical50-count assertion; updated to actual53, not weakening admission.
Full unit run preceded the final reader-reference wording clarification; focused
tests and build reran after it. No current-source DB/browser/Node22 packaging in
this increment. Earlier6289a808 image and browser/export/recovery receipts predate
these entries and are historical, not current-artifact qualification.

Selected application/build inventory531files/10,469,826bytes/digest
`bedab7b495941df3599d4bcb7bae3f312777d1ee6604291417480eacb961a0e9`;
all provenance/acceptance flagsfalse. Root operator/docs excluded, not a full
release attestation. All116phasesPartial; EUR100/month planning-only; no external
release action. Next current-artifact qualification must include these source and
build bytes and the admission/customer paths, without reusing an old receipt.

## October 2 packaged private account-export acceptance

The final expanded customer journey passed thirteen stages, terminal exit0 in
session38729. It repeats the preceding nine conversation stages and adds actual
browser password-confirmed export, private JSON inspection, ownership refusals
and an oversized-export failure. Exact application/runtime/QA/MySQL images are
unchanged from the preceding conversation receipt. There are no RPC mocks,
application source mounts, public ports, external requests or real sends.

Export-specific evidence:

- Download remains disabled until current password and private-data review are
  supplied. An incorrect password returns the reviewed403, clears the password,
  consumes one durable attempt and produces no download.
- The successful browser download has the expected dated filename and
  `cofounder-account-v1` format. Parsed JSON contains the correct account, active
  candidate, explicitly seeded archived/opted-out history, and the closed outreach
  record with sent/response/close history and no active reminder.
- The foreign account's seeded candidate is absent. The tested password/hash are
  absent; the session token-digest property is absent from session records.
  Credential exclusions are disclosed in category metadata. At least43 reviewed
  categories are represented; this fixture does not populate every category.
- Successful export consumes the second attempt and writes exactly one success
  audit receipt. The input password is cleared. The private JSON is parsed only
  inside the disposable browser container, not saved into the checkout.
- Real HTTP forged-account export returns403; anonymous export returns401.
- 2,130 synthetic retained candidates with10,000-byte bios push raw export content
  above20MiB. The real UI returns413 with operator-assisted-export guidance,
  clears the password and consumes the third attempt. Download count stays1 and
  success-receipt count stays1: no partial/second download or false success.

Desktop1365x1000/mobile375x812 screenshots were inspected. Page identity,
meaningful content, framework-overlay absence and interaction proofs pass.
Two deliberate UI refusals produce four expected console diagnostics: browser
403/413 and exact reviewed tRPC wrong-password/oversize messages. The test checks
those specific diagnostics and rejects all other errors; no unexpected console
errors occurred. The first run completed twelve stages but failed its overly broad
zero-console-error assertion on the expected wrong-password refusal. The next
twelve-stage run passed; final thirteen-stage run adds retained history/size proof.
No application guard, endpoint or package was changed to obtain a pass.

Docker/frontend-testing guidance kept fresh synthetic environments non-root,
read-only, resource-bounded and network-disabled. Browser plugin unavailable;
existing Playwright1.62.1/Chromium148 used. Synthetic verified fixtures are not
live email verification. All final6440de79 fixtures independently inspected
stopped0/noOOM; ephemeral database data and browser-temp downloads discarded.
Runtime `5293473aaf35e7d8fc6f739fb735e522aff84814587ed09f220c643164f539f2`,
browser `8d7b499d2ce64d4683e23fa9462eaf39998bdce434ec81d9c971ce6e0dd29a0c`,
database `c0d4553f984ff84d39681a062f823f3079fdcd7c4472644d76b9189c403da4ba`.
External reproduction scripts under task workspace
`outputs/account-export-packaged-20261002/{runner.mjs,browser.cjs}`; browser SHA256
`169266181d0ce18dddd284f759000035ff2f5138b2ce40d394e1356c777bebb3`,
runner `f14932bc4826442f5355a55b15d45936e6225b3cf04d77996dfda8959aa53c26`.

This is bounded packaged export acceptance, not a complete legal access response,
population of every category, operator-assisted oversized delivery,100,000-row
boundary proof, all concurrent/stale-account/outage cases, live provider or hosted
acceptance. Wider privacy/controller/retention/recovery gates remain. No real data,
publication, deployment, provider actions or purchases. Selected application
inventory unchanged; all116 original phasesPartial. EUR100/month planning-only.

## October 2 packaged conversation and follow-up acceptance

Nine final acceptance stages passed against the exact `6289a808...` production
runtime, using real local browser/RPC/MySQL requests and no RPC mocks or application
source mounts. Sign-in, declared candidate intake, original draft/review/approval,
manual preparation, synthetic completion receipt, reminder queue, response,
mobile controls and closing/history retention were exercised. A saved Amsterdam
local reminder time matched its exact UTC database value. A forged reminder
account returned403 and anonymous access401 through real HTTP. Browser console
and external-request collections were empty. One synthetic confirmed-completion
record is test data, not evidence of real sending; actual provider actions were0.

Final session41676 exited0. Browser/runtime/database fixtures suffix08b04051 all
stopped0/noOOM; database lived only in ephemeral tmpfs. Screenshots were inspected
at1365x1000 and375x812. Browser skill was absent, so frontend-testing guidance used
existing Playwright1.62.1/Chromium148 QA image; Docker guidance kept non-root,
read-only, resource-bounded fixtures on network-disabled loopback with no ports.
Manual preparation was unpaused only in that self-created fixture, not production.
Initial QA executable-temp and invalid evidence-reference inputs failed; corrected
the harness/fixture, not application security. Eight preliminary stages then
passed; final nine-stage run added time-zone and account-isolation checks.

Reproduction scripts outside repo:
`outputs/conversation-packaged-20261002/{runner.mjs,browser.cjs}` under the task
workspace. Browser script SHA256
`05628f42836e5e0c74f5b1f1276eb88f4dbd8cef61bb87ae2e956bea3ef61626`;
runner `f14932bc4826442f5355a55b15d45936e6225b3cf04d77996dfda8959aa53c26`.
Runtime `sha256:6289a8085aec51dfd806ddcaa8c05d57cfa364fcccc10f59bb31210b1ce48e72`;
QA `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`;
MySQL `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Final runtime/container `35977f2bef9496a31a2200d21fbea62c6757ad1ca1b83ad65806b64c10ab4b1e`,
browser `09ba359e49c502a8a62fa791d2a967dda8a8679ee91b699f307e99e1c884d14b`,
database `6f7876ea7b7fc4ebe65bae4ab5a8e20992463570485a355fb09195928e61dcac`.

This closes this bounded current-artifact customer path, not actual delivery or
inbox verification, due-reminder paging/load, outages/stale-tab races, keyboard/
assistive-technology coverage, all browser/time-zone combinations, account export,
complete restored workflows, platform rights/integrations, hosted/operator/legal
or customer-pilot acceptance. No application changes, publication, deployment,
purchases or real personal data. Selected app inventory unchanged; all116Partial.

## October 2 restored-session revocation safeguard

Confirmed and fixed snapshot session resurrection in the isolated restore CLI:
restored sessions expire and administrator step-up approvals clear, without
deleting historical rows. Synthetic revoked-after-backup regression failed before
the fix (2 active restored sessions), then passed with real restored-account HTTP
login/ownership/logout controls. Final rehearsal1test/no skips/37.898sec/exit0;
root136tests/no skips/3.916sec/exit0. Fixtures stopped0/noOOM. Details and remaining
password/token/privacy/queue/hosted recovery gates in
[recovery evidence](DATABASE_RECOVERY.md#restored-session-authority-safeguard).
Manual imports bypass this safeguard; no full recovery acceptance claimed.
App inventory unchanged; root operator changes excluded. All116phasesPartial.
EUR100/month remains planning-only; no spending, publishing or deployment.

## October2 restored application HTTP gate

Expanded encryptedrestore rehearsal1test31.421sec/no skips/exit0 nowstartsactual
pruned6289a808... runtime on restoredDB:2real syntheticlogins/ownedcandidatelists/
crossaccount403/anonymous401/sessionrevocation. No source/dist/dependency mounts,
RPCmocks/publicports/provideractions; cleanstops0/noOOM/ephemeraldata discarded.
CI preparation builds runtime+test and is guarded; remoteCIunverified. Two new
fixtureauthorization tests. Rootoperator changes excluded from unchangedappinventory.
[Exact evidence](DATABASE_RECOVERY.md#expanded-restored-application-checkpoint)
doesnotclosefullrestored workflows, productionvolume/timing, remotebackup/key,
privacy/provider/legal/hostedrelease gates. All116Partial, EUR100planningonly.
Final136rootoperator tests/no skips/2.598sec/exit0; traceability/format/diffcheck pass.

## October2: real local operational recovery checks

Readiness1test6checks28.109sec and hardened encrypted fullschema recovery1test
28.447sec pass/no skips/exit0, incl actualWindowswrapper and sourcepreservation.
133rootoperator checks3.471sec pass. Exact availableimages/no implicit pull,
imageownmigrations/nohostsource and boundednonrootreadonly fixtures; stopped
0/noOOM. Finalafterformatbyte recovery rerun also completed1test/no skips/
28.262sec/exit0 in session78407; no remaining live handle.
[Recovery receipt](DATABASE_RECOVERY.md#october-2-current-local-recovery-checkpoint)
does not establish remotestorage/retention/volume/timing/application-after-restore
or hosted/operator acceptance.116phasesPartial, EUR100planningonly, no realdata/
productionpermissions, deployment, purchases or provideractions.

## October2: exact-runtime connected customer checks

20browser stages passed actualcurrent6289a808... runtime without source mounts:
5search/support,11registration/profile/draft/account/restart,4private defaults.
Real database/localRPC/no responsemocks,0errors/external/confirmed sends; screenshots
vieweddesktop/mobile. Actual coordinated restart kept session/workspace. Testmail
verification was explicitlysyntheticDBsetup, not liveinbox. All fixtures stopped
0/noOOM/dataephemeraldiscarded/logs retained. No appchanges/securityguardloosening,
purchases/provider/publicwrites. Previous goalturn madeverificationprogress.
[Exact receipt](CANDIDATE_QUERY_NODE22_PACKAGING_2026-10-02.md#connected-customer-browser-checks-against-the-exact-runtime)
does not close remaining preparation/external action/response/follow-up/export,
hosted/operator/provider/coverage/legal gates.116phases remainPartial, EUR100/month
planning ceiling unchanged.

## October2: candidate/support package verification

Full source-mounted DB rerun completed724tests/43files/no skips266.92sec/exit0;
fresh exact Node22 packages include current source, with identical compiled
artifact/migration probes. Actual pruned runtime migration/start/readiness/HTTP
and clean shutdown pass in isolation. Separate immutable full DB command passed
724tests/43files/no skips/232.49sec/exit0/noOOM, without source mounts;133operator
checks reran pass/no skips/3.491sec/exit0, traceability/diffcheck pass.
[Exact receipt and remaining gates](CANDIDATE_QUERY_NODE22_PACKAGING_2026-10-02.md)
keeps source-mounted and packaged acceptance distinct. All116original phases
remainPartial, EUR100/month planning-only and no publication/deployment/purchases.

## October2: real candidate search and ordering

Explicit four-sort server/UI path, literal special-character search and one
read-only count/rows snapshot added without owner/policy changes.19focused/type/
build and32focused real MySQL tests pass. Connected5browser stages use actual
sign-in/no RPC mocks with56owned/1foreign synthetic candidates, pagination/sorts/
opt-outs/mobile/language and real local support download. Initial browser assertion
included No details text and was corrected in QA only. Inventory gate correctly
caught omitted new suite; mandatory integration command repaired, not waived.
Full unit/database regression running; final evidence in verification report.
Unit797/80files/no skips/112.46sec and133operator/3.821sec final pass. Broad DBnot
passed: omitted fixture credential, then reused512MiB storage exhausted causing
timeouts. Failed owned resources stopped, fresh bounded1GiB DB/current-source
full command now RUNNING session28927. No product/test deadlines changed.

## October2: usable customer-selected support download

Account data now offers exact JSON review, explicit local download, edit-clears-
approval, reset/tab-discard, no private data/identifiers/metadata/upload.
13focused/type/build/778units79files103.02sec/133operators3.378sec pass.
Four actual browser stages incl parsed real download/mobile pass with read-only
synthetic auth fixtures; no DB/provider proof. Current527files/digestb6232846...
postdates earlier packaged and connected receipts; those do not include this UI.
Full support recipients/automatic collection/hosted/privacy scope remains open.
Canonical receipt in FINAL_VERIFICATION_REPORT.md; no external action or spending.

## October2: current-source connected customer browser

Exact current c73e runtime passed11 connected workflow and4 defaults stages in
explicit production mode, synthetic DB/no RPC mocks, zero errors/external requests/
confirmed sends. Dutch profile canonical/private save and reload, edits preserved
across language switching, review/opt-out/account isolation and actual restart pass.
First restart harness race retained exit1; final readiness-aware run exit0.
All owned resources stopped; tmpfs synthetic data discarded, receipts retained.
Canonical evidence in FINAL_VERIFICATION_REPORT.md. No live inbox/provider/hosted
acceptance, worldwide completion, Git publication, deployment or spending.

## October2: current-source immutable local packaging

Fresh exact Node22 runtime/test images replace old-image relevance for current
code; canonical IDs/evidence in FINAL_VERIFICATION_REPORT.md. Runtime build
type765unit/78files/no skips/86.60sec/compile/prune pass; matching116dist/drizzle
files/6,829,513bytes. Read-only non-root private-failure/health/shutdown probes pass.
Full required synthetic DB suite in progress; test image is not production runtime
and its intended root/writable test layer is not runtime hardening evidence.
Selected inventory unchanged524files/10,409,759bytes,
51073d0f97bfaaa64743cbf640c8875ffe4fcd9e2388393109dec9e5f0d83e8b,
flags false/all116Partial. No registry upload, Git writes, deployment or purchase.
Final712DB/42files/no skips/234.42sec pass for exact test image; production exact
image's default migration/start and HTTP/database readiness/refusal smoke pass on
separate empty synthetic schema. Clean runtime/DB stop0/no OOM; ephemeral fixtures
discarded, images/logs retained. Four customer-table counts per schema zero, not
all-table emptiness. Connected current customer browser, hosted/operator/provider
gates remain open. Root133/no skips/2.81sec pass; no broad completion claim.

## October 2: Dutch platform-discovery controls and explanations

Catalogue interface/load/retry/empty states localized, filters preserved, original
50 records/URLs/permissions unchanged and English-tagged. No coverage expansion,
policy refresh or live access proof. 42 focused/type/build/133 operators pass; final
3 browser stages pass with read-only synthetic RPC/current source-catalogue fixture,
zero errors/POSTs/external requests, stopped 0/no OOM. Detailed canonical evidence:
FINAL_VERIFICATION_REPORT.md. Inventory 524 files/10,409,759 bytes,
51073d0f97bfaaa64743cbf640c8875ffe4fcd9e2388393109dec9e5f0d83e8b,
all flags false/all 116 Partial. Full remaining scope stays open, no external writes.
Final source regression: 765 tests/78 files/no skips/103.59 seconds/exit 0 on
host Node 25. Format/whitespace checks pass; still not production qualification.

## October 2: workspace navigation and truthful safety uncertainty

Dutch header/navigation/summary/safety states implemented; detailed tools stay
English with honest scope and content-language tags. Missing/fetching/failed pause
state is unknown, not Assisted mode; unconfirmed statistics are dashes, not zero.
Explicit status retry never changes operator pause configuration. No send/owner/
import/mutation permission changes. Focused 13 tests/type/build/133 operators pass;
rendered synthetic-read-only RPC QA checks input preservation and uncertainty/
retry states. Exact final records in verification report, not production proof.
523 files/10,397,843 bytes,
Final full unit regression 762 tests/77 files, no skips, 101.91 seconds, terminal 0;
final r3 browser 3 stages passed, stopped 0/no OOM, one expected failure diagnostic,
no unexpected errors/POSTs/external requests. Synthetic fixtures only.
d1b985bae83c192ff4c4b99b91e8c874d425439920bb657ca185c134315aca93,
all acceptance/provenance flags false, all 116 Partial. No external writes.

## October 2: Dutch profile setup and full editor review

All four profile steps have authored Dutch copy with canonical values unchanged.
Language switches preserve open edits and step; review now shows all nine editor
fields, adding industries, target industries and values. 12 focused tests,
type/build, 757 unit tests/76 files (107.04 seconds, no skips) and 133 operators
(3.70 seconds, no skips) pass. Four rendered browser stages pass using current
compiled assets and explicit synthetic auth/profile read fixtures; NOT connected
save/database acceptance. Desktop/mobile screenshots inspected; no POSTs, external
requests or console errors. Details in FINAL_VERIFICATION_REPORT.md.
Inventory 521 files/10,386,913 bytes, digest
6de09438eed1188587ae9e98cc31247560176662edfe27d51f28772ffeafa169;
all provenance/acceptance flags false. All 116 Partial. Workspace/admin/server
translation, connected flows, packaging, worldwide coverage and hosted gates stay
open. No publication, sending or purchases.

## October 2: Dutch verification and password recovery/reset

Authored Dutch account-screen copy, stable mismatch error key, actual content-lang
tags and honest remaining-English disclosure. Duplicate reset-token fragments now
fail closed; language does not alter account/security effect dependencies. 23
focused tests/type/build/133 operators pass; 11 connected rendered browser stages
pass with fresh read-only host assets, no account POSTs or providers. Full current
regression passed 753 tests/75 files, no skips, 109.76 seconds on host Node 25,
recorded in the verification report. This is not database/real-mail/
immutable-image/hosted acceptance. Inventory digest
d5e16696b727293435bb9860261f4b04928705bf0c0056f557e77e8c118f60ed,
520 files, all provenance/acceptance flags false. Remaining onboarding/workspace/
admin/server messages and actual translated account workflows stay in scope.
All 116 Partial; no external write, send or purchase.
See [account-language evidence](FINAL_VERIFICATION_REPORT.md#account-verification-and-recovery-language-october-2).

## October 2: English/Dutch interface foundation

Persistent, versioned English/Dutch choice and authored home/sign-in/registration/
not-found/loading translations added. Visible partial-scope warning, correct
English tags on untranslated journeys/errors, no account/credential storage in
the language setting, no API/provider changes. Eight final browser stages passed
with fresh read-only host-compiled assets; screenshot/console/state checks passed.
This is not immutable-image/database/real-login/provider acceptance. Type/build
and 133 operators pass (2.85 seconds); final full units passed 748 tests/75 files,
no skips, 112.31 seconds on host Node 25, recorded in the verification report.
Selected digest 2b3a8ed26c54856e0226870973446a26e5ea00973f5c8ad302190a35d2cda165,
520 files, all provenance/acceptance flags false. Complete translated journeys,
linguistic/operator review and fresh packaged/hosted evidence remain required.
See [language scope and evidence](FINAL_VERIFICATION_REPORT.md#interface-language-foundation-october-2).
All 116 phases Partial, full goal active, no external write or purchase.

## October 2: Philippines ecosystem discovery and country-specific research

[Eleventh source supplement](PLATFORM_SOURCE_REVIEW.md#eleventh-coverage-supplement-2026-10-02-philippines-and-antler-country-distinctions)
adds QBO/Launchgarage as discovery-only ecosystem routes, with untested access,
unknown policies and stale-event caveats. Current public catalogue is 50 records
(18 dedicated, 16 community, 16 program); no new integration or dedicated matcher.
Antler Vietnam/Indonesia research preserves distinct eligibility without duplicate
records or expanded admission. All 121 focused catalogue/admission checks, type
check and production build pass; 133 operators pass (3.27 seconds). Full current
unit regression passed 740 tests/74 files, no skips, 110.23 seconds on host Node 25.
Fresh packaged database/browser qualification remains required.
Changed source/build inventory: 517 files/10,341,121 bytes, digest
4cd580c9764a957c0a85f3e24a449dc08fd394cd6beefc9dea14584b37c6a4bf,
all provenance/acceptance flags false. Older 08f795-image receipts remain valid only
for their earlier artifact. All 116 phases Partial; no public publication or spend.

## October 2: same startup image passed two connected browser flows

[Current browser receipt](STARTUP_PACKAGED_ACCEPTANCE_2026-10-02.md#same-runtime-fresh-connected-browser-acceptance):
exact runtime 08f795 passed ten customer stages, including real restart/session
persistence and opt-out/revision/history/owner isolation, plus four private-defaults
stages. Desktop/mobile screenshots inspected; no console errors or external requests.
Synthetic verification fixtures, not real email or sending. Both runners, app and
owned temporary database exited 0; only synthetic test records discarded. App
source/artifacts unchanged; 133 operator tests passed (2.45 seconds), 116 Partial.
Remaining customer/admin/export/recovery, hosted/provider/security/operator/release
and worldwide coverage gates remain open. No deployment, publication or purchase.

## October 2: new startup-repair images passed connected local acceptance

[Fresh packaged receipt](STARTUP_PACKAGED_ACCEPTANCE_2026-10-02.md): exact 08f795/
395285 images passed all 712 database tests/42 files (245.97s, no skips), actual
default migration/startup/production HTTP smoke and clean shutdown. Read-only
synthetic secrets/QA mounts only; runtime restrictions inspected. Zero aggregate
customer-data counts in both schemas preceded owned tmpfs shutdown. All 133 operators
passed; app source/inventory unchanged. No deployment, publication, purchase or
phase promotion. New-image customer/browser, hosted/provider and full release
gates remain required. All 116 phases Partial; full worldwide goal remains active.

## October 2: fresh startup-repair Node 22 images

[New packaging receipt](STARTUP_NODE22_PACKAGING_2026-10-02.md): actual locked/
pinned runtime build passed 731 units/74 files (89.94s), type/build/prune; fresh test
image compiled and 116 dist/drizzle files match. Actual pruned app checks passed
invalid configuration, occupied port, health and signal shutdown under network-none
QA bounds. No database/default-migration-startup/browser/provider or hosted
acceptance on these new IDs. Older receipts cannot qualify new artifacts.
All 133 root tests pass; source inventory unchanged, all 116 phases Partial. No external
write/purchase. Next: new-image packaged synthetic database/runtime qualification.

## October 2: controlled startup failure repair

The [startup boundary receipt](STARTUP_FAILURE_BOUNDARY_2026-10-02.md) records
actual listening awaited before server_started/workers and fixed fatal startup
events without raw exceptions. Six targeted helper/fresh-compiled command tests,
signal regression, type/build and133operators passed on hostNode25. Full corrected
regression passed731 tests/74files,no skips,107.85seconds. Earlier image/database/browser receipts do not qualify
this changed source. Fresh immutable Node22 artifacts and the complete release
gates remain required. Full goal116Partial; no external action or phase promotion.

## October 2: new exact-image connected customer browser checkpoint

Ten real Chromium148/Playwright1.62.1 stages passed against the new unchanged
pruned image (runtime ID in the connected receipt below): registration/unverified
gate with explicit synthetic verification, intake/provenance/correction,
draft/review/approval/revision, opt-out/cancellation, logout/account isolation,
login and actual container restart persistence. Separate QA browser container
avoided changing the production image for absent browser OS libraries. No mocked
RPCs, console/page errors, external requests or confirmed sends. Stable desktop
1440x1000/mobile375x812 history captures checked after animations finished.
App/database stopped cleanly; only owned tmpfs synthetic data discarded.
QA report/scripts/images retained outside repo in outputs/owner-browser-20261002-r3.
No production code change, external action or phase promotion. Other customer/
admin/defaults/export/recovery/manual-preparation flows, hosted/provider and
whole-release acceptance remain separately unproved for this exact image.

## October 2: renewed packaged database and runtime acceptance

The [fresh connected receipt](OWNER_SAFETY_PACKAGED_DATABASE_ACCEPTANCE_2026-10-02.md)
qualifies the exact new images for 712 database tests/42 files (255.04s, no skips),
actual startup/production HTTP smoke, inspected isolation/hardening and clean
shutdown. Root operators 133 passed. Temporary synthetic database data was
discarded only after zero aggregate customer-data checks and exact ownership
verification. Earlier packaging-only limitations below describe that checkpoint,
not this later result. Real customer/browser/HTTPS/provider/security and release
approval remain open; all 116 phases remain Partial. No deployment or external
write; EUR100/month remains planning-only.

## October 2: fresh Node 22 packaging after provider/tunnel repairs

The [bounded packaging receipt](OWNER_SAFETY_NODE22_PACKAGING_2026-10-02.md)
records new immutable local runtime/test IDs. The runtime Dockerfile passed type,
all 725 units/72 files, build/prune on Node v22.23.3. Both images' 116 dist/drizzle
files match; the pruned non-root runtime passed 14 read-only mounted tunnel-gate
tests with external networking disabled. The production smoke adds the disabled
notification flag and unauthorized route refusal; syntax/format passed, but no
fresh app/database HTTP acceptance yet. Prior images/receipts are preserved and
their database results are not reused as new-image proof. Probe containers exited
and were removed; no DB, provider, public endpoint, purchase or external write.
Next safe qualification is the packaged synthetic DB/runtime/customer path.
All 116 phases remain Partial and the full goal is incomplete.

## October 2: separately gated owner-notification provider

The [application repair receipt](OWNER_NOTIFICATION_SAFETY_2026-10-02.md) records
disabled-by-default opt-in independent of configured credentials, bounded HTTPS/
no-redirect/abort behavior and content-free logs. Compose/mail-overlay/tunnel
posture keeps this route off. Nineteen new tests include real stalled loopback
transport cleanup. Final full unit suite: 725 tests/72 files; root operators 133;
type check/build passed on local Node v25.2.1. Fresh production Node 22 packaging,
DB/admin/connected acceptance and renewed threat review remain required.
Privacy table digest/three schema hashes match; the changed Compose source hash
was refreshed with its prior value retained. No actual provider/send/deployment/
purchase/GitHub write. No quota, delivery or legal acceptance is claimed.
All 116 phases remain Partial and every full release gate remains in scope.

## October 2: fail-closed hosted tunnel repair

The [new operator procedure and local receipt](HOSTED_TUNNEL.md) preserve dynamic
and fixed HTTPS URLs through a closed holding gate. App forwarding opens only
after exact endpoint binding, actual standalone hosted container posture and
readiness checks. Explicit publication acknowledgement is mandatory; no local
database startup, automatic registration or development fallback. Failure holds
forwarding before stopping the owned agent. Root/CI include the new tunnel suite.
Fourteen local tests passed, including real loopback requests and capacity/
pending-request checks; all 133 root/operator checks passed without skips.
PowerShell parsing/format/diff/retained-source traceability passed. No actual tunnel, hosted
Compose startup, customer migration, provider action, publication or purchase.
The budget is confirmed at EUR 100/month initially (80 planned plus 20 reserve).
Current matrix remains 116 Partial/zero Missing/zero Implemented. Renew source
qualification and real provider/TLS/browser/operations acceptance before release.
The previous threat model is a dated assessment, not closure of those gates.

## October 2: whole-product security architecture

The security threat-model skill required a fresh-context architecture review.
A source-backed whole-product assessment now covers 16 distinct resource/startup
boundaries and 16 prioritized threat hypotheses, with 226 checked citations in
62 cited source files. It is retained in managed security storage rather than
copied into the repository. Document SHA-256: `cb4e0da95484bda849adbaf76b7ca15c45cd91db31b596fef1ee7c41023f0cec`.
Source snapshot: `8fb012a581bea977b5eadd60ac31f415e3d442319eb860dd6ebecbca885b90df`.
No vulnerability scan, exploit validation, live data/provider inspection or
launch approval is claimed. The tunnel's publication-before-reconfiguration path,
same application/migration DB reference and conditional provider/copy boundaries
remain explicit. Current README/security quota descriptions were corrected against
actual consumers; no application or launch setting changed. Phase 064 Partial;
116 Partial/zero Missing/zero Implemented, with every phase still needing acceptance.

## October 2: source-bound privacy impact preparation

Added an unapproved [privacy impact assessment draft](PRIVACY_IMPACT_ASSESSMENT_DRAFT.md)
and [schema inventory](PRIVACY_SCHEMA_INVENTORY_2026-10-02.json): 43 tables/505 fields
cross-checked against export metadata and the deletion manifest, with four source
hashes and a repeatable canonical digest. No live records or nested payload contents
were inspected. An independent reader check clarified unresolved gates, actual
registration defaults versus deployed enforcement, and accountable roles; it is
not legal approval. Phase 065 is now Partial: 115 Partial/one Missing/zero Implemented.
Controller, legal-basis, rights, provider, retention/restoration and residual-risk
acceptance remain unresolved. No runtime setting, publication or purchase changed.

## October 2: packaged licensing and third-party evidence

Inspected 546 production package/version roots in the actual qualified runtime,
hashing manifests and 538 conventional root notice files. Missing metadata for
khroma is distinguished from its verified MIT text; fourteen missing-root-notice
flags include victory-vendor's separately located nested licences. A source-bound
service map records unapproved providers without enabling them. See
[evidence, machine inventory and exclusions](THIRD_PARTY_RELEASE_REVIEW_2026-10-02.md).
Phase 067 is now Partial, not approved: 114 Partial/two Missing/zero Implemented.
Repository licence intent, imported rights, complete notices/OS/bundled review
and provider terms remain open. No code/image/provider/publication change occurred.

## October 2: fresh packaged regression qualification

The current runtime/test images were built from the frozen lockfile and pinned
base, rather than current source mounted into old images. Runtime build passed
706 unit tests; the corrected complete packaged database command passed 712 tests
across 42 files, no skips. An initial runner root-password mismatch failed and is
not counted as acceptance. Pruned-runtime smoke, migration 0038, unauthenticated
preset protection, restrictions and clean shutdown passed. All 116 packaged
dist/migration files matched between images; checked fixture data was zero and
both owned databases are stopped. See [exact qualification and limits](LOCAL_PACKAGED_REGRESSION_2026-10-02.md).
No image publication, hosted CI, live acceptance or external write occurred.
Final release provenance and all public launch gates remain open.

## October 2: current full local regression

All 706 application unit tests (71 files), 712 database tests (42 files) and 119
root operator tests passed without skips. Type check and production build passed;
readiness (one test/six cases) and isolated encrypted full-schema recovery (one
test) also passed. Seven checked customer-data tables were empty; owned synthetic
database/readiness/recovery fixtures are stopped. These full suites supersede
the narrower current-source limitations of the earlier dated increments below.
See [exact environment, identity, results and limits](LOCAL_FULL_REGRESSION_2026-10-02.md).
No fresh immutable image, hosted CI, live provider/customer acceptance or external
write is claimed. Full scope remains incomplete; the €100/month ceiling is
planning-only, not purchase approval.

## October 2: local release inventory increment

Read-only `release:inventory` identifies selected source/build inputs and local
dist files using SHA-256, separately declared versions and checkout identity.
Incomplete required artifacts, symlinks, invalid identity/version and unsafe
arguments fail. It does not build or attest causal provenance, tests, signatures,
registry or hosting. See [inventory scope](RELEASE_INVENTORY.md) and
[unreleased changes](../CHANGELOG.md). Eight focused inventory tests and all 119
root operator tests passed; CI is configured but not executed here. Phase 112 is
Partial; 113 Partial/three Missing/zero Implemented is still incomplete. No
publication, tag, commit, merge, deployment, provider mutation or purchase occurred.

## October 2: Sri Lanka and Nepal catalogue increment

Direct official-page review supports discovery-only InstaLanka and Founders Nepal.
The customer catalogue is now 48 records: 18 dedicated, 16 community and 14 program.
BuildGara/Startup SL remain unpublished leads; no matching, membership, data rights
or provider permission is inferred. See the [research and limits](PLATFORM_SOUTH_ASIA_REVIEW_2026-10-02.md).
Sixty-two catalogue/regional-admission tests passed after count/category assertions
were updated; an initial old category-count assertion failed and was not counted
as success. Type check, production build and source-bound requirements validation
passed. No connected UI/provider acceptance, account,
form submission, commit, publication or purchase occurred. Worldwide scope remains open.

## October 2: runtime diagnostic privacy repair

Doctor now returns fixed descriptions rather than raw configuration/database
exceptions or configured public addresses. Its command validates flags before
loading secret consumers, delays database initialization until valid configuration,
and attempts cleanup on failure. `runtimeChecksPassed` distinguishes a true check
pass from warnings accepted by `--allow-missing-runtime`; production acceptance
is always unproven. See [diagnostic boundaries](SUPPORT_BUNDLE.md#runtime-diagnostic-command).
Thirteen targeted service/real-command tests passed. The earlier complete unit
suite receipt predates this repair. No provider action or deployment occurred.

## October 2: cookie transport boundary repair

The session-cookie helper now uses Express's resolved protocol instead of
independently trusting raw forwarding headers. Four new real-socket cases failed
before the fix. Thirteen new tests cover disabled/single-hop proxy trust, absent,
invalid and mixed protocol headers, actual Set-Cookie flags and a direct-HTTPS
request-object check. Focused session/context/login verification passed 31 tests.
Full current application unit verification passed 686/686 tests across 69 files,
no skips, in 99.07 seconds. All 111 root operator tests, type check, production
build, formatting and source-bound requirements validation passed as well.

The backend guidance skill and official Express proxy documentation informed
this boundary. Local HTTP remains supported; this is not automatic HTTPS
enforcement or actual TLS/proxy/browser acceptance. Production ingress checks
are explicit in the production runbook. The previous retained threat model is a
dated snapshot: its raw-header cookie observation is superseded by this repair,
not all remaining threats resolved. No phase is promoted to complete. No commit,
publication, deployment, provider action or purchase occurred.

## October 2: local diagnostic bundle increment

A working owner-confirmed local support bundle accepts only bounded enumerated
observations and optional response UUIDs. It rejects logs, addresses, credentials,
raw errors and extra fields rather than attempting broad redaction. It collects
no database/application/provider state and never uploads output. See
[the exact format and sharing limits](SUPPORT_BUNDLE.md). Authenticated customer
UX, verified ownership, approved recipients/retention and real incident acceptance
remain open; phase 101 is Partial, not completed support infrastructure.

Current local verification: all 111 root operator tests passed, including 17
support tests and inventory checks requiring the support gate in root tests and
unconditional CI. The real CLI help path works through the root package command.
The source-bound traceability check still passes all 116 titles and 12 named
artifacts, reports 112 Partial/four Missing and explicitly does not prove completion.

The server-owned audit-context repair also passed the full application unit
suite: 673/673 tests, 68 files, no skips, 94.25 seconds. This is current source
unit evidence, not a fresh immutable container, full database rerun, provider
receipt or hosted acceptance. No external write or purchase occurred.

Approved direction: public SaaS, free public beta, worldwide availability, broad
assisted platform coverage. This document tracks the entire accepted scope. A
completed phase does not establish production readiness for the whole product.

Operating budget: EUR 100/month initially, confirmed by Robert.
This is a planning ceiling, not purchase authority. Hosting/database/email and
optional AI/API costs must all fit within it, with enforced application quotas.
Do not assume paid platform memberships or commercial API access fit this budget.

Budget design: keep recurring commitments at or below EUR 80/month and reserve
EUR 20 for tax/exchange-rate changes, overages and recovery. AI is optional and
off until a durable usage ceiling is implemented. No mandatory paid platform
subscription may be hidden outside this ceiling. Provider selection must use
current tax-inclusive quotes; this allocation is not a vendor price estimate.

## Current checkpoint (2026-10-02)

### Private reusable templates and candidate defaults

- Phase 024 now has a working owner-scoped path, not merely a legacy campaign
  template column. Migration 0038 adds one revisioned JSON settings document per
  owner. Up to 20 human-original templates, unique names, optional preferred
  template and search/view defaults; bounds are 80 name characters, 10000 body
  characters, 100 search characters and 80000 aggregate UTF-8 bytes. Source
  declaration/consent/approval/send state are not preset fields.
- Read/save uses the live verified owner, current credential and deletion fence
  under SHARE/UPDATE locks. Competing revisions fail without overwriting; an
  exact immediate lost-response retry returns the existing next revision without
  another receipt. Stored corruption fails closed. Settings and metadata-only
  receipt commit together through the existing shared workspace audit capacity;
  exhaustion rolls back both while reads/exact retries remain available.
- My defaults is reachable in the supported console. Stage add/edit/remove,
  choose preferences and explicitly review/save. Pending editor text is not
  silently staged. Search defaults apply only on click. Composer insertion fills
  only empty text, never overwrites it, and clears the message declaration; it
  does not save, approve, generate, grant permission or send. Account/read failures
  pause saving, save errors retain edits, and explicit successful reload discards
  pending settings only after confirmation, even when the revision is unchanged.
  Focus/reconnect do not automatically reload the preset editor.
- Export allowlist and independent deletion ownership/foreign-key manifest now
  explicitly review the new four fields and account reference: **43 application
  tables / 38 owned categories / five shared**. Updated the unapproved retention
  classification without approving policy or activating erasure. Clearing a saved
  template does not establish removal from browser copies, exports or backups.
  Existing legacy templates, messages and other user data remain untouched.
- Added **12 unit/initial-render checks** and **14 MySQL acceptance checks**;
  the integration inventory first caught omission from the release command and is
  now wired. Initial focused database run found outdated export/deletion counts
  (42 and 37); replaced them with explicit new-category assertions, not loose
  coverage. A full run started before final capacity code settled failed its new
  capacity check (711 passed / one failed); it is not a success receipt.
- Fresh focused presets/export/preflight/capacity **68/68**, zero skips,
  **40.44 seconds**. Fresh complete database acceptance **712/712 / 42 files**,
  zero skips, **267.21 seconds**. Application unit checkpoint **668/668 / 68
  files**, **106.71 seconds**; post-reload-fix focused units/inventory **14/14**.
  Root operator checks **94/94**, **3.93 seconds**. Type checking passed; final
  Vite build **4.48 seconds**, backend **632.0 kB**. Formatting and diff checks pass.
- Connected real sign-in/server/MySQL browser rehearsal passed four journeys in
  **Chromium 148.0.7778.0**, desktop **1365×1000** and mobile **375×812**. Confirmed
  stage versus persistence, reload, explicit filters, empty-only insertion, no
  implicit draft/approval, review reset on edits, pending/saved removal and
  confirmed same-revision reload. Page identity, meaningful content, no framework
  overlay, screenshots and no mobile horizontal overflow checked; screenshots
  visually inspected. **Zero console errors / zero external requests**. First
  browser attempt exposed a missing semantic heading; added a real accessible
  heading and repeated successfully. Browser plugin unavailable; the frontend
  testing skill selected existing Playwright. Harness/screenshots stay outside
  the repository. No actual provider, inbox or customer data was involved.
- Tests use the already installed images with current read-only source/build
  overlays, not a fresh immutable release artifact or hosted CI run. Migration
  applied only to the owned synthetic tmpfs database. Final aggregate checks:
  zero users/audits/sessions/mail jobs/candidates/outreach/presets. Browser/server
  drained cleanly and removed only their owned fixture; test database stopped,
  discarding disposable tmpfs data and leaving its stopped container inspectable.
  No existing customer/local data was removed or migrated.
- README, API/UI/critical-path/security documents, worklog and final-report
  limitations reflect actual behavior. Backend/React skills guided owner locking,
  durable admission and explicit event-driven controls. Matrix is now **111
  Partial / five Missing / zero Implemented**; phase 024 is Partial, not a whole
  release completion claim. HEAD remains
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, no staged changes. No commit, push,
  merge, deployment, publication, purchase, permission change or provider action.
  Further full-scope product work and controller/retention/hosting/budget/worldwide
  customer acceptance remain; safe local work can continue independently.

### Original specification traceability and completion-claim correction

- The supplied original PDF is no longer at its supplied path. The retained text
  has 124 nonempty page segments and 116 distinct numbered phases (000–115).
  Directly parsed phase headings, required-behavior blocks and final-report
  requirements; this is retained-text provenance, not verification of the original
  PDF bytes. Exact text and phase-title digests are recorded in
  `GOAL_COMPLETION_MATRIX.md`.
- Replaced incorrect phase-number groupings and broad Verified labels with all
  116 exact original titles, evidence entry points and individual remaining
  acceptance criteria. Current assessment: **110 Partial / 6 Missing / 0
  Implemented**. Missing: reusable user presets (024), current whole-product threat
  model (064), privacy impact assessment (065), licensing/third-party service
  review (067), safe support/debug bundle (101), release/changelog discipline (112).
  Evidence links identify files to inspect, not completion receipts. No phase was
  completed merely by writing this audit.
- Added a dependency-free integrity checker and **14 regression tests** for exact
  phase IDs/titles, allowed statuses, remaining acceptance, safe existing evidence
  paths, all 12 source-named documentation artifacts, preserved additional user
  scope and sanitized command errors. It always reports `completionProven: false`:
  structural integrity does not establish semantic implementation or acceptance.
  Optional source comparison checks the exact retained-text digest.
- Root test and CI now include requirements integrity; inventory tests initially
  reproduced three failures / four passes before wiring. Actual execution exposed
  a nonexistent standalone LICENSE reference and a forwarded package-command
  separator. Corrected the licensing claim without inventing legal terms and
  added separator regression coverage. The package command successfully compared
  the retained source digest.
- Final Windows operator suites: **94/94**, zero skips, **3.04 seconds**. The actual
  root test chain passed its earlier 92-test operator checkpoint and **656
  application unit tests / 67 files**, **93.71 seconds**. Final read-only,
  network-disabled Linux/Node 22 traceability and release inventory: **21/21**,
  zero skips, **2.17 seconds**. Application source/schema unchanged; type/build,
  database, browser and fresh immutable-artifact qualification were not rerun.
- README now explains traceability and missing standalone licensing. Final report
  preserves historical evidence below current limitations and accounts for all
  30 required report fields. Checkpoints, worklog, acceptance references and task
  dependencies correct stale branch/resume and completion wording. Current local
  branch is `agent/public-saas-beta`, HEAD
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; cached origin/HEAD points to
  origin/main. Remote branch/protection/PR state was not refreshed. No commit,
  push, merge, publication, deployment, provider action or purchase occurred.
- Next safe implementation target: owner-scoped reusable presets (024), followed
  by other explicitly unfinished product paths such as Dutch/English support.
  Independent controller, retention, provider, hosting and customer acceptance
  gates remain open but do not prevent safe local implementation. The full goal
  remains incomplete.

### Authenticated TCP database readiness in CI and local startup

- Previous turn closed the shared HAI admission gap with complete application
  unit/database acceptance. Deployment-path inspection found CI used a root socket
  ping and local Compose used two socket pings with a five-second delay. MySQL
  documents successful ping exit even when authentication is denied, and the
  official image initializer runs with networking disabled. These checks did not
  prove application-user TCP authentication or access to the intended schema.
- CI and local Compose now require application-user TCP SELECT 1 against their
  intended database, with no option-file defaults and a two-second connect bound.
  Integration Compose retains that authenticated TCP boundary and gains the same
  explicit bounds. Local startup no longer relies on a sleep heuristic. Existing
  volumes, ports, credentials, schema, app health/readiness and production external
  database configuration remain unchanged; this does not grant new privileges.
- Added `test:readiness:integration` and made it mandatory in root `test:all` and
  CI verify. Release inventory also requires every root integration fixture exactly
  once in both paths. Baseline contract reproduced **two failures / four passes**
  for the missing rehearsal and ping health command. Final contract **7/7** on
  Windows and network-disabled read-only Linux/Node 22 (**0.17 seconds**). Combined
  operator suites **80/80**, zero skips, **3.01 seconds**.
- New real-MySQL rehearsal reads the actual CI command and read-only Compose health
  models. It uses only an already available MySQL image ID with pulling disabled,
  network-disabled, unpublished, 1 GiB-memory/2-CPU tmpfs fixtures. Checks valid
  CI/local/integration credentials, rejected credentials, missing schema, legacy
  ping's authentication false positive, socket-only rejection and the old delayed-
  ping false positive. Socket-only fixture models the initializer's networking
  property, not its exact transient timing. No hosted bridge/port/TLS path, migration/
  write privilege or production database is qualified by this rehearsal.
- Rehearsal passed directly (**29.21 seconds**) and through the actual package
  command (**28.09 seconds**). Final package-command rerun after explicit no-pull
  enforcement passed all six checks (**26.82 seconds**), zero skips. Only owned
  fixture IDs were stopped after label/network/tmpfs verification; all exited zero.
  Synthetic tmpfs data is discarded, stopped containers remain inspectable, and
  temporary empty configuration files are removed. No existing data was erased.
  Formatting and diff whitespace checks pass. MySQL fixture image was the local
  `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`;
  Linux source-contract runtime independently reported Node **22.23.3**.
- Deployment-patterns skill guided meaningful dependency readiness and separation
  from liveness. README/scripts, local operator and production runbooks explain
  the distinction and data-preserving troubleshooting. Application source/UI/DDL
  unchanged; prior **656 units / 698 database checks** remain dated evidence, not
  rerun in this turn. No deployment, image publication, hosted workflow dispatch,
  commit, push, merge, purchase, provider or existing-database mutation. Whole-goal
  production/controller/retention/budget/worldwide/customer gates remain open.

### Shared authenticated HAI feed admission

- Local HAI source counters reset on restart and were separate across replicas.
  Added a fifth fixed policy to the existing transactional admission primitive:
  60/source, 60/configured owner, 120/service per fixed 60-second database-clock
  window. Bearer validation remains first; admitted attempts commit before owner/
  event reads and are not refunded for subsequent account refusal or read failure.
  The early process-local guard and current-owner share-lock boundary remain.
- Reuses migration 0035's counter table without new DDL. Purpose-separated HMAC
  keys store neither raw source/owner identity nor connector bearer. All families
  retain the same first stable login-service mutex and independent ceilings;
  bounded expiry cleanup now also excludes the stable HAI service row. Identity
  digests change with signing-secret rotation, but the service budget survives.
  Connector-token rotation does not affect admission identity or service budget.
- Shared refusal returns sanitized 429 `rate_limited`, conservative Retry-After: 60,
  private/no-store, and no owner/event read. Admission failure returns sanitized
  503 `database_unavailable`. No error, private event or credential is echoed.
  Replicas require the same database/signing secret. These are pseudonymous
  security counters, not invoice-enforced spending or an approved retention policy.
- Added wrapper/HTTP-boundary units and isolated MySQL tests for owner/source limits,
  equivalent addresses, concurrent final slots, rollback, database-clock expiry,
  independent authentication families, stable cleanup rows, rotation, malformed
  counters, unavailable storage/secret, fresh-process persistence and compiled HTTP
  restart with forged proxy headers. Added account-boundary checks for shared HTTP
  refusal after local guard reset and charged attempts for ineligible owners.
  Integration manifest includes the new named suite; inventory and local CI command
  contract checks pass. README, OpenAPI, operator and draft retention documentation
  now distinguish these layers.
- Verification: focused unit/inventory checks **12/12**, complete native unit suite
  **656/67 files**, **97.93 seconds**; type checking and production build pass
  (Vite **4.41 seconds**, backend **625.4 kB**). Initial full MySQL run exposed one
  compiled-test fixture error: an empty mounted-secret variable conflicted with
  its direct synthetic token, correctly rejected by startup. Removed the variable
  from the child fixture rather than weakening runtime validation. Focused final
  HAI database checks **21/21**, **9.83 seconds**; clean complete MySQL rerun
  **698/41 files**, zero skips, **256.50 seconds**, exit zero. Compiled HTTP restart
  and forged-header check passed within that full rerun. Release command contract
  **5/5**; formatting and diff whitespace checks pass. No browser UI changed or
  receiver/inbox/live provider contacted; native browser acceptance was not rerun.
- Final isolated database check found zero users, audit events, sessions, mail
  jobs, prospects and outreach records. Stopped the owned tmpfs test database;
  unrelated services and user work remain untouched. No real data was erased.
- Backend-patterns skill guided shared-store admission and fail-closed boundaries.
  No dependency, schema, frontend, remote account/provider, hosted CI, publication,
  purchase, commit, push, merge or deployment action. Existing source/dist mounted
  test images are local evidence, not fresh immutable release qualification. Full
  production/customer/provider, controller/retention/support and budget gates remain.

### Operator safeguard coverage in local and CI release commands

- Previous turn closed a verified HAI current-owner privacy gap. Pipeline source
  review found budget tests absent from CI and production-configuration tests absent
  from ordinary root `test` (and consequently its `test:all` chain). Added explicit
  budget/release-contract CI steps and all five operator suites to root `test`.
  Database and isolated recovery acceptance remain mandatory later `test:all` stages.
- Added a dependency-free inventory regression comparing all non-integration root
  test files with reviewed commands; each must run exactly once locally and in the
  verify job. Checks existing scalar-run workflow convention, rejects conditional/
  failure-ignored required steps/jobs and verifies application checks/migrations/
  integration command wiring. Mutation fixture demonstrates commented/conditional/
  ignored steps and other jobs cannot masquerade as required active verify steps.
  This is not a general YAML validator, branch-protection audit or hosted CI proof.
- Baseline **three failures / two passes** reproduced local production-config
  omission, missing contract command and missing budget CI step. Final contract
  tests **5/5** on Windows and network-disabled read-only Linux/Node 22 existing
  image (**0.16 seconds**). Combined operator suites **78/78**, zero skips,
  **3.55 seconds**. Actual root package `test` chain completed with exit zero:
  all five operator suites, then **648 application units / 66 files**, **94.66 seconds**.
- README command table and CI section now describe the real test path and added
  Docker Compose prerequisite for read-only synthetic configuration checks.
  Application-only unit command remains available without those operator checks.
  No application runtime/database/schema/UI changed; type/build/database/browser/
  immutable image qualification was not rerun. Prior database evidence is dated.
  Formatting and diff whitespace checks pass; disposable test DB remains exited.
- GitHub-operations skill guided local workflow inspection and separation of
  source checks from hosted outcomes. No GitHub API mutation, workflow dispatch,
  push, merge, publication, purchase or real-provider/account action. No YAML/browser
  dependency added. Full goal remains active with retention/controller/support,
  hosted operations, actual spending enforcement, worldwide/live-provider and
  customer/inbox acceptance still unproven.

### HAI feed current-owner eligibility and suspension boundary

- Previous turn made verified budget-declaration progress. Retained-route review
  found the HAI feed correctly filtered the configured owner's audit events but
  never checked current account existence, verification or deletion suspension.
  Valid connector tokens therefore still returned 200 for unverified/fenced owners.
  This is a bounded finding, not a completed review of all legacy credentials/jobs.
- Feed now takes the same first owner's SHARE lock used to coordinate supported
  account restriction transactions, in READ COMMITTED, before reading events.
  Missing, unverified or deletion-fenced owner returns 403 with a fixed
  `hai_account_unavailable` body and no feed items. Database/query failures return
  sanitized 503; handler responses are private/no-store. Event queries select only
  feed-required columns and remain bound to the configured user and 100-item page.
- No new schema, connector credentials, provider access, routing capability or
  content-sharing permission introduced. Existing disabled/bearer/per-IP guard,
  event cursor, supported event filter and opt-in content setting are preserved.
  Per-IP traffic counters are still process-local, not a shared billing/abuse quota.
  Already authorized in-flight responses/ingested receiver copies cannot be recalled;
  this does not erase data or fence unsupported legacy/provider automation.
- New real-HTTP-handler/MySQL suite baseline: **5 failures / 2 passes**. Reproduced
  200 for unverified, fenced and absent owner; no SHARE lock observed in held-owner
  race; storage error was handled only by the outer fixture fallback. After fix,
  **7/7** passed, **1.65 seconds**, including two-customer private-content exclusion,
  live verification/suspension denial, missing account, observed lock wait followed
  by committed suspension, storage failure and wrong bearer before DB access.
  Added suite once to the mandatory database command; inventory regression passes.
- Existing HAI traffic and database-suite inventory units passed **4/4**.
  Type checks/build passed (Vite **4.85 seconds**, backend **624.2 kB**).
  Full native units passed **648 tests / 66 files**, **105.26 seconds**, exit zero.
  Full MySQL suite passed **684 tests / 40 files**, zero skips, **261.38 seconds**,
  exit zero, required-database mode. Current source/dist/schema/client overlays
  used the existing locked dependency image; not new immutable-image qualification.
  Final fixture inspection found users/audits/sessions/mail jobs/prospects/outreach
  all zero. Disposable test DB then stopped; exited state confirmed. Its tmpfs-only
  database is not real customer data or persistent deployment evidence.
- README, OpenAPI 403 contract, HAI operator and deletion-processing runbooks
  document the boundary and in-flight/receiver-copy limits. Backend-patterns skill
  guided live authorization, transaction boundaries, selected columns and content-free
  errors. Diff-review skill inspected but inapplicable to this targeted runtime review;
  no delegation triggered. No browser surface changed or live HAI receiver contacted.
- Local fixtures only; no real account/provider action, sending, purchase, deployment,
  publication, commit, push or merge. Full goal remains active: controller/support,
  approved retention/erasure, hosted operations, complete budget/traffic controls,
  worldwide provider access and real customer/inbox/receiver acceptance remain open.

### Read-only operating-budget declaration assessment

- Previous turn made verified Pakistan/Bangladesh coverage progress. Current
  monitoring review confirmed health/readiness probes do not assess spending.
  Added a real local budget-plan CLI and operator procedure, not billing integration
  or automatic provider enforcement. Keeps the accepted EUR 100 ceiling intact:
  EUR 80 operating allocation and EUR 20 reserve are fixed, not plan-overridable.
- Requires all eight cost categories (hosting, database, email, optional AI/API,
  storage/backup, traffic, domain, monitoring). Unknown values remain unknown,
  not zero. Required services cannot pass as disabled; only optional AI may.
  Capped declarations need integer EUR cents, tax status, dated review and local
  evidence reference. At 30 UTC days the review is due. Future/invalid dates and
  unresolved tax/cap evidence prevent a passing assessment.
- Bundled costs count once, supporting included-in chains but rejecting cycles
  and unknown/disabled underlying services. Complete totals above EUR 80 fail
  without consuming the reserve. Exact schema rejects unknown/duplicate categories,
  extra fields, fractional/negative money and non-EUR currency. Input read is
  bounded to 32 KiB + one byte; non-regular/oversized/unreadable/malformed inputs
  yield a content-free exit-2 failure. No evidence text, paths or parser errors
  appear in CLI output. No network calls, database or file writes in the tool.
- The included example is intentionally unconfigured. Actual command returns
  exit 1, `incomplete`, total null, seven unresolved categories and
  `providerEnforcementVerified: false`. This is truthful missing-evidence reporting,
  not a fabricated current quote or claim of enforced spending. Documented annual
  charge/renewal, overage, tax and FX pitfalls without inventing provider prices.
- Baseline test import failed because tool did not exist. Windows budget tests
  **13/13** and combined budget/monitor/recovery/production-config regressions
  **73/73**, zero skips, **2.51 seconds** after formatting. Package `test:budget`
  command passed; added it to ordinary root `test` and exposed `budget:check`.
  Linux existing dependency image, Node **22.23.3**, network none/read-only/caps
  dropped/tmpfs-only test fixtures: **13/13**, **0.62 seconds**, zero skips.
  Disposable runner exited and was removed. No provider/DB credentials mounted.
- README, runtime-monitoring guide and dedicated operating-budget procedure
  distinguish declaration assessment from live enforcement. Updated the undated
  platform inventory summary to current 47 reviewed/46 public including Bani and
  BD SaaS Zone; historical checkpoints remain unchanged. Application/source-policy
  code was not changed; application unit/build/database/browser acceptance not
  rerun for this operator-only change. Prior evidence is dated, not presented as new.
- Cost-tracking skill was inspected but does not apply: it measures Claude session
  usage, not service hosting/mail invoices. No unrelated usage log was accessed.
  No purchases, accounts, real provider changes, messages, deployment/publication,
  commits, pushes or merges. Controller/support identity, retention approval,
  hosted operations, true billing safeguards, worldwide/live acceptance remain
  open; full goal stays active.

### Pakistan early-access and Bangladesh co-founder board discovery

- Previous turn made verified catalogue-maintenance progress. Reviewed worldwide
  coverage work queue and added two explicitly scoped South Asian community
  discovery routes, not connected integrations. Public inventory now **46**:
  17 dedicated, 15 community/channel, 14 program/ecosystem; internal register
  **47** including held F6S, plus four previously registered unpublished leads.
  The twenty October additions remain discovery-only. Worldwide completeness
  and current provider/customer acceptance remain unproven.
- Bani official homepage/terms/privacy describe an early-access Pakistan community,
  coming-soon directory and submission-data handling. No live matching, member
  contact, eligibility or price entitlement is inferred. BD SaaS Zone official
  seeking-cofounders page and homepage support Bangladesh directory discovery;
  promotion is not membership/contact pricing. Login reader returned Loading;
  authenticated browser functionality, terms/privacy/data rights remain unresolved.
- English plus Urdu/Bangla queries were used, following observed primary links.
  No forms/accounts/payments or profile-detail pagination. Incidental member
  snippets were not imported as candidates or identity/consent evidence.
  Unreadable, timed-out, global-brand duplicate and unrelated search results were
  not promoted. Source ledger records adverse observations and discovery limits.
- New catalogue test failed before implementation (Pakistan record absent).
  First post-edit focused run found three unchanged inventory assertions; corrected
  all total/category expectations to the actual new count. Final focused verification
  **104 cases / four files**, 3.78 seconds, including six new name/host/subpath/www
  variants. CSV/intake/original-human outreach remain refused, including manual-label
  bypasses. No workflow admission or customer-data mutation was changed.
- Type checks and production build passed (Vite **4.38 seconds**, backend **623.3 kB**).
  Full native units passed **648 tests / 66 files**, **92.43 seconds**, exit zero.
- Browser component acceptance passed on loopback `/catalogue-check` using existing
  Playwright **1.62.1**, installed Chrome **154.0.8037.59**, actual component/catalogue
  and production CSS; no API/auth/database mocks imply connected acceptance.
  Desktop 1440x1000 / mobile 375x812: page identity/nonblank content, country search,
  category filtering/empty state, keyboard focus, evidence destinations, visible
  costs/access/rights caveats and no action controls. No console/page errors,
  framework overlay, horizontal overflow or external requests. Screenshots inspected.
  Outside-repo outputs: `outputs/south-asia-catalogue-ui-20261002.cjs` and dated
  desktop/mobile PNGs. Browser plugin unavailable, so existing Playwright was used
  without installing dependencies. No database suite or immutable image rerun.
- Market-research skill guided direct-source/adverse-evidence separation;
  frontend-testing skill guided rendered checks. README/gap map updated and old
  source supplement explicitly marked historical. Test DB remains stopped.
  No sending, purchases, publication, commits, pushes or merges. EUR 100 planning
  ceiling unchanged. Full goal remains active with deployment, retention approval,
  controller/support identity, complete budget enforcement and live acceptance open.

### Visible catalogue review age and maintenance procedure

- Previous turn made verified Japan/Taiwan coverage progress. Added visible
  per-card public-page review dates/age and a 30-day UTC editorial reminder.
  Invalid/impossible/future dates display an explicit checking notice instead
  of a certified age. Reference date comes from the device clock on render;
  no background source monitoring or provider availability claim is introduced.
- Pure shared date logic rejects rollover dates and non-calendar timestamps;
  tests cover same-day, 29/30-day boundary, leap day, year boundary, invalid/future
  dates and rendering. Reminder state is derived, not separately synchronized.
  No source admission, permissions, pricing facts or review dates were changed;
  overdue entries remain searchable. Public count stays 44, internal register 45.
- Source-review runbook now describes substantive re-review, failed-observation
  preservation, held/retired ledger records and independent fail-closed admission
  review. Existing implementation has no publication flag or maintainer UI:
  publication holds require reviewed source-array/ledger edits. No customer data
  is removed. README explains the reminder and links the procedure.
- All 13 new tests failed at baseline (helper/reminders absent), then passed.
  Focused catalogue/date/source-admission verification: **97 cases / four files**,
  3.95 seconds. Full native units: **641 / 66 files**, **96.61 seconds**, exit zero.
  Type checks and production build passed (Vite 5.50 seconds; backend 620.9 kB).
- Isolated actual-component browser check passed using installed Chrome
  **154.0.8037.59**, Playwright and compiled production CSS on loopback
  `/catalogue-check`; desktop 1440x1000 and mobile 375x812. Synthetic UTC date
  2026-10-05 exercises the 30-day boundary; synthetic invalid date never modifies
  repository records. Checked dated reminders outside evidence, evidence links,
  Japanese search/category/empty state, keyboard focus and mobile overflow.
  Screenshots were inspected; no console/page errors, overlays or external calls.
  Outputs: `outputs/catalogue-freshness-ui-20261002.cjs` and dated desktop/mobile
  PNGs outside the repository. This is component acceptance, not connected account,
  database or provider acceptance. Database suite/image qualification not rerun.
- React skill guided derived presentation state; frontend-testing skill guided
  rendered interaction checks. Browser plugin unavailable, so existing Playwright
  and installed Chrome were used without adding dependencies. No provider actions,
  accounts, messages, purchases, publication, commits, pushes or merges. Full goal
  remains active; controller/support, retention approval, hosted deployment,
  complete EUR 100 ceiling, world coverage and real inbox/customer gates remain.

### Japan lead resolution and Taiwan partner discovery

- Previous turn made verified verification-screen progress. Current regional
  official-source work promoted CoPath from an unpublished Japan lead and added
  Taiwan's EZStartup / 簡單創 as a community/partner portal, not a dedicated matcher.
  Public inventory: **44** (17 dedicated, 13 community/channel, 14 program/
  ecosystem). Internal reviewed register: **45** including held F6S, plus four
  unresolved unpublished leads. Worldwide completeness is still unproven.
- CoPath root/www reads still failed; observed blog/signup links led to readable
  terms/privacy/pricing/trade disclosure. Contradictory all-free versus paid/limited
  wording is explicit, not resolved in favor of free access. Signup was read only,
  not submitted. Profile reuse/scraping and spam restrictions are preserved.
- Taiwan primary homepage/about/privacy/personal-information pages support broader
  partner discovery but not confirmed member/contact access or founder-specific
  processing/pricing. Public member snippets and headline counts were not copied,
  profile/detail links not opened and directory pagination not performed.
- English and Japanese/Traditional Chinese queries improved local-language source
  discovery. Hong Kong HKFoundr direct fetch returned a tool Payment Required error
  and www failed: neither is evidence of user pricing or service closure. No
  App Store regional listing or historical FINDIT reference was promoted as proven
  current local matching access. Source ledger preserves all these boundaries.
- New record test failed before implementation (CoPath absent). Final focused
  catalogue/source/admission suite passed **84 cases / three files**, 3.45 seconds.
  Added eight name/local-script/host/www/subpath variants, all still rejected by
  CSV, intake and human-authored outreach, including manual-label bypasses.
  Rendering assertions verify both records, restrictions and policy evidence links.
- Type checks and production build passed (Vite 4.43 seconds; backend 620.9 kB).
  Full native units passed **628 tests / 65 files**, exit zero, **89.07 seconds**.
  No database behavior changed or database suite rerun;
  no new immutable image or provider-account acceptance claimed. README, regional
  gap map and current inventory summary updated without rewriting historical counts.
- Market-research skill guided direct evidence, adverse observations and separated
  publication/admission decisions. No accounts, payments, contacts, provider actions,
  publication, commit, push or merge. EUR 100 planning ceiling and unresolved
  operations, retention, complete budget enforcement and real customer/inbox
  acceptance gates remain unchanged. Full goal remains active.

### Verification screen current-link and invalid-fragment handling

- Previous turn made verified shared redemption-admission progress. UI inspection
  found success was not explicitly bound to the current mutation's token; invalid
  or missing-token replacement fragments also left the old token active. Two
  new static-render tests failed before the change. The browser baseline also
  failed the invalid-fragment assertion with no console errors: no invalid-link
  alert was shown. This does not establish a reproduced runtime stale-response
  exploit; the late-response behavior is covered by the final rendered check.
- Screen now lazily reads one exactly shaped 43-character token, distinguishing
  absent links from invalid supplied fragments. Invalid/duplicate fragments clear
  the old link, remain explicit error states even for a verified signed-in account,
  and never offer confirmation. Every supplied fragment is removed from history
  while preserving existing query/history state. Confirmation is still explicit.
- Success/pending/error display and workspace destination derive from the exact
  current submitted token. Stale errors do not describe the newer link; pending
  duplicate submissions are refused. Earlier backend requests are not canceled
  or undone by a newer fragment. No backend, token/audit or provider contract changed.
- React skill guided lazy initialization and render-derived state rather than
  synchronized extra state. Frontend-testing skill required rendered interaction
  and responsive evidence. Browser plugin was absent; existing Playwright 1.62.1
  and Chromium 148.0.7778.0 used, with no dependency installation. Initial runtime
  failed on missing libnspr4.so in the integration image; switched to the already
  installed browser image. A later harness failure came from non-batch response
  assumptions; corrected the fixture to mirror the actual tRPC batch envelope.
- Final local production-built frontend passed five rendered stages: malformed
  initial link; keyboard-confirmed held old response followed by a newer link;
  invalid replacement clears old link; duplicate-token rejection; current-link
  confirmation/sign-in destination. Desktop 1365x1000 and mobile 375x812 inspected;
  no horizontal overflow, blank screen, framework overlay or console error. No
  external requests; tokens absent from DOM, storage and network URLs. Test HTTP
  responses are synthetic UI fixtures, not a database/provider/inbox journey.
- Browser harness and screenshots are outside the repository in task outputs.
  Harness SHA-256: d31d08df55696af13c56e960733eea01b166cf698bf4dcaa933dfa6b420485e2.
  Four focused screen tests passed (0.463 seconds); TypeScript and production
  build passed (Vite 4.75 seconds). Full native units passed **619 tests / 65 files**
  in **93.62 seconds**, exit zero. Database suite
  was not rerun for this frontend-only change; prior 677-case result is historical.
- README updated. No real account changes, messages, purchases, deployment,
  publication, commit or merge. Complete customer/inbox/pilot acceptance,
  worldwide-source workflows, operations/privacy and EUR 100 budget controls
  remain open; the full goal stays active.

### Shared verification-link redemption admission

- Previous turn made verified India catalogue progress. Current account-security
  inspection found public verification redemption lacked shared admission before
  token lookup. Backend-patterns skill guided reuse of the existing durable
  authentication admission mechanism rather than replica-local counters.
- Independent allowance: ten per source, ten per exact case-sensitive token and
  200 service-wide per fixed 15 minutes. A separate HMAC purpose and stable global
  row avoid charging login/registration/reset budgets. All four families share
  the first existing mutex and preserve all four stable globals during bounded
  expiry cleanup. No migration or raw token/IP storage added.
- Admission commits before lookup. Later failure or replay consumes its admitted
  attempt; refused admission preserves links/account flags/receipts. Storage,
  malformed counters or missing signing secret fail closed with a fixed safe
  unavailable error. Database time after lock acquisition determines expiry.
  Rotation resets effective identity allowances, not the global ceiling.
- Before implementation, three new route assertions failed and malformed input
  passed; the route skipped admission. Afterward, 11 focused unit cases passed
  (5.75 seconds), type checks and production build passed (Vite 4.84 seconds,
  backend 617.8 kB). Full native units passed 617 / 65 files in 98.21 seconds.
- First database checks passed 75 cases / six files in 43.87 seconds, including
  compiled HTTP restart and forged proxy headers. Expanded 18-case verification
  suite initially had 17 passes and one fixture failure: synthetic openId exceeded
  its existing column length. Corrected only the fixture to a 32-hex identifier;
  final focused 18 passed in 8.80 seconds. Added usable-link refusal/expiry/replay,
  missing secret, application clock jump and reset-family independence checks.
- Initial offline test launcher tried to fetch another package-manager version
  and failed DNS. No dependencies/network were enabled to work around it;
  directly invoked existing built migration and test tools instead. Migrations
  completed. Final full database suite passed **677 tests / 39 files**, exit zero,
  **251.58 seconds**, no skips. Cleanup found zero users, sessions, audit events,
  mail jobs, prospects and campaigns. Eight authentication and six shared mail
  counters remained separate from account cleanup until the exact owned tmpfs
  database was stopped. Unrelated services were preserved. Sources/schema/package/client
  and compiled dist are read-only host overlays on the locked dependency image,
  not a newly qualified immutable release image.
- README/runbook updated. No real account changed, message sent, provider called,
  purchase, publication, commit or merge. This does not close worldwide source
  permissions, customer pilot, real inbox, deployment/restore, approved retention
  or full EUR 100 operating-budget enforcement. Goal remains active.

### Further India discovery with illustrative-content safeguards

- Previous turn made verified shared verification-email admission progress.
  Current primary-source research added CoFounder Dekho as discovery only, with
  advertised paid access, untested membership, illustrative examples and
  inconsistent policy naming preserved. No profiles or vendor member counts
  imported; no provider permission or identity verification inferred.
- Public inventory is now 42 (16 dedicated, 12 community/channel, 14 program/
  ecosystem); internal reviewed register 43 including held F6S, plus five
  unpublished leads. This does not establish all-platform/worldwide coverage.
- Foundrr direct reads failed twice; VenturLoop's matching URL directly returned
  Page Not Found despite a matching search snippet. Neither was promoted from
  snippets. Exact footer-linked CoFounder Dekho privacy policy was readable after
  the guessed URL failed. Source review preserves these adverse observations.
- New source-record test failed before implementation because no record existed.
  After implementation, 75 focused catalogue/source-policy/admission tests passed
  in 5.04 seconds, including ID/name/host/www/subpath/manual-label variants and
  candidate intake, CSV and human-authored outreach blocks. TypeScript passed;
  production build passed (Vite 10.65 seconds; backend 617.1 kB).
- Full native unit suite passed **613 tests / 64 files**, exit zero,
  **102.72 seconds**. Database behavior was not changed; no database integration rerun or new immutable-image
  qualification claimed. Earlier packaged candidate predates this change too.
- README and regional gap map updated. Market-research skill informed source
  provenance, adverse-evidence preservation and discovery/admission separation.
  No purchase, account signup, real sending, deployment, publication, commit,
  push or merge. EUR 100 planning ceiling and wider unresolved operator,
  retention, budget-enforcement and live-acceptance gates remain unchanged.

### Shared hourly verification-email replacement admission

- Previous turn made verified shared reset-redemption admission progress. Current
  verification review found the three-per-owner hourly limit was process-local,
  even though token replacement and service-wide dispatch budgets were durable.
  The backend-patterns skill guided moving owner admission into the existing
  live-owner-locked READ COMMITTED token/dispatch transaction, before transport.
- Three admitted attempts per account per fixed hour now share a purpose-separated
  owner HMAC row in account_mail_quotas. Current email/deletion-fence validation
  precedes admission. Owner, shared day/month sending reservations and replacement
  token commit together. A fourth refusal preserves the existing link and all
  counters without transport. Token-write/shared-budget failure rolls back owner
  admission; uncertain provider failure after commit consumes its attempt.
- Epoch database time is read after the owner-counter lock and mapped with SQL,
  not the application's clock. Missing shared JWT secret or malformed storage
  fails closed with the existing fixed safe account-email error. No raw owner ID,
  email or token is stored in the counter. Signing-secret rotation resets effective
  owner windows, not stable global sending budgets. Configure replicas identically.
- The authenticated route no longer uses local verification counters. Existing
  account export/deletion classification remains shared pseudonymous security
  state. The opt-in mail-retention worker already recognizes the reviewed 64-hex
  HMAC shape; its comment/docs now cover verification owners as well as recovery
  requests. No schema migration, new retention worker or default enablement.
- Added eight unit key/authentication cases and 13 MySQL owner-window cases:
  four concurrent requests, usable-link preservation, uncertain transport, shared
  budget/token-write rollback, independent owner expiry, application clock jumps,
  malformed counters, stale email/fence, missing secret, two fresh processes
  competing for the final owner slot and authenticated route persistence after
  reconnect. Provider responses are synthetic in-process acknowledgements, not
  real sending. Existing non-UTC session/token tests remain active.
- Focused unit checks passed: 18 cases in three files (5.57 seconds). Type checks
  and production build passed. First focused database run had 57 passes and one
  fixture setup failure (20.03 seconds): MySQL disallows a CHECK referring to an
  auto-increment ID. The fixture now targets the exact generated synthetic openId
  as in the existing budget rollback test; no application implementation changed.
  That earlier run is not green evidence.
- Final full native suite passed: 608 cases in 64 files, 100.11 seconds, exit 0.
  Final full database suite passed: 659 cases in 38 files, 251.07 seconds,
  exit 0, no skips. This includes the corrected rollback fixture and all 13 new
  verification cases. Formatting/whitespace checks passed. Users, sessions,
  audits, mail jobs, prospects and campaigns each had zero fixture rows afterward.
  Six shared mail and four shared authentication counters remained separate from
  account cleanup until the exact owned tmpfs database was stopped. Unrelated
  containers and user data were preserved. Current sources,
  schema/package/client and host-built dist are mounted read-only on the locked
  dependency image, not a new immutable packaged qualification. README and operator
  guidance document the behavior, rotation caveat and remaining load/support gates.
- No provider action, purchase, external sending, real account mutation, deploy,
  publication, commit or merge. Complete operating-cost/traffic controls, hosted
  TLS/private storage, remote restore/alerts, real-inbox/pilot acceptance, approved
  retention/erasure and worldwide platform permission/coverage remain open. The
  full goal is not completed by these admission checks.

### Shared durable reset-link redemption admission

- Previous turn made verified shared registration admission progress. Current
  recovery review found reset redemption still used process-local throttling and
  admitted invalid links reached expensive password hashing. The backend-patterns
  skill guided shared database admission before strength validation, hashing or
  the existing atomic reset operation. This is local implementation, not a real
  account reset or live-email acceptance.
- Added separate reset purpose and global allowance to the existing shared
  migration-0035 security counters: ten attempts per source IP, ten per exact
  case-sensitive reset token and 200 across the service per fixed 15-minute
  window. Login and registration keys/limits remain unchanged. All three paths
  share the same first mutex and protect all three stable service rows from
  bounded opportunistic expiry cleanup. Rejected reservations roll back rows and
  cleanup; admitted later failures do not refund attempts.
- Only purpose-separated keyed digests/counts/expiry are stored. Reset token
  identity is not lowercased or trimmed. Shared source normalization and unknown
  bucket behavior remain in place. Storage/configuration/UTC or malformed counter
  failures stop with a fixed safe recovery error before password hashing/change.
  Limits return a fixed recovery 429 error; no process-local fallback. No new
  schema migration or account-export/deletion inventory category is introduced.
- Added five route-boundary unit cases and 15 real MySQL cases: exact token and
  case-distinct identity, source aliases/unknown metadata, cold concurrency, final
  service slot, rejection rollback, database-clock expiry, family independence,
  secret rotation, bounded cleanup, unavailable/malformed storage and fresh-process
  persistence. The current compiled HTTP server accepts nine synthetic weak
  replacement attempts and one invalid-link attempt, then rejects another after
  restart despite changing forwarded headers. No cookie or raw token appears in
  the checked responses; both processes stop gracefully with exit 0.
- Focused checks passed: 23 unit cases across four files (8.47 seconds) and 51
  database cases across four files (34.75 seconds), including existing login,
  registration and atomic recovery tests. Type checks and production build passed.
  Original independent recovery lifecycle fixtures now clear their shared-counter
  fixture only in the asserted disposable cofounder_test database; their synthetic
  non-IP labels intentionally map to unknown. Cumulative admission is separately
  exercised by the new durable suite, not weakened or replaced by those resets.
- Final full native suite: 600 cases in 63 files passed in 94.93 seconds, exit 0.
  Final full database suite: 646 cases in 37 files passed in 235.56 seconds,
  exit 0, no skips. Repeated type checks passed. Formatting initially flagged the
  new integration file; it was formatted and rechecked successfully without a
  behavior change. Whitespace checks passed. Users, sessions, audits, mail jobs,
  prospects and campaigns each had zero fixture rows afterward. Four shared
  synthetic security counters remained separate from account cleanup until the
  exact owned tmpfs database was stopped; unrelated containers/data were preserved.
  README/runbook describe the
  new limits and preserve their provisional status. Current source and host-built
  compiled artifacts are mounted read-only on the locked dependency image, not a
  newly qualified immutable release. No provider request, purchase, external
  sending, real account mutation, deployment, publication, commit or merge.
- The full public-beta goal remains open: representative traffic/load and support,
  verification-request throttles, hosted/private storage/TLS, complete invoice
  controls, remote restore/alerts, real inbox/pilot acceptance, retention/erasure
  approval and worldwide platform evidence/permissions are still separate gates.

### Shared durable public registration admission

- Previous turn made verified retained-session admission progress. Current route
  inspection found public registration still used process-local attempt counters,
  which reset on restart and split across replicas. Replaced that path with shared
  MySQL admission before password validation, account lookup, hashing or creation.
  No public registration or provider request was performed.
- The backend-patterns skill guided shared-store enforcement and the fixed error
  boundary. Registration allows five attempts per normalized source IP, three per
  normalized email and 100 across the service in fixed one-hour windows. Admitted
  successes, duplicate addresses, invalid-strength passwords and later failures
  consume allowance. Malformed input, disabled registration and zero session
  capacity are refused before admission. Storage/config/UTC failures stop the
  route with a fixed generic error before account creation or cookie issuance.
- Login and registration share the existing migration-0035 security-counter table
  and login-global mutex, but have separate HMAC purposes and global allowances.
  Existing login limits and keys are preserved. Expiry cleanup removes at most
  100 identity rows per accepted transaction, never either stable service row.
  Rejection rolls back provisional rows/cleanup; global ceilings survive secret
  rotation. No new migration, export category or account-erasure ownership rule
  was needed; these remain reviewed shared pseudonymous security counters.
- Added six unit route-boundary checks and 14 real MySQL cases, including cold
  concurrent admission, final global slot, normalized/unknown sources, unchanged
  rejected storage, expiry, family independence, rotation, bounded cleanup,
  unavailable storage, successful/duplicate account creation and fresh-process
  persistence. The current compiled production HTTP server also admits one
  synthetic unverified signup and four weak-password attempts, then rejects
  another after restart despite forged forwarded addresses. Both server processes
  stop gracefully with exit 0. No RPC responses or admission storage were mocked
  for this compiled HTTP acceptance; only synthetic disposable data was used.
- First focused database run: 32 passes, one new assertion failure (27.67 seconds).
  The fixture expired only the registration service window but incorrectly
  expected a still-live exhausted email bucket to reset. Corrected the fixture
  to assert rejection remains, then admit a distinct address; no implementation
  change. First full native suite: 594 passes, one existing shutdown-fixture
  failure (97.41 seconds), because registration without a database now correctly
  returns 503 rather than weak-password 400/local-limit 429. Updated that fixture
  to check six safe failures/no cookie/no fallback; real quota/restart acceptance
  is now covered in the database suite. These earlier runs are not green evidence.
- Final full native suite: 595 cases in 62 files passed in 101.90 seconds, exit 0.
  Final full database suite: 631 cases in 36 files passed in 250.60 seconds,
  exit 0, no skips. Current source/schema/client/package and host-built dist were
  mounted read-only on the locked integration dependency image; this is not a
  fresh packaged-image qualification. Users, sessions, audits, mail jobs,
  prospects and campaigns each had zero fixture rows afterward. Four shared
  synthetic security counters remained intentionally separate from account
  cleanup until the exact owned tmpfs database was stopped; unrelated containers
  and user data were preserved. The focused 19 unit cases, repeated type checks,
  production build, formatting and whitespace checks passed. README and operator
  guidance now state the shared boundary and its limits. All replicas require
  identical implementation/secrets and a reviewed trusted proxy path.
- This does not close edge-DDoS protection, load/support acceptance, remaining
  process-local verification/reset-redemption throttles, account enumeration,
  complete invoice limits, hosting, real inbox acceptance, retention/erasure or
  worldwide platform permission/coverage gates. Source/compiled overlays on a
  dependency image do not qualify a new immutable packaged release. No real
  account mutation, purchase, external sending, deploy, publication, commit or
  merge. The full goal remains active.

### Bounded retained sign-in sessions

- Previous turn made verified isolated-restore privilege progress. Session review
  found successful sign-ins could accumulate retained rows for an owner across
  successive login-rate windows. Added `CAPACITY_SESSIONS_PER_ACCOUNT`, default
  ten, with the existing strict capacity configuration and Compose forwarding.
- Admission counts retained rows after the existing owner's expired-row cleanup,
  under the same owner lock as session creation and recovery, with explicit READ
  COMMITTED isolation. Concurrent sign-ins cannot consume the same final slot.
  Invalid counts fail closed; rejection rolls back cleanup. Existing sessions
  and other owners' rows are preserved, with no automatic eviction or historical
  deletion. The SDK returns a fixed safe capacity message, not an underlying
  storage message. Zero blocks registration before creating an account as well
  as new sign-ins; existing sessions and recovery remain available.
- A real database baseline admitted all three concurrent requests with a limit
  of two (one correctly failing regression). A separate real registration
  baseline reproduced account creation before session rejection at zero. The
  implementation now guards that case before creation. The login-window fixture
  uses a larger bounded session allowance to retain its distinct eleventh-login
  rate-expiry assertion instead of weakening that test.
- Final native unit suite: 589 cases in 61 files passed in 98.39 seconds. Focused
  session/config checks: 27 cases passed; type checks, production build and all
  12 production-configuration checks passed. No live browser/provider rehearsal
  was added for this increment.
- Final database suite: 617 cases in 35 files passed, exit 0, no skips, in 224.84
  seconds. Current server/shared/schema/client directories were mounted read-only
  on the locked integration dependency image. Its existing packaged dist/scripts
  were not replaced; this is source-mounted verification, not fresh packaged
  release qualification. After terminal completion, users, sessions, audits,
  mail jobs, prospects and campaigns each had zero fixture rows. The exact owned
  disposable tmpfs database was stopped; unrelated containers were preserved.
- Earlier full runs are not passing evidence: the first omitted synthetic
  JWT/root migration fixture settings and
  exposed the login-window fixture interaction (576 passes, six failures, 34
  skips); the corrected fixture run had 616 passes and one assertion failure
  because the absent-account helper returns null rather than undefined. That
  boolean assertion was corrected without changing implementation. An initial
  wrong-work-directory migration command also failed before running tests.
- README, environment example and operator runbook describe the admission
  boundary. This is not a global disk, retention or invoice ceiling. Historical
  excess rows, replica configuration, recovery/support and complete EUR 100
  operations budgeting still require operator review. The earlier qualified
  immutable image predates these changes; source-mounted checks do not qualify
  or publish a new image. No real-account action, purchase, external sending,
  deployment, publication, commit or merge occurred. Full launch gates remain.

### Isolated restore account privilege confinement

- Previous turn made verified Malaysia catalogue progress. Recovery-tool review
  found the restore gate rejected the root username but did not inspect a
  non-root account's server-wide privileges, despite requiring a target-only
  restore account in the runbook.
- A real MySQL regression granted the synthetic restore user SELECT on all
  databases. The old CLI accepted the restore; the new negative assertion failed
  correctly (one failed full-schema rehearsal). No real account was inspected
  or changed.
- Added a bounded conservative SHOW GRANTS/CURRENT_ROLE check before imported
  SQL. It accepts direct target-database grants and optional global USAGE only.
  Foreign/wildcard scopes, global powers, unknown privileges/grammar, proxy or
  role grants, active roles and grant delegation fail with the existing fixed
  restore_target_rejected event. No raw grants/account names are logged and
  the CLI does not revoke or adjust privileges.
- First guarded rehearsal rejected the otherwise valid account because batch
  output double-escaped its database identifier. Synthetic inspection and
  official MySQL 8.4 documentation identified escaped underscore grant semantics.
  Raw client output now preserves the exact scope. Unescaped underscore scopes
  remain rejected conservatively, including server configurations that could
  interpret them literally. Source SHOW_ROUTINE fixture authority is kept
  separate from the target-only restore account.
- Final full-schema rehearsal passed in 29.35 seconds (one test, exit 0, no skips).
  It rejects broad privileges, delegation and an active synthetic role before
  applying SQL, then restores with confined direct grants and compares migration
  history, columns, indexes and binary/Unicode data. Existing corruption, target
  ID/source/emptiness, scheduler, backup overwrite and source preservation
  assertions remain active. Current host-built dist/schema through migration
  0037 were mounted read-only on the locked integration dependency image.
- All 32 recovery unit checks passed again after formatting (2.20 seconds).
  Syntax and whitespace checks passed. The application unit/database/browser
  suites were not rerun for this standalone operator-tool increment.
  All exact owned recovery fixture containers were observed stopped; test-generated
  temporary keys/backups were removed by the fixture cleanup. Other containers,
  backups and user data were preserved.
- README/runbook now document the tighter account boundary and separate backup
  credential. Docker/operator trust, concurrent privilege changes, other stored
  server data, trusted source SQL, remote backup, retention/suppression and hosted
  recovery/promotion remain separate gates. No real privilege mutation, purchase,
  provider request, deployment, publication, commit or merge occurred.

### Southeast Asia discovery and adverse policy evidence

- Previous turn made verified connected-recovery acceptance progress. Current
  coverage audit still showed only a historical Singapore lead for Southeast
  Asia. Official-source Malaysia research added Cofounders Malaysia as a
  dedicated discovery record, not a new integration or approved action path.
- Direct homepage and terms/embedded-policy reads support the source record.
  Unknown pricing, untested account access and placeholder policy contacts are
  visible. Generic brand aliases were avoided to prevent confusion with other
  CoFound services. No founder profile/contact corpus or membership count was
  imported. Standalone privacy URL reads failed; that limitation is preserved.
- Current public inventory: 41 (15 dedicated, 12 community/channel, 14 program/
  ecosystem); internal reviewed register: 42 including held F6S, plus five
  unpublished leads. These counts do not establish worldwide completeness.
  Search-only SMU/MYStartup/ConnectX leads were not promoted without direct
  relevant evidence. Source method/adverse findings are in the sixth supplement.
- The new catalogue regression first failed with the missing record (one failure,
  12 unselected cases). After addition, all 71 focused cases across four files
  passed, including ID/name/host/www/subpath admission refusal, CSV/intake/manual
  label bypass and original-human outreach refusal. Static rendering checks show
  the source, policy-contact caveat and evidence URL. No new live browser or
  provider acceptance is inferred.
- Type checks and production build passed. All 585 native unit cases in 61 files
  passed in 86.39 seconds. After strengthening rendered evidence assertions, the
  same 71 focused cases passed again; no implementation changed. Whitespace
  checks passed. The database suite was not rerun for this source-data increment.
- README/coverage/source-review counts now match current inventory while prior
  checkpoints retain dated counts. The earlier qualified image still contains
  40 records; this source/build increment does not change its immutable identity
  or qualify a new container. No provider mutation, signup, payment, sending,
  deployment, publication, commit or merge. Full launch gates remain open.

### Connected recovery request, queued mail and browser redemption

- Previous turn was verified fresh packaged-runtime progress. This checkpoint
  closes a separate local acceptance gap: recovery request, durable queue,
  worker-generated reset link, browser consumption and subsequent sign-in were
  previously checked separately. The [receipt](LOCAL_RECOVERY_ACCEPTANCE_2026-10-02.md)
  describes the connected evidence and its limits.
- The production-built UI/API reached real disposable MySQL without intercepted
  RPC responses. A separate real queue worker used an in-process synthetic fetch
  acknowledgement; the provider URL never reached the network. The link was
  taken from its actual message in memory, not assigned directly into the database.
- Five checkpoints passed: registration/request queue; worker acknowledgement;
  hash removal and password-mismatch validation; atomic reset/session revocation/
  password-change notice; used-link and old-password rejection followed by
  successful new-password sign-in. Stored reset token matched the message's hash
  and was consumed; accepted jobs removed encrypted payloads.
- Chromium 148.0.7778.0 rendered desktop 1365x1000 and mobile 375x812.
  Required identity/content/overlay checks, mobile overflow and screenshots passed.
  Reset token was absent from markup, local/session storage, request URLs and
  server logs. No external browser requests. Four precisely matched expected
  error-console entries came from deliberate 400/401 negative checks; no other
  console/page errors. Graceful server shutdown passed.
- Two terminal harness failures preceded success: wrong raw SQL column name,
  then wrong expected login-error text. These are not application defects or
  passing evidence. Each run removed only its synthetic account. Final counts
  were zero users, sessions and mail jobs; only the owned isolated database stopped.
- Browser plugin/skill absent; existing Playwright used under the frontend testing
  skill. Its workflow required rendered interaction and screenshot evidence.
  Current source/shared/schema/dist mounts were read-only on an existing browser
  dependency image. This is not fresh packaged-image or public TLS acceptance.
  No product logic changed, real inbox delivery, provider mutation, deployment,
  purchase, publication, commit or merge occurred. Full release gates remain open.

### Fresh packaged runtime qualification

- Built fresh local runtime and frozen integration images from the current workspace,
  rather than inferring current readiness from the older image or host-source overlays.
  The [qualification receipt](LOCAL_RELEASE_CANDIDATE_2026-10-02.md) records exact
  image identifiers, pinned base, lockfile hash and acceptance boundaries. Neither
  image was published; committed-source/CI provenance remains a release gate.
- Frozen dependency install, TypeScript checks, 580 unit cases in 61 files,
  client/backend/operator compilation and production pruning passed. The initial
  fully offline build could not fetch its uncached pinned package manager; normal
  frozen dependency download succeeded without changing package versions.
- Fresh packaged database acceptance used the image's configured migration/test
  command without host source mounts: 612 cases across 35 files passed in
  215.15 seconds, exit 0, with zero skips. Eight compiled/operator/client/migration
  artifact hashes matched between runtime and test images; this is not a claim
  that their different dependency sets or all image layers are identical.
- The production-pruned runtime passed synthetic mounted-secret migration,
  readiness, HTTP/asset/header, protected-export/catalogue and blocked-legacy
  smoke checks. Inspected restrictions included non-root, read-only root,
  1 CPU, 512 MiB memory/swap, 320 MiB heap, dropped capabilities,
  no-new-privileges and no published ports. Graceful shutdown exited 0 without OOM.
  This was isolated loopback HTTP, not hosted TLS or real-provider acceptance.
- Eleven deployment/build-context checks and 32 monitor/recovery unit checks
  passed. Production dependency advisory lookup reported zero known vulnerabilities
  over 549 dependencies; Trivy/Grype were unavailable, so OS/base-image scanning
  remains open. No new remote restore or delivered-alert acceptance is inferred.
- Build context now excludes local evidence/browser artifacts as well as secrets;
  no files were removed. Synthetic fixtures are not hosting credentials. After
  all runners terminated, fixture counts were zero for users, audit events,
  starters, metrics, campaigns and prospects. Only the owned temporary database
  was stopped. No provider mutation, real-account reset/erasure, sending, purchase,
  deployment, publication, commit or merge occurred.
- The full launch gates below remain open, including controller/support identity,
  approved retention/erasure policy, provider permissions and worldwide coverage,
  real inbox/pilot acceptance, hosting/TLS/remote recovery and complete EUR 100
  operating-budget enforcement.

### Retained legacy history ownership and executable fixtures

- Previous turn was verified West Asia catalogue progress. Current source review
  found copy/use helpers updated a starter by ID alone and their router callers
  omitted the account. Starter/metric creation also lacked same-owner candidate/
  campaign association checks. Supported production routing still blocks these
  legacy endpoints by default; no exposure of enabled beta routes is claimed.
- Added a real-MySQL baseline through the actual router: account B's copied
  update of account A's starter returned success. The selected regression failed
  correctly (one failure, 16 unselected/skipped cases). An earlier attempt failed
  fixture creation because MySQL initialization/schema were incomplete; that is
  harness evidence, not proof of the defect. Same fixture was re-observed TCP-ready,
  migrated and tested without a database or global Docker restart.
- Four legacy mutation paths now lock the account first in READ COMMITTED,
  recheck exact live verification and deletion suspension, then enforce owner
  predicates on candidate/campaign/starter references. Router copy/use calls pass
  the actor explicitly; missing/invalid acting identity fails closed. First
  copy/use timestamps are retained on sequential or concurrent retry.
  Storage errors return a fixed SERVICE_UNAVAILABLE message, not SQL/private notes.
- Historical wrong-owner associations remain unchanged; corrected helpers refuse
  their mutation. No schema change, broad deletion, ownership rewrite or legacy
  route activation. Existing metrics/starter reads remain owner-scoped.
- Replaced all phase-22 fixed IDs with per-case synthetic owners, candidates and
  manual non-sending campaigns; cleanup follows exact owned IDs. All 15 prior
  skips were reactivated without dropping their original functional assertions.
  Added foreign starter update/create and campaign/metric association checks,
  other-customer history isolation, concurrency/retry timestamp checks,
  stale-snapshot unverified/fenced writer refusal, retained mis-link refusal and
  a forced missing-storage rollback/sanitized-error/recovery case.
- First focused run passed 54 tests in two files: all 22 then-current phase-22
  cases plus 32 account-fence cases. Combined current-source suite passed all
  612 cases across 35 files in 224.03 seconds, exit 0, with no skipped cases.
  Full native suite passed 580 cases in 61 files (96.14 seconds); type checks,
  production build and whitespace checks passed.
  Afterwards the timestamp retry assertion was strengthened with retained
  historical timestamps, avoiding false evidence from MySQL second precision.
  All 23 final phase-22 cases and another type check passed; no implementation
  code changed after the combined run. These are fixture checks, not real sending,
  provider connection or externally verified partnership outcomes.
- Current code/schema/shared/client/scripts/dist were mounted read-only into the
  locked Linux dependency test image. This is not a new pruned runtime-image
  qualification. Fixture cleanup confirmed zero users, starters, metrics,
  campaigns, candidates and audits. Only the owned network-isolated tmpfs test
  database was stopped after all runners terminated.
- Legacy growth, payload bounds, aggregation load, audit/source requirements
  and additional retained routes still need review before any future enablement.
  These helpers do not participate in the supported workspace-audit quota and
  must not be represented as budget-qualified or production-approved.
  No provider action, purchase, publication, deployment, commit or merge.

### West Asia discovery evidence and prototype exclusion

- Previous turn made verified workspace-audit admission progress. Current
  worldwide-coverage review found no explicitly scoped West Asian route in the
  customer records, despite a generic Antler listing.
- Official-source research added Dubai Founders HQ as an indirect ecosystem
  route and refreshed the existing Antler entry with MENAP regional evidence,
  without duplicating the partner residency or expanding action permission.
  DFHQ costs/entry remain unknown and the direct network-page read timed out.
  Coalesce's own prototype disclaimer means it remains an unpublished lead.
  Evidence, dates, queries, confidence and failures are recorded in the fifth
  source-review supplement; untouched records retain their previous dates.
- Public catalogue now has 40 records: 14 dedicated, 12 community/channel,
  14 program/event/ecosystem. Internal register: 41 reviewed including held F6S,
  plus five unpublished leads. Counts are inventory, not working integrations
  or worldwide completeness.
- Added catalogue/rendering/search tests for the regional descriptions, single
  Antler identity, unknown DFHQ price and unpublished prototype. Three new
  discovery-only admission cases cover ID, alias, name, root and subpath URLs,
  including generic manual labels, CSV intake and outreach declaration refusal.
  Antler's existing manual-review classification remains unchanged; regional
  evidence grants no new provider right or permission to submit applications.
- Focused catalogue/source/admission boundary tests passed 66 cases in four
  files. Full native unit suite passed 580 cases in 61 files (86.45 seconds).
  TypeScript, production build and whitespace checks passed. No database schema
  or mutation code changed in this phase; the combined database suite was not
  rerun for this catalogue-only tranche. Prior 590-pass/15-skip database evidence
  remains dated to the preceding audit-admission phase, not relabelled as current.
  Actual browser/provider membership,
  private profile, application, inbox or live-cohort access is not proved.
- Market-research skill used for primary-source attribution, marketing-claim
  separation, downside/access caveats and the unpublished-lead decision.
  No signup, form submission, private-account access, sends, paid commitment,
  deployment, publication, commit or merge. Wider country/language inventory,
  exact provider permissions and the complete public-beta launch gates remain
  open; the full goal is active.

### Durable admission for supported workspace audit growth

- Previous turn was verified live-account-boundary progress. Current review found
  retained account/candidate/outreach caps did not bound repeated profile or
  candidate edits and their audit receipts.
- Added a shared owner-transaction audit append gate covering thirteen explicit
  action names: profile save; candidate add/edit/archive/restore/qualification/
  import; outreach draft/transition/cancel/revise/conversation; partnership
  progress. Defaults are 100000 retained covered events service-wide and 10000
  per owner. Strict configuration supports zero as a stop and rejects empty,
  fractional, negative or oversized values. Production Compose forwards these
  exact settings; every replica must be configured identically.
- Uses the existing InnoDB capacity-lock table with a new varchar resource key,
  not a new schema migration. Owner lock first, workspace-audit resource last,
  READ COMMITTED. Capacity rejection rolls back the mutation and its retry
  receipt together; existing history is never pruned. Historical covered events
  count at any age/outcome; global counting includes unowned historical rows.
  Generic standalone audit writes reject covered actions so workspace receipts
  must participate in their mutation transaction.
- Candidate opt-out and security/recovery/privacy/export audit records remain
  exempt. Read-only access and exact committed no-new-audit retries remain
  available at capacity. New duplicate-only imports require audit allowance.
  Covered edits, cancellation and state transitions can be refused at this
  separate audit limit even when their retained candidate/outreach count is full.
- Tests added for owner exhaustion with unchanged profile, same-owner and
  different-owner final-slot races, historical rejected accounting, preserved
  opt-out at zero, exact import replay, rejected import row/receipt rollback,
  transaction rollback releasing allowance, exempt security receipts, standalone
  helper misuse rejection, fresh-process final-slot competition, and real
  synthetic email-token redemption at zero workspace allowance.
- Verification: first focused run passed 173 database cases in eight files.
  Final combined suite passed 590 cases across all 35 current database files
  (222.44 seconds), with the same 15 known phase-22 skips, explicitly not proof
  of those legacy cases. Capacity suite now has 22 cases including seven new
  audit-admission checks. Native suite passed 576 cases in 61 files;
  production configuration passed 10 read-only model checks. TypeScript,
  production build and whitespace checks passed. Current source/schema/client/
  shared/scripts/dist and startup configuration were mounted read-only into the
  locked dependency test image; this is not a newly qualified production image.
- Disposable network-isolated tmpfs MySQL fixture cleanup confirmed zero users,
  audit events, profiles, candidates and idempotency receipts. The owned database
  was stopped after terminal test completion; no other containers were stopped.
- Still not a universal audit-growth, byte/storage, traffic, email, AI/API or
  provider-invoice ceiling. Global action counting currently scans matching rows;
  real staging query latency and lock contention remain unverified. No real
  accounts, provider calls, purchases, deployment, publication or commit.

### Live verified-flag checks under workspace mutation locks

- Previous turn was verified catalogue progress. Current transaction review found
  eleven workspace mutations checked deletion suspension under the owner lock but
  relied on the request's earlier verified snapshot. A real-MySQL regression
  constructed that snapshot, applied the reviewed re-verification command and
  then successfully changed the private profile. Baseline correctly failed one
  selected expectation (13 unselected cases); it is not passing evidence.
- Added `assertVerifiedWorkspaceWorkAllowed`, retaining deletion-fence enforcement
  and requiring the exact stored verified flag. Seven owner-locked mutations in
  db.ts now select and check that flag: profile save, candidate creation,
  qualification, direct outreach record creation, draft admission, transition and
  CSV import. Reviewed candidate intake, edit/archive/restore, opt-out and draft
  revision/cancellation use the same live boundary. Existing owner-lock order and
  atomic audit/receipt/capacity work retained. No new schema, dependencies or cost.
- Recovery, session issuance and account-deletion request boundaries were not
  replaced with a workspace-only guard; private export and other flows that
  already require live verification keep their existing checks. No new claim of
  universal access to rights endpoints while unverified is made.
- Expanded actual reviewed re-verification DB tests: stale profile-context refusal
  and ten other guard paths, with unchanged candidate/draft/audit data on refusal.
  These guard tests use well-formed command shapes, not acceptance of their
  synthetic later-stage revision tokens. All 24 re-verification cases passed.
  Focused **180/180** across seven DB suites passed (21.59 s), including edit,
  intake, import, qualification, revision and deletion-fence regression coverage.
- Full native units **572/572**, 61 files (89.30 s), including six new exact-flag
  and deletion-fence helper cases. TypeScript and production build passed;
  Vite 3.81 s, backend 602.9 kB. Whitespace check passed. Full current-source
  final combined database acceptance is recorded below.
- First combined run: 578 passed, three failed, 15 existing phase22 skips, 35
  files (220.86 s), exit 1. Failures were all the legacy profile fixture: it created
  an unverified owner but expected verified workspace saves, then retrieval
  depended on those refused saves. Fixture now explicitly creates a synthetic
  verified workspace owner, not claimed inbox proof; added unverified-write refusal
  with unchanged stored profile. Production guard was not relaxed or bypassed.
- Added real owner-lock wait regression: stale profile request observed waiting
  behind a transaction holding the owner lock and clearing the flag, then refused
  after commit; prior profile unchanged. No arbitrary delay is used as lock proof.
  Final focused three-file run passed **60/60** (12.26 s): 32 fence/lock cases,
  24 re-verification cases and four legacy profile cases. Added linked
  `docs/ACCOUNT_REVERIFICATION_RUNBOOK.md` covering independent authority, inbox
  readiness, all-replica/worker drain, exact-operation reconciliation and live
  acceptance.
- Final combined current-source database run passed **583**, with **15 known
  phase22 legacy skips**, all **35 selected files** (209.39 s), exit 0/no OOM.
  This includes the corrected profile fixture and new held-owner-lock regression,
  migration startup, recovery, administrator ceremonies/operator CLI, private
  export, rights requests, mail budgets/retention, admission and candidate/outreach
  suites. Ran the exact current manifest selection using the existing locked Linux
  dependency image with current server/client/shared/scripts/schema/build, package
  manifest and Dockerfile mounted read-only. This is real isolated MySQL/compiled
  local runtime evidence, not a fresh pruned production image or live-provider
  pilot. Final fixture users, audit events and profiles were zero; disposable
  task-owned DB stopped afterward. Earlier failed combined run remains recorded
  above and is not relabeled successful; overlapping focused counts are not added.
- README now states the boundary precisely. Supported owner-locked mutations are
  denied while the stored flag is unverified, but earlier commits are not undone.
  This is not a session-generation fence after later successful verification,
  nor draining of reads, claimed external work or unsupported legacy automation.
  Operational maintenance/drain planning and real-account approval still needed.
  No real account, provider or paid resource changed; no sending, publication,
  deployment, commit or merge. Full worldwide production goal remains active.

### India/Korea discovery expansion and explicit worldwide coverage gaps

- Previous turn was verified progress on reviewed re-verification preparation,
  not completion of the full goal. This turn reviewed current catalogue/source
  records and the remaining worldwide discovery requirement. Research skill used
  primary-page wording versus untested provider operation as separate evidence.
  Firecrawl/Exa capability discovery found neither tool; web reader used instead.
- Three targeted search questions covered India matching, Japan matching and Korean
  founder networking. Official FoundrForge homepage/terms/privacy and dcamp
  homepage/program/policy links were read; applicable Korean policy/offer review
  remains open, not legal clearance. CoPath direct page reads timed out twice again;
  search text did not override the unpublished-lead decision.
- Added `foundrforge-india`: paid membership explicitly typed and priced, early
  cohort/checkout uncertainty, India-only privacy wording versus jurisdictional
  terms caveat, mutual chat consent and personal-use/no-import boundary. No
  membership included in the beta or operating budget. Added `dcamp-korea` as an
  indirect ecosystem/program, not dedicated matching; batch scale-up eligibility,
  dated deadline and unreviewed investment/cost obligations are explicit.
- Public catalogue now **39**: 14 dedicated, 12 community/channel, 13
  program/event/ecosystem records. Internal research **40 reviewed records** with
  F6S held, plus four unresolved unpublished leads. New entries dated October 2;
  older dates retained. Both additions discovery-only, no workflow admission or
  integration permission. Current-source tests verify id/URL/manual-label refusal
  for candidate intake, CSV and outreach, plus search and component rendering.
- Added `docs/PLATFORM_COVERAGE_GAPS.md` as a regional evidence/gap queue and
  full-scope completion criteria. Global-branded sources do not prove local
  language, country eligibility or exact community coverage. This document is not
  a completeness score, country census or substitute for outstanding research.
  README and source review now accurately state the counts and access boundaries.
- Focused catalogue/source/admission verification **62/62**, four files (4.48 s).
  Full native units **566/566**, 60 files (73.09 s), with existing integration and
  documented legacy database exclusions unchanged; whitespace check passed.
  TypeScript and production build passed; Vite 3.41 s, backend 601.8 kB.
  No new dependency/migration/provider account, paid commitment or external send.
  No refreshed live-provider, connected browser/DB or pruned-image acceptance is
  claimed for these data additions. No purchase, signup, form submission, private
  profile access, deployment, publication, commit or merge. Full worldwide coverage
  and the broader production-readiness gates remain incomplete; goal active.

### Separately reviewed single-account re-verification preparation

- Implemented private `account:verification:require` / compiled
  `dist/require-account-reverification.js`, with read-only check and separately
  explicit apply modes. This is operator preparation, not permission to reset real
  accounts or a classifier of automatically verified legacy accounts. Domain glossary
  distinguishes a reviewed re-verification requirement from identity proof or deletion.
- Exact account ID and canonical expected email, ten-minute review timestamp/digest,
  operation UUID, operator/approval references and two explicit acknowledgements
  are required. The digest covers account state, session records and latest owned
  audit event. Under owner lock, changed/expired reviews are rejected. Verified,
  unfenced password accounts only; administrator access loss needs a third explicit
  acknowledgement. Acknowledged mailbox/recovery readiness is not live-provider proof.
- Apply atomically clears the verified flag, verification/reset links and address
  binding, revokes existing sessions and inserts an audit receipt. No mail is sent.
  Candidate/private draft/account data and passkeys are retained. Exact concurrent
  retry commits once; historical receipt retry never resets an account that has
  subsequently verified successfully. Changed approval references are refused.
  Receipt failure rolls the entire operation back. No new schema, provider or cost.
- README documents private-terminal PII handling, separate operational approval,
  working mailbox/recovery and administrator continuity requirements. Revocation
  does not drain already admitted verified-context requests or claimed external
  work; operational application requires a suitable maintenance/drain window.
  Deletion preparation also now clears the issuance-address binding.
- Final current-source MySQL acceptance: **74/74** across four files (32.98 s),
  including all **13** new re-verification cases, 12 binding/evidence cases,
  31 deletion-fence cases and 18 schema/preflight cases. Compiled command actual
  fixture apply/retry plus read-only check and missing-confirmation refusal passed.
  Earlier 73-case run and separate 13-case compiled-path run also passed, but are
  overlapping evidence, not additional unique case counts. Current locked Linux
  dependency image used read-only source/schema/script/build mounts, not a new
  production image. Runner exit 0/no OOM, new synthetic owners/receipts cleaned.
  Strengthened fence fixture with a non-empty address binding; final 31/31 fence
  rerun passed (5.42 s). Final disposable DB had zero users/audit events; stopped
  afterward. Git whitespace check passed.
- Full native units **563/563**, 60 files (83.15 s), including eight new command
  argument/private-output cases and the integration-selection inventory guard.
  Existing database exclusions remain. TypeScript and production build passed;
  Vite 4.10 s, backend 598.8 kB, new operator CLI 86.8 kB. No fresh combined full
  database-suite/pruned-image/hosted acceptance is claimed by this phase.
- Real-account historical target selection, approval and application remain open,
  as do live inbox/provider acceptance, approved retention/erasure, hosting/TLS,
  remote recovery and alerts, enforced EUR 100/month operations, worldwide platform
  coverage and full customer pilot. No real account reset, mail, external provider
  mutation, purchase, deployment, publication, commit or merge occurred. Full goal active.

### Verification links bound to the issuance address

- Previous turn made token-evidence progress but expressly left issuance-address
  binding unproven. New real-MySQL regression reproduced transfer: change an
  account's email after issuance and the old token verified the new address.
  Baseline failed as expected; it is not included as passing acceptance.
- Added generated migration 0037, nullable `users.verification_email_digest`,
  snapshot/journal and reviewed privacy inventory entries. SQL only adds the
  column; it does not backfill evidence, change verified flags or erase history.
  Budgeted issuance atomically stores normalized-address digest with token/expiry
  under the owner lock. Internal fixture issuance now uses the same owner lock
  and binding. Redemption requires the stored binding to match current address;
  unbound/mismatched links return invalid without consuming or verifying them.
- Successful redemption clears binding with token/expiry and commits a version-two
  receipt identifying issuance binding. Read-only inspection preserves version-one
  history as `unbound_current_email_redemption`, requiring review instead of
  relabeling it bound. Password recovery clears the binding too. Public account
  projections remain unchanged; private export excludes the new security field
  and deletion preflight recognizes it. Still 42 tables; no new provider or cost.
- Existing compiled migration runner applied 0037 to disposable MySQL. New
  source/schema/scripts/build were mounted read-only into the current locked
  dependency test image. Seventy cases across six DB files passed (42.83 s):
  12 evidence/binding cases plus lifecycle, mail-budget, password recovery, export
  and deletion-preflight. Includes production budgeted issuance, changed-address
  refusal, unchanged old verified/unbound rows, v1 distinction, exactly-once
  redemption/audit rollback and compiled read-only CLI. No skips in this run.
- Strengthened actual-export and recovery fixtures with non-empty binding values;
  final rerun passed 21/21 in two DB files (12.23 s), proving redaction and recovery
  clearing rather than only behavior with null defaults. Full native units passed
  555/555 in 59 files (75.28 s), with existing documented exclusions. TypeScript
  passed; build passed (Vite 3.73 s, backend 598.8 kB, inspection CLI 81.5 kB).
  Git whitespace check passed. Final DB runners exited 0/no OOM; synthetic owners
  and audit records were cleaned, task-owned disposable DB stopped afterward.
- README requires migration 0037, fresh links for pre-binding tokens, reviewed
  backup/staging migration and forward rollback without an unbound writer. Existing
  verified flags are deliberately not reset. The preceding production image/full
  545-case checkpoint predates this change; no new pruned-image/combined full-suite,
  hosted migration, large-table locking, live inbox or provider acceptance is claimed.
- Legacy verified-account target review and approved remediation, real identity
  and live-inbox acceptance, audit retention/erasure and all wider launch gates
  remain incomplete. No real accounts or provider settings were changed, no mail
  sent, and no purchases, commits, merges, publication or deployment occurred.
  The full worldwide goal remains active.

## Previous checkpoint (2026-10-01)

### Email token redemption evidence and read-only legacy-account inspection

- Previous turn made current-source release-verification progress. Source review
  found that successful email token consumption left no durable explanation for
  an account's verified flag. Missing history cannot identify which old flags
  were automatic rather than genuine earlier verifications. Domain glossary now
  distinguishes token redemption evidence from independent verified identity or
  legacy classification; no mass reset, backfill or account mutation is inferred.
- `verifyEmailToken` now validates the finite token shape and commits its flag
  update, token consumption and private `auth.email_token_redeemed` audit receipt
  together under the existing account lock. Audit failure rolls all changes back;
  concurrent redemption produces one success. Expired/fenced/missing-address
  accounts fail closed. Public procedure uses a strict 43-character base64url
  token input and passes its server-observed request ID. No raw email/token/token
  digest is stored in the receipt. Version/method and normalized-email digest are
  private pseudonymous audit metadata, excluded by existing account response/export
  projections. The digest is not anonymous data or issuance-address attestation.
- Added operator-only `account:verification:inspect --read-only --account-id ID`
  and compiled `dist/inspect-email-verification.js`. Read-only repeatable-read
  snapshot reports explicit account ID, flag, latest supported evidence status,
  recorded timestamp, review need and limits. Status distinguishes missing,
  invalid, current-address and different-address redemption evidence. Another
  owner's receipt cannot count for this account. No email, token, digest, metadata,
  credentials or private content is output; errors are generic/nonzero. It has no
  issue, reset, send or apply mode and is not an HTTP endpoint.
- Current-source MySQL acceptance passed 58/58 across four files (13.35 s),
  including eight new cases: absent history preserves a verified account,
  concurrent exactly-once receipt, audit rollback then successful retry,
  old-address/malformed evidence, expiry/fence/missing address refusal, strict
  input, cross-account receipt exclusion and real compiled inspection without
  output leakage or audit writes. Existing lifecycle, shared mail budget and work
  fence suites passed; their exact-owner fixtures now remove the new audit
  dependency before deleting synthetic owners. Production history is untouched.
- Nineteen focused unit/CLI cases passed. Full native units passed 555/555 across
  59 files (69.47 s) with existing documented integration/legacy exclusions.
  TypeScript passed; build passed (Vite 3.83 s, backend 597.7 kB, inspection CLI
  81.1 kB). New database suite is included in the integration command and the
  inventory guard now covers 30 named suites. No schema/migration/dependency or
  lockfile changes. Existing current-dependency Linux test image mounted final
  source/scripts/build read-only; no fresh production image is claimed this turn.
- First migration attempt failed just after disposable MySQL restart. Explicit
  TCP readiness then passed and the existing migrations applied. Initial CLI
  parameterized test incorrectly expanded argument arrays; corrected its table
  and reran, without skipping a case. Final DB runner exited 0/no OOM; exact
  cleanup left zero users/audit events. Task-owned disposable DB stopped afterward.
- README documents the operational boundary and marks the preceding combined
  production image/checkpoint as predating this change. Actual approved legacy
  remediation, issuer-address binding review, session/recovery handling, live
  inbox/provider acceptance, audit retention/erasure and hosted release gates
  remain incomplete. Matching evidence does not itself grant access or authorize
  reset/mail. No real accounts were inspected or reset; no provider sends,
  purchases, commits, merges, publication or deployment occurred. Goal remains active.

### Current-source combined release verification and suite inventory

- Previous turn made connected customer-workflow progress. This turn adds a
  release regression requiring all 29 named database suites exactly once in the
  integration command, every selected test file to exist, no duplicate selections
  and database-required mode. The partnership suite cannot silently disappear
  from the command. Native inventory tests 2/2 and TypeScript passed. Extended
  the production smoke script to reject unauthenticated partnership reads/writes
  with 401 and private/no-store responses in the pruned compiled runtime.
- Built current frozen-lockfile Linux integration and production images from
  the dirty workspace without committing or discarding user changes. Integration
  image predates only the final inventory-test import/existence strengthening;
  all runtime/domain/database-suite source is current. Production build includes
  the strengthened inventory test. Linux full units passed 548/548 in 58 files
  (61.84 s), TypeScript passed, build passed (Vite 4.55 s, backend 596.9 kB), and
  production dependencies were pruned offline. No dependency/lockfile change.
- Full configured MySQL integration command passed 545 active tests across 33
  files in 210.40 s, with the existing 15 `phase22` legacy skips explicitly
  unproven. Includes all current account/admin/session/deletion-preflight/export,
  intake/edit/qualification/provenance/outreach/conversation/progress, capacity,
  migration-startup and secret-file suites. Runner exited 0 without OOM. This is
  local synthetic acceptance; it is not actual erasure or live provider evidence.
- Fresh production candidate identifier:
  `sha256:7f90f58cbfb7d3b86e4cbe7fefe2af9ee9a9d0294dfe9b1cebccdf444ac539db`
  (`cofounder-current-release-candidate-20261001`). One-CPU, 512-MiB memory/swap,
  320-MiB heap, non-root/read-only/capabilities-dropped/no-new-privileges runtime
  passed the strengthened production smoke checks against disposable MySQL.
  Compiled client/assets, health/readiness/security headers, protected routes,
  error/body/batch/origin boundaries and disabled providers passed. No host port
  was published. App stopped with exit 0, no OOM and `shutdown_completed` receipt.
- Native production configuration passed 9/9, monitor passed 16/16, encrypted
  recovery unit/configuration tests passed 16/16. The isolated current-schema
  encrypted backup/restore rehearsal passed 1/1 (33.62 s), including the Windows
  wrapper, preserving source data and refusing unsafe restore targets. Its exact
  synthetic source/target containers were stopped by the test. This remains
  local recovery, not remote backups, restore operations or disaster recovery.
- Production-dependency advisory audit returned exit 0, no known vulnerabilities
  at this check. It does not scan OS packages, certify the image or establish
  broad security readiness. Git diff whitespace check passed. No cloud CI run,
  image publication, provider request, purchase, commit, merge or deployment.
- Larger launch requirements remain open: retention/erasure decisions and
  implementation, real inbox/provider authorization and acceptance, approved
  hosting/TLS/remote backup/alert delivery within EUR 100/month, legacy verification
  remediation, comprehensive platform coverage and customer pilot. Full goal is
  active; neither aggregate test counts nor a successful local image prove these.

### Recorded partnership progress: customer interface and connected acceptance

- Previous turn made storage/API progress; this turn connects that backend to
  the candidate-details dialog. Five outcomes, optional bounded notes, explicit
  review confirmation, paged history and reload controls are available. Changing
  report content clears confirmation. Uncertain saves retain exact retry commands
  in-tab; conflicts require fresh review. Closing guards dirty inputs and active
  work. Account/candidate mismatch conceals history; legacy missing dates remain
  missing. React guidance kept data on existing typed query hooks rather than
  adding a separate cache or provider. No external contact is triggered.
- Added four static-render safety tests (concealment, explicit review/report-only
  semantics, escaped legacy notes/null dates, missing assessment/storage). Full
  native unit run passed 546/546 in 57 files (69.37 s), with existing documented
  exclusions. Browser QA then found retry text shown prematurely while saving;
  fixed the conditional, rebuilt and passed final-source TypeScript plus eight
  focused screen/schema tests. Final build passed (Vite 4.56 s, backend 596.9 kB).
  Full units predate that final conditional change; connected QA covers the fix.
- Added partnership MySQL tests to the regular integration command; the prior
  ten-case final-source storage evidence remains documented below. No migration,
  dependency or lockfile change was introduced by this interface phase.
- Browser skill was unavailable; used existing Playwright with Chromium
  148.0.7778.0 against production-built local app at
  `http://127.0.0.1:13014/outreach`, title `CoFounder Outreach`, disposable MySQL,
  desktop 1365x1000 and mobile 375x812. Browser testing image uses current frozen
  integration dependencies and cached Chromium OS libraries; final app build is
  mounted read-only. This is not a production image or hosted certification.
- Final connected run passed five stages: required review/text invalidation;
  save-response loss followed by exact retry with one DB row and unchanged opt-out
  and zero outreach rows; stale candidate refusal then fresh review/save; 23-row
  legacy history paging 20/3 without removal; desktop/mobile rendering and
  dismiss/accept unsaved-close protection. Page content, identity, no framework
  overlay, screenshots and zero page errors were checked. Console showed only
  the explicitly induced failed fetch and 409 conflict, each checked; no other
  warnings/errors or outbound network requests were observed.
- First attempt stopped before account creation because restarting tmpfs MySQL
  cleared its schema. Applied existing migrations. Second attempt exposed the
  pending-retry UI issue; third exercised all initial interactions but console
  expectations omitted app logging for induced errors. Final corrected test
  passed, runner exit 0/no OOM, graceful server shutdown confirmed. Exact-owner
  fixture cleanup left zero users/candidates/assessments/outcomes. Disposable DB
  stopped afterwards. Screenshots and temporary script are outside the repository.
- Email verification was explicitly seeded for a synthetic registered account;
  no real inbox, consent, external delivery, legal partnership, remote deployment
  or public beta launch is established. Broader workflow regression, additional
  browsers, account-switch/failure/large-history stress, deletion/retention and
  hosted launch gates remain unfinished. No purchases, sends, publication,
  provider changes, commits or merges occurred; worldwide goal remains active.

### Recorded partnership progress: storage/API phase

- Added verified `criticalPath.progress.list` and `.record` over the existing
  outcome table, without a migration or provider action. Root `CONTEXT.md`
  documents the domain distinction: owner-reported progress is not a verified
  agreement, consent or legal partnership. Legacy history is explicitly flagged
  as potentially unreviewed, not relabeled as approved customer evidence.
- Strict account/candidate/assessment ownership, current credentials and deletion
  fences apply. Review tokens bind candidate revision, latest assessment and
  latest progress. Reports are append-only; account locking serializes writers.
  Report, retry receipt and content-free audit metadata commit atomically. Exact
  retries deduplicate; changed commands conflict and edited receipt-linked rows
  fail closed. No opt-out, assessment status, message or provider is changed.
- Notes are bounded to 2,000 characters; history pages contain at most 20 rows.
  Retained caps are 50 per candidate and 500 per account, counting legacy rows;
  refusal preserves all records. Server timestamps mean recorded here rather
  than an externally observed event time. Existing private export includes reports.
- Four new validation/route tests passed. Full native units passed 542/542 in
  56 files (64.78 s), with existing database/legacy exclusions; this full run
  preceded the final replay-integrity tightening. Final-source TypeScript and
  production build passed (Vite 4.74 s, backend 596.9 kB).
- Ten final-source real MySQL tests passed (4.08 s total): export inclusion,
  unchanged opt-out/send state, exact concurrent retries, stale candidate/history,
  account and assessment isolation, credential/fence checks, broken-reference
  refusal, audit rollback, pagination, both retained caps, concurrent distinct
  reports and altered-content replay refusal. The current frozen-lockfile Linux
  integration image built successfully; final module/test files were mounted
  read-only for the final run. Runner exited 0 without OOM. Exact synthetic
  fixture cleanup left zero users and outcome rows; disposable DB was stopped.
- This is backend evidence, not live HTTP/session, customer UI or connected
  browser acceptance. The customer screen, complete progress journey, hosted
  operations and remaining public-beta gates are unfinished. No purchases,
  provider writes, deployment, commits, merges or publication occurred. The
  EUR 100/month ceiling remains planning-only, not purchase authority.

### Absolute export-response deadline and cleanup

- Previous turn fixed and verified retained-response capacity but left unbounded
  connection lifetime. Extracted the same two-slot budget into a dedicated helper
  with a fixed ten-minute deadline from admission, including context/generation.
  Writes/drain do not renew it. Deadline destruction and finish/close release are
  idempotent; listeners and timers are removed, stale callbacks are inert, and
  the unreferenced timer cannot keep a stopped process alive. No waiting queue,
  payload retention, schema, subscription or adjustable-unlimited bypass was added.
- Timeout closes delivery only. It does not cancel/refund an admitted database
  operation, revoke another account, erase records or automatically retry. The
  domain generation semaphore still holds until that work settles. A successful
  audit receipt remains generation evidence, not proof the customer saved a file.
  README now discloses ten minutes, interruption/attempt semantics and timer,
  proxy, host and per-process boundaries.
- Five controlled-time budget tests and nine transport/batch tests passed 14/14
  on Windows and Linux. They prove exact timer scheduling at 600000 ms, no early
  expiry/progress renewal, destruction, cleanup, slot reuse, invalid/refused
  admission without timers and stale callback isolation. The Linux real HTTP
  case invokes the actual scheduled callback on a backpressured response and
  observes socket closure plus subsequent admission. No ten-minute wall-clock
  or hosted soak was run; Windows loopback verifies completed-response release.
- Final current-source unit run passed 538 tests in 55 files (63.99 s), retaining
  the existing documented integration/legacy exclusions. TypeScript passed and
  production build passed (Vite 3.49 s, backend 586.7 kB). Linux focused runner
  exited 0 without OOM; app/database fixtures from the preceding phase remained
  stopped. No providers, deployment, purchases, commits or publication occurred.
- Proxy/host timeout alignment, slow-network acceptance, per-account/fleet
  fairness, combined workload/extended soak and broader launch requirements
  remain unproven. Timer execution still requires the event loop to run. This
  completed local hardening is not completion of the worldwide public-beta goal.

### Slow-download response capacity: implemented and verified

- Previous turn produced verified large-export burst evidence. Source inspection
  identified that generation capacity ends before HTTP serialization/drain.
  Initial Windows paused-reader assumptions were invalid because loopback had
  already flushed the file. Tightened the regression to inspect server finish
  state; Linux reproduced real backpressure. The original transport admitted a
  third large response while two remained unfinished (expected 429, actual 200).
- Added a separate two-export HTTP response budget to the existing bounded tRPC
  adapter. It reserves before account context, uses parsed operation paths, counts
  each batch export, rejects excessive/busy requests using normal tRPC error
  handling, and releases once on finish/close. The domain generation cap, export
  size, quotas, authentication and batch-size ceiling remain unchanged. No new
  database schema, paid service, provider action or private-data queue was added.
- New real-socket regression/batch cases and the existing transport tests passed
  8/8 on Windows and Linux, no skips. Windows exercised completed-response release;
  Linux exercised held-write close/recovery. TypeScript and production build
  passed (Vite 10.51 s, backend 586.1 kB). Full unit command passed 532/532 across
  54 files in 71.91 s, with its existing documented database/legacy exclusions.
- Rebuilt app under the same non-root/read-only one-CPU/512-MiB/320-MiB heap
  envelope passed real paused-download acceptance against the separate two-GiB
  disposable DB: two near-ceiling responses held, third refused without quota,
  ordinary authenticated read available, recovery after socket close. Subsequent
  two eight-actor waves completed four exports and refused 12; final recovery
  succeeded. Quotas/receipts both equaled eight admitted generations, including
  the held/recovery operations. Health checks passed. Sampled RSS 463208 KiB,
  cgroup peak 430878720 bytes; no memory-limit/OOM events. The host also ran native
  tests, so the 1794–2284 ms timing range is not a controlled performance comparison.
- This fixes retained-response admission, not all delivery capacity: absolute
  transfer expiry, long slow-client soak, fairness, fleet-wide admission, other
  large responses, hosted acceptance and database sizing remain open. See
  [load guidance](SYNTHETIC_CUSTOMER_LOAD.md). No purchase, deployment, commit or
  publication is claimed. The full worldwide beta goal remains active.

### Large account-export burst under unchanged application limits

- Previous turn produced verified connected export/download progress. A separate
  external real-HTTP harness now exercises eight authenticated synthetic owners,
  two concurrent request waves and a refused owner's successful later retry.
  Normal 9.68 MB and near-ceiling 20.55 MB files both passed parsing, exact owned
  candidate/draft counts, cross-owner/secret exclusion, all category declarations,
  byte/record counts and `no-store` checks. Each run accepted four burst exports,
  refused 12 as busy and accepted one recovery. Durable attempts and success
  receipts both totaled five; rejected busy requests consumed no account attempts.
- The app stayed non-root/read-only, one CPU, 512 MiB memory/swap and 320 MiB
  Node old-space. Near-limit successful requests took 1157–1850 ms; recovery
  took 642 ms. App sampled RSS reached 434936 KiB; cgroup peak charged memory
  was 413122560 bytes with no memory-limit/OOM events. Both health endpoints
  passed after the burst. These small loopback samples are not hosted latency
  guarantees, an extended soak, fleet acceptance or exact peak RSS.
- Near-limit fixture seeding killed the original one-GiB tmpfs MySQL instance
  twice before any export. Docker OOM/exit 137 evidence was retained; batching
  inserts more narrowly did not resolve it. The successful near-limit test used
  a separate two-GiB disposable DB, peak charged memory 1208344576 bytes, no OOM;
  app limits, 20-MiB ceiling and timeouts were unchanged. This isolates app
  acceptance but leaves representative production DB sizing/budget unproven.
  One earlier client startup also preceded app readiness and was not a pass.
- Final test clients exited 0; task-owned app/DB services stopped cleanly, with
  original failed fixture evidence retained. Current artifacts/current dependency
  test image were used, not a new exact release image. No provider, purchase,
  deployment, publication or product-code mutation occurred. Full details and
  exclusions are in [load guidance](SYNTHETIC_CUSTOMER_LOAD.md). Slow consumers,
  worst-case encoding, 100000-row admission, other work under export load,
  multiple app instances and real hosted acceptance remain open release gates.

### Actual browser account-export downloads and negative HTTP acceptance

- Previous goal turn produced verified deletion/suspension progress. Extended
  the external connected Playwright harness, without changing product code or
  installing dependencies. The final current-artifact/current-migration run
  passed all 12 stages and exited 0; two real synthetic accounts and separate
  candidates used real registration/intake APIs. Email verification and operator
  approval remained explicit fixtures, not live inbox or authority acceptance.
- Desktop 1365x1000 and mobile 375x812 keyboard-confirmed downloads both completed
  and parsed as `cofounder-account-v1`. Their manifests accounted for 42 tables,
  37 included data categories and five excluded service categories with reasons.
  An explicitly seeded archived opt-out and the original saved draft were
  included. Other-account candidate/identity and seeded verification/OAuth/reset
  values were absent. User password/token fields and session digests were absent
  with declared exclusions. Actual file byte counts and summed included row
  counts matched the response; successful HTTP carried `no-store`, and password
  input cleared after download. Files were inspected in memory, not published.
- Real authenticated HTTP negative checks returned 403 for wrong password and
  cross-account targets; the latter did not consume the first account's quota.
  A test-only unreviewed column returned safe 503 with no export result; the
  column was restored in `finally`. 400 bounded synthetic TEXT draft rows
  exceeding 20 MiB returned 413 without a partial result; the next attempt
  returned 429 and the durable quota stayed at five. Only the exact generated
  fixture keys were removed; the original draft remained for the subsequent
  suspension/preservation check. No timeout, size or attempt limit was relaxed.
- Zero browser errors and external browser requests occurred; desktop/mobile
  screenshots were inspected. Negative API checks used the real authenticated
  HTTP client rather than mocked responses. The first run stopped because its
  response assertion expected a single envelope rather than the browser's batch;
  the first file had downloaded and passed content checks. Correcting that
  harness assertion led to the final passing rerun. No application defect or
  application fix is claimed for that failed harness attempt.
- Existing deletion/suspension stages remained green after export quota failures:
  new deletion UUID/revision, stale-review rejection, one idempotent processing
  receipt, revoked session/login, retained account data and the other account's
  accessible candidate. This still does not prove all populated export categories,
  all browsers, 100000-row admission, concurrent customer export load, legal
  completeness, external-store access, hosted deployment or final erasure.

### Connected deletion request and reviewed suspension acceptance

- Current compiled app and current migrations passed eight connected Playwright
  stages against isolated disposable MySQL: real registration, individual intake,
  candidate reload, saved original draft, a second account with its own candidate,
  customer deletion request/withdrawal/re-submission, reviewed operator suspension
  and revoked access with other-account preservation. Keyboard Space/Enter
  confirmation was exercised; password fields cleared after each request action.
- The withdrawn review was rejected without a fence. Exact revision 3/new UUID
  passed read-only preflight and suspension; identical retry returned the same
  timestamp and exactly one processing receipt. The suspended account had no
  sessions; protected requests and fresh login returned 401. Both candidates and
  the first account's draft remained stored. The other account still loaded its
  own candidate, without displaying the suspended account's candidate.
- Desktop 1365x1000 and mobile 375x812 screenshots were inspected. The final
  runner exited 0 with zero browser errors/external requests. This used existing
  Playwright because the Browser plugin was unavailable; no new dependencies
  were installed. Verification and operator references were test fixtures, not
  real inbox/customer/legal/operator acceptance. No real account was suspended,
  data erased, provider contacted, deployment changed or code published.
- The initial operator child lacked required production origin configuration;
  this was diagnosed and corrected in the external test harness. A fresh DB
  migration admission also failed before readiness, then passed on the same
  runner after TCP readiness. These failed attempts remain distinct from the
  final passing evidence. See the [processing runbook](ACCOUNT_DELETION_PROCESSING_RUNBOOK.md).
- Actual erasure remains unfinished: approved retention exceptions, atomic
  erasure/final receipt, encrypted-mail attribution/drain, external copies and
  backup/restore suppression are separate release gates. The unapproved retention
  draft was not treated as permission for destructive processing.

### Bounded runtime probe and real outage/recovery signals

- Previous turn was verified catalogue progress. Added a dependency-free read-only
  monitor for production liveness plus database readiness. Numeric loopback is
  default; approved remote HTTPS requires explicit opt-in. Fixed endpoints,
  rejected redirects, 2 KiB responses, finite sample/interval/timeout bounds,
  serial requests and content-free failures keep its network/log footprint bounded.
  It never sends notifications, restarts services or mutates provider/customer data.
- Timestamped probe events, thresholded consecutive-failure alerts and one recovery
  per alert cycle are implemented. Process restart resets bounded in-memory state;
  finite runs need supervision. Latest-success exit 0 is not whole-window uptime.
  [Operator guidance](RUNTIME_MONITORING.md) explains exit codes, remote authority,
  supervision and the separate real alert-delivery/hosted acceptance requirements.
- New monitor tests passed 16/16 on Windows and Linux. They use real local HTTP
  sockets and CLI processes for schema/status, size, headers/body timeout, redirect,
  secret-exclusion and exit checks; state tests cover transient reset, suppression,
  recovery and bounded failure counters. Existing encrypted-recovery tests passed
  16/16. Added the monitor to root tests and prepared CI unit/container-smoke steps;
  no GitHub workflow execution or publication is claimed.
- Actual private packaged runtime initially returned unavailable during cold start,
  then the same container reached healthy readiness without restart. Its deliberate
  stop/restart yielded exactly 30 probes, one outage event and one recovery event.
  A separate 40-probe run paused/unpaused only the disposable database: liveness
  remained HTTP 200 while readiness timed out, then recovered. Exactly one alert
  and one recovery were counted. Both monitor runners exited 0 after final health.
- Fixtures used the previously verified error-privacy image, with the new monitor
  script mounted read-only; that image predates the catalogue increment and is not
  a new full release build. The app remained non-root/read-only with file secrets,
  provider workers off, outreach paused and no published ports. App/database and
  both fault runners stopped exit 0 / no OOM; database pause was cleared first.
  Full root tests subsequently exited 0: 16 monitor, 16 encrypted-recovery and
  530 application units / 53 app files (78.54s for app units). A Linux monitor
  waiting in its one-hour interval stopped promptly on SIGTERM, returning the
  specified interrupted exit 1, not OOM or forced-kill exit 137. Formatting,
  syntax and tracked whitespace checks passed. No application endpoint was changed.
  Alert receipt, independent hosted supervision, broader operational metrics and
  the full public-beta launch remain unfinished. No external notifications or cost.

### Dedicated discovery omissions and connected catalogue acceptance

- Previous turn: verified packaged privacy-fix progress. This increment adds
  FoundersList, CoFound (cofound.biz) and Cofy from directly read official public
  pages. Maintained inventory now has 38 reviewed records, 37 public records
  (13 dedicated / 12 community / 12 program), and four unpublished leads. F6S
  remains held. [Source evidence and caveats](PLATFORM_SOURCE_REVIEW.md#third-coverage-supplement-2026-10-01)
  preserve provider claims separately from untested availability and permissions.
- CoFound waitlist/pricing inconsistencies, FoundersList harvesting restrictions
  and irrelevant terms wording, and Cofy mutual-contact and policy gaps are
  visible. VENN and cofound.lat remain unpublished: direct page reads yielded no
  readable content, and similarly named Android/provider identities were not
  established as aliases. This is not exhaustive worldwide coverage.
- The catalogue test failed at the prior 34-record count before implementation,
  then 58 focused tests passed in three files. Parameterized admission checks
  deny all three new IDs/URLs and generic-manual URL variants before storage in
  candidate intake, CSV and outreach. All additions remain discovery-only;
  none activates profile import, posting, provider connections or sending.
- TypeScript and native compilation passed (Vite 4.20s, server 584.9 kB).
  Connected Chromium/HTTP/MySQL acceptance exited 0: real registration with
  synthetic verification fixture, intake, saved-candidate reload, saved draft,
  catalogue search by name/domain/region, category filtering and empty state.
  All three additions and caveats were asserted; desktop 1365x1000 and mobile
  375x812 screenshots were inspected, with mobile overflow, page identity and
  framework-overlay checks. Zero page/console errors and external requests.
- The frontend-testing skill used existing Playwright because the Browser plugin
  was unavailable. Tests used current compiled code/migrations mounted read-only
  into the existing cached test fixture, not a freshly rebuilt production image.
  Providers were disabled, outreach paused, no host ports published. The runner
  exited 0; app and task-owned synthetic database stopped exit 0 / no OOM.
  Full native units subsequently passed: 530 tests / 53 files, exit 0, 65.81s.
  The preceding image/integration/load receipts predate this catalogue increment.
  No external writes or spending occurred; full release acceptance remains open.

### Exact packaged error-privacy acceptance and serializer regression

- The preceding turn was verified progress, not whole-product completion.
  A fresh Dockerfile production build passed type checking, 526 Linux units /
  53 files (54.36s), compilation and offline production pruning. No host or
  provider was deployed. The exact non-root, read-only packaged runtime passed
  the production HTTP/readiness/client-assets smoke with mounted synthetic secrets.
- An intentional missing-column check against an empty, isolated synthetic
  database then failed the strict no-stack-field assertion. SQL, credentials and
  the actual stack were already excluded, but SuperJSON serialized the undefined
  stack property as null plus undefined-value metadata. This is not evidence of
  remaining raw SQL exposure; it is incomplete omission of the public stack key.
  The fixture column was restored and that runtime stopped with exit 0 / no OOM.
- The HTTP unit regression now uses the application's actual SuperJSON
  transformer. It reproduced that exact defect before the correction, then passed
  after removing the stack property from a cloned error-data object instead of
  assigning undefined. Native type checking also passed. The debugging skill
  guided this red-to-green wire-level regression, not a weakened acceptance test.
  The corrected exact-image results follow; the earlier failed attempt remains
  part of this evidence chronology.
- Corrected production image
  `cofounder-public-beta-candidate-20261001-error-privacy-fixed`, inspected ID
  `sha256:f65fd7e4c89b2d4e783ecf84fa5f30dc7e845b372abd7c1669b10baa57ff49b6`,
  built successfully with 526 Linux units / 53 files (54.28s), type checking,
  production compilation (server 581.5 kB) and offline pruned packaging. The
  dependency install was frozen; no package versions were changed for this fix.
- Its exact packaged runtime passed the real production smoke and the deliberate
  schema-failure privacy check, including HTTP 500, private/no-store caching,
  generic message/code, and absence of SQL, submitted credentials, stack fields
  and stack metadata. Container inspection confirmed UID 1000:1000, read-only
  root, one CPU, 512 MiB memory/swap, 256 PIDs, dropped capabilities,
  no-new-privileges and no published ports. Database/session secrets were mounted
  read-only; the runtime had no raw database environment value. No compiled
  application bundle or migration files were replaced by test mounts.
- The fault injection reversibly renamed one column only after requiring zero
  synthetic user accounts. The restoration was independently confirmed before
  stopping the task-owned database. The runner exited 0 and the app stopped
  exit 0 / no OOM. This check does not repeat the earlier full integration/load
  suites or establish hosted controls, real inbox delivery, whole-customer
  acceptance, worldwide-source completeness or launch approval. No publication,
  purchase, external sending, commit or deployment occurred.

### Connected candidate intake, draft persistence and public error privacy

- A real Chromium-to-HTTP-to-MySQL journey passed at desktop 1365x1000 and
  mobile 375x812: registration, candidate intake with synthetic collection
  evidence and duplicate review, saved candidate reload, original draft storage,
  and review-queue reload. The database assertions confirm the actor's ownership,
  provenance and draft body/state. No API responses were mocked; external browser
  requests were blocked and none occurred. The successful run reported zero
  page/console errors. Page identity, meaningful content, absence of the Vite
  overlay and mobile horizontal overflow were checked; screenshots were inspected.
- Registration's email-verification gate was bypassed only by an explicit
  synthetic database fixture update. Collection rights and original-text
  declarations likewise describe test fixtures, not real permissions. This is
  not inbox, provider, approval, send, complete accessibility or hosted acceptance.
- The initial runner mounted current compiled code but stale migration assets.
  The resulting missing-column error exposed raw SQL in the registration UI.
  This fixture mismatch does not establish a current migration defect, but did
  expose a real public error-boundary defect. The tRPC formatter now replaces
  unexpected internal error messages with a generic retry/support message and
  strips stacks while preserving explicit policy messages and status codes.
  A native HTTP regression passed, and a deliberate stale-schema browser run
  confirmed the safe rendered error. Its two HTTP console errors were expected.
- A subsequent connected run passed intake but failed on a test locator after
  reload; zero page/console errors were reported. Correcting the locator and
  adding draft storage assertions yielded the final complete journey pass.
  Failed runs are not counted as passing customer acceptance.
- Latest native units: 526 passed / 53 files, exit 0, 68.72s. Type checking and
  production compilation passed after the formatter change (server 581.5 kB).
  Browser checks used cached Chromium tooling, current pruned dependencies,
  current compiled output and current migrations mounted read-only into a
  private-network disposable fixture. This is not a newly rebuilt exact release
  image; the preceding production image and full integration/load checkpoint
  below predate this formatter change. No deployment, publication or send occurred.

### Authenticated read-load acceptance and cold-login deadlock investigation

Outcome: the final exact-runtime read workload passed, the reproduced first-
session concurrency failure is fixed, and corrected full functional acceptance
passed. Public launch and whole-customer/hosted acceptance remain unapproved and
unfinished. The following entries preserve the failed-to-successful chronology.

- Current production dependency audit exited 0: zero known advisories at every
  severity across 549 production dependencies. This is a point-in-time registry
  audit, not a complete vulnerability/security assessment.
- Added an isolated synthetic authenticated read-load harness and
  [predefined methodology](SYNTHETIC_CUSTOMER_LOAD.md). It uses 100 accounts,
  10,000 candidates, real HTTP logins/signed sessions, warmup and owner-isolation
  checks, then 5/20/100 concurrent actor tiers. Providers stay disabled.
- Initial runtime build passed 519 units / 51 files (52.37s), type checks,
  compilation and offline production-dependency pruning. Image
  `sha256:a1c7474f3e3d293660a3c6ceaaf1879ec0cf85a54727c64cc9fb022ad1bc9a7c`
  passed the compiled-production smoke script. It predates the login fix below.
- Failed attempts are retained, not capacity evidence: reducing the running
  disposable MySQL fixture to 512 MiB caused exit 137 / OOMKilled before app
  startup. The next fixture uses one CPU / 1 GiB; the app stays one CPU / 512 MiB.
  The first seeder used logical field names rather than SQL column names and
  failed before committed fixture creation. That harness error was corrected.
  One retry also raced startup migrations; the harness now waits for application
  readiness, bounded at 30 seconds, before requiring empty tables.
- Two correctly seeded cold-login attempts failed at HTTP 503 before timed load.
  Later anonymous diagnostic credential attempts reached the expected 401.
  An initial restricted scan of the task-owned MySQL engine output found a
  recorded deadlock and quota-table mentions, but was not confined to the
  latest-deadlock section. It was therefore not sufficient to attribute the
  HTTP failure to quota admission; the later isolated section identified
  session-table insertion/gap locks instead. No SQL, credential, cookie, raw
  candidate record or hashed source address was printed.
- Added a bounded retry of the complete login-admission transaction, only for
  confirmed MySQL `ER_LOCK_DEADLOCK` / errno 1213 after rollback, at most three
  attempts. Quota denials, timeouts, network/commit ambiguity and other failures
  still fail closed. Six focused tests passed; the harness also requires 100
  successful real logins to consume exactly 100 durable global admissions.
- Post-fix production build and rerun results must be recorded below before
  declaring that original cold-login reproduction or any load tier passed.
  Browser/mail/intake/write-workflow/hosted/customer-pilot acceptance and the
  worldwide-source inventory remain separate, unfinished release gates.
- Post-fix focused database acceptance exited 0: **15 login-admission tests**
  passed (20.95s). The new minimized cold-start regression repeated ten rounds
  of five simultaneous distinct identities and verified all reached credential
  rejection, each global count was exactly five and each identity/IP counter
  exactly one (462ms). Existing final-slot, blocked-identity, source-IP, expiry,
  unavailable-storage and compiled-server restart checks also passed. This used
  the prior locked test-dependency image with current server and compiled-output
  read-only mounts; the disposable test runner itself needed writable internal
  storage for Vitest's configuration cache. Earlier read-only test-runner startup
  attempts failed on package-manager/cache writes and were not test passes.
- The new production rebuild's type checks, **525 units / 52 files** (50.23s),
  compilation (server 580.8 kB) and offline pruning passed. Packaging and the
  original authenticated-load rerun still need terminal evidence below.
- Original full HTTP login still failed after the defensive quota retry; that
  image `sha256:842a1efd376ad213aad1d7ebfaf2bff09e5c6201bacf3694e0fa03c003e61960`
  is retained as a failed end-to-end attempt, not a successful capacity result.
  A minimal cold-session regression then failed against the old session cleanup:
  three of five simultaneous first-session creations rejected (test process
  exit 1, 2.16s). Restricting the engine diagnostic to its latest-deadlock section
  showed session-table insertion-intent waits, without quota-table involvement.
- Session creation held its correct owner lock but range-deleted expired rows
  even when none existed. Changed it to a non-locking read of existing expired
  session primary keys, followed by deletion of only those owner-scoped keys;
  when none exist it skips deletion. Password/recovery/deletion fences remain
  checked under the same user lock, and active sessions remain intact.
- Post-fix login/session acceptance exited 0: **20 tests / two files** (19.52s),
  including ten cold-session rounds, ten cold-quota rounds, active-session
  preservation, password-fence checks, persisted revocation/expiry and restart
  guards. Type checks and compilation passed (server 581.1 kB). Temporary
  diagnostic source was removed from the app; its private synthetic output
  receipt remains outside the build context. The final exact-runtime HTTP load
  still must be observed before claiming the original failure resolved.
- First broader post-fix integration attempt was invalid: the runner omitted
  `MIGRATION_TEST_ROOT_PASSWORD`, preventing the 34 migration fixtures from
  starting, and its 512 MiB runner / 1 GiB tmpfs-backed database were later
  out-of-memory killed during this larger suite. Terminal exit 1: 474 passed,
  five failed, 57 skipped, two worker errors (238.23s); neither the aggregate nor
  late connection-refused errors are a successful regression result. The full
  functional rerun uses correctly supplied synthetic fixture credentials and
  2 GiB test-runner / 2 GiB tmpfs-database limits. These larger stress fixtures
  are distinct from the 10,000-candidate load envelope, which remains one CPU /
  512 MiB for the app and one CPU / 1 GiB for a freshly restarted database. No
  host/vendor sizing, paid capacity or deployment decision is inferred.
- **Final checkpoint:** exact-runtime authenticated read-load exited 0 on
  `sha256:dacb0f107d9573bd9f66073741461a9559b2fcdd5272cafc343f7d150e39cdd6`.
  All 100 real logins succeeded (p95 570.42ms) with exactly 100 committed durable
  admissions. All 600 warmup requests and 300 owner-isolation denials passed.
  Each measured tier made 6,000 requests: five actors had 6,000 successes / p95
  66.60ms; twenty actors had 6,000 successes / p95 195.41ms; one hundred actors
  had 917 successes / successful-response p95 1,054.21ms and 5,083 controlled
  HTTP 503 responses with valid Retry-After. Across all 18,000 attempts there
  were zero transport errors, correctness failures or bad retry headers.
  These are closed-loop read tests, not 100-active-user capacity or fair service
  guarantees; no retries, browser think time, hosted network or TLS were included.
- This final load ran in a **separate fresh private namespace**:
  `cofounder-synthetic-readload-db-20261001` (one CPU / 1 GiB memory/swap, 768 MiB
  tmpfs); app `cofounder-synthetic-readload-app-20261001` (one CPU / 512 MiB,
  UID/GID 1000:1000, read-only, protected secret files); runner
  `cofounder-synthetic-readload-runner-20261001` (one CPU / 512 MiB). Memory
  snapshots during/after: app 206.7/186.7 MiB, database 701.1/703.1 MiB; these
  are not peak values. Post-overload production smoke passed. A separate reuse
  runner correctly refused non-empty tables before seeding (expected exit 1).
- Corrected **full integration acceptance exited 0**: **535 passed / 15 existing
  legacy skips / 32 files**, 272.90s. The functional runner and its distinct
  tmpfs database had 2 GiB limits and correct synthetic migration-admin setup.
  Final production packaging exited 0 after type checks, **525 units / 52 files**,
  compilation and offline production-dependency pruning. Current native type
  checks, formatting and whitespace validation also passed.
- Production app subsequently logged `shutdown_completed` and exited 0 without
  OOM. Both disposable databases were stopped only after their runners finished;
  no real account data was used. Aggregate load JSON and a readable report are
  saved in this task's outputs. No purchase, deployment, public endpoint, live
  outreach, commit, push or merge occurred. The full beta goal remains open:
  representative writes/browser journeys, hosted/provider/privacy/operator
  acceptance, monitoring/recovery and worldwide source coverage are not replaced
  by this successful local read workload.

### Bounded local traffic-record lifetime and retry responses

- Previous goal turn classification: verified production configuration and
  mounted-secret progress. Current source inspection found that the local traffic
  map retained expired keys indefinitely and grew without a capacity bound. This
  affects a continuously running free beta under its proposed memory limits.
- Replaced the unbounded map with a 10,000-record counter store and equally bounded
  expiry heap. Expiration removes all eligible records, not only a returning key;
  repeated attempts add no expiry records. Per-process salted hashes replace raw
  keys. Existing active quotas are never evicted to admit new clients. Invalid
  configuration/key/window/clock inputs fail without echoing identifiers; a zero
  allowance rejects without allocating state. Current route allowances are unchanged.
- Added periodic idle cleanup, started only on successful server listen, unreferenced
  and stopped during shutdown without clearing active quotas mid-drain. Lazy expiry
  also runs before consumption. The API-design skill informed 429 for depleted
  quotas versus 503 for full-guard capacity and retry headers. Registration,
  verification resend, reset completion and HAI use these decisions. Durable login,
  account-mail, outreach and retained-record controls are unchanged.
- Nine guard tests passed, including 12,000-key pressure, a 3,000-step reference
  model across mixed deadlines, idle timer lifecycle, no active-quota eviction,
  invalid/zero limits and actual HTTP 429/503 with Retry-After. Two additional real
  HAI HTTP tests passed without provider/DB access. Mounted server tests prove the
  first five weak registration attempts are rejected before storage, followed by
  the sixth receiving 429 with the remaining hourly delay. Four signal/dev/pause
  process cases passed; TypeScript and production build passed (Vite 4.12s,
  server bundle 580.0 kB). Full final native units passed **519 tests / 51 files**
  (65.83s), including both new guard files. Production-model checks passed all
  **9 tests** (1.68s). Full declared database suite then passed **532 tests /
  15 existing legacy skips / 32 files** (186.57s), runner exit **0**.
  `cofounder-traffic-acceptance-20261001` used the prior fresh locked-dependency
  test image with current server source and newly compiled bundles mounted
  read-only, retaining its verified TypeScript/Vitest aliases and serial settings.
  This is current-source integration evidence, not a rebuilt production image.
- Added a reproducible guard-only synthetic stress script. It completed in a
  network-disabled, read-only, UID-1000 test container with one CPU/512 MiB and
  no inherited credentials. **200,000 attempts** admitted exactly **10,000** new
  keys and denied **190,000** without evicting an existing quota; explicit expiry
  then returned both indexes to zero. Observed admission+GC time **603ms**, heap
  **7,382,528 -> 9,359,840 bytes**, RSS snapshot **85,311,488 bytes**, post-cleanup
  heap **7,609,944 bytes**. These are one fixture's snapshots, not peak-memory,
  HTTP/customer/DB load, production hosting or guaranteed performance evidence.
  The script explicitly reports `customerLoadAcceptance: false`; exit was **0**.
- This is bounded local traffic state, not durable/fleet-wide quotas, anonymity,
  full retention approval, edge abuse protection, representative measured load or
  invoice enforcement. Restart resets transient allowances; abusive new keys can
  fill shared capacity. Keep one instance and all launch/permission gates active.
  No customer record, provider, purchase, public service, commit or publication
  has been changed. Prior packaged image receipts predate this increment.
- Native and Docker acceptance processes finished, and the scoped synthetic DB
  was stopped only after observing integration exit zero. Stress and DB fixtures
  are terminal; only temporary synthetic MySQL contents were discarded. Syntax,
  affected-file formatting and tracked whitespace checks passed. No public CI,
  deployment, live sending, secret/permission change, commit, merge or purchase
  occurred. Comprehensive customer load, distributed traffic guards, edge filtering,
  hosting/mail/operator/privacy acceptance and the remaining full goal stay open.

### Standalone production configuration and mounted-secret runtime

- Previous goal turn classification: verified HTTP failure-boundary progress.
  Inspected the actual container/operator path and found only the local Compose
  definition, with example database/session secrets. Added a separate standalone
  application-only production definition, not a mutation of that local stack.
  It requires reviewed image/origin and file-backed private database/session
  credentials; database hosting and TLS proxy remain external operator choices.
- The Docker-patterns skill informed non-root identity, file-backed secrets,
  privilege/storage bounds, loopback exposure and finite resource/log settings.
  Initial one-CPU/512-MiB/320-MiB-heap limits are not measured beta capacity or
  billing enforcement. All launch gates remain closed and outreach is paused.
  The optional mail overlay requires sender and independent secrets explicitly,
  and does not enable registration, outreach or retention deletion.
- Implemented bounded single-line UTF-8 secret-file resolution for six supported
  variables, rejecting conflicts, missing/invalid files and non-regular sources.
  Updated actual configuration, database, startup migration, imported environment,
  credential encryption and packaged operator consumers; did not copy secrets into
  `process.env` or assume a global `_FILE` convention for independent tools.
  Git/build-context exclusion for `.secrets/` and `*.secret` is a supplementary
  guard, not a full secret scanner or encrypted vault.
- Focused application checks passed **29 tests**; full native units passed **508
  tests in 49 files** (62.28s). TypeScript and production build passed (Vite 4.58s).
  Actual read-only Compose-model tests passed **9 cases** (2.07s), after correcting
  a numeric-string assertion difference in the installed Compose output. These
  check configuration, not runtime host enforcement. Prepared CI invocation.
- Corrected a harness precondition discovered during inspection: compiled-server
  acceptance belonged in the build-backed integration suite, not unit tests that
  run before build on a fresh checkout. Moved that case and expanded it to verify
  file-backed production DB readiness, migrations, safe missing-file failure,
  HTTP boundaries and graceful shutdown against the compiled bundle.
- The first cached-dependency integration runner was misconfigured: current source
  was mounted without the current TypeScript/Vitest configuration, losing required
  aliases and the serial-test contract. A separate network-disabled image check
  confirmed the expected Vitest configuration file was absent; do not describe it
  as a current-source acceptance harness. It terminated **exit 1**, **143 passed / 12 failed /
  15 skipped**, with **27 failed / 5 passed files** (72.77s). Import/setup failures,
  concurrent synthetic fixture conflicts and old timeout configuration prevent
  treating this as acceptance. The new three compiled mounted-secret cases did
  pass in that run, but are not a substitute for the complete suite.
- After observing that runner terminal, stopped/restarted only the exact disposable
  tmpfs MySQL fixture, discarding its synthetic test data. Built a fresh frozen-
  dependency test image with the full current configuration, and a fresh production
  image. The successful results below supersede acceptance from that broken harness. No unrelated
  container, customer data, credential, purchase, provider, commit, publication or
  public deployment was changed. Full release gates remain active.
- Added the [production runbook](PRODUCTION_CONTAINER_RUNBOOK.md), including Docker's
  actual file-secret ownership limitation: Compose file mounts do not apply the
  `uid`/`gid`/`mode` remapping. Verify host read access for numeric UID 1000 without
  making secrets world-readable. Windows Desktop mounts are not proof of Linux
  host ownership, and file secrets are not encrypted-at-rest vault storage.
- Fresh full integration runner `cofounder-secret-acceptance-20261001-fresh`
  terminated **exit 0**: **532 passed / 15 skipped / 32 files** (205.45s).
  The 15 skips remain existing disabled legacy conversation/metric tests; no test
  was skipped or timeout increased to resolve the failed harness. Verified current
  TypeScript/shared aliases and serial Vitest setting inside this exact runner.
  It used freshly installed locked dependencies and the compiled production
  bundle in image stage `0edabadf741c`, not the incomplete cached fixture mounts.
- Fresh production image `cofounder-public-beta-candidate-20261001-secrets`:
  `sha256:6469a7a13a88359c46fcbc69a2c4784501418e6875cfc98b1f9af7f78788cb0f`.
  Its actual Dockerfile build passed TypeScript, **508 Linux unit tests / 49 files**
  (55.68s), production build and offline pruned packaging (546 packages reused,
  zero additional packaging downloads). A separate integration-target build also
  completed successfully. A transient registry DNS error retried successfully;
  neither shared Docker nor existing services were restarted for it.
- Exact production runtime `cofounder-secret-runtime-20261001` passed the updated
  synthetic smoke twice, including restart. Real mounted files were read-only,
  raw database/session environment variables were absent, UID was **1000**, and
  image startup migrations/readiness/HTTP boundaries/client assets succeeded.
  Container inspection confirmed 512 MiB memory/swap ceilings, one CPU, 256 PIDs,
  read-only root and **no published ports**, under the proposed resource settings.
  Both startup/drain cycles logged completion and exit was **0**. No standalone
  production Compose deployment, native Linux host permission, rendered browser,
  representative load, real mail, TLS or live-provider acceptance is claimed.
- Final model checks passed all **9 tests** from both repository and application
  working directories after correcting the harness's working-directory dependency.
  Root recovery units passed **16 tests** (2.77s); frozen offline lockfile-only
  validation, syntax, affected-file formatting and tracked whitespace checks
  passed. Runtime, integration and synthetic DB fixtures are now stopped with
  terminal receipts; only disposable tmpfs test data was discarded. The separate
  synthetic mount files remain available outside the build context. No customer
  record, provider action, paid resource, commit, merge or publication occurred.

### Privacy-safe HTTP failure boundaries

- Previous goal turn classification: verified production packaging progress.
  Continued local work under the EUR 100/month planning ceiling, without purchase
  authority. The API-design skill informed appropriate failure statuses and
  bounded responses. No new provider, deployment or external action was enabled.
- Added explicit API-not-found handling before both Vite and production SPA
  fallbacks, so unknown API routes return JSON 404 instead of HTML success.
  Path validation rejects malformed encodings before dispatch. The outer Express
  error handler maps known parser/decompression failures to safe 400/413/415
  responses; unexpected errors are generic 500. Existing procedure envelopes and
  explicitly handled route contracts remain intact.
- Correlation IDs are now generated by the server rather than reflecting arbitrary
  caller headers. New outer errors are private/no-store, expose no raw body, URL,
  stack or credential, and unexpected-failure events include only the generated ID.
  A failure after response headers closes the partial connection without handing
  raw error details to the default logger. This does not sanitize every existing
  imported application logger or replace a complete security review.
- Real-socket tests cover malformed JSON, JSON/form size, unsupported transport
  metadata, invalid compression, excessive nesting, malformed paths, API 404s,
  SPA fallback, internal-error privacy and interrupted partial responses.
  Extended real-application process tests cover test/development modes, paused
  admission and a fifth case using the compiled production server. Synthetic
  production configuration uses an unreachable database placeholder: these HTTP
  checks do not read customer data or prove database readiness.
- Initial focused run passed 12 cases and failed one test-runner assertion (not an
  application behavior); replaced the unsupported assertion without weakening it.
  The next checkpoint passed 14 focused cases, followed by 10 socket cases after
  adding invalid compression/nesting. A full intermediate unit run passed 490
  tests in 48 files (59.34s), before the last two added cases. Final verification
  passed **492 tests in 48 files** (60.11s), including all five real-process cases
  against the freshly compiled server. TypeScript and the production build passed
  (Vite 3.65s, server bundle 574.0 kB). Affected-file formatting, smoke-script
  syntax and tracked whitespace checks passed. Legacy fallback tests still print
  expected unavailable-provider diagnostics; they are not live-provider proof.
- Updated the production smoke script for these boundaries and prepared its
  existing CI path. The prior packaged image predates this increment; it has not
  been rebuilt or retested here. No remote CI, rendered browser, live provider,
  public hosting, legal acceptance, commit, merge or publication is claimed.

### Full database acceptance and locked non-root runtime image

- Previous goal turn classification: verified outstanding-work admission progress.
  Revalidated current source and ran the entire declared database integration suite
  with the new default 32-slot ceiling, not only its focused admission tests.
  `cofounder-release-integration-20261001-admission` exited **0**: **529 passed,
  15 skipped, 31 files** (239.20s). The skips are existing disabled legacy
  conversation/metric tests in `phase22.test.ts`; they are not acceptance evidence.
  Covered account security, operator enrollment, request/processing/ownership,
  export, migrations, quotas, capacity, imports, candidate and outreach workflows.
- The suite used cached test dependencies with current source/compiled assets
  mounted read-only and an isolated synthetic tmpfs MySQL namespace. No ports or
  live providers were exposed. A Docker/WSL inspection timed out transiently;
  reobserved the same running handles without restarting them. Terminal state and
  final test summary were independently checked.
- A separate full production Docker build exposed a packaging problem: legacy
  `pnpm deploy` disables frozen deployment and performs another resolution after
  the frozen workspace install. Confirmed this in installed pnpm source and
  official deployment documentation; did not assume the resulting dependency graph
  matched tested dependencies. The baseline image also failed the new non-root
  runtime assertion. These findings led to actual packaging/runtime changes.
- Added repository `.npmrc` injection configuration and matching lockfile metadata;
  removed legacy deployment in favour of lockfile-based **offline** production
  packaging. A first isolated probe correctly refused mismatched settings; the
  corrected probe exited **0**, reusing 546 packages with **zero downloads** in a
  network-disabled container. Frozen offline lockfile-only validation passed.
  Normalized lockfile hashes matched the prior frozen snapshot after removing
  only the new injection-setting line: no dependency version changes occurred.
- Pinned the Node 22 base to the inspected registry digest, with explicit
  `NODE_IMAGE` selection, and made the runtime `USER node`. Compose adds read-only
  root storage, a 64 MiB no-execute temporary mount, dropped capabilities,
  no-new-privileges and a 256-process limit. It now forwards `API_MAX_ACTIVE_WORK`.
  Native Compose validation passed; the WSL CLI lacked its Compose plugin, so no
  plugin was installed or shared service changed. Secret-free selected model fields
  confirmed these settings without printing the full environment.
- Revised production image:
  `cofounder-public-beta-candidate-20261001-locked`, ID
  `sha256:a6bf0c74b1c6b0bd000c0dc4c8adf7cb4df53be6a00ca219444889bee0c5aa96`.
  The actual Dockerfile build completed frozen dependency installation, TypeScript,
  application unit tests, client/server builds and offline pruned packaging.
  The earlier full Linux build explicitly passed **481 unit tests in 47 files**
  (54.45s); the revised build reran the checks successfully. Base/runtime observed
  Node **22.23.3**, Linux amd64; no native Windows-container or other-architecture
  acceptance is claimed.
- Added `scripts/production-smoke.mjs` and prepared its CI invocation through stdin.
  It ran successfully in the exact pruned image, with the checked source/development
  paths and `.env` absent, under default non-root identity, read-only storage and
  dropped privileges. This path check is not a full image secret scan.
  Verified synthetic DB readiness, compiled asset serving/cache/security headers,
  anonymous account response, oversized batch denial, legacy/HAI denial and
  cross-origin rejection. It passed again after restarting the same container;
  both migration/start/shutdown cycles completed and container exit was **0**.
- Root recovery unit checks passed **16 tests** (2.33s). Script syntax,
  affected-file formatting and tracked whitespace checks passed. The Docker-patterns
  skill informed immutable base, non-root and isolation changes. Runtime/DB fixtures
  are stopped; synthetic tmpfs data was discarded, and stopped receipts/images
  remain inspectable. No customer data or unrelated containers were changed.
- This proves bounded local integration/image/runtime behaviour, not remote GitHub
  CI, rendered browser acceptance, live provider/inbox delivery, worldwide platform
  or legal coverage, disaster recovery, representative capacity, paid hosting or
  public-beta completion. No commit, merge, purchase, publication or deployment
  occurred. Full release gates remain active, with privacy/retention approvals and
  real operational acceptance still outstanding.

### Bounded outstanding API work and pause behaviour

- Previous goal turn classification: verified HTTP batch-limit progress. Inspection
  found the existing shutdown work tracker correctly drained admitted operations
  but imposed no concurrency ceiling. This increment bounds that actual tracker,
  rather than treating socket closure as completion of database work.
- `API_MAX_ACTIVE_WORK` defaults to **32 per process**, accepts whole decimals
  0-1024 and rejects explicitly empty/invalid values. Zero pauses admission.
  Slots are reserved synchronously before invocation, with no waiting queue, and
  remain reserved through operation settlement even after client disconnection.
  Failed work releases slots; reduced limits do not evict already admitted work.
  Shutdown still fences new work and drains existing work before storage closure.
- The shared pool covers context creation, procedures, readiness and the HAI feed.
  Overload rejects before invoking new work, with `SERVICE_UNAVAILABLE`; the mounted
  tRPC adapter supplies `Retry-After: 1` when temporary-unavailable errors occur.
  Readiness reports `application_busy` during pause, while liveness remains HTTP 200. Mixed batches retain their per-operation outcomes, not an atomic batch promise.
- Regression baseline exposed four failures: unbounded extra work, no lowered/zero
  admission enforcement and missing configuration. The initial held-operation test
  timed out; refined it to assert invocation count before waiting and always settle
  synthetic work. Six focused admission tests now cover exact limits, sync/async
  failure release, decrease/shutdown, invalid/zero limits, configuration and real
  HTTP disconnection. The disconnected request stayed counted, a second received
  HTTP 503, and later work succeeded only after the first operation settled.
- Full application unit run passed **481 tests in 47 files** (60.73s, terminal
  exit 0). After response-header/readiness refinements, final focused acceptance
  passed **17 tests in four files** (14.78s), including actual running-server pause,
  retry hint, health/readiness and shutdown checks. Final TypeScript and production
  build passed (Vite 4.67s, server bundle 571.9 kB). Affected-file formatting and
  tracked whitespace checks passed. Customer-database integration and browser
  acceptance were not rerun in this increment.
- README/environment example now explain covered work, restart requirement and
  limits. The API-design skill informed explicit overload/status behaviour. This
  is not durable or fleet-wide admission, a request-rate limit, cost enforcement
  or measured hosting capacity. Mail/retention workers, operator tools, body parsing,
  static assets and unsupported legacy paths are outside this pool. Legacy paths
  remain disabled; full traffic/load/budget/live acceptance remains release work.
  No customer data, purchases, provider actions, commits, publication or deployment
  occurred. The full public-beta goal remains active.

### Bounded HTTP batch amplification

- Previous goal turn classification: verified retention-policy preparation, not
  approved retention or completed erasure. Current-source inspection identified
  unlimited HTTP operation batches before existing account controls. This increment
  closes that request-amplification gap without claiming full traffic protection.
- Added a shared **20-operation** ceiling, a typed bounded Express/tRPC factory
  mounted by the real server, and matching browser `httpBatchLink.maxItems`.
  The adapter rejects oversized GET/POST batches with HTTP 400 before account
  context or procedures run. Caller options cannot remove the ceiling, and the
  wrapper does not mutate the supplied options. No dependency or migration changed.
- Regression reproduction first confirmed both oversized GET/POST batches returned
  HTTP 200 under the prior unbounded adapter. After implementation, six real HTTP
  tests passed: both rejection paths, option override/nonmutation, exact-limit
  admission and 45-operation query/mutation bursts split 20/20/5 without lost work.
- Three actual application-process tests additionally exercised the mounted
  adapter with anonymous `auth.me`: 21-operation rejection and 20-operation success
  in test/development runs, followed by clean SIGTERM/SIGINT/HMR shutdown. Together,
  the final focused run passed **nine tests in two files** (10.02s).
- TypeScript passed after fixing the generic options-copy inference without an
  unsafe cast. Production build passed (Vite 4.58s, server bundle 571.0 kB).
  Final application unit suite passed **474 tests in 46 files** (55.94s, terminal
  exit 0); affected-file formatting and tracked whitespace checks passed.
  No browser UI acceptance, customer-database integration, release-image build,
  live load/edge configuration or provider acceptance is claimed by these tests.
- The API-design skill informed the rejection contract and client/server boundary.
  The 1 MiB body parser still precedes batch admission. This is not request-rate,
  per-account/fleet concurrency or monetary enforcement; those remain release work.
  No purchase, publication, deployment, live send or customer-data mutation occurred.

### Retention and erasure policy preparation

- Previous goal turn classification: verified reviewed-processing progress, not
  completed erasure. This increment prepares an unapproved
  [retention and erasure decision draft](ACCOUNT_RETENTION_ERASURE_POLICY.md),
  linked from the README and operator runbook. It does not activate cleanup,
  authorize live deletion or establish worldwide compliance.
- Current-source inventory check found all **42 manifest keys exactly once** in
  seven policy classes: 37 owned and five shared. This checks table coverage only;
  field-level purposes, opaque JSON, external stores and actual obligations remain
  review work. Mail cleanup and backup descriptions were checked against source.
- Official GDPR text and Belastingdienst guidance inform conditional legal
  constraints, not assumed jurisdiction or approved durations. Proposed 30/90/365-day
  targets remain distinct from current opt-in mail retention. Financial exceptions
  require actual applicable obligations and minimized scope.
- The documentation skill's independent reader check correctly distinguished
  suspension from erasure and proposed periods from active settings. Feedback led
  to explicit policy/release/live-operation approval layers, scope closure criteria,
  provider/backup evidence and reviewer requirements, a defined receipt clock,
  plain-language terms and an activation-owner/evidence checklist.
- Independent reader re-check found those material ambiguities resolved; final
  glossary refinements clarify controller/processor and restore-suppression terms.
  Table coverage, local policy links, affected-document formatting and tracked
  whitespace checks passed. Reader testing is not legal or operational acceptance.
- No runtime code, retention setting or personal data changed in this increment.
  No purchase, provider action, live account suspension, deployment or publication
  occurred. Runtime tests were not rerun for these documentation-only changes.
  The full public-beta goal remains active; approved rules, field-level execution,
  restore suppression and live operational/privacy acceptance are still required.

### Reviewed account-deletion processing preparation

- Previous goal turn classification: verified platform-catalogue progress. The
  existing work fence was an internal primitive with no reviewed processing path.
  This increment adds controlled operator suspension tied to a specific current
  deletion request. It does not implement erasure or shrink the full beta scope.
- Added `beginReviewedDeletionProcessing` and compiled
  `dist/process-account-deletion.js`, with the development
  `account:deletion:process` entry point and
  [processing runbook](ACCOUNT_DELETION_PROCESSING_RUNBOOK.md). The command offers
  read-only inspection and explicit `--suspend`, not deletion or resumption.
  Operator authority/identity remains independently established; audit references
  are assertions, not authentication or automatic legal approval.
- The owner-first transaction requires exact account email, current password
  version, verified account, pending request UUID/revision and explicit suspension
  confirmation. It atomically records processing evidence, sets the fence, clears
  verification/recovery links and revokes sessions. Customer records are preserved.
  Identical concurrent retries share the original fence and one receipt; altered,
  withdrawn, unrelated-fenced or duplicate/inconsistent receipt states fail closed.
  Audit failure rolls back. Receipt lookup is bounded to two rows for reconciliation.
- The new three database regressions failed before implementation, then the
  initial focused run passed 46 cases. Nine command argument/help/storage tests
  first failed with the script missing, then passed without loading database code
  for help/invalid input. Added compiled-command check/suspension/retry and existing
  unrelated-fence rejection to the real MySQL suite.
- Compiled inspection exposed a packaging requirement: the preflight's dynamically
  required manifest would not be present beside the new bundle. Changed it to a
  static JSON import embedded by the bundler. TypeScript now checks the new command
  and existing admin-enrollment script explicitly and supports JSON imports.
  Existing live-schema and malformed-request checks remain enforced.
- Final detached synthetic MySQL acceptance passed **90 tests in four files**
  (47.84s, terminal exit 0): fence/processing, request/withdrawal, ownership preflight
  and operator queue review. The compiled CLI exercised the actual bundled schema
  check and transaction with token/identity-safe receipts. No schema migration or
  dependency install was needed. The broader integration suite was not rerun.
- Root tests passed **16 recovery tests plus 468 application unit tests in 45
  files** (application duration 58.06s). TypeScript and production build passed
  (Vite 4.93s), followed by rebundling the bounded receipt lookup. Affected-file
  formatting and whitespace validation passed. No new browser acceptance is claimed:
  no customer UI changed in this phase.
- Suspension prevents normal account use and self-service withdrawal/status; the
  runbook requires a coordinated support channel and does not pretend notification
  or a fenced-user portal exists. Retention/financial exceptions, mail/provider
  reconciliation, dependency-safe erasure/final receipt, backup restore suppression
  and live organizational/privacy acceptance remain unfinished. A policy direction
  question was sent to Robert without assuming legal approval or live-erasure authority.
- All work remains local/uncommitted. No live customer account, provider operation,
  purchase, deployment, permission, commit, push or merge changed. The scoped tmpfs
  test database is stopped after terminal test acceptance, discarding synthetic
  fixtures only; no shared Docker service was restarted or changed.

### African discovery coverage and unresolved Asian leads

- Previous turn classification: verified administrator-recovery progress. This
  increment addresses the worldwide platform workstream, without claiming the
  beta or global inventory is complete. The EUR 100/month ceiling is unchanged.
- Used regional searches and official public pages, including the matching,
  terms and privacy pages where available. Firecrawl/Exa were unavailable; the
  web reader supplied the evidence. The competitive scoring skill was inspected
  but is inapplicable to discovery channels. Research uncertainty distinctions
  informed the added metadata and withheld leads.
- Added SharakaLab (Morocco/Africa), Revise Africa (waiting-list matching) and
  COUSINS (Ghana-first early-access network) to the customer catalogue. All are
  discovery-only, with October 1 evidence dates. Revise's inconsistent privacy
  wording is recorded; none is recommended as policy-approved, fully available,
  scraped, connected or live-tested. Untouched records retain their earlier dates.
- CoPath's official page timed out twice; CRIB's matching page is dated 2018 and
  current event access/cost could not be established. Both remain research leads,
  not published sources or permissions. The source review now distinguishes
  35 reviewed inventory records, 34 customer-visible records and two unresolved
  additional leads. Public categories: 10 dedicated / 12 community / 12 program.
- The new catalogue regression failed at the previous count before additions.
  After implementation, 55 tests passed across four source/catalogue/admission
  files (3.81s). Tests exercise real source resolution, individual intake and CSV
  admission before unavailable storage, including URL-only and manual-label bypass
  attempts. New entries do not silently become import or outreach capabilities.
- Updated the README and dated source review. No schema, dependency, purchase,
  external message, signup, provider form, deployment, commit, push or merge.
  Provider authentication/policy acceptance, multilingual/worldwide completeness
  and the remaining production gates are still open.
- TypeScript, affected-file formatting, Git whitespace validation and production
  build passed after the additions (Vite 4.09s; server bundle 570.1 kB). No UI
  implementation changed; source search/rendering is covered by the focused
  tests, not a new connected-browser or full-database acceptance run. No broader
  suite pass is inferred from this data-only increment.

### Reviewed lost-all-passkeys recovery

- Previous turn classification: verified initial-enrollment progress. This phase
  adds the missing local recovery operation, not full production readiness.
  EUR 100/month remains a planning ceiling; no purchase, deployment, provider
  message, commit, push or merge was performed.
- Added internal `inspectAdminRecovery` / `recoverAdminPasskeys` primitives and
  separate `--recovery-check` / `--recover` modes to the existing compiled operator
  command. Initial `--issue` still cannot reset existing keys. Recovery requires
  exact target/origin, bounded reviewer references, explicit lost-all-keys
  confirmation and a digest binding current credentials, factor inventory and
  generation. References and digests are assertions/stale-review guards, not
  independent operator authentication.
- One owner-locked transaction removes the reviewed factors, revokes all sessions,
  clears challenges, rotates the user handle, issues a ten-minute replacement
  grant and records the audit. Attempt quotas are preserved. The holder must
  sign in again, confirm the current password, enroll and separately prove a new
  key before privileged access. Audit failure rolls back the reset. Changed
  factors/credentials and replay fail; concurrent resets have one winner.
- Reused the private POSIX output protection and lazy database imports. Existing
  files are not overwritten; unsafe output paths and Windows issuance are denied.
  Token-file/commit uncertainty still requires operator investigation, not an
  automatic repeat. Cleanup now attempts database closure even if file closure
  fails. No schema migration or new dependency was needed.
- New regression tests first failed because recovery primitives did not exist.
  The initial green focused run passed 44 MySQL/compiled-command checks. The
  additional audit-failure test passed. A new interleaving fixture initially
  attempted to await recovery from inside a verifier holding the same owner lock;
  this self-deadlocked and caused a subsequent fixture failure. The test was
  corrected to queue the independent recovery caller, verify stale-review
  rejection after successful proof, then prove a freshly reviewed reset revokes
  that elevation. No lock or timeout was relaxed.
- Fresh root tests passed 16 database-recovery unit tests and 455 application
  unit tests in 44 files (application duration 63.88s). The focused security/
  command subset also passed 63 tests in three files. TypeScript, production
  build, affected source formatting and Git whitespace checks passed.
- Final focused MySQL/compiled-command acceptance passed **46 tests in two
  files** (33.02s, terminal exit 0), including removal of both the original and
  backup factors, old-session/challenge rejection, quota preservation, replacement
  enrollment and step-up, replay/concurrency/stale review, audit rollback and
  serialization with in-flight real cryptographic proof. Tests used synthetic
  accounts/keys on an isolated no-network MySQL tmpfs, not customer data or a
  human/device acceptance. The broader integration suite was not rerun for this
  increment; its prior dated evidence remains below. The stopped synthetic test
  database discards its temporary fixtures; no shared container was changed.
- Added the [recovery runbook](ADMIN_RECOVERY_RUNBOOK.md), linked it from the
  enrollment runbook, MFA contract and README. Human identity policy, independently
  delivered reset notification, controlled operator host, real devices/public
  HTTPS and organizational acceptance remain open. No recovery browser/hardware
  acceptance or fresh release-container build is claimed for this phase.

### Controlled operator initial-enrollment command

- Previous goal turn classification: verified browser-security progress. This
  increment implements the missing operator first-enrollment path, not lost-factor
  recovery or the full beta. All work remains local/uncommitted, with the EUR
  100/month planning ceiling unchanged and no paid/provider/live action.
- Added `scripts/admin-enrollment.ts`, the development `admin:enrollment` command,
  compiled `dist/admin-enrollment.js` in the production build, and the
  [operator runbook](ADMIN_ENROLLMENT_RUNBOOK.md). `--check` does not create security
  state, audit rows or authority. `--issue` requires exact account/email/origin,
  current eligible administrator state, explicit confirmation and bounded operator
  and approval references. These references are audit assertions, not independent
  human authentication. Human identity/authority review still needs operator sign-off.
- Issuance rechecks under the account lock, refuses existing factors and refuses
  to replace a live approval. Concurrent commands yield one approval. The raw
  token goes only into an exclusively created, synced private POSIX file; stdout
  and audits remain token-free. Existing files/symlinks, broadly accessible output
  directories and Windows issuance are refused. Windows help/check remain available;
  mode bits are not falsely presented as Windows ACL enforcement. New `.admin-grant`
  files are ignored by Git. No public grant/reset endpoint or role promotion exists.
- Test-first command checks initially failed with the entry point missing. An
  initial table-test argument-shape defect was corrected before acceptance.
  After implementation, two command tests hit their existing process time limits
  while loading database modules before help/argument handling. Deferring database
  imports until validated execution made all **13 command tests** pass without
  increasing timeouts. The runbook covers unknown commit/output outcomes, review,
  expiry, cleanup and the prohibition on using this path for lost-factor recovery.
- Fresh root `pnpm test` passed **16 recovery unit tests plus 451 application tests
  in 44 files** (61.67s application suite). TypeScript, scoped Prettier and
  production build passed (Vite 7.74s; server 567.4 kB; new command 179.2 kB).
  The compiled command's help also ran directly without `tsx`. Production dependency
  audit reported **no known vulnerabilities**, not a security certification.
- Docker launch/observation requests stalled and later completed on the shared
  local daemon. A cancelled task-specific launch reached migration before it
  exited, leaving the disposable database partly initialized. Both runners were
  confirmed terminal before resetting only the named tmpfs test database; the
  next read confirmed zero application tables before migrations. No daemon restart,
  shared-container changes or customer-data deletion was performed. A subsequent
  attached run exited 129 at the turn boundary; it was not counted as passed.
  The existing test container was then started detached and its actual terminal
  status/logs were checked. No timeout or assertion was relaxed.
- The final focused MySQL run passed **38 tests in two files** (25.96s): all 26
  existing MFA cases and 12 new compiled-command cases. They verify read-only
  inspection, private file mode, digest/audit persistence, token-free stdout,
  simultaneous/active approval rejection, wrong email/origin/role/verification/
  fence rejection, preservation of existing files/symlinks, unsafe directory
  rejection, usable first enrollment and refusal to reset existing factors.
  Tests used synthetic accounts and real signed authenticator fixtures, not a
  human identity review or physical device. The application integration script
  now includes this command suite.
- No new migration or dependency was added. The test runner reuses the previously
  built dependency image with current read-only source/compiled mounts; it is not
  fresh release-image evidence. The complete `pnpm db:migrate && pnpm test:integration`
  run then passed **516 tests in 31 files**, with **15 existing legacy skips**
  unchanged (195.52s, container exit 0). This includes the new compiled-command
  suite and the existing account, migration, privacy, capacity and outreach checks.
  The named synthetic tmpfs MySQL container was stopped after all tests finished;
  its temporary fixture database was discarded, not customer data.
  Real HTTPS/devices, operator identity policy acceptance, lost-factor
  recovery, accessibility/cross-browser acceptance and the other beta gates remain.

### Administrator browser enrollment, verification and key management

- Previous goal turn classification: verified durable administrator/API progress.
  This increment implements `/admin/security` and the administrator-only workspace
  link. It preserves the EUR 100/month planning ceiling and does not complete the
  public beta. No commit, push, merge, deployment, purchase or provider send occurred.
- The lazy-loaded screen uses exact `@simplewebauthn/browser` 14.0.0. Relative to
  the pre-install lockfile, only its importer/package/snapshot entries were added;
  incidental package-manager platform-field rewrites were restored. No dependency
  installation overlapped test execution. React guidance kept the browser library
  on the security route, and frontend-test guidance required real compiled browser
  interactions beyond component rendering tests.
- Implemented fresh owner/status gates, first operator-approved enrollment,
  passkey verification, key listing, backup enrollment/removal, expiry display,
  explicit device-prompt cancellation, unavailable/unsupported states and lost-key
  guidance. Password/grant fields clear on submission and bypass client mutation
  caches. No device PIN/private key/biometric form or weaker fallback was added.
- Test-first flow and presentation suites initially failed before implementation;
  all **19 tests** then passed (12 flow, seven presentation). They cover account
  changes, missing/demoted/unverified identity, cancellation, disposal, concurrency,
  persistence-before-success, saving being non-cancellable and safe error messages.
- Connected browser testing exposed two actual defects: a late cancelled request
  replaced newer success with an error, and Chromium rejected the grant field's
  HTML UnicodeSets pattern. Per-action version checks and an escaped hyphen fixed
  them. The rerun retained assertions for both, rather than suppressing errors.
- Final Chromium **148.0.7778.0** run passed **seven workflow checkpoints** against
  actual compiled client/server and isolated MySQL: account gate, registration,
  signed step-up/responsive render, prompt cancellation without proof submission,
  delayed cancellation followed by a new successful ceremony, independent backup
  enrollment/removal with original-key reuse, and refresh after server-side expiry.
  CDP virtual authenticators supplied the real WebAuthn responses; no verifier/API
  success was stubbed. Role/email verification were explicit synthetic DB fixtures,
  and first approval used the real internal issuer, not a completed operator CLI.
  There were **zero browser console/page errors and zero external requests**.
- Desktop **1365x1000** and mobile **375x812** screenshots were inspected; no
  horizontal overflow was observed or measured. Harness/screenshots live outside
  the repository in this workspace's `outputs/admin-security-*` artifacts. This
  is not real-device, cross-browser, keyboard/screen-reader, browser account-switch
  or public HTTPS acceptance.
- Fresh root `pnpm test` passed **16 recovery tests plus 438 application tests in
  43 files** (73.16s application suite). TypeScript and production build passed
  after the browser fixes; the final formatting-only rebuild also passed (Vite
  12.55s, server bundle 567.4 kB). Scoped Prettier and `git diff --check` passed,
  with existing Windows line-ending notices. Production dependency
  audit reported **no known vulnerabilities**, not a security certification.
  Existing legacy missing-provider diagnostics are not live-provider evidence.
- Fresh test-image resolution failed at the Docker registry proxy while resolving
  `node:22-bookworm-slim`. Browser proof instead used an offline test-only image
  combining already-cached browser OS libraries with the earlier server dependency
  image and read-only current sources/built assets. Node 22.23.2 was observed.
  This is deliberately **not a fresh current-lockfile release-image build claim**.
  MySQL used disposable tmpfs, no published ports and a network-disabled namespace;
  the browser/server shared only its loopback namespace. The prior checkpoint's
  504-test database and backup/restore results remain historical, not rerun here.
  After successful test completion, the synthetic MySQL container was stopped,
  discarding its temporary fixture database; no customer data was present.
- Still required: operator initial-enrollment command and lost-factor recovery
  procedure, independently usable real backup devices, HTTPS/operator acceptance,
  accessible keyboard/screen-reader and wider browser acceptance, fresh release
  image, and all other public-beta delivery gates below. Platform coverage and
  live provider permissions were not expanded by this security increment.

### Durable administrator ceremonies and fail-closed API admission

- Previous goal turn classification: verified protocol/dependency progress, with
  no durable MFA enforcement. This increment adds migration **0036**, two reviewed
  account-owned security tables and nullable session elevation. The complete
  product remains unfinished; the EUR 100/month planning ceiling is unchanged.
- `adminProcedure` now derives session identity from the verified cookie and
  requires MySQL-backed, unexpired passkey step-up. It rechecks current admin role,
  verified email, password version, session ownership/expiry/revocation and account
  fencing. Password-only admin sessions fail closed, including `system.notifyOwner`.
  The drain unit test explicitly isolates authorization; real authorization is
  exercised separately against MySQL with signed synthetic authenticator responses.
- Added account-bound `auth.adminMfa` status, enrollment, verification and removal
  routes. First enrollment requires fresh password plus an expiring operator grant
  whose digest alone is stored. Its issuer is internal and cannot reset existing
  factors; no HTTP grant, role promotion or recovery bypass exists. Additional
  factors require current step-up/password. The last factor cannot be removed.
- One two-minute challenge per account is bound to exact session/purpose/origin.
  Consumption commits before verification, surviving invalid proofs and later
  storage failure. Ten ceremony/removal admissions per 15-minute window are durable.
  Enrollment count is capped at five. Counter updates and up-to-five-minute
  session elevation commit together; factor changes clear all elevations.
- Test-first proof: 12 original persistence cases failed before implementation.
  Their first implemented run exposed fixture cleanup blocked by the audit FK;
  cleanup was corrected and only the ten exact, verified synthetic owners/audits
  left by that run were removed. No customer data was touched. Two API-boundary
  tests then reproduced role-only access and passed after enforcement. The new
  account-bound API contract caught an over-strict intermediate input schema;
  endpoint schemas remain strict after that composition correction.
- A deterministic MySQL connection-clock test reproduced elevation after a
  challenge expired during cryptographic verification. Fresh database-clock checks
  now precede the final mutation. The focused suite passed **25 tests** (15.45s),
  covering replay/concurrency, failed-proof/storage consumption, wrong sessions,
  expired/replaced grants, purpose mismatch, counter persistence, current roles/
  credentials/fences, quotas, factor removal, API ownership and private export.
  Real signatures are verified; the test does not fabricate verifier success.
- Both schema inventories now cover **42 application tables: 37 owned categories
  and five shared categories**. MFA exports include reviewed metadata, excluding
  credential identifiers/key blobs/counters/transports and pending security state.
  The current README documents the new migration and the intentional admin lockout
  until the still-unfinished usable setup path is completed.
- Fresh final root `pnpm test` passed **16 recovery unit tests plus 419 application
  unit tests / 41 files** (85.14s application suite). TypeScript and production
  build passed after the expiry fix (Vite 9.63s, server bundle 567.4 kB); scoped
  Prettier passed. Existing legacy fallback diagnostics remain, not live-provider
  acceptance. No dependency installation overlapped these tests.
- The current-lockfile dependency image was rebuilt. A disposable network-disabled
  MySQL backup/restore rehearsal passed (**one integration test, 53.91s**) with all
  37 migrations and new schema, including encrypted artifact/restore guards. The
  harness now explicitly selects the application work directory for migration.
- The first broad database run used an incomplete read-only mount set on that
  dependency image. Child processes could not resolve `@shared` without tsconfig,
  and migration tests could not read the missing root Dockerfile. A minimal actual
  context-module import failed with `ERR_MODULE_NOT_FOUND`; adding only tsconfig
  made it pass. That incomplete-harness run finished with 464 passed, five failed,
  15 skipped and one suite-setup failure (253.15s); it is not accepted as green.
  The corrected runner also mounts the root Dockerfile and Vite configuration.
- The expanded MFA file passed **26 tests**, including the compiled HTTP server:
  cookie-authenticated enrollment, challenge persistence across process restart,
  signed step-up, one-use rejection, private status and revoked-session denial.
  The owner-notification endpoint rejects password-only access before any provider
  call. This test runs on isolated loopback with synthetic credentials/signatures;
  it does not exercise a browser prompt, real authenticator or public TLS.
  The complete corrected `pnpm db:migrate && pnpm test:integration` run passed
  **504 tests / 30 files**, with the **15 existing legacy skips** unchanged
  (202.72s). All previously failing child-server, admission and migration cases
  passed; no timeout or assertion was relaxed and no new skip was added. This
  confirms a test-container mount defect, not a reason to suppress those checks.
- Final production dependency audit (`pnpm audit --prod --audit-level low`) reported
  **no known vulnerabilities** at this checkpoint; that is not a security
  certification. Scoped formatting and `git diff --check` passed, with existing
  Windows line-ending notices. Backup/restore and database tests used disposable,
  network-disabled MySQL only. No release image, live hosting, real inbox, public
  TLS or real authenticator acceptance is claimed. HEAD remains
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; all changes remain local/uncommitted.
- Still required: browser enrollment/step-up/key management, operator grant and
  lost-factor recovery procedures, browser virtual-authenticator
  acceptance, real-device/HTTPS/operator acceptance and the other public-beta
  gates. Middleware admission does not retroactively cancel already-admitted
  external work. No live sending, purchases, deployment, commit, push or merge.

### Administrator passkey verification boundary and dependency patches

- Previous goal turn classification: verified durable-login progress. Current
  inspection confirmed `adminProcedure` is still role-only; administrator MFA is
  a real remaining release gate, including `system.notifyOwner`. This increment
  starts the passkey cryptographic boundary, not completed enrollment or enforcement.
- Added the exact `@simplewebauthn/server` 14.0.3 dependency and an internal
  registration/assertion verifier. Configuration owns origin/RP; UP and UV are
  required; responses, identifiers and handles are bounded; supplied account
  handles must match; signatures and counters are verified. Registration requests
  and accepts none attestation only. Cross-origin embedding is rejected. Safe
  errors do not echo cryptographic material. No private key, external provider
  request, database write, session privilege or route is introduced by this module.
- Test-first workflow: all initial 27 contract cases failed at the missing
  implementation. Independent synthetic COSE/CBOR fixtures use real P-256 and RSA
  signatures rather than mocked verifier results. Expanded suite: **34 passed**.
  A valid packed-attestation test first failed because the broader verifier
  accepted it, then passed with the explicit application none-only guard.
  Counterless authenticators work, but replay prevention remains the responsibility
  of the pending one-use transactional challenge layer.
- The [MFA implementation contract](ADMIN_MFA_DESIGN.md) records the full remaining
  persistence, operator-approved bootstrap, recovery, session binding, authorization,
  browser, privacy and acceptance work. The README explicitly says MFA is not
  enforced. No claim is made that standalone cryptographic tests protect current
  administrator routes or satisfy real-device acceptance.
- A fresh production-dependency audit reported two moderate `qs` advisories and
  one low DOMPurify advisory. Harmless four-element/constructor fixtures reproduced
  both parser defects through the dependency actually resolved by Express; both
  tests failed before patching and passed afterward. This establishes the library
  defects, not exploitability through current app routes. The DOMPurify issue was
  not reproduced in a browser. Maintainer patches were applied through explicit
  workspace overrides: `qs` **6.16.0**, DOMPurify **3.4.16**. Sources:
  [qs array limit](https://github.com/ljharb/qs/security/advisories/GHSA-x5fp-wj9c-mxmx),
  [qs constructor handling](https://github.com/ljharb/qs/security/advisories/GHSA-4mjr-xmp4-gh2g),
  [DOMPurify detached subtree](https://github.com/cure53/DOMPurify/security/advisories/GHSA-p98j-92pf-mc4p).
- The final focused boundary/dependency suites passed **36 tests / two files**.
  `pnpm audit --prod --audit-level low` then reported **no known vulnerabilities**;
  this is a point-in-time registry result, not an absence-of-vulnerabilities proof.
  Frozen-lockfile install validation passed. Existing platform-specific lockfile
  metadata removed incidentally by pnpm 10.4.1 was restored; unrelated package
  versions were not upgraded. Deprecation warnings remain for legacy dependencies.
- A root test run before the two dependency patches passed **16 recovery unit
  tests plus 417 application unit tests / 40 files**. A later run was contaminated
  by an overlapping frozen-install check: the SIGINT server-process case could not
  resolve `@trpc/server`, and rewritten Windows wrappers repeated commands. That
  invocation is not accepted as clean verification even though subsequent passes
  within it were green. No test timeout or assertion was weakened.
- After that invocation was terminal and installation had finished, a fresh root
  `pnpm test` passed **16 recovery unit tests and 419 application unit tests / 41
  files** (48.85s for the application suite), including all three server-process
  cases. Existing legacy provider-fallback diagnostics remain. Final TypeScript,
  production build, scoped Prettier and `git diff --check` passed; Git emitted its
  existing Windows line-ending notices. No dependency installation overlapped
  the accepted final test run.
- No schema migration or database fixture was changed in this increment. The
  previous integration/recovery evidence remains dated and was not rerun here.
  Work remains local, uncommitted and unpushed; no deployment, purchase, real
  authenticator enrollment, platform message or provider account action occurred.

### Durable public login admission

- The preceding encrypted-recovery checkpoint did not complete authentication
  hardening. Inspection found a process-local, IP-only login throttle; rotating
  source addresses or restarting a process could bypass that allowance. Admin
  MFA remains a separate unfinished release gate.
- Migration **0035** adds shared `login_attempt_quotas`. Before credential lookup,
  every admitted well-formed login reserves a fixed 15-minute allowance: 10 per
  normalized email, 20 per canonical source IP and 1,000 service-wide. Successful
  attempts also count. All reservations share the service-row lock and database
  clock. Failed reservations roll back without extending windows or leaving new
  identity rows. A committed request removes at most 100 expired identity rows.
- Purpose-specific HMAC digests avoid storing raw email/IP/password data in this
  table. Storage/configuration/UTC failures fail closed with a generic 503; budget
  exhaustion returns 429 without issuing a session cookie. The account export
  and deletion inventories now review **40 application tables: 35 owned categories
  and five excluded service categories**. Login counters are not account-owned.
- Test-first development caught the original missing behavior, provisional-row
  growth on rejection and equivalent-IP bypasses. The final focused suite passed
  **14 tests**, including concurrent final-slot admission, expiration, bounded
  cleanup, unknown accounts, unavailable storage and a fresh-process check.
  The added compiled-server HTTP acceptance case passed with real MySQL: a valid
  control login issued a cookie, later bad guesses exhausted admission, a forced
  app-process restart did not reopen it, and rotating `X-Forwarded-For` headers
  did not evade the IP limit with `TRUST_PROXY=false`. Rejected requests issued
  no cookie. This does not verify a deployed reverse proxy or edge protection.
- Full integration run before that final extra HTTP case: **477 passed / 29 files,
  15 explicitly skipped** (232.92s). The subsequent focused run passed all 14
  login cases (13.36s total). These overlapping counts are not additive. Root
  tests passed **16 recovery unit tests plus 383 application unit tests / 39
  files**, with existing legacy provider-fallback diagnostics. Fresh TypeScript
  checking and production build passed; TypeScript was rerun after the HTTP case.
- Encrypted full-schema recovery was rerun against all **36 migrations**: one
  end-to-end scenario passed (64.69s total), including schema/index/journal
  comparisons and binary/Unicode data. Current compiled assets were mounted into
  an existing dependency image; this is not a fresh release-image or remote CI
  acceptance. Scoped formatting and `git diff --check` passed (Git reported
  existing Windows line-ending notices).
- Test-first and additive-migration practices shaped this increment. The README
  documents limits, proxy assumptions, shared-network/denial-of-service tradeoffs,
  secret rotation and opportunistic rather than scheduled counter cleanup.
  Registration/verification throttling, administrator MFA, edge controls, load
  testing and live provider/recovery acceptance still need separate review.
  No public-production readiness claim is made.
- Only isolated synthetic fixtures were used. The test database had zero users
  and login counters after cleanup and 36 journal entries; no extra fixture
  schemas remained. Work remains local, uncommitted and unpushed. No purchase,
  provider message, publication or deployment occurred. The full worldwide beta
  goal and EUR 100/month planning ceiling remain unchanged.

### Encrypted backup and isolated full-schema recovery rehearsal

- Previous goal turn classification: verified migration-history progress. The next
  operations gap was the existing hard-coded, plaintext-only PowerShell dump
  helper with no executable restore path. It now delegates to an explicit Node
  recovery CLI rather than choosing a database/container/password implicitly.
- Added key generation, encrypted backup, offline authentication and guarded
  isolated restore. The artifact uses Node's AES-256-GCM with a random nonce and
  authenticated format/source metadata. Full authentication precedes imported SQL;
  files are published without replacement and raw SQL/errors/secrets are not logged.
  Credentials come from the operator environment, with a separate recovery key.
- Restore requires the full confirmed target container ID, a separate labeled
  network-disabled/unpublished container, matching empty database, non-root restore
  user and disabled MySQL event scheduler. No database creation/deletion, network
  attachment, service promotion, automatic history repair or remote upload occurs.
  The source must have a migration journal and exclusively InnoDB base tables;
  the operator must confirm a no-DDL maintenance window.
- The initial artifact tests demonstrated absent CLI behavior, then **14 passed**.
  The full database rehearsal first failed at the missing backup operation after
  all 35 migrations had applied. The first implemented round trip passed (32.14s).
  A subsequent event-scheduler regression correctly failed because restore had
  accepted an enabled scheduler; after adding the guard the rehearsal passed
  again. The legacy-wrapper regression also failed before the wrapper replacement.
- Final native Windows recovery unit run: **16 passed**, including oversized-file
  rejection and wrapper refusal without explicit configuration.
  Linux/Node 22 artifact tests: **15 passed**, with
  the Windows-only wrapper case explicitly skipped. The project root test command
  passed those 15 tests plus **383 application unit tests / 39 files** (71.22s for
  the application suite), with existing legacy provider-fallback diagnostics.
- Fresh application TypeScript checking, Node syntax checking, scoped Prettier,
  `git diff --check` and Actionlint 1.7.7 on the edited CI workflow passed.
  The last extra size-boundary unit case was added after the root test run and
  passed in both native Windows and Linux artifact suites; application code did
  not change afterward.
- Final real MySQL recovery rehearsal: **one end-to-end scenario passed** (46.59s).
  It applied all 35 migrations, backed up and restored into a second empty MySQL
  container, compared all table/column definitions and indexes plus exact journal
  hashes/timestamps, and round-tripped binary and Unicode fixture values. It also
  verified the Windows wrapper's encrypted output, no-overwrite behavior,
  non-InnoDB rejection, corruption rejection before target DDL, target identity,
  scheduler gating, source protection and rejection of a non-empty restore target.
  This is one scenario with multiple assertions, not dozens of independent tests.
- Current compiled migration assets and SQL were mounted read-only into an existing
  test dependency image; this is not a fresh release image or a live deployment.
  No new application/server/schema source changed. The prior 464-test integration
  checkpoint remains dated evidence, not a newly rerun full application integration
  suite in this turn. CI now includes artifact tests and a clean-image recovery
  rehearsal; no remote CI execution is claimed.
- Deployment, Docker-isolation and test-first skills shaped the safeguards and
  checks. The [recovery runbook](DATABASE_RECOVERY.md) documents exact commands,
  key custody, privileges, maintenance, safe error handling and manual promotion
  requirements. Current limits are explicit: 64 MiB dumps buffered in memory,
  120-second Docker-client operation limits (not guaranteed remote cancellation),
  no automatic backup scheduling/retention/alerts, no remote storage, and no measured
  production RPO/RTO. Larger-data recovery and hosted operational acceptance remain
  release gates, alongside deletion/retention policy, MFA and provider acceptance.
- Only self-created synthetic tmpfs databases and private temporary files were
  discarded after terminal tests. Stopped fixture containers remain inspectable;
  real data and shared services were not modified. Work remains local, uncommitted
  and unpushed. No purchase, publication, provider action or deployment occurred.
  The full public-beta goal and EUR 100/month planning ceiling remain unchanged.

### Migration asset and recorded-history integrity

- Previous goal turn classification: verified progress on startup serialization,
  not completion of the public beta. This increment closes the recorded-history
  validation gap without changing any migration SQL or application schema.
- The installed Drizzle 0.45.2 migrator used the latest recorded timestamp to
  decide what to apply, without checking earlier hashes. All **12 new regression
  cases failed against the original runner**: edited applied SQL, older artifacts,
  damaged/duplicate/gapped/null journal entries, untracked existing tables and
  malformed manifests. An earlier connection-refused run occurred before the
  disposable MySQL service was ready; it was not counted as regression evidence.
- The runner now validates the manifest and captures SQL/hashes under its existing
  session lock, requires database history to be an exact release prefix, executes
  that same captured snapshot through Drizzle's engine, and verifies complete
  history before success. Missing/empty journals on non-empty schemas require
  review. Safe phase codes distinguish asset, pre-application history and
  post-application history failures. No automatic journal adoption or repair,
  hash rewriting, deployed-file edits or rollback claims were introduced.
- The first guarded run passed **29 migration tests** (51.46s). Additional
  acceptance cases cover valid suffix application/idempotent restart, an emptied
  journal, post-application corruption, pending-asset mutation and both compiled
  and actual container-command rejection. The initial TypeScript check caught
  a Drizzle generic mismatch and an unsupported iterator target; both were fixed
  without type suppression. Fresh type checking and production build passed
  (Vite 6.74s; migration bundle 5.5 kB), as did **383 unit tests / 39 files**
  (74.15s) and scoped formatting. Existing missing-provider diagnostics in legacy
  tests are not evidence of live-provider acceptance.
- The database-migration skill preserved immutable deployed assets and an
  operator-reviewed recovery path; the test-first skill required observed
  regression failures before the guard was implemented. The README now explains
  byte-exact SQL/line-ending preservation, phase codes, dependency contract tests
  and the difference between history checks and actual schema-drift inspection.
- Full current-source verification passed: **464 integration tests / 28 files**,
  **15 existing legacy skips**, **239.41s**. All **34 migration cases** passed
  (80.16s), including the five additional acceptance cases above. The source runner
  first applied all 35 existing migrations through 0034 successfully. Compiled
  checks used the fresh local build mounted into the isolated Linux test runner;
  no fresh clean-image build, pruned runtime-image test or remote CI run is claimed
  for this increment. The preceding checkpoint's clean-image evidence covers the
  earlier lock-only implementation, not these new history checks.
- The full runner exited 0. Post-test checks found zero fixture databases, zero
  remaining users, 35 application journal rows and an available migration lock.
  The exact network-isolated, unpublished tmpfs database was stopped and inspected
  as exited 0; its disposable synthetic data was discarded, with no real data or
  shared services affected. Branch/HEAD remain `agent/public-saas-beta` /
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. No commit, push, merge, purchase,
  provider mutation, publication or deployment occurred.
- This does not detect every manual column/index change or unjournaled partial
  DDL following an otherwise valid history prefix. Representative-data timing,
  backup/restore rehearsal, older-app compatibility, actual schema inspection
  and live deployment acceptance remain open. No frontend change or new browser
  acceptance is claimed. Full public-beta scope and the EUR 100/month planning
  ceiling are unchanged; all work remains local and uncommitted.

### Serialized migration startup and secret-safe failure reporting

- Previous goal turn classification: progress (read-only operator deletion queue
  and request inspection, 430 integration passes). Current startup inspection found
  no cross-process migration lock and raw Drizzle error messages in logs. This
  increment addresses deployment safety without waiting for the retention-policy
  decision or changing the full worldwide public beta objective.
- Test-first evidence reproduced both defects against the old runner: one process
  applied DDL despite an externally held migration lock; two competing migrators
  attempted the same CREATE TABLE, causing one to fail; a failing SQL statement
  appeared verbatim in the fatal log. All original 12 regression cases failed.
- The runner now owns one dedicated physical MySQL connection, obtains a stable
  database-specific advisory lock, uses that same session for Drizzle migration
  execution/history and releases/closes before reporting success. The bounded
  `MIGRATION_LOCK_TIMEOUT_SECONDS` defaults to 60 and accepts integers 1–300;
  blank/invalid settings fail before connection. Safe phase codes replace raw
  SQL/driver exceptions. No migration file or application schema was changed.
- `pnpm db:migrate` now calls the same protected source runner as compiled startup;
  the development generate/apply helper also routes through it. Compose forwards
  the wait setting. The migration source is now included in TypeScript checking.
  CI and the integration-test image build fresh artifacts before integration tests
  exercise the compiled runner. The compiled test first failed against the stale
  pre-change build, then passed after rebuilding; source-only testing was not
  treated as production-entrypoint evidence.
- All **17 focused migration tests** passed (38.70s), using separate processes and
  uniquely named synthetic databases on the isolated MySQL server. Tests prove
  actual lock waiting, no DDL on timeout, one journal entry under contention, lock
  ownership by the DDL session, failure/redaction with partial DDL still present,
  release after database connection loss or missing assets, configuration rejection,
  compiled failure/success and the actual Docker CMD stopping before app startup
  on migration timeout. The test-only root credential creates/removes fixture
  databases and kills only an observed synthetic-query connection; it is not
  supplied to the application runtime.
- Unit suite: **383 passed / 39 files** (89.95s). TypeScript passed. Local production
  build passed (Vite 11.93s; server 536.3 kB; standalone migration bundle 2.5 kB).
  Scoped Prettier, both Compose configuration checks and `git diff --check` passed
  with existing Windows CRLF notices. No frontend source changed and no new browser
  acceptance is claimed.
- A clean Docker **integration-test stage** build succeeded with frozen-lockfile
  dependency installation and fresh compiled assets (Vite 6.35s). Its image is
  `cofounder-migration-integration-20261001`, ID
  `sha256:447dfe87ab37bdccb33a8f1d7ffa139aba8b9423938500eec84542b25bd531f2`.
  All **17 migration tests passed inside that image** (22.74s), without source or
  compiled-output bind mounts. This verifies the migrator/build path, not the
  separate pruned runtime image, hosted service or remote GitHub CI. The final
  development `db:push` alias adjustment and documentation followed that build;
  the full current-source test run uses the current mounted package/scripts.
- Full current-source verification passed: **447 integration tests / 28 files**,
  **15 existing legacy skips**, **162.29s**. The protected `pnpm db:migrate`
  successfully applied all **35 migrations through 0034** before that run. No new
  migration or application-owned table was required. Previously observed outreach
  date-validation intermittency did not recur; no cause/fix is claimed for it.
- Final inspection confirmed the focused, full and clean-image runners exited 0;
  zero `cf_migration_test_*` databases and zero users remained, the application
  migration lock was free and its journal contained 35 rows. The exact unpublished,
  network-isolated tmpfs database `cofounder-export-20261001-database-1` was stopped
  and inspected as exited 0. Only disposable synthetic fixtures were discarded.
  Shared services and real data were untouched. Branch remains
  `agent/public-saas-beta` at `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, uncommitted
  and unpushed. No purchase, provider action, publication, merge or deployment
  occurred; the EUR 100/month planning ceiling and full active goal are unchanged.
- The [detailed migration contract](../README_REFERENCE.md#migration-startup-safety) documents
  the operator path, phase codes and recovery limits. MySQL named locks survive
  commits but coordinate only cooperating sessions on one server; DDL may commit
  implicitly and remain after failure. This is not automatic rollback, schema drift
  validation, a multi-primary deployment solution or authority to retry partial
  DDL blindly. Representative-data locking/duration, backup/restore, old-image
  compatibility and live deployment acceptance remain open. Sources checked:
  [MySQL advisory locks](https://dev.mysql.com/doc/refman/8.4/en/locking-functions.html)
  and [implicit commits](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html),
  plus the installed Drizzle MySQL migrator implementation.

### Read-only operator request queue and current request inspection

- Previous goal turn classification: progress (connected review-held deletion
  request intake, withdrawal and browser acceptance). Current source still lacked
  a supported way for operators to find pending requests. This increment closes
  that visibility gap without assuming the unanswered retention decision or
  enabling deletion. The full worldwide public beta scope remains unchanged.
- Added `pnpm account:deletion:requests --read-only`, with optional `--limit`
  (default 50, maximum 100) and `--after-account-id`. The command lists only pending
  requests, including fenced and unverified owners. It returns account/reference/
  revision/date/fence metadata, never private profile/message content, credentials
  or confirmation-attempt counters. Output remains private operator information.
  No HTTP route, permission change, claim, audit write, notification or processing
  action was introduced; `deletionAuthorized` is always false.
- Pagination uses account-ID ordering and an explicit continuation cursor, not an
  urgency order or global total. Each page runs in its own database-enforced READ
  ONLY / REPEATABLE READ transaction. A multi-page scan is not one snapshot;
  operators must repeat scans from the beginning to catch changed earlier accounts.
  The [detailed operator workflow](../README_REFERENCE.md#reviewing-pending-deletion-requests-operators-only)
  documents these limits and subsequent per-account inspection.
- The existing ownership preflight now includes the current request state,
  reference, revision, request/withdrawal dates and work-fence status in the same
  snapshot as its ownership counts. Missing requests and quota-only rows are
  explicitly `none`. Both diagnostics reject malformed request metadata and
  require UTC timestamp interpretation. The list also checks its lookahead row
  before returning a valid-looking partial page. No schema migration was needed;
  39 application tables / 35 owned categories / four exclusions remain unchanged.
- Test-first evidence: initial CLI/inspection assertions failed before the
  command and request snapshot existed. Six later assertions reproduced acceptance
  of malformed pending records, including invalid lookahead metadata; validation
  fixed those failures. All **24 new integration tests** passed (22.04s focused
  run), covering real CLI output/errors, pagination, redaction, unchanged data,
  fenced/unverified visibility, absent/withdrawn states, argument rejection,
  secret-safe storage failure, malformed metadata, actual database write rejection,
  concurrent withdrawal with a stable snapshot, and non-UTC session rejection.
- Unit suite: **383 passed / 39 files** (79.76s). TypeScript (including both operator
  commands), production build (Vite 12.10s; server 536.3 kB), scoped Prettier and
  `git diff --check` passed with existing Windows CRLF notices. The machine's
  default pnpm wrapper attempted installation and aborted its proposed module
  replacement because no TTY was available. No purge/install override was used;
  checks ran successfully via the repository's existing `node_modules/pnpm/bin/pnpm.cjs`.
- Full MySQL verification: **430 passed / 27 files**, **15 existing legacy skips**,
  **183.46s**, including the original preflight/export/fence/request suites and all
  24 new operator-review tests. All 35 migrations through 0034 applied to a fresh
  isolated synthetic database. The prior turn's outreach date-validation failure
  did not recur; this does not establish its cause or claim a fix. The documented
  `pnpm account:deletion:requests --read-only --limit 50` command then returned the
  correct empty page and exit 0 against the cleaned test database.
- Cleanup found zero review-test accounts, zero fenced accounts and zero request
  rows. Focused, full and command-smoke containers exited 0. The exact isolated
  `cofounder-export-20261001-database-1` container was stopped and inspected as
  exited 0; its disposable tmpfs fixtures were discarded. Shared services and real
  data were untouched. Branch remains `agent/public-saas-beta` at
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, uncommitted and unpushed. No purchase,
  external provider action, publication, merge or deployment occurred. The confirmed
  EUR 100/month planning ceiling is unchanged.
- This is CLI/backend-only work; no new browser acceptance is claimed. The prior
  connected browser checkpoints remain separately dated. The queue is for an
  authorized source checkout with development dependencies and existing database
  access, not the minimal production image. Operator MFA, review decisions,
  request-locked processing, in-flight work reconciliation, erasure/receipt policy,
  backups, live providers and deployment/pilot acceptance remain release gates.

### Review-held account-deletion request intake

- Previous goal turn classification: progress (transactional account-work fence
  and session invalidation). This increment connects password-confirmed request,
  status and withdrawal to the Account data screen. The retention-policy question
  remains unanswered. No automatic erasure or retained-receipt policy is assumed,
  and the worldwide free public beta scope and EUR 100/month ceiling are unchanged.
- `ENABLE_ACCOUNT_DELETION_REQUESTS` defaults to false, including in Compose.
  Enabling it accepts requests held for operator review, not scheduled erasure.
  Submission does not fence the account, erase data, send mail or contact providers.
  Pausing intake preserves status access and withdrawal. There is no operator
  processing UI, notification worker or erasure executor; do not enable public
  intake without an accountable review process and the remaining launch gates.
- Additive migration **0034** creates one bounded request/quota row per account.
  The reviewed deletion schema and explicit export inventory now cover **39
  application tables**, **35 owned categories** and **four service exclusions**.
  The exported request reference is public, not an authentication secret. The
  schema history contains **35 migrations through 0034**.
- The three exact verified routes enforce current account identity, verification,
  credential state and work fence under the owner lock. Five admitted confirmations
  per 15 minutes are durably charged before password verification, including
  retries and failed mutations. State and content-free audit commit atomically.
  Revision/reference checks reject stale commands and make same-transition retries
  idempotent; an old submission cannot reopen a withdrawn request. No submitted
  password or confirmation text is persisted.
- Test-first implementation: the initial request integration cases failed before
  the backend existed, and the route test failed before the narrow allowlist was
  extended. All **17 request integration cases** pass, covering isolation, wrong
  passwords, concurrency, retries, withdrawal, stale revisions/credentials,
  verification/fencing, durable quotas, paused intake, audit-fault rollback,
  credential changes between transactions, anonymous access and real JSON export.
- The rendered flow uses production-built assets and real isolated MySQL:
  `/outreach` -> Account data -> password plus explicit confirmation -> persistent
  pending status -> confirmed withdrawal. Browser testing reproduced a stale
  boolean-confirmation bug when background status changed request into withdrawal.
  Binding confirmation to action and revision fixed it; the same reproduction
  passed without weakening confirmation requirements.
- All **six deletion-request browser stages** passed: password/confirmation gates,
  reload-persistent submission, mobile keyboard-confirmed withdrawal, background
  revision change, stale-account cookie rejection and paused-intake withdrawal.
  The existing **three-stage account-export browser regression** also passed,
  including rejection of a completed export after the signed-in account changes.
  Both runs verified graceful server shutdown. Email verification was an explicit
  synthetic database fixture, not proof of inbox delivery. No external browser
  request was made.
- Browser plugin not available: used existing Playwright **1.62.1**, Chromium
  **148.0.7778.0**, `http://127.0.0.1:13014/outreach`, desktop **1440x1000** and
  mobile **375x812**. Page identity, meaningful content, absence of framework
  overlays, screenshot inspection, responsive width and real interactions passed.
  Console output contained expected rejected-password/account-change errors only.
  Screenshots and temporary runners remain outside the repository under `outputs`;
  no standalone HTML report was created. Other browsers/viewports remain untested.
- Unit verification: **383 passed / 39 files** (78.67s). TypeScript, production
  build (Vite 7.68s; server 536.3 kB), scoped Prettier, Compose configuration and
  `git diff --check` passed, with the existing Windows CRLF notices.
- The first full integration run had **405 passed, one failed and 15 existing
  legacy skips** (187.06s). An existing outreach-revision test rejected its source
  review as expired or future-dated. Its unchanged focused suite then passed all
  **27 tests**. The cause is not established; neither its date safety guard nor its
  test was weakened. The full unchanged-code rerun then passed **406 integration
  tests / 26 files**, with **15 existing legacy skips**, in **172.09s**. The initial
  date-validation failure remains an unresolved intermittent test observation,
  not a diagnosed or fixed defect.
- Cleanup verified all request, export-browser, focused-revision and final full
  integration runners exited 0. The isolated database contained 39 application
  tables, zero remaining deletion-request test accounts and zero fenced accounts.
  The exact network-isolated, unpublished-port, tmpfs database
  `cofounder-export-20261001-database-1` was stopped and inspected as exited 0.
  Its disposable synthetic fixtures were discarded; real data and shared services
  were untouched. Branch remains `agent/public-saas-beta` at
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, uncommitted and unpushed.
- Remaining gates: operator review/processing and policy decision, still-pending
  request validation atomically coupled to fencing, reconciliation of in-flight
  mail/external work, fresh ownership/retention validation, retry-safe erasure,
  backup/external-store handling and real operator/deployment acceptance. This
  intake record is not a deletion-completion receipt. No live account was fenced
  or erased, and no purchase, publication, commit, push, merge or deployment occurred.

### Transactional account-work fence and session invalidation

- Previous goal turn classification: no progress (budget confirmation only).
  Rechecked the current worktree and resumed deletion prerequisites without
  reducing the worldwide beta scope or changing the EUR 100/month ceiling. The
  retention-policy question remains unanswered; no automatic erasure or 30-day
  receipt policy has been assumed.
- Migration **0033** adds one nullable timestamp to `users`, preserving existing
  accounts as unfenced. The generated migration contains only that additive
  column change. The independently reviewed deletion schema and explicit account
  export inventory now include it; the table/category counts are unchanged.
- The internal `fenceAccountForDeletion` primitive serializes on the account row,
  rechecks the server-observed credential hash, preserves the first fence date,
  clears reset/verification links and revokes the account's sessions atomically.
  It is not exposed by a route or CLI and always returns deletion authorization
  as false. No customer account was fenced and no ordinary account data is erased.
- Supported profile, candidate, qualification, outreach and export writers now
  check the fence inside their existing account locks, including export admission
  and generation separately. Session issuance/authentication, token redemption,
  verification issuance and account-mail worker claims also reject fenced owners.
  The [detailed contract](../README_REFERENCE.md#internal-account-work-fence-deletion-preparation-only)
  enumerates the supported boundary and the important exclusions.
- Test-first evidence: the original **14** new integration cases all failed by
  allowing work or token/session use on a fenced account. Subsequent cases covered
  intake/import, conversations, exports and the internal primitive. Strengthening
  the export test exposed a false-positive error-code check: wrong-password
  rejection had hidden a persisted quota write. The test now also proves that a
  fenced export is rejected before admission is charged.
- All **26 fence integration tests** pass, including real MySQL row contention
  observed through the server process list, waiting profile/session requests,
  preservation of earlier committed owner work, stale authenticated contexts,
  retry-stable fencing, credential changes, rollback of real database changes
  when session invalidation is fault-injected, queued-mail suppression and a
  fence inserted between export admission and generation. Database behavior is
  real; mail transport is intercepted and no provider acceptance is claimed.
- Full verification: **382 unit tests / 39 files passed** (92.06s), **389 integration
  tests / 25 files passed**, **15 existing legacy skips** (152.58s), TypeScript
  passed, production build passed (Vite 17.43s; server 527.0 kB), scoped Prettier
  passed and `git diff --check` passed with the existing Windows CRLF notices.
  The full integration run includes deletion preflight and account export under
  the new live schema. All **34 migrations through 0033** applied in the isolated
  synthetic MySQL environment. No frontend code changed or browser run is claimed.
- Cleanup verified both runners exited 0, zero remaining fence-test accounts and
  zero fenced accounts in the disposable database. Only the isolated
  `cofounder-export-20261001-database-1` database was stopped, then inspected as
  exited 0. Its synthetic tmpfs contents were discarded; shared services and
  unrelated data were untouched. Branch remains `agent/public-saas-beta` at
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, with work uncommitted and unpushed.
- Remaining gates: reauthenticated, explicitly confirmed request and durable
  request/status/receipt workflow; reconciliation of already-claimed mail and
  other in-flight external work; fresh locked ownership/retention validation;
  atomic retry-safe erasure; backup/external-store handling; operator acceptance.
  Unsupported legacy/provider automation and external administrator actions are
  not fenced by this contract. The primitive must not be exposed as a deletion
  feature before the complete workflow and policy are ready. There is no automatic
  unfencing or deletion. No purchase, publication, commit, push, merge or deployment
  occurred; the full public beta goal remains active.

### Read-only deletion ownership and dependency preflight

- Previous goal turn classification: progress (connected account export accepted,
  345 integration passes and isolated database cleanup). This increment implements
  the first executable deletion dependency check, not deletion or completed privacy
  compliance. The proposed automatic-erasure/30-day-receipt policy was asked as an
  asynchronous operator choice; no answer or approval has been assumed.
- Added `pnpm account:deletion:inspect --read-only --account-id <id>` for an operator
  source checkout with existing database access. The
  [detailed contract](../README_REFERENCE.md#inspecting-account-deletion-dependencies-operators-only)
  describes usage, output, limits and exclusions. No public endpoint or customer
  deletion button was enabled. `deletionAuthorized` is always false.
- A separate reviewed 38-table schema manifest and explicit ownership rules cover
  34 owned categories and four service exclusions. Table/column and foreign-key
  changes fail closed; current InnoDB engines are required. Counts come from a
  database-enforced read-only repeatable-read snapshot. Foreign-owned references
  are reported without exposing their content or IDs. Logical message ancestry
  is checked; numeric recipient values are not treated as account ownership.
- The existing authenticated mail-payload decoder is reused to identify bounded
  user-less recovery requests. Missing/old keys, scrubbed unowned payloads and
  scan limits produce unresolved status and a null mail count. Pending work and
  possible provider delivery remain distinct review reasons. Financial usage,
  billing, invoices and audits require retention review. No receipt-retention
  period, mail cancellation, session revocation or erasure was introduced.
- Test-first evidence: seven CLI integration cases failed before the command
  existed. The first implementation exposed invalid SQL when Drizzle 0.45.2
  combined transaction options without a comma. The narrowed diagnostic showed
  MySQL `ER_PARSE_ERROR` at `start transaction with consistent snapshot read only`.
  The implementation keeps READ ONLY and REPEATABLE READ, with the first InnoDB
  read establishing its snapshot; it does not patch dependencies or weaken
  read-only enforcement. See the official
  [MySQL transaction contract](https://dev.mysql.com/doc/refman/8.4/en/commit.html).
- A further failing regression reproduced database URL disclosure from the shared
  connection-construction logger. `getDb` now logs a generic configuration error
  instead of serializing the driver's credential-bearing exception. This is a
  bounded fix, not a claim that all legacy application logs have been audited.
- All **18 deletion-preflight cases** passed inside the current full integration
  run, including actual CLI output, owner and indirect-owner isolation, incoming
  references and recipient collisions, own revision chains versus foreign logical
  parent links, financial review, unassigned encrypted recovery, unavailable key,
  provider acknowledgement review, unknown tables, removed foreign keys, invalid
  arguments, missing accounts, secret-safe failures, a rejected real database
  write and a concurrent insertion outside the preserved snapshot. The new suite
  is wired into `test:integration`; CLI TypeScript is included in `check`.
- Current unit suite: **382 passed / 39 files**, 79.06s. TypeScript (including the
  command), production build (Vite 8.57s; server 524.3 kB), scoped Prettier and
  `git diff --check` passed. Full current-source integration suite completed with
  **363 passed / 24 files**, **15 existing legacy skips**, in **190.70s**. Expected
  injected-capacity/provider-disabled diagnostics do not establish live acceptance.
- The documented pnpm command was also invoked with a negative account ID and
  returned the expected safe JSON error and exit 1 without accessing account data.
  Final cleanup inspection found zero deletion-test accounts, no temporary test
  table and the restored sender foreign key. Both test runners exited 0. The exact
  isolated `cofounder-export-20261001-database-1` container then stopped and was
  inspected as exited 0; disposable tmpfs fixture data was discarded. Runner logs
  and clearly named debug evidence remain outside the repository. Shared services
  and unrelated data were untouched.
- No frontend surface changed, so no new browser result is claimed. The prior
  export UI checkpoint remains separately dated. No live account was inspected
  or erased, no provider was contacted, and no purchase, commit, push, merge or
  deployment occurred. The EUR 100/month planning ceiling is unchanged.
- Still required: confirmed deletion request, durable work/session fence,
  transaction-locked revalidation and atomic local erasure, explicit retention
  exceptions, idempotent receipts, external-store/backup handling and the actual
  customer/operator journey. A successful read-only report does not satisfy
  those gates and must never be reused as a stale deletion authorization.

### Connected private-account export acceptance recovered

- Previous goal turn classification: progress (five regional discovery listings,
  explicit workflow admission, 382 unit tests and isolated component QA). This
  increment closes the previously blocked browser-to-MySQL export verification;
  it does not establish overall production readiness.
- Read-only inspection found Docker reachable again, the existing export UI
  container terminal with exit **143**, and its isolated database stopped. No
  Docker/WSL restart was performed. Only the existing synthetic-only, no-network,
  no-published-port, tmpfs database was started. Existing terminal runners were
  reused; no duplicate or shared application stack was launched.
- Fresh MySQL **8.4.11** initialization and all **33 migration entries through
  0032** succeeded. The current-source integration suite then passed **345 tests
  / 23 files**, with **15 existing legacy skips**, in **88.33s**. This run includes
  the October catalogue policy changes, not only the earlier export source.
  Expected injected-capacity diagnostics are not provider acceptance.
- The production-built application passed connected Playwright **1.62.1** /
  Chromium **148.0.7778.0** checks at container-local
  `http://127.0.0.1:13014/outreach`, desktop **1440x1000** and mobile **375x812**:
  1. Privacy confirmation and current-password gates prevent downloading with
     an incorrect password; the password input clears and an explicit error shows.
  2. A real POST returns `Cache-Control: private, no-store` and yields exactly one
     browser JSON download. The file includes the archived opt-out fixture and
     its original formula-like text, excludes password/OAuth secrets, and states
     redaction reasons. The browser shows its secure-storage notice.
  3. A delayed already-generated export is discarded after the cookie changes to
     another verified account. No second download occurs; input and consent reset.
  4. Mobile Find platforms/Account data navigation resets sensitive form state.
     Keyboard Space toggles the privacy checkbox and correctly gates the button.
- The final rerun passed all stages, with correct page identity, meaningful page
  content, no framework overlay, no uncaught page errors and no external requests.
  The only console errors were the intentionally tested password rejection's HTTP
  403 and matching application error. Desktop/mobile screenshots were inspected;
  no horizontal overflow was observed. This is local HTTP/browser evidence, not
  deployed HTTPS, all-browser, complete accessibility or load-test acceptance.
- Email verification used explicit synthetic database fixtures; no inbox or
  provider delivery was exercised. The database contained four synthetic E2E
  accounts after the two runs and zero injected CHECK constraints. Both runners
  exited **0** and browser runs verified graceful application shutdown.
- Cleanup: the exact `cofounder-export-20261001-database-1` container was stopped
  and inspected as **exited 0**. Its tmpfs synthetic test data is discarded, not
  recoverable account data or a backup; retained scripts, screenshots and runner
  logs remain available. Shared Docker and other application containers were not
  restarted or stopped by this increment.
- Evidence remains outside the repository: `outputs/account-data-ui-check.cjs`,
  `account-data-desktop.png`, `account-data-mobile-overview.png` and
  `account-data-mobile.png`. No production application code changed in this
  increment; the harness and README/ledger evidence were updated. The prior
  **382 unit passes**, TypeScript and build results remain the unchanged-code
  checkpoint, not newly rerun results.
- Next: complete account-deletion and operator-assisted access handling with the
  dependency and retention gates below; then administrator safeguards and remaining
  operational acceptance. No purchase, provider action, commit, push, merge or
  public deployment occurred. The entire worldwide free-beta goal remains active.

### Regional discovery coverage and separate workflow admission

- Previous goal turn classification: progress (deletion dependency review and
  truthful recovery of the Docker runner state). This increment advances
  worldwide discovery coverage while the Docker engine remains unavailable;
  it does not implement deletion or finish the public-beta release.
- The [source review supplement](PLATFORM_SOURCE_REVIEW.md#regional-supplement-2026-10-01)
  records five additional regional routes and an India refresh for the existing
  Entrepreneurs First record. Totals: **32 research records, 31 public discovery
  records**, not working integrations or exhaustive global coverage. Closed
  applications, conflicting dates and cohort-specific restrictions are explicit.
- An explicit `workflowReview` boundary now separates public discovery listing
  from manual candidate/import/outreach admission. The five additions are
  discovery-only. A missing review fails closed, including provider URLs paired
  with a "manual" label. Existing held/private-channel policies remain intact.
- Test-first evidence: three new assertions failed before implementation
  (regional data, per-entry dates, implicit workflow admission). The focused
  catalogue/policy regression run then passed **46 tests**; five additional
  source-specific tests passed actual intake/import/declaration rejection before
  storage, without a database connection.
- Current complete unit run: **382 tests / 39 files**, 106.26s. TypeScript passed.
  Production build passed (Vite 10.21s; server bundle 524.2 kB). Expected negative
  provider/configuration test logs are not live-provider acceptance.
- Browser QA: host Playwright **1.62.1**, isolated Chrome **154.0.8037.59**,
  loopback-only `/catalogue-check`, actual catalogue component and records with
  production CSS. Desktop 1440x1000 and mobile 375x812 checks passed: regional and
  category filters, StartHawk alias deduplication, closed/conflicting access
  warnings, empty state, correct evidence destination and no horizontal overflow.
  No console warnings/errors or external network requests were observed. The
  initial run used an incorrect heading-role selector for card titles; correcting
  the harness selector resolved it without changing the production component.
- This component harness does **not** verify auth, tRPC or MySQL. The prior
  **345 integration passes** predate this catalogue change; the connected suite
  and account-export browser journey remain unrerun because Docker is unavailable.
  No shared Docker restart was performed. Existing isolated container cleanup is
  still pending confirmation of engine/container state.
- Evidence outside the repository: `outputs/regional-catalogue-ui.cjs` and its
  overview, desktop and mobile PNGs in the thread workspace. README/source review
  updated locally. No commit, push, publication, purchase or live outreach occurred.
  EUR 100/month remains a planning ceiling, not purchasing authority.

### Deletion implementation prerequisites identified from current source

- Previous goal turn classification: progress (generation guard, 374 unit tests
  and 345 integration tests). The existing browser session **97251** eventually
  exited 1 with a Docker API 502 during container creation. Fresh Docker status
  confirmed the exact UI container was **Created**, not running, and its database
  remained healthy. The existing container was inspected and resumed using
  `docker start --attach`. Handle **96719** then exited 1 with `unexpected EOF`;
  read-only inspect/log attempts failed because the Linux-engine named pipe no
  longer existed. Actual post-start container/database state is therefore unknown.
  No duplicate runner or shared-service restart was launched. No destructive
  account operation was implemented or executed in this review.
- Executed Drizzle metadata inspection across all 38 current application tables
  and read the actual recovery/mail/session/message writers. The export allowlist
  is **not** a deletion policy: fields deliberately excluded from a downloadable
  file can still contain account data requiring erasure review. Four service-wide
  export exclusions also cannot simply be deleted for one customer.

| Verified source finding                                                                                                                                                                      | Required implementation/acceptance consequence                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestPasswordReset` inserts encrypted email-bearing jobs without `userId`; the worker resolves ownership later.                                                                           | A user-ID cascade alone leaves pending recovery data. Resolve email-scoped jobs using the existing reviewed key/payload contract before removing account identity; test unclaimed, claimed, expired and key-unavailable cases. Never clear service-wide dispatch-budget counters as account cleanup. |
| Mail delivery occurs outside the claim transaction; the queue has leases and provider acknowledgements.                                                                                      | Fence new work and coordinate existing claims before erasure. A database deletion cannot retract already submitted mail. Test deletion racing with claim, provider response and retry, and report external delivery separately.                                                                      |
| `messages.senderId` references users, but `recipientId` is not a user foreign key. Current writers put a prospect ID there; another legacy writer uses the current user ID as a placeholder. | Do not delete other tenants' records by numeric recipient equality. Verify `userId` ownership and detect cross-owner references before any destructive plan; route ambiguous legacy records to explicit review.                                                                                      |
| `outreachRecords.revisesId` is a self-reference; analytics/timeline reference messages, and messages reference conversations/matches/prospects.                                              | Use a reviewed dependency order and explicitly handle own revision links. Do not disable foreign-key checks or add blanket cascading deletes. Test complete chains and rollback on a foreign-owned reference.                                                                                        |
| Invoices reference both users and billing periods; usage and audit records also reference users.                                                                                             | Establish the operator-approved retention/exceptions policy before destructive handling of these categories. The free-beta label is not proof that legacy financial records can be discarded. No retention duration or legal conclusion is inferred here.                                            |
| Account sessions use a durable user-bound table and login/password recovery coordinate through a user lock.                                                                                  | Fence new sessions and mutations, revoke all existing sessions, and test concurrent login/recovery/export rather than only clearing a browser cookie. Decide explicitly how a pending request can show status without granting normal workspace access.                                              |

- Source anchors: [schema](../apps/cofounder-discovery/drizzle/schema.ts),
  [mail queue](../apps/cofounder-discovery/server/account-mail-queue.ts),
  [session creation](../apps/cofounder-discovery/server/account-sessions.ts),
  [current message writer](../apps/cofounder-discovery/server/routers.ts),
  [legacy message writer](../apps/cofounder-discovery/server/outreach-router.ts).
- Next deletion increment must cover request confirmation, a durable account/work
  fence, ownership/dependency preflight, explicit review exceptions, atomic local
  erasure where permitted, retry-safe receipts and honest external/backup status.
  A soft-delete flag, a request queue alone, or a successful local SQL transaction
  must not be presented as completed worldwide privacy erasure. Operator policy,
  external-store handling and restore-time suppression remain release gates.
- Browser recovery next step: once Docker is accessible, inspect the existing
  `cofounder-export-20261001-ui` container and its logs before doing anything else.
  Its last confirmed state before the failed start observation was Created.
  Do not equate the CLI's EOF with terminal container state or restart shared
  services without explicit authority. The isolated database was last confirmed
  healthy; cleanup remains unverified. No page interaction, current screenshot,
  browser console result or successful browser shutdown is claimed in this turn.

### Bounded simultaneous account-export generation

- Previous goal turn classification: progress (export documentation, 373 unit
  tests, typecheck and build). This continuation adds a per-process generation
  guard while the database observation remains pending. The full accepted goal
  remains active; no external action or paid commitment was made.
- At most two account exports generate concurrently in one process. A third
  receives `TOO_MANY_REQUESTS` before database work or quota admission; no private
  request is queued. Slots release in `finally`. The README documents the
  distinction from the durable account quota, fleet-wide limits and response
  buffering. This is not a total-memory or production-load acceptance claim.
- Test-first evidence: with two storage operations held, a third request
  incorrectly waited for storage before the guard existed. The regression then
  passed, including slot recovery after storage failure. Its only mocked boundary
  is external database availability; it invokes the actual export function.
  The subsequent real-database concurrency case also passed: both admitted
  exports complete, excess admission does not charge the account quota, and a
  later export succeeds after the slots reopen.
- Fresh verification after the change: **374 unit tests / 37 files passed**
  (71.13s), TypeScript passed and production build passed (Vite 10.87s; server
  519.0 kB). Fresh full integration acceptance subsequently passed **345 tests /
  23 files**, with 15 existing legacy skips (146.84s), including all 14 export
  cases. Browser acceptance is still running separately.
- Docker status session **35599** initially remained live without output. A bounded direct
  read-only request through the existing Linux-engine named pipe also failed to
  receive container status within seven seconds. Backend processes and engine
  pipes exist; the Windows helper service reports stopped. These observations
  do not prove which containers are running or that the engine has stopped.
  Robert was asked whether a shared Docker Desktop restart was permitted, but
  the pending status then returned naturally: all old export runners are terminal,
  the old full runner exited 0, and its disposable database exited 255. No shared
  restart was performed or is currently needed. Recovered September logs confirm
  **344 integration tests / 23 files passed**, with 15 legacy skips (83.14s).
  That historical run predates the new concurrency guard. A fresh isolated
  `cofounder-export-20261001-database-1` was created and became healthy; migrations
  through 0032 completed and new full integration session **16804** exited 0.
  Browser session **97251** then started, with no overlapping database tests.
  Its command is still pending without output after repeated polls; a second
  bounded status API probe also timed out (diagnostic session 10509 exited 1).
  Resume **97251**, do not launch a duplicate or stop its database based on an
  observation timeout. The current database has not been stopped; exact runner
  and database cleanup must follow confirmed terminal browser state. No browser
  success, screenshot review, inbox delivery or live provider acceptance is claimed.

### Private account export: implementation and acceptance still in progress

- Previous goal turn classification: progress (account-data export implementation,
  schema-drift regressions and password-confirmation correction). This continuation
  re-read current source, refreshed local verification and documented the export
  contract. The full worldwide public-beta goal remains active; the EUR 100/month
  planning ceiling is unchanged. No commit, push, merge, deployment, provider
  change, external message or purchase was performed.
- The [detailed account-data contract](../README_REFERENCE.md#downloading-private-account-data)
  is authoritative for scope, exclusions, authentication, quotas, size limits,
  audit semantics, migration 0032 and remaining privacy requirements. Direct
  execution of the inventory builder confirmed 38 reviewed categories: 34 owned
  categories and four excluded service-wide categories. This is broader than the
  candidate CSV, not a complete legal access-response or deletion implementation.
- Fresh local verification: **373 unit tests / 36 files passed** (127.75s),
  TypeScript `--noEmit` passed, production build passed (Vite 20.84s; server
  518.7 kB), and `git diff --check` passed with line-ending warnings. Expected
  missing-provider/test diagnostics are not evidence of live integrations.
  Scoped formatting identified and corrected whitespace in `account-export.ts`.
- The previous full integration-run handle was unavailable on resumption. Earlier
  continuation context reported 13 account-export integration cases passing, but
  did not contain a terminal full-suite result; **do not treat that as fresh or
  complete integration acceptance**. The Docker status request remains pending
  on session 35599. Container state, the old full-run outcome and cleanup are not
  yet confirmed. Do not launch overlapping schema-mutating tests or stop the test
  database until their state is resolved. No shared Docker/WSL restart was made.
- Connected browser acceptance remains open. The external temporary harness now
  records console warnings/errors, permits only the expected incorrect-password
  diagnostics, and installs its account-identity response listener before
  releasing the delayed export. These harness corrections have not yet run.
  The required journey is Outreach → Account data → password/privacy confirmation
  → private JSON download, plus wrong-password rejection and suppression after a
  verified-account cookie switch. Browser plugin is unavailable; the prepared
  fallback uses existing Playwright/Chromium dependencies. No current screenshots
  or browser pass are claimed.
- Next: resolve the pending Docker observation, recover or rerun isolated MySQL
  acceptance, run and inspect desktop/mobile browser evidence, then continue the
  account-deletion/operator access workflow. Administrator safeguards, external
  provider acceptance, staging operations, load, backup/restore and pilot gates
  still prevent a production-ready/public-beta completion claim.

## Earlier checkpoint (2026-09-13)

### Reviewed conversation history and internal reminders

- Previous goal turn classification: progress (account-bound candidate export).
  This continuation advances the accepted conversation/follow-up path. The entire
  worldwide free-beta goal remains active and the EUR 100/month planning ceiling
  remains unchanged. No purchase, provider change, external message, commit, push,
  merge, publication or deployment was performed.
- Added explicit reviewed response/close controls and schedule/reschedule/cancel
  reminder controls to the existing outreach manager. A new paginated Follow-ups
  tab separates due and scheduled dates using database time. The
  [detailed conversation contract](../README_REFERENCE.md#conversation-outcomes-and-internal-reminders)
  is authoritative for semantics, API changes, suppression, retry, date limits and
  migration. Reminders neither send messages nor notifications. They do not
  re-authorize a used message. Closed records retain visible timestamp history;
  analytics now retain recorded sent/response totals after closure.
- Strict schemas require reviewed account, content revision and idempotency key.
  Owner/record/candidate locking serializes against edits and opt-outs; the update,
  audit and receipt are atomic. Stored account verification is checked, and the
  reminder list is a restricted owner-bound projection with a consistent count
  and page snapshot. Migration **0031** adds the owner/date/ID reminder index.
  No existing rows or history are rewritten by the migration.
- Test-first work reproduced absent reviewed procedures, an accepted ID-only
  response mutation, and the legacy sent-message return-to-review transition.
  A separate failing regression reproduced lost analytics after closure. A
  read-only reviewer identified missing suite wiring and non-UTC timestamp risk;
  both were corrected and the reviewer found no remaining critical/important
  defect in the bounded recheck. Detail/reminder paths now fail closed on a
  non-zero MySQL session offset. This does not repair legacy timestamps or
  establish timezone correctness for every unrelated writer in the repository.
- The **22-case new MySQL suite passes**, covering schedule/reschedule/cancel,
  explicit response/closure, concurrent and post-close replay, reused-key content
  mismatch, stale message/candidate review, owner isolation, revoked stored
  verification, opt-out/archive suppression, invalid/terminal states, missing
  sent evidence, deterministic pagination, real audit-insert rollback, strict
  legacy payload rejection, historical metrics, +02:00 session failure and a
  fast application clock. Three new presentation tests pass.
- Full suites passed **372 unit tests / 35 files** (83.04s) and **331 integration
  tests / 22 files** (92.97s), with **15 existing legacy skips**. Missing-provider
  and deliberately injected capacity diagnostics were observed, not live
  integrations. TypeScript, scoped Prettier and `git diff --check` passed. Final
  production build: Vite **5.06s**, server **492.9 kB**. A later UI-only retry-state
  correction was followed by the focused presentation tests, TypeScript, rebuild
  and connected browser reruns, not another full-suite run.
- Connected Playwright checks used Chromium **148.0.7778.0**, MySQL **8.4.11**,
  migrations through **0031**, desktop 1440x1000 and mobile 375x812, browser zone
  Europe/Amsterdam. Four stages passed: future reminder stays sent and appears
  only under Scheduled; committed cancellation with deliberately lost response
  replays once; stale reviewed response conflicts and can be reviewed again; due
  reminder can be explicitly closed while history remains and the queue clears.
  A browser-test timing failure exposed a retry prompt shown during an active
  request; the prompt now waits until the request ends. The final rerun holds a
  committed response and verifies no retry prompt while it remains in flight.
- Screenshots were visually inspected. No horizontal document overflow or
  uncaught page errors were observed. All browser requests stayed local; only the
  controlled lost response was simulated. Registration/email verification and
  prior sent history used explicitly labelled synthetic database fixtures, not
  real inbox or external-delivery acceptance. Successful browser results also
  require verified graceful server shutdown.
- Remaining acceptance: authenticated provider workflows, real inbox/permission
  acceptance, complete privacy export/deletion, administrator security, staging
  operations, load/migration-lock acceptance, backup/restore and pilot evidence.
  This does not claim automatic notifications, transcript import, relationship
  outcome tracking, every worldwide platform, or public production readiness.
- Cleanup checkpoint: browser runners returned exit code 0 with graceful app
  shutdown verified. Delayed inspection returned three synthetic accounts and no
  injected audit checks. The delayed stop command for the exact synthetic
  `cofounder-conversation-20260913-database-1` container then completed with exit
  code 0. Its tmpfs data is disposable, not a retained backup. No shared Docker/WSL
  restart was attempted. Retained scripts and screenshots are outside the
  repository under `outputs`.

### Account-bound active-candidate export

- Previous goal turn classification: progress (connected browser-to-MySQL journey
  and login cache fix verified). This continuation advances export isolation and
  spreadsheet-risk handling without redefining the full worldwide free-beta scope
  or the EUR 100/month planning ceiling. No provider changes, purchase, publication,
  commit, push, merge or deployment was performed.
- Replaced the unparameterized cached GET export with a strict, reviewed-account
  POST mutation and a dedicated UI. The
  [detailed export contract](../README_REFERENCE.md#exporting-active-candidates) is authoritative
  for scope, fields, API migration, byte/row limits and limitations. Only owned
  active candidates are exported, including opt-outs, never raw provider payloads.
  Formula-risk text receives a visible prefix; quotes are escaped. Stored values
  remain unchanged. This is not a full privacy export, lossless backup or proof
  that every spreadsheet application treats the file safely.
- Repeatable-read preflight loads sizes, not large legacy text, before the bounded
  field projection. Final encoded bytes are checked separately. Oversized exports
  fail without a partial file. Count/scope/format audit insertion and commit must
  succeed before returning CSV; generation is not evidence of a saved download.
  The UI uses the current mutation result only, checks fresh identity before
  download, guards pending/unmounted/account-changed attempts and explains account
  lookup failure. An ambiguous generic no-file claim was corrected after review.
- Test-first and React skills guided implementation; the frontend-testing skill
  selected regular Playwright because the Browser plugin was unavailable. Current
  OWASP CSV guidance was consulted for formula-prefix/escaping limitations; the
  visible literal prefix is an application design choice, not a universal
  spreadsheet-safety certification. No Excel/LibreOffice save/reopen test was run.
- Seventeen new CSV cases first failed, then passed (29 total), covering risky
  ASCII/full-width, whitespace/control/apostrophe prefixes, escaping, unchanged
  inputs and oversized output. Nine of the initial eleven SQL cases failed before
  implementation; the expanded **16-case export suite passes**, including account
  mismatch, strict input, stored verification, empty export, 10001st-row detection,
  source-byte and final-quoting overflow, and a real SQL audit-insert rejection.
  A new presentation test reproduced a silently disabled control; both presentation
  cases now pass with a generic recovery explanation.
- Fresh full suites passed **369 unit tests / 34 files** (60.36s) and **309
  integration tests / 21 files** (76.35s), with **15 existing legacy skips**.
  Existing missing-provider/capacity-test diagnostics were observed, not live
  provider activity. TypeScript, scoped formatting and production build passed
  (Vite **6.46s**, server **479.7 kB**). The final copy-only alert correction was
  followed by another focused presentation run and connected browser rerun.
- The production bundle at loopback `http://127.0.0.1:13014/outreach` passed four
  connected Playwright **1.62.1** / Chromium **148.0.7778.0** stages with isolated
  MySQL **8.4.11**, migrations through 0030: actual CSV download; real audit-write
  failure without reusing the earlier artifact; an injected account-lookup 503
  with recovery guidance/no download; and a held real export response discarded
  after changing the cookie to a newly registered, unverified second account.
  This last case combines identity and verification change, not independently
  verified A-to-verified-B acceptance. One download occurred across all four
  stages. Expected fault console messages were classified explicitly; no
  unexpected page/console errors or external browser requests remained. Server
  graceful shutdown was validated before the success result.
- Desktop **1440x1000** and mobile **375x812** screenshots were inspected; export
  interaction, page identity, meaningful content, no framework overlay and mobile
  overflow checks passed. Harness/screenshots are outside the repository at
  `outputs/candidate-export-ui-check.cjs` and
  `outputs/candidate-export-{desktop,mobile}.png`. This used the existing separate
  cached-dependency browser-test image with current code mounted read-only, no
  published host ports and explicit database email-verification fixtures. It is
  not current production-image, inbox, load or live-platform acceptance.
- Bounded independent read-only review found no important/critical defect; its
  recommendations led to audit/encoded-size tests and more precise UI wording.
  Forced commit failure, simultaneous edits between the two snapshot reads,
  independent unmount/double-click browser scenarios and wider spreadsheet
  compatibility remain unverified. They are not implied by the passing tests.
- Full privacy export/deletion and retention, conversation outcomes/reminders,
  remaining tenant paths, approved platform exports/groups, live provider checks,
  deployment/backup/restore, budget enforcement and pilot acceptance remain open.
  Changes remain local/uncommitted/unpushed on `agent/public-saas-beta`; the complete
  goal stays active.
- Cleanup was verified after terminal test runners: the full-suite database had
  zero users, prospects or held export CHECK constraints; the browser database
  held twelve synthetic diagnostic accounts and no export CHECK constraints.
  Only `cofounder-export-full-20260913-database-1` and
  `cofounder-export-20260913-database-1` were stopped, both exit zero. Their
  recreatable tmpfs fixtures were discarded; test-image/container logs, harness
  and screenshots remain. No real customer data or unrelated services were removed.

### Connected browser-to-MySQL workflow and login cache fix

- Previous goal turn classification: progress (individual intake and duplicate
  review delivered locally). This continuation keeps the full worldwide free-beta
  scope and EUR 100/month planning ceiling. No purchase, provider configuration,
  public deployment, commit, push or merge was performed.
- A connected Playwright **1.62.1** / Chromium **148.0.7778.0** run passed all ten
  checkpoints against the production-built app and MySQL **8.4.11**, InnoDB,
  migrations through 0030. Local HTTP requests reached the real app with no RPC
  reply fixtures: registration/unverified gate; individual intake with provenance
  and retry receipt; profile correction; original human draft/review/approval;
  immutable revision invalidating old approval; opt-out and blocked drafting;
  cancellation retaining history; revoked-cookie and second-account read denial;
  real password sign-in; server restart preserving session and workspace.
- Browser actions were checked against committed SQL records, including cancelled
  state/closure time, original and revised bodies, revision linkage, source
  evidence, consent, idempotency and audit actions. The run recorded zero
  user-confirmed sends, zero external browser requests and zero console/page
  errors. Those observations are not general proof of provider delivery behavior.
  Account verification used a clearly guarded synthetic database fixture after
  actual registration and the unverified UI gate; no verification mail was sent
  and no inbox/password-recovery journey is claimed.
- The connected run exposed a real sign-in defect: `auth.login` returned 200, but
  navigation to the workspace read cached signed-out data before the inactive
  account query refreshed, bouncing back to `/login`. Login and registration now
  await inactive account-query refetch with error propagation before navigation.
  Four new regression tests using the actual component callbacks and real tRPC/
  QueryClient utilities first failed on stale data and suppressed refresh errors,
  then passed. Existing recovery-screen tests also passed. Bounded independent
  source review found no remaining important/critical issue in this fix; it did
  not independently execute tests or certify the whole authentication system.
- The E2E/frontend-testing skills guided connected validation and screenshot
  review; test-first and React guidance kept the fix in the existing mutation
  callbacks. The Browser plugin was unavailable, so regular Playwright was used.
  Desktop **1440x1000** and mobile **375x812** screenshots were inspected. Page
  identity, meaningful rendering, absence of a framework error overlay and mobile
  horizontal-overflow checks passed. The harness and screenshots remain outside
  the repository in `outputs/connected-workflow-e2e.cjs` and
  `outputs/connected-workflow-{desktop,mobile}.png`.
- Initial harness runs needed test-image Chromium libraries/fonts and corrections
  to waits for committed revision/opt-out UI state. A reviewer also caught cleanup
  checks that could skip an early server exit or stop after another cleanup error;
  all cleanup attempts now run, and success is printed only after exit-zero and
  `shutdown_completed` validation. The final runner
  `cofounder-connected-e2e-20260913-login-green` exited zero. This is a separate
  cached-dependency test image with current source/dist mounted read-only, no
  published host port and the database's network-isolated namespace. Chromium ran
  with normal web-security settings but without its process sandbox inside the
  disposable container; this is not production-browser security acceptance.
- TypeScript and production build passed (Vite **12.25s**, server **475.3 kB**),
  as did the focused test formatter and git diff --check (existing CRLF warnings).
  The full local unit suite passed **350 tests / 33 files** in **68.44s**; existing
  missing-provider fallback diagnostics appeared in the legacy tests. The earlier
  293-test integration suite is prior-turn evidence, not
  newly rerun here. This connected test does not replace full integration,
  load, backup/restore, current-production-image or live-provider acceptance.
- After the runner exited, read-only inspection confirmed nine synthetic test
  accounts from the diagnostic runs and no confirmed-send records. Only the exact
  disposable `cofounder-connected-e2e-20260913-database-1` service was stopped;
  it exited zero. Its recreatable tmpfs fixture data was discarded, while runner
  logs, the test image, harness and screenshots were retained. No shared host,
  unrelated container or real customer data was removed.
- All changes remain local/uncommitted/unpushed on `agent/public-saas-beta`.
  Conversation outcomes/reminders, full privacy lifecycle, complete tenant-path
  review, approved platform exports/groups, live email/platform acceptance and
  deployment/billing/pilot gates remain unfinished. The complete goal stays active.

### Individual candidate intake and duplicate review

- Previous goal turn classification: progress (immutable message revisions and
  unsent cancellation delivered and verified). Rechecked the dirty worktree and
  continued the full accepted worldwide free-beta scope without publishing,
  purchasing, deploying or contacting any provider. The EUR 100 planning ceiling
  remains unchanged and is not yet verified against hosted operating costs.
- Added **Add individual candidate** with the full supported profile fields,
  source/contact status, direct-person declaration and opaque evidence reference.
  A POST-only preview returns at most 20 owned possible duplicates, including
  archived/opted-out candidates, without writing data. Reviewed save either creates
  a new owned record with provenance or reuses an existing record without changing
  its profile, evidence, timestamps, archive or contact status. The
  [detailed reference](../README_REFERENCE.md#adding-one-candidate-and-reviewing-duplicates) is the
  authoritative user/API contract and records matching limitations. This is not
  automatic identity resolution, cross-platform matching or an existing-row merge.
- Duplicate review and save share strict inputs and content-based review tokens.
  Reads are repeatable-read snapshots; writes lock the account first, then matched
  candidates, before any new-record capacity lock. Candidate insertion, audit and
  idempotency receipt are atomic under READ COMMITTED. Replay after reconnect or
  capacity changes returns the owned saved ID without renewing consent. Reuse
  consumes no new candidate slot. Raw provider and declaration payloads are excluded
  from preview. Preview uses POST so candidate input does not enter a GET URL.
- The initial **24 MySQL cases** failed against the missing procedures before
  implementation. A source fixture then used the wrong catalogue label (`github`
  instead of the actual `github-collaboration`) and was corrected without widening
  the source gate. Independent review found a P2: an exact profile match could be
  bypassed by selecting a different name-only suggestion. A new test reproduced it;
  the API now requires the exact ID before audit/receipt writes, and the UI disables
  competing choices. **All 25 focused cases pass**, including stale/concurrent
  adds, strict protected-field rejection, source/account/verification boundaries,
  opt-out preservation, full-capacity reuse/replay, bounded review and real SQL
  audit-failure rollback. Follow-up bounded source/UI review found no remaining
  critical or important issue; it is not a whole-product security certification.
- No new migration was needed. Fresh inspection confirmed MySQL **8.4.11**,
  InnoDB and the existing owned-profile index. An empty-fixture EXPLAIN for the
  name-review query used that index's owner prefix with residual name filtering
  and filesort. This is not a realistic-load benchmark; name-query cost at actual
  configured capacity and platform URL canonicalization remain unverified.
- Browser flow passed at `http://127.0.0.1:13014/outreach`, Playwright **1.62.1**
  Chromium, desktop **1440x1000** and mobile **375x812**. The Browser plugin was
  absent; React and frontend-testing skills guided a mounted account-concealed
  form and regular Playwright validation. The harness first failed on the missing
  Add control. It now covers intake → direct-data acknowledgment → duplicate
  review → reuse or explicitly distinct creation → saved result, plus 503 same-key
  retry, 409 refresh/reselection, dirty-close/pending keyboard guards, account
  failure/recovery and switch concealment. A separate exact-profile scenario proves
  competing name-only/new-record choices are disabled. Required page identity,
  meaningful rendering, no framework overlay, responsive overflow and screenshot
  checks pass. Expected injected errors were classified explicitly; no unexpected
  console errors or external requests occurred. Previous candidate edit/details/
  opt-out/pagination and message-revision browser harnesses also pass.
- Full source-mounted cached-image verification passed **346 unit tests / 32
  files** (60.97s), **293 integration tests / 20 files** (66.41s), with **15 existing
  legacy skips**. The new file is included in `test:integration`. TypeScript,
  scoped Prettier, git diff --check (existing CRLF warnings) and production build
  passed (Vite 12.29s; server 475.3 kB). Browser tests use synthetic RPC; MySQL API
  tests are separate, not a combined browser-to-live-database/inbox journey. The
  inspected screenshots and harness remain outside the repository at
  `outputs/candidate-intake-{desktop,mobile}.png` and
  `outputs/candidate-intake-ui-check.cjs`. Cached-image success is not current
  production-image, load or live provider acceptance.
- All changes remain local/uncommitted/unpushed on `agent/public-saas-beta`, HEAD
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. Full test runner exited zero. Read-only
  checks found no intake fixture accounts, candidates, outreach or held test CHECK
  constraints in the isolated database. Only `cofounder-intake-20260913-database-1`
  was stopped, independently confirmed exited zero. Its re-creatable synthetic
  tmpfs data was discarded; container logs remain. No shared service or existing
  user database was stopped or changed.
- Full objective remains active. Next workflow gaps include conversations and
  reminders and a complete real browser-to-database journey; remaining release
  gates also include privacy export/deletion, administrative/legacy-account
  protections, permitted platform workflows, API/traffic budgets, other retention,
  deployment/restore/monitoring, declared-load/cost and customer-pilot acceptance.

### Immutable outreach revisions and unsent cancellation

- Previous implementation checkpoint made progress on candidate corrections and
  archive/restore. Continued the accepted worldwide free-beta scope. Robert's
  EUR 100/month initial ceiling remains planning-only, with EUR 80 recurring and
  EUR 20 reserve; no purchases, provider setup, deployment or publication occurred.
- Delivered owned message details, immutable human-authored revision, unsent
  cancellation and previous/replacement navigation in the review queue. The
  [detailed reference](../README_REFERENCE.md#revising-and-cancelling-unsent-outreach) is the authoritative
  usage, API, retry and migration contract. A revision creates a new unapproved
  draft and preserves the cancelled original's text, evidence and timestamps.
  Stale controls on the old ID cannot act on the replacement. Every version uses
  retained-record capacity. Neither action sends or recalls external messages.
- Strict verified/account-bound inputs, message-plus-candidate review hashes,
  sent-history guards, fresh source declarations and inherited-match ownership
  checks protect the write. Account-first READ COMMITTED locking makes replacement,
  original cancellation, capacity admission, audit and durable replay receipt
  atomic. Cancellation remains available after opt-out/archive/source ineligibility.
  Identical committed revision replay returns the child's current state without
  renewing permission or restoring cancelled records. Lists no longer expose raw
  provider data through their joined candidate; details use a repeatable-read
  snapshot and minimal candidate context.
- **27 new real-MySQL checks pass**, including four unsent starting states, terminal
  and legacy sent-history rejection, owner/account/verification boundaries, strict
  input and fresh-declaration requirements, unchanged/stale text, concurrent
  competing revisions, reconnect replay, full-capacity replay, changed-key conflict,
  rollback after a genuine SQL audit failure, cancellation after opt-out/archive,
  raw-provider exclusion and malformed legacy cross-owner match rejection. The
  initial missing-feature cases failed before implementation; the foreign-match
  regression exposed a real inherited-link defect before its guard was added.
- Generated additive migration **0030** applied and repeated migration runs passed.
  Snapshot comparison from 0029 changes only `outreach_records`. Fresh MySQL 8.4.11
  inspection confirmed InnoDB, nullable `revises_id`, unique parent index and
  self-reference with NO ACTION delete/update. Original rows are not rewritten.
  README records forward-rollback preservation and child-before-parent handling
  for a future approved deletion workflow. Large-table migration lock/duration
  testing and production backup/restore acceptance remain unverified.
- Browser validation passed on `http://127.0.0.1:13014/outreach`, Playwright 1.62.1
  Chromium, desktop 1440x1000 and mobile 375x812. Browser plugin was unavailable;
  the frontend-testing skill used regular Playwright against the production build
  with synthetic RPC and blocked external requests. The path was Review queue →
  View/manage → Revise message → original-writing/not-sent acknowledgments → fresh
  draft → previous/replacement history → acknowledged cancellation. Tested 503
  same-key retry, 409 retained edits and explicit reload, account failure/recovery
  without lost edits, dirty-close confirmation, pending duplicate/escape guards,
  account-switch concealment, page identity, no blank/overlay, mobile overflow and
  console health. No unexpected errors or external requests occurred. Earlier
  candidate-edit and candidate details/opt-out/pagination harnesses also passed.
- Independent read-only review found no critical/important issue and one minor
  lost-response recovery gap: refetching a cancelled parent disabled retry of its
  retained editor. A failing browser regression preceded the new recovery alert
  and **Inspect saved replacement** action. Both ordinary-response and
  committed-but-lost-response scenarios now pass without adding another revision;
  navigation still confirms dirty-text discard. Focused follow-up source review
  found no remaining actionable issue. This is bounded review, not a security audit.
- Full source-mounted cached dependency-image run passed **346 unit tests / 32
  files** (51.09s) and **268 integration tests / 19 files** (64.52s), with **15
  existing legacy skips**. The new suite is included in `test:integration`.
  TypeScript, scoped Prettier, git diff --check (existing CRLF warnings) and
  production build passed (Vite 12.56s; server 466.1 kB). Provider-error diagnostics
  are expected tests, not live acceptance. Browser screenshots were inspected and
  remain outside the repo in `outputs/outreach-revision-{desktop,mobile}.png`, with
  the reproducible `outreach-revision-ui-check.cjs` harness alongside them. Browser
  mocked-RPC and real-MySQL API checks are separate, not a full browser-to-live-DB
  journey. Cached-image tests do not certify the current production image or load.
- Work remains local/uncommitted/unpushed on `agent/public-saas-beta`, HEAD
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. The full runner exited zero; fresh
  read-only checks found zero revision fixture accounts, candidates, outreach
  records or held CHECK constraints in the isolated test database. Only
  `cofounder-draft-revision-20260913-database-1` was stopped and independently
  confirmed exited zero. Re-creatable tmpfs test data was discarded; container
  logs remain. No shared Docker/WSL service or existing user database was touched.
- The full goal remains active. Remaining work includes complete candidate intake
  and duplicate review, conversations/reminders, permitted platform workflows,
  privacy export/deletion, administrator and legacy-account safeguards, AI/traffic
  budgets, remaining retention, staging/live acceptance, backups/restore,
  monitoring, load and tax-inclusive operating-cost acceptance. The platform
  catalogue is not proof of live integrations or exhaustive worldwide coverage.

### Candidate profile corrections and archive/restore

- Previous turn classification: no implementation progress (budget acknowledgment).
  Revalidated the active worktree and resumed the accepted worldwide free-beta
  scope. The EUR 100/month ceiling remains planning-only. No provider calls,
  purchases, deployment, publication or live customer-data changes were made.
- Delivered strict profile-only corrections, reviewed archive/restore, active/
  archived/all list filtering, and bounded recent candidate history. The
  [detailed reference](../README_REFERENCE.md#correcting-a-candidate-profile) is the authoritative usage
  and API contract, including field limits, stale-review conflicts, no-op retries,
  unsaved-work limitations and the intentionally replaced ID-only archive request.
  Source records, original import provenance, contact status, stored drafts and
  assessments are preserved. Archiving does not release retained-record capacity;
  restoration does not restore consent or renew outreach receipts.
- Details and locking mutation reads share one explicit profile/source projection.
  Content hashes detect changes even within one timestamp second and from legacy
  writers. All mutations lock the owner account before its candidate and commit
  state plus audit together under READ COMMITTED. Failed audits roll back changes;
  already-saved requested values produce no duplicate audit. Successful edits
  record changed field names, not old/new personal values. Details history is
  bounded to 20 owner-scoped successful changes, read with the existing repeatable-
  read snapshot and sanitized before response. Lists no longer return raw provider
  payloads or unvalidated import provenance. No schema migration was needed.
- **26 new MySQL integration checks** pass. The initial 24 failed against missing
  edit/revision/restore functionality and the old unsafe archive behavior; the
  subsequent two exposed the missing history and raw list-field exposure before
  those implementations. Tests cover strict limits/protected fields, unchanged
  legacy data/evidence, stale same-second updates, concurrent edit conflict,
  account/owner/verification checks, retries, archive/restore with opt-out retained,
  separate list filters, history bounds/privacy and genuine database CHECK-induced
  audit failure/rollback for each mutation.
- Browser flow passed on `http://127.0.0.1:13014/outreach`, Playwright 1.62.1,
  Chromium, desktop 1440x1000 and mobile 375x812. Browser plugin was unavailable;
  the frontend-testing skill used regular Playwright. Initial missing-control and
  missing-history checks failed before UI implementation. Tested edit/save,
  explicit retry after synthetic 503, retained text and blocked save after 409,
  explicit discard/reload, dirty-close confirmation, pending duplicate/escape
  guards, recent changes, archive/filter/restore, retained opt-out and import text,
  account-switch concealment, responsive overflow and page/console health.
  No unexpected console errors or external requests occurred. The earlier candidate
  details/opt-out/pagination browser harness also passed on the updated build.
- Independent read-only review found a P2: temporary account-check failure
  unmounted the editor and lost unsaved corrections. A browser regression
  reproduced it. The editor now retains its mounted in-memory state but renders
  no private DOM and blocks submission while concealed. Error-to-recovery browser
  verification passes; follow-up source review found no remaining actionable issue
  within this increment. This is bounded review, not whole-product certification.
- Full source-mounted cached dependency-image run passed **346 unit tests / 32
  files** (54.48s) and **241 integration tests / 18 files** (67.35s), with **15
  existing legacy skips**, on MySQL 8.4.11/InnoDB. Tests use synthetic records and
  no network outside the isolated database namespace. Existing unavailable-provider
  tests emit expected diagnostics; these are not live integration acceptance.
  TypeScript and production build pass (Vite 4.55s; server 453.4 kB), as do scoped
  Prettier and git diff --check (existing CRLF warnings). The browser harness uses
  synthetic RPC responses; real MySQL API tests are separate, not an end-to-end
  browser-to-production-database test. Screenshots/harnesses are outside the repo
  in the task's `outputs` directory. Cached test-image success is not current
  production-image or declared-load acceptance.
- All work remains local/uncommitted/unpushed on `agent/public-saas-beta`, HEAD
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`. Full runner exited zero. Read-only cleanup
  checks confirmed zero candidate-edit fixture accounts, zero remaining candidates
  and zero held test CHECK constraints. Only
  `cofounder-candidate-edit-20260913-database-1` was stopped, independently confirmed
  exited zero. Re-creatable tmpfs test data was discarded; container logs remain.
  No shared Docker/WSL service or existing user database was touched. The goal remains
  active: remaining release work includes complete candidate intake/duplicate and
  conversation workflows, permitted platform workflows, draft lifecycle, privacy
  export/deletion, administrative protection, staging/live acceptance, operational
  monitoring/backups/load/budget acceptance and the other gates below.

### Opt-in account-mail retention

- Previous turn classification: progress (shared durable dispatch budget). This
  increment implements the outstanding recovery-mail retention requirement without
  changing the worldwide beta scope or EUR 100/month ceiling. No purchases,
  provider calls, publication, deployment or live customer-data deletion.
- `ENABLE_ACCOUNT_MAIL_RETENTION` defaults false. The independent server worker
  requires a database but not email credentials; it runs immediately, then one
  minute after each completed pass, and drains before database shutdown. Each of
  three separately committed READ COMMITTED phases selects at most 100 rows:
  expired payload clearing/discard, terminal metadata deletion more than seven
  days after original expiry, and expired request-HMAC quota deletion. Live leases,
  locked records, fixed dispatch budgets and other key formats are preserved.
  Current/future records and all customer/outreach/consent/audit data remain intact.
  Database UTC offset is checked before each transaction; a nonzero offset fails
  closed. Operational terms and read-only checks are in the authoritative
  [detailed retention contract](../README_REFERENCE.md#account-mail-retention).
- Additive migration 0029 creates only `account_mail_jobs_expiry_idx`. Snapshot
  comparison confirmed no other table/column changes. Applied on isolated MySQL
  8.4.11/InnoDB; SHOW INDEX and EXPLAIN confirmed the new job-expiry and existing
  quota-expiry indexes. This is small-fixture query-plan evidence, not declared-load
  or production index-build acceptance.
- Test-first service/worker and real-server wiring checks failed before their
  implementations. Concurrency testing then exposed a real MySQL deadlock caused
  by optimizer-selected scans for bulk IN-list deletion; InnoDB's deadlock report
  identified the overlapping primary-key locks. Replacing bulk deletes with
  selected-key point deletes resolved it. Because SKIP LOCKED may defer busy rows,
  the concurrency test was corrected to compare reported deletions with actual
  remaining rows and prove completion on the next pass, rather than require both
  concurrent passes to exhaust the backlog immediately.
- **13 retention integration tests** pass, covering opt-in, expiry, future/live
  lease preservation, seven-day cutoff, permanent budget-key preservation, bounded
  repeated cleanup, simultaneous workers, held quota/job locks, concurrent quota
  renewal, rollback/sanitized failure, application clock jumps, non-UTC refusal and
  actual server startup/shutdown with sending disabled. **Five worker/configuration
  unit tests** pass, including no overlap, shutdown drain and sanitized retry.
  Independent read-only review found no actionable issues.
- Full cached dependency-image runner with current source mounts passed **346 unit
  tests / 32 files** (46.51s) and **215 integration tests / 17 files** (48.27s), with
  **15 existing legacy skips**, after applying all migrations. TypeScript and
  production build pass (Vite 5.17s; server 447.5 kB). The cached test image is not
  production-image acceptance. No frontend changed; no new browser claims are made.
  Scoped formatting, Compose configuration validation and git diff --check pass
  with existing line-ending warnings.
- Cleanup confirmed zero held test constraints and zero synthetic mail jobs. The
  full runner exited zero; only `cofounder-mail-retention-20260913-database-1` was
  stopped and independently confirmed exited zero. Stopping discarded recreatable
  tmpfs fixture data; container logs remain. No shared Docker/WSL service or existing
  user database was restarted or removed. All work remains local/uncommitted on
  `agent/public-saas-beta`, HEAD `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.
- Remaining: operator acceptance of this permanent-deletion policy and historical
  UTC data conventions, monitoring/backlog/backup and production load acceptance,
  session/token/other auxiliary retention, full account deletion/export/privacy
  controls, complete customer/platform workflows and all other release gates.
  Seven days is an operational proposal, not a legal determination or deletion SLA.
  Neither row cleanup nor mail limits alone prove the EUR 100/month invoice ceiling.

### Shared durable account-mail dispatch budget

- Previous turn classification: progress (retained-record capacity admission).
  This increment advances the EUR 100/month plan without changing the worldwide
  scope or authorizing purchases, provider setup, publication or deployment.
  Local README, configuration and implementation now describe one shared allowance
  for verification, recovery and password-change notices. The authoritative
  [dispatch budget contract](../README_REFERENCE.md#account-mail-dispatch-budget) contains
  defaults, operational queries, deferral behavior and limitations.
- Database-backed UTC calendar windows default to 100 daily and 1,000 monthly
  admitted attempts. Zero pauses dispatch; empty/invalid settings fail validation.
  Fixed non-personal keys survive process and queue-secret rotation. Day/month rows
  lock in order after the account lock, and the database clock is read after both
  locks. Reservations commit atomically with token/job changes before transport;
  uncertain outcomes remain charged. Missing storage fails closed. No migration
  was added: migration 0024's quota table is reused, while all branch migrations
  through 0028 remain required. MySQL 8.4.11/InnoDB confirmed; EXPLAIN uses the
  primary-key constant lookup for the budget row. This is not a load benchmark.
- Denied verification preserves the previous usable link. Queued mail is deferred
  without consuming another retry, replacing a token or changing its payload;
  expiration still discards jobs. The worker ends its batch on budget exhaustion.
  Reset-request responses remain non-enumerating and their IP/address admission
  remains separate. Security notices can also be delayed; this requires monitoring
  and operator acceptance before public release. Counters are not billing records.
- Test-first baseline reproduced 13 missing dispatch protections plus five new
  configuration/worker cases. All passed after implementation. Independent review
  then found a real expiry timezone regression: SQL FROM_UNIXTIME writes did not
  match Drizzle's Date decoder. Two real-session tests failed at +02:00 and -07:00;
  restoring the existing Date-serialization boundary fixed both. A further SQL
  claim-write failure test proves rollback of the previous reset token, encrypted
  payload, attempts and both counters with zero transport calls. Reviewer follow-up
  found no remaining actionable issue. All **16 focused mail-budget tests pass**.
- Full isolated runner passed **341 unit tests / 31 files** (76.67s), followed by
  **199 integration tests / 16 files** (54.19s), with 15 existing legacy skips.
  Final integration rerun including the review fixes/extra cases passed **202 tests
  / 16 files**, **15 skipped** (50.80s). The cached Node dependency image used current
  source mounts, not the production image. No real email provider was contacted.
  TypeScript passed. Final production build passed (Vite 12.07s; server 442.1 kB).
  A subsequent direct unit invocation accidentally retained NODE_ENV=production
  from that build and failed seven configuration-dependent cases; this is a runner
  error, not passing evidence. The supported test:unit command explicitly sets test
  mode; its final Windows rerun passed **341 tests / 31 files** (60.82s).
- Frontend-testing skill used regular Playwright 1.62.1/Chromium because the Browser
  plugin is unavailable. Flow: loopback `/verify-email` -> keyboard resend -> visible
  429 service-limit alert -> no automatic retry -> explicit keyboard retry after
  simulated capacity recovery -> provider-accepted status and cleared error.
  Desktop 1440x1000 and mobile 375x812 pass page identity, meaningful render,
  no framework overlay, no horizontal overflow, console and interaction checks.
  Two expected logs represent the intentional 429; zero unexpected errors or
  external requests. Screenshots were inspected and remain outside the repo in
  `outputs/mail-budget-ui-*`. No frontend code changed. This uses intercepted RPC,
  not a combined browser-to-database or real-inbox acceptance test.
- Cleanup verified zero held failure-test tables/constraints. The full and final
  integration containers exited zero. Only the isolated
  `cofounder-mail-budget-20260913-database-1` was stopped and confirmed exited zero;
  recreatable synthetic tmpfs data is discarded, logs retained. No browser listener
  remains on port 13014. Compose validation and git diff --check pass with existing
  line-ending warnings. No shared services were restarted or removed.
- Still open: provider invoice stops/quotes/alerts, AI quotas, traffic/abuse controls,
  auxiliary retention, complete account lifecycle and candidate/outreach workflows,
  platform permissions/live acceptance, privacy review, deployment, backup/restore
  and load/pilot acceptance. Application limits alone cannot guarantee EUR 100/month.
  All work remains local and uncommitted on `agent/public-saas-beta`, HEAD
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no main/remote publication is claimed.

### Durable retained-record capacity admission

- Previous turn classification: progress (candidate details/opt-out/pagination
  implemented and verified). This increment implements growth limits toward the
  EUR 100/month public-beta plan, not a claim that invoices are capped or the full
  worldwide scope is complete. No purchase, provider configuration or publication.
- Configurable bounded defaults: 100 retained accounts; 50,000 candidates globally
  and 1,000 per owner; 25,000 outreach records globally and 500 per owner. These are
  provisional product limits, not measured hosting capacity. Zero pauses growth;
  invalid/empty values fail configuration validation. All processes must use the
  same configuration. Archived/opted-out/closed and legacy rows remain counted and
  preserved, including records already above a reduced ceiling.
- All six server insertion sites now acquire shared per-resource InnoDB locks and
  count retained data within their insertion transaction. Owner-scoped writers
  keep account-first locking, then the resource; READ COMMITTED sees admissions
  committed by other processes. Imports count only actually new rows and roll back
  the entire batch/audit/receipt at the limit. Matching retries and duplicate-only
  imports remain possible at capacity. Supported reads/opt-outs/transitions continue.
  New registration also checks duplicate email under the accounts lock, preventing
  the reproduced simultaneous-register race without altering legacy duplicates.
- Additive migration 0028 creates only `capacity_locks`; generated snapshot
  comparison confirmed zero existing-table changes. MySQL 8.4.11 confirms InnoDB.
  EXPLAIN selects covering indexes for global counts and owner indexes for scoped
  counts. Those checks used small synthetic fixtures and do not establish latency
  at the declared limits. The README documents effective configuration, read-only
  count queries, migration order, coordinated config changes and a retain-data
  forward rollback. No production database was accessed.
- Test-first evidence: 10 configuration cases failed before validation. Twelve
  new database cases reproduced missing admission/duplicate-email safeguards;
  one preservation case initially used an invalid source label, was corrected to
  the existing canonical source ID, and passed against the old behavior. All 13
  then passed against the implementation. Independent read-only review found no
  actionable bug or lock cycle, and requested stronger coverage. Added simultaneous
  fresh-process final-slot competition and missing-migration failure tests; all
  **15 focused capacity cases pass** (3.05s). The missing-table test temporarily
  renames and restores only the isolated synthetic mutex table in finally; no
  records are dropped. New writes fail closed while opt-out remains available.
- Full checkpoint passed **336 unit tests / 31 files** (49.97s), **184 integration
  tests / 15 files** (43.17s), with 15 existing legacy skips. Final integration
  rerun including the two additional cases: **186 passed / 15 files**, **15 legacy
  skips** (39.02s). Skips are not counted as passing evidence. Current
  source mounts used the cached Node dependency image, not the production image.
  TypeScript and production build passed (Vite 11.96s; server bundle 437.3 kB).
- Frontend testing skill: Browser plugin unavailable, regular Playwright 1.62.1
  used with Chromium at loopback `/outreach`, 1440x1000 and 375x812, synthetic RPC
  only. Capacity denial is visible, preserves CSV/declaration, does not automatically
  retry, and an explicit keyboard retry after simulated capacity recovery uses the
  identical payload/key. Correct page/nonblank render, no framework overlay,
  no horizontal overflow, screenshots and zero unexpected console/page errors or
  external requests were checked. Two expected error logs are from the deliberate 429. Existing import, qualification and candidate browser harnesses also pass.
  Artifacts remain outside the repo in `outputs/capacity-ui-*`. This is not combined
  browser-to-database or provider acceptance. No frontend code was changed here.
- Still open: provider billing hard stops and actual quotes, durable mail/AI limits,
  traffic/abuse admission, auxiliary record/session/audit retention, byte/storage
  accounting, monitoring/backup/load acceptance and the remaining customer/platform/
  privacy/deployment workstreams. Operator SQL/seed scripts bypass application
  admission and must not run against live service without separate review.
- Final cleanup confirmed zero held migration-failure fixture tables and all three
  mutex resources restored. Full, final-focused and final-integration runners exited
  zero. Only `cofounder-capacity-20260913-database-1` was stopped and independently
  confirmed exited zero, discarding recreatable synthetic tmpfs data while retaining
  logs. No browser test listener remains on port 13014. Scoped formatting, final
  TypeScript recheck, Compose configuration validation and `git diff --check` pass
  (existing line-ending warnings only). Branch `agent/public-saas-beta` remains at
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; all changes are local/uncommitted.

### Candidate details, contact suppression and pagination

- Previous turn classification: progress (verified CSV source admission and
  provenance). This increment adds a usable candidate-details dialog and one-way
  opt-out without changing the worldwide scope, EUR 100/month planning ceiling or
  purchase/publication/deployment boundaries. All work remains local and uncommitted.
- Verified-email details/opt-out APIs require the reviewed account ID and owned
  candidate. Details use an explicit profile projection, validate stored provenance
  shape/actor, and exclude raw provider enrichment. Missing/invalid legacy evidence
  is labelled, not reconstructed. Up to 20 newest opt-out events are visible, not
  a complete source or activity history. Owned archived evidence remains readable.
- Opt-out takes the same account-first locks as supported outreach actions and
  commits suppression plus a non-content audit in one transaction. Audit failure
  rolls back suppression; simultaneous/repeated requests create at most one event.
  Already opted-out imports do not acquire invented historical events. Existing
  candidate, provenance and outreach text are preserved. Contact restoration needs
  a separate reviewed-evidence workflow and is not implemented.
- Independent read-only review found inconsistent detail snapshots during a
  concurrent opt-out. A real-MySQL controlled interleaving reproduced old candidate
  status beside a newly committed event. Both reads now share a read-only repeatable-
  read transaction; the regression passes and reviewer re-review cleared the finding.
  This bounded review is not a whole-application security audit.
- Test-first endpoint/account/validation/rollback/concurrency/pagination regressions
  pass: **20 candidate integration tests** (focused 2.21s). Full isolated Linux run:
  **326 unit tests / 30 files passed** (43.76s), **171 integration tests / 14 files
  passed** (78.22s), and **15 existing legacy skips**. Skips are not passing evidence.
  Current source mounts used a cached dependency image and MySQL 8.4.11; this is
  not production-image or live-provider acceptance. No schema change was added.
- Production-built browser checks use loopback port 13014, synthetic intercepted
  RPC and Chromium at 1440x1000 and 375x812. Browser plugin unavailable; regular
  Playwright used. Pagination, source display, load retry, keyboard acknowledgment,
  failed-save retention, pending-close protection, exact account-bound retry,
  suppression display, retained CSV and account-switch privacy all pass. A separate
  failing legacy-array case exposed a render crash; guarded list rendering now
  labels malformed values without changing stored data. No unexpected console/page
  errors, external requests, framework overlays or horizontal overflow were observed.
- TypeScript and production build pass (Vite 19.02s; server bundle 430.9 kB). The
  existing import, qualification and profile browser harnesses also pass against
  that build. Browser evidence remains outside the repository in
  `outputs/candidate-ui-*`; synthetic UI tests do not prove browser-to-database or
  inbox acceptance. Candidate add/edit, duplicate reconciliation, complete history,
  reviewed contact restoration, account deletion, global cost/capacity controls,
  approved platform workflows and public deployment acceptance remain unfinished.
- Final cleanup: only `cofounder-candidate-20260913-database-1` was stopped,
  discarding its recreatable synthetic tmpfs fixtures. Database and focused/full
  runners are independently confirmed exited zero; their logs remain available.
  Port 13014 has zero listeners. Scoped formatting, final TypeScript recheck and
  `git diff --check` pass (existing line-ending warnings only). No unrelated
  containers were changed. Branch remains `agent/public-saas-beta`, with HEAD
  `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; nothing was committed or published.

### CSV source admission and recorded provenance

- Previous turn classification: no progress (budget confirmation repeated an existing
  plan). This turn resumed implementation against the live dirty worktree, without
  changing the full worldwide public-SaaS objective or EUR 100 planning ceiling.
- New CSV requests require the reviewed account ID and a strict direct-from-person
  declaration with processing-rights acknowledgment and an opaque evidence reference.
  Both the public route and import service enforce the account/declaration boundary.
  Source identity/URL checks reject missing, unknown, conflicting and held sources
  and unreviewed private-group categories before any insert. Opt-out rows remain
  importable for suppression; import does not promote them to contact permission.
- Migration 0027 adds nullable JSON provenance without changing or backfilling old
  rows. Each new prospect stores the server actor, resolved source, version, time,
  key, request hash and normalized declaration in the existing atomic transaction.
  Duplicates retain their original data, consent and provenance. Retry hashes bind
  CSV bytes plus declaration; pre-declaration receipts are not silently upgraded.
  The root README documents the API contract, deployment order and retain-evidence
  forward rollback. Realistic production migration lock timing remains untested.
- Test-first evidence: 21 added MySQL regressions failed the earlier implementation
  (missing declarations/source/account gates, missing provenance and changed-
  declaration replay). After enforcement, all 31 focused tests passed. A further
  real-SQL migration test preserves a preexisting opt-out on a uniquely named
  synthetic copy of the table; its cleanup removes only that recreatable fixture.
- Full isolated Linux/MySQL regression: **326 unit tests / 30 files passed**
  (36.74s), then **151 integration tests / 13 files passed** (21.46s), with **15
  existing skips**. The import file contributes 32 cases. Provider-unconfigured and
  disabled-automation diagnostics in older unit tests are expected, not live
  connector evidence. Full test container exited zero.
- UI validation uses the production build at `http://127.0.0.1:13014/outreach`,
  synthetic intercepted RPC only, Chromium 1440x1000 and 375x812. Browser plugin
  unavailable; regular Playwright used. New form tests first reproduced the absent
  acknowledgment gate. The browser then caught an invalid HTML pattern under the
  current regex semantics; corrected and rerun successfully. Declaration/account
  payload, disabled fields during a held retry, retained CSV across failure/tabs,
  same-key retry, fresh acknowledgment on CSV/reference changes, changed-request
  key and keyboard submit all passed, with no unexpected console errors, external
  requests, framework overlay or horizontal page overflow. Two logged errors are
  from the deliberately simulated 503. Screenshots are outside the repo in outputs.
- Independent read-only review found no important/blocking defects and confirmed
  the snapshot's only schema addition is provenance. Its minor wording finding was
  corrected. No commit, push, merge, deployment, purchase, account registration,
  provider call or message was performed.
- Final TypeScript check and production build passed (Vite 3.84s; server bundle
  424.5 kB), with scoped formatting and `git diff --check` passing (existing
  Windows line-ending warnings only). Final import, qualification and profile
  browser harnesses passed against that build. The qualification harness's old
  unqualified checkbox locator became ambiguous after the new import checkbox;
  it now selects the human-authorship checkbox by its accessible name. No
  production behavior was weakened to make that test pass.
- Cleanup verified: MySQL 8.4.11 reported the new column nullable, zero retained
  import fault constraints and zero migration fixture tables. Only this turn's
  `cofounder-import-policy-20260913-database-1` was stopped; it and the focused/full
  test containers are independently confirmed exited zero. No UI listener remains
  on port 13014. Stopping tmpfs discarded only recreatable synthetic test data;
  retained container logs remain available. No unrelated containers were changed.
- Targeted current source rechecks are recorded in `PLATFORM_SOURCE_REVIEW.md`.
  This declaration is not verified legal/provider permission and cannot detect a
  false customer assertion. Approved platform exports, concrete group approvals,
  historical import review/re-admission, source-history UI, full processing-purpose/
  basis review, global capacity/cost quotas and end-to-end live acceptance remain
  requirements. The direct-data phase does not replace broader platform coverage.

### Profile privacy and account-bound editing

- The original public profile defaults and unconditional `isPublic: true` onboarding
  submission are removed. Migration 0026 changes only the database default to false;
  its real SQL is exercised against existing true-valued rows and duplicates, which
  remain intact. Snapshot/journal generation is current. Existing flags are not
  treated as informed publication consent. No public-directory workflow is enabled.
- Verified profile APIs use one bounded schema. Strings are trimmed, signal lists
  are bounded and case-deduplicated, unknown public fields are rejected, and client
  completeness cannot override the server calculation. Internal helper allowlisting
  strips IDs, ownership and timestamps from imported metadata. New profiles are
  private; `isPublic: true` is rejected. Nullable field clearing and omitted-field
  preservation remain available. Supported writes lock the account then latest
  profile, update that exact ID and commit a field-name-only audit atomically.
  Both profile helper paths share this implementation. Old duplicate rows are
  preserved, with a consistent highest-ID read policy matching qualification.
- Test-first: all 17 original profile privacy cases failed before changes; later
  helper, migration and account-binding cases extended coverage. The final focused
  MySQL run passed **26 tests** (23 privacy cases and three existing profile tests;
  3.32s). Coverage includes defaults, invalid bounds, publication rejection, verified
  access, customer isolation, partial patches, concurrent initial writes, preserved
  duplicates, real audit-failure rollback, no profile answers in audit, real migration
  effects, internal metadata stripping, account-bound null reads and stale-account
  create/update denial. An older fixture initially failed cleanup due to the new
  audit foreign key; it now removes its own audit rows before its synthetic user.
- Onboarding waits for a fresh owner-bound read before first form initialization,
  loads saved answers, saves privately and retains edits after save/check failures.
  Choices are keyboard-operable pressed-state buttons. Pending saves disable the
  form, and every browser save carries the editor account ID. An independent review
  found cached-null hydration and stale-cookie-account write issues; both received
  failing regressions, fixes and read-only re-review confirmation. Owner-specific
  query keys, fetched-after-mount initialization and server read/write account
  mismatch checks address them. Legacy API callers omitting accountId retain their
  authenticated-account semantics and must manage account changes themselves.
- Browser evidence uses the production-built UI and synthetic API responses at
  loopback `/onboarding`, 1440x1000 and 375x812. Initial empty-form regression,
  stale-null cache followed by delayed existing data, keyboard selection, failed
  save/retained edits, identical private retry payload with accountId, disabled
  pending controls and navigation back to `/outreach` pass. Page identity, nonblank
  rendering, no framework overlay, no page-width overflow and screenshots were
  checked. Two expected console entries came from the deliberate synthetic 503;
  no unexpected console/page errors or external requests occurred. Existing CSV
  and qualification browser harnesses also pass against this build. Playwright was
  used because the Browser plugin is unavailable; evidence remains outside the
  repo in `outputs/profile-ui-*`. This is not browser-to-database/live acceptance.
- TypeScript and final build pass (Vite 3.17s, server bundle 420.0 kB). MySQL is
  8.4.11 in the isolated synthetic container. Production-sized migration timing,
  profile duplicate reconciliation, concurrent-editor conflict handling, retention,
  account deletion, source import permissions and the full deployment/provider
  acceptance gates remain unfinished. The EUR 100/month planning ceiling and no
  purchase/deployment/publication boundary remain unchanged.
- Final full Linux run: **326 unit tests** in 30 files (36.39s), **129 integration
  tests** in 13 files (23.95s), and 15 existing legacy skips. The profile suite is
  included in `test:integration`. Current source mounts were tested with the cached
  dependency image, not a production-runtime image. Targeted formatting passes.
  Database metadata confirms the new default is 0 and no fault constraints remain.
  Both test containers are confirmed exited zero. Only this increment's database,
  `cofounder-profile-20260913-database-1`, was stopped and independently confirmed
  exited zero, discarding its recreatable synthetic tmpfs data (including the
  earlier failed-cleanup fixture) while preserving logs. No listener remains on
  the browser test port 13014. Older containers and shared Docker state were not
  changed. All changes remain local/uncommitted, with no GitHub or live-provider
  mutation; HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.

### Earlier same-day qualification isolation and usable assessment results

- `createMatch` and `createProspect` now read back the exact inserted ID and owner,
  not the newest matching row. Real concurrent SQL insert/readback tests reproduced
  the original wrong-row results, including another customer's match. This fixes
  those helpers' readback, not all legacy route/job isolation; unsafe legacy routes
  and platform automation remain disabled.
- The supported qualification route now uses a READ COMMITTED transaction with
  account-first locking, live owned/unarchived/not-opted-out prospect checks,
  prospect-bound idempotency keys and owned match validation on replay. Match,
  success audit and receipt commit atomically. Different keys for the same prospect
  reopen its existing match; profile edits do not silently rescore historical data.
  Storage failures return a sanitized unavailable response. No schema change or
  external AI call was introduced. Normalized unique signals prevent duplicate
  skill/industry entries from inflating the simple local heuristic.
- Baseline: eight failures and six passes across the initial qualification and
  critical-path cases. After implementation and added failure/race coverage,
  **19 focused MySQL tests pass** (2.66s): 15 qualification and four critical-path
  cases. These cover exact ID readback, concurrent identical/different keys,
  cross-owner isolation, changed/forged receipts, audit and final receipt SQL
  failure rollback, opt-out/replay/archive/ownership-change checks, an in-flight
  opt-out under real locks, deduplicated scoring and reconnect/new-key replay after
  profile changes. Temporary receipt-failure constraints are fixture-owner scoped
  and dropped in finally; no global privilege changes were made.
- The qualification UI retains a per-prospect key after uncertain failure, guards
  overlapping requests, displays saved score/reasoning/recommendations with clear
  limitations, and links the selected saved assessment into the human-written draft.
  The new browser regression first failed on the original changing retry key.
  The corrected built frontend passes at loopback `/outreach`, 1440x1000 and
  375x812: mouse failure, keyboard retry, pending disabled controls, assessment
  display, tab retention, empty human composer and exact match ID in draft request.
  Page identity, meaningful rendering, no framework overlay, no page-width overflow
  and screenshots were checked. Zero unexpected console/page errors or external
  requests; two expected console entries came from the intentional synthetic 503.
  Browser responses are simulated, not combined browser-to-database acceptance.
  Playwright was used because the Browser plugin is unavailable; its harness and
  screenshots are outside the repo in `outputs/qualification-ui-*`.
- TypeScript, focused formatting and build pass (Vite 6.96s; server bundle 417.8 kB).
  Independent scoped read-only review found no blocking implementation issue.
  Review-requested archived/ownership-change replay, same-key concurrency and final
  receipt rollback cases were added. The old-path profile-read barrier remains a
  red-regression scheduling hook, not proof of the new transaction's interleaving;
  the separate NOWAIT opt-out test directly verifies its account lock. Broad
  reassessment/versioning, profile privacy, source-import admission, deployment,
  real providers and all other public-release gates remain open. Work remains
  local and uncommitted; no GitHub publication or purchase occurred.
- Final full Linux verification passed **326 unit tests** in 30 files (34.55s)
  and **106 integration tests** in 12 files (19.24s), with 15 existing legacy
  skips. The qualification suite is now included in `test:integration`. Tests use
  current source mounts and the cached dependency image, not a production image
  acceptance run. The synthetic MySQL version was verified as 8.4.11. Both new
  test containers are confirmed exited zero; zero fault constraints remained.
  Only `cofounder-qualification-20260913-database-1` was stopped and independently
  confirmed exited zero. Its recreatable tmpfs fixtures were discarded; logs and
  older containers remain intact. The browser test server is closed with zero
  remaining port-13014 listeners. `git diff --check` passes with line-ending
  warnings only. HEAD remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.

### Earlier same-day CSV import reliability

- Imports now validate the complete bounded CSV before acquiring locks, then
  serialize on the account row and commit new prospects, success audit and a
  SHA-256-bound retry receipt together. READ COMMITTED avoids absent-key gap
  coupling across owners. Replay requires the exact submitted bytes; changed
  input and legacy receipts without a hash return a conflict without modifying
  existing records. No migration is needed; the existing receipt JSON holds the
  hash and counts. Storage errors are sanitized, never counted as skipped rows.
- Duplicate checks include archived records and never overwrite values or opt-outs.
  Same-owner profile URLs are skipped; URL-less contacts are not heuristically
  merged. Import source authorization, processing-basis evidence, duplicate review,
  global import quotas and spreadsheet-formula-safe export remain release gates.
- The parser now handles quoted multiline fields and rejects duplicate headers,
  mismatched cell counts, malformed quoting, empty/header-only submissions and
  invalid values. The existing 512 KiB / 1,000-record limits remain enforced, with
  row limits counting records rather than biography line breaks. Twelve parser
  cases pass, including multibyte input limits and multiline export round trips.
- Test-first evidence: the old code failed five of eight new import integration
  cases and ten of eleven initial parser cases. After implementation, **26 focused
  database cases** pass (4.21s), including the prior draft/quota/transition suites.
  The ten import cases cover audit failure, simultaneous URL-less retries,
  changed/legacy keys, preserved opt-outs, owner isolation, reconnect replay,
  invalid CSV and real mid-batch/final-receipt persistence failures. The two extra
  fault cases initially could not create triggers due to MySQL binary-log/SUPER
  restrictions. They instead use temporary owner-scoped CHECK constraints, removed
  in finally blocks; database privileges and global settings were not relaxed.
- The form starts empty, preserves the exact retry key for unchanged data across
  failures and tab changes, blocks duplicate in-flight submission/editing, and
  announces imported/skipped/replayed counts. It warns that reload loses the
  in-memory CSV/key and a new URL-less import can duplicate records. The original
  rendered flow failed the unchanged-key assertion; the corrected built frontend
  passes the same Playwright harness on loopback `/outreach`, at 1440x1000 and
  375x812. Mouse retry, keyboard submission, retained text, tab switching, changed
  keys, pending disabled input, status messages and mobile width were checked.
  Page identity, meaningful content and no framework overlay passed. There were
  no unexpected page/console errors or external requests; the deliberate synthetic
  503 produced two expected console entries. API responses were simulated, so this
  is not combined browser-to-database or provider acceptance. Screenshots and the
  harness are outside the repository under the task's `outputs` directory.
- TypeScript and the application build pass (Vite 3.46s, server bundle 413.7 kB).
  The full Linux run passed **326 unit tests** across 30 files (33.32s) and
  **91 integration tests** across eleven files (18.56s), with 15 existing legacy
  skips. The run includes real server signal handling and synthetic background-mail
  shutdown cases. The dependency image uses current source/package mounts; it is
  not production-runtime-image acceptance. Independent scoped source review found
  no concrete blocking issue and exercised additional parser edges, but did not
  independently rerun the MySQL or browser suites. All work is local/uncommitted;
  no purchase, deployment, provider call or GitHub publication occurred.
- Final formatting checks pass after normalizing `db.ts`; TypeScript passes again.
  Both import test containers are confirmed exited zero. A direct schema check
  found zero retained fault constraints. Only `cofounder-import-20260913-database-1`
  was stopped and independently confirmed exited zero, discarding its recreatable
  synthetic tmpfs records while preserving test-container logs. The browser and
  loopback test server are closed; no listener remains on port 13014. Older
  databases and shared Docker state were not changed.

### Earlier same-day draft and quota checkpoint

- Atomic draft admission now locks account, outreach key, owned prospect and
  optional owned match. Current source declarations are assessed while consent
  is locked. A new draft and its success audit commit together; storage failures
  roll back and return a sanitized unavailable response. Same-key retries return
  the original record without extending its source-policy receipt. Cross-account
  keys remain separate, and match ownership includes the exact prospect.
- All state transitions acquire the same account-first lock. Preparation uses
  committed successful transition audits to enforce 20 actions per account per
  rolling 24 hours using the database clock. Invalid transitions, policy denials
  and rolled-back audit writes consume no allowance. This replaces only the
  process-local preparation limiter, not other abuse protections. Retention must
  preserve quota-contributing audit records for at least 24 hours. Global paid
  usage, account capacity, import limits and the EUR 100 overall budget are not
  yet enforced by this allowance.
- On fresh MySQL Community Server **8.4.11**, the initial 14-case focused run
  reproduced five failures: orphaned draft after audit failure, quota reset on
  reconnect, concurrent over-admission, charging invalid transitions and quota
  bypass in a fresh Node process. The initial fix then exposed an absent-key
  index-gap deadlock between unrelated accounts, confirmed by the InnoDB lock
  report. Draft admission now uses READ COMMITTED with explicit row locks,
  consistent with [MySQL's isolation documentation](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html).
  The extended focused suite passes **16 tests** (3.47s), including consent lock
  contention and real match ownership. Source review found no concrete defect in
  this bounded increment; it did not independently rerun tests.
- An EXPLAIN inside a rolled-back synthetic transaction containing 1,000 audit
  records (980 older than the quota window) selected `audit_owner_created_idx`,
  range access and an estimated 20 rows. No new index or migration was added.
  This is a small query-plan check, not a production-scale load test.
- All **60 focused unit tests** pass (8.41s); TypeScript and the application build
  pass (Vite 8.15s, server bundle 409.9 kB). The full Linux run passed **314 unit
  tests** across 29 files (33.93s) and **81 integration tests** across ten files
  (17.18s), with 15 existing legacy skips. This includes all three real process
  signal tests and both real-server synthetic mail/shutdown tests. Tests ran on
  the cached dependency image with current source and package metadata mounted
  read-only, not a newly built production runtime image. No browser interaction or live provider acceptance is
  claimed for this server-only increment. All changes remain local and uncommitted
  on `agent/public-saas-beta`, starting at `89557fb`; no main/remote mutation,
  public deployment, provider message or purchase was performed.
- Both test containers are confirmed exited zero. Only this run's database,
  `cofounder-quota-20260913-database-1`, was stopped and independently confirmed
  exited zero. Its synthetic tmpfs fixtures were discarded and are recreatable;
  retained test-container logs remain available. Older databases and shared Docker
  state were not changed. Changed application files pass formatting checks and
  tracked changes pass `git diff --check` (line-ending warnings only).

## Previous checkpoint (2026-09-06)

- Outreach state transitions now lock the owned record and prospect in one
  MySQL transaction. Source policy is assessed under those locks; state changes
  and success audit events commit together. Invalid-state rejection audits commit
  before returning a conflict. Storage errors return a sanitized unavailable
  response. This follows [MySQL's locking-read contract](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html).
  Draft creation, imports and quotas remain separate pending reliability work.
  Two real-DB regressions failed before the fix: both concurrent reviews succeeded,
  and an audit insertion failure left a changed state. After the fix all four
  critical-path integration tests passed (10.23s total), covering the assisted
  workflow, one concurrent success plus one committed rejection audit, rollback
  on actual MySQL audit failure, and NOWAIT lock contention while preparation
  waits for an opt-out, then rejects the newly opted-out contact. Migration 0025
  applied successfully on a fresh isolated MySQL instance. All 60 focused
  policy/router/composer tests pass (40.49s), and TypeScript passes. Source review
  found no concrete production defect and identified a test teardown issue; the
  test now drains both concurrent operations and propagates opt-out startup
  failure. The broader Linux rerun includes that test-only correction and passed:
  **314 unit tests** across 29 files (92.26s), followed by **69 integration tests**
  across nine files (40.45s), with 15 known legacy cases skipped. All three actual
  Linux server-signal tests and both real-server synthetic mail-delivery/shutdown
  cases passed. No retries changed timeouts or disabled failing cases. The final
  production application build passed (Vite 18.13s; server bundle 407.1 kB), as did
  tracked diff whitespace checks. This is current application/test evidence, not
  a production runtime image, real inbox acceptance, or a complete public release.
- A full local unit run before the transaction correction completed **313 passed,
  1 failed** across 29 files (209.10s). The development-mode process case missed
  the existing 20-second startup acknowledgement deadline; the other two process
  cases passed. No timeout was raised or test skipped. Stable full acceptance
  remains open; this does not erase earlier failed-run history.
- Docker recovered enough to confirm the old `20260906a` test container exited 1
  and its database remained running; neither was changed. The new project
  `cofounder-transition-20260906` uses its own synthetic-only tmpfs database with
  no published ports or external network. Both its focused and full test containers
  are independently confirmed exited 0. Tests use the existing dependency image with current server, schema,
  shared and client directories mounted read-only, not a new runtime image.
  Inspection was intermittently slow, but a direct MySQL TCP query returned ready
  and scoped tests completed. No shared restart, provider request, deployment or
  purchase was performed.
  After both test containers were confirmed exited 0, the stop request for only
  `cofounder-transition-20260906-database-1` returned Docker Engine API 500.
  A read-only check confirmed it still running. A scoped `mysqladmin shutdown`
  inside that exact synthetic database container subsequently stopped the database.
  Its exec command returned 1 as the container exited, so success was established
  separately: container state is confirmed `exited`, exit code 0. Stopping it
  discarded only this run's synthetic tmpfs database; fixtures can be recreated
  and test-container logs remain. No prune, shared restart or change to older
  databases was attempted.
- Source-policy enforcement now binds source labels and independently parsed
  destinations, original-human-text declarations and 30-day server receipts.
  Review/approval/preparation and fresh Copy/Open requests reject stale receipts,
  changed content/destinations, held/unknown sources, opted-out or archived
  prospects and cross-account references. Optional matches must belong to the
  same account and prospect. The operator pause also blocks fresh Copy/Open.
  All 60 focused policy/router/composer tests pass (8.45s); TypeScript and the
  initial production build pass (26.17s). The additive migration 0025 was generated
  but has not been applied to MySQL. The existing database acceptance test was
  updated for human-authored drafts and fresh revocation checks, but is unrun.
  These are scoped application checks, not provider permissions or proof of
  authorship. At that checkpoint atomic state transitions and import-policy
  admission were open; subsequent transition evidence is recorded above.
  Independent source review identified a background account-refetch error that
  erased unsaved text; a real-browser regression reproduced it before correction.
  The correction passed the same real-browser regression: text survives failure
  and retry, with workspace controls disabled during the outage. Final TypeScript
  and production rebuild passed (Vite 9.03s). Additional browser checks passed
  empty/unchecked acknowledgement gates, resetting acknowledgement after editing,
  retaining text on save failure, same-key retry, fresh Copy/Open denial after a
  simulated opt-out, and 375px layout without horizontal overflow. Screenshots
  were inspected. Both Copy and Open made separate fresh policy requests; the
  rejected Open closed its blank tab without external navigation. These browser
  tests used synthetic intercepted API responses, not database/provider traffic.
  Console errors matched the intentionally simulated failures. Independent
  follow-up source review found the text-loss correction resolved and no new
  concrete regression; the reviewer did not independently execute tests.
- The last remaining read-only Docker inspect command ended with exit 1 and
  Engine API 500 for both exact test/database containers in project
  `cofounder-integration-20260906a`. Current container state is unknown. No
  replacement job, shared engine restart, prune or database deletion was done.
- The existing provider screen now has a searchable, category-filtered catalogue
  of 26 discovery records from the 27-record source review; F6S remains withheld.
  Six focused tests pass for the verified-account endpoint, alias and regional
  filters, permission/pricing distinctions and rendered source restrictions.
  TypeScript and the application build pass (Vite 1m 12s). A read-only source
  review found no concrete defects in this bounded increment. Real-browser checks
  of the production-built screen, using the actual catalogue records with a
  synthetic account/API transport, passed: outage/retry, 26 records, category and
  alias/region filters, empty state, HN/channel warnings, evidence link and mobile
  375px layout without horizontal overflow. Screenshots were inspected. These are
  not real-account/database or provider acceptance tests. This is discovery-only
  coverage; the later scoped source enforcement is recorded above and does not
  establish full release acceptance.
- The latest full local suite finished **251 passed, 3 failed** across 26 files
  (270.57s). All three real-server process tests timed out before the startup
  acknowledgement at their existing 20-second deadline. Rerunning that file alone,
  without code or timeout changes, passed all three tests (49.17s test time;
  53.00s total). This does not retroactively make the full run green. Host snapshots
  showed about 2 GiB free memory, 100% aggregate CPU and an aggregate disk queue
  of 13; contention is a plausible contributor, not a proven sole cause. Stable
  full-suite acceptance remains open; no shared-host configuration was changed.
- Graceful shutdown is implemented and source-reviewed. Eleven focused tests
  pass, including disconnected-client work, admission fencing, SIGTERM/SIGINT,
  development HMR closure and failure handling. TypeScript passes. The README
  explains the 25-second application deadline and 30-second container grace.
- The completed isolated MySQL run for the initial shutdown implementation
  passed **66 tests, with 15 legacy cases skipped**, nine files, 42.95s. It includes
  a real Linux SIGTERM while the synthetic mail acknowledgement is held: the
  acknowledgement is saved before successful exit. Both containers in project
  `cofounder-integration-20260905b` stopped with exit zero. The subsequent run
  including operation-tracking and HMR fixes returned command exit code 1. Its
  available output reports one failure in the 19-case recovery-request suite:
  the real-server delivery case without a held response failed a wait assertion
  after 21.94s; the held-response case passed in 8.32s. No complete suite summary
  was returned. Container termination is not established by the CLI exit code.
  Do not treat the earlier run as proof of the later changes.
- The production-image build attempt (before the catalogue increment) passed TypeScript, **248 unit tests across
  25 files** (78.61s), and the application build (20.54s). Runtime dependency
  packaging did not complete: after package download timeouts, the command exited
  1 with `failed to receive status ... error reading from server: EOF`. No
  completed runtime image or container-stop acceptance is established.
  An earlier image-build attempt exposed an existing live-GitHub dependency in
  the enrichment unit tests (DNS failure and timeout).
  Those tests now replace only HTTP transport, require concrete mapped results,
  and cover provider rejection/failure; all 22 pass locally in 64ms. No production
  enrichment code or platform permission was changed. A concurrent read-only
  Docker process query returned a Docker Engine API 500. No shared Docker/WSL
  restart or configuration change was performed. Runtime-image and container-stop
  acceptance require recovery and re-verification of the isolated test environment.
- CI now requires an exited application container with exit code zero and a
  `shutdown_completed` acknowledgement after its existing health checks. This
  workflow change has been source-reviewed, not published or run in GitHub.
- Retention pruning, combined browser-to-database/inbox acceptance and the
  remaining release workstreams below are still incomplete. No public deployment,
  purchases, live mail or provider outreach have been performed.

## Previous verified checkpoint (2026-09-05)

- Fresh isolated MySQL run: **65 passed, 15 legacy cases skipped**, nine files,
  36.09s. All migrations through 0024 applied. The test container's exit code was
  independently confirmed as zero. Earlier Windows published-port failures below
  are historical diagnostics, not the latest application test result.
- The last unchanged-application local checkpoint passed 235 unit tests,
  TypeScript and production build. The new test image installs the current
  lockfile; it does not reuse the old image that lacked `compression`.
- Real production-bundle browser checks with synthetic API responses covered
  request success/error, keyboard submission, mobile layout (375 x 812), mismatch
  rejection without an API request, success/sign-in destination, fragment removal,
  absence of tokens in browser storage, pending duplicate prevention, a newer
  link surviving an old response, and reload without a token. These are UI checks,
  not a combined browser-to-database/inbox acceptance journey.
- The new `compose.integration.yml` shares an isolated loopback namespace between
  tests and a temporary MySQL instance. No host ports, external network or Docker
  bridge subnet is used. Both test containers are now stopped with exit zero;
  their logs remain available. Stopping the tmpfs database discarded only its
  synthetic test contents. Existing workspace and earlier test databases were
  not stopped, deleted or modified by this new test stack.
- The Compose command encountered a Docker inspection error after tests finished;
  container exit status and shutdown were checked separately. The harness result
  does not establish host operational reliability or production-image acceptance.

## Release requirements and evidence

| Workstream          | Required deliverable and acceptance evidence                                                                                                                                                                   | State                                                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account security    | Limited account responses; real email verification and password recovery; revocable sessions; deletion; admin MFA; tests proving secret exclusion, token expiry/replay rejection and revoked-session rejection | In progress                                                                                                                                                                                                                                                                        |
| Customer isolation  | Private workspaces; owner checks on queries, mutations, jobs, credentials, exports and HAI; two-customer negative integration tests                                                                            | In progress: supported owner-scoped workflow/export checks and retained legacy starter/metric ownership regressions implemented; full retained-route/job/credential/HAI review and deployment acceptance remain open                                                               |
| Customer workflow   | Venture preferences, candidate add/edit/detail/pagination, duplicate review, source history, opt-outs, editable drafts, revision/cancellation, reminders and conversation outcomes; complete browser journey   | In progress: connected browser-to-MySQL registration/intake/edit/draft/revision/opt-out/cancellation/session and conversation/reminder journeys verified at their dated checkpoints; real-inbox and remaining customer journeys pending                                            |
| Reliable processing | Atomic transitions and audit events, durable quotas and jobs, retry-safe imports, explicit provider delivery evidence, suppression on opt-out/disconnect; concurrency/restart tests                            | In progress: atomic imports/drafts/state/audit, durable preparation allowance, retained-record capacity, account-mail budget and opt-in mail retention verified; AI/traffic limits and live provider acceptance pending                                                            |
| Platform coverage   | Maintained searchable catalogue with audience/region/access/cost/policy/verified date/capability/status; working assisted workflow for each published source and live acceptance for connected sources         | In progress: catalogue, human-authored source gates and declared direct-data import admission implemented; approved exports, concrete private-group approval and live acceptance pending                                                                                           |
| Operations          | Separate staging/production, HTTPS, private DB, secret management, remote encrypted backup and restore, rollback, monitoring/alerts/support, enforced capacity and budget                                      | In progress: retained-record admission and shared account-mail attempt budgets implemented; measured capacity, full billing controls and deployment operations pending                                                                                                             |
| Privacy             | Provenance, processing purpose/basis, export/deletion/retention, customer notices and subprocessors, regional review for worldwide release                                                                     | In progress: direct-data declaration/provenance, opt-in account-mail retention and bounded private-account export with connected browser acceptance implemented; oversized/excluded/external-data access handling, deletion, wider retention, notices and worldwide review pending |
| Acceptance          | Auth and isolation tests; full desktop/mobile/keyboard journey; database migrations; concurrency and outage tests; restore and rollback exercise; declared-capacity load test; customer pilot                  | Pending                                                                                                                                                                                                                                                                            |

## Delivery sequence

1. Fix account response exposure and replace demo verification with real account lifecycle endpoints and screens.
2. Complete isolated customer records and the entire assisted outreach workflow.
3. Add durable processing and provider capability catalogue; implement approved connectors individually.
4. Configure production operations and privacy controls; exercise recovery and failure paths.
5. Run the complete release acceptance and customer pilot, then publish truthful release documentation.

Preserve React/Vite, Express/tRPC, Drizzle/MySQL and the existing assisted workflow.
Use explicit public response types; never serialize database user rows. Keep all
existing customer data through additive migrations. The free beta has no billing
requirement. AI must remain evidence-based and bounded if enabled. Imported
prototype automation cannot become a supported connector by enabling its flag.

## Platform inventory to complete

Dedicated: YC Co-Founder Matching, CoFoundersLab, FounderCloud (StartHawk alias),
Foundersbase, Founders Nation, Founderio, CoffeeSpace. Communities and roles:
Indie Hackers, Wellfound, F6S, LinkedIn, Reddit, GitHub, Hacker News, Product Hunt,
X and relevant Discord/Slack/Facebook communities. Programmes and events:
Entrepreneurs First, Antler, Techstars Startup Weekend, Meetup, hackathons,
university incubators and regional founder networks. The
[dated platform source review](PLATFORM_SOURCE_REVIEW.md) now records 54 reviewed sources
or channel categories (53 public discovery records), plus unresolved research
leads. Its October supplements add
Tech Talents Match, Jasiri Talent Investor, MEST AI Startup Program, Startmate and
MAYA Matching as discovery-only routes, and refreshes Entrepreneurs First's India
pathway, followed by SharakaLab, Revise Africa, COUSINS, FoundersList, CoFound
(cofound.biz), Cofy, FoundrForge, dcamp, Dubai Founders HQ, Cofounders Malaysia and
CoFounder Dekho, CoPath, EZStartup / 簡單創, Bani and BD SaaS Zone. Antler's MENAP evidence was refreshed without double-counting its
partner residency. Historical CRIB Match, VENN, cofound.lat and Coalesce remain
unpublished leads. Kiuas remains a Finnish founder collective rather than a verified
standalone matching service. This is research, not implemented integrations or an
exhaustive inventory of every community worldwide.

Each source must be classified independently. Public website availability is not
API approval or permission to ingest member data. No provider connection is
claimed until live acceptance proves its advertised capabilities.

## External release dependencies

Hosting account/domain and quotes within the confirmed budget, transactional mail credentials and verified sender,
provider-specific permissions, privacy/legal review and a real customer pilot.
Prepare and test integrations locally without spending money, creating accounts,
contacting third parties or publishing a public service without authority.

## Evidence log

- 2026-09-05: Started from main 89557fb on agent/public-saas-beta. Current tests do
  not establish SaaS readiness. Confirmed auth.me exposes a database user row,
  registration sets emailVerified=1 and verification returns its token to caller.
- Account response regression reproduced the secret exposure, then passed with an
  explicit allowlist. Registration and verification API regression tests also
  reproduced their respective defects. Six account-boundary tests now pass.
- Implemented cryptographic email tokens, SHA-256 storage, transaction-locked
  one-use consumption, real Resend acknowledgement handling, and a verification
  screen. Actual email-provider credentials/delivery remain unverified. New
  accounts are unverified and cannot access criticalPath before verification.
- Pending in account work: old automatically verified local accounts need
  re-verification migration; complete recovery request/mail/UI flow; deletion/MFA;
  shared rate limits; complete browser acceptance. No public release is claimed.
- Isolated MySQL container cofounder-beta-test-20260905 uses loopback port 13317,
  database cofounder_test and synthetic test credentials. All historical
  migrations completed. Account lifecycle integration passed (3 tests). The
  account and critical-path integration files passed together (4 tests, 19.20s)
  after an earlier run encountered Docker connection timeouts. Later Docker
  inspection itself returned an internal-server error. This is not stable
  infrastructure acceptance and must be revisited.
- Earlier checkpoint unit suite passed 204 tests in 19 files (44.91s), including
  transport, session, missing-storage and account-identity rendering regressions.
  Database outages now return a sanitized SERVICE_UNAVAILABLE response instead
  of silently turning a valid session into an anonymous one.
- TypeScript and production build passed after the session and account-identity
  corrections (372.26 kB main client chunk). `git diff --check` passed. These
  results preceded the successful database integration checkpoint below.
- Browser checks against the isolated test database proved mobile rendering,
  registration-to-verification navigation and the missing-mail-configuration
  error. Actual inbox delivery and the final browser token-consumption path are
  not yet proved. A same-page hash-navigation defect was reproduced and fixed;
  the rebuilt production client then cleared a new fragment and displayed the
  confirmation action during a same-document browser navigation.
- Logout regression proved copied cookies remained valid after logout. Added
  per-browser server-side session records with hashed token identifiers and
  expiry. Session creation rechecks the password hash under a user row lock.
  Migration 0022 is additive; pre-migration stateless cookies are rejected, so
  existing users must sign in again after rollout. The focused session tests
  cover copied-cookie rejection, independent browser sessions and storage outage
  behavior. Five focused session tests now pass, including sanitized failure
  without token issuance when session storage fails. Initial persistence/reconnect/
  expiry verification attempts failed: migration attempts reported underlying
  connect ETIMEDOUT before new DDL ran. A direct MySQL health query succeeded
  once, then another connection failed. No global Docker restart was attempted.
- Independent read-only review found a verification-screen identity defect:
  signed-in account A could mask account B's email-link confirmation. Two real
  component-rendering regressions reproduced it, then passed after token-result
  status was separated from current-account status and destination links were
  selected using the verified email address. These tests simulate API/state
  inputs; they do not prove inbox delivery or browser hash events.
- The temporary server on 127.0.0.1:13014 and dedicated Playwright session
  cofounder-beta were stopped after the browser checks. The isolated test
  database was retained. Browser artifacts are ignored under output/playwright
  and .playwright-cli. Only synthetic test users were created.
- Subsequent MySQL verification used Docker's internal network against that same
  isolated test database, avoiding the intermittent Windows published-port path.
  The existing image supplied Node 22.23.2 and dependencies; current server,
  client, shared, schema and test configuration were mounted read-only. Migrations
  0022 and 0023 applied successfully. Session persistence, revocation and expiry
  now have passing real-database evidence; this is not hosted infrastructure
  acceptance. No global Docker restart or production database change occurred.
- Password reset redemption is implemented with hashed, expiring, one-use tokens.
  A single transaction updates the password, clears recovery/verification tokens,
  verifies mailbox ownership and revokes all of that account's sessions. Six
  real-database tests passed, including concurrent redemption, expired/wrong-purpose
  token rejection, old-password login racing reset, other-customer isolation and
  a forced database failure proving rollback preserves the password and sessions.
  At that checkpoint request issuance, durable mail delivery, change notification
  and recovery UI were still missing; subsequent backend work is logged below.
- Expanded integration checkpoint: 46 passed and 15 skipped across eight files
  (28.81s). The skips are legacy phase22 tests with hard-coded fixture identities;
  they remain an acceptance gap and are not counted as passing. The current
  source was tested with platform automation disabled and no AI API key.
- Latest local checkpoint: 207 unit tests passed across 20 files (51.18s),
  TypeScript passed and the production build passed (372.26 kB main client chunk).
  Independent read-only account review found no confirmed blocker in the reviewed
  changes; this does not establish a complete security audit or public readiness.
- The platform source review separates matching sites, communities and programmes
  from API integrations. Platform-specific restrictions still need application
  enforcement: notably Hacker News requires human-original posts, not generated
  or AI-edited text. Other unresolved permission and access gates are recorded
  alongside each source. No live provider action was performed.
- Recovery queue work: additive migration 0024 applied to the isolated test DB.
  Request admission now has identical account-independent responses, encrypted
  job payloads and transactional service/IP/address limits. Four MySQL admission
  tests passed, including concurrent submissions and reconnect persistence. The
  unit suite passed 209 tests across 20 files (66.27s); TypeScript also passed.
  See [the recovery design](ACCOUNT_RECOVERY_DESIGN.md) for contracts and unfinished
  stages. The worker primitive is being tested; timing defects in job availability
  and lease creation are under investigation. No background sender is started by
  the application yet; reset UI, notification, retention and live mail acceptance
  are still pending. Nothing in this checkpoint was published or deployed.
- Worker checkpoint: seven of the initial ten database cases passed, including
  usable reset-link generation and exact-message retry after reconnect. Three
  immediate-claim cases returned idle. A deterministic MySQL regression then
  proved fractional-second rounding (a request at millisecond 900 was stored at
  the next whole second). Admission now stores immediate availability at the
  preceding whole second; its database recheck remains pending. Independent
  review also identified stale lease/expiry timing across delayed transaction
  acquisition. Two clock-controlled real-transaction tests were added for that
  issue, but have not run yet; the lease correction remains pending. The reviewer
  withdrew an initial newline concern after inspecting exact source bytes.
- TypeScript and production build passed after the availability correction
  (Vite 35.97s, server bundle 366.2 kB). Docker's test client has not yet returned
  after the completed timestamp regression, and a separate container inspection
  remains pending. No replacement test run or global restart was performed.
  Resume the existing process handles before starting another database test.

- Subsequent checkpoint (2026-09-05): the availability and delayed-transaction
  lease/expiry regressions now pass against MySQL. The request/reset screens are
  implemented and six component-rendering cases pass, including a stale link
  result not masking a newer reset link. Browser interaction acceptance is still
  pending. The local unit checkpoint passed 215 tests across 21 files (68.84s),
  with expected legacy fallback diagnostics; that run preceded the new worker
  lifecycle tests and origin validation below.
- Password-change notices now commit in the password-reset transaction and the
  delivery primitive supports them without generating new reset credentials.
  The two notice delivery/retry cases failed before implementation, then passed.
  Latest database checkpoint: 22 passed, one failed (75.40s); the failure is the
  new real-application background-start test, whose child startup is under
  investigation. Do not treat the entire database suite as passing yet.
- The new bounded serial worker passed ten lifecycle/configuration checks after
  their failing baseline. Independent source review found a configuration defect
  that could repeatedly select an undeliverable first job. Canonical HTTP(S)
  origin validation and HTTPS for non-local production origins now have passing
  regression coverage. Loopback HTTP remains allowed for local Docker smoke
  tests. Server wiring, retention, graceful process shutdown and live inbox
  acceptance remain unfinished; no public service was started.
- Fresh local verification after the origin correction: 41 focused tests passed
  across the worker/configuration, recovery-screen, account-boundary and existing
  release-safety files (21.33s). TypeScript and the production build passed (Vite
  14.83s). These are local checks, not hosted or inbox acceptance. The real-server
  test is still being diagnosed using its existing runner; Docker startup delays
  were observed without restarting the database or unrelated containers.

- Server-start diagnosis: the old test image lacked the current `compression`
  dependency. This was a harness startup failure, not proof of the worker wiring
  defect. A rerun with current workspace dependencies against the same isolated
  database reached the missing-delivery assertion. After wiring the worker into
  successful server startup, the focused real-server test passed (28.69s total),
  including acknowledgement persistence. Its transport was synthetic and the
  process listened only on loopback. The old image is not release-image evidence.
  Broader verification for this checkpoint is recorded below.
- Follow-up independent source review confirmed the origin configuration finding
  is resolved and found no new concrete regression in the startup wiring. The
  reviewer did not rerun tests; this is bounded review, not a full security audit.
- Latest local checkpoint: TypeScript passed, all 235 unit tests passed across
  22 files (78.35s), and the production build passed (Vite 30.23s, server bundle
  374.6 kB). The full database integration run is still active. A direct query of
  the isolated MySQL instance showed an active commit, and the test process has
  an established connection to loopback port 13317; it has not been restarted.
- That full native database run is not green: the recovery file reported six
  failures across 18 cases, including timeouts, failed fixture cleanup, and later
  unexpected queue outcomes. Legacy database files also reported unavailable
  database/setup failures. The isolated database was observed actively committing
  during the run; the transport/storage cause and test-isolation consequences
  still require investigation. The expired-lease acknowledgement-persistence
  recovery and missing-acknowledgement bounded-retry cases passed in this run.
  No timeout was increased and no failing case was skipped to obtain a pass.
- Final result of that run: exit 1, 27 passed / 9 failed / 44 skipped across nine
  files, with two suite-setup failures (373.20s). The underlying errors include
  `connect ETIMEDOUT` and `Pool is closed`; the latter followed timed-out tests
  that were still using the shared pool. The 44 skipped cases include 29 prevented
  by setup failures plus the 15 known legacy skips; none is passing evidence.
  The runner and the scoped database diagnostic both finished. The next database
  checkpoint needs current dependencies on the internal Docker network and clean,
  isolated fixtures; do not reuse the incomplete old image as current-server
  acceptance or broadly delete records from the existing test database.

- Follow-up isolated-test run resolved the previous application's failing
  checkpoint without increasing timeouts, suppressing errors or disabling tests.
  The new current-dependency Docker target passed all 65 active integration cases,
  including all 18 queue cases and seven password-reset cases. This supports the
  diagnosis of environment/fixture-contamination effects in the failed native run.
  Initial bridge creation failed because Docker's predefined subnet pools were
  exhausted; the test stack instead uses the database's network-disabled loopback
  namespace. No existing network was removed. The health check was then tightened
  to explicit TCP so MySQL's initialization-only socket server cannot admit tests;
  that exact TCP query was verified against the running final server.

Security references used for this account work:
[OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html),
[OWASP password recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html),
[Resend email API](https://resend.com/docs/api-reference/emails/send-email).
Consulting these references is not a security certification or proof of all
requirements; the complete password recovery journey remains to be implemented.
