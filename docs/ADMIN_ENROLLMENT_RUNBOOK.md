# Operator runbook: first administrator passkey

This procedure is for an **existing, verified administrator with no enrolled
passkeys**. It does not create an administrator, reset a password, remove a key,
recover lost factors or grant privileged access by itself. The implementation is
local development work; operator and real-device production acceptance remain open.

## Authority and preparation

Only an independently authorized service operator with an approved database/host
connection may issue an approval. The application cannot authenticate the human
behind direct database access. `--operator-ref` and `--approval-ref` are audit
references supplied by that operator, **not proof of authority or two-person
approval**. Host/database access needs its own MFA, least-privilege access policy
and attributable audit trail. Do not give ordinary customers the database CLI.

Before issuance, establish the administrator's identity using the organization's
pre-established roster and trusted contact channel. Match the account's numeric
ID, existing verified email, approved role and deployment origin. Do not rely
solely on a new email/support request or on possession of a logged-in session.
Record the authorization decision in the access-review system; pass only a short
non-secret reference into the CLI, not identity documents or narrative evidence.
The exact organizational reviewer/identity policy still needs operator acceptance.

Run from the intended application's working directory with its existing protected
runtime configuration. Apply migrations through **0036** first. Do not put database
credentials, passwords or approval tokens in shell arguments, tickets or source
control. Disable session recording before opening any secret output file.

The production build includes `dist/admin-enrollment.js`, copied into the normal
runtime image with the other compiled artifacts. It requires production dependencies
but not `tsx` or other development packages. During development, the equivalent
entry point is `pnpm admin:enrollment` from `apps/cofounder-discovery`.

## 1. Inspect the exact target (read-only)

Replace all illustrative account/origin values below with independently verified
values; these examples do not identify an actual operator or deployed service.

```sh
node dist/admin-enrollment.js --check \
  --account-id 123 \
  --expected-email admin@example.invalid \
  --expected-origin https://cofounder.example.invalid
```

This returns `mode`, `accountId`, `origin`, `eligible`, `reason` and
`grantWritten:false`. It does not create security state or an audit event, issue a
token, change a role, or elevate a session. It rejects nonexistent accounts,
unverified/non-admin/fenced accounts, mismatched email and mismatched configured
origin. `eligible:true` is a snapshot, **not authorization**. Issuance repeats the
checks under the account lock. Email must be the exact normalized stored address;
origin must be the canonical HTTPS origin without a path/trailing slash (explicit
`http://localhost` is allowed for local tests).

`reason:already_enrolled` requires the normal browser verification/key-management
path, not this command. `reason:approval_active` means another ten-minute approval
is still active; coordinate with its operator rather than replacing it.

## 2. Prepare a private output location

Issuance requires a POSIX filesystem on the controlled Linux operator/runtime
host. It refuses Windows issuance because Node mode bits do not enforce Windows
owner/group ACL separation; see [Node's filesystem caveat](https://nodejs.org/docs/latest-v22.x/api/fs.html#fschmodpath-mode-callback).
Read-only inspection and help are available on Windows.

```sh
approval_dir="$(mktemp -d)"
```

Use the same dedicated operator OS account to create the directory and run the
command. The immediate directory must be owned by that account, have no group or
other access (normally `0700`), and resolve without symlinks. Use a local filesystem
with meaningful POSIX ownership/permissions, not a shared drive. Prefer an
operator-managed private temporary filesystem excluded from backups and indexing.

The output path must be absolute and end in `.admin-grant`. The command exclusively
creates a new `0600` regular file: it never overwrites an existing file, follows an
output symlink or changes the permissions of an existing directory. Repository
ignore rules exclude this extension as a secondary safeguard, not secret storage.

## 3. Issue only after identity/authority review

```sh
node dist/admin-enrollment.js --issue \
  --account-id 123 \
  --expected-email admin@example.invalid \
  --expected-origin https://cofounder.example.invalid \
  --operator-ref operator-42 \
  --approval-ref access-review-2026-42 \
  --output "$approval_dir/first.admin-grant" \
  --confirm-initial-enrollment
```

References are bounded to 120 letters/digits or `._:/-`, starting with a letter or
digit. They are recorded with the random request ID, target account, origin and
`admin.mfa.bootstrap_approved` audit event. The database stores only the token's
SHA-256 digest and expiry, never the raw token. The token is a random 32-byte
base64url value, valid for ten minutes according to database time. Concurrent
issuance is serialized; a second live approval is refused rather than replacing
the first. No password is accepted by this CLI.

Successful stdout is a token-free receipt including `requestId`, `accountId`,
`origin`, `expiresAt` and `grantWritten:true`. The private JSON file contains those
coordinates and the raw `token`. File write, sync and close complete before the
command reports success. Retain only the token-free receipt in the access review.

## 4. Complete enrollment and prove both keys

Using the approved confidential channel, provide the token only to the reviewed
administrator. This command never sends it. Do not paste it into shared terminals,
logs, recordings or support tickets. The recipient signs in normally, opens
`/admin/security`, and enters their current account password and approval token.
They complete the real browser/device passkey prompt; the application never asks
for the device PIN or biometric data.

Enrollment alone does not elevate the session. The administrator must choose
**Verify with passkey**, then enroll an independently usable backup and verify
again. Adding/removing a key clears existing elevations. Test each real key
independently on the actual HTTPS origin before granting production operator
acceptance. The authenticator's reported backup flag is not evidence that a
separate recoverable device exists.

Inspect again: `already_enrolled` confirms stored enrollment, not successful
real-device verification or privileged-operation acceptance. Correlate the
receipt with the audit event and the administrator's accepted workflow.
Remove the **exact** temporary secret file and its now-empty temporary directory
under the operator's cleanup policy once used or expired. Do not assume deletion
securely erases copies from backups, snapshots, terminals or clipboard managers.

## Failure, uncertainty and expiry

- Nonzero exit means the operation is not accepted. Structured errors never echo
  supplied secrets, account email, driver SQL or connection URLs.
- If issuance was attempted but the connection, process, output write or shutdown
  failed, a grant may already exist and the private file may be empty, partial or
  complete. `outcomeMayBeUncertain:true` deliberately does not claim rollback.
  Keep the request ID for review; do not automatically retry or send a partial file.
- Rerun **check**, inspect the token-free audit trail and coordinate with the
  operator. A live grant cannot be printed again by the command or overwritten.
  If no usable file exists, let the ten-minute grant expire before an explicitly
  reviewed retry to a new filename. A successful enrollment still prevents reissue.
- Missing/unsafe output directories and existing filenames fail before issuance.
  A later failure can leave a new empty private file; it is never silently reused
  or deleted. Review and clean up that exact file separately.
- The command does not run migrations or repair schema, promote roles, clear
  fences, revoke sessions or reset MFA. Do not alter rows to force eligibility.

## Lost factors use a separate reviewed operation

Use another registered key if available. Password recovery does not reset MFA.
If every key is lost, stop privileged activity and follow the separately approved
operator identity-review/incident process in the
[recovery runbook](ADMIN_RECOVERY_RUNBOOK.md). The same executable has separate
`--recovery-check` and `--recover` modes; initial `--issue` never resets existing
keys. Recovery revokes all sessions/challenges and controls replacement enrollment.
Human/operator and real-device acceptance remain release gates. No emailed OTP or permanent
emergency bypass is introduced. This separation follows [OWASP's MFA recovery
guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html#resetting-mfa).

See [the MFA contract](ADMIN_MFA_DESIGN.md) and [delivery evidence](PUBLIC_BETA_DELIVERY.md)
for precise test coverage and outstanding production gates.
