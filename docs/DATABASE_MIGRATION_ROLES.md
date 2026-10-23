# Read-only migration verification and credential separation

Status: implemented verification/startup paths. All 42 focused native production
configuration/release/requirements checks passed on the local Node 25.2.1 host,
and both changed entry points bundled successfully with esbuild 0.28.2. The
supported release runtime remains Node 26.12.0. These are not full TypeScript,
application-build or database results; nine new real-MySQL/compiled-app cases
await CI qualification. No real database user,
grant, password, secret mount or production service was changed by this increment.
This is a prerequisite for privilege-separated deployment, not a claim that the
current hosted roles have already been separated or approved.

## Commands and startup behavior

With the approved database URL already supplied through the existing protected
`DATABASE_URL_FILE` mechanism, a reviewed source checkout can run:

```sh
pnpm db:verify
```

The compiled production artifact supports the same operation from its application
working directory:

```sh
node dist/migrate.js --verify-only
```

Both require an already complete, exact migration history. They capture and
validate the bundled migration manifest/SQL hashes, acquire the same bounded
connection-scoped migration lock, read history, release the lock and close the
connection. They never call the applying engine, create its journal, execute the
captured SQL or repair a missing history. Success emits `migration_history_verified`,
not `migrations_applied`. Unknown arguments fail with a fixed redacted error.

`STARTUP_MIGRATION_MODE` selects the supervisor's first child:

| Value                            | Before the HTTP server may start                             |
| -------------------------------- | ------------------------------------------------------------ |
| Unset or `apply`                 | Existing serialized migration application and history checks |
| `verify`                         | Read-only complete-history verification; no applying engine  |
| Any other value, including empty | Refuse before launching a child; no fallback                 |

The server starts only after that child exits successfully. The existing bounded
TERM/INT supervisor remains responsible for migration cancellation and server
shutdown. `pnpm start` now uses this same supervisor rather than launching the
HTTP entry directly; the Docker startup command is unchanged. The standalone
production Compose definition defaults to `apply` and preserves explicit values
for the runtime to validate. Merely setting `verify` does not reduce SQL grants.

## Intended deployment separation

Before an approved production cutover:

1. Provision and independently review separate migration and runtime identities
   for the selected application schema. Runtime needs its required DML rights,
   not account administration, grants or schema-changing privileges.
2. Give a separate, bounded one-shot migration process the migration URL secret.
   Apply the reviewed artifact with the normal migration entry. Preserve the
   database backup, migration journal and compatibility/rollback decision.
3. Remove the migration credential from the running application's mounts and
   environment altogether. Hiding a variable while its privileged file remains
   readable by the app user is not credential isolation.
4. Configure the application with only its runtime URL and
   `STARTUP_MIGRATION_MODE=verify`. A missing, pending, newer or hash-damaged
   journal must prevent serving; do not add a bypass or retry through a more
   privileged credential.
5. Verify actual grants, denied DDL/account administration, successful supported
   application/worker/operator flows, startup races, backup/restore and rollback
   on the approved host before opening launch-sensitive features.

This increment does not automatically provision those identities or turn the
Hetzner preparation stack into a privilege-separated stack. Existing database
upgrades and grant/password changes need their own approved, recoverable process.
See [MySQL's privilege reference](https://dev.mysql.com/doc/refman/8.4/en/grant.html)
for the distinction between schema privileges and account-level authority; the
actual selected MySQL version and granted operations still need verification.

## Evidence and limits

Maintained native production-configuration checks exercise strict mode/argument
parsing, standard start-command wiring and exact Compose propagation, including
empty/invalid values. The existing mandatory MySQL migration suite adds isolated
synthetic roles with only SELECT/INSERT/UPDATE/DELETE on their own disposable
schema. New cases cover:

- successful source and compiled read-only verification, unchanged journal rows
  and actual DML success alongside a denied CREATE TABLE;
- empty-history refusal without journal/schema creation;
- pending, damaged and newer history refusing the real compiled supervisor before
  launching the HTTP server;
- unknown-input redaction and contention on the existing migration lock;
- the actual compiled application's readiness, login, session lookup, logout,
  durable revocation and graceful stop under DML-only credentials.

These new database cases are test implementations until an actual passing run is
recorded. Native checks do not substitute for them. Test users and databases are
uniquely named, locally guarded synthetic fixtures removed by the suite; no
production role is used or modified.

History agreement is not a full schema-integrity check: a manually dropped table,
changed column/index or unsafe grant is not disproved merely by a correct journal.
Nor does this operation establish supported-country/provider permission, live
mail delivery, public TLS, production-sized migration timing, retention approval,
hosted capacity, operating costs or human/operator launch acceptance.

Database-migration guidance influenced the design: existing SQL remains immutable,
the serialized applying path is retained, verification never silently applies a
pending migration, and production role/cutover changes remain separate gates.
