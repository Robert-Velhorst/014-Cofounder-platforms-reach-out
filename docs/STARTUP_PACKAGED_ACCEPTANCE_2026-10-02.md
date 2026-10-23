# Fresh startup-repair image: connected database/runtime acceptance

October 2, 2026. Fresh complete packaged database regression and production
default startup/HTTP/shutdown passed locally. Not public-launch approval.

## Exact artifacts and source boundary

Continues [fresh Node 22 packaging](STARTUP_NODE22_PACKAGING_2026-10-02.md),
without rebuilding or altering the application:

- Runtime sha256:08f7959be6ebdd8da1fb0f75e233432e4ce111b0790bf5f5055493ed8f11970c.
- Test image sha256:39528549c082d4e2a6a174dc8462a4e8ad675ab05cfc6582231ddb669c0572ae.
- Previous actual build: 731 unit tests/74 files, no skips, 89.94 seconds on
  Node 22.23.3, type check/build/prune. Both exact images contain matching
  116 dist/drizzle files/6,800,869 bytes, digest
  23f370db0aa2c5db6fe031e7364bd589a9a7532efbaf6462e6cb3fa6ce3fedef.

Dirty branch agent/public-saas-beta, HEAD 89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb;
HEAD does not identify uncommitted contents. Selected inventory remains 517 files,
digest 54fe0c3351f8cd75f40011c4e0b883de49c29496fd0c643960f30c2471a0f08f,
all provenance/acceptance flags false with its declared exclusions. No published
artifact or committed/registry provenance is established.

## Isolated packaged database regression

Fresh MySQL 8.4.11 fixture identity:
51d048bddee0c1a00a3eb1fa38f28ea409ca21b14c899f3bf6b7aa2231305056.
Label 014-startup-20261002-r4, network none, no public ports or persistent mounts,
one-GiB tmpfs database storage, one CPU/one GiB/256 PIDs. An initial readiness
observation preceded initialization and refused its connection; the subsequent
authenticated application-user TCP query passed. No restart was inferred from
that transient observation.

Runner 7c112ef45e193bbef0058fdbd63b55f37734ccf90d58744b8f49434ecfc2d029
executes the test image's unchanged default migration/full database-test command.
It shares only this database's network-disabled namespace, with no host mounts,
two CPUs/two GiB/256 PIDs/dropped capabilities/no-new-privileges. Migrations applied.
Full suite: 712 tests/42 files passed, no skips, 245.97 seconds, terminal exit 0,
no OOM kill. This is a fresh complete run, not reuse of the earlier image's result.
Its resource bounds are test resources,
not measured production capacity. Synthetic credentials match the fixture;
no customer/private shared database is used.

## Actual pruned default startup and HTTP acceptance

Runtime 82174c8eff30925ba3a2f121b08bbedd168a1dcebad7e9fd502299124f2541f3
used its actual default node migration-then-app command. A separate synthetic
schema/user in the owned database kept runtime checks apart from test mutations.
Only synthetic DB/JWT secret files and the read-only QA HTTP script were mounted,
never host app source/dist/migrations/.env/development tools.

Actual logs show migrations_applied and server_started on production loopback.
HTTP smoke passed database readiness, compiled assets/headers, API origin/body/
error boundaries, private catalogue/progress/export/preset refusal, disabled
provider/legacy routes, signed-out behavior and unauthenticated owner-notification
refusal. Script SHA256:
ddc1262348e91825f2dc0ea92527c2f291d220270bb0b1fad37a2f7effe9cfca.
Reported nonRoot/providersDisabled/databaseReady/compiledClient true, terminal exit 0.
No actual browser/customer account or TLS/proxy/cookie path was exercised here.

Actual inspected restrictions: UID/GID 1000, read-only root, cap-drop ALL,
no-new-privileges, one CPU/512 MiB/memory-swap 512 MiB, V8 old-space 320 MiB, 256 PIDs,
bounded noexec/nosuid temporary storage, no public ports. Registration,
notifications, mail worker/retention, deletion, automation and legacy flags false;
outreach paused, proxy trust false. These are observed fixture restrictions,
not deployed-host enforcement or capacity evidence.

Stopped runtime emitted shutdown_started/shutdown_completed, exit 0/no OOM.
After the runner exited, both schemas returned zero aggregate rows across
users, audit_events, account_sessions, account_mail_jobs, prospects,
outreach_records and workspace_presets. This does not assert every table was
empty: migration and shared control rows can remain. Exact ownership/network/
no-ports/tmpfs/no-persistent-mount checks preceded stopping the owned database.
It exited 0/no OOM, discarding only its temporary synthetic data. No old app or
database was touched. Images, stopped containers and synthetic secret fixtures
outside the repository remain for replay, not as deployment credentials.
No active runner or labelled QA container remains.

## Same runtime: fresh connected browser acceptance

