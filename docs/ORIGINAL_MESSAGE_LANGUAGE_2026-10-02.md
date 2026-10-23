# English/Dutch original-message editor — October 2, 2026

## Implemented scope

OutreachComposer now follows the existing language setting for its named region,
heading, linked-assessment/source labels, unchecked-source fallback, template
controls/insertion explanation, original-message label, authorship/rules/data-rights
acknowledgement, saving/cancel/close controls and nothing-sent/30-day/fresh-review
disclosure. The template insertion button wraps at small widths. Original candidate
names, template names/text, message body, assessment/source IDs and English server
policy explanations/errors are preserved. English server explanations use lang=en;
the authored region uses the selected language. This does not translate the wider
draft manager/review/manual-action workspace or grant source/contact permission.

React best-practices skill guided render-time presentation without effects, new
services or dependencies. Local fallback errors use a semantic choice; caught
server messages stay original. Existing human-original/rules declaration payload,
trim/max-length/eligibility guards, pending/in-flight controls, same-body retry key,
edit-driven acknowledgement reset and explicit cancellation remain unchanged.
Source holds still withhold the authoring form; unchecked source is not eligible.
Parent onSave still waits for the real mutation before closing and changing tabs.

## Verified behaviour

Four new rendering cases initially failed while the two existing English safety
cases passed. Final combined language checks passed **46 tests / 7 files / no
skips**,5.56seconds. Composer6 cases cover Dutch labels/disclosures, empty unchecked
disabled start, original English source reasons, held/unknown source without form,
private template names and non-inserting initial render; they mock language and
callbacks and do not exercise a real save or template storage. Other6 suites cover
existing details/editor/progress/conversation/reminder/interface language behaviour.

Final typecheck/build3362 terminal0, Vite7.3.6/4.65seconds. Earlier39345/type/build
4.32seconds predates the named-region addition. No lockfile or dependency changes.
API scanner **11 tests / no skips /1509.7812ms** matched updated three source hashes;
no hook positions/admission policies changed:165operations/58admitted/107denied/
54reachable/0unknown,150input files. Snapshot input digest
`d835fa26299cb8b9c292aecce8b399de433802ae7ed3c184fc69f8d5b7d50383`.
This static boundary/identity check is not proof of every route or data effect.

Frontend-testing skill: Browser plugin unavailable, existing isolated Playwright
used without installing dependencies. Actual flow: sign-in → intake/correction/
assessment → open Dutch composer → type/cancel (actual DB draft count0) → reopen
empty → write/acknowledge → switch English (text and acknowledgement retained) →
switch Dutch → edit (acknowledgement cleared/save disabled) → review exact original
text → save → wait for editor closure → actual DB exact body/state=draft/sent
timestamp null → existing review/approval/manual synthetic receipt → conversation/
reminders → archive/restore/opt-out → progress → private export/refusals.

Initial26930 terminal1/b82c30d5 read the DB immediately after Save, before awaiting
the mutation-backed editor-close transition, and found no row. Test added that
explicit completion wait; body/state/no-sent assertions and application save code
were unchanged. Failed owned fixtures independently stopped/noOOM (browser1,
runtime/DB0); no test exception was waived. Final67724 terminal0/suffix6d42558f:
**all20 stages passed**, Chromium148.0.7778.0, RPCmocks0/provideractions0/realSends0,
errors[]/external[], four exact expected refusal diagnostics. One synthetic manual
completion record is not a delivery receipt; preverified fixtures are not an inbox
test. Original saved text remained visible through subsequent conversation/export.

Page URL/title/meaningful content/no framework overlay/console health and actual
controls passed. Desktop1365x1000/mobile375x812 viewport captures were visually
inspected: readable Dutch acknowledgement/disclosure, multiline original message,
wrapped/stacked controls, original English source reason. Wider assessment/import/
review copy is still English. Source-hold/template insertion/fallback errors and
uncertain same-key retry were not newly browser-injected; pending/mid-flight language
switching, other browsers, screen readers and whole-site WCAG remain unverified.

## Identity, isolation and remaining scope

Current application inventory536files/10585382bytes/
`a3a48a40e91ec0a0c715866aa09a4a564ba010268a810a62fd72cb483f1d5269`.
Source SHA-256:

- composer3e7dbfdeaa8bb37de8ffdbaedc0bcbf31a76cc2a3c3074dd15ec9658d07493a2
- selector5b3c5dd9d0405d2ddf02efb81d1662063aa85466729ffd288cdcd365b7f49966
- console133eb148c8e320db11f8ae0498fe7f2f3b56f2af8b48d441ee22384a663f4ef5
- testdc8494c9ce107c34cf7fb99cacdaf2b77e8aca329712ec4c521f6069b9e76baf

Exact prior runtime
`sha256:c0dae360678496f1068bc3244dab2ac27c231bbd83d6491087f973f4541ada57`
uses **one read-only newly compiled frontend mount**, zero backend/source/dependency
replacements/public ports. QA69de0b53.../DBb3b90af2... and bounded disposable isolation
are unchanged from [the prior connected fixture](CANDIDATE_DETAILS_LANGUAGE_2026-10-02.md#newer-partnership-progress-language-source).
Chromium's disposable no-sandbox exception remains. This is source-level connected
acceptance, not a new frozen/immutable/full-unit/database/recovery qualification.
Earlier856/724/package/restore receipts retain their earlier-byte scope.

External fixture `outputs/original-message-language-browser-20261002-r1`:
runnerf9ac6739d89260a9e92c6a5931107e5d39ecca35e0843490f09d3d31792961a9;
browser3d2c89a7f1b677f52cbce457b118429842a8989a495a5b667bc64b867e96401c.
Independently inspected final fixtures stopped/exit0/OOMKilledfalse:

- Browser9a23bd31e6072f54ae4d48b2b22cf39d3dbf4c6502c7c350f38d8b751c19b44d
- Runtime611b38dee10bddd6c9a93255c58bd0de3461820581a9c08066b2320af0fed096
- DBf31b665d13b6506f08939e1a0188b2c5ad0f7b1548e45e0e4671e68783ed64a5

No commit/push/merge/publication/deployment, actual contact, purchase or permission/
retention/erasure activation. Wider English/Dutch, worldwide discovery, privacy/
actual erasure/operator/hosting and116-phase goals remain incomplete. Continue
connected remaining work before combined release qualification; do not substitute
repeated unchanged-package checks for missing functionality.
