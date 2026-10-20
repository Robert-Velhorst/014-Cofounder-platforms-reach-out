import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listenForStartup, reportStartupFailure } from "./server-startup";

const servers: Server[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => {
          server.closeAllConnections();
          server.close(() => resolve());
        })
    )
  );
});

const fixture = () => {
  const server = createServer((_req, res) => res.end("synthetic"));
  servers.push(server);
  return server;
};

describe("bounded private server startup", () => {
  it("resolves only once the actual loopback socket accepts HTTP", async () => {
    const server = fixture();
    const errorsBefore = server.listenerCount("error");
    const listeningBefore = server.listenerCount("listening");
    await listenForStartup(server, 0, "127.0.0.1");
    expect(server.listening).toBe(true);
    expect(server.listenerCount("error")).toBe(errorsBefore);
    expect(server.listenerCount("listening")).toBe(listeningBefore);
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_address");
    expect(await (await fetch(`http://127.0.0.1:${address.port}`)).text()).toBe(
      "synthetic"
    );
  });

  it("rejects a real occupied port without unhandled socket errors or false readiness", async () => {
    const owner = fixture();
    await listenForStartup(owner, 0, "127.0.0.1");
    const address = owner.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_address");
    const contender = fixture();
    const before = contender.listeners("listening");
    await expect(
      listenForStartup(contender, address.port, "127.0.0.1")
    ).rejects.toMatchObject({ code: "EADDRINUSE" });
    expect(contender.listening).toBe(false);
    expect(contender.listenerCount("error")).toBe(0);
    expect(contender.listeners("listening")).toEqual(before);
    expect(owner.listening).toBe(true);
  });

  it("removes temporary listeners when listen throws synchronously", async () => {
    const server = fixture();
    const error = new Error("synthetic-private-connection-url");
    const before = server.listeners("listening");
    vi.spyOn(server, "listen").mockImplementation(() => {
      throw error;
    });
    await expect(listenForStartup(server, 3000, "127.0.0.1")).rejects.toBe(
      error
    );
    expect(server.listenerCount("error")).toBe(0);
    expect(server.listeners("listening")).toEqual(before);
  });

  it("emits only a fixed fatal record, with no exception or configuration fields", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    reportStartupFailure();
    expect(log.mock.calls).toEqual([
      [JSON.stringify({ level: "fatal", event: "startup_failed" })],
    ]);
  });
});
