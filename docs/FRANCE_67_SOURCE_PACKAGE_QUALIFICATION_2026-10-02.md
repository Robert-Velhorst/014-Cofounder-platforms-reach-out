# France 67-source package qualification — October 2, 2026

This checkpoint qualifies the current 67-record catalogue locally, not a hosted
release, complete worldwide platform inventory or permission to contact members.
The initial EUR 100/month ceiling is planning only: EUR 80 operating allocation
and EUR 20 reserve, with no purchases, account creation or deployment authorized
by this checkpoint. All 116 original phases remain Partial.

## Exact artifacts and packaging

Both fresh Docker targets built successfully with frozen dependencies. The build
ran typecheck, **997 unit cases / 97 files** on Node 22.23.3 (107.24s), application
build and offline production dependency pruning. No test/time limit was weakened.
Installed image identities below are the actual `docker image inspect .Id`
values, not intermediate image configs or build attestation identities:

| Artifact         | Installed image ID                                                        |
| ---------------- | ------------------------------------------------------------------------- |
| Runtime          | `sha256:e7d3b7007dba42c1faa99be6c66829d92e0814bf0cfb58731d954a65c59bda28` |
| Integration test | `sha256:ca7b69e0daa9b0ef8e722c8af216847a091dc75be5a5eac655dc23ecf319ef93` |
| Isolated MySQL   | `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb` |
| Browser QA tools | `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326` |

Actual runtime/test containers independently reported identical `dist`/`drizzle`
content: **117 regular files, 7,017,470 bytes**, digest
`9bbbd7584dd90ffd6ec86de692e849ef890af1d59621bef92d62b1f98154a2fd`.
Runtime ran as UID 1000; application source and development tools were absent.
This digest covers compiled application/migrations, not the whole image or an SBOM.

The mandatory MySQL integration suite ran from the exact test image against a
fresh isolated database: **724 cases / 43 files passed**, no skips, terminal exit
0, suite duration 310.16s (attached fixture duration 316.22s). Neither container
mounted application source or published a port. Both owned fixtures stopped
exit 0/no OOM. No shared database or real account data was accessed.

Compiled startup probes passed invalid-configuration failure, occupied-port
failure without fallback, real liveness and clean termination. Independently,
the maintained default-command fixture passed actual migration, health/readiness
and drain. While another connection held the migration lock, TERM/INT cancelled
without DDL and released resources in **656ms / 635ms**, below the unchanged
combined 3,000ms deadline. The test passed without skips in 32.56s. Five owned
fixtures stopped with exit 0, no OOM and no public ports.

## Connected customer-interface qualification

Browser plugin not available: the required Browser plugin/`browser` skill was not
listed. The existing Playwright 1.62.1 toolchain was used instead. No browser or
package installation was required. The frontend-testing skill defined the
customer journey, diagnostic checks, screenshot review and responsive proof;
deployment-readiness guidance defined exact-package and startup checks.

Target flow: sign in to a synthetic verified account through the real compiled
HTTP server → open **Find platforms** → search each French brand → expand source
evidence and inspect access, cost and participation restrictions. No RPC mocks.
The private MySQL user fixture is test setup, not a claim that registration or
real email verification was tested.

| Check                | Result and limit                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Identity/render      | PASS: actual `/outreach`, title `CoFounder Outreach`, meaningful workspace and no Vite error overlay                         |
| Connected catalogue  | PASS: 67 headings; 21 dedicated entries through category filtering; no verified integrations claim                           |
| French aliases       | PASS: Cofondateur.fr, cofoundr.fr and accented `CoFoundry étudiants` select the correct single card                          |
| Restrictions         | PASS: paid commitments, beta/legal-identity placeholders, school gating, extraction/contact-consent warnings remain visible  |
| Evidence interaction | PASS: each disclosure opens; at least four HTTPS evidence links, with official destination/new-tab safety attributes checked |
| Search recovery      | PASS: `français`, unmatched-search empty state, category selection and resetting to all 67 records                           |
| Responsive           | PASS: 1365×1000 desktop and 375×812 mobile, no horizontal page overflow; source links individually scrolled into view        |
| Browser health       | PASS: zero unexpected console warnings/errors, page errors, HTTP errors or external requests                                 |

