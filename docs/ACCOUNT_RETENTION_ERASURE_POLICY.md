# Account retention and erasure: operator decision draft

Version: `retention-erasure-draft-2026-10-01`. Status: **unapproved**.
Audience: service owner, privacy reviewer, operators and implementation developers.
This is a proposed operating policy, not legal advice, a published privacy notice,
approval to delete live data or proof of worldwide compliance.

## Owner decision handoff — source review October 2, 2026

The current operator command still supports only inspection and reviewed suspension;
its success receipt explicitly says `dataErased: false`. Preflight still reports
`deletionAuthorized: false` and lists atomic erasure/receipt and external/backup
review as remaining gates. These were inspected in current source, not inferred
from the UI, historical tests or a live customer record. No erasure was executed.

Required owner response before approving retention rules or preparing a truthful
public launch notice:

| Decision                       | Owner-provided value                                                                   | Why it is needed                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Operating controller           | Legal entity or individual operating this service, and establishment/country           | Determine responsibility; do not substitute the repository owner or project name     |
| Privacy and support contact    | Actual monitored contact and person responsible after suspension                       | A fenced user cannot use normal self-service tools; support must remain available    |
| Policy decision owner/reviewer | Person responsible for reviewing this draft and applicable obligations                 | Proposed durations and financial/incident exceptions must not become silent defaults |
| Category decisions             | Accept/revise the direction and identify unresolved periods/exceptions in sections 3–4 | Local execution must follow explicit scope rather than a blanket user-row cascade    |
| Backup/store decisions         | Actual intended stores, rollback horizon and independent suppression evidence location | A local erasure must not be undone by later promotion of an older backup             |

All values remain unresolved here. The EUR100/month ceiling is a planning constraint,
not provider selection, policy approval or spending authority. The owner may supply
the first three values now and leave category/store decisions to the designated
reviewer. That does not enable cleanup or authorize any particular live deletion.
Implementation can continue in isolated synthetic fixtures while activation stays
disabled; do not describe request intake or suspension as a complete rights workflow.

## Decision in plain language

Keep personal information only for a documented purpose. When a justified deletion
request is approved, remove the account's ordinary operational data, stop further
use and track any narrowly justified exceptions separately. Do not promise that a
database deletion also removes provider copies or backups. A free beta does not
make financial or incident evidence disposable.

Recommended direction: approve category-specific minimization and restricted
exceptions, not blanket retention of the whole workspace. The numerical targets
below are **proposals**, not current runtime settings or statutory deadlines.
No cleanup is enabled by this document. Until decisions and implementation are
accepted, use the existing request/inspection workflow and review-held processing;
do not execute final erasure or claim it is available.

Accepting this policy records the intended rules; enabling the feature requires
release acceptance; deleting a particular account requires separate scoped
authorization. These are three separate decisions.

### Plain-language terms

- **Controller:** the entity deciding why and how personal information is used.
- **Processor:** a provider handling personal information on a controller's behalf.
- **Suppression evidence:** minimal records of approved erasures/restrictions used
  to prevent restored copies from bringing that information back into use.
- **Work fence:** a stored restriction that stops supported account changes.
- **Mail lease:** a temporary reservation while a worker handles a queued email.
- **HMAC quota key:** a keyed digest used to limit requests; it may still be linkable
  to a person and is not automatically anonymous.
- **Foreign key:** a database rule linking one record to another; removal must
  respect those links and ownership.
- **Retry-safe:** repeating the same operation does not duplicate its effects;
  changed or inconsistent repeat requests need review.
- **Backup promotion:** allowing a restored database to serve ordinary users.
- **Rollback horizon:** how far back a restore can take stored information.
- **Binlog:** database change history that may contain personal information.

## 1. Decisions required before activation

The owner and qualified privacy reviewer must record:

1. Controller legal entity, establishment, contact and responsible privacy/support
   roles; controller/processor responsibilities for customers' candidate data.
