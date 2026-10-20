// Test-package observation only, against the owned isolated restored database.
// This is not a live email acceptance test and never permits external fetches.
import assert from "node:assert/strict";
let phase = "fixture_configuration";
let closeDb;
async function main() {
  assert.equal(process.env.RECOVERY_MAIL_FIXTURE, "isolated-synthetic-restore");
  assert.equal(process.getuid(), 1000);
  assert.equal(process.env.NODE_ENV, "production");
  assert.equal(process.env.RESEND_API_KEY, "synthetic-recovery-no-provider");
  assert.match(
    process.env.DATABASE_URL ?? "",
    /^mysql:\/\/cofounder:[a-z-]+@127\.0\.0\.1:3306\/cofounder_test$/,
  );
  let providerAttempts = 0;
  globalThis.fetch = async () => {
    providerAttempts++;
    throw new Error("external_transport_forbidden");
  };
  const data = await import("/app/apps/cofounder-discovery/server/db.ts");
  closeDb = data.closeDb;
  const { processNextAccountMail } =
    await import("/app/apps/cofounder-discovery/server/account-mail-queue.ts");
  phase = "restored_queue_processing";
  for (let i = 0; i < 4; i++)
    assert.equal(await processNextAccountMail(), "discarded");
  assert.equal(await processNextAccountMail(), "idle");
  assert.equal(providerAttempts, 0);
  console.log(
    JSON.stringify({
      event: "restored_mail_worker_passed",
      discardedJobs: 4,
      providerAttempts: 0,
      syntheticTransportGuard: true,
      testPackageWorker: true,
    }),
  );
}
main()
  .catch(() => {
    console.error(
      JSON.stringify({ event: "restored_mail_worker_failed", phase }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (closeDb) await closeDb();
  });
