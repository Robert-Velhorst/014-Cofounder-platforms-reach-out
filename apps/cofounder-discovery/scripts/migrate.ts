import "dotenv/config";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb } from "../server/db";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required to apply migrations");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(JSON.stringify({ level: "info", event: "migrations_applied" }));
}

main().catch(error => {
  console.error(
    JSON.stringify({
      level: "fatal",
      event: "migration_failed",
      message: error instanceof Error ? error.message : String(error),
    })
  );
  process.exitCode = 1;
});
