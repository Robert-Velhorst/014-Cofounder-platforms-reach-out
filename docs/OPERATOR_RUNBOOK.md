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

## ngrok

Install/configure ngrok v3, set a unique JWT_SECRET, then run
./scripts/start-ngrok.ps1. Optionally pass -Url https://name.ngrok.app.
The launcher:

1. requires local readiness;
2. starts ngrok hidden;
3. obtains the HTTPS endpoint from the loopback Agent API;
4. restarts the app with the exact public origin, one trusted proxy, and registration
   disabled;
5. returns success only after public health verification.

On failure it kills the tunnel and restores local-only mode.

## HAI connector

Set HAI_CONNECTOR_TOKEN (32+ random characters) and HAI_CONNECTOR_USER_ID, then
restart the app. Leave HAI_CONNECTOR_INCLUDE_CONTENT=false unless detailed workflow
metadata is explicitly approved.

Register this Generic JSON Feed in HAI:

- Same Windows host URL:
  http://host.docker.internal:3014/api/integrations/hai/feed
- Approved ngrok URL:
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
