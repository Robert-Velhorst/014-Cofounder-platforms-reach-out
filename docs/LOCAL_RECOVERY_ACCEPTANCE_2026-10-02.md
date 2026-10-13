# Local connected password-recovery acceptance: 2026-10-02

Status: passed locally with synthetic provider transport; real inbox acceptance open.

## Flow and environment

The flow under test was sign-in/recovery request -> durable MySQL mail queue ->
real queue worker -> synthetic email acknowledgement -> browser reset-link
consumption -> password change -> new-password sign-in.

Chromium 148.0.7778.0 and the existing Playwright 1.62.1 dependency image ran on
isolated loopback HTTP at `http://localhost:13014`, without published ports.
Desktop: 1365x1000; mobile: 375x812. Browser plugin and its browser skill were
not available, so the installed frontend-testing skill's Playwright branch was used.

Current server/shared/schema/compiled-dist files were mounted read-only into
`cofounder-connected-browser-current-20261001`. The production-built application
and API were real; RPC responses were not fixtures. MySQL 8.4 used the owned
network-disabled temporary fixture `cofounder-export-capacity-db-20261001`.
Runner limits were 2 CPU and 2 GiB, not the production-runtime resource claim.

The separate queue worker called the actual queue processor with synthetic
configuration and an in-process replacement of fetch. It allowed only the exact
email-provider endpoint and example.invalid recipients, returning a synthetic ID.
No real email/provider request was sent. Raw links and passwords were kept in
the harness memory, not printed into acceptance output.

## Verified

Five checkpoints completed, exit 0, no OOM:

1. Real browser registration created an unverified synthetic owner and session.
   Recovery request created a durable encrypted queued job with a generic response.
2. The real worker generated the reset token/message, stored its SHA-256 digest,
   accepted the synthetic acknowledgement and cleared the job payload.
3. Browser consumed the actual message link and removed its fragment. Password
   mismatch kept the form available with a visible explanation. Page identity,
   meaningful content, no framework overlay and mobile no-overflow checks passed.
4. Browser reset consumed the token and expiry, verified the owner, removed all
   old sessions and did not automatically sign in. The old browser session returned
   no account. The real queue processor accepted the password-change notice
   through synthetic transport; it contained no reset token.
5. Reusing the consumed link was rejected; old-password sign-in was rejected;
   new-password sign-in opened the real private workspace.

Reset token was absent from DOM markup, local/session storage, observed request
URLs and server logs. No external browser requests. Exactly four expected console
entries represented the deliberate 400/401 errors and their two fixed application
messages; no other console or page errors were accepted. Server emitted graceful
shutdown completion and exited 0.

After each attempt only its generated synthetic account was removed. Final
database counts were zero users, sessions and mail jobs; the owned database was
stopped after the runner terminated. Synthetic quota counters lived only in that
temporary database; this check makes no real-account deletion claim.

## Evidence and reproducibility limits

Local harnesses and screenshots are outside the repository in the workspace's
`outputs` directory, as required by the frontend-testing skill:

- `connected-recovery-20261002.cjs`: SHA-256
  `a22450983baea21c8284cbcc9c33a2621f019703ce0f5d981c8ae06347b0265a`.
- `recovery-worker-synthetic-20261002.mjs`: SHA-256
  `7abb5bc239147ba41af5533bc260019599459858beb98d1927e62d96cad1a019`.
- `recovery-form-desktop-20261002.png`,
  `recovery-form-mobile-20261002.png`,
  `recovery-success-mobile-20261002.png`.

The harness refuses a database other than the explicitly confirmed synthetic
loopback cofounder_test fixture. It is not a portable committed CI acceptance job.
Two earlier terminal attempts failed because the harness used a wrong SQL column
name and then a wrong expected login-error text; both were corrected before the
passing run. Neither establishes an application defect.

No product implementation changed. Real provider credentials, verified sender,
inbox/spam delivery, hosted HTTPS/secure-cookie behaviour, other browsers,
full keyboard acceptance, operator approval and a customer pilot remain unverified.
This receipt complements, not replaces, the [packaged runtime qualification](LOCAL_RELEASE_CANDIDATE_2026-10-02.md)
and the [full launch gates](PUBLIC_BETA_DELIVERY.md#release-requirements-and-evidence).
