# Database backup and isolated recovery

The operator CLI is `node scripts/database-recovery.mjs` (Node 22 or later).
It uses Docker's MySQL 8.4 clients, keeps SQL off the host filesystem, and writes
an authenticated encrypted `.cfb` artifact. This is a local recovery mechanism,
not a configured remote backup service, retention schedule or production cutover.
Do not rely on a backup until a separate restore and application acceptance pass.

Latest local rehearsal (October 2): bounded session-key reuse candidate/runtime
and its fresh integration image passed the unchanged encrypted full-schema case
(93,927.797 ms), with 34 separate recovery units. Restored two-owner real HTTP
login/isolation/logout, old link/session invalidation and four expired mail-job
discards passed with zero provider/budget attempts. Four exact retained fixtures
independently inspected stopped 0/no OOM/public ports. This is not off-host,
independent-key, production-scale or post-backup reconciliation acceptance.
[Exact candidate recovery evidence](SESSION_KEY_REUSE_2026-10-02.md#fresh-isolated-encrypted-recovery).

Earlier local rehearsal (October 2): new 68-source runtime/test images passed
encrypted schema/data restoration, two-owner compiled application acceptance,
old link/session invalidation and expired restored-mail discard with zero provider
attempts. No live backup/cutover or post-snapshot reconciliation is proved.
[Exact current recovery evidence](INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-exact-image-encrypted-recovery).

Earlier local rehearsal (October 2): help/63-source images passed expanded
view/procedure/trigger/event-definition recovery and restored two-owner application
acceptance. Binary-logged isolated restore targets are now refused before import;
actual negative target check passed. This changes target preparation requirements,
not source backup settings. See [current evidence and retained fixture failures](HELP_63_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-expanded-encrypted-recovery).

Earlier local rehearsal (October 2): the combined 60-source/export-language
runtimed8e17b4f... and testpackagea187faca... passed encrypted full-schema restoration
after724database tests. The actual restored runtime passed two-owner sign-in,
private-data isolation and session revocation. Schema/index/journal/binary/UTF-8
values and unsafe-target refusals were checked; all owned fixtures stopped cleanly.
See [exact identities, verification scope and remaining recovery limits](CURRENT_COMBINED_QUALIFICATION_2026-10-02.md#encrypted-recovery-passed-on-the-exact-new-images).
This does not configure remote backups, prove independent key recovery, qualify
production-scale recovery or authorize restoring/promoting a live database.

## Authority and prerequisites

Isolated restore also expires restored password-reset links before reporting
success, preserving their historical digests and already-expired timestamps.
A backup cannot know about links revoked/consumed later. Users must request new
links through the normal reviewed mail path. The restored `users` base table must
contain both reset columns; otherwise restore fails with the private
`restored_password_reset_invalidation_failed` code. Never promote that partially
restored target.

The same isolated restore also expires email-verification links, preserving token
and address-bound digests, older expired timestamps and existing verified flags.
Both `verificationToken` and `verificationTokenExpiry` must exist on the `users`
base table. Missing/incompatible schema or an unsuccessful expiry check fails
with `restored_email_verification_invalidation_failed`; the imported target must
remain isolated and unapproved. Pending accounts require fresh verification links.
Restore also expires `queued` and `sending` rows in the restored
`account_mail_jobs` table before success. Rows, encrypted payloads, attempts,
leases and acknowledgement history are retained; terminal jobs are untouched.
The normal worker discards expired jobs without decrypting payloads, issuing new
reset tokens or contacting the provider, then clears their payload and lease.
Missing/incompatible `state`/`expires_at` columns or failed expiry checks report
`restored_account_mail_invalidation_failed`; keep that imported target isolated.
This never authorizes retrying an old job or fabricates a delivery receipt.

This does not reconcile post-backup delivery acknowledgements/budget usage,
post-backup password/address changes,
deletions or suppression requests, or validate historical verified status against
events that happened after backup. Direct/manual SQL imports apply neither safeguard.

- Back up only an explicitly authorized source. Stop application workers and
  migrations, and exclude other schema writers for the whole backup window.
  `--maintenance-confirmed` is the operator's acknowledgement, **not** an automatic
  check or a command that stops services. InnoDB snapshot consistency does not
  protect against concurrent DDL. The tool rejects non-InnoDB base tables.
- Use a trusted operator workstation, Docker context and private output directory.
  Docker access is privileged; the tool is not an authorization boundary against
  administrators or malicious concurrent Docker/database operators.
- The source must contain a non-empty Drizzle migration journal. Database names,
  users and container selectors are validated; system schemas are rejected.
- Provide `RECOVERY_DB_PASSWORD` through the operator environment, never a command
  argument. Docker forwards it as `MYSQL_PWD`; authorized process/container
  administrators can still inspect environment credentials. Do not log the
  environment or run with shell tracing. Prefer a short-lived recovery credential.
- Source credentials need the MySQL privileges required for tables, views,
  triggers, routines and events; `SHOW_ROUTINE` may be needed. Grant only what the
  reviewed database requires. The synthetic rehearsal's broad fixture grants are
  not a production least-privilege template.
- Keep the 32-byte recovery key separately from backups and all application keys.
  Back up that key through an independently protected operator process: losing it
  makes the encrypted backup unusable. Set and verify restrictive Windows ACLs;
  POSIX files are created with mode 0600. Parent-directory access matters too.

## Create and check a backup

Create the key once in an existing protected directory outside the repository:

```powershell
node scripts/database-recovery.mjs keygen --key-file C:\ProtectedKeys\cofounder.key
```

Existing key and backup files are never overwritten. Key material is generated
locally and is not printed. Example PowerShell 7 credential intake:

```powershell
$recoveryCredential = Read-Host 'Database recovery password' -AsSecureString
$env:RECOVERY_DB_PASSWORD = [Net.NetworkCredential]::new('', $recoveryCredential).Password
```

After the maintenance window is established, use explicit source values and a
new filename in an existing protected directory:

```powershell
node scripts/database-recovery.mjs backup --container YOUR_DB_CONTAINER --database cofounder --user YOUR_BACKUP_USER --key-file C:\ProtectedKeys\cofounder.key --file D:\ProtectedBackups\cofounder-RELEASE-TIMESTAMP.cfb --maintenance-confirmed
node scripts/database-recovery.mjs verify --key-file C:\ProtectedKeys\cofounder.key --file D:\ProtectedBackups\cofounder-RELEASE-TIMESTAMP.cfb
```

The PowerShell wrapper accepts the same explicit configuration:

```powershell
.\scripts\backup-database.ps1 -Container YOUR_DB_CONTAINER -Database cofounder -User YOUR_BACKUP_USER -KeyFile C:\ProtectedKeys\cofounder.key -OutputFile D:\ProtectedBackups\cofounder-RELEASE-TIMESTAMP.cfb -MaintenanceConfirmed
```

The old implicit-container/plaintext-dump command is intentionally no longer
supported. Existing old backups are not deleted or converted. Review their access
and retention separately; this tool does not accept plaintext dumps for restore.
Clear `RECOVERY_DB_PASSWORD` from the shell after the operation.

Success events are `recovery_key_created`, `backup_created`, and `backup_verified`.
`verify` authenticates the file without connecting to Docker or MySQL; it does
**not** establish SQL correctness, application compatibility or recoverability.
Capture a dated operator receipt with release/image, source, artifact checksum,
key identifier (not key bytes), verification result and restore-test result in
protected operational records. Remote upload, destination permissions, automated
scheduling, failure alerts, retention and costs are still deployment work.

## Restore only to a new isolated target

Create a **separate**, operator-owned MySQL 8.4 container with:

- `--network none`, no published ports and label `cofounder.restore-target=true`;
- a new empty database with the **same database name** as the backup;
- MySQL `event_scheduler=OFF` or `DISABLED`;
- Binary logging disabled (`@@GLOBAL.log_bin=0`, start this separate target with
  `--skip-log-bin`). The CLI refuses binary-logged targets before importing SQL:
  restricted trigger/routine creation must not require broad privileges, and
  recovery must not feed a replication stream. Do not disable logging on a live
  database to satisfy this requirement. Source backups may still be binary-logged.
- a non-root restore account with direct grants only for the recovery database,
  no global privileges beyond USAGE, no role grants/active roles, and no grant
  delegation. Use a separate backup credential if source inspection requires
  global SHOW_ROUTINE; that privilege is not accepted for isolated restore;
- no application, worker, migration runner or concurrent restore attached.

Use fresh storage. Do not attach the source database volume or an existing
customer-data volume. Use disposable tmpfs only for rehearsal, not durable recovery.
This CLI does not create/delete databases, attach networks or promote a target.

Obtain the exact full target container ID, inspect it, then explicitly confirm it:

```powershell
docker inspect --format '{{.Id}}' YOUR_ISOLATED_TARGET
node scripts/database-recovery.mjs restore-isolated --container YOUR_ISOLATED_TARGET --confirm-target FULL_64_CHARACTER_TARGET_ID --database cofounder --user YOUR_RESTORE_USER --key-file C:\ProtectedKeys\cofounder.key --file D:\ProtectedBackups\cofounder-RELEASE-TIMESTAMP.cfb
```

Use the target's password in `RECOVERY_DB_PASSWORD`. Authentication completes
before any SQL reaches MySQL. The CLI rejects the original source container,
wrong database/ID, running event scheduler, missing label, network exposure, root
restore user, and any existing target tables/views/routines/events. These are
guards, not protection against another administrator racing the check.

The CLI reads CURRENT_ROLE and SHOW GRANTS through the same restore connection
before applying SQL. It rejects unknown grant forms, proxy/role/global grants,
other database scopes and WITH GRANT OPTION. It never changes those privileges.
Database names containing underscores require explicitly escaped underscore
grants; unescaped underscores can match other schemas under MySQL grant rules.
The conservative check also rejects unescaped forms when partial_revokes could
make them literal: reconcile with the operator, do not bypass it automatically.
See [MySQL 8.4 GRANT documentation](https://dev.mysql.com/doc/refman/8.4/en/grant.html).
Raw client output prevents double-escaping grant identifiers; it is not logged.
This confirms the observed account's grant boundary at check time, not Docker
administrator trust, source SQL safety or the absence of unrelated server data.

`backup_restored_isolated` means the MySQL client completed and a non-empty
migration journal exists. Before service promotion, independently verify:

1. The complete migration history against the **matching release artifact**.
2. Table/column/index/constraint definitions, row counts and representative values.
3. Account access, tenant isolation, opt-outs, archived records and audit history.
4. Required application encryption secrets through a separate approved recovery
   process. Database restoration alone does not restore those keys.
5. Queue/session safety. Recovered sessions and queued messages may be stale;
   keep mail/platform automation off and reconcile provider delivery receipts,
   revocations and deletions made after the backup before resuming traffic.
6. Measured restore duration, recovery-point loss, storage capacity and operator
   sign-off. No production RPO/RTO is claimed by the synthetic test.

If a command fails, keep the target isolated. Do not rerun over partial DDL,
rewrite journal hashes or automatically drop anything. Preserve safe phase codes
and inspect through a private operator channel. MySQL may retain partial changes;
a killed/timed-out Docker client does not prove its server-side work stopped.
Reconcile that state and use a newly authorized clean target for another attempt.

## Format and resource limits

Version 1: `CFBACK01`, four-byte big-endian metadata length, UTF-8 JSON metadata,
12-byte random nonce, AES-256-GCM ciphertext, then a 16-byte authentication tag.
The magic/length/metadata are authenticated additional data. Metadata contains
format version, source container ID, database name and creation time; it is visible,
so treat the whole artifact as private. SQL content is encrypted without text
decoding or newline conversion. This format is not an interoperable SQL/ZIP file.

Dump bytes are bounded to **64 MiB** and held in memory; authentication likewise
finishes in memory before restore. Larger databases fail explicitly without a
successful artifact; they are not truncated or silently partially backed up.
Memory usage is several times the dump size. Measure real beta data and replace
this bounded implementation with a reviewed larger-scale recovery mechanism if
needed before launch. Each Docker subprocess has a 120-second client timeout.
This is not an end-to-end RTO or a server cancellation guarantee.

Publication uses an exclusive private temporary file, file fsync and a no-replace
hard link on the same filesystem. The tool cleans its own partial file on ordinary
failure. Unsupported filesystems fail; it does not fall back to an overwrite.
A crash may leave a `.partial` file; no automatic retention/deletion is performed.
Host power-loss durability and remote storage recovery still require rehearsal.

## Reproduce the synthetic rehearsal

```powershell
pnpm --dir apps/cofounder-discovery build
docker build --target integration-test --tag cofounder-recovery-test:local .
docker build --target runtime --tag cofounder-recovery-runtime:local .
pnpm test:recovery
pnpm test:recovery:integration
```

The integration test creates uniquely named, network-disabled MySQL containers
with synthetic credentials and tmpfs databases. It applies all current migrations,
backs up, authenticates and restores into the separate empty target, compares
columns/indexes/migration history and binary/Unicode fixture values, and checks
tamper/target/overwrite/non-InnoDB/event-scheduler rejection. On Windows it also
executes the PowerShell wrapper. It stops only its own fixture containers and
removes only its private temporary files; stopped containers remain inspectable.
`RECOVERY_TEST_APP_IMAGE` can select an already available integration-test image.
`RECOVERY_TEST_DATABASE_IMAGE` can select an already available exact MySQL image
(default `mysql:8.4`). Before creating any fixture, the test resolves all selected
images to exact local IDs and validates them. Missing images
fail; fixture runs use --pull=never. Migration executes the selected image's own
compiled runner and migrations, not host dist/source mounts. This does not prove
that an arbitrary supplied image is an approved release or matches the checkout;
use a separately qualified image and record its ID. GitHub CI builds the test image;
configuration is not a claim that remote CI has run.

The expanded rehearsal also requires an already available production runtime;
`RECOVERY_TEST_RUNTIME_IMAGE` selects it, defaulting to `cofounder-recovery-runtime:local`.
It resolves that image to its exact local ID before creating any fixtures. After
restore it starts the runtime's normal migration/start command, with providers
disabled and outreach paused, then runs the read-only mounted
`scripts/recovery-application-probe.mjs` over real local HTTP. Two synthetic
pre-verified accounts/candidates are created in the source before encryption;
no records are seeded into the target after restore to make the test pass.
The probe checks actual readiness/compiled page, anonymous refusal, both restored
password logins, owned candidate lists, forged-account refusal and logout/session
revocation. It does not prove email delivery, browser rendering, every customer
workflow, pre-backup session continuity, hosted secret rotation or provider access.
CI preparation now builds both images before this required test; a contract test
checks that ordering. Hosted CI execution remains unverified.

Database fixtures now use non-root UID999, read-only root, dropped capabilities,
no-new-privileges, 2CPU/2GiB/no extra swap/256 PIDs, 1GiB tmpfs data and bounded
runtime/temp tmpfs. The migration runner uses UID1000/read-only/cap-drop ALL/
no-new-privileges/2CPU/1GiB/no extra swap/256 PIDs/64MiB noexec tmpfs. No source
mounts or public ports; only the self-created source DB loopback is shared.
Cleanup checks the fixture label, no-network/no-ports/temp-data identity and exact
container ID before stopping, then requires exit0/noOOM. Temporary key/backup/test
files are removed only from the self-created private temporary directory. These
are disposable rehearsal bounds, not a production-sized backup capacity claim.

## October 2 current local recovery checkpoint

### Restored session authority safeguard

The restore CLI now expires all restored `account_sessions` using
`LEAST(expires_at,CURRENT_TIMESTAMP)` and clears `admin_verified_until`. It preserves
the token digest, owner, creation time and existing past expiry. It verifies zero
future sessions and zero remaining administrator approvals before emitting
`restored_sessions_invalidated` and reporting restoration success. A failure
returns the content-free `restored_session_invalidation_failed` phase; do not
promote a partially restored target. The target must remain exclusively owned,
with no application or workers connected throughout restoration.

Older snapshots without that table have no session rows to invalidate. A view or
malformed session table is not silently accepted. Historical schema compatibility
has not been exhaustively tested. Manual SQL imports bypass this CLI safeguard.
This does not rotate signing keys or reconcile passwords, reset/verification
tokens, post-backup erasure/suppression requests, queues or provider state; those
remain separate promotion gates. Fresh sign-in is required after CLI restoration.

The synthetic regression first reproduced the defect: two active session rows
were backed up, then revoked in the source; the old CLI restored both as active
(one failed enclosing test, no skips, 27.956sec/exit1). The fixed rehearsal also
includes one already-expired session, checks all three historical identities and
creation times are preserved, past expiry is unchanged, and all three step-up
approvals are cleared. It then starts the exact production runtime and verifies
two real password logins, owned candidate lists, cross-account refusal and logout.
This is database-state plus real HTTP acceptance, not replay of captured cookies.

Final formatted-byte rehearsal: one enclosing test/no skips/37.898sec/exit0,
session75636. Same exact test/runtime/MySQL images as the preceding checkpoint;
no application source mounts, provider activity, production data or public ports.
Fixtures `cofounder-recovery-{source,target,app}-fec8da14` independently inspected
stopped0/noOOM. Temporary synthetic key/backup/data removed; container records
retained. Root/operator suite136tests/no skips/3.916sec/exit0; syntax,
traceability and selected application inventory checks passed. All116phasesPartial.
Root CLI SHA256 `2bc9ae77d5b4f9e4493cf86ffeb0a2ea89e764f9b265611cd0135e5629a3a6c4`;
integration script `f5575551d1581377e8fb34943457663c495d5417a9c9d7bfb2965da1ab701a10`.
Selected app/build inventory is unchanged and excludes these root operator files.

### Expanded restored-application checkpoint

The expanded full backup/restore plus production-runtime HTTP rehearsal passed
one enclosing test/no skips/31.421sec/terminal exit0, session53559. It used exact
test `c39b6159...` and runtime
`sha256:6289a8085aec51dfd806ddcaa8c05d57cfa364fcccc10f59bb31210b1ce48e72`
with the previously recorded MySQL image. Two restored accounts each retrieved
one own candidate, cross-account access was403, anonymous access401, both
logins were real and logout revoked both sessions. No RPC mocks, app source/
dist/dependency mounts, public ports or provider work. Synthetic emailVerified=1
fixtures are not verification/inbox proof. The runtime used UID1000/read-only/
cap-drop ALL/no-new-privileges/2CPU/1GiB/no extra swap/256 PIDs/64MiB noexec tmpfs,
shared only the isolated restored DB loopback and mounted only the HTTP probe.
It stopped0/noOOM with shutdown_completed; source/target also stopped0/noOOM.
Ephemeral synthetic data/private backup/key files discarded, containers retained.

Final runtime `e5d40a567b8240aa9a3105ab5dbd288b35384f2b604af67742992fba5e4e0b17`,
source `320682aedf12e04bfaf4e670cd6571b4c78a9a35c08b91238a281b0fbc3b5191`,
target `7599839d52a909c39c899351025a50c09f2aa5aeec69619bec41721062bfb0f3`.
Probe SHA256 `c57fe9261e96d49fe903ea3c8de292abf074eb786f595e499ad382332d0294e9`;
expanded integration script `65b29cb4f882b8685d7c1c653a71af0646e87e7ef88f9c14ca537251a4b965fb`.
The root files/CI preparation changed, not application/build inputs; selected app
inventory stays531files/10,442,939bytes/digest31170c25... and excludes these root
operator files. This is not a full release source attestation.

Initial expanded run failed31.522sec/exit1 because the probe incorrectly expected
an accountId response field; corrected to the actual items/total contract, without
altering product ownership rules. Cleanup still completed. Initial CI-build guard
also exposed its parser's omission of named scalar-run steps; parser now handles
those existing steps while still rejecting conditional/ignored commands. Both
failures remain recorded; final rerun passed. Two added local tests refuse missing/
wrong fixture authorization before network activity, with content-free errors.
Final root/operator regression:136tests/no skips/2.598sec/exit0. The new CI guard
passes along with existing conditional/commented-step exclusion tests. Formatting,
traceability and git diff whitespace checks pass; no remote CI execution claimed.

This establishes bounded restored application HTTP acceptance, not full restored
customer workflows, production volume/recovery timing, remote key/storage recovery,
privacy suppression or hosted operations. No publication/deployment/purchases or
real data/production permission changes occurred. All116phases remainPartial.

### Earlier schema-only checkpoints

Real readiness test passed one enclosing test with six explicit checks, no skips,
28.109 seconds/exit0: authenticated CI/local/integration probes, wrong credentials,
missing schema, the old ping's authentication false-positive, socket-only refusal
and old delayed-ping false-positive. This tests the actual checked-in health
commands, not a claim that remote CI or hosted readiness was exercised.

The hardened recovery test passed one enclosing full-schema rehearsal, no skips,
28.447 seconds/exit0, using exact test image
`sha256:c39b6159310810eb8ea2144c6eff98c4cd583dcad509fcba19c0fa0369cf43e9`
and MySQL image
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
It executed the native Windows PowerShell7 wrapper, encryption/authentication,
full migrated schema/index/history and binary/Unicode equivalence, source
preservation, corrupt artifact/wrong target/nonempty target/event scheduler/
nontransactional source/broad grants/delegation/active role rejection and refusing
to overwrite an existing backup. No SQL/plaintext backup was written to the host;
temporary encrypted artifacts/keys were removed by the fixture cleanup.

Source `c7ce511520fdd599a5d7bffdbbf79ac3f3b261d5ac4184b73cec351a66fb519e`
and target `139e8956f865cfe21e01332860e3a1201619c18a2d1805f703e3b0ea315e2d06`
independently inspected stopped0/noOOM. Readiness fixtures
`3fd41cc8bb71a211a7e0418de6be679f2ec494e74c0d80138e671bb251dceccd`
and `5eb80cab696ace52b6445aab70b15d09e88bbc0a6d114238d63733ba7233c76a`
also independently inspected stopped0/noOOM. A stopped unhealthy health status
is expected for the deliberately socket-only fixture and after shutdown; it is
not being reported as a running healthy database. Their synthetic tmpfs data
were discarded, stopped containers retained.
All133root/operator tests passed/no skips/3.471sec/exit0 after fixture changes.
The app/build inventory is unchanged because this root operator test is excluded
by that inventory's scope; it is not covered by the app's immutable-image digest.

Formatted current rehearsal SHA256
`af8540ad3226ee89ccd36db941067ce300191e64a96bc2bc0b1787a9e1284e62`;
readiness test `9021b22856479711e869bf63666ff8ca65292fe623a9078347f1ed4a28b55db1`;
unchanged recovery CLI `1bb6a966b0ff7c960e064db1bd4df1b76f7aa4f24af0d3a070022205b6d5a2dc`.
The first full rehearsal preceded whitespace formatting. The independent rerun
of the formatted test also completed:1test/no skips/28.262sec/terminal exit0,
session78407. This final-byte result is separate from the preceding pass.
Final rerun fixtures `cofounder-recovery-source-a31fec5f` and
`cofounder-recovery-target-a31fec5f` were also independently inspected exited0/
noOOM. Synthetic tmpfs data and private temporary artifacts/keys discarded;
stopped containers remain. Formatting and git diff whitespace checks pass;
traceability remains116Partial and selected app inventory remains531files/
10,442,939bytes/digest31170c25... with no application/build edits.

This closes these local rehearsal checks, not hosted recovery or launch readiness.
Remote encrypted storage, independent key recovery, scheduling/retention,
production-sized volume and timing, restored application acceptance, privacy
suppression and approved operational drills remain open. No deployment, purchase,
real data access, production grants or external provider actions occurred.

References: [MySQL mysqldump and snapshot limits](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html),
[Node 22 authenticated encryption and final authentication](https://nodejs.org/docs/latest-v22.x/api/crypto.html#deciphersetauthtagbuffer-encoding).
