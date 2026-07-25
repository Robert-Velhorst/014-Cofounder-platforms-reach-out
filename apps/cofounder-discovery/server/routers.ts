import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import {
  saveConversationStarter,
  markStarterAsCopied,
  markStarterAsUsed,
  getConversationStartersHistory,
  getStarterEffectivenessStats,
  recordSuccessMetric,
  getSuccessMetrics,
  getSuccessMetricsStats,
} from "./db";
import { calculateCompatibility as calculateCompatibilityNew } from "./matching-engine";
import {
  scrapeAllPlatforms,
  deduplicateProfiles,
  type ScrapeResult,
} from "./scraping-engine";
import { scrapeAllPlatformsReal } from "./platform-scrapers";
import {
  campaignScheduler,
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
} from "./campaign-scheduler";
import { enrichProspect, mergeEnrichmentData } from "./enrichment-engine";
import {
  getLinkedInAuthUrl,
  getGitHubAuthUrl,
  exchangeLinkedInCode,
  exchangeGitHubCode,
  fetchLinkedInProfile,
  fetchGitHubProfile,
  importFromLinkedIn,
  importFromGitHub,
  mergeImportedProfiles,
} from "./platform-connections";
import {
  generateConversationStarters,
  regenerateConversationStarters,
  type ConversationStarterContext,
} from "./conversation-starters";
import { pipelineRouter } from "./pipeline-router";
import { aiMonitoringRouter } from "./ai-monitoring-router";
import { automationRouter } from "./automation-router";
import { platformCredentialsRouter } from "./platform-credentials-router";
import { outreachRouter } from "./outreach-router";

