import "dotenv/config";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRuntimeSupervisor } from "../server/runtime-supervisor";
import { startupMigrationArguments } from "../server/migration-startup-mode";

let migrationArguments: string[];
try {
  migrationArguments = startupMigrationArguments(
    process.env.STARTUP_MIGRATION_MODE
  );
} catch {
  console.error(
    JSON.stringify({
      level: "fatal",
      event: "runtime_failed",
      code: "runtime_migration_mode_invalid",
    })
  );
  process.exit(1);
}

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
        ...(phase === "migration" ? migrationArguments : []),
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
