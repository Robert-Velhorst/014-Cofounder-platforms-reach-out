# Implementation worklog

- Consolidated the archive/demo material into one canonical pnpm application.
- Replaced proprietary authentication and false provider behavior.
- Added owner-scoped critical-path API, UI, state machine, audits, replay protection,
  rate limits, CSV import/export, and analytics.
- Registered and applied migrations 0020 and 0021.
- Added Windows, Docker, ngrok, HAI, backup, security, CI, and doctor support.
- Verified the production bundle through a dedicated ngrok HTTPS endpoint, including
  database readiness, hosted sign-in, secure cookies, and the privacy-preserving HAI
  cursor feed; HAI's own generic-feed parser and ledger tests pass read-only.
- Added a CI production-container gate that rebuilds the image, starts MySQL and the
  app with Compose, and checks readiness and fail-closed runtime status.
- Reduced the main browser entry to 372.09 KB (113.82 KB gzip) using route splitting.
- Production audit currently reports no known vulnerabilities.
- Verification history and remaining external gates are recorded in
  FINAL_VERIFICATION_REPORT.md.
