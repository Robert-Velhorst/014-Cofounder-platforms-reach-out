# English/Dutch candidate corrections — October 2, 2026

## Implemented scope

CandidateEditor uses the existing interface-language context for its heading,
accessible form name, all ten field labels, source/contact-permission limitations,
preserved-history explanation, malformed-list warnings, save/cancel actions and
local fallback errors. CandidateDetails supplies translated edit actions, discard
confirmations and the saved-profile notice. Original candidate values and original
server/schema errors are not translated; English errors have an explicit language
attribute. Other candidate-detail, intake, progress, archive, administrative and
server messages remain English. This is not complete phase057 acceptance.

The React best-practices skill guided deriving presentation from the existing
language preference without new synchronization effects or a translation service.
Revision binding, account fencing, dirty-field patches, invalid-list protection,
command identity, field limits and contact-permission semantics are unchanged.
Corrections do not authorize outreach or rewrite original source/import evidence.

## Actual verification

The new four-case rendering suite initially recorded three failures and one pass.
After implementation, a test-only lowercase maxLength assumption was corrected to
accept React's rendered attribute spelling; the application limit was not changed.
Final focused verification passed **25 tests / 4 files, no skips, 6.51 seconds**:
candidate corrections, conversation controls, reminders and interface language.
It covers both languages, retained values, malformed stored lists, concealed and
blocked controls. Final type checking/build session97900 exited0; Vite7.3.6,
7.35seconds. The root API scanner passed11 tests without skips (1117.1499ms),
including exact snapshot matching:165 operations,58 admitted,107 denied,
54 reachable references and zero unknown references. Static coverage is not
functional qualification of every operation.

Browser session87539 exited0: **17 isolated stages passed**, suffix52277bab.
The new correction stage used real HTTP/backend/database operations and synthetic
accounts. It selected Dutch, checked the form language, disabled clean-save state
and browser maxLength10000, edited title/bio/skills, dismissed the Dutch discard
confirmation and verified retained unsaved text. At375x812 there was no document
horizontal overflow. Saving displayed the Dutch notice; database and reload checks
confirmed the exact Unicode biography, corrected role and two-element skills list.
Name, owner, platform, profile URL, source kind, import provenance, consent status,
import timestamp and archive timestamp matched their pre-edit values. The remaining
workflow stages also passed, with no unexpected browser errors/outside requests.
Four exact expected refusal diagnostics remain; one synthetic manual-completion
receipt is not delivery evidence. No real sends or provider actions occurred.

The fixture used runtime
`sha256:26342d31864247f248b60342aa36cdc8bad63bdc6ecd66d464b537eb567ca422`
with the **new compiled frontend mounted read-only** at `/app/dist/public`.
There were no application-source/dependency mounts or public ports. This is not a
new immutable runtime qualification. QA/DB image identities and disposable
non-root/read-only bounded network-isolation controls follow the
[prior runtime receipt](BILINGUAL_RUNTIME_ACCEPTANCE_2026-10-02.md), including the
Chromium no-sandbox QA exception. No full unit/database suite, image rebuild or
restore rehearsal was repeated for these newer editor bytes.

Independent inspection confirmed all three owned containers stopped, exit0,
OOMKilledfalse:

- Browser `2ac3d0143167c1c493034a19e84c65e53d6601f0f12dca8ae024c5ed3b27b1c7`.
- Runtime `e784862813e3fd386888234142a2580da91eab205e7a839a8186ba83a89bca55`.
- Database `788d50f0c2a89eb2cdcc03110ecee1f4f5f9c66a4aa48c626def6ff0236b6fb0`.

External evidence is in outputs/candidate-editor-language-browser-20261002-r1.
Runner SHA256 `776a0fa86f9ee4932d76c62d48a8997a6e8108d3df800fd3846b1cc7f73da567`;
browser SHA256 `89079c3e5fa17b12cc622f22f5bc8127a904b8c80d432e383e3033f58c23c483`.
The tall element screenshot was visually inspected: lower Dutch fields and actions
are visible; off-viewport regions include background/header clipping. It is not a
complete modal-layout, accessibility or whole-product visual acceptance result.
Conflict/replay/uncertain-save language branches were not separately browser-injected.

Selected app source/build inventory: **535 files / 10,527,855 bytes**, digest
`d1a671fe7d834e5fce587f305ab2eaf0d386d13ddc384f12666a549e79426dba`.
This excludes root/operator/docs/dependencies/image layers and is not signed or
causal build provenance. API source-input digest:
`9cd575a76434beab1784e3acf2569b8f3f5f337d5ee0e38d1f9a05a93d0e6534`.

