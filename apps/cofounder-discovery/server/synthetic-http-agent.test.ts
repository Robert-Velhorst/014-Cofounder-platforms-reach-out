import { createServer, request } from "node:http";
import type { Socket, AddressInfo } from "node:net";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { createSyntheticHttpAgent } from "../scripts/synthetic-http-agent";

describe("synthetic HTTP pool expiry", () => {
  it("keeps one independent connection per actor without automatic retries", () => {
    const first = createSyntheticHttpAgent("127.0.0.1");
    const second = createSyntheticHttpAgent("127.0.0.1");
    try {
      expect(first).not.toBe(second);
      expect(first.keepAlive).toBe(true);
      expect(first.maxSockets).toBe(1);
      expect(first.options.localAddress).toBe("127.0.0.1");
    } finally {
      first.destroy();
      second.destroy();
    }
  });

  it("expires pooled sockets before the actual server's advertised timeout", async () => {
    const server = createServer((_req, res) => res.end("synthetic-only"));
    server.keepAliveTimeout = 5000;
    const agent = createSyntheticHttpAgent("127.0.0.1");
    try {
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const port = (server.address() as AddressInfo).port;
      const freed = once(agent, "free");
      let hint: string | undefined;
      await new Promise<void>((resolve, reject) => {
        const req = request({ hostname: "127.0.0.1", port, agent }, res => {
          hint = res.headers["keep-alive"];
          res.resume();
          res.on("end", resolve);
          res.on("error", reject);
        });
        req.setTimeout(10_000, () =>
          req.destroy(new Error("synthetic timeout"))
        );
        req.on("error", reject);
        req.end();
      });
      const [socket] = (await freed) as [Socket];
      expect(hint).toBe("timeout=5");
      expect(socket.timeout).toBeGreaterThan(0);
      expect(socket.timeout).toBeLessThan(5000);
    } finally {
      agent.destroy();
      server.closeAllConnections();
      if (server.listening)
        await new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve()))
        );
    }
  });
});
