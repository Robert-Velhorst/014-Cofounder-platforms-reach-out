import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import {
  randomUUID,
  randomBytes,
  scryptSync,
  createHash,
  createCipheriv,
} from "node:crypto";
import { fileURLToPath } from "node:url";
const script = fileURLToPath(
  new URL("./database-recovery.mjs", import.meta.url),
);
const repo = fileURLToPath(new URL("../", import.meta.url));
const password = "synthetic-recovery-only-password";
function docker(...args) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, MYSQL_PWD: password },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function sql(container, query) {
  return docker(
    "exec",
    "-e",
    "MYSQL_PWD",
    container,
    "mysql",
    "--no-defaults",
    "-h127.0.0.1",
    "-uroot",
    "--batch",
    "--skip-column-names",
    "cofounder_test",
    "-e",
    query,
  );
}
function ownerSql(container, query) {
  return docker(
    "exec",
    "-e",
    "MYSQL_PWD",
    container,
    "mysql",
    "--no-defaults",
    "-h127.0.0.1",
    "-ucofounder",
    "--batch",
    "--skip-column-names",
    "cofounder_test",
    "-e",
    query,
  );
}
test(
  "encrypted full-schema backup restores only into an empty isolated target and preserves source data",
  { timeout: 300000 },
  async () => {
    // Resolve only already available images before making any fixture. Never
    // implicitly pull a tag or run a different image between source and target.
    const databaseImage = docker(
      "image",
      "inspect",
      process.env.RECOVERY_TEST_DATABASE_IMAGE || "mysql:8.4",
      "--format",
      "{{.Id}}",
    );
    const appImage = docker(
      "image",
      "inspect",
      process.env.RECOVERY_TEST_APP_IMAGE || "cofounder-recovery-test:local",
      "--format",
      "{{.Id}}",
    );
    const runtimeImage = docker(
      "image",
      "inspect",
      process.env.RECOVERY_TEST_RUNTIME_IMAGE ||
        "cofounder-recovery-runtime:local",
      "--format",
      "{{.Id}}",
    );
    for (const image of [databaseImage, appImage, runtimeImage])
      assert.match(image, /^sha256:[a-f0-9]{64}$/);
    const suffix = randomUUID().slice(0, 8);
    const source = `cofounder-recovery-source-${suffix}`,
      target = `cofounder-recovery-target-${suffix}`,
      binaryTarget = `cofounder-recovery-binary-target-${suffix}`;
    const temporaryRoot = realpathSync(tmpdir());
    const folder = mkdtempSync(join(temporaryRoot, "cofounder-recovery-db-"));
    const key = join(folder, "key"),
      file = join(folder, "snapshot.cfb");
    const created = [];
    const createdIds = new Map();
    let runtime;
    const run = (command, extra = [], backupFile = file) =>
      spawnSync(
        process.execPath,
        [
          script,
          command,
          "--key-file",
          key,
          ...(command === "keygen" ? [] : ["--file", backupFile]),
          ...extra,
        ],
        {
          encoding: "utf8",
          timeout: 120000,
          env: { ...process.env, RECOVERY_DB_PASSWORD: password },
        },
      );
    try {
      for (const name of [source, target, binaryTarget]) {
        const fixtureId = docker(
          "run",
          "--pull=never",
          "-d",
          "--name",
          name,
          "--network",
          "none",
          "--read-only",
          "--user",
          "999:999",
          "--cap-drop",
          "ALL",
          "--security-opt",
          "no-new-privileges",
          "--cpus",
          "2",
          "--memory",
          "2g",
          "--memory-swap",
          "2g",
          "--pids-limit",
          "256",
          "--tmpfs",
          "/var/lib/mysql:rw,noexec,nosuid,size=1g,mode=1777",
          "--tmpfs",
          "/var/run/mysqld:rw,noexec,nosuid,size=16m,mode=1777",
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
          "--label",
          "cofounder.restore-target=true",
          "--label",
          `cofounder.synthetic-owner=${suffix}`,
          "-e",
          "MYSQL_DATABASE=cofounder_test",
          "-e",
          "MYSQL_USER=cofounder",
          "-e",
          `MYSQL_PASSWORD=${password}`,
          "-e",
          `MYSQL_ROOT_PASSWORD=${password}`,
          databaseImage,
          "--event-scheduler=OFF",
          ...(name === binaryTarget ? [] : ["--skip-log-bin"]),
        );
        assert.match(fixtureId, /^[a-f0-9]{64}$/);
        createdIds.set(name, fixtureId);
        created.push(name);
      }
      for (const name of created) {
        let ready = false;
        for (let attempt = 0; attempt < 90; attempt++) {
          const result = spawnSync(
            "docker",
            [
              "exec",
              "-e",
              "MYSQL_PWD",
              name,
              "mysql",
              "-h127.0.0.1",
              "-uroot",
              "-e",
              "SELECT 1",
            ],
            {
              encoding: "utf8",
              timeout: 10000,
              env: { ...process.env, MYSQL_PWD: password },
            },
          );
          if (result.status === 0) {
            ready = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        assert.equal(ready, true, "isolated MySQL did not become ready");
        if (name === source)
          sql(name, "GRANT SHOW_ROUTINE ON *.* TO 'cofounder'@'%'");
      }
      docker(
        "run",
        "--pull=never",
        "--rm",
        "--read-only",
        "--user",
        "1000:1000",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--cpus",
        "2",
        "--memory",
        "1g",
        "--memory-swap",
        "1g",
        "--pids-limit",
        "256",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
        "--network",
        `container:${source}`,
        "-e",
        `DATABASE_URL=mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`,
        "--workdir",
        "/app/apps/cofounder-discovery",
        "--entrypoint",
        "node",
        appImage,
        "dist/migrate.js",
      );
      sql(
        source,
        "CREATE TABLE recovery_probe (id INT PRIMARY KEY, value VARBINARY(100)) ENGINE=InnoDB; INSERT INTO recovery_probe VALUES (1, UNHEX('00FFA0')), (2, CONVERT('Robert — café 🌍' USING utf8mb4));",
      );
      // Same confined account is the definer in both isolated databases. No
      // root-definer import, expanded restore privilege or scheduled execution.
      assert.equal(sql(source, "SELECT @@GLOBAL.event_scheduler"), "OFF");
      assert.equal(sql(source, "SELECT @@GLOBAL.log_bin"), "0");
      assert.equal(sql(target, "SELECT @@GLOBAL.log_bin"), "0");
      ownerSql(
        source,
        "CREATE VIEW recovery_view AS SELECT id, HEX(value) AS encoded FROM recovery_probe",
      );
      ownerSql(
        source,
        "CREATE PROCEDURE recovery_procedure(IN probe_id INT) READS SQL DATA SELECT HEX(value) FROM recovery_probe WHERE id=probe_id",
      );
      ownerSql(
        source,
        "CREATE TRIGGER recovery_trigger BEFORE INSERT ON recovery_probe FOR EACH ROW SET NEW.value=COALESCE(NEW.value,UNHEX('FF00'))",
      );
      ownerSql(
        source,
        "CREATE EVENT recovery_event ON SCHEDULE EVERY 1 SECOND DO INSERT INTO recovery_probe VALUES (99,UNHEX('EEEE')) ON DUPLICATE KEY UPDATE value=UNHEX('EEEE')",
      );
      const emails = [
        `recovery-a-${suffix}@example.invalid`,
        `recovery-b-${suffix}@example.invalid`,
      ];
      const salt = randomBytes(16);
      const hash =
        "scrypt$" +
        salt.toString("base64url") +
        "$" +
        scryptSync("Synthetic-Restored-Login42!", salt, 64).toString(
          "base64url",
        );
      const owners = emails.map((email, index) => {
        sql(
          source,
          `INSERT INTO users (openId,name,email,password_hash,emailVerified,loginMethod) VALUES ('${randomUUID()}','Synthetic restored owner','${email}','${hash}',1,'local')`,
        );
        const id = Number(
          sql(source, `SELECT id FROM users WHERE email='${email}'`),
        );
        assert.ok(Number.isSafeInteger(id) && id > 0);
        sql(
          source,
          `INSERT INTO prospects (user_id,name,platform,source_kind,consent_status) VALUES (${id},'Restored owner ${index === 0 ? "A" : "B"} candidate','manual','manual','unknown')`,
        );
        return id;
      });
      assert.equal(run("keygen").status, 0);
      const resetToken = randomBytes(32).toString("base64url");
      const resetDigest = createHash("sha256").update(resetToken).digest("hex");
      const oldResetDigest = createHash("sha256")
        .update(randomUUID())
        .digest("hex");
      sql(
        source,
        `UPDATE users SET password_reset_token='${resetDigest}', password_reset_token_expiry=TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP) WHERE id=${owners[0]}`,
      );
      sql(
        source,
        `UPDATE users SET password_reset_token='${oldResetDigest}', password_reset_token_expiry='2020-01-01 00:00:00' WHERE id=${owners[1]}`,
      );
      const retainedResetDigests = sql(
        source,
        "SELECT id,password_reset_token FROM users ORDER BY id",
      );
      const retainedExpiredReset = sql(
        source,
        `SELECT password_reset_token_expiry FROM users WHERE id=${owners[1]}`,
      );
      const verificationToken = randomBytes(32).toString("base64url");
      const verificationDigest = createHash("sha256")
        .update(verificationToken)
        .digest("hex");
      const pendingEmail = `recovery-pending-${suffix}@example.invalid`;
      const emailDigest = createHash("sha256")
        .update(pendingEmail)
        .digest("hex");
      sql(
        source,
        `INSERT INTO users (openId,name,email,password_hash,emailVerified,loginMethod,verificationToken,verificationTokenExpiry,verification_email_digest) VALUES ('${randomUUID()}','Synthetic pending verification','${pendingEmail}','${hash}',0,'local','${verificationDigest}',TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP),'${emailDigest}')`,
      );
      const pendingOwner = Number(
        sql(source, `SELECT id FROM users WHERE email='${pendingEmail}'`),
      );
      assert.ok(Number.isSafeInteger(pendingOwner) && pendingOwner > 0);
      sql(
        source,
        `UPDATE users SET verificationToken='${oldResetDigest}', verificationTokenExpiry='2020-01-01 00:00:00' WHERE id=${owners[1]}`,
      );
      const retainedVerification = sql(
        source,
        "SELECT id,verificationToken,verification_email_digest,emailVerified FROM users ORDER BY id",
      );
      const retainedExpiredVerification = sql(
        source,
        `SELECT verificationTokenExpiry FROM users WHERE id=${owners[1]}`,
      );
      const restoredSessionDigests = owners.map(() =>
        createHash("sha256").update(randomUUID()).digest("hex"),
      );
      for (let index = 0; index < owners.length; index++) {
        sql(
          source,
          `INSERT INTO account_sessions (token_digest,user_id,expires_at,admin_verified_until) VALUES ('${restoredSessionDigests[index]}',${owners[index]},TIMESTAMPADD(DAY,1,CURRENT_TIMESTAMP),TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP))`,
        );
      }
      const expiredDigest = createHash("sha256")
        .update(randomUUID())
        .digest("hex");
      sql(
        source,
        `INSERT INTO account_sessions (token_digest,user_id,expires_at,admin_verified_until) VALUES ('${expiredDigest}',${owners[0]},'2020-01-01 00:00:00',TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP))`,
      );
      const historicalSessions = sql(
        source,
        "SELECT token_digest,user_id,created_at FROM account_sessions ORDER BY token_digest",
      );
      const expiredAt = sql(
        source,
        `SELECT expires_at FROM account_sessions WHERE token_digest='${expiredDigest}'`,
      );
      const mailSecret = randomUUID() + randomUUID();
      const terminalMailIds = [];
      const mailHistory =
        "SELECT id,quota_key,kind,HEX(payload),user_id,state,available_at,lease_until,attempts,provider_id,created_at FROM account_mail_jobs ORDER BY id";
      for (const [index, state] of [
        "queued",
        "sending",
        "queued",
        "sending",
        "accepted",
        "failed",
        "discarded",
      ].entries()) {
        const id = randomUUID();
        if (index >= 4) terminalMailIds.push(id);
        const iv = randomBytes(12);
        const cipher = createCipheriv(
          "aes-256-gcm",
          createHash("sha256").update(mailSecret).digest(),
          iv,
        );
        cipher.setAAD(Buffer.from(`account-mail:${id}`));
        const encrypted = Buffer.concat([
          cipher.update(JSON.stringify({ email: emails[0] }), "utf8"),
          cipher.final(),
        ]);
        const payload = [
          "v1",
          iv.toString("base64url"),
          cipher.getAuthTag().toString("base64url"),
          encrypted.toString("base64url"),
        ].join(".");
        sql(
          source,
          `INSERT INTO account_mail_jobs (id,quota_key,kind,payload,user_id,state,available_at,expires_at,lease_until,attempts,provider_id) VALUES ('${id}','${resetDigest}','${index < 2 ? "password_reset" : "password_changed"}','${payload}',${index === 0 ? "NULL" : owners[0]},'${state}',TIMESTAMPADD(MINUTE,-1,CURRENT_TIMESTAMP),TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP),${state === "sending" ? "TIMESTAMPADD(MINUTE,-1,CURRENT_TIMESTAMP)" : "NULL"},${index % 3},${state === "accepted" ? "'synthetic-historical-ack'" : "NULL"})`,
        );
      }
      const retainedMailHistory = sql(source, mailHistory);
      const terminalMail =
        "SELECT id,HEX(payload),state,expires_at,lease_until,attempts,provider_id FROM account_mail_jobs WHERE state IN ('accepted','failed','discarded') ORDER BY id";
      const retainedTerminalMail = sql(source, terminalMail);
      const backupArgs = [
        "--container",
        source,
        "--database",
        "cofounder_test",
        "--user",
        "cofounder",
        "--maintenance-confirmed",
      ];
      const backup = run("backup", backupArgs);
      assert.equal(backup.status, 0, backup.stderr);
      const bytes = readFileSync(file);
      assert.equal(bytes.includes(Buffer.from("recovery_probe")), false);
      assert.equal(bytes.includes(Buffer.from("CREATE TABLE")), false);
      assert.equal(run("verify").status, 0);
      // Simulate post-backup logout/revocation. Restoring an earlier snapshot
      // must not make these no-longer-authorized sessions active again.
      sql(source, "DELETE FROM account_sessions");
      sql(
        source,
        "UPDATE users SET password_reset_token=NULL, password_reset_token_expiry=NULL",
      );
      sql(
        source,
        "UPDATE users SET verificationToken=NULL, verificationTokenExpiry=NULL, verification_email_digest=NULL",
      );
      // Simulate post-snapshot delivery acknowledgement. The restored queue
      // cannot infer this from the older snapshot and must not replay it.
      sql(
        source,
        "UPDATE account_mail_jobs SET state='accepted',provider_id='synthetic-post-snapshot-ack',payload=NULL,lease_until=NULL WHERE state IN ('queued','sending')",
      );
      if (process.platform === "win32") {
        const wrapperFile = join(folder, "wrapper.cfb");
        const wrapper = spawnSync(
          "pwsh",
          [
            "-NoProfile",
            "-NonInteractive",
            "-File",
            join(repo, "scripts", "backup-database.ps1"),
            "-Container",
            source,
            "-Database",
            "cofounder_test",
            "-User",
            "cofounder",
            "-KeyFile",
            key,
            "-OutputFile",
            wrapperFile,
            "-MaintenanceConfirmed",
          ],
          {
            encoding: "utf8",
            timeout: 120000,
            env: { ...process.env, RECOVERY_DB_PASSWORD: password },
          },
        );
        assert.equal(wrapper.status, 0, wrapper.stderr);
        assert.equal(run("verify", [], wrapperFile).status, 0);
      }
      sql(source, "CREATE TABLE nontransactional_probe (id INT) ENGINE=MyISAM");
      assert.equal(
        run("backup", backupArgs, join(folder, "rejected.cfb")).status,
        1,
      );
      sql(source, "DROP TABLE nontransactional_probe");
      assert.equal(
        run("backup", backupArgs).status,
        1,
        "must not replace an existing backup",
      );
      assert.deepEqual(readFileSync(file), bytes);
      const targetId = docker("inspect", "--format", "{{.Id}}", target);
      const restoreArgs = [
        "--container",
        target,
        "--database",
        "cofounder_test",
        "--user",
        "cofounder",
        "--confirm-target",
        targetId,
      ];
      const corrupt = join(folder, "corrupt.cfb");
      assert.equal(sql(binaryTarget, "SELECT @@GLOBAL.log_bin"), "1");
      const rejectedBinary = run("restore-isolated", [
        "--container",
        binaryTarget,
        "--database",
        "cofounder_test",
        "--user",
        "cofounder",
        "--confirm-target",
        docker("inspect", "--format", "{{.Id}}", binaryTarget),
      ]);
      assert.equal(rejectedBinary.status, 1);
      assert.equal(
        JSON.parse(rejectedBinary.stderr).code,
        "restore_target_rejected",
      );
      assert.equal(
        sql(
          binaryTarget,
          "SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA='cofounder_test'",
        ),
        "0",
      );
      const damaged = Buffer.from(bytes);
      damaged[damaged.length - 1] ^= 1;
      writeFileSync(corrupt, damaged);
      assert.equal(run("restore-isolated", restoreArgs, corrupt).status, 1);
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA='cofounder_test'",
        ),
        "0",
      );
      assert.equal(
        run("restore-isolated", [...restoreArgs.slice(0, -1), "0".repeat(64)])
          .status,
        1,
      );
      sql(target, "SET GLOBAL event_scheduler=ON");
      const scheduled = run("restore-isolated", restoreArgs);
      assert.equal(
        scheduled.status,
        1,
        "restore must not enable restored scheduled events",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA='cofounder_test'",
        ),
        "0",
      );
      sql(target, "SET GLOBAL event_scheduler=OFF");
      // A non-root username alone must not authorize a server-wide account.
      sql(target, "GRANT SELECT ON *.* TO 'cofounder'@'%'");
      const broadRestore = run("restore-isolated", restoreArgs);
      assert.equal(
        broadRestore.status,
        1,
        "server-wide restore privilege must fail closed",
      );
      assert.equal(
        JSON.parse(broadRestore.stderr).code,
        "restore_target_rejected",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA='cofounder_test'",
        ),
        "0",
      );
      sql(target, "REVOKE SELECT ON *.* FROM 'cofounder'@'%'");
      sql(
        target,
        "GRANT ALL PRIVILEGES ON `cofounder\\_test`.* TO 'cofounder'@'%' WITH GRANT OPTION",
      );
      assert.equal(
        run("restore-isolated", restoreArgs).status,
        1,
        "grant delegation must fail closed",
      );
      sql(
        target,
        "REVOKE GRANT OPTION ON `cofounder\\_test`.* FROM 'cofounder'@'%'",
      );
      sql(
        target,
        "CREATE ROLE 'synthetic_restore_role'; GRANT ALL ON cofounder_test.* TO 'synthetic_restore_role'; GRANT 'synthetic_restore_role' TO 'cofounder'@'%'; SET DEFAULT ROLE 'synthetic_restore_role' TO 'cofounder'@'%'",
      );
      assert.equal(
        run("restore-isolated", restoreArgs).status,
        1,
        "active roles must fail closed",
      );
      sql(
        target,
        "SET DEFAULT ROLE NONE TO 'cofounder'@'%'; REVOKE 'synthetic_restore_role' FROM 'cofounder'@'%'; DROP ROLE 'synthetic_restore_role'",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA='cofounder_test'",
        ),
        "0",
      );
      const restored = run("restore-isolated", restoreArgs);
      assert.equal(restored.status, 0, restored.stderr);
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM account_mail_jobs WHERE state IN ('queued','sending') AND expires_at>CURRENT_TIMESTAMP",
        ),
        "0",
        "restore reactivated account mail jobs completed after backup",
      );
      assert.equal(sql(target, mailHistory), retainedMailHistory);
      assert.equal(sql(target, terminalMail), retainedTerminalMail);
      assert.equal(
        sql(
          source,
          "SELECT COUNT(*) FROM account_mail_jobs WHERE state IN ('queued','sending')",
        ),
        "0",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM users WHERE verificationToken IS NOT NULL AND verificationTokenExpiry>CURRENT_TIMESTAMP",
        ),
        "0",
        "restore reactivated an email verification link revoked after backup",
      );
      assert.equal(
        sql(
          target,
          "SELECT id,verificationToken,verification_email_digest,emailVerified FROM users ORDER BY id",
        ),
        retainedVerification,
      );
      assert.equal(
        sql(
          target,
          `SELECT verificationTokenExpiry FROM users WHERE id=${owners[1]}`,
        ),
        retainedExpiredVerification,
      );
      assert.equal(
        sql(
          source,
          "SELECT COUNT(*) FROM users WHERE verificationToken IS NOT NULL",
        ),
        "0",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM users WHERE password_reset_token IS NOT NULL AND password_reset_token_expiry>CURRENT_TIMESTAMP",
        ),
        "0",
        "restore reactivated a password reset link revoked after backup",
      );
      assert.equal(
        sql(
          target,
          `SELECT id,password_reset_token FROM users WHERE id IN (${owners.join(",")}) ORDER BY id`,
        ),
        retainedResetDigests,
      );
      assert.equal(
        sql(
          target,
          `SELECT password_reset_token_expiry FROM users WHERE id=${owners[1]}`,
        ),
        retainedExpiredReset,
      );
      assert.equal(
        sql(
          source,
          "SELECT COUNT(*) FROM users WHERE password_reset_token IS NOT NULL",
        ),
        "0",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM account_sessions WHERE expires_at > CURRENT_TIMESTAMP",
        ),
        "0",
        "restore reactivated sessions revoked after the backup",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM account_sessions WHERE admin_verified_until IS NOT NULL",
        ),
        "0",
      );
      assert.equal(
        sql(
          target,
          "SELECT token_digest,user_id,created_at FROM account_sessions ORDER BY token_digest",
        ),
        historicalSessions,
      );
      assert.equal(
        sql(
          target,
          `SELECT expires_at FROM account_sessions WHERE token_digest='${expiredDigest}'`,
        ),
        expiredAt,
      );
      assert.ok(restored.stdout.includes("restored_sessions_invalidated"));
      assert.equal(
        sql(target, "SELECT id, HEX(value) FROM recovery_probe ORDER BY id"),
        sql(source, "SELECT id, HEX(value) FROM recovery_probe ORDER BY id"),
      );
      assert.equal(
        sql(
          target,
          "SELECT hash, created_at FROM __drizzle_migrations ORDER BY id",
        ),
        sql(
          source,
          "SELECT hash, created_at FROM __drizzle_migrations ORDER BY id",
        ),
      );
      const schema =
        "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM information_schema.columns WHERE TABLE_SCHEMA='cofounder_test' ORDER BY TABLE_NAME, ORDINAL_POSITION";
      assert.equal(sql(target, schema), sql(source, schema));
      const indexes =
        "SELECT TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, NON_UNIQUE FROM information_schema.statistics WHERE TABLE_SCHEMA='cofounder_test' ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX";
      assert.equal(sql(target, indexes), sql(source, indexes));
      for (const objectQuery of [
        "SELECT TABLE_NAME, VIEW_DEFINITION, CHECK_OPTION, IS_UPDATABLE, DEFINER, SECURITY_TYPE FROM information_schema.views WHERE TABLE_SCHEMA='cofounder_test' ORDER BY TABLE_NAME",
        "SELECT ROUTINE_NAME, ROUTINE_TYPE, ROUTINE_DEFINITION, SQL_DATA_ACCESS, SECURITY_TYPE, DEFINER FROM information_schema.routines WHERE ROUTINE_SCHEMA='cofounder_test' ORDER BY ROUTINE_NAME",
        "SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT, ACTION_TIMING, DEFINER FROM information_schema.triggers WHERE TRIGGER_SCHEMA='cofounder_test' ORDER BY TRIGGER_NAME",
        "SELECT EVENT_NAME, EVENT_DEFINITION, EVENT_TYPE, INTERVAL_VALUE, INTERVAL_FIELD, STATUS, DEFINER FROM information_schema.events WHERE EVENT_SCHEMA='cofounder_test' ORDER BY EVENT_NAME",
      ])
        assert.equal(sql(target, objectQuery), sql(source, objectQuery));
      assert.equal(
        ownerSql(target, "SELECT * FROM recovery_view ORDER BY id"),
        ownerSql(source, "SELECT * FROM recovery_view ORDER BY id"),
      );
      assert.equal(ownerSql(target, "CALL recovery_procedure(1)"), "00FFA0");
      assert.equal(sql(target, "SELECT @@GLOBAL.event_scheduler"), "OFF");
      assert.equal(
        sql(target, "SELECT COUNT(*) FROM recovery_probe WHERE id=99"),
        "0",
      );
      assert.equal(
        sql(source, "SELECT COUNT(*) FROM recovery_probe WHERE id=99"),
        "0",
      );
      console.log(
        JSON.stringify({
          event: "restored_schema_objects_passed",
          views: 1,
          procedures: 1,
          triggers: 1,
          scheduledEvents: 1,
          eventSchedulerOff: true,
          scheduledExecution: false,
        }),
      );
      runtime = docker(
        "run",
        "--pull=never",
        "-d",
        "--name",
        `cofounder-recovery-app-${suffix}`,
        "--network",
        `container:${target}`,
        "--read-only",
        "--user",
        "1000:1000",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--cpus",
        "2",
        "--memory",
        "1g",
        "--memory-swap",
        "1g",
        "--pids-limit",
        "256",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
        "--label",
        "cofounder.recovery-application=true",
        "--label",
        `cofounder.synthetic-owner=${suffix}`,
        "--mount",
        `type=bind,source=${join(repo, "scripts", "recovery-application-probe.mjs")},target=/recovery-application-probe.mjs,readonly`,
        "-e",
        "NODE_ENV=production",
        "-e",
        "APP_MODE=production",
        "-e",
        "PORT=13214",
        "-e",
        "PUBLIC_ORIGIN=http://127.0.0.1:13214",
        "-e",
        `DATABASE_URL=mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`,
        "-e",
        "JWT_SECRET=synthetic-restored-application-secret-not-for-production",
        "-e",
        "ENABLE_REGISTRATION=false",
        "-e",
        "ENABLE_PLATFORM_AUTOMATION=false",
        "-e",
        "ENABLE_UNSAFE_LEGACY_ROUTES=false",
        "-e",
        "ENABLE_ACCOUNT_MAIL_WORKER=false",
        "-e",
        "ENABLE_OWNER_NOTIFICATIONS=false",
        "-e",
        "OUTREACH_PAUSED=true",
        "-e",
        "RECOVERY_APPLICATION_FIXTURE=isolated-synthetic-restore",
        "-e",
        `RECOVERY_OWNER_A=${owners[0]}`,
        "-e",
        `RECOVERY_OWNER_B=${owners[1]}`,
        "-e",
        `RECOVERY_EMAIL_A=${emails[0]}`,
        "-e",
        `RECOVERY_EMAIL_B=${emails[1]}`,
        "-e",
        `RECOVERY_REVOKED_RESET_TOKEN=${resetToken}`,
        "-e",
        `RECOVERY_REVOKED_VERIFICATION_TOKEN=${verificationToken}`,
        runtimeImage,
      );
      assert.match(runtime, /^[a-f0-9]{64}$/);
      const appProof = JSON.parse(
        docker("exec", runtime, "node", "/recovery-application-probe.mjs"),
      );
      assert.deepEqual(appProof, {
        event: "restored_application_passed",
        owners: 2,
        ownerScopedCandidates: 2,
        realLogin: true,
        revokedSessions: true,
        revokedResetLink: true,
        revokedVerificationLink: true,
        providerActions: 0,
      });
      console.log(JSON.stringify(appProof));
      const retainedUserAuthority = sql(
        target,
        "SELECT id,password_reset_token,password_reset_token_expiry FROM users ORDER BY id",
      );
      const deliveryHistory =
        "SELECT id,quota_key,kind,user_id,available_at,attempts,provider_id,created_at FROM account_mail_jobs ORDER BY id";
      const retainedDeliveryHistory = sql(target, deliveryHistory);
      const mailProbe = JSON.parse(
        docker(
          "run",
          "--pull=never",
          "--rm",
          "--read-only",
          "--user",
          "1000:1000",
          "--cap-drop",
          "ALL",
          "--security-opt",
          "no-new-privileges",
          "--cpus",
          "2",
          "--memory",
          "1g",
          "--memory-swap",
          "1g",
          "--pids-limit",
          "256",
          "--tmpfs",
          "/tmp:rw,noexec,nosuid,size=64m,mode=1777",
          "--network",
          `container:${target}`,
          "--mount",
          `type=bind,source=${join(repo, "scripts", "recovery-mail-probe.mjs")},target=/recovery-mail-probe.mjs,readonly`,
          "-e",
          "NODE_ENV=production",
          "-e",
          "APP_MODE=production",
          "-e",
          "PUBLIC_ORIGIN=http://127.0.0.1:13214",
          "-e",
          `DATABASE_URL=mysql://cofounder:${password}@127.0.0.1:3306/cofounder_test`,
          "-e",
          "JWT_SECRET=synthetic-restored-application-secret-not-for-production",
          "-e",
          "RESEND_API_KEY=synthetic-recovery-no-provider",
          "-e",
          "AUTH_EMAIL_FROM=accounts@example.invalid",
          "-e",
          `AUTH_MAIL_ENCRYPTION_SECRET=${mailSecret}`,
          "-e",
          "RECOVERY_MAIL_FIXTURE=isolated-synthetic-restore",
          "--workdir",
          "/app/apps/cofounder-discovery",
          "--entrypoint",
          "node",
          appImage,
          "--import",
          "tsx",
          "/recovery-mail-probe.mjs",
        ),
      );
      assert.deepEqual(mailProbe, {
        event: "restored_mail_worker_passed",
        discardedJobs: 4,
        providerAttempts: 0,
        syntheticTransportGuard: true,
        testPackageWorker: true,
      });
      console.log(JSON.stringify(mailProbe));
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM account_mail_jobs WHERE state IN ('queued','sending')",
        ),
        "0",
      );
      assert.equal(
        sql(
          target,
          "SELECT COUNT(*) FROM account_mail_jobs WHERE state='discarded' AND payload IS NULL AND lease_until IS NULL",
        ),
        "4",
      );
      assert.equal(
        sql(
          target,
          terminalMail.replace(
            "state IN ('accepted','failed','discarded')",
            `id IN ('${terminalMailIds.join("','")}')`,
          ),
        ),
        retainedTerminalMail,
      );
      assert.equal(sql(target, deliveryHistory), retainedDeliveryHistory);
      assert.equal(
        sql(
          target,
          "SELECT id,password_reset_token,password_reset_token_expiry FROM users ORDER BY id",
        ),
        retainedUserAuthority,
        "worker must not mint restored reset authority",
      );
      assert.equal(
        sql(target, "SELECT COUNT(*) FROM account_mail_quotas"),
        "0",
        "discard must not reserve delivery budget",
      );
      assert.equal(
        sql(target, `SELECT emailVerified FROM users WHERE id=${pendingOwner}`),
        "0",
        "failed verification request must not verify the pending account",
      );
      assert.equal(
        sql(
          target,
          `SELECT COUNT(*) FROM audit_events WHERE user_id=${pendingOwner} AND action='auth.email_token_redeemed'`,
        ),
        "0",
      );
      ownerSql(target, "INSERT INTO recovery_probe VALUES (3, NULL)");
      assert.equal(
        sql(target, "SELECT HEX(value) FROM recovery_probe WHERE id=3"),
        "FF00",
      );
      assert.equal(
        sql(target, "SELECT COUNT(*) FROM recovery_probe WHERE id=99"),
        "0",
      );
      assert.equal(run("restore-isolated", restoreArgs).status, 1);
      assert.equal(sql(target, "SELECT COUNT(*) FROM recovery_probe"), "3");
      assert.equal(sql(source, "SELECT COUNT(*) FROM recovery_probe"), "2");
      const sourceId = docker("inspect", "--format", "{{.Id}}", source);
      assert.equal(
        run("restore-isolated", [
          "--container",
          source,
          "--database",
          "cofounder_test",
          "--user",
          "cofounder",
          "--confirm-target",
          sourceId,
        ]).status,
        1,
      );
      assert.doesNotMatch(
        backup.stdout + backup.stderr + restored.stdout + restored.stderr,
        /synthetic-recovery|recovery_probe|CREATE TABLE/,
      );
    } finally {
      if (runtime) {
        const info = JSON.parse(
          docker("inspect", "--format", "{{json .}}", runtime),
        );
        assert.equal(
          info.Config.Labels["cofounder.recovery-application"],
          "true",
        );
        assert.equal(info.Image, runtimeImage);
        assert.equal(info.Id, runtime);
        assert.equal(info.Config.Labels["cofounder.synthetic-owner"], suffix);
        assert.equal(Object.keys(info.HostConfig.PortBindings || {}).length, 0);
        docker("stop", "--timeout", "30", info.Id);
        const state = JSON.parse(
          docker("inspect", "--format", "{{json .State}}", info.Id),
        );
        assert.equal(state.ExitCode, 0);
        assert.equal(state.OOMKilled, false);
        assert.match(docker("logs", info.Id), /shutdown_completed/);
        console.log(
          JSON.stringify({
            event: "recovery_fixture_stopped",
            id: info.Id,
            role: "runtime",
            running: state.Running,
            exit: state.ExitCode,
            oom: state.OOMKilled,
          }),
        );
      }
      // Only exact, self-created fixture containers and the mkdtemp folder.
      for (const name of created) {
        const info = JSON.parse(
          docker("inspect", "--format", "{{json .}}", name),
        );
        assert.equal(info.Config.Labels["cofounder.restore-target"], "true");
        assert.equal(info.Id, createdIds.get(name));
        assert.equal(info.Config.Labels["cofounder.synthetic-owner"], suffix);
        assert.equal(info.Image, databaseImage);
        assert.equal(info.HostConfig.NetworkMode, "none");
        assert.equal(Object.keys(info.HostConfig.PortBindings || {}).length, 0);
        assert.ok(info.HostConfig.Tmpfs["/var/lib/mysql"]);
        assert.match(info.Id, /^[a-f0-9]{64}$/);
        docker("stop", "--timeout", "20", info.Id);
        const state = JSON.parse(
          docker("inspect", "--format", "{{json .State}}", info.Id),
        );
        assert.equal(state.Status, "exited");
        assert.equal(state.ExitCode, 0);
        assert.equal(state.OOMKilled, false);
        console.log(
          JSON.stringify({
            event: "recovery_fixture_stopped",
            id: info.Id,
            role:
              name === source
                ? "source"
                : name === target
                  ? "target"
                  : "binary-target",
            running: state.Running,
            exit: state.ExitCode,
            oom: state.OOMKilled,
          }),
        );
      }
      // Refuse a replaced/junction target or any path outside this exact
      // mkdtemp parent before the only recursive scratch cleanup.
      assert.equal(realpathSync(folder), resolve(folder));
      assert.equal(dirname(realpathSync(folder)), temporaryRoot);
      assert.match(basename(folder), /^cofounder-recovery-db-[a-zA-Z0-9]+$/);
      rmSync(folder, { recursive: true, force: true });
    }
  },
);
