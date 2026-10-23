# English/Dutch candidate detail panel — October 2, 2026

## Newer partnership-progress language source

The embedded PartnershipProgress now follows the existing EN/NL language setting:
heading/region label, report-only disclosure, retention limits, five outcome labels,
history/pagination, assessment prerequisite, inputs/review acknowledgement, submit,
pending/retry/conflict/reload/discard explanations and success/local-error notices.
Original server notice/errors retain lang=en; original private notes/outcome keys/
IDs remain unchanged. Dates derive en-GB/nl-NL medium date/short time in the device
time zone; null/invalid timestamps stay explicitly unavailable, never guessed.
Parent wrapper now follows selected language; selector/workspace scope notices
include progress controls and still disclose English remainder.

React best-practices skill guided render-time presentation without effects or
new dependencies. Notice/error state uses semantic choices so local text is not
frozen to the language at save time; original caught server messages stay intact.
The failed-refetch branch retains inputs/attempt/review and runs existing finally
cleanup without creating a synthetic English Error. Approval/revision/idempotency
payloads/query keys, busy/dirty guards, replay/conflict handling and ownership
concealment remain. No opt-out/contact/state/assessment policy changed. Long reload/
retry buttons wrap within the mobile panel rather than exceeding its content edge.

Existing rendering suite expanded from4 to9cases. Baseline4pass/5fail; final
six language suites **40tests / no skips / 3.42seconds**, terminal0. These mocked
SSR cases cover Dutch controls/all outcome keys/history, retained original notes/
English notice, locale/null/invalid dates, unchecked disabled approval, loading/
error/missing-assessment and blocked/wrong-owner concealment, plus existing English
safety cases. They do not prove real mutation/retry. Final type/build60367 terminal0,
Vite7.3.6/4.93seconds. Full unit/DB/restore packages were not rebuilt for this newer
frontend; prior856/724/restore receipts below qualify earlier bytes only.

API snapshot updated four source hashes/two progress hook positions. Final11tests/
no skips1057.6446ms matched exact current snapshot;165operations/58admitted/107denied/
54reachable/0unknown unchanged;150source inputs,
`a7ad8cc8f0fbfff67a3aabc1c32857a31109d629fb59626f272c8796b6919a1c`.
Source hashes: progressdad437bbd478054173ca910a309dbf7188c1dd9a64e332752c29327d31ada974;
detailsf386ff06dc8f3797388d53d23f9687f24543baed2eb167020e49fe7ed061588b;
selector1bfda248bb4251c557e3a9aa972fe841d645683765cb113a197d3916448c4900;
consolee4fd84a98ed42840cda9426b7fef7e6ebb6c2f00c29e89c9142a7c784ffd55c6;
test716388c5ce3414e9c80a47e1095a28ae39d6ed82f7d51fdeb78193a8e5ca1748.
Current app inventory536files/10578359bytes/
`2ad009f7ada968273bfd69a7365d365af8215f53e782be7a2eb4d6fda64d17ee`.
Static/input identity remains narrower than full functional/data-effect closure.

Frontend-testing skill used existing Playwright: Browser plugin unavailable,
no browser dependencies installed. Initial19720 terminal1/c554708f correctly
withheld report form: older fixture never performed assessment. App was not
changed to bypass it. All3owned failed-run fixtures independently stopped;
browser exit1/runtimeDBexit0/noOOM. Normal real Qualify UI was added before opt-out,
with actual owned assessment verified. Intermediate58739 terminal0/20stages passed;
mobile long-label edge was then repaired. Final36472 terminal0/b3d4e7ad:
**all20stages passed**, Chromium148.0.7778.0, errors[]/external[], four exact expected
refusal diagnostics, RPCmocks0/provideractions0/realSends0, one synthetic manual
receipt. Synthetic preverified accounts are not real inbox delivery.

Actual flow: sign-in/intake/correction → real assessment → draft/manual synthetic
receipt/conversation/reminders → archive/restore/opt-out → Dutch progress form →
cancel parent discard confirmation (notes/review retained) → acknowledge/save →
clear acknowledgement/retain history → reopen English → original note visible →
private JSON export containing same outcome/notes. Actual DB owner/prospect/outcome/
Unicode note/timestamp were checked, consent stayedopted_out and all selected
send/conversation timestamps/state were equal before/after. No contact permission
was re-enabled or actual message sent. No assessment means no form, as observed.

