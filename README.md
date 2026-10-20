# CoFounder Outreach

A private workspace for finding potential co-founders, reviewing individual
outreach messages and keeping track of conversations. You research people,
decide whether contact is appropriate and send messages yourself. The application
organizes that work; it does not automatically contact people.

**Status: in development for a free public beta, not approved for public production.**
Local checks have passed, but live hosting, email, privacy/operator decisions and
complete release acceptance remain unfinished. This describes the current working
tree, not a verified GitHub main deployment. Initial budget planning is
**EUR 100/month**; no purchase or deployment is authorized by that plan.
The [October 2 GitHub snapshot](docs/GITHUB_REPOSITORY_STATE_2026-10-02.md) records the historical repository state; current branch and PR status must be checked live.
Latest local increment uses [one live joined account/session read](docs/AUTH_JOINED_READ_2026-10-03.md)
per authentication instead of two, preserving owner, revocation, expiry and
deletion-fence checks. Actual SDK regression proves 40 reads instead of 80 for
40 authentications; typecheck, all 1,036 units and a fresh 11-case MySQL session
suite passed. Full current-candidate runtime/database/admission/load qualification
remains pending, so no capacity fix is claimed.
The preceding increment [reuses authentication query construction](docs/AUTH_QUERY_REUSE_2026-10-02.md)
without caching account/session results. Its [fresh packaged qualification](docs/AUTH_QUERY_REUSE_PACKAGE_2026-10-03.md)
passed typecheck/build, 1,030 unit cases, all 725 database cases and compiled
package parity. The original full workload still failed at 150 requests/s:
95 busy refusals and three actor-start drops. Read/write/race/isolation checks
passed their retained rules; fresh browser/recovery checks on that image remain
pending. This is not a capacity fix or public-release approval.
The previous packaged increment adds [bounded session-key reuse](docs/SESSION_KEY_REUSE_2026-10-02.md):
one import instead of 41 for signing plus 40 concurrent authentications, without
caching account/session decisions. Fresh candidate typecheck/build and 1,025 unit
cases passed. The unchanged full workload still failed at 150 requests/s (125
busy refusals); retained write/race/isolation checks passed. This is not a capacity
fix or full release qualification; earlier package receipts retain their own scope.
Fresh mandatory database acceptance also passed 724 cases across 43 files without
skips, with matching compiled application/migration files in the runtime and test
packages. A fresh 24-stage connected browser workflow passed, including private
export and lost-response CSV retry. This is not all UI/accessibility acceptance;
isolated encrypted recovery also passed, including restored-owner isolation and
revoked-link/session refusal. Off-host recovery, post-backup reconciliation,
hosted acceptance and the capacity failure remain unfinished.
Capacity diagnosis remains open. Increasing only the app or database to two CPUs
did not clear the full workload. Identity-only failures also persist without
warmup; one two-CPU identity pass failed on unchanged repeat. The latest
[database boundary measurement and diagnostic history](docs/IDENTITY_DATABASE_BOUNDARY_2026-10-02.md)
reproduced failure despite no new database-quota throttling and short measured
server SELECT times. Application/protocol/scheduling delays remain to distinguish;
no reliable fix or production sizing is approved. The maintained
[authentication-admission regression](docs/SESSION_KEY_REUSE_2026-10-02.md)
detects removal of its guard, but does not certify capacity. Diagnostic images
and shortened tests do not replace complete release acceptance.
The latest [sampled application profile](docs/IDENTITY_CPU_PROFILE_2026-10-02.md)
reproduced failure without new app/DB/driver quota throttling. No single dominant
function or reliable fix has been established; the first mistimed profile was
rejected, then rerun with explicit readiness acknowledgements.

## Start here

