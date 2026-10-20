# Verification page account-failure safety

Status: bounded implementation and synthetic browser acceptance, not a public
release or actual email/provider acceptance. No sending, purchase, deployment,
commit, merge or publication occurred.

## Defect and fix

VerifyEmail previously used cached auth.me data even when a background refresh
failed. A cached verified account could still offer Open workspace; an unverified
one could offer a resend. The current page requires data with no query error and
no initial loading for account-dependent actions. It suppresses cached email-
verified claims and resend guidance during failure and provides English/Dutch
Check account again, disabled during a fetch. This retries only auth.me.
Explicit token confirmation remains public and independently tied to the current
token. Confirmed links fall back to sign-in if current account validation fails.
Server policies, token redemption, mail budgets and provider checks are unchanged.

Final VerifyEmail source hash:
`4d91aaf1c4dfe1f057d64da66e5b7cacb4e37ff76c0879ccbd3806bc6ab80080`.
Four added render regressions cover failed cached verified/unverified accounts,
public confirmation while the query fails and link success with failed current
account state. Current focused verification/recovery run23947:19tests/two files/
no skips/1.28s, typecheck and production build exit0 (Vite8.60s).
Earlier7255 typecheck failed on nullable account.data; corrected with optional
access, followed by successful check/build41699 and final23947. No failed check
is counted as passing. The broader unit run81939 began before the final display
cleanup; its result must retain that timing boundary rather than serve as an
immutable source/build attestation.
Run81939 subsequently completed907tests/88files/no skips/156.98s. The final
focused19-case run and browser r3 independently verify the final UI changes.
Final current root/audit run161tests/11files/no skips/4196.5255ms. Selected host
inventory digest: `85eee6b475fc60e8213b9c5d3fd85428bd3be14e7dcc85cc11b58020a72a527c`; it is not image provenance.
React guidance kept availability derived from current query state, without
adding effects, hidden retries or another persisted account-state copy.

## Rendered acceptance

Browser plugin absent; frontend-testing guidance used the already available
Playwright QA image69de0b53..., Chromium148.0.7778.0. Local compiled frontend
mounted read-only into a static server, not a packaged application. HTTP RPC
responses were deliberately simulated; no database or real provider was used.
Network-none/no public ports/UID1000/read-only/drop capabilities/no-new-privileges/
2CPU/2GiB/256PIDs. Browser execution needs executable512MiB temporary storage and
QA-only --no-sandbox; these are not production-runtime recommendations.

Runner: outputs/verification-account-failure-20261002-r1/browser.cjs, hash
`1c5249e94717c13867b9ae88cf3d5643200e2bddf5d2b0dbbde3d86afd81ae11`.
Four stages passed on final compiled frontend in owned r3 fixture:

1. Verified account initially exposes its workspace link.
2. Failed background refresh retains query cache but removes account actions.
3. Keyboard retry restores the current unverified account controls; unavailable
   mail produces an error, exactly one resend request and no provider-success claim.
4. Dutch/mobile query failure still offers explicit public token confirmation,
   consumes the fragment from history and remains without horizontal overflow.

| Required browser check | Result                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Page identity          | http://127.0.0.1:13015/verify-email; CoFounder Outreach                                  |
| Meaningful content     | Account/error/retry/link controls rendered                                               |
| Framework overlay      | No Vite overlay observed                                                                 |
| Console health         | Six expected injected 503/query/mutation diagnostics, no other observed warnings/errors  |
| Screenshot evidence    | Final desktop/mobile captures inspected                                                  |
| Interaction proof      | Background failure, keyboard retry, unavailable-mail request and Dutch link state passed |

Desktop1365×1000/mobile375×812 captures show readable wrapping, no overlap or
horizontal overflow. Mobile page is tall and requires normal vertical scrolling
below the first viewport. No whole-product accessibility/all-browser claim.
Independent inspection: final r3 container
`c7317f87b6b156e281f482ce5f20706010b5dbb32945a0921a63bc3920a2c7e6`
stopped/exit0/noOOM. r2 also stopped0/noOOM. Initial r1 stopped1/noOOM because the
temporary mount defaulted noexec and Chromium launch failed with EACCES; the
self-created replacement fixture explicitly enabled temporary execution. No
shared host settings or user data were changed or deleted.

## Current boundaries

Current API snapshot remains165operations/58admitted107denied/54reachable
references/zero unknown, with151source hashes and digest4cc1faf0... . UI snapshot
now223actionelements/204events/147files, digest873b4440... . The original full
requirement scope remains116Partial/completionProvenfalse. Prior d8e17b4f... /
a187faca... immutable image receipts predate this frontend change and cannot
qualify the new source. Real inbox, hosted lifecycle, broader account-state races,
production release and complete semantic action review remain open.
