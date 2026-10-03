import type { ChildProcess } from "node:child_process";

type Phase = "migration" | "server";
type StopSignal = "SIGTERM" | "SIGINT";
type Event = {
  event:
    | "runtime_phase_launching"
    | "runtime_stopping"
    | "runtime_stopped"
    | "runtime_failed";
  phase: Phase | "idle";
  code?: "spawn_failed" | "child_failed" | "signal_failed" | "shutdown_timeout";
};

/** Fixed two-child lifecycle. A delivered signal is not proof of child exit. */
export function createRuntimeSupervisor({
  launch,
  report,
  shutdownMs = 28_000,
}: {
  launch: (
    phase: Phase
  ) => Pick<
    ChildProcess,
    "on" | "once" | "removeListener" | "kill" | "exitCode" | "signalCode"
  >;
  report: (event: Event) => void;
  shutdownMs?: number;
}) {
  if (
    !Number.isSafeInteger(shutdownMs) ||
    shutdownMs < 1 ||
    shutdownMs > 28_000
  )
    throw new Error("invalid_runtime_shutdown_deadline");
  let child: ReturnType<typeof launch> | undefined;
  let phase: Phase | "idle" = "idle";
  let stopping: StopSignal | undefined;
  let timedOut = false;
  let signalFailed = false;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let result: Promise<number> | undefined;
  let finished = false;

  const forward = (signal: StopSignal | "SIGKILL") => {
    // An exited child's PID can be reused before inherited stdio has closed.
    if (child && (child.exitCode !== null || child.signalCode !== null)) return;
    try {
      if (child && !child.kill(signal)) signalFailed = true;
    } catch {
      signalFailed = true;
    }
    if (signalFailed)
      report({ event: "runtime_failed", phase, code: "signal_failed" });
  };
  const stop = (signal: StopSignal) => {
    if (stopping || finished) return;
    stopping = signal;
    report({ event: "runtime_stopping", phase });
    if (!child) return;
    forward(signal);
    // Fixed deadline is not renewed by repeated operator signals.
    deadline = setTimeout(() => {
      timedOut = true;
      report({ event: "runtime_failed", phase, code: "shutdown_timeout" });
      forward("SIGKILL");
    }, shutdownMs);
  };
  const runChild = (next: Phase): Promise<number> =>
    new Promise(resolve => {
      phase = next;
      let spawned: ReturnType<typeof launch>;
      let errored = false;
      try {
        spawned = launch(next);
        child = spawned;
      } catch {
        report({ event: "runtime_failed", phase, code: "spawn_failed" });
        resolve(1);
        return;
      }
      const error = () => {
        errored = true;
      };
      spawned.on("error", error);
      spawned.once("close", (code, signal) => {
        spawned.removeListener("error", error);
        child = undefined;
        let exit =
          Number.isInteger(code) && code !== null && code >= 0 && code <= 255
            ? code
            : 1;
        // Cancelling migration may terminate its connection mid-wait. Do not
        // interpret failed server drain, unrelated signals or migration errors as clean.
        if (
          stopping &&
          next === "migration" &&
          (signal === stopping || code === (stopping === "SIGTERM" ? 143 : 130))
        )
          exit = 0;
        if (errored || timedOut || signalFailed) exit = 1;
        if (exit !== 0)
          report({
            event: "runtime_failed",
            phase: next,
            code: "child_failed",
          });
        resolve(exit);
      });
      report({ event: "runtime_phase_launching", phase: next });
      // Handles a stop requested synchronously while constructing the child.
      if (stopping) {
        const signal = stopping;
        stopping = undefined;
        stop(signal);
      }
    });
  return {
    stop,
    run(): Promise<number> {
      if (result) return result;
      result = (async () => {
        let finalExit = 1;
        try {
          if (stopping) return (finalExit = 0);
          const migrated = await runChild("migration");
          if (migrated !== 0 || stopping) return (finalExit = migrated);
          return (finalExit = await runChild("server"));
        } finally {
          finished = true;
          if (deadline) clearTimeout(deadline);
          if (stopping && finalExit === 0 && !timedOut && !signalFailed)
            report({ event: "runtime_stopped", phase });
        }
      })();
      return result;
    },
  };
}
