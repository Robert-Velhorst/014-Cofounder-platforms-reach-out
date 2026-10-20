# October 2 Hong Kong 64-source package checkpoint

Local isolated qualification, not publication or production readiness. New images
include the [64-source catalogue](PLATFORM_HONG_KONG_REVIEW_2026-10-02.md), without
replacement application mounts. Prior 63-source receipts remain historical.
All 116 Giant Prompt phases remain Partial; completion is unproven. No commit,
push, merge, deployment, provider action, membership purchase or spending occurred.
The initial EUR 100/month ceiling remains planning only (EUR 80 plus EUR 20 reserve).

Subsequent [pool-client fresh packaging](POOL_CLIENT_NODE22_PACKAGE_QUALIFICATION_2026-10-02.md)
includes the maintained load-helper regression in 987 packaged unit cases and
724 mandatory database cases. Its new image identities have their own acceptance
scope; the connected receipts below retain the original images shown here.

## Exact images and checks

- Installed runtime ID:
  `sha256:fcd5029cc0319bb31b05c7a94897829ea50cec5a1face1a4ad36c05ff28da6db`.
- Installed integration-test ID:
  `sha256:d9ab39cad85f8f5b8677f072a299c2671a7178e160e0b800eeb3a4697e3a102b`.
- Database ID:
  `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
- Both fresh Docker builds finished with terminal exit 0. Runtime build included
  typecheck, 985 unit cases in 96 files (106.95s), build (Vite 4.33s) and offline
  production-dependency deployment. No assertion changes, skipped gate or increased
  acceptance timeout. Test stage separately built current compiled output.
- Artifact parity passed: identical 117-file dist/drizzle inventories,
  6,992,219 bytes, digest
  `8ffd506d17f7571763fb65a27cb934c1899a65a9e0805b7d55b73e808b334aaa`.
  Both probes ran on Node 22.23.3 as UID 1000. Runtime source and development
  tools absent. This is byte parity, not source-to-build provenance attestation.
- Compiled server independently passed secret-safe invalid-configuration refusal,
  occupied-port refusal without fallback, actual liveness and clean TERM exit.
  Those probes bypass migration startup; the following separate check covers it.
- Actual default `node dist/start-runtime.js` passed locked-migration TERM/INT
  cancellation, preserving no DDL and the other connection's lock. Process closure
  and zero database waiters shared the unchanged absolute 3,000ms deadline:
  TERM 1,092ms; INT 1,269ms. Normal startup then applied migrations, returned actual
  HTTP liveness/readiness 200, and acknowledged parent/child orderly drain.
  Acceptance case 40,393.5946ms; whole command 40,542.3509ms, exit 0, no skips.
- Final host operator suite: 169 passed, no skips, 3,524.0417ms, exit 0.
- Selected host inventory before/after matched: 556 entries, digest
  `51bf4aeffa0f532a09091badbd911c4186b96b9196d6f35e0f9818f41876c7c1`.
  Documentation, root tools, dependencies and host state are outside its scope.

## Mandatory database suite

The exact new test image's default migration/integration command passed all 724
cases across 43 files, with no skips (299.69s; helper elapsed 304.351s), terminal
exit 0. Fresh temporary MySQL storage, no real accounts or external providers.
Both owned fixtures were independently inspected after completion: stopped exit
0, no OOM, no ports and no mounts; retained, not deleted.

## Receipts and isolation

Raw receipts retained outside the repository at
`outputs/hong-kong64-package-20261002-r1/`: runtime-build.log, test-build.log,
database.log, probes.log, default-startup.log, operator-tests.log and host-inventory.json.
The previous external helpers were read before reuse and took these new image IDs;
their old directory names do not transfer old acceptance. SHA256:

| Helper                                       | SHA256                                                             |
| -------------------------------------------- | ------------------------------------------------------------------ |
| database.mjs                                 | `f81d7fa7e07b1d9ee6a14e9eaec9f16b1a80da3b9202a89c647b321429bd82e9` |
| artifacts.mjs                                | `2615187cb1f27f311ed8744f23bec1f43bdebfa1d5a7c4a1cb22c347c6f2be21` |
| probes.mjs                                   | `c2c1fb7c41c01cde4979b0cf21f15f9ab33c128c90fd2203634650a972e7f860` |
| startup.mjs                                  | `167bc4022932605570d6859da42d5f1133ba60fae946262b0de72a51dad7c481` |
| scripts/runtime-startup.integration.test.mjs | `d6b47b585435557e81dc0826daba0cf3cd4ac55c0e317810977e8400f26c2c27` |

Three artifact/server probe fixtures and five default-startup fixtures independently
inspected: stopped exit 0, no OOM, no published ports, retained rather than deleted.
Production/default-startup app and database had no mounts; the holder and probe
helpers had only read-only helper mounts. Database integration uses no mounts or
ports, network-none database and a test runner sharing only its isolated loopback
network. Two CPU/2GiB limits and fresh 1GiB temporary database storage bound that
suite; all data and keys are synthetic. No shared service was stopped or replaced.

## Remaining acceptance

Subsequent connected browser checks are recorded below; native-script readability,
encrypted recovery and workload/load checks on these exact new images remain open. Previous
63-source evidence must not be relabelled as current acceptance. Real signup/inbox,
provider access/permissions, worldwide completeness, hosted TLS/capacity/alerts,
actual tax-inclusive pricing and billing safeguards, operator/privacy decisions,
publication and complete requirement-by-requirement acceptance remain unproven.
Deployment guidance informed exact-image identity, scoped synthetic fixtures and
the separation between local checks and release authority.

## Subsequent exact-image connected customer workflow

Frontend-testing guidance required real rendered interactions, console checks and
screenshot inspection. Its named Browser plugin and browser skill were absent;
existing isolated Playwright was used without installing dependencies. The flow
was login, catalogue search, restricted-source review, individual candidate
intake, original-draft review and human-assisted preparation, retained conversations,
reminders, opt-out, progress, export and uncertain CSV recovery.

All 24 workflow stages passed against the exact runtime above and its actual
default startup, fresh isolated MySQL and QA image
`sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`.
Chromium 148.0.7778.0; origin `http://localhost:13216` accessible only inside the
fixture network, no published port. Desktop 1365x1000 and mobile 375x812, selected
tablet 768x1024 and login 1440x1000 checks passed. Real HTTP/MySQL, zero RPC mocks;
one deliberate committed-import reply-loss fault, eight specifically expected
refusal/fault console diagnostics, zero unexpected console/page errors or
outside-origin requests. Page title/route, meaningful workspace, no framework
overlay and interactions passed. Synthetic preverified accounts bypass signup
and inbox; one synthetic manual-completion record is not a real send.

