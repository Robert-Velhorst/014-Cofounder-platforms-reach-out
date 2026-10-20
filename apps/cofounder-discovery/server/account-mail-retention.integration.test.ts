import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { fork } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { eq, inArray, sql } from "drizzle-orm";
import { accountMailJobs, accountMailQuotas } from "../drizzle/schema";
import * as data from "./db";
import { resetConfigForTests } from "./config";

let ids: string[] = [];
let keys: string[] = [];
const ago = (days: number) => new Date(Date.now() - days * 86_400_000);
async function job(
  overrides: Partial<typeof accountMailJobs.$inferInsert> = {}
) {
  const id = randomUUID();
  ids.push(id);
  await (await data.getDb())!.insert(accountMailJobs).values({
    id,
    quotaKey: randomBytes(32).toString("hex"),
    kind: "password_reset",
    payload: "synthetic-encrypted-payload",
    expiresAt: ago(1),
    ...overrides,
  });
  return id;
}
async function quota(
  key = randomBytes(32).toString("hex"),
  expiresAt = ago(1)
) {
  keys.push(key);
  await (await data.getDb())!
    .insert(accountMailQuotas)
    .values({ key, used: 5, expiresAt })
    .onDuplicateKeyUpdate({ set: { used: 5, expiresAt } });
  return key;
}
async function row(id: string) {
  const [row] = await (await data.getDb())!
    .select()
    .from(accountMailJobs)
    .where(eq(accountMailJobs.id, id));
  return row;
}
async function sweep() {
  const modulePath = "./account-mail-retention";
  const module = await import(modulePath).catch(() => null);
  expect(typeof module?.cleanupAccountMail).toBe("function");
  return module.cleanupAccountMail();
}
describe("bounded account-mail retention with MySQL", () => {
  it("runs retention in the real server without email credentials and shuts down cleanly", async () => {
    const id = await job();
    const probe = createServer();
    await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
    const address = probe.address();
    if (!address || typeof address === "string")
      throw new Error("fixture_address");
    const port = address.port;
    await new Promise<void>(resolve => probe.close(() => resolve()));
    const child = fork(
      fileURLToPath(
        new URL("./test-fixtures/shutdown-server.ts", import.meta.url)
      ),
      {
        execArgv: ["--import", "tsx"],
        env: {
          ...process.env,
          NODE_ENV: "test",
          APP_MODE: "test",
          PORT: String(port),
          HOST: "127.0.0.1",
          ENABLE_ACCOUNT_MAIL_RETENTION: "true",
          ENABLE_ACCOUNT_MAIL_WORKER: "false",
          RESEND_API_KEY: "",
          AUTH_EMAIL_FROM: "",
          AUTH_MAIL_ENCRYPTION_SECRET: "",
          OPENAI_API_KEY: "",
          ENABLE_PLATFORM_AUTOMATION: "false",
          ENABLE_UNSAFE_LEGACY_ROUTES: "false",
        },
        stdio: ["ignore", "pipe", "pipe", "ipc"],
      }
    );
    let output = "";
    child.stdout?.on("data", chunk => {
      output += String(chunk);
    });
    child.stderr?.on("data", chunk => {
      output += String(chunk);
    });
    const exited = new Promise(resolve =>
      child.once("exit", (code, signal) => resolve({ code, signal }))
    );
    try {
      await vi.waitFor(
        () =>
          expect(output).toContain(
            '"event":"account_mail_retention_completed"'
          ),
        { timeout: 10_000 }
      );
      expect(await row(id)).toMatchObject({
        state: "discarded",
        payload: null,
      });
      if (process.platform === "win32") child.send("SIGTERM");
      else child.kill("SIGTERM");
      await vi.waitFor(() => expect(child.exitCode, output).toBe(0), {
        timeout: 5_000,
      });
      expect(await exited).toEqual({ code: 0, signal: null });
      expect(output).toContain('"event":"shutdown_completed"');
    } finally {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
      await exited;
    }
  }, 20_000);
  beforeEach(() => {
    ids = [];
    keys = [];
    vi.stubEnv("ENABLE_ACCOUNT_MAIL_RETENTION", "true");
    resetConfigForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("retention_must_not_send");
      })
    );
  });
  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    const db = (await data.getDb())!;
    if (ids.length)
      await db.delete(accountMailJobs).where(inArray(accountMailJobs.id, ids));
    if (keys.length)
      await db
        .delete(accountMailQuotas)
        .where(inArray(accountMailQuotas.key, keys));
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("does nothing without explicit retention opt-in", async () => {
    const id = await job();
    vi.stubEnv("ENABLE_ACCOUNT_MAIL_RETENTION", "false");
    resetConfigForTests();
    expect(await sweep()).toMatchObject({ status: "disabled" });
    expect(await row(id)).toMatchObject({
      state: "queued",
      payload: "synthetic-encrypted-payload",
    });
  });
  it("discards expired requests and clears payloads without changing future requests", async () => {
    const expired = await job(),
      future = await job({ expiresAt: ago(-1) });
    expect(await sweep()).toMatchObject({ expiredJobs: 1 });
    expect(await row(expired)).toMatchObject({
      state: "discarded",
      payload: null,
      leaseUntil: null,
    });
    expect(await row(future)).toMatchObject({
      state: "queued",
      payload: "synthetic-encrypted-payload",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preserves an active sending lease even after job expiry, then clears an expired lease", async () => {
    const id = await job({
      state: "sending",
      attempts: 2,
      leaseUntil: ago(-1),
    });
    await sweep();
    expect(await row(id)).toMatchObject({
      state: "sending",
      attempts: 2,
      payload: "synthetic-encrypted-payload",
    });
    await (await data.getDb())!
      .update(accountMailJobs)
      .set({ leaseUntil: ago(1) })
      .where(eq(accountMailJobs.id, id));
    await sweep();
    expect(await row(id)).toMatchObject({
      state: "discarded",
      attempts: 2,
      payload: null,
      leaseUntil: null,
    });
  });
  it("prunes terminal metadata only seven days after original expiry", async () => {
    const old = await job({
      state: "accepted",
      payload: null,
      providerId: "synthetic-ack",
      expiresAt: ago(8),
    });
    const recent = await job({
      state: "failed",
      payload: null,
      expiresAt: ago(6),
    });
    const fresh = await job({
      state: "accepted",
      payload: null,
      expiresAt: ago(-1),
    });
    expect(await sweep()).toMatchObject({ deletedJobs: 1 });
    expect(await row(old)).toBeUndefined();
    expect(await row(recent)).toBeDefined();
    expect(await row(fresh)).toBeDefined();
  });
  it("removes expired request hashes but never budget keys, unknown keys or current quotas", async () => {
    const expired = await quota(),
      current = await quota(undefined, ago(-1));
    const day = await quota("account-mail:dispatch:day:v1"),
      month = await quota("account-mail:dispatch:month:v1");
    const unknown = await quota("legacy-" + randomUUID());
    await sweep();
    const remaining = await (await data.getDb())!
      .select()
      .from(accountMailQuotas)
      .where(inArray(accountMailQuotas.key, keys));
    expect(remaining.map(r => r.key).sort()).toEqual(
      [current, day, month, unknown].sort()
    );
    expect(remaining.every(r => r.used === 5)).toBe(true);
    expect(remaining.some(r => r.key === expired)).toBe(false);
  });
  it("bounds each metadata deletion pass and makes repeated cleanup idempotent", async () => {
    for (let i = 0; i < 105; i++)
      await job({ state: "discarded", payload: null, expiresAt: ago(8) });
    expect(await sweep()).toMatchObject({ deletedJobs: 100 });
    expect(await sweep()).toMatchObject({ deletedJobs: 5 });
    expect(await sweep()).toMatchObject({
      expiredJobs: 0,
      deletedJobs: 0,
      deletedQuotas: 0,
    });
  });
  it("coordinates simultaneous sweepers without counting any job twice", async () => {
    for (let i = 0; i < 150; i++)
      await job({ state: "discarded", payload: null, expiresAt: ago(8) });
    const results = await Promise.all([sweep(), sweep()]);
    const deleted = results.reduce((sum, r) => sum + r.deletedJobs, 0);
    // SKIP LOCKED is intentionally allowed to defer busy rows to a later pass.
    // Reported removals must match actual rows, with no double counting.
    const remaining = await (await data.getDb())!
      .select()
      .from(accountMailJobs)
      .where(inArray(accountMailJobs.id, ids));
    expect(remaining.length).toBe(150 - deleted);
    expect(deleted + (await sweep()).deletedJobs).toBe(150);
    expect(await sweep()).toMatchObject({ deletedJobs: 0 });
  });
  it("skips a locked expired request quota and preserves its concurrently renewed allowance", async () => {
    const key = await quota();
    const db = (await data.getDb())!;
    await db.transaction(async tx => {
      await tx
        .select()
        .from(accountMailQuotas)
        .where(eq(accountMailQuotas.key, key))
        .for("update");
      expect(await sweep()).toMatchObject({ deletedQuotas: 0 });
      await tx
        .update(accountMailQuotas)
        .set({ expiresAt: ago(-1), used: 9 })
        .where(eq(accountMailQuotas.key, key));
    });
    await sweep();
    const [stored] = await db
      .select()
      .from(accountMailQuotas)
      .where(eq(accountMailQuotas.key, key));
    expect(stored).toMatchObject({ used: 9 });
  });
  it("skips a delivery row held by another transaction", async () => {
    const id = await job();
    const db = (await data.getDb())!;
    await db.transaction(async tx => {
      await tx
        .select()
        .from(accountMailJobs)
        .where(eq(accountMailJobs.id, id))
        .for("update");
      expect(await sweep()).toMatchObject({ expiredJobs: 0 });
    });
    expect(await sweep()).toMatchObject({ expiredJobs: 1 });
  });
  it("rolls back a failed expiry batch and returns a sanitized failure", async () => {
    const id = await job();
    const db = (await data.getDb())!,
      constraint = "retention_" + id.replaceAll("-", "");
    await db.execute(
      sql.raw(
        `ALTER TABLE account_mail_jobs ADD CONSTRAINT ${constraint} CHECK (id <> '${id}' OR state <> 'discarded')`
      )
    );
    try {
      await expect(sweep()).rejects.toMatchObject({
        message: "Account mail retention failed.",
      });
      expect(await row(id)).toMatchObject({
        state: "queued",
        payload: "synthetic-encrypted-payload",
      });
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE account_mail_jobs DROP CHECK ${constraint}`)
      );
    }
    expect(await sweep()).toMatchObject({ expiredJobs: 1 });
  });
  it("uses the database clock when the application clock jumps forward", async () => {
    const id = await job({ expiresAt: ago(-1) }),
      key = await quota(undefined, ago(-1));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2035-01-01T00:00:00Z"));
    await sweep();
    expect(await row(id)).toMatchObject({ state: "queued" });
    expect(
      await (await data.getDb())!
        .select()
        .from(accountMailQuotas)
        .where(eq(accountMailQuotas.key, key))
    ).toHaveLength(1);
  });
  it("fails closed on a non-UTC session instead of guessing legacy timestamp semantics", async () => {
    const id = await job();
    const db = (await data.getDb())!,
      realTransaction = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementation((callback, config) =>
      realTransaction(async tx => {
        const [rows] = await tx.execute(
          sql`SELECT @@session.time_zone AS zone`
        );
        const original = (rows as unknown as Array<{ zone: string }>)[0].zone;
        await tx.execute(sql`SET SESSION time_zone = '+02:00'`);
        try {
          return await callback(tx);
        } finally {
          await tx.execute(sql`SET SESSION time_zone = ${original}`);
        }
      }, config)
    );
    await expect(sweep()).rejects.toMatchObject({
      message: "Account mail retention failed.",
    });
    expect(await row(id)).toMatchObject({
      state: "queued",
      payload: "synthetic-encrypted-payload",
    });
  });
});
