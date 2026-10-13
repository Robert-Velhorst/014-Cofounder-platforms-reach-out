import { describe, expect, it } from "vitest";
import {
  drainWorkers,
  latencySummary,
  workspaceWriteTier,
} from "../scripts/synthetic-workspace-write-load";

function fixture(
  options: { replayChanges?: boolean; foreignOwner?: boolean; ms?: number } = {}
) {
  const rows = new Map<
    number,
    { title: string; archived: boolean; revision: number }
  >();
  const calls: { route: string; mutation: boolean }[] = [];
  const revision = (n: number) => n.toString(16).padStart(64, "0");
  return {
    calls,
    async call(
      actor: { id: number; candidateId: number },
      route: string,
      input: any,
      mutation = false
    ) {
      calls.push({ route, mutation });
      if (!rows.has(actor.id))
        rows.set(actor.id, { title: "initial", archived: false, revision: 1 });
      const row = rows.get(actor.id)!;
      const response = (status: number, data?: unknown) => ({
        status,
        data,
        ms: options.ms ?? 10,
      });
      if (route.endsWith("details"))
        return response(200, {
          prospect: {
            id: actor.candidateId,
            userId: options.foreignOwner ? actor.id + 1 : actor.id,
            archivedAt: null,
          },
          revision: revision(row.revision),
        });
      if (route.endsWith("edit") && row.title === input.patch.title)
        return response(200, {
          changed: options.replayChanges ?? false,
          archived: row.archived,
          revision: revision(row.revision),
        });
      if (input.expectedRevision !== revision(row.revision))
        return response(409);
      if (route.endsWith("edit")) row.title = input.patch.title;
      else row.archived = route.endsWith("archive");
      row.revision++;
      return response(200, {
        changed: true,
        archived: row.archived,
        revision: revision(row.revision),
      });
    },
  };
}
const actors = [
  { id: 1, candidateId: 10 },
  { id: 2, candidateId: 20 },
  { id: 3, candidateId: 30 },
];

describe("finite synthetic workspace-write workload", () => {
  it("requires six checked HTTP operations and three changes per cycle without automatic retries", async () => {
    const f = fixture();
    const result = await workspaceWriteTier(actors, 5, 2, f.call);
    expect(result).toMatchObject({
      pass: true,
      requests: 36,
      committedChanges: 18,
      unchangedReplays: 6,
      staleConflicts: 6,
      automaticRetries: 0,
    });
    expect(result.byOperation.staleConflict.statuses).toEqual({ "409": 6 });
    expect(result.successfulResponses.count).toBe(30);
    expect(f.calls.filter(call => !call.mutation)).toHaveLength(6);
  });
  it("fails a replay that reports another saved change rather than treating it as success", async () => {
    const f = fixture({ replayChanges: true });
    await expect(workspaceWriteTier(actors, 5, 1, f.call)).rejects.toThrow();
    expect(f.calls.some(call => call.route.endsWith("archive"))).toBe(false);
  });
  it("rejects another owner's review before sending a mutation", async () => {
    const f = fixture({ foreignOwner: true });
    await expect(workspaceWriteTier(actors, 5, 1, f.call)).rejects.toThrow();
    expect(f.calls.every(call => !call.mutation)).toBe(true);
  });
  it("does not weaken the predetermined two-second successful p95 rule", async () => {
    const f = fixture({ ms: 2000 });
    const result = await workspaceWriteTier(actors, 20, 1, f.call);
    expect(result.pass).toBe(false);
    expect(result.successfulResponses.p95ms).toBe(2000);
  });
  it("refuses duplicate owners, unsafe concurrency and unbounded rounds before calls", async () => {
    const f = fixture();
    await expect(
      workspaceWriteTier([actors[0], actors[0]], 5, 1, f.call)
    ).rejects.toThrow();
    await expect(workspaceWriteTier(actors, 100, 1, f.call)).rejects.toThrow();
    await expect(workspaceWriteTier(actors, 5, 11, f.call)).rejects.toThrow();
    expect(f.calls).toEqual([]);
  });
  it("waits for active workers after a failure and never starts queued work", async () => {
    let release!: () => void;
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    const failure = new Error("synthetic failure");
    const started: number[] = [];
    let settled = false;
    const result = drainWorkers([1, 2, 3], 2, async n => {
      started.push(n);
      if (n === 1) {
        await Promise.resolve();
        throw failure;
      }
      await held;
    }).catch(error => {
      settled = true;
      return error;
    });
    await new Promise(resolve => setImmediate(resolve));
    expect(settled).toBe(false);
    expect(started).toEqual([1, 2]);
    release();
    expect(await result).toBe(failure);
    expect(started).toEqual([1, 2]);
  });
  it("reports percentile values without mutating the observations", () => {
    const observations = [100, 10, 50];
    expect(latencySummary(observations)).toEqual({
      count: 3,
      p50ms: 50,
      p95ms: 100,
      p99ms: 100,
    });
    expect(observations).toEqual([100, 10, 50]);
  });
});
