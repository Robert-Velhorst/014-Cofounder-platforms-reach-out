# Administrator MFA: implementation contract and current evidence

Status (2026-10-01): **API enforcement and browser workflow implemented; rollout incomplete**.
`adminProcedure` now checks a verified cookie and persistent, session-bound passkey
step-up, including `system.notifyOwner`. The durable ceremony and account-bound
API layers use the internal `server/admin-webauthn.ts` cryptographic boundary.
The browser screen has passed connected virtual-authenticator acceptance. The
initial-enrollment command and runbook are implemented locally. Operator identity
policy acceptance, live lost-factor recovery and real-device acceptance remain open.
Local reviewed recovery is implemented using the separate `--recovery-check` and
`--recover` modes; see the [recovery runbook](ADMIN_RECOVERY_RUNBOOK.md). Recovery
binds an exact current factor review and atomically revokes sessions, clears
ceremonies, removes keys, rotates the user handle and issues a ten-minute grant.
It preserves attempt quotas and requires new login, password, enrollment and
step-up. Operator references/digests do not authenticate the human operator.
Existing administrators are intentionally blocked from privileged
actions until approved enrollment and step-up can be completed.
Do not deploy publicly on the strength of this development increment.

## Intended operator experience

A verified administrator first signs in with their account password, then proves
possession of a registered passkey with authenticator user verification. A normal
password session remains usable for ordinary account functions but cannot perform
privileged actions. The intended step-up lifetime is five minutes, never longer
than the underlying session. Each new login starts without elevated privilege.

Use the browser's passkey/security-key prompt, not an imitation PIN or biometric
form. The app must never collect the device PIN, biometric data or private key.
Require a backup authenticator before production operator acceptance. Synced
passkeys are supported; this is not a hardware-only policy or device-attestation
claim. Passkeys do not protect a compromised endpoint or an already-stolen elevated
session. These are application administrator controls, not MFA for SSH, hosting,
GitHub, database administration or recovery scripts; those need operator controls.

## Implemented cryptographic boundary

- Exact dependency: `@simplewebauthn/server` 14.0.3, recorded with integrity hashes
  in the workspace lockfile. Node 26.12.0 is the current pinned container/CI runtime;
  the dated October 1 acceptance below retains its original runtime scope.
- Relying party and expected origin come only from configured `PUBLIC_ORIGIN`,
  never a request Host/forwarding header. HTTPS is required except explicit
  `http://localhost` development. Changing the production origin is a credential
  migration decision, not an automatic fallback to another RP.
- Registration requests mandatory user verification, preferred resident keys,
  none attestation and ES256/RS256 algorithms. Authentication always names
  enrolled credentials; an empty list fails rather than allowing account discovery.
- Generation is bounded to five credential IDs. Credential identifiers, binary
  response fields and user handles have explicit size/canonical-base64url checks.
  The storage layer also enforces the actual enrollment count under the owner lock.
- Verification requires the expected challenge, exact origin/RP, user presence,
  user verification, matching credential identity, matching supplied user handle
  and a valid assertion signature. Other-origin embedding is rejected in both
  ceremonies. Registration accepts only an empty none-attestation statement;
  certificate/metadata trust paths are not used and hardware provenance is not claimed.
- Verification errors are generic and do not echo response data, challenges,
  certificate contents or cryptographic exceptions. Only public-key material,
  credential ID, counter, transports and backup/device flags are returned for
  persistence. No private key is accepted or stored.
- Counterless authenticators are supported. **Signature verification is not replay
  prevention:** the same valid response can verify again against unchanged inputs.
  The implemented persistence layer makes challenges single-use and atomically
  updates counters. Do not expose these functions directly as public RPC handlers.

