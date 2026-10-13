import { admitRegistrationAttempt } from "../registration-admission";
import { closeDb } from "../db";

async function main() {
  try {
    if (new URL(process.env.DATABASE_URL!).pathname !== "/cofounder_test")
      throw new Error();
    await admitRegistrationAttempt(
      process.env.REGISTRATION_TEST_EMAIL!,
      "203.0.113.200"
    );
    console.log(JSON.stringify({ code: "OK" }));
  } catch (error) {
    console.log(
      JSON.stringify({
        code:
          (error as { code?: string }).code === "TOO_MANY_REQUESTS"
            ? "TOO_MANY_REQUESTS"
            : "unexpected_failure",
      })
    );
  } finally {
    await closeDb();
  }
}
main().catch(() => {
  process.exitCode = 1;
});
