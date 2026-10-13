import { closeDb, getUserById } from "../db";
import { sendVerification } from "../account-mail";
async function main() {
  // Synthetic transport only; a child process must never contact a real provider.
  globalThis.fetch = async () =>
    new Response('{"id":"synthetic-child-ack"}', { status: 200 });
  try {
    const user = await getUserById(Number(process.argv[2]));
    if (!user) throw new Error("missing_fixture");
    await sendVerification({ id: user.id, email: user.email });
    console.log(JSON.stringify({ code: "ACCEPTED" }));
  } catch (error) {
    console.log(
      JSON.stringify({ code: (error as { code?: string }).code ?? "UNKNOWN" })
    );
  } finally {
    await closeDb();
  }
}
void main();
