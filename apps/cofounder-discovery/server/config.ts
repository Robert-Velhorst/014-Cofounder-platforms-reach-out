import { z } from "zod";
import { resolveRuntimeSecrets } from "./runtime-secrets";

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

// Missing uses a bounded beta default; an explicitly empty/invalid value is an
// operator error, never an accidental unlimited deployment. Zero pauses growth.
const capacityLimit = (fallback: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .default(String(fallback))
    .transform(Number)
    .pipe(z.number().int().min(0).max(10_000_000));

const webOrigin = z.string().transform((value, ctx) => {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("invalid_origin");
    }
    return url.origin;
  } catch {
    ctx.addIssue({
      code: "custom",
      message:
        "Use an HTTP(S) origin without credentials, path, query or fragment",
    });
    return z.NEVER;
  }
});

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_MODE: z
      .enum(["development", "test", "production", "demo"])
      .default("development"),
    DATABASE_URL: optionalString(),
    JWT_SECRET: optionalString(32),
    CREDENTIAL_ENCRYPTION_SECRET: optionalString(32),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().default("127.0.0.1"),
    PUBLIC_ORIGIN: z.preprocess(
      value => (value === "" ? undefined : value),
      webOrigin.optional()
    ),
    ENABLE_REGISTRATION: booleanFromString,
    ENABLE_ACCOUNT_DELETION_REQUESTS: booleanFromString,
    API_MAX_ACTIVE_WORK: z
      .string()
      .regex(/^\d+$/)
      .default("32")
      .transform(Number)
      .pipe(z.number().int().min(0).max(1024)),
    CAPACITY_ACCOUNTS: capacityLimit(100),
    CAPACITY_SESSIONS_PER_ACCOUNT: capacityLimit(10),
    CAPACITY_PROSPECTS_TOTAL: capacityLimit(50_000),
    CAPACITY_PROSPECTS_PER_ACCOUNT: capacityLimit(1_000),
    CAPACITY_OUTREACH_TOTAL: capacityLimit(25_000),
    CAPACITY_OUTREACH_PER_ACCOUNT: capacityLimit(500),
    CAPACITY_WORKSPACE_AUDIT_TOTAL: capacityLimit(100_000),
    CAPACITY_WORKSPACE_AUDIT_PER_ACCOUNT: capacityLimit(10_000),
    ENABLE_ACCOUNT_MAIL_WORKER: booleanFromString,
    ENABLE_ACCOUNT_MAIL_RETENTION: booleanFromString,
    ENABLE_OWNER_NOTIFICATIONS: booleanFromString,
    ACCOUNT_MAIL_DAILY_ATTEMPTS: capacityLimit(100),
    ACCOUNT_MAIL_MONTHLY_ATTEMPTS: capacityLimit(1_000),
    ENABLE_PLATFORM_AUTOMATION: booleanFromString,
    ENABLE_UNSAFE_LEGACY_ROUTES: booleanFromString,
    OUTREACH_PAUSED: booleanFromString,
    RESEND_API_KEY: optionalString(),
    AUTH_MAIL_ENCRYPTION_SECRET: optionalString(32),
    AUTH_EMAIL_FROM: z.preprocess(
      value => (value === "" ? undefined : value),
      z.string().email().optional()
    ),
    TRUST_PROXY: booleanFromString,
    HAI_CONNECTOR_TOKEN: optionalString(32),
    HAI_CONNECTOR_USER_ID: optionalPositiveInteger,
    HAI_CONNECTOR_INCLUDE_CONTENT: booleanFromString,
  })
  .superRefine((value, ctx) => {
    if (value.ENABLE_ACCOUNT_MAIL_RETENTION && !value.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message:
          "DATABASE_URL is required when account mail retention is enabled",
      });
    }
    if (value.ENABLE_ACCOUNT_MAIL_WORKER) {
      for (const field of [
        "DATABASE_URL",
        "AUTH_MAIL_ENCRYPTION_SECRET",
        "RESEND_API_KEY",
        "AUTH_EMAIL_FROM",
        "PUBLIC_ORIGIN",
      ] as const) {
        if (!value[field])
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required when account mail delivery is enabled`,
          });
      }
    }
    if (value.NODE_ENV !== "production") return;
    if (value.PUBLIC_ORIGIN) {
      const origin = new URL(value.PUBLIC_ORIGIN);
      if (
        origin.protocol !== "https:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["PUBLIC_ORIGIN"],
          message: "Non-local production origins require HTTPS",
        });
      }
    }
    for (const field of [
      "DATABASE_URL",
      "JWT_SECRET",
      "PUBLIC_ORIGIN",
    ] as const) {
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
    if (
      value.ENABLE_PLATFORM_AUTOMATION &&
      !value.CREDENTIAL_ENCRYPTION_SECRET
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["CREDENTIAL_ENCRYPTION_SECRET"],
        message:
          "Platform automation requires an independent encryption secret",
      });
    }
    if (
      Boolean(value.HAI_CONNECTOR_TOKEN) !==
      Boolean(value.HAI_CONNECTOR_USER_ID)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["HAI_CONNECTOR_TOKEN"],
        message:
          "HAI_CONNECTOR_TOKEN and HAI_CONNECTOR_USER_ID must be configured together",
      });
    }
  });

export type RuntimeConfig = z.infer<typeof schema>;

let cached: RuntimeConfig | undefined;

export function getConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  if (env === process.env && cached) return cached;
  const result = schema.safeParse(resolveRuntimeSecrets(env));
  if (!result.success) {
    const reasons = result.error.issues
      .map(
        issue => `${issue.path.join(".") || "environment"}: ${issue.message}`
      )
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
    platformAutomation: config.ENABLE_PLATFORM_AUTOMATION
      ? "enabled"
      : "disabled",
    legacyRoutes: config.ENABLE_UNSAFE_LEGACY_ROUTES ? "enabled" : "disabled",
    databaseConfigured: Boolean(config.DATABASE_URL),
    haiConnector: config.HAI_CONNECTOR_TOKEN ? "configured" : "disabled",
  } as const;
}
