import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "./config";
import * as retention from "./account-mail-retention";
const enabled = {
  NODE_ENV: "test",
  DATABASE_URL: "mysql://synthetic.invalid/test",
  ENABLE_ACCOUNT_MAIL_RETENTION: "true",
};
let worker: { stop(): Promise<void> } | undefined;
async function start(env: NodeJS.ProcessEnv = enabled) {
  const path = "./account-mail-retention-worker",
    module = await import(path).catch(() => null);
  expect(typeof module?.startAccountMailRetentionWorker).toBe("function");
  return (worker = module.startAccountMailRetentionWorker(getConfig(env)));
}
describe("opt-in retention worker lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(retention, "cleanupAccountMail").mockResolvedValue({
      status: "completed",
      expiredJobs: 0,
      deletedJobs: 0,
      deletedQuotas: 0,
    });
  });
  afterEach(async () => {
    await worker?.stop();
    worker = undefined;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it("requires a database but no sending credentials for retention", () => {
    expect(() => getConfig({ ...enabled, DATABASE_URL: "" })).toThrow(
      /DATABASE_URL/
    );
    expect(getConfig(enabled).ENABLE_ACCOUNT_MAIL_WORKER).toBe(false);
  });
  it("is inert by default even when mail delivery is disabled", async () => {
    await start({ NODE_ENV: "test" });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(retention.cleanupAccountMail).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("runs immediately then once per minute without a mail provider", async () => {
    await start();
    await vi.advanceTimersByTimeAsync(0);
    expect(retention.cleanupAccountMail).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(59_999);
    expect(retention.cleanupAccountMail).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(retention.cleanupAccountMail).toHaveBeenCalledTimes(2);
  });
  it("drains a slow cleanup on stop and never overlaps or reschedules it", async () => {
    let finish!: () => void;
    vi.mocked(retention.cleanupAccountMail).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = () =>
            resolve({
              status: "completed",
              expiredJobs: 1,
              deletedJobs: 0,
              deletedQuotas: 0,
            });
        })
    );
    await start();
    await vi.advanceTimersByTimeAsync(180_000);
    expect(retention.cleanupAccountMail).toHaveBeenCalledTimes(1);
    let stopped = false;
    const stopping = worker!.stop().then(() => {
      stopped = true;
    });
    await vi.advanceTimersByTimeAsync(1);
    expect(stopped).toBe(false);
    finish();
    await stopping;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(retention.cleanupAccountMail).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("logs only a sanitized failure and retries at the normal interval", async () => {
    vi.mocked(retention.cleanupAccountMail).mockRejectedValueOnce(
      new Error("private-token-address-database-url")
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(retention.cleanupAccountMail).toHaveBeenCalledTimes(2);
    expect(log.mock.calls).toEqual([
      [
        JSON.stringify({
          level: "error",
          event: "account_mail_retention_failed",
        }),
      ],
    ]);
  });
});
