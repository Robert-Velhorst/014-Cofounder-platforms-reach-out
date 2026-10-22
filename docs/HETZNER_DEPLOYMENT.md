# Hetzner single-server deployment and acceptance

Status: preparation for an approved Hetzner deployment. No server, domain,
certificate, provider account or public service is created by adding these files.
The public beta still requires the complete launch, privacy, mailbox, provider,
support and operator acceptance in the goal matrix. Registration, deletion intake,
external providers and outreach remain held by the application definition.

## Architecture and artifacts

Use `compose.hetzner.yml` as a standalone definition. It extends only the hardened
`compose.production.yml` application service and removes that service's loopback
port publication. Never combine either hosted definition with the local
`docker-compose.yml` database defaults.

```text
Internet TCP 80/443 -> Caddy (container 8080/8443) -> app:3000
                       ingress network              |
                                                database network (internal)
                                                    |
                                                MySQL:3306
```

Only Caddy publishes host ports. MySQL is attached only to the internal database
network; Caddy is attached only to ingress; the application joins both. There is
no Docker socket mount or host networking. The application trusts exactly one
proxy hop. The reviewed Caddyfile replaces incoming forwarding headers and does
not trust another upstream CDN/proxy. Adding another ingress hop requires a new
review and acceptance test, not simply forwarding more client headers.

Every service runs with a numeric non-root user, read-only root filesystem,
dropped capabilities, no privilege escalation, bounded processes and rotated
logs. App/database/edge CPU caps are 1/1/0.5, and memory limits are 512 MiB/2 GiB/
256 MiB without extra swap. Their sum is not a host-sizing or billing guarantee;
reserve separate OS, Docker, migration, backup, disk and failure headroom and
measure on the approved host.

Build the application using the repository Dockerfile. Build the TLS edge using:

```sh
docker build --file Dockerfile.hetzner-edge --tag cofounder-hetzner-edge:local .
```

