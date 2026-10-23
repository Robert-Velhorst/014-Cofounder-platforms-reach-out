#!/usr/bin/env bash
# Sourced only during the official entrypoint's fresh initialization.
set +x
source /usr/local/lib/cofounder-validate-secrets.sh
cofounder_initialize_roles() {
    local schema password
    [[ "$MYSQL_DATABASE" = cofounder || "$MYSQL_DATABASE" = cofounder_test ]] || return 1
    [[ "$MYSQL_USER" = cofounder && "$MYSQL_ROOT_HOST" = localhost ]] || return 1
    cofounder_hex_password_file "${MYSQL_MIGRATOR_PASSWORD_FILE:-}" || return 1
    password="$(< "$MYSQL_MIGRATOR_PASSWORD_FILE")"
    # The only variable identifiers are these fixed schemas. Escape underscore
    # grant wildcards independently of SQL identifier quoting.
    case "$MYSQL_DATABASE" in
        cofounder) schema='cofounder' ;;
        cofounder_test) schema='cofounder\_test' ;;
    esac
    docker_process_sql --database=mysql >/dev/null 2>&1 <<-EOSQL
        SET @@SESSION.SQL_LOG_BIN=0;
        REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'cofounder'@'%';
        GRANT SELECT, INSERT, UPDATE, DELETE ON \`$schema\`.* TO 'cofounder'@'%';
        CREATE USER 'cofounder_migrator'@'%' IDENTIFIED BY '$password';
        GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON \`$schema\`.* TO 'cofounder_migrator'@'%';
EOSQL
}
if ! cofounder_initialize_roles; then
    mysql_error 'cofounder_database_role_initialization_failed'
fi
unset MYSQL_MIGRATOR_PASSWORD_FILE
unset -f cofounder_initialize_roles
