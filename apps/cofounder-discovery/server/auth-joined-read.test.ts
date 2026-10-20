import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { getTableColumns } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { SignJWT } from "jose";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { users } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { closeDb, getDb } from "./db";
import { resetConfigForTests } from "./config";

const driver = vi.hoisted(() => ({ query: vi.fn(), end: vi.fn() }));
vi.mock("drizzle-orm/mysql2", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm/mysql2")>();
  return {
    ...actual,
    // Keep real SQL compilation, placeholder binding, row mapping and SDK/JWT.
    // Replace only network I/O, not the authentication functions.
    drizzle: () =>
      actual.drizzle({ query: driver.query, end: driver.end } as never),
  };
});
const secret = "synthetic-joined-read-secret-at-least-32-characters";
let name = "Synthetic founder";
function row(openId: string) {
  return Object.keys(getTableColumns(users)).map(key =>
    key === "id" ? 42 : key === "openId" ? openId : key === "name" ? name : null
  );
}
async function request(
  openId = "synthetic:owner",
  tokenId = "synthetic-token"
) {
  const token = await new SignJWT({ openId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("cofounder-discovery")
    .setAudience("cofounder-discovery-web")
    .setJti(tokenId)
    .setExpirationTime(new Date("2030-01-03T00:00:00Z"))
    .sign(new TextEncoder().encode(secret));
  return { headers: { cookie: `${COOKIE_NAME}=${token}` } } as Request;
}

describe("SDK live joined account/session read", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-02T03:04:05.000Z"));
    vi.stubEnv(
      "DATABASE_URL",
      "mysql://synthetic:synthetic@127.0.0.1/synthetic"
    );
    vi.stubEnv("JWT_SECRET", secret);
    resetConfigForTests();
    name = "Synthetic founder";
    driver.end.mockImplementation((done: () => void) => done());
    // Also support the old two-read implementation to expose its real call count.
    driver.query.mockImplementation(async (query, params) => [
      query.sql.includes("from `users`") ? [row(params[0])] : [[42]],
      [],
    ]);
  });
  afterEach(async () => {
    await closeDb();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
    resetConfigForTests();
  });

  it("performs one live SQL read per concurrent authentication with every owner/digest predicate", async () => {
    const database = (await getDb())!;
    const compile = vi.spyOn(MySqlDialect.prototype, "sqlToQuery");
    const requests = await Promise.all(
      Array.from({ length: 40 }, (_, n) =>
        request(`synthetic:${n}`, `token-${n}`)
      )
    );
    const results = await Promise.all(
      requests.map(req => sdk.authenticateRequest(req))
    );
    expect(results.map(user => user.openId)).toEqual(
      Array.from({ length: 40 }, (_, n) => `synthetic:${n}`)
    );
    expect(driver.query).toHaveBeenCalledTimes(40);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(new Set(driver.query.mock.calls.map(([, params]) => params[0])).size).toBe(40);
    for (const [query, params] of driver.query.mock.calls) {
      // Concurrent JWT verification may finish out of request order. Bind each digest to its own owner.
      const n = Number(String(params[0]).slice("synthetic:".length));
      expect(Number.isInteger(n) && n >= 0 && n < 40).toBe(true);
      expect(query.sql).toMatch(/inner join `account_sessions`/);
      expect(query.sql).toMatch(
        /`users`\.`id` = `account_sessions`\.`user_id`/
      );
      expect(query.sql).toMatch(/`users`\.`openId` = \?/);
      expect(query.sql).toMatch(/`deletion_fenced_at` is null/);
      expect(query.sql).toMatch(/`token_digest` = \?/);
      expect(query.sql).toMatch(/`expires_at` > \?/);
      expect(params).toEqual([
        `synthetic:${n}`,
        createHash("sha256").update(`token-${n}`).digest("hex"),
        "2030-01-02 03:04:05.000",
        1,
      ]);
    }
    expect(database).toBe(await getDb());
  });

  it("observes fresh fields, then refuses a missing/revoked/fenced result without caching success", async () => {
    const req = await request();
    await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({ name });
    name = "Changed live field";
    await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({ name });
    driver.query.mockResolvedValueOnce([[], []]);
    await expect(sdk.authenticateRequest(req)).rejects.toThrow(/session|user/i);
    expect(driver.query).toHaveBeenCalledTimes(3);
  });

  it("binds a fresh server cutoff and propagates infrastructure failure without reusing an earlier result", async () => {
    const req = await request();
    await sdk.authenticateRequest(req);
    vi.setSystemTime(new Date("2030-01-02T04:04:05.000Z"));
    await sdk.authenticateRequest(req);
    expect(driver.query).toHaveBeenCalledTimes(2);
    expect(driver.query.mock.calls[1][1]).toContain("2030-01-02 04:04:05.000");
    driver.query.mockRejectedValueOnce(new Error("synthetic unavailable"));
    await expect(sdk.authenticateRequest(req)).rejects.toMatchObject({
      cause: { message: "synthetic unavailable" },
    });
    await expect(sdk.authenticateRequest(req)).resolves.toMatchObject({
      id: 42,
    });
    expect(driver.query).toHaveBeenCalledTimes(4);
  });

  it("refuses an invalid signed token before any database lookup", async () => {
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `${COOKIE_NAME}=invalid` },
      } as Request)
    ).rejects.toThrow(/session/i);
    expect(driver.query).not.toHaveBeenCalled();
  });

  it("constructs a fresh joined plan after database replacement", async () => {
    const req = await request();
    const first = (await getDb())!;
    const firstSelect = vi.spyOn(first, "select");
    await sdk.authenticateRequest(req);
    await closeDb();
    const second = (await getDb())!;
    const secondSelect = vi.spyOn(second, "select");
    await sdk.authenticateRequest(req);
    expect(second).not.toBe(first);
    expect(firstSelect).toHaveBeenCalledTimes(1);
    expect(secondSelect).toHaveBeenCalledTimes(1);
    expect(driver.query).toHaveBeenCalledTimes(2);
  });

  it("retries joined-plan construction after failure without caching failure", async () => {
    const req = await request();
    const database = (await getDb())!;
    const select = vi.spyOn(database, "select");
    select.mockImplementationOnce(() => {
      throw new Error("synthetic construction failure");
    });
    await expect(sdk.authenticateRequest(req)).rejects.toThrow(
      "synthetic construction failure"
    );
    await sdk.authenticateRequest(req);
    await sdk.authenticateRequest(req);
    expect(select).toHaveBeenCalledTimes(2);
    expect(driver.query).toHaveBeenCalledTimes(2);
  });
});
