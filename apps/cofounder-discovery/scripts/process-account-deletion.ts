import "dotenv/config";
import { readRuntimeSecret } from "../server/runtime-secrets";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const help = `Reviewed account-deletion processing preparation; this command does not erase data.
--check --account-id ID --expected-email EMAIL --request-key UUID --expected-revision N
--suspend --account-id ID --expected-email EMAIL --request-key UUID --expected-revision N
  --operator-ref ID --approval-ref ID --confirm-suspend-account
Suspension revokes all sessions and recovery links, blocking normal account work.
Requires independently authorized operator access and review of the exact request.
No role promotion, automatic mail drain, erasure or resumption is performed.
`;
function parse(args: string[]) {
  const mode = args[0];
  if (mode !== "--check" && mode !== "--suspend")
    throw new Error("deletion_processing_arguments_invalid");
  const allowed = [
    "--account-id",
    "--expected-email",
    "--request-key",
    "--expected-revision",
    ...(mode === "--suspend" ? ["--operator-ref", "--approval-ref"] : []),
  ];
  const values = new Map<string, string>();
  let confirmed = false;
  for (let i = 1; i < args.length; i++) {
    const key = args[i];
    if (
      key === "--confirm-suspend-account" &&
      mode === "--suspend" &&
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
      throw new Error("deletion_processing_arguments_invalid");
    values.set(key, args[++i]);
  }
  const integer = (value: string) =>
    /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 2147483647;
  const email = values.get("--expected-email") ?? "";
  const ref = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
  if (
    values.size !== allowed.length ||
    !integer(values.get("--account-id") ?? "") ||
    !integer(values.get("--expected-revision") ?? "") ||
    !z.string().uuid().safeParse(values.get("--request-key")).success ||
    !z.string().email().max(320).safeParse(email).success ||
    email !== email.trim().toLowerCase() ||
    (mode === "--suspend" &&
      (!confirmed ||
        !ref.test(values.get("--operator-ref")!) ||
        !ref.test(values.get("--approval-ref")!)))
  )
    throw new Error("deletion_processing_arguments_invalid");
  return {
    mode,
    userId: Number(values.get("--account-id")),
    expectedEmail: email,
    requestKey: values.get("--request-key")!,
    expectedRevision: Number(values.get("--expected-revision")),
    operatorRef: values.get("--operator-ref")!,
    approvalRef: values.get("--approval-ref")!,
    confirmSuspend: true as const,
  };
}
async function main() {
  if (process.argv.length === 3 && process.argv[2] === "--help") {
    console.log(help);
    return;
  }
  let output: unknown,
    closeDb: (() => Promise<void>) | undefined,
    processingAttempted = false;
  const requestId = randomUUID();
  try {
    const { mode, userId, ...approval } = parse(process.argv.slice(2));
    if (!readRuntimeSecret("DATABASE_URL"))
      throw new Error("deletion_processing_storage_unavailable");
    const database = await import("../server/db");
    closeDb = database.closeDb;
    const owner = await database.getUserById(userId);
    if (
      !owner?.passwordHash ||
      owner.email !== approval.expectedEmail ||
      owner.emailVerified !== 1
    )
      throw new Error("deletion_processing_target_ineligible");
    if (mode === "--check") {
      const { inspectAccountDeletion } =
        await import("../server/account-deletion-preflight");
      const report = await inspectAccountDeletion(userId);
      if (
        report.request.status !== "pending_review" ||
        report.request.requestKey !== approval.requestKey ||
        report.request.revision !== approval.expectedRevision
      )
        throw new Error("deletion_processing_review_stale");
      output = report;
    } else {
      const { beginReviewedDeletionProcessing } =
        await import("../server/account-work-fence");
      processingAttempted = true;
      const result = await beginReviewedDeletionProcessing({
        userId,
        credentialHash: owner.passwordHash,
        requestId,
        approval,
      });
      output = {
        mode: "suspend",
        accountId: userId,
        requestKey: approval.requestKey,
        revision: approval.expectedRevision,
        requestId,
        ...result,
        accountFenced: true,
        dataErased: false,
      };
    }
  } catch (error) {
    process.exitCode = 1;
    const known =
      error instanceof Error &&
      /^deletion_processing_(arguments_invalid|storage_unavailable|target_ineligible|review_stale)$/.test(
        error.message
      );
    const code = known
      ? (error as Error).message
      : error instanceof TRPCError && error.code === "CONFLICT"
        ? "deletion_processing_review_stale"
        : error instanceof TRPCError &&
            ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN"].includes(error.code)
          ? "deletion_processing_target_ineligible"
          : "deletion_processing_storage_unavailable";
    output = {
      error: code,
      requestId,
      processingAttempted,
      outcomeMayBeUncertain: processingAttempted,
      dataErased: false,
    };
  } finally {
    try {
      if (closeDb) await closeDb();
    } catch {
      process.exitCode = 1;
      output = {
        error: "deletion_processing_cleanup_failed",
        requestId,
        processingAttempted,
        outcomeMayBeUncertain: processingAttempted,
        dataErased: false,
      };
    }
  }
  console.log(JSON.stringify(output));
}
void main();
