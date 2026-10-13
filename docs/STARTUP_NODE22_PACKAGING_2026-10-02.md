# Node 22 packaging and compiled startup acceptance

October 2, 2026. Fresh local image builds and bounded pruned-runtime checks passed.
Not a database/customer/hosted acceptance receipt, published release or launch approval.

## Exact local artifacts

- Runtime: sha256:08f7959be6ebdd8da1fb0f75e233432e4ce111b0790bf5f5055493ed8f11970c,
  223,445,482 bytes, cofounder-local-startup-runtime-20261002-r1.
- Database-test image: sha256:39528549c082d4e2a6a174dc8462a4e8ad675ab05cfc6582231ddb669c0572ae,
  280,319,218 bytes, cofounder-local-startup-tests-20261002-r1.
- Actual Dockerfile SHA256:
  1d0312526228e7924dc9885115cf045834cde4843bfdaa49e2254fcf9f789fc0.
- Pinned Node base:
  node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c.
  Observed Node in both images: v22.23.3.

Both new tags were absent before creation. Builds used the actual runtime and
integration-test Dockerfile targets and reached terminal exit 0. No app/source
change occurred during the builds. Dependency installation reused the cached
frozen-lockfile layer; production deploy/pruning used its offline store, 546
packages reused and zero downloads at that step. This does not establish
offline registry metadata access, dependency audit freshness or upstream provenance.
Older images and unrelated apps were preserved. Nothing was uploaded.

Observed dirty branch agent/public-saas-beta, HEAD
89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb. HEAD does not identify the uncommitted
contents. Selected source/local-build inventory remained 517 files/10,325,362
bytes, digest 54fe0c3351f8cd75f40011c4e0b883de49c29496fd0c643960f30c2471a0f08f.
Its build/test/production attestation flags remain false; exclusions in
[the inventory scope](RELEASE_INVENTORY.md) remain applicable.

## Actual build and artifact checks

The runtime build ran type checking, all 731 tests/74 files without skips
(89.94 seconds, Node22), client/server/operator compilation and production
dependency pruning. The test-image target freshly compiled its packaged
application; its default migration/database test command was not run here.
Earlier host Node25 results (107.85 seconds) are separate evidence, not this run.

Read-only probes recursively hashed dist/drizzle files in each exact image.
Sorted [relative path, byte length, SHA256] entries serialized as JSON matched:
116 files, 6,800,869 bytes, digest
23f370db0aa2c5db6fe031e7364bd589a9a7532efbaf6462e6cb3fa6ce3fedef.
This proves those files match, not all dependencies, causal source provenance
or complete runtime behavior. The test image is not a pruned production runtime.

The runtime probe confirmed UID1000, required entry/client/migration artifacts
including migration0038, and absence of source/.env/Vite/Vitest/tsx/TypeScript
paths. Probes had no external networking or published ports, read-only root,
dropped ALL capabilities/no-new-privileges and bounded process/memory limits.

## Real pruned compiled startup check

The unchanged runtime image executed a read-only external QA script, without
source/dist/migration or development-tool mounts. QA script SHA256:
167bc4022932605570d6859da42d5f1133ba60fae946262b0de72a51dad7c481.
It spawned the image's actual dist/index.js with synthetic settings and checked:

1. Invalid configuration exits1 with empty stdout and only the fixed fatal event.
2. A real owned occupied loopback port rejects startup with the same private
   event, no alternate port/readiness announcement, and leaves its owner intact.
3. After releasing that port, actual app startup serves health200, then SIGTERM
   produces shutdown_completed, empty stderr and exit0.

All three checkpoints passed and the QA command exited0. UID/GID1000, read-only
root, ALL capabilities dropped, no-new-privileges, one CPU/512MiB/no extra swap,
128PIDs and bounded noexec/nosuid temporary storage were explicit QA bounds.
All provider/automation/mail gates were false; no credentials or real data used.
The only mount was the read-only QA script. Ephemeral probe containers were
automatically removed after completion; no customer data or database was removed.
Images and the QA script remain local. No active build/probe handle remains.

This explicitly invoked the compiled app entrypoint, not the image's default
migration-then-app command. No database was started/contacted, no readiness or
database test was claimed, and no production HTTP smoke/browser path was run.
Liveness alone does not mean the database or customer service is ready.

## Other checks and remaining gates

All 133 root/operator tests passed without skips (3.91 seconds, host Node25).
Retained prompt traceability still reports 116 Partial, zero Missing/Implemented,
12 required artifacts and completionProven=false; no phase promotion.
The deployment-patterns skill kept build, file parity and compiled runtime
checks separate from connected/provider/deployment acceptance.

Next: run these exact packaged migration/database artifacts against a new owned
synthetic database, then their default pruned startup/HTTP/customer paths.
The earlier 705185 runtime's 712 database tests and ten browser stages do not
qualify these new image IDs. Fresh-source security/privacy/license, approved
committed/registry provenance, hosted HTTPS/proxy/cookie, Windows/ngrok, current
platform permission/terms, live mailbox/provider/recipient, capacity/recovery/
rollback and operator acceptance remain required. All original phases and
worldwide platform scope remain intact. No deployment, send, publication,
commit, push, merge, purchase or permission change. EUR100/month is planning-only.
