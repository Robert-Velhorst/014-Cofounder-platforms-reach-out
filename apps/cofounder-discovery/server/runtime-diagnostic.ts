import { publicRuntimeStatus, type getConfig } from "./config";

type Dependencies = {
  loadConfig: () => ReturnType<typeof getConfig>;
  checkDatabase: () => Promise<"missing" | "connected">;
  closeDatabase: () => Promise<void>;
};
type Check = { name: string; status: "pass" | "warn" | "fail"; detail: string };

// Select fixed facts: exception text and configured addresses stay private.
export async function diagnoseRuntime(
  allowMissing: boolean,
  deps: Dependencies
) {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string, optional = false) => {
    checks.push({
      name,
      status: ok ? "pass" : optional ? "warn" : "fail",
      detail,
    });
  };
  let runtime: ReturnType<typeof publicRuntimeStatus> | undefined;
  try {
    let config: ReturnType<typeof getConfig> | undefined;
    try {
      config = deps.loadConfig();
      add("configuration", true, "Runtime environment is structurally valid");
    } catch {
      add(
        "configuration",
        false,
        "Runtime configuration unavailable or invalid",
        allowMissing
      );
    }
    if (config) {
      runtime = publicRuntimeStatus(config);
      add(
        "jwt_secret",
        Boolean(config.JWT_SECRET),
        config.JWT_SECRET ? "Configured" : "Missing",
        allowMissing
      );
      add(
        "automation_default",
        !config.ENABLE_PLATFORM_AUTOMATION,
        config.ENABLE_PLATFORM_AUTOMATION
          ? "ENABLED - verify provider authorization"
          : "Disabled"
      );
      add(
        "legacy_routes",
        !config.ENABLE_UNSAFE_LEGACY_ROUTES,
        config.ENABLE_UNSAFE_LEGACY_ROUTES
          ? "ENABLED - unsafe imported surface exposed"
          : "Disabled"
      );
      const originPresent = Boolean(config.PUBLIC_ORIGIN);
      add(
        "public_origin",
        config.NODE_ENV !== "production" || originPresent,
        originPresent ? "Configured (value withheld)" : "Not configured",
        allowMissing
      );
      try {
        const database = await deps.checkDatabase();
        add(
          "database",
          database === "connected",
          database === "connected"
            ? "Authenticated SELECT 1 succeeded"
            : config.DATABASE_URL
              ? "Database connection unavailable"
              : "Database is not configured",
          allowMissing
        );
      } catch {
        add("database", false, "Database check unavailable", allowMissing);
      }
    }
  } catch {
    add("diagnostic", false, "Runtime diagnostic unavailable");
  } finally {
    try {
      await deps.closeDatabase();
    } catch {
      add("cleanup", false, "Database cleanup unavailable");
    }
  }
  return {
    ok: checks.every(check => check.status !== "fail"),
    runtimeChecksPassed:
      checks.length > 0 && checks.every(check => check.status === "pass"),
    productionAcceptanceProven: false,
    scope: "configuration_and_authenticated_select1_only",
    allowMissingRuntime: allowMissing,
    ...(runtime ? { runtime } : {}),
    checks,
  };
}
