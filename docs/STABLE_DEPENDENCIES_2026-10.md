# Stable dependency refresh: 23 October 2026

All 93 original direct dependency declarations were checked against the public
npm registry's stable releases. The two unused Puppeteer/Sparticuz dependencies
are removed: the application imports Playwright. All 91 retained declarations
are pinned exactly, including Chart.js 4.6.1, React Query 5.104.5, Framer Motion
14.6.0, JOSE 6.2.13, Lucide 1.61.0 and Vite 8.3.5. Five override targets are
refreshed. pnpm 12.15.0 is pinned in both manifests and CI. The lock records two
release-age exceptions, dotenv 18.0.9 and Chart.js 4.6.1; the general policy is
retained. Deprecated upstream esbuild-kit dependencies remain separate work.

Node 26.12.1 is pinned, with official SHA-256 verification for Linux x64 and
ARM64 archives. Debian Trixie, MySQL 26.10.0 and Caddy 2.11.7 image digests were
refreshed from their official registries. GNU/Linux compatibility is retained
for Playwright; container acceptance must verify the actual artifacts.

Production uses pnpm's current lock-based deployment with injected workspace
packages. The version-specific hook omits the three tRPC 11.19.0 compiler-only
peers from the production graph. Their published 95 JavaScript files were
inspected and contain no TypeScript runtime imports. TypeScript 7.0.2 remains a
direct development dependency. The hook is now included in the release input
inventory. Unused npm is removed from the runtime; UID/GID 1000 matches the
existing production Compose model. No public application behavior is removed.

## Required evidence

Keep every existing source, database, restoration, privilege-separated role,
startup, authentication, customer-load and HTTPS/session acceptance gate.
New reports check actual Node/MySQL versions, actual pruned image behavior, a
desktop/mobile public browser journey, and Windows source checks. Browser
acceptance uses the synthetic local production stack, sends no messages and
does not enable the provider workers. This does not replace the separate full
browser qualification drafts already open in this repository.

All three images are scanned with digest-pinned Trivy 0.76.1, all advisory
severities and installed inventory. The application inventory verifier requires
every exact direct runtime dependency and rejects empty coverage, suppressed
findings and TypeScript build compilers. A failed scan remains a failure; no
unfixed finding or severity is silently excluded. Results must be inspected
before claiming security acceptance. New dependency versions alone are not
proof that a vendor binary's bundled libraries are current.

The first hosted run passed the application and database acceptance checks,
but strict installed-image scans failed. MySQL's optional Shell RPM includes
Python packages with ten reported findings, and its unused gosu helper has
61 findings. No repository caller uses mysqlsh; the official entrypoint invokes
gosu only when started as root. The database image now removes the Shell RPM
and gosu, asserts the standard server/client/backup tools remain executable,
and refuses any startup identity other than UID/GID 999. The existing fresh
initialization, restoration, role and TLS tests must pass again on this image.
This does not resolve the separate Debian application or Caddy findings, and
does not establish image acceptance until new installed inventories are scanned.

## Deployment and data

Hetzner remains the deployment target. Retain the existing secret-file, TLS,
database-role, backup/restore and rollback boundaries. No production deployment,
provider action, billing change, real operator migration or merge is performed
by this draft. Do not replace a production database image before an approved
backup and migration rehearsal. Historical dated evidence retains the versions
observed in those earlier runs; the new reports qualify this revision separately.

Sources: [npm registry](https://registry.npmjs.org/),
[Node checksums](https://nodejs.org/dist/v26.12.1/SHASUMS256.txt),
[official MySQL image](https://hub.docker.com/_/mysql),
[official Debian image](https://hub.docker.com/_/debian),
[official Caddy image](https://hub.docker.com/_/caddy).
