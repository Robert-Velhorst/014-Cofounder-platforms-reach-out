# Account recovery implementation design

This implements the account-security portion of [the full beta scope](PUBLIC_BETA_DELIVERY.md);
it does not replace the remaining customer, platform, operational or privacy work.

## Contracts

- `auth.requestPasswordReset({ email })` validates and normalizes the address,
  then commits a request without looking up the account or contacting a provider.
  Known, unknown and throttled addresses receive the same success/message shape.
  Configuration and storage failures return sanitized errors, never false delivery.
- Request admission is transactional in MySQL: at most 200 requests per service
  day, 10 per IP per hour and 3 per address per hour. Counters survive reconnects
  and restarts. A global lock serializes admission for the initial small beta.
  These are recovery ceilings, not a complete application spending cap.
- Pending jobs contain authenticated-encrypted payloads using an independent
  `AUTH_MAIL_ENCRYPTION_SECRET` (32+ characters). Request-admission quota keys are
  HMACs, not raw addresses or IPs. Completed/expired payloads are cleared; old
  request-quota/terminal-job retention is opt-in through the independent cleanup
  worker. Key rotation requires
  draining or explicitly expiring pending jobs.
- Delivery also reserves the shared verification/recovery/change-notice daily and
  monthly budget in the token/claim transaction. Exhaustion preserves queued
  payloads/tokens/attempts; expiry still discards the job. Fixed dispatch keys are
  separate from HMAC request-admission keys and must never be removed by retention
  cleanup or secret rotation. See the authoritative [dispatch budget contract](../README_REFERENCE.md#account-mail-dispatch-budget).
- A worker resolves the account only after request acknowledgement, creates a
  32-byte random reset token, stores its SHA-256 digest on the account and keeps
  the encrypted outbound message for bounded retries. A claimed job has a lease;
  another worker cannot deliver it concurrently while that lease remains valid.
- Retries retain the exact message and Resend idempotency key, stay inside the
  provider's 24-hour idempotency period and never count a missing acknowledgement
  as accepted. Acceptance by the provider is not proof of inbox delivery.
- The reset screen consumes a URL fragment, removes it from browser history,
  asks for the password twice and submits only after explicit user action.
  Success leads to normal sign-in, not automatic authentication. Existing
  sessions are revoked by the same transaction that changes the password.
- Password-change notification must be enqueued in the password-change
  transaction. A failed transaction must change neither password nor queue.

## Execution checklist

- [x] Reset redemption core, replay/expiry/isolation/rollback tests.
- [x] Request admission: failing route and MySQL tests, additive queue/quota
  migration, implementation, then concurrency/reconnect and admission tests.
- [x] Worker: failing lifecycle tests, claim/lease/expiry/retry implementation,
  synthetic transport tests, restart and duplicate-delivery tests.
- [x] Change notification: transaction and rollback tests, then implementation.
- [x] Shared durable dispatch budget; concurrent-process, failure rollback,
  queue deferral and verification-expiry timezone regression tests.
- [x] Opt-in bounded retention for expired request-quota rows and old terminal job
  metadata, preserving fixed dispatch counters and active delivery leases.
- [x] Graceful process shutdown that drains the worker before closing storage.
- [ ] Browser screens: request and confirmation forms, error and success states,
  production browser journey using synthetic transport only.
- [ ] Full unit/integration/type/build checks and independent review.
- [ ] Operator-owned real mail configuration and inbox acceptance before release.

No credentials, provider calls, purchases or public deployment are authorized by
this design. Keep unfinished stages visible in the delivery ledger.

Current checkpoint: all 18 queue integration cases and seven reset integration
cases pass in the isolated MySQL run. Notification delivery and exact-message
retries use synthetic transport and real MySQL. The serial background pump has lifecycle
tests; real server startup now processes a queued notice with synthetic transport
when `ENABLE_ACCOUNT_MAIL_WORKER=true`. The setting defaults to false and fails
configuration validation if required mail/storage settings are absent. Operator
retention-policy/backup acceptance, combined browser-to-database acceptance and real inbox
delivery remain release work. The contracts above are requirements, not a claim
that every item is implemented.

Shutdown checkpoint (2026-09-06): 11 focused tests cover resource ordering,
disconnected-client work, admission fencing at each API access level, bounded
failure, repeated shutdown, SIGTERM/SIGINT wiring and a real development HMR
connection. Windows signal tests emit the process event through a test-only IPC
fixture; the isolated Linux held-mail test uses an actual SIGTERM. The held
acknowledgement is persisted before successful server exit. The controller waits
for all drain operations, including an asynchronously failing HMR close, before
reporting failure. Independent source review findings were corrected. Production
container acceptance is tracked separately in the delivery ledger.

Production-bundle browser UI checks with simulated API success/error responses
passed for keyboard submission, mobile layout, password mismatch, success,
fragment/storage handling, duplicate pending submissions, a newer link during an
old in-flight response, and reload after the fragment was removed. This does not
replace the combined journey or operator-owned inbox acceptance above.

Sources checked 2026-09-05:
[OWASP recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
