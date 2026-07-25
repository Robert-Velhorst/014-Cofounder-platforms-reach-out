/**
 * Platform Credentials Router
 * Handles secure storage and management of platform login credentials
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { platformCredentials, automationJobs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "./encryption";

const PLATFORM_NAMES = {
  founder_cloud: "Founder Cloud",
  co_founders_lab: "Co-Founders Lab",
  y_combinator: "Y Combinator",
} as const;

export const platformCredentialsRouter = router({
  /**
   * Get all platform credential statuses for the current user
   * Never returns actual credentials - only status info
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const creds = await db
      .select({
        id: platformCredentials.id,
        platform: platformCredentials.platform,
        status: platformCredentials.status,
        lastTestedAt: platformCredentials.lastTestedAt,
        lastUsedAt: platformCredentials.lastUsedAt,
        lastError: platformCredentials.lastError,
        dailyMessageLimit: platformCredentials.dailyMessageLimit,
        messagesSentToday: platformCredentials.messagessentToday,
        lastResetAt: platformCredentials.lastResetAt,
        createdAt: platformCredentials.createdAt,
        // Return masked username (first 2 chars + ***)
        encryptedUsername: platformCredentials.encryptedUsername,
      })
      .from(platformCredentials)
      .where(eq(platformCredentials.userId, ctx.user.id));

    // Mask username for display
    return creds.map(cred => {
      let maskedUsername = "***";
      try {
        const username = decrypt(cred.encryptedUsername);
        maskedUsername =
          username.length > 2
            ? username.substring(0, 2) +
              "*".repeat(Math.min(username.length - 2, 8))
            : "***";
      } catch {}

      return {
        ...cred,
        encryptedUsername: undefined,
        maskedUsername,
        platformName: PLATFORM_NAMES[cred.platform],
      };
    });
  }),

  /**
   * Save or update credentials for a platform
   */
  saveCredentials: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["founder_cloud", "co_founders_lab", "y_combinator"]),
        username: z.string().min(1).max(255),
        password: z.string().min(1).max(500),
        dailyMessageLimit: z.number().min(1).max(20).optional().default(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const encryptedUsername = encrypt(input.username);
      const encryptedPassword = encrypt(input.password);

      // Check if credentials already exist for this platform
      const existing = await db
        .select({ id: platformCredentials.id })
        .from(platformCredentials)
        .where(
          and(
            eq(platformCredentials.userId, ctx.user.id),
            eq(platformCredentials.platform, input.platform)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(platformCredentials)
          .set({
            encryptedUsername,
            encryptedPassword,
            status: "untested",
            lastError: null,
            dailyMessageLimit: input.dailyMessageLimit,
            encryptedSessionData: null, // Clear old session
            sessionExpiresAt: null,
          })
          .where(
            and(
              eq(platformCredentials.userId, ctx.user.id),
              eq(platformCredentials.platform, input.platform)
            )
          );
      } else {
        // Insert new
        await db.insert(platformCredentials).values({
          userId: ctx.user.id,
          platform: input.platform,
          encryptedUsername,
          encryptedPassword,
          status: "untested",
          dailyMessageLimit: input.dailyMessageLimit,
        });
      }

      return { success: true };
    }),

  /**
   * Delete credentials for a platform
   */
  deleteCredentials: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["founder_cloud", "co_founders_lab", "y_combinator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(platformCredentials)
        .where(
          and(
            eq(platformCredentials.userId, ctx.user.id),
            eq(platformCredentials.platform, input.platform)
          )
        );

      return { success: true };
    }),

  /**
   * Test credentials for a platform (verify login works)
   */
  testCredentials: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["founder_cloud", "co_founders_lab", "y_combinator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get credentials
      const cred = await db
        .select()
        .from(platformCredentials)
        .where(
          and(
            eq(platformCredentials.userId, ctx.user.id),
            eq(platformCredentials.platform, input.platform)
          )
        )
        .limit(1);

      if (!cred || cred.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No credentials found for this platform",
        });
      }

      // Queue a test job
      await db.insert(automationJobs).values({
        userId: ctx.user.id,
        jobType: "discover_prospects",
        platform: input.platform,
        status: "pending",
        jobData: { action: "test_login", credentialId: cred[0].id },
        scheduledAt: new Date(),
        maxAttempts: 1,
      });

      // Update status to "untested" while test runs
      await db
        .update(platformCredentials)
        .set({ lastTestedAt: new Date(), status: "untested" })
        .where(eq(platformCredentials.id, cred[0].id));

      return {
        success: true,
        message: "Test login queued. Status will update shortly.",
      };
    }),

  /**
   * Update daily message limit for a platform
   */
  updateLimit: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["founder_cloud", "co_founders_lab", "y_combinator"]),
        dailyMessageLimit: z.number().min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(platformCredentials)
        .set({ dailyMessageLimit: input.dailyMessageLimit })
        .where(
          and(
            eq(platformCredentials.userId, ctx.user.id),
            eq(platformCredentials.platform, input.platform)
          )
        );

      return { success: true };
    }),
});
