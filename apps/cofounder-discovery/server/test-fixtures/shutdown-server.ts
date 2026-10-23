// Windows cannot deliver POSIX signals to child Node processes. Only this test
// fixture translates IPC into the same process event; Linux tests use OS signals.
export {};
console.log("shutdown_fixture_loaded");
process.on("message", message => {
  if (message === "SIGTERM" || message === "SIGINT") process.emit(message);
});
const serverModule =
  process.env.SHUTDOWN_TEST_COMPILED === "true"
    ? "../../dist/index.js"
    : "../_core/index";
void import(serverModule).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
