import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const MAX_INPUT_BYTES = 16384;
const invalid = () => {
  throw new Error("invalid_support_observations");
};
const choice = (value, choices) =>
  choices.includes(value) ? value : invalid();
function exactKeys(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    invalid();
}

// Construct rather than redact: arbitrary logs/content never enter the bundle.
export function createSupportBundle(input, runtime = process) {
  exactKeys(input, ["version", "ownerAuthorized", "area", "observations"]);
  if (input.version !== 1 || input.ownerAuthorized !== true) invalid();
  const area = choice(input.area, [
    "authentication",
    "workspace",
    "export",
    "outreach",
    "administration",
    "deployment",
  ]);
  if (
    !Array.isArray(input.observations) ||
    input.observations.length < 1 ||
    input.observations.length > 20
  )
    invalid();
  const observations = input.observations.map((row) => {
    exactKeys(row, ["check", "status", "requestId"]);
    const check = choice(row.check, [
      "sign_in",
      "email_verification",
      "password_recovery",
      "candidate_save",
      "preset_save",
      "draft_save",
      "manual_action",
      "account_export",
      "admin_step_up",
      "health",
      "readiness",
    ]);
    const status = choice(row.status, [
      "pass",
      "unavailable",
      "unauthorized",
      "forbidden",
      "invalid_input",
      "conflict",
      "capacity_reached",
      "not_configured",
      "not_checked",
    ]);
    if (
      row.requestId !== null &&
      (typeof row.requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          row.requestId,
        ))
    )
      invalid();
    return { check, status, requestId: row.requestId };
  });
  const node = runtime.versions?.node;
  if (typeof node !== "string" || !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(node))
    invalid();
  const platform = choice(runtime.platform, [
    "win32",
    "linux",
    "darwin",
    "freebsd",
    "openbsd",
    "aix",
    "sunos",
    "android",
  ]);
  const arch = choice(runtime.arch, [
    "x64",
    "arm64",
    "arm",
    "ia32",
    "ppc64",
    "s390x",
    "riscv64",
    "loong64",
  ]);
  const payload = {
    format: "cofounder-support/v1",
    ownerAuthorization: "operator_confirmed_not_independently_verified",
    evidence: "operator_selected_observations_not_automatic_runtime_acceptance",
    localGenerator: { node, platform, arch },
    area,
    observations,
    exclusions: [
      "account_and_candidate_data",
      "message_content",
      "credentials_and_tokens",
      "environment",
      "logs_and_stack_traces",
      "paths_hostnames_and_urls",
      "database_and_provider_queries",
    ],
    sharing: "local_review_only_no_upload",
  };
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      payloadDigest: createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex"),
      meaning: "content_integrity_not_identity_or_authenticity",
    },
  };
}

export async function runSupportBundle(args, input, output) {
  if (args.length === 1 && args[0] === "--help") {
    output.write(
      "Usage: pnpm support:bundle --confirm-owner-authorized < reviewed-observations.json\nOutputs local reviewable JSON only. No upload or automatic log collection.\n",
    );
    return 0;
  }
  // Check authorization before reading stdin; never reflect arbitrary arguments.
  if (args.length !== 1 || args[0] !== "--confirm-owner-authorized") {
    output.write('{"ok":false,"error":"owner_authorization_required"}\n');
    return 1;
  }
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of input) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_INPUT_BYTES) invalid();
      chunks.push(bytes);
    }
    const content = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks),
    );
    const bundle = createSupportBundle(JSON.parse(content));
    output.write(JSON.stringify(bundle, null, 2) + "\n");
    return 0;
  } catch {
    output.write('{"ok":false,"error":"invalid_support_observations"}\n');
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  // pnpm may preserve its argument separator.
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  process.exitCode = await runSupportBundle(
    args,
    process.stdin,
    process.stdout,
  );
}