// Legacy compatibility wrapper
function calculateCompatibility(userProfile: any, prospect: any) {
  const userProfileData = {
    skills: userProfile.skills || [],
    industries: userProfile.targetIndustries || userProfile.industries || [],
    experience: userProfile.experience || "",
    lookingFor: userProfile.lookingFor || [],
    startupStage: userProfile.startupStage || "",
    location: userProfile.location || "",
    timezone: userProfile.timezone || undefined,
    commitment: userProfile.commitment || undefined,
    workStyle: userProfile.workStyle || [],
    values: userProfile.values || [],
    remotePreference: userProfile.remotePreference || undefined,
  };

  const score = calculateCompatibilityNew(userProfileData, prospect);

  return {
    overallScore: score.overall,
    skillsScore: score.breakdown.skills,
    industryScore: score.breakdown.industries,
    visionScore: score.breakdown.goals,
    workStyleScore: score.breakdown.workStyle,
    locationScore: score.breakdown.location,
    successProbability: Math.max(50, Math.min(95, score.overall - 5)),
    reasoning:
      score.highlights.length > 0
        ? score.highlights.join(", ")
        : "Potential for collaboration based on profile alignment",
    recommendations: [
      "Discuss long-term vision and goals",
      "Clarify roles and responsibilities",
      "Explore equity and commitment expectations",
    ],
  };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    sendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
      const token =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.setVerificationToken(ctx.user.id, token, expiry);

      // In production, send actual email here
      // For demo, just return the token
      console.log(`Verification email sent to ${ctx.user.email}`);
      console.log(`Verification link: /verify-email?token=${token}`);

      return { success: true, token };
    }),
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const user = await db.verifyEmailToken(input.token);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification token",
          });
        }
        return { success: true, email: user.email };
      }),
    checkVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return { verified: user?.emailVerified === 1 };
    }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProfile(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          location: z.string().optional(),
          timezone: z.string().optional(),
          availability: z.string().optional(),
          skills: z.array(z.string()).optional(),
          experience: z.string().optional(),
          industries: z.array(z.string()).optional(),
          previousRoles: z.array(z.string()).optional(),
          lookingFor: z.array(z.string()).optional(),
          startupStage: z.string().optional(),
          commitment: z.string().optional(),
          targetIndustries: z.array(z.string()).optional(),
          businessModel: z.array(z.string()).optional(),
          workStyle: z.array(z.string()).optional(),
          values: z.array(z.string()).optional(),
          communicationStyle: z.string().optional(),
          equityExpectation: z.string().optional(),
          fundingPreference: z.array(z.string()).optional(),
          remotePreference: z.string().optional(),
          completeness: z.number().optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createOrUpdateProfile(ctx.user.id, input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          location: z.string().optional(),
          timezone: z.string().optional(),
          availability: z.string().optional(),
          skills: z.array(z.string()).optional(),
          experience: z.string().optional(),
          industries: z.array(z.string()).optional(),
          previousRoles: z.array(z.string()).optional(),
          lookingFor: z.array(z.string()).optional(),
          startupStage: z.string().optional(),
          commitment: z.string().optional(),
          targetIndustries: z.array(z.string()).optional(),
          businessModel: z.array(z.string()).optional(),
          workStyle: z.array(z.string()).optional(),
          values: z.array(z.string()).optional(),
          communicationStyle: z.string().optional(),
          equityExpectation: z.string().optional(),
          fundingPreference: z.array(z.string()).optional(),
          remotePreference: z.string().optional(),
          completeness: z.number().optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createOrUpdateProfile(ctx.user.id, input);
      }),
  }),

  prospects: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProspects();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          title: z.string().optional(),
          location: z.string().optional(),
          bio: z.string().optional(),
          skills: z.array(z.string()).optional(),
          experience: z.string().optional(),
          industries: z.array(z.string()).optional(),
          lookingFor: z.array(z.string()).optional(),
          startupStage: z.string().optional(),
          platform: z.string().optional(),
          profileUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createProspect(input);
      }),
  }),

  matches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserMatches(ctx.user.id);
    }),

    discover: protectedProcedure.mutation(async ({ ctx }) => {
      const userProfile = await db.getUserProfile(ctx.user.id);
      if (!userProfile) {
        throw new Error("Please complete your profile first");
      }

      const allProspects = await db.getAllProspects();
      const matches = [];

      for (const prospect of allProspects.slice(0, 10)) {
        const compatibility = calculateCompatibility(userProfile, prospect);

        const match = await db.createMatch({
          userId: ctx.user.id,
          prospectId: prospect.id,
          overallScore: compatibility.overallScore,
          skillsScore: compatibility.skillsScore,
          industryScore: compatibility.industryScore,
          visionScore: compatibility.visionScore,
          workStyleScore: compatibility.workStyleScore,
          locationScore: compatibility.locationScore,
          reasoning: compatibility.reasoning,
          recommendations: compatibility.recommendations,
          successProbability: compatibility.successProbability,
          status: "new",
        });

        matches.push(match);
      }

      return { matches, count: matches.length };
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          matchId: z.number(),
          status: z.enum([
            "new",
            "viewed",
            "contacted",
            "interested",
            "not_interested",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateMatchStatus(input.matchId, input.status);
        return { success: true };
      }),
  }),

  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCampaigns(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          targetPlatforms: z.array(z.string()).optional(),
          filters: z.record(z.string(), z.any()).optional(),
          messageTemplate: z.string().optional(),
          status: z.enum(["draft", "active", "paused", "completed"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const campaignData: any = {
          userId: ctx.user.id,
          name: input.name,
        };
        if (input.description) campaignData.description = input.description;
        if (input.targetPlatforms)
          campaignData.targetPlatforms = input.targetPlatforms;
        if (input.filters) campaignData.filters = input.filters;
        if (input.messageTemplate)
          campaignData.messageTemplate = input.messageTemplate;
        if (input.status) campaignData.status = input.status;
        return await db.createCampaign(campaignData);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { campaigns } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const result = await dbConn
          .select()
          .from(campaigns)
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          )
          .limit(1);
        if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });
        return result[0];
      }),

    updateAutomation: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          automationMode: z.enum([
            "fully_automatic",
            "semi_automatic",
            "manual",
          ]),
          dailyMatchLimit: z.number().min(1).max(20),
          autoMessageEnabled: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { campaigns } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await dbConn
          .update(campaigns)
          .set({
            automationMode: input.automationMode,
            dailyMatchLimit: input.dailyMatchLimit,
            autoMessageEnabled: input.autoMessageEnabled,
          })
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          );
        return { success: true };
      }),
  }),

  messaging: router({
    generateMessage: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Profile not found",
          });

        const prospect = await db.getProspectById(input.prospectId);
        if (!prospect)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });

        // Get compatibility analysis
        const compatibility = await calculateCompatibility(profile, prospect);

        // Generate AI message using LLM
        const { invokeLLM } = await import("./_core/llm");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert at writing compelling, personalized outreach messages for entrepreneurs seeking co-founders. Write messages that are:
