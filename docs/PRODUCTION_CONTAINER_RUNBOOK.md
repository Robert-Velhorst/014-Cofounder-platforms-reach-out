# Production container preparation and secret handling

For the opt-in read-only startup mode and separate-credential deployment boundary,
see [migration verification and roles](DATABASE_MIGRATION_ROLES.md). The default
applying startup path is retained; configuring verification does not itself
provision or reduce database privileges.

This is an operator runbook, not authorization to deploy. The public beta is
not ready merely because its containers start. Preserve the full release gates in
[the delivery ledger](PUBLIC_BETA_DELIVERY.md#release-requirements-and-evidence).
The confirmed budget is EUR 100/month initially, including hosting, database,
mail and optional APIs; target EUR 80 recurring plus EUR 20 reserve. No host,
provider, account, purchase, public endpoint or live message is created here.

Latest [pool-client fresh packaging](POOL_CLIENT_NODE22_PACKAGE_QUALIFICATION_2026-10-02.md)
passed 987 unit, 724 mandatory database and actual default-startup checks, with
new exact installed images and matching compiled payloads. New-image connected
acceptance remains separate; old browser/recovery/load receipts retain their
image scope. The [dated budget candidates](OPERATING_BUDGET_CANDIDATES_2026-10-02.md)
are not quotes, configured caps or purchase/deployment authority.

The current [signal/startup checkpoint](RUNTIME_SIGNAL_STARTUP_2026-10-02.md)
reproduces the old forced-stop behavior during a locked migration and verifies a
new bounded supervisor with actual TERM/INT cancellation, default migration,
HTTP health/readiness and clean shutdown. `pnpm test:runtime-startup:integration`
repeats that isolated check using an already installed runtime image; it is wired
into the prepared local release and CI gates. Neither this check nor local CI
wiring is hosted/public-release acceptance. Older load and browser/recovery
receipts retain their image scope; requalification of the new artifact is ongoing.

The earlier exact-runtime load receipt covers authenticated reads and ordinary saved
workspace changes under fixed local resource bounds. An early-stop fixture exited
137withoutOOM during the default migration/start transition; post-startup clean
shutdown checks do not close that finding. Do not promote this image as fully
startup/shutdown-qualified from that older receipt alone. The newer controlled
check above addresses the locked-migration window, not every possible source of
the earlier failure or rollback of committed DDL. See
[current load evidence and limitations](WORKSPACE_WRITE_LOAD_2026-10-02.md).

The newest [candidate/support packaging checkpoint](CANDIDATE_QUERY_NODE22_PACKAGING_2026-10-02.md)
records fresh exact Node 22 images, matching compiled artifacts and actual runtime
startup/HTTP/shutdown, plus 724 immutable-image database tests without skips or
source mounts. That exact new runtime also passed 20 connected browser stages,
including actual
registration/profile/draft/revision/opt-out/account separation/session restart,
private defaults and search/support download. Test verification used synthetic
DB fixtures, not mail. The checked journeys are not every critical-path step.
The earlier
[language packaging receipt](FINAL_VERIFICATION_REPORT.md#current-source-node-22-packaging-october-2)
does not include subsequent candidate-query/support changes; older connected
browser receipts do not qualify the newest hashes.

The integration-test image is not the production runtime. Its default command
uses the image's root-owned Corepack cache and Vitest writes a transient bundled
config next to the test config. Arbitrarily forcing UID1000 or a read-only root
onto that test image fails before the test suite, as recorded in the current
receipt. Use it only with synthetic data, isolated networking and its own disposable
writable layer; never use it for production or mount a writable host checkout.
The pruned runtime remains non-root/read-only and is checked independently.

Earlier [startup-repair packaging](STARTUP_NODE22_PACKAGING_2026-10-02.md) and
[connected acceptance](STARTUP_PACKAGED_ACCEPTANCE_2026-10-02.md) record new exact
Node22 runtime/test IDs, 731 build tests and 712 fresh packaged database tests,
plus actual default startup/HTTP/shutdown. The same runtime subsequently passed
ten customer-browser stages and four private-defaults stages with a real restart
and synthetic accounts. Other customer/admin/export/recovery, hosted/provider
and complete release acceptance remain open. Older receipts below are dated.

The [Node 22 packaging checkpoint](OWNER_SAFETY_NODE22_PACKAGING_2026-10-02.md)
records fresh notification/tunnel-change images and 725 unit tests with bounded
artifact/runtime probes. The [later connected receipt](OWNER_SAFETY_PACKAGED_DATABASE_ACCEPTANCE_2026-10-02.md)
records 712 fresh packaged database tests and actual startup/HTTP/shutdown for
those exact images. Customer/browser/hosted acceptance remains pending.
The [earlier full packaged receipt](LOCAL_PACKAGED_REGRESSION_2026-10-02.md)
records 706 units and 712 database tests only for its older source/image IDs.
Neither checkpoint is a published release or public-launch approval.

The [October 2 local candidate receipt](LOCAL_RELEASE_CANDIDATE_2026-10-02.md)
records the newly built runtime/test-image identities and bounded synthetic
acceptance. It supersedes the older local runtime only for its proved checks;
neither candidate is a published registry release or hosted rollout approval.
This dated receipt does not qualify subsequent working-tree changes.
Before any actual deployment, qualify the approved committed source, verify the
registry artifact/signature and satisfy all remaining launch gates.

## Choose the correct configuration

`docker-compose.yml` is intentionally LOCAL: it supplies example database and
session credentials. Do not expose it as a production deployment.

`compose.production.yml` is a **standalone application-only** definition, not an
override for the local stack. It requires a separately configured private MySQL
service and a separately approved HTTPS reverse proxy. It does not provision
either, and an external database is not assumed to be free or budget-approved.
Do not combine it with the local Compose file. Separate staging and production
projects, databases, origins, credentials and backups; never share customer data
with an acceptance fixture.

The application definition uses numeric non-root identity 1000:1000, read-only
root storage, a 64 MiB temporary mount without execute permission, dropped Linux
capabilities, no-new-privileges and a 256-process limit. Initial bounds are one
CPU, 512 MiB memory, no extra swap and a 320 MiB V8 old-space ceiling. Logs rotate
at three 10 MiB files. These are **initial safety bounds**, not measured customer
capacity, a complete host disk limit, high availability or a billing ceiling.
Confirm actual host enforcement and workload performance before onboarding.

Application traffic is bound to host loopback port 3014. A host-side TLS proxy
must reach that port; a proxy in another container cannot reach host loopback
without a separately reviewed networking arrangement. No TLS proxy is included.
`TRUST_PROXY` is false by default; set it true only for the verified single-hop
proxy path that strips untrusted forwarding headers. Health probes check database
readiness with a timeout. Unhealthy status alone does not restart a running
container or deliver an alert; configure monitoring and operator ownership.
The [read-only runtime monitor](RUNTIME_MONITORING.md) now supplies bounded
liveness/readiness probes and consecutive-failure/recovery events. These are
local JSON events, not delivered notifications or approved hosted monitoring.

### Session-cookie ingress acceptance

The cookie helper uses Express's resolved protocol; it does not parse raw
forwarding headers separately. With proxy trust disabled, an HTTP request claiming
`X-Forwarded-Proto: https` cannot change that cookie decision. With the reviewed
single-hop path enabled, protocol follows Express's trusted-proxy interpretation,
not a search for `https` anywhere in a comma-separated header list.

Before hosting, verify the actual proxy strips/replaces client forwarding headers,
the public endpoint permits HTTPS authentication only, backend HTTP cannot be
reached by public clients, and authentication sets HttpOnly, Secure, SameSite=Lax
and Path=/ without Domain. Confirm logout expiration uses the same cookie scope.
Local HTTP intentionally remains supported; the helper does not itself redirect
or reject insecure transport. Do not enable trust based only on successful local
socket tests. Multiple ingress routes or a different hop count need a separately
reviewed trust configuration. See
[the official proxy guidance](https://expressjs.com/en/guide/behind-proxies/).

Local/CI/integration MySQL service probes now require authenticated application-user
TCP SELECT 1 against the intended schema. This prevents a socket-only initializer
or rejected authentication from releasing dependent work. It does not qualify the
separate production database, TLS/network path, migration/write authority or hosted
operations. `pnpm test:readiness:integration` checks the actual probe definitions
only in owned network-disabled tmpfs MySQL fixtures, using an already available
image; it performs no deployment or live database mutation.

Registration, deletion intake, external platform automation, unsafe legacy routes,
account mail and retention deletion are off; outreach preparation is paused.
Public availability and unpausing require the complete approved launch plan, not
just changing these values. The free beta has no payment/billing feature requirement.

Session admission defaults to ten retained sessions per account through
`CAPACITY_SESSIONS_PER_ACCOUNT`. Configure every replica identically. Zero stops
new sessions and registration before account creation, without revoking existing
sessions or disabling password recovery.
Do not lower this setting without reviewing historical rows and the working
recovery/support path. The application preserves existing sessions and reports
the limit instead of evicting a browser automatically. This does not establish
a complete disk/invoice budget or an automatic session-retention policy.

Public registration now uses shared MySQL admission before password work: five
attempts per source IP, three per normalized email and 100 across the service in
fixed one-hour windows. These are separate from sign-in allowances. Both use the
existing security-counter table and stable lock; no new migration is required.
Admission fails closed on unavailable storage. Run identical code/secrets on all
replicas and validate the trusted proxy boundary. These initial limits require
load/abuse/support review and do not enforce a hosting invoice or edge-traffic
ceiling. Disabled registration and zero session capacity do not charge admission.

Reset-link redemption also requires shared admission before password validation
or hashing: ten attempts per source IP, ten per exact case-sensitive token and
200 across the service in fixed 15-minute windows. It has a separate global budget
and HMAC purpose in the same security-counter table; no raw links/passwords are
stored there and no migration is added. Storage failure stops recovery before
account changes. Existing one-use reset/session revocation remains atomic and
unchanged. Shared-network/support, traffic/load, real-inbox and hosted acceptance
remain separate gates; do not reset active security quotas as account cleanup.

Verification replacement has a shared three-attempt hourly owner window inside
the owner/token/shared-dispatch transaction. Refused replacement preserves the
current link and does not contact a provider; uncertain sending consumes the
committed attempt. All replicas need the same JWT secret. Rotation resets these
HMAC owner windows, but not stable service-wide mail ceilings. Existing opt-in
mail retention can prune expired owner HMAC counters; it stays off by default.
No new migration, retention authorization or real-inbox acceptance is implied.

## Supply mounted secrets

Prepare protected secret files outside the checkout/build context. Supported
application variables are `DATABASE_URL`, `JWT_SECRET`,
`CREDENTIAL_ENCRYPTION_SECRET`, `AUTH_MAIL_ENCRYPTION_SECRET`, `RESEND_API_KEY` and
`HAI_CONNECTOR_TOKEN`. Each supports the corresponding `_FILE` variable containing
a path, instead of a raw environment value. The source must be a readable regular
UTF-8 file, no more than 16 KiB, containing one nonempty value. One final LF or CRLF
is accepted; internal newline, NUL, BOM, invalid UTF-8 or excessive size is rejected.
Providing both a nonempty raw value and `_FILE` is an error. A missing/empty/invalid
file fails closed and its contents, path and filesystem error are not echoed.
Existing schema validation still requires session/encryption secrets to have at
least 32 characters. File resolution does not copy secrets into `process.env`.

Compose input variables (paths are not secret contents):

| Input                      | Operator supplies                                                         |
| -------------------------- | ------------------------------------------------------------------------- |
| `PRODUCTION_APP_IMAGE`     | Reviewed registry image pinned as `repository@sha256:<64 hex characters>` |
| `PUBLIC_ORIGIN`            | Approved public HTTPS origin, no path/query/credentials                   |
| `DATABASE_URL_SECRET_FILE` | Protected host file with a private MySQL URL and least-privilege account  |
| `JWT_SECRET_FILE`          | Protected host file with a unique session-signing secret                  |

Compose requires these inputs but does not validate application capacity
suitability. The model forwards
`CAPACITY_WORKSPACE_AUDIT_TOTAL` (default 100000) and
`CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT` (default 10000), alongside existing
account/candidate/outreach quotas. Explicit zero stops covered workspace writes;
explicit empty values are forwarded and rejected by application validation.
Keep settings identical across every instance. These quotas preserve history and
exclude opt-out/security/privacy auditing; they are not invoice or byte ceilings.
Review the README's beta-capacity controls and staging count-query/lock latency
before opening admission.

Compose does not validate the image digest's provenance
or enforce digest syntax itself. Verify the image identity against its build and
acceptance receipt before starting it. Do not substitute `latest` or an unreviewed
tag. The file-backed database URL is used by both the startup migration runner and
the application; do not accidentally leave an old raw `DATABASE_URL` configured.
Operator enrollment and reviewed deletion-processing tools support the same
file-backed URL. Other independent external backup tools retain their own documented
credential interface; `_FILE` is not a repository-wide magic convention.

Compose mounts granted secrets at `/run/secrets/...`; these are host-file bind
mounts, **not an encrypted secret vault**. Host access, Docker administrator access,
backup copies and application memory remain sensitive. For file-sourced secrets,
Compose does not remap ownership or apply its `uid`/`gid`/`mode` fields. Protect the
host directory and grant read access to the actual container UID/GID without making
secrets world-readable; verify this on the chosen Linux host/rootless mapping.
Do not assume a Windows Desktop mount proves Linux host ownership/permissions.
See [Docker's secret guidance](https://docs.docker.com/compose/how-tos/use-secrets/)
and [file-secret ownership limitations](https://docs.docker.com/reference/compose-file/services/#secrets).

`.secrets/` directories and `*.secret` files are excluded from Git/build context as
an additional guard, not a general secret detector. Never place secrets in source,
image layers, CLI arguments, public output or debug bundles. Secret mounts do not
scrub preexisting environment values or third-party logs. Keep unsupported AI and
imported integrations disabled.

## Read-only preparation checks

With approved image/origin and file **paths** configured in the operator's protected
environment, inspect without starting any container:

```sh
docker compose -f compose.production.yml config --quiet
pnpm test:production-config
```

The automated model tests use temporary synthetic files and validate required
inputs, closed launch gates, granted secrets, loopback exposure and resource limits.
They do not inspect real file contents, create containers or prove permission,
database, TLS, load, backup, alerting, provider or legal acceptance. A full `config`
dump can reveal configuration and host paths; use `--quiet` with real inputs and
do not attach raw environment/inspect output to a public issue.

## Optional account mail

Only after verified sender, credentials, actual inbox delivery, suppression,
retry/budget and privacy acceptance, prepare the explicit mail overlay. Supply
`RESEND_API_KEY_SECRET_FILE`, `AUTH_MAIL_ENCRYPTION_SECRET_FILE` and
`AUTH_EMAIL_FROM`; use an independent mail encryption secret. Configuration check:

```sh
docker compose -f compose.production.yml -f compose.production-mail.yml config --quiet
```

The overlay enables the mail worker but does not enable public registration,
outreach, HAI or retention deletion. Do not run it against real providers merely
to see whether it starts. Existing account-mail daily/monthly attempt limits
remain enforced independently; they are not invoice guarantees. Changing an
encryption key can make queued payloads unreadable: preserve the approved queue
drain/re-encryption/recovery procedure rather than blindly replacing the file.

## Change, rollback and recovery

Both local and production Compose definitions keep ENABLE_OWNER_NOTIFICATIONS
false. It is a separate inherited administrator provider route, not a monitored
alert channel or part of the account-mail overlay. The tunnel verifies the flag
is false before forwarding. Real notification/account/provider/recipient/content
and cost approval remain external gates; do not enable it to simulate monitoring.

After explicit launch authority and release acceptance, take and verify the
independent encrypted backup before startup migrations. Follow
[database recovery](DATABASE_RECOVERY.md), including account-fence and deletion
suppression requirements. This document intentionally does not issue a launch
command or claim that schema downgrade is safe.

Secret/configuration changes require coordinated process restart; cached values,
existing DB connections and queued work are not atomically rotated by editing a
file. Revalidate staging first. Session signing-key rotation invalidates existing
cookies; independent credential/mail keys need their own recovery strategy.
Drain workers/requests before replacement, retain a reviewed prior image digest,
and reconcile migration compatibility before rollback. Restore rehearsal,
representative load, real monitoring, customer pilot and full privacy acceptance
remain release requirements.