The new catalogue returned 64 records. Cyberport, 數碼港 and CSAA aliases selected
the same single card/canonical link, with no connect/generate/send buttons.
Corporate-access limits, HKD 400,000 existing programme obligation, unknown fees,
no import/outreach admission and privacy-not-reuse warnings were rendered. Tests
also retained previous alias, no-result, category-filter and safe-link checks.
Candidate corrections/reuse preserved source metadata; archive/restore and opt-out
preserved history. Help opened with null opener without losing the unsaved original
draft/declaration. Export required password/confirmation, omitted credentials and
other-owner data, and refused oversized output without a partial file. The lost
CSV reply replayed identical input without duplication. No actual contact occurred.

Main agent visually inspected Hong Kong desktop, mobile, scrolled restrictions
and Dutch mobile composer screenshots. English/Dutch text wraps readably without
horizontal overflow. **Visual gap:** Hong Kong Chinese names/aliases show missing-
glyph boxes in this QA browser even though Unicode search works. The cause was
not isolated between the QA font environment and application fallback; no native-
script rendering or native-language workflow acceptance is claimed. Mobile also
requires considerable scrolling through notices and long source descriptions;
this is usability debt, not a complete accessibility certification.

Raw log, browser/runner helpers and screenshots are retained outside committed
source under `outputs/hong-kong64-workflow-20261002-r1/`. Helper SHA256:
browser `e50b90d5945f59f77a10536d5ced4045fa718ecc5c12ecbac2d0bd31e37c7403`;
runner `cb576911df7f896b40e7df0fd0cd21e6e05b8bb8145decc68a54f16b5cf82c39`.
Three fixtures independently inspected stopped exit 0/no OOM/no ports, retained:

