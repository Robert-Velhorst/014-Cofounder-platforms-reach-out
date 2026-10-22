# Complete customer-load acceptance

The public-beta capacity gate runs the existing complete synthetic workload on a
production runtime image. It is mandatory in `pnpm test:all` and the GitHub CI
`verify` job. The workload and its acceptance thresholds have not been reduced.

## Run

From the repository root, using a supported Node version and Docker:

```sh
docker build --target integration-test --tag cofounder-recovery-test:local .
docker build --target runtime --tag cofounder-recovery-runtime:local .
pnpm test:customer-load:integration
```

The database image must already be local: the gate uses the exact MySQL reference
in `.github/workflows/ci.yml` and refuses to pull. CI's MySQL service makes that
image available. Local operators can explicitly pull that reviewed reference
before running the command. Optional `CUSTOMER_LOAD_RUNTIME_IMAGE`,
`CUSTOMER_LOAD_TEST_IMAGE`, and `CUSTOMER_LOAD_DATABASE_IMAGE` select alternative
local artifacts; the gate resolves all three to immutable image IDs before it
creates fixtures and prints those IDs in its aggregate receipt.

The integration-test image bundles the repository's
`apps/cofounder-discovery/scripts/synthetic-customer-load.ts`. The gate extracts
that helper without mounting the working source tree. The application and load
driver use the same pruned production image; only the driver receives the
compiled helper. This does not establish whole-package reproducible-build parity.

## Workload and limits

The retained workload includes 100 synthetic accounts, 10,000 candidates, genuine
HTTP logins, 600 warmup reads, six read routes, closed-loop concurrency 5/20/100,
ten-second arrival tiers at 50/150/500 per second, both complete write tiers,
same-owner competing writes, and cross-owner read/write isolation checks.
Normal 50/s and 150/s acceptance remains distinct from controlled overload at
500/s. A controlled refusal is not a successfully served normal-capacity request.

Each of the application and load driver receives one CPU, 512 MiB, a 320-MiB Node
old-space limit, and UID 1000. MySQL receives one CPU, 2 GiB, UID 999, and a 1-GiB
data tmpfs. All three have read-only root filesystems, 256 PIDs, dropped
capabilities, and no privilege escalation. They share only an owned, networkless
database namespace, expose no host ports, and have no persistent database volume.
External mail, notifications, AI, platform automation, and outreach are disabled.

Fixtures require a new empty `cofounder_test` database. The test never accepts a
customer database URL. Temporary secret files contain generated or fixed
synthetic values, never credentials copied from a deployment.

## Receipts and cleanup

The helper reports aggregate workload results. The harness additionally reports
artifact IDs, post-load memory observations, HTTP liveness/readiness, and each
fixture's stopped state and exit/OOM status. Post-load observations run even when
the workload reports a failed capacity tier. A failing workload still fails the
gate. Docker stderr and arbitrary application/database records are not printed.

The harness checks fixture ownership, exact images, resource limits, network,
mounts, runtime command, stopped state, and absence of OOM before removing each
exact self-created container. It removes only its own scratch directory. A
cleanup or invariant failure fails the test; no broad Docker prune is used.

## Evidence boundary

The baseline `65b87547e60c4b466088902a38e55536f29aa7ce` passed
[GitHub CI on October 20](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39467835793),
including database/recovery/startup/admission and container smoke checks. That
workflow did not run this workload, so its green status is not capacity evidence.
The older full workload failed normal 150/s acceptance on an earlier runtime;
see [the historical qualification](AUTH_QUERY_REUSE_PACKAGE_2026-10-03.md).
This new gate requires an actual successful execution before any new capacity
claim. It does not prove hosted sizing, sustained traffic, live mail/provider
behavior, budget enforcement, human acceptance, or full goal completion.
