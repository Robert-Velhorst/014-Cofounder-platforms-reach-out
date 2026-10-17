# Security

- Generate unique 32+ character values for JWT_SECRET,
  CREDENTIAL_ENCRYPTION_SECRET, and HAI_CONNECTOR_TOKEN.
- Keep MySQL and the app loopback-bound. Only ngrok should expose an endpoint.
- Hosted mode disables registration, validates request origins, trusts exactly one
  proxy hop, and requires HTTPS PUBLIC_ORIGIN.
- Keep ENABLE_PLATFORM_AUTOMATION and ENABLE_UNSAFE_LEGACY_ROUTES false.
- Rotate a secret immediately if it enters logs, shell history, Git, or a message.
- Back up before migrations/upgrades and test restores on a separate volume.
- Audit records deliberately store transition metadata, not provider credentials.
- HAI feed tokens select one fixed owner. Content is off by default.

Known boundary: in-memory preparation rate limits assume one application instance.
Use one app replica, as supplied, unless replacing this limiter with a shared store.

Report suspected vulnerabilities privately to the repository owner; do not include
secrets or personal prospect data in an issue.

## Supported versions

Security reports for the current default branch and latest published release are in scope. Older versions may be affected and are not guaranteed to receive fixes.

## Response and disclosure

Reports are reviewed on a best-effort basis; no response or fix-time guarantee is provided. Coordinate public disclosure with the maintainers so users have a reasonable opportunity to receive a fix.