Actual lang=nl, page URL/title, meaningful content, no Vite overlay, scoped controls,
console health and viewport screenshots passed. Desktop1365x1000/mobile375x812 were
visually inspected; actual reload-button bounds stayed within its panel. Mobile
history and separate controls views show readable wrapping/scrolling. QA font lacks
the globe emoji glyph; exact Unicode persisted/exported, not full typography proof.
Uncertain save/replay/conflict/refetch failure and mid-flight language switching
were not browser-injected. No whole WCAG/screen-reader/other-browser/hosted claim.

Exact prior runtimec0dae360... plus **one read-only compiled frontend mount**;
zero backend/source/dependency replacements or public ports. Exact QA69de0b53.../
DBb3b90af2... and earlier bounded disposable fixture controls remain; Chromium
no-sandbox QA exception remains. This is source-level connected acceptance,
**not a new immutable-image qualification**. External fixture directory
`outputs/partnership-progress-language-browser-20261002-r1`: runner
f9ac6739d89260a9e92c6a5931107e5d39ecca35e0843490f09d3d31792961a9;
finalbrowser14fb68805332dde579c0f9654326b4b275ca3f5ca83775f693d9175d88ba067d.
Independently inspected final owned fixtures stopped/exit0/OOMKilledfalse:

- Browser26128986e212301315176baa8f8e2100b4887d34ec5ea11d723699371a069d55
- Runtimee6d8c44ee3424f736c409dac0681e518b2c24433c87f3382f7e520252ac5f9bf
- DBf46af39e11b74fc6c2723887623c969d0f4b085cf8ae7fffd4197edcf5fe6c20

No commit/push/merge/publication/deployment/provider action/cost or live policy
activation. Whole language/platform/production/116-phase scope remains incomplete;
continue remaining connected product work before combined-package requalification.
All paragraphs below retain earlier package/source checkpoints and limitations.

## Current database, recovery and readiness qualification

The initial package checkpoint below is now complemented by actual isolated
database and encrypted-recovery results for its **exact** images: runtime
`sha256:c0dae360678496f1068bc3244dab2ac27c231bbd83d6491087f973f4541ada57`, test
`sha256:a8f6c15c8aaa9e15cd9f2fb28dee34f0914a6a1aaaa3974e81bc1c52391d74b1`.
They qualify the combined candidate-detail and 57-source application bytes, not
every original requirement or the newest edited documentation inside image layers.
Current app inventory536/10566051/c24711c9... remained unchanged. No code,
dependency, assertion, timeout, admission policy or feature flag was changed.

Database55779 terminal0: image-owned migration and complete configured integration
command passed **724 tests / 43 files / no skips**,363.47seconds (helper370.164s).
Two-process migration serialization passed2663ms; no earlier failure was hidden
or assertion weakened. Actual MySQL8.4.11 image
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
The reviewed existing external helper
`outputs/bilingual-packaging-20261002-r1/database.mjs` has SHA-256
`f81d7fa7e07b1d9ee6a14e9eaec9f16b1a80da3b9202a89c647b321429bd82e9`.
No concurrent owned build/unit/browser/recovery run occurred during this suite.

The test image uses its own locked dependencies/source with zero host source/
dependency mounts or public ports. DB999/read-only/network-none/tmpfs data;
test root/writable only for isolated test operations, shared DB network namespace;
both2CPU/2GiB/512PIDs/cap-drop/no-new-privileges. This test-root exception is not
the deployed runtime posture. Independently inspected both fixtures stopped0/noOOM:

- Testf34d1505c07e9f0c30e84532b5788536e23f3b6b1539e68aaf663a6f98902b83
- DB2cfc9686e6980c269c5ae317e0836ec8faebed069eb74a6354bf3ef7bd2e3188

Only afterward, recovery68987 terminal0: **one full-schema acceptance test / no
skips**,76265.8485ms (body76163.819ms), native Windows/hostNode25 runner and exact
runtimeNode22. The actual new runtime served compiled assets, authenticated two
synthetic restored owners, returned one owned candidate each, rejected cross-owner
requests and revoked fresh sessions on logout. Historical backup sessions stayed
invalidated; administrator elevation was cleared. Schema columns/indexes/migration
journal and binary/UTF-8 probe values matched. Private seeded identities are not
inbox verification or customer acceptance; provider actions0.

Refusals covered corrupted ciphertext, wrong exact target identity, scheduled
events, server-wide privileges, grant delegation, active roles, nonempty target,
source misuse and nontransactional source tables. Existing key/backup overwrite
was refused. Windows wrapper backup/verification also passed. The reviewed
fixture removed only its own mkdtemp key/encrypted-snapshot directory; no existing
user backup or database was deleted. Disposable stopped containers are retained.
Root fixture/tool/probe hashes unchanged:

- fixturef5575551d1581377e8fb34943457663c495d5417a9c9d7bfb2965da1ab701a10
- tool2bc9ae77d5b4f9e4493cf86ffeb0a2ea89e764f9b265611cd0135e5629a3a6c4
- probec57fe9261e96d49fe903ea3c8de292abf074eb786f595e499ad382332d0294e9

Runtime UID1000/read-only/shared isolated target namespace, no application source/
dependency replacements or public ports; only the external read-only acceptance
probe was mounted. Independent exact-image/stopped0/noOOM inspection:

- Runtime463769477cb41b471ff1e1b79d762ba10bb22a1280bcfc49edceca0f45562052
- Targetf44902d5b37b22789804984a80b08d2ddb4c043b2fddaf8c2cee309ed69c4dd2
- Sourced1609b579a8bc9df82e0ab571ef6560ece69134a2ef0287fdb28a9ef45d27a13

Then readiness56632 terminal0: **one real-MySQL acceptance test / no skips**,
33843.5117ms (body33692.7197ms). Current CI/local/integration probes accepted
authenticated application-user TCP queries and rejected wrong credentials,
missing schema and socket-only availability. Legacy ping false positives were
demonstrated rather than accepted as readiness. This fixture models configuration,
not real remote CI or initializer timing. Its disposable DBs use network-none/
bounded CPU/memory/tmpfs; this older readiness fixture does not adopt all hardened
runtime restrictions. Test hash9021b22856479711e869bf63666ff8ca65292fe623a9078347f1ed4a28b55db1.
Independently inspected both owned DBs stopped0/noOOM on exactb3b90af2...:

- Socket-only58ec993dc2168d0b999a732490854a67487cc2d73b943967b7a9206441b0e4ec
- Normal746ea28653023a0a5ad4bc6188f648d7a7e14f589491096ce0f4799b3bc9a6fb

The combined package now has bounded856-unit/18-browser/724-database/local restore
proof. This does **not** prove remote encrypted storage, independent key recovery,
production-size/combined-load recovery, hosted cutover, every restored customer
journey, real mail/provider permissions, retention/erasure reconciliation or
whole-product language/accessibility completion. Actual erasure remains absent.
All116 phases stillPartial; completionProvenfalse. No commit/push/merge/publication,
deployment, purchase, real send or live retention/permission change. Continue
remaining functional scope and operator/hosting/privacy gates, not redundant
requalification of unchanged bytes. Earlier paragraphs below retain their original
time-specific evidence and pending status at those checkpoints.

## New immutable-package checkpoint

The source checkpoint below has now been built into a new local immutable runtime,
including the 57-record Caribbean catalogue. This advances package/browser proof,
not the whole public-beta acceptance claim. Database and encrypted-restore suites
have **not yet been repeated for these images**; the older 724-test/restore receipts
remain qualified only against their older images.

Runtime build session92342 ended0: typecheck, **856 unit tests / 85 files / no
skips**,107.56seconds, Vite7.3.6/5.21seconds and production pruning succeeded.
The frozen dependency-install layer was cached with ordinary build networking;
this is not a clean offline rebuild or signed supply-chain attestation. Pruning
reused546 dependencies and downloaded0. No package or lockfile was changed.

Exact locally inspected runtime:
`sha256:c0dae360678496f1068bc3244dab2ac27c231bbd83d6491087f973f4541ada57`,
tag `cofounder-local-details-language-runtime-20261002-r1`,223474682bytes,user node.
Test build85372 ended0/Vite3.86seconds:
`sha256:a8f6c15c8aaa9e15cd9f2fb28dee34f0914a6a1aaaa3974e81bc1c52391d74b1`,
tag `cofounder-local-details-language-tests-20261002-r1`,280645412bytes. This test
image has not yet run the mandatory database command; it is not the production image.

Read-only network-none UID1000 probes in both images passed under Node22.23.3:
**116 dist/drizzle files / 6900057 bytes**, identical digest
`fd094816832b2eb022d6016fc992a920284e4850981961eab9c45469210fb0b1`.
Runtime client/server source, .env and listed dev tools were absent. Probe scope
does not include every dependency/image layer or a comprehensive secret scan.
Artifact helper33b12ccbce301b24989c80bd5e65b190d46cc15150fcf5e8b11ab436b66b3ea9.
Six source files read from the test image matched actual host SHA-256: the four
UI files listed later, catalogueb13ec7c998e0b4ed0f1d84bdda745eb410afed062192cfa90c645d416b0734f5,
and new detail testc71f2589bbc6135c3f3d29a5272b0814d30b9961c7a95d75ca21067dbe43e69d.
App inventory remained536files/10566051bytes/
`c24711c97243e7c86c9f05e48289ccf4e468880633ca29e4a1fafefbf62c6d67`.
It is an identity scope, not all root/docs/dependencies or acceptance evidence.

