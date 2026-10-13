# Candidate query and support: local packaging checkpoint

This October 2 checkpoint includes the candidate query/order and local support
download additions. It is local synthetic verification, not a published release,
deployment, provider permission, mailbox acceptance or completed public beta.
The EUR 100/month initial ceiling remains planning-only: EUR 80 recurring plus
EUR 20 reserve; no purchase is authorized or made by this work.

## Source and exact packages

Branch `agent/public-saas-beta`, HEAD
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, dirty checkout. Selected inventory
before and after builds: 531 files, 10,442,939 bytes, SHA256
`31170c253549e6a1b8c814f8c4e8cea65a3a2b11fc7056de30e8b607dd939e5b`.
This inventory excludes root documentation, operator scripts, installed dependencies,
host configuration, secrets and container layers. It is not a committed snapshot
or a causal release attestation; its acceptance/provenance flags remain false.

Fresh Dockerfile targets were built under new local tags, preserving older images.
Runtime tag `cofounder-local-search-runtime-20261002-r1`, exact image
`sha256:6289a8085aec51dfd806ddcaa8c05d57cfa364fcccc10f59bb31210b1ce48e72`,
223,459,714 bytes. Integration-test tag `cofounder-local-search-tests-20261002-r1`,
exact image `sha256:c39b6159310810eb8ea2144c6eff98c4cd583dcad509fcba19c0fa0369cf43e9`,
280,403,655 bytes. The integration build returned exit 0. Runtime build finished
its final export/unpack step and the resulting image was independently inspected
and executed; the resumed terminal handle was closed before a final exit-code
field could be collected. Do not invent that terminal field or a build duration.

Pinned base `node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`;
Dockerfile SHA256 `1d0312526228e7924dc9885115cf045834cde4843bfdaa49e2254fcf9f789fc0`.
Corepack downloaded pnpm 10.4.1 and the frozen install downloaded 689 packages;
runtime deployment/pruning reused 546 packages with zero additional downloads.
This was not an offline/fresh-cache supply-chain verification. Runtime Dockerfile
completed type checking, unit-test and compilation/pruning stages; independent
current source unit acceptance is 797 tests/80 files/112.46 seconds/exit 0.

Both exact images passed read-only, network-disabled artifact probes as UID1000
on Node v22.23.3. Compiled dist plus migrations matched: 116 files, 6,837,312 bytes,
SHA256 `7d65c09ea773a10d16f4976715c21d1c3b18cb51b553d64d0b62186b235a9daa`.
Probe `outputs/language-packaging-20261002-r1/artifacts.mjs` was mounted read-only;
no application source was mounted. The runtime probe also checked required
entrypoints/migrations and absence of source, .env, Vite, Vitest, tsx and TypeScript
paths. This limited file equality does not assert dependency/layer equality.

## Completed current-source database rerun

