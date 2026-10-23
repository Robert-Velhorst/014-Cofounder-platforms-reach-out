import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, users } from "../drizzle/schema";
import { getDb } from "./db";
import { requireOutreachUtcSession } from "./outreach-clock";

const baseEvidence = {
  method: z.literal("email_token_redemption"),
  emailDigest: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
};
const evidence = z.discriminatedUnion("version", [
  z.object({ version: z.literal(1), ...baseEvidence }).strict(),
  z
    .object({
      version: z.literal(2),
      ...baseEvidence,
      issuanceAddressBound: z.literal(true),
    })
    .strict(),
]);

/** Local operator inspection only. No account mutation or issuance authority. */
export async function inspectEmailVerificationEvidence(accountId: number) {
  if (
    !Number.isSafeInteger(accountId) ||
    accountId < 1 ||
    accountId > 2147483647
  )
    throw new Error("verification_inspection_arguments_invalid");
  const db = await getDb();
  if (!db) throw new Error("verification_inspection_unavailable");
  return db.transaction(
    async tx => {
      await requireOutreachUtcSession(tx);
      const [owner] = await tx
        .select({
          email: users.email,
          verified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, accountId));
      if (!owner) throw new Error("verification_inspection_account_not_found");
      const [record] = await tx
        .select({
          id: auditEvents.id,
          metadata: auditEvents.metadata,
          createdAt: auditEvents.createdAt,
        })
        .from(auditEvents)
        .where(
          and(
            eq(auditEvents.userId, accountId),
            eq(auditEvents.action, "auth.email_token_redeemed"),
            eq(auditEvents.entityType, "account"),
            eq(auditEvents.entityId, String(accountId)),
            eq(auditEvents.outcome, "success")
          )
        )
        .orderBy(desc(auditEvents.id))
        .limit(1);
      const parsed = evidence.safeParse(record?.metadata);
      const currentDigest = owner.email
        ? createHash("sha256")
            .update(owner.email.trim().toLowerCase())
            .digest("hex")
        : null;
      const status = !record
        ? "missing"
        : !parsed.success || !parsed.data.emailDigest || !currentDigest
          ? "invalid_record"
          : parsed.data.emailDigest === currentDigest
            ? parsed.data.version === 2
              ? "current_email_redemption"
              : "unbound_current_email_redemption"
            : "different_email_redemption";
      return {
        mode: "read-only" as const,
        accountId,
        verifiedFlag: owner.verified === 1,
        evidenceStatus: status,
        recordedAt: record?.createdAt ?? null,
        needsOperatorReview:
          owner.verified === 1 && status !== "current_email_redemption",
        reVerificationAuthorized: false as const,
        warning:
          "Token redemption evidence only, not identity verification. Version 1 history does not establish issuance-address binding. Missing evidence cannot distinguish automatically verified legacy accounts from earlier genuine verifications. No account, session, token, mail or workspace data was changed. Review original release records and account history before any separately approved remediation.",
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" }
  );
}
