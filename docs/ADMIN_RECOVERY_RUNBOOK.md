# Lost-all-passkeys administrator recovery

Status: locally implemented, not approved for live use. This is a consequential
security reset, not password recovery or role promotion. Prefer another registered
authenticator if one is available. There is no public reset endpoint or emailed
OTP bypass. The command requires existing independently authorized operator
host/database access; reference strings and the review digest do not authenticate
the operator or enforce two-person approval.

## Identity, authority and incident review

Before executing, the service's authorized security reviewer must verify the
requester's identity and administrative authority through an independently trusted
channel and roster. A current session, email access or a password alone is not
sufficient. Establish that all enrolled keys are unavailable; investigate suspected
compromise and preserve appropriate incident evidence before removing factors.
Document the reviewer decision outside the application using bounded operator and
approval references, not private identity evidence in command arguments or logs.
The actual organization-specific policy and reviewer acceptance remain release
gates. Notify the legitimate account holder through an independently verified
channel about the reset; the application does not automatically send that notice.

## Review and execute

Use the immutable release and its configured database and exact HTTPS origin.
Examples below contain synthetic placeholders, not an actual deployment. Never
put connection secrets in command arguments. Use the private Linux output setup,
confidential transfer and secret-retention rules from the
[enrollment runbook](ADMIN_ENROLLMENT_RUNBOOK.md).

```sh
node dist/admin-enrollment.js --recovery-check \
  --account-id 42 --expected-email admin@example.invalid \
  --expected-origin https://cofounder.example.invalid
```

This read-only check returns eligibility, key count and a review digest, not
credential secrets or a new approval. Confirm the exact target and authorized
identity review. The digest binds the current account/password version, origin,
factor generation and enrolled key state. It is not an authorization token.

```sh
node dist/admin-enrollment.js --recover \
  --account-id 42 --expected-email admin@example.invalid \
  --expected-origin https://cofounder.example.invalid \
  --operator-ref operator-42 --approval-ref identity-review-42 \
  --review-digest REPLACE_WITH_THE_REVIEWED_64_CHARACTER_DIGEST \
  --output /private/new-replacement.admin-grant \
  --confirm-all-passkeys-lost
```

Issuance requires a new `.admin-grant` file in a current-user-owned private POSIX
directory. Windows can inspect but cannot issue. Existing files are not overwritten.
The secret is written only to that private file; stdout contains a token-free
receipt. An owner-locked transaction checks the review again, removes all enrolled
keys, revokes every existing account session, clears pending ceremonies, rotates
the passkey user handle, issues a ten-minute replacement approval and records an
audit event. Audit failure rolls everything back. Existing attempt quotas are not
reset; the holder may need to wait for the attempt window to expire.

If factors or credentials changed, the reset fails. Do not automatically obtain a
new digest and retry: repeat the relevant human review. Concurrent resets have
one winner; an old digest cannot reset a newly enrolled generation. The reset
does not change the account password, role or deletion fence.

## Replacement and uncertain outcomes

The holder signs in again with the current password and uses the replacement
approval at `/admin/security` to enroll a new authenticator. They must then prove
possession with a separate verification before privileged operations are allowed.
Add and independently test a backup authenticator on the actual HTTPS deployment.
Record completion and the independently delivered reset notification.

If the command reports an uncertain outcome or token-file failure, do not assume
the transaction rolled back and do not automatically repeat recovery. Use the
request ID to inspect the audit through authorized private access, inspect current
eligibility, and coordinate with the reviewer. An issued token cannot be printed
again. After any active approval expires, the separately reviewed initial-enrollment
path can issue another approval to an account with no remaining keys. Recovery
may leave an empty or partial newly created file on failure; inspect and handle it
under the operator's private-file policy. No automatic deletion is performed.

## Verification limits

Local MySQL and real cryptographic synthetic-authenticator tests cover revocation,
replacement enrollment, stale reviews, replay, concurrency, transaction rollback,
in-flight old proof, compiled command receipts and protected token output.
They do not prove a human review, real hardware, live HTTPS, operator host access,
notification delivery or disaster recovery. Those remain production acceptance
requirements. This separation follows
[OWASP MFA recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html#resetting-mfa).