- QA `7292c50a7d598b11f4d6e76b0dc0b51c4154e0926a119915ce86b37e59748245`.
- App `5f5047d378547cabd75ed71d5b83f8f93bb2f09fd2ed41110ab486581450336a`.
- DB `9c617183bd30d4d1d347cc91069811839d8ae2b8adb9a27878fee989ea3f62a5`.

App/database mounts zero; QA only mounted its owned external helper/evidence
directory. Two CPU/2GiB bounds/read-only roots; network-none database with loopback
sharing only. Registration, mail, deletion and platform automation disabled;
manual preparation enabled only in this disposable synthetic fixture. No app
source edits, provider/signup/inbox acceptance, recovery/load rerun or external
write/spending. The original full goal remains open.

## Subsequent Traditional Chinese font diagnosis

The missing-glyph screenshots above remain historical evidence. A controlled
rerun kept the same runtime, QA image, application CSS, catalogue bytes and
workflow. The only rendering-environment addition was a read-only mount of the
existing local `C:/Windows/Fonts/msjh.ttc` into the QA container's system font
directory. No font copied into the application, download, dependency installation,
redistribution, host font configuration change or app replacement mount occurred.
This is local testing, not a claim of permission to ship that Windows font.

Main inspected the QA filesystem/package source: Chromium's packaged temporary
font configuration and system font directories are separate. The exact inspection
fixture ran network-none/read-only as UID 1000, exited 0/no OOM/no ports and was
retained (`26aeca081af90b15ca57b9e9a6011bd69d55a42403988d0bde70027967fc5146`).
The actual system-font mount, rather than a guessed CSS change or injected text,
resolved the observed Chinese glyphs in the unchanged app.

Two intermediate helper failures are preserved, not application fixes:

1. Initial font-use query failed with `Could not find node with given id` before
   registering the document with the browser inspector. No unexpected app errors.
2. After document registration, the font-use query succeeded but the helper
   incorrectly compared the font's Chinese family name with its English identifier.
   It reported `微軟正黑體` / `MicrosoftJhengHeiRegular`, three rendered alias glyphs.

The corrected helper checks the actual PostScript identifier and exactly three
glyphs for the 數碼港 alias. This uses the official
[font-use protocol](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/CSS.pdl)
and [document/node protocol](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/DOM.pdl),
not `document.fonts.check` or screenshot appearance alone. The inspector returned
84 Liberation Sans glyphs and three Microsoft JhengHei glyphs in the alias node;
the latter is a platform font, not an injected webfont. Main visually inspected
fresh desktop/mobile screenshots: 香港 and 數碼港 now display actual glyphs rather
than boxes, with readable wrapping and no horizontal overflow.

Corrected full run terminal exit 0: all 24 original workflow stages passed again,
including safe catalogue aliases, reviewed intake/drafting, retained opt-out,
private export and committed-import lost-reply recovery. Chromium 148.0.7778.0,
same isolated `http://localhost:13216`, desktop 1365x1000/mobile 375x812/selected
tablet 768x1024 and login 1440x1000. Eight exact expected fault/refusal diagnostics,
zero unexpected console/page errors, no framework overlay, zero external requests,
zero RPC mocks and zero real sends. One synthetic completion record, not delivery;
preverified accounts do not qualify signup/inbox. Browser plugin/skill absent,
so existing Playwright used without installing anything.

Final successful fixtures independently inspected stopped exit 0/no OOM/no ports,
retained:

- QA `00470e3321f374630a012b315e9190cef65ac87db762e2718ec127fd3e25a4b3`.
- App `78b4f4ec6201eb145d9c18b46c87b9b855a09a430637f05c2a1b9fab9ccd4a33`.
- DB `7705e34a85e6afd77d84bcd1e3d80e8afbc0f6f299fb8e091161bb83f99ba39f`.

