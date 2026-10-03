import express from "express";
import type { Request } from "express";
import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

const headers = [
  undefined,
  "http",
  "https",
  "http, https",
  "https, http",
  "invalid",
];
describe("session cookies follow the configured Express transport boundary", () => {
  for (const trustProxy of [false, 1] as const) {
    for (const supplied of headers) {
      it(`uses the resolved protocol with trust=${trustProxy} and header=${supplied}`, async () => {
        const app = express();
        app.set("trust proxy", trustProxy);
        app.get("/cookie", (req, res) => {
          const options = getSessionCookieOptions(req);
          res.cookie("synthetic_session", "synthetic_value", options);
          res.json({ protocol: req.protocol, options });
        });
        const server = createServer(app);
        await new Promise<void>(resolve =>
          server.listen(0, "127.0.0.1", resolve)
        );
        try {
          const address = server.address();
          if (!address || typeof address === "string")
            throw new Error("fixture_port");
          const response = await fetch(
            `http://127.0.0.1:${address.port}/cookie`,
            {
              headers: supplied ? { "x-forwarded-proto": supplied } : {},
            }
          );
          const body = await response.json();
          const expected =
            trustProxy === 1 && supplied?.split(",")[0] === "https";
          expect(body.options.secure).toBe(Boolean(expected));
          expect(body.options.secure).toBe(body.protocol === "https");
          const cookie = response.headers.get("set-cookie")!;
          expect(cookie.includes("; Secure")).toBe(Boolean(expected));
          expect(cookie).toContain("; HttpOnly");
          expect(cookie).toContain("; SameSite=Lax");
          expect(cookie).toContain("; Path=/");
          expect(body.options).not.toHaveProperty("domain");
        } finally {
          server.closeAllConnections();
          await new Promise<void>(resolve => server.close(() => resolve()));
        }
      });
    }
  }

  it("preserves secure cookies for direct HTTPS without reading forwarding headers", () => {
    const req = {
      protocol: "https",
      get headers() {
        throw new Error("must_not_read_raw_headers");
      },
    } as unknown as Request;
    expect(getSessionCookieOptions(req).secure).toBe(true);
  });
});
