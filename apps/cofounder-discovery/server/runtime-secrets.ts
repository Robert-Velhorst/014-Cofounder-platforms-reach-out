import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";

export const RUNTIME_SECRET_NAMES = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CREDENTIAL_ENCRYPTION_SECRET",
  "AUTH_MAIL_ENCRYPTION_SECRET",
  "RESEND_API_KEY",
  "HAI_CONNECTOR_TOKEN",
] as const;
type SecretName = (typeof RUNTIME_SECRET_NAMES)[number];
const MAX_SECRET_BYTES = 16_384;

// Resolve only explicitly supported variables. Never mutate process.env: mounted
// secrets should not become inherited environment values for spawned processes.
export function readRuntimeSecret(
  name: SecretName,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  const direct = env[name];
  const file = env[`${name}_FILE`];
  if (file === undefined) return direct;
  if (!file || (direct !== undefined && direct !== "")) {
    throw new Error(`Invalid runtime secret configuration: ${name}`);
  }
  let descriptor: number | undefined;
  try {
    descriptor = openSync(file, constants.O_RDONLY | constants.O_NONBLOCK);
    const stat = fstatSync(descriptor);
    if (!stat.isFile() || stat.size > MAX_SECRET_BYTES) throw new Error();
    // Bound the actual read too, even if a file changes after the size check.
    const bytes = Buffer.alloc(MAX_SECRET_BYTES + 1);
    let count = 0;
    while (count < bytes.length) {
      const read = readSync(
        descriptor,
        bytes,
        count,
        bytes.length - count,
        null
      );
      if (read === 0) break;
      count += read;
    }
    if (count > MAX_SECRET_BYTES) throw new Error();
    const value = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })
      .decode(bytes.subarray(0, count))
      .replace(/\r?\n$/, "");
    if (!value.trim() || /[\r\n\0\uFEFF]/.test(value)) throw new Error();
    return value;
  } catch {
    // Deliberately omit the path, value, operating-system error and cause.
    throw new Error(`Runtime secret unavailable or invalid: ${name}`);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

export function resolveRuntimeSecrets(
  env: NodeJS.ProcessEnv
): NodeJS.ProcessEnv {
  const resolved = { ...env };
  for (const name of RUNTIME_SECRET_NAMES) {
    resolved[name] = readRuntimeSecret(name, env);
  }
  return resolved;
}