App/database mounts zero; QA has its owned helper/evidence directory and one
read-only font-file mount. Failed-run app/database exited 0; QA exited 1 due to
the helper assertions, not OOM. Failure receipts/helper versions and final log
are under `outputs/hong-kong64-font-workflow-20261002-r1/` outside committed source.
Final helper hashes: browser
`84dab607b7237eaa907d536cecb8e2afbd3695d866157263392f6171429ac6f2`;
runner `6d33c209f41750afe19b882683831dd3ead37869b75d6721a2523c5824ab1596`.
Mounted font SHA256:
`1fd5fc7046e0eea753988ee06d1a5a731df68475614e2174fbba9b4800f392ac`.

This resolves the narrow QA-environment glyph issue for these sampled Chinese
strings when a suitable local font is available. It does not guarantee glyph
coverage on font-poor customer systems, qualify all scripts/browsers, translate
the source summaries, or test native provider membership workflows. Durable,
portable multilingual QA font provisioning and wider script/device acceptance
remain open, as do new-image recovery/load and full production acceptance.

## Subsequent exact-image encrypted recovery

Current root recovery CLI and harness qualified the exact new runtime/test images
above against MySQL `b3b90af2...`; the installed `mysql:8.4` ID was independently
confirmed, not assumed from the tag. Full rehearsal terminal exit 0, no skips:
one broad case 80,990.8545ms; command 81,100.6328ms. No application or operator
source changed, no increased timeout or test skip. Deployment guidance kept this
isolated evidence separate from hosted recovery/cutover authority.

Actual encrypted full-schema backup/verification and isolated restore passed:
schema columns, indexes, migration journal, binary values and UTF-8 retained;
view/procedure/trigger/event definitions round-tripped. View reads, procedure call
and trigger insertion were checked; event scheduling stayed OFF, and no scheduled
event execution is claimed. Windows backup wrapper was separately exercised.
Nontransactional-source, existing-backup replacement, corrupt ciphertext, wrong
target identity, original-source/nonempty-target, enabled event scheduler,
binary-logged target, server-wide grants, grant delegation and active-role
refusals passed before unsafe import. Source fixture data remained intact.

Restore expired old session/admin-step-up, password-reset, email-verification and
queued/in-flight account-mail authority while retaining historical rows/digests,
older expired timestamps, address binding, verified flags and terminal receipts.
Actual compiled runtime/default startup served restored data: two synthetic owners
signed in with original passwords, saw only their own candidates, received 403
for forged other-account scope, and logged out with subsequent session refusal.
Old reset and verification links returned the exact expected 400 refusals; the
pending account stayed unverified with no redemption audit.

The actual new **test-package** mail worker discarded four expired restored jobs,
then was idle. A throwing/counting transport guard observed zero provider attempts;
no new reset authority or delivery-budget reservation. Independent SQL verified
unchanged terminal/delivery history and retained user authority. This is not
compiled production-worker scheduling or real inbox/provider acceptance.

All 169 root operator cases passed (4,814.4476ms), no skips. Selected app/build
inventory unchanged at `51bf4aeffa0f532a09091badbd911c4186b96b9196d6f35e0f9818f41876c7c1`.
Raw recovery/operator logs and inventory are retained outside the repository in
`outputs/hong-kong64-recovery-20261002-r1/`. Current helper hashes:

| Source                                         | SHA256                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| scripts/database-recovery.mjs                  | `85819a0dbcc9d9bdfe9936704355e7f4ac4c4f1aed80e21f28f6da69bb418034` |
| scripts/database-recovery.integration.test.mjs | `e02c5afef68cf76ff3bbad3940983b041480ade5ad3d906ef983a0cbd0f08154` |
| scripts/recovery-application-probe.mjs         | `fd403ff2e9f17bfac54d6c529f2808fd8749289207ed739d03f72ee2b46ce8f2` |
| scripts/recovery-mail-probe.mjs                | `87e0b566827f3d81a982c6978145c05af3a0cae7f9151ef4047e903a285246d8` |