2. Applicable jurisdictions, purposes and lawful bases, and which countries can
   actually be supported. Worldwide availability is a product objective, not an
   assessed global legal conclusion. Age/children's-data requirements also need review.
3. Retention purpose, trigger, duration, permitted fields and reviewer for each
   category below. Financial obligations depend on the actual entity and records.
4. Processor/subprocessor locations, contracts, deletion arrangements and transfer
   safeguards. List only providers actually configured or holding data; a catalogue
   link or disabled adapter is not proof of a data transfer.
5. Support/rights-request contacts, identity checks, escalation, response monitoring
   and exceptional-case decisions. Suspension must not eliminate access to support.
6. Backup expiry, restore-time suppression, restricted hold storage and minimal
   receipts; operational costs must fit Robert's EUR 100/month planning ceiling.

Approval must identify this version, decision owner, date, source/basis for each
exception and any changed targets. A copied reference string is not authentication.
Material policy changes need a new version and implementation/test review. A
reviewer's unexplained `retain everything` decision is not an executable policy.

### Legal constraints checked, not assumed applicability

Where GDPR applies, Articles 5, 12, 17 and 19 address storage limitation,
rights-request handling, erasure grounds/exceptions and recipient communication.
Article 12 generally requires a response within one month; a qualifying extension
requires timely explanation. Erasure is not absolute, but an exception must be
scoped and justified. These rules do not prescribe the draft's 30/90/365-day
targets. [GDPR, official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).

If Dutch tax-retention obligations apply, the Belastingdienst describes seven-year
administration retention and ten-year cases, including relevant real-estate and
One Stop Shop records. Its start-date rules matter; do not set every invoice's
expiry to account closure plus seven years. Applicability and record scope need
the entity's reviewer. [Belastingdienst guidance](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/administratie_bewaren/administratie_bewaren).

## 2. Current implementation versus proposed retention

Verified from current source, not live configuration:

- Account suspension revokes sessions and verification/recovery links. It does
  not erase workspace data or stop an already submitted provider action.
- Optional account-mail cleanup uses batches of 100, protects live leases and
  clears expired payloads. Payload-free terminal rows become eligible when their
  job expiry is more than seven days old, not seven days after account closure.
  Actual removal depends on enabling/running cleanup and backlog. Fixed dispatch
  budget keys are preserved; expired request-admission HMAC keys have separate handling.
- Authenticated HAI feed attempts share `loginAttemptQuotas` with independent
  purpose-keyed source/owner counters and a stable service row. Their admission
  window is 60 seconds using database time; any admission family opportunistically
  removes at most 100 expired identity counters per successful transaction, never
  the stable service rows. A denied transaction rolls cleanup back. Expiry is not
  immediate deletion, digests are pseudonymous, and source checks do not establish
  an operator-approved retention schedule or deletion of receiver-held copies.
- Candidate archive and unsent-draft cancellation preserve records; neither is
  erasure. Export deliberately omits secrets and some fields; export exclusions
  are not permission to keep those fields forever.
- The encrypted backup tool has no configured remote retention schedule or
  deletion-suppression promotion gate. No general workspace/audit retention worker
  or final erasure executor has been accepted.

Private reusable templates/search defaults are bounded owner-held operational
data in `workspacePresets`, included in private export and deletion preflight.
The live verified-account fence stops reads and changes during processing
suspension. Removing a template clears it from the current saved document;
this does not attest to removal of exports, backups or browser-held copies.
No general preset expiry or final account erasure executor is approved here.

Current references: [mail cleanup](../apps/cofounder-discovery/server/account-mail-retention.ts),
[processing runbook](ACCOUNT_DELETION_PROCESSING_RUNBOOK.md),
[ownership preflight](../apps/cofounder-discovery/server/account-deletion-preflight.ts),
[export inventory](../apps/cofounder-discovery/server/account-export-inventory.ts),
[backup/restore runbook](DATABASE_RECOVERY.md).

## 3. Complete current database classification

