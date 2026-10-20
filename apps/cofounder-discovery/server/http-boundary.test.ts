import express from "express";
import { createServer, request } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiNotFound,
  requestCorrelation,
  safeHttpError,
  validateRequestPath,
} from "./http-boundary";

const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    servers.splice(0).map(server => {
      server.closeAllConnections();
      return new Promise<void>(resolve => server.close(() => resolve()));
    })
  );
});

async function fixture() {
  const app = express();
  app.use(requestCorrelation, validateRequestPath);
  app.use(express.json({ limit: "1kb" }));
  app.use(express.urlencoded({ limit: "1kb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/body", (_req, res) => res.json({ accepted: true }));
  app.get("/api/fail", () => {
    throw Object.assign(new Error("private-database-password"), {
      status: 418,
      body: "private-user-content",
    });
  });
  app.get("/api/partial", (_req, res, next) => {
    res.write("partial");
    next(new Error("private-after-headers"));
  });
  app.use("/api", apiNotFound);
  app.use((_req, res) => res.type("html").send("<html>SPA</html>"));
  app.use(safeHttpError);
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture_port");
  return `http://127.0.0.1:${address.port}`;
}

async function expectFailure(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const requestId = response.headers.get("x-request-id");
  expect(requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(await response.json()).toEqual({ error: code, requestId });
}

describe("HTTP boundary real socket responses", () => {
  it("rejects invalid compressed bodies and excessive form nesting as client errors", async () => {
    const base = await fixture();
    await expectFailure(
      await fetch(base + "/api/body", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-encoding": "gzip",
        },
        body: "not-gzip-private-body",
      }),
      400,
      "invalid_request_body"
    );
    await expectFailure(
      await fetch(base + "/api/body", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "a" + "[b]".repeat(40) + "=private",
      }),
      400,
      "invalid_request_body"
    );
  });
  it("rejects malformed JSON without reflecting bodies, query secrets or supplied correlation headers", async () => {
    const base = await fixture();
    const response = await fetch(`${base}/api/body?token=private-query`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "private-caller-content",
      },
      body: '{"private-body":',
    });
    await expectFailure(response, 400, "invalid_request_body");
  });

  it.each(["application/json", "application/x-www-form-urlencoded"])(
    "bounds %s body size with a JSON 413",
    async contentType => {
      const base = await fixture();
      await expectFailure(
        await fetch(`${base}/api/body`, {
          method: "POST",
          headers: { "content-type": contentType },
          body: "private=" + "x".repeat(2048),
        }),
        413,
        "request_body_too_large"
      );
    }
  );

  it.each([
    [
      { "content-type": "application/json; charset=made-up" },
      "unsupported_body_charset",
    ],
    [
      { "content-type": "application/json", "content-encoding": "made-up" },
      "unsupported_body_encoding",
    ],
  ])(
    "rejects unsupported body transport metadata safely",
    async (headers, code) => {
      const base = await fixture();
      await expectFailure(
        await fetch(`${base}/api/body`, {
          method: "POST",
          headers,
          body: "{}",
        }),
        415,
        code
      );
    }
  );

  it("rejects invalid path encodings before routing while ignoring query encoding", async () => {
    const base = await fixture();
    for (const path of [
      "/api/trpc/auth.%ZZ",
      "/api/trpc/auth.%E0%A4",
      "/%ZZ",
    ]) {
      await expectFailure(
        await fetch(base + path),
        400,
        "invalid_request_path"
      );
    }
    const live = await fetch(`${base}/api/health?unused=%ZZ`);
    expect(live.status).toBe(200);
    expect(await live.json()).toEqual({ status: "ok" });
  });

  it("returns API 404s without breaking SPA paths or working API routes", async () => {
    const base = await fixture();
    for (const path of ["/api", "/api/", "/api/unknown", "/API/unknown"]) {
      await expectFailure(await fetch(base + path), 404, "api_not_found");
    }
    for (const path of ["/outreach", "/apiculture"]) {
      const page = await fetch(base + path);
      expect(page.status).toBe(200);
      expect(await page.text()).toBe("<html>SPA</html>");
    }
    expect((await fetch(base + "/api/health")).status).toBe(200);
  });

  it("hides unexpected error details and logs only a generated correlation ID", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const base = await fixture();
    const response = await fetch(`${base}/api/fail?password=private`, {
      headers: { "x-request-id": "private-caller-content" },
    });
    const requestId = response.headers.get("x-request-id");
    await expectFailure(response, 500, "internal_server_error");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({
        level: "error",
        event: "http_request_failed",
        requestId,
      })
    );
  });

  it("closes partial responses instead of appending JSON or leaking the error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const base = await fixture();
    const result = await new Promise<string>(resolve => {
      const req = request(base + "/api/partial", res => {
        res.resume();
        res.on("aborted", () => resolve("aborted"));
        res.on("end", () => resolve("completed"));
      });
      req.on("error", () => resolve("disconnected"));
      req.end();
    });
    expect(["aborted", "disconnected"]).toContain(result);
    expect(log).not.toHaveBeenCalled();
  });
});