## Remaining gates

### Subsequent immutable-runtime qualification

The source-only gap above was closed for the repeated workflow, not for all release
requirements. Build session76263 exited0 using the root Dockerfile runtime target:
type checking, **841 unit tests / 84 files, no skips, 118.43seconds**, Vite7.3.6
build/3.89seconds and pruning546 reused production dependencies/zero downloads.
Frozen dependency installation was cached; this was not an offline clean rebuild.

New inspected image:
`sha256:4c9124095a1c29b5b55aff39be6435bccffe9c0aa767c3e2c8f524b11ad4b70e`,
tagcofounder-local-candidate-language-runtime-20261002-r1, usernode,
223,469,155bytes. Bounded read-only/network-none artifact probe passed as UID1000,
Node22.23.3:116 dist/drizzle files,6,881,429bytes, digest
`2b9369ed1832828c3298340e9027ca84408e8629f9db1900f0216d28ee87abb7`.
Checked runtime paths contain no client/server source, .env or Vite/Vitest/tsx/
TypeScript development tools. This is not a secret scan of every image layer.

Browser session7253 exited0, suffixe2db6eea: **17 stages passed** against that exact
image with zero frontend/source/dependency mounts. QA148.0.7778.0 and exact DB/QA
images are unchanged. The Dutch correction stage repeated the real save, dismissed
discard, metadata preservation and reload checks. The remaining catalogue,
review/manual completion, reminder, response/closure, account isolation, private
export and oversized-export refusal stages passed. No unexpected console errors,
RPC mocks, outside requests or real sends; four expected refusal diagnostics and
one synthetic manual-completion receipt. Synthetic verified accounts do not prove
real inbox delivery. Login normal/hover contrast remains5.431518709948351/
4.671987609443461; this does not qualify the whole application's accessibility.

Independent inspection confirmed all owned containers exited0/OOMKilledfalse,
no public port bindings and no runtime/database bind mounts:

- Browser `e653bf88ecd50859eaa77a46be8805244e3977ba57de57117dcca79ba64b1f70`.
- Runtime `538fbb01e3942e476919c1b4f63d2f3ed08d88ac129254e4f5ac3353130e0d22`.
- Database `7b20179f0a3acf95a2187bcb4632a3b910631630a009070d6e139c8bad6ab336`.

External evidence:outputs/candidate-editor-packaged-browser-20261002-r1.
Runner SHA256 `2669e1cbd68b734ccc1e2346e43186a2bf7694b03e0af2d902286d595e954f41`;
browser `8beaea4ed40e42ed1eb4b15d5b83a183832f95258eb07ea1a11b3925ed874a96`;
artifact probe `33b12ccbce301b24989c80bd5e65b190d46cc15150fcf5e8b11ab436b66b3ea9`.
Actual desktop1365x1000 and mobile375x812 viewport screenshots were visually
inspected, including the top of the correction form and scrolled mobile actions.
Unlike the earlier tall element capture, these show the scrolling viewport.
The parent details panel remains English, and this QA browser renders the globe
emoji as a missing glyph despite exact Unicode database preservation. Complete
typography, all fields/keyboard/screen-reader/browser/layout acceptance remains open.
Browser plugin not available; the frontend-testing skill used the existing
Playwright fixture without installing dependencies. Page identity, meaningful
content, console health and real correction interactions passed; screenshots show
no framework overlay. This is local synthetic acceptance, not remote CI or launch.

Selected host source/build inventory remains535/10,527,855/d1a671fe... above.
At that checkpoint the complete database suite and encrypted restore had not yet
been repeated. The subsequent qualification below closes that local gap; older
receipts still retain their exact earlier image scope.

### Subsequent locked database regression and actual-runtime restore

The deployment-patterns skill guided sequential, isolated qualification rather
than treating a production build as proof of database/recovery readiness.
Integration-test target build30084 exited0, Vite7.3.6/4.15seconds. The inspected
new test image is
`sha256:b68937a8f5ee9e8d8f8447b110780d2fb8184a68ca094037ae6c011c471297fe`,
tagcofounder-local-candidate-language-tests-20261002-r1,280,628,710bytes,
default root test environment. Initial formatted User inspection failed because
the property is absent; full JSON inspection confirmed it is unset, not node.
The runtime remains usernode. Dependency installation used cached frozen layers,
not offline clean-cache reproducibility. No manifest/lock/application change.

