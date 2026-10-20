# Node 22 packaging checkpoint after notification/tunnel repairs

October 2, 2026. Status: fresh local build and bounded container checks passed;
database, connected application and hosted acceptance remain unverified for
these new images. This is not a deployment, signed release or launch approval.

This is the dated packaging-only checkpoint. The [subsequent connected receipt](OWNER_SAFETY_PACKAGED_DATABASE_ACCEPTANCE_2026-10-02.md)
records fresh database/startup/HTTP/shutdown acceptance of these exact images;
it does not establish browser, hosted or provider acceptance.

## Observed artifacts and source

- Runtime: sha256:7051857016875b3f5bea07c41db08a7e64b1c71461a29307a72b56c576516870,
  223,445,210 bytes; tag cofounder-local-owner-safety-runtime-20261002-r1.
- Database-test image: sha256:501f2fa2cd4e8646240a15dbca19fca88ae3ddc116ae51ac76b756dc3dfbf17a,
  280,306,665 bytes; tag cofounder-local-owner-safety-tests-20261002-r1.
- Both use the actual Dockerfile and pinned
  node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c.
  Observed Node version inside both images: v22.23.3.
- Observed branch agent/public-saas-beta, HEAD
  89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb; dirty tree. HEAD does not identify
  the uncommitted changes tested here. No new Git or registry publication.
- Selected local inventory remains 514 files/10,317,127 bytes, digest
  41aeb3cbcac5af754cbcc21b6a9665edd908932f396a2b529c8bf05818e04ca6.
  Its build-provenance, test-acceptance and production-acceptance flags remain
  false. It excludes root operator sources/docs, .npmrc, installed dependencies,
  secrets, image layers and host/provider state; it is not complete attestation.

The new local tags were absent before creation. Older images were preserved.
The frozen lockfile was used without changing dependency versions. Package
manager/packages were downloaded during dependency installation; this was not
an offline build. Production pruning used the offline locked dependency store.

## What actually passed

The runtime build executed type checking, the full application unit suite,
application compilation and production dependency pruning through the normal
Dockerfile stages. All 725 tests/72 files passed without skips, 97.27 seconds,
including the notification default-off/private-log/real-loopback-timeout checks.
The build and database-test image build both reached terminal exit 0.

Read-only probes inside each image recursively hashed every regular dist/drizzle
file. Sorted [relative path, byte length, SHA-256] entries were JSON serialized
and hashed: 116 files/6,800,407 bytes, matching digest
d97cf02553b7fe910c29d8d9874946da72972b4c1a1fd6754a84ba7621b52361.
This proves parity of those compiled/migration files, not all dependencies,
source provenance or behavior. It does not make the test image a pruned runtime.

A separate runtime probe confirmed UID 1000, Node 22, required application/
migration entry files and absence of source/.env/Vite/Vitest/tsx/TypeScript paths.
Probe containers used immutable image IDs, external networking disabled, read-only
storage, dropped capabilities/no-new-privileges, one CPU/512 MiB memory/no extra
swap and 128 PIDs. These are test bounds, not deployed-host enforcement or measured
customer capacity.

All 14 tunnel-gate tests passed inside that pruned runtime using a read-only
mount of root operator scripts as QA inputs. They exercised real loopback held/
open/reheld HTTP, normalized headers, capacity/pending-request interruption and
injected lifecycle/endpoint/container failure paths. They did not run ngrok,
start hosted Compose, use Windows process handling or contact a provider. The
mounted host scripts are not asserted to be packaged app files.

The production HTTP smoke script now also requires the owner-notification flag
to be false and checks unauthenticated system.notifyOwner refusal. Its syntax
and formatting passed, but that changed HTTP smoke was not executed against an
app/database this turn. SHA-256:
ddc1262348e91825f2dc0ea92527c2f291d220270bb0b1fad37a2f7effe9cfca.
This root QA change occurred after the runtime build's source-copy step; no
application source/build input changed during qualification. A later HTTP run
must use and record this QA script explicitly.

Retained-source traceability still reports 116 Partial/zero Missing/zero
Implemented, 12 required artifacts and completionProven=false. No phase promotion.
The deployment-patterns skill guided separate source/build, artifact comparison
and runtime/test evidence; passing builds were not treated as hosted acceptance.

## Cleanup and remaining work

All build/probe/test commands reached terminal exit 0. Only the disposable
read-only QA probe containers were automatically removed; they held no customer
data. New/older images remain local for further qualification. No database was
started or inspected, no app endpoint was published and unrelated running apps
were untouched.

Next: exercise the new packaged migration/database command against an owned,
isolated synthetic database, then the real pruned app startup/HTTP/admin and
customer flows. The older 712-test database/runtime receipt remains valid only
for its earlier images and source; do not copy that result onto these IDs.
Actual HTTPS/proxy/cookie, Windows/ngrok, provider/mailbox/recipient/terms,
fresh-source security/license/privacy review, performance/restore/rollback,
operator/customer acceptance and authorized main/PR/release publication remain
open. The full worldwide platform scope and every original phase remain intact.
No provider action, paid service, purchase, deployment, commit, push or merge was
performed. The EUR 100/month budget remains planning-only.
