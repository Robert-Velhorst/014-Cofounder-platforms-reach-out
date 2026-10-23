# Maintained synthetic browser journey

Status on October 23, 2026: **implemented in source, not yet executed or qualified**.
The native checks below are not browser, database, image-build or production
acceptance. Keep this candidate unmerged until its full CI and screenshot review.

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
