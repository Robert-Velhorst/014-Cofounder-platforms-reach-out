/** Retry only a complete database transaction whose rejection follows rollback.
 * MySQL deadlock victims have no committed effects. Never wrap provider calls,
 * partial transactions, lock timeouts or ambiguous network/commit failures. */
export async function retryRolledBackDeadlock<T>(
  transaction: () => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await transaction();
    } catch (error) {
      let cause: unknown = error;
      let deadlock = false;
      // Drizzle wraps the mysql2 error. Bound traversal and never log SQL/values.
      for (
        let depth = 0;
        depth < 3 && cause && typeof cause === "object";
        depth++
      ) {
        if (
          "code" in cause &&
          cause.code === "ER_LOCK_DEADLOCK" &&
          "errno" in cause &&
          cause.errno === 1213
        ) {
          deadlock = true;
          break;
        }
        cause = "cause" in cause ? cause.cause : undefined;
      }
      if (!deadlock || attempt >= 2) throw error;
    }
  }
}
