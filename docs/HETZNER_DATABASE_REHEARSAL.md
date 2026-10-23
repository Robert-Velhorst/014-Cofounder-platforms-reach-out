# Fresh database boundary rehearsal

`pnpm test:hetzner-database:integration` is a mandatory local/CI integration gate
after the reviewed custom database artifact is built. It does not need the app's
dependency installation. It imports the real pure runtime grant guard and uses
the shipped MySQL CLI against an exclusively owned synthetic `cofounder_test`
schema. It is not a substitute for the full application migration engine,
compiled-app startup, customer workload or TLS rehearsal.

## Scope and isolation

The implementation requires real fresh initialization, exact DML-only app grants,
rejection of the broader migrator by the runtime guard, successful DML and
migrator DDL, denied runtime DDL and denied foreign-schema/account/delegation
operations for both identities, local-only root and explicit network root
refusal. A separate network-none client must exercise the image wrapper's
configuration refusal. Assertions require actual MySQL permission error codes;
a failed connection or invalid SQL cannot count as a permission denial.

Image references resolve once to immutable local IDs before use. The UUID-owned
database has no published ports, an internal network, read-only filesystem,
numeric UID 999, dropped capabilities, no-new-privileges, 1 CPU/2 GiB/256 PID caps
and tmpfs-only data. Clients have lower independent limits, no capabilities,
read-only root and only their selected synthetic password mounted read-only.
The fixture never reads an operator's database URL or production password.

CLI observation timeouts do not prove a resource is stopped or absent. The
harness re-polls the same database, reconciles its exact ownership before removal
and retains secret scratch files when cleanup cannot be verified. No broad
container/network/volume prune is used. Investigate any cleanup failure before
rerunning locally; a new UUID is not a repair for an old retained fixture.

## Exhausted Docker address pools

Default behavior uses Docker's normal internal network allocation. If a busy
developer machine has exhausted those pools, do not prune unrelated networks or
change global Docker address pools merely to run this test. An operator-reviewed
`HETZNER_DATABASE_TEST_SUBNET` may specify an aligned RFC1918 IPv4 `/28`. Review
host, WSL and VPN routes independently first. The helper rejects Docker overlap,
public/loopback ranges, large/misaligned or malformed values; that is not proof
of host-route safety or permission to change real infrastructure. The explicit
subnet still creates only an internal UUID-owned test network and no public port.
The ordinary CI gate does not set this override.

## October 23 local observation — not passing acceptance

The exact custom image built from source `f0568b5` successfully. Its local image ID
was `sha256:625ef17aee79823749037ad982e1e826b3f6dd217feb334274281740794b915d`.
No registry publication was performed.

### Read-only grant observation and CLI transport correction

Later read-only inspection of that exact retained fixture succeeded. The two
actual application grant rows, selected schema, active-role and mandatory-role
metadata passed the production pure guard when read with `mysql --raw`. The
separate migration identity did not pass the runtime guard, as required. The raw
grant-array SHA-256 was
`0da20e6477961bfd9a64903eb324fa82b07988edc3f6b98924b1bea0de5411b8`.
No raw grants, password values or operator data are included in this receipt.

The same read without `--raw` doubled schema-escape backslashes in batch output
and failed the guard. This exposed a test-transport bug before the full rehearsal
reached that assertion. The maintained CLI now uses shared immutable
`MYSQL_RAW_BATCH_OPTIONS` including `--raw`; the strict production grant parser
is unchanged. A native regression distinguishes valid raw escape text from the
double-escaped batch representation. This is not a reason to normalize arbitrary
grant syntax or broaden accepted authority.

This direct query was read-only and used only the retained synthetic fixture.
It did not create another resource, modify SQL accounts/data, test DML/DDL denial,
run application migrations, establish TLS or remove the blocked fixture. Full
live execution of the corrected rehearsal remains required.

A second read-only query used the same shared options exported for the corrected
rehearsal and again passed the runtime guard. All 196 native operator/source
tests then passed, including the raw/double-escaped regression. No fixture was
created or removed, and the production parser was not changed.

The rehearsal initially refused exhausted Docker default pools before creating a
database. Read-only Docker-subnet/Windows-route review supported an explicit
test subnet. A later attempt created and started the owned database but failed
on Docker inspection timeouts before permission acceptance. Cleanup inspection
also failed; a later direct inspection found the synthetic database still running.
A subsequent native cleanup command was blocked by policy before execution.
It was not retried through a different route. That fixture, network and scratch
directory remain unresolved; exact IDs/paths are preserved only in the local
recovery record, not uploaded with private diagnostics. Do not call this a
passing database rehearsal or claim fixture removal.

The new bounded observation/reconciliation changes are source implementation,
not retested live acceptance. All 195 native operator/source tests passed on
Windows Node 25.2.1 with no failures or skips; this includes subnet guard and
mandatory integration-gate inventory checks, not real database execution.
Full current-head CI and complete MySQL/TLS
acceptance remain pending. No existing application database or real account was
modified, and no Docker restart or global network change was performed.
