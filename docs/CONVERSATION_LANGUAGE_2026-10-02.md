# English/Dutch conversation controls — October 2, 2026

## Implemented scope

ConversationControls now uses the existing interface-language context for its
complete authored panel: heading/accessible region name, internal-only safety
explanation, historical timestamps, response acknowledgement, scheduling/local
time-zone guidance, stale-revision warnings, cancellation, closure acknowledgement,
success/replay notices and uncertain-save/reload/retry guidance. Dates use en-GB
or nl-NL with the device's local time zone; invalid retained dates show unavailable.
The datetime-local input remains browser-native: its placeholder/calendar language
depends on the browser, not solely on the application's language preference.

The panel overrides the still-English workspace ancestor with its actual content
language. Original server-error messages remain explicitly English. Local fallback
errors and success notices are stored as semantic states and translated during
rendering, so they do not retain the language in effect when they were created.
The React best-practices skill guided this derived-presentation approach, without
new synchronization effects, translation services or extra presentation state.

No approval, idempotency/retry command, revision binding, date-to-UTC conversion,
network payload, account fence, mutation guard or notification policy changed.
Acknowledgements still bind to the current revision; suppressed candidates still
cannot receive new reminders. Recording a response stores the user's historical
acknowledgement, not the original reply content/time. Closing clears the reminder
and retains history; it neither deletes history nor opts the candidate out.
Selector/workspace notices accurately include conversation controls while other
detailed tools, admin and server messages remain English. Phase057 is incomplete.

## Actual verification

Two new Dutch cases initially failed while the three existing English cases
passed. After implementation and two additional edge checks, conversation,
reminder-language and interface-language suites passed **21 tests / 3 files,
no skips, 2.92 seconds**. Cases cover complete Dutch labels, suppression, local
dates, invalid timestamps, blocked/closed controls and original English behaviour.
Type checking/build session **20537 ended with exit0**, Vite7.3.6/12.20seconds.
This is the installed Windows toolchain, not a new frozen-dependency image build.
The full unit/database suites were not rerun for these new bytes.

External fixture outputs/conversation-language-browser-20261002-r1 uses the
previous exact runtime ac37fba8... with the newly compiled frontend mounted
read-only at /app/dist/public. Its inspected image identities, disposable
synthetic accounts, bounded non-root/read-only containers and network isolation
are inherited from the [reminder receipt](REMINDER_LANGUAGE_2026-10-02.md).
No application-source/dependency mounts, public ports, RPC mocks or outside
requests; the disposable Chromium no-sandbox exception remains. This does not
qualify a new immutable image or real inbox/provider delivery.

Browser session **58585 ended with exit0**, suffixeb1c5a07, all **16 stages passed**.
After exercising language switching in the queue, the fixture opens Dutch
conversation controls, checks response action disabled until acknowledgement,
records the response, verifies Dutch success text and actual database response
state/timestamp/reminder clearing, schedules another reminder at mobile width,
closes with acknowledgement and checks retained body/history and cleared reminder.
It then returns to English for retained export/refusal journeys. No unexpected
browser errors; four explicitly expected refusal diagnostics. One synthetic
manual completion receipt, zero real sends/provider actions. The Dutch mobile
control-panel screenshot was visually inspected; modal scrolling and native
browser calendar language are not whole-product accessibility acceptance.

Independent inspection confirmed all owned fixtures stopped/exit0/noOOM:

- Browser8b64d2f75ddf4f1c5f9ea2b039bcaed2b074c9e941bb9164463ff902e9db33c0.
- Runtime51e9e292256a67d1f390ec2eb9b77ad5f698fced5092b95d9cab24254ae8aae7.
- Database7a55d665ec2e1780d1d74eac4f6d449bcf6e315ea6b054ecd365b1090807c227.

Runner hash4b81dd951882899fd66f7990d46de424629cd0d984859b5569008985821e443a;
browser55445e355e92de66fb26bc1429581c5e02fd9528b846050c39aef9723289a7cb.
Uncertain-save/conflict/replay localization is implemented but not separately
exercised through browser failure injection in this run. No broad failure-path
or full bilingual acceptance is inferred from the happy-path check.

Static API snapshot refreshed: eleven scanner tests pass/no skips1260.3219ms;
165operations/58admitted/107denied/54reachable/0unknown unchanged. Source digest
78fe5807de65038c9ec7c2b346b74bd65ec96c17b4164f4f038f14302d548d0b.
Selected source/build inventory534files/10,519,674bytes/digest
1257bf49fd614fe1f1416b48238aa2b76a37c7641d0d33ad3e0bfeab1c7b3e97;
excludes root/operator/docs/dependencies/image layers and is not signed provenance.
Privacy/retention/erasure decisions, broader localization, live operational gates
and the full116-phase outcome remain open. Nothing committed, published or spent.
