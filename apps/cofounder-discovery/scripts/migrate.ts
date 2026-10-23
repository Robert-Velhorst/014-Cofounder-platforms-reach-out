import "dotenv/config";
import { readRuntimeSecret } from "../server/runtime-secrets";
import { migrationVerificationOnly } from "../server/migration-startup-mode";
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";
import { MySql2Session } from "drizzle-orm/mysql2";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import {
  readMigrationSnapshot,
  verifyMigrationHistory,
} from "./migration-history";

async function main() {
  let connection: Connection | undefined;
  let lockName: string | undefined;
  let locked = false;
  let phase = "migration_configuration_invalid";
  let failure: string | undefined;
  let verifyOnly = false;
  try {
    verifyOnly = migrationVerificationOnly(process.argv.slice(2));
    const databaseUrl = readRuntimeSecret("DATABASE_URL");
    if (!databaseUrl) throw new Error();
    const target = new URL(databaseUrl);
    const wait = process.env.MIGRATION_LOCK_TIMEOUT_SECONDS ?? "60";
    if (
      target.protocol !== "mysql:" ||
      !target.hostname ||
      !target.username ||
      target.pathname.length < 2 ||
      !/^[1-9]\d{0,2}$/.test(wait) ||
      Number(wait) > 300
    )
      throw new Error();
    phase = "migration_connection_failed";
    // A dedicated physical connection holds the lock through Drizzle's commits.
    // Never acquire a connection-scoped advisory lock through the app's pool.
    connection = await createConnection(databaseUrl);
    phase = "migration_lock_failed";
    const [names] = await connection.query<RowDataPacket[]>(
      "SELECT CONCAT('cofounder:migrate:', LEFT(SHA2(LOWER(DATABASE()),256),40)) AS name"
    );
    lockName = names[0]?.name;
    if (
      typeof lockName !== "string" ||
      !/^cofounder:migrate:[a-f0-9]{40}$/.test(lockName)
    )
      throw new Error();
    const [locks] = await connection.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?, ?) AS acquired",
      [lockName, Number(wait)]
    );
    if (locks[0]?.acquired !== 1) {
      if (locks[0]?.acquired === 0) phase = "migration_lock_timeout";
      throw new Error();
    }
    locked = true;
    phase = "migration_assets_invalid";
    const snapshot = readMigrationSnapshot("./drizzle");
    if (verifyOnly) {
      phase = "migration_history_verification_failed";
      // Read-only: never invoke Drizzle, create its journal or execute captured
      // SQL. An empty, incomplete, newer or damaged history must refuse startup.
      await verifyMigrationHistory(connection, snapshot, true);
    } else {
      phase = "migration_history_review_required";
      await verifyMigrationHistory(connection, snapshot);
      phase = "migration_apply_failed";
      // Use Drizzle's pinned engine and journal format, but pass the captured SQL
      // instead of letting the public filesystem wrapper reread mutable assets.
      const dialect = new MySqlDialect();
      const session = new MySql2Session<
        Record<string, never>,
        Record<string, never>
      >(connection, dialect, undefined, { mode: "default" });
      await dialect.migrate(snapshot, session, {
        migrationsFolder: "./drizzle",
      });
      phase = "migration_history_verification_failed";
      await verifyMigrationHistory(connection, snapshot, true);
    }
  } catch {
    // Driver and Drizzle errors can contain SQL, values and connection details.
    failure = phase;
  } finally {
    if (connection) {
      if (locked) {
        try {
          const [released] = await connection.query<RowDataPacket[]>(
            "SELECT RELEASE_LOCK(?) AS released",
            [lockName]
          );
          if (released[0]?.released !== 1) throw new Error();
        } catch {
          failure ??= "migration_lock_release_failed";
        }
      }
      try {
        await connection.end();
      } catch {
        connection.destroy();
        failure ??= "migration_connection_close_failed";
      }
    }
  }
  if (failure) {
    console.error(
      JSON.stringify({
        level: "fatal",
        event: "migration_failed",
        code: failure,
      })
    );
    process.exitCode = 1;
  } else
    console.log(
      JSON.stringify({
        level: "info",
        event: verifyOnly ? "migration_history_verified" : "migrations_applied",
      })
    );
}

main().catch(() => {
  console.error(
    JSON.stringify({
      level: "fatal",
      event: "migration_failed",
      code: "migration_unexpected_failure",
    })
  );
  process.exitCode = 1;
});