- Professional yet warm and authentic
- Specific to the recipient's background and skills
- Focused on mutual value and complementary strengths
- Concise (2-3 short paragraphs max)
- Include a clear call-to-action

Avoid:
- Generic templates or clichés
- Overly salesy language
- Excessive flattery
- Long-winded explanations`,
            },
            {
              role: "user",
              content: `Generate a personalized outreach message for a potential co-founder.

Your Profile:
- Skills: ${profile.skills?.join(", ") || "Not specified"}
- Industries: ${profile.industries?.join(", ") || "Not specified"}
- Experience: ${profile.experience || "Not specified"}
- Looking for: ${profile.lookingFor?.join(", ") || "Not specified"}

Prospect Profile:
- Name: ${prospect.name}
- Title: ${prospect.title || "Not specified"}
- Skills: ${prospect.skills?.join(", ") || "Not specified"}
- Industries: ${prospect.industries?.join(", ") || "Not specified"}
- Bio: ${prospect.bio || "Not specified"}
- Location: ${prospect.location || "Not specified"}

Compatibility Analysis:
- Overall Score: ${compatibility.overallScore}%
- Skills Match: ${compatibility.skillsScore}%
- Vision Alignment: ${compatibility.visionScore}%
- Key Strengths: ${compatibility.reasoning}

${input.context ? `Additional Context: ${input.context}` : ""}