The reviewed manifest has **43 application tables**: 38 owned categories and five
shared categories. Names below are schema export keys, not SQL table names. Each
appears once. This classification covers current table presence, not every field's
legal basis; opaque JSON, legacy rows, foreign references and external stores still
need inspection. Any new table/column/reference requires renewed review.

| Class                            | Every current schema key in this class                                                                                                                                                                                                                                                                                                                                                                                                    | Proposed erasure treatment                                                                                                                                                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and security (5)        | `users`, `adminMfaState`, `adminPasskeys`, `accountSessions`, `platformCredentials`                                                                                                                                                                                                                                                                                                                                                       | Revoke access first. Erase identity/credential material after approved local execution and dependency resolution. Separately retained exception records must not require an active login or retained whole user row. Provider-side revocation is a distinct action.                                     |
| Workspace and orchestration (24) | `workspacePresets`, `userProfiles`, `userPreferences`, `savedSearches`, `prospects`, `prospectNotes`, `prospectTasks`, `matches`, `leadScores`, `stageTransitions`, `responsePatterns`, `outreachRecords`, `conversations`, `messages`, `conversationAnalytics`, `conversationStartersHistory`, `partnershipOutcomes`, `pipelineStages`, `successMetrics`, `timelineEvents`, `approvalQueue`, `automationJobs`, `campaigns`, `guardrails` | Erase approved owned rows in reviewed dependency order. Parent-owned child rows need joins; recipient numeric equality is not ownership. Remove derived scores/analytics as well as source text. No default whole-workspace exception.                                                                  |
| Account operation records (3)    | `accountDeletionRequests`, `accountExportQuotas`, `idempotencyRecords`                                                                                                                                                                                                                                                                                                                                                                    | Remove account-bound rows/payloads in local erasure after minimal necessary receipt and restore-suppression evidence is durably committed. A replay cache is not a permanent history archive.                                                                                                           |
| Audit and AI evidence (2)        | `auditEvents`, `aiActivityLog`                                                                                                                                                                                                                                                                                                                                                                                                            | Inspect fields/payloads. Erase ordinary personal content; retain only a reviewer-approved minimized exception outside active workspace, with purpose, access limits and expiry. Current user foreign keys must be resolved, not bypassed.                                                               |
| Account mail (1)                 | `accountMailJobs`                                                                                                                                                                                                                                                                                                                                                                                                                         | Attribute account- and email-scoped encrypted jobs before identity removal; drain/reconcile claims and external outcomes. Clear relevant payload/metadata only under the approved transaction/retention process. Missing keys or attribution are explicit blockers, not excuses to drop unrelated jobs. |
| Financial records (3)            | `billingPeriods`, `invoices`, `resourceUsage`                                                                                                                                                                                                                                                                                                                                                                                             | Review even zero-cost/legacy rows. Keep only records/fields demonstrably required by an applicable obligation or specific claim; restrict and expire them. No automatic financial wipe and no blanket workspace retention.                                                                              |
| Shared service state (5)         | `accountMailQuotas`, `loginAttemptQuotas`, `capacityLocks`, `mlModelVersions`, `usagePricing`                                                                                                                                                                                                                                                                                                                                             | Do not remove global state for one customer. Pseudonymous quota keys and model/JSON lineage require separate review; shared is not synonymous with anonymous. Do not reset active abuse/dispatch allowances during deletion or restore.                                                                 |

Source: [reviewed manifest](../apps/cofounder-discovery/server/account-deletion-schema.json)
and independent deletion ownership mapping. Do not substitute the downloadable
export allowlist or add blanket cascading deletes/disable foreign-key checks.

Matching recipient and account identification numbers alone do not establish whose
records may be deleted. Account-related identifiers inside shared state need scoped
treatment after review, while service-wide limits and active abuse controls remain
intact.

## 4. Proposed operational targets for approval

