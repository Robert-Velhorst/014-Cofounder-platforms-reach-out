/**
 * Outreach Router
 * Connects the approval queue to automated platform messaging
 * Handles: approve → generate message → send via platform → update status
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  matches,
  prospects,
  campaigns,
  messages,
  aiActivityLog,
  automationJobs,
  platformCredentials,
} from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { sendPlatformMessage, testPlatformLogin } from "./platform-automation";

// ============================================================
// Message Generation
// ============================================================

async function generateOutreachMessage(
  senderName: string,
  prospectName: string,
  prospectBio: string | null,
  prospectSkills: string[] | null,
  campaignGoal: string,
  compatibilityScore: number
): Promise<string> {
  const prompt = `You are writing a personalized co-founder outreach message. Keep it concise (3-4 sentences), genuine, and specific.

Sender: ${senderName}
Prospect: ${prospectName}
Prospect Bio: ${prospectBio || "Not provided"}
Prospect Skills: ${prospectSkills?.join(", ") || "Not specified"}
Campaign Goal: ${campaignGoal}
Compatibility Score: ${compatibilityScore}%

Write a short, personalized outreach message that:
1. Opens with a specific observation about their background (not generic)
2. Briefly explains why you're reaching out
3. Asks one specific question to start a conversation
4. Keeps a professional but warm tone

Output ONLY the message text, no subject line, no signature.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You write concise, personalized co-founder outreach messages. Output only the message body.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === "string" ? content : null;
  return (
    text ||
    `Hi ${prospectName}, I came across your profile and was impressed by your background. I'm working on ${campaignGoal} and think there could be great synergy between us. Would love to connect and learn more about what you're building. Would you be open to a quick chat?`
  );
}

// ============================================================
// Router
// ============================================================

export const outreachRouter = router({
  /**
   * Get pending matches awaiting approval
   */
  getPendingApprovals: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions = [
        eq(matches.userId, ctx.user.id),
        inArray(matches.status, ["queued", "discovered"]),
      ];

      if (input.campaignId) {
        conditions.push(eq(matches.campaignId, input.campaignId));
      }

      const pending = await db
        .select({
          matchId: matches.id,
          compatibilityScore: matches.overallScore,
          matchStatus: matches.status,
          campaignId: matches.campaignId,
          lastScoredAt: matches.lastScoredAt,
          prospectId: matches.prospectId,
          prospectName: prospects.name,
          prospectTitle: prospects.title,
          prospectLocation: prospects.location,
          prospectBio: prospects.bio,
          prospectSkills: prospects.skills,
          prospectPlatform: prospects.platform,
          prospectProfileUrl: prospects.profileUrl,
          campaignName: campaigns.name,
          automationMode: campaigns.automationMode,
        })
        .from(matches)
        .leftJoin(prospects, eq(matches.prospectId, prospects.id))
        .leftJoin(campaigns, eq(matches.campaignId, campaigns.id))
        .where(and(...conditions))
        .orderBy(desc(matches.overallScore))
        .limit(input.limit);

      return pending;
    }),

  /**
   * Approve a match and optionally send outreach message
   */
  approveMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        customMessage: z.string().optional(),
        sendNow: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get match details
      const match = await db
        .select({
          id: matches.id,
          userId: matches.userId,
          prospectId: matches.prospectId,
          campaignId: matches.campaignId,
          compatibilityScore: matches.overallScore,
          matchStatus: matches.status,
          prospectName: prospects.name,
          prospectBio: prospects.bio,
          prospectSkills: prospects.skills,
          prospectPlatform: prospects.platform,
          prospectProfileUrl: prospects.profileUrl,
          campaignName: campaigns.name,
          automationMode: campaigns.automationMode,
          autoMessageEnabled: campaigns.autoMessageEnabled,
        })
        .from(matches)
        .leftJoin(prospects, eq(matches.prospectId, prospects.id))
        .leftJoin(campaigns, eq(matches.campaignId, campaigns.id))
        .where(
          and(eq(matches.id, input.matchId), eq(matches.userId, ctx.user.id))
        )
        .limit(1);

      if (!match || match.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }

      const m = match[0];

      // Update match status to approved
      await db
        .update(matches)
        .set({ status: "approved" })
        .where(eq(matches.id, input.matchId));

      // If sendNow is true, attempt to send message
      if (
        input.sendNow &&
        process.env.ENABLE_PLATFORM_AUTOMATION === "true" &&
        m.prospectPlatform &&
        m.prospectProfileUrl
      ) {
        // Generate message if not provided
        const messageText =
          input.customMessage ||
          (await generateOutreachMessage(
            ctx.user.name || "Founder",
            m.prospectName || "there",
            m.prospectBio,
            m.prospectSkills as string[] | null,
            "building a startup",
            m.compatibilityScore || 0
          ));

        // Check if platform is supported for automation
        const supportedPlatforms = [
          "founder_cloud",
          "co_founders_lab",
          "y_combinator",
        ] as const;
        type SupportedPlatform = (typeof supportedPlatforms)[number];
        const platform = m.prospectPlatform as string;
        const isSupportedPlatform = (p: string): p is SupportedPlatform =>
          supportedPlatforms.includes(p as SupportedPlatform);

        if (isSupportedPlatform(platform)) {
          // Queue automation job
          await db.insert(automationJobs).values({
            userId: ctx.user.id,
            campaignId: m.campaignId,
            matchId: input.matchId,
            jobType: "send_message",
            platform: platform,
            status: "pending",
            jobData: {
              profileUrl: m.prospectProfileUrl,
              message: messageText,
              prospectName: m.prospectName,
            },
            scheduledAt: new Date(),
            maxAttempts: 3,
          });

          // Save message to our database
          await db.insert(messages).values({
            userId: ctx.user.id,
            senderId: ctx.user.id,
            recipientId: ctx.user.id, // Placeholder - prospect not a user
            prospectId: m.prospectId!,
            matchId: input.matchId,
            content: messageText,
            body: messageText,
            status: "sent",
          });

          // Update match status to contacted
          await db
            .update(matches)
            .set({
              status: "contacted",
              contactedAt: new Date(),
            })
            .where(eq(matches.id, input.matchId));

          // Log AI activity
          await db.insert(aiActivityLog).values({
            userId: ctx.user.id,
            activityType: "message_sent",
            activityDescription: `Approved and queued outreach to ${m.prospectName} on ${platform}`,
            matchId: input.matchId,
            campaignId: m.campaignId,
            outcome: "pending",
          });

          return {
            success: true,
            message: "Match approved and outreach queued",
            messageQueued: true,
            messagePreview: messageText.substring(0, 100) + "...",
          };
        }
      }

      return {
        success: true,
        message: "Match approved",
        messageQueued: false,
      };
    }),

  /**
   * Reject a match (with cooldown)
   */
  rejectMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(matches)
        .set({
          status: "rejected",
        })
        .where(
          and(eq(matches.id, input.matchId), eq(matches.userId, ctx.user.id))
        );

      return { success: true };
    }),

  /**
   * Bulk approve matches
   */
  bulkApprove: protectedProcedure
    .input(
      z.object({
        matchIds: z.array(z.number()),
        sendMessages: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let approved = 0;
      let queued = 0;

      for (const matchId of input.matchIds) {
        try {
          // Get match details
          const match = await db
            .select({
              id: matches.id,
              prospectId: matches.prospectId,
              campaignId: matches.campaignId,
              compatibilityScore: matches.overallScore,
              prospectName: prospects.name,
              prospectBio: prospects.bio,
              prospectSkills: prospects.skills,
              prospectPlatform: prospects.platform,
              prospectProfileUrl: prospects.profileUrl,
            })
            .from(matches)
            .leftJoin(prospects, eq(matches.prospectId, prospects.id))
            .leftJoin(campaigns, eq(matches.campaignId, campaigns.id))
            .where(
              and(eq(matches.id, matchId), eq(matches.userId, ctx.user.id))
            )
            .limit(1);

          if (!match || match.length === 0) continue;
          const m = match[0];

          // Update status
          await db
            .update(matches)
            .set({ status: "approved" })
            .where(eq(matches.id, matchId));
          approved++;

          // Queue message if platform supported
          if (
            input.sendMessages &&
            process.env.ENABLE_PLATFORM_AUTOMATION === "true" &&
            m.prospectPlatform &&
            m.prospectProfileUrl
          ) {
            const supportedPlatforms = [
              "founder_cloud",
              "co_founders_lab",
              "y_combinator",
            ];
            if (supportedPlatforms.includes(m.prospectPlatform)) {
              const messageText = await generateOutreachMessage(
                ctx.user.name || "Founder",
                m.prospectName || "there",
                m.prospectBio,
                m.prospectSkills as string[] | null,
                "building a startup",
                m.compatibilityScore || 0
              );

              await db.insert(automationJobs).values({
                userId: ctx.user.id,
                campaignId: m.campaignId,
                matchId,
                jobType: "send_message",
                platform: m.prospectPlatform as
                  | "founder_cloud"
                  | "co_founders_lab"
                  | "y_combinator",
                status: "pending",
                jobData: {
                  profileUrl: m.prospectProfileUrl,
                  message: messageText,
                  prospectName: m.prospectName,
                },
                scheduledAt: new Date(),
                maxAttempts: 3,
              });

              await db
                .update(matches)
                .set({ status: "contacted", contactedAt: new Date() })
                .where(eq(matches.id, matchId));

              queued++;
            }
          }
        } catch (err) {
          console.error(`Failed to approve match ${matchId}:`, err);
        }
      }

      return { success: true, approved, queued };
    }),

  /**
   * Get pending automation jobs and their statuses
   */
  getJobStatuses: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const jobs = await db
        .select({
          id: automationJobs.id,
          jobType: automationJobs.jobType,
          platform: automationJobs.platform,
          status: automationJobs.status,
          scheduledAt: automationJobs.scheduledAt,
          startedAt: automationJobs.startedAt,
          completedAt: automationJobs.completedAt,
          errorMessage: automationJobs.errorMessage,
          attempts: automationJobs.attempts,
          prospectName: prospects.name,
        })
        .from(automationJobs)
        .leftJoin(matches, eq(automationJobs.matchId, matches.id))
        .leftJoin(prospects, eq(matches.prospectId, prospects.id))
        .where(eq(automationJobs.userId, ctx.user.id))
        .orderBy(desc(automationJobs.scheduledAt))
        .limit(input.limit);

      return jobs;
    }),

  /**
   * Test platform login
   */
  testPlatformLogin: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["founder_cloud", "co_founders_lab", "y_combinator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await testPlatformLogin(ctx.user.id, input.platform);
      return result;
    }),

  /**
   * Generate a preview message for a match
   */
  previewMessage: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const match = await db
        .select({
          prospectName: prospects.name,
          prospectBio: prospects.bio,
          prospectSkills: prospects.skills,
          compatibilityScore: matches.overallScore,
        })
        .from(matches)
        .leftJoin(prospects, eq(matches.prospectId, prospects.id))
        .leftJoin(campaigns, eq(matches.campaignId, campaigns.id))
        .where(
          and(eq(matches.id, input.matchId), eq(matches.userId, ctx.user.id))
        )
        .limit(1);

      if (!match || match.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const m = match[0];
      const message = await generateOutreachMessage(
        ctx.user.name || "Founder",
        m.prospectName || "there",
        m.prospectBio,
        m.prospectSkills as string[] | null,
        "building a startup",
        m.compatibilityScore || 0
      );

      return { message };
    }),
});
