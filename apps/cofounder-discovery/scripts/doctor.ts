// Validate arguments before loading environment/secret consumers. Never echo them.
async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  if (
    args.length > 1 ||
    (args.length === 1 && args[0] !== "--allow-missing-runtime")
  ) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "invalid_diagnostic_arguments",
        productionAcceptanceProven: false,
      })
    );
    process.exitCode = 1;
    return;
  }
  const allowMissing = args.length === 1;
  const { diagnoseRuntime } = await import("../server/runtime-diagnostic");
  await import("dotenv/config");
  const { getConfig } = await import("../server/config");
  let database: typeof import("../server/db") | undefined;
  const report = await diagnoseRuntime(allowMissing, {
    loadConfig: getConfig,
    checkDatabase: async () => {
      database = await import("../server/db");
      const db = await database.getDb();
      if (!db) return "missing";
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`select 1`);
      return "connected";
    },
    closeDatabase: async () => {
      await database?.closeDb();
    },
  });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
main().catch(() => {
  console.error(
    JSON.stringify({
      ok: false,
      error: "runtime_diagnostic_unavailable",
      productionAcceptanceProven: false,
    })
  );
  process.exitCode = 1;
});
