// Real MySQL health probes, only in self-created network-disabled tmpfs fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";

const execute = promisify(execFile);
const root = new URL("../", import.meta.url);
const workflow = readFileSync(
  new URL(".github/workflows/ci.yml", root),
  "utf8",
);
const ciImage = getCiMysqlImage(workflow);
const ciCommand = workflow.match(/--health-cmd="([^"\r\n]+)"/)?.[1];
assert.ok(ciCommand, "CI MySQL health command missing");
const ciEnvironment = Object.fromEntries(
  ["MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_ROOT_PASSWORD"].map(
    (name) => {
      const value = workflow.match(
        new RegExp("^\\s+" + name + ": ([\\w-]+)$", "m"),
      )?.[1];
      assert.ok(value, "CI synthetic MySQL environment missing");
      return [name, value];
    },
  ),
);

async function docker(args, timeout = 10000) {
  try {
    const result = await execute("docker", args, {
      timeout,
      maxBuffer: 1024 * 1024,
    });
    return { status: 0, stdout: result.stdout.trim() };
  } catch (error) {
    return {
      status: Number.isInteger(error.code) ? error.code : null,
      stdout: "",
    };
  }
}
async function success(args, timeout = 10000) {
  const result = await docker(args, timeout);
  assert.equal(result.status, 0, "isolated readiness Docker operation failed");
  return result.stdout;
}
async function waitFor(check) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.fail("isolated readiness fixture did not reach the required state");
}
async function composeHealth(file, service, directory) {
  const result = await docker([
    "compose",
    "--env-file",
    join(directory, "empty.env"),
    "-f",
    fileURLToPath(new URL(file, root)),
    "config",
    "--format",
    "json",
  ]);
  assert.equal(result.status, 0, "read-only Compose configuration failed");
  const model = JSON.parse(result.stdout);
  return model.services[service].healthcheck.test;
}
function command(probe) {
  assert.equal(probe[0], "CMD");
  assert.equal(probe[1], "mysql");
  for (const required of [
    "--no-defaults",
    "--host=127.0.0.1",
    "--protocol=TCP",
    "--connect-timeout=2",
    "--user=cofounder",
    "--execute=SELECT 1",
  ])
    assert.ok(
      probe.includes(required),
      "Compose readiness no longer checks authenticated TCP",
    );
  return probe.slice(1);
}

