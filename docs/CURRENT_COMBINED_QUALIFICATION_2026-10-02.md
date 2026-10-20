# Combined current qualification — October 2, 2026

Status: **bounded local package checks passed; not an approved public release**. No public deployment,
publication, merge, purchase, real outreach or provider action occurred.

This historical checkpoint is now superseded for current application checks by
[the fresh CSV-recovery package receipt](CURRENT_CSV_PACKAGED_QUALIFICATION_2026-10-02.md).
Its results and failures are separate; do not transfer acceptance between images.

Subsequent application change: VerifyEmail account-failure guards/retry and its
tests changed after the package receipts below. This dated package remains a
checkpoint, not qualification of the latest application source. Current focused,
build/browser and broader test evidence is in
[the verification fix receipt](VERIFICATION_ACCOUNT_FAILURE_2026-10-02.md).

Subsequent root-only UI-audit tooling added a snapshot/drift gate to the manifest
and declared CI. Application/dependency bytes were not changed, but root build-
input hashes differ: current selected inventory48264d89... versus c786f164... below.
161root tests/11files/no skips4223.0183ms passed. Do not use these dated image
receipts as a source-to-build attestation of the newer manifest/CI checkout.
See [current UI inventory and semantic-review limits](UI_ACTION_AUDIT.md).

## Confirmed current evidence

Fresh runtime-target build command:
`docker build --progress=plain --target runtime -t cofounder-local-export-language-runtime-20261002-r1 .`
Execution41941 is now terminal, exit0. The build observed the pinned Node22 base in the
existing Dockerfile and reused the frozen-lockfile dependency layer. This is not
a clean offline dependency-install or reproducibility proof.

The current build completed typecheck, all **903 unit tests / 88 files / no skips**
(110.03 seconds), and production compilation (Vite 7.3.6, 7.20 seconds).
Compilation includes the 60-record catalogue and the newer progress, composer,
manager, review/manual-action queue and private-account-export language controls.
Unit cases include both pure/mocked tests and bounded real local process tests;
this count is not proof of all original phases, live integrations or deployment.

Production dependency pruning completed with546cached packages/zero downloads;
the complete build step took657.6seconds. Final runtime dependency copy took37.1s,
dist1.7s/drizzle0.8s, image export/unpack58.1s. Local runtime image inspected as
`sha256:d8e17b4fe6ad7be1a413c69ef17605d21f9891b02cf9d575b4762d3cda8d9196`,
223,493,465bytes, configured user=node. Neither the tag nor this local identity
establishes registry availability, signature or committed-source provenance.
Do not inherit the older c0dae360 image's database/browser/recovery receipts.

An initial tag-based read-only artifact observation completed in85613, exit0.
It was then repeated using the exact inspected runtime identifier at the start
of24346:Node22.23.3/UID1000,115dist+drizzle files/6,935,013bytes/digest
`5e2c54a6e10b17945ee3f3e1ae7d51d9cbf2b1537aef71af189422cc297fc73b`.
The probe confirmed listed application-source/.env/development-tool paths absent.
This is selected compiled/migration-file evidence, not all dependency/layer secret
scanning or complete provenance. Its external acceptance helper was mounted
read-only, network disabled, not an application replacement. Self-created probe
containers were automatically removed; no user data/container was deleted.

Current host checks independently passed **154 tests / no skips / 3402.423 ms**
(execution 20fd1e): release-test contract, original-requirement traceability,
budget-plan checks, monitor declarations, recovery safety, production config,
tunnel-launch controls, support-bundle privacy, selected release inventory and
API structural audit. They do not prove hosted monitoring, actual budget
enforcement, external inboxes, provider permissions or remote encrypted recovery.
API snapshot is the current 151-input/165-operation inventory with digest
`9b92862fe808c2c9f61ac0ff2fe4d6ab60ac2f6158719daae826eeb295f9747e`.

## Live observations and pending work

