import "dotenv/config";
import { readRuntimeSecret } from "../server/runtime-secrets";
import { randomUUID } from "node:crypto";
import { constants, type promises } from "node:fs";
import { lstat, realpath, open } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const help = `Controlled administrator enrollment and lost-all-passkeys recovery (not role promotion).
--check --account-id ID --expected-email EMAIL --expected-origin ORIGIN
--issue --account-id ID --expected-email EMAIL --expected-origin ORIGIN
  --operator-ref ID --approval-ref ID --output /private/new.admin-grant
  --confirm-initial-enrollment
--recovery-check --account-id ID --expected-email EMAIL --expected-origin ORIGIN
--recover --account-id ID --expected-email EMAIL --expected-origin ORIGIN
  --operator-ref ID --approval-ref ID --review-digest DIGEST
  --output /private/new.admin-grant --confirm-all-passkeys-lost
Recovery deletes the reviewed keys and revokes ALL account sessions atomically.
Issuance requires independently established operator authority and identity review.
It writes a secret to a NEW file in a private, current-user-owned POSIX directory.
Never run issuance in CI or with terminal/session recording of the secret file.
The approval expires after ten minutes; stdout never contains its token.
`;
function parse(args: string[]) {
  const mode = args[0];
  const recovery = mode === "--recover";
  const writes = mode === "--issue" || recovery;
  const values = new Map<string, string>();
  let confirmed = false;
  const allowed = [
    "--account-id",
    "--expected-email",
    "--expected-origin",
    ...(writes ? ["--operator-ref", "--approval-ref", "--output"] : []),
    ...(recovery ? ["--review-digest"] : []),
  ];
  if (!["--check", "--issue", "--recovery-check", "--recover"].includes(mode))
    throw new Error("enrollment_arguments_invalid");
  for (let i = 1; i < args.length; i++) {
    const key = args[i];
    if (
      key ===
        (recovery
          ? "--confirm-all-passkeys-lost"
          : "--confirm-initial-enrollment") &&
      writes &&
      !confirmed
    ) {
      confirmed = true;
      continue;
    }
    if (
      !allowed.includes(key) ||
      values.has(key) ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    )
      throw new Error("enrollment_arguments_invalid");
    values.set(key, args[++i]);
  }
  if (values.size !== allowed.length || (writes && !confirmed))
    throw new Error("enrollment_arguments_invalid");
  const id = values.get("--account-id")!;
  const expectedEmail = values.get("--expected-email")!;
  const expectedOrigin = values.get("--expected-origin")!;
  const ref = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
  let validOrigin = false;
  try {
    const url = new URL(expectedOrigin);
    validOrigin =
      url.origin === expectedOrigin &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" && url.hostname === "localhost"));
  } catch {
    /* invalid */
  }
  if (
    !/^[1-9]\d{0,9}$/.test(id) ||
    Number(id) > 2147483647 ||
    !z.string().email().max(320).safeParse(expectedEmail).success ||
    expectedEmail !== expectedEmail.trim().toLowerCase() ||
    !validOrigin ||
    (recovery && !/^[a-f0-9]{64}$/.test(values.get("--review-digest")!)) ||
    (writes &&
      (!ref.test(values.get("--operator-ref")!) ||
        !ref.test(values.get("--approval-ref")!)))
  )
    throw new Error("enrollment_arguments_invalid");
  return {
    mode: mode.slice(2),
    userId: Number(id),
    expectedEmail,
    expectedOrigin,
    operatorRef: values.get("--operator-ref")!,
    approvalRef: values.get("--approval-ref")!,
    output: values.get("--output")!,
    reviewDigest: values.get("--review-digest")!,
    confirmAllPasskeysLost: recovery as true,
  };
}
async function privateOutput(path: string) {
  try {
    // Windows mode bits do not enforce Windows ACLs. Fail closed instead of
    // pretending chmod(0600) protects a token there; use the Linux operator host.
    if (
      process.platform === "win32" ||
      !process.geteuid ||
      !isAbsolute(path) ||
      !path.endsWith(".admin-grant") ||
      resolve(path) !== path
    )
      throw new Error();
    const parent = dirname(path),
      info = await lstat(parent);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      info.uid !== process.geteuid() ||
      (info.mode & 0o077) !== 0 ||
      (await realpath(parent)) !== parent
    )
      throw new Error();
    const file = await open(
      path,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600
    );
    const state = await file.stat();
    if (
      !state.isFile() ||
      state.uid !== process.geteuid() ||
      (state.mode & 0o077) !== 0 ||
      state.nlink !== 1
    ) {
      await file.close();
      throw new Error();
    }
    return file;
  } catch {
    throw new Error("enrollment_output_unsafe");
  }
}
function errorCode(error: unknown, recovery = false) {
  if (
    error instanceof Error &&
    /^enrollment_(arguments_invalid|storage_unavailable|target_ineligible|output_unsafe|already_enrolled|approval_active)$/.test(
      error.message
    )
  )
    return error.message;
  if (error instanceof TRPCError) {
    if (error.code === "CONFLICT")
      return recovery ? "recovery_review_stale" : "enrollment_approval_active";
    if (error.code === "PRECONDITION_FAILED")
      return "enrollment_already_enrolled";
    if (["FORBIDDEN", "UNAUTHORIZED", "BAD_REQUEST"].includes(error.code))
      return "enrollment_target_ineligible";
  }
  return "enrollment_storage_unavailable";
}
async function main() {
  if (process.argv.length === 3 && process.argv[2] === "--help") {
    console.log(help);
    return;
  }
  let file: promises.FileHandle | undefined;
  let closeDb: (() => Promise<void>) | undefined;
  let output: unknown,
    issuanceAttempted = false,
    tokenWritten = false;
  const requestId = randomUUID();
  let recovery = false;
  try {
    const args = parse(process.argv.slice(2));
    recovery = args.mode === "recover" || args.mode === "recovery-check";
    if (!readRuntimeSecret("DATABASE_URL"))
      throw new Error("enrollment_storage_unavailable");
    const database = await import("../server/db");
    closeDb = database.closeDb;
    const {
      inspectInitialAdminEnrollment,
      issueInitialAdminEnrollmentGrant,
      inspectAdminRecovery,
      recoverAdminPasskeys,
    } = await import("../server/admin-mfa");
    const owner = await database.getUserById(args.userId);
    if (!owner) throw new Error("enrollment_target_ineligible");
    const actor = {
      userId: owner.id,
      credentialHash: owner.passwordHash,
      requestId,
    };
    const status = recovery
      ? await inspectAdminRecovery(actor, args)
      : await inspectInitialAdminEnrollment(actor, args);
    if (args.mode === "check" || args.mode === "recovery-check")
      output = { mode: args.mode, ...status, grantWritten: false };
    else {
      if (!status.eligible)
        throw new Error(
          recovery
            ? "enrollment_target_ineligible"
            : "reason" in status && status.reason === "already_enrolled"
              ? "enrollment_already_enrolled"
              : "enrollment_approval_active"
        );
      file = await privateOutput(args.output);
      issuanceAttempted = true;
      const grant = recovery
        ? await recoverAdminPasskeys(actor, args)
        : await issueInitialAdminEnrollmentGrant(actor, args);
      await file.writeFile(
        JSON.stringify({
          accountId: owner.id,
          origin: status.origin,
          requestId,
          ...grant,
        }) + "\n",
        "utf8"
      );
      await file.sync();
      await file.close();
      file = undefined;
      tokenWritten = true;
      output = {
        mode: args.mode,
        accountId: owner.id,
        origin: status.origin,
        requestId,
        expiresAt: grant.expiresAt,
        grantWritten: true,
      };
    }
  } catch (error) {
    process.exitCode = 1;
    output = {
      grantWritten: false,
      issuanceAttempted,
      requestId,
      error: errorCode(error, recovery),
      outcomeMayBeUncertain: issuanceAttempted,
    };
  } finally {
    try {
      try {
        if (file) await file.close();
      } finally {
        if (closeDb) await closeDb();
      }
    } catch {
      process.exitCode = 1;
      output = {
        grantWritten: tokenWritten,
        issuanceAttempted,
        requestId,
        error: "enrollment_cleanup_failed",
        outcomeMayBeUncertain: issuanceAttempted,
      };
    }
  }
  console.log(JSON.stringify(output));
}
void main();
