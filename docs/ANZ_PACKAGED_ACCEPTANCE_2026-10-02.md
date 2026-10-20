# ANZ catalogue packaged acceptance — October 2, 2026

This is local synthetic qualification of the current 53-record catalogue, not
deployment, provider permission, worldwide completeness or full release acceptance.
Selected source/build inventory: 531 files, 10,469,826 bytes,
`bedab7b495941df3599d4bcb7bae3f312777d1ee6604291417480eacb961a0e9`.
Inventory provenance/acceptance flags remain false; its declared scope excludes
root operator scripts, documentation and image dependencies/layers.

## Fresh images

Unmodified Dockerfile targets built successfully with terminal exit 0. Runtime
build session 13025 included type checking, 807 unit tests in 80 files with no
skips (92.76 seconds), compilation and production dependency pruning. Pruning
reused 546 packages with zero downloads. A first `--network=none` build failed
at Corepack's package-manager download; normal networking reused the dependency
install cache. This is not clean-cache/offline supply-chain acceptance. No base
version, lockfile, product guard or test deadline was changed.

Pinned Node base:
`node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`.
Dockerfile SHA256 remains
`1d0312526228e7924dc9885115cf045834cde4843bfdaa49e2254fcf9f789fc0`.

- Runtime tag `cofounder-local-anz-runtime-20261002-r1`, local image identity
  `sha256:80da7dc08f6c1410b8d119ba97ca8f75ea0991b9f1af0b2ae89191107337d248`,
  223,464,292 bytes.
- Integration-test tag `cofounder-local-anz-tests-20261002-r1`, identity
  `sha256:718108271e6a9965d368a488ff2c618e448abbec7b344c9844b995abf2ae018b`,
  280,437,514 bytes.

These are inspected local Docker image identities, not published registry digests
or signed provenance. An initial fixture referenced the build's config digest
instead of the inspected image identity and failed before creating any container;
correcting the harness did not change the product.

Both exact images passed network-disabled/read-only artifact probes as UID1000 on
Node v22.23.3. Compiled dist and migrations match: 116 files, 6,857,848 bytes,
SHA256 `1567de40692c5067d53435a2350e313110f12fc9ae92cc1412b068f466b4000c`.
Probe `outputs/language-packaging-20261002-r1/artifacts.mjs` was mounted read-only.
Runtime source, .env and tested development-tool paths were absent. Equality is
limited to dist/drizzle, not dependencies, entire image layers or reproducibility.
Old images and their historical receipts were preserved.

## Production runtime and authenticated catalogue HTTP

Session 33616 completed with terminal exit 0. Runtime ran its normal migration/
startup command against a separate fresh synthetic MySQL database. App and DB
shared only the DB's network-disabled loopback namespace; no host ports. Runtime
used UID1000, read-only root, cap-drop ALL, no-new-privileges, 2 CPUs, 2 GiB with no
extra swap, 256 PIDs and 64 MiB noexec tmpfs. Two read-only probe mounts contained
only QA/operator scripts; no application source, compiled host dist or host
dependencies were mounted. Synthetic credentials are not secret-manager acceptance.
Registration, provider/legacy/owner/mail/retention/deletion workers were disabled;
outreach remained paused.

The existing production smoke probe passed readiness, compiled assets, tested
security headers, anonymous/origin/provider and malformed/oversized refusals.
An additional real-HTTP probe seeded one preverified synthetic local owner, signed
in with its real password, fetched exactly 53 catalogue records and confirmed
startups-nz, fishburners-australia and fiji-innovation-hub remain discovery-only
with every integration flag false. Actual candidate-intake requests for each ID
and for a manual-labelled URL were refused with 403 (six requests); owned candidate
count remained zero. Anonymous access and replay after actual logout returned 401.
No RPC mocks, browser claims, external requests, member profiles or real sends.

Owned suffix ba686430, independently inspected stopped/exit 0/no OOM:

- Runtime `83cbc390836b1d75c13a85af773651481d8d1d24d3821b9234c908a0164f273a`.
- DB `d9f04ebfc8adb4f4a8ee48032c5d4f373b0e654547500975ecb4f5291b1b7968`.

