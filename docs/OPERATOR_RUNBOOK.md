# Operator runbook

## Local Windows 11

Prerequisites: Docker Desktop with the engine running. Launch with
./scripts/start-windows.ps1 -OpenBrowser. Stop with docker compose stop; this
preserves the database volume. Use docker compose down only when you understand
that the --volumes option would delete local data.

## Backup

Run ./scripts/backup-database.ps1. The script creates a timestamped SQL dump under
the repository backups directory. Copy verified backups to separately protected
storage. Restore into a separate test database first.

## Hetzner production deployment

Hetzner is the production deployment target. The repository's root Compose stack is
local-only; follow the infrastructure and cutover requirements in
`DEPLOYMENT_TARGET.md` before exposing a hosted service. Do not use a public tunnel
for production access.

## HAI connector

Set HAI_CONNECTOR_TOKEN (32+ random characters) and HAI_CONNECTOR_USER_ID, then
restart the app. Leave HAI_CONNECTOR_INCLUDE_CONTENT=false unless detailed workflow
metadata is explicitly approved.

Register this Generic JSON Feed in HAI:

- Same Windows host URL:
  http://host.docker.internal:3014/api/integrations/hai/feed
- Hetzner HTTPS URL:
  https://your-domain/api/integrations/hai/feed
- Authorization: Bearer followed by HAI_CONNECTOR_TOKEN
- Provider: generic_json_feed

HAI must enable HTTP feeds and allowlist the selected host. The cursor is the
immutable audit-event ID, so every workflow update is delivered once and can be
replayed safely.

## Incident controls

Set OUTREACH_PAUSED=true and recreate the app container to stop preparation while
leaving research/review available. For suspected session compromise, rotate
JWT_SECRET; this invalidates existing sessions. For HAI compromise, rotate only the
HAI token and restart.
