import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const require = createRequire(import.meta.url);
const entry = resolve("scripts/migrate.ts");
const containerCommand: string[] = JSON.parse(
  readFileSync(resolve("../../Dockerfile"), "utf8")
    .split(/\r?\n/)
    .filter(line => line.startsWith("CMD "))
    .at(-1)!
    .slice(4)
);
let admin: Connection, owner: Connection;
let folder = "",
  database = "",
  databaseUrl = "",
  lockName = "";
const children: ReturnType<typeof start>[] = [];
function start(
  extraEnv: Record<string, string | undefined> = {},
  mode: "source" | "compiled" | "container" = "source"
) {
  const args =
    mode === "container"
      ? containerCommand.slice(1)
      : mode === "compiled"
        ? [resolve("dist/migrate.js")]
        : [require.resolve("tsx/cli"), entry];
  const child = spawn(
    mode === "container" ? containerCommand[0] : process.execPath,
    args,
    {
      cwd: folder,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        MIGRATION_LOCK_TIMEOUT_SECONDS: "3",
        ...extraEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 12000,
    }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", value => (stdout += value.toString()));
  child.stderr.on("data", value => (stderr += value.toString()));
  const done = new Promise<{
    code: number | null;
    signal: string | null;
    stdout: string;
    stderr: string;
  }>((resolveDone, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) =>
      resolveDone({ code, signal, stdout, stderr })
    );
  });
  const result = { child, done };
  children.push(result);
  return result;
}
async function fixture(sql: string) {
  await mkdir(join(folder, "drizzle", "meta"), { recursive: true });
  await writeFile(join(folder, "drizzle", "0000_probe.sql"), sql);
  await writeFile(
    join(folder, "drizzle", "meta", "_journal.json"),
    JSON.stringify({
      version: "7",
      dialect: "mysql",
      entries: [
        {
          idx: 0,
          version: "5",
          when: 1000,
          tag: "0000_probe",
          breakpoints: true,
        },
      ],
    })
  );
}
async function appendMigration() {
  const journalPath = join(folder, "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  journal.entries.push({
    idx: 1,
    version: "5",
    when: 2000,
    tag: "0001_pending",
    breakpoints: true,
  });
  await writeFile(journalPath, JSON.stringify(journal));
  await writeFile(
    join(folder, "drizzle", "0001_pending.sql"),
    "CREATE TABLE pending_probe (id INT PRIMARY KEY);"
  );
}
async function pendingExists() {
  const [rows] = await admin.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE TABLE_SCHEMA=? AND TABLE_NAME='pending_probe'",
    [database]
  );
  return Number(rows[0].n);
}
async function probeExists() {
  const [rows] = await admin.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE TABLE_SCHEMA=? AND TABLE_NAME='migration_probe'",
    [database]
  );
  return Number(rows[0].n);
}
async function journalCount() {
  const [rows] = await owner.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM __drizzle_migrations"
  );
  return Number(rows[0].n);
}
async function waitForQuery(fragment: string) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const [rows] = await admin.query<RowDataPacket[]>(
      "SELECT ID, INFO FROM information_schema.PROCESSLIST WHERE DB=?",
      [database]
    );
    const row = rows.find(
      row => typeof row.INFO === "string" && row.INFO.includes(fragment)
    );
    if (row) return Number(row.ID);
    await new Promise(resolveWait => setTimeout(resolveWait, 40));
  }
  throw new Error(`migration_query_not_observed:${fragment}`);
}