Four fixtures independently inspected stopped exit 0/no OOM/no ports, retained:

- Source `5ae46b10658699e19dfa3a392a858dbde4beeb51a627ca7320162492ea3d110a`.
- Restore target `8916e991ae526325b58840950f9d74e5be598acb38e541bffef8d2950370bb41`.
- Rejected binary target `4c6baed0b7e5f3063c81175f9e0a89a942baf868c4d784780f7ec5b406d83ec8`.
- Restored runtime `0aca4537f7aaf07271a317e41b6397711db34cbab63cb6511cea92f4955285b1`.

Databases network-none, two CPU/2GiB/1GiB temporary data storage; runtime UID 1000,
read-only/two CPU/1GiB, sharing only the restored database's isolated loopback.
Database mounts zero; runtime only a read-only observation helper, no app replacement.
Ephemeral migration/mail helpers and fresh synthetic temporary key/snapshot files
were cleaned by the existing harness; no user data, earlier backups or shared
containers were deleted. No provider, deployment, publication, purchase or spending.

This closes the bounded current-image local recovery checkpoint, not remote backup
storage/retention/scheduling, independent key recovery, production-sized RTO/RPO,
cutover or complete post-snapshot reconciliation. Later password/address changes,
deletions/suppression, historical verified status, delivery acknowledgements and
budget usage cannot be inferred from an old snapshot. Operator hold/reconciliation
remains mandatory before promotion. Exact-new-image load and whole-product/live
acceptance remain open; all 116 original phases remain Partial.

## Subsequent exact-image read/write load: incomplete

The fixed-resource run on exact runtime `fcd5029c...` above is **not qualified**:
command/runner terminal exit 1 during `same_owner_competing_writes`. Retained
failure is `fixture_or_protocol_error`; the last recorded response was candidate
details HTTP 200 with a result. This does not identify the failing assertion or
prove an application defect, transport failure, or failed wire overlap. Diagnosis
remains open; the generic failure receipt does not expose passwords, cookies,
SQL errors or private records. No assertion/threshold was removed or weakened.

The preceding baseline did pass its unchanged predefined checks:

| Workload                         | Requests | Result                                        | Successful-response p95 / p99 | Elapsed |
| -------------------------------- | -------: | --------------------------------------------- | ----------------------------- | ------- |
| Reads, concurrency 5             |    6,000 | 6,000 HTTP 200                                | 85.66 / 129.98ms              | 37.31s  |
| Reads, concurrency 20            |    6,000 | 6,000 HTTP 200                                | 340.81 / 519.24ms             | 42.34s  |
| Reads, overload concurrency 100  |    6,000 | 951 HTTP 200; 5,049 valid busy HTTP 503       | 1,465.37 / 2,660.68ms         | 13.73s  |
| Workspace writes, concurrency 5  |    6,000 | 5,000 HTTP 200; 1,000 expected stale HTTP 409 | 108.19 / 159.11ms             | 48.05s  |
| Workspace writes, concurrency 20 |    6,000 | 5,000 HTTP 200; 1,000 expected stale HTTP 409 | 390.04 / 560.75ms             | 48.37s  |

Normal read/write successful p95 limit remained 2,000ms. Overload acceptance is
orderly refusal, not 100 simultaneous successful users: even successful candidate
list/detail p95 reached 2,574.09/2,063.58ms in that tier. All baseline transport,
correctness and invalid-retry-header counts were zero; no automatic retries.
One hundred real HTTP logins passed (p95 581.21ms), followed by 600 warmup requests
and 300 cross-owner read denials. Synthetic preverified fixtures bypass real
registration, verification delivery and rights-based intake; no provider calls.

Each write tier included 3,000 committed edit/archive/restore changes, 1,000
unchanged replays and 1,000 stale conflicts. An independent MySQL reconnect checked
all 10,000 rows after each tier: 9,900 untouched rows and non-edited fields remained
intact, saved titles and archive state matched expectations. Per-owner/action audit
counts matched. These aggregate counts do not prove every event's causal identity.
The subsequent race's full persisted-row/winning-request audit checks and all
400 wrong-owner mutations were **not reached**; no completed-race count is claimed.