Both browser runs passed all six stages on the same immutable runtime. The first
run's tall element screenshot captured the fixed header midway through the
element; this was a screenshot capture artifact, not a proved layout defect.
The second run captured the actual first viewport plus full pages from scroll
origin, without hiding headers, changing styles or replacing app content. Both
receipt sets are retained. Desktop/mobile first viewports, all three first-run
cards and second-run full mobile Cofoundr/CoFoundry pages were visually inspected:
text wraps, controls remain usable, no missing assets or horizontal clipping.
Long catalogue warnings require ordinary vertical scrolling; this is not a
complete accessibility or device/translation certification.

Each browser run used three separately owned containers: default runtime command
`node dist/start-runtime.js`, no application source/frontend/backend replacement
mounts, no public ports, non-root and bounded resources. The local existing
Windows Chinese font was read-only QA tooling, not a redistributed app asset or
a new font-license claim. All six browser fixtures stopped exit 0/no OOM.
There were **zero live sends**, purchases and provider account actions.

Final repository operator checks passed **170 cases**, no failures or skips,
7.86s. Requirement integrity stayed valid: 116 Partial, completion unproven.
Whitespace validation passed. A final independent inspection of all **16** exact
fixture IDs across packaging probes, database, default startup and both browser
runs confirmed stopped/exit 0/no OOM/no published ports. Fixtures are retained,
not deleted; unrelated containers and user work were not modified.

## Reproduction and retained local receipts

External receipts beside the checkout:

- `outputs/france67-package-20261002-r1/`: target build logs, image-ID receipts,
  compiled-content/startup probes, default-startup log and first browser run.
- `outputs/france67-browser-20261002-r2/`: corrected screenshot capture helper,
  second connected browser receipt and desktop/mobile screenshots.

Build commands were `docker build --target runtime` and
`docker build --target integration-test`. Isolated owned-fixture commands were
`node probes.mjs`, `node runner.mjs`, and
`node --test scripts/runtime-startup.integration.test.mjs`, using exact image IDs
above. `runner.mjs` drove existing Playwright page navigation, role/label locators,
fill/click/select interactions, real response/console listeners and screenshots.
Helpers stay outside the shipped source tree. Do not run them against shared
databases, host ports or real accounts.

## Remaining acceptance

The six-stage catalogue checkpoint above was followed by the broader 24-stage
connected journey below. Neither covers every retained UI/API/worker or replaces
actual customer/operator acceptance. The subsequent bounded current-image
encrypted recovery below passed; remote/off-host and actual operator recovery,
whole-product mixed/open-loop/soak/device checks, native provider workflows,
real email delivery, hosting/TLS/budget enforcement, legal/controller/license
approvals and customer pilot remain open. Earlier 64-source load and recovery
receipts remain historical; they are not transferred to these new image IDs.
No GitHub commit/push/merge/publication or deployment occurred.

## Subsequent current-package 24-stage connected workflow

The actual runtime image remains the exact 67-source artifact listed above. It
was not rebuilt, patched in-container or supplied replacement application files.
The known 24-stage connected helper was reused with only its four expected
catalogue-count assertions changed from 64 to 67. Assertions, delays, browser
timeouts and privacy/admission rules were preserved. Runner failure reporting
was improved to retain stdout as well as stderr, not to hide or retry failures.

Flow: real sign-in → catalogue discovery → declared candidate intake and profile
correction → saved assessment → original-draft review/approval/manual preparation
→ synthetic owner-reported completion → reminders/response/closure → archive,
restore, opt-out and partnership history → private account download → unsent
revision/cancellation → permitted CSV import and uncertain-result recovery.
Each transition uses the real compiled HTTP server and isolated MySQL, with
independent stored-row checks for the relevant transitions.

