# Co-founder Outreach

The supported product is the local-first assisted-outreach application in
apps/cofounder-discovery. The old Electron files remain only as historical source
material; they are not installed, built, or exposed by the production server.

## Windows 11 quick start

Install Docker Desktop, start its engine, and run:

    .\scripts\start-windows.ps1 -OpenBrowser

The app is available only on http://localhost:3014. Data is stored in the named
MySQL Docker volume. Re-running the launcher preserves that data and applies pending
migrations.

## Verify

    pnpm install --frozen-lockfile
    pnpm check
    pnpm test
    $env:DATABASE_URL = "mysql://cofounder:cofounder-local-only@127.0.0.1:3317/cofounder"
    pnpm test:integration
    pnpm build
    pnpm audit --prod --audit-level high

Operational, security, ngrok, HAI, backup, and acceptance details are in
[the operator runbook](docs/OPERATOR_RUNBOOK.md).