describe("serialized migration startup on isolated MySQL", () => {
  beforeAll(async () => {
    const target = new URL(process.env.DATABASE_URL!);
    if (
      target.hostname !== "127.0.0.1" ||
      target.pathname !== "/cofounder_test" ||
      !process.env.MIGRATION_TEST_ROOT_PASSWORD
    )
      throw new Error("isolated_migration_test_database_required");
    admin = await createConnection({
      host: target.hostname,
      port: Number(target.port || 3306),
      user: "root",
      password: process.env.MIGRATION_TEST_ROOT_PASSWORD,
      database: "cofounder_test",
    });
  });
  beforeEach(async () => {
    database = `cf_migration_test_${randomUUID().replaceAll("-", "")}`;
    if (!/^cf_migration_test_[a-f0-9]{32}$/.test(database))
      throw new Error("unsafe_fixture_database");
    await admin.query(`CREATE DATABASE \`${database}\``);
    const target = new URL(process.env.DATABASE_URL!);
    target.username = "root";
    target.password = process.env.MIGRATION_TEST_ROOT_PASSWORD!;
    target.pathname = `/${database}`;
    databaseUrl = target.toString();
    owner = await createConnection(databaseUrl);
    const [rows] = await owner.query<RowDataPacket[]>(
      "SELECT CONCAT('cofounder:migrate:', LEFT(SHA2(LOWER(DATABASE()),256),40)) AS name"
    );
    lockName = rows[0].name;
    folder = await mkdtemp(join(tmpdir(), "cofounder-migration-test-"));
    await fixture("CREATE TABLE migration_probe (id INT PRIMARY KEY);");
  });
  afterEach(async () => {
    for (const running of children.splice(0)) {
      if (running.child.exitCode === null && running.child.signalCode === null)
        running.child.kill("SIGTERM");
      await running.done;
    }
    await owner?.end();
    if (/^cf_migration_test_[a-f0-9]{32}$/.test(database))
      await admin.query(`DROP DATABASE \`${database}\``);
    if (
      folder.startsWith(resolve(tmpdir()) + sep + "cofounder-migration-test-")
    )
      await rm(folder, { recursive: true, force: true });
  });
  afterAll(async () => {
    await admin?.end();
  });

  it("does not apply any DDL when another connection holds the migration lock", async () => {
    await owner.query("SELECT GET_LOCK(?,0)", [lockName]);
    const result = await start({ MIGRATION_LOCK_TIMEOUT_SECONDS: "1" }).done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('"code":"migration_lock_timeout"');
    expect(result.stdout).not.toContain("migrations_applied");
    expect(await probeExists()).toBe(0);
  });
  it("waits for an observed lock then applies once after its owner releases it", async () => {
    await owner.query("SELECT GET_LOCK(?,0)", [lockName]);
    const running = start();
    await waitForQuery("GET_LOCK");
    expect(await probeExists()).toBe(0);
    await owner.query("SELECT RELEASE_LOCK(?)", [lockName]);
    expect((await running.done).code).toBe(0);
    expect(await probeExists()).toBe(1);
    expect(await journalCount()).toBe(1);
  });
  it("serializes two real processes across DDL implicit commits and journals only once", async () => {
    await fixture(
      "CREATE TABLE migration_probe (id INT PRIMARY KEY);\n--> statement-breakpoint\nSELECT SLEEP(1.5);\n--> statement-breakpoint\nINSERT INTO migration_probe VALUES (1);"
    );
    const first = start();
    await waitForQuery("SLEEP(1.5)");
    const second = start();
    const results = await Promise.all([first.done, second.done]);
    expect(
      results.map(result => result.code),
      JSON.stringify(results)
    ).toEqual([0, 0]);
    expect(await journalCount()).toBe(1);
    const [rows] = await owner.query<RowDataPacket[]>(
      "SELECT id FROM migration_probe"
    );
    expect(rows).toEqual([{ id: 1 }]);
  });
  it("redacts failing SQL and releases its lock without claiming an implicit DDL rollback", async () => {
    await fixture(
      "CREATE TABLE migration_probe (id INT PRIMARY KEY);\n--> statement-breakpoint\nSELECT 'Never-print-migration-content' FROM missing_private_table;"
    );
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr + result.stdout).not.toMatch(
      /Never-print|missing_private_table|synthetic-integration-root-password/
    );
    expect(result.stderr).toContain('"code":"migration_apply_failed"');
    expect(result.stdout).not.toContain("migrations_applied");
    expect(await probeExists()).toBe(1);
    expect(await journalCount()).toBe(0);
    const [rows] = await owner.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?,0) AS acquired",
      [lockName]
    );
    expect(rows[0].acquired).toBe(1);
  });
  it.each(["", "0", "-1", "301", "1.5", "1e2", "abc"])(
    "rejects invalid lock wait %j before writing migration state",
    async value => {
      const result = await start({ MIGRATION_LOCK_TIMEOUT_SECONDS: value })
        .done;
      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        '"code":"migration_configuration_invalid"'
      );
      expect(await probeExists()).toBe(0);
    }
  );
  it("keeps the advisory lock on the exact session executing DDL", async () => {
    await fixture(
      `CREATE TABLE migration_probe (id INT PRIMARY KEY, owns_lock INT NOT NULL);\n--> statement-breakpoint\nINSERT INTO migration_probe VALUES (1, IS_USED_LOCK('${lockName}') = CONNECTION_ID());`
    );
    expect(
      (await start({ MIGRATION_LOCK_TIMEOUT_SECONDS: undefined }).done).code
    ).toBe(0);
    const [rows] = await owner.query<RowDataPacket[]>(
      "SELECT owns_lock FROM migration_probe"
    );
    expect(rows).toEqual([{ owns_lock: 1 }]);
  });
  it("fails after a lost database connection and leaves the migration lock available", async () => {
    await fixture(
      "SELECT SLEEP(30);\n--> statement-breakpoint\nCREATE TABLE migration_probe (id INT PRIMARY KEY);"
    );
    const running = start();
    const connectionId = await waitForQuery("SLEEP(30)");
    await admin.query(`KILL CONNECTION ${connectionId}`);
    const result = await running.done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('"code":"migration_apply_failed"');
    expect(result.stdout).not.toContain("migrations_applied");
    expect(await probeExists()).toBe(0);
    const [rows] = await owner.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?,0) AS acquired",
      [lockName]
    );
    expect(rows[0].acquired).toBe(1);
  });
  it("fails safely on missing migration assets and frees the lock", async () => {
    await rm(join(folder, "drizzle", "meta", "_journal.json"));
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('"code":"migration_assets_invalid"');
    expect(result.stdout).not.toContain("migrations_applied");
    const [rows] = await owner.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?,0) AS acquired",
      [lockName]
    );
    expect(rows[0].acquired).toBe(1);
  });
  it("enforces the lock in the compiled production migration entrypoint", async () => {
    await owner.query("SELECT GET_LOCK(?,0)", [lockName]);
    const result = await start(
      { MIGRATION_LOCK_TIMEOUT_SECONDS: "1" },
      "compiled"
    ).done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('"code":"migration_lock_timeout"');
    expect(await probeExists()).toBe(0);
    await owner.query("SELECT RELEASE_LOCK(?)", [lockName]);
    expect((await start({}, "compiled").done).code).toBe(0);
    expect(await probeExists()).toBe(1);
    expect(await journalCount()).toBe(1);
  });
  it("does not start the application when the actual Docker startup command times out on migration", async () => {
    await symlink(resolve("dist"), join(folder, "dist"), "dir");
    await owner.query("SELECT GET_LOCK(?,0)", [lockName]);
    const result = await start(
      {
        MIGRATION_LOCK_TIMEOUT_SECONDS: "1",
        NODE_ENV: "production",
        APP_MODE: "production",
        HOST: "127.0.0.1",
        PORT: "13184",
        PUBLIC_ORIGIN: "http://127.0.0.1:13184",
        CREDENTIAL_ENCRYPTION_SECRET:
          "synthetic-migration-test-encryption-secret-only",
      },
      "container"
    ).done;
    expect(result.code).toBe(1);
    expect(result.signal).toBeNull();
    expect(result.stderr).toContain('"code":"migration_lock_timeout"');
    expect(await probeExists()).toBe(0);
  });
  it("refuses edited applied SQL before applying a later migration and preserves the journal", async () => {
    expect((await start().done).code).toBe(0);
    const [before] = await owner.query("SELECT * FROM __drizzle_migrations");
    await writeFile(
      join(folder, "drizzle", "0000_probe.sql"),
      "CREATE TABLE migration_probe (id INT PRIMARY KEY); -- changed after application"
    );
    await appendMigration();
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      '"code":"migration_history_review_required"'
    );
    expect(await pendingExists()).toBe(0);
    expect(
      (await owner.query("SELECT * FROM __drizzle_migrations"))[0]
    ).toEqual(before);
  });
  it("rejects an older artifact when database history includes a newer migration", async () => {
    await appendMigration();
    expect((await start().done).code).toBe(0);
    await fixture("CREATE TABLE migration_probe (id INT PRIMARY KEY);");
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      '"code":"migration_history_review_required"'
    );
    expect(await journalCount()).toBe(2);
  });
  it.each(["hash", "gap", "duplicate", "null_timestamp"])(
    "rejects damaged journal case %s without executing pending DDL",
    async damage => {
      expect((await start().done).code).toBe(0);
      if (damage === "hash")
        await owner.query("UPDATE __drizzle_migrations SET hash = ?", [
          "a".repeat(64),
        ]);
      if (damage === "gap")
        await owner.query("UPDATE __drizzle_migrations SET created_at = 2000");
      if (damage === "duplicate")
        await owner.query(
          "INSERT INTO __drizzle_migrations (hash, created_at) SELECT hash, created_at FROM __drizzle_migrations LIMIT 1"
        );
      if (damage === "null_timestamp")
        await owner.query("UPDATE __drizzle_migrations SET created_at = NULL");
      await appendMigration();
      const [before] = await owner.query("SELECT * FROM __drizzle_migrations");
      const result = await start().done;
      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        '"code":"migration_history_review_required"'
      );
      expect(await pendingExists()).toBe(0);
      expect(
        (await owner.query("SELECT * FROM __drizzle_migrations"))[0]
      ).toEqual(before);
    }
  );
  it("refuses to adopt a non-empty database with no migration journal", async () => {
    await owner.query("CREATE TABLE untracked_probe (id INT PRIMARY KEY)");
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      '"code":"migration_history_review_required"'
    );
    expect(await probeExists()).toBe(0);
  });
  it.each([
    "out_of_order",
    "duplicate_timestamp",
    "duplicate_index",
    "path_traversal",
    "wrong_dialect",
  ])(
    "rejects invalid asset manifest case %s before any application DDL",
    async damage => {
      await appendMigration();
      const journalPath = join(folder, "drizzle", "meta", "_journal.json");
      const journal = JSON.parse(readFileSync(journalPath, "utf8"));
      if (damage === "out_of_order") journal.entries.reverse();
      if (damage === "duplicate_timestamp") journal.entries[1].when = 1000;
      if (damage === "duplicate_index") journal.entries[1].idx = 0;
      if (damage === "path_traversal") {
        journal.entries[1].tag = "../outside";
        await writeFile(
          join(folder, "outside.sql"),
          "CREATE TABLE pending_probe (id INT PRIMARY KEY);"
        );
      }
      if (damage === "wrong_dialect") journal.dialect = "postgresql";
      await writeFile(journalPath, JSON.stringify(journal));
      const result = await start().done;
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('"code":"migration_assets_invalid"');
      expect(await probeExists()).toBe(0);
      expect(await pendingExists()).toBe(0);
    }
  );
  it("applies a valid pending suffix once and accepts an unchanged restart", async () => {
    expect((await start().done).code).toBe(0);
    await appendMigration();
    expect((await start().done).code).toBe(0);
    expect((await start().done).code).toBe(0);
    expect(await pendingExists()).toBe(1);
    expect(await journalCount()).toBe(2);
  });
  it("requires review when a non-empty schema has an emptied migration journal", async () => {
    expect((await start().done).code).toBe(0);
    await owner.query("DELETE FROM __drizzle_migrations");
    await appendMigration();
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      '"code":"migration_history_review_required"'
    );
    expect(await journalCount()).toBe(0);
    expect(await pendingExists()).toBe(0);
  });
  it("checks history integrity again before reporting success", async () => {
    expect((await start().done).code).toBe(0);
    await appendMigration();
    await writeFile(
      join(folder, "drizzle", "0001_pending.sql"),
      "UPDATE __drizzle_migrations SET hash = 'damaged';"
    );
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      '"code":"migration_history_verification_failed"'
    );
    expect(result.stdout).not.toContain("migrations_applied");
  });
  it("executes the captured SQL even if a pending file changes during application", async () => {
    await fixture(
      "SELECT SLEEP(2);\n--> statement-breakpoint\nCREATE TABLE migration_probe (id INT PRIMARY KEY);"
    );
    await appendMigration();
    const running = start();
    await waitForQuery("SLEEP(2)");
    await writeFile(
      join(folder, "drizzle", "0001_pending.sql"),
      "SELECT * FROM missing_changed_asset;"
    );
    expect((await running.done).code).toBe(0);
    expect(await pendingExists()).toBe(1);
    const result = await start().done;
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      '"code":"migration_history_review_required"'
    );
  });
  it("rejects history drift in the compiled entrypoint and actual container startup command", async () => {
    expect((await start().done).code).toBe(0);
    await owner.query("UPDATE __drizzle_migrations SET hash = 'damaged'");
    await appendMigration();
    await symlink(resolve("dist"), join(folder, "dist"), "dir");
    for (const mode of ["compiled", "container"] as const) {
      const result = await start({}, mode).done;
      expect(result.code).toBe(1);
      expect(result.signal).toBeNull();
      expect(result.stderr).toContain(
        '"code":"migration_history_review_required"'
      );
      expect(result.stdout).not.toContain("migrations_applied");
      expect(await pendingExists()).toBe(0);
    }
  });
  it("does not expose malformed connection configuration", async () => {
    const result = await start({
      DATABASE_URL: "Never-print-connection-secret",
    }).done;
    expect(result.code).toBe(1);
    expect(result.stdout + result.stderr).not.toContain(
      "Never-print-connection-secret"
    );
    expect(result.stderr).toContain('"code":"migration_configuration_invalid"');
  });
});
