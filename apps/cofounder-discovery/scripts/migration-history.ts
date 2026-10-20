import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MigrationMeta } from "drizzle-orm/migrator";
import type { Connection, RowDataPacket } from "mysql2/promise";

/** Capture exactly the SQL whose hashes we validate; never reread it to apply. */
export function readMigrationSnapshot(folder: string): MigrationMeta[] {
  const journal = JSON.parse(
    readFileSync(join(folder, "meta", "_journal.json"), "utf8")
  );
  if (
    journal?.version !== "7" ||
    journal.dialect !== "mysql" ||
    !Array.isArray(journal.entries) ||
    journal.entries.length === 0 ||
    journal.entries.length > 10000
  )
    throw new Error();
  let previous = 0;
  return journal.entries.map(
    (entry: Record<string, unknown>, index: number) => {
      if (
        !entry ||
        entry.idx !== index ||
        entry.version !== "5" ||
        typeof entry.when !== "number" ||
        !Number.isSafeInteger(entry.when) ||
        entry.when <= previous ||
        typeof entry.breakpoints !== "boolean" ||
        typeof entry.tag !== "string" ||
        !/^\d{4}_[A-Za-z0-9_]+$/.test(entry.tag) ||
        !entry.tag.startsWith(`${String(index).padStart(4, "0")}_`)
      )
        throw new Error();
      previous = entry.when;
      const bytes = readFileSync(join(folder, `${entry.tag}.sql`));
      const query = bytes.toString("utf8");
      if (!query.trim() || !Buffer.from(query, "utf8").equals(bytes))
        throw new Error();
      return {
        sql: query.split("--> statement-breakpoint"),
        bps: entry.breakpoints,
        folderMillis: entry.when,
        hash: createHash("sha256").update(query).digest("hex"),
      };
    }
  );
}

/** History must be an exact prefix, not merely have a recent final timestamp. */
export async function verifyMigrationHistory(
  connection: Connection,
  snapshot: MigrationMeta[],
  complete = false
): Promise<void> {
  const [tables] = await connection.query<RowDataPacket[]>(
    "SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE()"
  );
  const journalExists = tables.some(row => row.name === "__drizzle_migrations");
  if (!journalExists) {
    if (complete || tables.length !== 0) throw new Error();
    return;
  }
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY id LIMIT ?",
    [snapshot.length + 1]
  );
  if (
    rows.length > snapshot.length ||
    (complete && rows.length !== snapshot.length) ||
    (rows.length === 0 && tables.length > 1)
  )
    throw new Error();
  let previousId = 0;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const id = Number(row.id);
    const timestamp = Number(row.created_at);
    if (
      !Number.isSafeInteger(id) ||
      id <= previousId ||
      row.created_at === null ||
      !Number.isSafeInteger(timestamp) ||
      timestamp !== snapshot[index].folderMillis ||
      row.hash !== snapshot[index].hash
    )
      throw new Error();
    previousId = id;
  }
}
