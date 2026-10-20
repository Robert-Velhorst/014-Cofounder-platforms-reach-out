# Private account export language — October 2, 2026

## Outcome and boundary

The private account JSON export now has English/Dutch controls, all authored
privacy/limit/exclusion warnings, unchecked acknowledgement, password label,
blocked-account explanation, pending button and local failure/download notices.
The selected language is declared on the region. Original server errors remain
unchanged and declare English. Private original records, JSON keys/format,
filenames and provider metadata are not translated. The language selector's
partial-translation disclosure includes this flow; other untranslated tools remain.

No backend contract, ownership rule, limit, dependency, database schema, permission
or retention/deletion policy changed. Payload remains accountId/password/
confirmation=true. Current password and private-data acknowledgement are required;
language switching does not submit, clear acknowledgement or translate the file.
Password input is cleared before submission, detached mutation data is reset,
automatic retry is disabled, and mutation data garbage collection stays immediate.
Existing mounted/in-flight/current-account/block checks and fresh authenticated
account verification before creating a download remain. Parent account-ID keys
retain their reset boundary. Export does not send mail, contact providers, delete
data or establish a complete legal access-response determination.

React guidance kept interaction work in the submit handler, not language effects.
Local error/notice meaning is stored, with copy derived from the current language
at render. The account-changed refusal now sets a semantic local error and returns
before creating a Blob; the existing finally cleanup still runs. The browser-started
download notice is not a claim that the customer saved the file successfully.

## Checks and initial failure

Initial focused run: 33 tests / four files / no skips / 6.91 seconds passed. An
additional requested filename did not exist, so it was not counted as coverage.
The correct composer test was included in the broader run. First broader run:
69 pass / two fail, because selector tests expected the previous exact scope
sentence. Updated assertions check current partial-translation disclosure and
private-export/original-data scope, without weakening export guards. Final broader
run: 71 tests / ten files / no skips / 6.60 seconds passed. Four new SSR cases cover
EN/NL warnings, unchecked/disabled initial submission and blocked account controls;
SSR is not browser interaction or concurrency evidence.

Typecheck/build session 13713 completed with exit 0; Vite 7.3.6 built in 12.40
seconds. API snapshot refreshed for two reachable component file digests and the
export hook's source position only. Eleven API audit tests / no skips / 1098.7098 ms
passed against the refreshed snapshot. Static totals remain 165 operations,
58 admitted / 107 denied / 54 reachable / zero unknown, 151 input files; digest
`9b92862fe808c2c9f61ac0ff2fe4d6ab60ac2f6158719daae826eeb295f9747e`.
Structural closure does not establish every API's functional or privacy safety.

## Connected browser flow

Session 93819 completed with exit 0; all 21 stages passed, suffix 325c361b,
Chromium 148.0.7778.0. Actual synthetic login → Dutch Accountgegevens → privacy
warning/password/unchecked review → wrong-password refusal/no download → English
and back while preserving original English error and acknowledgement → correct
password → one actual account JSON download → translated local notice → English
notice without another download. Download preserves exact original Unicode notes,
active/archived/opted-out candidates and closed conversation history, excluding
passwords, credential hashes, session token digests and foreign-owner marker.
Retained cross-owner/anonymous HTTP refusal and oversized-export/no-partial-file
checks also passed, with the broader candidate/conversation/reminder/draft flow.

Frontend-testing guidance used the existing isolated Playwright fixture because
Browser plugin/skill are unavailable; no install or external browser session.
Environment `http://localhost:13216/outreach`, desktop 1365×1000 and mobile 375×812.
Actual desktop/mobile/mobile-action screenshots were visually inspected: readable
long warnings, checkbox and download button, no horizontal overflow. Ordinary
scrolling is needed for long privacy text. Adjacent deletion-request controls
remain English and request intake is disabled in this fixture; no erasure tested.

| Required browser check | Result                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Page identity          | `/outreach`, CoFounder Outreach title                                                |
| Meaningful content     | Real workspace/export form rendered                                                  |
| Framework overlay      | No Vite error overlay                                                                |
| Console health         | Zero unexpected errors; four exact expected password/size refusal diagnostics        |
| Screenshot evidence    | Desktop/mobile/action captures retained and inspected                                |
| Interaction            | Dutch password refusal, successful file download and language-retained review/notice |

Zero RPC mocks, external requests/provider actions or real sends. Authentication
uses self-created preverified synthetic accounts, not actual inbox verification.
One synthetic past-manual-action completion is a declaration, not delivery proof.
Clipboard permission is confined to the disposable context for retained queue QA.
Account switching in flight, Blob/download API failure, lost-network uncertainty,
rapid export clicks, all target browsers/languages and complete accessibility
acceptance are not independently proven by this flow. Actual hosted/operator/
privacy acceptance and fresh combined immutable qualification remain open.

## Exact fixture and source evidence

Runtime `sha256:c0dae360678496f1068bc3244dab2ac27c231bbd83d6491087f973f4541ada57`;
QA `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`;
MySQL `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Current compiled frontend and backend are two read-only replacements at
`/app/dist/public` and `/app/dist/index.js`; source/dependencies/public ports absent.
This is connected source qualification, not a newly qualified immutable release.
Previous full unit/database/restore receipts remain scoped to their old images.
Isolated fixtures are resource-bounded, read-only, unprivileged and network-isolated;
Chromium's no-sandbox flag remains a disposable-QA exception, not hosting guidance.

Independent post-run inspection: all three owned fixtures stopped, exit 0, no OOM:

- Browser `2b8474e1206368b27b02899fc63216ab310969995a56c76298d9babf761a0596`.
- Runtime `dd8f1a187acc97bc6357ca8243360a0fb45c94363ecd3aae0e3e7e8d11665161`.
- Database `dc228a64eda5c6a5f42f3c6d6717bdfa663709f2229ab7c8bc253e9fffa9156e`.

External evidence `outputs/account-export-language-browser-20261002-r1`:
runner SHA256 `26c48683636ed923ddf1644aebda7c522b2b142e3c8b3c8863cc3dda3eb466bd`,
browser `1799a492c0956275865f3c18eb5fbba94ae6c2569ce454bc950c8306539c6cf4`.
AccountDataExport source `6f199a05ff475034dc1525c6569e185061ae77b01cf8243086c808d4479ac9b9`;
selector `35a4ce83523d0fe1b4e96a380415279b1c71e5e3edd874191282ae0b7a041544`;
new SSR tests `5e24b9eeaed701a99d169f535d740d5d9d1343350bf8b2cc1c43577ac3b6eb97`;
scope tests `1b4c3510e874a7d3b0ef72fb60b4b4e4bab159d8d0efe26b93a827a389f5c7bd`.
Selected source/build:539 files / 10,651,051 bytes / digest
`495334be5c2ee69d8e1616dbcae6f87802e05bc3458caeaaca94f94f9459d06f`;
excludes root/operator/docs/dependencies/image layers, not signed provenance.
Key commands: existing pnpm check/build, ten-file Vitest run, Node API audit test,
external runner with exact QUALIFICATION_RUNTIME_IMAGE. Playwright actual page
locators, download events, JSON reads and database queries prove the bounded flow.
No commit, publication, deployment, purchase, provider contact or erasure occurred.
EUR100/month remains planning-only. Full original scope remains 116 Partial phases.