The edge Dockerfile pins the official Caddy 2.11.7 Alpine image index
`sha256:24ec7b05bc532c7bb57f727030c5056e257ff7138b4b50460306819ff79362bd`,
removes its unused privileged-port file capability, copies the reviewed Caddyfile,
and checks configuration syntax. Runtime uses high internal ports without adding
Linux capabilities. The public HTTP/HTTPS ports remain 80/443; Caddy's internal
port options do not change client URLs. See [Caddy's option reference](https://caddyserver.com/docs/caddyfile/options#http_port).

Before deployment, publish approved application and edge artifacts to the approved
registry, retain their exact digests and test receipts, and separately review the
MySQL image digest and platform. Source push approval does not publish container
images. `latest`, mutable tags and CI-local image IDs are refused by preflight.
The base image observation is from the [official image metadata](https://raw.githubusercontent.com/docker-library/repo-info/master/repos/caddy/remote/2.11.7-alpine.md);
it is not a vulnerability scan or approval of every future image update.

## Host and existing-service inventory

Use a reviewed Linux Docker/Compose installation on the approved Hetzner host.
Use the repository's supported Node version for operator commands. Compose must
support the `!reset` and `!override` merge tags; this stack has an automated model
check, including removal of the application port. Rootless/user-namespace mappings
must be reviewed separately before assuming host UID 999/1000 is correct.

Record existing services, origins, databases, volumes, schema/version, secret
references, monitored contacts and recovery points before any migration. Keep
the old service and data intact until verified cutover and rollback acceptance.
Do not initialize this stack on an existing database directory without its
reviewed upgrade/migration and independent backup plan.

Allow incoming TCP 80/443 and restrict SSH to approved administration addresses.
Do not expose application ports 3000/3014, database port 3306 or the Docker API.
Review both IPv4 and IPv6 and test from an independent network. Docker's published
traffic can bypass ordinary UFW handling; do not infer isolation from a UFW rule
alone. Review [Docker firewall behavior](https://docs.docker.com/engine/network/packet-filtering-firewalls/#docker-and-ufw)
and [Hetzner Cloud Firewall rules](https://docs.hetzner.com/cloud/firewalls/overview/).

Point the approved domain's A/AAAA records to the intended host; remove stale
records only through the authorized DNS change process. Public ACME issuance and
renewal require domain control, reachable challenge ports, correct clock and
provider/terms acceptance. The isolated CI certificate does not establish these.

## Persistent directories and secrets

Keep data and credentials outside the checkout and Docker build context. Set
`HETZNER_DATA_ROOT` to an existing reviewed absolute directory, such as an
operator-selected directory under `/srv`. Create these subdirectories before
startup; Compose refuses to silently create missing bind-source paths:

| Subdirectory   | Container target | Initial host owner | Purpose                                         |
| -------------- | ---------------- | ------------------ | ----------------------------------------------- |
| `mysql`        | `/var/lib/mysql` | UID/GID 999        | Persistent application database                 |
| `caddy-data`   | `/data`          | UID/GID 1000       | Certificates, private keys and CA/account state |
| `caddy-config` | `/config`        | UID/GID 1000       | Caddy configuration storage                     |

Use restrictive directory permissions and verify actual container access on Linux.
The data root itself should be traversable only by reviewed administrators;
Docker's bind mounts grant the corresponding service its selected subdirectory.
The Caddy data directory is persistent security state, not a disposable cache.
Preserve and protect it during updates and recovery. See the [official Docker
image persistence guidance](https://hub.docker.com/_/caddy).

Prepare separate protected files with strong, independently generated values:

| Variable                          | File content                                                                                               | Service read access   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------- |
| `DATABASE_URL_SECRET_FILE`        | App URL: MySQL user `cofounder`, hostname `database`, port 3306, schema `cofounder`, matching app password | App UID 1000          |
| `JWT_SECRET_FILE`                 | Unique session-signing value, at least 32 characters                                                       | App UID 1000          |
| `MYSQL_PASSWORD_SECRET_FILE`      | Matching application database password                                                                     | Database UID 999      |
| `MYSQL_ROOT_PASSWORD_SECRET_FILE` | Different administrator password                                                                           | Database UID 999 only |

Use URL encoding for credentials in the database URL; random hexadecimal values
avoid URL delimiter ambiguity. File values have the runtime's existing UTF-8/
size/newline constraints. Do not place values in commands, Git, shell history,
Compose environment values, logs or screenshots. With file-backed Compose
secrets, verify real file ownership and permissions; Compose is not an encrypted
vault and does not remap bind-file ownership. The application receives no MySQL
administrator credential. Its current schema-scoped user also runs bundled
migrations; independent migration/runtime roles remain a separate hardening gate.

For existing MySQL data, changing an initialization password file does not rotate
the existing database account. Perform a reviewed credential rotation with its
corresponding URL, connection lifecycle, recovery and rollback checks instead.

## Local validation before an authorized start

Provide these non-secret environment values through the approved host mechanism:

- `PRODUCTION_APP_IMAGE`, `PRODUCTION_EDGE_IMAGE`, `PRODUCTION_DATABASE_IMAGE`:
  reviewed `repository@sha256:<64 lowercase hex>` references.
- `PUBLIC_HOSTNAME`: the approved lowercase DNS hostname, without scheme/port.
- `PUBLIC_ORIGIN`: exactly `https://` followed by that hostname.
- `HETZNER_DATA_ROOT` and the four protected file paths above.

Then, from the reviewed checkout on that host:

```sh
node scripts/hetzner-preflight.mjs
```

Preflight rejects mutable image references, mismatched origins, non-DNS hostnames,
relative/missing data directories and checkout overlap (including symlinks). It
runs Compose quiet model validation without starting services or printing the
resolved environment. Its success receipt explicitly leaves host, DNS, TLS,
backup and budget verification false. It does not inspect secret contents,
authenticate the operator, prove the images are reviewed or enforce expenditure.

Complete the EUR 100/month reviewed budget, privacy/support decisions, deployment
authority, encrypted off-host backup and restore rehearsal before proceeding.

## Authorized staging/start and cutover

Only after those gates and any existing-data migration/backup acceptance:

```sh
docker compose -p cofounder-hetzner -f compose.hetzner.yml pull
docker compose -p cofounder-hetzner -f compose.hetzner.yml up --detach --wait --wait-timeout 180
```

Startup creates the configured schema on an empty data directory and the app
applies bundled migrations before serving. The edge starts after application
readiness. The edge health check only proves its HTTP listener/redirect process;
external TLS, backend health and user behavior require separate checks.

Keep launch-sensitive features closed. On a reviewed staging domain, verify
trusted public HTTPS without insecure-certificate flags, HTTP-to-HTTPS redirect,
health/readiness, correct certificate hostname/expiry, real browser login/logout,
Secure/HttpOnly/SameSite=Lax/Path=/ cookies without Domain, cross-origin mutation
refusal, forwarding-header sanitization and lack of public backend/database ports.
Verify IPv6, proxy failure, database restart, disk-full behavior and denied access
from an independent machine. The Caddyfile sets one-year HSTS for this hostname
only; rollback must continue serving valid HTTPS.

Follow [runtime monitoring](RUNTIME_MONITORING.md) and
[database recovery](DATABASE_RECOVERY.md) for health checks, encrypted backups,
restore isolation and deletion-suppression review. Configure actually delivered
alerts with a responsible recipient; JSON monitoring output alone is not an alert.
Monitor host disk/inodes, database growth, certificate renewal/expiry and backup
age in addition to HTTP health. A Hetzner disk snapshot alone is not proof of
consistent encrypted remote recovery or a retention policy.

Preserve the previous reviewed image digests, encrypted backup and compatibility
decision before replacement. Stop/drain the application and workers as documented,
verify the changed schema remains compatible, and restore only through the
isolated reviewed workflow when needed. Do not assume changing an image tag
reverses committed DDL. No cutover or deletion of the former service is implied by
successful container startup. Do not delete the database or Caddy bind directories
as container cleanup.

## Maintained TLS rehearsal and its limits

`pnpm test:hetzner-config` checks the production Compose model and preflight
behavior without starting containers. `pnpm test:tls-ingress:integration` uses the
actual Hetzner Compose graph with uniquely owned synthetic fixtures. It substitutes
tmpfs for persistent stores, removes every public port, makes both networks
internal and changes only the certificate issuer to Caddy's internal test CA.

The TLS client verifies that CA and hostname; it does not use insecure TLS. It
checks readiness/security headers, HTTP redirect, real login/session/logout,
cookie scope, hostile forwarding claims, cross-origin mutation refusal and revoked
session handling. A separate database-namespace probe verifies the actual admitted
source IP and absence of a spoofed source quota. The client has no database network
or database credentials. All helpers refuse non-synthetic databases. The harness
checks actual images, users, mounts, private networks, resources and stopped/no-OOM
states before removing its exact containers/networks and scratch files.

These local/CI checks are not real Hetzner provisioning, public DNS/ACME renewal,
browser/device acceptance, operating-cost enforcement, real mailbox delivery,
backup/rollback acceptance or public-launch approval. Record actual successful
executions and their artifacts before treating this rehearsal as passing evidence.
