import "dotenv/config";
import { listDeletionRequests } from "../server/account-deletion-review";
import { closeDb } from "../server/db";

async function main() {
  let output: unknown;
  try {
    const args = process.argv.slice(2);
    if (args.shift() !== "--read-only" || args.length % 2 !== 0)
      throw new Error("invalid_read_only_arguments");
    const options: { limit?: number; afterAccountId?: number } = {};
    for (let i = 0; i < args.length; i += 2) {
      const key =
        args[i] === "--limit"
          ? "limit"
          : args[i] === "--after-account-id"
            ? "afterAccountId"
            : null;
      if (
        !key ||
        options[key] !== undefined ||
        !/^(0|[1-9]\d{0,9})$/.test(args[i + 1])
      )
        throw new Error("invalid_read_only_arguments");
      options[key] = Number(args[i + 1]);
    }
    output = await listDeletionRequests(options);
  } catch (error) {
    const code =
      error instanceof Error &&
      /^(invalid_read_only_arguments|deletion_(storage_unavailable|requires_utc_session|request_review_required|schema_review_required))$/.test(
        error.message
      )
        ? error.message
        : "deletion_request_listing_failed";
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
        error: "deletion_request_listing_failed",
      };
    }
  }
  console.log(JSON.stringify(output));
}
void main();
