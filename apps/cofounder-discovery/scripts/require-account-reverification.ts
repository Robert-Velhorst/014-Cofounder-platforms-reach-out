import "dotenv/config";
import { closeDb } from "../server/db";
import {
  reviewAccountReverification,
  requireAccountReverification,
} from "../server/account-reverification";

async function main() {
  let output: unknown;
  let applyAttempted = false;
  try {
    const args = process.argv.slice(2),
      mode = args.shift();
    if (mode !== "--check" && mode !== "--apply") throw new Error();
    const allowed = [
      "--account-id",
      "--expected-email",
      ...(mode === "--apply"
        ? [
            "--operation-id",
            "--review-digest",
            "--reviewed-at",
            "--operator-ref",
            "--approval-ref",
          ]
        : []),
    ];
    const flags = [
      "--confirm-require-verification",
      "--confirm-mail-recovery-ready",
      "--confirm-admin-access-loss",
    ];
    const values = new Map<string, string>();
    const confirmed = new Set<string>();
    while (args.length) {
      const key = args.shift()!;
      if (mode === "--apply" && flags.includes(key) && !confirmed.has(key)) {
        confirmed.add(key);
        continue;
      }
      const value = args.shift();
      if (
        !allowed.includes(key) ||
        values.has(key) ||
        !value ||
        value.startsWith("--")
      )
        throw new Error();
      values.set(key, value);
    }
    const id = values.get("--account-id")!;
    if (values.size !== allowed.length || !/^[1-9]\d{0,9}$/.test(id))
      throw new Error();
    const target = {
      accountId: Number(id),
      expectedEmail: values.get("--expected-email")!,
    };
    if (mode === "--check") output = await reviewAccountReverification(target);
    else {
      if (!confirmed.has(flags[0]) || !confirmed.has(flags[1]))
        throw new Error();
      applyAttempted = true;
      output = await requireAccountReverification({
        ...target,
        operationId: values.get("--operation-id")!,
        reviewDigest: values.get("--review-digest")!,
        reviewedAt: values.get("--reviewed-at")!,
        operatorRef: values.get("--operator-ref")!,
        approvalRef: values.get("--approval-ref")!,
        confirmRequireVerification: true,
        confirmMailRecoveryReady: true,
        confirmAdminAccessLoss: confirmed.has(flags[2]),
      });
    }
  } catch (error) {
    process.exitCode = 1;
    output = {
      applied: false,
      mailSent: false,
      outcomeMayBeUncertain: applyAttempted,
      error:
        error instanceof Error &&
        /^reverification_(target_ineligible|review_stale|operation_conflict|admin_acknowledgement_required|storage_unavailable)$/.test(
          error.message
        )
          ? error.message
          : "reverification_failed",
    };
  } finally {
    try {
      await closeDb();
    } catch {
      process.exitCode = 1;
      output = {
        applied: false,
        mailSent: false,
        outcomeMayBeUncertain: applyAttempted,
        error: "reverification_cleanup_failed",
      };
    }
  }
  console.log(JSON.stringify(output));
}
void main();
