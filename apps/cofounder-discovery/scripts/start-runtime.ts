import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRuntimeSupervisor } from "../server/runtime-supervisor";

const runtime = createRuntimeSupervisor({
  launch: phase =>
    spawn(
      process.execPath,
      [
        fileURLToPath(
          new URL(
            phase === "migration" ? "./migrate.js" : "./index.js",
            import.meta.url
          )
        ),
      ],
      { stdio: "inherit" }
    ),
  report: event =>
    console.log(
      JSON.stringify({
        level: event.event === "runtime_failed" ? "error" : "info",
        ...event,
      })
    ),
});
const term = () => runtime.stop("SIGTERM");
const interrupt = () => runtime.stop("SIGINT");
process.on("SIGTERM", term);
process.on("SIGINT", interrupt);
void runtime
  .run()
  .then(code => {
    process.exitCode = code;
  })
  .catch(() => {
    console.error(
      JSON.stringify({
        level: "fatal",
        event: "runtime_failed",
        code: "unexpected_failure",
      })
    );
    process.exitCode = 1;
  })
  .finally(() => {
    process.removeListener("SIGTERM", term);
    process.removeListener("SIGINT", interrupt);
  });
