# Security

## October 23 frontend admission candidate — full CI/CodeQL pending

Read-only GitHub queries returned zero open Dependabot and secret-scanning alerts,
but **two open high-severity CodeQL findings**, not a clean security assessment:
[development HTML handler](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/security/code-scanning/1)
and [production SPA fallback](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/security/code-scanning/2).
The latest inspected instances were on `main` at `9e15816`; the handlers were
also present in the current source. A completed/passing scan job is not zero
findings, exploitation evidence, hosted exposure or whole-product certification.

The source candidate now registers admission **before** Vite middleware/HTML
transforms and before production static files/SPA fallback. A separate, existing
bounded local limiter permits 1,200 requests/client/60 seconds and at most 4,096
client keys. It stores salted HMACs, groups IPv6 by /56 and uses Express's resolved
IP rather than independently trusting forwarding headers. Full capacity returns
503; client exhaustion returns 429. No raw address, path or query is returned.
An explicit `express-rate-limit` 8.7.1 middleware then imposes a separate 6,000
request/process/60-second ceiling using one constant key, not an unbounded IP map.
Refusals are private/no-store with a conservative Retry-After; store errors fail
closed. API routes are registered earlier and retain their own unchanged guards.

These frontend counters are process-local and reset on restart, not durable fleet
admission, billing enforcement, user fairness, slow-client protection or a whole
DoS solution. Shared-NAT users consume one client budget. Approved ingress/host
abuse controls and representative cold-browser/mixed/soak acceptance remain
required; these constants are not measured public capacity. No live limits,
provider account or deployed service was changed. Existing DB/API quotas were
not changed, and alerts were not dismissed or suppressed.

