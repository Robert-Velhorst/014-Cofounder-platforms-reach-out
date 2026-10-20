import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { getDb, closeDb } from "../db";
import { criticalPathRouter } from "../critical-path-router";
import type { TrpcContext } from "../_core/context";

async function main() {
  try {
    const db = (await getDb())!;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(process.argv[2])));
    if (!user) throw new Error("Synthetic fixture account not found");
    const api = criticalPathRouter.createCaller({
      user,
      requestId: "fresh-process-quota-check",
      req: {},
      res: {},
    } as TrpcContext);
    const result = await api.outreach
      .prepareManualSend({ id: Number(process.argv[3]) })
      .then(
        () => ({ code: "PREPARED" }),
        error => ({ code: error.code })
      );
    console.log(JSON.stringify(result));
  } finally {
    await closeDb();
  }
}
void main().catch(() => {
  process.exitCode = 1;
});