The design uses the maintained verifier's
[registration and authentication contracts](https://simplewebauthn.dev/docs/packages/server)
and the separation of enrollment, factor replacement and recovery described by
[OWASP's MFA guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

## Implemented durable ceremony and API layer

Migration `0036_admin_passkey_ceremonies.sql` adds `admin_passkeys`,
`admin_mfa_state` and nullable `account_sessions.admin_verified_until`. Existing
sessions start unelevated. Apply the forward-only migration before this code;
missing/unavailable state denies access. There are now 42 application tables:
37 account-owned categories and five shared categories in the independent export
and deletion-preflight inventories.

- One security-state row per administrator holds one outstanding two-minute
  challenge, bound to owner, cookie-derived session digest, purpose and configured
  origin. New ceremonies invalidate older ones. Ten begins/removal attempts per
  15-minute window are reserved durably before password verification. There is no
  unbounded abandoned-challenge table. These limits are provisional beta controls.
- User-row-first locking serializes with session creation, credential recovery and
  deletion fencing. Role, verified email, current password hash, fence and active
  session are checked from storage, not client/JWT role claims. The database UTC
  clock controls expiry and is rechecked after password/cryptographic verification.
- Challenge consumption commits before signature verification. A failed assertion
  or later storage rollback cannot revive it. Counter updates and elevation commit
  together. Only the proving session receives up to five minutes of privilege,
  capped by its expiry. Enrollment alone never elevates a session.
- First enrollment requires current password plus a ten-minute random operator
  grant; only its digest is stored. The internal grant issuer refuses accounts
  with existing factors. It is deliberately not an API endpoint or a role-granting
  function. The operator must independently establish identity and authority.
- Adding/removing another passkey requires fresh step-up and password confirmation.
  At most five keys may exist; the last key cannot be removed. Successful factor
  changes clear all session elevations and pending challenges. Password recovery
  does not delete factors or provide a replacement/bypass.
- `auth.adminMfa` exposes `status`, `beginEnrollment`, `finishEnrollment`,
  `beginStepUp`, `finishStepUp` and `removePasskey`. Strict inputs include an
  account ID to reject stale tabs; ownership/session identity still comes from the
  verified cookie and database. The lower-privilege `adminIdentityProcedure` is
  reserved for these ceremonies, never privileged business actions.
- Audits record successful approval/enrollment/verification/removal without raw
  responses, passwords or grants. Account export includes reviewed metadata but
  excludes credential identifiers, public-key blobs, counters, transports, user
  handles and pending challenge/grant/session digests. This is data minimization,
  not a claim that a public key is itself a secret.

## Implemented browser workflow

`/admin/security` is a lazy-loaded route linked only from an administrator's
workspace. It uses pinned `@simplewebauthn/browser` 14.0.0 and the maintained
[browser ceremony API](https://simplewebauthn.dev/docs/packages/browser). The
existing interface components and visual language are reused, without a redesign.

- A fresh account check gates the page; current owner ID is bound to every API
  call. Account identity is rechecked before options, device proof and submission.
  Owner changes/unmount dispose the old flow and abort its native prompt. Missing,
  unverified and non-admin accounts cannot use the controls.
- Enrollment, verification and removal have explicit preparing/prompt/saving
  states. Concurrent actions are rejected. Preparation/prompt can be cancelled;
  an already-submitted mutation cannot. Generation checks suppress abandoned
  results, including late failures after a newer action succeeds.
- Credential metadata and forms are hidden until fresh security status is
  available. The active indicator requires persisted status and expires locally;
  server authorization remains authoritative. A local badge is not a token.
- Passwords/grants are read from uncontrolled forms and cleared on submission.
  Direct RPC calls avoid retaining them in mutation caches. Device PINs,
  biometric data and private keys are never collected by the page.
- First enrollment needs operator approval/password. Additional keys need fresh
  verification/password; removal additionally needs explicit backup acknowledgement.
  The five-key limit and last-key protection are displayed and enforced by storage.
- Unsupported contexts fail closed. Lost-device guidance directs the administrator
  to another registered key or operator identity review, not a password-only reset.

## Controlled operator initial enrollment

`node dist/admin-enrollment.js` (or the development `pnpm admin:enrollment` script)
provides `--check` and explicit `--issue` modes. See the
[operator runbook](ADMIN_ENROLLMENT_RUNBOOK.md) for authority, exact arguments,
private output handling, uncertain outcomes and expiry. This is not routed through
HTTP. These initial-enrollment modes never promote an account, reset existing
factors or elevate a session. The separate reviewed recovery modes are described
in the recovery runbook and current status above.

Inspection creates neither security state nor audit records. Issuance repeats
account email/origin, current role, verification, fence and password-version checks
under the existing account lock, rejects enrolled accounts and refuses to replace
an active operator approval. Concurrent approvals serialize. The same transaction
records bounded operator/approval references with the request ID and grant digest.
Those references are operator assertions, not an independent authentication system.

The raw token is written only to a new private POSIX file, never stdout/audit logs.
Existing files, symlinks, publicly accessible immediate directories and Windows
issuance are refused. Windows file mode bits are not treated as ACL enforcement.
The compiled command is included in normal build output. An uncertain commit or
file-write outcome is not automatically retried; the runbook requires review and
expiry rather than silent replacement. Host/database security and the human
identity-review policy remain outside this CLI's enforcement boundary.

Thirteen source-command tests cover help, strict argument admission and unavailable
storage. Twelve real-MySQL/compiled-command tests cover inspection without mutation,
private file permissions, token-free receipts, digest/audit persistence, concurrent
approval, wrong/ineligible targets, existing files/symlinks, unsafe directories,
usable first enrollment and refusal to reset enrolled factors. The broader
database regression suite also passes at the dated delivery checkpoint. These
checks do not establish human identity review, fault-injected file-write recovery,
production filesystem policy, a freshly built release image or real-device acceptance.

## Full contract and remaining acceptance gates

Items below retain the complete intended scope. Durable storage, transactional
ceremonies and API admission are implemented as described above; their existence
does not complete cross-browser/accessibility acceptance, live operator recovery or
production acceptance. The browser path below is implemented, with the bounded
virtual-authenticator proof recorded in the next section.

1. **Durable security state.** Add forward-only migrations for authenticators,
   short-lived one-use challenges, bounded attempt windows and session step-up.
   Bind challenges to account, exact session, purpose and configured RP/origin.
   Use database time after the account lock; serialize with password changes,
   role changes, session revocation and deletion fencing. Never store raw cookies.
   Keep storage bounded, including abandoned challenges and rejected enrollment.
2. **Bootstrap and recovery.** An existing administrator with no factors needs
   an explicit, expiring operator-approved initial-enrollment grant plus current
   password confirmation. Password-only login/reset must not silently reset or
   replace MFA. Existing factors require fresh step-up before adding/removing
   another factor. Losing all factors requires a documented operator identity
   check and audited reset that revokes every session and pending challenge.
   Do not introduce an emailed OTP or permanent emergency bypass as an implicit
   weaker replacement. The actual operator recovery approval process remains open.
3. **Transactional ceremonies.** Reserve durable attempt allowance before password
   verification. Consume challenges on attempted verification, including failures;
   commit that consumption separately from any rolled-back enrollment failure.
   An assertion from another account/session/purpose, an expired challenge or a
   concurrently replayed response must not elevate either session. Serialize
   authenticator counter checks/updates and final session elevation with revocation.
4. **Authorization integration.** Every `adminProcedure` requires a fresh active
   session, verified email, current admin role, unfenced account and unexpired
   session-bound step-up from persistent storage. Fail closed on missing state or
   storage failure, including legacy routes when explicitly enabled. Recheck at
   the consequential operation boundary where queued/in-flight work is possible.
   `system.notifyOwner` must not escape the same check. No client boolean/JWT role
   claim substitutes for this lookup. Ordinary customer workflows must still work.
5. **Usable browser path.** Provide account-bound enrollment, credential listing,
   add/remove, step-up, cancellation, unsupported-browser and lost-device states.
   Explain why access is blocked and how to recover without revealing sensitive
   data. Clear state on account changes/logout; never leave a stale enrollment
   challenge on another account's screen. Verify keyboard and accessible status
   handling. Do not display a completed MFA badge until persistence confirms it.
6. **Privacy and operations.** Update both independent account schema inventories;
   export appropriate credential metadata without challenge/session/security
   material. Include the new tables in deletion fencing/erasure review and backup
   rehearsal. Audit factor changes without raw assertions or secret material.
   Document clock, HTTPS, reverse-proxy and authenticator loss procedures.
7. **Proof.** Run actual MySQL concurrency/replay/revocation/expiry tests and a
   connected compiled-server/browser ceremony with a virtual authenticator. Then
   require human acceptance with real devices and the real HTTPS origin. Cover
   rejected signatures, changed roles/passwords, revoked sessions, database
   failure, limits, duplicate credentials, account switching and complete recovery.
   Refresh full tests/build, dependency audit and deployment acceptance afterward.

## Current test scope

The boundary suite uses independent manually encoded COSE/CBOR fixtures and actual
Node-generated P-256/RSA key pairs and signatures. It does not stub verifier success.
Tests cover positive registration/assertion, wrong keys/origin/RP/challenge/handle,
missing UP/UV flags, counters, cross-origin embedding, identifier mismatch,
malformed input, secure configuration and no network call on the accepted paths.
An added valid packed-attestation case first demonstrated that the broader upstream
verifier accepted it; the app-specific none-only policy now rejects it.

The separate MySQL suite exercises real signatures, durable enrollment, concurrent
replay, failed-proof/storage consumption, counters, expiry, session isolation,
cookie/account binding, API authorization, revoked sessions, changed roles and
credentials, fencing, quota bounds, factor removal and metadata export. The
mid-verification expiry test advances the MySQL connection clock, not verifier
success. A compiled-server HTTP test also completes cookie-bound enrollment and
step-up across process restart, rejects replay and revoked sessions, and confirms
password-only owner notification is denied. It uses isolated loopback and synthetic
signatures, not a browser or real HTTPS deployment. These are local database/API
tests, not hardware or production acceptance.

A separate connected Chromium 148 run uses the compiled client/server, actual
MySQL and CDP virtual authenticators, with external requests blocked. It completes
registration, step-up, native-prompt cancellation, cancellation while options are
delayed, a newer successful ceremony, separate backup enrollment/removal, continued
verification with the original key and refresh after database-side expiry. It
asserts persistence, no proof submission after cancellation, no console errors,
and no mobile horizontal overflow. Desktop/mobile screenshots were inspected.
It caught and drove fixes for a stale cancellation replacing newer success and
an invalid HTML UnicodeSets validation pattern. Twelve flow tests and seven
presentation tests additionally cover account changes, disposal, unavailable
storage, unsupported contexts, last-key protection and safe errors. These are
not complete browser account-switching, keyboard/screen-reader, cross-browser,
real-device, operator recovery or public HTTPS acceptance. The
[delivery ledger](PUBLIC_BETA_DELIVERY.md) records commands and counts.

Operator role changes must revoke all account sessions in the same controlled
workflow before a role is regranted. There is no public role-management route.
Admission checks do not retroactively cancel already-admitted external work;
queued/long-running privileged operations still need execution-time checks and
separate provider authorization before legacy automation may be enabled.
