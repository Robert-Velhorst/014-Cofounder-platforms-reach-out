import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, matches, outreachRecords, prospects } from "../drizzle/schema";
import { getConfig, publicRuntimeStatus } from "./config";
import * as data from "./db";
import { assertTransition, createTemplateMessage, type OutreachState } from "./outreach-state";
import { parseProspectCsv, prospectsToCsv } from "./prospect-csv";
import { consumeRateLimit } from "./rate-limit";
import { protectedProcedure, router } from "./_core/trpc";

const idempotencyKey = z.string().trim().min(8).max(80).regex(/^[A-Za-z0-9:_-]+$/);

async function audit(
  userId: number,
  requestId: string,
  action: string,
  outcome: "success" | "rejected" | "failed",
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  await data.createAuditEvent({ userId, requestId, action, outcome, entityType, entityId, metadata });
}

async function transition(input: {
  id: number;
  userId: number;
  requestId: string;
  to: OutreachState;
  updates?: Parameters<typeof data.updateOutreachRecord>[2];
}) {
  const current = await data.getOutreachRecord(input.id, input.userId);
  if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Outreach record not found" });
  try {
    assertTransition(current.state as OutreachState, input.to);
  } catch (error) {
    await audit(input.userId, input.requestId, "outreach.transition", "rejected", "outreach", String(input.id), {
      from: current.state,
      to: input.to,
    });
    throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "Invalid transition" });
  }
  const updated = await data.updateOutreachRecord(input.id, input.userId, { ...input.updates, state: input.to });
  await audit(input.userId, input.requestId, "outreach.transition", "success", "outreach", String(input.id), {
    from: current.state,
    to: input.to,
  });
  return updated;
}