| Record/store                         | Proposed target and clock                                                                                          | Required decision/implementation                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active workspace                     | Keep while providing the explicitly documented service; erase following approved request without unnecessary delay | No inactivity purge is approved. Define any future inactivity trigger, notice and review separately. Preserve third-party rights and account ownership.                                                                |
| Ordinary security/operational events | Maximum 90 days from event for minimized security evidence; 30 days from creation for ordinary runtime logs        | Validate incident-detection needs and provider log settings. Never retain secrets/request bodies by default. These periods are proposals, not legal minimums or existing schedulers.                                   |
| Minimal final erasure receipt        | 365 days from finalized scope result                                                                               | Justify dispute/accountability need, minimize fields and implement expiry. Receipt must survive deletion of the user row without retaining the workspace. Longer incident/claim holds need their own reviewed expiry.  |
| Backup artifacts                     | Maximum 30 days from backup creation                                                                               | Confirm feasibility, provider snapshots/replicas, logs, old/manual exports and cost. A 30-day artifact age alone does not prove all copies expire. Untested restore suppression blocks promotion.                      |
| Restore-suppression evidence         | Through the last affected restorable copy's lifetime plus verified retirement/reconciliation                       | Review linkability and permitted fields. Do not delete this evidence on the 365-day receipt schedule while an older copy remains restorable. Do not turn suppression into a permanent ban on a new authorized account. |
| Financial or specific legal hold     | Applicable obligation/claim-specific trigger and duration, not a guessed default                                   | Reviewer supplies basis and field-level scope. Do not apply a generic seven-year rule to all categories. Reassess holds at defined review dates.                                                                       |
| Existing account-mail jobs           | Retain the currently implemented expiry/lease/terminal rules pending policy acceptance                             | There is no new retention duration activated by this draft. Provider logs/copies need a separate confirmed schedule.                                                                                                   |

Restricted exceptions need: exception ID, affected scope, purpose/basis, decision
owner, source/reference, allowed fields, clock/expiry, next review date, storage,
access list and eventual disposition. Missing duration or an expired hold means
escalate promptly, not silently retain forever or automatically destroy evidence.

For the proposed receipt clock, a local database commit creates local evidence but
does not start the final 365-day clock. Start that clock only when the overall
request is closed with every scope reconciled and any justified exceptions
recorded. Minimize interim evidence and review its need while work is pending;
an indefinitely pending scope is not permission for indefinite unreviewed retention.

## 5. Required execution and honest completion states

1. Record intake/identity and current request; monitor applicable response times.
   Reasonable identity checks must not collect unnecessary identity evidence.
   Existing request intake is not an erasure approval.
2. Review exact request and ownership/retention issues. Obtain separate scoped
   approval for erasure; processing suspension alone never supplies it.
3. Fence supported writes/revoke sessions. Reconcile mail leases, already submitted
   provider work and unsupported/legacy writers before destructive execution.
4. Produce a field/category-specific plan and narrowly justified exceptions.
   Resolve cross-owner/self-references, user-less mail and schema drift. An issue
   in one category does not justify indefinite retention of unrelated data; review
   safe partial handling, with explicit partial status rather than false completion.
5. Commit approved local erasure and durable minimal receipt/suppression together
   with a retry-safe operation identity. Never leave a successful user delete with
   its receipt cascaded away, or issue a receipt before an uncommitted deletion.
6. Reconcile processors, exports/caches and recipient obligations through authorized
   channels. An independent founder platform or a customer's downloaded export is
   not remotely deletable by this application. Record scope and responsibility.
7. Tell the account holder exactly what was erased, retained/restricted and still pending,
   with reasons and next review. Do not disclose another customer's records.

Required future result labels: `review_pending`, `processing_restricted`,
`local_erasure_complete`, `external_reconciliation_pending`,
`backup_expiry_pending`, `completed_with_justified_exceptions`, and
`blocked_requires_review`. These are **proposed states**, not current API enums.
Track these as scope/status labels, not an automatic sequence. Overall closure
requires accepted local-erasure evidence, external-scope reconciliation, affected
backup retirement and documented justified exceptions. A suspended account or
zero-row user query does not prove closure. Distinguish scope completion from
copies the service cannot control, and document unresolved information instead of
claiming it gone.

