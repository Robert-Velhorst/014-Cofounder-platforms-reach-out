# UI action audit

## Reproducible current structural inventory

The [October 20 source inventory](UI_ACTION_INVENTORY_2026-10-20.json) records
230 action-bearing JSX elements, 206 event attributes, 26 navigation elements
and five action elements with spread attributes across 151 files in the App
import/re-export/literal lazy-import closure. Input digest:
`ec39ef28fe9c2709544c0cb7dd5179454fc6ddd90559ba4ad33ceab1242371ca`.
Latest inventory refresh: source hashes and action-expression digests now
bind to the 2026-10-20 consolidation source. API routes, UI action classifications,
and recorded counts match the prior receipt. This is structural evidence only,
not production or connected acceptance.
[Dated review and admission limits](PLATFORM_INDONESIA_REVIEW_2026-10-02.md).
Preceding fingerprint refresh: candidate-list Dutch/English copy added one imported
copy module and changed labels/accessibility attributes. Compared both previous
inventories before refreshing: API handler/policy/totals and UI event/navigation/
disabled/spread shapes remain identical; consumer/action positions and interface
expression digests changed. All 170 operator cases passed without skips. This is
structural agreement, not complete rendered acceptance or release approval.
Earlier fingerprint refresh: three French discovery records changed the imported
catalogue source bytes, not the UI action/API-reference records or totals. The
stale-receipt check failed as intended; comparison confirmed exactly that one
input changed, then regenerated inventory and all 170 operator tests passed.
[Dated source and check limits](PLATFORM_FRANCE_REVIEW_2026-10-02.md).
Latest addition: public English/Dutch `/help`, with local topic anchors and a
new-tab guide link. The syntax inventory counts five new navigation-bearing
source elements, not every rendered loop item. No endpoint or mutation added.
Earlier closure refresh: [uncertain CSV recovery](CSV_IMPORT_RECOVERY_2026-10-02.md).
Earlier recovery state, before-unload subscription and explicit edit-release controls
changed. Two source action elements/event attributes were added, not two new
endpoints. The earlier language/export repair changed copy/presentation, not
action or event totals. At that checkpoint, 168 operator/audit tests passed without skips.
Each record has source/line, element tag, event names, navigation/disabled/spread
markers and an expression hash. Source content and private values are not emitted.
API references are stored separately by file: proximity is not proof that a
particular click invokes that endpoint, nor proof of its data effect.

Run `pnpm audit:ui` for a fresh read-only inventory and `pnpm test:ui-audit` for
drift and scanner checks. The ordinary test and declared CI verification commands
include this gate; no hosted CI execution is implied. Review changed handlers
before refreshing the snapshot. Root tooling changes do not establish a newly
qualified container or complete application acceptance.

The five scanner checks cover exact snapshot agreement, literal lazy imports and
re-exports/cycles, exclusion of unimported legacy sources/comments, disabled/spread
markers, separate API references/no expression-content reflection, unresolved or
malformed-source refusal, changed handler digests and deterministic output.
The closure may contain imported controls that never render. Conversely, library
controls, dynamic nonliteral imports, event delegation and imperative browser
actions are not exhaustively discovered. This is a review inventory, not a
complete rendered-control count or semantic action audit.

### Next semantic acceptance priorities

Product-lens prioritization uses impact × confidence ÷ effort (1–5 estimates),
not measured customer adoption or a reduced definition of the original goal:

| Next action                                                                  | Impact | Confidence | Effort | Score | Required evidence                                                                                 |
| ---------------------------------------------------------------------------- | ------ | ---------- | ------ | ----- | ------------------------------------------------------------------------------------------------- |
| Review account lifecycle controls and unavailable-mail failure paths         | 5      | 4          | 3      | 6.7   | Handler/API/data/error mapping plus current isolated browser cases; real inbox remains separate   |
| Review candidate intake/import/export with keyboard and stale-account states | 5      | 4          | 4      | 5.0   | Every local action classified, explicit-save/retry mapping and browser refusal/download checks    |
| Review administrator security and library-generated controls                 | 5      | 3          | 4      | 3.8   | WebAuthn/operator boundary review and approved authenticator acceptance; no permission escalation |

All 225 elements still need applicable handler-level semantics and rendered-state
acceptance. Existing current-image browser evidence proves only its documented
21-stage scope; it must not be projected across the whole inventory. Original
phase073 remains Partial until the full action-to-API/data/error review is closed.

## Verification account-failure semantics — current bounded review

Source review found cached auth.me data could still authorize visible workspace
and resend controls after a failed background account refresh. The current
VerifyEmail page now requires successful available account state for those
controls, suppresses cached verification claims and unusable resend guidance,
and offers an explicit bounded query retry. Public token confirmation is separate.

