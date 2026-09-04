# Technical audit

## Canonical product

The supported runtime is React/Vite, Express/tRPC, and MySQL under
apps/cofounder-discovery. Root Electron artifacts are historical and unreachable
from the root package scripts, CI, Docker image, and server routes.

## Findings resolved

- Replaced proprietary OAuth and placeholder runtime dependencies with local scrypt
  accounts and signed, HTTP-only sessions.
- Removed committed environment/shell residue and the generated Windows archive.
- Added owner scoping to the prospect, match, outreach, audit, and HAI paths.
- Disabled the imported legacy API surface and all platform automation by default.
- Replaced fake provider sending with an explicit assisted state machine. Only a
  human confirmation creates confirmed_sent.
- Registered the previously untracked hardening migration and added query indexes
  plus durable CSV idempotency records.
- Added fail-closed runtime validation, origin checks, request IDs, security headers,
  bounded request/CSV sizes, rate limits, health/readiness, compression, CI, and a
  production-only container.

## Deliberate boundaries

No LinkedIn, CoFoundersLab, FounderCloud, email, or social provider is claimed as
connected. Their imported prototype routes are denied unless an operator explicitly
enables the unsafe legacy flag. The supported workflow is manual entry/CSV,
review-gated drafting, user-performed sending, and user confirmation.

The Windows distribution is a standalone local stack requiring Docker Desktop; it
is not a signed single-file executable.
