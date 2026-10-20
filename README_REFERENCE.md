# Detailed reference and historical checkpoints

The previous README is preserved below, including its complete operating contracts
and dated evidence. Start with the [current overview](README.md). Older checkpoint
counts, image identities and statements of what was then unverified are historical,
not instructions to deploy an older artifact. Current release evidence is in the
[67-source package checkpoint](docs/FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md),
with the preceding [development dependency review](docs/DEPENDENCY_TOOLCHAIN_QUALIFICATION_2026-10-02.md)
retained as historical evidence.

# CoFounder Outreach

CoFounder Outreach is a co-founder research and human-assisted outreach tool.
It helps you discover relevant communities, keep a private candidate list,
review individually written messages and track conversations and reminders.
It does **not** automatically contact people or prove that a message was delivered.
Its source catalogue is a discovery guide, not a set of working platform
integrations or an exhaustive list of every co-founder community worldwide.

The intended release is a free public beta. Development and local verification
are still in progress: this checkout is **not an approved public production
release**. These local receipts do not establish what is published on GitHub main. Initial
operating-budget planning is EUR 100/month; that is not purchase authorization.

Start with [product status](#current-product-status),
[what the app does](#what-the-app-does),
[what it does not do](#what-the-app-does-not-do) and
[repository layout](#repository-layout). For the complete remaining scope and
evidence, see the [delivery ledger](docs/PUBLIC_BETA_DELIVERY.md) and
[original requirement matrix](docs/GOAL_COMPLETION_MATRIX.md).

## Release evidence — dated checkpoints

Fresh 63-source release package: the current Dutch CSV interface and catalogue
are now in newly built test and nonroot production images. The runtime build
passed 965 unit tests/94 files; the fresh mandatory database suite passed
724 tests/43 files, without skips. All 116 compiled application/migration files
match between images. Actual default-command migration cancellation, health,
readiness and clean shutdown passed; encrypted restore and restored-application
login/ownership/session-revocation checks passed. 168 host operator checks passed.
Subsequently, 24 connected browser stages passed on that exact runtime with no
replacement application mounts: current catalogue, Dutch CSV download, committed
import recovery, Communitech refusal and retained manual workflows. Zero unexpected
browser errors or real sends. The same exact image subsequently passed 30,000
bounded synthetic read/write requests across 100 accounts and 10,000 candidates;
normal write p95 was 69.61/323.28 ms at five/twenty concurrent actor loops. Saved
rows and 400 cross-account mutation refusals were independently checked. Overload
returned 4,976 busy responses, not 100-user successful capacity. Representative
whole-product load/soak, hosted CI, provider and production acceptance remain open.
[Exact artifacts, checks and remaining gates](docs/CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).

Same-account overlapping edits subsequently passed 200 synthetic races on that
same runtime. Different edits produced one save/one conflict; duplicate edits
produced one save/one unchanged replay. Independent storage checks matched all
200 winning request IDs to their audit records and preserved other candidate data.
This covers two competing edit requests, not every concurrency scenario.

Current catalogue update: Communitech adds an Ontario-specific founder community,
bringing discovery to 63 records (18 dedicated, 23 community/channel, 22 program).
It is not a dedicated matcher or connected integration. The free listing is marked
sold out, eligibility is limited, and import/outreach remain blocked. Startup Canada
stays internal pending link permission. Earlier package receipts below retain their
historical counts and do not qualify this new source change.
[Canada source review and verification](docs/PLATFORM_CANADA_REVIEW_2026-10-02.md).

Newest interface repair: Dutch CSV import/export labels, permission/evidence
guidance, limits, pending/result notices and safe retry controls are now authored
in Dutch as well as English. Language switching preserves unsent data and review.
14focused tests/typecheck/build and168host checks passed.24connected browser
stages passed, including real CSV download and unchanged import recovery, using
the new compiled frontend on the previous qualified backend—not a new immutable
package. Other workspace/admin/server language and production acceptance remain
unfinished. [Current language repair and scope](docs/CSV_IMPORT_RECOVERY_2026-10-02.md).

Newest runtime repair: the default container command now forwards shutdown to
the real migration/server child and prevents server launch after cancellation.
The old package required forced termination while migration waited on a database
lock; the new exact package stopped cleanly without schema changes in the same
controlled check. The repeatable release regression also passed actual TERM/INT
cancellation, normal migration/startup, health/readiness and clean shutdown.
Fresh mandatory database qualification passed724tests/43files/no skips;
116compiled application/migration files matched across new runtime/test packages.
Current168host operator checks passed. Encrypted full-schema restore and restored
application login/ownership/session-revocation checks passed on the new runtime.
The same new runtime now passed23connected browser stages and30,000measured
read/write requests with100synthetic accounts/10,000candidates. Normal write
p95 was69/237ms; overload refused5,115of6,000reads, not100-user success capacity.
Account boundaries/persisted rows passed. The CSV form still mixes English/Dutch;
hosted/provider/full-scope acceptance remains unfinished. EUR100/month remains a planning ceiling,
not spending authorization. [Runtime evidence and limits](docs/RUNTIME_SIGNAL_STARTUP_2026-10-02.md).

Newest load qualification:100synthetic accounts/10,000candidates completed
18,000measured reads and12,000workspace write-workflow requests against the exact
runtime package. Saved changes, unchanged replay, stale-review refusal, persisted
records and400cross-account mutation denials passed; normal write p95 was140/371ms.
Read overload returned890successes/5,110bounded busy refusals, not support for100
simultaneous successful users. An early-shutdown exit137withoutOOM remains an open
startup-transition finding. No production endpoint/provider/budget approval.
[Current load results, failure and remaining scope](docs/WORKSPACE_WRITE_LOAD_2026-10-02.md).

Fresh current-package verification includes the 62-record catalogue and final
CSV-recovery UI: typecheck,926unit tests/90files, compiled test/runtime parity,
startup checks,23connected browser stages and165host operator/audit checks passed.
Encrypted restore/application recovery passed. The unchanged database-suite repeat
passed724tests/43files/no skips; the first run's fresh-process failure remains
documented. Readiness cleanup timing was repaired and its real database checks
passed. These are local
receipts, not a public-release approval or new platform permission.
[Current package results and remaining acceptance](docs/CURRENT_CSV_PACKAGED_QUALIFICATION_2026-10-02.md).

Newest import-recovery improvement: an unconfirmed CSV result locks the input and
declaration for an unchanged retry. Editing requires explicit record-review
acknowledgment; the native leave-page warning is requested while pending/uncertain.
Actual committed-response loss/replay recovered the original receipt with one
stored candidate, not a duplicate. Final10focused tests, typecheck/build,
165operator/audit checks and23connected stages passed. The broader926unit run
predated final mobile wrapping; current focused/browser proof is separately scoped.
No server permission, real send or new immutable-package claim.
[Recovery proof and remaining limits](docs/CSV_IMPORT_RECOVERY_2026-10-02.md).

Newest application increment: individual candidate intake and duplicate review
now support English/Dutch, including privacy declarations, pending/success copy
and unsaved-input confirmation. Existing-record reuse preserves the complete
stored record; returning to edit retains input but requires renewed rights
confirmation. Current922unit tests/89files,165operator/audit checks, typecheck/
build and21connected synthetic browser stages passed without skips. No new
endpoint, permission, real send or immutable-package acceptance is implied.
[Intake-language proof and remaining acceptance](docs/CANDIDATE_INTAKE_LANGUAGE_2026-10-02.md).

Newest catalogue increment: CcHUB / iHUB (Nigeria and Kenya) and Impact Hub
Nairobi bring discovery coverage to62records (18dedicated/22community/22program).
Their source, price, eligibility and permission limits are recorded; neither is
admitted for import or outreach.158focused tests, typecheck/build and21connected
synthetic browser stages passed; current165operator/audit checks passed after
refreshing the source inventory. No provider access or new immutable-package
qualification is implied. [African community review and remaining gaps](docs/PLATFORM_AFRICA_COMMUNITY_REVIEW_2026-10-02.md).

Newest operator-tool fix: the budget-plan reader now rejects malformed UTF-8,
linked final inputs and special files before opening, while preserving valid
Unicode and the32KiB boundary. All165host operator/audit tests and17isolated Linux
budget cases passed. Application/dependency sources did not change in this step.
The €100 ceiling remains a plan, not provider billing enforcement or spending
approval. [Budget input proof and remaining launch controls](docs/OPERATING_BUDGET.md).

Newest application fix: email verification pauses account-dependent actions
after a failed account refresh, hides stale verification claims and offers an
English/Dutch retry. Public link confirmation remains separate.19focused cases,
typecheck/build and four simulated-response browser stages passed; the broader
run completed907unit tests and current161operator/audit checks passed. Real inbox
and new immutable-package acceptance remain unproven. Older package receipts
below predate this UI change. [Account-failure proof and limits](docs/VERIFICATION_ACCOUNT_FAILURE_2026-10-02.md).

Newest root-tooling change: a source-derived UI inventory now records222 action
elements in147 imported files, with a stale-source check in ordinary tests and
the declared CI workflow. All161operator/audit tests passed without skips.
This is structural review evidence, not proof that every action works. Catalogue
count corrected to60 in the audit. No application/dependency changes or new image
build were made in this step; root manifest/CI hashes changed after the package
checkpoint below. [UI action inventory and remaining semantic review](docs/UI_ACTION_AUDIT.md).

Current bounded local package checks passed: the fresh runtime build passed
typecheck,903unit tests/88files/no skips and production compilation.156host
operator/API checks now pass after adding package-manager configuration to the
selected hashed inventory. Runtime packaging completed successfully despite an
earlier Docker storage diagnostic HTTP500 (cause unproven). Exact new runtime
d8e17b4f... and test imagea187faca... have matching compiled/migration files.
The exact runtime passed21connected browser stages without application replacements;
current desktop/mobile captures inspected.17Linux inventory tests also passed.
The exact new test image passed724database tests/43files/no skips; both test
fixtures independently confirmed stopped successfully. Encrypted new-image
recovery also passed, including actual restored login, owner separation and
session revocation; all three recovery fixtures independently stopped successfully.
Database readiness safeguards also passed; hosted launch gates remain open. See
[live qualification evidence and pending gates](docs/CURRENT_COMBINED_QUALIFICATION_2026-10-02.md).

Newest source improvement: private account-export controls and all authored privacy
warnings now support English/Dutch. Original downloaded records and server errors
remain unchanged.71focused tests/type/build/11API checks/21connected browser stages
passed, including Dutch wrong-password refusal, one actual synthetic JSON download
and language-retained review/notices. Two read-only compiled replacements, not a
new immutable release. [Export language proof and limits](docs/ACCOUNT_EXPORT_LANGUAGE_2026-10-02.md).

Earlier source improvement: the catalogue has 60 discovery records, including three
new Nordic community/program routes with explicit cost, eligibility and permission
limits. They are not dedicated matchers or integrations and remain discovery-only.
149 focused source/admission checks, typecheck, build, 11 structural API checks
and 21 connected browser stages passed. Desktop/mobile/tablet captures were
inspected. Two read-only compiled replacements were used, not a new immutable
release. See [Nordic source evidence and verification](docs/PLATFORM_NORDIC_REVIEW_2026-10-02.md).

Earlier source improvement: review/approval/manual-preparation queue controls now
support English/Dutch. Recording an external send requires an unchecked declaration
that the exact message was already sent outside this tool; copying/preparing alone
never records sending or proves delivery.67focused language tests/type/build/11API
checks and21connected browser stages passed, including fresh exact-text copying,
language-retained acknowledgement and actual synthetic confirmation. One readonly
compiled frontend replacement, not a new immutable release. See
[queue safety proof and limits](docs/OUTREACH_REVIEW_QUEUE_2026-10-02.md).

Earlier source improvement: unsent-draft management and revision now support
English/Dutch, including history navigation, cancellation, safeguards and local
date/error presentation.52focused language tests/type/build/11API checks and21
connected browser stages passed. Actual revision retained the original as cancelled
and created an unapproved draft; cancellation retained text/history, with no sent
timestamp. One read-only compiled frontend replacement was used, not a new immutable
release. See [manager proof and remaining scope](docs/OUTREACH_MANAGER_LANGUAGE_2026-10-02.md).

Earlier source improvement: the original-message editor now supports English/Dutch
labels, source fallback, template controls, authorship/rules acknowledgement and
save/cancel disclosures.46focused language tests/type/build/11API checks and20
connected browser stages passed: cancellation saved nothing, language switching
preserved text/review, editing cleared review and exact text saved only as a draft.
Original messages/templates/server explanations remain unchanged. One read-only
compiled frontend replacement was used; not a new immutable release. See
[editor proof and remaining scope](docs/ORIGINAL_MESSAGE_LANGUAGE_2026-10-02.md).

Earlier source improvement: partnership-progress controls now support English/Dutch,
including private reports, history, outcome labels, review, save/retry/reload and
local notices. Original notes and server explanations are preserved.40focused
language tests/type/build/11API checks and20connected browser stages passed. Actual
Dutch saving preserved opt-out/send history and original notes in private export;
mobile long labels wrap. This uses one read-only compiled frontend replacement,
not a newly qualified immutable package. See [current progress source proof and limits](docs/CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md#newer-partnership-progress-language-source).

Newest local immutable package (October 2): the combined Dutch candidate controls
and 57-record catalogue passed typecheck, **856 unit tests / 85 files / no skips**,
production build and **18 connected browser stages** using exact runtimec0dae360...
without any local application replacement mounts. Its test image has matching
compiled files. Current host operating checks passed143 plus11API checks. The exact
new test image then passed **724 database tests / 43 files / no skips**. Encrypted
full-schema restoration passed with the actual new runtime, two synthetic owners,
private-data isolation and session revocation; real-MySQL readiness checks passed
too. This is local evidence, not hosted deployment or remote backup qualification.
See the [current package identities, results and limitations](docs/CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md#current-database-recovery-and-readiness-qualification).

Earlier source improvement: candidate details now support English/Dutch profile,
archive/restore, source/import evidence, contact-status/opt-out and history labels,
including the accessible close button.31focused tests/type/build/11API checks and
18synthetic browser stages pass; actual archive→restore→opt-out preserved source/
profile evidence. Both compiled frontend/backend were mounted read-only for this
source check, not a new immutable release. See
[panel evidence and remaining limits](docs/CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md).

Earlier source increment: the catalogue has **57 discovery records**, including
TechBeach and Parallel18 Caribbean ecosystem routes, not dedicated matchers or
connected integrations.146 focused tests, type/build and17 synthetic browser stages
passed with a read-only newly compiled backend mount. These data are newer than
the older qualified images below; current package proof is above. See the
[Caribbean source evidence and limits](docs/PLATFORM_CARIBBEAN_REVIEW_2026-10-02.md).

The entries below retain distinct local verification checkpoints. Test counts and
image claims apply to their stated source/artifact and date; they must not be
combined into a claim that the newest checkout has passed every release gate.

Newest source checkpoint (October 2): candidate-profile corrections now support
English and Dutch, including field labels, safety explanations, discard confirmation
and saved notices. **25 focused tests and 17 isolated browser stages** passed;
the browser verified actual saving, preserved source/consent data and reload
persistence. Subsequently, a new immutable runtime passed type checking/build,
**841 unit tests / 84 files** and the same **17 browser stages with no replacement
frontend/source mounts**. The new locked test package then passed **724 database
tests / 43 files**, with compiled files/migrations matching the runtime. Encrypted
full-schema restore also passed with that actual runtime, including two-account
login/isolation and session revocation. These are local synthetic checks, not
hosted/inbox/provider or production-sized recovery acceptance. See
[candidate-correction evidence and limits](docs/CANDIDATE_EDITOR_LANGUAGE_2026-10-02.md).

Earlier production-runtime checkpoint (October 2): the bilingual runtime was
built, its compiled files/migrations match the qualified test package, and its
16-stage browser workflow passes **without replacement frontend/source mounts**.
Encrypted local restore also passes with the actual new server, including two
synthetic users, account separation and session revocation. See
[runtime identities, evidence and open gates](docs/BILINGUAL_RUNTIME_ACCEPTANCE_2026-10-02.md).
This remains local qualification, not public deployment or whole-goal completion.

Newest locked test package (October 2) includes the reminder/conversation
translations: type check, build, **837 unit tests / 83 files** and **724 database
tests / 43 files** passed without skips and without host-source mounts. Both
database fixtures stopped cleanly. This qualifies that exact test image, not a
new production-runtime deployment or complete browser/recovery acceptance. See
[the package receipt](docs/BILINGUAL_TEST_PACKAGE_2026-10-02.md).

Latest source improvement: conversation controls also support English and Dutch,
including response/closure acknowledgements, reminder scheduling, local dates,
retry guidance and success notices. Safety rules and stored records are unchanged.
Twenty-one focused tests, type check/build and the 16-stage isolated browser
workflow pass; actual Dutch response/reminder/closure transitions were checked.
See [conversation language evidence and limits](docs/CONVERSATION_LANGUAGE_2026-10-02.md).
The earlier source-only checkpoint is now followed by the packaged-runtime
receipt above. Other detailed workspace tools/admin/server messages remain English.

Latest source improvement: the internal reminder queue now supports English and
Dutch, including controls, status/error explanations, local-time dates and
accessible names. Language switching preserves the selected view and does not
translate user-written data. Seventeen focused tests, type checking/build and
the 16-stage isolated browser workflow pass. That source-only browser check used
a read-only compiled frontend mount; the newest runtime receipt repeats those
stages without the replacement mount.
See [reminder language evidence and limits](docs/REMINDER_LANGUAGE_2026-10-02.md).

Latest local release check (October 2): the production image now includes the
responsive-heading and primary-label contrast repairs. Type checking, **827 unit
tests / 82 files**, the production build and **16 isolated browser workflow
stages against the exact image** passed without frontend/source replacement
mounts. The **EUR 100/month initial planning ceiling** remains EUR 80 operations
plus EUR 20 reserve, not spending permission. The 13 budget-check tests passed;
actual provider costs and enforcement remain unverified. See the
[packaged accessibility receipt](docs/ACCESSIBILITY_PACKAGED_ACCEPTANCE_2026-10-02.md)
for identities, retained first failure and limitations. This is not public-launch
approval; deletion policy/erasure and live operational gates remain open. Counts
in older dated checkpoints below describe those checkpoints, not current totals.

Recovery now also checks the real production application against the restored
database: two accounts sign in, read their own restored candidates, cannot read
the other account's list, and have sessions revoked on logout. The expanded
local rehearsal passed; it uses synthetic verified-account fixtures, not a real
inbox or hosted recovery drill. CI preparation requires both runtime and test
images, but remote CI has not been verified. Full restored customer workflows,
production-sized recovery and remote backup/key recovery remain open.
That recovery checkpoint recorded 136 root/operator tests. It is historical,
not a current whole-suite total for the newest checkout.

The local database-readiness and encrypted backup/restore rehearsals also pass.
The recovery fixture now resolves existing images to exact IDs, refuses implicit
pulls, runs bounded/non-root/read-only, and migrates from the test image itself
without host-source mounts. Windows backup-wrapper and data-equivalence checks
passed; remote storage, production-sized recovery and restored application
workflows remain open. See [database recovery](docs/DATABASE_RECOVERY.md#october-2-current-local-recovery-checkpoint).

Candidate browsing now offers newest/oldest and name ordering, literal text search
(including % and _), and consistent per-response counts/pages. Changes restart
page one without changing source permissions or opt-outs. Name matching/order
uses database collation, not a guaranteed language-specific alphabet.
See [candidate search and its limits](docs/CANDIDATE_SEARCH.md).
Fresh Node 22 runtime/test packages now include these additions; their compiled
files and migrations match, and the pruned runtime passed local startup,
database readiness, HTTP security checks and clean shutdown. At that checkpoint the
source database suite passed 724 tests/43 files without skips; its exact test
package separately passed the same 724 tests/43 files without source mounts.
The 133 operator checks also pass. See the
[candidate/support packaging checkpoint](docs/CANDIDATE_QUERY_NODE22_PACKAGING_2026-10-02.md).
Type check/build, 797 unit tests, 133 operator tests and 32 focused real database
tests pass. The exact new runtime also passed 20 connected browser stages: five
search/support, eleven registration/profile/draft/account/restart and four private
defaults stages. They used actual synthetic accounts and database-backed records,
without RPC mocks or application source mounts; no page errors, external requests
or confirmed sends occurred. These are local synthetic checks, not real mailbox,
hosted performance, every critical-path step or provider acceptance.

Latest source addition: signed-in users can prepare a local support diagnostic
download from **Account data**. They choose check/status labels, review exact JSON
and approve the download; edits clear approval. No private records, logs, metadata
or identifiers are collected, and nothing is uploaded. This is a customer report,
not an automatic health test or connected support ticket. See [support diagnostics](docs/SUPPORT_BUNDLE.md).
At the support-only checkpoint, source passed type check/build, 778 unit tests and
133 operator tests; the newer candidate-query regression above supersedes that count.
Four rendered browser stages include a real file download, desktop/mobile checks
and no errors/write requests. Authentication in that focused check was a read-only
synthetic fixture. The fresh candidate/support packages above include this UI;
the fresh five-stage signed-in check also verified its actual downloaded JSON.
Broader support/error/hosted acceptance remains open.

Previous local packaging check: its source built on Node 22.23.3, with 765 unit
tests and 712 required database tests passing without skips. The fresh pruned
runtime also passed its normal migration/start command, database readiness, HTTP
security/refusal smoke and clean shutdown against a separate synthetic schema.
These are local checks—not a published release, hosted deployment, live provider
acceptance or complete production readiness. Exact images, scope and test-runner
limitations are in the [earlier language packaging receipt](docs/FINAL_VERIFICATION_REPORT.md#current-source-node-22-packaging-october-2).

That exact earlier runtime also passed 11 real connected browser workflow stages
and four private-defaults stages in an isolated synthetic database, in explicit
production mode. Dutch profile edits survived language switching, saved privately
with canonical values and reloaded; review history, opt-out blocking, account
separation, revoked sessions and a real server restart were checked. No external
requests or confirmed sends occurred. Email verification was a database fixture,
not an inbox test. See the [current connected browser receipt](docs/FINAL_VERIFICATION_REPORT.md#current-source-connected-browser-acceptance-october-2).

The interface now offers an **English / Nederlands** selector. Home, sign-in/
registration, email verification, password recovery/reset, profile setup, not-found
and loading copy have authored Dutch translations. Workspace navigation, summary
labels, safety status, platform-discovery controls, candidate details/profile corrections,
individual candidate intake/duplicate review, the reminder queue, conversation
and partnership-progress controls and original-message
editor also support Dutch. Other
detailed workspace tools, admin, source
records and server-provided messages remain English and the selector
states that limitation. This is partial bilingual support, not completed phase 057.
The choice is stored under `cofounder:ui-language:v1` as only `en` or `nl`, on this
browser/origin—not in an account profile. Unsupported or unreadable settings
default to English; blocked writes leave the current in-memory choice usable.
Reload reads the stored choice; existing open tabs do not synchronize automatically.
Changing language does not translate user data, change source permission, submit
a form or erase current input. Untranslated journeys/errors carry English content
language tags. Password-mismatch feedback updates with language selection without
clearing entered fields. Reset links now require exactly one valid token: duplicate
token fragments are refused, matching the existing verification-link boundary.
See [current account-language verification and remaining scope](docs/FINAL_VERIFICATION_REPORT.md#account-verification-and-recovery-language-october-2).
The language/catalogue changes are included in the packaging and connected checks
above; the newer support-download addition is not. Older immutable image receipts
below are historical; broader customer, admin and hosted acceptance is still required.

Current release work includes a [controlled startup failure boundary](docs/STARTUP_FAILURE_BOUNDARY_2026-10-02.md)
and [fresh Node 22 packaging checks](docs/STARTUP_NODE22_PACKAGING_2026-10-02.md).
Startup is confirmed before workers start; caught startup errors emit only a
fixed private failure event. The [latest connected receipt](docs/STARTUP_PACKAGED_ACCEPTANCE_2026-10-02.md)
records fresh synthetic database and default startup/HTTP/shutdown acceptance.
The same runtime now also passed 10 connected customer-browser stages and four
private saved-defaults stages, including a real restart and desktop/mobile checks.
These use synthetic accounts and explicit verification fixtures, not real inboxes
or sending. These local checks do not establish public readiness; remaining
customer/admin/recovery/export and hosted acceptance are separately required.

Release preparation now includes `pnpm release:inventory`, a read-only inventory
of selected source/build inputs and local compiled files. It reports file hashes,
checkout identity and separately declared package versions, without claiming
build provenance or test acceptance. See the [scope and release gates](docs/RELEASE_INVENTORY.md)
and [unreleased change summary](CHANGELOG.md); no new release or tag is published.
`pnpm release:inventory --compare <saved-inventory.json>` now detects changed
selected files against a validated, bounded baseline. A matching inventory is
file identity only, not authenticated test evidence or permission to deploy.

Runtime diagnostics now withhold configured addresses, secrets and raw errors.
`pnpm doctor -- --allow-missing-runtime` is only a build-time convenience: exit 0
can include warnings with `runtimeChecksPassed: false`, never production acceptance.
See [the diagnostic scope and support sharing limits](docs/SUPPORT_BUNDLE.md#runtime-diagnostic-command).

Public SaaS beta development is in progress. The local assisted workflow and its
earlier CI results do not establish readiness for a worldwide public service.
See [the public beta delivery ledger](docs/PUBLIC_BETA_DELIVERY.md) for the full
scope, remaining work, external dependencies and acceptance evidence.

New accounts must verify their email before using the outreach workspace. Set
`RESEND_API_KEY` and `AUTH_EMAIL_FROM` to enable verification mail, and configure
`PUBLIC_ORIGIN` to the actual application origin. The sender must be verified with
Resend. The `/verify-email` screen requests and consumes verification links; the
application never returns those secrets through its account API. Existing local
accounts marked verified by earlier versions require a separately reviewed
re-verification process before public release (tracked in the delivery ledger).
New token redemptions now commit a private audit receipt together with verification;
a read-only operator inspection can identify missing, malformed or changed-address
evidence. It does not retrospectively classify or reset older accounts.

Verification-link redemption now reserves a shared database allowance before
token lookup or account mutation: ten attempts per source IP, ten per exact
case-sensitive token and 200 service-wide per fixed 15-minute window. Invalid
but well-formed links consume admitted attempts; malformed requests do not.
Limits survive application restarts and replicas. Rejected admission leaves
the link and verified flag untouched; unavailable quota storage fails closed.
Signing-secret rotation resets effective private source/token windows, not the
stable service ceiling. This is separate from verification-email dispatch limits
and is not a complete traffic, hosting-cost or denial-of-service safeguard.

The verification screen validates a single 43-character token before offering
confirmation. Invalid or duplicate-token fragments clear the previous link and
show an explicit error, rather than borrowing the signed-in account's verified
status. Success, pending and error display belong to the currently submitted link;
an older result cannot confirm a newer link. Link fragments are removed from the
address/history, and secrets are not placed in browser storage or visible markup.
Local desktop/mobile checks use synthetic UI responses, not real inbox evidence.

The beta-development branch adds database-backed sessions and password-reset
token storage, a recovery mail queue, source-review receipts, capacity admission locks
and a mail-retention index, plus immutable outreach-version links. Apply all migrations
through 0038 before running this version:
existing stateless cookies will no longer work, so
users must sign in again. Logging out revokes that browser's session on the
server. Password-reset request admission, redemption and transactional change
notifications have real-database tests using synthetic email transport. The
request/reset screens now have a connected browser-to-MySQL/queue acceptance
check with synthetic email-provider acknowledgement, including link consumption,
session revocation, replay rejection and new-password sign-in. This does not
prove real-provider or inbox delivery; see the
[recovery acceptance receipt](docs/LOCAL_RECOVERY_ACCEPTANCE_2026-10-02.md).
Set `ENABLE_ACCOUNT_MAIL_WORKER=true` to opt into background delivery
from the application server after configuring account mail. The worker is off by
default and uses bounded, serial batches with durable database leases and retries.
Opt-in [mail retention](#account-mail-retention) is implemented; real inbox acceptance remains unfinished. Queue payloads
require an independent `AUTH_MAIL_ENCRYPTION_SECRET` of 32+ characters.
Verification, recovery and password-change notices now share durable daily/monthly
[account-mail attempt limits](#account-mail-dispatch-budget). Budget exhaustion
preserves existing verification links and defers queued mail without spending retries.
Review-held deletion requests are available behind the default-off
`ENABLE_ACCOUNT_DELETION_REQUESTS` flag. Actual account erasure and administrative MFA remain under development; this is
not a public-release readiness claim.

The profile editor at `/onboarding` now requires verified email, loads the saved
profile before editing and saves privately. Profile read/save requests from the
editor are bound to its signed-in account; stale cached results and a cookie-account
switch cannot silently move the displayed answers into another account. Mutation
inputs are bounded and profile saves commit with a non-content audit event. The
database default is now private; migration 0026 preserves all existing records and
visibility flags. Old `isPublic=true` values are not evidence of informed consent
and must not be used to enable a directory. Public profile publication is unavailable.

All four profile-setup steps have authored English/Dutch labels. Changing language
keeps the current step and open edits; option labels change while stored canonical
values do not. Unknown previously saved values remain verbatim. The final review
shows all nine editable fields, including industries, target industries and core
values that were previously omitted. Nothing is saved until the explicit save
action. Unsaved edits are page-local and are lost on reload. Server save errors
remain English. Current rendered checks use synthetic read-only account/profile
responses, not connected account-save acceptance; see the
[profile-language verification](docs/FINAL_VERIFICATION_REPORT.md#profile-setup-language-and-complete-review-october-2).

Workspace safety status is now explicitly unknown during loading, rechecking,
failure or a missing boolean pause flag. It no longer infers "Assisted mode" from
a missing response. A retry control requests a fresh status; it does not change
the operator pause setting. Current server-side action permissions still apply.
Unconfirmed/loading/failed summary statistics show a dash, not a fabricated zero.
Confirmed zero values still display as zero. The workspace remains mixed-language:
translated navigation/status regions declare their selected language while
detailed English tools retain the English content language. See the
[workspace verification](docs/FINAL_VERIFICATION_REPORT.md#workspace-navigation-and-truthful-safety-status-october-2).

The **Find platforms** catalogue has English/Dutch controls, category/mode labels,
empty/loading/retry states, review reminders and discovery/permission explanations.
Its current source has 67 reviewed discovery records; original audience, access, pricing,
restrictions and reviewer text remain English and are explicitly tagged as such.
Search uses original names, aliases, audiences and regions—not translated Dutch
synonyms. Changing language preserves the open query, category and expanded source
evidence. No accounts connect and no import/post/send permission is granted.
This UI change does not expand worldwide coverage or refresh platform policies.
See [catalogue-language verification](docs/FINAL_VERIFICATION_REPORT.md#platform-discovery-language-october-2).

### Private reusable templates and search defaults

The `/outreach` console's **My defaults** tab stores up to 20 privately owned
human-original message templates plus candidate search/view defaults. Limits:
80 characters per name, 10000 per message, 100 per search and 80000 UTF-8 bytes
for the complete document. Names are unique within your account. Do not store
credentials or third-party private details in reusable text.

Add or stage an edit, choose an optional preferred template and search defaults,
then review and **Save private defaults**. Pending removal is not stored until
you save. Template-editor text must first be staged; it is not silently included.
**Apply saved search defaults** changes filters only when clicked. A preferred
template is never inserted automatically: **Insert into empty message** copies
text without overwriting existing text or saving a draft. Personalize it and
review the exact message/source rules again. Applying defaults does not change
consent, approve outreach, generate wording, contact a provider or send anything.

Storage checks the live verified owner, credential and deletion fence. A revision
prevents competing tabs from overwriting each other; an exact immediate retry
recovers a lost save response without a duplicate audit. Conflict/error messages
retain local edits. Reloading defaults requires confirmation because a newer
saved version replaces pending settings; copy unsaved text before choosing it.
Saved defaults are included in private account JSON export and read-only deletion
review. Saves share durable workspace audit-capacity limits: exhausted capacity
rolls back change and receipt; reads and exact retries remain available. This is
not an approved erasure policy or service-wide request/billing cap.

Migration **0038** adds `workspace_presets`, one revisioned JSON document per
owner with a reviewed cascading account reference. It does not migrate or remove
legacy campaign templates, existing messages or other user data. It has been
rehearsed only on the owned synthetic database, not a live service.

The [platform source review](docs/PLATFORM_SOURCE_REVIEW.md) now records 54 internally
reviewed sources or channel categories, including held F6S, with access and policy
limitations, plus unresolved discovery leads. These are not working integrations,
and the list does not claim to cover every co-founder
community worldwide. The initial operating-budget ceiling is EUR 100/month;
paid services and public deployment have not been commissioned.
Retained account, candidate and outreach growth now has configurable service-wide
and per-account database admission limits. Defaults and operational caveats are in
[Beta capacity controls](#beta-capacity-controls). These limits do not cap provider
invoices, request traffic, mail, unrestricted security/privacy audit growth or total storage bytes; the complete
EUR 100 operating-budget safeguard is not implemented yet.
A read-only [budget-plan checker](docs/OPERATING_BUDGET.md) now requires all eight
cost categories, tax-inclusive reviewed caps and a total at or below EUR 80 while
keeping EUR 20 reserve. Unknown/stale costs fail rather than becoming zero.
It assesses local declarations only: no invoice connection, cap enforcement,
purchase authority or automatic spending alerts. The supplied example is
deliberately incomplete and exits nonzero until real evidence is supplied.

The preceding **Find platforms** catalogue source contained 64 discovery records from
that review: eighteen dedicated matching services, twenty-three community/channel records
and twenty-three program/event/ecosystem records. The preceding qualified immutable
63-source image does not include the latest Cyberport/CSAA addition. The new
[64-source package/database/startup checkpoint](docs/HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
passed, followed by 24 connected browser workflow stages. A controlled local-font
rerun resolved the sampled Chinese glyphs and passed all 24 stages without app
changes. Bounded encrypted recovery then passed on those exact images, with old
links/sessions invalidated and expired-mail discard. After fixing the synthetic
client's idle-connection expiry, bounded exact-image load passed all predefined
checks, including 30,000 baseline requests and 200 paired-edit races with stored
data/audit checks. Earlier failed runs are retained, not erased; the original
race-phase failure's exact cause remains unproven. This is not 100-user capacity
or whole-product acceptance. [Fresh packaging of the added regression](docs/POOL_CLIENT_NODE22_PACKAGE_QUALIFICATION_2026-10-02.md)
passed 987 unit/724 database cases and actual default startup. New-image connected
acceptance, wider script/device, whole-product load, remote recovery and post-snapshot reconciliation
remain open. See the
[Hong Kong source review and qualification boundary](docs/PLATFORM_HONG_KONG_REVIEW_2026-10-02.md).
F6S stays in internal research pending
link-permission review. Search supports names, verified aliases (including
StartHawk under FounderCloud), audiences and regions, with category filtering.
Each record explains access, pricing uncertainty, participation restrictions and
dated source evidence. Discord, Slack and Facebook entries are channel templates,
not verified private groups. None is presented as a connected or live-tested API.
The catalogue is read-only and does not activate importing, drafting or sending.
The October 1 supplements add eleven discovery-only routes covering Brazil/LATAM,
eligible African countries and Australia/New Zealand, and refresh the existing
Entrepreneurs First entry's India pathway. Closed applications, conflicting dates,
cohort eligibility, waitlists and unreviewed costs are stated rather than hidden.
Access/pricing caveats for FoundersList, CoFound (cofound.biz) and Cofy are
documented. Similar CoFound brands are not assumed to be aliases. VENN and
cofound.lat remain unpublished research leads. This is
broader regional coverage, not an exhaustive worldwide directory. Review dates
belong to individual entries; older records were not all rechecked in October.
Cards expose individual public-page review dates and a **30-day UTC editorial
review reminder**. Invalid/future dates are flagged, not certified. Reminders use
the device clock on render/reload; they do not hide sources, change import/outreach
permission, perform background monitoring or establish current availability.
Even recent reviews require checking current provider rules. The
[source-review maintenance procedure](docs/PLATFORM_SOURCE_REVIEW.md#catalogue-maintenance-and-review-reminders)
documents re-review, publication holds and retirement while preserving provenance.
The October 2 supplement adds India-focused FoundrForge as a **paid** discovery
route, with early-cohort/access uncertainty and overseas eligibility needing
clarification, and South Korea's dcamp as an **indirect networking ecosystem**, not
a dedicated matcher. Memberships, applications and investments are not included in
this free beta. CoPath was initially held after homepage timeouts; readable official
signup, policy and pricing pages now support a discovery-only Japan record. See
[coverage gaps and completion criteria](docs/PLATFORM_COVERAGE_GAPS.md)
for the distinction between listed sources, regional coverage and usable workflows.
The West Asia supplement adds Dubai Founders HQ as an indirect ecosystem route and
refreshes the existing Antler entry's MENAP discovery evidence, without counting
the partner residency twice. Membership costs/access and current cohorts remain
unverified. Coalesce remains an unpublished prototype lead, not a usable service.
The Malaysia supplement adds Cofounders Malaysia (cofounders.my), with unknown
pricing, untested account access and unresolved placeholder policy-contact fields.
It is distinct from similarly named brands and remains discovery-only.
The further India supplement adds CoFounder Dekho with advertised paid Pro access,
untested membership, illustrative examples and inconsistent policy naming. Its
listings and badges are not evidence of real members or verified identities.
The further East Asia supplement adds Japan's CoPath with unresolved free-versus-paid
wording and untested membership, plus Taiwan's EZStartup / 簡單創 as a broader
founder-partner/community portal, not a dedicated matcher. Japanese and Traditional
Chinese aliases are searchable. Public profiles do not imply collection rights or
contact consent; pricing, eligibility and local-language workflow acceptance still
require review. Hong Kong search leads were not promoted after direct-read failures.
The South Asia supplement adds Pakistan's Bani as an **early-access community**,
not working matching, and Bangladesh's BD SaaS Zone seeking-cofounders board.
Costs, eligibility and contact paths remain untested; BD SaaS Zone data rights
and policy terms remain unresolved. Promotional prices do not establish contact
entitlement. Neither source allows profile reuse or outreach through this tool.
Catalogue publication and workflow admission are separate: an explicit
`workflowReview` gate keeps newly listed sources out of candidate intake, CSV
import and outreach preparation until their workflows receive a separate review.
The thirty-six October additions are not admitted, including when their URLs are labelled
"manual". Private-channel templates remain permission-gated.
The Nordic increment adds Danish Startup Group, Norrsken House Stockholm and
Startuplab as indirect community/program routes. Membership costs, eligibility,
conflicting event dates and unverified collection/contact rights are explicit;
no matching outcome, member access or automation permission is promised. See the
[Nordic review](docs/PLATFORM_NORDIC_REVIEW_2026-10-02.md) for held leads and remaining gaps.
The Philippines increment adds QBO and Launchgarage as indirect ecosystem routes,
not dedicated matchers. Free-entry claims, untested membership and stale event
dates are explicit. The [Southeast Asia review](docs/PLATFORM_SOURCE_REVIEW.md#eleventh-coverage-supplement-2026-10-02-philippines-and-antler-country-distinctions)
also records Vietnam/Indonesia Antler distinctions without counting a global
brand twice or expanding workflow admission. The earlier 53-record catalogue received
[Node22 packaging and HTTP qualification](docs/ANZ_PACKAGED_ACCEPTANCE_2026-10-02.md);
browser and isolated recovery checks for the documented image and flows. Those
receipts predate the exact route gate and later catalogue changes; they do not
qualify today's bytes. Fresh immutable-image checks and full hosted acceptance
remain open.
Later [current catalogue/gate packaging](docs/CENTRAL_ASIA_GATE_PACKAGED_ACCEPTANCE_2026-10-02.md)
built fresh Node22 images and passed822units plus productionHTTP discovery/gate
checks. The first mandatory database run had one migration-lock timeout; its
unchanged isolated rerun passed all724database tests/43files/no skips. Both
temporary fixtures stopped successfully. The earlier timeout remains recorded;
its cause and startup reliability under contention are not established by one
successful rerun. Encrypted backup/restore was also retested on the current images:
full schema and data checks, unsafe-target refusals, invalidated restored sessions,
and actual login/access separation/logout for two synthetic owners passed.
Current-image browser testing also passed the 55-record/native-language searches,
candidate intake, draft review, conversation/reminder and private-export workflows
with real local application/database behaviour and synthetic accounts. No messages
were sent. These are bounded local checks: formal visual regression, full
accessibility/performance, hosted/provider qualification, remote backup scheduling,
alerts and production-scale recovery remain unverified.
The later [responsive heading repair](docs/RESPONSIVE_HEADING_REPAIR_2026-10-02.md)
adds a visible sign-in heading on mobile, a named account form, and navigable
source-card headings. Focused tests, type checking and compilation passed.
Earlier immutable-image/browser results predate this change; fresh rendered and
keyboard verification of the repaired compiled frontend subsequently passed:
responsive form heading, native login Tab order, registration-mode heading and all
55 source headings, plus the earlier workflow checks. These used a read-only frontend
mount in the local fixture, not a newly qualified immutable image. Full accessibility
and release-image qualification remain open.
The later [primary-label contrast repair](docs/PRIMARY_LABEL_CONTRAST_REPAIR_2026-10-02.md)
retains orange controls but uses near-black dark-theme labels. The tested sign-in
button improved from 3.49:1 to 5.43:1 normally and 4.67:1 on hover; focused tests,
type/build and 16 local browser stages passed. Other controls and full accessibility
still need review; these measurements do not certify the whole site.
The [ANZ/Fiji supplement](docs/PLATFORM_SOURCE_REVIEW.md#twelfth-coverage-supplement-2026-10-02-australia-new-zealand-and-fiji)
adds startups.org.nz, Fishburners and Fiji Innovation Hub as discovery-only
community/ecosystem routes. Scraping restrictions, paid external membership,
expired cohort dates and unknown eligibility are explicit. Lineup.nz and Something
New remain research leads, not verified catalogue entries.
The [Central Asia supplement](docs/PLATFORM_SOURCE_REVIEW.md#thirteenth-coverage-supplement-2026-10-02-central-asia)
adds Kazakhstan's Astana Hub and Uzbekistan's Startup Base as indirect ecosystem
routes, not dedicated matching. Formal participation, untested access and an
unresolved foreign-eligibility conflict are stated. Both remain discovery-only;
other Central Asian countries and actual local-language workflows remain open.
The separate outreach workflow now resolves both source labels and destination
URLs, blocks unknown/conflicting sources, held sources, generic private-group
categories, archived prospects and opted-out contacts. Drafts require original
human-written text and an explicit rules/data-rights declaration. The server binds
that declaration to the account, source, destination and exact message for 30 days;
review, approval, preparation and Copy/Open recheck it. This declaration is not
proof of authorship, provider consent or legal permission. Old drafts without a
receipt remain readable but cannot initiate a new action. Draft creation and state
transitions check permissions under database locks and commit with their audit
events. Retrying the same draft key returns the original draft without renewing
its receipt. Preparation permits 20 successful actions per account in a rolling
24-hour window, using committed database audit records; restarts do not reset it,
and rejected or rolled-back requests do not consume it. These audit records must
be retained for at least 24 hours. Sixteen isolated MySQL tests passed on
2026-09-13, including concurrency, audit-failure rollback, consent races, match
ownership and fresh-process quota enforcement; migrations through 0025 applied.
CSV imports now commit new prospects, audit and a content-bound retry receipt in
one transaction. Database failures abort the batch rather than becoming skipped
rows; known duplicate profile URLs are left unchanged, including archived opt-outs.
New imports require a direct-from-person declaration and evidence reference, bind
the reviewed account, and reject unknown/conflicting/held sources and unreviewed
group categories. Provenance is stored with each new prospect, not retroactively
invented for old data. The form keeps the same retry key for unchanged data and
declaration and displays committed counts.
Candidate details now show the imported profile, recorded source declaration and
up to 20 recorded opt-out events without exposing raw enrichment payloads. The
workspace offers 50-row pagination and an explicit **Record opt-out** control.
Suppression and its audit event commit together; retries do not duplicate the event.
Details and actions are bound to the reviewed account, and source/status history is
read from one database snapshot. A recorded declaration is not independently
verified permission. Restoring contact permission is not available in this UI.
Qualification now commits the saved assessment, audit and prospect-bound retry
receipt together, with account isolation and live opt-out/archive checks. The
workspace displays the saved score and reasoning and links that assessment to a
subsequent human-written draft. Repeated qualification reopens the saved assessment;
it does not silently rescore it after profile changes. Scores are local review aids,
not success probabilities or permission to contact a person.
Approved platform-export intake, historical provenance review, global cost/capacity limits and full release
acceptance remain requirements. Synthetic-response browser checks cover retained
unsaved text during account-check/save failures and fresh Copy/Open denial.
A separate connected browser-to-MySQL run passed on 2026-09-13: registration,
candidate intake/edit, human-written draft approval/revision, opt-out enforcement,
unsent cancellation, logout/session revocation, cross-account denial, sign-in and
session/workspace persistence across server restart. This run used the production
bundle, real local HTTP procedures and isolated MySQL; it did not mock API replies.
Email verification was an explicit synthetic database fixture, not inbox delivery.
Desktop/mobile evidence and environment limits are in the
[connected-workflow checkpoint](docs/PUBLIC_BETA_DELIVERY.md#connected-browser-to-mysql-workflow-and-login-cache-fix).
The run found and fixed a sign-in redirect caused by stale client-side account
data: login/registration now await refresh of inactive account queries before
navigation, and refresh failures do not navigate using stale data. Neither this
bounded workflow nor the earlier synthetic checks establish live-provider,
current production-container, whole-product or worldwide-release acceptance.

CoFounder Outreach is a local-first, review-first workspace for finding, qualifying, and following up with potential co-founders. It helps an operator turn permitted prospect data into structured outreach work: import prospects, score fit, draft messages, review and approve them, copy the approved message to the destination platform, confirm what was done, and track replies or follow-ups.

The key boundary is deliberate: this repository does not claim autonomous live sending. It is built to support careful assisted outreach with audit trails, opt-out handling, manual approval, and clear operational controls.

## Email token redemption evidence and legacy-account review

Successful `auth.verifyEmail` now consumes the one-use token, updates the verified
flag and records `auth.email_token_redeemed` in one transaction. If the audit
cannot commit, verification and token consumption roll back; concurrent redemption
creates only one success. The strict request accepts only a 43-character
base64url token. Expired, fenced or missing-address accounts are refused.
Migration **0037** adds nullable `users.verification_email_digest` without
backfilling it or changing any verified flag. Apply it before this server version.
New issuance stores the address binding with the token under the account lock;
redemption requires it to match the current normalized address. An address change
cannot transfer that link. Older unbound links require a fresh verification email,
even if unexpired; refusal does not consume them or revoke existing verified flags.
Successful redemption and password recovery clear the stored binding. Current
version-two verification receipts record issuance binding along with
version/method and a digest of the normalized email at redemption, never the raw
email, token or token digest. The email digest is pseudonymous private data, not
anonymous data; audit metadata remains excluded from the public account response,
account export and operator inspection output. Its retention remains subject to
the unresolved audit/privacy policy; this change automatically removes nothing.

An authorized database operator can inspect one explicit account locally:

```powershell
pnpm --dir apps/cofounder-discovery account:verification:inspect --read-only --account-id 123
```

In a built runtime, use `node dist/inspect-email-verification.js --read-only
--account-id 123` with the actual private database/secret-file configuration.
Do not expose this command as a public endpoint or paste production secrets into
terminal arguments. It opens a read-only repeatable-read snapshot and reports only
account ID, verified flag, latest supported evidence status, recorded timestamp,
review requirement and warnings. Status is `missing`, `invalid_record`,
`current_email_redemption`, `unbound_current_email_redemption` or
`different_email_redemption`; another account's
receipts cannot count as evidence for the target. Failure exits nonzero with a
generic, content-free result. No reset/issue/send mode exists.

#### Separately reviewed requirement to verify again

`account:verification:require` is a separate **private operator command**, not a
customer endpoint, a bulk legacy-account reset or permission to change real accounts.
Missing or unbound evidence alone never authorizes its use. Review original account
history and establish independent operator authority and a specific approval first.
Confirm a reachable inbox, working verification delivery and recovery **before**
applying: the command sends no mail and a reset can otherwise strand the account.
For an administrator, plan continuity for the last administrator too; explicit admin
access-loss acknowledgement is required. Preserved passkeys do not bypass email verification.

Check one exact account in a private operator terminal (email arguments are private
personal data; avoid shared terminal recordings/history):

```powershell
pnpm --dir apps/cofounder-discovery account:verification:require --check --account-id 123 --expected-email founder@example.org
```

The read-only result gives eligibility, role, session-record count, a ten-minute
review timestamp/fingerprint and warnings, but no email, token or credentials.
An apply operation requires **all** of `--apply`, `--account-id`, `--expected-email`,
`--operation-id` (new UUID), `--review-digest`, `--reviewed-at` (exact check values),
`--operator-ref`, `--approval-ref`, `--confirm-require-verification` and
`--confirm-mail-recovery-ready`; administrators additionally require
`--confirm-admin-access-loss`. These acknowledgements record the operator's review;
they do not verify provider readiness or establish legal authority automatically.
In a built runtime replace the package command with
`node dist/require-account-reverification.js`. Do not run apply in CI or loop it over accounts.

Application locks the exact owner, rejects changed account/session/audit state or
expired review, and atomically clears the verified flag, outstanding verification
and reset links, revokes existing account sessions, and commits an approval receipt.
Workspace/candidate/draft data, credentials and passkeys are retained. Exact retry
of the same operation reports its historical receipt without resetting a later
successful verification; changed approval references are refused. A new login may
request a fresh link, but verified workspace/admin access remains gated. This is
not deletion suspension, provider disconnection or draining of previously claimed
external work. Supported profile/candidate/import/qualification/draft mutation
transactions now recheck the live verified flag under the owner lock: an old
verified request snapshot cannot start those writes while the stored flag is
unverified. Writes committed before reset are not undone; already-started reads,
external work and unsupported legacy automation are not drained. This is not a
session-generation fence against an old in-flight request after a later successful
re-verification restores the flag. Plan an appropriate maintenance/drain window
for operational application. No real-account remediation or live inbox acceptance is established
by the synthetic tests. Use fresh review and separately authorized operational work.
See the [reviewed re-verification runbook](docs/ACCOUNT_REVERIFICATION_RUNBOOK.md)
for preconditions, maintenance/drain, exact-operation retry and live acceptance.

Missing evidence **cannot distinguish** an automatically verified legacy account
from a genuine verification performed before receipts existed. The receipt records
the normalized address at redemption and, for version two, its match to issuance
binding. Version-one history is preserved as unbound evidence and still needs
review. Neither version independently establishes identity. Matching evidence does not override an unverified
flag, grant access, approve email sending or authorize re-verification. Inspect
original release/import records and account history first; a later reset must have
explicit targets, account-lock/session handling, reviewed recovery and operator
approval. Neither automatic backfill nor mass un-verification is implemented.
Live inbox acceptance and the actual legacy-account remediation remain launch gates.

Before a hosted upgrade, back up and rehearse migration/locking on representative
staging data, provide approved working verification mail for fresh links, and warn
users whose links predate binding. Local tests are not a large-table migration or
inbox acceptance. Do not drop the column or run an older unbound-token writer as
a rollback; retain schema and history, pause link issuance if needed, and use a
reviewed forward fix. The prior combined production image predates this migration.

## Current Product Status

The current [API audit](docs/API_USAGE_AUDIT.md) maps all 165 declared tRPC
operations: 58 admitted by default route policy and 107 denied, with 54 direct
client references in the supported app's import graph. The
production gate now uses the exact 58 names, not broad group prefixes; adding a
new endpoint does not silently expose it. Existing supported methods are retained.
The [current 63-source package](docs/CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
includes this gate and has fresh local database, browser and bounded load receipts;
earlier compiled receipts retain their historical source scope. Hosted acceptance
and complete authorization coverage are not established by the structural audit.
The
[UI action map](docs/UI_ACTION_AUDIT.md) documents current account, candidate,
conversation, export, catalogue and administrator controls. `pnpm audit:api`
generates read-only structural evidence; `pnpm test:api-audit` checks snapshot
drift and policy agreement. These are source audits, not complete authorization,
provider, legal or hosted readiness proof. Root test/CI configuration changed;
existing runtime receipts retain their original manifest/source scope.

The supported application is the TypeScript codebase in `apps/cofounder-discovery`.
Public-production hardening and acceptance are still in progress.

The earlier October 2 [ANZ packaged qualification](docs/ANZ_PACKAGED_ACCEPTANCE_2026-10-02.md)
includes the 53-record catalogue. The runtime build passed type checking and all
807 unit tests; runtime/test compiled application and migration files match.
Production HTTP protection, actual authenticated catalogue retrieval and six
new-source intake refusals passed against synthetic MySQL. The required database
suite passed all 724 tests across 43 files with no skips. Fourteen connected browser
stages and the full-schema encrypted isolated recovery test also passed against
these images. Hosted acceptance, full accessibility and remaining customer flows
remain open. Neither package was published or deployed.

The earlier October 2 [fresh packaged qualification](docs/LOCAL_PACKAGED_REGRESSION_2026-10-02.md)
covers the then-current 48-record catalogue, private reusable defaults, admission and
cookie/correlation/diagnostic fixes. Its runtime build passed 706 unit tests;
its packaged database command passed 712 tests across all 42 files without skips.
The pruned runtime passed mounted-secret startup/migration, HTTP protection and
resource/shutdown checks. All 116 packaged build/migration files match the test
image. This is local synthetic acceptance, not publication or public readiness.
Exact image identities, the corrected initial test setup failure and remaining
launch gates are recorded in the receipt. Older counts below are historical.

The earlier October 2 **local packaged candidate** superseded the older October 1 image
for the checks recorded in its [qualification receipt](docs/LOCAL_RELEASE_CANDIDATE_2026-10-02.md).
It included the then-current verification binding/operator tools, workspace limits,
40-record catalogue and legacy ownership fixes. Its production-pruned runtime
passed synthetic startup/migration, mounted-secret and HTTP smoke acceptance,
followed by graceful shutdown under the intended resource bounds. Its fresh
packaged database suite passed all 612 cases in 35 files with no skipped cases.
The receipt records artifact identity and limitations; do not infer public readiness,
registry publication, hosted TLS, real inbox delivery or complete budget controls.
Historical image IDs and test counts below remain dated evidence, not current
deployment instructions.
Later catalogue additions and session/registration/recovery/verification admission
protections were not included in that earlier image. They are included in the
fresh packaged qualification above; neither image has been republished.

The retained legacy conversation-history helpers now require the acting account
for copy/use updates, check owned candidate/campaign links on writes and recheck
live verification/deletion suspension under the account lock. Copy/use retries
preserve the first recorded timestamp. Legacy routes remain disabled; these
fixes do not approve AI-generated outreach, prove provider delivery or make the
legacy workflow supported. Existing mis-linked historical rows are preserved,
not silently reassigned, and cannot be mutated through the corrected helpers.
The former hard-coded phase-22 test fixtures have been replaced by isolated,
exactly cleaned-up accounts/candidates/campaigns; the previously skipped cases
now execute. The October 2 source-mounted checkpoint passed 580 unit tests and
612 database tests across all 35 configured files, with no skipped cases; the
strengthened final legacy suite separately passed all 23 cases. Type checks and
production build passed. This is local synthetic evidence, not public launch or
qualification of the older runtime image below. Exact receipts are in the
delivery ledger.

Combined local release checkpoint (2026-10-01, before the later token-redemption
evidence changes): the rebuilt Linux image
passed type checking, 548 unit tests in 58 files, the production build and offline
production-dependency pruning. The complete configured database command passed
545 tests in 33 files with 15 known legacy skips; skipped cases are not passing
evidence. A new inventory regression checks that all 29 named database suites are
listed once, every selected file exists and database-required mode is enabled.
Nine production-configuration, 16 monitor and 16 encrypted-recovery checks passed,
along with the isolated full-schema backup/restore rehearsal. Production dependency
audit reported no known vulnerabilities at that check; this is not an OS/image
vulnerability scan or security certification.

The historical local candidate `cofounder-current-release-candidate-20261001` has image
identifier `sha256:7f90f58cbfb7d3b86e4cbe7fefe2af9ee9a9d0294dfe9b1cebccdf444ac539db`.
Its pruned, non-root, read-only runtime passed the production smoke script on
isolated loopback with one CPU, 512 MiB memory/swap and a 320 MiB Node heap:
readiness, compiled assets, headers, API error boundaries, disabled providers,
unauthenticated progress read/write refusal and graceful shutdown. This is a
synthetic local candidate, not a published image, GitHub CI result, hosted
deployment, capacity guarantee or public-beta release. See the delivery ledger
for exact checkpoints and remaining privacy/provider/operations/pilot gates.

The repository also still contains the older Electron/demo files at the root (`main.js`, `preload.js`, `dashboard/`, `src/`, `README-FIXED.md`, and related assets). Those files are retained as historical source material from the original archive. They are not the supported production server, are not what Docker runs, and should not be treated as the current product.

Use this README as the entry point for the current repository. Use `apps/cofounder-discovery/README.md` for the application-level developer notes and `docs/OPERATOR_RUNBOOK.md` for day-to-day operation.

## Who This Is For

Non-technical operators can use this as a private outreach control room:

- keep co-founder candidate research in one place;
- import declared direct-from-person data for which they have processing rights;
- qualify prospects with explainable criteria;
- draft and review outreach messages before anything is sent;
- copy an approved message into the destination platform themselves;
- record what happened, schedule follow-ups, and export results.

Software developers can use this as a production-oriented full-stack codebase:

- React 19 and Vite frontend;
- Express 5 and tRPC backend;
- MySQL 8.4 persistence through Drizzle ORM and migrations;
- local scrypt password authentication with signed HTTP-only cookies;
- owner-scoped data access, idempotency records, audit events, and state-machine guarded outreach transitions;
- Docker Compose runtime for Windows/local operation;
- CI coverage for typecheck, unit tests, integration tests, build, production audit, and container smoke tests.

## What The App Does

The supported workflow is:

1. Register or sign in locally.
2. Import direct-from-person prospect data with a processing-rights declaration and evidence reference. Import is not permission to contact someone.
3. Qualify a prospect with explainable scoring.
4. Write an original outreach message and acknowledge the source rules and data-use rights.
5. Submit the draft for review.
6. Explicitly approve the reviewed draft.
7. Prepare a manual action. The app rate-limits this step and never clicks or sends for you.
8. Copy the message and perform the action on the destination platform outside this app.
9. Confirm in the app that you sent it.
10. Record a response, schedule a follow-up, close the record, export CSV, or let the read-only HAI feed ingest the audit event.

The main production UI is intentionally narrow and operational:

- `/` - public product entry page and service health link.
- `/login` - local sign-in and registration when registration is enabled.
- `/outreach` - the supported work console for prospect import, qualification, drafting, review, manual-send preparation, confirmation, analytics, and audit review.
- `/onboarding` - setup/onboarding flow.

Several older imported pages and components still exist in the source tree, but they are not exposed by the current router unless they are deliberately wired back in.

## What The App Does Not Do

This is important for compliance, safety, and expectation setting:

- It does not send LinkedIn, email, GitHub, StartHawk, CoFoundersLab, AngelList, or other platform messages by default.
- It does not scrape or automate external platforms by default.
- It does not fake provider success when no provider API, credential, or authorization exists.
- It does not register the HAI connector in a workspace automatically; that remains an operator-owned setup step.
- It does not make the older Electron/demo root app the production target.

Unsafe imported legacy routes and browser/platform automation stay disabled unless an operator explicitly sets the relevant flags after confirming authority, platform policy, credentials, and risk.

## Repository Layout

```text
.
+-- apps/
|   +-- cofounder-discovery/     Current supported TypeScript/Vite/tRPC app
|       +-- client/              React UI
|       +-- server/              Express/tRPC backend and domain services
|       +-- drizzle/             MySQL schema and migrations
|       +-- scripts/             App-level migration and doctor helpers
|       +-- package.json         App scripts and dependencies
+-- docs/                        Operational, security, audit, acceptance, and verification docs
+-- scripts/                     Windows launch, ngrok launch, and database backup scripts
+-- docker-compose.yml           Local production-like app plus MySQL stack
+-- Dockerfile                   Production image for apps/cofounder-discovery
+-- package.json                 Workspace scripts delegating to the supported app
+-- pnpm-workspace.yaml          pnpm workspace definition
+-- main.js, preload.js, src/    Historical Electron/demo material
+-- README-FIXED.md              Historical README for the old demo, not authoritative
```

## Main Capabilities

Prospect management:

- CSV prospect intake, including explicit manual-source records;
- owner-scoped prospect storage;
- bounded CSV parsing (512 KiB / 1,000 records), including quoted multiline fields;
- atomic CSV imports with account/source checks, stored declarations and content/declaration-bound retries; duplicates never overwrite existing consent or provenance;
- searchable, paginated candidate list and account-bound details with recorded source declarations;
- explicit one-way opt-out with atomic audit, retry safety and fresh downstream outreach checks;
- account-bound, size-limited active-candidate CSV export with visible formula-risk prefixes;
- reviewed profile corrections, archive/restore, and bounded candidate-change history.

Qualification and matching:

- explainable matching and qualification signals;
- deterministic critical-path scoring for imported prospects;
- saved search and matching code retained from the richer archive;
- preference, timing, and AI/ML support modules in the app codebase.

Outreach workflow:

- draft, pending review, approved, manual action required, confirmed sent, responded, follow-up due, and closed states;
- state transitions validated under database locks, with atomic state/audit persistence;
- opt-out checks before message preparation;
- idempotency tracking for repeated operations;
- request IDs and audit records for important transitions;
- a database-backed allowance of 20 successful preparations per account per rolling 24 hours; global cost/capacity enforcement remains unfinished.

Messaging support:

- original human-written drafts with explicit source-rule declarations in the supported workflow;
- retained legacy generation/preview modules, not enabled as source-approved drafting;
- conversation starter history;
- conversation quality and follow-up helper modules;
- manual copy/open-destination flow instead of automatic dispatch.

Operations and analytics:

- owner-scoped counts and activity views;
- audit event feed;
- health and readiness endpoints;
- encrypted MySQL backup and isolated restore tooling;
- ngrok launcher for controlled HTTPS exposure;
- read-only Generic JSON Feed for HAI.

Security and safety:

- local password auth using scrypt;
- signed HTTP-only session cookies;
- session-cookie transport flags use Express's configured proxy-trust boundary,
  not raw forwarding-header claims; hosted HTTPS/header-sanitization acceptance
  remains required (see the [production runbook](docs/PRODUCTION_CONTAINER_RUNBOOK.md#session-cookie-ingress-acceptance));
- registration can be disabled for hosted mode;
- origin/proxy controls for hosted mode;
- platform credential encryption requires an explicit secret;
- provider automation and unsafe legacy routes are fail-closed;
- HAI content is omitted by default;
- local Docker services bind to loopback.

## Your private search profile

Open `/onboarding` after verifying your email. The editor loads your saved answers
before enabling the form, including when an older cached result said no profile
existed. Use the four steps to review your background, goals and work preferences,
then choose **Save private profile**. Saving returns you to the outreach workspace;
it does not publish your profile or submit it to another platform. Keyboard users
can toggle choices with Enter or Space; selected choices expose their pressed state.

If a save fails, your edits stay in the page and can be retried. Editing and navigation
within the form are disabled while saving. Reloading loses unsaved edits. If your
signed-in account changes in another tab, the server rejects a save from the old
account's editor. Sign back into the original account before retrying. A separate
public-directory publishing and consent workflow has not been implemented.

For API clients, `profile.get`, `profile.create` and `profile.update` require verified
authentication. Include the editor's expected `accountId` to bind a request to that
account; mismatches return `FORBIDDEN`. Older clients omitting it still operate on
the authenticated account, so they must handle account changes themselves. Unknown
public input fields are rejected. Partial updates preserve omitted fields; `null`
clears nullable text/array fields. `isPublic: true` is rejected. Limits are:

- Location: 255 characters; timezone: 100; biography: 5,000.
- Other scalar profile text: 50 characters per field.
- Each signal list: 50 entries, each 1–120 characters after trimming. Case-insensitive
  duplicates collapse to the first spelling; blank entries are rejected.
- Client completeness, if supplied for compatibility, must be an integer 0–100 but
  is ignored for calculation. The server derives the percentage from the eight
  background/goals/work-style fields used by onboarding.

Concurrent supported writes serialize per account. When legacy duplicate profiles
exist, the highest-ID record is read and updated; older rows remain unchanged for
later explicit reconciliation. Audit records contain changed field names and the
profile ID, not submitted answers. Profile publishing, duplicate reconciliation,
concurrent-editor conflict resolution and retention/deletion acceptance remain
separate release requirements.

### Profile default migration

Migration `0026_private_profile_default.sql` changes only the `is_public` default
to false. It does not backfill or remove records, make existing nullable values
non-null, or add a uniqueness constraint. Tested with MySQL 8.4.11 on synthetic
data, including existing public rows and duplicates; production-sized lock timing
has not been verified. Schedule it with normal migration controls and a verified
backup. If application rollback is needed, retain the safer private default;
restoring a public default would require a separately approved forward migration,
not editing migration history. New code rejects old clients' automatic publication
requests, so deploy the matching frontend with the backend.

## Understanding qualification

Choose **Qualify** on a prospect row to create or reopen its saved fit assessment.
The result shows the score, reasoning and suggested topics to verify together.
After qualification, **Write draft** links that saved assessment to the draft;
the message starts empty and still requires the separate authorship/rules review.
The assessment remains visible across workspace tabs. After reloading the page,
choose **Qualify** again to retrieve it before drafting with that link.

New assessments use a simple local heuristic: 55 base points, 10 per unique
case-normalized, trimmed shared skill/industry signal against your profile's
`lookingFor` and `targetIndustries`, and 5 for a non-empty biography, capped at 95.
Repeated signals do not earn extra points. This is not a calibrated compatibility
or success probability; incomplete data can still produce 55 points. It makes no
external AI/API request. Previously saved assessments are preserved, including
their original scores; an explicit reassessment/versioning workflow is not yet
implemented. This score does not authorize processing or contacting anyone.

Qualification requests serialize per account and recheck prospect ownership,
archive and opt-out state under database locks. Match, audit and retry receipt
commit together; storage failures roll back. API clients should retry the same
`idempotencyKey` for the same `prospectId`. A key cannot be reused for another
prospect. A new key for an already assessed prospect returns the existing match
instead of creating a second assessment. The UI retains retry keys in page memory
and disables overlapping qualification/draft actions while qualification is pending.

## Importing CSV safely

Paste CSV into **Prospects → Import permitted data**. The input starts empty;
the example is only placeholder text. `name` is required. Optional columns are
`title`, `location`, `bio`, `skills`, `industries`, `platform`, `profileUrl` and
`consentStatus`. Separate skills/industries with `|`. Consent values are `unknown`
(default), `legitimate_interest`, `opted_in` or `opted_out`; these are recorded
claims, not a determination that processing or contact is permitted.

This importer currently admits only data supplied directly by each person, including
any profile link. It does not admit platform exports, copied/scraped member profiles,
unknown sources, F6S while on hold, or generic private-group categories. Use a
catalogue platform ID/name (for example `linkedin` or `github-collaboration`), or
`manual` with no platform URL. An omitted platform can be inferred from a reviewed
HTTPS URL; without a URL, an explicit source is required. Labels and URLs must
agree. A `manual` label does not bypass URL restrictions. Source checks apply to
every record before any insert, even records that would be skipped as duplicates.

Provide an **evidence reference** covering the batch and check the declaration.
The reference is an opaque identifier for evidence you retain, not a place to
upload it: 1–120 ASCII letters/numbers/dots/underscores/hyphens, starting with a
letter or number. Do not include personal details, private correspondence, URLs
or credentials. Changing the CSV or reference clears the acknowledgment. The
server records a declaration, not proof that it is true, valid legal permission,
platform approval or outreach consent. Opt-out records stay opted out and remain
eligible for import as suppression records.

Files are limited to 512 KiB of UTF-8 text and 1,000 data records. Quoted fields
support commas, doubled quotes and line breaks. Every row must match the header
width, with empty cells retained; duplicate/unknown headers, malformed quoting,
invalid field values and header-only files are rejected before any database write.

A successful batch saves its new prospects, audit and retry receipt together.
“Skipped” means an existing profile URL in your own workspace, including archived
records; it never means a hidden database error. Existing values and opt-outs are
not overwritten. There is no name-only deduplication: separate imports of contacts
without URLs can create duplicates and still need a duplicate-review workflow.

After a failed or uncertain response, retry **unchanged CSV and declaration in the same page**.
The form retains its retry key across failures and tab changes, and shows counts
from the committed result. Edited CSV or a changed normalized declaration gets a
new key. Reloading loses in-memory CSV, declaration and key, so inspect your existing
prospects before submitting a new import. API clients must send and retain:

```json
{
  "accountId": 42,
  "csv": "name,platform\nExample,manual",
  "idempotencyKey": "csv:unique-client-request-id",
  "declaration": {
    "collectionMethod": "direct_from_person",
    "rightsConfirmed": true,
    "evidenceReference": "contact-record-001"
  }
}
```

Replace the synthetic example with the actual reviewed account, data and evidence.
`accountId` must equal the authenticated account. Missing declarations and unsupported
collection methods return `BAD_REQUEST`; account/source mismatches return `FORBIDDEN`.
The server hashes the policy version, exact CSV bytes and normalized declaration.
A valid request reusing a key with changed contents/declaration returns `CONFLICT`.
Legacy receipts, including CSV-only hashes from before this declaration contract,
are preserved but cannot be verified for replay; review
the existing data instead of automatically submitting with a new key.

Migration `0027_import_provenance.sql` adds nullable `prospects.import_provenance`.
Each new CSV prospect stores its declaration, policy version, server actor, resolved
source ID, import key, request hash and declaration time in the same transaction as
the prospect/audit/receipt. Existing rows remain null; duplicates keep their original
provenance. The owner-scoped prospect API includes this data. The current CSV export
does not include provenance and is not a complete backup or privacy export.

Apply 0027 before starting the new server; test lock timing on realistic staging
data before production. Forward rollback should pause imports and retain the
column/evidence. Do not revert to an older ungated importer or drop provenance to
roll back the UI. The migration is additive and does not backfill or erase data.

Approved provider-export intake, historical-import review, complete source-change history,
processing-purpose/basis evidence review, full privacy export and spreadsheet-application
acceptance remain public-release requirements. Broad platform coverage is still the
objective; this first admitted collection method is not a claim that other lawful
methods cannot exist. Each additional method needs its own verified source contract
and acceptance checks. Import never approves a connector or authorizes outreach.

### Exporting active candidates

Select **Export active candidates** in the prospect intake panel. This downloads
the nine supported CSV columns for **all active candidates in your account**, in
candidate-ID order, including opted-out candidates. Archived candidates are
excluded; the visible search, page and archive filter do not change this scope.
The filename starts with `cofounder-active-candidates-`. A zero-candidate export
contains only the header. This is a point-in-time viewing export, not a complete
account/privacy export, exact round-trip format or backup: it omits archive state,
provenance, notes, assessments, outreach, audit history and raw provider payloads.

Every data cell is double-quoted and embedded quotes are doubled. Text starting
with formula-leading ASCII/full-width characters, whitespace, control/format
characters or an apostrophe receives a visible `text: ` prefix. This intentionally
changes the exported display value, never the stored candidate or contact status.
Do not remove that prefix or enable spreadsheet formulas/external content for
untrusted data. [OWASP explains CSV formula risks and why escape-only measures can
fail when spreadsheets save/reopen files](https://community.owasp.org/attacks/CSV_Injection).
The visible-prefix choice is this application's mitigation, not a claim of
universal spreadsheet compatibility. Excel/LibreOffice save-and-reopen acceptance
has not been performed. Importing this viewing CSV does not restore the original
prefixed values, collection evidence or complete account state.

The API is now the **POST mutation** `criticalPath.prospects.exportCsv`, requiring
strict `{ accountId: positiveInteger }` input. Old GET/no-input clients must update.
It requires both authenticated/current stored email verification and the reviewed
account to match. A repeatable-read transaction measures the selected source data
before loading candidate text, then checks final UTF-8 CSV bytes after quoting.
The maximum is 10,000 active candidates and 8 MiB; conservative source-size
preflight can also reject a file. Excess produces `PAYLOAD_TOO_LARGE`, **never a
silently truncated file**. Accounts beyond this interactive ceiling need a future
bulk/privacy-export workflow; do not delete data to fit the limit.

An audit event records account, request, format, scope, row/byte counts and successful
generation, not CSV contents or proof the user saved the file. Audit/storage failure
returns an error, not an empty or stale file. The UI disables overlapping attempts,
rechecks account identity before starting the download, discards results after
account change/unmount, and does not reuse a previous download after a failed
request. Failed account checks explain how to recover. A generated CSV can contain
personal data: keep it private and apply your retention policy to downloaded copies.

### Adding one candidate and reviewing duplicates

The entry button, fields, declarations, duplicate choices, retry guidance,
discard prompt and success states support English/Dutch. User-entered data and
protocol IDs are not translated; original server/schema errors are explicitly
marked English. [Current intake-language evidence](docs/CANDIDATE_INTAKE_LANGUAGE_2026-10-02.md).

Select **Add individual candidate** in the outreach workspace. Enter the person's
name, a reviewed platform ID/name (or `manual` without a platform URL), optional
profile/background fields and the recorded contact status. Status starts as
**unknown**; data collection does not imply permission to contact. Use only data
supplied directly by that person, including any profile link, and retain supporting
evidence yourself. Enter an opaque evidence reference and explicitly confirm the
direct-data and processing-rights declaration. This form does not admit scraping,
copied member profiles or unapproved platform exports.

Select **Preview possible duplicates**. No candidate, audit or receipt is written
by preview. It shows only your own possible matches, including archived and opted-
out records, with their name, role, location, source and contact status. Then choose:

- **Use existing candidate**: retain that record exactly as it is. Submitted new
  profile text, status and declaration do not overwrite its data or provenance.
  The decision is audited; no new candidate capacity is consumed. This remains
  possible when the account is full and when the selected record is archived or
  opted out. Reusing it does not restore contact permission or list visibility.
- **Create a separate candidate**: explicitly confirm that the suggestions were
  reviewed and this is a separate person, not a replacement for an existing
  suppression. This creates an owned `manual`-intake record with the declared
  evidence, and consumes one retained-candidate slot. Nothing is sent.

A matching stored profile URL forces reuse of that exact record; a name-only match
cannot be substituted, including when the exact record is opted out. Name matches
are suggestions, not automatic identity decisions. Matching follows the database's
current string comparison/collation, using the same profile-URL uniqueness rule as
CSV import; it is not fuzzy matching or canonicalization across aliases, redirects,
tracking parameters, different URLs, transliterations or different platforms.
Absence of suggestions does not prove a person is new. No automatic merge occurs.

At most 20 suggestions are shown, with the exact profile match first. If more match,
adding a new person is blocked; reuse a shown candidate or refine the input. This is
intake review, not a complete tool for merging existing duplicates. Existing CSV
import keeps its separately documented duplicate behavior.

**Confirm intake decision** saves atomically, then **Open candidate** opens the
retained/new record for inspection. Editing input invalidates its prior review and
rights acknowledgment. If another tab changes relevant records or adds a match,
saving returns a conflict; input remains available and **Refresh duplicate review**
requires a new selection. Temporary errors retain the review and unchanged retry
key. Account-check failure hides private content while retaining tab memory; a
different account cannot submit the old account's intake. Pending saves block
duplicate submission and modal closure. Dirty closure asks for confirmation.
There is no durable offline draft: after uncertain saves, retry unchanged or inspect
saved candidates before editing, closing the tab or starting a fresh submission.

Developer contracts (both are authenticated, verified-owner **POST mutations** so
candidate input is not placed in a GET URL):

- `criticalPath.prospects.previewIntake({ accountId, candidate, declaration })`
  returns `{ reviewToken, candidates, exactProfileId, hasMore }`. `candidate` accepts
  the same ten profile fields/limits as [profile corrections](#correcting-a-candidate-profile),
  except `name` is required, plus required `platform` (1–50 characters), optional
  nullable `profileUrl` (valid reviewed HTTPS URL, at most 500 characters) and
  `consentStatus` (`unknown`, `legitimate_interest`, `opted_in`, `opted_out`; default
  `unknown`). Lists contain up to 50 non-empty entries of 100 characters each; the
  UI uses one entry per line. Declaration is the same strict direct-person evidence
  contract used by CSV intake. Protected/unknown fields are rejected.
- `criticalPath.prospects.add({ accountId, candidate, declaration, reviewToken,
resolution, idempotencyKey })`, where resolution is either
  `{ kind: "use_existing", candidateId }` or
  `{ kind: "create_new", distinctPersonConfirmed: true }`, returns
  `{ candidateId, created, replayed }`. `created` records the original decision,
  not a claim about the candidate's current contact status. The token is 64 lowercase
  hexadecimal characters; keys use 8–80 letters, digits, colons, underscores or hyphens.

Preview uses a repeatable-read snapshot. Save uses an account-first READ COMMITTED
transaction and rechecks the full input and candidate review hashes under locks.
New candidate, successful audit and replay receipt commit together; an audit failure
rolls back all of them. Audit metadata contains the decision/source ID, not submitted
profile text. Identical committed retries return the owned saved candidate ID after
reconnect or capacity changes without editing it or adding another audit event;
changed payloads under the same key conflict. Missing or malformed replay targets
fail closed. New records use existing capacity admission. No new migration beyond
the branch's existing schema is required for individual intake.

`FORBIDDEN` covers account/source restrictions, `NOT_FOUND` unavailable or unreviewed
existing candidates, `CONFLICT` stale review/key/duplicate decisions, `BAD_REQUEST`
invalid declarations or fields, `TOO_MANY_REQUESTS` new-record capacity, and
`SERVICE_UNAVAILABLE` storage failures. These controls do not establish legal basis,
platform approval, live integrations or worldwide release acceptance for the owner.

### Inspecting candidates and recording an opt-out

In `/outreach`, choose **View details** beside a candidate. The dialog shows their
stored profile, source, declaration reference, import identifiers and contact status.
Missing or malformed legacy provenance is labelled rather than reconstructed. It
shows recorded declarations, not the underlying evidence document or independent
verification. Opening or closing the dialog preserves unfinished import/draft text;
reloading the page still loses unsaved in-memory work.

To suppress future contact, check the explicit acknowledgment and select **Record
opt-out**. An unsuccessful save retains the acknowledgment for retry. A successful
save preserves the candidate, source record and existing outreach text while blocking
new qualification/drafting and later preparation/Copy/Open actions through their
server permission checks. It cannot retract text already copied or a message sent
outside the app. There is no automatic opt-in restoration.

Verified-email API clients use `criticalPath.prospects.details` with `{ id, accountId }`
and `criticalPath.prospects.optOut` with `{ id, accountId, confirmed: true }`.
Both require the authenticated account to match `accountId`; foreign/missing
candidate IDs return `NOT_FOUND`. Repeated opt-outs return `changed: false` without
inventing another audit event. Details return an explicit profile projection,
`provenanceStatus`, current `sourcePolicy`, a content-based `revision`, up to 20
newest `optOutEvents`, and up to 20 successful edit/archive/restore/opt-out `history`
entries from one read-only repeatable-read transaction. History exposes action,
time, ID and allowlisted changed field names, never raw audit metadata. It is not
a complete activity history or an undo/version-recovery system.

The list UI displays 50 rows per page, ordered by import time and then ID, newest
first. **Candidate status** selects active (default), archived or all candidates;
search and status changes reset to page one. List responses exclude raw provider
payloads and import provenance; validated provenance is available in details.
Pagination is offset-based, so concurrent imports
can move rows between pages; it is not an immutable export snapshot. The UI includes
`accountId` in list queries/cache keys; older API callers may omit it but remain
scoped to their authenticated owner and must handle account changes themselves.

### Correcting a candidate profile

Choose **View details → Edit profile**, correct the relevant fields and select
**Save corrections**. Only changed fields are submitted. Name, role/title, location,
biography, skills, experience, industries, current company, what they are looking
for and startup stage can be corrected. Source/platform, profile URL, collection
evidence, ownership and contact permission are deliberately not editable here.
Existing drafts and saved assessments are not rewritten or rescored by a correction.

Text is trimmed on save. Name is required and limited to 255 characters; title,
location and company also allow 255, experience/stage 50, and biography 10,000.
Lists accept up to 50 nonempty entries of 100 characters, one per line in the UI.
Clearing a non-name text field stores null. Malformed legacy list fields are shown
as needing review and cannot be edited in this form; correcting another field
preserves their original data. No correction retroactively verifies an import.

An unsuccessful save preserves typed text. A concurrent change causes a conflict:
save is disabled until you explicitly discard that draft and reload current details.
Background refreshes do not silently rebase the captured review. Closing/cancelling
a dirty editor requires confirmation, and the page requests the browser's standard
unsaved-work warning on unload (browser behavior varies). Temporary account-check
failures hide all private editor DOM and block saving while keeping the in-memory
draft for recovery in the same mounted view. Reloading, signing out or leaving the
application can still lose unsaved work; this is not a persistent draft backup.

API: `criticalPath.prospects.edit` requires
`{ id, accountId, expectedRevision, patch }`. Obtain `expectedRevision` from the
details response. It hashes the reviewed profile/source/consent/archive content,
not merely the second-precision update timestamp, and is not an authorization
credential. Strict patch validation rejects protected/unknown keys and empty patches.
The verified owner account is locked before its candidate; update and successful
`prospect.edit` audit commit together. Audit metadata stores changed field names,
not old/new personal values. A stale review with actual changes returns `CONFLICT`.
If every requested value is already saved, a retry returns `changed: false` without
renewing timestamps or adding an audit event, even if the earlier review is stale.

### Archiving and restoring candidates

In details, acknowledge the archive action and select **Archive candidate**. It
removes the candidate from the default active list and blocks new qualification and
assisted contact actions; it does not delete any candidate, source, consent, draft,
match or audit data. Archived rows still count toward retained-record capacity.
To restore one, choose **Archived candidates** in the list, open details, acknowledge
the restore and select **Restore candidate**. Opt-outs remain in force. Restoration
does not send messages, renew permission receipts or create new outreach approvals.

Both `criticalPath.prospects.archive` and `.restore` require
`{ id, accountId, expectedRevision, confirmed: true }` and return
`{ changed, archived, revision }`. The old ID-only archive contract is no longer
accepted; clients must fetch and review details first. Missing/foreign IDs return
`NOT_FOUND`, account mismatches return `FORBIDDEN`, and stale state-changing requests
return `CONFLICT`. Repeating the already-saved state is a no-op. State and audit
changes are atomic under the same account-first locking as other candidate actions.
These operations are recovery of list visibility, not deletion or restoration of
contact permission. For API listing, use `status: "active" | "archived" | "all"`.

### Revising and cancelling unsent outreach

Open **Review queue → View / manage** to inspect a saved message, its current state,
and its previous/replacement versions. **Revise message** opens a human-authored
editor. Subject is optional (up to 255 characters); message is required (up to
10,000 characters). Review the current source restrictions, confirm original
authorship and applicable data-use rights, and explicitly confirm that you have
**not sent the message outside this tool**. Save creates a new draft with a new ID;
the original becomes cancelled but keeps its text, evidence and prior timestamps.
The new version must go through review, approval and manual preparation again.
Old buttons referring to the cancelled version cannot approve or confirm its
replacement. Each retained version consumes an outreach-capacity slot.

Only unsent `draft`, `pending_review`, `approved` and `manual_action_required`
records without sent, response or closure history can change. New revisions also
require a currently eligible source and a candidate who is neither archived nor
opted out. A message previously sent cannot become editable merely because a legacy
follow-up moved its state back to review. The application does not send or retract
anything. If you already sent it externally, record that fact before continuing;
do not falsely confirm that it is unsent. Previously copied text and already-open
external pages cannot be revoked by this tool and must not be used after revision.

To stop an unsent draft, acknowledge **Cancel unsent draft** in its management view.
Cancellation retains the record and audit history and blocks subsequent preparation
or confirmation through that ID. It remains available after candidate opt-out,
archiving or source ineligibility. It does not restore consent, release capacity,
delete personal data or recall an external message. Sent and other terminal history
is read-only through these controls. Previous/replacement links preserve the chain.

Unsaved text and retry identity remain only in the current tab. Temporary failures
retain the editor, and account-check failures conceal private content until the
same reviewed account is available. A stale-review conflict requires explicit
discard/reload and a fresh review, not silent overwriting. Closing dirty edits asks
for confirmation; controls block duplicate submissions and closure while saving.
If a response was lost after saving and refreshed details show a replacement,
**Inspect saved replacement** lets you verify the stored version before changing
anything further. Navigating away still asks before discarding retained edits.
This is not durable offline draft storage or evidence of external delivery.

Developer contracts (verified, owning account required):

- `criticalPath.outreach.details({ id, accountId })` returns the owned message,
  minimal candidate context, content-based `revision`, `replacementId`, `canChange`
  and current `revisionPolicy`. Reads use one repeatable-read snapshot; raw provider
  payloads are not returned. Outreach lists likewise use a restricted candidate
  projection and accept an optional account-bound `{ accountId }` query.
- `.revise({ id, accountId, expectedRevision, subject, body, notSent: true,
declaration: { humanOriginal: true, rulesReviewed: true }, idempotencyKey })`
  creates the linked replacement. `subject` must be a string or explicit `null`.
  Keys contain 8–80 letters, digits, colons, underscores or hyphens. The strict
  request rejects protected/unknown fields and unchanged text. The revision token
  is 64 lowercase hexadecimal characters and covers both message and candidate.
- `.cancel({ id, accountId, expectedRevision, notSent: true })` cancels an eligible
  unsent record. Both mutations return `{ changed, replayed, outreach }`. Repeating
  an already-cancelled record is an audit-free no-op. Account mismatches return
  `FORBIDDEN`, missing/foreign records `NOT_FOUND`, stale changes `CONFLICT`, full
  revision capacity `TOO_MANY_REQUESTS`, and unavailable storage fails closed.

Mutations lock the owner account, message, candidate and any inherited owned match
in a consistent order. Revision creation, original cancellation, source receipt,
audit and idempotency result commit together under READ COMMITTED; failure rolls
them all back. Audit metadata excludes message text. Identical committed revision
retries return the existing replacement's current state even after restart or
capacity/source changes; they do not renew permission, approvals or cancelled
descendants. Changing a request under the same key conflicts. Replaying the old
draft-creation key still returns the original cancelled record, never overwrites it.

Migration **0030** adds nullable `outreach_records.revises_id`, its unique index and
self-referencing foreign key. Existing rows retain null links and unchanged text;
one original can have at most one direct replacement. Apply it before this server
version. Verify a backup and test migration duration/locking on representative
staging data before release; isolated fixture tests are not large-table acceptance.
For forward rollback, pause revision admission and repair the application while
retaining links, history and receipts. Do not drop the column or deploy a writer
that overwrites messages in place. Any later approved account-deletion workflow
must handle children before parents (the foreign key deliberately does not cascade);
that privacy workflow remains a separate release requirement.

### Recorded partnership progress

Verified account owners can open **View details** for an assessed candidate and
use **Partnership progress** to select an outcome, optionally write private notes,
review the candidate/history/report and explicitly confirm before recording.
History is paged with **Older reports** and **Newest reports**. Reloading clears
confirmation; editing the report also requires fresh confirmation. A recorded
outcome is an owner's report, not a
verified agreement, the other person's consent, a legal partnership or evidence of
external delivery. Older prototype history may have unreviewed provenance. These
controls never send messages or change candidate opt-outs or assessment status.

An uncertain save keeps its exact command and retry key in this tab and disables
new reports until retry or reload/review. A conflict requires reload and review,
not automatic resubmission. Retry is not offered while the initial save is still
pending. Closing asks before discarding unsaved inputs and is blocked during a
save or reload. Failed reloads preserve inputs; account mismatch/blocked access
conceals progress. This is not durable offline storage. Legacy null timestamps
display as missing rather than inventing a date. Local Chromium-to-MySQL acceptance
covered explicit review, lost-response deduplication, stale review, preserved
opt-out/no outreach creation, paged legacy history and unsaved-close protection,
at desktop and mobile sizes. Synthetic verification setup is not live-inbox proof.

- `criticalPath.progress.list({ accountId, prospectId, beforeId? })` returns up to
  20 owned history rows, `nextBeforeId`, `assessmentAvailable`, a `review` token
  and the provenance notice. Rows expose ID, assessment ID, outcome, notes and
  recorded timestamps; they do not expose another account's records.
- `criticalPath.progress.record({ accountId, prospectId, expectedReview, outcome,
notes, confirmation: true, idempotencyKey })` appends a report. `expectedReview`
  is the returned 64-character lowercase hexadecimal review token;
  `idempotencyKey` is a UUID. Outcomes are `partnership_formed`, `still_talking`,
  `not_interested`, `no_response` and `timing_not_right`. Notes are trimmed and
  limited to 2,000 characters. Unknown/protected fields are rejected.

A current verified credential, unfenced owner account, owned candidate and owned
assessment are required. Changes to the candidate, latest assessment or latest
report invalidate the review. Simultaneous writes serialize on the account;
report, content-free audit metadata and retry receipt commit together. An exact
retry returns the saved report without duplicating it; changed content under the
same key conflicts, and altered saved content fails closed. Storage failures do
not confirm success. Timestamps mean recorded here, not when an external event
occurred. New reports use the existing outcome table and are included in the
private account export; no migration is added by this feature.

History is append-only through this namespace. Admission is limited to 50 retained
reports per candidate and 500 per account, including legacy rows. Reaching either
limit requires operator review and removes nothing automatically. Broken owned
assessment references fail closed. The account export/deletion/retention release
requirements elsewhere in this README still apply; this API is not a completed
privacy lifecycle or production-readiness certification.

### Conversation outcomes and internal reminders

For a message you have already confirmed as sent outside the tool, open **View /
manage** in the review queue. You can acknowledge that a response was received,
schedule or replace one internal reminder, cancel that reminder, or close the
conversation. Response and close actions require an explicit checkbox for the
currently reviewed record. Acknowledgment timestamps record when you saved the
fact here, not the original external reply time. Reply text is not imported or
stored by these controls, and no sentiment or outcome is inferred.

The **Follow-ups** tab has Due now, Scheduled and All reminders views, 25 rows per
page, deterministic date/ID ordering, a refresh button and one-minute refresh while
open. Times display in the browser's local time zone. Enter a future reminder
within 366 days; the server validates it against database time and stores whole
seconds. Check the displayed saved time, especially around daylight-saving changes.
There is one reminder per outreach record, not one per candidate.

**Reminders send neither messages nor notifications.** Scheduling preserves sent
or responded history; a future date is not immediately labelled due. Recording a
response clears the prior reminder; you may then schedule a new internal reminder.
Closing clears it and preserves message text and recorded sent/response/closure
timestamps. Closed records cannot be reopened through these controls. Archiving or
opting out a candidate excludes their reminders and blocks new ones; history,
reminder cancellation and closure remain available. Archiving retains the stored
date, so restoring an eligible candidate can make that reminder visible again.
Source permission expiry or an outreach pause does not prevent recording history;
an internal reminder is never permission to contact someone.

Legacy `follow_up_due` rows remain readable and are classified by their dates. New
reminders do not use that state, and the old transition back to `pending_review`
is disabled: an already-used message cannot re-enter the send-review workflow.
Sent/response totals use recorded timestamps, so closing a conversation no longer
removes it from these totals. These are operator-recorded facts, not provider
delivery or inbox analytics.

Developer contract:

- `criticalPath.outreach.conversation` accepts a strict common envelope
  `{ id, accountId, expectedRevision, idempotencyKey, action }`. The revision is
  the current `details` hash covering message and candidate. Retry keys are 8–80
  letters, digits, colons, underscores or hyphens.
- `action: "record_response"` and `action: "close"` also require
  `confirmed: true`; `"schedule_reminder"` requires an ISO datetime with offset
  in `followUpAt`; `"cancel_reminder"` has no additional fields.
- The existing `recordResponse`, `scheduleFollowUp` and `close` procedure names
  delegate to the same implementation but now require the reviewed envelope and
  their respective fields, without `action`. Old ID-only callers must migrate;
  they receive `BAD_REQUEST`, not an unreviewed mutation.
- `criticalPath.outreach.reminders({ accountId, filter, page, pageSize })` returns
  `{ accountId, asOf, total, page, pageSize, items }`. Filters are `due`, `scheduled`
  or `all`; default page size is 25, maximum 100. Items contain outreach ID,
  candidate ID/name/platform, state, reminder timestamp and a server-derived `due`
  flag. No message text or raw provider payload is included.

Stored verification, reviewed account and ownership are checked. Mutations lock
account, outreach and candidate in order; the state change, minimal audit event
and content-bound retry receipt commit together. Identical retries return the
current record without applying the action again, even after later closure.
Changing content under the same key, stale review or invalid state conflicts.
Use **Retry last conversation action** after an uncertain response; reloading
requires inspecting current history before starting another action. Account or
detail lookup failures disable actions instead of accepting stale review.

MySQL sessions must interpret TIMESTAMP values in UTC. These detail/reminder
paths explicitly fail closed on a non-zero session offset rather than guessing
legacy timestamp meaning or changing a pooled connection's configuration.
Migration **0031** adds only the `(user_id, follow_up_at, id)` index. Apply it
before release; representative migration-locking and load acceptance remain
operator work. No worker, external API, email integration or paid service is
introduced by this feature. Full conversation transcript import, relationship
outcome tracking and complete privacy export/deletion remain separate work.

## Downloading private account data

In **Outreach → Account data**, enter your current password, acknowledge that the
file contains private information, then choose **Download account JSON**. The
unencrypted file is intended for machine-readable inspection. Store it securely:
it can contain candidate details and private messages. Exporting does not send
email, contact a platform, archive records or delete the account.

Unlike the active-candidate CSV, this export includes retained account-owned
records, including archived candidates, opt-outs, closed outreach, reminders,
profile, notes, assessments, preferences, recorded billing and audit history,
and connection metadata. Its `cofounder-account-v1` manifest accounts for all
42 reviewed application tables: 37 account-owned categories (including empty
ones) and five excluded service-wide categories. Records linked through an owned
match or prospect are selected through that ownership relationship. Unowned
legacy records and other accounts' records are not included.

Every included category lists its fields, record count and excluded-field
reasons. Password hashes, tokens, session digests, encrypted credentials,
internal idempotency keys and unreviewed raw provider/execution payloads are excluded.
The public deletion-request reference and request status are included.
Service-wide login/mail quotas, capacity locks, model versions and pricing are omitted
without disclosing their values or record counts. Original included text is
preserved, including formula-like text: JSON is not the spreadsheet-safe viewing
CSV and should not be blindly converted into executable spreadsheet cells.

Connected local acceptance on **2026-10-01** exercised actual browser downloads
at desktop 1365×1000 and mobile 375×812 against the current compiled app and
current migrations on disposable MySQL. Both JSON files parsed with 42 category
declarations and 37 included data categories; an archived opted-out candidate and
the original saved draft were included, while another account's candidate and
seeded security values were absent. Downloaded byte/record counts matched the
server response, which carried `no-store`. Wrong passwords and cross-account
requests were rejected. An unreviewed schema column, a synthetic export exceeding
20 MiB and exhausted durable attempt quota returned 503, 413 and 429 respectively,
without an export payload. This is bounded synthetic local evidence, not a
complete legal access-response determination, hosted load test, real inbox test
or proof that every category has been exercised with populated customer data.

For account export, the server exposes the verified **POST mutation `accountData.export`** with
English/Dutch controls and privacy/limit warnings. Original JSON data and server
error explanations are not translated. Language switching preserves explicit
private-data review and never triggers another export. The download notice means
the browser started the download, not that storage succeeded. See
[current language acceptance](docs/ACCOUNT_EXPORT_LANGUAGE_2026-10-02.md).

The server retains
strict `{ accountId, password, confirmation: true }` input. It checks the current
stored verification and password against the authenticated credential context.
Incorrect password confirmation returns a local error; a changed credential
requires signing in again. A durable account quota allows **five admitted
attempts per 15 minutes**, including incorrect passwords and failed exports.
Migration **0032** adds the account-owned quota table with a cascading user
foreign key; it does not rewrite existing application records.

Each server process also admits at most **two simultaneous account-export
generations**. Excess requests receive `TOO_MANY_REQUESTS` immediately, without
queuing a password, starting database work or consuming an account attempt.
Slots are released when generation succeeds or fails. This protects the generation
path from unrestricted overlap; it is not a fleet-wide rate limit or a total
heap-memory ceiling. Completed response serialization/network buffering, other
features and additional server processes still require load testing and deployment
capacity controls. The durable five-attempt account quota remains shared through
the database.

HTTP delivery has a separate **two-export response budget** held until the server
finishes writing or the socket closes. Every export inside a batch consumes a
slot; a batch requesting more than two exports is refused before account context
or generation begins. Busy downloads receive the ordinary tRPC
`TOO_MANY_REQUESTS` error without an account attempt. This closes the gap between
generation finishing and a slow client's response draining. Finished writes are
not proof that the client saved the file. Every admitted export response has an
absolute **ten-minute deadline from admission**, including generation time.
Progress does not reset the deadline. Expiry closes the response and frees its
delivery slots; finish/close removes the timer. It does not cancel or refund
already-admitted database generation or automatically retry. An interrupted
request may consume an attempt even when no complete file reaches the browser.
The timer depends on the server event loop; reverse-proxy/host timeouts and
real-network acceptance remain separate. The budget is per application process,
not fleet-wide; fairness and other response-memory budgets remain open.

A separate **2026-10-01 local HTTP burst** exercised eight authenticated owners
under the proposed one-CPU/512-MiB app limit and 320-MiB Node heap. Two waves each
completed two approximately 20.55-MB exports and refused six busy requests; a
previously refused owner then succeeded. Refusals consumed no account attempts,
owned content/byte counts passed and the app had no OOM events. The larger fixture
required a separate two-GiB tmpfs test database after the one-GiB fixture was
OOM-killed during seeding, before exports. This does not prove one-GiB production
DB capacity or hosted/fleet/slow-client acceptance. See the exact results and
limitations in [synthetic load guidance](docs/SYNTHETIC_CUSTOMER_LOAD.md).

Generation uses a repeatable-read database snapshot, a source-size preflight,
and a final UTF-8 size check. The interactive ceiling is **100,000 records and
20 MiB**. Oversized exports fail without a partial file; do not delete records to
fit this limit. An operator-assisted oversized export process still needs to be
implemented and accepted before public launch. Successful generation commits a
content-free audit event before returning the file. That event is not included
in its own earlier snapshot and does not prove that the user saved the download.
No export file is stored by the application on the server.

Code inventory changes fail closed until their fields are reviewed. Live database
table/column names are compared with that inventory at the start and end of
generation; only the known Drizzle migration-bookkeeping columns are exempt.
This detects unreviewed additions/removals, not type/semantic drift, and is not
acceptance for concurrent schema migrations. UTC database sessions are required.
All tRPC responses use `Cache-Control: private, no-store`. The browser clears the
password input when submitting, avoids retaining completed mutation data, and
checks fresh account identity before starting the download.

Local connected acceptance on October 1, 2026 verified the production-built UI,
API and MySQL path: wrong-password rejection, an actual JSON download with secret
exclusions, and suppression of a pending download after switching accounts.
Desktop/mobile navigation and the privacy checkbox's keyboard behavior were also
checked. Email verification used synthetic database fixtures, not a live inbox.
See the [dated acceptance evidence](docs/PUBLIC_BETA_DELIVERY.md#connected-private-account-export-acceptance-recovered)
for versions, limitations and remaining release gates.

This is **not a database backup, restoration format, or complete legal
access-response determination**. Excluded payloads, third-party rights, unowned
legacy records, external provider stores, logs and backups require a separately
reviewed access process. Account deletion is not enabled by this feature. Those
privacy-lifecycle and operational acceptance requirements remain release gates.

### Requesting account deletion (review-held intake)

Under **Account data**, the request panel shows the current request status and
public reference. When `ENABLE_ACCOUNT_DELETION_REQUESTS=true`, a verified user
can submit a request with their current password and an explicit acknowledgement.
The result is **awaiting operator review**, not deleted or scheduled for deletion.
The account remains usable. No mail is sent, no provider is contacted, no work
fence is applied and no ordinary account data is erased. There is no promised
completion date or claim that privacy obligations are fulfilled by this intake.

The flag defaults to **false**, including in Compose. Enable it only after an
operator is responsible for monitoring intake. Pausing it stops new submissions
but preserves status access and password-confirmed withdrawal of pending requests.
The read-only operator command below lists pending requests. The operator processing
UI, notifications and erasure executor are not implemented; the flag does not enable
them. Do not collect public requests
without a real review process and the remaining privacy/operational launch gates.

Migration **0034** adds `account_deletion_requests`: one bounded row per account
containing the latest request reference, state, revision, request/withdrawal
dates and a confirmation-attempt window. Request/withdrawal history is also
recorded as content-free audit events. No password or confirmation text is stored.
Both commands share **five admitted attempts per 15 minutes**, including wrong
passwords, retries and failed transactions; status refreshes do not consume that
allowance. Quotas commit separately, so a failed request cannot refund guesses.
This is per-account admission, not a service-wide abuse or storage guarantee.

The narrowly allowlisted, verified endpoints are `accountData.deletionStatus`
(query), `accountData.requestDeletion` (POST mutation) and
`accountData.withdrawDeletion` (POST mutation). They require the exact signed-in
account. Mutations recheck current credentials, email verification and the work
fence under the owner lock both before admission and before changing state.
Passwords are verified on every submission and withdrawal. Revision and request
reference checks make identical transition retries idempotent, reject stale
commands and prevent an old submission from reopening a withdrawn request.
State changes and their audit event commit together. Missing storage fails closed.

The browser clears the password and acknowledgement on submission, retains no
completed mutation payload, and rechecks account identity before displaying a
successful response. A confirmation is bound to the displayed action and revision:
a background update cannot turn a checked request box into authorization to
withdraw. Refresh the status after an uncertain network outcome. Account exports
include this request row; the read-only deletion preflight reviews its ownership.

The policy for actual erasure, retained receipts and exceptional records remains
unresolved. This intake is not a deletion-completion receipt. A future processor
must atomically validate the still-pending request before fencing, reconcile
in-flight mail, revalidate ownership, and handle retention, external stores and
backups. Nothing here authorizes bypassing those gates.

### Reviewing pending deletion requests (operators only)

An operator with an existing, authorized database connection can list pending
requests from the `apps/cofounder-discovery` source checkout:

```powershell
pnpm.cmd account:deletion:requests --read-only --limit 50
```

This is a **read-only command**, not a web admin endpoint, queue worker or deletion
approval. It works while new request intake is disabled. It requires the checkout's
development dependencies and is not bundled into the minimal production image.
Check the target `DATABASE_URL` before running; use appropriately restricted
operator access and keep credentials and output private.

The JSON report contains the database check time and, for each pending request,
the account ID, public request reference, revision, request date and whether the
account is currently work-fenced. It includes fenced and unverified accounts so
those requests are not hidden from review. It does not include names, addresses,
passwords, candidate/message content or password-attempt counters. Account IDs
and request metadata still require private handling.

Pages are ordered by **account ID**, not request age or urgency. The default page
size is 50, with a maximum of 100. If `nextAfterAccountId` is non-null, pass that
exact value to the next invocation; for example, if it is `123`:

```powershell
pnpm.cmd account:deletion:requests --read-only --limit 50 --after-account-id 123
```

Continue until the cursor is null. Each invocation has its own database-enforced
read-only, repeatable-read snapshot: the entire multi-page scan is **not** one
snapshot. Requests may be submitted, withdrawn or replaced between pages,
including for an account already passed. Repeat complete scans from the beginning
and use request dates when prioritizing review. A page is not a claim that every
outstanding request has been reviewed. No cursor or review progress is persisted.

For a selected account, run `account:deletion:inspect` below. Its report now includes
the request's state, reference, revision, request/withdrawal dates and work-fence
status in the same snapshot as the ownership counts. Compare the reference and
revision with the queue record; changed or withdrawn requests require fresh review.
Absent requests and quota-only rows are explicitly reported as `none`.

Both diagnostics require UTC interpretation of request timestamps. Malformed
request metadata is rejected rather than presented as a valid request. The list
also validates its lookahead record before returning a continuation cursor.
Invalid arguments, unavailable storage and query failures return a safe JSON error
and nonzero exit; no partial success report is emitted. Neither command claims,
approves, processes, fences or deletes anything, and `deletionAuthorized` remains
false. The separate reviewed suspension command below revalidates the **current**
pending request inside its transaction. These reports do not bypass retention decisions, admin MFA,
external-store review or other launch requirements.

### Beginning reviewed deletion processing (operators only)

A controlled processing-preparation command is now bundled as
`dist/process-account-deletion.js`. Development users can run
`pnpm account:deletion:process`. Use the
[processing runbook](docs/ACCOUNT_DELETION_PROCESSING_RUNBOOK.md) for the exact
read-only check and `--suspend` arguments. The operator must independently verify
authority and the holder's exact pending request before using explicit suspension
confirmation and bounded operator/approval references. Those references are audit
labels, not authentication.

The transaction rejects changed/withdrawn requests, saves a processing receipt,
sets the work fence, clears recovery/verification links and revokes all sessions
atomically. Identical reviewed retries return the original fence without another
receipt. Unrelated fences and inconsistent evidence require reconciliation. No
customer records are erased; `deletionAuthorized` and `dataErased` remain false.
The request stays pending review and the operator queue reports its fence.

Suspension signs the holder out and prevents normal work and self-service request
withdrawal/status. The operator must coordinate a verified support channel; no
automatic notification or post-suspension portal is provided. This command does
not drain provider work, approve retention exceptions, unfence an account or
implement final erasure. Its schema manifest is embedded in the compiled check.
Human policy, live operational acceptance and the remaining deletion gates are open.

The [retention and erasure decision draft](docs/ACCOUNT_RETENTION_ERASURE_POLICY.md)
classifies all 42 current database tables and proposes scoped exceptions, backup
handling and release checks. It is **unapproved**: proposed periods are not active
settings or legal conclusions, and accepting the document alone cannot authorize
live erasure. The actual controller, applicable obligations and provider arrangements
still need review.

### Inspecting account-deletion dependencies (operators only)

Account deletion is **not enabled** yet. An operator with existing database
access can now inspect an account's local deletion dependencies from the
`apps/cofounder-discovery` source checkout:

```powershell
pnpm.cmd account:deletion:inspect --read-only --account-id 123
```

Replace `123` with the verified target account ID and check that `DATABASE_URL`
points to the intended database before running. Do not put connection credentials
in command-line arguments or share this report publicly. This is an operator
command, not a public API or customer-facing deletion button. It requires the
checkout's installed development dependencies; it is not a command bundled into
the minimal production image.

The command uses a database-enforced read-only, repeatable-read transaction and
returns JSON containing the account ID, inspection time, counts for 37 owned
categories, four excluded service categories and any issue codes. It does not
return names, emails, candidate/message contents, provider IDs or secrets. It
does not write audit records, revoke sessions, claim mail, contact providers or
delete data. `deletionAuthorized` is always **false**, even with an empty issue
list. Exit code 0 means the diagnostic completed, not that erasure is safe;
invalid input, unavailable storage or an unreviewed schema exits 1.

The independent reviewed schema covers all 42 application tables. Source and live
table/column names, foreign-key relationships and actions are checked, with an
InnoDB requirement and a second live-schema check before returning. This is not a
complete type/default/index/trigger or concurrent-migration audit. Ownership is
resolved through explicit account columns, matches and prospects. Incoming and
outgoing cross-owner references are flagged, including logical message-parent
links. A message's numeric recipient field is not assumed to identify a user.
Unowned legacy records that cannot be linked to this account still need review.

Financial usage, billing periods, invoices and audit history trigger retention
review when present. The bounded mail inspection also checks encrypted recovery
jobs before a worker assigns their user ID. It uses the existing mail-encryption
key only in memory. Missing/old keys, scrubbed unowned payloads or excess scan
volume produce an unresolved-mail issue and a **null** mail count, never a false
zero. Pending work and possible provider delivery are reported separately.
Shared anti-abuse and dispatch-budget counters are not attributed or reset.

Mail inspection is capped at 1,000 relevant-or-unassigned jobs and 64 KiB per
encrypted payload. Data queries carry two-second execution hints and inspection
checks a 30-second elapsed budget between queries; this is not a hard process,
connection-acquisition or metadata-lock timeout. Run it under operator supervision,
not as an unrestricted public endpoint. The result is a point-in-time diagnostic:
eventual deletion still needs fresh validation under an account/work fence,
session revocation, atomic erasure, explicit retention policy, durable receipts
and separate external-store/backup handling.

### Internal account-work fence (deletion preparation only)

Migration **0033** adds nullable `users.deletion_fenced_at`. Existing accounts
remain unfenced. The internal `fenceAccountForDeletion` function locks the account,
checks that its server-observed password hash is still current, records a stable
fence timestamp, clears verification/reset links and removes all account sessions
in one transaction. If session removal fails, the entire transaction rolls back.
Repeating the operation preserves the first timestamp. It does not erase profiles,
candidates, messages or other account data, and returns `deletionAuthorized: false`.

This is **not a customer deletion feature**. The separate operator processing
command now invokes the reviewed fence path only after checking the exact pending
request and approval references. The request-intake workflow above still only
reauthenticates and records the request; it does not suspend the account. Final
erasure must resolve retention and the remaining processing gates before proceeding.
Do not use raw database updates as a deletion tool.

Supported profile, candidate-intake/import/edit/archive/opt-out, qualification,
outreach-draft/revision/transition/conversation and export writes check the fence
under their account transaction lock. A stale authenticated request cannot bypass
these checks. New sessions and session authentication reject fenced accounts;
verification/reset redemption and verification-token issuance also stop. Queued
account mail is discarded without a new delivery attempt when the worker sees a
fenced owner. Export admission and generation both check, so a fence committed
between those phases stops generation.

The fence is **not a global stop or proof that deletion is safe**. Reads already
authorized may finish. Mail claimed before the fence and verification mail already
handed to transport may still finish and record delivery; they must be reconciled
before erasure. User-less recovery requests can still enter the non-enumerating
queue, although workers reject them once attributed to a fenced account. Unsupported
legacy routes, legacy jobs, provider automation and external administrator actions
are not covered by this transaction contract. Keep those capabilities disabled for
the public beta. No automatic unfencing, erasure, retention receipt, backup purge or
external-store deletion has been enabled. The read-only preflight still reports
the full workflow gates as unfinished.

## Architecture

### Beta capacity controls

The free beta has bounded defaults for **new retained records**, not an unlimited
signup/import promise. These values are provisional product admission settings,
not a load-test result, vendor quote or guarantee that hosting costs EUR 100/month.

| Environment setting                    | Default | What counts                                                                                       |
| -------------------------------------- | ------: | ------------------------------------------------------------------------------------------------- |
| `CAPACITY_ACCOUNTS`                    |     100 | All retained users, including administrators, unverified and legacy accounts                      |
| `CAPACITY_SESSIONS_PER_ACCOUNT`        |      10 | Session rows retained for one account after its own expired-row cleanup                           |
| `CAPACITY_PROSPECTS_TOTAL`             |  50,000 | All retained candidates across the service, including archived, opted-out and unowned legacy rows |
| `CAPACITY_PROSPECTS_PER_ACCOUNT`       |   1,000 | Retained candidates owned by one account                                                          |
| `CAPACITY_OUTREACH_TOTAL`              |  25,000 | All retained outreach records, in every workflow state                                            |
| `CAPACITY_OUTREACH_PER_ACCOUNT`        |     500 | Retained outreach records owned by one account                                                    |
| `CAPACITY_WORKSPACE_AUDIT_TOTAL`       | 100,000 | Retained receipts for the supported workspace actions listed below, across all accounts           |
| `CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT` |  10,000 | Those workspace receipts owned by one account                                                     |

The first applicable service or account limit stops additions. The total service
allowance is shared: each account is not guaranteed its maximum simultaneously.
Zero pauses new records for that resource. Values must be whole decimal numbers
between 0 and 10,000,000; explicitly empty or invalid values prevent startup.
Configure every app/worker instance identically. Changing environment settings
requires restarting the affected processes; coordinate changes so old and new
instances do not enforce different ceilings.

Session admission uses the existing owner lock, not a shared service lock. It
counts retained rows after existing expired-row cleanup within the same READ
COMMITTED transaction as insertion. Concurrent sign-ins cannot oversubscribe
one account, and another customer's sessions are never removed. At the limit,
existing browsers remain valid; sign out elsewhere or use configured password
recovery to revoke old sessions. Zero stops new sessions and refuses registration
before account creation, not authentication of existing sessions or recovery.
A rejected insertion rolls back its cleanup too.
No automatic oldest-session eviction or general session-retention worker is added;
historical over-limit accounts and direct database writers need operator review.
This per-account ceiling is not a global storage-byte or provider-invoice limit.

Other resource counts come from committed database records under a shared resource lock, not
in-memory counters. Admission and insertion share a READ COMMITTED transaction.
All retained-record insertion paths participate, including outreach revisions and
lower-level helpers used by disabled legacy features. Migration 0028 adds only the InnoDB `capacity_locks`
table, populated lazily; it does not rewrite or delete existing data. Legacy data
already above a ceiling stays readable and manageable, but new growth is denied.
Direct SQL, operator seed scripts and out-of-band writers are outside this
application guarantee and must not be run against a live beta without review.

A capacity rejection returns `TOO_MANY_REQUESTS` with a message identifying the
operation. The public response does not expose other customers' usage. CSV intake
is all-or-nothing, including if the limit is reached partway through a batch;
rolled-back rows, audit and receipt are not retained. Duplicate rows do not consume
new candidate capacity. Matching committed import/draft retries can still return
their prior result when full, subject to the existing source/permission checks.
Duplicate-only CSV requests can succeed without adding candidates. Registration
also rechecks email uniqueness under the shared account lock; historical duplicate
emails are preserved and still need reconciliation before release.

The existing interface displays a capacity error and retains unsaved CSV/draft
input. Retry only after the operator resolves capacity; unchanged submissions keep
their existing retry identity. Do not delete opt-outs, source evidence or audit
history simply to free space. Closing/archiving records does not remove them from
capacity accounting. Existing reads, opt-outs and supported state transitions are
not blocked merely because retained-row capacity is full.

The separate workspace-audit allowance also bounds repeated edits rather than
only additions. Covered actions are `profile.save`; `prospect.add`, `edit`,
`archive`, `restore`, `qualify`, `import_csv`; `outreach.draft`,
`transition`, `cancel`, `revise`, `conversation`; and `partnership.progress`.
Historical receipts count regardless of age or outcome, including unowned rows
in the service total. A covered mutation, its audit record and its retry receipt
commit together or roll back together. The owner lock is acquired first and the
shared workspace-audit lock last; no in-memory allowance resets on restart.
Exact committed retries that return without a new audit remain usable when full.
New duplicate-only imports still create an audit receipt and require allowance.

At this separate limit, covered edits, cancellation and state transitions can
also be refused; read-only access remains available. Candidate opt-out, account
security/recovery and privacy-request audit records are deliberately exempt.
No old history is removed. The generic audit helper rejects covered workspace
actions so callers must use their atomic mutation transaction. Direct SQL and
other out-of-band writers remain outside this guarantee. This is not a cap on
all audit activity, request traffic, physical bytes, or provider invoices.
Both new settings must match across all instances; zero pauses new covered
workspace mutations. No new migration is needed beyond existing migration 0028.
Global counts currently scan matching audit rows; staging query-latency and lock
contention measurements are still required before public admission.

Operator diagnosis uses read-only counts in the actual deployment database:

```sql
SELECT COUNT(*) AS accounts FROM users;
SELECT COUNT(*) AS candidates FROM prospects;
SELECT COUNT(*) AS outreach FROM outreach_records;
SELECT user_id, COUNT(*) AS candidates FROM prospects GROUP BY user_id;
SELECT user_id, COUNT(*) AS outreach FROM outreach_records GROUP BY user_id;
```

Compare those counts with the effective configuration on every instance. These
queries are not billing reports. Apply migration 0028 before the new server starts;
missing capacity storage fails closed on new writes. A forward rollback should
pause affected admission and retain the table/data while correcting application
code. Do not deploy an older ungated writer during rollback. Test realistic load,
count-query latency and lock contention on staging before changing the defaults.

Still required for the overall budget: current tax-inclusive hosting/database/mail
quotes, provider-enforced spending stops, durable AI budgets, service-wide
request/abuse limits, session/audit/idempotency retention, storage/backup monitoring
and measured capacity. No provider was purchased or configured by this change.

### Account-mail dispatch budget

All implemented account-email delivery paths share **100 admitted attempts per UTC
calendar day and 1,000 per UTC calendar month** by default. Set
`ACCOUNT_MAIL_DAILY_ATTEMPTS` and `ACCOUNT_MAIL_MONTHLY_ATTEMPTS` to whole decimal
numbers from 0 to 10,000,000. Missing settings use those defaults; empty/invalid
values prevent startup. Either zero pauses new delivery attempts. Configure and
restart all replicas together; mixed configurations cannot enforce one ceiling.
These are provisional service limits, not vendor-plan entitlements or an invoice cap.

Verification, password recovery and password-change notices compete for the same
allowance. Both counters are locked in a fixed order and use the database clock
after lock acquisition. A reservation commits with the verification token or queue
claim, before any provider call. Concurrent accounts and separate server processes
cannot independently spend the last slot. Token/job persistence failures roll back
the reservation; missing budget storage fails closed. No new migration is needed
beyond the existing `account_mail_quotas` table from migration 0024. The branch's
retention, outreach-version links, reminder index, account-export quota, account-work fence, deletion-request intake, login admission and administrator passkeys now require all migrations through 0036.

Every admitted attempt counts, including retries and uncertain provider outcomes.
A crash after commit but before transport also conservatively consumes an attempt.
Counts are not unique messages, inbox deliveries or billing records. Existing queue
retries retain their exact message and idempotency key within the original job
lifetime; Resend documents a 24-hour idempotency window. Password-reset jobs retain
their 30-minute expiry and change notices their 23-hour expiry. No live provider
or inbox acceptance was performed. [Resend idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys)

When full, verification returns a service-limit error without replacing the old
token. Recovery requests still return the same non-enumerating response; the worker
defers valid jobs for up to 60 seconds (or until their earlier expiry), preserving
payload, token and attempt count. Expired jobs are discarded; deferred mail is not
promised delivery. Exhaustion ends the worker's current batch. Reset-request
IP/address admission remains separate and does not reveal account existence.

The two fixed keys below contain no personal data and do not change when queue
encryption secrets rotate. Do not delete/reset these counters during deployments,
cleanup or recovery: that would reopen the current allowance. Restore budget state
alongside mail/token state; an older backup requires an operator reconciliation or
a pause until the relevant windows end. Lowering a limit preserves already-used
attempts. Do not roll back to an older server that bypasses dispatch reservation.

Read-only operator inspection (compare with the effective limits on every replica):

```sql
SELECT quota_key,
       CASE WHEN expires_at <= CURRENT_TIMESTAMP THEN 0 ELSE used END AS used_in_active_window,
       UNIX_TIMESTAMP(expires_at) AS window_end_unix_seconds
FROM account_mail_quotas
WHERE quota_key IN ('account-mail:dispatch:day:v1', 'account-mail:dispatch:month:v1');
```

Rows appear lazily; absence before first use means no recorded attempts, not a
health check. This scope excludes legacy notification simulations, other apps or
keys on the provider account, AI, traffic, mail-queue storage and audit retention.
Provider-enforced spending stops, alerts and tax-inclusive quotes are still needed
to uphold the EUR 100/month operating plan. Critical security notices can be delayed
by the shared ceiling; monitor capacity before enabling a public beta.

### Account-mail retention

`ENABLE_ACCOUNT_MAIL_RETENTION=true` opts into bounded mail cleanup. It defaults to
false and requires `DATABASE_URL`, but no mail-provider credentials. It runs once
at server startup and one minute after each completed pass, independently of the
sending worker. Each pass has three separately committed phases, each touching at
most 100 selected records:

1. Discard expired queued/sending jobs and clear their encrypted payloads. Existing
   terminal states are preserved when an expired residual payload is cleared.
2. Delete accepted/discarded/failed metadata only after the original job expiry is
   more than seven days old, and only when the payload is already cleared.
3. Delete expired recovery-request/verification-owner admission quotas identified by the existing lowercase
   64-character hexadecimal HMAC format. Fixed dispatch-budget keys and other key
   formats are never deleted, even after their windows expire.

All job phases preserve live delivery leases. Locked rows are skipped for a later
pass; cleanup does not wait for them or assume an empty pass means no backlog.
Point-key writes remain within the selected locks. A failed phase rolls back its
own changes; earlier committed phases are not undone. Retrying is safe. Successful
nonempty passes log only aggregate counts (`account_mail_retention_completed`);
failures log only `account_mail_retention_failed`. Shutdown drains active cleanup
before closing the database. Payload clearing and metadata deletion are permanent
in that database; recoverability depends on separately managed backups.

Apply additive migration 0029 before enabling cleanup. It creates only
`account_mail_jobs_expiry_idx`; existing request quotas already have an expiry
index. Neither migration deletes records. The application checks the database
session has a zero UTC offset before every cleanup transaction and fails closed
otherwise. Configure all database sessions consistently to UTC and review legacy
timestamp provenance before enabling this setting; a zero offset now does not
prove historical data was written with the same convention. The database clock,
not the application clock, determines expiry. Do not change session timezone while
work is running. Staging load, index-build timing and operational backup acceptance
are still required before public release.

Seven days is the proposed operational diagnostic window after job expiry, not a
legal retention determination. Batch limits, locks, an offline worker or a database
outage can delay removal; it is not an exact deletion SLA. Operators must accept
the policy, inspect backlog and arrange monitoring before opting in. Disable the
flag and restart to pause future passes; leave the additive index/data in place.
Do not restore a stale backup without reconciling live quotas and mail state.
Deleting rows does not necessarily shrink allocated database files or copies in
backups and does not itself guarantee lower hosting costs.

Read-only operator checks (run against the relevant deployment):

```sql
SELECT @@session.time_zone,
       TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CURRENT_TIMESTAMP()) AS utc_offset_seconds;
SELECT state, COUNT(*) AS jobs, MIN(expires_at) AS oldest_expiry
FROM account_mail_jobs GROUP BY state;
SELECT COUNT(*) AS expired_request_quotas
FROM account_mail_quotas
WHERE expires_at <= CURRENT_TIMESTAMP
  AND REGEXP_LIKE(quota_key, '^[0-9a-f]{64}$', 'c');
```

This does not delete accounts, sessions, verification/reset digests, candidate
records, consent evidence, opt-outs, outreach history or audit records. Their
retention/export/deletion controls remain separate release work. No live customer
data was deleted to implement or test this feature; only disposable synthetic
fixtures were used.

### Durable login-attempt limits

Administrator passkey verification is now **required at the `adminProcedure` API
boundary**, including `system.notifyOwner`. An administrator role or password-only
session no longer suffices. Migration **0036** stores enrolled public keys, bounded
single-use challenges and short-lived session elevation. A verified passkey grants
only its originating session up to five minutes of privileged access, never beyond
session expiry. Current role, account fence, password version and session revocation
are checked in MySQL; storage failure denies access.

`system.notifyOwner` additionally requires `ENABLE_OWNER_NOTIFICATIONS=true`.
It is disabled by default even if inherited Forge credentials are present, and
both Compose definitions keep it off. It is separate from the legacy-route and
account-mail-worker switches: it is not an automatic monitoring/alert service.
Before any authorized enablement, approve the actual recipient/provider,
content transfer, terms and cost controls. The configured base must use HTTPS
without embedded credentials/query/fragment; redirects are refused. Input is
limited to 1,200 title and 20,000 content characters. Requests have a five-second
abort deadline. Failure logs contain fixed reason/status fields, never provider
body, status text, endpoint, credentials or exception text. An accepted HTTP
response is not a delivery receipt; an error or timeout may be uncertain, so do
not automatically retry or send through a fallback channel.

The `auth.adminMfa` routes provide status, enrollment, verification and backup-key
removal with explicit account binding. First enrollment additionally requires an
expiring operator grant from an internal, non-HTTP primitive; no password-only
bootstrap or recovery bypass is exposed. Verified administrators can open
**Security** from the outreach workspace, or visit `/admin/security`. Ordinary
accounts cannot use this page to become administrators.

The security page supports first enrollment, verification, credential listing,
backup enrollment and removal. First enrollment asks for a descriptive label,
current account password and expiring operator approval. Complete the native
browser/device passkey prompt; the page never asks for a device PIN, biometric
data or private key. Enrollment does not itself grant privileged access: choose
**Verify with passkey** afterward. Adding/removing a key requires fresh verification
and password confirmation, ends verification in all sessions, and requires another
verification afterward. At most five keys are allowed; the last cannot be removed.
Keep an independently usable backup before production operator acceptance.

You may cancel preparation or the device prompt, but a change already submitted
to the server cannot be cancelled. Cancelled/old requests cannot replace a newer
action's result. Controls pause while the account/security state is being checked
or cannot be confirmed. Passwords and approval grants are cleared from form fields
on submission and are not retained in client mutation caches or browser storage.
Unsupported browsers/contexts do not receive a weaker authentication fallback.

The connected browser workflow passed against isolated MySQL with a virtual
authenticator, including cancellation, backup removal, continued use of the
original key and expired-verification handling. This is **not real-device or
public HTTPS acceptance**. A controlled initial-enrollment command is now available
with read-only inspection, exact account/origin checks, explicit operator/approval
references and private-file token output. Use the
[operator enrollment runbook](docs/ADMIN_ENROLLMENT_RUNBOOK.md); this is not an HTTP
endpoint or role-promotion command. Initial `--issue` cannot reset lost factors.
Separate reviewed `--recovery-check` / `--recover` modes now implement atomic
lost-all-passkeys recovery; see the [recovery runbook](docs/ADMIN_RECOVERY_RUNBOOK.md).
Recovery requires independent identity/authority review and a matching current
review digest, revokes all sessions and keys, preserves attempt quotas and issues
a ten-minute replacement enrollment approval. Issuance requires a private
POSIX output directory on the controlled Linux host; Windows supports inspection
and help but not token-file issuance. The human identity/authority review and
real-device acceptance still need operator sign-off. The recovery implementation
is locally tested, not a live-approved recovery service. Password reset does not remove MFA. Existing administrators
without approved enrollment remain blocked from privileged actions. See the
[administrator MFA implementation contract](docs/ADMIN_MFA_DESIGN.md) for remaining
operator, accessibility, real-device and deployment gates.

`auth.login` reserves admission in MySQL **before** looking up the account or
checking its password. Every well-formed admitted request consumes an attempt,
including wrong passwords, unknown addresses, successful logins and later failures.
In each fixed 15-minute bucket window the beta permits 10 attempts per normalized
email address, 20 per source IP and 1,000 across the service. Exhausting any bucket
returns the same `TOO_MANY_REQUESTS` response without issuing a cookie. These are
provisional beta limits, not a claim of measured public capacity.

Migration **0035** adds `login_attempt_quotas`. A stable service-row lock serializes
admission across app processes; database time is read after that lock is acquired.
Rejected reservations roll back provisional rows and do not extend existing
windows. The next accepted reservation removes at most 100 expired identity
counters. No background cleanup job is enabled: without further accepted traffic,
expired counters can remain stored, but are not treated as live allowances.
The service mutex row is retained. Other application data is untouched.

Only keyed digests, counts and expiry timestamps are stored—no passwords, raw
emails or IP addresses. HMAC uses a purpose-specific subkey derived from
`JWT_SECRET`; all replicas must use the same secret. Rotation changes identity
digests and resets their effective buckets, but not the stable global ceiling.
Email matching trims and lowercases; equivalent IPv6 and IPv4-mapped forms share
an IP bucket. Missing/invalid IP metadata shares an `unknown` bucket. IP data comes
from Express's request context, not arbitrary headers read by this module;
the deployed proxy boundary and `TRUST_PROXY` setting must still be validated.

Storage, configuration or UTC-session failures stop sign-in with a generic
`SERVICE_UNAVAILABLE` error. There is no in-memory fallback. These counters are
service-level pseudonymous security data, excluded from customer downloads and
account-owned deletion counts; the schema inventories explicitly include them.

Throttling is **not MFA** or complete brute-force/DDoS protection. Shared networks
can share an IP limit; an attacker can temporarily exhaust a known address or the
service budget. Existing sessions and password-recovery admission are independent;
password reset does not erase login quotas. Edge controls, monitoring, representative
load tests, administrator MFA and live recovery acceptance remain release gates.
The design follows the balancing considerations in the
[OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#login-throttling).

`auth.register` also reserves durable admission before password validation,
account lookup, hashing or creation: five attempts per source IP, three per
normalized email and 100 service-wide, each in a fixed one-hour window. Successful
registrations, duplicate-address attempts and later failures consume allowance;
malformed input, disabled registration and a zero session ceiling do not. A
storage/UTC/configuration failure returns a fixed `SERVICE_UNAVAILABLE` error
before account creation; there is no local-counter fallback.

Registration reuses migration 0035's security-counter table without a new schema
migration. Purpose-separated keyed digests and `registration-global-v1` keep its
allowances independent from sign-in. Both paths acquire the existing
`login-global-v1` mutex first; neither expiry cleanup can remove either stable
service row. Each accepted reservation removes at most 100 expired identity
counters across authentication families, with rejection rolling all provisional work
back. Secret rotation does not reset either global ceiling. These are shared
pseudonymous security records, not account-owned export/erasure data.

All replicas must run the same admission implementation and secret. The fixed
limits are provisional: shared networks can affect each other, distributed abuse
can exhaust the public allowance, and no attempt counter substitutes for edge
traffic controls, monitoring or the complete EUR 100 operating-cost ceiling.
This is not a claim that every retained legacy route has shared durable admission. The existing
duplicate-account response is unchanged; this is not an account-enumeration fix.

`auth.resetPassword` now reserves shared MySQL admission before password-strength
validation, expensive hashing or token redemption. Each fixed 15-minute window
allows ten attempts per source IP, ten per exact case-sensitive reset token and
200 across the service. Admitted weak-password, invalid/expired/used-link requests,
successful resets and later failures consume attempts. Malformed input does not.
Limits return a fixed `TOO_MANY_REQUESTS` message; unavailable or malformed storage,
configuration or UTC failures return a fixed recovery `SERVICE_UNAVAILABLE`
response before hashing or changing the account. No process-local fallback is used.

Reset admission uses a separate HMAC purpose and `password-reset-global-v1`
allowance in the existing migration-0035 security table. Raw reset tokens,
replacement passwords and IPs are not stored in these counters. Token identity
is never lowercased or trimmed; distinct case-sensitive bearer links have distinct
allowances. Login, registration, reset and verification-redemption paths share
the same first mutex and never prune any of their four stable service rows. Admission is committed before
redemption, so a rejected reset does not refund an already admitted attempt.
The existing atomic token consumption/password change/session revocation remains
separate and unchanged; recovery still does not sign the caller in.

All replicas require identical code and secrets. Identity allowances reset on
secret rotation, but stable global ceilings do not. Shared networks and exhausted
known links can affect legitimate recovery; operator support, proxy validation,
load/abuse testing and real-inbox acceptance remain necessary. These limits do
not establish a complete traffic, disk or EUR 100 invoice ceiling, nor enable
external sending, background erasure or public deployment.

Verification-email replacement also enforces a shared **three-attempt fixed
one-hour window per account**, inside the existing owner-locked transaction.
The current account/email and deletion fence are checked first, then the owner
allowance, service-wide daily/monthly dispatch reservation and replacement token
commit together. A denied fourth attempt makes no provider call and preserves
the existing link and all allowances. Token-write or shared-budget failures roll
back the owner allowance; uncertain provider failures after commit consume it.
No process-local verification throttle or fallback remains in this route.

The owner counter uses a purpose-separated HMAC of the numeric account identity
with the shared `JWT_SECRET`, in the existing `account_mail_quotas` table. No raw
account ID, email, password or verification token is stored in that counter.
Epoch database time is read after its lock, including for non-UTC sessions;
clock jumps in the application do not reopen the window. All replicas need the
same secret. Signing-secret rotation changes the owner key and resets its
effective hourly window, **not** the stable service-wide sending ceilings.
These pseudonymous security counters remain excluded from customer downloads
and automatic account-owned cleanup; they are not claimed anonymous.

The existing opt-in mail-retention worker recognizes their reviewed 64-character
HMAC format and may prune expired owner counters in its bounded quota phase.
Retention remains off by default; no new automatic deletion job is enabled.
If it stays off, expired counter rows may remain stored but are not live limits.
Measured capacity, account-recovery/support, real inbox/provider delivery,
approved retention and hosted operations remain separate release gates.

### Application structure

The current application is a single workspace package under `apps/cofounder-discovery`.

Frontend:

- React 19;
- Vite 7;
- Wouter routing;
- TanStack Query plus tRPC client;
- Radix UI primitives and local UI components;
- Tailwind CSS styling.

Backend:

- Node.js 22 runtime target;
- Express 5 server;
- tRPC API routers;
- Drizzle ORM with MySQL;
- migration and doctor scripts;
- production static asset serving from the Vite build.

Persistence:

- MySQL 8.4;
- Drizzle migrations `0000` through `0036`;
- core tables for users, profiles, prospects, matches, campaigns, outreach records, audit events, idempotency records, messages, conversations, saved searches, timeline events, pipeline stages, tasks, notes, guardrails, platform credentials, and automation jobs.

Runtime:

- Docker Compose starts MySQL and the production app.
- The app listens on container port `3000`.
- The local host exposes the app at `http://localhost:3014`.
- Health endpoint: `/api/health`.
- Readiness endpoint: `/api/ready`.
- HAI feed endpoint: `/api/integrations/hai/feed`.

## Quick Start For Windows Operators

Prerequisites:

- Windows 11;
- Docker Desktop installed;
- Docker engine running.

Start the local production stack:

```powershell
.\scripts\start-windows.ps1 -OpenBrowser
```

Open:

```text
http://localhost:3014
```

The launcher uses Docker Compose, applies pending migrations, and stores data in the named MySQL Docker volume. Re-running the launcher preserves that data.

Stop without deleting local data:

```powershell
docker compose stop
```

The application handles `SIGTERM` and `SIGINT` as a graceful shutdown: it stops
new work, drains active API operations (even when their clients disconnect) and
the current account-email job, then closes database connections. Development
live-reload connections are closed separately so they cannot hold shutdown open.
The application allows 25 seconds to drain; Compose allows 30 seconds before
forcing a stop. Do not shorten that container grace period below the application
deadline. These settings follow [Node's HTTP shutdown behavior](https://nodejs.org/api/http.html#serverclosecallback)
and [Docker's stop-grace configuration](https://docs.docker.com/reference/compose-file/services/#stop_grace_period).

Successful shutdown logs `shutdown_completed` and exits with code 0. A failed or
timed-out drain logs `shutdown_failed` and exits with code 1; investigate that
event rather than treating it as a clean restart. Unfinished account-email jobs
remain subject to their durable lease, expiry and retry rules. This does not
guarantee inbox delivery or that every interrupted client receives a response.

Be careful with:

```powershell
docker compose down --volumes
```

That removes the local MySQL volume and deletes the app data stored in it.

## Developer Setup

Use the pinned package manager version. On Windows, `npx.cmd pnpm@10.4.1 ...` is the most reliable form.

Install dependencies:

```powershell
npx.cmd pnpm@10.4.1 install --frozen-lockfile
```

Copy the environment file:

```powershell
Copy-Item .\apps\cofounder-discovery\.env.example .\apps\cofounder-discovery\.env
```

Set at least:

```text
DATABASE_URL=mysql://cofounder:cofounder@127.0.0.1:3306/cofounder
JWT_SECRET=<32+ random characters>
CREDENTIAL_ENCRYPTION_SECRET=<32+ random characters>
```

Run the development server:

```powershell
npx.cmd pnpm@10.4.1 dev
```

Run common checks from the repository root:

```powershell
npx.cmd pnpm@10.4.1 check
npx.cmd pnpm@10.4.1 test
npx.cmd pnpm@10.4.1 build
```

Database-backed tests create and remove synthetic records. Never point them at
an operator's workspace or a customer database. From the repository root, the
isolated Docker workflow installs the locked dependencies, initializes a new
MySQL database, builds fresh application artifacts, applies migrations and runs
the integration suites:

```powershell
docker compose -p cofounder-integration -f compose.integration.yml up --build --abort-on-container-exit --exit-code-from tests
```

This test stack publishes no ports and has no persistent database volume. Its
private loopback connection blocks external provider access during tests and
does not allocate a Docker bridge subnet; image/dependency
downloads occur during the build. All supplied credentials are synthetic and
must never be reused for hosting. Database contents disappear as soon as the
database container stops, including the automatic stop when tests finish. Use a
different project name to retain earlier containers and logs for diagnosis, not
their database contents. After collecting the results, remove only this temporary
stack's containers and metadata:

```powershell
docker compose -p cofounder-integration -f compose.integration.yml down
```

For an existing **dedicated test database**, `pnpm test:integration` accepts
`DATABASE_URL`. Build first with `pnpm build`: migration tests execute both source
and compiled startup commands. The migration suite additionally requires
`MIGRATION_TEST_ROOT_PASSWORD` for the disposable MySQL instance at
`127.0.0.1/cofounder_test`. It creates and removes uniquely named
`cf_migration_test_*` fixture databases and kills only a connection observed running
its synthetic test query. This credential is test-only and must never be supplied
to the production app. Compose and CI supply their synthetic test credentials.
Windows-to-Docker published ports have shown intermittent
connection timeouts locally; the isolated workflow avoids that connection path.

## Workspace Scripts

The [completion matrix](docs/GOAL_COMPLETION_MATRIX.md) lists all 116 original
specification phases with their exact titles and unfinished acceptance criteria.
Historical broad Verified labels are superseded. The original PDF is unavailable
at its supplied path in the October 2 audit; preserved text and its digest are
identified in the matrix. Neither this matrix nor green integrity checks establish
full worldwide-beta completion.

Run these from the repository root:

| Command                                         | Purpose                                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                      | Start the supported app in development mode                                                                                                  |
| `pnpm build`                                    | Build the React client and bundled Node server                                                                                               |
| `pnpm start`                                    | Start the built production server                                                                                                            |
| `pnpm check`                                    | Run TypeScript checks                                                                                                                        |
| `pnpm test`                                     | Run operator gates and application units; needs Docker Compose for read-only configuration checks                                            |
| `pnpm test:release-contract`                    | Check local/CI operator-suite inventory and mandatory acceptance wiring                                                                      |
| `pnpm test:requirements`                        | Test exact original phase/title/status/evidence-path integrity, not substantive completion                                                   |
| `pnpm requirements:check`                       | Report structural phase coverage; always leaves completion unproven                                                                          |
| `pnpm test:budget`                              | Test budget-declaration checks, not provider billing                                                                                         |
| `pnpm --dir apps/cofounder-discovery test:unit` | Run application units without operator Compose checks                                                                                        |
| `pnpm test:integration`                         | Run database-backed integration suites                                                                                                       |
| `pnpm test:readiness:integration`               | Rehearse authenticated MySQL health probes in isolated temporary fixtures                                                                    |
| `pnpm test:all`                                 | Run local gates, application database tests, then isolated readiness and recovery acceptance                                                 |
| `pnpm db:migrate`                               | Apply migrations with the shared startup lock                                                                                                |
| `pnpm support:bundle --help`                    | Prepare a local, owner-authorized diagnostic bundle; no logs, account data or upload. See [support-bundle guidance](docs/SUPPORT_BUNDLE.md). |
| `pnpm test:support`                             | Test strict support-bundle inputs, authorization gating and the real local command                                                           |
| `pnpm doctor`                                   | Check runtime configuration                                                                                                                  |
| `pnpm verify`                                   | Run check, unit tests, build, and doctor                                                                                                     |

Root `pnpm test` now runs release-command and requirements integrity, budget, monitoring, encrypted
recovery, production-configuration tests and application units. The production-
configuration suite reads synthetic Compose models; it does not start or change
containers. Docker Compose must be available. `test:all` additionally needs the
prepared isolated database/recovery environment; do not point it at live data.
The readiness rehearsal requires the already available MySQL image pinned in
`.github/workflows/ci.yml` and Docker engine. It creates only network-disabled, unpublished, memory-bounded tmpfs fixtures,
checks the actual CI/local/integration probe definitions and stops its own fixtures.
It never uses an existing database or pulls an image. Stopped fixture containers
remain inspectable; their synthetic tmpfs data is discarded on stop.
The inventory regression rejects missing/duplicated root operator test files and
checks the CI verify job's existing scalar-run step convention. It excludes
conditional/failure-ignored steps. It is not a general YAML validator, hosted-run
result or proof of repository branch protection.
Root integration-file inventory also requires every rehearsal to run exactly once
in `test:all` and the CI verify job.

### Migration startup safety

`pnpm db:migrate` and the production `node dist/migrate.js` entrypoint use the same
runner. The app-level development `db:push` helper generates migration files and
then calls that runner; it is not a replacement for reviewed release migrations.
The production container starts the web server only after migration exits 0.
Rebuild compiled artifacts before deploying a changed migration runner.

The runner takes a MySQL advisory lock on a **dedicated physical connection**
before reading/applying the migration history. The same connection executes
Drizzle's DDL and journal updates, then releases the lock and closes. Its stable
name is `cofounder:migrate:` plus the first 40 hexadecimal SHA-256 characters of
the lowercased selected database name. The lock coordinates cooperating runners
against the same database on one MySQL server; it is not a cluster-wide lock or a
block against direct SQL, old application images or direct `drizzle-kit migrate`.
Do not mix those unguarded paths into a deployment.

`MIGRATION_LOCK_TIMEOUT_SECONDS` defaults to 60 and accepts whole seconds 1–300.
An explicitly empty or invalid value is rejected before connecting. A timeout,
connection failure, missing migration assets or migration failure produces a
nonzero exit and a content-free `migration_failed` event with a safe phase code.
Raw driver errors and SQL are not printed by this runner. `migrations_applied`
is emitted only after successful application and connection/lock cleanup.
The wait limit bounds **lock acquisition only**, not DDL execution or the entire
deployment. No infinite wait, forced lock takeover or automatic retry is added.

While holding that lock, the runner validates the shipped MySQL manifest (ordered
indices and strictly increasing timestamps, supported versions, safe file tags and
UTF-8 SQL), captures its SQL and SHA-256 hashes, and checks every recorded migration
against the corresponding shipped entry. Database history must be an exact prefix
of the release: changed applied SQL, missing/reordered/duplicate entries, invalid
timestamps or a database newer than the artifact stop startup **before pending
DDL**. A non-empty schema with a missing or empty journal is not silently adopted.
An empty database or an unchanged valid prefix can proceed; a fully applied release
can restart without rerunning its migrations.

`migration_assets_invalid` identifies missing or invalid release assets;
`migration_history_review_required` identifies a history check that cannot be
accepted before application. Drizzle executes the same captured SQL snapshot using
its existing journal format. A second history check must match the complete release
before success; failure reports `migration_history_verification_failed`. These
codes intentionally contain no SQL, hashes, credentials or database contents.
The runner uses the locked Drizzle version's lower-level migration engine; dependency
upgrades must pass source, compiled-entrypoint and container-command contract tests.

Migration hashes include exact line endings and whitespace. Preserve the original
release assets, including their byte content, across platforms; do not normalize
already-applied migrations or rewrite database hashes to make a check pass. This is
**history integrity**, not a full schema-drift scanner: manual column/index changes,
unjournaled partial DDL after an otherwise valid prefix, and non-cooperating database
writers still require operator investigation. Deploy immutable release artifacts.

MySQL advisory locks survive transaction commits, but many schema operations
commit implicitly. This prevents cooperating migrators from racing; it does **not**
make a multi-statement migration atomic or reversible. A test deliberately proves
that earlier DDL can remain after a later statement fails. See the official
[locking contract](https://dev.mysql.com/doc/refman/8.4/en/locking-functions.html)
and [implicit-commit rules](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html).

On migration failure, keep the new app stopped, preserve the error phase and
inspect the actual schema/journal through an authorized private operator path.
Do not blindly rerun partial DDL, remove journal rows or edit previously deployed
migrations. Use a reviewed recovery/forward-repair plan and a verified backup.
Representative-data migration timing, backup/restore rehearsal, older-image
compatibility, actual schema-drift inspection and live deployment acceptance remain
separate release gates. No existing migration file was changed by these startup
safety improvements, and no automatic history repair is provided.

## Environment Variables

| Variable                                                        |                                 Required | Default/Example                                      | Purpose                                                                                                                                               |
| --------------------------------------------------------------- | ---------------------------------------: | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                      |                                      Yes | `development` or `production`                        | Node runtime mode                                                                                                                                     |
| `APP_MODE`                                                      |                                       No | `development`                                        | Public runtime mode label                                                                                                                             |
| `MIGRATION_LOCK_TIMEOUT_SECONDS`                                |                                       No | `60`                                                 | Migration runner only; wait 1–300 seconds for its advisory lock                                                                                       |
| `HOST`                                                          |                                       No | `127.0.0.1` locally, `0.0.0.0` in Docker             | Bind host                                                                                                                                             |
| `PORT`                                                          |                                       No | `3000`                                               | App port inside the process/container                                                                                                                 |
| `PUBLIC_ORIGIN`                                                 |                      Yes for hosted mode | `http://localhost:3014`                              | HTTP(S) origin only; HTTPS required for non-loopback production hosts                                                                                 |
| `DATABASE_URL`                                                  |                                      Yes | MySQL URL                                            | Drizzle/MySQL connection                                                                                                                              |
| `JWT_SECRET`                                                    |                                      Yes | 32+ random chars                                     | Signs session cookies                                                                                                                                 |
| `ENABLE_REGISTRATION`                                           |                                       No | `true` locally, usually `false` hosted               | Allows local account creation                                                                                                                         |
| `ENABLE_ACCOUNT_DELETION_REQUESTS`                              |                                       No | `false`                                              | Accepts review-held deletion requests; never enables erasure. Existing requests can still be viewed and withdrawn while disabled.                     |
| `API_MAX_ACTIVE_WORK`                                           |                                       No | `32`                                                 | Per-process outstanding tracked API work; range 0-1024, zero pauses admission. See [active work admission](#active-work-admission).                   |
| `RESEND_API_KEY`                                                |                Required for account mail | empty                                                | Transactional account-email provider credential                                                                                                       |
| `AUTH_EMAIL_FROM`                                               |                Required for account mail | empty                                                | Sender email address verified with the provider                                                                                                       |
| `AUTH_MAIL_ENCRYPTION_SECRET`                                   |           Required for password recovery | independent 32+ random chars                         | Encrypts queued account-mail payloads; never reuse the session key                                                                                    |
| `ENABLE_ACCOUNT_MAIL_WORKER`                                    |                                       No | `false`                                              | Opts into background recovery/change-notice delivery; enabling it validates all required mail and database settings                                   |
| `ENABLE_ACCOUNT_MAIL_RETENTION`                                 |                                       No | `false`                                              | Opt-in expired mail cleanup, independent of sending; see [retention policy](#account-mail-retention)                                                  |
| `ACCOUNT_MAIL_DAILY_ATTEMPTS` / `ACCOUNT_MAIL_MONTHLY_ATTEMPTS` |                                       No | See [dispatch budget](#account-mail-dispatch-budget) | Shared account-mail attempt ceilings; zero pauses sending                                                                                             |
| `OUTREACH_PAUSED`                                               |                                       No | `false`                                              | Blocks send preparation while leaving research/review available                                                                                       |
| `ENABLE_UNSAFE_LEGACY_ROUTES`                                   |                                       No | `false`                                              | Keeps imported unsafe prototype routes disabled                                                                                                       |
| `ENABLE_PLATFORM_AUTOMATION`                                    |                                       No | `false`                                              | Keeps browser/platform automation disabled                                                                                                            |
| `ENABLE_OWNER_NOTIFICATIONS`                                    |                                       No | `false`                                              | Separate administrator/MFA-gated inherited provider route; disabled even when credentials exist. Review receiver, content and cost before enablement. |
| `CREDENTIAL_ENCRYPTION_SECRET`                                  | Required for stored platform credentials | 32+ random chars                                     | Encrypts platform credential records                                                                                                                  |
| `TRUST_PROXY`                                                   |                              Hosted only | `false`                                              | Enables one trusted reverse proxy hop                                                                                                                 |
| `HAI_CONNECTOR_TOKEN`                                           |                                 Optional | 32+ random chars                                     | Enables the read-only HAI feed when paired with user ID                                                                                               |
| `HAI_CONNECTOR_USER_ID`                                         |                                 Optional | User ID                                              | Fixes the HAI feed to one owner                                                                                                                       |
| `HAI_CONNECTOR_INCLUDE_CONTENT`                                 |                                       No | `false`                                              | Includes message content in HAI feed only when explicitly approved                                                                                    |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`                 |                                 Optional | empty                                                | OAuth hooks, not needed for assisted outreach                                                                                                         |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`                     |                                 Optional | empty                                                | OAuth hooks, not needed for assisted outreach                                                                                                         |

## HAI Connector

The HAI integration is a read-only Generic JSON Feed over audit/workflow events.

Default behavior:

- disabled unless `HAI_CONNECTOR_TOKEN` and `HAI_CONNECTOR_USER_ID` are both set;
- returns `503` when disabled;
- requires `Authorization: Bearer <HAI_CONNECTOR_TOKEN>`;
- retains an early process-local 60/source/minute traffic guard, then charges
  authenticated requests against shared database limits: **60/source, 60/configured
  owner and 120/service per fixed 60-second window**;
- owner-scoped to the configured user;
- rechecks that owner's current verified and unsuspended state under a database
  share lock before reading events; missing, unverified or deletion-fenced owners
  return `403` with no feed items, even with a valid connector bearer;
- uses immutable audit event IDs as cursors;
- omits message body content unless `HAI_CONNECTOR_INCLUDE_CONTENT=true`.

This read uses the same first account lock as supported suspension/re-verification
transactions. A committed restriction is checked before later reads proceed;
already authorized in-flight responses and previously ingested HAI copies cannot
be recalled by this check. Storage/query failures return sanitized `503` responses.
The feed is not a customer-data eraser, a provider consent grant or proof of HAI
deployment acceptance. Shared admission commits before owner/event reads and is
not refunded for a subsequent account refusal or read failure. A shared refusal
returns `429 rate_limited` with conservative `Retry-After: 60`; admission/storage
failure returns content-free `503 database_unavailable`. Replicas must use the same
database and signing secret. Only keyed source/owner digests and counters are stored,
not connector bearers or raw addresses; these are pseudonymous security records.
Database time governs expiry; bounded opportunistic cleanup preserves stable
service rows. Signing-secret rotation changes source/owner digests but does not
reset the service ceiling; connector-token rotation does not reset any allowance.
The early guard remains process-local. Neither layer is an invoice-enforced budget,
upstream denial-of-service protection or an approved retention policy.

Local feed URL for an HAI process on the same Windows host:

```text
http://host.docker.internal:3014/api/integrations/hai/feed
```

Hosted/ngrok feed URL:

```text
https://your-domain.example/api/integrations/hai/feed
```

HAI registration, HTTP-feed enablement, and host allowlisting are external operator steps. They are not performed by this repository.

The OpenAPI description is in `docs/hai-connector.openapi.yaml`.

## ngrok And Hosted Testing

Use ngrok only after separate operator approval for public exposure and deployment.
Review [the hosted tunnel runbook](docs/HOSTED_TUNNEL.md). The launcher now uses
the standalone production definition, not the demonstration database or local
Compose defaults. It requires an already available reviewed immutable image and
protected database/session secret files; no provider or purchase is provisioned.

```powershell
.\scripts\start-ngrok.ps1 -PublishConfirmed
```

Optional reserved URL:

```powershell
.\scripts\start-ngrok.ps1 -PublishConfirmed -Url https://your-domain.ngrok.app
```

The foreground coordinator starts a loopback holding gate before ngrok. Public
requests receive 503 until the exact endpoint, actual hosted container settings
and database readiness are checked. It strips client forwarding chains, accepts
only the configured HTTPS ingress, and monitors the app/agent while running.
Keep this terminal open. Cancellation or verification failure closes forwarding
and stops its own agent; it never enables registration or silently restores a
development deployment. This is locally tested launch ordering, not verified
live TLS, browser-cookie, provider, public-launch or security acceptance.

## Backups

Use the [database recovery runbook](docs/DATABASE_RECOVERY.md). The Node CLI and
PowerShell backup wrapper require explicit source, credentials, key, destination
and maintenance acknowledgement. They create authenticated encrypted backups,
never overwrite existing artifacts and do not write plaintext SQL to disk.

Restore requires a separate, explicitly confirmed empty MySQL container with no
network exposure, its event scheduler disabled and binary logging off on that
separate target. Binary-logged targets are rejected before SQL import; do not
disable logging on a live database or expand privileges to bypass this boundary.
Wrong keys and corrupted files
are rejected before SQL is submitted. A non-root name alone is insufficient:
restore checks require direct grants confined to the target database, with no
global powers beyond USAGE, role grants/active roles or grant delegation.
Escaped underscore scopes are required; unknown grant forms fail closed.
The tool inspects but never alters account privileges. Use separate backup
credentials where source inspection requires global privileges.
After importing a backup, the isolated restore command expires every restored
account session and clears its administrator step-up approval. Historical session
rows are preserved; users must sign in again. This prevents the restore command
from reactivating sessions revoked after the snapshot. A direct/manual SQL import
does not apply this safeguard. The isolated restore CLI also expires restored
password-reset and email-verification links while retaining historical digests;
fresh links are required. Existing email-verified flags are not reclassified.
Post-backup password/address changes, historical verified-status reconciliation, deletion or
suppression requests and other queued actions still need independent reconciliation
before the restored database can receive traffic.
Restored queued/in-flight account-mail jobs are expired without deleting history;
the worker discards them instead of issuing fresh reset tokens or replaying notices.
Post-backup mail acknowledgements and provider budget usage still require review.
The synthetic rehearsal compares restored
schema, indexes, migration history and binary/Unicode data; it is not production
disaster-recovery acceptance. The current tool has a 64 MiB dump limit. Remote
storage, scheduling/alerts, retention, representative-data capacity, independent
application-key recovery and a hosted restore/promotion drill remain release gates.

## CI And Verification

GitHub Actions defines two release gates:

- `verify` - installs with pnpm 10.4.1, runs TypeScript, unit tests, migrations, integration tests, production build, and production dependency audit.
- Its operator checks include release-command inventory, budget declarations,
  monitoring, encrypted recovery and production configuration. The budget and
  inventory gates are explicit CI steps; tests cannot pass merely because these
  commands exist in `package.json`. New operator suites require inventory review.
- CI/local/integration MySQL health probes use an authenticated application-user
  TCP `SELECT 1`, not a socket ping. The isolated readiness rehearsal checks good
  credentials, bad credentials, a missing schema and a socket-only MySQL fixture.
  A database health check is not proof of migrations, write privileges, application
  connectivity from another network, TLS, a hosted CI pass or deployment acceptance;
  those retain their separate application/release checks.
  MySQL explicitly documents that a ping may return success for rejected
  authentication; its official container initializer disables networking.
  See the [MySQL ping contract](https://dev.mysql.com/doc/refman/8.4/en/mysqladmin.html)
  and [official image entrypoint](https://github.com/docker-library/mysql/blob/master/8.4/docker-entrypoint.sh).
- `container-smoke` - builds the production Docker image, starts Docker Compose, waits for MySQL and app readiness, verifies `/api/ready`, verifies `/api/health`, confirms automation and legacy routes are disabled, confirms the HAI feed is disabled by default, prints diagnostics, and tears down the stack.

The production Dockerfile uses a digest-pinned Node 22 base and runs as `node`,
not root. The base selection is explicit through `NODE_IMAGE`; changing it requires
review and a new build/acceptance run. The portable package is created from the
shared lockfile with offline `pnpm deploy --prod`, not legacy deployment.
Repository `.npmrc` and lockfile injection settings must stay consistent. Missing
cached dependencies fail packaging rather than fetching newly resolved versions.
See [pnpm's deployment contract](https://pnpm.io/10.x/cli/deploy).

The Compose app uses a read-only root filesystem, bounded temporary storage,
dropped capabilities, no privilege escalation and a process limit. It forwards
`API_MAX_ACTIVE_WORK`, including an explicit zero pause. These safeguards do not
replace private production database credentials, HTTPS, measured resource limits,
monitoring or operator approval; the supplied Compose defaults remain local-only.

`scripts/production-smoke.mjs` runs **inside a disposable synthetic production
container**. It checks non-root execution, absent source/development/secret paths,
database readiness, compiled assets and cache/security headers, anonymous account
responses, batch rejection, legacy/HAI denial and cross-origin rejection. CI runs
it through stdin so the diagnostic script need not ship in the runtime image:

```sh
docker compose exec -T app node --input-type=module < scripts/production-smoke.mjs
```

Use only an explicitly prepared synthetic production-mode stack with providers
disabled. This check does not prove rendered browser behaviour, live inbox delivery,
worldwide privacy compliance or hosting capacity. CI configuration is not evidence
that a remote GitHub run occurred. The Docker-patterns review informed the non-root,
immutable-base and container isolation settings.

Latest documented verification evidence is in:

- [Public beta delivery ledger](docs/PUBLIC_BETA_DELIVERY.md) — current branch evidence and remaining release gates;
- [Synthetic authenticated load methodology](docs/SYNTHETIC_CUSTOMER_LOAD.md) — isolated read-workload checks, predefined thresholds and limits of that evidence;
- `docs/FINAL_VERIFICATION_REPORT.md`
- `docs/GOAL_COMPLETION_MATRIX.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/CODEX_WORKLOG.md`

The following evidence belongs to the earlier local-workflow implementation
report, not acceptance of the public SaaS beta:

- TypeScript passing;
- 191 unit tests passing;
- 33 MySQL-backed legacy integration tests passing;
- critical-path integration passing for import replay, owner isolation, and assisted-send flow;
- production build passing with a main bundle around 372 KB / 114 KB gzip;
- production dependency audit passing with no known high-severity production vulnerabilities;
- migrations `0020` and `0021` applied to MySQL 8.4;
- Windows production bundle acceptance;
- desktop and mobile browser checks;
- dedicated ngrok HTTPS acceptance;
- HAI feed contract and cursor replay checks;
- no live external provider delivery attempted or claimed.

## Security Notes

Read `docs/SECURITY.md` before hosting or connecting external systems.

### Separate production configuration and mounted secrets

The default `docker-compose.yml` contains **local-only credentials**. The separate
`compose.production.yml` is a standalone application definition that requires a
reviewed image, public origin and protected database/session secret files. It does
not provision a database or TLS proxy, and must not be merged with the local stack.
Its launch gates remain closed, outreach is paused, and resource/log limits are
explicit initial bounds—not measured capacity or a guarantee about the EUR 100
monthly budget. Account mail has a separate opt-in overlay.

Six runtime secret variables support a corresponding `_FILE` path, including the
database URL used by startup migrations, application storage and packaged operator
tools. Resolution is bounded and fails closed without copying file contents into
the process environment; raw and file values cannot conflict. Existing
environment-only setups remain supported. Real host permissions, database/TLS,
secret rotation, backups, monitoring, load and release approval still need acceptance.
See the [production container runbook](docs/PRODUCTION_CONTAINER_RUNBOOK.md) for
exact inputs, supported variables, limitations and read-only checks. The
Docker-patterns skill informed this separation and its privilege/resource bounds.

### Read-only runtime monitoring

`node scripts/production-monitor.mjs` checks production liveness and database
readiness on numeric loopback, with bounded timeouts/response size and no raw
response bodies, secrets or URLs in output. Nonzero exit reports an unavailable
latest sample. Finite multi-sample runs emit one alert at the configured failure
threshold and one recovery event, not repeated alert spam. Remote HTTPS probing
requires explicit opt-in and approved deployment authority. The tool does not
send email/webhooks, repair services or provision monitoring. See
[runtime monitoring](docs/RUNTIME_MONITORING.md) for commands, exit codes,
supervision/state limits and the remaining real alert-delivery acceptance.

### HTTP errors and request correlation

Unknown `/api` routes return **404 JSON**, not the website's HTML page with a
misleading success status. Malformed path encodings return **400** before route
dispatch. Invalid JSON, invalid compressed bodies and excessive form nesting
return **400**; bodies above the existing **1 MiB** ceiling return **413**;
unsupported body charsets or encodings return **415**. These responses use
`Cache-Control: private, no-store` and contain only a bounded error code and
server-generated `requestId`, also available in the `X-Request-Id` response header.
Supplied correlation headers are not trusted or reflected.

Unexpected errors reaching the outer HTTP handler return a generic **500** and
emit a bounded `http_request_failed` event with the generated ID. The handler does
not serialize raw messages, stack traces, request bodies, URLs or credentials.
Errors after response headers have been sent close the connection rather than
append an error to a partial response. Existing tRPC procedure-error envelopes,
OAuth removal responses and other explicit route responses retain their contracts;
this outer handler is not a claim that every imported legacy logger is sanitized.
The tRPC formatter separately strips stacks and replaces unexpected internal
error messages with a generic retry/support message, so SQL and driver details
are not returned through that error path. Explicit policy errors retain their
messages and status codes. Native HTTP regression and a deliberate schema-failure
browser check passed on 2026-10-01; this is not a complete logging/privacy audit.
The regression now uses the real SuperJSON transformer: removing the stack key,
not merely assigning undefined, prevents null/undefined-value metadata on the
wire. A fresh packaged production image also passed an intentional schema-failure
check under non-root/read-only constraints with mounted synthetic secrets; see
the [exact-runtime checkpoint](docs/PUBLIC_BETA_DELIVERY.md#exact-packaged-error-privacy-acceptance-and-serializer-regression).

A connected Chromium/HTTP/MySQL check also passed registration, individual
candidate intake, saved-record reload and original draft persistence on desktop
and mobile, with no sending or external requests. Email verification and contact
declarations were synthetic fixtures, not real inbox or permission acceptance.
See the [dated scope and failed-to-successful chronology](docs/PUBLIC_BETA_DELIVERY.md#connected-candidate-intake-draft-persistence-and-public-error-privacy).

Normal website routes still use the client-side application fallback. Actual
socket and application-process tests cover these boundaries, including the
compiled production server; this is not hosted monitoring, browser acceptance,
traffic-abuse protection or a full security audit.

### HTTP batch limits

The mounted tRPC HTTP adapter accepts at most **20 operations per batch**.
Oversized read or write batches return HTTP 400 before account context or
procedure execution. The browser uses the same ceiling and automatically splits
larger bursts into multiple requests. The existing 1 MiB request-body limit still
applies; JSON parsing can occur before batch admission.

This ceiling limits amplification within one request. It is **not** a request-rate
limit, per-account allowance, fleet-wide concurrency bound, denial-of-service
guarantee or spending cap. Deployment-level traffic controls and measured load
acceptance remain required. Account login/mail/capacity controls remain separate.
The API-design review informed the explicit rejection status and matching client
boundary; actual adapter and running-server tests verify the supported behaviour.

### Active work admission

`API_MAX_ACTIVE_WORK` defaults to **32 outstanding tracked operations per process**.
Whole decimal values 0-1024 are accepted; empty, fractional or out-of-range values
fail configuration. Zero pauses new tracked work. Restart the app to apply changes.
Account context creation, tRPC procedures, database readiness checks and the HAI
feed share this pool; a batch can consume multiple procedure slots. This is not
the number of connected users or HTTP sockets.

At capacity, new work receives temporary-unavailable errors (HTTP 503 for a
single failed tRPC request; mixed batches retain tRPC's per-operation outcomes).
The mounted adapter supplies `Retry-After: 1` when such errors occur. Do not blindly
retry a mutation whose earlier outcome is uncertain. There is no waiting queue.
Work stays counted until it settles, even if its browser disconnects; synchronous
and asynchronous failures release slots. Shutdown still drains admitted work.
Liveness `/api/health` stays available during an admission pause; `/api/ready`
reports `application_busy` rather than pretending the database failed.

This is a local overload safeguard, not a durable request allowance, fleet-wide
limit or cost cap. Background mail/retention workers, direct operator tools,
static assets, body parsing and unsupported legacy paths are not covered by this
pool. Keep legacy routes disabled. Deployment traffic controls, workload/latency
measurements and live-provider acceptance remain release requirements.

### Bounded local traffic guards

Optional HAI front-door traffic uses a process-local guard capped at
**10,000 active records**. Login, registration, password-reset completion,
verification redemption and authenticated HAI feed admission instead have
independent durable MySQL global/source/identity counters; recovery requests and
verification dispatch also have separate durable admission/attempt budgets. Stored
keys are per-process salted hashes rather than raw client addresses. Expired
records are removed before admission and by an unreferenced 60-second cleanup
timer; shutdown stops that timer. Both the counter store and its expiry index are
bounded, and repeated attempts do not create additional expiry entries.

An active client's quota is never evicted to make room for a new client. If the
guard is full, new keys fail closed with **503**; known keys retain their existing
quota. A depleted client quota returns **429**. The tRPC adapter and HAI route
include `Retry-After`; mixed tRPC batches keep per-operation outcomes, and the
header uses the longest applicable delay. Do not blindly retry a mutation with
an uncertain earlier outcome. Current route allowances are unchanged.

The transient HAI counters are **not durable or fleet-wide**: restart clears them, replicas
do not share them, and shared capacity can be exhausted by abusive traffic.
Salted identifiers are pseudonymous, not a promise of anonymous personal data.
Cleanup depends on the running process and its clock; this is not a complete
privacy-retention policy. Separate durable account/mail/outreach controls remain
in place. Keep one app instance and require upstream traffic filtering and measured
load acceptance before public launch. The API-design skill informed the quota
versus temporary-capacity distinction and retry response contract.

### Synthetic authenticated read-load checkpoint (2026-10-01)

The latest local acceptance used 100 synthetic accounts and 10,000 candidates,
with real HTTP logins and durable signed sessions. Both 5- and 20-concurrent-actor
read tiers passed all 6,000 requests, with successful-response p95 of 66.60ms and
195.41ms respectively. The 100-actor overload tier rejected most requests with
controlled HTTP 503 / Retry-After; **this is not capacity for 100 simultaneously
successful users**. There were no transport, ownership-correctness or retry-header
failures. See the [methodology](docs/SYNTHETIC_CUSTOMER_LOAD.md) and
[dated evidence](docs/PUBLIC_BETA_DELIVERY.md#authenticated-read-load-acceptance-and-cold-login-deadlock-investigation).

This check found a real concurrent first-login session deadlock. Expiry cleanup
now skips an empty range deletion and targets existing expired primary keys
under the owner security lock. Active sessions and password/deletion fences are
preserved. The final production build passed 525 unit tests; the corrected full
database acceptance passed 535 tests with 15 existing legacy skips. The original
failing regression, failed fixture attempts and corrected results are recorded,
not silently counted as passes.

The read workload is deliberately narrower than customer acceptance: synthetic
setup bypasses signup/email verification/intake, and it excludes writes, UI,
mobile/accessibility, mail, AI, live platforms, hosted latency and a long-running
soak. The app used one CPU / 512 MiB and its isolated tmpfs database one CPU /
1 GiB; larger functional-test stress fixtures used separate limits. No price,
host sizing, full security certification or public launch approval follows from
these measurements. Provider, privacy, recovery and whole-workflow gates remain.

The short version:

- use unique 32+ character secrets;
- keep MySQL and the app loopback-bound unless using the controlled ngrok path;
- disable registration in hosted mode unless intentionally onboarding a user;
- leave `ENABLE_PLATFORM_AUTOMATION=false`;
- leave `ENABLE_UNSAFE_LEGACY_ROUTES=false`;
- keep HAI content disabled unless content sharing is explicitly approved;
- rotate any secret that appears in logs, shell history, Git, screenshots, or chat;
- run a backup before migrations and test restores separately.

## Troubleshooting

Docker Desktop not running:

- Start Docker Desktop first, then rerun `.\scripts\start-windows.ps1 -OpenBrowser`.

Port already in use:

- The Docker app binds `127.0.0.1:3014`.
- MySQL binds `127.0.0.1:3317`.
- Stop conflicting services or adjust the compose file deliberately.

Database-backed tests fail with `Database not available`:

- Start MySQL and set `DATABASE_URL`.
- Non-database unit tests can run without MySQL.

Local database container stays unhealthy:

- Check that the intended application user can authenticate over TCP and access
  the configured database. Server liveness alone is no longer sufficient.
- Reconcile existing database credentials and grants through the approved operator
  path. Do not delete the persistent volume or reset credentials merely to make
  the health check green; preserve data and investigate configuration drift.

pnpm behaves differently on Windows:

- Use the pinned version explicitly: `npx.cmd pnpm@10.4.1 ...`.

HAI feed returns `503`:

- That is correct when `HAI_CONNECTOR_TOKEN` or `HAI_CONNECTOR_USER_ID` is missing.

HAI feed returns `401`:

- Check the `Authorization: Bearer ...` token.

Messages are not being sent automatically:

- Correct. The supported product prepares reviewed manual actions. It does not send provider messages by default.

## Documentation Map

The [security assessment checkpoint](docs/SECURITY.md#whole-product-assessment-checkpoint-october-2-2026)
identifies the managed whole-product threat model and its source snapshot.
It distinguishes real supported paths from inactive legacy code and conditional
provider/host capabilities. It is not an approved security audit or permission to
launch. The [locally tested tunnel repair](docs/HOSTED_TUNNEL.md) now holds app
forwarding closed until hosted checks pass. Real provider/HTTPS/browser acceptance
and renewed review of changed launcher sources remain required before public use.

The [privacy impact assessment draft](docs/PRIVACY_IMPACT_ASSESSMENT_DRAFT.md)
explains candidate and account privacy risks, actual qualification behavior,
provider/copy boundaries, and the decisions still required before public launch.
Its [source-bound inventory](docs/PRIVACY_SCHEMA_INVENTORY_2026-10-02.json)
covers 43 tables/505 fields, not live records or complete nested-content review.
Neither document is an approved DPIA, public privacy notice or permission to
collect, contact or erase people. No retention or registration setting was changed.

| File                                 | Use                                                 |
| ------------------------------------ | --------------------------------------------------- |
| `apps/cofounder-discovery/README.md` | App-specific developer notes                        |
| `docs/OPERATOR_RUNBOOK.md`           | Windows, backup, ngrok, HAI, and incident operation |
| `docs/SECURITY.md`                   | Hosting, secrets, and safety boundary               |
| `docs/CRITICAL_PATH.md`              | Supported end-to-end product workflow               |
| `docs/FINAL_VERIFICATION_REPORT.md`  | Final verification results                          |
| `docs/GOAL_COMPLETION_MATRIX.md`     | Requirement coverage matrix                         |
| `docs/ACCEPTANCE_TESTS.md`           | Manual/browser/provider acceptance evidence         |
| `docs/API_USAGE_AUDIT.md`            | API surface and usage audit                         |
| `docs/UI_ACTION_AUDIT.md`            | UI action and workflow audit                        |
| `docs/TASK_GRAPH.md`                 | Implementation task graph                           |
| `docs/CODEX_WORKLOG.md`              | Implementation worklog                              |

## License

The workspace package metadata declares MIT, but no standalone repository license
file was found in the October 2 source audit. That metadata is not a completed
licensing review. The intended repository license, third-party dependencies/service
terms and inherited ZIP/demo asset rights still need confirmation before release
or redistribution. No copyright holder, grant or provider permission is invented.

The [October 2 packaged dependency review](docs/THIRD_PARTY_RELEASE_REVIEW_2026-10-02.md)
now includes a hash-backed inventory of 546 production package/version records.
It distinguishes declarations from actual notice files, records the khroma MIT
text despite missing metadata, and flags incomplete notice/service/imported-rights
review. This is not legal approval or a complete SBOM; no repository licence was
chosen or third-party permission granted by the inventory.
