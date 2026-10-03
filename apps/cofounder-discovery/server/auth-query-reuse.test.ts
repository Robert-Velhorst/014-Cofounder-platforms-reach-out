import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { getTableColumns } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { users } from "../drizzle/schema";
import { closeDb, getDb, getUserByOpenId } from "./db";
import { isAccountSessionActive } from "./account-sessions";

const driver = vi.hoisted(() => ({ query: vi.fn(), end: vi.fn() }));
vi.mock("drizzle-orm/mysql2", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm/mysql2")>();
  return {
    ...actual,
    // Actual Drizzle SQL building, parameter binding and row mapping; no sockets.
    drizzle: () =>
      actual.drizzle({ query: driver.query, end: driver.end } as never),
  };
});

describe("authentication query construction reuse without result caching", () => {
  beforeEach(() => {
    vi.stubEnv(
      "DATABASE_URL",
      "mysql://synthetic:synthetic@127.0.0.1/synthetic"
    );
    driver.end.mockImplementation((done: () => void) => done());
    driver.query.mockResolvedValue([[], []]);
  });
  afterEach(async () => {
    await closeDb();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("compiles one user lookup for concurrent callers but reads every result live", async () => {
    const database = (await getDb())!;
    const select = vi.spyOn(database, "select");
    const compile = vi.spyOn(MySqlDialect.prototype, "sqlToQuery");
    const ids = Array.from({ length: 40 }, (_, index) => `synthetic:${index}`);
    await Promise.all(ids.map(id => getUserByOpenId(id)));
    expect(driver.query).toHaveBeenCalledTimes(40);
    expect(driver.query.mock.calls.map(call => call[1][0])).toEqual(ids);
    const sqls = new Set(driver.query.mock.calls.map(call => call[0].sql));
    expect(sqls.size).toBe(1);
    expect([...sqls][0]).toMatch(/`openId` = \?/);
    expect(select).toHaveBeenCalledTimes(1);
    expect(compile).toHaveBeenCalledTimes(1);
    const row = Object.keys(getTableColumns(users)).map(key =>
      key === "id"
        ? 42
        : key === "openId"
          ? ids[0]
          : key === "name"
            ? "Changed"
            : null
    );
    driver.query.mockResolvedValueOnce([[row], []]);
    await expect(getUserByOpenId(ids[0])).resolves.toMatchObject({
      id: 42,
      name: "Changed",
    });
    driver.query.mockResolvedValueOnce([[], []]);
    await expect(getUserByOpenId(ids[0])).resolves.toBeUndefined();
    expect(driver.query).toHaveBeenCalledTimes(42);
    expect(select).toHaveBeenCalledTimes(1);
    expect(compile).toHaveBeenCalledTimes(1);
  });

  it("reuses session SQL while binding each owner, digest and current expiry cutoff", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-02T03:04:05.000Z"));
    const database = (await getDb())!;
    const select = vi.spyOn(database, "select");
    const compile = vi.spyOn(MySqlDialect.prototype, "sqlToQuery");
    await Promise.all(
      Array.from({ length: 40 }, (_, index) =>
        isAccountSessionActive(index + 1, `token-${index}`)
      )
    );
    expect(driver.query).toHaveBeenCalledTimes(40);
    for (const [index, call] of driver.query.mock.calls.entries()) {
      expect(call[0].sql).toMatch(/`deletion_fenced_at` is null/);
      expect(call[0].sql).toMatch(/`expires_at` > \?/);
      expect(call[1]).toEqual([
        index + 1,
        createHash("sha256").update(`token-${index}`).digest("hex"),
        "2030-01-02 03:04:05.000",
        1,
      ]);
    }
    expect(select).toHaveBeenCalledTimes(1);
    expect(compile).toHaveBeenCalledTimes(1);
    driver.query.mockResolvedValueOnce([[[1]], []]);
    await expect(isAccountSessionActive(1, "token-0")).resolves.toBe(true);
    vi.setSystemTime(new Date("2030-01-02T04:04:05.000Z"));
    driver.query.mockResolvedValueOnce([[], []]);
    await expect(isAccountSessionActive(1, "token-0")).resolves.toBe(false);
    expect(driver.query.mock.calls.at(-1)![1][2]).toBe(
      "2030-01-02 04:04:05.000"
    );
    expect(select).toHaveBeenCalledTimes(1);
    expect(compile).toHaveBeenCalledTimes(1);
  });

  it("does not reuse a query bound to a replaced database", async () => {
    const first = (await getDb())!;
    const firstSelect = vi.spyOn(first, "select");
    await getUserByOpenId("first");
    await isAccountSessionActive(1, "first");
    await closeDb();
    const second = (await getDb())!;
    const secondSelect = vi.spyOn(second, "select");
    expect(second).not.toBe(first);
    await getUserByOpenId("second");
    await isAccountSessionActive(2, "second");
    expect(firstSelect).toHaveBeenCalledTimes(2);
    expect(secondSelect).toHaveBeenCalledTimes(2);
    expect(driver.query).toHaveBeenCalledTimes(4);
  });

  it("propagates a failed execution and queries again without retaining a result", async () => {
    const database = (await getDb())!;
    const select = vi.spyOn(database, "select");
    driver.query.mockRejectedValueOnce(new Error("synthetic driver failure"));
    await expect(getUserByOpenId("retry")).rejects.toThrow();
    await expect(getUserByOpenId("retry")).resolves.toBeUndefined();
    expect(driver.query).toHaveBeenCalledTimes(2);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("retries construction after a synchronous failure rather than retaining a broken plan", async () => {
    const database = (await getDb())!;
    const select = vi.spyOn(database, "select");
    select.mockImplementationOnce(() => {
      throw new Error("synthetic construction failure");
    });
    await expect(getUserByOpenId("retry")).rejects.toThrow(
      "synthetic construction failure"
    );
    await expect(getUserByOpenId("retry")).resolves.toBeUndefined();
    await expect(getUserByOpenId("retry")).resolves.toBeUndefined();
    expect(select).toHaveBeenCalledTimes(2);
    expect(driver.query).toHaveBeenCalledTimes(2);
  });
});
