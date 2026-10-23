// Synthetic release-test helper; never used by the production entry point.
import assert from "node:assert/strict";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [[{ name }]] = await connection.query(
  "SELECT CONCAT('cofounder:migrate:',LEFT(SHA2(LOWER(DATABASE()),256),40)) AS name",
);
if (process.argv[2] === "hold") {
  const [[row]] = await connection.query("SELECT GET_LOCK(?,0) AS acquired", [
    name,
  ]);
  assert.equal(row.acquired, 1, "synthetic_lock_unavailable");
  console.log(JSON.stringify({ event: "synthetic_lock_held" }));
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await connection.query("SELECT RELEASE_LOCK(?)", [name]);
    await connection.end();
  };
  process.on("SIGTERM", () => void stop());
  process.on("SIGINT", () => void stop());
} else {
  assert.equal(process.argv[2], "observe");
  try {
    const [rows] = await connection.query("SHOW PROCESSLIST");
    const [[{ tables }]] = await connection.query(
      "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE()",
    );
    const [[{ owner }]] = await connection.query(
      "SELECT IS_USED_LOCK(?) AS owner",
      [name],
    );
    // The separate observer must not own the lock itself.
    console.log(
      JSON.stringify({
        waiting: rows.filter(
          (row) =>
            String(row.Info).includes("GET_LOCK") &&
            row.Id !== connection.threadId,
        ).length,
        tables: Number(tables),
        otherConnectionOwnsLock:
          owner !== null && Number(owner) !== connection.threadId,
      }),
    );
  } finally {
    await connection.end();
  }
}