Read-only capacity observation under handle 15248 is now terminal, exit 1:
Docker's `/system/df` request returned HTTP 500 from the local Linux-engine pipe.
The message suggests checking API support, but does not prove a version mismatch
or the underlying cause. Its host drive observation reports 25,590,853,632 free
bytes; an earlier direct drive query reported 24,674,791,424. These are host values,
not proof of Docker's internal filesystem capacity. A separate Windows memory
observation reports 30,182,708 KiB total and 2,647,964 KiB free; no causal conclusion
is drawn. Despite this diagnostic error, the existing build41941 progressed and
completed successfully without restart. Integration-test build24346 is also
terminal, exit0 (Vite19.44s). Exact image
`sha256:a187faca8dfbfa32efbe751b34caf507ea625f1f123a95ead85f433957edf0dd`,
280,702,832bytes, passed the forcedUID1000/network-none/read-only artifact probe:
same115files/6,935,013bytes/5e2c54a6...digest as runtime. This is selected compiled/
migration parity, not all source/dependency/layer equivalence. An optional-User
metadata template failed because test-image config lacks that field; separate
identity/size inspection succeeded. Test images are not production runtimes.
No Docker restart, settings change, broad cleanup or unrelated container action
has been performed.

Prepared external fixture directory:
`outputs/current-combined-packaged-browser-20261002-r1`.
Its runner removes both local compiled-application replacement mounts and checks
that the tested runtime has zero mounts. It accepts only an exact SHA256 image
identifier. Both artifact probes and the new-image browser passed below.
Browser uses actual HTTP/RPC/database and the retained 21-stage workflow,
including current catalogue searches and Dutch private export.

- Runner SHA256: `63c3240f97befb5b013eccb60a3d3d5b300dd2b4748edc901ac43588be3dc919`.
- Browser SHA256: `1799a492c0956275865f3c18eb5fbba94ae6c2569ce454bc950c8306539c6cf4`.
- Artifact probe SHA256: `33b12ccbce301b24989c80bd5e65b190d46cc15150fcf5e8b11ab436b66b3ea9`.

Deployment-readiness guidance selected fresh package identity and scoped acceptance
over inheriting old receipts. Frontend-testing guidance will use existing isolated
Playwright because Browser plugin/skill are unavailable, without installation.
No new React edits are part of this turn. Current bounded browser proof is below;
this does not establish all responsive/browser/accessibility requirements.

The new-image mandatory database suite, encrypted full-schema recovery and
current database-readiness rehearsal have passed below.
Keep these resource-heavy stages sequential and inspect owned fixture cleanup.
Current older receipts retain their dated scope. Hosted/operator/privacy acceptance,
native-language and worldwide source completeness, full original requirements and
publication remain open. Current branch is agent/public-saas-beta, not main;
HEAD 89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb is not an attestation of dirty files.
The requirement verifier reports all116 phases Partial and completionProven=false.
EUR100/month remains planning-only, not purchasing or deployment authority.

## Newer root inventory hardening while packaging remains live

The selected release inventory now includes root `.npmrc`, which Docker copies
before dependency installation. Its bytes affect the digest; missing or linked
configuration is refused. Only length/hash are emitted, not configuration values
or token contents. Other/global configuration, environment, root operator sources,
docs, dependencies and image layers remain outside the selected inventory; this
is not a complete build-input attestation, secret scanner or signed provenance.
The actual package-manager configuration, application sources, dependencies,
Dockerfile and running build were not changed by this root audit-tool improvement.

Two new cases verify config hashing/change detection/missing-file refusal/no
content reflection and a linked-path refusal. Initial run16pass/1failure could not
create a Windows file symlink without privileges. The fixture now uses an
unprivileged directory junction on Windows (fixed inputs must be regular files),
and a real file symlink elsewhere. No guard or privilege changed; actual Linux
file-symlink execution is not proven by the Windows run. Final current operator/
API suite:156tests/no skips/7190.3784ms, exit0, across the same ten root suites.
The previous154 result remains a prior checkpoint, not the latest count.

Selected host inventory now540files/10,651,167bytes/digest
`c786f16472d20ecf22fb265291290cf7828fec454c9e6460a005d3d0170c14c6`.
Root .npmrc is116bytes, hash
`6c4181d5fbfaf0a15cb90995a49dfca26eda8aa38e4f0fcf26d0a64c2412f8b1`.
Inventory tool hash `1fa14a22870d12a2146ffe09d117c9c2c08f3f279935c6a6c1c66f0ce486bd50`;
tests `91bde200327958d612bd91e57208b2fe0c4e1afec0d00b21bff71e0fefda685a`.
Existing dated539-file receipts retain their older selection scope. Formatting and
whitespace checks passed. No full packaged/database/recovery success is inferred
from this audit change; browser acceptance is independently recorded below.

