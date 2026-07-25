# Co-founder Discovery Platform

This is the TypeScript/Vite platform recovered from `cofounder-discovery-demo.zip`.
It is kept alongside the legacy Electron outreach demo so the two independently
runnable products do not overwrite one another.

## Included capabilities

- Co-founder profiles, matching, campaigns, approval queues, analytics, and timeline UI.
- A tRPC/Express backend with Drizzle schema and migrations.
- Unit and integration-oriented test suites plus demo seed scripts.
- OAuth hooks and an operator-facing platform-credentials UI.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and
   `CREDENTIAL_ENCRYPTION_SECRET`.
2. Install dependencies with `npx.cmd pnpm@10.4.1 install --frozen-lockfile`.
3. Run `npx.cmd pnpm@10.4.1 dev`.

`npx.cmd pnpm@10.4.1 check` performs the TypeScript check. The database-backed
tests require an isolated MySQL database supplied through `DATABASE_URL`.

## Safety boundary

Browser-driven scraping, credential testing, and platform outreach are disabled
unless `ENABLE_PLATFORM_AUTOMATION=true` is explicitly set. Set it only after
confirming authority to use the target account and compliance with each platform's
Terms of Service. The app will not encrypt platform credentials unless a
`CREDENTIAL_ENCRYPTION_SECRET` (or `JWT_SECRET`) is supplied.
