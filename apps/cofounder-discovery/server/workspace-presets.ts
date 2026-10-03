import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { users, workspacePresets } from "../drizzle/schema";
import {
  emptyPresetSettings,
  presetSettingsSchema,
  presetsReadSchema,
  presetsSaveSchema,
} from "../shared/workspace-presets";
import { getDb } from "./db";
import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";
import { requireOutreachUtcSession } from "./outreach-clock";
import { appendWorkspaceAudit } from "./capacity";

type Actor = { userId: number; credentialHash: string | null };
type Read = z.infer<typeof presetsReadSchema>;
type Save = z.infer<typeof presetsSaveSchema>;
type Tx = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];
async function read(tx: Tx, actor: Actor, command: Read, write: boolean) {
  if (!Number.isSafeInteger(actor.userId) || actor.userId !== command.accountId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your signed-in account changed. Refresh before continuing.",
    });
  await requireOutreachUtcSession(tx);
  const [owner] = await tx
    .select({
      emailVerified: users.emailVerified,
      deletionFencedAt: users.deletionFencedAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, actor.userId))
    .for(write ? "update" : "share");
  if (
    !owner ||
    !actor.credentialHash ||
    owner.passwordHash !== actor.credentialHash
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "A current authenticated account is required.",
    });
  assertVerifiedWorkspaceWorkAllowed(owner);
  const [row] = await tx
    .select()
    .from(workspacePresets)
    .where(eq(workspacePresets.userId, actor.userId));
  if (row && (!Number.isSafeInteger(row.revision) || row.revision < 1))
    throw new Error("invalid_preset_revision");
  return {
    revision: row?.revision ?? 0,
    settings: row
      ? presetSettingsSchema.parse(row.settings)
      : emptyPresetSettings(),
  };
}
function failure(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "Saved defaults are temporarily unavailable. No change is confirmed; keep your text and retry the same save.",
  });
}
export async function readWorkspacePresets(input: Read & Actor) {
  const { userId, credentialHash, ...raw } = input;
  const command = presetsReadSchema.parse(raw);
  try {
    const db = await getDb();
    if (!db) throw new Error("storage_unavailable");
    return await db.transaction(
      tx => read(tx, { userId, credentialHash }, command, false),
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    failure(error);
  }
}
export async function saveWorkspacePresets(
  input: Save & Actor & { requestId: string }
) {
  const { userId, credentialHash, requestId, ...raw } = input;
  const command = presetsSaveSchema.parse(raw);
  try {
    const db = await getDb();
    if (!db) throw new Error("storage_unavailable");
    return await db.transaction(
      async tx => {
        const current = await read(
          tx,
          { userId, credentialHash },
          command,
          true
        );
        // Lost-response replay is exact and only for the immediately next revision.
        if (
          current.revision === command.expectedRevision + 1 &&
          JSON.stringify(current.settings) === JSON.stringify(command.settings)
        )
          return { ...current, replayed: true };
        if (current.revision !== command.expectedRevision)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Saved defaults changed in another tab. Your edits were not applied; reload the saved version before editing again.",
          });
        const revision = current.revision + 1;
        await tx
          .insert(workspacePresets)
          .values({ userId, revision, settings: command.settings })
          .onDuplicateKeyUpdate({
            set: {
              revision,
              settings: command.settings,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          });
        await appendWorkspaceAudit(tx, {
          userId,
          requestId,
          action: "workspace.presets.saved",
          entityType: "workspace_presets",
          entityId: String(userId),
          outcome: "success",
          metadata: {
            revision,
            templateCount: command.settings.templates.length,
          },
        });
        return { revision, settings: command.settings, replayed: false };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    failure(error);
  }
}