## New immutable connected-browser and Linux inventory acceptance

Browser86028 terminal0/suffix7564c1b0:21stages passed on exact runtime d8e17b4f...
with zero application, compiled frontend/backend or dependency replacement mounts
and zero public ports. Exact QA69de0b53.../MySQLb3b90af2... unchanged from the retained
bounded isolated fixture. ActualHTTP/RPC/database, zero RPCmocks, unexpected errors
or external requests; four exact expected password/size refusal diagnostics.
One synthetic past-manual-action declaration, no real sending or inbox acceptance.
Registration/mail/retention/deletion/automation/legacy routes disabled; outreach
preparation enabled only for this synthetic network-isolated fixture.

Flow: synthetic sign-in →60-record catalogue/name/native-geography filters →
human-declared candidate/corrections/assessment →Dutch draft review/approval/manual
preparation/fresh exact-text copy/explicit past-send declaration →reminder/response/
closure →archive/restore/opt-out/private progress →Dutch private export wrong-
password refusal/one JSONdownload/language-retained review and notices →cross-owner/
anonymous refusal →revision/cancellation retaining history →oversized-export refusal
without a partial file. Exact original Unicode notes and credential exclusions
checked in downloaded JSON. Not legal access-response or actual erasure acceptance.

Frontend-testing guidance used isolated existing Playwright (Browser plugin absent),
URLhttp://localhost:13216/outreach, Chromium148.0.7778.0; desktop1365x1000/mobile375x812/
tablet768x1024. Desktop export, mobile export actions, mobile catalogue and mobile
review-queue captures visually inspected: readable/wrapping, no overlay/horizontal
overflow, normal scrolling for tall warnings/cards. Other captures exist; this is
not complete screen-reader/all-browser/all-workflow accessibility. No new frontend
edits or dependencies were made in this qualification turn.

| Required browser check | Result                                                       |
| ---------------------- | ------------------------------------------------------------ |
| Page identity          | Actual /outreach, CoFounder Outreach title                   |
| Meaningful content     | Workspace/catalogue/forms rendered                           |
| Framework overlay      | No Vite error overlay                                        |
| Console health         | Zero unexpected errors, four exact expected refusals         |
| Screenshot evidence    | Current desktop/mobile captures inspected                    |
| Interaction            | Actual catalogue/candidate/draft/history/private-export flow |

All3owned fixtures independently inspected stopped/exit0/noOOM:

- Browser `0a840936e8e9b26175713061a08f3cac5838a2dd4da587dca500d486e479baa7`.
- Runtime `7cbd8d2872b70d5eb4bca5015e26be4b13a801162e389ac3ed9e291c969cd9da`.
- Database `b7669950ebf0c6d3af847cb495eb494f059a5d9596e9b7e395dd66de03f21676`.

Exact new test-imagea187faca... separately passed17inventory tests/no skips/
555.963965ms under LinuxNode22/forcedUID1000/read-only/network-none, including an
actual file-symlink refusal, not just Windowsjunction fallback. Its self-created
temporary fixture/container was removed; no user data/backup deleted. Ten selected
host/test-image source hashes matched:root.npmrc, inventory tool/tests, account
export, language selector, review queue, manager, composer, progress and catalogue.
An initial observation incorrectly named OriginalMessageComposer.tsx and failed
ENOENT; corrected discovered OutreachComposer.tsx path passed the unchanged bytes.
Neither path-probe error nor optional-user metadata-template error is app failure
or passing acceptance. Subsequent database/recovery evidence is recorded below;
no public release or production-readiness claim is made.

## Mandatory database qualification passed on exact new test image

