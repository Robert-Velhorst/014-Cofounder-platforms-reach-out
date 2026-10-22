import { spawnSync } from "node:child_process";
import { isAbsolute, resolve, sep, parse } from "node:path";
import { homedir } from "node:os";
import { isIP } from "node:net";
import { realpathSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const imageDigest = /^[a-z0-9][a-z0-9._:/-]*@sha256:[a-f0-9]{64}$/;
export function validateHetznerInputs(env) {
  for (const key of [
    "PRODUCTION_APP_IMAGE",
    "PRODUCTION_EDGE_IMAGE",
    "PRODUCTION_DATABASE_IMAGE",
  ]) {
    if (!imageDigest.test(env[key] ?? ""))
      throw new Error("hetzner_image_digest_required");
  }
  const hostname = env.PUBLIC_HOSTNAME ?? "";
  if (
    hostname.length > 253 ||
    isIP(hostname) ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      hostname,
    )
  )
    throw new Error("hetzner_dns_hostname_required");
  if (env.PUBLIC_ORIGIN !== `https://${hostname}`)
    throw new Error("hetzner_origin_hostname_mismatch");
  const data = env.HETZNER_DATA_ROOT ?? "";
  if (!isAbsolute(data))
    throw new Error("hetzner_absolute_data_directory_required");
  let actual;
  try {
    actual = realpathSync(data);
    if (!statSync(actual).isDirectory()) throw new Error();
  } catch {
    throw new Error("hetzner_data_directory_unavailable");
  }
  const normalized = (value) =>
    process.platform === "win32" ? value.toLowerCase() : value;
  const path = normalized(actual),
    checkout = normalized(realpathSync(root));
  if (
    path === normalized(parse(path).root) ||
    path === normalized(realpathSync(homedir())) ||
    path === checkout ||
    path.startsWith(checkout + sep)
  )
    throw new Error("hetzner_data_directory_outside_checkout_required");
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    if (process.argv.length !== 2)
      throw new Error("hetzner_arguments_not_supported");
    validateHetznerInputs(process.env);
    // Quiet validation deliberately never prints the resolved model, secret
    // paths, environment values, Docker stderr or commercial account details.
    const result = spawnSync(
      "docker",
      [
        "compose",
        "-f",
        fileURLToPath(new URL("../compose.hetzner.yml", import.meta.url)),
        "config",
        "--quiet",
      ],
      { encoding: "utf8", timeout: 15000 },
    );
    if (result.status !== 0) throw new Error("hetzner_compose_model_invalid");
    console.log(
      JSON.stringify({
        status: "configuration_validated_only",
        hostVerified: false,
        dnsVerified: false,
        tlsVerified: false,
        backupVerified: false,
        budgetVerified: false,
      }),
    );
  } catch (error) {
    const reason =
      error instanceof Error && /^hetzner_[a-z_]+$/.test(error.message)
        ? error.message
        : "hetzner_preflight_failed";
    console.log(JSON.stringify({ status: "refused", reason }));
    process.exitCode = 1;
  }
}
