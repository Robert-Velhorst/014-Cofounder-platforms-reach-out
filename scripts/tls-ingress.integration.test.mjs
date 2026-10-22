import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import {
  mkdtempSync,
  realpathSync,
  readFileSync,
  writeFileSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";
import { tlsIngressOverride } from "./tls-ingress-config.mjs";

test(
  "actual Hetzner Compose ingress authenticates through verified TLS and strips hostile forwarding claims",
  { timeout: 360000 },
  async () => {
    const owner = randomUUID(),
      project = `cofounder-tls-${owner}`;
    const temporaryRoot = realpathSync(tmpdir());
    const composeFile = fileURLToPath(
      new URL("../compose.hetzner.yml", import.meta.url),
    );
    const models = new Map(),
      owned = [],
      networks = [];
    let directory, env, primary;
    function invoke(args, timeout = 60000) {
      return spawnSync("docker", args, {
        encoding: "utf8",
        timeout,
        maxBuffer: 4 * 1024 * 1024,
        ...(env ? { env } : {}),
      });
    }
    function docker(...args) {
      const result = invoke(args);
      assert.equal(result.status, 0, "owned_tls_fixture_operation_failed");
      return result.stdout.trim();
    }
    function image(reference) {
      const id = docker("image", "inspect", reference, "--format", "{{.Id}}");
      assert.match(id, /^sha256:[a-f0-9]{64}$/);
      return id;
    }
    const runtime = image(
      process.env.TLS_INGRESS_RUNTIME_IMAGE ||
        "cofounder-recovery-runtime:local",
    );
    const tools = image(
      process.env.TLS_INGRESS_TEST_IMAGE || "cofounder-recovery-test:local",
    );
    const edge = image(
      process.env.TLS_INGRESS_EDGE_IMAGE || "cofounder-hetzner-edge:local",
    );
    const database = image(
      process.env.TLS_INGRESS_DATABASE_IMAGE || getCiMysqlImage(),
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
      "--memory",
      "512m",
      "--memory-swap",
      "512m",
      "--pids-limit",
      "128",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
      "--user",
      "1000:1000",
    ];
    try {
      directory = mkdtempSync(join(temporaryRoot, "cofounder-tls-"));
      const password = "synthetic-tls-database-only-password";
      const files = {
        "empty.env": "",
        "database-url": `mysql://cofounder:${password}@database:3306/cofounder_test`,
        "probe-url": `mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`,
        "mysql-password": password,
        "root-password": "synthetic-tls-root-only-password",
        "jwt-secret": "synthetic-tls-session-key-" + randomUUID(),
        password: "Synthetic-TLS-A1-" + randomBytes(24).toString("hex"),
      };
      for (const [name, value] of Object.entries(files))
        writeFileSync(join(directory, name), value, { mode: 0o444 });
      const original = readFileSync(
        new URL("../deploy/hetzner/Caddyfile", import.meta.url),
        "utf8",
      );
      assert.equal(original.split("skip_install_trust").length, 2);
      // Only the certificate issuer changes: no public ACME/DNS/provider call.
      writeFileSync(
        join(directory, "Caddyfile"),
        original.replace(
          "skip_install_trust",
          "skip_install_trust\n\tlocal_certs",
        ),
        { mode: 0o444 },
      );
      const helper = docker(
        "run",
        "--rm",
        ...bounds,
        "--network",
        "none",
        "--entrypoint",
        "node",
        tools,
        "--input-type=module",
        "-e",
        "import{readFileSync}from'node:fs';process.stdout.write(readFileSync('/app/apps/cofounder-discovery/dist/synthetic-tls-ingress.mjs'))",
      );
      assert.ok(helper.length > 0);
      writeFileSync(join(directory, "probe.mjs"), helper, { mode: 0o444 });
      writeFileSync(
        join(directory, "override.yml"),
        tlsIngressOverride(owner, join(directory, "Caddyfile")),
      );
      env = {
        ...process.env,
        PRODUCTION_APP_IMAGE: runtime,
        PRODUCTION_DATABASE_IMAGE: database,
        PRODUCTION_EDGE_IMAGE: edge,
        PUBLIC_HOSTNAME: "cofounder.test",
        PUBLIC_ORIGIN: "https://cofounder.test",
        HETZNER_DATA_ROOT: directory,
        DATABASE_URL_SECRET_FILE: join(directory, "database-url"),
        JWT_SECRET_FILE: join(directory, "jwt-secret"),
        MYSQL_PASSWORD_SECRET_FILE: join(directory, "mysql-password"),
        MYSQL_ROOT_PASSWORD_SECRET_FILE: join(directory, "root-password"),
      };
      const compose = [
        "compose",
        "--project-name",
        project,
        "--env-file",
        join(directory, "empty.env"),
        "-f",
        composeFile,
        "-f",
        join(directory, "override.yml"),
      ];
      const startup = invoke(
        [
          ...compose,
          "up",
          "--detach",
          "--pull",
          "never",
          "--wait",
          "--wait-timeout",
          "150",
        ],
        180000,
      );
      // Capture exact self-owned IDs even if startup failed partway through.
      for (const id of docker(
        "ps",
        "-aq",
        "--filter",
        `label=cofounder.synthetic-owner=${owner}`,
      )
        .split(/\s+/)
        .filter(Boolean)) {
        const model = JSON.parse(docker("inspect", id))[0];
        const role = model.Config.Labels["com.docker.compose.service"];
        assert.ok(["app", "database", "edge"].includes(role));
        assert.equal(
          model.Config.Labels["com.docker.compose.project"],
          project,
        );
        owned.push({ id, role });
        models.set(role, model);
      }
      for (const id of docker(
        "network",
        "ls",
        "-q",
        "--filter",
        `label=cofounder.synthetic-owner=${owner}`,
      )
        .split(/\s+/)
        .filter(Boolean))
        networks.push(id);
      assert.equal(startup.status, 0, "synthetic_hetzner_stack_not_ready");
      assert.equal(owned.length, 3);
      assert.equal(networks.length, 2);
      for (const network of networks) {
        const model = JSON.parse(docker("network", "inspect", network))[0];
        assert.equal(model.Labels["cofounder.synthetic-owner"], owner);
        assert.equal(model.Labels["com.docker.compose.project"], project);
        assert.equal(model.Internal, true);
      }
      for (const [
        role,
        expectedImage,
        memory,
        cpus,
        user,
        connections,
        destinations,
      ] of [
        [
          "app",
          runtime,
          536870912,
          1000000000,
          "1000:1000",
          ["database", "ingress"],
          ["/run/secrets/database_url", "/run/secrets/jwt_secret"],
        ],
        [
          "database",
          database,
          2147483648,
          1000000000,
          "999:999",
          ["database"],
          ["/run/secrets/mysql_password", "/run/secrets/mysql_root_password"],
        ],
        [
          "edge",
          edge,
          268435456,
          500000000,
          "1000:1000",
          ["ingress"],
          ["/etc/caddy/Caddyfile"],
        ],
      ]) {
        const model = models.get(role);
        assert.equal(model.Image, expectedImage);
        assert.equal(model.Config.User, user);
        assert.equal(model.HostConfig.ReadonlyRootfs, true);
        assert.equal(model.HostConfig.Memory, memory);
        assert.equal(model.HostConfig.MemorySwap, memory);
        assert.equal(model.HostConfig.NanoCpus, cpus);
        assert.ok(model.HostConfig.CapDrop.includes("ALL"));
        assert.ok(model.HostConfig.SecurityOpt.includes("no-new-privileges"));
        assert.deepEqual(model.HostConfig.PortBindings || {}, {});
        assert.deepEqual(
          Object.keys(model.NetworkSettings.Networks).sort(),
          connections.map((n) => `${project}_${n}`).sort(),
        );
        assert.deepEqual(
          model.Mounts.map((m) => m.Destination).sort(),
          [...destinations].sort(),
        );
        assert.ok(model.Mounts.every((m) => m.Type === "bind" && !m.RW));
      }
      const dbId = models.get("database").Id,
        edgeId = models.get("edge").Id;
      console.log(
        JSON.stringify({
          event: "tls_ingress_artifacts",
          owner,
          runtime,
          tools,
          database,
          edge,
          actualComposeGraph: true,
          internalNetworks: 2,
          publicPorts: 0,
          persistentDatabaseVolumes: 0,
        }),
      );
      const mount = (name, target) => [
        "--mount",
        `type=bind,source=${join(directory, name)},target=${target},readonly`,
      ];
      function probe(mode, namespace) {
        const mounts = [
          ...mount("probe.mjs", "/app/synthetic-tls-ingress.mjs"),
        ];
        if (mode === "client")
          mounts.push(
            ...mount("password", "/qa/password"),
            ...mount("root.crt", "/qa/root.crt"),
          );
        else
          mounts.push(
            ...mount("probe-url", "/run/secrets/database_url"),
            ...mount("jwt-secret", "/run/secrets/jwt_secret"),
            ...mount("password", "/qa/password"),
          );
        console.log(
          docker(
            "run",
            "--rm",
            ...bounds,
            "--network",
            `container:${namespace}`,
            ...mounts,
            "-e",
            "RUN_SYNTHETIC_TLS_INGRESS=true",
            "-e",
            `TLS_PROBE_PHASE=${mode}`,
            ...(mode === "client"
              ? []
              : [
                  "-e",
                  "DATABASE_URL_FILE=/run/secrets/database_url",
                  "-e",
                  "JWT_SECRET_FILE=/run/secrets/jwt_secret",
                ]),
            "--entrypoint",
            "node",
            runtime,
            "/app/synthetic-tls-ingress.mjs",
          ),
        );
      }
      probe("seed", dbId);
      docker(
        "cp",
        `${edgeId}:/data/caddy/pki/authorities/local/root.crt`,
        join(directory, "root.crt"),
      );
      chmodSync(join(directory, "root.crt"), 0o444);
      probe("client", edgeId);
      probe("verify", dbId);
    } catch (error) {
      primary = error;
    } finally {
      const failures = [];
      const shutdownOrder = ["edge", "app", "database"];
      for (const fixture of [...owned].sort(
        (a, b) => shutdownOrder.indexOf(a.role) - shutdownOrder.indexOf(b.role),
      )) {
        try {
          const model = JSON.parse(docker("inspect", fixture.id))[0];
          assert.equal(model.Id, fixture.id);
          assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
          assert.equal(
            model.Config.Labels["com.docker.compose.project"],
            project,
          );
          if (model.State.Running)
            docker("stop", "--timeout", "30", fixture.id);
          const state = JSON.parse(docker("inspect", fixture.id))[0].State;
          assert.equal(state.Running, false);
          docker("rm", fixture.id);
          console.log(
            JSON.stringify({
              event: "tls_ingress_fixture_removed",
              owner,
              role: fixture.role,
              id: fixture.id,
              exit: state.ExitCode,
              oom: state.OOMKilled,
            }),
          );
          assert.equal(state.OOMKilled, false);
          if (!primary) assert.equal(state.ExitCode, 0);
        } catch (error) {
          failures.push(error);
        }
      }
      for (const id of networks) {
        try {
          const model = JSON.parse(docker("network", "inspect", id))[0];
          assert.equal(model.Labels["cofounder.synthetic-owner"], owner);
          assert.equal(model.Labels["com.docker.compose.project"], project);
          assert.equal(Object.keys(model.Containers).length, 0);
          docker("network", "rm", id);
        } catch (error) {
          failures.push(error);
        }
      }
      if (directory) {
        assert.equal(dirname(realpathSync(directory)), temporaryRoot);
        assert.match(basename(directory), /^cofounder-tls-[A-Za-z0-9]+$/);
        rmSync(directory, { recursive: true, force: true });
      }
      if (primary || failures.length)
        throw new AggregateError(
          [...(primary ? [primary] : []), ...failures],
          "tls_ingress_qualification_failed",
        );
    }
  },
);
