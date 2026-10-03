# Review and manual-action queue — October 2, 2026

## User-visible change and safety

The queue now supports English/Dutch headings, workflow-state labels, management,
review, approval, manual preparation, copying, destination controls, empty/unavailable
states and local processing/error/success notices. Names and message bodies are
unchanged; retained source-policy/server errors remain original English and declare
lang=en. The queue declares its selected language. The language selector/workspace
scope notices now include draft management and review/manual-action controls.

Recording an external send is no longer an immediate one-click action: an unchecked
acknowledgement must state that the exact displayed message was actually sent
outside this tool. It explicitly distinguishes preparation/copying/opening from
sending and the user's declaration from delivery proof. The acknowledgement is tied
to the displayed record's ID, owner, body, subject, state, timestamp and destination.
Language switching does not clear it; changing that identity makes it unchecked.
Every completed or failed queue action clears it. The backend confirmation payload
remains {id,confirmation:true}; this is an additional interface safeguard, not a new
server-side evidence/proof-of-delivery contract.

Current account/queue errors, refreshing, mutation pending and per-record in-flight
guards disable actions. Mismatched owner/prospect records are omitted. The parent
withholds cached queue items after an account-query error. Copy and destination
opening still require a fresh manualAction fetch, not cached destination permission.
The popup is reserved synchronously, with opener cleared; failures close it. Errors
now propagate to the queue rather than being swallowed by the parent's generic run
wrapper, avoiding an incorrect opened-destination success notice after a failure.
No provider navigation or real clipboard/destination interaction was performed on
the user's machine; the browser clipboard test was inside the disposable fixture.

Historical confirmation remains available after contact suppression: an already
completed external event may be recorded, without authorizing a new send. Suppressed
copy remains disabled and no destination-opening control is rendered. This matches
the existing backend historical-recording distinction. Cancelled/closed/sent records
offer history management, not another workflow transition.

React guidance influenced a dedicated queue component, render-derived language and
acknowledgement identity, and transient in-flight refs. No new effects, services or
dependencies were introduced. Original mutation handlers, audit/state validation,
source-policy checks and fresh fetch remain wired to actual server procedures.

## Verification performed

15 new mocked rendering cases cover EN/NL labels and transitions, unchanged text,
unchecked/disabled send confirmation, suppressed historical confirmation with no
copy/open permission, unavailable/pending/source-missing transitions, owner/prospect
concealment, retained final-state history and empty queue. These do not execute
browser clicks or prove server persistence. Final combined focused language run:
**67 tests / 9 files / no skips**,6.24seconds, terminal exit0. Earlier four-suite
run passed34tests/2.95seconds. Initial typecheck80070 found a nullable account inside
a callback; a real account/error guard was added. Final typecheck61285 exited0.
Production build exited0/Vite7.3.6/6.14seconds,1901modules. No dependency changes.

API audit passed **11 tests / no skips**,1820.1791ms. Updated hashes, one new reachable
component and16 existing hook positions match the snapshot. Admission unchanged:
165operations/58admitted/107denied/54reachable/0unknown,151source inputs. Input digest
`6d7383ec0750bdddb77b4720ea4dc55957a5a4259b32eee9e678219e2fb0ccf1`.
Static import/hook boundaries are not every endpoint's functional/data proof.

Browser plugin unavailable; existing isolated Playwright used, no installs. Actual
flow: login/intake/assessment → original Dutch composer → save → Dutch review →
approve → manual preparation → send-confirmation disabled/unchecked → click Copy →
actual fresh server response/copied exact message checked inside QA browser → send
still disabled → explicit synthetic external-send acknowledgement → switch English
(acknowledgement remains checked/control enabled) → Dutch desktop/mobile captures →
English explicit confirmation → real DB historical timestamp → conversation/reminder/
opt-out/progress/private export → actual revision/cancellation → oversized refusal.
Before confirmation, the database stayed manual_action_required with null sent
timestamp. No external message was sent. One synthetic confirmation is not delivery.

