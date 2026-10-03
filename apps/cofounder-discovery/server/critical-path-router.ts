import { TRPCError } from "@trpc/server";
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import {
  auditEvents,
  outreachRecords,
  prospects,
  type OutreachRecord,
  type Prospect,
} from "../drizzle/schema";
import { getConfig, publicRuntimeStatus } from "./config";
import * as data from "./db";
import {
  assessOutreachSource,
  declareOutreachSource,
  resolveOutreachSource,
  type PolicyDecision,
} from "./outreach-source-policy";
import { MAX_CSV_BYTES } from "./prospect-csv";
import { exportActiveCandidates } from "./candidate-export";
import { importDeclarationSchema } from "../shared/import-declaration";
import {
  getCandidateDetails,
  recordCandidateOptOut,
} from "./candidate-workspace";
import {
  candidateArchiveSchema,
  candidateEditSchema,
} from "../shared/candidate-input";
import { changeCandidate } from "./candidate-mutations";
import { candidateListProjection } from "./candidate-review";
import { candidateQuerySchema } from "../shared/candidate-query";
import { candidateTextFilter, candidateOrdering } from "./candidate-query";
import {
  candidateIntakeSchema,
  candidateAddSchema,
} from "../shared/candidate-intake";
import {
  previewCandidateIntake,
  addReviewedCandidate,
} from "./candidate-intake";
import {
  outreachDetailSchema,
  outreachReviseSchema,
  outreachCancelSchema,
} from "../shared/outreach-revision";
import { getOutreachDetails, changeOutreachDraft } from "./outreach-revision";
import {
  conversationCommandSchema,
  responseCommandSchema,
  reminderCommandSchema,
  closeCommandSchema,
  reminderListSchema,
} from "../shared/outreach-conversation";
import { changeConversation, listReminders } from "./outreach-conversation";
import { publicPlatformCatalogue } from "./platform-catalogue";
import {
  progressListSchema,
  progressRecordSchema,
} from "../shared/partnership-progress";
import {
  listPartnershipProgress,
  recordPartnershipProgress,
} from "./partnership-progress";
import { verifiedProcedure as protectedProcedure, router } from "./_core/trpc";
import {
  presetsReadSchema,
  presetsSaveSchema,
} from "../shared/workspace-presets";
import {
  readWorkspacePresets,
  saveWorkspacePresets,
} from "./workspace-presets";

const idempotencyKey = z
  .string()
  .trim()
  .min(8)
  .max(80)
  .regex(/^[A-Za-z0-9:_-]+$/);

function actionPolicy(
  record: OutreachRecord,
  prospect: Pick<
    Prospect,
    "id" | "userId" | "platform" | "profileUrl" | "consentStatus" | "archivedAt"
  >,
  actorId: number
): PolicyDecision {
  if (
    record.userId !== actorId ||
    prospect.userId !== actorId ||
    record.prospectId !== prospect.id
  ) {
    return {
      allowed: false,
      sourceId: null,
      reason:
        "The outreach record and prospect must belong to the same account.",
    };
  }
  const decision = assessOutreachSource(
    {
      prospect,
      actorId,
      body: record.body,
      generationMode: record.generationMode,
    },
    record.sourcePolicy,
    new Date()
  );
  if (
    decision.allowed &&
    (record.destinationUrl ?? null) !== record.sourcePolicy?.destinationUrl
  ) {
    return {
      allowed: false,
      sourceId: decision.sourceId,
      reason:
        "The stored destination changed after review. Create a freshly reviewed draft.",
    };
  }
  return decision;
}

function requireAction(decision: PolicyDecision) {
  if (!decision.allowed)
    throw new TRPCError({ code: "FORBIDDEN", message: decision.reason });
}

