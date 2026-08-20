# CoFounder Outreach

CoFounder Outreach is a local-first, review-first workspace for finding, qualifying, and following up with potential co-founders. It helps an operator turn permitted prospect data into structured outreach work: import prospects, score fit, draft messages, review and approve them, copy the approved message to the destination platform, confirm what was done, and track replies or follow-ups.

The key boundary is deliberate: this repository does not claim autonomous live sending. It is built to support careful assisted outreach with audit trails, opt-out handling, manual approval, and clear operational controls.

## Current Product Status

The supported product is the production-hardened TypeScript application in `apps/cofounder-discovery`.

The repository also still contains the older Electron/demo files at the root (`main.js`, `preload.js`, `dashboard/`, `src/`, `README-FIXED.md`, and related assets). Those files are retained as historical source material from the original archive. They are not the supported production server, are not what Docker runs, and should not be treated as the current product.

Use this README as the entry point for the current repository. Use `apps/cofounder-discovery/README.md` for the application-level developer notes and `docs/OPERATOR_RUNBOOK.md` for day-to-day operation.

## Who This Is For

Non-technical operators can use this as a private outreach control room:

- keep co-founder candidate research in one place;
- import a CSV of people or companies they are allowed to contact;
- qualify prospects with explainable criteria;
- draft and review outreach messages before anything is sent;
- copy an approved message into the destination platform themselves;
- record what happened, schedule follow-ups, and export results.

Software developers can use this as a production-oriented full-stack codebase:

- React 19 and Vite frontend;
- Express 5 and tRPC backend;
- MySQL 8.4 persistence through Drizzle ORM and migrations;
- local scrypt password authentication with signed HTTP-only cookies;
- owner-scoped data access, idempotency records, audit events, and state-machine guarded outreach transitions;
- Docker Compose runtime for Windows/local operation;
- CI coverage for typecheck, unit tests, integration tests, build, production audit, and container smoke tests.

## What The App Does

The supported workflow is:

1. Register or sign in locally.
2. Import owned or permitted prospect data with the bounded CSV importer.
3. Qualify a prospect with explainable scoring.
4. Generate or write a draft outreach message.
5. Submit the draft for review.
6. Explicitly approve the reviewed draft.
7. Prepare a manual action. The app rate-limits this step and never clicks or sends for you.
8. Copy the message and perform the action on the destination platform outside this app.
9. Confirm in the app that you sent it.
10. Record a response, schedule a follow-up, close the record, export CSV, or let the read-only HAI feed ingest the audit event.

The main production UI is intentionally narrow and operational:

- `/` - public product entry page and service health link.
- `/login` - local sign-in and registration when registration is enabled.
- `/outreach` - the supported work console for prospect import, qualification, drafting, review, manual-send preparation, confirmation, analytics, and audit review.
- `/onboarding` - setup/onboarding flow.

Several older imported pages and components still exist in the source tree, but they are not exposed by the current router unless they are deliberately wired back in.

## What The App Does Not Do

This is important for compliance, safety, and expectation setting:

- It does not send LinkedIn, email, GitHub, StartHawk, CoFoundersLab, AngelList, or other platform messages by default.
- It does not scrape or automate external platforms by default.
- It does not fake provider success when no provider API, credential, or authorization exists.
- It does not register the HAI connector in a workspace automatically; that remains an operator-owned setup step.
- It does not make the older Electron/demo root app the production target.

Unsafe imported legacy routes and browser/platform automation stay disabled unless an operator explicitly sets the relevant flags after confirming authority, platform policy, credentials, and risk.

## Repository Layout

```text
.
+-- apps/
|   +-- cofounder-discovery/     Current supported TypeScript/Vite/tRPC app
|       +-- client/              React UI
|       +-- server/              Express/tRPC backend and domain services
|       +-- drizzle/             MySQL schema and migrations
|       +-- scripts/             App-level migration and doctor helpers
|       +-- package.json         App scripts and dependencies
+-- docs/                        Operational, security, audit, acceptance, and verification docs
+-- scripts/                     Windows launch, ngrok launch, and database backup scripts
+-- docker-compose.yml           Local production-like app plus MySQL stack
+-- Dockerfile                   Production image for apps/cofounder-discovery
+-- package.json                 Workspace scripts delegating to the supported app
+-- pnpm-workspace.yaml          pnpm workspace definition
+-- main.js, preload.js, src/    Historical Electron/demo material
+-- README-FIXED.md              Historical README for the old demo, not authoritative
```

