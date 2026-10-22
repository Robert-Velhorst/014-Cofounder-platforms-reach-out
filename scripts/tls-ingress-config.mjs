import assert from "node:assert/strict";
import { isAbsolute } from "node:path";

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
