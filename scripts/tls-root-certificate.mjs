import { X509Certificate } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const MAX_CERTIFICATE_BYTES = 16384;
const ROOT_CERTIFICATE_PATH = "/data/caddy/pki/authorities/local/root.crt";

export function validateTlsRootCertificate(pem, now = Date.now()) {
  try {
    if (
      typeof pem !== "string" ||
      !Number.isFinite(now) ||
      Buffer.byteLength(pem, "utf8") > MAX_CERTIFICATE_BYTES ||
      !/^-----BEGIN CERTIFICATE-----\r?\n(?:[A-Za-z0-9+/=]+\r?\n)+-----END CERTIFICATE-----\r?\n?$/.test(
        pem,
      )
    )
      throw new Error();
    const certificate = new X509Certificate(pem);
    if (
      !certificate.ca ||
      !certificate.checkIssued(certificate) ||
      !certificate.verify(certificate.publicKey) ||
      Date.parse(certificate.validFrom) > now ||
      Date.parse(certificate.validTo) < now
    )
      throw new Error();
    return {
      pem: certificate.toString(),
      fingerprint256: certificate.fingerprint256,
    };
  } catch {
    // Never echo a malformed value, command stderr, certificate or private key.
    throw new Error("tls_root_certificate_invalid");
  }
}

// The caller independently verifies the exact edge ID, image and fixture owner.
// docker cp cannot reliably read tmpfs; exec reads this one public file from the
// mounted namespace. Never read the adjacent private key or disable TLS checks.
export async function readTlsRootCertificate({
  run,
  containerId,
  timeoutMs = 15000,
  clock = () => performance.now(),
  pause = delay,
  now = Date.now,
}) {
  if (
    !/^[a-f0-9]{64}$/.test(containerId ?? "") ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 100 ||
    timeoutMs > 30000
  )
    throw new Error("tls_root_certificate_configuration_invalid");
  const deadline = clock() + timeoutMs;
  while (clock() < deadline) {
    const result = run(
      [
        "exec",
        containerId,
        "head",
        "-c",
        String(MAX_CERTIFICATE_BYTES + 1),
        ROOT_CERTIFICATE_PATH,
      ],
      Math.min(2000, Math.max(1, Math.floor(deadline - clock()))),
    );
    if (result.status === 0)
      return validateTlsRootCertificate(result.stdout, now());
    // Missing yet-unprovisioned certs and transient reads re-observe the same ID.
    // The total deadline never resets and no replacement container is created.
    if (clock() >= deadline) break;
    await pause(Math.min(250, Math.max(1, Math.floor(deadline - clock()))));
  }
  throw new Error("tls_root_certificate_unavailable");
}