function transition(
  input: Parameters<typeof data.transitionOutreachRecord>[0]
) {
  return data.transitionOutreachRecord(input, (current, prospect) => {
    if (
      ["pending_review", "approved", "manual_action_required"].includes(
        input.to
      )
    ) {
      requireAction(actionPolicy(current, prospect, input.userId));
    }
    if (input.to === "manual_action_required" && getConfig().OUTREACH_PAUSED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Outreach is paused by the operator",
      });
    }
  });
}

export const criticalPathRouter = router({
  presets: router({
    read: protectedProcedure.input(presetsReadSchema).query(({ ctx, input }) =>
      readWorkspacePresets({
        ...input,
        userId: ctx.user.id,
        credentialHash: ctx.user.passwordHash,
      })
    ),
    save: protectedProcedure
      .input(presetsSaveSchema)
      .mutation(({ ctx, input }) =>
        saveWorkspacePresets({
          ...input,
          userId: ctx.user.id,
          credentialHash: ctx.user.passwordHash,
          requestId: ctx.requestId,
        })
      ),
  }),
  platforms: protectedProcedure.query(() => publicPlatformCatalogue()),
  status: protectedProcedure.query(({ ctx }) => ({
    ...publicRuntimeStatus(),
    providers: [
      {
        id: "cofounderslab",
        mode: "assisted",
        connected: false,
        reason: "No approved API connector is configured",
      },
      {
        id: "foundercloud",
        mode: "assisted",
        connected: false,
        reason: "No approved API connector is configured",
      },
      {
        id: "ycombinator",
        mode: "assisted",
        connected: false,
        reason: "No approved member-data export or API connector is configured",
      },
    ],
    actor: { id: ctx.user.id, role: ctx.user.role },
  })),

  prospects: router({
    previewIntake: protectedProcedure
      .input(candidateIntakeSchema)
      .mutation(({ ctx, input }) => previewCandidateIntake(input, ctx.user.id)),
    add: protectedProcedure
      .input(candidateAddSchema)
      .mutation(({ ctx, input }) =>
        addReviewedCandidate(input, ctx.user.id, ctx.requestId)
      ),
    edit: protectedProcedure
      .input(candidateEditSchema)
      .mutation(({ ctx, input }) =>
        changeCandidate({
          ...input,
          action: "edit",
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
    restore: protectedProcedure
      .input(candidateArchiveSchema)
      .mutation(({ ctx, input }) =>
        changeCandidate({
          ...input,
          action: "restore",
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
    details: protectedProcedure
      .input(
        z
          .object({
            id: z.number().int().positive(),
            accountId: z.number().int().positive(),
          })
          .strict()
      )
      .query(({ ctx, input }) =>
        getCandidateDetails({ ...input, userId: ctx.user.id })
      ),
    optOut: protectedProcedure
      .input(
        z
          .object({
            id: z.number().int().positive(),
            accountId: z.number().int().positive(),
            confirmed: z.literal(true),
          })
          .strict()
      )
      .mutation(({ ctx, input }) =>
        recordCandidateOptOut({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
    list: protectedProcedure
      .input(candidateQuerySchema)
      .query(async ({ ctx, input }) => {
        if (input?.accountId !== undefined && input.accountId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The signed-in account changed. Refresh your workspace.",
          });
        const db = await data.getDb();
        if (!db)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Database is not configured",
          });
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 25;
        const query = input?.query ?? "";
        const owner = and(
          eq(prospects.userId, ctx.user.id),
          input?.status === "all"
            ? undefined
            : input?.status === "archived"
              ? isNotNull(prospects.archivedAt)
              : isNull(prospects.archivedAt)
        );
        const filter = and(owner, candidateTextFilter(query));
        return db.transaction(
          async tx => {
            const [countRow] = await tx
              .select({ count: sql<number>`count(*)` })
              .from(prospects)
              .where(filter);
            const items = await tx
              .select(candidateListProjection)
              .from(prospects)
              .where(filter)
              .orderBy(...candidateOrdering(input?.sort ?? "newest"))
              .limit(pageSize)
              .offset((page - 1) * pageSize);
            return {
              items: items.map(item => ({
                ...item,
                draftPolicy: resolveOutreachSource(item),
              })),
              page,
              pageSize,
              sort: input?.sort ?? "newest",
              total: Number(countRow?.count ?? 0),
            };
          },
          { isolationLevel: "repeatable read", accessMode: "read only" }
        );
      }),
    importCsv: protectedProcedure
      .input(
        z
          .object({
            csv: z.string().max(MAX_CSV_BYTES),
            idempotencyKey,
            accountId: z.number().int().positive(),
            declaration: importDeclarationSchema,
          })
          .strict()
      )
      .mutation(({ ctx, input }) =>
        data.importProspectsCsv({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
    exportCsv: protectedProcedure
      .input(z.object({ accountId: z.number().int().positive() }).strict())
      .mutation(({ ctx, input }) =>
        exportActiveCandidates({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
    archive: protectedProcedure
      .input(candidateArchiveSchema)
      .mutation(({ ctx, input }) =>
        changeCandidate({
          ...input,
          action: "archive",
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
  }),

  progress: router({
    list: protectedProcedure.input(progressListSchema).query(({ ctx, input }) =>
      listPartnershipProgress({
        ...input,
        userId: ctx.user.id,
        credentialHash: ctx.user.passwordHash,
      })
    ),
    record: protectedProcedure
      .input(progressRecordSchema)
      .mutation(({ ctx, input }) =>
        recordPartnershipProgress({
          ...input,
          userId: ctx.user.id,
          credentialHash: ctx.user.passwordHash,
          requestId: ctx.requestId,
        })
      ),
  }),

  qualify: protectedProcedure
    .input(
      z.object({ prospectId: z.number().int().positive(), idempotencyKey })
    )
    .mutation(({ ctx, input }) =>
      data.qualifyProspect({
        ...input,
        userId: ctx.user.id,
        requestId: ctx.requestId,
      })
    ),

  outreach: router({
    details: protectedProcedure
      .input(outreachDetailSchema)
      .query(({ ctx, input }) =>
        getOutreachDetails({ ...input, userId: ctx.user.id })
      ),
    revise: protectedProcedure
      .input(outreachReviseSchema)
      .mutation(({ ctx, input }) =>
        changeOutreachDraft(
          { ...input, userId: ctx.user.id, requestId: ctx.requestId },
          "revise"
        )
      ),
    cancel: protectedProcedure
      .input(outreachCancelSchema)
      .mutation(({ ctx, input }) =>
        changeOutreachDraft(
          { ...input, userId: ctx.user.id, requestId: ctx.requestId },
          "cancel"
        )
      ),
    manualAction: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const record = await data.getOutreachRecord(input.id, ctx.user.id);
        if (!record)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Outreach record not found",
          });
        if (getConfig().OUTREACH_PAUSED)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Outreach is paused by the operator",
          });
        if (record.state !== "manual_action_required")
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Prepare this outreach before copying or opening its destination",
          });
        const prospect = await data.getProspectById(
          record.prospectId,
          ctx.user.id
        );
        if (!prospect)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });
        requireAction(actionPolicy(record, prospect, ctx.user.id));
        return {
          body: record.body,
          destinationUrl: record.sourcePolicy!.destinationUrl,
        };
      }),
    list: protectedProcedure
      .input(
        z.object({ accountId: z.number().int().positive() }).strict().optional()
      )
      .query(async ({ ctx, input }) => {
        if (input && input.accountId !== ctx.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The signed-in account changed. Refresh your workspace.",
          });
        return (await data.listOutreachRecords(ctx.user.id)).map(item => ({
          ...item,
          actionPolicy: actionPolicy(item.outreach, item.prospect, ctx.user.id),
        }));
      }),
    draft: protectedProcedure
      .input(
        z.object({
          prospectId: z.number().int().positive(),
          matchId: z.number().int().positive().optional(),
          context: z.string().trim().max(500).optional(),
          body: z.string().trim().min(1).max(10_000).optional(),
          declaration: z
            .object({
              humanOriginal: z.literal(true),
              rulesReviewed: z.literal(true),
            })
            .strict()
            .optional(),
          idempotencyKey,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const body = input.body ?? "";
        return data.createOutreachDraft(
          {
            userId: ctx.user.id,
            requestId: ctx.requestId,
            prospectId: input.prospectId,
            matchId: input.matchId,
            body,
            idempotencyKey: input.idempotencyKey,
          },
          (prospect, existing) => {
            const sourcePolicy = declareOutreachSource(
              {
                prospect,
                actorId: ctx.user.id,
                body,
                generationMode: "user_authored",
              },
              input.declaration,
              new Date()
            );
            if (existing) {
              requireAction(actionPolicy(existing, prospect, ctx.user.id));
            }
            return sourcePolicy;
          }
        );
      }),
    submitReview: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          notes: z.string().max(2_000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        transition({
          id: input.id,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          to: "pending_review",
          updates: { reviewNotes: input.notes },
        })
      ),
    approve: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        transition({
          id: input.id,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          to: "approved",
          updates: { approvedAt: new Date() },
        })
      ),
    prepareManualSend: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (getConfig().OUTREACH_PAUSED)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Outreach is paused by the operator",
          });
        return transition({
          id: input.id,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          to: "manual_action_required",
        });
      }),
    confirmSent: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          confirmation: z.literal(true),
          externalReference: z.string().trim().max(500).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        transition({
          id: input.id,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          to: "confirmed_sent",
          updates: {
            confirmedSentAt: new Date(),
            externalReference: input.externalReference,
          },
        })
      ),
    recordResponse: protectedProcedure
      .input(responseCommandSchema)
      .mutation(({ ctx, input }) =>
        changeConversation({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          action: "record_response",
        })
      ),
    scheduleFollowUp: protectedProcedure
      .input(reminderCommandSchema)
      .mutation(({ ctx, input }) =>
        changeConversation({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          action: "schedule_reminder",
        })
      ),
    close: protectedProcedure
      .input(closeCommandSchema)
      .mutation(({ ctx, input }) =>
        changeConversation({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
          action: "close",
        })
      ),
    conversation: protectedProcedure
      .input(conversationCommandSchema)
      .mutation(({ ctx, input }) =>
        changeConversation({
          ...input,
          userId: ctx.user.id,
          requestId: ctx.requestId,
        })
      ),
    reminders: protectedProcedure
      .input(reminderListSchema)
      .query(({ ctx, input }) =>
        listReminders({ ...input, userId: ctx.user.id })
      ),
  }),

  analytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await data.getDb();
    if (!db)
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Database is not configured",
      });
    const rows = await db
      .select({
        state: outreachRecords.state,
        count: sql<number>`count(*)`,
        sent: sql<number>`sum(${outreachRecords.confirmedSentAt} IS NOT NULL)`,
        responded: sql<number>`sum(${outreachRecords.confirmedSentAt} IS NOT NULL AND ${outreachRecords.responseRecordedAt} IS NOT NULL)`,
      })
      .from(outreachRecords)
      .where(eq(outreachRecords.userId, ctx.user.id))
      .groupBy(outreachRecords.state);
    const counts = Object.fromEntries(
      rows.map(row => [row.state, Number(row.count)])
    );
    const sent = rows.reduce((total, row) => total + Number(row.sent), 0);
    const responded = rows.reduce(
      (total, row) => total + Number(row.responded),
      0
    );
    return {
      counts,
      confirmedSent: sent,
      responses: responded,
      responseRate: sent === 0 ? 0 : Math.round((responded / sent) * 100),
    };
  }),

  audit: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(500).default(100) })
        .optional()
    )
    .query(({ ctx, input }) =>
      data.getUserAuditEvents(ctx.user.id, input?.limit ?? 100)
    ),
});