## Main Capabilities

Prospect management:

- manual and CSV-based prospect intake;
- owner-scoped prospect storage;
- bounded parsing to avoid oversized imports;
- CSV export for reviewed data;
- archive support for records that should leave the active queue.

Qualification and matching:

- explainable matching and qualification signals;
- deterministic critical-path scoring for imported prospects;
- saved search and matching code retained from the richer archive;
- preference, timing, and AI/ML support modules in the app codebase.

Outreach workflow:

- draft, pending review, approved, manual action required, confirmed sent, responded, follow-up due, and closed states;
- state transitions validated on the server;
- opt-out checks before message preparation;
- idempotency tracking for repeated operations;
- request IDs and audit records for important transitions;
- rate limits on preparation paths.

Messaging support:

- draft generation and preview support;
- conversation starter history;
- conversation quality and follow-up helper modules;
- manual copy/open-destination flow instead of automatic dispatch.

Operations and analytics:

- owner-scoped counts and activity views;
- audit event feed;
- health and readiness endpoints;
- backup script for MySQL dumps;
- ngrok launcher for controlled HTTPS exposure;
- read-only Generic JSON Feed for HAI.

Security and safety:

- local password auth using scrypt;
- signed HTTP-only session cookies;
- registration can be disabled for hosted mode;
- origin/proxy controls for hosted mode;
- platform credential encryption requires an explicit secret;
- provider automation and unsafe legacy routes are fail-closed;
- HAI content is omitted by default;
- local Docker services bind to loopback.

## Architecture

The current application is a single workspace package under `apps/cofounder-discovery`.

Frontend:

- React 19;
- Vite 7;
- Wouter routing;
- TanStack Query plus tRPC client;
- Radix UI primitives and local UI components;
- Tailwind CSS styling.

Backend:

- Node.js 22 runtime target;
- Express 5 server;
- tRPC API routers;
- Drizzle ORM with MySQL;
- migration and doctor scripts;
- production static asset serving from the Vite build.

Persistence:

- MySQL 8.4;
- Drizzle migrations `0000` through `0021`;
- core tables for users, profiles, prospects, matches, campaigns, outreach records, audit events, idempotency records, messages, conversations, saved searches, timeline events, pipeline stages, tasks, notes, guardrails, platform credentials, and automation jobs.

Runtime:

- Docker Compose starts MySQL and the production app.
- The app listens on container port `3000`.
- The local host exposes the app at `http://localhost:3014`.
- Health endpoint: `/api/health`.
- Readiness endpoint: `/api/ready`.
- HAI feed endpoint: `/api/integrations/hai/feed`.

## Quick Start For Windows Operators

Prerequisites:

- Windows 11;
- Docker Desktop installed;
- Docker engine running.

Start the local production stack:

```powershell
.\scripts\start-windows.ps1 -OpenBrowser
```

Open:

```text
http://localhost:3014
```

The launcher uses Docker Compose, applies pending migrations, and stores data in the named MySQL Docker volume. Re-running the launcher preserves that data.

Stop without deleting local data:

```powershell
docker compose stop
```

Be careful with:

```powershell
docker compose down --volumes
```

That removes the local MySQL volume and deletes the app data stored in it.

## Developer Setup

Use the pinned package manager version. On Windows, `npx.cmd pnpm@10.4.1 ...` is the most reliable form.

Install dependencies:

```powershell
npx.cmd pnpm@10.4.1 install --frozen-lockfile
```

Copy the environment file:

```powershell
Copy-Item .\apps\cofounder-discovery\.env.example .\apps\cofounder-discovery\.env
```

Set at least:

```text
DATABASE_URL=mysql://cofounder:cofounder@127.0.0.1:3306/cofounder
JWT_SECRET=<32+ random characters>
CREDENTIAL_ENCRYPTION_SECRET=<32+ random characters>
```

Run the development server:

```powershell
npx.cmd pnpm@10.4.1 dev
```

Run common checks from the repository root:

```powershell
npx.cmd pnpm@10.4.1 check
npx.cmd pnpm@10.4.1 test
npx.cmd pnpm@10.4.1 build
```

Database-backed tests require a real MySQL database and `DATABASE_URL`:

```powershell
$env:DATABASE_URL = "mysql://cofounder:cofounder-local-only@127.0.0.1:3317/cofounder"
npx.cmd pnpm@10.4.1 test:integration
```

## Workspace Scripts

Run these from the repository root:

| Command                 | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `pnpm dev`              | Start the supported app in development mode    |
| `pnpm build`            | Build the React client and bundled Node server |
| `pnpm start`            | Start the built production server              |
| `pnpm check`            | Run TypeScript checks                          |
| `pnpm test`             | Run the non-database unit suite                |
| `pnpm test:integration` | Run database-backed integration suites         |
| `pnpm test:all`         | Run unit and integration suites                |
| `pnpm db:migrate`       | Apply Drizzle migrations                       |
| `pnpm doctor`           | Check runtime configuration                    |
| `pnpm verify`           | Run check, unit tests, build, and doctor       |

## Environment Variables

| Variable                                        |                                 Required | Default/Example                          | Purpose                                                            |
| ----------------------------------------------- | ---------------------------------------: | ---------------------------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                                      |                                      Yes | `development` or `production`            | Node runtime mode                                                  |
| `APP_MODE`                                      |                                       No | `development`                            | Public runtime mode label                                          |
| `HOST`                                          |                                       No | `127.0.0.1` locally, `0.0.0.0` in Docker | Bind host                                                          |
| `PORT`                                          |                                       No | `3000`                                   | App port inside the process/container                              |
| `PUBLIC_ORIGIN`                                 |                      Yes for hosted mode | `http://localhost:3014`                  | Canonical browser-facing origin                                    |
| `DATABASE_URL`                                  |                                      Yes | MySQL URL                                | Drizzle/MySQL connection                                           |
| `JWT_SECRET`                                    |                                      Yes | 32+ random chars                         | Signs session cookies                                              |
| `ENABLE_REGISTRATION`                           |                                       No | `true` locally, usually `false` hosted   | Allows local account creation                                      |
| `OUTREACH_PAUSED`                               |                                       No | `false`                                  | Blocks send preparation while leaving research/review available    |
| `ENABLE_UNSAFE_LEGACY_ROUTES`                   |                                       No | `false`                                  | Keeps imported unsafe prototype routes disabled                    |
| `ENABLE_PLATFORM_AUTOMATION`                    |                                       No | `false`                                  | Keeps browser/platform automation disabled                         |
| `CREDENTIAL_ENCRYPTION_SECRET`                  | Required for stored platform credentials | 32+ random chars                         | Encrypts platform credential records                               |
| `TRUST_PROXY`                                   |                              Hosted only | `false`                                  | Enables one trusted reverse proxy hop                              |
| `HAI_CONNECTOR_TOKEN`                           |                                 Optional | 32+ random chars                         | Enables the read-only HAI feed when paired with user ID            |
| `HAI_CONNECTOR_USER_ID`                         |                                 Optional | User ID                                  | Fixes the HAI feed to one owner                                    |
| `HAI_CONNECTOR_INCLUDE_CONTENT`                 |                                       No | `false`                                  | Includes message content in HAI feed only when explicitly approved |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` |                                 Optional | empty                                    | OAuth hooks, not needed for assisted outreach                      |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`     |                                 Optional | empty                                    | OAuth hooks, not needed for assisted outreach                      |

## HAI Connector

The HAI integration is a read-only Generic JSON Feed over audit/workflow events.

Default behavior:

- disabled unless `HAI_CONNECTOR_TOKEN` and `HAI_CONNECTOR_USER_ID` are both set;
- returns `503` when disabled;
- requires `Authorization: Bearer <HAI_CONNECTOR_TOKEN>`;
- rate-limited;
- owner-scoped to the configured user;
- uses immutable audit event IDs as cursors;
- omits message body content unless `HAI_CONNECTOR_INCLUDE_CONTENT=true`.

Local feed URL for an HAI process on the same Windows host:

```text
http://host.docker.internal:3014/api/integrations/hai/feed
```

Hosted/ngrok feed URL:

```text
https://your-domain.example/api/integrations/hai/feed
```

HAI registration, HTTP-feed enablement, and host allowlisting are external operator steps. They are not performed by this repository.

The OpenAPI description is in `docs/hai-connector.openapi.yaml`.

## ngrok And Hosted Testing

Use ngrok only after setting a unique `JWT_SECRET` and reviewing the hosted-mode security settings.

```powershell
.\scripts\start-ngrok.ps1
```

Optional reserved URL:

```powershell
.\scripts\start-ngrok.ps1 -Url https://your-domain.ngrok.app
```

The script verifies local readiness, starts ngrok, discovers the HTTPS URL from the local ngrok agent, restarts the app with the exact public origin, enables the hosted proxy settings, verifies public health, and cleans up on failure.

