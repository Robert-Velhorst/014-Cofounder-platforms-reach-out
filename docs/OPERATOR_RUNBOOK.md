# Operator runbook

## Local Windows 11

Prerequisites: Docker Desktop with the engine running. Launch with
./scripts/start-windows.ps1 -OpenBrowser. Stop with docker compose stop; this
preserves the database volume. Use docker compose down only when you understand
that the --volumes option would delete local data.

The local database health probe now requires the configured application user to
execute SELECT 1 over TCP against the intended database. It does not accept a
socket-only initialization server or an authentication-denied ping. A failure is
a reason to investigate the intended credentials, grants and database access,
not to remove a data volume or bypass health checks. Application readiness,
migrations and operational monitoring remain separate requirements.

## Backup

Use [the database recovery runbook](DATABASE_RECOVERY.md). The PowerShell wrapper
requires explicit source, credentials, encryption key, destination and maintenance
acknowledgement. It creates an authenticated encrypted backup, not a plaintext
SQL file under the repository. Restore only into the explicitly confirmed,
separate empty rehearsal target described by that runbook.

## ngrok

Follow [HOSTED_TUNNEL.md](HOSTED_TUNNEL.md), including separate public-exposure
approval, a reviewed immutable image, protected secret files and private database.
After those gates, ./scripts/start-ngrok.ps1 -PublishConfirmed accepts an optional
-Url https://name.ngrok.app. The foreground coordinator holds public requests at
503 while discovering the exact gate-bound endpoint, preparing the standalone
production app and checking actual container posture/readiness. It does not
start the example database. Keep the terminal open; failures/cancellation close
the gate and stop only its owned agent. No local-mode or registration fallback.
Actual TLS, provider configuration and browser ingress acceptance remain required.

## HAI connector

The configured owner must currently exist, be email-verified and not be suspended
for deletion review. The feed checks this under the account's database share lock
before reading events; a valid connector token cannot bypass this boundary.
HTTP 403 `hai_account_unavailable` means reconcile the intended owner/verification/
suspension state, not change the user ID to evade a restriction. Database failures
return a content-free 503. Feed-handler responses are private/no-store. Already ingested
copies and previously authorized in-flight reads are not withdrawn; handle receiver
retention/restriction separately. A pending deletion request alone is not suspension.

Set HAI_CONNECTOR_TOKEN (32+ random characters) and HAI_CONNECTOR_USER_ID, then
restart the app. Leave HAI_CONNECTOR_INCLUDE_CONTENT=false unless detailed workflow
metadata is explicitly approved.

The early 60/source/minute guard is process-local. After bearer validation, shared
database admission permits 60/source, 60/configured owner and 120/service per fixed
60-second window. All replicas must share the database and signing secret. These
attempts commit before owner/event lookup and are not refunded on later 403/503.
Shared exhaustion returns 429 `rate_limited`, with conservative Retry-After: 60;
admission failure returns 503 `database_unavailable` without private error text.
Do not rotate tokens or owner configuration to evade limits. Connector-token
rotation does not reset allowance; signing-secret rotation changes pseudonymous
identity keys but retains the stable service ceiling. Database time and bounded
expiry cleanup govern counters; this is not an approved retention policy or
provider-spending enforcement. Keep upstream abuse protection and receiver polling
conservative, and handle suspension separately from retries.

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

Keep ENABLE_OWNER_NOTIFICATIONS=false. It controls the separate inherited
administrator notification provider, not account mail, outreach or monitoring.
Provider credentials alone cannot enable it. Any later authorized enablement
requires receiver/content/terms/cost review and real delivery acceptance; see
OWNER_NOTIFICATION_SAFETY_2026-10-02.md. A false result or timeout is uncertain,
not permission to automatically retry or send another-channel message. Runtime
flag/config changes require process restart and revalidation; editing a file is
not an atomic kill switch. Public hosted definitions hold this route disabled.

Set OUTREACH_PAUSED=true and recreate the app container to stop preparation while
leaving research/review available. For suspected session compromise, rotate
JWT_SECRET; this invalidates existing sessions. For HAI compromise, rotate only the
HAI token and restart.
