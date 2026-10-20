# Reviewed single-account re-verification

Status: locally implemented and fixture-tested operator preparation, **not an
approved real-account operation or live mailbox acceptance**. This command is
private and has no HTTP route. It does not classify legacy accounts, send mail,
delete workspace data, establish identity or authorize a bulk reset.

The [detailed reference](../README_REFERENCE.md#separately-reviewed-requirement-to-verify-again) describes
the command contract; [delivery ledger](PUBLIC_BETA_DELIVERY.md) records actual
verification and unresolved release gates. Source authority is
`server/account-reverification.ts`; compiled entry is
`dist/require-account-reverification.js` in the application runtime.

## Preconditions: do not infer approval from an evidence gap

- Independently establish operator authority and obtain explicit approval for the
  exact account. Review original release records and account history. Missing or
  version-one redemption evidence does not prove an earlier flag was illegitimate.
- Establish the exact account ID and canonical email from authorized private
  records. The command does not disclose an address to help guess a target.
- Confirm a reachable inbox and already approved, working verification delivery
  and recovery. Configuration presence alone is not live proof. Any real provider
  test, message or account mutation needs separate authority; this runbook grants none.
- Plan customer notification/support separately. No notice is sent by this command.
  For administrators, explicitly plan loss of admin access, continuity of the last
  administrator, working login/email recovery and retained-passkey use afterward.
- Have reviewed backup/recovery and an appropriate retention policy. Do not restore
  a guessed verified flag to undo the operation; restoration requires fresh reviewed
  authority and must not fabricate email-token evidence.

## Maintenance boundary

Public verification-link redemption has separate shared admission: ten attempts
per trusted source IP and exact case-sensitive link, plus 200 service-wide per
15-minute fixed window. Admission commits before token lookup. Failed later
redemption does not refund it; refusal does not consume the link or change the
verified flag. Quota storage/secret failure gives a safe unavailable response.
These ceilings do not replace the maintenance boundary below or prove inbox
delivery. Configure replicas with the same signing secret; rotation resets
effective identity windows but not the stable global ceiling. Avoid automatically
replaying denied links; operator/client retry and shared-IP impact require pilot
acceptance.

For an approved operational application, drain and stop all application replicas
and relevant workers before inspection/application, using the actual deployment's
approved runbook. Confirm termination from live runtime state, not a saved PID or
assumption. Confirm unsupported legacy/provider automation is disabled or separately
controlled. Do not execute shared-host/service changes merely to practice this guide.

Supported workspace mutations recheck the stored verified flag under the owner
lock. This prevents them writing while the flag is unverified, including a request
waiting behind the account lock. It does **not** undo earlier commits, cancel reads
already in progress, drain claimed provider work, or attach a revocation generation
to old request contexts. After a later valid verification restores the flag, an
undrained old context is not fenced by this flag check alone. The maintenance/drain
step remains required; session deletion is not proof that every old request ended.

## Exact check, then separately authorized apply

1. Use a private operator host/runtime with the actual database secret-file
   configuration. Do not put passwords or connection strings on the command line.
   The expected email is private personal data and can appear in argument history,
   process listings or recordings; control access to these surfaces.
2. Inspect evidence without mutation if needed:
   `node dist/inspect-email-verification.js --read-only --account-id ACCOUNT_ID`.
   This gives neither reset authority nor mailbox/identity proof.
3. Run the re-verification review for exactly that approved target:
   `node dist/require-account-reverification.js --check --account-id ACCOUNT_ID --expected-email CANONICAL_EMAIL`.
   Replace capitalized placeholders with independently reviewed values; do not run
   this example literally. Record the returned eligibility, role, timestamp,
   expiry and opaque review digest privately. A count includes all stored session
   records, not only unexpired ones. `eligible: false` is a stop condition.
4. Prepare a fresh operation UUID and the approved operator/approval references.
   Within the ten-minute review window, apply only after the separate approval
   and readiness review. Required arguments:

   - `--apply --account-id ACCOUNT_ID --expected-email CANONICAL_EMAIL`
   - `--operation-id OPERATION_UUID --review-digest EXACT_REVIEW_DIGEST`
   - `--reviewed-at EXACT_REVIEW_TIMESTAMP`
   - `--operator-ref OPERATOR_REF --approval-ref APPROVAL_REF`
   - `--confirm-require-verification --confirm-mail-recovery-ready`
   - For an administrator only, also `--confirm-admin-access-loss`.

   These are acknowledgements of independent review, not automatic proof of
   provider readiness, controller policy or authorization. Do not use CI, loops
   over accounts or a guessed approval reference. Changed account/session/audit
   state or an expired review requires new inspection and renewed approval review.

5. Keep the exact operation UUID, arguments and result for reconciliation. The
   transaction clears verification/reset links and address binding, clears the
   verified flag, deletes existing account sessions and writes one approval
   receipt. Account credentials, passkeys, candidates, drafts and workspace
   history are retained. No provider account is disconnected and no mail is sent.

## Failure, retry and acceptance

- Nonzero exit or `outcomeMayBeUncertain: true` is not proof that nothing committed.
  Keep services drained; reconcile using the **same** operation UUID and exact
  approved arguments. Do not generate a new reset operation to resolve uncertainty.
- Exact committed-operation retry returns `alreadyApplied: true` with the current
  verified flag. It does not reset a later successful verification. The current flag
  can therefore be true on a historical receipt retry; that is not a new reset.
  Changed approval references on a used operation are refused.
- Audit failure rolls back the security-state/session changes. A generic storage
  failure does not disclose private database details or establish a safe restart.
- After reconciliation and approved restart, the customer must make a new login
  and request a fresh verification link through the supported flow. Older links
  and sessions are revoked. Verify delivery, address binding, one-use redemption
  and restored workspace access on the exact approved account. An administrator
  additionally needs a new session and fresh passkey step-up; retained passkeys
  do not bypass email verification.
- Confirm preserved workspace data and operational health without publishing
  private contents. Record the actual live outcome and any failure. Do not call
  synthetic command/API tests a completed customer remediation or inbox test.

Approved target selection, real application, hosted drain/restart and live inbox
acceptance remain outstanding. This procedure is not permission to perform them.