| Required behavior        | Actual bounded result                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page identity and render | PASS: `/outreach`, `CoFounder Outreach`, meaningful workspace; no framework overlay                                                                                                    |
| Login and navigation     | PASS: real password login, keyboard form, responsive 1440/768/375 login and 1365/375 workspace                                                                                         |
| Catalogue                | PASS: actual 67 entries, existing regional/native aliases, evidence disclosures, destination attributes and warnings                                                                   |
| Intake/correction        | PASS: owner-declared manual intake, duplicate review, edits preserve source/evidence/consent and unsaved values                                                                        |
| Message preparation      | PASS: original draft, exact review and approval, cancellation and help-tab navigation retain state; no external action                                                                 |
| Conversation             | PASS: one synthetic manual-completion receipt, future reminder, owner boundary, response clears reminder, closure retains history                                                      |
| Candidate/progress       | PASS: archive/restore preserve evidence; opt-out remains opted out; original notes/history and language switch preserved                                                               |
| Account export           | PASS: fresh password/private-file acknowledgement; actual JSON download includes owned retained history, excludes credentials and foreign owner; mismatched/anonymous requests refused |
| CSV uncertain result     | PASS: one deliberately aborted **real successful response**, unchanged retry recovers committed result; identical request bodies and one stored candidate, not duplicates              |
| Safe refusals            | PASS: rejected source import cannot silently retry as edited data; >20 MiB retained export refuses a partial download                                                                  |
| Diagnostics              | PASS: eight expected refusal/fault diagnostics asserted and consumed, zero unexpected errors and external requests                                                                     |

The original run passed all 24 stages, browser Chromium 148.0.7778.0, terminal
exit 0. Screenshot review then exposed a missing globe emoji in the isolated QA
browser, despite exact Unicode equality in the database and downloaded JSON.
This means the original green functional run was not complete glyph-rendering
evidence. Its screenshots and logs are retained, not re-labelled as fully visual
success.

A controlled second run mounted existing `C:/Windows/Fonts/seguiemj.ttf`
read-only into **QA only**, alongside the existing Chinese font. No new package,
download, app asset, content/style alteration or provider action. Actual rendered
stored-note font inspection through Chromium's `CSS.getPlatformFontsForNode`
reported `SegoeUIEmoji` with **one globe glyph**; the Chinese alias still reported
`MicrosoftJhengHeiRegular` with three glyphs. Re-inspected candidate/progress
screenshots render the globe correctly. All **24 stages passed again** on the
unchanged runtime, with the same eight expected diagnostics and no unexpected
errors. This proves these sampled local glyphs, not global-script/emoji coverage
or a license to redistribute Windows fonts.

Visually reviewed first-run mobile login, desktop workspace, mobile correction,
desktop composer/progress, mobile conversation/export/uncertain import; then
second-run mobile correction and desktop/mobile progress, desktop login/export
and mobile uncertain import. Controls wrap, long dialogs scroll, action states
match the tested workflow, and screenshots show no horizontal page clipping.
Mobile login actions require vertical scrolling; mixed English source/server and
retained workspace wording remains visible by design of the incomplete language
coverage, not a claim that all Dutch translation is finished. Screen-reader,
full keyboard/focus and additional-engine/device acceptance remain open.

Both runs use synthetic preverified users, **zero RPC mocks**, one response fault,
one synthetic completion record and **zero real sends**. They do not test real
registration, inbox verification, provider delivery or a user's actual consent.
All **six** exact-owned runtime/database/browser fixture IDs independently
inspected stopped/exit 0/no OOM/no public ports. Runtime/database had no host
mounts; QA had the external helper directory plus read-only local font(s).
Unrelated containers and user data were untouched; stopped fixtures retained.

Receipts beside the checkout:

- `outputs/france67-whole-workflow-20261002-r1/`: original 24-stage connected
  log/screenshots, including the observed missing emoji.
- `outputs/france67-whole-workflow-emoji-20261002-r2/`: font-controlled full rerun,
  actual rendered-font evidence and screenshots. `node runner.mjs` drove existing
  Playwright page locators, actions, listeners, a scoped response-fault injection
  and screenshots. No fake server success response was supplied.

Second-run helper SHA-256:
`a863ff0113c5a572224e8eb84d281d466e3e91f84293e72166ff19087ed15841`.
Second-run runner SHA-256:
`992b84bc3cff3e0a231f6c498f77f80d1228c2efff6774c923418d51ba8414e1`.
Frontend-testing guidance caused explicit visual review and the glyph follow-up;
deployment guidance preserved exact-image, non-root, isolation and teardown
verification. No original requirement or phase was removed/promoted to complete.

## Subsequent exact-package encrypted recovery

The maintained `scripts/database-recovery.integration.test.mjs` passed against
the exact runtime, integration-test and MySQL image IDs above: one full recovery
case, exit 0, **70.02s**, no skips. The encryption/rights/entrypoint unit suite
also passed **34 cases**, 2.65s, without skips, including the actual Windows
PowerShell encrypted-backup wrapper. This elapsed local suite duration is not
a promised operational recovery time or recovery-point objective.

The synthetic source was migrated from the current test image. An authenticated
AES-256-GCM snapshot was restored into a separately owned empty target, using
confined database-only grants, event scheduler off and binary logging disabled.
Neither wrong target identity, source-as-target, nonempty target, tampered backup,
unsafe authority nor binary-logged target was allowed to become a successful
restore. Existing snapshot bytes were not overwritten; nontransactional source
tables were refused. All mutations were confined to the synthetic fixtures.

| Recovery requirement         | Actual result and scope                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema and history           | PASS: migration journal, columns and indexes compared with source; seeded binary/Unicode values preserved                                                               |
| Additional database objects  | PASS: one view, procedure, trigger and scheduled-event definition preserved; view/procedure read and trigger behavior checked                                           |
| Scheduled execution          | PASS: scheduler stayed off and the scheduled insertion never ran; event definition retention is not scheduler acceptance                                                |
| Revoked authority            | PASS: old session/admin-step-up authority expired; restored reset and verification links rejected over actual compiled HTTP routes                                      |
| Restored application         | PASS: actual built frontend asset reference, database readiness, real password login for two synthetic owners, account-scoped candidate data and cross-account refusals |
| Restored email work          | PASS: queued/in-flight restored work expired; four jobs discarded, no provider attempts; terminal receipts and budget/history rows retained                             |
| Source and target separation | PASS: restore into source rejected, source probe unchanged; restored target-only trigger write did not change source                                                    |

The email-job observation ran the real queue function from the exact **test
package**, with an explicit synthetic transport guard that counted/rejected any
external fetch. Zero attempts were observed. The normal runtime's mail worker
was disabled: this does not claim a production-worker lifecycle, delivery or
provider acknowledgement test. Provider actions remained zero throughout.
The compiled restored application's HTTP probe used a read-only helper mount,
not replacement frontend/backend code or RPC mocks.

Qualification fixture safety was tightened before execution: a new optional
`RECOVERY_TEST_DATABASE_IMAGE` accepts the exact installed image ID, consistent
with existing test/runtime image inputs. Created database IDs and a per-run owner
label are retained and rechecked before stopping; image/network/port bounds
remain checked. Recursive scratch cleanup now verifies the resolved path is the
exact non-junction mkdtemp folder under its captured canonical temporary parent,
with the intended recovery prefix. Unit-test scratch cleanup has the same guard.
No restore/encryption/admission invariant, deadline or exclusion was weakened.