MySQL image
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
DB used UID999, read-only/cap-drop/no-new-privileges, bounded resources and 1 GiB
ephemeral data plus bounded runtime/temp tmpfs. Stops verified exact owned IDs,
fixture labels and empty port bindings. Ephemeral synthetic data were discarded;
containers/logs/images remain for inspection.

## Database suite

Fresh required database suite completed in session 14608 with terminal exit 0:
724 tests, 43 files, no skips, 247.27 seconds (251.854 seconds attached-command
wall time including migration/startup). Exact integration image ran its normal
`pnpm db:migrate && pnpm test:integration` with REQUIRE_DATABASE_TESTS=true,
synthetic migration-root credential and no source/dependency mounts. Runner used
its disposable root/writable layer for Corepack/Vitest, dropped capabilities,
no-new-privileges, 2 CPUs/2 GiB/no extra swap/512 PIDs and 256 MiB noexec tmpfs;
that is not non-root runtime-hardening acceptance. Its separate DB was UID999,
read-only/network-none with 1 GiB ephemeral data; a mid-run observation showed
375 MiB used, 650 MiB available. No test deadlines or capacity guards changed.

Owned suffix 7ef2aace, stopped/exit 0/no OOM:

- Test runner `b0e0f77f1bd8c2ec1d3d6c5c0a584aad750ed72cdaa2b9365f9c2ba065632022`.
- DB `a58ab07c9144d66ba53a74e3cabbe3b40e38af8d3a50da6d0ca4a2d95385cfff`.

Neither this application suite nor HTTP smoke proves the separate operator
database-readiness/recovery integration fixtures or any live provider acceptance.

## Current-runtime connected browser qualification

Final browser session 74825 passed 14 connected stages with terminal exit 0.
It repeats the prior 13-stage conversation/export workflow against the new exact
runtime, adding the current catalogue: 53 records, three new aliases resolved,
correct external-link href/target/rel inspected without opening providers,
Not connected labels, expandable evidence limitations, category exclusion/empty
state and restoring all categories. Real login and all local RPCs used the
synthetic database; no response mocks. A first run also passed 14 stages; the
final run adds first-viewport desktop/mobile captures without product changes.

Actual individual intake, original draft review/approval/manual preparation,
synthetic user-confirmed completion (NOT message delivery), future reminder,
response acknowledgement and closure retain conversation history. The browser
checks reminder account isolation, password/explicit-checkbox export admission,
actual private JSON download with owned active/archived/opt-out candidates and
closed outreach history, tested foreign/password/session-secret exclusion,
wrong-password refusal, account mismatch/anonymous refusal and >20 MiB oversized
export without a partial download/additional success audit. Four deliberately
expected 403/413 console diagnostics are checked explicitly; zero unexpected
console/page errors and zero external requests. Synthetic owners are preverified
in the DB, not mailbox-verified. No browser network contacts leave the fixture.

Environment: localhost13216 inside the network-disabled DB namespace, desktop
1365x1000/mobile375x812, Node22.23.2/Playwright1.62.1/Chromium148.0.7778.0 from
cached QA image
`sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`.
Browser plugin/skill pair absent; frontend-testing-debugging skill used regular
Playwright fallback. Page identity/nonblank/overlay/console/interaction checks
pass. Workspace, filtered catalogue, conversation and export screenshots were
actually inspected. Asserted mobile states have no horizontal document overflow;
long catalogue/export content scrolls vertically, scoped screenshots do not claim
the entire page is visible. No full keyboard/accessibility, browser-diversity,
all-timezone, every-state or full load acceptance.

Application has no mounts; DB/runtime/QA use read-only roots, cap-drop ALL,
no-new-privileges, bounded 2CPU/2GiB/no extra swap/256PIDs and no public ports.
QA alone mounts external script/screenshot outputs and needs executable 512MiB
tmpfs for Chromium; browser no-sandbox is limited to this isolated test fixture.
Runtime tmpfs remains noexec. Manual preparation is explicitly enabled ONLY in
this self-created fixture (OUTREACH_PAUSED=false); provider/legacy/mail/retention/
deletion-request intake is disabled. No production unpause or real sends.

Final owned suffix 2a76e722, independently stopped/exit0/noOOM:

- Browser `41b425eb3dd14b2db51e13b6f568ad8996e0facb4772d017288653a841a0634d`.
- Runtime `f55ea274b75b7162704408fa6e317feb6c3c557829a4bc6478b705110dce674f`.
- DB `4189b20eddbb4012c5d67d9436921221ba18d6dc61cd2e91a27af07a36b82d0a`.

