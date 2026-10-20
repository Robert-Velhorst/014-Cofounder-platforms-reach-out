import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getConfig } from "./config";
import { readRuntimeSecret, resolveRuntimeSecrets } from "./runtime-secrets";

const directories: string[] = [];
function secret(value: string | Buffer): string {
  const directory = mkdtempSync(join(tmpdir(), "cofounder-secret-fixture-"));
  directories.push(directory);
  const file = join(directory, "fixture.secret");
  writeFileSync(file, value, { mode: 0o600 });
  return file;
}
afterEach(() => {
  // Only exact temporary directories created by this test are removed.
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("explicit mounted runtime secrets", () => {
  it.each(["", "\n", "\r\n"])(
    "loads a UTF-8 secret with trailing %j",
    suffix => {
      const env = { JWT_SECRET_FILE: secret("synthetic-key" + suffix) };
      expect(readRuntimeSecret("JWT_SECRET", env)).toBe("synthetic-key");
      expect(env).not.toHaveProperty("JWT_SECRET");
    }
  );

  it("keeps environment-only usage and ignores unknown file variables", () => {
    expect(readRuntimeSecret("JWT_SECRET", { JWT_SECRET: "synthetic" })).toBe(
      "synthetic"
    );
    expect(readRuntimeSecret("JWT_SECRET", {})).toBeUndefined();
    expect(
      resolveRuntimeSecrets({ OTHER_FILE: "/missing/private" }).OTHER_FILE
    ).toBe("/missing/private");
  });

  it("rejects ambiguous sources and explicitly empty file paths", () => {
    for (const env of [
      { JWT_SECRET: "private-value", JWT_SECRET_FILE: secret("other-private") },
      { JWT_SECRET_FILE: "" },
    ]) {
      expect(() => readRuntimeSecret("JWT_SECRET", env)).toThrow(
        "Invalid runtime secret configuration: JWT_SECRET"
      );
    }
    expect(
      readRuntimeSecret("JWT_SECRET", {
        JWT_SECRET: "",
        JWT_SECRET_FILE: secret("synthetic"),
      })
    ).toBe("synthetic");
  });

  it.each([
    "",
    " \t",
    "private\nsecond-line",
    "private\0content",
    "private\n\n",
    "\uFEFFprivate",
    "x".repeat(16_385),
    Buffer.from([0xff, 0xfe]),
  ])("rejects invalid file content without echoing it", value => {
    const file = secret(value);
    expect(() =>
      readRuntimeSecret("JWT_SECRET", { JWT_SECRET_FILE: file })
    ).toThrow("Runtime secret unavailable or invalid: JWT_SECRET");
  });

  it("accepts exactly the bounded file size", () => {
    expect(
      readRuntimeSecret("JWT_SECRET", {
        JWT_SECRET_FILE: secret("x".repeat(16_384)),
      })
    ).toHaveLength(16_384);
  });

  it("rejects missing and directory paths without leaking paths or OS errors", () => {
    const directory = join(secret("unused"), "..");
    for (const path of [directory, join(directory, "private-missing-secret")]) {
      try {
        readRuntimeSecret("JWT_SECRET", { JWT_SECRET_FILE: path });
        throw new Error("expected_failure");
      } catch (error) {
        expect((error as Error).message).toBe(
          "Runtime secret unavailable or invalid: JWT_SECRET"
        );
      }
    }
  });

  it("loads all configured secrets into validated config without mutating or exposing the input", () => {
    const env = {
      NODE_ENV: "production",
      APP_MODE: "production",
      PUBLIC_ORIGIN: "https://example.invalid",
      DATABASE_URL_FILE: secret(
        "mysql://synthetic:synthetic@example.invalid/cofounder"
      ),
      JWT_SECRET_FILE: secret(
        "synthetic-session-secret-with-more-than-32-characters"
      ),
      ENABLE_ACCOUNT_MAIL_WORKER: "true",
      AUTH_EMAIL_FROM: "sender@example.invalid",
      AUTH_MAIL_ENCRYPTION_SECRET_FILE: secret(
        "synthetic-independent-mail-secret-more-than-32-characters"
      ),
      RESEND_API_KEY_FILE: secret("synthetic-mail-provider-key"),
    };
    const config = getConfig(env);
    expect(config.JWT_SECRET).toBe(
      "synthetic-session-secret-with-more-than-32-characters"
    );
    expect(config.DATABASE_URL).toContain("mysql://synthetic:");
    expect(config.ENABLE_ACCOUNT_MAIL_WORKER).toBe(true);
    expect(config.RESEND_API_KEY).toBe("synthetic-mail-provider-key");
    expect(env).not.toHaveProperty("JWT_SECRET");
    expect(env).not.toHaveProperty("DATABASE_URL");
    expect(config).not.toHaveProperty("JWT_SECRET_FILE");
  });

  it("still validates short or missing production secrets", () => {
    expect(() =>
      getConfig({ NODE_ENV: "production", JWT_SECRET_FILE: secret("short") })
    ).toThrow(/JWT_SECRET/);
  });
});
