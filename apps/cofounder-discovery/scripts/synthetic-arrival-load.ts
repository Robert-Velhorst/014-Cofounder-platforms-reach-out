/** Finite synthetic arrival scheduling; never queues or retries missed arrivals. */
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { latencySummary } from "./synthetic-workspace-write-load";

type Clock = { now: () => number; sleep: (ms: number) => Promise<void> };
export async function arrivalLoad(
  options: {
    count: number;
    intervalMs: number;
    maxInFlight: number;
    maxStartLagMs: number;
  },
  // Null means this actor already has an outstanding request: do not queue it.
  start: (index: number) => Promise<unknown> | null,
  clock: Clock = {
    now: () => performance.now(),
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  }
) {
  assert.ok(
    Number.isSafeInteger(options.count) &&
      options.count > 0 &&
      options.count <= 20_000
  );
  assert.ok(
    Number.isFinite(options.intervalMs) &&
      options.intervalMs >= 1 &&
      options.intervalMs <= 1000
  );
  assert.ok(
    Number.isSafeInteger(options.maxInFlight) &&
      options.maxInFlight > 0 &&
      options.maxInFlight <= 100
  );
  assert.ok(
    Number.isFinite(options.maxStartLagMs) &&
      options.maxStartLagMs > 0 &&
      options.maxStartLagMs <= 1000
  );
  const epoch = clock.now();
  const pending = new Set<Promise<void>>();
  const lag: number[] = [],
    service: number[] = [],
    scheduled: number[] = [];
  let started = 0,
    completed = 0,
    failed = 0,
    droppedLate = 0,
    droppedCapacity = 0,
    droppedActor = 0,
    peakInFlight = 0;
  for (let index = 0; index < options.count; index++) {
    const due = epoch + index * options.intervalMs;
    while (clock.now() < due) await clock.sleep(due - clock.now());
    const began = clock.now();
    assert.ok(Number.isFinite(began) && began >= due);
    if (began - due > options.maxStartLagMs) {
      droppedLate++;
      continue;
    }
    if (pending.size >= options.maxInFlight) {
      droppedCapacity++;
      continue;
    }
    let operation: Promise<unknown> | null;
    try {
      operation = start(index);
    } catch {
      started++;
      failed++;
      continue;
    }
    if (operation === null) {
      droppedActor++;
      continue;
    }
    started++;
    lag.push(began - due);
    let tracked: Promise<void>;
    tracked = Promise.resolve(operation)
      .then(
        () => {
          completed++;
        },
        () => {
          failed++;
        }
      )
      .then(() => {
        const ended = clock.now();
        service.push(ended - began);
        scheduled.push(ended - due);
        pending.delete(tracked);
      });
    pending.add(tracked);
    peakInFlight = Math.max(peakInFlight, pending.size);
  }
  await Promise.all(pending);
  assert.equal(started, completed + failed);
  assert.equal(
    options.count,
    started + droppedLate + droppedCapacity + droppedActor
  );
  return {
    offered: options.count,
    started,
    completed,
    failed,
    droppedLate,
    droppedCapacity,
    droppedActor,
    peakInFlight,
    automaticRetries: 0,
    startLag: latencySummary(lag),
    serviceResponses: latencySummary(service),
    scheduledResponses: latencySummary(scheduled),
  };
}