A separate fresh fixture (r5) subsequently qualified these two browser flows
against the exact runtime image above, using its unchanged default migration/app
command, no application mounts, Node 22.23.3 and production mode. Browser plugin
not available; frontend-testing-debugging used existing isolated Playwright 1.62.1
and Chromium 148.0.7778.0, with no dependency installation or provider requests.
The cached QA image's older application was never started or served. Its Node
22.23.2/browser dependencies are test tools, not the production runtime.

Ten customer stages passed: registration's unverified gate; explicit database
verification fixture; candidate intake with provenance/idempotency; profile
correction evidence; human draft review/approval; revision invalidating previous
approval; opt-out blocking UI and real HTTP drafting; cancellation preserving
history; logout revocation/second-owner isolation; login restoration; and an
actual coordinator restart preserving the session, history and opt-out state.
Registration and verification share the first stage; the total is ten, not eleven.
Four saved-defaults stages passed: real login/entry; pending edits, explicit
review/save and durable reload; explicit search/template application with fresh
review after edits; and mobile controls with pending-removal discard followed by
explicit removal/save. The defaults fixture removed only its own third account.

Both browser runners exited 0 with no OOM, console warnings/errors or external
requests. Page identity, meaningful content, no framework overlay and real
interactions were checked. Desktop viewports were 1440x1000 and 1365x1000; mobile
was 375x812. Four screenshots were inspected: readable modal/template text and
controls, no horizontal overflow in the checked mobile flows. The defaults
full-page capture includes the sticky header at its scrolled position; it is
not a claim about every scroll position or every supported viewport.

Exact r5 identities, all labelled codex.qa.owner=014-startup-browser-20261002-r5:

- Runtime: 337191e7cfcd823797ed01ab193c6230e13af8208c74a5b0f5f59277cd3ddf8d.
- MySQL: d7c883f4cade673fd6b66dc0f3207a0364abf54a7b056b8f6171adab6b1974a7.
- Customer runner: ab833cfd1ff51456beebca5c92a20402b70359f431ba3ac90a6fa63bab953a11.
- Defaults runner: 99fac7e7d9c09860c3130046e66ce0914247f994f6bcc1305e47908af2f9b323.
- Browser image: sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326.

App used loopback http://localhost:13014 in the database's network-none namespace,
no public ports, no mounts, UID 1000, read-only root, dropped capabilities,
no-new-privileges, one CPU/512 MiB/256 PIDs and bounded noexec/nosuid temporary
storage. Only this synthetic fixture enabled registration and unpaused outreach
for UI testing. Notification/mail/retention/deletion/automation/legacy flags
remained disabled, proxy trust false. QA browser runners used separate two-CPU/
two-GiB/512-PID bounds and executable temporary storage with Chromium no-sandbox;
this is not browser sandbox, deployed-host or production-capacity acceptance.

Actual app logs show migration/startup and completed shutdown both before and
after the real restart. Final app exit 0/no OOM. Before DB shutdown, aggregate
counts were two users, one prospect, two unsent outreach versions, zero saved
defaults and zero confirmed sends. This fixture intentionally retained history
for restart checks, unlike the earlier r4 zero-count fixture. Exact ownership,
network-none, no-ports/no-mounts and tmpfs checks preceded stopping only this
database. It exited 0/no OOM, discarding its temporary synthetic records; no
customer data or unrelated containers were touched. All four containers are
stopped; images, stopped containers, scripts and screenshots remain for replay.

Scripts/screenshots are outside the repository at
C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/startup-browser-20261002-r5.
workflow.cjs SHA256 be808c6b2c6e1e5a0a048b0755c4d50b0a6aed84e81c81e90f2b1c4bfb29d746;
defaults.cjs SHA256 749242c453b47135ab85e0ec602d8e448d6e3c2712b8e0b7f39d60e9a0de20ff.
The saved-defaults browser run does not itself prove second-owner preset privacy;
that has separate packaged database tests. No real verification email, provider,
external recipient or external sending was exercised. App source/artifacts are
unchanged. Fresh root/operator regression: 133 passed, no skips, 2.45 seconds.

## Other evidence and open gates

All 133 root/operator tests passed, no skips (3.41 seconds, host Node 25). Retained
prompt traceability 116 Partial/zero Missing/zero Implemented, 12 required artifacts,
completionProven=false. Deployment-patterns skill separated build, connected
regression and bounded runtime proof; no phase promotion.

Other new-image customer/admin/export/recovery flows and full hosted acceptance
remain separately required; the two flows above do not cover the whole product.
Older 705185-image browser evidence is dated, not proof for these IDs.
Fresh-source security/privacy/license review,
committed/registry provenance, HTTPS/proxy/Windows/ngrok, current platform terms/
permissions, real mailbox/provider/recipient, capacity/recovery/rollback and
operator acceptance remain open. Worldwide coverage and every original phase
remain in scope. No deployment, send, publication, commit, push, merge, purchase
or permission change. EUR100/month remains planning-only.
