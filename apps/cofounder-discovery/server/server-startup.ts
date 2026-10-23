import type { Server } from "node:http";

/** Do not start workers or announce readiness before the socket is listening. */
export function listenForStartup(server: Server, port: number, host: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      server.off("error", failed);
      server.off("listening", ready);
    };
    const failed = (error: unknown) => {
      cleanup();
      reject(error);
    };
    const ready = () => {
      cleanup();
      resolve();
    };
    server.once("error", failed);
    server.once("listening", ready);
    try {
      server.listen(port, host);
    } catch (error) {
      failed(error);
    }
  });
}

// Startup failures can contain configuration values, file paths or database
// credentials. Never inspect/stringify their messages, causes or custom fields.
export function reportStartupFailure() {
  console.error(JSON.stringify({ level: "fatal", event: "startup_failed" }));
}
