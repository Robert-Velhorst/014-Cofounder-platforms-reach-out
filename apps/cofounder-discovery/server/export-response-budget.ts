import { TRPCError } from "@trpc/server";

export const EXPORT_RESPONSE_DEADLINE_MS = 10 * 60 * 1000;
type Response = {
  destroyed: boolean;
  writableEnded: boolean;
  once(event: "finish" | "close", listener: () => void): unknown;
  removeListener(event: "finish" | "close", listener: () => void): unknown;
  destroy(): unknown;
};

/** Per-process delivery budget, independent of generation and database work. */
export function createExportResponseBudget() {
  let active = 0;
  return {
    reserve(count: number, response: Response) {
      if (!Number.isInteger(count) || count < 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid export response request.",
        });
      if (count > 2 || active + count > 2)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Account export downloads are busy. No export was started. Please try again shortly.",
        });
      if (response.destroyed || response.writableEnded)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The download connection closed. No export was started.",
        });
      active += count;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        active -= count;
        clearTimeout(deadline);
        response.removeListener("finish", release);
        response.removeListener("close", release);
      };
      // Absolute lifetime, not reset by writes/drain. Destroying the response
      // does not cancel or refund admitted DB generation; its semaphore remains.
      const deadline = setTimeout(() => {
        if (released) return;
        try {
          response.destroy();
        } finally {
          release();
        }
      }, EXPORT_RESPONSE_DEADLINE_MS);
      deadline.unref();
      response.once("finish", release);
      response.once("close", release);
    },
  };
}
