import { closeDb, createProspect, createOrUpdateProfile } from "../db";
async function main() {
  try {
    if (process.argv[3] === "workspace-audit") {
      await createOrUpdateProfile(Number(process.argv[2]), {
        bio: "Synthetic child profile",
      });
    } else
      await createProspect({
        userId: Number(process.argv[2]),
        name: "Synthetic child candidate",
        platform: "manual",
      });
    console.log(JSON.stringify({ code: "ADMITTED" }));
  } catch (error) {
    console.log(
      JSON.stringify({ code: (error as { code?: string }).code ?? "UNKNOWN" })
    );
  } finally {
    await closeDb();
  }
}
void main();
