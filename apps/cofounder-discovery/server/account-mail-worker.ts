import { getConfig, type RuntimeConfig } from "./config";
import { processNextAccountMail } from "./account-mail-queue";

/** One serial, bounded pump per process; database leases coordinate replicas. */
export function startAccountMailWorker(config: RuntimeConfig = getConfig()) {
  let stopped = !config.ENABLE_ACCOUNT_MAIL_WORKER;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: Promise<void> | undefined;

  async function run() {
    try {
      for (let count = 0; !stopped && count < 25; count++) {
        const status = await processNextAccountMail();
        if (status === "idle" || status === "budget_limited") break;
      }
    } catch {
      // Database and provider errors may contain addresses or token-bearing
      // payloads. Emit an actionable event, never the underlying error object.
      console.error(
        JSON.stringify({ level: "error", event: "account_mail_worker_failed" })
      );
    } finally {
      if (!stopped) {
        timer = setTimeout(() => {
          active = run();
        }, 5_000);
        timer.unref();
      }
    }
  }

  if (!stopped) active = run();
  return {
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      await active;
    },
  };
}
