# English/Dutch unsent-draft management — October 2, 2026

Later source checkpoint: [review/manual-action queue safety and EN/NL](OUTREACH_REVIEW_QUEUE_2026-10-02.md)
now supersedes the remaining-English queue limitation below. Other original
checkpoint identities/results remain historical, not silently updated evidence.

## Implemented scope

OutreachDraftManager and its revision editor now follow the existing interface
language: headings, status labels, subject label, history navigation, revision and
cancellation controls, unsaved-change confirmation, safety acknowledgements,
local fallback errors, cancellation notice and recorded-date fallbacks. The modal
and form declare their selected language; the accessible close control is also
translated. Original candidate names, subjects, message bodies, source policy and
server/schema errors remain unchanged. Policy/server error presentation declares
English. Recorded dates use en-GB/nl-NL medium date/short time in the device zone;
missing/invalid values have explicit fallbacks, not Invalid Date.

React guidance influenced render-time translations and semantic local notices:
language switching does not require a new effect, service or dependency. Existing
account concealment, blocked/pending/in-flight guards, exact revision checks,
human-original/not-sent declarations, edit-driven acknowledgement resets,
same-payload retry keys and before-unload protection remain in place. Cancelling
preserves history; revision creates a separate unapproved draft and retains the
original as cancelled. Neither operation sends or retracts an external message.
Review/approval/manual-preparation table controls remain English and need their
own connected language validation. Source coverage and production work remain open.

## Checks and actual interaction

Six new mocked rendering tests cover EN/NL text, unchanged private data/policy,
unchecked disabled cancellation, concealed/wrong accounts, English server errors,
blocked refresh and closed-history missing/invalid dates. Final combined focused
language run passed **52 tests / 8 files / no skips**, 6.66 seconds, terminal13914
exit0. Earlier three-suite check passed19 tests. Typecheck and production build
terminal14953 exited0; Vite7.3.6 built in5.96 seconds. No dependency changes.

API scanner passed **11 tests / no skips**,1855.5585ms, matching updated component
hash and three hook positions. Admission remains165operations/58admitted/107denied/
54reachable/0unknown over150inputs. Snapshot input digest:
`ad854557b94ede6c2e17fd0fdcd770ac36ce7be6d243ca1d57c723563898203f`.
This is a structural boundary/identity audit, not proof of every route effect.

Browser plugin unavailable; existing isolated Playwright used without installation.
Flow: actual login/intake/composer → a second synthetic candidate and unsent draft →
Dutch manager/revision → change text → save withheld until both acknowledgements →
dismiss native discard confirmation (text/review retained) → edit again (both
acknowledgements reset) → review/save new version → actual database verifies exact
new text/state=draft/sent timestamp null and original text/state=cancelled → navigate
previous and replacement records → cancellation withheld until not-sent review →
cancel → actual database verifies retained replacement text/link/cancelled state and
null sent timestamp. Existing connected conversation, opt-out, progress, private
export and oversized-export refusal stages were also retained.

Final terminal52215 exited0, suffix68aaf2cc, **all21 stages passed** in
Chromium148.0.7778.0. RPCmocks0/provider actions0/real sends0/errors[]/external[]. Four
exact expected refusal diagnostics remain separately asserted. One synthetic manual
completion record is not delivery proof; seeded preverified users are not inbox proof.

| Required interface check | Result and boundary                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Page identity            | Actual localhost:13216 login/outreach and intended title checked by existing fixture              |
| Meaningful content       | Real signed-in workspace and named manager/form rendered                                          |
| Framework overlay        | No observed overlay; target controls and actual mutations completed                               |
| Console health           | No unexpected errors; four exact expected refusal diagnostics                                     |
| Screenshot evidence      | Desktop1365x1000/mobile375x812 viewport captures inspected                                        |
| Interaction              | Native discard, acknowledgement reset, retained revision and cancellation verified in UI/database |

Captures outside repository:
`outputs/outreach-manager-language-browser-20261002-r1/revision-dutch-desktop.png`,
`revision-dutch-mobile.png`, `cancellation-dutch-mobile.png`. Mobile controls are
readable and fit the observed viewport; scrolling reveals the longer modal. This
is not a whole-site accessibility, all-browser or all-viewport acceptance claim.

Initial terminal66973 exited1/suffixd7265e02 **after the new target stage passed**:
the following export fixture looked for its section after navigation had left the
account tab. Test now explicitly reopens that tab and rechecks its private-export
acknowledgement. No application guard or assertion was waived. Its browser exited1,
runtime/database0; all three stopped without OOM. Final three independently inspected
fixtures all stopped/exit0/noOOM:

- Browser `c048b9dc09da2a847d1dc0a01c48d4f6977d52cfad81e4dc5b1209b26975a7de`
- Runtime `ecf5cc03620991c918b83d5bf1fcc79fcc0c8cf591c6f37d3cf54d04ff7f1fa3`
- Database `3a1e3731ae83de8e277f1085c0680eeb6c7610bd6eff9e1060fa3260eff298c6`

## Exact identity and remaining qualification

Runtime `sha256:c0dae360678496f1068bc3244dab2ac27c231bbd83d6491087f973f4541ada57`;
QA `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`;
database `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
One read-only compiled frontend mount; zero application/backend/dependency mounts
or public ports. Bounded, isolated containers, synthetic users/data, no outside
network or real delivery. Registration/mail/retention/deletion/automation remained
off; manual preparation enabled only for the retained synthetic fixture.

Component hash `070379a9fde94b0e070e1d39aeed5af2b668b80471b50a4e7bd50e89e2497cad`;
new rendering test `0726fec6242ad115423e60f6bf6d557d6a074968ba2cd5056a7338faef5df9b2`;
browser helper `8ebe0a3dec466e6af2b52e23d2cc74b22c13d313f1b275c68a83c72072b8bdea`;
runner `f9ac6739d89260a9e92c6a5931107e5d39ecca35e0843490f09d3d31792961a9`.
Selected application inventory537files/10,599,663bytes/digest
`22963c0d0a16716affe4a633d1ea9d75925f990927f84468c88bffa0fd813a21`.
This excludes root/operator documentation, dependencies and image layers; no signed
full-closure provenance. Root documentation changes do not alter this inventory.

This source/browser increment is **not a new immutable package qualification**.
The older856-unit/724-database/restore/readiness evidence remains tied to its earlier
package and does not qualify these later interface bytes. Conflict/uncertain-save
and language switching during revision were not injected in this browser run;
rendered failure semantics and backend idempotency retain their separate scope.
Whole116-phase goal still incomplete; no commit, push, merge, publication, deployment,
provider action, purchase or actual erasure was performed. InitialEUR100/month budget
is planning-only. Continue remaining connected product requirements before combined
package qualification and live/operator acceptance.
