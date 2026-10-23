# Runtime monitoring preparation

This monitor is a working read-only probe, not a deployed monitoring service or
notification integration. An operator must approve its target, supervise its
execution, connect its events to an approved alert recipient, and exercise that
delivery before public launch. No accounts, paid service, email or webhook is
created by this tool.

## Local probe

With the approved local production app running, use Node 26.12.0, matching the
repository's pinned CI/container runtime:

```sh
node scripts/production-monitor.mjs --origin http://127.0.0.1:3014
```

Default origin is numeric loopback `http://127.0.0.1:3000`. Default execution is
one sample. It independently reads `/api/health` and `/api/ready`: a production
liveness response alone cannot mask database readiness failure. Healthy means
both endpoints return HTTP 200 with the expected JSON status, and liveness says
production mode. It does not prove schema integrity, working authentication,
customer actions, mail delivery, backups, capacity, permission gates or budget.

Exit codes: **0** latest completed sample healthy; **1** unavailable, interrupted
or runtime failure; **2** invalid configuration. A successful final sample does
not mean the entire sampling window was healthy. Inspect the outage/recovery
events, not only the exit code.

## Consecutive failures and recovery

```sh
node scripts/production-monitor.mjs --origin http://127.0.0.1:3014 --samples 120 --interval-ms 30000 --failure-threshold 3
```

The process emits bounded JSON lines:

- `runtime_probe`: timestamp, overall health, and fixed reasons/HTTP status for
  each endpoint. There are no URLs, response bodies, cookies or credentials.
- `runtime_alert`: emitted once when the consecutive-failure threshold is reached.
- `runtime_recovered`: emitted once on the next successful sample after an alert.

A healthy sample resets a transient failure streak. Repeated unhealthy samples
do not repeatedly emit the same alert. These are **local events, not delivered
notifications**. They contain no recipient or provider configuration.

The default threshold is three, with a maximum of 100. Samples are finite:
1–2,880. Interval is 1,000–3,600,000 ms, measured after each completed probe;
slow probes extend the total window. Timeout per endpoint is 100–10,000 ms
(default 3,000), covering response headers and body. Responses are capped at
2,048 bytes; malformed/non-JSON/wrong-status responses fail closed. Redirects
are rejected rather than followed. Polls are serial, with no overlapping queue.
SIGINT/SIGTERM stop further samples and interrupt the interval wait; an in-flight
probe may take up to two endpoint timeouts to settle. Interruption returns 1.

State is bounded and process-local. Restart loses failure history. Repeated
one-shot runs do not accumulate the three-failure threshold across invocations;
their nonzero exit must be handled by the scheduler/monitoring system itself.
Finite runs stop after the chosen sample count. Supervision, continuity checks,
independent monitoring of the monitor, event retention and alert delivery remain
operator responsibilities. Do not silently restart a failed app or database.

## Remote targets require a separate authority decision

Only numeric loopback is accepted by default. Remote probing requires explicit
`--allow-remote` and an HTTPS origin without credentials, path, query or fragment.
Use it only for the actual approved deployment. The flag is a configuration
guard, not evidence of permission or a substitute for approval. This local work
has not contacted a remote target. There is no authenticated/private endpoint
support and no TLS downgrade, redirect following or certificate bypass.

## Launch acceptance still required

Choose monitoring ownership and an approved delivery channel within the EUR 100
monthly ceiling. Verify DNS/TLS, independent availability, real database outage,
recovery, restart handling and alert receipt on the intended host. Cover disk,
memory, backup age/restore, job/mail failures, certificate expiry, business paths
and monthly spending separately; these two endpoints do not measure them.
The [operating-budget declaration checker](OPERATING_BUDGET.md) can reject
incomplete, stale or over-envelope local plans. It does not measure invoices,
configure provider limits or deliver spending alerts.

Local regressions: `pnpm test:monitor` covers target/resource validation, real
HTTP status/schema/timeout/size/redirect handling, private-output exclusion,
serial samples, transition suppression and CLI exit codes. The delivery ledger
records actual isolated runtime fault-injection results separately. Local proof
does not complete hosted monitoring or public launch acceptance.

On 2026-10-01, the real private production runtime stop/restart yielded 30 probes,
one outage event and one recovery event. Pausing/unpausing only the disposable
database yielded 40 probes, one outage and one recovery, while liveness remained
healthy during the database fault. Both finite monitors ended healthy with exit 0.
SIGTERM also interrupted a one-hour interval promptly, with expected exit 1.
Monitor regressions passed all 16 tests on Windows and Linux. These use synthetic
local fixtures, not the eventual host, remote provider or actual alert recipient.
