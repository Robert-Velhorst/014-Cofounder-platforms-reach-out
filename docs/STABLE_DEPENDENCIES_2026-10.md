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
ARM64 archives. MySQL 26.10.0 and Caddy 2.11.7 image digests were refreshed
from their official registries. The initial Debian Trixie image failed its
installed-package scan; the current draft qualifies a digest-pinned Ubuntu
26.10 GNU/Linux base. Container acceptance must verify the actual artifacts.

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

The edge rebuild uses the exact Caddy 2.11.7 release commit and a verified
source archive, Go 1.27.3, and explicit current stable x/crypto, x/net, x/sys,
x/text, x/term and x/sync releases. Its version carries a downstream build
suffix, and the actual Go build inventory is retained inside the image. All
standard Caddy modules remain enabled. The installed-binary scan and actual
HTTPS/session tests remain required; rebuilding alone does not prove the
unmaintained OpenPGP package advisory is absent or inapplicable.

A follow-up checks all 159 linked Go modules against the official Go proxy.
Fifty-six additional forward stable-tag updates are selected, including the
OpenTelemetry stable logging API. Fourteen modules publish untagged revisions;
this is not reported as an all-tagged-stable graph. The upstream go-attestation
requirement is newer than its highest public stable tag; it is preserved rather
than downgraded. The fallback CA submodule is explicitly advanced to Go's
reviewed October 20 security update removing roots associated with compromised
intermediates. This CA-data security fix has an exact public revision, not a
fabricated stable release tag. The edge also refreshes its runtime Alpine
packages. Actual build info, source dependency paths, build environment and
matching built/runtime binary hashes are retained for applicability review.
All strict vulnerability scan gates remain unchanged.

The completed 26f352e hosted run passes all functional qualification gates.
Its database image has 116 inventoried packages and zero reported findings.
The rebuilt Caddy image has 32 OS and 161 Go package entries, with only
GO-2026-5932 remaining. Go's primary advisory scopes it to seven OpenPGP
package paths. The new dependency-path evidence must establish whether these
paths are included; absence is not assumed and no finding is suppressed.

## Deployment and data

### GNU/Linux base and installed browser follow-up

Ubuntu 26.10 is the current stable interim release, supported until July 2027.
Playwright documents Ubuntu support through 26.04 LTS; 26.10 is not claimed as
an officially supported Playwright platform. The new base must pass every
existing source, database, recovery, startup, auth, load, TLS and browser gate.
The installed-image verifier now requires actual Ubuntu 26.10 inventory and
retains all advisory severities, inventory completeness and suppression checks.
Switching distributions does not itself prove security acceptance.

The final image installs the browser revision associated with pinned
Playwright 1.64.1 and its system dependencies. A separately emitted bundle of
the unchanged application browser adapter is probed in the final image as
UID/GID 1000, read-only, without network, capabilities or persistent mounts,
with the existing 512 MiB / 1 CPU / 64 MiB tmpfs limits. Trusted inline content
must execute JavaScript and DOM interaction at desktop and mobile sizes. The
report records the actual OS, GNU libc, Node, browser revision/version and
adapter hash. It cannot establish external-provider or untrusted-page safety.
The existing adapter disables Chromium sandboxing; this trusted fixture does
not authorize live scraping or qualify that existing sandbox limitation.
Provider workers and unsafe legacy routes remain disabled in production config.

Sources: [Ubuntu 26.10 release notes](https://documentation.ubuntu.com/release-notes/26.10/),
[Playwright container support](https://playwright.dev/docs/docker).

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
