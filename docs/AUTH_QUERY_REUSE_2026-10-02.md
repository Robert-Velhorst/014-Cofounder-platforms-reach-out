# Authentication query construction reuse — October 2, 2026

## Implemented, but not a verified capacity fix

Subsequent [October 3 packaged qualification](AUTH_QUERY_REUSE_PACKAGE_2026-10-03.md)
passed the fresh runtime build (1,030 unit cases), full 725-case database gate
and compiled package parity. The original full load still failed at 150/s:
95 busy refusals and three actor-start drops. The focused/pending entries below
describe the earlier implementation checkpoint, not current pending qualification.

The real user/session lookup functions rebuilt SQL and row-mapping descriptions
on every call. The profile had shown distributed query-construction/result work,
not a single proven cause. A regression through the actual functions/installed
Drizzle builder observed 40 constructions for 40 concurrent user reads and 40 for
40 concurrent session reads. That establishes redundant construction, not that
removing it clears the scheduled-arrival failure.

`getUserByOpenId` and `isAccountSessionActive` now lazily reuse one compiled query
description each per database instance. WeakMap keys prevent the cache from
pinning discarded pools; replacement databases construct their own plans.
Construction is synchronous before first execution, so concurrent cold callers
share a completed plan. A failed construction is not retained; execution failure
still propagates and the next request makes another database call.

Only SQL/row-mapping construction is reused. Every execution binds a fresh owner
or open ID, token digest and expiry cutoff, and still queries live rows. The
cutoff uses the original timestamp column encoder on every call. User fields,
session join, deletion fence, ownership, revocation and expiry predicates are
unchanged. No rows, authorization decisions, credentials or results are cached.
No admission/pool/resource limits, SDK JWT validation or session writes changed.

The installed MySQL2 Drizzle adapter executes these descriptions through
`client.query`, not MySQL server-side binary prepared statements. This is a
client SQL/row-mapping construction optimization only; no server plan reuse or
query-result-cache performance claim. The [Drizzle query-performance documentation](https://orm.drizzle.team/docs/perf-queries)
describes placeholders/preparation; local installed source establishes the exact
adapter behavior used here.

## Actual regression evidence

New `server/auth-query-reuse.test.ts` uses real Drizzle SQL compilation, parameter
binding and row mapping. Only the database driver is controlled; no sockets/SQL
server in these units. Corrected pre-change red receipt: five cases, four failed,
one passed (1.06 s reported in the retained log). An initial test timestamp
expectation omitted the actual millisecond suffix; that test error was corrected
and the red rerun occurred before implementation. Both receipts retained.

After implementation: five new cases passed. Final strengthened assertions count
actual `MySqlDialect.sqlToQuery` invocations, not just builder creation: one
compilation for concurrent user reads and one for concurrent session reads, with
every fresh driver invocation and per-request bindings still required. Cases also
cover updated/disappeared results, fresh expiry cutoff, separate plans after
database replacement, failed-execution propagation/retry and construction retry.
Forty calls are not replaced by one database read.

All 31 focused session/key/cookie cases across four files passed (final strengthened
run 9.63 s). Host typechecks passed, including after the last test assertions.
Full host unit run: 1,030 cases/101 files, no skips, 137.05 s. This full run preceded
the additional compilation-count assertions; the changed test then passed in
the final focused run. No production source changed between those runs.

## Fresh packaged MySQL session checks

Fresh repository `integration-test` target built with the changed product source
and session integration test, including application compilation. Exact test image:
`sha256:05ca01fdfc71da07f7f8910f260fa08f77f6d7832672affcc2850c49aa706e3f`.
Real migration and all 10 `session-security.integration.test.ts` cases passed,
no skips, 2.77 s (10.606 s attached process elapsed). New real-SDK case warms both
plans, observes a changed account name, refuses the deletion fence, observes
fence removal, then refuses a revoked cookie. Retained cases cover durable expiry,
reconnection/revocation, session caps and cold cross-owner races.

This is one focused database suite, not the complete mandatory database gate,
runtime/test package parity, fresh production-runtime build or unchanged full
scheduled-arrival qualification. Earlier 1,025-unit/724-database/browser/recovery
and capacity receipts belong to the previous runtime, not this changed candidate.
No current capacity improvement, all-UI, live inbox/provider or release approval.

Owner `864a46d5`: both exact fixtures independently inspected stopped exit 0,
no OOM/public ports/source mounts. Database network disabled; test joins only its
owned DB namespace. Both two CPUs/2 GiB/512 PIDs; DB non-root/read-only with
1-GiB data tmpfs. Test image retains development tools and its build-stage user;
it is not the hardened production runtime. No permissions or real data changed,
provider calls, outreach, spending, publishing or deployment.

## Evidence and next acceptance

`outputs/auth-query-reuse-20261002-r1`: initial/corrected red logs, focused/final
focused logs, host unit/typecheck logs, fresh integration-build/image receipts,
focused DB runner/log, independent fixture receipt and source hashes.
Product hashes: DB `6c39ca7937bb236447eb03d06091fe15339b3ae56335b7dc7b3ab0c73429a134`;
sessions `feca2d2b6824a8197ae3e2e7ad2ba8b463d533c1a7a2b9ee1e00a713c5d75972`.
No temporary profiling added to product code. Existing unrelated dirty work
preserved; no commit/merge/push. Next: fresh runtime build, complete mandatory DB
and package-parity checks, then the original unshortened load workload with
unchanged thresholds/resources. Only those results can establish capacity effect.
All 116 original phases remain Partial; completion remains unproven.

After documentation, the operator inventory check correctly failed on stale
source fingerprints. Regenerated with the existing inventory builder: all 230
UI actions, structure, totals and source paths unchanged; only `db.ts` and
`account-sessions.ts` hashes and aggregate input digest changed. New digest:
`d539befa6038a27e9f375063f4c665fa716c8132aba095fe74a7ba8e4a10a635`.
Failed receipt retained as `operator-red-stale-inventory.log`; subsequent all
171 operator cases passed without skips (4,332.8338 ms; `operator-green.log`).
Formatting, diff-whitespace and original 116-phase traceability passed. HEAD
remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; no commit, merge or push.
