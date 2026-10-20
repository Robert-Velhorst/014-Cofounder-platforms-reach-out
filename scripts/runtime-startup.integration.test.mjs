import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";
import { assertCancelledMigrationReleased } from "./runtime-startup-observation.mjs";

function docker(...args) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 2 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    `synthetic_docker_operation_failed: ${result.stderr}`,
  );
  return result.stdout.trim();
}
const pause = () => new Promise((resolve) => setTimeout(resolve, 200));
async function eventually(check, timeoutMs, message) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await pause();
  }
  assert.fail(message);
}

test(
  "default runtime cancels locked migration on TERM/INT, then starts and drains normally",
  { timeout: 180000 },
  async () => {
    // Resolve installed artifacts, never pull or replace another running service.
    const runtimeImage = docker(
      "image",
      "inspect",
      process.env.RUNTIME_STARTUP_TEST_IMAGE ||
        "cofounder-recovery-runtime:local",
      "--format",
      "{{.Id}}",
    );
    const databaseImage = docker(
      "image",
      "inspect",
      process.env.RUNTIME_STARTUP_DATABASE_IMAGE || getCiMysqlImage(),
      "--format",
      "{{.Id}}",
    );
    for (const image of [runtimeImage, databaseImage])
      assert.match(image, /^sha256:[a-f0-9]{64}$/);
    const imageConfig = JSON.parse(docker("image", "inspect", runtimeImage))[0];
    assert.deepEqual(imageConfig.Config.Cmd, ["node", "dist/start-runtime.js"]);
    assert.equal(imageConfig.Config.User, "node");
    const suffix = randomUUID().slice(0, 8),
      owned = [];
    const password = "synthetic-runtime-startup-fixture-only";
    const dbName = `cofounder-startup-db-${suffix}`;
    const url = `mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`;
    let primary;
    const bounds = [
      "--pull=never",
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--cpus",
      "1",
      "--memory",
      "1g",
      "--memory-swap",
      "1g",
      "--pids-limit",
      "128",
      "--label",
      `cofounder.synthetic-owner=${suffix}`,
    ];
    function own(id, role) {
      owned.push({ id, role });
      return id;
    }
    function state(id) {
      return JSON.parse(docker("inspect", id))[0];
    }
    function assertStopped(id) {
      const info = state(id);
      assert.equal(info.State.Running, false);
      assert.equal(info.State.ExitCode, 0);
      assert.equal(info.State.OOMKilled, false);
    }
    function startApp(role) {
      return own(
        docker(
          "run",
          "-d",
          "--name",
          `cofounder-startup-${role}-${suffix}`,
          ...bounds,
          "--user",
          "1000:1000",
          "--network",
          `container:${dbName}`,
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
          "-e",
          `DATABASE_URL=${url}`,
          "-e",
          "JWT_SECRET=synthetic-startup-session-key-not-for-production",
          "-e",
          "NODE_ENV=production",
          "-e",
          "APP_MODE=production",
          "-e",
          "HOST=127.0.0.1",
          "-e",
          "PORT=13219",
          "-e",
          "PUBLIC_ORIGIN=http://127.0.0.1:13219",
          "-e",
          "ENABLE_REGISTRATION=false",
          "-e",
          "ENABLE_ACCOUNT_MAIL_WORKER=false",
          "-e",
          "ENABLE_ACCOUNT_MAIL_RETENTION=false",
          "-e",
          "ENABLE_PLATFORM_AUTOMATION=false",
          "-e",
          "ENABLE_UNSAFE_LEGACY_ROUTES=false",
          "-e",
          "ENABLE_OWNER_NOTIFICATIONS=false",
          "-e",
          "OUTREACH_PAUSED=true",
          runtimeImage,
        ),
        "app",
      );
    }
    try {
      const db = own(
        docker(
          "run",
          "-d",
          "--name",
          dbName,
          ...bounds,
          "--user",
          "999:999",
          "--network",
          "none",
          "--tmpfs",
          "/var/lib/mysql:rw,noexec,nosuid,size=768m,mode=1777",
          "--tmpfs",
          "/var/run/mysqld:rw,noexec,nosuid,size=16m,mode=1777",
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
          "-e",
          "MYSQL_DATABASE=cofounder_test",
          "-e",
          "MYSQL_USER=cofounder",
          "-e",
          `MYSQL_PASSWORD=${password}`,
          "-e",
          `MYSQL_ROOT_PASSWORD=${password}`,
          databaseImage,
        ),
        "db",
      );
      await eventually(
        () =>
          spawnSync(
            "docker",
            [
              "exec",
              db,
              "mysql",
              "--no-defaults",
              "--protocol=TCP",
              "-h127.0.0.1",
              "-ucofounder",
              `--password=${password}`,
              "cofounder_test",
              "-e",
              "SELECT 1",
            ],
            { encoding: "utf8", timeout: 3000 },
          ).status === 0,
        45000,
        "synthetic_database_not_ready",
      );
      const probePath = fileURLToPath(
        new URL("./runtime-startup-probe.mjs", import.meta.url),
      );
      const holder = own(
        docker(
          "run",
          "-d",
          "--name",
          `cofounder-startup-holder-${suffix}`,
          ...bounds,
          "--user",
          "1000:1000",
          "--network",
          `container:${dbName}`,
          "-e",
          `DATABASE_URL=${url}`,
          "--mount",
          `type=bind,source=${probePath},target=/app/runtime-startup-probe.mjs,readonly`,
          "--entrypoint",
          "node",
          runtimeImage,
          "/app/runtime-startup-probe.mjs",
          "hold",
        ),
        "holder",
      );
      await eventually(
        () => docker("logs", holder).includes("synthetic_lock_held"),
        15000,
        "synthetic_lock_not_held",
      );
      const observe = () =>
        JSON.parse(
          docker(
            "exec",
            holder,
            "node",
            "/app/runtime-startup-probe.mjs",
            "observe",
          ),
        );
      for (const signal of ["SIGTERM", "SIGINT"]) {
        const app = startApp(signal.toLowerCase());
        await eventually(
          () => {
            const result = observe();
            assert.equal(result.tables, 0);
            assert.equal(result.otherConnectionOwnsLock, true);
            return result.waiting === 1;
          },
          15000,
          "real_migrator_not_waiting",
        );
        const cancellationDeadline = Date.now() + 3000;
        if (signal === "SIGTERM") docker("stop", "--timeout", "3", app);
        else {
          docker("kill", "--signal", "SIGINT", app);
          await eventually(
            () => !state(app).State.Running,
            Math.max(0, cancellationDeadline - Date.now()),
            "interrupt_did_not_stop_runtime",
          );
        }
        assertStopped(app);
        const logs = docker("logs", app);
        assert.doesNotMatch(logs, /server_started|migrations_applied/);
        assert.match(logs, /"event":"runtime_stopped","phase":"migration"/);
        await assertCancelledMigrationReleased({
          observe,
          deadline: cancellationDeadline,
        });
        console.log(
          JSON.stringify({
            checkpoint: "locked_migration_cancelled",
            signal,
            app,
            noDDL: true,
            cancellationBudgetMs: 3000,
            cancellationElapsedMs: Date.now() - (cancellationDeadline - 3000),
          }),
        );
      }
      docker("stop", "--timeout", "10", holder);
      assertStopped(holder);
      const active = startApp("active");
      await eventually(
        () => docker("logs", active).includes('"event":"server_started"'),
        45000,
        "actual_runtime_not_started",
      );
      // Real HTTP from within the network-isolated runtime, not a substituted API.
      docker(
        "exec",
        active,
        "node",
        "--input-type=module",
        "-e",
        "import assert from 'node:assert/strict'; for(const [path,status] of [['health','ok'],['ready','ready']]) { const r=await fetch('http://127.0.0.1:13219/api/'+path); assert.equal(r.status,200); assert.equal((await r.json()).status,status); }",
      );
      docker("stop", "--timeout", "30", active);
      assertStopped(active);
      const logs = docker("logs", active);
      assert.match(logs, /"event":"shutdown_completed"/);
      assert.match(logs, /"event":"runtime_stopped","phase":"server"/);
      console.log(
        JSON.stringify({
          checkpoint: "actual_default_startup_health_readiness_drain",
          active,
          runtimeImage,
          databaseImage,
          sourceMounts: 0,
          publicPorts: 0,
        }),
      );
    } catch (error) {
      primary = error;
      throw error;
    } finally {
      const errors = [];
      for (const fixture of owned.reverse()) {
        try {
          const info = state(fixture.id);
          assert.equal(info.Config.Labels["cofounder.synthetic-owner"], suffix);
          assert.deepEqual(info.HostConfig.PortBindings || {}, {});
          assert.equal(info.Mounts.length, fixture.role === "holder" ? 1 : 0);
          if (fixture.role === "holder") {
            assert.equal(info.Mounts[0].RW, false);
            assert.equal(
              info.Mounts[0].Destination,
              "/app/runtime-startup-probe.mjs",
            );
          }
          if (info.State.Running) docker("stop", "--timeout", "30", fixture.id);
          const final = state(fixture.id).State;
          console.log(
            JSON.stringify({
              id: fixture.id,
              role: fixture.role,
              running: final.Running,
              exit: final.ExitCode,
              oom: final.OOMKilled,
            }),
          );
          assert.equal(final.Running, false);
          assert.equal(final.OOMKilled, false);
          if (!primary) assert.equal(final.ExitCode, 0);
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length) {
        if (primary) console.error("owned_runtime_startup_cleanup_failed");
        else
          throw new AggregateError(
            errors,
            "owned_runtime_startup_cleanup_failed",
          );
      }
    }
  },
);
