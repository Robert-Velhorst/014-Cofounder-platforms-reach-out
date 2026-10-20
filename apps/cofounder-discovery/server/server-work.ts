import { TRPCError } from "@trpc/server";
import { getConfig } from "./config";

/** Track application work, not socket lifetime: disconnected clients can leave
 * a mutation running. Stopping also fences work that has not yet begun. */
export function createWorkTracker(limit: () => number = () => 32) {
  let accepting = true;
  const active = new Set<Promise<unknown>>();
  return {
    async run<T>(operation: () => T | Promise<T>): Promise<T> {
      if (!accepting) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Server is restarting. Please try again shortly.",
        });
      }
      const maximum = limit();
      if (
        !Number.isInteger(maximum) ||
        maximum < 0 ||
        maximum > 1024 ||
        active.size >= maximum
      ) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Server is busy. Please try again shortly.",
        });
      }
      // Reserve synchronously, before invoking work. Hold through settlement,
      // even if its client disconnects; no unbounded waiting queue or cancellation.
      const task = Promise.resolve().then(operation);
      active.add(task);
      try {
        return await task;
      } finally {
        active.delete(task);
      }
    },
    async stop() {
      accepting = false;
      await Promise.allSettled(Array.from(active));
    },
  };
}

export const applicationWork = createWorkTracker(
  () => getConfig().API_MAX_ACTIVE_WORK
);
