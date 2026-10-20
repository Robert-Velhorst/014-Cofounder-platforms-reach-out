import express from "express";
import { createServer } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { haiFeedHandler } from "./hai-connector";
import { resetConfigForTests } from "./config";
import {
  consumeRateLimit,
  LOCAL_RATE_MAX_BUCKETS,
  resetRateLimitsForTests,
} from "./rate-limit";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_MODE", "test");
  vi.stubEnv(
    "HAI_CONNECTOR_TOKEN",
    "synthetic-hai-traffic-test-token-longer-than-32"
  );
  vi.stubEnv("HAI_CONNECTOR_TOKEN_FILE", undefined);
  vi.stubEnv("HAI_CONNECTOR_USER_ID", "1");
  resetConfigForTests();
  resetRateLimitsForTests();
});
afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigForTests();
  resetRateLimitsForTests();
});

async function fixture() {
  const app = express();
  app.get("/feed", haiFeedHandler);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture_port");
  return {
    request: () =>
      fetch(`http://127.0.0.1:${address.port}/feed`, {
        signal: AbortSignal.timeout(3000),
      }),
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    },
  };
}

describe("HAI HTTP traffic rejection without provider or DB access", () => {
  it("rejects the 61st unauthenticated attempt with 429 and a bounded retry header", async () => {
    const f = await fixture();
    try {
      for (let attempt = 0; attempt < 60; attempt++)
        expect((await f.request()).status).toBe(401);
      const response = await f.request();
      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: "rate_limited" });
      expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
      expect(Number(response.headers.get("retry-after"))).toBeLessThanOrEqual(
        60
      );
    } finally {
      await f.close();
    }
  });

  it("fails new feed clients closed with 503 when the shared guard is full", async () => {
    const f = await fixture();
    try {
      for (let index = 0; index < LOCAL_RATE_MAX_BUCKETS; index++)
        consumeRateLimit(`synthetic:${index}`, { limit: 1, windowMs: 60_000 });
      const response = await f.request();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "traffic_guard_busy" });
      expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    } finally {
      await f.close();
    }
  });
});
