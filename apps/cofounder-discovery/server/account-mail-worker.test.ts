import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "./config";

const queue = vi.hoisted(() => ({ processNextAccountMail: vi.fn() }));
vi.mock("./account-mail-queue", () => queue);

const enabledEnv = {
  NODE_ENV: "test",
  ENABLE_ACCOUNT_MAIL_WORKER: "true",
  DATABASE_URL: "mysql://example.invalid/test",
  AUTH_MAIL_ENCRYPTION_SECRET: "synthetic-queue-encryption-secret-for-tests",
  RESEND_API_KEY: "synthetic-key",
  AUTH_EMAIL_FROM: "sender@example.invalid",
  PUBLIC_ORIGIN: "https://example.invalid",
};

describe("account mail background lifecycle", () => {
  it.each([
    "mailto:operator@example.invalid",
    "ftp://example.invalid",
    "https://name:password@example.invalid",
    "https://example.invalid/application",
    "https://example.invalid/?token=private",
    "https://example.invalid/#token=private",
  ])("rejects an unsafe or non-origin application URL: %s", origin => {
    expect(() => getConfig({ ...enabledEnv, PUBLIC_ORIGIN: origin })).toThrow(
      /PUBLIC_ORIGIN/
    );
  });

  it("normalizes a permitted origin so a trailing slash cannot break same-origin requests", () => {
    expect(
      getConfig({
        ...enabledEnv,
        PUBLIC_ORIGIN: "https://EXAMPLE.invalid:443/",
      }).PUBLIC_ORIGIN
    ).toBe("https://example.invalid");
  });

  it("requires HTTPS for a non-local production origin", () => {
    expect(() =>
      getConfig({
        ...enabledEnv,
        NODE_ENV: "production",
        JWT_SECRET: "synthetic-session-secret-for-production-tests",
        PUBLIC_ORIGIN: "http://example.invalid",
      })
    ).toThrow(/PUBLIC_ORIGIN/);
  });

  it("reports invalid production origins as configuration errors", () => {
    expect(() =>
      getConfig({
        ...enabledEnv,
        NODE_ENV: "production",
        JWT_SECRET: "synthetic-session-secret-for-production-tests",
        PUBLIC_ORIGIN: "mailto:operator@example.invalid",
      })
    ).toThrow(/PUBLIC_ORIGIN/);
  });

  it("permits HTTP only for loopback production smoke tests", () => {
    expect(
      getConfig({
        ...enabledEnv,
        NODE_ENV: "production",
        JWT_SECRET: "synthetic-session-secret-for-production-tests",
        PUBLIC_ORIGIN: "http://127.0.0.1:3014",
      }).PUBLIC_ORIGIN
    ).toBe("http://127.0.0.1:3014");
  });

  let worker: { stop(): Promise<void> } | undefined;
  beforeEach(() => {
    vi.useFakeTimers();
    queue.processNextAccountMail.mockReset().mockResolvedValue("idle");
  });
  afterEach(async () => {
    await worker?.stop();
    worker = undefined;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  const start = async (env: NodeJS.ProcessEnv = enabledEnv) => {
    const modulePath = "./account-mail-worker";
    const module = await import(modulePath).catch(() => null);
    expect(typeof module?.startAccountMailWorker).toBe("function");
    worker = module.startAccountMailWorker(getConfig(env));
    return worker!;
  };

  it("does not schedule or touch account storage when disabled and unconfigured", async () => {
    await start({ NODE_ENV: "test" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(queue.processNextAccountMail).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    "DATABASE_URL",
    "AUTH_MAIL_ENCRYPTION_SECRET",
    "RESEND_API_KEY",
    "AUTH_EMAIL_FROM",
    "PUBLIC_ORIGIN",
  ])("rejects enabling delivery without %s", field => {
    expect(() => getConfig({ ...enabledEnv, [field]: "" })).toThrow(
      new RegExp(field)
    );
  });

  it("processes immediately and never overlaps a slow job", async () => {
    let finish!: (status: string) => void;
    queue.processNextAccountMail.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    await start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(1);
    finish("idle");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(2);
    await worker!.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits for the in-flight job on shutdown and admits no further job", async () => {
    let finish!: (status: string) => void;
    queue.processNextAccountMail.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const started = await start();
    let stopped = false;
    const stopping = started.stop().then(() => {
      stopped = true;
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(stopped).toBe(false);
    finish("accepted");
    await stopping;
    expect(stopped).toBe(true);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("recovers from a task exception without logging private details", async () => {
    queue.processNextAccountMail.mockRejectedValueOnce(
      new Error("private-mail-token-and-address")
    );
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    await start();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(2);
    expect(errors.mock.calls).toEqual([
      [JSON.stringify({ level: "error", event: "account_mail_worker_failed" })],
    ]);
  });

  it("yields between bounded batches even when work remains", async () => {
    queue.processNextAccountMail.mockResolvedValue("accepted");
    await start();
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(25);
    await worker!.stop();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(25);
  });
  it("ends the batch when shared sending budget is exhausted", async () => {
    queue.processNextAccountMail.mockResolvedValue("budget_limited");
    await start();
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(queue.processNextAccountMail).toHaveBeenCalledTimes(2);
  });
});
