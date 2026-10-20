import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";

test(
  "actual runtime rejects excess authentication before DB work and retains disconnected work until settlement",
  { timeout: 180000 },
  async () => {
    const owner = randomUUID(),
      owned = [];
    let primary;
    function docker(...args) {
      const result = spawnSync("docker", args, {
        encoding: "utf8",
        timeout: 60000,
        maxBuffer: 1024 * 1024,
      });
      if (result.status !== 0) {
        // Probe emits phase-only failures, never expose arbitrary Docker stderr.
        if (result.stdout) console.log(result.stdout);
        throw new Error("owned_authentication_fixture_operation_failed");
      }
      return result.stdout.trim();
    }
    // Resolve existing local artifacts before creating any fixture; never pull.
    const runtime = docker(
      "image",
      "inspect",
      process.env.AUTH_ADMISSION_RUNTIME_IMAGE ||
        "cofounder-recovery-runtime:local",
      "--format",
      "{{.Id}}",
    );
    const database = docker(
      "image",
      "inspect",
      process.env.AUTH_ADMISSION_DATABASE_IMAGE || getCiMysqlImage(),
      "--format",
      "{{.Id}}",
    );
    for (const image of [runtime, database])
      assert.match(image, /^sha256:[a-f0-9]{64}$/);
    const temporaryRoot = realpathSync(tmpdir());
    const directory = mkdtempSync(
      join(temporaryRoot, "cofounder-auth-admission-"),
    );
    const password = "synthetic-auth-admission-only-password";
    writeFileSync(
      join(directory, "database-url"),
      `mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`,
      { mode: 0o600 },
    );
    writeFileSync(
      join(directory, "jwt-secret"),
      "synthetic-auth-admission-session-key-" + randomUUID(),
      { mode: 0o600 },
    );
    const helper = fileURLToPath(
      new URL("./authentication-admission-probe.mjs", import.meta.url),
    );
    const bounds = [
      "--pull=never",
      "--label",
      `cofounder.synthetic-owner=${owner}`,
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--cpus",
      "1",
      "--pids-limit",
      "256",
    ];
    const secrets = [
      "--mount",
      `type=bind,src=${join(directory, "database-url")},dst=/run/secrets/database_url,readonly`,
      "--mount",
      `type=bind,src=${join(directory, "jwt-secret")},dst=/run/secrets/jwt_secret,readonly`,
    ];
    const create = (role, args) => {
      const id = docker(...args);
      assert.match(id, /^[a-f0-9]{64}$/);
      owned.push({ id, role });
      return id;
    };
    try {
      const db = create("database", [
        "run",
        "-d",
        "--name",
        `cofounder-auth-db-${owner}`,
        ...bounds,
        "--network",
        "none",
        "--user",
        "999:999",
        "--memory",
        "2g",
        "--memory-swap",
        "2g",
        "--tmpfs",
        "/var/lib/mysql:rw,noexec,nosuid,size=1g,mode=1777",
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
        database,
      ]);
      let ready = false;
      for (let attempt = 0; attempt < 150; attempt++) {
        const result = spawnSync(
          "docker",
          [
            "exec",
            db,
            "mysql",
            "--protocol=TCP",
            "-h127.0.0.1",
            "-ucofounder",
            `--password=${password}`,
            "cofounder_test",
            "-e",
            "SELECT 1",
          ],
          { timeout: 3000, encoding: "utf8" },
        );
        if (result.status === 0) {
          ready = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      assert.ok(ready, "isolated_database_not_ready");
      // The production runtime intentionally refuses to serve an unmigrated
      // schema. Apply the image's bundled migrations only to this disposable,
      // network-isolated MySQL instance before exercising login admission.
      docker(
        "run",
        "--rm",
        ...bounds,
        "--network",
        `container:${db}`,
        "--user",
        "1000:1000",
        "--memory",
        "512m",
        "--memory-swap",
        "512m",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
        ...secrets,
        "-e",
        "DATABASE_URL_FILE=/run/secrets/database_url",
        "--entrypoint",
        "node",
        runtime,
        "dist/migrate.js",
      );
      const app = create("runtime", [
        "run",
        "-d",
        "--name",
        `cofounder-auth-app-${owner}`,
        ...bounds,
        "--network",
        `container:${db}`,
        "--user",
        "1000:1000",
        "--memory",
        "512m",
        "--memory-swap",
        "512m",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
        ...secrets,
        ...[
          "NODE_ENV=production",
          "APP_MODE=production",
          "PORT=13218",
          "HOST=127.0.0.1",
          "PUBLIC_ORIGIN=http://127.0.0.1:13218",
          "TRUST_PROXY=false",
          "DATABASE_URL_FILE=/run/secrets/database_url",
          "JWT_SECRET_FILE=/run/secrets/jwt_secret",
          "API_MAX_ACTIVE_WORK=2",
          "ENABLE_REGISTRATION=false",
          "ENABLE_ACCOUNT_MAIL_WORKER=false",
          "ENABLE_ACCOUNT_MAIL_RETENTION=false",
          "ENABLE_ACCOUNT_DELETION_WORKER=false",
          "ENABLE_PLATFORM_AUTOMATION=false",
          "ENABLE_UNSAFE_LEGACY_ROUTES=false",
          "ENABLE_OWNER_NOTIFICATIONS=false",
          "OUTREACH_PAUSED=true",
          "OPENAI_API_KEY=",
          "RESEND_API_KEY=",
          "NODE_OPTIONS=--max-old-space-size=320",
        ].flatMap((value) => ["-e", value]),
        runtime,
      ]);
      const probe = create("probe", [
        "create",
        "--name",
        `cofounder-auth-probe-${owner}`,
        ...bounds,
        "--network",
        `container:${db}`,
        "--user",
        "1000:1000",
        "--memory",
        "512m",
        "--memory-swap",
        "512m",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
        ...secrets,
        "--mount",
        `type=bind,src=${helper},dst=/qa/authentication-admission-probe.mjs,readonly`,
        "-e",
        "AUTH_ADMISSION_FIXTURE=isolated-synthetic-mysql",
        "-e",
        "DATABASE_URL_FILE=/run/secrets/database_url",
        "-e",
        "NODE_OPTIONS=--max-old-space-size=320",
        "--entrypoint",
        "node",
        runtime,
        "/qa/authentication-admission-probe.mjs",
      ]);
      console.log(
        JSON.stringify({
          event: "authentication_fixture_created",
          owner,
          runtime,
          database,
          db,
          app,
          probe,
          publicPorts: 0,
          applicationReplacementMounts: 0,
          configuredSlots: 2,
        }),
      );
      const observations = docker("start", "--attach", probe);
      const stages = observations
        .split(/\r?\n/)
        .map((line) => JSON.parse(line));
      assert.deepEqual(
        stages.map((stage) => stage.event),
        [
          "authentication_admission_before_database",
          "disconnected_authentication_stays_counted",
          "authentication_admission_passed",
        ],
      );
      assert.equal(stages[2].providerActions, 0);
      assert.equal(stages[2].healthAndReadiness, true);
      console.log(observations);
    } catch (error) {
      primary = error;
      throw error;
    } finally {
      const failures = [];
      for (const fixture of [...owned].reverse()) {
        try {
          const model = JSON.parse(docker("inspect", fixture.id))[0];
          assert.equal(model.Id, fixture.id);
          assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
          assert.equal(
            model.Image,
            fixture.role === "database" ? database : runtime,
          );
          assert.deepEqual(model.HostConfig.PortBindings || {}, {});
          assert.equal(model.HostConfig.ReadonlyRootfs, true);
          assert.equal(model.HostConfig.NanoCpus, 1000000000);
          assert.equal(model.HostConfig.PidsLimit, 256);
          assert.equal(
            model.Config.User,
            fixture.role === "database" ? "999:999" : "1000:1000",
          );
          assert.equal(
            model.HostConfig.Memory,
            fixture.role === "database" ? 2147483648 : 536870912,
          );
          assert.equal(model.HostConfig.MemorySwap, model.HostConfig.Memory);
          assert.ok(model.HostConfig.CapDrop.includes("ALL"));
          assert.ok(model.HostConfig.SecurityOpt.includes("no-new-privileges"));
          if (fixture.role === "database")
            assert.equal(model.HostConfig.NetworkMode, "none");
          assert.equal(
            model.Mounts.length,
            fixture.role === "database"
              ? 0
              : fixture.role === "runtime"
                ? 2
                : 3,
          );
          assert.ok(model.Mounts.every((mount) => !mount.RW));
          const expectedMounts =
            fixture.role === "database"
              ? []
              : [
                  "/run/secrets/database_url",
                  "/run/secrets/jwt_secret",
                  ...(fixture.role === "probe"
                    ? ["/qa/authentication-admission-probe.mjs"]
                    : []),
                ];
          assert.deepEqual(
            model.Mounts.map((mount) => mount.Destination).sort(),
            expectedMounts.sort(),
          );
          if (fixture.role === "runtime")
            assert.deepEqual(model.Config.Cmd, [
              "node",
              "dist/start-runtime.js",
            ]);
          if (model.State.Running)
            docker("stop", "--timeout", "20", fixture.id);
          const state = JSON.parse(docker("inspect", fixture.id))[0].State;
          assert.equal(state.Running, false);
          assert.equal(state.OOMKilled, false);
          if (!primary) assert.equal(state.ExitCode, 0);
          console.log(
            JSON.stringify({
              event: "authentication_fixture_stopped",
              role: fixture.role,
              id: fixture.id,
              owner,
              exit: state.ExitCode,
              running: state.Running,
              oom: state.OOMKilled,
            }),
          );
        } catch (error) {
          failures.push(error);
        }
      }
      // Only this exact self-created scratch directory; retain fixture containers.
      assert.equal(realpathSync(directory), resolve(directory));
      assert.equal(dirname(realpathSync(directory)), temporaryRoot);
      assert.match(
        basename(directory),
        /^cofounder-auth-admission-[a-zA-Z0-9]+$/,
      );
      rmSync(directory, { recursive: true, force: true });
      if (failures.length)
        throw new AggregateError(
          failures,
          "owned_authentication_fixture_cleanup_failed",
        );
    }
  },
);