export const criticalPathRouter = router({
  status: protectedProcedure.query(({ ctx }) => ({
    ...publicRuntimeStatus(),
    providers: [
      { id: "cofounderslab", mode: "assisted", connected: false, reason: "No approved API connector is configured" },
      { id: "foundercloud", mode: "assisted", connected: false, reason: "No approved API connector is configured" },
      { id: "ycombinator", mode: "manual_import", connected: false, reason: "Use a permitted CSV or manual import" },
    ],
    actor: { id: ctx.user.id, role: ctx.user.role },
  })),

  prospects: router({
    list: protectedProcedure
      .input(z.object({ query: z.string().trim().max(100).default(""), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(25) }).optional())
      .query(async ({ ctx, input }) => {
        const db = await data.getDb();
        if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured" });
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 25;
        const query = input?.query ?? "";
        const owner = and(eq(prospects.userId, ctx.user.id), isNull(prospects.archivedAt));
        const filter = query
          ? and(owner, or(like(prospects.name, `%${query}%`), like(prospects.title, `%${query}%`), like(prospects.location, `%${query}%`)))
          : owner;
        const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(prospects).where(filter);
        const items = await db.select().from(prospects).where(filter).orderBy(desc(prospects.importedAt)).limit(pageSize).offset((page - 1) * pageSize);
        return { items, page, pageSize, total: Number(countRow?.count ?? 0) };
      }),
    importCsv: protectedProcedure
      .input(z.object({ csv: z.string(), idempotencyKey }))
      .mutation(async ({ ctx, input }) => {
        const operation = "prospect.import_csv";
        const existing = await data.getIdempotencyRecord(
          ctx.user.id,
          operation,
          input.idempotencyKey
        );
        if (existing) {
          return {
            imported: Number(existing.result.imported ?? 0),
            skipped: Number(existing.result.skipped ?? 0),
            replayed: true,
          };
        }
        const rows = parseProspectCsv(input.csv);
        let imported = 0;
        let skipped = 0;
        for (const row of rows) {
          try {
            await data.createProspect({ ...row, userId: ctx.user.id, sourceKind: "csv" });
            imported += 1;
          } catch {
            skipped += 1;
          }
        }
        await audit(ctx.user.id, ctx.requestId, "prospect.import_csv", "success", "prospect", undefined, {
          idempotencyKey: input.idempotencyKey,
          imported,
          skipped,
        });
        await data.createIdempotencyRecord({
          userId: ctx.user.id,
          operation,
          idempotencyKey: input.idempotencyKey,
          result: { imported, skipped },
        });
        return { imported, skipped, replayed: false };
      }),
    exportCsv: protectedProcedure.query(async ({ ctx }) => {
      const rows = await data.getAllProspects(ctx.user.id);
      const csv = prospectsToCsv(rows.map(row => ({
        name: row.name,
        title: row.title ?? undefined,
        location: row.location ?? undefined,
        bio: row.bio ?? undefined,
        skills: row.skills ?? [],
        industries: row.industries ?? [],
        platform: row.platform ?? undefined,
        profileUrl: row.profileUrl ?? undefined,
        consentStatus: row.consentStatus,
      })));
      return { csv, filename: `cofounder-prospects-${new Date().toISOString().slice(0, 10)}.csv` };
    }),
    archive: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await data.getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured" });
      await db.update(prospects).set({ archivedAt: new Date() }).where(and(eq(prospects.id, input.id), eq(prospects.userId, ctx.user.id)));
      await audit(ctx.user.id, ctx.requestId, "prospect.archive", "success", "prospect", String(input.id));
      return { success: true };
    }),
  }),

  qualify: protectedProcedure
    .input(z.object({ prospectId: z.number().int().positive(), idempotencyKey }))
    .mutation(async ({ ctx, input }) => {
      const db = await data.getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured" });
      const prospect = await data.getProspectById(input.prospectId, ctx.user.id);
      if (!prospect) throw new TRPCError({ code: "NOT_FOUND", message: "Prospect not found" });
      const existing = await db.select().from(matches).where(and(eq(matches.userId, ctx.user.id), eq(matches.prospectId, prospect.id))).limit(1);
      if (existing[0]) return { match: existing[0], replayed: true };
      const profile = await data.getUserProfile(ctx.user.id);
      const wanted = new Set([...(profile?.lookingFor ?? []), ...(profile?.targetIndustries ?? [])].map(value => value.toLowerCase()));
      const candidate = [...(prospect.skills ?? []), ...(prospect.industries ?? [])].map(value => value.toLowerCase());
      const overlap = candidate.filter(value => wanted.has(value));
      const score = Math.min(95, 55 + overlap.length * 10 + (prospect.bio ? 5 : 0));
      const match = await data.createMatch({
        userId: ctx.user.id,
        prospectId: prospect.id,
        overallScore: score,
        skillsScore: Math.min(100, 40 + overlap.length * 20),
        reasoning: overlap.length ? `Shared signals: ${overlap.join(", ")}` : "Manual review required; no shared structured signals found",
        recommendations: ["Verify goals and availability", "Discuss decision rights", "Confirm mutual expectations"],
        status: "discovered",
      });
      await audit(ctx.user.id, ctx.requestId, "prospect.qualify", "success", "match", String(match?.id), { idempotencyKey: input.idempotencyKey, score });
      return { match, replayed: false };
    }),

  outreach: router({
    list: protectedProcedure.query(({ ctx }) => data.listOutreachRecords(ctx.user.id)),
    draft: protectedProcedure
      .input(z.object({ prospectId: z.number().int().positive(), matchId: z.number().int().positive().optional(), context: z.string().trim().max(500).optional(), body: z.string().trim().min(1).max(10_000).optional(), idempotencyKey }))
      .mutation(async ({ ctx, input }) => {
        const existing = await data.findOutreachByIdempotency(ctx.user.id, input.idempotencyKey);
        if (existing) return { outreach: existing, replayed: true };
        const prospect = await data.getProspectById(input.prospectId, ctx.user.id);
        if (!prospect) throw new TRPCError({ code: "NOT_FOUND", message: "Prospect not found" });
        if (prospect.consentStatus === "opted_out") throw new TRPCError({ code: "FORBIDDEN", message: "This prospect opted out" });
        const profile = await data.getUserProfile(ctx.user.id);
        const commonSkills = (prospect.skills ?? []).filter(skill => (profile?.skills ?? []).some(value => value.toLowerCase() === skill.toLowerCase()));
        const body = input.body ?? createTemplateMessage({ senderName: ctx.user.name || "a founder", prospectName: prospect.name, prospectTitle: prospect.title, commonSkills, context: input.context });
        const outreach = await data.createOutreachRecord({ userId: ctx.user.id, prospectId: prospect.id, matchId: input.matchId, body, state: "draft", generationMode: "template", idempotencyKey: input.idempotencyKey, destinationUrl: prospect.profileUrl });
        await audit(ctx.user.id, ctx.requestId, "outreach.draft", "success", "outreach", String(outreach?.id), { generationMode: "template" });
        return { outreach, replayed: false };
      }),
    submitReview: protectedProcedure.input(z.object({ id: z.number().int().positive(), notes: z.string().max(2_000).optional() })).mutation(({ ctx, input }) => transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "pending_review", updates: { reviewNotes: input.notes } })),
    approve: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "approved", updates: { approvedAt: new Date() } })),
    prepareManualSend: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (getConfig().OUTREACH_PAUSED) throw new TRPCError({ code: "FORBIDDEN", message: "Outreach is paused by the operator" });
      const rate = consumeRateLimit(`prepare:${ctx.user.id}`, { limit: 20, windowMs: 24 * 60 * 60 * 1000 });
      if (!rate.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Daily assisted-outreach limit reached" });
      return transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "manual_action_required" });
    }),
    confirmSent: protectedProcedure.input(z.object({ id: z.number().int().positive(), confirmation: z.literal(true), externalReference: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "confirmed_sent", updates: { confirmedSentAt: new Date(), externalReference: input.externalReference } })),
    recordResponse: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "responded", updates: { responseRecordedAt: new Date() } })),
    scheduleFollowUp: protectedProcedure.input(z.object({ id: z.number().int().positive(), followUpAt: z.coerce.date().min(new Date()) })).mutation(({ ctx, input }) => transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "follow_up_due", updates: { followUpAt: input.followUpAt } })),
    close: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => transition({ id: input.id, userId: ctx.user.id, requestId: ctx.requestId, to: "closed", updates: { closedAt: new Date() } })),
  }),

  analytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await data.getDb();
    if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured" });
    const rows = await db.select({ state: outreachRecords.state, count: sql<number>`count(*)` }).from(outreachRecords).where(eq(outreachRecords.userId, ctx.user.id)).groupBy(outreachRecords.state);
    const counts = Object.fromEntries(rows.map(row => [row.state, Number(row.count)]));
    const sent = counts.confirmed_sent ?? 0;
    const responded = counts.responded ?? 0;
    return { counts, confirmedSent: sent, responses: responded, responseRate: sent + responded === 0 ? 0 : Math.round((responded / (sent + responded)) * 100) };
  }),

  audit: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional()).query(({ ctx, input }) => data.getUserAuditEvents(ctx.user.id, input?.limit ?? 100)),
});
