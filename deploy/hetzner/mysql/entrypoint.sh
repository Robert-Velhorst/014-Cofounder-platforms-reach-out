#!/usr/bin/env bash
set +x
set -euo pipefail
source /usr/local/lib/cofounder-validate-secrets.sh
if [[ "$(id -u)" != 999 || "$(id -g)" != 999 ]]; then
    printf '%s\n' 'cofounder_database_identity_refused' >&2
    exit 1
fi
if [[ "$#" -ne 1 || "${1:-}" != mysqld ]] || ! cofounder_mysql_configuration 2>/dev/null; then
    printf '%s\n' 'cofounder_database_configuration_refused' >&2
    exit 1
fi
# Existing data skips official initialization; the app's independent guard still
# refuses broad grants. Never silently rewrite an existing operator's accounts.
exec /usr/local/bin/docker-entrypoint.sh "$@"
