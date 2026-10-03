import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { fork } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { closeDb, createLocalUser, getDb, getUserByOpenId } from "./db";
import { appRouter } from "./routers";
import { resetConfigForTests } from "./config";
import type { TrpcContext } from "./_core/context";
import * as queue from "./account-mail-queue";

describe("durable recovery requests", () => {
  let email: string;
  let openId: string;
  let secret: string;
  const quotaKeys = new Set<string>();
  const caller = (ip = "fixture-ip") =>
    appRouter.createCaller({
      user: null,
      req: { ip, headers: {} },
      res: {},
      requestId: randomUUID(),
    } as unknown as TrpcContext);
  const key = (scope: string) => {
    const digest = createHmac("sha256", secret)
      .update(`recovery-quota:${scope}`)
      .digest("hex");
    quotaKeys.add(digest);
    return digest;
  };
  beforeEach(async () => {
    secret = `${randomUUID()}${randomUUID()}`;
    email = `${randomUUID()}@example.invalid`;
    openId = `local:${randomUUID()}`;
    vi.stubEnv("AUTH_MAIL_ENCRYPTION_SECRET", secret);
    vi.stubEnv("RESEND_API_KEY", "synthetic-not-a-provider-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "test@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://example.invalid");
    resetConfigForTests();
    // Any network operation here is a defect: requests only commit durable work.
    vi.stubGlobal("fetch", () => {
      throw new Error("unexpected_network_request");
    });
    await createLocalUser({
      openId,
      email,
      passwordHash: "synthetic-hash",
      loginMethod: "local",
    });
  });
  const recordJobs = async () => {
    const db = (await getDb())!;
    const [rows] = await db.execute(
      sql`SELECT id, payload, state, provider_id FROM account_mail_jobs WHERE quota_key = ${key(`email:${email}`)}`
    );
    const jobs = rows as unknown as Array<{
      id: string;
      payload: string | null;
      state: string;
      provider_id: string | null;
    }>;
    return jobs;
  };
  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    const db = (await getDb())!;
    // Exact fixture quota keys identify even requests for non-existent users.
    for (const digest of quotaKeys) {
      await db.execute(
        sql`DELETE FROM account_mail_jobs WHERE quota_key = ${digest}`
      );
      await db.execute(
        sql`DELETE FROM account_mail_quotas WHERE quota_key = ${digest}`
      );
    }
    quotaKeys.clear();
    await db.delete(users).where(eq(users.openId, openId));
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  afterAll(closeDb);

  it("returns the same response for known and unknown addresses without issuing tokens or sending mail", async () => {
    key("global");
    key("ip:fixture-ip");
    key(`email:${email}`);
    const unknown = `${randomUUID()}@example.invalid`;
    key(`email:${unknown}`);
    const knownResponse = await caller().auth.requestPasswordReset({ email });
    const unknownResponse = await caller().auth.requestPasswordReset({
      email: unknown,
    });
    expect(knownResponse).toEqual(unknownResponse);
    expect(knownResponse).toMatchObject({ success: true });
    expect(Object.keys(knownResponse).sort()).toEqual(["message", "success"]);
    const jobs = await recordJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].state).toBe("queued");
    expect(jobs[0].payload).not.toContain(email);
    expect((await getUserByOpenId(openId))?.passwordResetToken).toBeNull();
  });

  it("keeps a per-address ceiling across simultaneous requests and database reconnects", async () => {
    key("global");
    key("ip:fixture-ip");
    key(`email:${email}`);
    await Promise.all(
      Array.from({ length: 8 }, () =>
        caller().auth.requestPasswordReset({ email })
      )
    );
    await closeDb();
    await caller().auth.requestPasswordReset({
      email: `  ${email.toUpperCase()}  `,
    });
    expect(await recordJobs()).toHaveLength(3);
  });

  it("limits one IP across different addresses, including non-existent accounts", async () => {
    key("global");
    key("ip:fixture-ip");
    const addresses = Array.from(
      { length: 12 },
      () => `${randomUUID()}@example.invalid`
    );
    for (const address of addresses) key(`email:${address}`);
    for (const address of addresses)
      await caller().auth.requestPasswordReset({ email: address });
    const db = (await getDb())!;
    let queued = 0;
    for (const address of addresses) {
      const [rows] = await db.execute(
        sql`SELECT id FROM account_mail_jobs WHERE quota_key = ${key(`email:${address}`)}`
      );
      queued += (rows as unknown as unknown[]).length;
    }
    expect(queued).toBe(10);
  });

  it("stops admitting requests when the daily service allowance is exhausted", async () => {
    key("ip:fixture-ip");
    key(`email:${email}`);
    const db = (await getDb())!;
    await db.execute(
      sql`INSERT INTO account_mail_quotas (quota_key, used, expires_at) VALUES (${key("global")}, 200, ${new Date(Date.now() + 60_000)})`
    );
    const response = await caller().auth.requestPasswordReset({ email });
    expect(response).toMatchObject({ success: true });
    expect(await recordJobs()).toHaveLength(0);
  });

  const enqueue = async () => {
    key("global");
    key("ip:fixture-ip");
    key(`email:${email}`);
    await caller().auth.requestPasswordReset({ email });
  };
  const readyAgain = async (id: string) => {
    const db = (await getDb())!;
    await db.execute(
      sql`UPDATE account_mail_jobs SET available_at = DATE_SUB(NOW(), INTERVAL 1 SECOND), lease_until = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE id = ${id}`
    );
  };

  it("makes new jobs immediately available even when MySQL rounds fractional seconds", async () => {
    const instant = new Date(Math.floor(Date.now() / 1000) * 1000 + 900);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(instant);
    await enqueue();
    const [job] = await recordJobs();
    const db = (await getDb())!;
    const [rows] = await db.execute(
      sql`SELECT UNIX_TIMESTAMP(available_at) * 1000 AS available_ms FROM account_mail_jobs WHERE id = ${job.id}`
    );
    expect(
      Number(
        (rows as unknown as Array<{ available_ms: number }>)[0].available_ms
      )
    ).toBeLessThanOrEqual(instant.getTime());
  });

  it("issues a usable one-time reset link, records provider acceptance and erases the mail payload", async () => {
    await enqueue();
    const [resetJob] = await recordJobs();
    let outbound: { to: string[]; text: string } | undefined;
    vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
      expect(url).toBe("https://api.resend.com/emails");
      outbound = JSON.parse(options.body as string);
      return new Response(JSON.stringify({ id: "synthetic-mail-ack" }), {
        status: 200,
      });
    });
    expect(typeof queue.processNextAccountMail).toBe("function");
    expect(await queue.processNextAccountMail()).toBe("accepted");
    expect(outbound?.to).toEqual([email]);
    const resetUrl = new URL(outbound!.text.match(/https:\/\/\S+/)![0]);
    expect(resetUrl.origin).toBe("https://example.invalid");
    expect(resetUrl.pathname).toBe("/reset-password");
    expect(resetUrl.search).toBe("");
    const token = new URLSearchParams(resetUrl.hash.slice(1)).get("token")!;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await getUserByOpenId(openId))?.passwordResetToken).toBe(
      createHash("sha256").update(token).digest("hex")
    );
    expect(
      await caller().auth.resetPassword({
        token,
        password: "ReplacementPassword42",
      })
    ).toEqual({ success: true });
    expect(
      (await recordJobs()).find(job => job.id === resetJob.id)
    ).toMatchObject({
      state: "accepted",
      payload: null,
      provider_id: "synthetic-mail-ack",
    });
  });

  const changePassword = async () => {
    key(`email:${email}`);
    const token = "n".repeat(43);
    const db = (await getDb())!;
    await db
      .update(users)
      .set({
        passwordResetToken: createHash("sha256").update(token).digest("hex"),
        passwordResetTokenExpiry: new Date(Date.now() + 60_000),
      })
      .where(eq(users.openId, openId));
    await caller().auth.resetPassword({
      token,
      password: "ReplacementPassword42",
    });
    return token;
  };

  it("delivers a password-change warning without issuing a new reset token or disclosing credentials", async () => {
    const consumedToken = await changePassword();
    let outbound: { to: string[]; subject: string; text: string } | undefined;
    vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      outbound = JSON.parse(options.body as string);
      return new Response(JSON.stringify({ id: "change-notice-ack" }), {
        status: 200,
      });
    });
    expect(await queue.processNextAccountMail()).toBe("accepted");
    expect(outbound?.to).toEqual([email]);
    expect(outbound?.subject).toMatch(/password.*changed/i);
    expect(outbound?.text).toMatch(/did not/i);
    expect(outbound?.text).toContain("https://example.invalid/forgot-password");
    expect(JSON.stringify(outbound)).not.toContain(consumedToken);
    expect(JSON.stringify(outbound)).not.toContain("ReplacementPassword42");
    expect((await getUserByOpenId(openId))?.passwordResetToken).toBeNull();
    expect((await recordJobs())[0]).toMatchObject({
      state: "accepted",
      payload: null,
      provider_id: "change-notice-ack",
    });
  });

  it("retains the exact password-change warning across an ambiguous send and configuration change", async () => {
    await changePassword();
    const requests: Array<{ body: unknown; key: string | null }> = [];
    vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      requests.push({
        body: options.body,
        key: new Headers(options.headers).get("Idempotency-Key"),
      });
      if (requests.length === 1) throw new Error("synthetic_network_failure");
      return new Response(JSON.stringify({ id: "notice-retry-ack" }), {
        status: 200,
      });
    });
    expect(await queue.processNextAccountMail()).toBe("retry");
    const [job] = await recordJobs();
    vi.stubEnv("AUTH_EMAIL_FROM", "changed@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://changed.example.invalid");
    resetConfigForTests();
    await closeDb();
    await readyAgain(job.id);
    expect(await queue.processNextAccountMail()).toBe("accepted");
    expect(requests).toHaveLength(2);
    expect(requests[1]).toEqual(requests[0]);
    expect(requests[0].key).toBe(`account-mail/${job.id}`);
  });

  it.each([false, true])(
    "runs real-server delivery and persists its acknowledgement before shutdown (held response: %s)",
    async holdResponse => {
      await changePassword();
      const probe = createServer();
      await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
      const address = probe.address();
      if (!address || typeof address === "string")
        throw new Error("fixture_port_unavailable");
      const port = address.port;
      await new Promise<void>((resolve, reject) =>
        probe.close(error => (error ? reject(error) : resolve()))
      );
      const child = fork(
        fileURLToPath(
          new URL("./test-fixtures/account-mail-server.ts", import.meta.url)
        ),
        {
          execArgv: ["--import", "tsx"],
          env: {
            ...process.env,
            NODE_ENV: "test",
            APP_MODE: "test",
            HOST: "127.0.0.1",
            PORT: String(port),
            ENABLE_ACCOUNT_MAIL_WORKER: "true",
            HOLD_SYNTHETIC_ACCOUNT_MAIL: String(holdResponse),
          },
          stdio: ["ignore", "pipe", "pipe", "ipc"],
        }
      );
      let startupErrors = "";
      child.stderr?.on("data", chunk => {
        startupErrors = (startupErrors + String(chunk)).slice(-4000);
      });
      let output = "";
      child.stdout?.on("data", chunk => {
        output += String(chunk);
      });
      const exited = new Promise<void>(resolve =>
        child.once("exit", () => resolve())
      );
      try {
        const sent = await new Promise<boolean>((resolve, reject) => {
          const timeout = setTimeout(() => resolve(false), 20_000);
          child.once("error", error => {
            clearTimeout(timeout);
            reject(error);
          });
          child.once("exit", code => {
            clearTimeout(timeout);
            if (code)
              reject(
                new Error(`Synthetic server exited ${code}: ${startupErrors}`)
              );
            else resolve(false);
          });
          child.on("message", message => {
            if (
              (message as { event?: string }).event ===
              "synthetic_account_mail_sent"
            ) {
              clearTimeout(timeout);
              resolve(true);
            }
          });
        });
        expect(sent).toBe(true);
        if (holdResponse) {
          expect((await recordJobs())[0].state).toBe("sending");
          if (process.platform === "win32") child.send("SIGTERM");
          else child.kill("SIGTERM");
          await vi.waitFor(
            () => expect(output).toContain('"event":"shutdown_started"'),
            { timeout: 5_000 }
          );
          expect(child.exitCode).toBe(null);
          expect(child.signalCode).toBe(null);
          child.send("release_synthetic_account_mail");
          await vi.waitFor(
            () => expect(child.exitCode, startupErrors).toBe(0),
            { timeout: 5_000 }
          );
          expect(output).toContain('"event":"shutdown_completed"');
        }
        await vi.waitFor(
          async () => {
            expect((await recordJobs())[0]).toMatchObject({
              state: "accepted",
              payload: null,
              provider_id: "server-worker-fixture-ack",
            });
          },
          { timeout: 5_000 }
        );
      } finally {
        if (child.exitCode === null && child.signalCode === null)
          child.kill("SIGKILL");
        await exited;
      }
    },
    30_000
  );

  it("discards an unknown account without contacting the email provider", async () => {
    const db = (await getDb())!;
    await db.delete(users).where(eq(users.openId, openId));
    await enqueue();
    expect(typeof queue.processNextAccountMail).toBe("function");
    expect(await queue.processNextAccountMail()).toBe("discarded");
    expect((await recordJobs())[0]).toMatchObject({
      state: "discarded",
      payload: null,
    });
  });

  it("retries an ambiguous provider failure with exactly the same body and idempotency key after reconnect", async () => {
    await enqueue();
    const requests: Array<{ body: unknown; key: string | null }> = [];
    vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      requests.push({
        body: options.body,
        key: new Headers(options.headers).get("Idempotency-Key"),
      });
      if (requests.length === 1) throw new Error("synthetic_network_failure");
      return new Response(JSON.stringify({ id: "retry-ack" }), { status: 200 });
    });
    expect(typeof queue.processNextAccountMail).toBe("function");
    expect(await queue.processNextAccountMail()).toBe("retry");
    const [job] = await recordJobs();
    expect(job.payload).not.toContain(email);
    await closeDb();
    await readyAgain(job.id);
    expect(await queue.processNextAccountMail()).toBe("accepted");
    expect(requests).toHaveLength(2);
    expect(requests[0].key).toBe(`account-mail/${job.id}`);
    expect(requests[1]).toEqual(requests[0]);
  });

  it("allows only one worker to send a claimed request", async () => {
    await enqueue();
    let sends = 0;
    vi.stubGlobal("fetch", async () => {
      sends++;
      return new Response(JSON.stringify({ id: "concurrent-ack" }), {
        status: 200,
      });
    });
    expect(typeof queue.processNextAccountMail).toBe("function");
    const outcomes = await Promise.all([
      queue.processNextAccountMail(),
      queue.processNextAccountMail(),
    ]);
    expect(outcomes.sort()).toEqual(["accepted", "idle"]);
    expect(sends).toBe(1);
  });

  it("recovers an expired lease after acknowledgement persistence fails without changing the message", async () => {
    await enqueue();
    const requests: Array<{ body: unknown; key: string | null }> = [];
    const db = (await getDb())!;
    vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      requests.push({
        body: options.body,
        key: new Headers(options.headers).get("Idempotency-Key"),
      });
      if (requests.length === 1) {
        // The claim and token have committed. Fail only the subsequent top-level
        // acknowledgement write; all transaction and retry queries remain real.
        vi.spyOn(db, "update").mockImplementationOnce(() => {
          throw new Error("synthetic_ack_storage_failure");
        });
      }
      return new Response(JSON.stringify({ id: "lease-recovery-ack" }), {
        status: 200,
      });
    });
    await expect(queue.processNextAccountMail()).rejects.toThrow(
      "synthetic_ack_storage_failure"
    );
    const [job] = await recordJobs();
    expect(job.state).toBe("sending");
    await closeDb();
    await readyAgain(job.id);
    expect(await queue.processNextAccountMail()).toBe("accepted");
    expect(requests).toHaveLength(2);
    expect(requests[1]).toEqual(requests[0]);
  });

  it("does not accept a missing provider acknowledgement and stops after bounded retries", async () => {
    await enqueue();
    const [job] = await recordJobs();
    let sends = 0;
    vi.stubGlobal("fetch", async () => {
      sends++;
      return new Response(JSON.stringify({}), { status: 200 });
    });
    for (let attempt = 0; attempt < 4; attempt++) {
      expect(await queue.processNextAccountMail()).toBe("retry");
      await readyAgain(job.id);
    }
    expect(await queue.processNextAccountMail()).toBe("failed");
    expect((await recordJobs())[0]).toMatchObject({
      state: "failed",
      payload: null,
      provider_id: null,
    });
    await readyAgain(job.id);
    expect(await queue.processNextAccountMail()).toBe("idle");
    expect(sends).toBe(5);
  });

  it("does not send expired recovery jobs", async () => {
    await enqueue();
    const [job] = await recordJobs();
    const db = (await getDb())!;
    await db.execute(
      sql`UPDATE account_mail_jobs SET expires_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE id = ${job.id}`
    );
    expect(typeof queue.processNextAccountMail).toBe("function");
    expect(await queue.processNextAccountMail()).toBe("discarded");
    expect((await recordJobs())[0].payload).toBeNull();
  });

  it("fails closed on tampered encrypted queue contents", async () => {
    await enqueue();
    const [job] = await recordJobs();
    const db = (await getDb())!;
    await db.execute(
      sql`UPDATE account_mail_jobs SET payload = 'v1.invalid.invalid.invalid' WHERE id = ${job.id}`
    );
    expect(typeof queue.processNextAccountMail).toBe("function");
    expect(await queue.processNextAccountMail()).toBe("failed");
    expect((await recordJobs())[0]).toMatchObject({
      state: "failed",
      payload: null,
    });
  });

  it("starts the lease after a delayed transaction rather than before connection acquisition", async () => {
    const started = new Date(Math.floor(Date.now() / 1000) * 1000);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(started);
    await enqueue();
    const [job] = await recordJobs();
    const db = (await getDb())!;
    const delayed = new Date(started.getTime() + 61_000);
    const realTransaction = db.transaction.bind(db);
    // Keep all real MySQL behavior; only advance the clock at the pool boundary.
    vi.spyOn(db, "transaction").mockImplementationOnce(callback =>
      realTransaction(async tx => {
        vi.setSystemTime(delayed);
        return callback(tx);
      })
    );
    let leaseMs = 0;
    vi.stubGlobal("fetch", async () => {
      const [rows] = await db.execute(
        sql`SELECT UNIX_TIMESTAMP(lease_until) * 1000 AS lease_ms FROM account_mail_jobs WHERE id = ${job.id}`
      );
      leaseMs = Number(
        (rows as unknown as Array<{ lease_ms: number }>)[0].lease_ms
      );
      return new Response(JSON.stringify({ id: "delayed-claim-ack" }), {
        status: 200,
      });
    });
    expect(await queue.processNextAccountMail()).toBe("accepted");
    expect(leaseMs).toBeGreaterThan(delayed.getTime());
  });

  it("rechecks expiry after a delayed transaction before issuing a token or sending", async () => {
    const started = new Date(Math.floor(Date.now() / 1000) * 1000);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(started);
    await enqueue();
    const [job] = await recordJobs();
    const db = (await getDb())!;
    await db.execute(
      sql`UPDATE account_mail_jobs SET expires_at = ${new Date(started.getTime() + 1_000)} WHERE id = ${job.id}`
    );
    const realTransaction = db.transaction.bind(db);
    vi.spyOn(db, "transaction").mockImplementationOnce(callback =>
      realTransaction(async tx => {
        vi.setSystemTime(new Date(started.getTime() + 2_000));
        return callback(tx);
      })
    );
    expect(await queue.processNextAccountMail()).toBe("discarded");
    expect((await getUserByOpenId(openId))?.passwordResetToken).toBeNull();
  });
});
