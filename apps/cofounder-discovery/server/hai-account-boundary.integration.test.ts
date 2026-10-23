import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import * as data from "./db";
import { auditEvents, users, loginAttemptQuotas } from "../drizzle/schema";
import { haiFeedHandler } from "./hai-connector";
import { resetConfigForTests } from "./config";
import { resetRateLimitsForTests } from "./rate-limit";
import { admitHaiFeedAttempt } from "./hai-feed-admission";

const token = "synthetic-hai-account-token-at-least-32-characters";
let ownerId: number, otherId: number;
beforeEach(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
    throw new Error("isolated_hai_database_required");
  const db = (await data.getDb())!;
  await db.delete(loginAttemptQuotas);
  const rows = await db
    .insert(users)
    .values(
      [0, 1].map(() => ({
        openId: randomUUID(),
        email: `${randomUUID()}@example.invalid`,
        emailVerified: 1,
      }))
    )
    .$returningId();
  [ownerId, otherId] = rows.map(row => row.id);
  await db.insert(auditEvents).values([
    {
      userId: ownerId,
      requestId: randomUUID(),
      action: "outreach.draft",
      outcome: "success",
      metadata: { privateDetail: "synthetic-owner-detail" },
    },
    {
      userId: otherId,
      requestId: randomUUID(),
      action: "outreach.draft",
      outcome: "success",
      metadata: { privateDetail: "synthetic-other-detail" },
    },
    {
      userId: ownerId,
      requestId: randomUUID(),
      action: "account.login",
      outcome: "success",
    },
  ]);
  vi.stubEnv("HAI_CONNECTOR_TOKEN", token);
  vi.stubEnv("HAI_CONNECTOR_TOKEN_FILE", undefined);
  vi.stubEnv("HAI_CONNECTOR_USER_ID", String(ownerId));
  vi.stubEnv("HAI_CONNECTOR_INCLUDE_CONTENT", "false");
  resetConfigForTests();
  resetRateLimitsForTests();
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  resetConfigForTests();
  resetRateLimitsForTests();
  const db = (await data.getDb())!;
  await db.delete(loginAttemptQuotas);
  await db
    .delete(auditEvents)
    .where(inArray(auditEvents.userId, [ownerId, otherId]));
  await db.delete(users).where(inArray(users.id, [ownerId, otherId]));
});
async function fixture() {
  const app = express();
  app.get("/feed", (req, res, next) => {
    void Promise.resolve(haiFeedHandler(req, res, next)).catch(() =>
      res.status(503).json({ error: "service_unavailable" })
    );
  });
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture_port");
  return {
    request: (authorization = token) =>
      fetch(`http://127.0.0.1:${address.port}/feed`, {
        headers: { authorization: `Bearer ${authorization}` },
        signal: AbortSignal.timeout(10000),
      }),
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    },
  };
}
describe("HAI feed current owner boundary with isolated MySQL", () => {
  it("keeps shared HTTP refusal after the local guard resets, before owner/event lookup", async () => {
    for (let i = 0; i < 60; i++)
      await admitHaiFeedAttempt(ownerId, `192.0.2.${i + 1}`);
    resetRateLimitsForTests();
    const db = (await data.getDb())!;
    const before = await db
      .select()
      .from(loginAttemptQuotas)
      .orderBy(loginAttemptQuotas.key);
    const getDb = vi.spyOn(data, "getDb");
    const f = await fixture();
    try {
      const response = await f.request();
      expect(response.status).toBe(429);
      expect(response.headers.get("retry-after")).toBe("60");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual({ error: "rate_limited" });
      expect(getDb).toHaveBeenCalledTimes(1);
      expect(
        await db
          .select()
          .from(loginAttemptQuotas)
          .orderBy(loginAttemptQuotas.key)
      ).toEqual(before);
    } finally {
      await f.close();
    }
  });
  it("does not refund admitted attempts for an ineligible owner", async () => {
    await (await data.getDb())!
      .update(users)
      .set({ emailVerified: 0 })
      .where(eq(users.id, ownerId));
    const f = await fixture();
    try {
      expect((await f.request()).status).toBe(403);
      const [row] = await (await data.getDb())!
        .select()
        .from(loginAttemptQuotas)
        .where(eq(loginAttemptQuotas.key, "hai-feed-global-v1"));
      expect(row.used).toBe(1);
    } finally {
      await f.close();
    }
  });
  it("returns only eligible owner's supported events with content withheld", async () => {
    const f = await fixture();
    try {
      const response = await f.request();
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      const body = await response.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].metadata).toMatchObject({
        contentIncluded: false,
        providerConfirmed: false,
      });
      expect(JSON.stringify(body)).not.toContain("synthetic-owner-detail");
      expect(JSON.stringify(body)).not.toContain("synthetic-other-detail");
    } finally {
      await f.close();
    }
  });
  it.each(["unverified", "fenced"])(
    "refuses %s account without events",
    async state => {
      await (await data.getDb())!
        .update(users)
        .set(
          state === "fenced"
            ? { deletionFencedAt: new Date() }
            : { emailVerified: 0 }
        )
        .where(eq(users.id, ownerId));
      const f = await fixture();
      try {
        const response = await f.request();
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
          error: "hai_account_unavailable",
        });
      } finally {
        await f.close();
      }
    }
  );
  it("does not redirect a missing configured account to another owner", async () => {
    await (await data.getDb())!
      .delete(auditEvents)
      .where(eq(auditEvents.userId, ownerId));
    await (await data.getDb())!.delete(users).where(eq(users.id, ownerId));
    const f = await fixture();
    try {
      const response = await f.request();
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "hai_account_unavailable",
      });
    } finally {
      await f.close();
    }
  });
  it("checks committed suspension after waiting on the same owner lock", async () => {
    const lock = await createConnection(process.env.DATABASE_URL!);
    const observer = await createConnection(process.env.DATABASE_URL!);
    const f = await fixture();
    let pending: Promise<Response> | undefined;
    try {
      await lock.beginTransaction();
      await lock.query(
        "UPDATE users SET deletion_fenced_at=CURRENT_TIMESTAMP WHERE id=?",
        [ownerId]
      );
      pending = f.request();
      const deadline = Date.now() + 5000;
      let waiting = false;
      while (Date.now() < deadline) {
        const [rows] = await observer.query<RowDataPacket[]>(
          "SHOW FULL PROCESSLIST"
        );
        waiting = rows.some(
          row =>
            typeof row.Info === "string" &&
            row.Info.includes("from `users`") &&
            row.Info.includes("for share")
        );
        if (waiting) break;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waiting).toBe(true);
      await lock.commit();
      const response = await pending;
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "hai_account_unavailable",
      });
    } finally {
      await lock.rollback();
      if (pending) await pending.catch(() => undefined);
      await f.close();
      await lock.end();
      await observer.end();
    }
  });
  it("storage failure returns no data or database error text", async () => {
    vi.spyOn(data, "getDb").mockRejectedValueOnce(
      new Error("synthetic-private-storage-error")
    );
    const f = await fixture();
    try {
      const response = await f.request();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "database_unavailable" });
    } finally {
      await f.close();
    }
  });
  it("invalid connector bearer is rejected before storage", async () => {
    const getDb = vi.spyOn(data, "getDb");
    const f = await fixture();
    try {
      expect((await f.request("wrong-token")).status).toBe(401);
      expect(getDb).not.toHaveBeenCalled();
    } finally {
      await f.close();
    }
  });
});
