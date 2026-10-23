import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { confinedRuntimeDml } from "../apps/cofounder-discovery/server/runtime-database-authority.ts";
import { tlsNoNewPrivileges } from "./tls-ingress-config.mjs";
import { syntheticSubnetArguments } from "./synthetic-network.mjs";

test(
  "custom MySQL initializes separate exact-schema identities and refuses elevated runtime actions",
  { timeout: 240000 },
  async () => {
    const owner = randomUUID();
    const fixtureName = `cofounder-db-roles-${owner}`;
    const label = `cofounder.synthetic-owner=${owner}`;
    const tempRoot = realpathSync(tmpdir());
    let directory, network, database, primary;
    const invoke = (args, input, timeout = 15000) =>
      spawnSync("docker", args, {
        encoding: "utf8",
        input,
        timeout,
        maxBuffer: 1024 * 1024,
      });
    function docker(...args) {
      const result = invoke(
        args,
        undefined,
        args[0] === "create" || args[0] === "stop" ? 60000 : 15000,
      );
      const reason =
        /all predefined address pools have been fully subnetted|could not find an available, non-overlapping IPv4 address pool/i.test(
          result.stderr ?? "",
        )
          ? "docker_default_network_pool_exhausted"
          : `owned_database_${args[0]}_failed`;
      const observation = ["ETIMEDOUT", "ENOBUFS", "ENOENT"].includes(
        result.error?.code,
      )
        ? result.error.code.toLowerCase()
        : "unknown";
      assert.equal(
        result.status,
        0,
        result.status === null ? `${reason}_${observation}` : reason,
      );
      return result.stdout.trim();
    }
    // Resolve mutable local build labels once. Every subsequent operation uses ID.
    const image = docker(
      "image",
      "inspect",
      process.env.HETZNER_DATABASE_TEST_IMAGE ||
        "cofounder-hetzner-database:local",
      "--format",
      "{{.Id}}",
    );
    assert.match(image, /^sha256:[a-f0-9]{64}$/);
    const bounds = [
      "--pull=never",
      "--label",
      label,
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
      "64",
      "--user",
      "1000:1000",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=16m,mode=1777",
      "--tmpfs",
      "/var/lib/mysql:rw,noexec,nosuid,size=1m,uid=1000,gid=1000,mode=0700",
    ];
    const mount = (name, target) => [
      "--mount",
      `type=bind,source=${join(directory, name)},target=${target},readonly`,
    ];
    function client(user, file, sql) {
      assert.ok(["cofounder", "cofounder_migrator", "root"].includes(user));
      assert.ok(["app", "migrator", "root"].includes(file));
      return invoke(
        [
          "run",
          "--rm",
          "--interactive",
          ...bounds,
          "--network",
          network,
          ...mount(file, "/qa/password"),
          "--entrypoint",
          "bash",
          image,
          "-ec",
          `export MYSQL_PWD="$(cat /qa/password)"; exec mysql --no-defaults --host=database --protocol=TCP --connect-timeout=3 --user=${user} --database=cofounder_test --batch --skip-column-names`,
        ],
        sql,
      );
    }
    function success(result) {
      assert.equal(result.status, 0, "owned_database_query_failed");
      return result.stdout.replace(/\r?\n$/, "");
    }
    function refused(result, allowed) {
      assert.notEqual(result.status, 0, "database_authority_not_refused");
      assert.ok(
        allowed.some((code) => result.stderr.includes(`ERROR ${code} (`)),
        "unexpected_database_refusal",
      );
    }
    function localRoot(sql) {
      return success(
        invoke(
          [
            "exec",
            "--interactive",
            database,
            "bash",
            "-ec",
            'export MYSQL_PWD="$(cat /run/secrets/mysql_root_password)"; exec mysql --no-defaults --protocol=socket --user=root --batch --skip-column-names',
          ],
          sql,
        ),
      );
    }
    async function observeDatabase() {
      const deadline = Date.now() + 45000;
      do {
        const observed = invoke(["inspect", database], undefined, 5000);
        if (observed.status === 0) return JSON.parse(observed.stdout)[0];
        if (observed.error?.code !== "ETIMEDOUT")
          throw new Error("owned_database_observation_failed");
        // Re-poll this same resource; never create a replacement on timeout.
        await pause(250);
      } while (Date.now() < deadline);
      throw new Error("owned_database_observation_timeout");
    }
    try {
      directory = mkdtempSync(join(tempRoot, "cofounder-db-roles-"));
      for (const file of ["app", "root", "migrator"])
        writeFileSync(join(directory, file), randomBytes(32).toString("hex"), {
          mode: 0o444,
        });
      let subnet = [];
      if (process.env.HETZNER_DATABASE_TEST_SUBNET !== undefined) {
        const ids = docker("network", "ls", "--quiet")
          .split(/\s+/)
          .filter(Boolean);
        const occupied = ids.length
          ? JSON.parse(docker("network", "inspect", ...ids)).flatMap((model) =>
              (model.IPAM.Config || [])
                .map((config) => config.Subnet)
                .filter(Boolean),
            )
          : [];
        subnet = syntheticSubnetArguments(
          process.env.HETZNER_DATABASE_TEST_SUBNET,
          occupied,
        );
      }
      network = docker(
        "network",
        "create",
        "--internal",
        ...subnet,
        "--label",
        label,
        `cofounder-db-roles-${owner}`,
      );
      assert.match(network, /^[a-f0-9]{64}$/);
      database = docker(
        "create",
        "--pull=never",
        "--name",
        fixtureName,
        "--label",
        label,
        "--network",
        network,
        "--network-alias",
        "database",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--cpus",
        "1",
        "--memory",
        "2g",
        "--memory-swap",
        "2g",
        "--pids-limit",
        "256",
        "--user",
        "999:999",
        "--tmpfs",
        "/var/lib/mysql:rw,noexec,nosuid,size=1g,uid=999,gid=999,mode=0700",
        "--tmpfs",
        "/var/run/mysqld:rw,noexec,nosuid,size=16m,mode=1777",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
        ...mount("app", "/run/secrets/mysql_password"),
        ...mount("root", "/run/secrets/mysql_root_password"),
        ...mount("migrator", "/run/secrets/mysql_migrator_password"),
        "-e",
        "MYSQL_DATABASE=cofounder_test",
        "-e",
        "MYSQL_USER=cofounder",
        "-e",
        "MYSQL_ROOT_HOST=localhost",
        "-e",
        "MYSQL_INITDB_SKIP_TZINFO=1",
        "-e",
        "MYSQL_PASSWORD_FILE=/run/secrets/mysql_password",
        "-e",
        "MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql_root_password",
        "-e",
        "MYSQL_MIGRATOR_PASSWORD_FILE=/run/secrets/mysql_migrator_password",
        image,
      );
      assert.match(database, /^[a-f0-9]{64}$/);
      docker("start", database);
      const deadline = Date.now() + 120000;
      let ready = false;
      while (Date.now() < deadline) {
        const state = (await observeDatabase()).State;
        assert.equal(
          state.Running,
          true,
          "owned_database_exited_during_initialization",
        );
        const health = invoke([
          "exec",
          database,
          "bash",
          "-ec",
          'MYSQL_PWD="$(cat /run/secrets/mysql_password)" mysql --no-defaults --host=127.0.0.1 --protocol=TCP --connect-timeout=2 --user=cofounder cofounder_test --execute="SELECT 1" >/dev/null 2>&1',
        ]);
        if (health.status === 0) {
          ready = true;
          break;
        }
        await pause(500);
      }
      assert.equal(ready, true, "owned_database_readiness_timeout");
      const model = await observeDatabase();
      assert.equal(model.Image, image);
      assert.equal(model.Config.User, "999:999");
      assert.equal(model.HostConfig.ReadonlyRootfs, true);
      assert.deepEqual(model.HostConfig.PortBindings || {}, {});
      assert.deepEqual(Object.keys(model.NetworkSettings.Networks), [
        `cofounder-db-roles-${owner}`,
      ]);
      assert.equal(model.HostConfig.Memory, 2147483648);
      assert.equal(model.HostConfig.MemorySwap, 2147483648);
      assert.equal(model.HostConfig.NanoCpus, 1000000000);
      assert.equal(model.HostConfig.PidsLimit, 256);
      assert.ok(model.HostConfig.CapDrop.includes("ALL"));
      assert.ok(tlsNoNewPrivileges(model.HostConfig.SecurityOpt));
      assert.equal(model.Mounts.length, 3);
      assert.ok(model.Mounts.every((m) => m.Type === "bind" && !m.RW));
      assert.equal(
        JSON.parse(docker("network", "inspect", network))[0].Internal,
        true,
      );

      const identity = success(
        client(
          "cofounder",
          "app",
          "SELECT DATABASE(), CURRENT_ROLE(), @@GLOBAL.mandatory_roles;",
        ),
      ).split("\t");
      assert.equal(identity.length, 3);
      const grants = success(
        client("cofounder", "app", "SHOW GRANTS FOR CURRENT_USER;"),
      ).split(/\r?\n/);
      assert.equal(
        confinedRuntimeDml(grants, ...identity),
        true,
        "actual_runtime_grants_not_confined",
      );
      const migrationGrants = success(
        client(
          "cofounder_migrator",
          "migrator",
          "SHOW GRANTS FOR CURRENT_USER;",
        ),
      ).split(/\r?\n/);
      assert.equal(
        confinedRuntimeDml(migrationGrants, ...identity),
        false,
        "migration_identity_must_not_pass_runtime_guard",
      );
      assert.equal(
        localRoot(
          "SELECT COUNT(*),SUM(Host='localhost'),SUM(Host<>'localhost') FROM mysql.user WHERE User='root';",
        ),
        "1\t1\t0",
      );
      refused(client("root", "root", "SELECT 1;"), [1045, 1130]);

      success(
        client(
          "cofounder_migrator",
          "migrator",
          "CREATE TABLE permission_probe(id INT PRIMARY KEY, value VARCHAR(16)); ALTER TABLE permission_probe ADD COLUMN extra INT; CREATE INDEX permission_probe_extra ON permission_probe(extra); DROP INDEX permission_probe_extra ON permission_probe;",
        ),
      );
      assert.equal(
        success(
          client(
            "cofounder",
            "app",
            "INSERT INTO permission_probe(id,value) VALUES(1,'created'); UPDATE permission_probe SET value='updated' WHERE id=1; SELECT value FROM permission_probe WHERE id=1; DELETE FROM permission_probe WHERE id=1; SELECT COUNT(*) FROM permission_probe;",
          ),
        ),
        "updated\n0",
      );
      for (const [user, file] of [
        ["cofounder", "app"],
        ["cofounder_migrator", "migrator"],
      ]) {
        refused(client(user, file, "SELECT User FROM mysql.user;"), [1142]);
        refused(
          client(user, file, "CREATE USER 'synthetic_forbidden'@'%';"),
          [1227],
        );
        refused(
          client(
            user,
            file,
            "GRANT SELECT ON cofounder_test.* TO 'cofounder'@'%';",
          ),
          [1044, 1142, 1227],
        );
      }
      refused(
        client("cofounder", "app", "CREATE TABLE runtime_forbidden(id INT);"),
        [1142],
      );
      refused(
        client(
          "cofounder",
          "app",
          "ALTER TABLE permission_probe ADD COLUMN forbidden INT;",
        ),
        [1142],
      );
      refused(
        client("cofounder", "app", "DROP TABLE permission_probe;"),
        [1142],
      );
      success(
        client(
          "cofounder_migrator",
          "migrator",
          "DROP TABLE permission_probe;",
        ),
      );

      // The shipped wrapper itself, not only its source unit, must reject remote root
      // before a server can initialize. No network or persistent database storage.
      const invalid = invoke([
        "run",
        "--rm",
        ...bounds,
        "--network",
        "none",
        "-e",
        "MYSQL_ROOT_HOST=%",
        image,
      ]);
      assert.equal(invalid.status, 1);
      assert.equal(invalid.stdout, "");
      assert.equal(
        invalid.stderr.trim(),
        "cofounder_database_configuration_refused",
      );
      console.log(
        JSON.stringify({
          event: "hetzner_database_authority_verified",
          image,
          sourceScope: "fresh_custom_database_only",
          runtimeDml: true,
          runtimeDdlRefused: true,
          foreignSchemaRefused: true,
          accountAdministrationRefused: true,
          delegationRefused: true,
          migratorDdl: true,
          migratorRejectedAsRuntime: true,
          remoteRootRefused: true,
          wrapperRefusal: true,
          fullApplicationVerified: false,
          tlsVerified: false,
        }),
      );
    } catch (error) {
      primary = error;
    } finally {
      const failures = [];
      // A CLI observation timeout is not proof that the daemon created nothing.
      // Reconcile this exact UUID-owned name before cleanup, never a broad prune.
      if (!database) {
        const observation = invoke(["inspect", fixtureName]);
        if (observation.status === 0) {
          const model = JSON.parse(observation.stdout)[0];
          assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
          assert.equal(model.Image, image);
          assert.match(model.Id, /^[a-f0-9]{64}$/);
          database = model.Id;
        } else if (
          observation.status === null ||
          !/No such (?:object|container)/i.test(observation.stderr ?? "")
        )
          failures.push(new Error("owned_database_observation_unavailable"));
      }
      if (database) {
        try {
          const model = await observeDatabase();
          assert.equal(model.Id, database);
          assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
          if (model.State.Running) docker("stop", "--timeout", "30", database);
          const state = (await observeDatabase()).State;
          assert.equal(state.Running, false);
          docker("rm", database);
          console.log(
            JSON.stringify({
              event: "hetzner_database_fixture_removed",
              owner,
              database,
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
      if (network) {
        try {
          const model = JSON.parse(docker("network", "inspect", network))[0];
          assert.equal(model.Id, network);
          assert.equal(model.Labels["cofounder.synthetic-owner"], owner);
          assert.equal(Object.keys(model.Containers).length, 0);
          docker("network", "rm", network);
        } catch (error) {
          failures.push(error);
        }
      }
      if (directory && failures.length === 0) {
        assert.equal(dirname(realpathSync(directory)), tempRoot);
        assert.match(basename(directory), /^cofounder-db-roles-[A-Za-z0-9]+$/);
        rmSync(directory, { recursive: true, force: true });
      }
      if (primary || failures.length)
        throw new AggregateError(
          [...(primary ? [primary] : []), ...failures],
          "hetzner_database_qualification_failed",
        );
    }
  },
);