Write a compelling outreach message that highlights our complementary skills and shared vision.`,
            },
          ],
        });

        const generatedMessage = response.choices[0]?.message?.content || "";

        return {
          message: generatedMessage,
          compatibility: compatibility.overallScore,
        };
      }),
    conversations: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserConversations(ctx.user.id);
    }),

    messages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getConversationMessages(input.conversationId);
      }),

    send: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          matchId: z.number().optional(),
          subject: z.string().optional(),
          body: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get or create conversation
        const conversation = await db.getOrCreateConversation(
          ctx.user.id,
          input.prospectId,
          input.matchId
        );

        // Create message
        const message = await db.createMessage({
          userId: ctx.user.id,
          prospectId: input.prospectId,
          senderId: ctx.user.id,
          recipientId: input.prospectId,
          content: input.body,
          body: input.body,
          status: "sent",
          sentAt: new Date(),
        });

        // Update conversation
        await db.updateConversation(conversation.id, {
          lastMessageAt: new Date(),
        });

        return message;
      }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markMessageAsRead(input.messageId);
        return { success: true };
      }),
  }),

  scraping: router({
    importProspects: protectedProcedure
      .input(
        z.object({
          platforms: z
            .array(z.enum(["cofounderslab", "foundercloud", "ycombinator"]))
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userProfile = await db.getUserProfile(ctx.user.id);

        const searchParams = {
          skills: userProfile?.lookingFor || [],
          industries: userProfile?.targetIndustries || [],
          location: userProfile?.location || undefined,
          limit: 50,
        };

        const scrapeResult = await scrapeAllPlatforms(searchParams);

        // Deduplicate profiles across platforms
        const uniqueProfiles = deduplicateProfiles(
          scrapeResult.results.flatMap((r: ScrapeResult) => r.profiles)
        );

        // Save prospects to database
        for (const profile of uniqueProfiles) {
          try {
            await db.createProspect(profile);
          } catch (error) {
            console.error("Failed to save prospect:", error);
          }
        }

        return {
          success: true,
          totalProfiles: scrapeResult.totalProfiles,
          uniqueProfiles: uniqueProfiles.length,
          platforms: scrapeResult.results.map((r: ScrapeResult) => ({
            platform: r.platform,
            success: r.success,
            count: r.profiles.length,
            errors: r.errors,
          })),
        };
      }),
  }),

  analytics: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),
  }),

  savedSearches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSavedSearches(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          skills: z.array(z.string()).optional(),
          industries: z.array(z.string()).optional(),
          location: z.string().optional(),
          experience: z.string().optional(),
          startupStage: z.string().optional(),
          commitment: z.string().optional(),
          remotePreference: z.string().optional(),
          minCompatibilityScore: z.number().optional(),
          fundingStage: z.array(z.string()).optional(),
          teamSizeMin: z.number().optional(),
          teamSizeMax: z.number().optional(),
          equitySplitPreference: z.string().optional(),
          notificationsEnabled: z.number().optional(),
          emailNotifications: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createSavedSearch({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          skills: z.array(z.string()).optional(),
          industries: z.array(z.string()).optional(),
          location: z.string().optional(),
          experience: z.string().optional(),
          startupStage: z.string().optional(),
          commitment: z.string().optional(),
          remotePreference: z.string().optional(),
          minCompatibilityScore: z.number().optional(),
          fundingStage: z.array(z.string()).optional(),
          teamSizeMin: z.number().optional(),
          teamSizeMax: z.number().optional(),
          equitySplitPreference: z.string().optional(),
          notificationsEnabled: z.number().optional(),
          emailNotifications: z.number().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const search = await db.getSavedSearchById(id);
        if (!search || search.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Saved search not found",
          });
        }
        return await db.updateSavedSearch(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const search = await db.getSavedSearchById(input.id);
        if (!search || search.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Saved search not found",
          });
        }
        await db.deleteSavedSearch(input.id);
        return { success: true };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const search = await db.getSavedSearchById(input.id);
        if (!search || search.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Saved search not found",
          });
        }
        return search;
      }),

    checkMatches: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const search = await db.getSavedSearchById(input.id);
        if (!search || search.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Saved search not found",
          });
        }
        const matches = await db.checkSavedSearchMatches(input.id);
        return { search, matches };
      }),

    getNewMatches: protectedProcedure
      .input(z.object({ id: z.number(), since: z.date() }))
      .query(async ({ ctx, input }) => {
        const search = await db.getSavedSearchById(input.id);
        if (!search || search.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Saved search not found",
          });
        }
        const newMatches = await db.getNewMatchesForSearch(
          input.id,
          input.since
        );
        return newMatches;
      }),
  }),

  // Enrichment procedures
  enrichment: router({
    enrichProspect: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          linkedInUrl: z.string().optional(),
          githubUrl: z.string().optional(),
          companyName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const prospect = await db.getProspectById(input.prospectId);
        if (!prospect) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });
        }

        const enriched = await enrichProspect(prospect, {
          linkedInUrl: input.linkedInUrl,
          githubUrl: input.githubUrl,
          companyName: input.companyName,
        });

        // Save enrichment data to database
        await db.updateProspectEnrichment(input.prospectId, {
          enrichmentScore: enriched.enrichmentScore,
          linkedInData: enriched.linkedin,
          githubData: enriched.github,
          companyData: enriched.company,
        });

        return enriched;
      }),

    bulkEnrich: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .mutation(async ({ input }) => {
        const prospectsToEnrich = await db.getProspectsNeedingEnrichment(
          input.limit
        );
        const results = [];

        for (const prospect of prospectsToEnrich) {
          try {
            const enriched = await enrichProspect(prospect, {
              linkedInUrl: prospect.profileUrl || undefined,
            });

            await db.updateProspectEnrichment(prospect.id, {
              enrichmentScore: enriched.enrichmentScore,
              linkedInData: enriched.linkedin,
              githubData: enriched.github,
              companyData: enriched.company,
            });

            results.push({
              prospectId: prospect.id,
              success: true,
              score: enriched.enrichmentScore,
            });
          } catch (error) {
            results.push({
              prospectId: prospect.id,
              success: false,
              error: (error as Error).message,
            });
          }
        }

        return {
          enriched: results.filter(r => r.success).length,
          total: results.length,
          results,
        };
      }),

    stats: protectedProcedure.query(async () => {
      return await db.getEnrichmentStats();
    }),
  }),

  // Scheduler procedures
  // Success Metrics Router
  successMetrics: router({
    // Record a success metric
    record: protectedProcedure
      .input(
        z.object({
          prospectId: z.number().optional(),
          campaignId: z.number().optional(),
          metricType: z.enum([
            "message_sent",
            "message_responded",
            "meeting_scheduled",
            "meeting_completed",
            "partnership_formed",
            "partnership_failed",
          ]),
          notes: z.string().optional(),
          value: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const metricId = await recordSuccessMetric({
          userId: ctx.user.id,
          ...input,
        });
        return { metricId };
      }),

    // Get success metrics
    list: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          metricType: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        return getSuccessMetrics(ctx.user.id, input);
      }),

    // Get success metrics stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getSuccessMetricsStats(ctx.user.id);
    }),
  }),

  scheduler: router({
    status: protectedProcedure.query(async () => {
      return getSchedulerStatus();
    }),

    start: protectedProcedure.mutation(async () => {
      await initializeScheduler();
      return { success: true, message: "Scheduler started" };
    }),

    stop: protectedProcedure.mutation(async () => {
      stopScheduler();
      return { success: true, message: "Scheduler stopped" };
    }),

    triggerJob: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => {
        await campaignScheduler.triggerJob(input.jobId);
        return { success: true, message: `Job ${input.jobId} triggered` };
      }),

    startJob: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => {
        const success = campaignScheduler.startJob(input.jobId);
        return { success, message: success ? "Job started" : "Job not found" };
      }),

    stopJob: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => {
        const success = campaignScheduler.stopJob(input.jobId);
        return { success, message: success ? "Job stopped" : "Job not found" };
      }),
  }),

  // Platform Connections Router
  connections: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const connected = await db.getConnectedAccounts(ctx.user.id);
      return {
        linkedin: {
          connected: !!connected?.linkedinId,
          connectedAt: connected?.linkedinConnectedAt,
        },
        github: {
          connected: !!connected?.githubId,
          username: connected?.githubUsername,
          connectedAt: connected?.githubConnectedAt,
        },
      };
    }),

    getLinkedInAuthUrl: protectedProcedure.query(({ ctx }) => {
      const redirectUri = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/api/oauth/linkedin/callback`;
      const state = `user_${ctx.user.id}_${Date.now()}`;

      try {
        const url = getLinkedInAuthUrl(redirectUri, state);
        return { url, state };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "LinkedIn OAuth not configured. Please add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.",
        });
      }
    }),

    getGitHubAuthUrl: protectedProcedure.query(({ ctx }) => {
      const redirectUri = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/api/oauth/github/callback`;
      const state = `user_${ctx.user.id}_${Date.now()}`;

      try {
        const url = getGitHubAuthUrl(redirectUri, state);
        return { url, state };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "GitHub OAuth not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
        });
      }
    }),

    connectLinkedIn: protectedProcedure
      .input(
        z.object({
          code: z.string(),
          redirectUri: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Exchange code for tokens
          const { accessToken, refreshToken, expiresIn } =
            await exchangeLinkedInCode(input.code, input.redirectUri);

          // Fetch LinkedIn profile
          const linkedinProfile = await fetchLinkedInProfile(accessToken);

          // Save connection
          await db.saveLinkedInConnection(
            ctx.user.id,
            linkedinProfile.id,
            accessToken,
            refreshToken,
            expiresIn
          );

          // Import profile data
          const importedData = importFromLinkedIn(linkedinProfile);

          // Get existing profile
          const existingProfile = await db.getUserProfile(ctx.user.id);

          // Merge data
          const merged = mergeImportedProfiles(
            (existingProfile as any) || {},
            importedData
          );

          // Update user profile
          await db.updateUserProfile(ctx.user.id, merged);

          return { success: true, imported: importedData };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `LinkedIn connection failed: ${(error as Error).message}`,
          });
        }
      }),

    connectGitHub: protectedProcedure
      .input(
        z.object({
          code: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Exchange code for token
          const { accessToken } = await exchangeGitHubCode(input.code);

          // Fetch GitHub profile
          const githubProfile = await fetchGitHubProfile(accessToken);

          // Save connection
          await db.saveGitHubConnection(
            ctx.user.id,
            githubProfile.id.toString(),
            accessToken,
            githubProfile.login
          );

          // Import profile data
          const importedData = importFromGitHub(githubProfile);

          // Get existing profile
          const existingProfile = await db.getUserProfile(ctx.user.id);

          // Merge data
          const merged = mergeImportedProfiles(
            (existingProfile as any) || {},
            undefined,
            importedData
          );

          // Update user profile
          await db.updateUserProfile(ctx.user.id, merged);

          return { success: true, imported: importedData };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `GitHub connection failed: ${(error as Error).message}`,
          });
        }
      }),

    disconnectLinkedIn: protectedProcedure.mutation(async ({ ctx }) => {
      await db.disconnectLinkedIn(ctx.user.id);
      return { success: true };
    }),

    disconnectGitHub: protectedProcedure.mutation(async ({ ctx }) => {
      await db.disconnectGitHub(ctx.user.id);
      return { success: true };
    }),
  }),

  // Conversation Starters Router
  conversationStarters: router({
    // Save starter when generated
    saveStarter: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          message: z.string(),
          tone: z.string(),
          focusArea: z.string(),
          reasoning: z.string().optional(),
          compatibilityScore: z.number().optional(),
          enrichmentScore: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const starterId = await saveConversationStarter({
          userId: ctx.user.id,
          ...input,
        });
        return { starterId };
      }),

    // Mark starter as copied
    markCopied: protectedProcedure
      .input(z.object({ starterId: z.number() }))
      .mutation(async ({ input }) => {
        await markStarterAsCopied(input.starterId);
        return { success: true };
      }),

    // Mark starter as used
    markUsed: protectedProcedure
      .input(z.object({ starterId: z.number() }))
      .mutation(async ({ input }) => {
        await markStarterAsUsed(input.starterId);
        return { success: true };
      }),

    // Get conversation history
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        return getConversationStartersHistory(ctx.user.id, input.limit);
      }),

    // Get effectiveness stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getStarterEffectivenessStats(ctx.user.id);
    }),

    // Generate new starters
    generate: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get user profile
        const userProfile = await db.getUserProfile(ctx.user.id);
        if (!userProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User profile not found",
          });
        }

        // Get prospect
        const prospect = await db.getProspectById(input.prospectId);
        if (!prospect) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });
        }

        // Calculate compatibility for insights
        const compatibility = calculateCompatibilityNew(
          {
            skills: userProfile.skills || [],
            industries: userProfile.industries || [],
            experience: userProfile.experience || "",
            lookingFor: userProfile.lookingFor || [],
            startupStage: userProfile.startupStage || "",
            location: userProfile.location || "",
          },
          prospect
        );

        // Extract shared and complementary skills
        const userSkills = new Set(userProfile.skills || []);
        const prospectSkills = new Set(prospect.skills || []);
        const sharedSkills = Array.from(userSkills).filter(s =>
          prospectSkills.has(s)
        );
        const complementarySkills = Array.from(prospectSkills).filter(
          s => !userSkills.has(s)
        );

        // Extract shared industries
        const userIndustries = new Set(userProfile.industries || []);
        const prospectIndustries = new Set(prospect.industries || []);
        const sharedIndustries = Array.from(userIndustries).filter(i =>
          prospectIndustries.has(i)
        );

        // Parse enrichment data
        let linkedinData;
        let githubData;

        // TODO: Fetch enrichment data from separate table if needed

        // Build context
        const context: ConversationStarterContext = {
          userName: ctx.user.name || "there",
          userSkills: userProfile.skills || [],
          userIndustries: userProfile.industries || [],
          userExperience: userProfile.experience ?? undefined,
          userLookingFor: userProfile.lookingFor || [],
          userBio: userProfile.bio ?? undefined,

          prospectName: prospect.name || "there",
          prospectSkills: prospect.skills || [],
          prospectIndustries: prospect.industries || [],
          prospectExperience: prospect.experience ?? undefined,
          prospectBio: prospect.bio ?? undefined,
          prospectCurrentCompany: prospect.currentCompany ?? undefined,

          linkedinData,
          githubData,

          compatibilityScore: compatibility.overall,
          sharedSkills,
          complementarySkills,
          sharedIndustries,
        };

        // Generate starters
        const starters = await generateConversationStarters(context);

        return { starters };
      }),

    regenerate: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          previousStarters: z.array(
            z.object({
              message: z.string(),
              tone: z.enum(["professional", "friendly", "enthusiastic"]),
              focusArea: z.enum([
                "skills",
                "industry",
                "project",
                "experience",
                "shared_interest",
              ]),
              reasoning: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Similar to generate, but pass previous starters
        const userProfile = await db.getUserProfile(ctx.user.id);
        if (!userProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User profile not found",
          });
        }

        const prospect = await db.getProspectById(input.prospectId);
        if (!prospect) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });
        }

        const compatibility = calculateCompatibilityNew(
          {
            skills: userProfile.skills || [],
            industries: userProfile.industries || [],
            experience: userProfile.experience || "",
            lookingFor: userProfile.lookingFor || [],
            startupStage: userProfile.startupStage || "",
            location: userProfile.location || "",
          },
          prospect
        );

        const userSkills = new Set(userProfile.skills || []);
        const prospectSkills = new Set(prospect.skills || []);
        const sharedSkills = Array.from(userSkills).filter(s =>
          prospectSkills.has(s)
        );
        const complementarySkills = Array.from(prospectSkills).filter(
          s => !userSkills.has(s)
        );

        const userIndustries = new Set(userProfile.industries || []);
        const prospectIndustries = new Set(prospect.industries || []);
        const sharedIndustries = Array.from(userIndustries).filter(i =>
          prospectIndustries.has(i)
        );

        let linkedinData;
        let githubData;

        // TODO: Fetch enrichment data from separate table if needed

        const context: ConversationStarterContext = {
          userName: ctx.user.name || "there",
          userSkills: userProfile.skills || [],
          userIndustries: userProfile.industries || [],
          userExperience: userProfile.experience ?? undefined,
          userLookingFor: userProfile.lookingFor || [],
          userBio: userProfile.bio ?? undefined,

          prospectName: prospect.name || "there",
          prospectSkills: prospect.skills || [],
          prospectIndustries: prospect.industries || [],
          prospectExperience: prospect.experience ?? undefined,
          prospectBio: prospect.bio ?? undefined,
          prospectCurrentCompany: prospect.currentCompany ?? undefined,

          linkedinData,
          githubData,

          compatibilityScore: compatibility.overall,
          sharedSkills,
          complementarySkills,
          sharedIndustries,
        };

        const starters = await regenerateConversationStarters(
          context,
          input.previousStarters
        );

        return { starters };
      }),
  }),

  // Notifications Router
  notifications: router({
    updatePreferences: protectedProcedure
      .input(
        z.object({
          emailNotificationsEnabled: z.boolean().optional(),
          notifyNewMatches: z.boolean().optional(),
          notifyMessages: z.boolean().optional(),
          weeklySummaryEnabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        await db.updateNotificationPreferences(userId, input);
        return { success: true };
      }),

    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationPreferences(ctx.user.id);
    }),
  }),

  // Follow-ups Router
  followUps: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getFollowUpStats } = await import("./follow-up-system");
      return getFollowUpStats(ctx.user.id);
    }),

    getPending: protectedProcedure.query(async ({ ctx }) => {
      const { findPendingFollowUps } = await import("./follow-up-system");
      const allPending = await findPendingFollowUps();
      return allPending.filter(f => f.userId === ctx.user.id);
    }),
  }),

  // Preferences Router
  preferences: router({
    recordFeedback: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          feedbackType: z.enum(["not_interested", "interested", "contacted"]),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { recordUserFeedback } = await import("./preference-learning");
        await recordUserFeedback({
          userId: ctx.user.id,
          prospectId: input.prospectId,
          feedbackType: input.feedbackType,
          reason: input.reason,
          timestamp: new Date(),
        });
        return { success: true };
      }),

    getInsights: protectedProcedure.query(async ({ ctx }) => {
      const { getPreferenceInsights } = await import("./preference-learning");
      return getPreferenceInsights(ctx.user.id);
    }),
  }),

  // Timeline Router
  timeline: router({
    getForProspect: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getTimelineForProspect(input.prospectId, ctx.user.id);
      }),

    getRecent: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getTimelineForUser(ctx.user.id, input.limit);
      }),

    addEvent: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          type: z.enum([
            "message_sent",
            "message_received",
            "message_opened",
            "follow_up_sent",
            "meeting_scheduled",
            "meeting_completed",
            "partnership_formed",
            "partnership_declined",
            "note_added",
          ]),
          title: z.string(),
          description: z.string().optional(),
          metadata: z.string().optional(),
          messageId: z.number().optional(),
          campaignId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const eventId = await db.createTimelineEvent({
          userId: ctx.user.id,
          ...input,
        });
        return { id: eventId, success: true };
      }),
  }),

  // AI Enhancements Router
  ai: router({
    // Conversation Quality
    getConversationMetrics: protectedProcedure.query(async ({ ctx }) => {
      const { getConversationMetrics } = await import("./conversation-quality");
      return getConversationMetrics(ctx.user.id);
    }),

    getAnalyticsDashboard: protectedProcedure.query(async ({ ctx }) => {
      const { getAnalyticsDashboard } = await import("./conversation-quality");
      return getAnalyticsDashboard(ctx.user.id);
    }),

    getOptimalMessageStyle: protectedProcedure.query(async ({ ctx }) => {
      const { getOptimalMessageStyle } = await import("./conversation-quality");
      return getOptimalMessageStyle(ctx.user.id);
    }),

    // Predictive Timing
    predictFollowUpTime: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          timezone: z.string().default("UTC"),
        })
      )
      .query(async ({ input }) => {
        const { predictOptimalFollowUpTime } = await import(
          "./predictive-timing"
        );
        return predictOptimalFollowUpTime(input.prospectId, input.timezone);
      }),

    getNextFollowUpTime: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          timezone: z.string().default("UTC"),
          minHoursFromNow: z.number().default(24),
        })
      )
      .query(async ({ input }) => {
        const { getNextOptimalFollowUpTime } = await import(
          "./predictive-timing"
        );
        return getNextOptimalFollowUpTime(
          input.prospectId,
          input.timezone,
          input.minHoursFromNow
        );
      }),

    getTimingAnalytics: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getTimingAnalytics } = await import("./predictive-timing");
        return getTimingAnalytics(input.prospectId);
      }),

    // ML-Based Scoring
    predictPartnership: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          compatibilityScore: z.object({
            overall: z.number(),
            breakdown: z.object({
              skills: z.number(),
              industries: z.number(),
              goals: z.number(),
              experience: z.number(),
              location: z.number(),
              workStyle: z.number(),
              commitment: z.number(),
            }),
            highlights: z.array(z.string()),
            concerns: z.array(z.string()),
          }),
        })
      )
      .query(async ({ ctx, input }) => {
        const { predictPartnershipSuccess } = await import(
          "./ml-match-scoring"
        );
        return predictPartnershipSuccess(
          ctx.user.id,
          input.prospectId,
          input.compatibilityScore
        );
      }),

    trackOutcome: protectedProcedure
      .input(
        z.object({
          prospectId: z.number(),
          matchId: z.number(),
          outcome: z.enum([
            "partnership_formed",
            "still_talking",
            "not_interested",
            "no_response",
            "timing_not_right",
          ]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { trackPartnershipOutcome } = await import("./ml-match-scoring");
        await trackPartnershipOutcome(
          ctx.user.id,
          input.prospectId,
          input.matchId,
          input.outcome,
          input.notes
        );
        return { success: true };
      }),

    getMLStats: protectedProcedure.query(async () => {
      const { getMLModelStats } = await import("./ml-match-scoring");
      return getMLModelStats();
    }),
  }),

  // Pipeline Router
  pipeline: pipelineRouter,

  // Metered Billing Router
  billing: router({
    getCurrentUsage: protectedProcedure.query(async ({ ctx }) => {
      const { getCurrentUsageSummary } = await import("./metered-billing");
      return getCurrentUsageSummary(ctx.user.id);
    }),

    getUsageHistory: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getUsageHistory } = await import("./metered-billing");
        return getUsageHistory(
          ctx.user.id,
          input.startDate,
          input.endDate,
          input.limit
        );
      }),

    getPricing: protectedProcedure.query(async () => {
      const { getAllPricing } = await import("./metered-billing");
      return getAllPricing();
    }),

    generateInvoice: protectedProcedure
      .input(
        z.object({
          billingPeriodId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { generateInvoice } = await import("./metered-billing");
        return generateInvoice(ctx.user.id, input.billingPeriodId);
      }),
  }),

  // Natural Language Search Router
  nlSearch: router({
    parse: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input }) => {
        const { parseNaturalLanguageQuery } = await import(
          "./natural-language-search"
        );
        return await parseNaturalLanguageQuery(input.query);
      }),

    suggest: protectedProcedure
      .input(z.object({ partialQuery: z.string() }))
      .query(async ({ input }) => {
        const { generateSearchSuggestions } = await import(
          "./natural-language-search"
        );
        return await generateSearchSuggestions(input.partialQuery);
      }),
  }),

  // Admin Analytics Router
  admin: router({
    getAnalytics: protectedProcedure
      .input(
        z.object({
          dateRange: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
        })
      )
      .query(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        // Calculate date filter
        const now = new Date();
        let dateFilter: Date | undefined;

        if (input.dateRange === "7d") {
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (input.dateRange === "30d") {
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (input.dateRange === "90d") {
          dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }

        // Get enrichment statistics
        const enrichmentStats = await db.getEnrichmentStatistics(dateFilter);

        // Get campaign statistics
        const campaignStats = await db.getCampaignStatistics(dateFilter);

        // Get platform statistics
        const platformStats = await db.getPlatformStatistics();

        return {
          enrichment: enrichmentStats,
          campaigns: campaignStats,
          platforms: platformStats,
        };
      }),
  }),

  aiMonitoring: aiMonitoringRouter,
  automation: automationRouter,
  platformCredentials: platformCredentialsRouter,
  outreach: outreachRouter,
});

export type AppRouter = typeof appRouter;