Final browser39590 exited0/suffix99172b27: **all21 stages passed**,
Chromium148.0.7778.0; RPCmocks0/provideractions0/realSends0/errors[]/external[]. Four
exact expected password/export refusal diagnostics remain separately asserted.
Clipboard read/write permission was granted only to this disposable synthetic
browser context. Synthetic preverified users do not prove inbox delivery.

| Interface check    | Result and boundary                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Page identity      | Expected actual localhost:13216/outreach URL/title checked                                             |
| Meaningful content | Named Dutch queue and actual workflow controls rendered                                                |
| Framework overlay  | None observed; actual workflow completed                                                               |
| Console health     | No unexpected errors; four separately asserted refusal diagnostics                                     |
| Screenshots        | Desktop1365x1000/mobile375x812 captures inspected; readable controls/acknowledgement                   |
| Interaction        | Actual review/approve/prepare/fresh copy, language-retained acknowledgement and synthetic confirmation |

Screenshots outside repository:
`outputs/outreach-review-queue-browser-20261002-r1/review-queue-dutch-desktop.png` and
`review-queue-dutch-mobile.png`. Scrolled viewport captures, not whole-page or whole-site
accessibility acceptance. Source policies remain English by design.

Initial68900 exited1/suffix4f5fdb10 after the new preparation/copy/declaration flow
passed: the later cancellation fixture pressed Escape after the success notice but
before refresh/in-flight completion, so the modal correctly stayed open and hid the
account tab. Fixture now waits for refreshed cancelled-history state and clicks the
translated Close button, then waits for modal closure. No app guard/DB assertion
was waived. Failed browser1/runtimeDB0, all stopped without OOM. Final three exact
containers independently inspected stopped/exit0/noOOM:

- Browser `ec34e1b92a3318c9cc112bd269677eddf28c518c14bec689aa1dffa3559b6ecf`
- Runtime `bc091b94b0bf827eaaf0279ff0d840c9897275936f326efddeaac51518c16a9f`
- Database `5d50d880e727bd95eda6ec235ed31e92162df5f77377dcd6263b0637d43fea39`

## Identity and remaining work

Same exact isolated runtime
`sha256:c0dae360678496f1068bc3244dab2ac27c231bbd83d6491087f973f4541ada57`,
QA `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`,
MySQL `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
One readonly compiled frontend mount; zero app-source/backend/dependency replacement
mounts/public ports. Bounded isolated containers, no outside network, registration/
mail/retention/deletion/automation off, manual preparation only for synthetic QA.

Source hashes: queue
`08c98410b31ec9f321d5cb4b81940e5dd6d0652d29d22f9a2cca8640cc0be080`,
parent `03142ef6a7fe5add4f56c2c744da63046c18e78070ae7ad40173f113c2d233d4`,
selector `2d38f93f0d63de36151ad5d9240d6fc176ce8f6f4f72d66a99ad8e0ed2ef61ba`,
render test `73fde27b286a3f812cb2853470d3a87296e9727fd449efd0e7e57a82eb63e3d7`.
Browser helper `3550b79a87ded3f5e682122976f5ddfda3162da72604d193f2d99f7286bbbb5b`;
runner `f9ac6739d89260a9e92c6a5931107e5d39ecca35e0843490f09d3d31792961a9`.
Selected application538files/10,615,607bytes/digest
`68551f7b777f3cdbe7c656dc4062cfd1b696666cedf32362aac021d22d4749ba`.
This inventory excludes root/operator documentation/dependencies/image layers and
is not signed full-closure provenance.

Not a new immutable release qualification: earlier856-unit/724-database/restore/
readiness receipts remain tied to their older package. Current source/backend
synthetic workflow proof is bounded. Popup blocked/failure, clipboard denied,
rapid-click races, changing identity while acknowledged, suppression-confirmation
interaction, uncertain-response retries, different browsers/viewports and real
operator/provider/inbox acceptance were not all exercised here. No claim of their
complete current qualification. Remaining intake/export/account/admin language,
worldwide source coverage and production/legal/operational gates remain open.
Whole116-phase goal remains incomplete. No commit/push/merge/publication/deployment/
purchase/provider action/actual erasure. EUR100/month remains planning-only.
