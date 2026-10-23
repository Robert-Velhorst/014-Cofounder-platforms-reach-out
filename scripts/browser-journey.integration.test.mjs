import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import {
  mkdtempSync,
  realpathSync,
  writeFileSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { getCiMysqlImage } from "./ci-mysql-image.mjs";
import {
  browserJourneyFailureDiagnostics,
  validateBrowserJourneyReceipt,
} from "../apps/cofounder-discovery/scripts/browser-journey-policy.mjs";

test(
  "packaged runtime completes the maintained 24-stage synthetic browser journey",
  { timeout: 900000 },
  async () => {
    const owner = randomUUID(),
      owned = [],
      fixtureSecrets = [],
      removed = new Set();
    let primary, directory, artifacts, pendingCreation;
    const temporaryRoot = realpathSync(tmpdir());
    function invoke(args, timeout = 60000) {
      return spawnSync("docker", args, {
        encoding: "utf8",
        timeout,
        maxBuffer: 8 * 1024 * 1024,
      });
    }
    function docker(...args) {
      const result = invoke(args);
      assert.equal(result.status, 0, "owned_browser_fixture_operation_failed");
      return result.stdout.trim();
    }
    function image(reference) {
      const id = docker("image", "inspect", reference, "--format", "{{.Id}}");
      assert.match(id, /^sha256:[a-f0-9]{64}$/);
      return id;
    }
    // Resolve artifacts before creating files/resources. Never pull or accept a
    // database address, working-tree/application mount, existing account or volume.
    const runtime = image(
      process.env.BROWSER_JOURNEY_RUNTIME_IMAGE ||
        "cofounder-recovery-runtime:local",
    );
    const browser = image(
      process.env.BROWSER_JOURNEY_TEST_IMAGE || "cofounder-browser-test:local",
    );
    const database = image(
      process.env.BROWSER_JOURNEY_DATABASE_IMAGE || getCiMysqlImage(),
    );
    const common = [
      "--pull=never",
      "--label",
      `cofounder.synthetic-owner=${owner}`,
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--pids-limit",
      "256",
    ];
    function mount(name, target, writable = false) {
      const source = name === "artifacts" ? artifacts : join(directory, name);
      return { source, target, writable };
    }
    function mountArguments(mounts) {
      return mounts.flatMap((m) => [
        "--mount",
        `type=bind,source=${m.source},target=${m.target}${m.writable ? "" : ",readonly"}`,
      ]);
    }
    async function observe(idOrName, budget = 15000) {
      const deadline = performance.now() + budget;
      while (performance.now() < deadline) {
        const result = invoke(
          ["inspect", idOrName],
          Math.max(1, Math.min(5000, Math.floor(deadline - performance.now()))),
        );
        if (result.status === 0) {
          try {
            const models = JSON.parse(result.stdout);
            if (models.length === 1 && /^[a-f0-9]{64}$/.test(models[0].Id))
              return models[0];
          } catch {
            /* Observation failure is not proof that a fixture is absent. */
          }
        }
        const remaining = deadline - performance.now();
        if (remaining > 0) await pause(Math.min(250, remaining));
      }
      throw new Error("owned_browser_fixture_observation_expired");
    }
    function identity(fixture, model) {
      assert.equal(model.Id, fixture.id);
      assert.equal(model.Name, "/" + fixture.name);
      assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
      assert.equal(model.Image, fixture.image);
    }
    function invariants(fixture, model) {
      identity(fixture, model);
      assert.deepEqual(model.HostConfig.PortBindings || {}, {});
      assert.equal(model.HostConfig.ReadonlyRootfs, true);
      assert.ok(model.HostConfig.CapDrop.includes("ALL"));
      assert.ok(model.HostConfig.SecurityOpt.includes("no-new-privileges"));
      assert.equal(model.HostConfig.NanoCpus, fixture.cpus * 1e9);
      assert.equal(model.HostConfig.Memory, fixture.memory);
      assert.equal(model.HostConfig.MemorySwap, fixture.memory);
      assert.equal(model.HostConfig.PidsLimit, 256);
      assert.equal(
        model.Config.User,
        fixture.role === "database" ? "999:999" : "1000:1000",
      );
      assert.equal(
        model.HostConfig.NetworkMode,
        fixture.role === "database" ? "none" : `container:${owned[0].id}`,
      );
      const actual = model.Mounts.filter((m) => m.Type !== "tmpfs").sort(
        (a, b) => a.Destination.localeCompare(b.Destination),
      );
      const expected = [...fixture.mounts].sort((a, b) =>
        a.target.localeCompare(b.target),
      );
      assert.equal(actual.length, expected.length);
      for (let i = 0; i < actual.length; i++) {
        assert.equal(actual[i].Type, "bind");
        assert.equal(actual[i].Destination, expected[i].target);
        assert.equal(actual[i].Source, realpathSync(expected[i].source));
        assert.equal(actual[i].RW, expected[i].writable);
      }
      assert.deepEqual(
        Object.keys(model.HostConfig.Tmpfs).sort(),
        fixture.tmpfs.sort(),
      );
      if (fixture.role === "runtime")
        assert.deepEqual(model.Config.Cmd, ["node", "dist/start-runtime.js"]);
      if (fixture.role === "driver") {
        assert.equal(model.HostConfig.Init, true);
        assert.deepEqual(model.Config.Cmd, ["scripts/browser-journey.mjs"]);
      }
    }
    async function create(
      role,
      artifact,
      options,
      mounts,
      cpus,
      memory,
      tmpfs,
      command = [],
    ) {
      const name = `cofounder-browser-${role}-${owner}`;
      pendingCreation = { name, role, image: artifact };
      const result = invoke([
        "create",
        "--name",
        name,
        ...common,
        "--cpus",
        String(cpus),
        "--memory",
        String(memory),
        "--memory-swap",
        String(memory),
        ...mountArguments(mounts),
        ...options,
        artifact,
        ...command,
      ]);
      let id = result.status === 0 ? result.stdout.trim() : "";
      if (!/^[a-f0-9]{64}$/.test(id)) {
        // Reconcile only this exact UUID name; never create a replacement after
        // an observation timeout or assume a timed-out request created nothing.
        const model = await observe(name);
        assert.equal(model.Name, "/" + name);
        assert.equal(model.Config.Labels["cofounder.synthetic-owner"], owner);
        assert.equal(model.Image, artifact);
        id = model.Id;
      }
      const fixture = {
        id,
        name,
        role,
        image: artifact,
        mounts,
        cpus,
        memory,
        tmpfs,
      };
      owned.push(fixture);
      pendingCreation = undefined;
      invariants(fixture, await observe(id));
      return id;
    }
    try {
      directory = mkdtempSync(
        join(temporaryRoot, "cofounder-browser-secrets-"),
      );
      const artifactBase = realpathSync(
        process.env.BROWSER_JOURNEY_ARTIFACT_ROOT || temporaryRoot,
      );
      artifacts = mkdtempSync(
        join(artifactBase, "cofounder-browser-artifacts-"),
      );
      chmodSync(artifacts, 0o777); // Only this new synthetic screenshot directory is writable by UID 1000.
      const appPassword = randomBytes(32).toString("hex");
      for (const [name, value] of [
        ["app-password", appPassword],
        ["root-password", randomBytes(32).toString("hex")],
        [
          "database-url",
          `mysql://cofounder:${appPassword}@127.0.0.1:3306/cofounder_test`,
        ],
        ["jwt-secret", randomBytes(32).toString("hex")],
      ]) {
        fixtureSecrets.push(value);
        writeFileSync(join(directory, name), value, { mode: 0o444 });
      }
      const db = await create(
        "database",
        database,
        [
          "--user",
          "999:999",
          "--network",
          "none",
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
          "MYSQL_PASSWORD_FILE=/run/secrets/app_password",
          "-e",
          "MYSQL_ROOT_PASSWORD_FILE=/run/secrets/root_password",
          "-e",
          "MYSQL_ROOT_HOST=localhost",
        ],
        [
          mount("app-password", "/run/secrets/app_password"),
          mount("root-password", "/run/secrets/root_password"),
        ],
        1,
        2147483648,
        ["/var/lib/mysql", "/var/run/mysqld", "/tmp"],
      );
      docker("start", db);
      let ready = false;
      const deadline = performance.now() + 60000;
      while (performance.now() < deadline) {
        const result = invoke(
          [
            "exec",
            db,
            "bash",
            "-ec",
            'MYSQL_PWD="$(cat /run/secrets/app_password)" mysql --no-defaults --protocol=TCP --host=127.0.0.1 --connect-timeout=2 --user=cofounder cofounder_test --execute="SELECT 1"',
          ],
          3000,
        );
        if (result.status === 0) {
          ready = true;
          break;
        }
        await pause(250);
      }
      assert.ok(ready, "owned_browser_database_not_ready");
      const env = [
        "NODE_ENV=production",
        "APP_MODE=production",
        "PORT=13216",
        "HOST=127.0.0.1",
        "PUBLIC_ORIGIN=http://localhost:13216",
        "TRUST_PROXY=false",
        "DATABASE_URL_FILE=/run/secrets/database_url",
        "JWT_SECRET_FILE=/run/secrets/jwt_secret",
        "ENABLE_REGISTRATION=true",
        "ENABLE_ACCOUNT_MAIL_WORKER=false",
        "ENABLE_ACCOUNT_MAIL_RETENTION=false",
        "ENABLE_ACCOUNT_DELETION_WORKER=false",
        "ENABLE_PLATFORM_AUTOMATION=false",
        "ENABLE_UNSAFE_LEGACY_ROUTES=false",
        "ENABLE_OWNER_NOTIFICATIONS=false",
        "OUTREACH_PAUSED=false",
        "OPENAI_API_KEY=",
        "RESEND_API_KEY=",
        "NODE_OPTIONS=--max-old-space-size=320",
      ].flatMap((value) => ["-e", value]);
      const app = await create(
        "runtime",
        runtime,
        [
          "--user",
          "1000:1000",
          "--network",
          `container:${db}`,
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
          ...env,
        ],
        [
          mount("database-url", "/run/secrets/database_url"),
          mount("jwt-secret", "/run/secrets/jwt_secret"),
        ],
        1,
        536870912,
        ["/tmp"],
      );
      docker("start", app);
      const driver = await create(
        "driver",
        browser,
        [
          "--user",
          "1000:1000",
          "--init",
          "--network",
          `container:${db}`,
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=256m,mode=1777",
          "--tmpfs",
          "/home/browser-test:rw,noexec,nosuid,size=64m,uid=1000,gid=1000,mode=0700",
          "-e",
          "RUN_SYNTHETIC_BROWSER_JOURNEY=true",
          "-e",
          "E2E_DISPOSABLE_CONFIRM=local-isolated-mysql-test",
          "-e",
          `BROWSER_JOURNEY_OWNER=${owner}`,
          "-e",
          "NODE_OPTIONS=--max-old-space-size=768",
          "--entrypoint",
          "node",
        ],
        [
          mount("database-url", "/run/secrets/database_url"),
          mount("artifacts", "/task-output", true),
        ],
        2,
        2147483648,
        ["/tmp", "/home/browser-test"],
        ["scripts/browser-journey.mjs"],
      );
      console.log(
        JSON.stringify({
          event: "browser_journey_artifacts",
          owner,
          runtime,
          browser,
          database,
          publicPorts: 0,
          network: "owned-network-none-namespace",
          screenshotDirectory: artifacts,
          appCpus: 1,
          appMemoryBytes: 536870912,
        }),
      );
      const result = invoke(["start", "--attach", driver], 600000);
      // The driver emits redacted synthetic JSON only. Preserve its known failure
      // envelopes, with parent-side redaction, but never arbitrary Docker stderr,
      // secret files or application/database logs.
      if (result.stdout) process.stdout.write(result.stdout);
      for (const diagnostic of browserJourneyFailureDiagnostics(
        result.stderr,
        fixtureSecrets,
      ))
        console.error(JSON.stringify(diagnostic));
      assert.equal(result.status, 0, "maintained_browser_journey_failed");
      const receipts = result.stdout
        .split(/\r?\n/)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((row) => row?.passed === true);
      assert.equal(
        receipts.length,
        1,
        "complete_browser_journey_receipt_missing",
      );
      validateBrowserJourneyReceipt(receipts[0]);
    } catch (error) {
      primary = error;
    } finally {
      const failures = [];
      for (const fixture of [...owned].reverse()) {
        let provenOwner = false;
        try {
          const model = await observe(fixture.id);
          identity(fixture, model);
          provenOwner = true;
          try {
            invariants(fixture, model);
          } catch (error) {
            failures.push(error);
          }
          if (model.State.Running)
            docker("stop", "--timeout", "30", fixture.id);
          const final = await observe(fixture.id);
          identity(fixture, final);
          assert.equal(final.State.Running, false);
          docker("rm", fixture.id);
          removed.add(fixture.id);
          console.log(
            JSON.stringify({
              event: "browser_journey_fixture_removed",
              owner,
              role: fixture.role,
              id: fixture.id,
              exit: final.State.ExitCode,
              oom: final.State.OOMKilled,
            }),
          );
          assert.equal(final.State.OOMKilled, false);
          if (!primary) assert.equal(final.State.ExitCode, 0);
        } catch (error) {
          failures.push(error);
          if (!provenOwner)
            console.log(
              JSON.stringify({
                event: "browser_fixture_ownership_unverified",
                owner,
                id: fixture.id,
              }),
            );
        }
      }
      if (directory) {
        assert.equal(dirname(realpathSync(directory)), temporaryRoot);
        assert.match(
          basename(directory),
          /^cofounder-browser-secrets-[A-Za-z0-9]+$/,
        );
        if (
          !pendingCreation &&
          owned.every((fixture) => removed.has(fixture.id))
        )
          rmSync(directory, { recursive: true, force: true });
        else
          console.log(
            JSON.stringify({
              event: "browser_journey_recovery_required",
              owner,
              secretDirectory: directory,
              pendingName: pendingCreation?.name ?? null,
            }),
          );
      }
      // Retain synthetic screenshots on success and failure for operator review.
      // They are separate from secret scratch files and never contain live data.
      if (artifacts)
        console.log(
          JSON.stringify({
            event: "browser_journey_screenshots_retained",
            directory: artifacts,
          }),
        );
      if (primary || failures.length)
        throw new AggregateError(
          [...(primary ? [primary] : []), ...failures],
          "browser_journey_qualification_failed",
        );
    }
  },
);
