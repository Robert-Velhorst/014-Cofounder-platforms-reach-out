import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import express from "express";
import { createServer } from "node:http";
import {
  isSafeOperation,
  permitsTrpcUrl,
  createTrpcRouteAdmission,
} from "./route-policy";

describe("explicit production operation admission", () => {
  it("the actual HTTP admission middleware preserves all58 and refuses unreviewed/mixed requests before handlers", async () => {
    const app = express();
    let entered = 0;
    app.use((req, res, next) => {
      res.setHeader("x-request-id", "synthetic-route-gate");
      next();
    });
    app.use("/api/trpc", createTrpcRouteAdmission(false));
    app.use("/api/trpc", (req, res) => {
      entered++;
      res.json({ fixture: "admitted-to-sentinel-not-a-real-handler" });
    });
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string")
        throw Error("fixture address");
      const origin = `http://127.0.0.1:${address.port}`;
      const snapshot = JSON.parse(
        readFileSync(
          new URL(
            "../../../docs/API_SURFACE_INVENTORY_2026-10-20.json",
            import.meta.url
          ),
          "utf8"
        )
      );
      for (const row of snapshot.routes.filter(
        (r: any) => r.defaultPolicyAdmitted
      )) {
        const res = await fetch(`${origin}/api/trpc/${row.operation}`, {
          signal: AbortSignal.timeout(3000),
        });
        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toBe("private, no-store");
        await res.json();
      }
      expect(entered).toBe(58);
      for (const name of [
        "auth.unreviewedFutureMutation",
        "profile.unreviewedFutureMutation",
        "criticalPath.unreviewedFutureMutation",
        "system.unreviewedFutureMutation",
        "accountData.unreviewedFutureMutation",
        "auth.me,criticalPath.unreviewedFutureMutation",
      ]) {
        const res = await fetch(`${origin}/api/trpc/${name}?batch=1`, {
          method: "POST",
          signal: AbortSignal.timeout(3000),
        });
        expect(res.status).toBe(403);
        expect(res.headers.get("cache-control")).toBe("private, no-store");
        expect(await res.json()).toMatchObject({
          error: "legacy_route_disabled",
          requestId: "synthetic-route-gate",
        });
      }
      expect(entered).toBe(58);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      );
    }
  });
  it.each(["auth", "profile", "criticalPath", "system", "accountData"])(
    "does not automatically expose a future %s procedure",
    group => {
      const unknown = `${group}.unreviewedFutureMutation`;
      expect(isSafeOperation(unknown)).toBe(false);
      expect(permitsTrpcUrl(`/${unknown}`, false)).toBe(false);
      expect(permitsTrpcUrl(`/auth.me,${unknown}?batch=1`, false)).toBe(false);
      expect(permitsTrpcUrl(`/${unknown}`, true)).toBe(true);
    }
  );
  it("preserves every currently reviewed operation without enabling denied declarations", () => {
    const snapshot = JSON.parse(
      readFileSync(
        new URL(
          "../../../docs/API_SURFACE_INVENTORY_2026-10-20.json",
          import.meta.url
        ),
        "utf8"
      )
    );
    expect(
      snapshot.routes.filter((r: any) => r.defaultPolicyAdmitted)
    ).toHaveLength(58);
    for (const route of snapshot.routes)
      expect(isSafeOperation(route.operation), route.operation).toBe(
        route.defaultPolicyAdmitted
      );
  });
  it("does not mistake a reviewed operation suffix or sibling for the reviewed name", () => {
    for (const name of [
      "auth.me.extra",
      "auth.meNew",
      "criticalPath.outreach.conversation.deleteAll",
      "system.notifyOwnerUnsafe",
      "profile.createPublic",
      "accountData.exportAllAccounts",
    ])
      expect(permitsTrpcUrl(`/${name}`, false)).toBe(false);
    expect(permitsTrpcUrl("/auth.me,criticalPath.status?batch=1", false)).toBe(
      true
    );
  });
});