The previously running session 28927 finished normally: 724 tests, 43 files,
no skips, 266.92 seconds, exit 0. Runner
`62fc947dfb2b5f8df1c006085d787b8d2819f9851a37f1d85decff5ba2f13592`
was confirmed stopped with exit 0 and no OOM. It used old image dependencies with
current source/compiled files read-only mounted, correct synthetic migration root
credential, original deadlines and a fresh 1GiB data fixture. This closes that
source-level rerun, not immutable image database acceptance. Earlier missing
credential and exhausted 512MiB fixture failures remain recorded in
[the full report](FINAL_VERIFICATION_REPORT.md#candidate-search-and-ordering-october-2).

## Exact runtime startup and HTTP checks

The exact new runtime ran its unmodified default migration/start command against
a separate synthetic database. First fixture launch omitted PUBLIC_ORIGIN and
failed closed: container `3ad852013bbc0f04f27959ffe150ac9bdc9eddb2e42f85674074f846a2f035b9`,
exit 1/no OOM, generic startup_failed only. The test setup was corrected to use
the actual configuration names; no product configuration validation was weakened.

Final runtime container
`8b5448d16f18ce6b22c7b60981312ac5d56c69d4e3864bb58bd9614596e4d293`
ran NODE_ENV/APP_MODE production, UID1000, read-only root, dropped capabilities,
no-new-privileges, 2CPU/2GiB/no extra swap/256 PIDs and 64MiB noexec tmpfs. It shared
only its owned database's loopback namespace, exposed no host ports and mounted
only the read-only HTTP probe. Provider/legacy/account-mail/owner-notification
workers were explicitly disabled; outreach remained paused. Synthetic secrets
were environment fixtures, not production secret-management acceptance.

`scripts/production-smoke.mjs` returned exit 0 with databaseReady, compiledClient,
nonRoot and providersDisabled true. It checked readiness separately from liveness,
compiled assets/security headers, anonymous refusals, origin rejection, privileged
provider refusal, malformed/oversized request handling and protected recent account
surfaces. No real accounts, provider requests or messages were used.

Final runtime stopped cleanly with exit 0/no OOM and shutdown_completed. Its owned
DB `7db6707ed6edd96580c6ffb4b837c87f77b84599e18c3cebc872d847f5c63dea`
and the completed source-run DB `f7e6df797490038f7528df20b3ceaac7d6d21f68d95781e284a72c652160c601`
both stopped exit 0/no OOM after their checks. Their ephemeral synthetic data were
discarded; logs/containers/images are retained. The immutable suite's separate
DB was separate, not reused from either stopped fixture.

## Immutable database acceptance

The exact integration-test image completed its normal `pnpm db:migrate && pnpm
test:integration` command without application/source/dependency mounts: 724 tests,
43 files, no skips, 232.49 seconds, terminal exit 0. Session
28947; runner `90cfeb8834e6bd2bdc9b957264a08a089688a150b33b027489b6e639dead9fd3`.
Fresh DB `683dba17cdfe2504aff38af88abe56b7953be8d7828d1bf1c4c2cf5794ef8b7e`
used 1GiB tmpfs data; while tests were still running it had 380MiB used, 645MiB
available (38%), unlike the earlier exhausted fixture. Runner inspection confirmed
stopped, exit 0 and no OOM. No product/test deadlines or production limits changed.
After completion, this owned database also stopped exit 0/no OOM. Ephemeral
synthetic data were discarded; test logs, containers and exact images retained.
The test runner intentionally retains its disposable root/writable layer for
Corepack/Vitest config, with dropped capabilities/no-new-privileges/2CPU/2GiB/no
extra swap/512 PIDs/256MiB noexec tmpfs. That is not runtime hardening acceptance.

MySQL fixture image is
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`;
each new DB is UID999, read-only root, network none/no host ports, cap-drop ALL,
no-new-privileges, 2CPU/2GiB/no extra swap/256 PIDs, 1GiB data plus bounded
runtime/temp tmpfs. Data are synthetic and disposable, logs/containers retained.

All 133 root/operator tests reran successfully without skips, 3.491 seconds,
exit 0. Traceability and git diff whitespace checks pass. Selected inventory
remains unchanged after the documentation updates, which are excluded by that
inventory's declared scope. Neither successful app DB tests nor these local
operator units prove the separate database-readiness/recovery integration fixtures,
CI execution, remote backup/restore, hosted acceptance or current provider rights.

## Connected customer-browser checks against the exact runtime

The same exact runtime image now passed 20 connected stages in three distinct
browser runs: five candidate query/support stages, eleven registration/profile/
draft/account/restart stages and four private-template/default stages. No source,
compiled host dist or dependency directory was mounted into the application. The
browser dependency image was separate; its cached application was never launched.
These results supersede the earlier source-mounted browser limitation for the
specific checked journeys, not every customer flow or hosted acceptance.

The flow was actual sign-in into the database-backed workspace, candidate paging/
ordering/literal search, opt-out enforcement, language switching and a real support
JSON download. The five-stage run created 57 scoped synthetic candidates: 56 owned,
one foreign excluded. It checked all four orders, page reset and 50/6 row paging;
literal %, _ and = search returned the single opted-out candidate without a drafting
action. The downloaded JSON was parsed, labels matched and approval cleared.

The eleven-stage run used actual registration and its unverified-account screen,
then explicitly set the synthetic owner's emailVerified flag in the fixture DB.
That is NOT a mailbox/token-delivery test. Dutch profile choices survived language
switching, saved privately as canonical values and reloaded. Individual candidate
intake committed evidence/idempotency, corrections preserved provenance, original
draft review/approval persisted, revision cancelled the old version and cleared
approval, opt-out blocked both UI drafting and the real API, cancellation retained
history, logout revoked the captured session, and a second account could not read
the first account's candidate/message. Real subsequent login restored records.
The external coordinator actually stopped and restarted the runtime after the
browser's restart request; the same session/workspace survived the restart.
No preparation, external action, user-confirmed send, response/follow-up or export
is established by those eleven stages. It is not a complete critical-path receipt.

The four-stage defaults run used real sign-in, explicit staging/review/save and
durable reload, then explicit search/template application. Inserting a template
did not create a draft or preserve approval across text edits. Removing a pending
template did not alter storage before review/save; discard reloaded saved state.
Confirmed owned-account cleanup occurred for this specific defaults fixture.

All three final browser commands returned exit 0 and containers were independently
confirmed stopped/no OOM. Zero page/console errors or external requests were
observed in those runs; local RPCs were real, with no response mocks. Search/support
and defaults ran desktop1365x1000/mobile375x812; the eleven-stage workflow used
desktop1440x1000/mobile375x812. Screenshots were actually viewed: readable controls,
no horizontal document overflow in asserted states, internal mobile candidate
table scrolling to actions remains. Page identity, nonblank content, absent
framework overlay, console health and interaction checks pass within these flows.
This is not full accessibility, browser-diversity or performance acceptance.

Scripts/screenshots remain outside the checkout in
`outputs/candidate-packaged-browser-20261002-r1`. Script SHA256 values:

- `browser.cjs`: `1d3b2143bad531c44752a402b31ea93a03c9ecf3768cee0feb16083275766381`.
- `workflow.cjs`: `94d2696896bf560ceb46cd01745eb4a8cc22bd8cfc235e8cccaf5bdb0678d83e`.
- `defaults.cjs`: `d3c1105d96f4bb08358525e40756fc5e6993c527fad7c4559f03564efce37485`.

Browser image `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`
provided Node22.23.2, Playwright1.62.1 and Chromium148.0.7778.0. Browser plugin/skill
pair unavailable; regular cached Playwright fallback was announced. Browser
containers ran UID1000/read-only/no-new-privileges/cap-drop ALL/2CPU/2GiB/no extra
swap/512 PIDs/512MiB executable tmpfs needed by Chromium. Only the QA script was
mounted read-only plus an output-only writable folder. Chromium's no-sandbox flag
is confined to this isolated test fixture, not recommended for production browsing.

DB `e70b68e2217d839fb1f2145ea676f07fa1751afda8854b4c521c8b12b3d188b7`
used the same previously recorded MySQL image/security/resource bounds and fresh
1GiB ephemeral data, network none/no host ports. Runtime and browser shared only
that namespace's loopback. Runtime containers had no mounts, UID1000/read-only/
cap-drop ALL/no-new-privileges/2CPU/2GiB/no extra swap/256 PIDs/64MiB noexec tmpfs.
Runtime r1 `dc4960d3fb502de477188188a8a52942c5e7b1ed4a8b472c7ce3f3fc75535290`
used localhost13116 with registration disabled; r2
`b532567a7da628c7dd1d7e82bdc798b78ddf6879875117bc6bd7da4872225c4c`
used localhost13117 and explicitly enabled registration only for the synthetic
registration flow. Both ran production mode, all provider/legacy/mail/owner
workers disabled and outreach paused. Test secrets were synthetic, not host secrets.

An initial fixture race started r1 while MySQL was initializing; its normal
migration command failed safely, exit1/no OOM. The first browser readiness wait
then expired, exit1/no OOM. After observing actual MySQL readiness and terminal
runtime state, the same r1 container was started and the same browser command
rerun with unchanged deadlines; it passed. This was not restarting a live wait.
An initial r2 invocation mistyped the digest and failed before container creation;
the verified local digest was corrected and --pull never used. No product edits,
guard changes, dependency installations or public endpoints resulted.

Final browser containers: search `1bafa723b55b6169140df19431f7c326bd91ed670f6a9916b008db4d10800b46`,
workflow `1875b46ccdb0e5fd79947dd53c234017da174bb2ef1bb262088dc150f4350d28`,
defaults `d667db8dad442724590d2f56d8459c98b54e40247309be1868cf24ccc4a3d110`.
After checks, both runtime containers and the owned DB stopped exit0/no OOM;
runtime logs show shutdown_completed, including the coordinated restart. The
ephemeral synthetic DB data were discarded; logs/containers/images retained.

## Remaining gates

After these documentation updates, the 29 traceability/inventory/release-command
contract tests passed without skips, 0.635 seconds, exit 0. Traceability still
reports 116 partial/12 required artifacts/completionProven false; git diff whitespace
checks pass. Selected inventory was re-inspected: same 531 files/10,442,939 bytes/
31170c25... digest. No application/build input changed in this browser checkpoint.

Hosted TLS/mail/passkeys/load/backup/restore,
provider-by-provider permission/live verification, worldwide catalogue coverage,
legal/controller/support identity, and the other original 116 phases remain open.
Traceability still reports 116 partial, zero implemented, zero missing phases,
12 required artifacts and completionProven false. No commit, push, merge,
publication, deployment, purchase or real outreach occurred.
