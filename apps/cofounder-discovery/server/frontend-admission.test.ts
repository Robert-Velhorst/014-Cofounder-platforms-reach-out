import express from "express";
import { rateLimit } from "express-rate-limit";
import { createServer } from "node:http";
import fs from "node:fs";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFrontendClientAdmission,
  FRONTEND_GLOBAL_RATE_OPTIONS,
  FRONTEND_CLIENT_LIMIT,
  FRONTEND_PROCESS_LIMIT,
} from "./frontend-admission";
import { serveStatic } from "./_core/vite";

const servers: ReturnType<typeof createServer>[] = [];
const directories: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});
async function listen(app: express.Express) {
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture_port");
  return `http://127.0.0.1:${address.port}`;
}
async function fixture(limit = 2, capacity = 2, trustProxy = true) {
  const app = express();
  if (trustProxy) app.set("trust proxy", 1);
  let work = 0;
  app.use(createFrontendClientAdmission(limit, capacity, 1000));
  app.get("/file", (_req, res) => {
    work++;
    res.send("synthetic-file");
  });
  return { origin: await listen(app), work: () => work };
}
async function request(origin: string, address: string) {
  return fetch(origin + "/file?token=private-query-marker", {
    headers: { "x-forwarded-for": address },
    signal: AbortSignal.timeout(5000),
  });
}

describe("frontend file-work admission", () => {
  it("refuses invalid bounds and cannot enlarge the production defaults", () => {
    for (const values of [
      [0, 1, 1],
      [1201, 1, 1],
      [1, 4097, 1],
      [1, 1, 60001],
      [1.5, 1, 1],
      [1, 0, 1],
    ])
      expect(() =>
        createFrontendClientAdmission(...(values as [number, number, number]))
      ).toThrow("invalid_frontend_admission_bounds");
    expect(FRONTEND_CLIENT_LIMIT).toBe(1200);
    expect(FRONTEND_PROCESS_LIMIT).toBe(6000);
    expect(FRONTEND_GLOBAL_RATE_OPTIONS.keyGenerator()).toBe(
      "frontend-process"
    );
    expect(FRONTEND_GLOBAL_RATE_OPTIONS.passOnStoreError).toBe(false);
  });

  it("returns real HTTP 429 before downstream work and without private identifiers", async () => {
    const service = await fixture();
    expect((await request(service.origin, "192.0.2.1")).status).toBe(200);
    expect((await request(service.origin, "192.0.2.1")).status).toBe(200);
    const refused = await request(service.origin, "192.0.2.1");
    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBe("1");
    expect(refused.headers.get("cache-control")).toBe("private, no-store");
    expect(await refused.json()).toEqual({ error: "frontend_rate_limited" });
    expect(service.work()).toBe(2);
    expect((await request(service.origin, "192.0.2.2")).status).toBe(200);
  });

  it("fails closed on bounded-client capacity and reclaims expired entries", async () => {
    const service = await fixture(2, 1);
    expect((await request(service.origin, "192.0.2.1")).status).toBe(200);
    const refused = await request(service.origin, "192.0.2.2");
    expect(refused.status).toBe(503);
    expect(await refused.json()).toEqual({ error: "frontend_admission_busy" });
    expect(service.work()).toBe(1);
    await pause(1050);
    expect((await request(service.origin, "192.0.2.2")).status).toBe(200);
    expect(service.work()).toBe(2);
  });

  it("groups IPv6 /56 addresses and does not trust arbitrary forwarding headers", async () => {
    const trusted = await fixture(1, 2);
    expect(
      (await request(trusted.origin, "2001:db8:abcd:1200::1")).status
    ).toBe(200);
    expect(
      (await request(trusted.origin, "2001:db8:abcd:12ff::2")).status
    ).toBe(429);
    expect(
      (await request(trusted.origin, "2001:db8:abcd:1300::2")).status
    ).toBe(200);
    const direct = await fixture(1, 2, false);
    expect((await request(direct.origin, "192.0.2.1")).status).toBe(200);
    expect((await request(direct.origin, "198.51.100.1")).status).toBe(429);
    expect(direct.work()).toBe(1);
  });

  it("keeps a separate constant-key process ceiling across different clients", async () => {
    const app = express();
    app.set("trust proxy", 1);
    let work = 0;
    app.use(createFrontendClientAdmission());
    app.use(rateLimit({ ...FRONTEND_GLOBAL_RATE_OPTIONS, limit: 2 }));
    app.get("/file", (_req, res) => {
      work++;
      res.send("synthetic-file");
    });
    const origin = await listen(app);
    expect((await request(origin, "192.0.2.1")).status).toBe(200);
    expect((await request(origin, "192.0.2.2")).status).toBe(200);
    const refused = await request(origin, "192.0.2.3");
    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBe("60");
    expect(await refused.json()).toEqual({ error: "frontend_rate_limited" });
    expect(work).toBe(2);
  });

  it("guards real static files and SPA fallback without limiting earlier API routes", async () => {
    const directory = await mkdtemp(
      join(tmpdir(), "cofounder-frontend-admission-")
    );
    directories.push(directory);
    await writeFile(join(directory, "index.html"), "<h1>Synthetic SPA</h1>");
    await writeFile(join(directory, "asset.css"), "body{color:black}");
    const app = express();
    app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
    serveStatic(app, directory);
    const origin = await listen(app);
    const asset = await fetch(origin + "/asset.css");
    expect(asset.status).toBe(200);
    expect(asset.headers.get("cache-control")).toContain("immutable");
    const fallback = await fetch(origin + "/outreach");
    expect(fallback.status).toBe(200);
    expect(fallback.headers.get("cache-control")).toBe("no-cache");
    expect(await fallback.text()).toContain("Synthetic SPA");
    const stat = vi.spyOn(fs, "stat");
    const stream = vi.spyOn(fs, "createReadStream");
    for (let index = 2; index < FRONTEND_CLIENT_LIMIT; index++) {
      const response = await fetch(origin + "/outreach");
      expect(response.status).toBe(200);
      await response.text();
    }
    expect(stat).toHaveBeenCalled();
    expect(stream).toHaveBeenCalled();
    stat.mockClear();
    stream.mockClear();
    const refused = await fetch(
      origin + "/new-page?token=private-query-marker"
    );
    expect(refused.status).toBe(429);
    expect(await refused.json()).toEqual({ error: "frontend_rate_limited" });
    expect(stat).not.toHaveBeenCalled();
    expect(stream).not.toHaveBeenCalled();
    const head = await fetch(origin + "/asset.css", { method: "HEAD" });
    expect(head.status).toBe(429);
    expect(head.headers.get("cache-control")).toBe("private, no-store");
    expect(stat).not.toHaveBeenCalled();
    expect(stream).not.toHaveBeenCalled();
    expect((await fetch(origin + "/api/health")).status).toBe(200);
  }, 20000);
});
