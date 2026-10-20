import { describe, it, expect } from "vitest";
import { initTRPC, TRPCError } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { publicTrpcError } from "./public-trpc-error";
import superjson from "superjson";

describe("public tRPC error privacy", () => {
  it("strips unexpected SQL/value errors and stacks while preserving diagnostic codes", async () => {
    const secret = "synthetic-private-query-value";
    const t = initTRPC.create({
      transformer: superjson,
      errorFormatter: ({ shape }) => publicTrpcError(shape),
    });
    const server = createHTTPServer({
      router: t.router({
        fail: t.procedure.query(() => {
          throw new Error(
            `SELECT password_hash FROM users WHERE email='${secret}'`
          );
        }),
        denied: t.procedure.query(() => {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Reviewed permission required",
          });
        }),
      }),
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_port");
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/fail`);
      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).not.toContain(secret);
      expect(body).not.toContain("password_hash");
      expect(body).not.toContain("SELECT");
      expect(body).not.toContain('"stack"');
      expect(JSON.parse(body).error.json).toMatchObject({
        message:
          "The request could not be completed. Please try again or contact support.",
        data: { code: "INTERNAL_SERVER_ERROR" },
      });
      const denied = await fetch(`http://127.0.0.1:${address.port}/denied`);
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({
        error: { json: { message: "Reviewed permission required" } },
      });
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
