// Synthetic transport for the real-server integration test. This module is
// never imported by the application or included in its production entrypoint.
export {};
process.on("message", message => {
  // POSIX signals are delivered by the OS in Linux acceptance runs.
  if (message === "SIGTERM" && process.platform === "win32")
    process.emit("SIGTERM");
});
globalThis.fetch = async () => {
  process.send?.({ event: "synthetic_account_mail_sent" });
  if (process.env.HOLD_SYNTHETIC_ACCOUNT_MAIL === "true") {
    await new Promise<void>(resolve => {
      const release = (message: unknown) => {
        if (message !== "release_synthetic_account_mail") return;
        process.off("message", release);
        resolve();
      };
      process.on("message", release);
    });
  }
  return new Response(JSON.stringify({ id: "server-worker-fixture-ack" }), {
    status: 200,
  });
};
void import("../_core/index").catch(error => {
  console.error(error);
  process.exitCode = 1;
});
