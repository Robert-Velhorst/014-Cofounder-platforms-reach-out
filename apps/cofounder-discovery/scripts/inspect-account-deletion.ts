import "dotenv/config";
import { inspectAccountDeletion } from "../server/account-deletion-preflight";
import { closeDb } from "../server/db";

async function main() {
  const args = process.argv.slice(2);
  let output: unknown;
  try {
    if (
      args.length !== 3 ||
      args[0] !== "--read-only" ||
      args[1] !== "--account-id" ||
      !/^[1-9]\d{0,9}$/.test(args[2])
    )
      throw new Error("invalid_read_only_arguments");
    output = await inspectAccountDeletion(Number(args[2]));
  } catch (error) {
    const code =
      error instanceof Error &&
      /^(invalid_read_only_arguments|deletion_(schema_review_required|request_review_required|storage_unavailable|account_not_found|requires_utc_session|inspection_limit))$/.test(
        error.message
      )
        ? error.message
        : "deletion_preflight_failed";
    // Never serialize database errors: they can contain credentials or SQL values.
    output = { mode: "read-only", deletionAuthorized: false, error: code };
    process.exitCode = 1;
  } finally {
    try {
      await closeDb();
    } catch {
      process.exitCode = 1;
      output = {
        mode: "read-only",
        deletionAuthorized: false,
        error: "deletion_preflight_failed",
      };
    }
  }
  console.log(JSON.stringify(output));
}
void main();