- Everyday users: [purpose](#who-this-is-for), [workflow](#what-the-app-does),
  [platform coverage](#platforms-and-worldwide-coverage) and [limits](#what-the-app-does-not-do).
- Developers: [architecture](#architecture), [setup](#developer-setup) and [verification](#ci-and-verification).
- Operators: [Windows setup](#quick-start-for-windows-operators),
  [configuration](#environment-variables) and [production requirements](#production-readiness).
- Exact field limits, retry behavior and operator contracts:
  [detailed reference](README_REFERENCE.md). The complete previous README is
  preserved there; dated checkpoints retain their historical scope.
- Full original scope: [116-phase matrix](docs/GOAL_COMPLETION_MATRIX.md) and
  [delivery ledger](docs/PUBLIC_BETA_DELIVERY.md).

## Who this is for

Founders looking for a complementary partner can keep research, candidate notes,
reviewed messages, opt-outs and reminders together. It supports a deliberate,
person-by-person process, not a bulk campaign.

Developers and operators can work on the full-stack application and its account,
privacy and deployment boundaries. Older demo/experimental code is also preserved.
A file existing in the repository does not make it supported or safe to enable.

It is not a public co-founder marketplace, recruitment agency or compatibility
guarantee. Saved profiles are private; public-directory publishing is a separate,
unimplemented consent workflow.

## What the app does

1. Sign in, or register when enabled by the operator. New accounts require
   genuine email verification before protected workspace work.
2. Save private background, goals and work preferences through onboarding.
3. Browse the source catalogue. Read eligibility, costs and restrictions before
   using an external service separately.
4. Add a candidate or import permitted direct-from-person data, recording
   processing rights and evidence. Resolve duplicates without overwriting
   existing consent or provenance.
5. Inspect and qualify candidates with explainable criteria. A score is a
   research aid, not outreach permission or proof of compatibility.
6. Write an original individual message. Private saved templates can help begin
   a draft, but applying a template is not approval or sending.
7. Submit and explicitly approve the reviewed draft and relevant declarations.
8. Prepare a manual action, copy the message and contact the person outside
   this app if authorized. The application never clicks Send.
9. Record what you did. A user-confirmed send is not provider-confirmed delivery.
10. Record replies/outcomes, schedule internal reminders, close conversations
    and review progress. Reminders do not automatically send follow-ups.

Other supported controls include candidate search/pagination, reviewed
corrections, archive/restore, opt-out, unsent outreach revision/cancellation,
bounded change history and private exports.

### Import and export

CSV intake is bounded to 512 KiB and 1,000 records. Imports are atomic, require
source/account checks and declarations, and have content/declaration-bound retry
receipts. Import rights are not outreach consent. Blocked sources cannot be
relabeled as manual data to evade their rules.

Active-candidate CSV export is account-bound and size-limited; formula-risk
values receive visible protective prefixes. Unsaved previews and foreign-owner
records are excluded. Private account JSON export requires current-password
confirmation and is not a whole-service backup. Exact limits and omissions:
[CSV export](README_REFERENCE.md#exporting-active-candidates),
[account export](README_REFERENCE.md#downloading-private-account-data).

### Account deletion and recovery

Deletion requests, when enabled, are review-held intake—not instant erasure.
Operator review, dependency inspection, work fencing and processing preparation
are distinct from an approved complete retention/erasure service.

Verification, password recovery and security-notice mail have durable admission,
encrypted queued payloads and attempt ceilings. Actual sender configuration and
inbox acceptance remain necessary; delivery is not simulated when unavailable.
Administrator security uses a separate reviewed enrollment/recovery workflow.

### Pages and languages

| Page                                  | Purpose                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| `/`                                   | Product entry page                                      |
| `/help`                               | Public English/Dutch user guide; no account data loaded |
| `/login`                              | Sign-in and optional registration                       |
| `/verify-email`                       | Email verification                                      |
| `/forgot-password`, `/reset-password` | Account recovery                                        |
| `/onboarding`                         | Private profile setup                                   |
| `/outreach`                           | Candidate, catalogue and manual outreach workspace      |
| `/admin/security`                     | Administrator security                                  |
| `/dashboard`                          | Redirect to `/outreach`, not the historical dashboard   |

English/Dutch interface support covers several customer flows, including current
CSV import/export and candidate-list search, status/order, pagination and row-action
controls. Switching language preserves list selections and results; original
candidate content and status codes remain unchanged. Some workspace/server text
and source evidence remain English.
User messages and protocol field names are not automatically translated. Other
languages, full accessibility and all browser/device combinations are unqualified.

The preceding [candidate-list language checkpoint](docs/CANDIDATE_WORKSPACE_LANGUAGE_2026-10-02.md)
passed typecheck/build, 1,004 packaged unit cases, 36 focused cases, 170 operator
checks and seven connected desktop/mobile stages on a fresh runtime image. Mobile
table actions are reachable by sideways scrolling. Subsequent checks on this exact
runtime passed 724 database cases across 43 files, compiled/migration parity,
default startup and migration cancellation, and the broader 24-stage customer
journey. Subsequent current-image local encrypted recovery passed, including
restored-owner login, expired authority and mail discard without provider contact.
Current-image bounded read/write load also passed at 100 synthetic accounts and
10,000 candidates, including paired-edit races and wrong-owner refusals. Overload
mostly returned controlled busy responses, not 100-user successful capacity.
Whole-product/hosted load and remote/operator recovery remain open; neither
checkpoint approves a production release.

## Platforms and worldwide coverage

The catalogue source currently contains **68 public discovery records**: 21 dedicated
services, 24 community/channel routes and 23 programme/event/ecosystem routes.
These are not 68 working integrations or a complete worldwide list. Regional
supplements cover multiple ecosystems; geographic, native-language and
membership-only gaps remain.

Latest source increment: [Indonesia directory review](docs/PLATFORM_INDONESIA_REVIEW_2026-10-02.md).
The new founderbro card is discovery-only, with scraping/bulk-export restrictions;
no profile import, contact permission or integration is added. Its
[fresh package qualification](docs/INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
passed 1,009 packaged units, 724 database cases, compiled parity/startup probes and
seven connected catalogue stages, then the 24-stage customer journey and actual
default-startup cancellation/readiness/drain. Local encrypted recovery also passed,
including two-owner access and stale authority/mail refusal. Bounded read/write
load also passed 30,000 baseline requests, 200 paired-edit races and 400 wrong-owner
mutation refusals. Overload mostly refused work, not 100-user successful capacity;
whole-product/hosted load remains open. Preceding
receipts keep their exact artifact scope. No production release is approved.

Subsequent [scheduled-arrival load](docs/SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md)
adds independent request cadence and explicit client-drop accounting. Host units
passed 1,019 cases, but the real load run failed its predeclared 150-request/s
all-success gate (65 busy refusals). The 50/s sample passed; 500/s demonstrated
controlled overload with substantial refusals/drops. This is not hosted capacity,
and the failed result remains a release risk; thresholds and service limits were
not relaxed.
An identical repeat without concurrent agent tests failed again at 150/s (162
busy responses plus 56 unstarted busy-actor arrivals). Competing unit tests alone
do not explain the limit; exact bottleneck and hosted capacity remain unproven.
Shorter diagnostic copies reproduced the failure even using only account-identity
requests; refusals matched active-work admission. This locates the safety boundary,
not the underlying bottleneck, and does not replace the failed full gate.
An identity-only CPU comparison failed at one CPU, passed with two, then failed
again at one. This supports resource sensitivity, not a verified fix or hosting
requirement. Production configuration, safety gates and EUR 100/month authority
remain unchanged; full one-CPU acceptance is still failed.
Two subsequent instrumented one-CPU identity samples both passed all 1,500
requests despite measured CPU throttling. This shows run-to-run variability;
neither attributes earlier refusals to throttling nor establishes a CPU requirement.
The temporary probe stayed outside production code. Full mixed-load acceptance
and the underlying cause remain unresolved.
A subsequent database-timing diagnostic reproduced 77 busy refusals. Query and
connection-acquisition callback delays were measured alongside runtime pauses;
they include application scheduling and do not prove slow SQL or a root cause.
No authentication/security checks were removed and no product fix is claimed.
Corrected server-side counter observation reproduced 62 refusals while the two
authentication SQL classes averaged under 0.31 ms each. Their fixture-wide maxima
were below 16 ms, versus hundreds of milliseconds in app callbacks. Slow SQL
execution does not explain those largest delays in this sample; targeted app
profiling remains necessary, and the failed full gate still stands.
An in-process CPU profile reproduced the refusal boundary, with distributed
runtime/driver/query/RPC work and visible GC rather than a proven single culprit.
Profiling adds overhead; sample shares are not exact CPU-time or capacity claims.
Concrete optimization experiments and unchanged full-load verification remain open.

The latest [French-language review](docs/PLATFORM_FRANCE_REVIEW_2026-10-02.md)
adds three distinct matching listings with paid, beta/operator-identity and
school-access warnings. They remain discovery-only. Fresh
preceding [67-source package qualification](docs/FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
passed 997 packaged unit cases, 724 database cases, compiled artifact parity, default startup and
six connected catalogue/browser stages plus the broader 24-stage customer
workflow at desktop/mobile sizes. Visual review caught a missing emoji font in
QA; a read-only local-font rerun rendered the stored glyph and passed all 24
stages on the unchanged package. This is bounded local proof, not every retained
feature, actual customer/provider acceptance or a deployed release.
That preceding package's encrypted recovery also passed: schema objects and selected
owned data survived, old session/reset/verification authority was rejected, and
four restored pending mail jobs were discarded without provider attempts. Remote
backup/key custody, production-sized/operator restore and post-snapshot rights
reconciliation remain open.
The same package also passed a bounded 30,000-request read/write baseline and
200 paired-edit races using 100 synthetic accounts/10,000 candidates, with
independent stored-data and audit checks. Overload mostly returned valid busy
refusals; it does not prove 100-user successful capacity, sustained whole-product
traffic or hosting within the EUR 100/month ceiling.

Communitech is an indirect Ontario community route with eligibility and sold-out
free-entry warnings, not a dedicated matcher. Startup Canada is held internally
pending link permission, not shown as a customer-facing entry.

Cyberport/CSAA adds indirect Hong Kong networking, not a dedicated matcher.
Corporate alumni restrictions, programme updates and unverified fees are explicit.
The earlier [64-source package checkpoint](docs/HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
passed package, database, default-startup and 24 connected browser workflow checks.
The missing Chinese glyphs were traced to QA font availability: a controlled
local-font rerun rendered the sampled names and passed all 24 stages without app
changes. Bounded encrypted recovery also passed on these exact images, including
old-link/session invalidation and expired-mail discard. After correcting the
synthetic client's idle-connection expiry, bounded exact-image load passed its
30,000-request baseline and 200 competing-edit races with independent stored-data
checks. Earlier failures remain documented; overload mostly returned busy refusals,
not 100-user successful capacity. Fresh packaging now passed
[987 unit and 724 database checks plus actual startup](docs/POOL_CLIENT_NODE22_PACKAGE_QUALIFICATION_2026-10-02.md).
Wider script/device, new-image connected acceptance, whole-product load, remote recovery and post-snapshot
reconciliation remain open; preceding 63-source receipts are historical.

There are 23 manual-reviewed records and 45 discovery-only records. Manual review
is not a blanket permission to scrape, reuse member data or contact people.
Platform admission and each person's rights are checked separately. Private
groups, directories and Slack membership do not imply consent.

Cards include dated public-source evidence and access/cost/integration limits.
Review reminders are editorial—not availability monitoring or permission renewal.
Maintainers must re-read primary sources before advancing review dates or
changing admission. See [source reviews and regional evidence](docs/PLATFORM_SOURCE_REVIEW.md).

## What the app does not do

- No automatic platform/email messaging, bulk outreach or automatic follow-ups.
- No default scraping/browser automation or provider-confirmed delivery.
- No fake integration success when APIs, credentials or authorization are absent.
- No automatic public profile/directory publishing or compatibility guarantees.
- No complete privacy, licensing, security or production certification.
- No provider billing enforcement or verified EUR 100/month hosting-capacity guarantee.
  A [dated operating allocation and provider-candidate review](docs/OPERATING_BUDGET_CANDIDATES_2026-10-02.md)
  is preparation only; complete prices and account caps remain unknown.

Unsafe inherited routes, platform automation and owner-provider notifications
remain disabled by default. A flag is not a permission grant. Legacy AI/message
generation modules are not supported source-approved drafting.

## Architecture

The supported app is `apps/cofounder-discovery`, not the historical root demo.

| Layer      | Implementation                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Browser    | React 19, TypeScript, Vite, Wouter, tRPC/React Query                                                    |
| Server     | Node.js, Express 5, tRPC and validated inputs                                                           |
| Database   | MySQL (Compose pins 26.7.0), Drizzle schema and versioned migrations                                                      |
| Accounts   | Scrypt passwords, signed HTTP-only cookies and durable sessions                                         |
| Workspace  | Owner boundaries, account locks, reviewed revisions, atomic audits and retry records                    |
| Runtime    | Multi-stage Docker image; nonroot, read-only application filesystem                                     |
| Operations | Health/readiness, launch tools, encrypted recovery, monitoring, budget declarations and support bundles |

The browser calls the server, which validates the authenticated owner and
workflow state before database access. Important workspace changes commit with
their audit event. Stale reviewed edits cannot silently overwrite saved changes.
Opt-out and account suspension remain relevant after a draft's approval.

Capacity controls bound retained data, active work, login/recovery admission,
workspace audit rows and mail attempts. They are not fleet-wide traffic control
or invoice enforcement; multi-replica acceptance is not established.

The optional HAI Generic JSON Feed is read-only and owner-scoped, omitting content
by default. External workspace connection is a separately authorized operator step.

## Repository layout

```text
apps/cofounder-discovery/
  client/       Supported React UI
  server/       API, account and workspace domain services
  shared/       Shared types, inputs and policies
  drizzle/      Database schema and migrations
  scripts/      App migration, diagnostic and operator helpers
docs/           Source reviews, operating contracts, requirement matrix and receipts
scripts/        Root launch, audit, backup, monitoring and release checks
.github/        Prepared CI, not proof of a hosted successful run
Dockerfile      Supported application image
docker-compose.yml  Local app and persistent MySQL stack
compose*.yml    Separate integration/production/mail configurations
package.json, pnpm-workspace.yaml  Workspace commands/configuration
README_REFERENCE.md  Complete detailed contracts and historical README
main.js, preload.js, src/  Historical Electron/demo
README-FIXED.md  Historical demo guide, not authoritative
```

## Quick start for Windows operators

Prerequisites: Windows, Docker Desktop and a running engine. From the repo root:

```powershell
.\scripts\start-windows.ps1 -OpenBrowser
```

This builds/starts the local app and MySQL, enables development-mode registration,
waits for readiness and opens `http://localhost:3014`. Ports bind to loopback.
Example database/service secrets are local-only, not an application login account.
Do not expose this stack publicly or reuse its secrets for hosting.

Startup is not account verification. Protected work still needs genuine
verification and approved mail configuration. Synthetic preverified test users
are not a supported shortcut for real accounts.

The named MySQL volume survives normal restarts. Stop without deleting data:

```powershell
docker compose stop
```

**Do not troubleshoot with `down --volumes`: it deletes the database volume.**
Preserve backups and inspect readiness/logs instead. Keep the 30-second container
stop grace period. Successful shutdown logs `shutdown_completed`; timed-out or
failed drain is not a clean restart. See [operator guidance](docs/OPERATOR_RUNBOOK.md).

## Developer setup

Use Node 26.12.0 and pinned pnpm 12.14.0. Docker is needed for isolated database and
operational checks. On Windows, `npx.cmd` avoids blocked PowerShell shims:

```powershell
npx.cmd pnpm@12.14.0 install --frozen-lockfile
```

Create `apps/cofounder-discovery/.env` from `.env.example` only if no configuration
already exists. Set `DATABASE_URL` for a dedicated development database and a
unique 32+ character `JWT_SECRET`. The example URL does not create a database.
Local Compose publishes MySQL at 3317, not the example file's 3306. Never point
tests at operator/customer data.

If using the supplied local Compose database, start only its database service:

```powershell
docker compose up -d db
```

Wait for database health before migrating. Its local development connection is
`mysql://cofounder:cofounder-local-only@127.0.0.1:3317/cofounder`; these are the
example service credentials, not production secrets. This command preserves an
existing named volume: it does not create a fresh test database or make its data
disposable. Use the separate integration stack for tests.

Apply migrations to the development database, then start:

```powershell
npx.cmd pnpm@12.14.0 db:migrate
npx.cmd pnpm@12.14.0 dev
```

Development defaults use `http://localhost:3000`; align `PUBLIC_ORIGIN` with the
actual browser origin. Registration does not bypass verification: configure the
real sender/worker. Never commit `.env`, credentials, cookies, personal data or keys.
The required mail values are `RESEND_API_KEY`, `AUTH_EMAIL_FROM` and an independent
32+ character `AUTH_MAIL_ENCRYPTION_SECRET`; processing is explicitly enabled by
`ENABLE_ACCOUNT_MAIL_WORKER=true`. Configure these only for an authorized sender
and approved test recipients. The worker runs inside the application, not through
a separate command. This is configuration guidance, not permission to purchase a
mail service or send test messages. See the
[mail contract](README_REFERENCE.md#account-mail-dispatch-budget) and
[production mail guidance](docs/PRODUCTION_CONTAINER_RUNBOOK.md).

## Environment variables

The [example configuration](apps/cofounder-discovery/.env.example) documents
settings; it is not a production secret file.

| Group             | Important settings / boundary                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Identity/database | `APP_MODE`, `HOST`, `PORT`, `PUBLIC_ORIGIN`, `DATABASE_URL`, `JWT_SECRET`                        |
| Ingress           | `TRUST_PROXY`: only at a reviewed proxy boundary                                                 |
| Account access    | Explicit registration; deletion-request intake separately opt-in                                 |
| Mail              | Resend key, verified sender, independent mail-encryption secret, explicit worker/retention flags |
| Capacity          | `API_MAX_ACTIVE_WORK`, `CAPACITY_*`, shared mail-attempt ceilings                                |
| Outreach          | `OUTREACH_PAUSED` blocks preparation, not all research                                           |
| Legacy providers  | Automation, unsafe routes and owner notifications stay off                                       |
| HAI               | Token/account binding; content omitted by default                                                |

Supported secrets can use documented `NAME_FILE` mounts; conflicting sources
fail closed. Production uses separate Compose/preflight requirements. Changing
only the local stack's URL does not make it suitable for public deployment.
See [production secrets, ingress and migration guidance](docs/PRODUCTION_CONTAINER_RUNBOOK.md).

## CI and verification

Run from the repo root using the pinned package manager:
The table abbreviates the invocation as `pnpm`; on Windows with blocked shims,
replace that prefix with `npx.cmd pnpm@12.14.0` as in the setup commands.

| Command                           | Scope                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm check`                      | Application TypeScript                                                                                      |
| `pnpm test`                       | Root operator/inventory gates and app units; Compose needed for configuration checks                        |
| `pnpm build`                      | Client and bundled server/operator artifacts                                                                |
| `pnpm test:integration`           | Mandatory dedicated-database suites; build first                                                            |
| `pnpm test:all`                   | Root/unit/database checks plus readiness, recovery, runtime-startup and authentication-admission rehearsals |
| `pnpm requirements:check`         | Phase/title/evidence-path integrity, not completion                                                         |
| `pnpm audit:api`, `pnpm audit:ui` | Source inventories, not behavioral acceptance                                                               |
| `pnpm doctor`                     | Runtime configuration diagnostics                                                                           |
| `pnpm verify`                     | App check/units/build/diagnostic pass, not the full root release gate                                       |

Isolated disposable integration workflow:

```powershell
docker compose -p cofounder-integration -f compose.integration.yml up --build --abort-on-container-exit --exit-code-from tests
```

It publishes no ports and uses temporary storage, not the app's persistent volume.
Builds may download dependencies/images. Suites create/remove synthetic data and
need test-only credentials. Do not adapt this to live data. Exact prerequisites,
log retention and cleanup: [developer reference](README_REFERENCE.md#developer-setup).

The maintained authentication-admission rehearsal uses the already built local
production runtime and MySQL images, resolves them to exact image IDs and never
pulls implicitly. CI runs it after building `cofounder-recovery-runtime:local`;
this local workflow configuration is not evidence that hosted CI has run.
To select reviewed existing images explicitly on Windows:

```powershell
$env:AUTH_ADMISSION_RUNTIME_IMAGE = 'sha256:YOUR_64_CHARACTER_LOCAL_RUNTIME_IMAGE_ID'
$env:AUTH_ADMISSION_DATABASE_IMAGE = 'sha256:YOUR_64_CHARACTER_LOCAL_MYSQL_IMAGE_ID'
pnpm test:authentication-admission:integration
```

Replace the example IDs with actual locally inspected image identifiers. Missing
images fail before fixture creation. This test creates only network-disabled
synthetic MySQL, app and probe containers, with no public ports. It temporarily
holds a table lock in its own database, confirms excess authentication refusal,
retains disconnected work until settlement, then checks capacity reuse. It removes
only its own validated temporary credential files; stopped containers are retained.
Never point these helpers at a real/customer database. This is a safety regression,
not proof that the failed 150-request/second capacity gate is resolved.

## Current product status

The latest October 2 dependency review found advisories in development tools
that the production-only audit did not cover. Vitest is now pinned to 4.1.11;
the schema loader's old esbuild copy is narrowly replaced with 0.25.12. Both full
workspace and production registry audits return zero advisories. Windows and
packaged Node 22 each passed 987 unit cases/97 files; typecheck, builds, scratch
schema generation, runtime parity/startup and 170 operator checks passed.
The packaged MySQL suite also passed all 724 cases/43 files without skips. CI now
checks development advisories too. This is local evidence, not a hosted CI run
or security certification. Exact identities, database result and remaining gates:
[dependency qualification](docs/DEPENDENCY_TOOLCHAIN_QUALIFICATION_2026-10-02.md).

The following paragraphs retain earlier dated receipts; they do not qualify all
later artifacts merely because their compiled files match.

October 2, 2026 local checkpoints include fresh 63-source runtime/test images,
965 unit cases/94 files, 724 mandatory database cases/43 files, compiled parity,
migration cancellation/startup, encrypted recovery and clean shutdown. Twenty-four
connected browser stages passed without replacement application mounts. All 168
host operator checks passed.

Subsequent bounded load checks passed 30,000 requests with 100 synthetic accounts
and 10,000 candidates. Another 200 same-account two-connection edit races passed;
winning request IDs matched persisted audits. The new harness passed 15 focused
cases and typechecks. These are separate dated runs, not interchangeable proof
for every feature or later source change.

Overload returned thousands of valid busy responses—not successful capacity for
100 simultaneous users. Directly preverified fixtures do not prove real signup
or inbox delivery. No provider actions or real sends occurred. Exact identities,
failures and limits: [current package qualification](docs/CURRENT_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).
All 116 original phases remain Partial; completion is not proven.
The later `/help` page is now included in fresh immutable runtime/test images:
979 unit cases/96 files, 724 mandatory database cases/43 files, compiled parity
and exact-image bilingual/mobile help checks passed. The separate default-startup
regression initially failed on a transient database waiter after INT cancellation.
Diagnosis and a corrected shared-deadline test then passed twice, retaining the
original failure and all no-DDL/lock-owner invariants. The local startup check is
qualified; live operational acceptance remains open. Earlier recovery/load/workflow
receipts do not qualify this new image. See the
[fresh package evidence and retained failure](docs/HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md).
Expanded encrypted recovery has subsequently passed on this new image, including
views, procedures, triggers, an unexecuted scheduled-event definition and restored
two-owner login/isolation. Restore now requires a separate non-binary-logged
target and refuses binary logging before SQL import; it never changes live database
settings or privileges. Remote/operator disaster recovery remains unapproved.
Isolated restore now also expires password-reset and email-verification links,
preventing a snapshot from reviving links revoked after backup; historical digests
are preserved and existing verified flags are not reclassified. Post-backup
account changes still require reconciliation before promotion. Restored queued
account emails are expired to prevent replay or fresh reset-token issuance;
delivery history and post-backup provider budget usage still require review.
The current image also passed all 24 connected Chromium customer-workflow stages,
plus Help opening without losing an unsaved draft. Real synthetic UI/API/database
behavior was checked; eight expected refusal/fault diagnostics, no unexpected
errors, outside requests or real sends. Synthetic preverification is not actual
signup/inbox acceptance. The current image also passed the bounded 30,000-request
read/write baseline and 200 paired-edit races with persisted-data/audit checks.
Overload was safely refused, not 100-user successful capacity. Full UI/operator
coverage, whole-product load, longer soak and hosted capacity remain open.

## Production readiness

Remaining release requirements include:

- Full original requirement-by-requirement acceptance, not a smaller demo scope.
- Reviewed controller identity, privacy notices, lawful data use, retention,
  erasure commitments and support ownership. Drafts are not approved policies.
- Approved host/private database, real HTTPS/proxy/session acceptance, deployment,
  rollback, alerts and incident response.
- Real verification/recovery/security-notice inbox acceptance, independent backup
  keys and off-host recovery.
- Representative whole-product load, open-loop traffic, longer soak, broader
  concurrency, browser/accessibility/language coverage and a customer pilot.
- Current source policies/member-access evidence, wider worldwide/native-language
  coverage and authorized provider paths if added.
- Fresh-checkout/hosted CI, release provenance, repository licensing and inherited
  asset/dependency/service rights review.
- Reviewed tax-inclusive costs and enforceable provider spending controls.

Plan: EUR 80 operating plus EUR 20 reserve inside the EUR 100 ceiling.
[Budget checks](docs/OPERATING_BUDGET.md) validate declarations—not invoices or
provider enforcement. Unknown costs must not be reported as zero.

## Documentation map

| Need                                        | Starting point                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Exact operating contracts and dated history | [Detailed reference](README_REFERENCE.md)                                                    |
| Manual end-to-end workflow                  | [Critical path](docs/CRITICAL_PATH.md)                                                       |
| Sources and held leads                      | [Source review](docs/PLATFORM_SOURCE_REVIEW.md)                                              |
| Original scope                              | [Requirement matrix](docs/GOAL_COMPLETION_MATRIX.md)                                         |
| Work and remaining acceptance               | [Delivery ledger](docs/PUBLIC_BETA_DELIVERY.md)                                              |
| Current package receipts                    | [67-source package qualification](docs/FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md) |
| Verification history                        | [Verification report](docs/FINAL_VERIFICATION_REPORT.md)                                     |
| Local operation, incidents, backup and HAI  | [Operator runbook](docs/OPERATOR_RUNBOOK.md)                                                 |
| Hosting/secrets                             | [Production runbook](docs/PRODUCTION_CONTAINER_RUNBOOK.md)                                   |
| Security assessment                         | [Security](docs/SECURITY.md)                                                                 |
| Privacy decisions                           | [Privacy assessment draft](docs/PRIVACY_IMPACT_ASSESSMENT_DRAFT.md)                          |
| Retention/deletion limits                   | [Retention/erasure preparation](docs/ACCOUNT_RETENTION_ERASURE_POLICY.md)                    |
| Administrator enrollment/recovery           | [Enrollment](docs/ADMIN_ENROLLMENT_RUNBOOK.md), [recovery](docs/ADMIN_RECOVERY_RUNBOOK.md)   |
| Source-derived surface                      | [API audit](docs/API_USAGE_AUDIT.md), [UI audit](docs/UI_ACTION_AUDIT.md)                    |
| Dependency/imported rights                  | [Third-party review](docs/THIRD_PARTY_RELEASE_REVIEW_2026-10-02.md)                          |
| Development advisories and compatibility    | [Dependency qualification](docs/DEPENDENCY_TOOLCHAIN_QUALIFICATION_2026-10-02.md)            |

## Troubleshooting and contribution

`/api/health` checks process liveness; `/api/ready` checks database-dependent
readiness. A running container alone is not a working service. Use sanitized,
authorized diagnostics/support bundles, not raw secrets or candidate dumps.
Do not delete volumes or enable unsafe routes to make a failing check green.

Read the relevant contract before changing the app. Preserve workspace data and
unrelated edits; test ownership, retries, stale review and failure recovery. New
platforms need source evidence, not just a link. Prepare reviewable changes and
report exact verification. Merging/publication, provider access and real outreach
require explicit authority.

## License

Package metadata declares MIT, but a standalone repository license and complete
inherited ZIP/demo asset rights review are still missing. Do not infer a completed
license grant, copyright holder or redistribution permission from metadata.
Third-party notices and service terms need separate review. See
[release rights review](docs/THIRD_PARTY_RELEASE_REVIEW_2026-10-02.md).