External scripts/screenshots: `outputs/anz-browser-20261002-r1`.
Runner SHA256 `1e4795397d270c713ef1225d796c6e6850269624c7a8d6fa4da053c9cbecdde8`.
Browser SHA256 `7f88e9e0622f727e5696fbd98d961137a6e1e61453c455a65a29b58e68e08b73`.

## Current-image encrypted recovery rerun

Session59214 completed one full-schema encrypted backup/restore integration test,
no skips, 35.2966342-second test/35.3909528-second total, terminal exit0. Set exact
RECOVERY_TEST_APP_IMAGE to the new71810827 test image and RECOVERY_TEST_RUNTIME_IMAGE
to the new80da7dc0 runtime; MySQL tag resolved to the same b3b90af2 local identity
before fixture creation. The unchanged operator recovery script and test retain
their earlier hashes below. No application/source/dependency mounts; the restored
production app mounts only a read-only HTTP probe. Deployment-patterns skill
guided keeping isolated recovery distinct from hosted/operator acceptance.

Verified full current schema/index/migration-ledger and binary/UTF8 fixture data
round trip; corrupt ciphertext, incorrect target identity, enabled scheduler,
server-wide privileges, grant delegation/active roles and non-empty targets refuse.
Windows backup wrapper also runs. Three restored session history rows retain
identity/owner/creation, future sessions expire and admin step-up clears; a past
expiry remains past. The real restored production HTTP app admits two synthetic
password logins, scopes each owner's candidates, refuses cross-owner/anonymous
access and revokes sessions on logout. This does not capture/replay a pre-backup
cookie or reconcile all password/recovery tokens, erasure/suppression decisions,
provider queues and external mail/events after an actual disaster.

Owned suffix8a513222, independently stopped/exit0/noOOM:

- Source `a2cf01290f397eb23d536cc0d27970736a5c09dc8f38274008653a1313689c65`.
- Target `39b5795439bd4de69e5d91d8f45f68e26357582abfccb156648b9a91ef0f0ca5`.
- App `61662cf8d8a0bad021e287921581297d971cff127b71281c334721db82bf8687`.

Exact labelled network-none databases use UID999/read-only/cap-drop/nonprivileged
bounded resources/1GiB temporary data. Restored runtime UID1000/read-only/cap-drop/
nonprivileged,2CPUs/1GiB/no extra swap/
256PIDs/64MiBnoexec tmpfs, no public ports, outreach paused/workers disabled.
Temporary mkdtemp encryption key/snapshot/corruption fixtures were removed by the
test's cleanup; only disposable synthetic data were lost, containers/logs retained.
No live test handle remains.

Operator script SHA256
`2bc9ae77d5b4f9e4493cf86ffeb0a2ea89e764f9b265611cd0135e5629a3a6c4`;
integration test
`f5575551d1581377e8fb34943457663c495d5417a9c9d7bfb2965da1ab701a10`.

After documentation updates, all136root/operator unit checks passed without skips,
2.6433079seconds/exit0. Traceability remains valid/116Partial and whitespace checks
pass; selected source inventory reinspection matches bedab7b4... unchanged.

## Probe provenance and remaining limits

External scripts under `outputs/anz-packaging-20261002-r1`:

- database.mjs: `6c1c0a657c817400480db9544913b654d14047a697c0261d5ffb837ee73c071b`.
- runtime.mjs: `e593bb35ad479527fba0aef94f14a6d063a3269bc47a2e98dc1db9edf3bbacdd`.
- catalogue.cjs: `36d4910c54e5d04488b79a488bdc1a30c62be02d649bc2a107bdb336a4c3239e`.

Deployment-patterns skill guided pinned/non-root packaging and evidence separation.
No commit, push, merge, publication, deployment, account creation with providers,
purchase or real outreach. EUR100/month is a planning ceiling only. Current-image
browser and recovery checks above cover their explicit flows, not full release
acceptance; old receipts do not automatically qualify new bytes. Hosted TLS/mail/load,
controller/support identity, platform permissions and worldwide coverage remain
open. Original goal traceability remains 116 partial, completionProven false.
