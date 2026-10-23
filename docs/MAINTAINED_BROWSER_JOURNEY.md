# Maintained synthetic browser journey

Status on October 23, 2026: **first execution failed; corrected candidate unqualified**.
The native checks below are not browser, database, image-build or production
acceptance. Keep this candidate unmerged until its full CI and screenshot review.

### First maintained execution — failed, not qualified

[CI run 39892721763](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39892721763)
executed head `aa554fab3e68c5d2e98bfe06727c9e97f705ac97`. Application/container,
database, recovery, full load and actual TLS gates passed, and the browser image
built. The real browser completed the first three stages, then failed the
catalogue stage because the CJK assertion required a Noto postscript name.
Chromium's actual platform-font evidence reported `WenQuanYiZenHei`, non-custom,
with exactly three glyphs. The captured screen was inspected and showed the
three Chinese alias characters, not replacement boxes or a framework overlay.
[Debian's package record](https://packages.debian.org/trixie/fonts-wqy-zenhei)
documents the font's simplified/Traditional Chinese coverage.

The source correction accepts the installed Noto CJK or WenQuanYi family while
still requiring **exactly three non-custom glyphs**. Native tests execute both
positive cases and refuse missing/custom/last-resort/unrelated/wrong-count fonts.
No CSS, screenshot, rendered text, image font package, workflow stage, threshold
or emoji coverage check was changed to manufacture a pass. The complete rerun
and all-stage screenshot review remain required; this is not browser acceptance.

All three exact owned CI fixtures were removed: driver exited 1 for the failed
assertion, runtime/database exited 0, none was OOM-killed. The seven-day PNG-only
artifact is `synthetic-browser-screenshots-39892721763-1` (719,883 bytes compressed).
Six synthetic captures were downloaded outside the checkout for inspection;
no secret/archive/account-JSON artifact was downloaded. The failed run and
its head are retained, not rerun without a source correction or merged as green.

[The independent PR #122 run](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39893322814)
failed at the same CJK assertion with the same three WenQuanYi glyphs. Its newly
maintained redacted failure envelopes exposed the exact stage/error and recorded
zero console errors/external requests at that point. All three owned fixtures
were removed (driver 1, runtime/database 0, no OOM). This validates diagnostic
reporting for that failure, not successful completion of the journey. After the
source correction, all 214 native checks passed on Node 26.12.0 with zero
failures/skips (9,163.5296 ms); the actual complete rerun remains required.

## Cold static-asset compatibility candidate — not yet qualified

The latest source extends the combined browser/admission candidate; it does not
alter the previously assessed PR #125 head. It extracts the existing 60-second,
1,200-request client and 6,000-request process thresholds to one shared policy
module. No admission threshold is raised or lowered to make a test pass.

After all 24 workflow and six onboarding stages, the existing owned CI browser
captures the actual compiled `/outreach` resource graph at desktop (1365×1000)
and mobile (375×812) sizes. The probe retains duplicate resource requests,
requires the document, JavaScript and stylesheet, bounds the snapshot and permits
only canonical loopback `/outreach`, `/assets/…` and favicon resources. API,
external, encoded, query-bearing and traversal URLs are refused.

For each viewport, it waits 61 seconds for the existing bucket to expire
naturally, then offers **100 complete asset sets from one client address**, with
at most 16 HTTP requests in flight. No application restart, quota reset,
forwarded-address spoofing, automatic retry or extra database/container fixture
is used. The receipt requires every expected request to complete within the
60-second window with status 200, matching body SHA-256, decoded byte count and
MIME type. Quota denials, redirects, dropped work and content mismatches fail
qualification; reduced client counts cannot produce a passing receipt.

This measures **cold static-asset delivery**, not 100 rendered browser contexts,
concurrent authenticated sessions, API load, shared-NAT fairness under arbitrary
traffic or a hosted service-level guarantee. The screenshot pair documents the
two resource-capture views, not the rendering of 100 users. Existing driver,
fixture and workflow deadlines are unchanged.

On local Windows, the 17 focused native browser-fixture checks passed on Node
26.12.0. Their ephemeral HTTP server exercised 300 requests per three-resource
scenario, positive body checks, deliberate content changes, 429 refusal and
redirect refusal without retries. These are transport/algorithm checks against
synthetic bytes, **not results from the compiled product or a real browser**.
Full exact-head CI, both actual compiled-asset scenarios, the complete ordered
30-stage browser receipt, screenshot review and a fresh security scan remain
required before any merge/release claim. A draft publication preserves progress;
it is not acceptance or authorization to expose a service.

## What this gate proves when it passes

The flow under test is: compiled login -> authenticated workspace -> reviewed
candidate intake -> assessment -> original draft/review/manual-action recording
-> conversation/reminders -> retained progress -> private exports and retry-safe
CSV intake, with English/Dutch and desktop/mobile checks.

The driver uses actual browser actions, actual HTTP endpoints and real MySQL
persistence checks. It does not fulfill RPC responses. One deliberately lost
response occurs **after** a real CSV import commits; replay must reuse the same
request and must not duplicate the record. Refusal diagnostics are enumerated,
not globally ignored. All 24 stages must complete in their original order:

1. `normal-and-hover-login-text-contrast`
2. `responsive-login-headings-and-keyboard-form`
3. `real-login-and-compiled-workspace`
4. `current-catalogue-alias-search-and-responsive-rules`
5. `human-declared-candidate-intake`
6. `dutch-candidate-corrections-retain-evidence-and-unsaved-inputs`
7. `real-assessment-before-opt-out-enables-retained-progress`
8. `original-draft-review-approval-manual-preparation`
9. `synthetic-manual-completion-receipt-no-delivery`
10. `future-reminder-persists-and-queue-renders`
11. `real-http-reminder-account-isolation`
12. `response-requires-review-and-clears-reminder`
13. `desktop-mobile-history-and-reminder-controls`
14. `close-retains-history-and-clears-reminder`
15. `dutch-candidate-details-archive-restore-opt-out-retain-evidence`
16. `dutch-progress-save-preserves-opt-out-original-notes-and-language-switch`
17. `export-requires-current-password-and-explicit-private-review`
18. `actual-private-json-download-includes-closed-conversation-not-credentials`
19. `real-http-export-account-mismatch-and-anonymous-refusal`
20. `dutch-unsent-revision-cancellation-retains-version-history`
21. `dutch-csv-guidance-language-switch-preserves-unsent-declaration`
22. `committed-csv-lost-response-replays-without-duplicates`
23. `rejected-csv-requires-explicit-record-review-before-editing`
24. `oversized-retained-export-refused-without-partial-download`

A successful receipt requires no unexplained console/page errors (including
the help popup), no external
requests/provider actions, no real sends, zero RPC mocks, one injected lost
response, one synthetic manual-completion record and the explicit declaration
that the accounts were preverified synthetically, not through an inbox.
A record entering `confirmed_sent` here is a test of the user's manual
acknowledgement path, **not delivery**.

## Required private-profile onboarding extension — not yet executed

The original 24 stages remain unchanged and mandatory. The same owned fixture
then runs six additional stages from `browser-onboarding-journey.mjs`; the
passing receipt requires both exact ordered lists, not either one:

1. `private-profile-first-run-language-and-responsive-review`
2. `private-profile-real-save-retains-canonical-private-data`
3. `private-profile-unsaved-edit-roundtrip-and-reload`
4. `private-profile-second-save-and-fresh-session`
5. `private-profile-http-owner-and-publication-refusals`
6. `private-profile-cross-account-browser-boundary`

The flow under test is: existing synthetic login -> empty `/onboarding` editor
-> all four English/Dutch wizard steps -> private save -> real SQL/canonical
signals/audit checks -> retained unsaved edits and documented reload loss ->
second save with stable row identity -> new cookie/login -> owner/publication
HTTP refusals -> a different account's empty editor. Screenshots cover 1365×1000
and 375×812 for basic/review/unsaved/fresh-session/other-owner states.

Only actual UI/HTTP calls perform profile writes. SQL observes one exact owner
row, private visibility, all eight completeness signals, two successful saves
and no foreign-owner profile. Server rejection of `isPublic: true` and a stale
foreign account key must leave these rows unchanged. No RPC response is mocked.
The extension creates no additional fixture/account, receives no new secret,
does not change browser/time/resource/network limits and cannot be run as an
independent CLI. It reuses the parent's validated synthetic origin/owners and
credential-redacted failure reporting. Receipt checks refuse missing/reordered
onboarding stages, including an otherwise passing original 24-stage receipt.

This is source-defined acceptance, not a browser result. Native SQL-row fixtures
and invalid-configuration/receipt tests exercise those pure assertions and guards,
not the UI. The actual full journey, teardown and screenshots remain unverified.
Fresh-cookie login is not a claim of server-side logout/revocation or real inbox
registration. Admin/recovery/settings/deletion and other retained paths still
need their own current acceptance; this extension does not close the whole goal.

Local Windows Node 25.2.1 passed all **213 native operator/source checks** with
zero failures/skips (9,437.3625 ms), including 11 focused browser-policy checks.
The new tests execute the actual row assertions against canonical/encoded SQL-row
fixtures and reject duplicate/foreign/public/incomplete/changed-identity rows;
they also exercise invalid origin/owner refusal before I/O. Syntax checks include
the new module, and source checks preserve the original 24 stages and require
the extension before a passing receipt. These are not rendered UI tests.

## Commands and artifact boundaries

`pnpm test:browser-journey` runs native safety/receipt/source-contract checks;
it does not start a browser or Docker fixture.

`pnpm test:browser-journey:integration` runs the real bounded journey. First
build the existing `integration-test` and `runtime` targets and the new
`browser-test` target. CI does this in order; ordinary `pnpm test:all` also
requires the browser gate rather than silently omitting it. The local-image
selectors are `BROWSER_JOURNEY_RUNTIME_IMAGE`,
`BROWSER_JOURNEY_TEST_IMAGE` and `BROWSER_JOURNEY_DATABASE_IMAGE`.
Defaults are `cofounder-recovery-runtime:local`,
`cofounder-browser-test:local` and the repository's pinned CI MySQL reference.
Missing images refuse before creating files/resources. The runner never pulls,
accepts an operator's database address, mounts working application code or starts
a provider integration.

The test-only image uses the already locked Playwright dependency and its own
matching Chromium installation, plus redistributable Noto CJK/emoji fonts.
No new npm package or production browser binary is added. Browser installation
and OS dependency commands follow [Playwright's browser guidance](https://playwright.dev/docs/browsers).
The Node 26 / Debian 13 combination is listed in
[its system requirements](https://playwright.dev/docs/intro#system-requirements).
The browser runs trusted synthetic app code, not external websites.

The fixture has three separately inspected immutable local images:

| Role                     | Resources and isolation                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Fresh database           | UID 999, 1 CPU, 2 GiB memory/swap, 256 PIDs, tmpfs data, network `none`                                             |
| Exact production runtime | UID 1000, 1 CPU, 512 MiB memory/swap, 256 PIDs, default startup supervisor, shared owned database network namespace |
| Browser driver           | UID 1000, 2 CPUs, 2 GiB memory/swap, 256 PIDs, init/reaping, private tmpfs scratch, shared owned network namespace  |

All roots are read-only, capabilities dropped, no-new-privileges set, and no
ports, host network/IPC, Docker socket or persistent data volume is published.
Only the driver's newly created synthetic screenshot directory is writable as a
bind mount. DB/JWT secret files have separate read-only mounts; the browser never
receives the session-signing secret. Both database passwords and the fake user's
password are randomized. The browser script rejects inline database URLs and
accepts only its exact synthetic schema/loopback/role and UUID configuration.

The receipt explicitly identifies its transport as isolated HTTP loopback and
refuses a claim of hosted HTTPS verification. This UI rehearsal does **not**
replace the separate mandatory TLS/session/role rehearsal, browser trust testing
against the approved hosted origin, real inbox registration, onboarding and all
other retained journeys, actual device/assistive-technology acceptance or real
users. These remain release gates.

## Evidence, timeouts and cleanup

The driver has a nine-minute watchdog, bounded browser/HTTP actions and a
ten-minute parent attach deadline; the outer test allows time for teardown.
Public requests are blocked and counted. Chromium's no-sandbox test setting is
confined to this trusted, network-isolated test driver, not a production browser
service or permission to crawl.

Every fixture's exact ID, name, UUID owner, image, resources, network, user and
mounts are inspected before starting it. An uncertain create reconciles only the
same exact UUID name; it never creates a replacement. Observation expiry is not
proof of a missing or stopped container. Teardown revalidates ownership/image,
stops/removes only those exact owned resources and requires clean exit/no OOM on
a passing run. Unverified creation/removal retains secret scratch files and
reports a recovery handoff instead of deleting them. No broad prune is used.

Screenshots remain in a separate fresh `cofounder-browser-artifacts-*`
directory, outside source. CI retains **PNG only** for seven days using the
verified `actions/upload-artifact` v7.0.2 commit
`cf430e030ddbb5b0abf93d22962f4752f3646cd9`; no secret file, account JSON
download, trace or local diagnostic archive is uploaded. An operator can select
an existing artifact parent with `BROWSER_JOURNEY_ARTIFACT_ROOT`; the runner
still creates its own unique child, never overwriting or deleting that parent.
Passing assertions/screenshots need inspection before a qualification claim.

The fixture relays only four known driver failure envelopes from stderr, at most
eight records with 2,048-character redacted errors. Stage names and diagnostic
fields are allowlisted; raw Docker messages, stack traces and arbitrary extra
fields are dropped. Parent-side redaction also covers all generated fixture
secrets. This preserves actionable failure context without uploading raw logs.
Native tests exercise malformed, oversized and injected diagnostics, redaction
and the record limit; this is not proof that the browser journey has run.

## Port provenance and actual local checks

The reviewed source is the prior synthetic 68-source, 24-stage driver from the
local recovery archive, entry
`outputs/indonesia68-whole-workflow-20261002-r1/browser.cjs`,
SHA-256 `e3498cd6bc5b3a47ba0b8773160a23ea48e3f258cb41a1b733e31e37334c6d32`.
Only reviewed source was adapted; the archive, private diagnostics, Windows
fonts and screenshots were not copied into Git or uploaded. The stage list and
action/persistence assertions were retained. The adaptation replaces its fixed
credential, ad-hoc image paths, 68-card count and proprietary font assumptions;
it adds WASL/France/Indonesia searches, strict file-only fixture configuration,
redacted failures, shared exact-order receipts and the owned fixture lifecycle.

On local Windows Node 25.2.1, syntax checks and all **207 native operator/source
tests** passed, zero failures/skips (latest repeat: 8,953.2674 ms). The first run found one
format-sensitive source-contract assertion; whitespace-independent matching
retained the same network/mount/ownership checks. Native tests also prove refusal
before browser/database package loading without authorization, canonical URI
limits, credential redaction and rejection of skipped/reordered stages or
fabricated delivery/provider receipts. Source inventory now binds the two root
gate files and the app-side driver/policy.

The browser image has not been built locally, the maintained browser journey has
not run, and no new local database/container fixture was created. This does not
resolve the policy-blocked older Windows fixture. Current full CI, screenshot
review, real runtime behavior and all broader production acceptance remain
unproven; all original phase statuses remain Partial.