## Backups

Create a timestamped SQL dump:

```powershell
.\scripts\backup-database.ps1
```

Backups are written under the repository `backups` directory. For real operation, copy verified backups to protected storage and test restores into a separate database before relying on them.

## CI And Verification

GitHub Actions defines two release gates:

- `verify` - installs with pnpm 10.4.1, runs TypeScript, unit tests, migrations, integration tests, production build, and production dependency audit.
- `container-smoke` - builds the production Docker image, starts Docker Compose, waits for MySQL and app readiness, verifies `/api/ready`, verifies `/api/health`, confirms automation and legacy routes are disabled, confirms the HAI feed is disabled by default, prints diagnostics, and tears down the stack.

Latest documented verification evidence is in:

- `docs/FINAL_VERIFICATION_REPORT.md`
- `docs/GOAL_COMPLETION_MATRIX.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/CODEX_WORKLOG.md`

At the time of the final implementation report, the verified evidence included:

- TypeScript passing;
- 191 unit tests passing;
- 33 MySQL-backed legacy integration tests passing;
- critical-path integration passing for import replay, owner isolation, and assisted-send flow;
- production build passing with a main bundle around 372 KB / 114 KB gzip;
- production dependency audit passing with no known high-severity production vulnerabilities;
- migrations `0020` and `0021` applied to MySQL 8.4;
- Windows production bundle acceptance;
- desktop and mobile browser checks;
- dedicated ngrok HTTPS acceptance;
- HAI feed contract and cursor replay checks;
- no live external provider delivery attempted or claimed.

## Security Notes

Read `docs/SECURITY.md` before hosting or connecting external systems.

The short version:

- use unique 32+ character secrets;
- keep MySQL and the app loopback-bound unless using the controlled ngrok path;
- disable registration in hosted mode unless intentionally onboarding a user;
- leave `ENABLE_PLATFORM_AUTOMATION=false`;
- leave `ENABLE_UNSAFE_LEGACY_ROUTES=false`;
- keep HAI content disabled unless content sharing is explicitly approved;
- rotate any secret that appears in logs, shell history, Git, screenshots, or chat;
- run a backup before migrations and test restores separately.

## Troubleshooting

Docker Desktop not running:

- Start Docker Desktop first, then rerun `.\scripts\start-windows.ps1 -OpenBrowser`.

Port already in use:

- The Docker app binds `127.0.0.1:3014`.
- MySQL binds `127.0.0.1:3317`.
- Stop conflicting services or adjust the compose file deliberately.

Database-backed tests fail with `Database not available`:

- Start MySQL and set `DATABASE_URL`.
- Non-database unit tests can run without MySQL.

pnpm behaves differently on Windows:

- Use the pinned version explicitly: `npx.cmd pnpm@10.4.1 ...`.

HAI feed returns `503`:

- That is correct when `HAI_CONNECTOR_TOKEN` or `HAI_CONNECTOR_USER_ID` is missing.

HAI feed returns `401`:

- Check the `Authorization: Bearer ...` token.

Messages are not being sent automatically:

- Correct. The supported product prepares reviewed manual actions. It does not send provider messages by default.

## Documentation Map

| File                                 | Use                                                 |
| ------------------------------------ | --------------------------------------------------- |
| `apps/cofounder-discovery/README.md` | App-specific developer notes                        |
| `docs/OPERATOR_RUNBOOK.md`           | Windows, backup, ngrok, HAI, and incident operation |
| `docs/SECURITY.md`                   | Hosting, secrets, and safety boundary               |
| `docs/CRITICAL_PATH.md`              | Supported end-to-end product workflow               |
| `docs/FINAL_VERIFICATION_REPORT.md`  | Final verification results                          |
| `docs/GOAL_COMPLETION_MATRIX.md`     | Requirement coverage matrix                         |
| `docs/ACCEPTANCE_TESTS.md`           | Manual/browser/provider acceptance evidence         |
| `docs/API_USAGE_AUDIT.md`            | API surface and usage audit                         |
| `docs/UI_ACTION_AUDIT.md`            | UI action and workflow audit                        |
| `docs/TASK_GRAPH.md`                 | Implementation task graph                           |
| `docs/CODEX_WORKLOG.md`              | Implementation worklog                              |

## License

The workspace package declares the repository as MIT licensed. Check inherited archive material before redistributing old demo assets outside this repository.
