# Reviewed account-deletion processing preparation

Status: locally implemented and tested; not a live-approved erasure workflow.
The command suspends an account for processing. It does **not** erase data,
approve financial/audit retention, stop an already submitted provider action,
drain mail leases, remove backups or restore access. No public suspension API is
introduced. This phase must not be described as completed account deletion.

## Authority and exact request review

Use only an independently authorized operator host/database session and the
reviewed release. Operator and approval references are bounded audit labels, not
authentication or enforced two-person approval. Keep credentials out of arguments,
terminal recording and output. Account IDs, request keys and reports are private
operator information; do not publish them.

List pending requests using the existing `account:deletion:requests` diagnostic.
Verify the account holder's current request, its UUID/revision and authorization
to suspend processing. Review the ownership/mail preflight and retention/external
exceptions. Explain that suspension signs out all browsers, prevents normal work
and prevents self-service withdrawal/status while fenced. Coordinate a verified
support channel before execution; the application does not automatically notify
the holder or provide a post-suspension status portal.

Suspension must not be used to punish users, bypass a withdrawal, or imply an
unapproved erasure commitment. Unresolved retention/ownership/provider issues
remain blockers for erasure even after new work has been stopped. The actual
operator identity, support and retention policies still require acceptance.

Use the [retention and erasure decision draft](ACCOUNT_RETENTION_ERASURE_POLICY.md)
to record category-specific decisions and unresolved obligations. Its targets are
unapproved proposals, not active cleanup settings or authorization to erase. Policy
acceptance, tested implementation and authority for a specific live operation are
separate gates.

## Read-only check

Configure the existing private database connection through the operator's secret
management. These arguments are synthetic placeholders, not an actual account.

```sh
node dist/process-account-deletion.js --check \
  --account-id 42 --expected-email user@example.invalid \
  --request-key 2199da0b-a175-4325-8f14-c13575672c01 --expected-revision 1
```

This checks the exact target and pending request and returns the existing bounded
read-only ownership/dependency/mail diagnostic. It does not save an approval or
reserve the request. The reviewed schema manifest is embedded in the compiled
artifact and compared with live metadata; schema drift fails inspection. A
snapshot is not permission to erase and may become stale immediately.

## Confirmed processing suspension

```sh
node dist/process-account-deletion.js --suspend \
  --account-id 42 --expected-email user@example.invalid \
  --request-key 2199da0b-a175-4325-8f14-c13575672c01 --expected-revision 1 \
  --operator-ref operator-42 --approval-ref deletion-review-42 \
  --confirm-suspend-account
```

The owner-first transaction verifies the current credential version, verified
account, exact email and still-pending request UUID/revision. A withdrawn or
changed request is rejected. It saves a processing audit receipt, establishes the
durable work fence, clears recovery/verification links and revokes all sessions in
one transaction. Audit/storage failure rolls back. Candidate, profile, message,
financial and other retained records are not erased; request status remains
`pending_review`, with the operator queue showing the account fence.

Identical reviewed retries return the same fence timestamp and `alreadyStarted`
without duplicate receipts. Conflicting approval references, duplicate/inconsistent
receipts or an unrelated existing fence require operator reconciliation. A stale
review is not automatically refreshed. An unchanged check does not authenticate
the operator or override an erasure exception.

## After suspension and uncertain outcomes

Supported HAI feed reads now refuse a missing, unverified or deletion-fenced
configured owner, even with a valid connector token. Their first owner share lock
coordinates with the suspension update. This does not drain already authorized
responses, remove receiver copies, rotate connector credentials or fence unsupported
legacy/provider automation. Reconcile any receiver-held data separately.

Record the token-free receipt and request ID in the private processing record.
Inspect pending/claimed mail and provider outcomes; a fence does not cancel a
request already submitted outside a transaction. Do not delete leased mail rows
or reset shared service quotas. Coordinate existing work and preserve evidence.
Re-run the ownership/schema preflight before any later erasure operation.

If the command fails after processing was attempted, the outcome may be uncertain.
Inspect the current fence/request and audit receipt using authorized private
access before deciding to repeat the exact operation. The command never prints
database errors, email, passwords or SQL values. Do not alter rows to force
eligibility. There is no automatic resumption command; restoring access requires
a separately reviewed policy and implementation.

Actual erasure still needs approved retention exceptions, dependency-safe atomic
local erasure and retry-safe final receipt, attributed encrypted mail handling,
external-store/provider review and backup/restore suppression. Live operational,
customer-support and privacy/legal acceptance remain release gates. The free beta
does not justify silently discarding legacy invoices or audit evidence.

## Local evidence boundary

Synthetic MySQL tests exercise the exact processing primitive and compiled command,
current-request rejection, concurrent retries, rollback and preservation of retained
customer records. Existing fence tests cover supported session, recovery and
workspace writers. They do not establish independent operator authority, real
customer notification, provider cancellation, unsupported legacy writers or
completed erasure. No live account was suspended during implementation.

The 2026-10-01 connected Playwright checkpoint exercised real registration,
candidate intake, stored drafts and deletion-request controls against current
compiled application artifacts and current migrations on isolated disposable
MySQL. Email verification and operator/approval references were synthetic
fixtures, not independent operator authority or real inbox acceptance. The
customer submitted, withdrew and re-submitted using keyboard confirmation; the
new request had revision 3 and a new UUID. The compiled operator command rejected
the old review without fencing, checked the current request and suspended it.
Identical retry returned the same fence timestamp; storage inspection found one
processing receipt. Protected access and fresh login returned HTTP 401, with no
remaining sessions for the suspended account. Its candidate and draft remained
stored. A separately registered account still loaded its own candidate and did
not display the first account's candidate. Desktop 1365x1000 and mobile 375x812
screenshots were inspected; no horizontal overflow, framework overlay, browser
errors or external browser requests occurred in that bounded journey.

The first connected attempt reached the customer request but the operator child
lacked the required production `PUBLIC_ORIGIN`; a separate read-only diagnostic
confirmed the preflight could inspect the fixture. The harness was corrected.
A fresh database startup then briefly failed migration admission before TCP
readiness; the same runner was retried after readiness passed. Neither failure
was hidden as passing product evidence. This checkpoint does not validate actual
erasure, policy approval, external copies, backup suppression, real notification,
all browsers or hosted operation. Request intake was enabled only for the local
synthetic app; production activation remains separately gated.
