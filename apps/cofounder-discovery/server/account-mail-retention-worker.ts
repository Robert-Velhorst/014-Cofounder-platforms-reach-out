import { getConfig, type RuntimeConfig } from "./config";
import { cleanupAccountMail } from "./account-mail-retention";

/** Independent of sending: expired payloads still need cleanup during outages. */
export function startAccountMailRetentionWorker(
  config: RuntimeConfig = getConfig()
) {
  let stopped = !config.ENABLE_ACCOUNT_MAIL_RETENTION;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: Promise<void> | undefined;
  async function run() {
    try {
      const result = await cleanupAccountMail();
      if (result.expiredJobs || result.deletedJobs || result.deletedQuotas)
        console.log(
          JSON.stringify({
            level: "info",
            event: "account_mail_retention_completed",
            expiredJobs: result.expiredJobs,
            deletedJobs: result.deletedJobs,
            deletedQuotas: result.deletedQuotas,
          })
        );
    } catch {
      console.error(
        JSON.stringify({
          level: "error",
          event: "account_mail_retention_failed",
        })
      );
    } finally {
      if (!stopped) {
        timer = setTimeout(() => {
          active = run();
        }, 60_000);
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
