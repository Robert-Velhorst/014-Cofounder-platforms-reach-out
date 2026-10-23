#!/usr/bin/env bash
# No tracing, values or path-bearing diagnostics, including on rejection.
set +x

cofounder_hex_password_file() {
    local path="${1:-}" bytes hex tail
    [[ "$path" = /* && -f "$path" && -r "$path" && ! -L "$path" ]] || return 1
    bytes="$(wc -c < "$path" 2>/dev/null)" || return 1
    [[ "$bytes" -eq 64 || "$bytes" -eq 65 ]] || return 1
    hex="$(LC_ALL=C tr -cd '0-9a-f' < "$path" 2>/dev/null | wc -c)" || return 1
    [[ "$hex" -eq 64 ]] || return 1
    if [[ "$bytes" -eq 65 ]]; then
        tail="$(tail -c 1 -- "$path" 2>/dev/null | od -An -tu1)" || return 1
        [[ "$tail" -eq 10 ]] || return 1
    fi
}

cofounder_mysql_configuration() {
    [[ "${MYSQL_DATABASE:-}" = cofounder || "${MYSQL_DATABASE:-}" = cofounder_test ]] || return 1
    [[ "${MYSQL_USER:-}" = cofounder && "${MYSQL_ROOT_HOST:-}" = localhost ]] || return 1
    # Reject raw, empty/random/expired-root alternatives even when explicitly empty.
    local key
    for key in MYSQL_PASSWORD MYSQL_ROOT_PASSWORD MYSQL_MIGRATOR_PASSWORD MYSQL_ALLOW_EMPTY_PASSWORD MYSQL_RANDOM_ROOT_PASSWORD MYSQL_ONETIME_PASSWORD; do
        [[ ! -v "$key" ]] || return 1
    done
    cofounder_hex_password_file "${MYSQL_PASSWORD_FILE:-}" || return 1
    cofounder_hex_password_file "${MYSQL_ROOT_PASSWORD_FILE:-}" || return 1
    cofounder_hex_password_file "${MYSQL_MIGRATOR_PASSWORD_FILE:-}" || return 1
    # Different accounts must not accidentally share a password.
    local app root migrator
    app="$(< "$MYSQL_PASSWORD_FILE")"
    root="$(< "$MYSQL_ROOT_PASSWORD_FILE")"
    migrator="$(< "$MYSQL_MIGRATOR_PASSWORD_FILE")"
    [[ "$app" != "$root" && "$app" != "$migrator" && "$root" != "$migrator" ]]
}
