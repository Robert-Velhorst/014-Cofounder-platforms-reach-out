import express from "express";
import { createServer } from "node:http";
import { initTRPC, TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertLocalRateLimit,
  createLocalRateLimiter,
  LOCAL_RATE_MAX_BUCKETS,
  trafficRetryHeaders,
  LocalRateLimitError,
} from "./rate-limit";
import { createBoundedTrpcMiddleware } from "./trpc-transport";

afterEach(() => vi.useRealTimers());
describe("bounded process-local traffic guard", () => {
  it("bounds both buckets and expiry records without evicting active client quotas", () => {
    const limiter = createLocalRateLimiter();
    for (let index = 0; index < LOCAL_RATE_MAX_BUCKETS + 2000; index++) {
      const result = limiter.consume(
        `client:${index}`,
        { limit: 2, windowMs: 1000 },
        0
      );
      expect(result.allowed).toBe(index < LOCAL_RATE_MAX_BUCKETS);
    }
    expect(limiter.stats()).toEqual({
      buckets: LOCAL_RATE_MAX_BUCKETS,
      expirations: LOCAL_RATE_MAX_BUCKETS,
    });
    expect(
      limiter.consume("client:0", { limit: 2, windowMs: 1000 }, 1).allowed
    ).toBe(true);
    expect(
      limiter.consume("client:0", { limit: 2, windowMs: 1000 }, 2)
    ).toMatchObject({ allowed: false, reason: "quota" });
    expect(
      limiter.consume("extra", { limit: 2, windowMs: 1000 }, 3)
    ).toMatchObject({ allowed: false, reason: "capacity", retryAfterMs: 997 });
  });

  it("expires every key, not just a key that happens to return", () => {
    const limiter = createLocalRateLimiter(3);
    limiter.consume("long", { limit: 1, windowMs: 300 }, 0);
    limiter.consume("short", { limit: 1, windowMs: 100 }, 0);
    limiter.consume("middle", { limit: 1, windowMs: 200 }, 0);
    expect(
      limiter.consume("new", { limit: 1, windowMs: 200 }, 100).allowed
    ).toBe(true);
    expect(limiter.stats().buckets).toBe(3);
    limiter.sweep(300);
    expect(limiter.stats()).toEqual({ buckets: 0, expirations: 0 });
  });

  it("cleans idle records on an unreferenced, idempotent timer and stops it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const limiter = createLocalRateLimiter();
    limiter.consume("idle", { limit: 1, windowMs: 1000 });
    const worker = limiter.startCleanup();
    limiter.startCleanup();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(60_000);
    expect(limiter.stats()).toEqual({ buckets: 0, expirations: 0 });
    worker.stop();
    worker.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps exactly one expiry record per client across repeated attempts and clear", () => {
    const limiter = createLocalRateLimiter(2);
    for (let index = 0; index < 1000; index++)
      limiter.consume("same", { limit: 10, windowMs: 1000 }, 0);
    expect(limiter.stats()).toEqual({ buckets: 1, expirations: 1 });
    limiter.clear();
    expect(limiter.stats()).toEqual({ buckets: 0, expirations: 0 });
    expect(
      limiter.consume("same", { limit: 1, windowMs: 1000 }, 0).allowed
    ).toBe(true);
  });

  it("matches a reference model across mixed windows, expiration orders and capacity pressure", () => {
    const limiter = createLocalRateLimiter(17);
    const reference = new Map<string, { count: number; resetAt: number }>();
    let seed = 714;
    for (let now = 0; now < 3000; now++) {
      seed = (seed * 48271) % 2147483647;
      const key = `client:${seed % 40}`,
        windowMs = 1 + (seed % 50),
        limit = 1 + (seed % 3);
      for (const [id, entry] of reference)
        if (entry.resetAt <= now) reference.delete(id);
      const current = reference.get(key);
      const expected = current ? current.count < limit : reference.size < 17;
      if (expected) {
        if (current) current.count++;
        else reference.set(key, { count: 1, resetAt: now + windowMs });
      }
      expect(limiter.consume(key, { limit, windowMs }, now).allowed).toBe(
        expected
      );
      expect(limiter.stats()).toEqual({
        buckets: reference.size,
        expirations: reference.size,
      });
    }
  });

  it("rejects zero allowance without allocating a record", () => {
    const limiter = createLocalRateLimiter();
    expect(
      limiter.consume("client", { limit: 0, windowMs: 1000 }, 0)
    ).toMatchObject({ allowed: false, reason: "quota" });
    expect(limiter.stats().buckets).toBe(0);
  });

  it("rejects invalid capacities, keys, windows, limits and clocks without echoing identifiers", () => {
    for (const size of [0, -1, NaN, Infinity, 1.5, 100001])
      expect(() => createLocalRateLimiter(size)).toThrow(
        "Invalid local rate-limit capacity"
      );
    const limiter = createLocalRateLimiter();
    const invalid = [
      ["", 1, 1000, 0],
      ["private".repeat(100), 1, 1000, 0],
      ["private", -1, 1000, 0],
      ["private", NaN, 1000, 0],
      ["private", 1, 0, 0],
      ["private", 1, 86_400_001, 0],
      ["private", 1, 1000, -1],
      ["private", 1, 1000, Infinity],
    ] as const;
    for (const [key, limit, windowMs, now] of invalid)
      expect(() => limiter.consume(key, { limit, windowMs }, now)).toThrow(
        "Invalid local rate-limit request"
      );
    expect(limiter.stats().buckets).toBe(0);
  });

  it("aggregates meaningful retry delay without masking other service-unavailable errors", () => {
    const limited = new LocalRateLimitError(
      { allowed: false, remaining: 0, retryAfterMs: 1501, reason: "quota" },
      "Wait"
    );
    expect(limited.code).toBe("TOO_MANY_REQUESTS");
    expect(
      trafficRetryHeaders([
        limited,
        new TRPCError({ code: "SERVICE_UNAVAILABLE" }),
      ])
    ).toEqual({ "retry-after": "2" });
    expect(
      trafficRetryHeaders([new TRPCError({ code: "SERVICE_UNAVAILABLE" })])
    ).toEqual({ "retry-after": "1" });
    expect(trafficRetryHeaders([])).toEqual({});
  });

  it("emits real HTTP 429 for a client quota and 503 for guard capacity, with Retry-After", async () => {
    const limiter = createLocalRateLimiter(1);
    const t = initTRPC.create();
    const api = t.router({
      probe: t.procedure
        .input((value: unknown) => String(value))
        .query(({ input }) => {
          assertLocalRateLimit(
            limiter.consume(input, { limit: 1, windowMs: 2000 }, 0),
            "Please wait"
          );
          return "accepted";
        }),
    });
    const app = express();
    app.use(
      "/api/trpc",
      createBoundedTrpcMiddleware({
        router: api,
        createContext: () => ({}),
        responseMeta: ({ errors }) => ({
          headers: trafficRetryHeaders(errors),
        }),
      })
    );
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_port");
    try {
      const request = (key: string) =>
        fetch(
          `http://127.0.0.1:${address.port}/api/trpc/probe?input=${encodeURIComponent(JSON.stringify(key))}`
        );
      expect((await request("same")).status).toBe(200);
      const quota = await request("same");
      expect(quota.status).toBe(429);
      expect(quota.headers.get("retry-after")).toBe("2");
      const busy = await request("other");
      expect(busy.status).toBe(503);
      expect(busy.headers.get("retry-after")).toBe("2");
      expect(await busy.text()).not.toContain("other");
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
