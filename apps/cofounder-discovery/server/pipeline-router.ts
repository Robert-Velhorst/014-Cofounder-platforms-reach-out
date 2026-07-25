import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import {
  pipelineStages,
  stageTransitions,
  prospectTasks,
  prospectNotes,
  matches,
  prospects,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const pipelineRouter = router({
  /**
   * Get all pipeline stages for current user
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const stages = await database
      .select({
        id: pipelineStages.id,
        matchId: pipelineStages.matchId,
        stage: pipelineStages.stage,
        enteredAt: pipelineStages.enteredAt,
        notes: pipelineStages.notes,
        prospectName: prospects.name,
        prospectTitle: prospects.title,
        compatibilityScore: matches.overallScore,
        lastActivity: pipelineStages.enteredAt,
      })
      .from(pipelineStages)
      .innerJoin(matches, eq(pipelineStages.matchId, matches.id))
      .innerJoin(prospects, eq(matches.prospectId, prospects.id))
      .where(eq(pipelineStages.userId, ctx.user.id))
      .orderBy(desc(pipelineStages.enteredAt));

    return stages;
  }),

  /**
   * Move a match to a different stage
   */
  moveStage: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        toStage: z.enum([
          "cold",
          "contacted",
          "responded",
          "meeting",
          "partnership",
          "not_interested",
        ]),
        automated: z.boolean().default(false),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Get current stage
      const currentStage = await database
        .select()
        .from(pipelineStages)
        .where(
          and(
            eq(pipelineStages.userId, ctx.user.id),
            eq(pipelineStages.matchId, input.matchId)
          )
        )
        .limit(1);

      const fromStage = currentStage[0]?.stage;

      // Record transition
      await database.insert(stageTransitions).values({
        matchId: input.matchId,
        fromStage,
        toStage: input.toStage,
        automated: input.automated,
        reason: input.reason,
      });

      // Update or create pipeline stage
      if (currentStage.length > 0) {
        await database
          .update(pipelineStages)
          .set({
            stage: input.toStage,
            enteredAt: new Date(),
          })
          .where(eq(pipelineStages.id, currentStage[0].id));
      } else {
        await database.insert(pipelineStages).values({
          userId: ctx.user.id,
          matchId: input.matchId,
          stage: input.toStage,
        });
      }

      return { success: true };
    }),

  /**
   * Add a task for a prospect
   */
  addTask: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [task] = await database.insert(prospectTasks).values({
        userId: ctx.user.id,
        matchId: input.matchId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
      });

      return task;
    }),

  /**
   * Get tasks for a prospect
   */
  getTasks: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const tasks = await database
        .select()
        .from(prospectTasks)
        .where(
          and(
            eq(prospectTasks.userId, ctx.user.id),
            eq(prospectTasks.matchId, input.matchId)
          )
        )
        .orderBy(desc(prospectTasks.dueDate));

      return tasks;
    }),

  /**
   * Complete a task
   */
  completeTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(prospectTasks)
        .set({
          completed: true,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(prospectTasks.id, input.taskId),
            eq(prospectTasks.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Add a note to a prospect
   */
  addNote: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [note] = await database.insert(prospectNotes).values({
        userId: ctx.user.id,
        matchId: input.matchId,
        content: input.content,
      });

      return note;
    }),

  /**
   * Get notes for a prospect
   */
  getNotes: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const notes = await database
        .select()
        .from(prospectNotes)
        .where(
          and(
            eq(prospectNotes.userId, ctx.user.id),
            eq(prospectNotes.matchId, input.matchId)
          )
        )
        .orderBy(desc(prospectNotes.createdAt));

      return notes;
    }),

  /**
   * Get stage transition history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const history = await database
        .select()
        .from(stageTransitions)
        .where(eq(stageTransitions.matchId, input.matchId))
        .orderBy(desc(stageTransitions.createdAt));

      return history;
    }),
});
