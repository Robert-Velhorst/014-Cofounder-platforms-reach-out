/**
 * Encryption helpers for secure credential storage
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive an encryption key from an explicitly configured secret.
 *
 * Credentials must never be encrypted with a checked-in fallback value: anyone
 * with the source could decrypt them. CREDENTIAL_ENCRYPTION_SECRET is preferred
 * so rotating application JWTs does not invalidate stored credentials.
 */
function deriveKey(salt: Buffer): Buffer {
  const secret =
    process.env.CREDENTIAL_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_SECRET (or JWT_SECRET) must be configured before storing platform credentials"
    );
  }
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt a plaintext string
 * Returns base64-encoded: salt + iv + tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted string
 */
export function decrypt(encryptedBase64: string): string {
  const combined = Buffer.from(encryptedBase64, "base64");

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Hash a value for comparison (one-way)
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
