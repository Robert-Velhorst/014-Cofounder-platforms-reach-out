import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, realpathSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";

test(
  "packaged runtime passes the complete synthetic customer workload",
  { timeout: 900000 },
  async () => {
    const owner = randomUUID(),
      owned = [];
    let primary, directory;
    function invoke(args, timeout = 60000) {
      return spawnSync("docker", args, {
        encoding: "utf8",
        timeout,
        maxBuffer: 8 * 1024 * 1024,
      });
    }
    function docker(...args) {
      const result = invoke(args);
      assert.equal(
        result.status,
        0,
        "owned_customer_load_fixture_operation_failed",
      );
      return result.stdout.trim();
    }
    function image(reference) {
      const id = docker("image", "inspect", reference, "--format", "{{.Id}}");
      assert.match(id, /^sha256:[a-f0-9]{64}$/);
      return id;
    }
    // Resolve local immutable artifacts before creating any fixture. Never pull,
    // accept an arbitrary database address, or bind the working source tree.
    const runtime = image(
      process.env.CUSTOMER_LOAD_RUNTIME_IMAGE ||
        "cofounder-recovery-runtime:local",
    );
    const tools = image(
      process.env.CUSTOMER_LOAD_TEST_IMAGE || "cofounder-recovery-test:local",
    );
    const database = image(
      process.env.CUSTOMER_LOAD_DATABASE_IMAGE || getCiMysqlImage(),
    );
    const temporaryRoot = realpathSync(tmpdir());
    const common = [
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
    const small = [
      "--memory",
      "512m",
      "--memory-swap",
      "512m",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
    ];
    const password = "synthetic-workspace-load-only-password";
    try {
      directory = mkdtempSync(join(temporaryRoot, "cofounder-customer-load-"));
      const helper = docker(
        "run",
        "--rm",
        ...common,
        ...small,
        "--network",
        "none",
        "--user",
        "1000:1000",
        "--entrypoint",
        "node",
        tools,
        "--input-type=module",
        "-e",
        "import{readFileSync}from'node:fs';process.stdout.write(readFileSync('/app/apps/cofounder-discovery/dist/synthetic-customer-load.mjs'))",
      );
      assert.ok(helper.length > 0, "compiled_customer_workload_missing");
      for (const [name, value] of [
        ["load.mjs", helper],
        [
          "database-url",
          `mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`,
        ],
        ["jwt-secret", "synthetic-workspace-load-session-key-" + randomUUID()],
      ])
        writeFileSync(join(directory, name), value, { mode: 0o444 });
      const mounts = [
        "--mount",
        `type=bind,source=${join(directory, "database-url")},target=/run/secrets/database_url,readonly`,
        "--mount",
        `type=bind,source=${join(directory, "jwt-secret")},target=/run/secrets/jwt_secret,readonly`,
      ];
      const db = docker(
        "run",
        "-d",
        "--name",
        `cofounder-customer-load-db-${owner}`,
        ...common,
        "--user",
        "999:999",
        "--network",
        "none",
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
      );
      owned.push({ id: db, role: "database", image: database, mounts: [] });
      let ready = false;
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        const result = invoke(
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
          3000,
        );
        if (result.status === 0) {
          ready = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      assert.ok(ready, "isolated_customer_load_database_not_ready");
      const environment = [
        "NODE_ENV=production",
        "APP_MODE=production",
        "PORT=13218",
        "HOST=127.0.0.1",
        "PUBLIC_ORIGIN=http://127.0.0.1:13218",
        "TRUST_PROXY=false",
        "DATABASE_URL_FILE=/run/secrets/database_url",
        "JWT_SECRET_FILE=/run/secrets/jwt_secret",
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
      ].flatMap((value) => ["-e", value]);
      const app = docker(
        "run",
        "-d",
        "--name",
        `cofounder-customer-load-app-${owner}`,
        ...common,
        ...small,
        "--user",
        "1000:1000",
        "--network",
        `container:${db}`,
        ...mounts,
        ...environment,
        runtime,
      );
      const secretPaths = [
        "/run/secrets/database_url",
        "/run/secrets/jwt_secret",
      ];
      owned.push({
        id: app,
        role: "runtime",
        image: runtime,
        mounts: secretPaths,
      });
      const driver = docker(
        "create",
        "--name",
        `cofounder-customer-load-run-${owner}`,
        ...common,
        ...small,
        "--user",
        "1000:1000",
        "--network",
        `container:${db}`,
        ...mounts,
        "--mount",
        `type=bind,source=${join(directory, "load.mjs")},target=/app/synthetic-customer-load.mjs,readonly`,
        "-e",
        "RUN_SYNTHETIC_CUSTOMER_LOAD=true",
        "-e",
        "DATABASE_URL_FILE=/run/secrets/database_url",
        "-e",
        "PORT=13218",
        "-e",
        "NODE_OPTIONS=--max-old-space-size=320",
        "--entrypoint",
        "node",
        runtime,
        "/app/synthetic-customer-load.mjs",
      );
      owned.push({
        id: driver,
        role: "driver",
        image: runtime,
        mounts: [...secretPaths, "/app/synthetic-customer-load.mjs"],
      });
      console.log(
        JSON.stringify({
          event: "customer_load_artifacts",
          owner,
          runtime,
          tools,
          database,
          workload: "full_100_accounts_10000_candidates",
          appCpus: 1,
          appMemoryBytes: 536870912,
          publicPorts: 0,
        }),
      );
      const result = invoke(["start", "--attach", driver], 720000);
      // The workload emits synthetic aggregate JSON only. Never print arbitrary
      // Docker stderr, database rows, cookies or runtime secret files.
      if (result.stdout) process.stdout.write(result.stdout);
      const observations = [];
      for (const target of [app, db]) {
        const memory = docker(
          "exec",
          target,
          "sh",
          "-c",
          "cat /sys/fs/cgroup/memory.peak; cat /sys/fs/cgroup/memory.events",
        );
        observations.push({ id: target, memory });
      }
      console.log(
        JSON.stringify({ event: "customer_load_memory", observations }),
      );
      // Run these observations even when a normal capacity tier fails. A failed
      // arrival tier must not suppress post-load liveness/readiness evidence.
      console.log(
        docker(
          "exec",
          app,
          "node",
          "--input-type=module",
          "-e",
          "const checks=[];for(const path of ['/api/health','/api/ready']){const r=await fetch('http://127.0.0.1:13218'+path,{signal:AbortSignal.timeout(5000)});await r.arrayBuffer();checks.push({path,status:r.status});if(r.status!==200)process.exitCode=1}console.log(JSON.stringify({event:'post_load_health',checks}))",
        ),
      );
      assert.equal(result.status, 0, "full_customer_load_acceptance_failed");
    } catch (error) {
      primary = error;
    } finally {
      const failures = [];
      for (const fixture of [...owned].reverse()) {
        let verifiedOwner = false;
        try {
          const model = JSON.parse(docker("inspect", fixture.id))[0];
          assert.equal(model.Id, fixture.id);
          assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
          assert.equal(model.Image, fixture.image);
          verifiedOwner = true;
          assert.deepEqual(model.HostConfig.PortBindings || {}, {});
          assert.equal(model.HostConfig.ReadonlyRootfs, true);
          assert.ok(model.HostConfig.CapDrop.includes("ALL"));
          assert.ok(model.HostConfig.SecurityOpt.includes("no-new-privileges"));
          assert.equal(model.HostConfig.NanoCpus, 1000000000);
          assert.equal(model.HostConfig.PidsLimit, 256);
          assert.equal(
            model.HostConfig.Memory,
            fixture.role === "database" ? 2147483648 : 536870912,
          );
          assert.equal(model.HostConfig.MemorySwap, model.HostConfig.Memory);
          assert.equal(
            model.Config.User,
            fixture.role === "database" ? "999:999" : "1000:1000",
          );
          assert.deepEqual(
            model.Mounts.map((m) => m.Destination).sort(),
            [...fixture.mounts].sort(),
          );
          assert.ok(model.Mounts.every((m) => !m.RW));
          assert.equal(
            model.HostConfig.NetworkMode,
            fixture.role === "database" ? "none" : `container:${owned[0].id}`,
          );
          if (fixture.role === "runtime")
            assert.deepEqual(model.Config.Cmd, [
              "node",
              "dist/start-runtime.js",
            ]);
        } catch (error) {
          failures.push(error);
        }
        // A resource-invariant failure must still clean up a fixture whose
        // immutable ID, owner and image were proven to belong to this run.
        if (!verifiedOwner) continue;
        try {
          const current = JSON.parse(docker("inspect", fixture.id))[0];
          if (current.State.Running)
            docker("stop", "--timeout", "30", fixture.id);
          const state = JSON.parse(docker("inspect", fixture.id))[0].State;
          console.log(
            JSON.stringify({
              event: "customer_load_fixture_stopped",
              owner,
              id: fixture.id,
              role: fixture.role,
              exit: state.ExitCode,
              oom: state.OOMKilled,
              running: state.Running,
            }),
          );
          assert.equal(state.Running, false);
          docker("rm", fixture.id);
          assert.equal(state.OOMKilled, false);
          if (!primary) assert.equal(state.ExitCode, 0);
        } catch (error) {
          failures.push(error);
        }
      }
      if (directory) {
        assert.equal(dirname(realpathSync(directory)), temporaryRoot);
        assert.match(
          basename(directory),
          /^cofounder-customer-load-[A-Za-z0-9]+$/,
        );
        rmSync(directory, { recursive: true, force: true });
      }
      if (primary || failures.length)
        throw new AggregateError(
          [...(primary ? [primary] : []), ...failures],
          "customer_load_qualification_failed",
        );
    }
  },
);
