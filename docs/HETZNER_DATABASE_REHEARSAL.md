# Fresh database boundary rehearsal

`pnpm test:hetzner-database:integration` is a mandatory local/CI integration gate
after the reviewed custom database artifact is built. It does not need the app's
dependency installation. It imports the real pure runtime grant guard and uses
the shipped MySQL CLI against an exclusively owned synthetic `cofounder_test`
schema. It is not a substitute for the full application migration engine,
compiled-app startup, customer workload or TLS rehearsal.

## October 23 CI qualification and main publication

The fresh-role rehearsal passed in
[CI run 39883752403](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39883752403)
at exact PR #118 head `774191131cb172550dc225d74c049e834b5a6a24`, on Node
26.12.0. Its `hetzner_database_authority_verified` receipt proves successful
runtime DML, denied runtime DDL, foreign-schema/account/delegation refusal,
successful migrator DDL, rejection of the migrator as a runtime identity,
remote-root refusal and image-wrapper refusal. The owned database fixture exited
zero, without OOM, and was removed. This standalone receipt deliberately does not
claim full application or TLS acceptance by itself.

The same full CI run separately passed TypeScript/build, 1,036 application unit
cases across 102 files, 736 database cases across 43 files (including 44 migration
startup cases), readiness, encrypted recovery, startup/admission, the complete
100-account/10,000-candidate customer workload, actual TLS/session boundaries,
production container smoke and both dependency-advisory checks. Its four-service
TLS graph proved DDL/foreign-schema/account-administration refusal, no migration
secret in the application, local-only root, verified certificate/redirect/cookie/
logout behavior, hostile forwarding and cross-origin refusal, revoked-session
refusal, source admission, and four clean zero-exit/no-OOM fixture removals.
The synthetic account bypassed actual inbox delivery; provider actions were zero.

Exact local image IDs from that run:

| Artifact        | Immutable image ID                                                        |
| --------------- | ------------------------------------------------------------------------- |
| Runtime         | `sha256:336c49245fb91d004db4f83579fa9a9e9acd9f06d478298d8314230048a75dd3` |
| Test tools      | `sha256:a5aa95caf25b17368c171fe06e621e1d29e6f2b8e20f9a01b47749082a840a66` |
| Custom database | `sha256:4bef45b52a707de4dea92e6b3f7cdb3663a15cc1acc41e860036644ea4c83d12` |
| TLS edge        | `sha256:563359e547a29dffaa6ef77141618be13dc25d862c1dc0230dbccc204726a06a` |

These are CI-local artifacts, not published registry artifacts or deployed hosts.
PR #117 independently passed
[full CI 39883674484](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39883674484)
at `fa4501550cd6b3648e9ab1d67751f70c9af8211a` before merging as `1510ef3`.
PR #118 merged as `cb8944afced4b3510a20d5f14a3211579d58defd`; the resulting main
tree was checked identical to qualified head `7741911`. Its separate
[post-merge CI](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39887723059)
and [CodeQL](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39887723057)
were queued at this publication checkpoint and are not credited as passing.

This closes the failed test-transport qualification gap for the fresh synthetic
CI artifact. It does not resolve the earlier retained Windows fixture, diagnose
that host's Docker timeouts, approve existing-database migration or account/grant
changes, verify hosted restore/mail/provider behavior, authorize deployment or
spending, or complete the worldwide public-beta goal. The historical local
failure and read-only observations below remain valid within their dated scope.

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
