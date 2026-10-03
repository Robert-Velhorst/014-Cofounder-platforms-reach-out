import assert from "node:assert/strict";

// MySQL checks disconnected user-lock waiters asynchronously. Process exit is
// not database cleanup: both must complete under the same original deadline.
export async function assertCancelledMigrationReleased({
  observe,
  deadline,
  now = Date.now,
  pause = () => new Promise((resolve) => setTimeout(resolve, 200)),
}) {
  assert.ok(Number.isFinite(deadline));
  while (now() < deadline) {
    const result = await observe();
    assert.equal(result.tables, 0, "cancelled_migration_created_tables");
    assert.equal(
      result.otherConnectionOwnsLock,
      true,
      "migration_holder_lost_lock",
    );
    assert.ok(
      result.waiting === 0 || result.waiting === 1,
      "unexpected_migration_waiters",
    );
    if (now() >= deadline) break;
    if (result.waiting === 0) return;
    await pause();
  }
  assert.fail("cancelled_migration_database_connection_not_released");
}
