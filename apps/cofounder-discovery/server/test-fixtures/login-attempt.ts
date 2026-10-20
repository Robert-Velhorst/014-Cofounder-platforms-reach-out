import { appRouter } from "../routers";
import { closeDb } from "../db";
import type { TrpcContext } from "../_core/context";
async function main() {
  try {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error();
    await appRouter
      .createCaller({
        user: null,
        requestId: "synthetic-login-process",
        req: { ip: "203.0.113.200", headers: {}, protocol: "http" },
        res: { cookie() {} },
      } as unknown as TrpcContext)
      .auth.login({
        email: process.env.LOGIN_TEST_EMAIL!,
        password: "Synthetic-login-Password!42",
      });
    console.log(JSON.stringify({ code: "OK" }));
  } catch (error) {
    const code = (error as { code?: string }).code;
    console.log(
      JSON.stringify({
        code: code === "TOO_MANY_REQUESTS" ? code : "unexpected_failure",
      })
    );
  } finally {
    await closeDb();
  }
}
main().catch(() => {
  process.exitCode = 1;
});
