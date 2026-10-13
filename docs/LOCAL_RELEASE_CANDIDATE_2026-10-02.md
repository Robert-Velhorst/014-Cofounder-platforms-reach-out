# Local release candidate: 2026-10-02

Status: runtime smoke and packaged database acceptance passed locally.
This is local synthetic evidence, not authorization or proof of public readiness.
Neither image was published. The full [launch gates](PUBLIC_BETA_DELIVERY.md#release-requirements-and-evidence) remain open.

## Artifact identity

Runtime tag: `cofounder-current-release-candidate-20261002:latest`.
Docker-observed identifier: `sha256:43d048e431b414113dd3ddee15815f801dcccd99ac3cce4ea702ecb08b035636`.
Observed size: 223426096 bytes. Acceptance used this identifier, not a mutable tag.

Packaged test-image tag: `cofounder-current-release-integration-20261002:latest`.
Docker-observed identifier: `sha256:0e2057419b80c6417c3a13ee707e76ab5b62af003629fddae372507e16a87a2e`.
Local identifiers do not establish registry availability, signature or committed-source/CI provenance.

Both stages use pinned Node base
`node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`.
Workspace lockfile SHA-256:
`9663cca4d25e7f4704aa60428780a1133bee36a2467d897e68bacdf78f81405c`.
The frozen-lockfile install downloaded its pinned tools/dependencies. An initial
fully offline build failed because the package manager was not cached; that is
not passing evidence. Production pruning subsequently used the offline store.
No package versions changed.

Eight hashes read from each packaged image in network-disabled read-only
containers matched exactly:

| Packaged artifact | SHA-256 in both images |
| --- | --- |
| `dist/index.js` | `d415a9beba1f33863115dd45d87216e18660cf0af79aa88f4718f4d6ad4b4672` |
| `dist/migrate.js` | `528c8bf03d9ea099ba3adf2a974452d156e5bf02572b065a3858b41c152680b0` |
| `dist/inspect-email-verification.js` | `253a242a2f86cba5ec65cea00b0b6f4bc3d9c1d353c2c259ab67707ee034881e` |
| `dist/require-account-reverification.js` | `2b4ad460f444857c13f6c399b473a3a305c65a00f6d7f7e8ee288f2f4aec7e03` |
| `dist/admin-enrollment.js` | `1d7db77df57f20421b49d7fd21b3ca97d0ce64c636320a944753bfb7a841c3ae` |
| `dist/process-account-deletion.js` | `eb58bc94d11989cd07f250e2e263661d3d06cb273e763e1c9763094f148f1bd2` |
| `dist/public/index.html` | `bac8bb80fb4951f0f406da1a4db1affb85221e9ee449a002866dc75a7427000c` |
| `drizzle/0037_verification_email_binding.sql` | `415ff3e0504d5c60bde0f446e1703279b899cc3bae4df719dade51002c83c249` |

This proves these eight files match, not all files, dependencies or image layers.
The runtime has pruned production dependencies; the test image retains development tools.

## Verification

- Runtime build: TypeScript, 580 unit cases in 61 files (74.81 seconds), browser/backend/operator compilation and offline production pruning passed.
- Eleven deployment-model/build-context checks and 32 monitor/recovery unit checks passed. No new remote backup/restore or delivered-alert acceptance is inferred.
- The actual runtime started using mounted synthetic database/session secret files and its packaged migration runner against disposable MySQL. Smoke passed readiness, compiled asset/headers, batch/body/origin errors, protected progress/catalogue/exports and blocked legacy/provider routes. Required operator bundles and migration 0037 were present; source, dev tools and .env paths were absent.
- Runtime restrictions inspected: non-root node user, read-only root, 1 CPU, 512 MiB memory/memory-swap, 320 MiB old-space ceiling, 256 PIDs, all capabilities dropped, no-new-privileges, 64 MiB temporary mount and no published ports. Loopback HTTP shares a network-disabled database namespace, not public HTTPS.
- Graceful shutdown emitted started/completed events, exited 0 and was not OOM-killed.
- Packaged database suite: 612 cases in 35 files passed in 215.15 seconds, exit 0, with no skipped cases. It used the new test image's actual configured migration/test command with no host source mounts and synthetic fixtures. Its 2 CPU/2 GiB limits are not production-runtime limits.
- After the suite terminated, fixture checks confirmed zero users, audit events, conversation starters, success metrics, campaigns and prospects. The owned network-isolated temporary database was then stopped; no unrelated containers or real records were changed.
- Production-lockfile advisory lookup: zero known vulnerabilities at this check, 549 dependencies. Not an OS/base-image scan, security certification or future guarantee. Local Trivy/Grype were unavailable.
- Local output/browser artifacts and secrets are excluded from the build context. Exclusion removes no files. Synthetic ignored secret fixtures must never be reused for hosting.

## Remaining release gates

Controller/support identity; approved retention/erasure policy; separately
authorized real-account re-verification; mail/inbox recovery acceptance; provider
permissions/worldwide coverage; hosting/domain/TLS/private database; remote
backup/restore and actual alerts; complete budget enforcement and customer pilot
remain open. Docker Desktop secret-file readability does not establish Linux host permissions.

Registration/deletion intake, mail/retention workers, platform automation and unsafe
legacy routes were disabled; outreach was paused. No provider mutation, real private
account action, live message, paid commitment, deployment, publication, commit or
merge occurred. Only owned test containers are stopped after terminal verification.
