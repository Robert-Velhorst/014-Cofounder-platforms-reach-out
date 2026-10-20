import "dotenv/config";
import { inspectEmailVerificationEvidence } from "../server/email-verification-evidence";
import { closeDb } from "../server/db";

async function main() {
  let output: unknown;
  try {
    const args = process.argv.slice(2);
    if (
      args.length !== 3 ||
      args[0] !== "--read-only" ||
      args[1] !== "--account-id" ||
      !/^[1-9]\d{0,9}$/.test(args[2])
    )
      throw new Error("verification_inspection_arguments_invalid");
    output = await inspectEmailVerificationEvidence(Number(args[2]));
  } catch {
    output = {
      mode: "read-only",
      reVerificationAuthorized: false,
      error: "verification_inspection_failed",
    };
    process.exitCode = 1;
  } finally {
    try {
      await closeDb();
    } catch {
      process.exitCode = 1;
      output = {
        mode: "read-only",
        reVerificationAuthorized: false,
        error: "verification_inspection_failed",
      };
    }
  }
  console.log(JSON.stringify(output));
}
void main();
