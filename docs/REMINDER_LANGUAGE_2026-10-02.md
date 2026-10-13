# English/Dutch reminder queue — October 2, 2026

## Implemented behaviour

The reachable FollowUpQueue now uses the existing browser language preference for
all authored panel copy: heading, explanation, filters, refresh/retry/loading,
empty/refused states, reminder state labels, conversation control names and
pagination. Its section declares its actual content language, overriding the
still-English workspace ancestor. Server error text remains unchanged and is
explicitly marked English; candidate names/platform values are not translated.
All nine current outreach states have authored English/Dutch labels. An unknown
state gets a truthful unknown-status label instead of pretending it is understood.

Dates use en-GB or nl-NL formatting according to the selection, retaining the
device's local time zone. The panel now states that time-zone boundary. Missing
or invalid dates display a localized unavailable label. Language switching does
not reset the filter/page or change stored reminders, account identity, network
query keys, polling cadence or approval/delivery rules. These remain internal
reminders, not scheduled messages or email notifications.

The React best-practices skill guided deriving presentation from current language
during rendering, without extra state/effects or an additional translation
service. Selector and workspace notices accurately include this newly translated
panel while retaining the limitation for other detailed tools/admin/server copy.
This does not complete original phase 057 or claim full bilingual support.

## Verification

Before the implementation all five initial regression cases failed. After repair,
the expanded reminder-language suite (six cases), interface-language and existing
conversation-screen checks passed: **17 tests / 3 files, no skips, 1.69 seconds**.
They cover both languages, labels, every current state, original user content,
date formatting, invalid/missing data, loading/empty/error and owner mismatch.
Final type checking and local build session **88456 ended with exit 0** (Vite
7.3.6, 6.62 seconds). These use the installed Windows toolchain, not a clean
locked container rebuild. The earlier packaged image's 827 unit tests do not
qualify these newly changed bytes; the full unit/database suites were not rerun.

External browser fixture outputs/reminder-language-browser-20261002-r1 uses the
previous exact runtime image
`sha256:ac37fba81aaae6ac424de5360059259fd6968aa8dfc953342e53598f7f725c46`
with the **new compiled frontend mounted read-only** at /app/dist/public. No
application-source/dependency mounts or public ports; the disposable database is
network-isolated and all actions use synthetic accounts. This is explicitly not
immutable-image qualification. Chromium's inherited disposable-test no-sandbox
exception remains, with bounded non-root/read-only containers.

First session 35658 passed the 16 existing stages plus language assertions inside
the reminder stage. Its viewport screenshot showed the workspace above the queue;
the final helper therefore captures the queue element itself. After the notice
correction, **39335 ended with exit 0**, suffix6ba95aa0: all 16 stages passed.
The reminder stage switches English to Dutch, checks section language, current
scheduled filter, internal-only wording/local-time boundary/current state/control
name, checks 375px document overflow, captures desktop/mobile and switches back
without losing the filter. Remaining real-HTTP history/export/refusal journeys
also pass. No RPC mocks, outside requests, unexpected browser errors or real sends;
four expected refusal diagnostics and one synthetic manual completion record.
The final mobile queue image was visually inspected.

Independent post-run inspection confirmed stopped/exit0/noOOM for browser
`d8f6947ebf2aa4586318707304b7a2ed365c35c5a5ea53ba38e4715e93190f1c`, runtime
`c3eafa59b66ae082914b185670720656ab058de8f5cc7e8aa48dd3016bee0d2e` and database
`b3942db854b83101a110389495058d4344b942915dd7a1aaecb3d415dca88cec`.
Runner SHA2564b81dd951882899fd66f7990d46de424629cd0d984859b5569008985821e443a;
final browser helper666734d67a677be13c0f9a2490fae7759564cfad7501c20d56c0d01ce18bc60f.

## Evidence scope and remaining work

The static API snapshot was refreshed for the three changed frontend source
files and shifted reminder-hook line. Its eleven tests pass without skips
(1384.2608ms):165 operations,58 admitted,107 denied,54 reachable references,
zero unknown hooks; input digest
`a2c7b8c0f8eb954ab4024367414e7614d2e2d8f93ae5cdbe93bf279356eddc74`.
The temporary stale-snapshot failure was corrected by updating source evidence,
not weakening assertions or changing route admission. This remains static review,
not functional verification of every endpoint.

Selected source/build inventory534files/10,510,909bytes/digest
`9f3b751fcb181a2cbd66dedf8e40b93ac9244fe9e5ad9a0dfc5a04199b32ac8f`.
Root/operator/docs/dependency/image-layer scope is excluded; no signed or causal
build provenance is claimed. Whole-workspace translation, new immutable packaging,
broader accessibility, real-user language review, privacy/erasure approval,
providers, hosted operation and worldwide source completeness remain open.
No commit, publication, live provider action or spending occurred.
