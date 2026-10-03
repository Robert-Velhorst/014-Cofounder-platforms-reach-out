# Renewed packaged database and runtime acceptance

October 2, 2026. Status: fresh local synthetic database regression and pruned
runtime HTTP acceptance passed. Not hosted acceptance, a published release,
customer/browser qualification or public-beta launch approval.

## Exact artifacts and boundary

This continues the [Node 22 packaging checkpoint](OWNER_SAFETY_NODE22_PACKAGING_2026-10-02.md),
without rebuilding or substituting its artifacts:

- Runtime: sha256:7051857016875b3f5bea07c41db08a7e64b1c71461a29307a72b56c576516870.
- Test image: sha256:501f2fa2cd4e8646240a15dbca19fca88ae3ddc116ae51ac76b756dc3dfbf17a.
- Both contain the previously verified matching 116 dist/drizzle files,
  6,800,407 bytes, digest d97cf02553b7fe910c29d8d9874946da72972b4c1a1fd6754a84ba7621b52361.
- The preceding actual runtime build passed 725 unit tests/72 files on Node
  v22.23.3 (97.27 seconds), type checking, compilation and production pruning.
  Those build results were not rerun or counted as database tests here.

Observed dirty branch agent/public-saas-beta and HEAD
89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb remain local. HEAD does not identify
uncommitted contents; this is not committed-source or registry attestation.

## Actual fresh database regression

The test image ran its unmodified default `pnpm db:migrate && pnpm test:integration`
against a newly initialized synthetic MySQL database. Migrations applied;
**712 tests/42 files passed, no skips, 255.04 seconds, terminal exit 0**.
This is a new complete run, not reuse of the older image's 712-test result.
The actual test container had no host mounts, two CPUs, two GiB and 256 PIDs;
these test bounds do not prove production capacity.

The owned MySQL container used `network none`, no published ports or persistent
mounts, one CPU/one GiB/256 PIDs, and one-GiB temporary database storage. Test and
runtime containers shared only this container's network-disabled namespace,
using loopback. Runtime had a separate schema and dedicated synthetic database
user. No existing app/database or customer record was used.

Actual inspected container identities:

- Database: bb89ddc782cdfdf86179b23250ca43df41fe61b062786115d1c245e622d7391d.
- Test runner: 583af73dec7b0ca83dc4dcf556484ef64e9e0beb16d554007247b11ec4cf25d2.
- Runtime: 74a80e00ab29b49651a20a57a570862388c3fe95b383f5b51f74853a316e14a5.

All carried the ownership label 014-owner-safety-20261002-r2.

## Actual pruned application acceptance

The runtime executed its packaged migration/startup command, logging migrations
applied and production server started on loopback. Only synthetic database/JWT
secret files and the read-only QA smoke script were mounted, not source, dist,
migrations, .env or development tooling. All production feature gates including
owner notifications, registration, account-mail worker/retention, deletion,
automation and unsafe legacy routes were false; outreach remained paused.

The real HTTP smoke passed database readiness, compiled assets and headers,
origin/body/error boundaries, protected catalogue/progress/export/private preset
routes, disabled provider/legacy routes, signed-out account behavior, and
unauthenticated owner-notification refusal. The QA script hash was
ddc1262348e91825f2dc0ea92527c2f291d220270bb0b1fad37a2f7effe9cfca.
Its receipt reported nonRoot/providersDisabled/databaseReady/compiledClient true.
This was local HTTP, not a hosted HTTPS/proxy/cookie or full browser journey.

Inspected runtime restrictions: UID/GID 1000, read-only root, dropped ALL
capabilities, no-new-privileges, one CPU, 512 MiB memory and memory-swap,
320 MiB V8 old-space, 256 PIDs, bounded noexec/nosuid temporary storage and no
published ports. Shutdown emitted started/completed events and exited 0 without
OOM kill. These observed fixture restrictions do not establish deployed-host
enforcement, sustained load capacity or provider acceptance.

## Runner corrections and cleanup

Docker refused creation of an internal network because its address pools were
exhausted. No network was created, shared settings were not changed and unrelated
networks were not removed. A first database container remained never-started;
it is preserved as cofounder-owner-db-20261002-r1. The successful fixture used
the network-disabled namespace described above.

An initial readiness probe preceded final MySQL initialization and refused its
connection; subsequent authenticated TCP readiness passed. The first smoke
invocation incorrectly combined `--input-type=module` with an .mjs filename;
Node rejected the runner invocation. The corrected `node /qa/production-smoke.mjs`
passed without restarting or changing the app/image/tests. An initial cleanup
query's short host argument was parsed incorrectly by the host shell; using the
explicit long host option returned the aggregate counts below. Failed attempts
are not acceptance evidence.

After the test runner exited, both schemas had zero aggregate rows across users,
audit_events, account_sessions, account_mail_jobs, prospects, outreach_records
and workspace_presets. This does not assert every table was empty: migrations
and shared control rows can remain. Following exact ownership/isolation checks,
the owned database stopped cleanly (exit 0, no OOM), discarding only its synthetic
temporary data. Runtime/test/database containers and images were preserved in
stopped/local form; no active runner remains. Synthetic secret fixtures remain
outside the repository for replay, never as deployment credentials.

## Remaining release gates

All 133 root/operator tests passed without skips (3.44 seconds, host Node25).
Retained-source traceability reports 116 Partial, zero Missing/Implemented,
12 required artifacts and completionProven=false; no phase is promoted.
The deployment-patterns skill kept build, packaged tests and bounded runtime
evidence distinct. Selected inventory acceptance/provenance flags remain false.

Still required: approved committed-source/registry provenance, fresh-source
security/license/privacy review, real HTTPS/proxy/cookie and Windows/ngrok
acceptance, current platform permissions and terms, authorized mailbox/provider
and recipient checks, customer/browser journeys, load/restore/rollback and
operator acceptance. Worldwide platform coverage and all original phases remain
in scope. No deployment, provider send, publication, commit, push, merge,
purchase or permission change occurred. The EUR100/month ceiling remains
planning-only, with EUR80 recurring target and EUR20 reserve.
