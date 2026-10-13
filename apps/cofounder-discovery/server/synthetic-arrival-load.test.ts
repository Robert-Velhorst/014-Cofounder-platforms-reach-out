import { afterEach, describe, expect, it, vi } from "vitest";
import { arrivalLoad } from "../scripts/synthetic-arrival-load";
const options = { count: 5, intervalMs: 10, maxInFlight: 3, maxStartLagMs: 5 };
const clock = {
  now: () => Date.now(),
  sleep: (ms: number) => new Promise<void>(r => setTimeout(r, ms)),
};
afterEach(() => vi.useRealTimers());
describe("bounded synthetic open-loop arrivals", () => {
  it("starts on the original cadence rather than waiting for previous responses", async () => {
    vi.useFakeTimers();
    const starts: number[] = [];
    const run = arrivalLoad(
      options,
      () => {
        starts.push(Date.now());
        return new Promise(r => setTimeout(r, 15));
      },
      clock
    );
    await vi.advanceTimersByTimeAsync(60);
    expect(starts.map(n => n - starts[0])).toEqual([0, 10, 20, 30, 40]);
    expect(await run).toMatchObject({
      offered: 5,
      started: 5,
      completed: 5,
      failed: 0,
      droppedLate: 0,
      droppedCapacity: 0,
      droppedActor: 0,
      peakInFlight: 2,
    });
  });
  it("accounts for capacity drops without deferring or retrying them", async () => {
    vi.useFakeTimers();
    const run = arrivalLoad(
      { ...options, maxInFlight: 1 },
      () => new Promise(r => setTimeout(r, 25)),
      clock
    );
    await vi.advanceTimersByTimeAsync(70);
    expect(await run).toMatchObject({
      started: 2,
      completed: 2,
      droppedCapacity: 3,
      peakInFlight: 1,
      automaticRetries: 0,
    });
  });
  it("counts busy-actor drops separately from server failures", async () => {
    vi.useFakeTimers();
    const run = arrivalLoad(options, () => null, clock);
    await vi.advanceTimersByTimeAsync(50);
    expect(await run).toMatchObject({ started: 0, failed: 0, droppedActor: 5 });
  });
  it("drains rejected and synchronous operations without an unhandled rejection", async () => {
    vi.useFakeTimers();
    const run = arrivalLoad(
      options,
      i => {
        if (i === 0) throw new Error("synthetic");
        return Promise.reject(new Error("synthetic"));
      },
      clock
    );
    await vi.advanceTimersByTimeAsync(50);
    expect(await run).toMatchObject({
      started: 5,
      failed: 5,
      completed: 0,
      automaticRetries: 0,
    });
  });
  it("reports late arrivals instead of replaying a catch-up burst", async () => {
    let now = 0;
    const run = await arrivalLoad(options, () => Promise.resolve(), {
      now: () => now,
      sleep: async ms => {
        now += ms + 25;
      },
    });
    expect(run.droppedLate).toBeGreaterThan(0);
    expect(run.offered).toBe(run.started + run.droppedLate);
  });
  it.each([
    { count: 0 },
    { count: 20_001 },
    { intervalMs: 0 },
    { maxInFlight: 101 },
    { maxStartLagMs: Number.NaN },
  ])(
    "rejects invalid workload bounds before starting requests: %j",
    async patch => {
      const start = vi.fn();
      await expect(
        arrivalLoad({ ...options, ...patch }, start)
      ).rejects.toThrow();
      expect(start).not.toHaveBeenCalled();
    }
  );
});
