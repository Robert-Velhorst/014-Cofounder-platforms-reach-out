import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntimeSupervisor } from "./runtime-supervisor";
class Child extends EventEmitter {
  exitCode: number | null = null;
  signalCode: NodeJS.Signals | null = null;
  kill = vi.fn((_signal: NodeJS.Signals) => true);
  close(code: number | null, signal: NodeJS.Signals | null = null) {
    this.exitCode = code;
    this.signalCode = signal;
    this.emit("close", code, signal);
  }
}
const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function setup() {
  const children: Child[] = [];
  const events: unknown[] = [];
  const launch = vi.fn(() => {
    const c = new Child();
    children.push(c);
    return c;
  });
  const runtime = createRuntimeSupervisor({
    launch,
    report: event => events.push(event),
  });
  return { runtime, launch, children, events };
}
afterEach(() => vi.useRealTimers());
describe("signal-aware migration/server runtime supervisor", () => {
  it("starts exactly one server only after migration closes successfully", async () => {
    const f = setup();
    const result = f.runtime.run();
    expect(f.runtime.run()).toBe(result);
    expect(f.launch.mock.calls).toHaveLength(1);
    f.children[0].close(0);
    await tick();
    expect(f.launch.mock.calls).toHaveLength(2);
    f.children[1].close(0);
    expect(await result).toBe(0);
  });
  it("preserves migration failure and never starts the server", async () => {
    const f = setup();
    const result = f.runtime.run();
    f.children[0].close(7);
    expect(await result).toBe(7);
    expect(f.launch).toHaveBeenCalledTimes(1);
  });
  it.each(["SIGTERM", "SIGINT"] as const)(
    "forwards %s during migration and awaits actual close",
    async signal => {
      const f = setup();
      let settled = false;
      const result = f.runtime.run().then(code => {
        settled = true;
        return code;
      });
      f.runtime.stop(signal);
      await tick();
      expect(f.children[0].kill).toHaveBeenCalledWith(signal);
      expect(settled).toBe(false);
      f.children[0].close(null, signal);
      expect(await result).toBe(0);
      expect(f.launch).toHaveBeenCalledTimes(1);
    }
  );
  it("does not launch a server after stop at the successful migration handoff", async () => {
    const f = setup();
    const result = f.runtime.run();
    f.children[0].close(0);
    f.runtime.stop("SIGTERM");
    expect(await result).toBe(0);
    expect(f.launch).toHaveBeenCalledTimes(1);
    expect(f.children[0].kill).not.toHaveBeenCalled();
  });
  it("does not start any child after an already requested stop", async () => {
    const f = setup();
    f.runtime.stop("SIGTERM");
    expect(await f.runtime.run()).toBe(0);
    expect(f.launch).not.toHaveBeenCalled();
  });
  it("forwards server shutdown and preserves its failed drain", async () => {
    const f = setup();
    const result = f.runtime.run();
    f.children[0].close(0);
    await tick();
    f.runtime.stop("SIGTERM");
    expect(f.children[1].kill).toHaveBeenCalledWith("SIGTERM");
    f.children[1].close(1);
    expect(await result).toBe(1);
    expect(f.events).not.toContainEqual(
      expect.objectContaining({ event: "runtime_stopped" })
    );
  });
  it("does not relabel an interrupted server or unrelated migration signal as clean", async () => {
    for (const server of [true, false]) {
      const f = setup();
      const result = f.runtime.run();
      if (server) {
        f.children[0].close(0);
        await tick();
      }
      f.runtime.stop("SIGTERM");
      f.children.at(-1)!.close(null, server ? "SIGTERM" : "SIGKILL");
      expect(await result).toBe(1);
    }
  });
  it("keeps one fixed deadline and reports forced shutdown as failure", async () => {
    vi.useFakeTimers();
    const f = setup();
    const result = f.runtime.run();
    f.runtime.stop("SIGTERM");
    await vi.advanceTimersByTimeAsync(27_999);
    f.runtime.stop("SIGINT");
    expect(f.children[0].kill).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(f.children[0].kill).toHaveBeenLastCalledWith("SIGKILL");
    f.children[0].close(null, "SIGKILL");
    expect(await result).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("clears the deadline and ignores late/repeated signals after clean shutdown", async () => {
    vi.useFakeTimers();
    const f = setup();
    const result = f.runtime.run();
    f.runtime.stop("SIGTERM");
    f.children[0].close(null, "SIGTERM");
    expect(await result).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    f.runtime.stop("SIGINT");
    expect(f.children[0].kill).toHaveBeenCalledTimes(1);
  });
  it("does not signal a reaped child's possibly reused PID while stdio closure is pending", async () => {
    const f = setup();
    const result = f.runtime.run();
    f.children[0].exitCode = 0;
    f.runtime.stop("SIGTERM");
    expect(f.children[0].kill).not.toHaveBeenCalled();
    f.children[0].close(0);
    expect(await result).toBe(0);
  });
  it("contains spawn/kill error details and waits for close after repeated error events", async () => {
    const f = setup();
    const result = f.runtime.run();
    f.children[0].emit("error", new Error("synthetic-private-database-url"));
    f.children[0].emit("error", new Error("synthetic-private-path"));
    f.children[0].close(0);
    expect(await result).toBe(1);
    expect(JSON.stringify(f.events)).not.toMatch(/private|database-url|path/);
    expect(f.children[0].listenerCount("error")).toBe(0);
  });
  it("handles synchronous launch failure without leaking paths or starting another child", async () => {
    const report = vi.fn();
    const launch = vi.fn(() => {
      throw new Error("synthetic-private-path");
    });
    expect(await createRuntimeSupervisor({ launch, report }).run()).toBe(1);
    expect(launch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(report.mock.calls)).not.toContain("private-path");
  });
  it("fails closed when signal delivery fails even if the child later exits zero", async () => {
    const f = setup();
    const result = f.runtime.run();
    f.children[0].kill.mockReturnValue(false);
    f.runtime.stop("SIGTERM");
    f.children[0].close(0);
    expect(await result).toBe(1);
  });
});