test(
  "CI/local/integration readiness rejects bad credentials, wrong schema and socket-only MySQL",
  { timeout: 180000 },
  async () => {
    // Check availability before creating temporary files; never pull implicitly.
    const image = await success([
      "image",
      "inspect",
      ciImage,
      "--format",
      "{{.Id}}",
    ]);
    const directory = mkdtempSync(join(tmpdir(), "cofounder-readiness-model-"));
    writeFileSync(join(directory, "empty.env"), "");
    const label = randomUUID();
    const created = [];
    // Resolve an already available image; never pull or operate on an existing DB.
    const start = async (socketOnly) => {
      const id = await success([
        "run",
        "--pull=never",
        "-d",
        "--name",
        "cofounder-readiness-" + randomUUID(),
        "--network",
        "none",
        "--tmpfs",
        "/var/lib/mysql:rw,size=1g",
        "--memory",
        "1g",
        "--cpus",
        "2",
        "--label",
        "cofounder.readiness-fixture=" + label,
        ...Object.entries(ciEnvironment).flatMap(([key, value]) => [
          "-e",
          key + "=" + value,
        ]),
        "--health-cmd",
        ciCommand,
        "--health-interval",
        "2s",
        "--health-timeout",
        "3s",
        "--health-retries",
        "30",
        image,
        ...(socketOnly ? ["--skip-networking"] : []),
      ]);
      assert.match(id, /^[a-f0-9]{64}$/);
      created.push(id);
      return id;
    };
    const admin = (id, query) =>
      success([
        "exec",
        id,
        "mysql",
        "--no-defaults",
        "--protocol=SOCKET",
        "--user=root",
        "--password=" + ciEnvironment.MYSQL_ROOT_PASSWORD,
        "--execute=" + query,
      ]);
    const ciProbe = (id) => docker(["exec", id, "sh", "-c", ciCommand]);
    const stop = async (id) => {
      const info = JSON.parse(
        await success(["inspect", "--format", "{{json .}}", id]),
      );
      assert.equal(info.Config.Labels["cofounder.readiness-fixture"], label);
      assert.equal(info.HostConfig.NetworkMode, "none");
      assert.equal(Object.keys(info.HostConfig.PortBindings || {}).length, 0);
      assert.ok(info.HostConfig.Tmpfs["/var/lib/mysql"]);
      // The client deadline must exceed the daemon's ten-second grace period.
      // Otherwise healthy slow shutdowns become timeouts and mask probe failures.
      if (info.State.Running)
        await success(["stop", "--time", "10", id], 30000);
      assert.equal(
        await success(["inspect", "--format", "{{.State.Status}}", id]),
        "exited",
      );
      assert.equal(
        await success(["inspect", "--format", "{{.State.ExitCode}}", id]),
        "0",
      );
    };
    const probes = [];
    let primaryError;
    try {
      const local = command(
        await composeHealth("docker-compose.yml", "db", directory),
      );
      const integration = command(
        await composeHealth("compose.integration.yml", "database", directory),
      );
      const normal = await start(false);
      await waitFor(
        async () =>
          (await success([
            "inspect",
            "--format",
            "{{.State.Health.Status}}",
            normal,
          ])) === "healthy",
      );
      assert.equal((await ciProbe(normal)).status, 0);
      const rejected = await docker([
        "exec",
        normal,
        "sh",
        "-c",
        ciCommand.replace(
          "--password=cofounder ",
          "--password=synthetic-wrong-password ",
        ),
      ]);
      assert.equal(rejected.status, 1);
      assert.equal(
        (
          await docker([
            "exec",
            normal,
            "sh",
            "-c",
            ciCommand.replace("cofounder_test ", "missing_readiness_schema "),
          ])
        ).status,
        1,
      );
      // Legacy ping returns success even when MySQL denies authentication.
      assert.equal(
        (
          await docker([
            "exec",
            normal,
            "mysqladmin",
            "ping",
            "--protocol=TCP",
            "-h127.0.0.1",
            "-uroot",
            "-psynthetic-wrong-password",
          ])
        ).status,
        0,
      );
      await admin(
        normal,
        "CREATE DATABASE cofounder; GRANT ALL ON cofounder.* TO 'cofounder'@'%'; ALTER USER 'cofounder'@'%' IDENTIFIED BY 'cofounder-local-only'",
      );
      assert.equal((await docker(["exec", normal, ...local])).status, 0);
      await admin(
        normal,
        "ALTER USER 'cofounder'@'%' IDENTIFIED BY 'synthetic-integration-password'",
      );
      assert.equal((await docker(["exec", normal, ...integration])).status, 0);
      probes.push(
        "authenticated-ci-local-integration",
        "wrong-credentials",
        "missing-schema",
        "legacy-auth-false-positive",
      );
      await stop(normal);

      const socketOnly = await start(true);
      await waitFor(async () =>
        (await docker(["logs", socketOnly])).stdout.includes(
          "MySQL init process done. Ready for start up.",
        ),
      );
      await waitFor(
        async () =>
          (
            await docker([
              "exec",
              socketOnly,
              "mysql",
              "--no-defaults",
              "--protocol=SOCKET",
              "--user=cofounder",
              "--password=cofounder",
              "cofounder_test",
              "--execute=SELECT 1",
            ])
          ).status === 0,
      );
      // Models the official initializer's skip-networking property, not its timing.
      assert.equal((await ciProbe(socketOnly)).status, 1);
      assert.equal((await docker(["exec", socketOnly, ...local])).status, 1);
      assert.equal(
        (await docker(["exec", socketOnly, ...integration])).status,
        1,
      );
      assert.equal(
        (
          await docker([
            "exec",
            socketOnly,
            "sh",
            "-c",
            "mysqladmin ping -h localhost -proot-local-only --silent && sleep 5 && mysqladmin ping -h localhost -proot-local-only --silent",
          ])
        ).status,
        0,
      );
      probes.push("socket-only-refused", "legacy-delayed-ping-false-positive");
      console.log(JSON.stringify({ readinessChecks: probes }));
    } catch (error) {
      primaryError = error;
      throw error;
    } finally {
      // Exact self-created IDs and fixture label checked; never delete user volumes.
      // Attempt every owned shutdown, preserving an earlier probe failure.
      const cleanupErrors = [];
      for (const id of created) {
        try {
          await stop(id);
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
      rmSync(directory, { recursive: true, force: true });
      if (cleanupErrors.length) {
        if (primaryError)
          console.error("owned_readiness_fixture_cleanup_failed");
        else
          throw new AggregateError(
            cleanupErrors,
            "owned_readiness_fixture_cleanup_failed",
          );
      }
    }
  },
);
