/** Test-only finite workload; no CLI, database access, credentials or provider calls. */
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

export async function drainWorkers<T>(
  items: T[],
  concurrency: number,
  work: (item: T) => Promise<void>
) {
  assert.ok(Number.isSafeInteger(concurrency) && concurrency > 0);
  let next = 0;
  let failed = false;
  let firstError: unknown;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (!failed && next < items.length) {
        const item = items[next++];
        try {
          await work(item);
        } catch (error) {
          if (!failed) firstError = error;
          failed = true;
        }
      }
    })
  );
  // Do not close connections or destroy sockets while another worker is active.
  if (failed) throw firstError;
}

export function latencySummary(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p: number) =>
    Number(
      (sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)] ?? 0).toFixed(2)
    );
  return {
    count: values.length,
    p50ms: percentile(0.5),
    p95ms: percentile(0.95),
    p99ms: percentile(0.99),
  };
}

export type WriteActor = { id: number; candidateId: number };
type WriteResponse = { status: number; ms: number; data: any };
type Call<A> = (
  actor: A,
  route: string,
  input: unknown,
  mutation?: boolean
) => Promise<WriteResponse>;
const operations = [
  "review",
  "edit",
  "unchangedReplay",
  "staleConflict",
  "archive",
  "restore",
] as const;

export const syntheticTitle = (
  actor: WriteActor,
  concurrency: number,
  round: number
) => `Synthetic load ${actor.id} tier ${concurrency} round ${round}`;

export async function workspaceWriteTier<A extends WriteActor>(
  actors: A[],
  concurrency: number,
  rounds: number,
  call: Call<A>
) {
  assert.ok(actors.length > 0 && actors.length <= 100);
  assert.ok(concurrency === 5 || concurrency === 20);
  assert.ok(Number.isSafeInteger(rounds) && rounds > 0 && rounds <= 10);
  assert.equal(new Set(actors.map(actor => actor.id)).size, actors.length);
  assert.equal(
    new Set(actors.map(actor => actor.candidateId)).size,
    actors.length
  );
  assert.ok(
    actors.every(
      actor =>
        Number.isSafeInteger(actor.id) &&
        actor.id > 0 &&
        Number.isSafeInteger(actor.candidateId) &&
        actor.candidateId > 0
    )
  );
  const byOperation = Object.fromEntries(
    operations.map(name => [
      name,
      {
        statuses: {} as Record<string, number>,
        ms: [] as number[],
      },
    ])
  );
  let committedChanges = 0;
  const started = performance.now();
  async function observed(
    actor: A,
    operation: (typeof operations)[number],
    route: string,
    input: unknown,
    status: number
  ) {
    const result = await call(actor, route, input, operation !== "review");
    const metric = byOperation[operation];
    metric.statuses[result.status] = (metric.statuses[result.status] ?? 0) + 1;
    metric.ms.push(result.ms);
    assert.ok(Number.isFinite(result.ms) && result.ms >= 0);
    assert.equal(result.status, status, `Unexpected ${operation} status`);
    if (status !== 200) assert.equal(result.data, undefined);
    else assert.notEqual(result.data, undefined);
    return result;
  }
  await drainWorkers(actors, concurrency, async actor => {
    for (let round = 0; round < rounds; round++) {
      const identity = { accountId: actor.id, id: actor.candidateId };
      const review = await observed(
        actor,
        "review",
        "criticalPath.prospects.details",
        identity,
        200
      );
      assert.equal(review.data.prospect.userId, actor.id);
      assert.equal(review.data.prospect.id, actor.candidateId);
      assert.equal(review.data.prospect.archivedAt, null);
      assert.match(review.data.revision, /^[a-f0-9]{64}$/);
      const edit = {
        ...identity,
        expectedRevision: review.data.revision,
        patch: { title: syntheticTitle(actor, concurrency, round) },
      };
      const saved = await observed(
        actor,
        "edit",
        "criticalPath.prospects.edit",
        edit,
        200
      );
      assert.equal(saved.data.changed, true);
      assert.equal(saved.data.archived, false);
      assert.match(saved.data.revision, /^[a-f0-9]{64}$/);
      assert.notEqual(saved.data.revision, review.data.revision);
      committedChanges++;
      const replay = await observed(
        actor,
        "unchangedReplay",
        "criticalPath.prospects.edit",
        edit,
        200
      );
      assert.equal(replay.data.changed, false);
      assert.equal(replay.data.revision, saved.data.revision);
      // A genuinely different patch with the superseded review must not overwrite.
      await observed(
        actor,
        "staleConflict",
        "criticalPath.prospects.edit",
        {
          ...edit,
          patch: { title: "Synthetic stale overwrite must be refused" },
        },
        409
      );
      const archived = await observed(
        actor,
        "archive",
        "criticalPath.prospects.archive",
        {
          ...identity,
          expectedRevision: saved.data.revision,
          confirmed: true,
        },
        200
      );
      assert.equal(archived.data.changed, true);
      assert.equal(archived.data.archived, true);
      assert.match(archived.data.revision, /^[a-f0-9]{64}$/);
      committedChanges++;
      const restored = await observed(
        actor,
        "restore",
        "criticalPath.prospects.restore",
        {
          ...identity,
          expectedRevision: archived.data.revision,
          confirmed: true,
        },
        200
      );
      assert.equal(restored.data.changed, true);
      assert.equal(restored.data.archived, false);
      assert.match(restored.data.revision, /^[a-f0-9]{64}$/);
      committedChanges++;
    }
  });
  const responses = operations.flatMap(name => byOperation[name].ms);
  const successes = operations
    .filter(name => name !== "staleConflict")
    .flatMap(name => byOperation[name].ms);
  const expectedCycles = actors.length * rounds;
  assert.equal(responses.length, expectedCycles * 6);
  assert.equal(committedChanges, expectedCycles * 3);
  const pass = latencySummary(successes).p95ms < 2000;
  return {
    event: "workspace_write_tier",
    concurrency,
    rounds,
    requests: responses.length,
    elapsedSeconds: Number(((performance.now() - started) / 1000).toFixed(2)),
    committedChanges,
    unchangedReplays: expectedCycles,
    staleConflicts: expectedCycles,
    transportErrors: 0,
    correctnessErrors: 0,
    automaticRetries: 0,
    allResponses: latencySummary(responses),
    successfulResponses: latencySummary(successes),
    byOperation: Object.fromEntries(
      operations.map(name => [
        name,
        {
          statuses: byOperation[name].statuses,
          responses: latencySummary(byOperation[name].ms),
        },
      ])
    ),
    pass,
  };
}
