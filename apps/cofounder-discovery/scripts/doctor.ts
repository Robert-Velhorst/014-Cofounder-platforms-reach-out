import "dotenv/config";
import { sql } from "drizzle-orm";
import { getConfig, publicRuntimeStatus } from "../server/config";
import { getDb } from "../server/db";

const allowMissing = process.argv.includes("--allow-missing-runtime");
const checks: Array<{ name: string; status: "pass" | "warn" | "fail"; detail: string }> = [];

function add(name: string, ok: boolean, detail: string, optional = false) {
  checks.push({ name, status: ok ? "pass" : optional ? "warn" : "fail", detail });
}

async function main() {
  let config;
  try {
    config = getConfig();
    add("configuration", true, "Runtime environment is structurally valid");
  } catch (error) {
    add("configuration", false, error instanceof Error ? error.message : String(error), allowMissing);
    console.log(JSON.stringify({ ok: allowMissing, checks }, null, 2));
    process.exitCode = allowMissing ? 0 : 1;
    return;
  }

  add("jwt_secret", Boolean(config.JWT_SECRET), config.JWT_SECRET ? "Configured" : "Missing", allowMissing);
  add("automation_default", !config.ENABLE_PLATFORM_AUTOMATION, config.ENABLE_PLATFORM_AUTOMATION ? "ENABLED - verify provider authorization" : "Disabled");
  add("legacy_routes", !config.ENABLE_UNSAFE_LEGACY_ROUTES, config.ENABLE_UNSAFE_LEGACY_ROUTES ? "ENABLED - unsafe imported surface exposed" : "Disabled");
  add("public_origin", config.NODE_ENV !== "production" || Boolean(config.PUBLIC_ORIGIN), config.PUBLIC_ORIGIN ?? "Not required outside production", allowMissing);

  const db = await getDb();
  if (!db) {
    add("database", false, "DATABASE_URL is missing", allowMissing);
  } else {
    try {
      await db.execute(sql`select 1`);
      add("database", true, "Connection succeeded");
    } catch (error) {
      add("database", false, error instanceof Error ? error.message : String(error), allowMissing);
    }
  }

  const ok = checks.every(check => check.status !== "fail");
  console.log(JSON.stringify({ ok, runtime: publicRuntimeStatus(config), checks }, null, 2));
  process.exitCode = ok ? 0 : 1;
}

main().catch(error => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
