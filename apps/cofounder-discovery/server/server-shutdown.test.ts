import { createServer, get, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

const servers: Server[] = [];
afterEach(async () => {
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

async function startServer(onRequest: Parameters<typeof createServer>[0]) {
  const server = createServer(onRequest);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("fixture_address");
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function factory() {
  const path = "./server-shutdown";
  const module = await import(path).catch(() => null);
  expect(typeof module?.createServerShutdown).toBe("function");
  return module!.createServerShutdown;
}

describe("server shutdown resource ordering", () => {
  it("stops admission immediately, drains HTTP and mail, then closes storage once", async () => {
    const create = await factory();
    const entered = deferred();
    const responseGate = deferred();
    const mailGate = deferred();
    const events: string[] = [];
    const { server, url } = await startServer(async (_req, res) => {
      entered.resolve();
      await responseGate.promise;
      res.end("request committed");
    });
    const request = fetch(url).then(response => response.text());
    await entered.promise;
    const lifecycle = create({
      server,
      stopWorker: async () => {
        events.push("mail stopping");
        await mailGate.promise;
        events.push("mail drained");
      },
      closeResources: async () => {
        events.push("storage closed");
      },
    });
    expect(lifecycle.started).toBe(false);
    const stopped = lifecycle.shutdown();
    expect(lifecycle.shutdown()).toBe(stopped);
    expect(lifecycle.started).toBe(true);
    expect(server.listening).toBe(false);
    await new Promise(resolve => setImmediate(resolve));
    expect(events).toEqual(["mail stopping"]);
    responseGate.resolve();
    expect(await request).toBe("request committed");
    expect(events).not.toContain("storage closed");
    mailGate.resolve();
    expect(await stopped).toBe(true);
    expect(events).toEqual(["mail stopping", "mail drained", "storage closed"]);
  });

  it("waits for an active HTTP request even when the mail worker has already stopped", async () => {
    const create = await factory();
    const entered = deferred();
    const responseGate = deferred();
    let closed = false;
    const { server, url } = await startServer(async (_req, res) => {
      entered.resolve();
      await responseGate.promise;
      res.end("saved");
    });
    const request = fetch(url).then(response => response.text());
    await entered.promise;
    const lifecycle = create({
      server,
      stopWorker: async () => {},
      closeResources: async () => {
        closed = true;
      },
    });
    const stopped = lifecycle.shutdown();
    await new Promise(resolve => setImmediate(resolve));
    expect(closed).toBe(false);
    responseGate.resolve();
    expect(await request).toBe("saved");
    expect(await stopped).toBe(true);
    expect(closed).toBe(true);
  });

  it("bounds a stuck worker without closing storage underneath it", async () => {
    const create = await factory();
    const entered = deferred();
    const { server, url } = await startServer(() => {
      entered.resolve();
    });
    // The deliberately incomplete response must be disconnected at the deadline.
    const disconnected = new Promise<string>(resolve => {
      get(url, { agent: false }, () => resolve("unexpected response")).on(
        "error",
        () => resolve("disconnected")
      );
    });
    await entered.promise;
    let closed = false;
    const lifecycle = create({
      server,
      stopWorker: () => new Promise(() => {}),
      closeResources: async () => {
        closed = true;
      },
      timeoutMs: 40,
    });
    expect(await lifecycle.shutdown()).toBe(false);
    expect(await disconnected).toBe("disconnected");
    expect(closed).toBe(false);
  });

  it("reports resource close failure without leaking its exception", async () => {
    const create = await factory();
    const { server } = await startServer((_req, res) => res.end());
    const lifecycle = create({
      server,
      stopWorker: async () => {},
      closeResources: async () => {
        throw new Error("private connection string");
      },
    });
    expect(await lifecycle.shutdown()).toBe(false);
  });

  it("does not close storage if worker draining fails", async () => {
    const create = await factory();
    const { server } = await startServer((_req, res) => res.end());
    let closed = false;
    const lifecycle = create({
      server,
      stopWorker: async () => {
        throw new Error("private worker details");
      },
      closeResources: async () => {
        closed = true;
      },
    });
    expect(await lifecycle.shutdown()).toBe(false);
    expect(closed).toBe(false);
  });

  it("drains backend work after its client has disconnected and rejects new work", async () => {
    const create = await factory();
    const path = "./server-work";
    const module = await import(path).catch(() => null);
    expect(typeof module?.createWorkTracker).toBe("function");
    const work = module.createWorkTracker();
    const entered = deferred();
    const finish = deferred();
    let committed = false;
    let closed = false;
    const { server, url } = await startServer((_req, res) => {
      void work.run(async () => {
        entered.resolve();
        await finish.promise;
        committed = true;
        res.end("committed");
      });
    });
    const request = get(url, { agent: false });
    request.on("error", () => {});
    await entered.promise;
    request.destroy();
    const lifecycle = create({
      server,
      stopWorker: () => work.stop(),
      closeResources: async () => {
        closed = true;
      },
    });
    const stopped = lifecycle.shutdown();
    await new Promise(resolve => setImmediate(resolve));
    expect(closed).toBe(false);
    await expect(work.run(async () => "must not run")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    finish.resolve();
    expect(await stopped).toBe(true);
    expect(committed).toBe(true);
    expect(closed).toBe(true);
  });

  it("handles a failed development-connection close without abandoning active work", async () => {
    const create = await factory();
    const finish = deferred();
    const { server } = await startServer((_req, res) => res.end());
    let closed = false;
    let completed = false;
    const lifecycle = create({
      server,
      stopUpgradedConnections: async () => {
        throw new Error("private HMR details");
      },
      stopWorker: () => finish.promise,
      closeResources: async () => {
        closed = true;
      },
    });
    const stopped = lifecycle.shutdown().then((result: boolean) => {
      completed = true;
      return result;
    });
    await new Promise(resolve => setImmediate(resolve));
    expect(completed).toBe(false);
    finish.resolve();
    expect(await stopped).toBe(false);
    expect(closed).toBe(false);
  });
});