Actual app startup remained `node dist/start-runtime.js`, UID 1000, read-only,
one CPU/512MiB and 320MiB Node old-space. Only two read-only synthetic secret-file
mounts; no application replacement. Database exact MySQL `b3b90af2...`, one
CPU/2GiB with 1GiB temporary data storage, zero mounts. Runner used the same exact
runtime, one CPU/512MiB, fresh externally bundled current helper mounted read-only.
All fixtures shared only the isolated database loopback; no public ports. Mail,
registration, platform automation and owner notifications disabled; outreach paused.

Independent final inspection confirmed three retained owned fixtures stopped:

- Database `e574e93210a369f427d448079ce6e9d75a3158d178f161d48ae741febfa3e067`: exit 0.
- App `28562ae989af4289a22e87a1dbd42c65e1cb9f0cf94bb1143acdc4080bc84f1e`: exit 0.
- Runner `d7d1bd3039bbf98f21de397e25c18a1373e7b33d5a5be6c6f9bfd5c82d72e240`: exit 1.

No OOM or public ports. Shutdown discards this fixture's temporary database;
no user data, shared container or earlier backup removed. Final post-load HTTP
health/readiness and cgroup peak/event collection were **not reached**, so no
whole-run peak-memory or post-load recovery assertion is made.

All 15 focused harness cases passed (two files, 1.59s) and all 169 root operator
cases passed (4,916.8683ms), no skips; neither overrides the failed integration run.
Scoped selected app/build inventory remained 556 entries, digest
`51bf4aeffa0f532a09091badbd911c4186b96b9196d6f35e0f9818f41876c7c1`;
this comparison is not authenticated build provenance or production acceptance.
External evidence directory `outputs/hong-kong64-load-20261002-r1/` retains
`load-run.log`, `runner-events.log`, harness/operator logs and host inventory.
Fresh bundle SHA256 `9247e9dd4aa8e36210329bde90ac975374956b024c3aabcd3ff35f78f550753a`;
runner SHA256 `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.

Deployment-readiness guidance kept exact identity, fixed limits, storage checks
and partial failures explicit. No app source/dependency changes, publication,
deployment, purchase or spending. Competing-edit diagnosis/requalification,
open-loop/soak/representative whole-product load and hosted EUR 100/month capacity
remain open; all 116 original phases remain Partial.

## Subsequent load-client transport diagnosis

The failed run above was not silently replaced. Two full diagnostic replays kept
the exact app/database images, fixtures, resource caps, deadlines, thresholds and
no-retry rule. Only externally bundled helper failure reporting changed; no
application replacement mount or provider action.

Replay r2 passed both normal read tiers, both workspace write tiers, all 200
different/identical paired-edit races and independent 10,000-row/200-winning-request
audit checks. All 400 wrong-owner mutations were refused, with all 10,000 rows and
6,200 audit rows unchanged. However overload recorded two transport errors among
6,000 requests (901 HTTP 200, 5,097 valid busy HTTP 503): terminal exit 1. The added
failure-location probe did not fire because those errors were counted within the
overload tier, not thrown by the competing-edit phase. This does not retroactively
identify the original r1 race-phase failure.

Replay r3 added bounded diagnostic error codes and connection-state booleans only,
never request/response contents, credentials or raw error messages. It also passed
both normal read/write tiers, all 200 paired-edit races/audit receipts and 400
wrong-owner mutations. Overload again failed: 923 HTTP 200, 5,075 valid busy HTTP
503 and two request-boundary `ECONNRESET` errors, both `reusedSocket:true`, at
8/9ms. No timeout/envelope failure was observed for those two requests. Terminal
exit 1; neither failed replay qualifies the complete workload.

The reviewed [Node 22 HTTP documentation](https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/http.md)
describes resets during unfortunate reused-connection closure and peer-hint
expiry. Its [agent implementation](https://raw.githubusercontent.com/nodejs/node/v22.x/lib/_http_agent.js)
starts `agentTimeout` from the configured timeout or zero; a positive shorter
server hint reduces a positive configured timeout, but not zero. The custom
synthetic agents lacked that finite timeout. A real loopback HTTP regression
reproduced this narrower defect in 48ms: server advertised five seconds, yet the
returned pooled socket had timeout zero. This is evidence about client pool
configuration, not proof of the precise peer-side cause of r1's failure.

Added test-only `scripts/synthetic-http-agent.ts`, used by both original and second
actor connections, sets a 10,000ms pool timeout. Node can then apply the shorter
peer hint. Keep-alive, one socket per actor, real loopback source addresses,
independent competing-edit connections and per-request 10-second deadlines remain
unchanged. No automatic retries, error swallowing, app server timeout change or
threshold relaxation. Added real-HTTP regression fails before the correction and
passes afterward; all 17 focused cases across three files passed in 879ms,
and full TypeScript check exited 0.

A separate isolated probe importing the actual freshly bundled factory passed
on installed runtime Node 22.23.3: real server hint five seconds, pooled expiry
4,000ms, second request reused the same connection, exactly two requests, zero
automatic retries. No mock and no external port/network. Its ephemeral owned
container was removed by normal `--rm`; no retained load fixture or user data
deleted. Full corrected-workload acceptance is recorded separately when terminal.

Both failed diagnostic runs' three owned fixtures were independently inspected
stopped, no OOM/public ports: runner exit 1, app/database exit 0. Retained:

- r2 DB `fd9a86ab51755634cb940e55fe1cc995db5a1dd6bd9ca1a95f33331c34775689`,
  app `1edc5550d42fd75c03c6fb3dc2191bccf66901f7dc5432858884d72bf29f27bf`,
  runner `b959b37915a9486ac6ee34aa09117c9ce052b0f7b2a71022ed7d6037a9bfc1dd`.
- r3 DB `4eee64fd2e2b44190071551a3f07decfea88ad30cff5fb916522477dda8d2e4e`,
  app `83d6f6958bca188667f51b2f447e8c06a869fe6d0288b8ab308fcc88f76106dc`,
  runner `8c15a2ae71e82de450d8c29fd686ec0ac4c690ef3d30cfa2e40e9c08a832e506`.

Failure logs/bundles are retained under external
`outputs/hong-kong64-load-diagnosis-20261002-r2/` and `...-r3/`, explicitly
diagnostic rather than production source. r2 bundle SHA256
`d306b5c7fdd88fe0e5a6e714cf699e51f9569a2009b07fd645395d54fa827508`;
r3 `f4a0c08aa86001d0585b54d2090c25072fecb5a6455f9b30324070395e54fd20`.
No diagnostic tags were added to maintained app/harness source. The bug-diagnosis
guidance produced the real-HTTP red/green regression and preserved partial
failures instead of treating a retry as proof. No publication, deployment or
spending; complete production acceptance and all 116 phases remain Partial.

## Subsequent corrected-client exact-image load pass

Full original workload with freshly bundled maintained corrected helper passed,
terminal exit 0. App/runtime exact image remained `fcd5029c...`, MySQL `b3b90af2...`:
no app replacement, unchanged `node dist/start-runtime.js`, unchanged resource
caps (one CPU/512MiB/320MiB Node old-space app; one CPU/2GiB/1GiB temporary storage
database), readonly UID 1000 and two readonly synthetic secret mounts. Runner
changed only the test-client factory described above; all test thresholds,
fixture counts, deadlines and no-retry requirements unchanged. No diagnostic
instrumentation in maintained source or the successful bundled helper.

| Workload                         | Requests | Result                                        | Successful p95 / p99 | Elapsed |
| -------------------------------- | -------: | --------------------------------------------- | -------------------- | ------- |
| Reads, concurrency 5             |    6,000 | 6,000 HTTP 200                                | 73.04 / 106.78ms     | 30.44s  |
| Reads, concurrency 20            |    6,000 | 6,000 HTTP 200                                | 218.55 / 342.86ms    | 30.20s  |
| Reads, overload concurrency 100  |    6,000 | 902 HTTP 200; 5,098 valid busy HTTP 503       | 993.12 / 1,468.57ms  | 9.15s   |
| Workspace writes, concurrency 5  |    6,000 | 5,000 HTTP 200; 1,000 expected stale HTTP 409 | 75.25 / 110.08ms     | 33.13s  |
| Workspace writes, concurrency 20 |    6,000 | 5,000 HTTP 200; 1,000 expected stale HTTP 409 | 283.08 / 454.34ms    | 34.98s  |

All baseline transport/correctness/bad-retry-header counts zero. Normal p95 limit
still 2,000ms. Overload means orderly busy refusal, not 100 successful concurrent
users. One hundred real HTTP logins p95 394.91ms; 600 warmups and 300 cross-owner
read denials. Direct synthetic fixtures bypass signup/inbox/rights-based intake.
Closed-loop sequential-request workload, no think time, no automatic retries,
no network latency/hosted guarantee; not sustained open-loop arrivals or a soak.

Both write tiers independently checked all 10,000 persisted rows, unchanged
non-edited fields/9,900 untouched candidates and per-owner/action audit totals.
Another 200 races (100 different patch, 100 identical patch) sent 400 edits through
independent sockets with verified wire overlap: 200 changed winners, 100 stale
conflicts, 100 unchanged replays. Independent SQL checked all 10,000 rows and one
causally matched audit receipt for each of 200 winning request IDs, preserving
earlier audits. Wire overlap is not a deterministic database-level lock barrier
or a universal exactly-once guarantee. All 400 wrong-owner mutations refused;
all 10,000 candidate and 6,200 audit rows remained unchanged after those denials.

Post-load actual `/api/health` and `/api/ready` both HTTP 200. App cgroup peak
244,416,512 bytes; DB 760,119,296 bytes; observed low/high/max/OOM/kill event
counters zero. Peaks include cgroup-charged memory, not just sampled RSS; not a
whole-host or whole-product budget guarantee. Three owned fixtures independently
inspected retained stopped exit 0/no OOM/no public ports:

- Database `92ee1f3d5f14646a87d98835d122fcaf518eed89729f19b2a03d537cb8b151bf`.
- App `c55e3bf1dedade2df8678ee7dbe2ac0423debf2557181d9814bea4ed03521e1a`.
- Runner `2c4108abdfed8e59b17ca2fd4530a6b91d919499bf4c983e0923a8f83bcb8591`.

All 169 operator cases passed (4,802.6844ms), no skips; 17 focused cases/typecheck
and actual Node 22.23.3 pool probe above passed. New selected source/build inventory
digest `f524e1d2796b09edbdcae4b4f339e7650ceb3fb42b232be6f3e76d78acb0d951`:
two test-only files added, original harness changed; zero selected build-input or
built-artifact changes. **Full unit-suite/test-image rebuild acceptance for these
new test sources has not run yet.** Old 985-unit/724-database package receipts do
not certify the added regression. Application image identity and separate mounted
load helper are distinct; no new app build is implied by this pass.

Raw logs, current scoped inventory, typecheck and Node probe are retained under
`outputs/hong-kong64-load-fixed-20261002-r4/` outside maintained source. Bundle SHA256
`8bc75cbd891e30922699c73fa0a3643ac993764a46ddd4ed67cd8e9faf26845b`;
runner unchanged SHA256 `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
Factory source SHA256 `ab050c537e1799f3b9bbe4d17b1a4beefb944ec89562c61627a4143bd612193f`;
harness `3682bec60d831719db0a5cd5e537bd9f55d8dea53ada550bc4a2714ff61d0f43`;
regression `6a7270b64a5c1efed6f0a5c4148e47916694b5b69e865cc975213fd8642085f0`.

One successful corrected replay plus the narrow pool regression supports this
bounded checkpoint; it does not prove the exact original r1 race-phase error or
eliminate all possible future network failures. Repeated/soak/whole-product tests,
fresh complete packaging, hosted capacity within the EUR 100 monthly plan and
live/operator acceptance remain open. Earlier failed receipts retained. No
publication/deployment/provider action/spending; all 116 phases remain Partial.