The pinned dependency and lockfile retain registry integrity; only that package
and its `ip-address` dependency were added, with existing `debug` reused.
Use follows [the official configuration guidance](https://express-rate-limit.mintlify.app/reference/configuration)
and [CodeQL's missing-rate-limit recommendation](https://codeql.github.com/codeql-query-help/javascript/js-missing-rate-limiting/).
Full-workspace `pnpm audit --audit-level moderate` returned no known advisories.
That is a dated registry result, not a vulnerability-free claim.

Six focused tests passed twice on Windows **Node 26.12.0 / Vitest 5.0.5** using
isolated npm-cache dependencies and a temporary runner configuration, not a full
workspace install. Actual HTTP checks exercised quotas/capacity/expiry, IPv6 and
untrusted forwarding headers, the constant-key global ceiling, 1,200 successful
real static/SPA requests followed by 429/HEAD refusal, unchanged earlier health
access and positive-control-observed filesystem work stopping before refusal.
An in-memory negative control removed only the two middleware registrations:
five cases passed and the static-path regression failed as expected (200 versus
required 429). Checked-in source was not rewritten; its repeat passed all six.
Scoped strict TypeScript 6.0.3 checking of the guard, route module and test passed.
All 213 then-current native operator/source tests also passed on Node 26.12.0,
zero failures/skips (9,673.1858 ms), before the subsequent CJK regression addition.

No full application suite/build, final image/browser/hosted or fresh CodeQL
qualification is claimed for this candidate. Both findings remain open until
authoritative scan results establish their status. Public beta and all original
phase acceptance remain incomplete.

The October 2 development-tool dependency audit found advisories outside the
production-only scope. Vitest 4.1.11 and a narrow core-utils esbuild 0.25.12
override cleared the returned advisories; CI now checks all dependency types at
moderate severity as well as its existing production/high gate. Registry audit
results and compatibility evidence are not security certification or hosted CI
acceptance. [Dated scope, exact artifacts and limits](DEPENDENCY_TOOLCHAIN_QUALIFICATION_2026-10-02.md).

## Whole-product assessment checkpoint (October 2, 2026)

An independently reviewed source-backed whole-product threat model is retained by
the security plugin at its target-bound persistent artifact:
`artifacts/01_context/whole-product-threat-model-2026-10-02.md`.
Document SHA-256: `cb4e0da95484bda849adbaf76b7ca15c45cd91db31b596fef1ee7c41023f0cec`.
The companion `whole-product-threat-source-manifest-2026-10-02.json` records
62 cited source hashes; reviewed snapshot SHA-256:
`8fb012a581bea977b5eadd60ac31f415e3d442319eb860dd6ebecbca885b90df`.
This managed artifact is not a repository file or published release document.

Coverage includes supported web/Compose/native startup, conditional desktop/demo,
legacy/native-browser/provider paths, private owner workflows, sessions/admin
elevation, mail/HAI/export, secret/build/migration and operator recovery boundaries.
The 16 resource rows and 16 threat hypotheses are design-review evidence, not
validated vulnerabilities or approved production acceptance. Phase 064 is Partial.
Owner review, scenario validation and unresolved deployment/provider/privacy
decisions remain required. The older narrow beta model does not close this phase.

The assessment recorded an unsafe public-forwarding-before-reconfiguration path
in the old ngrok launcher. A subsequent [local tunnel repair](HOSTED_TUNNEL.md)
holds forwarding closed before actual hosted posture/readiness verification and
uses only the standalone production definition. No public tunnel was started.
The managed assessment remains a dated source snapshot: changed launcher sources
need renewed source-bound review and scenario validation, not an assertion that
all its hypotheses or public launch gates are closed.

## Current controls and operational boundaries

The asynchronous application startup boundary now waits for confirmed socket
listening before announcing startup/starting workers. Bind/configuration failures
reaching that boundary emit a fixed fatal event without raw exception text.
This is a scoped local repair, not a complete logger/module-initialization or
startup-deadline guarantee. See [startup receipt](STARTUP_FAILURE_BOUNDARY_2026-10-02.md).
The changed entrypoint requires fresh source-bound threat and image qualification;
the managed assessment above remains dated.

The inherited `system.notifyOwner` provider path now also requires the explicit
`ENABLE_OWNER_NOTIFICATIONS` flag, false by default and held false by both Compose
definitions. Administrator/passkey step-up still applies. Provider requests use
an HTTPS operator-configured endpoint, refuse redirects and have a five-second
abort deadline; private response/exception text is not read into logs. This is
local source/transport test evidence, not an enabled notification service,
provider acceptance, durable fleet quota or approval to transmit content. See
[notification repair receipt](OWNER_NOTIFICATION_SAFETY_2026-10-02.md). Changed
configuration/router/helper sources require renewed source-bound threat review.

Session cookie transport flags follow Express's resolved request protocol, including
its configured proxy-trust policy. The cookie helper does not independently read
raw `X-Forwarded-Proto` headers or treat any occurrence of `https` in a list as
trusted. Cookies retain HttpOnly, SameSite=Lax and Path=/, without a Domain scope.
This repair does not enforce TLS: local HTTP still produces non-Secure cookies.
Hosted acceptance must prove HTTPS-only ingress, proxy header replacement and no
direct public backend route. A trusted-hop setting alone cannot establish that.
See [Express's proxy guidance](https://expressjs.com/en/guide/behind-proxies/).

Private reusable defaults use the live verified-account/credential/deletion-fence
boundary under owner locks. Revision conflicts prevent stale overwrites; exact
immediate retry is checked before growth admission but never before account
authorization. Settings and metadata-only audit commit together under the shared
workspace audit-capacity gate. Reads do not allocate default documents. Stored
JSON is validated before use; corruption fails closed without leaking text.
Templates are personal operational data included in private export and read-only
deletion preflight, not a credential store, permission receipt or erasure feature.
This bounded feature does not prove a whole-product threat model or privacy assessment.

- Generate unique 32+ character values for JWT_SECRET,
  CREDENTIAL_ENCRYPTION_SECRET, and HAI_CONNECTOR_TOKEN.
- The default Compose stack is local-only and contains example credentials. Use
  the separate application-only production definition and
  [production runbook](PRODUCTION_CONTAINER_RUNBOOK.md) for hosted preparation.
- Keep database access private and application traffic loopback-bound behind a
  reviewed HTTPS proxy. The workstation tunnel launcher is retired; hosted
  deployment targets Hetzner and requires separate release acceptance.
- Production validates supplied origins on mutating requests and requires HTTPS
  PUBLIC_ORIGIN for non-loopback hosts. Missing Origin headers are not proof of
  trust. Registration and proxy trust are explicit configuration choices, not
  automatically disabled/enabled merely by setting NODE_ENV=production. The
  production definition keeps registration off and proxy trust false by default;
  enable a single trusted hop only after verifying the actual forwarding path.
- Keep ENABLE_PLATFORM_AUTOMATION and ENABLE_UNSAFE_LEGACY_ROUTES false.
- Rotate a secret immediately if it enters logs, shell history, Git, or a message.
- Back up before migrations/upgrades and test restores on a separate volume.
- Audit records deliberately store transition metadata, not provider credentials.
- Public tRPC errors remove the stack property before serialization and replace
  unexpected internal messages with a generic retry/support message. Explicit
  policy errors retain their status and message. The regression uses the real
  SuperJSON transformer; setting a stack to undefined is not sufficient to omit
  its wire metadata. This boundary does not sanitize every legacy logger or
  replace a complete privacy/security review.
- HAI feed tokens select one fixed owner. Content is off by default.

Known boundary: the HAI front-door traffic guard retains
process-local buckets, not fleet-wide allowances. Login, registration,
reset-token attempts, verification redemption and authenticated HAI feed admission
have independent durable global/source/identity counters in MySQL; do not
confuse those shared controls with the transient front-door checks. Verification
dispatch has separate account/provider-attempt budgets, and recovery requests use
durable service/source/address queue-admission counters. The transient bucket store
and expiry index are capped at 10,000 entries, with per-process
salted key hashes and expiry cleanup before admission plus a 60-second timer.
Do not treat pseudonymous hashes as anonymous data. Live records are not evicted;
capacity pressure rejects new keys, while existing client quotas remain enforced.
Process restart resets the transient quotas, not committed MySQL counters;
upstream abuse controls and representative multi-instance acceptance remain
required before scaling.
Durable account/login/mail/outreach/capacity controls are separate. Keep one app
replica until shared traffic controls and representative load acceptance are
implemented; CPU/memory limits and active-work admission are not complete
denial-of-service protection or monetary spending caps.

Six runtime secret variables support `_FILE` paths; see the production runbook for
the exact supported list, fail-closed behavior and host permission requirements.
Mounted secrets remain accessible to the application, host/Docker administrators
and any authorized backup process. This is not encrypted-at-rest vault storage,
automatic rotation, a complete log scrubber or an image-wide secret scanner.

Report suspected vulnerabilities privately to the repository owner; do not include
secrets or personal prospect data in an issue.

## Supported versions

Security reports for the current default branch and latest published release are in scope. Older versions may be affected and are not guaranteed to receive fixes.

## Response and disclosure

Reports are reviewed on a best-effort basis; no response or fix-time guarantee is provided. Coordinate public disclosure with the maintainers so users have a reasonable opportunity to receive a fix.
