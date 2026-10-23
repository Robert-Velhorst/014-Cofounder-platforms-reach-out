import assert from "node:assert/strict";
import { isAbsolute } from "node:path";

export function tlsNoNewPrivileges(options) {
  if (
    !Array.isArray(options) ||
    options.some((value) => typeof value !== "string")
  )
    return false;
  const claims = options.filter((value) =>
    value.startsWith("no-new-privileges"),
  );
  return (
    claims.length === 1 &&
    ["no-new-privileges", "no-new-privileges:true"].includes(claims[0])
  );
}

export function tlsProbeFailurePhase(stdout) {
  const phases = new Set([
    "seed",
    "verify",
    "https_readiness",
    "http_redirect",
    "https_login_with_hostile_forwarding_headers",
    "authenticated_session",
    "cross_origin_mutation_refusal",
    "https_logout",
  ]);
  for (const line of String(stdout ?? "").split(/\r?\n/)) {
    try {
      const value = JSON.parse(line);
      if (value?.event === "tls_ingress_failed" && phases.has(value.phase))
        return value.phase;
    } catch {}
  }
  return "unknown";
}

export function ownedTlsFixture(model, owner, project) {
  // `docker ps -q` returns a shortened ID. Retain the canonical inspected ID
  // for the final ownership check and all subsequent destructive operations.
  assert.match(model.Id, /^[a-f0-9]{64}$/);
  const role = model.Config.Labels["com.docker.compose.service"];
  assert.ok(["app", "database", "edge", "migrate"].includes(role));
  assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
  assert.equal(model.Config.Labels["com.docker.compose.project"], project);
  return { id: model.Id, role };
}

export function tlsIngressOverride(owner, caddyFile) {
  assert.match(
    owner,
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  );
  assert.ok(isAbsolute(caddyFile));
  return `services:
  app:
    labels: {cofounder.synthetic-owner: "${owner}"}
    environment: {ENABLE_ACCOUNT_DELETION_WORKER: "false"}
  migrate:
    labels: {cofounder.synthetic-owner: "${owner}"}
  database:
    labels: {cofounder.synthetic-owner: "${owner}"}
    volumes: !reset []
    tmpfs:
      - /var/lib/mysql:rw,noexec,nosuid,size=1g,uid=999,gid=999,mode=0700
    environment: {MYSQL_DATABASE: cofounder_test}
    healthcheck:
      test: [CMD-SHELL, 'MYSQL_PWD="$$(cat /run/secrets/mysql_password)" mysql --no-defaults --host=127.0.0.1 --protocol=TCP --connect-timeout=2 --user=cofounder cofounder_test --execute="SELECT 1" >/dev/null']
      interval: 2s
  edge:
    labels: {cofounder.synthetic-owner: "${owner}"}
    ports: !reset []
    volumes: !override
      - type: bind
        source: ${JSON.stringify(caddyFile)}
        target: /etc/caddy/Caddyfile
        read_only: true
    tmpfs:
      - /data:rw,noexec,nosuid,size=64m,uid=1000,gid=1000,mode=0700
      - /config:rw,noexec,nosuid,size=16m,uid=1000,gid=1000,mode=0700
networks:
  ingress:
    internal: true
    labels: {cofounder.synthetic-owner: "${owner}"}
  database:
    labels: {cofounder.synthetic-owner: "${owner}"}
`;
}
