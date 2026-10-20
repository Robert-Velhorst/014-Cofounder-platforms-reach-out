# Bilingual individual candidate intake

October 2, 2026. CandidateIntake and its OutreachConsole entry now use the existing
English/Dutch language context. This closes one previously English-only intake
journey; other workspace tools, source records and server/schema errors remain
English. Original phase057 and full product acceptance remain Partial.

## Changes and preserved boundaries

All thirteen field labels, collection-rights declaration, contact-status choices,
duplicate-review guidance, existing/separate decisions, capacity warnings,
refresh/edit/save controls, pending/success/fallback copy and discard confirmation
have authored translations. Dialog and entry button declare the selected language.
User input, source/profile URLs, evidence references and internal enum IDs stay
unchanged. Original server/schema messages are shown with lang=en; local fallback
codes are resolved during rendering so a language change cannot freeze fallback
copy in the previous language. React guidance favored derived language rendering,
not effects or a duplicate translation-state store.

No endpoint, schema, permission, review-token/idempotency algorithm, capacity rule,
duplicate matching or storage transaction changed. Fields still invalidate the
rights declaration/review; returning to edit requires renewed rights confirmation.
Account-unavailable intake conceals private fields while retaining tab state.
No consent is inferred from collection or record reuse. Existing records are not
overwritten; archive and opt-out are not changed. No sending, harvesting or
provider integration was enabled. Input remains in-memory, not persisted as a
cross-session draft.

## UI action-to-data/error review

| Action | Handler / boundary | Effect and failure behavior |
| --- | --- | --- |
| Add individual candidate | OutreachConsole captures current account ID | Local modal only; account failure disables entry and conceals private form |
| Edit fields/contact status | Local values/rights state | No autosave; rights must be renewed; edited fields invalidate duplicate review |
| Preview/refresh duplicates | prospects.previewIntake | Reviewed direct-data/schema input; server review token and bounded owner matches; failure keeps input |
| Select existing/separate | Local resolution/distinct confirmation | No automatic merge; exact URL/overflow restrictions preserved |
| Confirm intake | prospects.add with review token/idempotency key | Existing choice retains record; separate choice uses capacity; conflict blocks retry until new review; uncertain retry retains identity |
| Edit reviewed input | Clears review/rights/error | Original local values retained, renewed rights required |
| Close/Escape/outside | inFlight guard and dirty confirmation | In-flight close refused; unsaved tab-local input requires explicit discard |
| Open saved candidate | Callback with saved ID | Local navigation only, no contact action |

## Validation scope

Six new static-render regressions test EN/NL initial labels, untouched enum/default
values, unchecked declaration, no contact-approval claim, blocked concealment and
pending disablement. All16focused tests/three files passed1.64s. Initial fixture
failed four cases because its dialog mock omitted the input-method composition
hook; the test fixture was corrected without changing production IME handling.
Typecheck and final build12133 terminal0 (Vite4.47s) passed.

Root165operator/audit tests11files/no skips5392.964ms passed after source snapshot
refresh. API165operations/58admitted107denied/54references/zero unknown unchanged;
input digest683bb1937fde803d4ea91bcc908cc0c988083d77d7c088ff503b65e583110b19.
UI147files/223actions/204events/21navigation/5spread unchanged; input digest
c20bab5bf5c8dd03f352517d7e27092e3d202e76dd7d61729a17de801a2be7df.
Structural counts are not proof that every app action works.

Connected browser44704 completed21stages, including actual Dutch preview, edit
retention/renewed rights and synthetic save; zero RPC mocks/external actions.
Expanded repeat50088 completed21stages terminal0: Dutch existing-record reuse
preserved the full SELECT * record and one-candidate count; declining the Dutch
discard confirmation retained unsaved input, accepting it closed the modal.
English intake still ran in the later revision stage. ZeroRPCmocks/outside origins/
unexpected errors; four exact expected refusal diagnostics. All six owned fixtures
from both runs independently stopped0/noOOM/no public ports. Final98ddae91 browser
0716cec8.../runtime65c97176.../DB474b8e82... . Helper SHA256
f4aa2352f77865f8c7b0e745b1d2cab9723f58219f8309f99314acb406e33bb2.
The broader unit69853 completed922tests/89files/no skips138.42s, terminal0.

| Required rendered check | Result |
| --- | --- |
| Page identity | /outreach, CoFounder Outreach title |
| Not blank | Actual owned workspace and Dutch duplicate-review dialog |
| Framework overlay | No Vite error overlay |
| Console health | No unexpected errors; four expected refusal diagnostics |
| Screenshot evidence | Desktop/mobile Dutch review inspected |
| Interaction proof | Retain/edit/renew/review/save/reuse and decline/accept discard passed |

Frontend-testing guidance used existing Playwright because Browser plugin is
not available; no dependencies installed. Flow: real synthetic /login -> /outreach
-> Dutch entry -> direct-person declaration -> duplicate review -> explicit
decision. Internal http://localhost:13216, title CoFounder Outreach,
Chromium148.0.7778.0; desktop1365x1000/mobile375x812/tablet768x1024.
New Dutch duplicate-review screenshots were inspected for wrapping and horizontal
overflow; mobile modal vertically scrolls. Evidence stays outside the repository:
outputs/candidate-intake-language-20261002-r1/intake-review-dutch-desktop.png and
intake-review-dutch-mobile.png.

Current source SHA256:
CandidateIntake a29dd334b3dabdf9ac4ca96a3ecf374fbe388955a2d1c13bd1416841684cdd03;
OutreachConsole20e5e18de62daad52931845dfd500dfd5b1b65981192d16f0f9aa603e4e8433a;
newtests4f87811ff12a4215797af6b32e9d2f9d09bfb659f4a52fdb557643a0c821f0aa.
Selected release inventory005a6f5eff182d707304921f2b87899c472988fc7a1ba21e1b0b129a2f11dbe3
contains541selected files, not full repository/source provenance.
Browser uses older d8e17b4f... runtime with two read-only current compiled frontend/
backend replacements, not newly qualified immutable packaging. Synthetic accounts
are preverified, not inbox acceptance. Real platform permissions, customer tests,
all fallback/conflict rendering states, other browsers, full stale-account journey
and production deployment remain separate requirements. No commit/push/merge/
publication/provider signup/paid commitment occurred. Overall116Partial/incomplete.