| UI action                     | Handler / endpoint                         | Data and error boundary                                                                                                                               |
| ----------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check account again           | account.refetch / auth.me                  | Read-only current identity check; disabled during fetch; failure keeps account actions paused                                                         |
| Confirm email link            | verify.mutate / auth.verifyEmail           | Explicit token submission; current-attempt result bound to token; public redemption/admission and one-use server checks unchanged                     |
| Request new verification link | resend.mutate / auth.sendVerificationEmail | Requires available current account in UI; protected server boundary; configuration/budget/provider acknowledgement required, error is not success     |
| Open workspace after success  | local /outreach link                       | Only available same-email/current account; failed query falls back to sign-in for a confirmed link; destination authorization remains server-enforced |

Four new static-render regressions, current19verification/recovery cases and
four simulated-response browser stages passed. Keyboard retry, cached background
failure, unavailable-mail refusal and Dutch/mobile public-link separation were
rendered. This is not actual mailbox/provider/customer acceptance or a full
account lifecycle audit. [Proof and boundaries](VERIFICATION_ACCOUNT_FAILURE_2026-10-02.md).

## Current supported route/action map — October 2, 2026

The supported App.tsx route graph is home, login/registration, verification,
forgot/reset password, onboarding, outreach, administrator security and not-found;
/dashboard redirects to /outreach. Retained legacy pages are not supported routes.
[Current API inventory](API_SURFACE_INVENTORY_2026-10-20.json) links every declared
endpoint and direct hook/simple imperative reference to source/line/digests.
It finds 54 client references in the App import graph and no graph references to
default-denied operations. This is structural source mapping, not full usability,
authorization, keyboard, asynchronous race or all-state/browser acceptance.

| Supported action/surface                               | Endpoint or local effect                                            | Persisted/external effect and failure boundary                                                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home navigation, language selection, sign out          | Local routes/browser preference; auth.logout                        | Language is browser-local; logout revokes session, no provider logout claim                                                                                                    |
| Sign in/register                                       | auth.login / auth.register                                          | Local password/session/account; registration feature gate and durable attempt limits; unverified users cannot use workspace                                                    |
| Check account state                                    | auth.me                                                             | Public query returns the current account or no account, not another user's private record; failed checks pause guarded workspace actions                                       |
| Request/check email verification                       | auth.sendVerificationEmail / auth.me                                | Durable bounded mail queue; inbox delivery not established by local tests                                                                                                      |
| Redeem verification link                               | auth.verifyEmail                                                    | Bounded token redemption binds the current email and consumes token; invalid/stale links refuse                                                                                |
| Request/redeem password recovery                       | auth.requestPasswordReset / auth.resetPassword                      | Non-enumerating request, bounded token redemption/current password update and session invalidation; real mailbox unresolved                                                    |
| Read/save profile setup                                | profile.get / profile.create                                        | Owner-scoped persisted canonical profile; setup save is not matching/outreach consent                                                                                          |
| Workspace safety/provider status                       | criticalPath.status                                                 | Reports assisted/disconnected state; no provider account connection or delivery guarantee                                                                                      |
| Search/filter/order/page candidates                    | criticalPath.prospects.list                                         | Bounded owner query; literal search/status/order/paging controls, no candidate mutation                                                                                        |
| Review/add individual candidate                        | criticalPath.prospects.previewIntake / add                          | Explicit direct-from-person evidence reference, source admission and duplicate review; durable idempotent commit/ownership checks                                              |
| Import reviewed CSV                                    | criticalPath.prospects.importCsv                                    | 512 KiB / 1000 data rows, bounded fields; direct-data declaration/source admission/owner/idempotency; no scraped platform profile intake                                       |
| Inspect/correct candidate                              | criticalPath.prospects.details / edit                               | Revisioned owner record, evidence retained; stale account/revision and source admission refuse                                                                                 |
| Archive/restore/opt out                                | criticalPath.prospects.archive / restore / optOut                   | Explicit reviewed owner transitions, preserved history/suppression; no remote deletion or contact                                                                              |
| Qualify candidate                                      | criticalPath.qualify                                                | Deterministic bounded compatibility with owned profile; score is not a verified partnership outcome                                                                            |
| Compose/review draft                                   | criticalPath.outreach.draft / details / list                        | Human-original/reviewed individual content; opt-out/source admission guard, original/revised versions preserved                                                                |
| Submit/approve/cancel/revise                           | criticalPath.outreach.submitReview / approve / cancel / revise      | Owner state/audit/revision; editing invalidates approval, cancellation is not retracting external contact                                                                      |
| Prepare/confirm manual action                          | criticalPath.outreach.prepareManualSend / confirmSent               | Pause/rate/source/owner guards; preparation produces assistance, confirmation is the user's declaration, never provider delivery                                               |
| Review conversation response/reminder/closure          | criticalPath.outreach.conversation                                  | Revision/idempotency/account-reviewed command; metadata/history persists, no notifications/messages; reminders do not reapprove sending                                        |
| View follow-up queue                                   | criticalPath.outreach.reminders                                     | Bounded owner query; opening a record is local navigation, not follow-up delivery                                                                                              |
| View analytics                                         | criticalPath.analytics                                              | Owner aggregates of retained records/user confirmations; not independently verified provider conversion                                                                        |
| Record partnership progress                            | criticalPath.progress.list / record                                 | Reviewed owner milestone history; not legal agreement, due diligence or successful cofounder certification                                                                     |
| Private defaults editing/application                   | criticalPath.presets.read / save; local template/filter application | Explicit revisioned save; local application does not create/approve/send draft or overwrite consent                                                                            |
| Candidate CSV export                                   | criticalPath.prospects.exportCsv                                    | Owner-bound bounded serialized CSV with formula protection; local browser download, not CRM connection                                                                         |
| Private account JSON export                            | accountData.export                                                  | Current password/explicit review/owner admission, 20 MiB / 100000 records; no partial oversized download, excludes documented secrets/categories                               |
| Deletion request/status/withdrawal                     | accountData.deletionStatus / requestDeletion / withdrawDeletion     | Password-confirmed owner request/withdrawal and operator review; feature flag can disable new intake; not immediate erasure/stop-account/mail                                  |
| Catalogue search/category/source evidence              | criticalPath.platforms plus local filtering                         | 60 discovery records, read-only links; no harvesting/account connection/provider permission, unknowns and external prices labelled                                             |
| Administrator passkey status/enrolment/step-up/removal | auth.adminMfa.*                                                     | Live administrator identity plus account/current-password/operator-grant/ceremony checks as applicable; browser WebAuthn and durable step-up; no role-grant/lost-factor bypass |
| Not-found and loading/error states                     | Local route/React state                                             | Meaningful loading/fixed error guidance; no fabricated successful backend result                                                                                               |