Browser97146 ended0/suffix372e2d5d: **all18 connected stages passed** on exact
runtimec0dae360... with **zero compiled frontend/backend/source/dependency mounts**.
QA69de0b53.../DBb3b90af2... and the earlier isolated fixture restrictions remain.
Browser plugin unavailable; frontend-testing skill used existing Playwright.
Flow: synthetic sign-in →57-source search → intake → Dutch correction/cancel/
save/reload → draft/manual synthetic completion → reminders/response/close →
Dutch acknowledge/archive/restore/opt-out → private JSON export and refusals.
The archive/restore/opt-out database effects preserved original profile/import
metadata. Actual lang=nl, Sluiten, disabled unacknowledged actions and Dutch
notices passed. These are not mocked RPCs or real inbox/provider acceptance.

Page URL/title, meaningful content, absent Vite overlay, responsive controls and
console health passed; errors[]/external[]/four exact expected refusal diagnostics.
Chromium148.0.7778.0; zero provider actions/real sends, one synthetic manual
completion receipt. Actual viewport screenshots at1365x1000/375x812 were inspected:
Dutch contact status/history is readable in the scrolling dialog; source/server
explanations and wider workspace remain English. No whole-site WCAG, typography,
screen-reader, other-browser or hosted acceptance is inferred.

External fixture directory `outputs/candidate-details-packaged-browser-20261002-r1`:
runner53b16d5585df569ea10f9d0317f616e13bfde0cf7cbc4bb95e4c5f3db5fac614;
browserc855faf25a91946da17a8eca85731d28c963a3a97f2bee092529af42511682a8.
Independently inspected all owned fixtures stopped/exit0/OOMKilledfalse:

- Browser580f580a54e76519110c9ccb1690b233fa6318b013a4671617ca99b29afab2dc
- Runtimef7c49d04f69c18a61d919e70240b84dd751f51cfd7666637bca1788cc2a27ac2
- DB55ebe658913845a57c9fb483f29d1060b4a16eb8b67d92a15ed56e2fff9db3e7

Current host operator suites passed143/no skips4139.3828ms; separately API scanner
11/no skips1784.2357ms matched the unchanged snapshot. Requirement verifier:
116Partial/0Implemented/12artifacts/completionProvenfalse. No commit, push, merge,
publication, deployment, external contact, purchase or retention/erasure activation.
Next package qualification: isolated complete database suite, then encrypted
full-schema recovery with these exact image IDs, without inheriting older results.
Broader original implementation/platform coverage/privacy/operator work remains.

## Implemented connected scope

CandidateDetails now uses the existing language context for its dialog name,
description, account/loading/retry states, profile labels and empty/malformed-list
explanations, archive/restore acknowledgements and notices, source/import evidence
labels, contact-status/opt-out controls and notices, retained-history descriptions
and action labels. DialogContent accepts an optional closeLabel (default Close);
this caller supplies Sluiten in Dutch, without changing close/IME/busy behaviour.

Dates derive en-GB/nl-NL presentation in the device's local time zone. Missing or
invalid dates retain an explicit unavailable explanation; no timestamp is written
or guessed. Original user values, URLs, source-kind identifiers, import keys,
evidence references and recorded history field names are not translated. Original
server errors/source explanations have explicit lang=en. The embedded English
PartnershipProgress tool has its own language boundary and remains unfinished.

The React best-practices skill guided deriving language presentation at render
time without new effects/services. Success notices retain typed semantic choices;
local fallback errors retain semantic codes, while caught server errors remain
unchanged. Changing language does not recreate query keys or approval state.
No mutation payload, account fence, revision binding, archive acknowledgement,
opt-out suppression, busy/dirty guard, history limit or permission policy changed.
Archiving is not erasure/capacity release; restoring does not clear opt-outs;
recording an opt-out does not retract copied text or outside contact. No contact
re-enabling control was introduced. Selector/workspace notices accurately include
the detail panel while wider intake/progress/admin/server translations remain open.

## Actual verification

