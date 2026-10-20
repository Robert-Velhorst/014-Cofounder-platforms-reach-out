import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { accountSessions, users } from "../drizzle/schema";
import { getDb } from "./db";
import { hashPassword } from "./auth-password";
import { queuePasswordChanged } from "./account-mail-queue";

export async function completePasswordReset(token: string, password: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    const replacementHash = await hashPassword(password);
    const tokenDigest = createHash("sha256").update(token).digest("hex");
    await db.transaction(async tx => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, tokenDigest))
        .limit(1)
        .for("update");
      if (
        !user?.passwordHash ||
        user.deletionFencedAt !== null ||
        !user.email ||
        !user.passwordResetTokenExpiry ||
        user.passwordResetTokenExpiry <= new Date()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Invalid or expired password reset link. Request a new link.",
        });
      }
      // This is the same user lock used during session issuance. Password change,
      // token consumption and invalidation of every session commit together.
      await tx
        .update(users)
        .set({
          passwordHash: replacementHash,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
          emailVerified: 1,
          verificationToken: null,
          verificationEmailDigest: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));
      await tx
        .delete(accountSessions)
        .where(eq(accountSessions.userId, user.id));
      await queuePasswordChanged(tx, { id: user.id, email: user.email });
    });
    // Recovery never signs the caller in or discloses which account was changed.
    return { success: true as const };
  } catch (error) {
    if (error instanceof TRPCError && error.code === "BAD_REQUEST") throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account recovery is temporarily unavailable. Please try again.",
    });
  }
}