Source references for each endpoint consumer are in the API inventory rather than
duplicated line numbers here. Data-effect summaries need handler-level evidence;
static route/hook discovery does not prove every listed invariant. Existing
connected current-image receipts cover specific catalogue, candidate, draft,
conversation and export states, not every row in this table. Admin passkey/mail/
hosting/legal/provider acceptance remain separate open requirements.

API-only admitted methods are explicit in API_USAGE_AUDIT.md, including older
conversation methods not used by the current UI. Operator recovery/deletion/
enrollment/tunnel commands, server workers and HAI are not customer UI controls.

## Private defaults: current reachable controls

| Action                            | Backend/database effect                                                    | Safety behavior                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stage template add/update/removal | Local pending settings only                                                | Human-original declaration resets on text edits; removal is not stored yet                                                                       |
| Save private defaults             | One owner revisioned document and metadata-only receipt                    | Current verified owner/credential/fence, strict bounded validation, revision conflict and shared audit capacity; exact retry is not another save |
| Reload saved defaults             | Owner query; replaces editor state only after confirmed successful refresh | Explicit discard warning, including same-revision reload; failed refresh retains edits and pauses save                                           |
| Apply search defaults             | Updates candidate search/view and resets page locally                      | Explicit click only, no candidate mutations                                                                                                      |
| Insert preferred/chosen template  | Fills an empty composer locally                                            | Never overwrites text, saves/approves a draft or transfers permission; clears fresh message review                                               |

Connected synthetic browser QA exercises persisted save/reload, explicit filter
and template application, fresh review reset and reviewed removal on desktop and
mobile. These controls do not qualify provider delivery, hosting or legal policy.

## Historical core action inventory

| Action                          | Backend/database effect                  | Safety behavior                                                             |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Register/sign in                | Local user plus signed session           | Password never returned; cookie HTTP-only                                   |
| Import CSV                      | Owner-scoped prospects and replay record | Current limit is 512 KiB / 1000 data rows; reviewed direct-data declaration |
| Qualify                         | Owner-scoped match                       | Deterministic, explainable score                                            |
| Draft                           | Outreach row                             | Blocks opt-out; template mode disclosed                                     |
| Submit/approve                  | State transition and audit event         | Invalid transitions rejected                                                |
| Prepare manual send             | State transition only                    | Pause switch and per-user daily rate limit                                  |
| Confirm sent                    | Timestamp/reference and audit            | Requires literal confirmation; no provider claim                            |
| Record response/follow-up/close | State transition and audit               | Owner-scoped                                                                |
| Export                          | In-memory owner CSV                      | Escapes spreadsheet formula prefixes                                        |

The supported current UI does not expose autonomous platform sending/scraping or
claim connected provider success. This is not a statement that every retained
legacy/demo file has been removed or that enabling unsafe legacy routes is safe.
