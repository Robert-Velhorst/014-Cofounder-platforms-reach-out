import express from "express";
import {
  createServer,
  request,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { once } from "node:events";
import { initTRPC, TRPCError } from "@trpc/server";
import { expect, it, vi } from "vitest";
import { createBoundedTrpcMiddleware } from "./trpc-transport";
import { EXPORT_RESPONSE_DEADLINE_MS } from "./export-response-budget";

it("holds unfinished exports until socket close and releases finished responses", async () => {
  const t = initTRPC.create();
  const context = vi.fn(() => ({}));
  const generate = vi.fn(() => "x".repeat(19 * 1024 * 1024));
  const responses: ServerResponse[] = [];
  const app = express();
  app.use(express.json());
  app.use((_req, res, next) => {
    responses.push(res);
    next();
  });
  app.use(
    "/api/trpc",
    createBoundedTrpcMiddleware({
      router: t.router({
        accountData: t.router({ export: t.procedure.mutation(generate) }),
      }),
      createContext: context,
    })
  );
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("fixture_address");
  const origin = `http://127.0.0.1:${address.port}`;
  const held: IncomingMessage[] = [];
  async function paused() {
    return await new Promise<IncomingMessage>((resolve, reject) => {
      const client = request(
        origin + "/api/trpc/accountData.export",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
        },
        response => {
          response.on("error", () => {});
          response.pause();
          held.push(response);
          resolve(response);
        }
      );
      client.on("error", reject);
      client.end("{}");
    });
  }
  try {
    const first = await paused(),
      second = await paused();
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(generate).toHaveBeenCalledTimes(2);
    const refused = await fetch(origin + "/api/trpc/accountData.export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    // Windows loopback can flush the entire file into kernel buffering despite
    // the paused reader. That is finish-path acceptance, not slow-write evidence.
    // Linux's bounded TCP buffers exercise the unfinished-response branch.
    if (responses[0].writableFinished || responses[1].writableFinished) {
      expect(refused.status).toBe(200);
      await refused.text();
      expect(generate).toHaveBeenCalledTimes(3);
      return;
    }
    expect(refused.status).toBe(429);
    expect(await refused.text()).toContain("Account export downloads are busy");
    expect(context).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenCalledTimes(2);
    const closed = Promise.all(
      responses.slice(0, 2).map(response => once(response, "close"))
    );
    first.destroy();
    second.destroy();
    // Observe socket closure, not an arbitrary delay, before proving re-admission.
    await closed;
    const recovery = await paused();
    expect(recovery.statusCode).toBe(200);
    expect(generate).toHaveBeenCalledTimes(3);
  } finally {
    for (const response of held) response.destroy();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  }
});

it("counts each batched export before context and releases capacity on error responses", async () => {
  const t = initTRPC.create();
  const context = vi.fn(() => ({}));
  const generate = vi.fn(() => {
    throw new TRPCError({ code: "FORBIDDEN", message: "synthetic-denial" });
  });
  const app = express();
  app.use(express.json());
  app.use(
    "/api/trpc",
    createBoundedTrpcMiddleware({
      router: t.router({
        accountData: t.router({ export: t.procedure.mutation(generate) }),
        read: t.procedure.query(() => "ordinary-read"),
      }),
      createContext: context,
    })
  );
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("fixture_address");
  const origin = `http://127.0.0.1:${address.port}/api/trpc/`;
  try {
    const excessive = await fetch(
      origin + Array(3).fill("accountData.export").join(",") + "?batch=1",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"0":{},"1":{},"2":{}}',
      }
    );
    expect(excessive.status).toBe(429);
    expect(await excessive.text()).toContain(
      "Account export downloads are busy"
    );
    expect(context).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    for (let count = 0; count < 3; count++) {
      const denied = await fetch(
        origin + "accountData.export,accountData.export?batch=1",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: '{"0":{},"1":{}}',
        }
      );
      expect(denied.status).toBe(403);
      expect(await denied.text()).toContain("synthetic-denial");
    }
    expect(context).toHaveBeenCalledTimes(3);
    expect(generate).toHaveBeenCalledTimes(6);
    const ordinary = await fetch(origin + "read");
    expect(ordinary.status).toBe(200);
    expect(await ordinary.text()).toContain("ordinary-read");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  }
});

it("the scheduled deadline closes a real HTTP response and permits a later export", async () => {
  const t = initTRPC.create();
  const timers = vi.spyOn(globalThis, "setTimeout");
  const app = express();
  const responses: ServerResponse[] = [];
  const held: IncomingMessage[] = [];
  app.use(express.json());
  app.use((_req, res, next) => {
    responses.push(res);
    next();
  });
  app.use(
    "/api/trpc",
    createBoundedTrpcMiddleware({
      router: t.router({
        accountData: t.router({
          export: t.procedure.mutation(() => "x".repeat(19 * 1024 * 1024)),
        }),
      }),
    })
  );
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("fixture_address");
  const origin = `http://127.0.0.1:${address.port}`;
  async function paused() {
    return await new Promise<IncomingMessage>((resolve, reject) => {
      const client = request(
        origin + "/api/trpc/accountData.export",
        { method: "POST", headers: { "content-type": "application/json" } },
        response => {
          response.on("error", () => {});
          response.pause();
          held.push(response);
          resolve(response);
        }
      );
      client.on("error", reject);
      client.end("{}");
    });
  }
  try {
    expect((await paused()).statusCode).toBe(200);
    const scheduled = timers.mock.calls.find(
      ([, delay]) => delay === EXPORT_RESPONSE_DEADLINE_MS
    );
    expect(scheduled).toBeDefined();
    // Run the real scheduled callback without a ten-minute wall-clock wait.
    // Fake-clock unit tests separately verify when it is scheduled and cleared.
    if (!responses[0].writableFinished) {
      const closed = once(responses[0], "close");
      (scheduled![0] as () => void)();
      await closed;
      expect(responses[0].destroyed).toBe(true);
    }
    expect((await paused()).statusCode).toBe(200);
  } finally {
    for (const response of held) response.destroy();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
    timers.mockRestore();
  }
});
