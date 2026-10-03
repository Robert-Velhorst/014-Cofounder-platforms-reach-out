import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { open, link, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { confinedRestoreGrants } from "./recovery-restore-authority.mjs";

const MAGIC = Buffer.from("CFBACK01");
const MAX_SQL = 64 * 1024 * 1024;
let phase = "recovery_configuration_invalid";
const fail = () => {
  throw new Error();
};
const event = (name) =>
  console.log(JSON.stringify({ level: "info", event: name }));

function options(args) {
  const command = args.shift();
  const required = {
    keygen: ["key-file"],
    verify: ["key-file", "file"],
    backup: [
      "key-file",
      "file",
      "container",
      "database",
      "user",
      "maintenance-confirmed",
    ],
    "restore-isolated": [
      "key-file",
      "file",
      "container",
      "database",
      "user",
      "confirm-target",
    ],
  }[command];
  if (!required) fail();
  const values = {};
  while (args.length) {
    const flag = args.shift();
    const name = flag?.slice(2);
    if (!flag?.startsWith("--") || !required.includes(name) || name in values)
      fail();
    const value = name === "maintenance-confirmed" ? true : args.shift();
    if (!value || (typeof value === "string" && value.startsWith("--"))) fail();
    values[name] = value;
  }
  if (required.some((key) => !(key in values))) fail();
  if (
    values.container &&
    !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(values.container)
  )
    fail();
  if (
    values.database &&
    (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(values.database) ||
      ["mysql", "sys", "information_schema", "performance_schema"].includes(
        values.database.toLowerCase(),
      ))
  )
    fail();
  if (values.user && !/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(values.user)) fail();
  if (
    values["confirm-target"] &&
    !/^[a-f0-9]{64}$/.test(values["confirm-target"])
  )
    fail();
  if (values.file && resolve(values.file) === resolve(values["key-file"]))
    fail();
  return { command, ...values };
}

async function readBounded(path, limit) {
  const handle = await open(path, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) fail();
    const bytes = Buffer.alloc(stat.size + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        bytes.length - offset,
        null,
      );
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset !== stat.size) fail();
    return bytes.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

// Publish a complete file without replacing anything already at the target.
async function publish(path, bytes) {
  const temporary = `${resolve(path)}.${randomBytes(12).toString("hex")}.partial`;
  let created = false;
  try {
    const handle = await open(temporary, "wx", 0o600);
    created = true;
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await link(temporary, path);
  } finally {
    if (created) await unlink(temporary);
  }
}

function seal(sql, metadata, key) {
  const json = Buffer.from(JSON.stringify(metadata));
  const size = Buffer.alloc(4);
  size.writeUInt32BE(json.length);
  const header = Buffer.concat([MAGIC, size, json]);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  cipher.setAAD(header);
  return Buffer.concat([
    header,
    iv,
    cipher.update(sql),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
}

function authenticate(bytes, key) {
  if (bytes.length < 41 || !bytes.subarray(0, 8).equals(MAGIC)) fail();
  const length = bytes.readUInt32BE(8);
  const end = 12 + length;
  if (length > 4096 || bytes.length <= end + 28) fail();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    bytes.subarray(end, end + 12),
    { authTagLength: 16 },
  );
  decipher.setAAD(bytes.subarray(0, end));
  decipher.setAuthTag(bytes.subarray(-16));
  const provisional = decipher.update(bytes.subarray(end + 12, -16));
  let sql;
  try {
    sql = Buffer.concat([provisional, decipher.final()]);
  } finally {
    provisional.fill(0);
  }
  const metadata = JSON.parse(bytes.subarray(12, end).toString("utf8"));
  if (
    metadata.version !== 1 ||
    !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(metadata.database) ||
    !/^[a-f0-9]{64}$/.test(metadata.sourceContainerId) ||
    !Number.isFinite(Date.parse(metadata.createdAt)) ||
    sql.length === 0 ||
    sql.length > MAX_SQL
  ) {
    sql.fill(0);
    fail();
  }
  return { sql, metadata };
}

async function docker(args, input, limit = 1024 * 1024) {
  return await new Promise((resolveRun, reject) => {
    const child = spawn("docker", args, {
      shell: false,
      windowsHide: true,
      env: { ...process.env, MYSQL_PWD: process.env.RECOVERY_DB_PASSWORD },
      stdio: ["pipe", "pipe", "pipe"],
    });
    const chunks = [];
    let length = 0,
      failed = false;
    const timer = setTimeout(() => {
      failed = true;
      child.kill();
    }, 120000);
    child.stdout.on("data", (chunk) => {
      length += chunk.length;
      if (length > limit) {
        failed = true;
        child.kill();
      } else chunks.push(chunk);
    });
    // Never print SQL, credentials or raw Docker/MySQL diagnostic content.
    child.stderr.resume();
    child.stdin.on("error", () => {
      failed = true;
    });
    child.once("error", () => {
      clearTimeout(timer);
      reject(new Error());
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (failed || code !== 0) {
        for (const chunk of chunks) chunk.fill(0);
        reject(new Error());
      } else {
        const result = Buffer.concat(chunks);
        for (const chunk of chunks) chunk.fill(0);
        resolveRun(result);
      }
    });
    child.stdin.end(input);
  });
}

async function identity(container) {
  const format =
    "[{{json .Id}},{{json .State.Running}},{{json .HostConfig.NetworkMode}},{{json .HostConfig.PortBindings}},{{json .Config.Labels}}]";
  const [id, running, network, ports, labels] = JSON.parse(
    (await docker(["inspect", "--format", format, container])).toString("utf8"),
  );
  if (!/^[a-f0-9]{64}$/.test(id) || !running) fail();
  return { id, network, ports, labels };
}

function mysqlArgs(opts, containerId) {
  return [
    "exec",
    "-i",
    "-e",
    "MYSQL_PWD",
    containerId,
    "mysql",
    "--no-defaults",
    "--host=127.0.0.1",
    `--user=${opts.user}`,
    "--default-character-set=utf8mb4",
    "--batch",
    "--raw",
    "--skip-column-names",
    "--binary-mode",
    "--local-infile=0",
    "--skip-reconnect",
    `--database=${opts.database}`,
  ];
}

async function query(opts, id, statement) {
  return (await docker(mysqlArgs(opts, id), Buffer.from(statement)))
    .toString("utf8")
    .trim();
}

async function main() {
  const opts = options(process.argv.slice(2));
  if (opts.command === "keygen") {
    phase = "recovery_key_creation_failed";
    const key = randomBytes(32);
    try {
      await publish(opts["key-file"], key);
    } finally {
      key.fill(0);
    }
    event("recovery_key_created");
    return;
  }
  phase = "recovery_key_invalid";
  const key = await readBounded(opts["key-file"], 32);
  if (key.length !== 32) fail();
  let sql;
  try {
    if (opts.command === "verify" || opts.command === "restore-isolated") {
      phase = "backup_authentication_failed";
      const authenticated = authenticate(
        await readBounded(opts.file, MAX_SQL + 8192),
        key,
      );
      sql = authenticated.sql;
      if (opts.command === "verify") {
        event("backup_verified");
        return;
      }
      phase = "restore_target_rejected";
      if (
        !process.env.RECOVERY_DB_PASSWORD ||
        opts.user.toLowerCase() === "root" ||
        opts.database !== authenticated.metadata.database
      )
        fail();
      const target = await identity(opts.container);
      if (
        target.id !== opts["confirm-target"] ||
        target.id === authenticated.metadata.sourceContainerId ||
        target.network !== "none" ||
        Object.keys(target.ports ?? {}).length !== 0 ||
        target.labels?.["cofounder.restore-target"] !== "true"
      )
        fail();
      const scheduler = await query(
        opts,
        target.id,
        "SELECT @@GLOBAL.event_scheduler;",
      );
      if (scheduler !== "OFF" && scheduler !== "DISABLED") fail();
      // Confined restores must not require elevated trigger/routine authority
      // or write imported work into a replication stream. Prepare a separate
      // non-binary-logged target, never relax privileges on the live server.
      const binaryLogging = await query(
        opts,
        target.id,
        "SELECT @@GLOBAL.log_bin;",
      );
      if (binaryLogging !== "0") fail();
      const currentRole = await query(
        opts,
        target.id,
        "SELECT CURRENT_ROLE();",
      );
      const grants = await query(
        opts,
        target.id,
        "SHOW GRANTS FOR CURRENT_USER;",
      );
      if (!confinedRestoreGrants(grants, opts.database, currentRole)) fail();
      // Confirm emptiness before any imported SQL. The target must stay exclusively
      // owned by the operator, with no app, worker or other restore connected.
      const empty = await query(
        opts,
        target.id,
        "SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE()) + (SELECT COUNT(*) FROM information_schema.routines WHERE ROUTINE_SCHEMA=DATABASE()) + (SELECT COUNT(*) FROM information_schema.events WHERE EVENT_SCHEMA=DATABASE());",
      );
      if (empty !== "0") fail();
      phase = "restore_apply_failed";
      await docker(mysqlArgs(opts, target.id), sql);
      phase = "restore_verification_failed";
      const journalRows = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM __drizzle_migrations;",
      );
      if (!/^[1-9]\d*$/.test(journalRows)) fail();
      phase = "restored_session_invalidation_failed";
      const sessionTable = await query(
        opts,
        target.id,
        "SELECT TABLE_TYPE FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='account_sessions';",
      );
      if (sessionTable === "BASE TABLE") {
        // A snapshot cannot know about later logouts. Preserve historical rows,
        // but never restore login or administrator step-up authority. Use the
        // session-local clock for TIMESTAMP conversion, not UTC_TIMESTAMP.
        await query(
          opts,
          target.id,
          "UPDATE account_sessions SET expires_at=LEAST(expires_at,CURRENT_TIMESTAMP), admin_verified_until=NULL;",
        );
        const active = await query(
          opts,
          target.id,
          "SELECT COUNT(*) FROM account_sessions WHERE expires_at > CURRENT_TIMESTAMP OR admin_verified_until IS NOT NULL;",
        );
        if (active !== "0") fail();
        event("restored_sessions_invalidated");
      } else if (sessionTable !== "") fail();
      phase = "restored_password_reset_invalidation_failed";
      const resetColumns = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM information_schema.columns c JOIN information_schema.tables t ON t.TABLE_SCHEMA=c.TABLE_SCHEMA AND t.TABLE_NAME=c.TABLE_NAME WHERE c.TABLE_SCHEMA=DATABASE() AND c.TABLE_NAME='users' AND t.TABLE_TYPE='BASE TABLE' AND c.COLUMN_NAME IN ('password_reset_token','password_reset_token_expiry');",
      );
      if (resetColumns !== "2") fail();
      // Backups cannot know which links were consumed/revoked later. Preserve
      // historical digests/expired timestamps; never resurrect reset authority.
      await query(
        opts,
        target.id,
        "UPDATE users SET password_reset_token_expiry=LEAST(password_reset_token_expiry,CURRENT_TIMESTAMP) WHERE password_reset_token IS NOT NULL;",
      );
      const activeResets = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM users WHERE password_reset_token IS NOT NULL AND password_reset_token_expiry > CURRENT_TIMESTAMP;",
      );
      if (activeResets !== "0") fail();
      event("restored_password_reset_links_invalidated");
      phase = "restored_email_verification_invalidation_failed";
      const verificationColumns = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM information_schema.columns c JOIN information_schema.tables t ON t.TABLE_SCHEMA=c.TABLE_SCHEMA AND t.TABLE_NAME=c.TABLE_NAME WHERE c.TABLE_SCHEMA=DATABASE() AND c.TABLE_NAME='users' AND t.TABLE_TYPE='BASE TABLE' AND c.COLUMN_NAME IN ('verificationToken','verificationTokenExpiry');",
      );
      if (verificationColumns !== "2") fail();
      // Do not reclassify verified accounts or erase address-bound historical
      // digests. Only stop a snapshot from reviving stale verification authority.
      await query(
        opts,
        target.id,
        "UPDATE users SET verificationTokenExpiry=LEAST(verificationTokenExpiry,CURRENT_TIMESTAMP) WHERE verificationToken IS NOT NULL;",
      );
      const activeVerifications = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM users WHERE verificationToken IS NOT NULL AND verificationTokenExpiry > CURRENT_TIMESTAMP;",
      );
      if (activeVerifications !== "0") fail();
      event("restored_email_verification_links_invalidated");
      phase = "restored_account_mail_invalidation_failed";
      const mailColumns = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM information_schema.columns c JOIN information_schema.tables t ON t.TABLE_SCHEMA=c.TABLE_SCHEMA AND t.TABLE_NAME=c.TABLE_NAME WHERE c.TABLE_SCHEMA=DATABASE() AND c.TABLE_NAME='account_mail_jobs' AND t.TABLE_TYPE='BASE TABLE' AND c.COLUMN_NAME IN ('state','expires_at');",
      );
      if (mailColumns !== "2") fail();
      // A restored request can otherwise mint a fresh reset token, or retry mail
      // acknowledged after the snapshot. Preserve history and terminal receipts;
      // expire only queued/in-flight work. The normal worker discards it without
      // decrypting payloads, generating tokens or making provider requests.
      await query(
        opts,
        target.id,
        "UPDATE account_mail_jobs SET expires_at=LEAST(expires_at,CURRENT_TIMESTAMP) WHERE state IN ('queued','sending');",
      );
      const activeMail = await query(
        opts,
        target.id,
        "SELECT COUNT(*) FROM account_mail_jobs WHERE state IN ('queued','sending') AND expires_at > CURRENT_TIMESTAMP;",
      );
      if (activeMail !== "0") fail();
      event("restored_account_mail_jobs_expired");
      event("backup_restored_isolated");
    } else if (opts.command === "backup") {
      phase = "backup_source_rejected";
      if (!process.env.RECOVERY_DB_PASSWORD) fail();
      const source = await identity(opts.container);
      const engines = await query(
        opts,
        source.id,
        "SELECT COUNT(*) FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' AND ENGINE <> 'InnoDB';",
      );
      if (engines !== "0") fail();
      const journalRows = await query(
        opts,
        source.id,
        "SELECT COUNT(*) FROM __drizzle_migrations;",
      );
      if (!/^[1-9]\d*$/.test(journalRows)) fail();
      phase = "backup_dump_failed";
      sql = await docker(
        [
          "exec",
          "-e",
          "MYSQL_PWD",
          source.id,
          "mysqldump",
          "--no-defaults",
          "--host=127.0.0.1",
          `--user=${opts.user}`,
          "--single-transaction",
          "--quick",
          "--skip-lock-tables",
          "--set-gtid-purged=OFF",
          "--no-tablespaces",
          "--hex-blob",
          "--default-character-set=utf8mb4",
          "--routines",
          "--triggers",
          "--events",
          opts.database,
        ],
        undefined,
        MAX_SQL,
      );
      if (sql.length === 0) fail();
      const artifact = seal(
        sql,
        {
          version: 1,
          database: opts.database,
          sourceContainerId: source.id,
          createdAt: new Date().toISOString(),
        },
        key,
      );
      phase = "backup_publish_failed";
      await publish(opts.file, artifact);
      event("backup_created");
    }
  } finally {
    key.fill(0);
    sql?.fill(0);
  }
}
main().catch(() => {
  console.error(
    JSON.stringify({ level: "fatal", event: "recovery_failed", code: phase }),
  );
  process.exitCode = 1;
});
