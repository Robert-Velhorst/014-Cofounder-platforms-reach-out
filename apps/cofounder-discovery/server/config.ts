import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform(value => value === "true");

const optionalString = (minimum = 1) =>
  z.preprocess(
    value => (value === "" ? undefined : value),
    z.string().min(minimum).optional()
  );

const optionalPositiveInteger = z.preprocess(
  value => (value === "" ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_MODE: z.enum(["development", "test", "production", "demo"]).default("development"),
    DATABASE_URL: optionalString(),
    JWT_SECRET: optionalString(32),
    CREDENTIAL_ENCRYPTION_SECRET: optionalString(32),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().default("127.0.0.1"),
    PUBLIC_ORIGIN: z.preprocess(
      value => (value === "" ? undefined : value),
      z.string().url().optional()
    ),
    ENABLE_REGISTRATION: booleanFromString,
    ENABLE_PLATFORM_AUTOMATION: booleanFromString,
    ENABLE_UNSAFE_LEGACY_ROUTES: booleanFromString,
    OUTREACH_PAUSED: booleanFromString,
    TRUST_PROXY: booleanFromString,
    HAI_CONNECTOR_TOKEN: optionalString(32),
    HAI_CONNECTOR_USER_ID: optionalPositiveInteger,
    HAI_CONNECTOR_INCLUDE_CONTENT: booleanFromString,
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;
    for (const field of ["DATABASE_URL", "JWT_SECRET", "PUBLIC_ORIGIN"] as const) {
      if (!value[field]) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is required in production`,
        });
      }
    }
    if (value.APP_MODE === "demo") {
      ctx.addIssue({
        code: "custom",
        path: ["APP_MODE"],
        message: "APP_MODE=demo cannot be used with NODE_ENV=production",
      });
    }
    if (value.ENABLE_PLATFORM_AUTOMATION && !value.CREDENTIAL_ENCRYPTION_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["CREDENTIAL_ENCRYPTION_SECRET"],
        message: "Platform automation requires an independent encryption secret",
      });
    }
    if (Boolean(value.HAI_CONNECTOR_TOKEN) !== Boolean(value.HAI_CONNECTOR_USER_ID)) {
      ctx.addIssue({
        code: "custom",
        path: ["HAI_CONNECTOR_TOKEN"],
        message: "HAI_CONNECTOR_TOKEN and HAI_CONNECTOR_USER_ID must be configured together",
      });
    }
  });

export type RuntimeConfig = z.infer<typeof schema>;

let cached: RuntimeConfig | undefined;

export function getConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  if (env === process.env && cached) return cached;
  const result = schema.safeParse(env);
  if (!result.success) {
    const reasons = result.error.issues
      .map(issue => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid runtime configuration: ${reasons}`);
  }
  if (env === process.env) cached = result.data;
  return result.data;
}

export function resetConfigForTests() {
  cached = undefined;
}

export function publicRuntimeStatus(config = getConfig()) {
  return {
    mode: config.APP_MODE,
    outreachPaused: config.OUTREACH_PAUSED,
    platformAutomation: config.ENABLE_PLATFORM_AUTOMATION ? "enabled" : "disabled",
    legacyRoutes: config.ENABLE_UNSAFE_LEGACY_ROUTES ? "enabled" : "disabled",
    databaseConfigured: Boolean(config.DATABASE_URL),
    haiConnector: config.HAI_CONNECTOR_TOKEN ? "configured" : "disabled",
  } as const;
}
