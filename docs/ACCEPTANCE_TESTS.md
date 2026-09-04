# Acceptance tests

## Automated

- TypeScript compile: all client/server shared paths.
- Unit: state transitions, CSV bounds/escaping, password hashing, rate limits, safety
  defaults, matching, filters, timelines, and legacy behavior.
- MySQL integration: migrations, profiles, matching, monitoring, owner isolation,
  durable import replay, and the full assisted outreach transition sequence.
- Production build: route-level code splitting and server/migration bundles.
- Container smoke: build the release image, start the production Compose stack, and
  check database-backed readiness plus disabled automation/legacy/HAI defaults.
- Dependency audit: production high/critical advisory gate.

## Runtime

- GET /api/health returns process/runtime status.
- GET /api/ready returns 200 only after a real database query.
- Browser acceptance covers registration, sign-in, import, review, responsive layout,
  console errors, and a fresh session.
- HAI returns 503 without configuration, 401 with an invalid bearer token, and an
  owner-scoped Generic JSON Feed with a valid token.
- ngrok is accepted only after both local readiness and public HTTPS health succeed.
- Hosted browser acceptance also requires sign-in over HTTPS, a Secure/HttpOnly
  session cookie, no console or page errors, and no horizontal overflow.

The latest execution evidence is in FINAL_VERIFICATION_REPORT.md.