All four retained runtime/source/target/binary-target container IDs independently
inspected stopped/exit 0/no OOM/no public ports. Database host mounts: zero.
Runtime host mounts: one read-only observation helper. Containers are retained;
only self-created ephemeral synthetic keys/encrypted test snapshots were removed
by guarded scratch cleanup. No user file, shared database, unrelated container,
external provider, GitHub state or deployment was changed.

Receipts: `outputs/france67-recovery-20261002-r1/recovery.log` and
`recovery-unit.log` beside the checkout. Executed commands:
`node --test scripts/database-recovery.integration.test.mjs` with the three exact
image-ID inputs, and `node --test scripts/database-recovery.test.mjs`.
Current source SHA-256 values:

| Source                                             | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Recovery integration fixture                       | `4c79bfbba262194b9ad55cc805e334a6b03c323a67b8e1d121b75ccf32acf2de` |
| Encrypted recovery tool, unchanged this checkpoint | `85819a0dbcc9d9bdfe9936704355e7f4ac4c4f1aed80e21f28f6da69bb418034` |
| Compiled-application HTTP observation helper       | `fd403ff2e9f17bfac54d6c529f2808fd8749289207ed739d03f72ee2b46ce8f2` |
| Test-package mail observation helper               | `87e0b566827f3d81a982c6978145c05af3a0cae7f9151ef4047e903a285246d8` |

Deployment-readiness guidance kept this evidence tied to exact artifacts,
isolated targets, real readiness and safe rollback/recovery limits. Remote
encrypted storage, independent key custody, production-sized restore, actual
operator rehearsal, live host restore/promotion and approved reconciliation of
post-snapshot deletion/consent/provider actions remain unproven. A synthetic
full-schema restore is not permission to restore real personal data or revive
rights/consent that changed after a snapshot. Full original scope remains open.

## Subsequent exact-package read/write load qualification

The maintained synthetic customer/workspace/competing-write workload was freshly
bundled and run against the same exact 67-source runtime and MySQL IDs above.
The runner completed **exit 0**. No application source, compiled bundle or default
startup command was replaced; no workload counts, deadlines, success thresholds,
admission limits or retry behavior changed. Host tests of the three helper
modules passed **17 cases / 3 files**, 1.47s, separately from the actual load run.
An initial test-log redirection used the wrong parent path and failed before test
execution; the corrected absolute-path command ran successfully. This was not a
product/test failure or a skipped case.

Fixtures: **100 synthetic accounts / 10,000 candidates**, all non-migration tables
confirmed empty before seeding. Direct fixture setup bypasses registration,
inbox verification and rights-based intake, and is never permission to import
real member data. Real HTTP logins passed for all 100 users (p95 440.64ms), with
exactly 100 durable login-admission uses. Another 600 warmups and 300 cross-owner
read refusals passed before measured tiers.

| Workload                         | Requests | Result                                        | Successful p95 / p99  | Elapsed |
| -------------------------------- | -------: | --------------------------------------------- | --------------------- | ------- |
| Reads, concurrency 5             |    6,000 | 6,000 HTTP 200                                | 86.43 / 131.28ms      | 36.22s  |
| Reads, concurrency 20            |    6,000 | 6,000 HTTP 200                                | 250.45 / 378.29ms     | 34.46s  |
| Reads, overload concurrency 100  |    6,000 | 923 HTTP 200; 5,077 valid busy HTTP 503       | 1,524.77 / 2,571.16ms | 10.47s  |
| Workspace writes, concurrency 5  |    6,000 | 5,000 HTTP 200; 1,000 expected stale HTTP 409 | 112.41 / 167.48ms     | 47.92s  |
| Workspace writes, concurrency 20 |    6,000 | 5,000 HTTP 200; 1,000 expected stale HTTP 409 | 373.85 / 538.68ms     | 43.88s  |

All baseline transport/correctness error counters were zero. Read busy-response
retry-header checks passed. Normal successful p95 remained below the unchanged
2,000ms threshold. Overload permits valid busy refusals: **not** 100 successful
concurrent users, not a claim all overload responses meet a 2-second deadline.
No automatic request retry. Per-operation distributions remain in the raw log.