A bounded read-only/network-none/UID1000 artifact probe found the same116
dist/drizzle files,6,881,429bytes/digest2b9369ed... as the production runtime above.
Five source/test hashes inside the actual test container exactly match the host:

| App-relative file                          | SHA256                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| client/src/components/CandidateEditor.tsx  | fe9c8084dbdd48427de1330afebe3af5074848a66348dad347f5ebb24ce578f2 |
| client/src/components/CandidateDetails.tsx | 45f08f96db96fe7e58254ebcc184185e949dfd36921b1c521529423009085c27 |
| client/src/components/LanguageSelector.tsx | 08ee401484f7778cf709175eaa0a28917cd5dbf28c8c9c7af5c5c1d35439d5b3 |
| client/src/pages/OutreachConsole.tsx       | 547c1b484373c0f6fda2d470f8e43e4dd4768d36a40f46c2bdcfc94d0d0b13e8 |
| server/candidate-editor-language.test.ts   | d6d5f7de655f26171b3b08de56d8a41d544c7646b736134cf4d9870925f55823 |

This is scoped equality, not complete source closure or signed provenance.
Selected host inventory remains535/10,527,855/d1a671fe... .

Database session10323 exited0: **724 tests / 43 files, no skips,331.43seconds**,
helper337.801seconds. The test image ran its own migration and complete declared
integration command, including26 candidate-edit cases. The unchanged two-process
DDL migration serialization case passed2514ms; its earlier failure/cause is not
redefined. No overlapping owned build/unit/recovery workflow was started. External
helper outputs/bilingual-packaging-20261002-r1/database.mjs remains SHA256
`f81d7fa7e07b1d9ee6a14e9eaec9f16b1a80da3b9202a89c647b321429bd82e9`,
force-failurefalse. Database image b3b90af2... unchanged; all exact images resolved
before fixtures, no implicit pulls. Test2CPU/2GiB/512PIDs/defaultroot/capdrop/
no-new-privileges/tmpfs, DBUID999/read-only/tmpfs/networknone; no source mounts or
public ports. These test privileges do not change production-runtime privileges.

Independent inspection confirmed both fixtures3c192984 stopped/exit0/noOOM:

- Test `403cb03ace27113330ef9ca757e8888300c7d4422055daaf0190a58b351faec4`.
- Database `7ecf6053668120eb35c1d376529669fa71e3f4b33f54e4798ee1859579bb2f10`.

Only afterward, full-schema encrypted restore session29389 exited0: **one test,
no skips,44.7094031seconds** (test body44.6052712). It used the exact new test and
production images above, not mounted replacement code. The retained root fixture
refused corrupt snapshots, incorrect target identity, unsafe target grants/roles,
scheduled events and nonempty/source-target misuse. Schema, indexes, migration
journal and binary/UTF8 probe data matched. Historical sessions were invalidated
and administrator elevations cleared without rewriting retained session identities.
The actual restored server then proved two real synthetic account logins, separate
owned candidate lists, cross-owner exclusion and session revocation on logout.
No provider action or real-inbox verification. This is not proof of every restored
customer journey or approved erasure reconciliation.

Independent inspection confirmed all fixtures4b90dd38 stopped/exit0/noOOM:

- Runtime `4cd62a7a2a395952d3b2227206ef49f03b80b29547d13440b4b77d3aad377535`.
- Source `de1637a69abc016e2b7ac273d4e4763ef83e8d4c1ad2250ae00c27b49d0d3bbe`.
- Target `4683de9b983abbd1a8c7a6f590f4372014456a512e15b545eb0ccb26a57a09ca`.

Only the fixture-created temporary encrypted snapshot/key directory was removed;
no user database or backup was deleted. Unchanged recovery fixture/tool/probe
hashes: `f5575551d1581377e8fb34943457663c495d5417a9c9d7bfb2965da1ab701a10`,
`2bc9ae77d5b4f9e4493cf86ffeb0a2ea89e764f9b265611cd0135e5629a3a6c4`,
`c57fe9261e96d49fe903ea3c8de292abf074eb786f595e499ad382332d0294e9`.

Whole-product translation, production-sized combined workload/recovery,
controller/contact/retention decisions, actual erasure, hosted TLS/email/operator
acceptance, remote backup/key recovery and verified worldwide coverage remain open.
The EUR100/month ceiling is planning only (EUR80 operations plus EUR20 reserve),
not spending authority. No commit, publication, deployment or policy activation.
All116 original phases remain Partial; the persistent goal is not complete.