## 6. Backup restoration and external-store obligations

Keep backup artifacts access-restricted and out of ordinary use; apply an approved
expiry schedule. Restore only into an isolated, non-sending/non-public target.
Replay current approved erasures and restrictions before any promotion, using
suppression evidence held outside the restored backup's rollback horizon.
Verify no erased identities, credentials or queued messages can regain access or
dispatch. Restoring an older backup must not replenish live service quotas.

Do not claim account-specific cryptographic erasure by destroying a shared database
backup key: that affects other customers and may destroy required evidence.
Per-account key erasure needs an actual design and proof. Record whether local,
remote, provider snapshots, replicas, binlogs and operator-held copies are covered.

The actual store register must identify host/database, mail provider, logs/monitoring,
backup destination, any AI/HAI/provider integration, support attachments and operator
exports. For each: controller/processor responsibility, location, fields, purpose,
retention, contact/contract, deletion method, evidence and unresolved exceptions.
No current provider contract, deletion receipt or backup retirement is verified by
this draft. Do not contact providers or change their settings without authority.

Proposed evidence record: operation/request reference, exact affected scope,
authoritative source, outcome, time, evidence location, reviewer and unresolved
limitations. The authorized operator collects it; the service owner or designated
privacy reviewer validates whether it closes that scope. Provider evidence may be
an authoritative deletion acknowledgment or confirmed expiry under the actual
contract. Backup evidence must inventory affected copies and document their
retirement; a recorded isolated restore test must also prove erased data cannot
return to ordinary use. A sent request, configured expiry or successful backup
upload alone is not completion evidence. These are acceptance criteria, not
receipts already obtained.

## 7. Release acceptance and reader checklist

| Activation gate                   | Responsible role                                     | Required evidence                                                                           |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Policy and applicable obligations | Service owner with qualified privacy reviewer        | Accepted version, controller/roles, field-level rules, periods and scoped exceptions        |
| Local execution                   | Implementation maintainer and authorized operator    | Reviewed release, ownership/rollback/concurrency tests and durable local receipts           |
| External stores                   | Authorized operator with designated privacy reviewer | Actual store register, contracts and verified scope-specific reconciliation method          |
| Backups and restoration           | Backup operator and release owner                    | Copy inventory, accepted expiry, independent suppression evidence and isolated restore test |
| Customer support                  | Service owner/support lead                           | Verified post-suspension contact, response monitoring and accurate notices                  |
| Particular live operation         | Independently authorized operator                    | Current holder/request identity, exact scope and separate operation authorization           |

These roles must be assigned to actual people before activation; this draft does
not nominate reviewers, prove their authority or authorize provider changes.

Before activation, prove: all current schema fields classified; no foreign-owner
deletion; dependency/self-reference handling; user-less encrypted mail attribution;
missing-key refusal; concurrent withdrawal/login/export/worker fencing; audit and
erasure rollback; final receipt surviving identity removal; identical retry and
conflicting replay; partial/retained scopes reported accurately; actual external
evidence; isolated old-backup replay before promotion; quota preservation; expiry
of approved exceptions; authorized support and truthful customer notices.

Reader questions for review:

- Does approving this draft activate cleanup or authorize a live deletion? **No.**
- Can all financial data be deleted because the beta is free? **No.**
- Does suspension mean the data are gone? **No.**
- Does a shared table prove it contains no personal data? **No.**
- Are 30/90/365 days approved or required by law here? **No; proposed targets.**
- Can an old backup be promoted before replaying current erasures? **No under this proposal.**
- Is world-wide jurisdiction/provider compliance proven? **No.**
- Is this the public customer privacy notice? **No; publish only an accepted,
  accurate notice matching actual processing and implementation.**

The owner can accept/revise the proposed direction while leaving jurisdiction,
periods or specific exceptions for qualified review. Those unresolved choices
remain activation gates, not hidden defaults. No personal data was deleted or
retention setting changed while drafting this document.
