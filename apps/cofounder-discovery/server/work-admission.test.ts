import { describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { initTRPC } from "@trpc/server";
import { createBoundedTrpcMiddleware } from "./trpc-transport";
import { createWorkTracker } from "./server-work";
import { getConfig } from "./config";

function deferred() {
  let release!: () => void;
  return {
    promise: new Promise<void>(resolve => {
      release = resolve;
    }),
    release: () => release(),
  };
}

describe("bounded active application work", () => {
  it("keeps disconnected HTTP work counted until it settles and returns a real 503", async () => {
    const tracker = createWorkTracker(() => 1);
    const gate = deferred();
    const entered = deferred();
    let settled = 0;
    const t = initTRPC.create();
    const api = t.router({
      slow: t.procedure
        .use(({ next }) => tracker.run(next))
        .query(async () => {
          entered.release();
          await gate.promise;
          settled++;
          return "complete";
        }),
    });
    const app = express();
    app.use("/api/trpc", createBoundedTrpcMiddleware({ router: api }));
    const server = createServer(app);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_address");
    const url = `http://127.0.0.1:${address.port}/api/trpc/slow`;
    const controller = new AbortController();
    const disconnected = fetch(url, { signal: controller.signal }).catch(
      error => error
    );
    try {
      await entered.promise;
      controller.abort();
      expect(await disconnected).toMatchObject({ name: "AbortError" });
      const busy = await fetch(url);
      expect(busy.status).toBe(503);
      expect(await busy.text()).toContain("Server is busy");
      expect(settled).toBe(0);
      gate.release();
      await vi.waitFor(() => expect(settled).toBe(1));
      const later = await fetch(url);
      expect(later.status).toBe(200);
      expect(settled).toBe(2);
    } finally {
      controller.abort();
      gate.release();
      await disconnected;
      await tracker.stop();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      );
    }
  });
  it("rejects excess work before invoking it and admits again after settlement", async () => {
    const tracker = createWorkTracker(() => 2);
    const gate = deferred();
    let count = 0;
    const operation = async () => {
      count++;
      await gate.promise;
      return "settled";
    };
    const admitted = [tracker.run(operation), tracker.run(operation)];
    const excess = tracker.run(operation);
    // Attach immediately so a correct rejection is not an unhandled promise.
    const outcome = excess.then(
      () => "accepted",
      error => error
    );
    try {
      await new Promise(resolve => setImmediate(resolve));
      expect(count).toBe(2);
      expect(await outcome).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    } finally {
      gate.release();
      await Promise.all(admitted);
      await outcome;
    }
    expect(await tracker.run(() => "later")).toBe("later");
  });

  it("releases slots on synchronous and asynchronous failures", async () => {
    const tracker = createWorkTracker(() => 1);
    await expect(
      tracker.run(() => {
        throw new Error("synthetic_sync");
      })
    ).rejects.toThrow("synthetic_sync");
    await expect(
      tracker.run(async () => {
        throw new Error("synthetic_async");
      })
    ).rejects.toThrow("synthetic_async");
    expect(await tracker.run(() => true)).toBe(true);
  });

  it("does not queue or free unfinished work when limits decrease or shutdown starts", async () => {
    let limit = 2;
    const tracker = createWorkTracker(() => limit);
    const first = deferred();
    const second = deferred();
    const jobs = [
      tracker.run(() => first.promise),
      tracker.run(() => second.promise),
    ];
    limit = 1;
    try {
      await expect(tracker.run(() => "late")).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      first.release();
      await jobs[0];
      await expect(tracker.run(() => "late")).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
      let stopped = false;
      const stopping = tracker.stop().then(() => {
        stopped = true;
      });
      await Promise.resolve();
      expect(stopped).toBe(false);
      second.release();
      await jobs[1];
      await stopping;
      await expect(tracker.run(() => "late")).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
      });
    } finally {
      first.release();
      second.release();
      await Promise.all(jobs);
    }
  });

  it("zero pauses admission and invalid runtime limits fail closed", async () => {
    for (const limit of [0, -1, NaN, Infinity, 1.5, 1025]) {
      const tracker = createWorkTracker(() => limit);
      let invoked = false;
      await expect(
        tracker.run(() => {
          invoked = true;
        })
      ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
      expect(invoked).toBe(false);
    }
  });

  it("validates an explicit bounded configuration rather than silently disabling it", () => {
    expect(getConfig({ NODE_ENV: "test" }).API_MAX_ACTIVE_WORK).toBe(32);
    expect(
      getConfig({ NODE_ENV: "test", API_MAX_ACTIVE_WORK: "0" })
        .API_MAX_ACTIVE_WORK
    ).toBe(0);
    expect(
      getConfig({ NODE_ENV: "test", API_MAX_ACTIVE_WORK: "1024" })
        .API_MAX_ACTIVE_WORK
    ).toBe(1024);
    for (const value of ["", "-1", "1.5", "Infinity", "1025", "NaN"]) {
      expect(() =>
        getConfig({ NODE_ENV: "test", API_MAX_ACTIVE_WORK: value })
      ).toThrow(/Invalid runtime configuration/);
    }
  });
});
