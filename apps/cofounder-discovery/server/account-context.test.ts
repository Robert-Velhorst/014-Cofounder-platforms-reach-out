import { afterEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@shared/_core/errors";
import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { initTRPC } from "@trpc/server";
import express from "express";
import { createServer } from "node:http";
import { requestCorrelation } from "./http-boundary";

const options = {
  req: { header: () => undefined },
  res: {},
} as unknown as CreateExpressContextOptions;

describe("authentication outage handling", () => {
  afterEach(() => vi.restoreAllMocks());

  it("allows anonymous access when the session is missing or invalid", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(
      ForbiddenError("Invalid session")
    );
    expect((await createContext(options)).user).toBeNull();
  });

  it("uses the server response correlation ID, never a caller-supplied ID", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(
      ForbiddenError("Invalid session")
    );
    const serverId = "e10f10c9-471e-4d88-b569-517ca558726a";
    const header = vi.fn(() => "private-caller-controlled-text");
    const context = await createContext({
      req: { header },
      res: { getHeader: () => serverId },
    } as unknown as CreateExpressContextOptions);
    expect(context.requestId).toBe(serverId);
    expect(header).not.toHaveBeenCalled();
  });

  it.each([undefined, "invalid", ["array-header"]])(
    "creates a fresh ID when the server header is invalid: %s",
    async serverHeader => {
      vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(
        ForbiddenError("Invalid session")
      );
      const header = vi.fn(() => "caller-controlled");
      const request = {
        req: { header },
        res: { getHeader: () => serverHeader },
      } as unknown as CreateExpressContextOptions;
      const first = await createContext(request);
      const second = await createContext(request);
      expect(first.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(second.requestId).not.toBe(first.requestId);
      expect(header).not.toHaveBeenCalled();
    }
  );

  it("reports a database outage as service unavailable instead of logging the user out", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(
      new Error("connect ETIMEDOUT; private database connection")
    );
    await expect(createContext(options)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Account service is temporarily unavailable. Please try again.",
    });
  });

  it("matches the real HTTP response ID to the tRPC context despite spoofed headers", async () => {
    vi.spyOn(sdk, "authenticateRequest").mockRejectedValue(
      ForbiddenError("Invalid session")
    );
    const t = initTRPC
      .context<Awaited<ReturnType<typeof createContext>>>()
      .create();
    const app = express();
    app.use(requestCorrelation);
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: t.router({
          correlation: t.procedure.query(({ ctx }) => ctx.requestId),
        }),
        createContext,
      })
    );
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("fixture_port");
      const ids = new Set<string>();
      for (const supplied of [
        "private-caller-text",
        "e10f10c9-471e-4d88-b569-517ca558726a",
      ]) {
        const response = await fetch(
          `http://127.0.0.1:${address.port}/api/trpc/correlation`,
          {
            headers: { "x-request-id": supplied },
          }
        );
        expect(response.status).toBe(200);
        const id = response.headers.get("x-request-id")!;
        expect((await response.json()).result.data).toBe(id);
        expect(id).not.toBe(supplied);
        ids.add(id);
      }
      expect(ids.size).toBe(2);
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