Six new rendering cases initially recorded1pass/5fail. After implementation,
candidate-details/editor/conversation/reminder/interface language suites passed
**31 tests / 5 files, no skips**, final6.67seconds/session38046 terminal0. These
checks use mocked query/dialog/progress fixtures: both languages, original values,
unchecked/disabled actions, archived opt-outs, malformed lists, preserved English
errors and concealed blocked/wrong-owner data. They do not prove real mutations.
Intermediate31pass5.18seconds is retained as earlier evidence, not a different
whole-suite result. Final typecheck/build15795 terminal0, Vite7.3.6/7.67seconds.
The Windows toolchain is not a new frozen-dependency package qualification.

API snapshot was explicitly updated for four changed source hashes and four hook
line positions. Scanner11tests/no skips2738.9814ms passed exact snapshot matching.
Policy counts165operations/58admitted/107denied/54reachable/0unknown unchanged;
input digestaffa0d50dffb28e48b0514b075ad28e23ca06e95af2314bdfa9de621ba14415d.
Static source coverage is not functional qualification of all APIs/data effects.

Frontend-testing skill used the existing isolated Playwright fixture because
Browser plugin is unavailable; no dependencies were installed. Flow: synthetic
sign-in → Dutch candidate detail → acknowledge/archive → acknowledge/restore →
acknowledge/opt-out → verify retained source/profile evidence and private export.
Browser98340 terminal0/suffix493c72ba: **18 stages passed**, Chromium148.0.7778.0.
The panel's actual lang=nl, accessible Sluiten button, disabled unacknowledged
actions and exact Dutch notices were checked. Actual database state showed archive
timestamp set, then cleared, and final consent_status=opted_out; owner/name/title/
bio/platform/profile URL/source kind/import provenance/import timestamp were equal
before/after. The final opt-out action disappeared. Earlier editor cancellation/
save/reload, reminders/conversation closure,57-source search and private export
refusal stages also passed. Original English login/other-dialog paths still worked.

No RPC mocks, unexpected browser errors or outside requests; four exact expected
refusal diagnostics, one synthetic manual-completion receipt, zero real sends.
Synthetic preverified accounts are not real-inbox verification. Desktop1365x1000
and mobile375x812 viewport captures were visually inspected: readable Dutch contact
status, opt-out explanation and retained history; the modal scrolls. No framework
overlay. Other workspace tools/source-server explanations remain English. This is
not site-wide accessibility, typography, screen-reader or multi-browser acceptance.
Archive/conflict/replay/unknown-error branches were not independently browser-injected.

The exact older runtime4c912409... uses newly compiled backend and frontend mounts,
both read-only (/app/dist/index.js and /app/dist/public). No application-source/
dependency mounts/public ports; exact QA69de0b53... and DBb3b90af2... remain as in
[earlier fixture evidence](CANDIDATE_EDITOR_LANGUAGE_2026-10-02.md). Disposable,
bounded non-root/read-only/shared network-none namespace controls are unchanged;
Chromium's no-sandbox QA exception remains. **Not a new immutable runtime**.
Full unit/database/restore suites were not repeated for these new panel bytes.
Older841/724/image receipts retain their earlier scope. Fresh packaging remains.

Independent inspection confirmed all owned fixtures stopped/exit0/OOMKilledfalse:

- Browser b31fa8b5df3d276ac85234e4a563e7d6d92fe8d2d18f64f5e422876eef4611db.
- Runtime f58669814a61593d3d505d5fc2e41b31ba5d911b18fd16dedf783149587274ec.
- Database77098e80f806aa1dbf5617414e65f94d0daaeba36cc88a1a4645f19fd4896fd4.

External evidence:outputs/candidate-details-language-browser-20261002-r1.
Runner SHA256b942f3f8131ed9749e9b677a7aabb5f8a62a94f353bf9bcfad3a6c7e91985c89;
browserc855faf25a91946da17a8eca85731d28c963a3a97f2bee092529af42511682a8.
An initial temporary browser-selector patch generator had a shell-quoting error
and made no edits; corrected patch generation used apply_patch, not a test waiver.
The retained browser fixture accepts exact English/Dutch names and keeps English
as well as Dutch workflow checks, rather than bypassing the changed dialog.

Selected source/build536files/10,566,051bytes, digest
c24711c97243e7c86c9f05e48289ccf4e468880633ca29e4a1fafefbf62c6d67. Excludes
root/operator/docs/dependencies/image layers; no signed/source-closure claim.
Whole translation/privacy/erasure/worldwide/provider/hosted/production-scale/user
acceptance and all116 original phases remain incomplete. EUR100/month is planning
only; no commit, merge, publication, spending or deployment occurred.
