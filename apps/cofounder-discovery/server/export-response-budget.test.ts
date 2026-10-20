import { EventEmitter } from "node:events";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createExportResponseBudget,
  EXPORT_RESPONSE_DEADLINE_MS,
} from "./export-response-budget";

class Response extends EventEmitter {
  destroyed = false;
  writableEnded = false;
  destroy = vi.fn(() => {
    this.destroyed = true;
    this.emit("close");
  });
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

it("expires both occupied slots at a fixed ten minutes and permits another response", () => {
  const budget = createExportResponseBudget(),
    first = new Response(),
    second = new Response();
  expect(EXPORT_RESPONSE_DEADLINE_MS).toBe(600000);
  budget.reserve(1, first);
  budget.reserve(1, second);
  expect(() => budget.reserve(1, new Response())).toThrow("downloads are busy");
  vi.advanceTimersByTime(EXPORT_RESPONSE_DEADLINE_MS - 1);
  expect(first.destroy).not.toHaveBeenCalled();
  expect(second.destroy).not.toHaveBeenCalled();
  first.emit("drain");
  second.emit("drain");
  vi.advanceTimersByTime(1);
  expect(first.destroy).toHaveBeenCalledTimes(1);
  expect(second.destroy).toHaveBeenCalledTimes(1);
  expect(first.listenerCount("finish")).toBe(0);
  expect(second.listenerCount("close")).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  expect(() => budget.reserve(2, new Response())).not.toThrow();
});

it.each(["finish", "close"] as const)(
  "cleans the timer and releases once after %s",
  event => {
    const budget = createExportResponseBudget(),
      first = new Response(),
      next = new Response();
    budget.reserve(2, first);
    first.emit(event);
    first.emit("close");
    first.emit("finish");
    expect(vi.getTimerCount()).toBe(0);
    expect(first.listenerCount("close")).toBe(0);
    expect(first.listenerCount("finish")).toBe(0);
    budget.reserve(2, next);
    expect(() => budget.reserve(1, new Response())).toThrow(
      "downloads are busy"
    );
    vi.advanceTimersByTime(EXPORT_RESPONSE_DEADLINE_MS);
    expect(first.destroy).not.toHaveBeenCalled();
    expect(next.destroy).toHaveBeenCalledTimes(1);
  }
);

it("does not charge slots or schedule deadlines for refused batches or closed connections", () => {
  const budget = createExportResponseBudget(),
    closed = new Response();
  closed.destroyed = true;
  for (const count of [0, -1, 0.5, 3, NaN])
    expect(() => budget.reserve(count, new Response())).toThrow();
  expect(() => budget.reserve(1, closed)).toThrow("connection closed");
  closed.destroyed = false;
  closed.writableEnded = true;
  expect(() => budget.reserve(1, closed)).toThrow("connection closed");
  expect(vi.getTimerCount()).toBe(0);
  expect(() => budget.reserve(2, new Response())).not.toThrow();
});

it("a stale deadline callback cannot destroy a finished response or release a new lease", () => {
  const timers = vi.spyOn(globalThis, "setTimeout");
  try {
    const budget = createExportResponseBudget(),
      first = new Response(),
      next = new Response();
    budget.reserve(2, first);
    const callback = timers.mock.calls[0][0] as () => void;
    first.emit("finish");
    budget.reserve(2, next);
    callback();
    callback();
    expect(first.destroy).not.toHaveBeenCalled();
    expect(next.destroy).not.toHaveBeenCalled();
    expect(() => budget.reserve(1, new Response())).toThrow(
      "downloads are busy"
    );
  } finally {
    timers.mockRestore();
  }
});
