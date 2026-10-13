import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { initTRPC } from "@trpc/server";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { describe, expect, it, vi } from "vitest";
import { createBoundedTrpcMiddleware } from "./trpc-transport";
import { TRPC_MAX_BATCH_ITEMS } from "../shared/trpc-transport";

describe("real HTTP tRPC batch admission", () => {
  async function fixture(maxBatchSize?: number) {
    const t = initTRPC.create();
    const context = vi.fn(() => ({}));
    const resolved = vi.fn(() => "accepted");
    const api = t.router({
      read: t.procedure.query(resolved),
      write: t.procedure.mutation(resolved),
    });
    const app = express();
    app.use(express.json({ limit: "1mb" }));
    app.use(
      "/api/trpc",
      createBoundedTrpcMiddleware({
        router: api,
        createContext: context,
        maxBatchSize,
      })
    );
    const server = createServer(app);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_address");
    return {
      api,
      context,
      resolved,
      url: `http://127.0.0.1:${address.port}/api/trpc`,
      async close() {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve()))
        );
      },
    };
  }

  it.each(["GET", "POST"])(
    "rejects oversized %s batches before context or procedures run",
    async method => {
      const f = await fixture();
      try {
        const path = Array(TRPC_MAX_BATCH_ITEMS + 1)
          .fill(method === "GET" ? "read" : "write")
          .join(",");
        const response = await fetch(`${f.url}/${path}?batch=1`, {
          method,
          ...(method === "POST"
            ? { headers: { "content-type": "application/json" }, body: "{}" }
            : {}),
        });
        expect(response.status).toBe(400);
        expect(await response.text()).toContain(
          "Batch call exceeds maximum size"
        );
        expect(f.context).not.toHaveBeenCalled();
        expect(f.resolved).not.toHaveBeenCalled();
      } finally {
        await f.close();
      }
    }
  );

  it("does not allow caller options to remove the ceiling or mutate their object", async () => {
    const f = await fixture(Infinity);
    try {
      const response = await fetch(
        `${f.url}/${Array(TRPC_MAX_BATCH_ITEMS + 1)
          .fill("read")
          .join(",")}?batch=1`
      );
      expect(response.status).toBe(400);
      expect(f.context).not.toHaveBeenCalled();
    } finally {
      await f.close();
    }
    const t = initTRPC.create();
    const options = { router: t.router({}), maxBatchSize: Infinity };
    createBoundedTrpcMiddleware(options);
    expect(options.maxBatchSize).toBe(Infinity);
  });

  it("accepts the exact limit with one context and no dropped operations", async () => {
    const f = await fixture();
    try {
      const response = await fetch(
        `${f.url}/${Array(TRPC_MAX_BATCH_ITEMS).fill("read").join(",")}?batch=1`
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toHaveLength(TRPC_MAX_BATCH_ITEMS);
      expect(f.context).toHaveBeenCalledTimes(1);
      expect(f.resolved).toHaveBeenCalledTimes(TRPC_MAX_BATCH_ITEMS);
    } finally {
      await f.close();
    }
  });

  it.each(["query", "mutate"] as const)(
    "splits a larger client %s burst without losing work",
    async action => {
      const f = await fixture();
      const sizes: number[] = [];
      try {
        const client = createTRPCClient<typeof f.api>({
          links: [
            httpBatchLink({
              url: f.url,
              maxItems: TRPC_MAX_BATCH_ITEMS,
              fetch(input, init) {
                sizes.push(
                  new URL(String(input)).pathname.split("/").at(-1)!.split(",")
                    .length
                );
                return fetch(input, init);
              },
            }),
          ],
        });
        const total = TRPC_MAX_BATCH_ITEMS * 2 + 5;
        const values = await Promise.all(
          Array.from({ length: total }, () =>
            action === "query" ? client.read.query() : client.write.mutate()
          )
        );
        expect(values).toEqual(Array(total).fill("accepted"));
        expect(sizes).toEqual([TRPC_MAX_BATCH_ITEMS, TRPC_MAX_BATCH_ITEMS, 5]);
        expect(f.resolved).toHaveBeenCalledTimes(total);
      } finally {
        await f.close();
      }
    }
  );
});
