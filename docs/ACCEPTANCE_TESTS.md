# Acceptance tests

## Automated

- TypeScript compile: all client/server shared paths.
- Unit: state transitions, CSV bounds/escaping, password hashing, rate limits, safety
  defaults, matching, filters, timelines, and legacy behavior.
- MySQL integration: migrations, profiles, matching, monitoring, owner isolation,
  durable import replay, and the full assisted outreach transition sequence.
- Production build: route-level code splitting and server/migration bundles.
- Container smoke: build the release image, start the production Compose stack, and
  check database-backed readiness plus disabled automation/legacy/HAI defaults.
- Dependency audit: full workspace moderate-or-higher advisory gate plus the
  separate production high/critical gate; neither replaces a security review.

## Runtime

- GET /api/health returns process/runtime status.
- GET /api/ready returns 200 only after a real database query.
- Required browser acceptance includes registration, sign-in, import, review,
  responsive layout, console errors, and a fresh session. A synthetic verified
  account does not prove registration, real inbox verification or delivery.
- HAI returns 503 without configuration, 401 with an invalid bearer token, and an
  owner-scoped Generic JSON Feed with a valid token.
- ngrok is accepted only after both local readiness and public HTTPS health succeed.
- Hosted browser acceptance also requires sign-in over HTTPS, a Secure/HttpOnly
  session cookie, no console or page errors, and no horizontal overflow.

## Current local connected proof — October 2, 2026

Subsequent [scheduled-arrival extension](SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md)
passed scheduler/source tests (1,019 host units/99 files) but failed the actual
150/s all-success load gate with 65 busy refusals. Retained closed-loop/write/race
cases still passed, not overall capacity acceptance. No threshold relaxed;
quiet-host/demand diagnosis and hosted capacity remain open.
The identical repeat without concurrent agent tests failed again at 150/s (162
busy responses, 56 busy-actor drops). This does not pass the new gate or identify
the bottleneck; other host applications remained running and untouched.

The latest [Indonesia directory source increment](PLATFORM_INDONESIA_REVIEW_2026-10-02.md)
has focused permission-boundary/typecheck/build/operator proof and subsequent
[fresh package qualification](INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md):
1,009 packaged units, 724 database cases, compiled/migration parity, compiled-server
startup probes and seven connected desktop/mobile catalogue stages. Eight owned
fixtures independently stopped exit 0/no OOM/no public ports. Catalogue is 68
listings, no integration or expanded action permission. Subsequent 24-stage customer
journey and default-startup cancellation/readiness/drain passed, with eight more
owned fixtures independently stopped exit 0/no OOM/no public ports. Subsequent
encrypted recovery passed one full case/106.33s and 34 unit cases, with two-owner
access/stale authority/mail checks and four independently stopped fixtures.
Subsequent bounded read/write load passed 30,000 baseline requests, 200 paired-edit
races and 400 wrong-owner mutation refusals, with three independently stopped
load fixtures. Overload mostly refused work; whole-product/hosted load remains open;
receipts below remain attached to their earlier source/artifact identities.

The latest [candidate-list language checkpoint](CANDIDATE_WORKSPACE_LANGUAGE_2026-10-02.md)
passed seven connected stages on a fresh runtime: real login and populated list,
Dutch controls, language-switch search/status/order/page/result preservation,
literal search, opt-out gates, keyboard/responsive checks, mobile sideways action
access and details-dialog open/close. All candidate rows unchanged; zero unexpected
console/HTTP diagnostics, API mocks, external requests or sends. This is narrower
than full release acceptance. Subsequent exact-image qualification passed the full
mandatory database suite (724 cases/43 files, no skips), 117-file compiled/migration
parity, default startup and both locked-migration cancellation probes, and three
24-stage customer journeys. Final desktop/mobile reminder captures were corrected
and visually inspected. Lost-response import replay was a real committed write,
not an RPC mock. Eight expected refusal/fault diagnostics and zero unexpected
diagnostics/external requests/real sends; all 19 owned fixtures stopped exit 0.
Subsequent exact-image local encrypted recovery passed one full case (73.81s) and
34 tool units: schema/data/objects retained, actual restored-owner login/isolation,
expired authority refusals and four restored mail jobs discarded without provider
attempts. Four owned recovery fixtures independently stopped exit 0/no OOM.
Subsequent exact-image bounded closed-loop read/write load passed five tiers with
30,000 baseline requests, 200 paired-edit races and 400 wrong-owner mutation
refusals, independent stored-row/audit checks and three owned fixtures stopped exit
0/no OOM. Overload mostly returned valid busy refusals, not 100-user successful
capacity. Earlier receipts below retain their own image identity; remote/operator
recovery and whole-product/open-loop/soak/hosted load remain unqualified.
Actual registration/inbox/provider/hosted acceptance
and all retained features are not proven by these synthetic flows.

The [67-source exact-package checkpoint](FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
contains expected/actual results and artifact IDs: six catalogue stages and a
broader 24-stage customer journey through candidate corrections, original-draft
review, synthetic manual outcomes, reminders/history, opt-out/progress, private
JSON download and uncertain CSV-import replay. A visual emoji defect in QA was
followed up with actual rendered-font evidence and a full rerun, not ignored
because functional checks passed. These use isolated synthetic accounts, no RPC
mocks and zero real sends; they do not prove registration/inbox/provider delivery,
all retained UI/API/worker routes or approved hosted/customer acceptance.

The original phase IDs and unfinished acceptance criteria are now recorded in
GOAL_COMPLETION_MATRIX.md. Requirements-integrity checks are structural only;
they do not establish functional completion. Current dated execution evidence is
in PUBLIC_BETA_DELIVERY.md. FINAL_VERIFICATION_REPORT.md retains historical results
and current limitations, not a completed final release approval.