After browser cleanup inspection, the retained mandatory database fixture ran
under17486 with exact testa187faca... and FORCE_TEST_FAILURE=false. It is now
terminal exit0:724tests/43files/no skips/279.78s; helper elapsed285.185s. Real
migrations completed. Existing cold-process/restart/concurrency, ownership, quota,
privacy, export, lifecycle, migration-lock and compiled-server cases passed within
their synthetic supported scope. This is not hosted fleet/load/provider/inbox,
all populated legacy-data or actual approved-erasure acceptance. Helper copied unchanged
to outputs/current-combined-packaged-browser-20261002-r1/database.mjs; SHA256
`f81d7fa7e07b1d9ee6a14e9eaec9f16b1a80da3b9202a89c647b321429bd82e9`.
It uses self-created isolated synthetic MySQL/test containers, no application/
dependency mounts/public ports, and no real customer accounts/provider actions.
Old724-test database/restore receipts were not inherited by these images.
Independent inspection confirms both ownedddede2ad fixtures stopped/exit0/noOOM:

- Test `022d7055461f3425fc740c79d6452fdf6a6a8d70923822bf13dccaad8001df94`.
- Database `1147551f3e44fe09b279e9d1faabf81d68e4d76ed534911e60d45718abd1cc6d`.

## Encrypted recovery passed on the exact new images

After that cleanup inspection, host fixture98254 started with
RECOVERY_TEST_APP_IMAGE=exacta187faca... and RECOVERY_TEST_RUNTIME_IMAGE=exactd8e17b4f...
and the unchanged recovery fixture/tool/probe. Execution98254 is terminal exit0:
one full-schema test passed, no skips, 39815.1278ms (total39896.499ms).
MySQL8.4 tag inspected as exactb3b90af2... before starting. Only self-created
isolated synthetic source/target databases and fresh temporary encrypted backup
files/keys are in scope, no real backup/customer data or external service.
Fixture SHA256`f5575551d1581377e8fb34943457663c495d5417a9c9d7bfb2965da1ab701a10`;
tool`2bc9ae77d5b4f9e4493cf86ffeb0a2ea89e764f9b265611cd0135e5629a3a6c4`;
application probe`c57fe9261e96d49fe903ea3c8de292abf074eb786f595e499ad382332d0294e9`.
The restored actual runtime passed two-owner login, owner-scoped candidate access,
cross-owner refusal and revoked-session checks, with zero provider actions. Full
schema/column/index/journal, binary and UTF-8 fidelity, source preservation and
corrupt/wrong-target/nonempty-target/unsafe-grant/nontransactional-table refusals
passed. Historical sessions were invalidated and elevated verification cleared.
This is not independent key recovery, off-host storage, production-scale recovery,
all customer workflows, real inbox acceptance or authorization for live restoration.

Independent inspection confirms the owned927c83fc fixtures stopped/exit0/noOOM:

- Source `46b3fa2408b3bb2e80487093762d976b6b4b51cb63cdd03dc799a2a8fe85269d`.
- Target `fb597aa4001065f1cd3b65a23786e549cff1519bcafd2a8f70bf614a8157d443`.
- Runtime `620515f7814a2ca36f8aa5bcc43dfb211652ba2d49af6ff9767a4466c6f930e8`.

Source/target inspected as exactb3b90af2..., runtime as exactd8e17b4f..., all
read-only/no public ports, databases network-none. Runtime shares the isolated
target network and mounts only its external read-only acceptance helper, not
application replacements. The fixture removed only its own fresh temporary keys,
encrypted snapshots and probe files; no real customer backup/data was removed.
Readiness80777 subsequently completed as recorded below.

## Current database-readiness rehearsal passed

Execution80777 terminal exit0: one test/no skips/31031.2686ms (total31116.4024ms).
It reads the actual CI, local Compose and integration Compose health commands,
checks authenticated TCP success and refuses wrong credentials, missing schema
and socket-only availability. Legacy ping false-positive cases also passed.
It does not start the application or demonstrate hosted ingress, alert delivery,
production infrastructure, sustained workload or a healthy deployed service.

Independent inspection confirms both owned fixtures stopped/exit0/noOOM, exact
MySQLb3b90af2..., network-none/no public ports/no mounts, same fixture label:

- Socket-only `20570d3e4c90`.
- Normal TCP `36798fed604e`.

This older readiness fixture uses bounded2CPU/1GiB/tmpfs database storage, but
does not inherit the read-only/nonroot/capability hardening of the recovery
fixture. Only its own temporary Compose environment file was removed. No user
database, backup, shared-host configuration, deployment or provider was changed.

The retained full requirement audit still reports116Partial/0Implemented and
completionProven=false. These receipts qualify the stated local checks, not all
original requirements or public production readiness.
