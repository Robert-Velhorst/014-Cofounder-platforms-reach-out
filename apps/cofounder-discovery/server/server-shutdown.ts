import type { Server } from "node:http";

/** Stop admission before draining users of shared resources. The caller exits
 * nonzero on false; a timed-out job keeps its durable lease for later recovery. */
export function createServerShutdown({
  server,
  stopWorker,
  stopUpgradedConnections = async () => {},
  closeResources,
  timeoutMs = 25_000,
}: {
  server: Server;
  stopWorker: () => Promise<void>;
  stopUpgradedConnections?: () => Promise<void>;
  closeResources: () => Promise<void>;
  timeoutMs?: number;
}) {
  let stopping: Promise<boolean> | undefined;
  let started = false;

  return {
    get started() {
      return started;
    },
    shutdown(): Promise<boolean> {
      if (stopping) return stopping;
      started = true;
      let expired = false;
      let deadline: ReturnType<typeof setTimeout>;
      const timeout = new Promise<boolean>(resolve => {
        // Keep the process alive until either cleanup or the deadline completes.
        deadline = setTimeout(() => {
          expired = true;
          server.closeAllConnections();
          resolve(false);
        }, timeoutMs);
      });
      const httpClosed = new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      });
      const drained = (async () => {
        const results = await Promise.allSettled([
          httpClosed,
          Promise.resolve().then(stopUpgradedConnections),
          Promise.resolve().then(stopWorker),
        ]);
        if (expired || results.some(result => result.status === "rejected"))
          return false;
        try {
          await closeResources();
          return !expired;
        } catch {
          // Do not surface database URLs, addresses or provider payloads.
          return false;
        }
      })();
      stopping = Promise.race([drained, timeout]).finally(() =>
        clearTimeout(deadline)
      );
      return stopping;
    },
  };
}