Each write tier independently reconnected to MySQL and checked **all 10,000
persisted candidate rows**, including 9,900 untouched candidates and unchanged
non-edited fields. Each tier made 3,000 changes (edit/archive/restore), 1,000
unchanged replays and 1,000 stale-review refusals. Per-owner/action audit totals
were checked; those aggregate totals alone are not individual causal receipts.

The additional **200 paired-edit races / 400 edit requests** used two actual
independent sockets per owner with verified wire overlap: 100 different-patch
races and 100 identical-patch races, 200 changed winners, 100 stale conflicts and
100 unchanged replays. Independent SQL verified all 10,000 rows, preserved earlier
audit entries, and matched one audit receipt to each of the **200 winning request
IDs**. This is bounded actual wire contention, not a deterministic database lock
barrier or universal exactly-once guarantee. Another **400 wrong-owner mutations**
were refused; all 10,000 candidate and 6,200 audit rows remained unchanged.

Resource bounds were unchanged: runtime **one CPU / 512 MiB**, Node old-space
320 MiB, UID 1000, read-only root with only two read-only synthetic secret mounts;
MySQL **one CPU / 2 GiB** and 1 GiB temporary database storage, UID 999, no host
mounts. The load runner used a separate read-only helper mount, not an application
replacement. No public ports/external network/provider work. Actual cgroup memory
peaks were **242,663,424 runtime bytes / 757,243,904 database bytes**; low/high/max/
OOM/kill counters zero. These are container-charged peaks, not total host storage,
memory or a proved monthly hosting quote. Other local work also ran on the host;
this is not a clean-room or hosted benchmark.

Post-load actual `/api/health` and `/api/ready` were both HTTP 200. Three exact-owned
fixture IDs independently inspected stopped/exit 0/no OOM/no public ports; retained:

- Database `00ed4a3c4efc00ccd48c1de6ec72a74e083007678f7acbf9dd81d35a9c2ec272`.
- App `c3f6cebe196a9176f241b038db9cba185d94d56b0a92503a0eede97285e022c0`.
- Runner `f6b708f75666bfd86a7a9f5534219b1a43ae6cd8c3e75d162b7d8052b3ffc785`.

Receipts are beside the checkout at `outputs/france67-load-20261002-r1/`:
`load.log`, `helper-tests.log`, fresh `load.mjs` and the owned-fixture runner.
Bundled with the existing esbuild tool; executed `node runner.mjs` using
`QUALIFICATION_RUNTIME_IMAGE` set to the exact image ID. No new dependencies,
provider accounts, purchases, publication or deployment. SHA-256:

| Helper/source                                  | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| Fresh external load bundle                     | `c012c1bcf4a1d2dfb826c226ee7bde9b8e3ce13253e15b789243974b1cc9de64` |
| External fixture runner, unchanged             | `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b` |
| Maintained customer workload, unchanged        | `3682bec60d831719db0a5cd5e537bd9f55d8dea53ada550bc4a2714ff61d0f43` |
| Maintained workspace-write workload, unchanged | `b9c223890331e473330a527a226e569e9a618f3fe29e992c1506063d26b6d858` |
| Maintained competing-write helper, unchanged   | `7908647f44c1249b63ffbdd8cdced1ea0e83b9a050e0e0dbba3356b27b511a3c` |

This is **closed-loop sequential actor traffic**, no think time or hosted network
latency. It qualifies these selected read/edit/archive/restore paths, not every
product surface, arbitrary arrival rate, sustained contention/fairness, long soak,
all quotas, provider costs or hosted capacity within EUR 100/month. Whole-product
mixed/open-loop/soak, approved host/resource/budget enforcement and actual
customer/operator acceptance remain open. Deployment guidance kept exact-image
and fixed-bound proof separate from orderly overload and public-launch claims.
