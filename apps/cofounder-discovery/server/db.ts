import { assertVerifiedWorkspaceWorkAllowed } from "./account-work-fence";
import {
  eq,
  and,
  desc,
  sql,
  or,
  isNull,
  isNotNull,
  lt,
  gte,
  lte,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  userProfiles,
  prospects,
  matches,
  campaigns,
  messages,
  conversations,
  savedSearches,
  conversationStartersHistory,
  successMetrics,
  timelineEvents,
  outreachRecords,
  auditEvents,
  idempotencyRecords,
} from "../drizzle/schema";
import type {
  InsertUser,
  InsertUserProfile,
  InsertProspect,
  InsertMatch,
  InsertCampaign,
  InsertMessage,
  InsertConversation,
  InsertSavedSearch,
  InsertOutreachRecord,
  InsertAuditEvent,
  InsertIdempotencyRecord,
  OutreachRecord,
  Prospect,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createHash, randomUUID } from "node:crypto";
import {
  profilePatchSchema,
  profileCompleteness,
} from "../shared/profile-input";
import { TRPCError } from "@trpc/server";
import { canTransition, type OutreachState } from "./outreach-state";
import type { OutreachSourceReceipt } from "./outreach-source-policy";
import { parseProspectCsv } from "./prospect-csv";
import { importDeclarationSchema } from "../shared/import-declaration";
import { resolveOutreachSource } from "./outreach-source-policy";
import {
  availableCapacity,
  lockCapacityResource,
  throwCapacityReached,
} from "./capacity";
import { candidateListProjection } from "./candidate-review";
import { readRuntimeSecret } from "./runtime-secrets";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const databaseUrl = _db ? undefined : readRuntimeSecret("DATABASE_URL");
  if (!_db && databaseUrl) {
    try {
      _db = drizzle(databaseUrl);
    } catch {
      // Driver configuration errors may embed the complete credential-bearing URL.
      console.warn("[Database] Connection configuration unavailable");
      _db = null;
    }
  }
  return _db;
}

export async function closeDb() {
  const db = _db;
  _db = null;
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    db.$client.end(error => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// ===== User Management =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.transaction(
      async tx => {
        await lockCapacityResource(tx, "accounts");
        const [existing] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.openId, user.openId))
          .limit(1);
        if (!existing) await availableCapacity(tx, "accounts");
        await tx
          .insert(users)
          .values(values)
          .onDuplicateKeyUpdate({ set: updateSet });
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account service is temporarily unavailable.",
    });
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function createLocalUser(user: InsertUser) {
  try {
    const db = await getDb();
    if (!db) throw new Error("account_storage_unavailable");
    return await db.transaction(
      async tx => {
        await lockCapacityResource(tx, "accounts");
        if (user.email) {
          const [existing] = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, user.email.trim().toLowerCase()))
            .limit(1);
          if (existing)
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account already exists for this email",
            });
        }
        await availableCapacity(tx, "accounts");
        const [created] = await tx
          .insert(users)
          .values({ ...user, email: user.email?.trim().toLowerCase() })
          .$returningId();
        const [result] = await tx
          .select()
          .from(users)
          .where(eq(users.id, created.id))
          .limit(1);
        if (!result) throw new Error("account_create_missing");
        return result;
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Account creation is temporarily unavailable. Check whether you can sign in before retrying.",
    });
  }
}

function prepareUserLookup(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  return db
    .select()
    .from(users)
    .where(eq(users.openId, sql.placeholder("openId")))
    .limit(1)
    .prepare();
}

// Reuse SQL/row mapping, never account rows. Weak keys cannot pin closed pools.
const userLookupQueries = new WeakMap<
  NonNullable<Awaited<ReturnType<typeof getDb>>>,
  ReturnType<typeof prepareUserLookup>
>();

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Account service is temporarily unavailable.",
    });
  }

  let query = userLookupQueries.get(db);
  if (!query) {
    query = prepareUserLookup(db);
    userLookupQueries.set(db, query);
  }
  const result = await query.execute({ openId });

  return result.length > 0 ? result[0] : undefined;
}

// ===== User Profile Management =====

export async function createOrUpdateProfile(
  userId: number,
  profileData: Partial<InsertUserProfile>,
  requestId: string = randomUUID()
) {
  const parsed = profilePatchSchema.safeParse(profileData);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Profile fields are invalid or exceed the supported limits.",
    });
  const { completeness: _clientCompleteness, ...values } = parsed.data;
  const patch = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  );
  try {
    const db = await getDb();
    if (!db) throw new Error("profile_storage_unavailable");
    return await db.transaction(
      async tx => {
        const [owner] = await tx
          .select({
            id: users.id,
            deletionFencedAt: users.deletionFencedAt,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.id, userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        const [existing] = await tx
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .orderBy(desc(userProfiles.id))
          .limit(1)
          .for("update");
        // Keep older duplicate records intact; all supported reads use this same
        // latest-ID rule until an explicit reconciliation workflow is available.
        const completeness = profileCompleteness({ ...existing, ...patch });
        let id = existing?.id;
        if (existing) {
          await tx
            .update(userProfiles)
            .set({ ...patch, completeness })
            .where(
              and(
                eq(userProfiles.id, existing.id),
                eq(userProfiles.userId, userId)
              )
            );
        } else {
          const [created] = await tx
            .insert(userProfiles)
            .values({ ...patch, userId, isPublic: false, completeness })
            .$returningId();
          id = created.id;
        }
        await appendWorkspaceAudit(tx, {
          userId,
          requestId,
          action: "profile.save",
          outcome: "success",
          entityType: "profile",
          entityId: String(id),
          metadata: { fields: Object.keys(patch), created: !existing },
        });
        const [saved] = await tx
          .select()
          .from(userProfiles)
          .where(and(eq(userProfiles.id, id!), eq(userProfiles.userId, userId)))
          .limit(1);
        if (!saved) throw new Error("profile_readback_missing");
        return saved;
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Profile storage is temporarily unavailable. Your changes could not be confirmed; retry the same values.",
    });
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .orderBy(desc(userProfiles.id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Prospects Management =====

export async function createProspect(prospectData: InsertProspect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!prospectData.userId) throw new Error("Prospect owner is required");
  const userId = prospectData.userId;

  return db.transaction(
    async tx => {
      const [owner] = await tx
        .select({
          id: users.id,
          deletionFencedAt: users.deletionFencedAt,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      if (!owner)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      assertVerifiedWorkspaceWorkAllowed(owner);
      await availableCapacity(tx, "prospects", userId);
      const [created] = await tx
        .insert(prospects)
        .values(prospectData)
        .$returningId();
      const allProspects = await tx
        .select()
        .from(prospects)
        .where(and(eq(prospects.id, created.id), eq(prospects.userId, userId)))
        .limit(1);
      return allProspects[0];
    },
    { isolationLevel: "read committed" }
  );
}

export async function getAllProspects(userId?: number) {
  const db = await getDb();
  if (!db || !userId) return [];

  return await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.userId, userId), isNull(prospects.archivedAt)))
    .orderBy(desc(prospects.importedAt));
}

export async function getProspectById(id: number, userId?: number) {
  const db = await getDb();
  if (!db || !userId) return null;

  const result = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.id, id),
        eq(prospects.userId, userId),
        isNull(prospects.archivedAt)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Matches Management =====

export async function createMatch(matchData: InsertMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [created] = await db.insert(matches).values(matchData).$returningId();
  const allMatches = await db
    .select()
    .from(matches)
    .where(
      and(eq(matches.id, created.id), eq(matches.userId, matchData.userId))
    )
    .limit(1);
  return allMatches[0];
}

export async function qualifyProspect(input: {
  userId: number;
  prospectId: number;
  idempotencyKey: string;
  requestId: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("qualification_storage_unavailable");
    return await db.transaction(
      async tx => {
        // Account-first ordering matches draft/import admission and prevents two
        // same-owner qualification requests from racing to create a first match.
        const [owner] = await tx
          .select({
            id: users.id,
            deletionFencedAt: users.deletionFencedAt,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        const operation = "prospect.qualify";
        const [receipt] = await tx
          .select()
          .from(idempotencyRecords)
          .where(
            and(
              eq(idempotencyRecords.userId, input.userId),
              eq(idempotencyRecords.operation, operation),
              eq(idempotencyRecords.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1)
          .for("update");
        if (receipt && receipt.result.prospectId !== input.prospectId)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This qualification key belongs to another prospect or an unverifiable receipt.",
          });
        const [prospect] = await tx
          .select()
          .from(prospects)
          .where(
            and(
              eq(prospects.id, input.prospectId),
              eq(prospects.userId, input.userId),
              isNull(prospects.archivedAt)
            )
          )
          .limit(1)
          .for("share");
        if (!prospect)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });
        if (prospect.consentStatus === "opted_out")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This prospect opted out. Qualification is not available.",
          });
        if (receipt) {
          const matchId = receipt.result.matchId;
          if (
            typeof matchId !== "number" ||
            !Number.isSafeInteger(matchId) ||
            matchId < 1
          )
            throw new TRPCError({
              code: "CONFLICT",
              message: "The saved qualification receipt cannot be verified.",
            });
          const [match] = await tx
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.id, matchId),
                eq(matches.userId, input.userId),
                eq(matches.prospectId, input.prospectId)
              )
            )
            .limit(1)
            .for("share");
          if (!match)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "The saved qualification is unavailable for this account and prospect.",
            });
          return { match, replayed: true };
        }
        const saveReceipt = (matchId: number) =>
          tx.insert(idempotencyRecords).values({
            userId: input.userId,
            operation,
            idempotencyKey: input.idempotencyKey,
            result: { prospectId: input.prospectId, matchId },
          });
        // Preserve historical assessments; a new retry key is not a rescore request.
        const [existing] = await tx
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.userId, input.userId),
              eq(matches.prospectId, input.prospectId)
            )
          )
          .orderBy(desc(matches.id))
          .limit(1)
          .for("share");
        if (existing) {
          await saveReceipt(existing.id);
          return { match: existing, replayed: true };
        }
        const [profile] = await tx
          .select({
            lookingFor: userProfiles.lookingFor,
            targetIndustries: userProfiles.targetIndustries,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, input.userId))
          .orderBy(desc(userProfiles.id))
          .limit(1)
          .for("share");
        const normalize = (value: string) => value.trim().toLowerCase();
        const wanted = new Set(
          [...(profile?.lookingFor ?? []), ...(profile?.targetIndustries ?? [])]
            .map(normalize)
            .filter(Boolean)
        );
        const candidate = new Set(
          [...(prospect.skills ?? []), ...(prospect.industries ?? [])]
            .map(normalize)
            .filter(Boolean)
        );
        const overlap = Array.from(candidate).filter(value =>
          wanted.has(value)
        );
        const score = Math.min(
          95,
          55 + overlap.length * 10 + (prospect.bio?.trim() ? 5 : 0)
        );
        const [created] = await tx
          .insert(matches)
          .values({
            userId: input.userId,
            prospectId: input.prospectId,
            overallScore: score,
            skillsScore: Math.min(100, 40 + overlap.length * 20),
            reasoning: overlap.length
              ? `Shared signals: ${overlap.join(", ")}`
              : "Manual review required; no shared structured signals found",
            recommendations: [
              "Verify goals and availability",
              "Discuss decision rights",
              "Confirm mutual expectations",
            ],
            status: "discovered",
          })
          .$returningId();
        await appendWorkspaceAudit(tx, {
          userId: input.userId,
          requestId: input.requestId,
          action: operation,
          outcome: "success",
          entityType: "match",
          entityId: String(created.id),
          metadata: {
            idempotencyKey: input.idempotencyKey,
            score,
            method: "local_structured_v1",
          },
        });
        await saveReceipt(created.id);
        const [match] = await tx
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.id, created.id),
              eq(matches.userId, input.userId),
              eq(matches.prospectId, input.prospectId)
            )
          )
          .limit(1);
        if (!match) throw new Error("qualification_readback_missing");
        return { match, replayed: false };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Qualification storage is temporarily unavailable. Retry the same request.",
    });
  }
}

export async function getUserMatches(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      match: matches,
      prospect: prospects,
    })
    .from(matches)
    .leftJoin(prospects, eq(matches.prospectId, prospects.id))
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.overallScore));

  return result;
}

export async function updateMatchStatus(
  matchId: number,
  status:
    | "new"
    | "viewed"
    | "contacted"
    | "interested"
    | "not_interested"
    | "discovered"
    | "queued"
    | "approved"
    | "rejected"
    | "responded"
    | "meeting_scheduled"
    | "partnership_formed"
    | "no_response",
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!userId) throw new Error("Match owner is required");

  await db
    .update(matches)
    .set({ status })
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)));
}

// ===== Campaigns Management =====

export async function createCampaign(campaignData: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(campaigns).values(campaignData);
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.id))
    .limit(1);
  return allCampaigns[0];
}

export async function getUserCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .orderBy(desc(campaigns.createdAt));
}

export async function updateCampaignStats(
  campaignId: number,
  stats: {
    prospectsFound?: number;
    messagesSent?: number;
    responsesReceived?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(campaigns).set(stats).where(eq(campaigns.id, campaignId));
}

// ===== Analytics =====

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, userId));
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  return {
    totalMatches: userMatches.length,
    newMatches: userMatches.filter(m => m.status === "new").length,
    contactedMatches: userMatches.filter(m => m.status === "contacted").length,
    interestedMatches: userMatches.filter(m => m.status === "interested")
      .length,
    totalCampaigns: userCampaigns.length,
    activeCampaigns: userCampaigns.filter(c => c.status === "active").length,
    totalMessagesSent: userCampaigns.reduce(
      (sum, c) => sum + (c.messagesSent || 0),
      0
    ),
    totalResponses: userCampaigns.reduce(
      (sum, c) => sum + (c.responsesReceived || 0),
      0
    ),
  };
}

// ===== Messaging =====

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(message);
  const allMessages = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.id))
    .limit(1);
  return allMessages[0];
}

export async function getOrCreateConversation(
  userId: number,
  prospectId: number,
  matchId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const prospect = await getProspectById(prospectId, userId);
  if (!prospect) throw new Error("Prospect not found");

  // Try to find existing conversation
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.prospectId, prospectId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new conversation
  await db.insert(conversations).values({
    userId,
    prospectId,
    matchId: matchId || null,
    lastMessageAt: new Date(),
    unreadCount: 0,
  });

  const newConv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.prospectId, prospectId)
      )
    )
    .limit(1);

  return newConv[0];
}

export async function getConversationMessages(
  conversationId: number,
  userId?: number
) {
  const db = await getDb();
  if (!db || !userId) return [];

  // Find messages by matching conversation's matchId
  const conv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);
  if (conv.length === 0) return [];

  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.conversationId, conversationId)
      )
    )
    .orderBy(messages.sentAt);
  return result;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      conversation: conversations,
      prospect: prospects,
    })
    .from(conversations)
    .leftJoin(prospects, eq(conversations.prospectId, prospects.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.lastMessageAt));

  return result;
}

export async function markMessageAsRead(messageId: number, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!userId) throw new Error("Message owner is required");

  await db
    .update(messages)
    .set({ status: "read", readAt: new Date() })
    .where(and(eq(messages.id, messageId), eq(messages.userId, userId)));
}

export async function updateConversation(
  conversationId: number,
  updates: { lastMessageAt?: Date; unreadCount?: number },
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!userId) throw new Error("Conversation owner is required");

  await db
    .update(conversations)
    .set(updates)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    );
}

// ===== Production-safe assisted outreach =====

export async function findOutreachByIdempotency(userId: number, key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(outreachRecords)
    .where(
      and(
        eq(outreachRecords.userId, userId),
        eq(outreachRecords.idempotencyKey, key)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function createOutreachRecord(record: InsertOutreachRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.transaction(
    async tx => {
      const [owner] = await tx
        .select({
          id: users.id,
          deletionFencedAt: users.deletionFencedAt,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, record.userId))
        .for("update");
      if (!owner)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      assertVerifiedWorkspaceWorkAllowed(owner);
      await availableCapacity(tx, "outreach", record.userId);
      const [created] = await tx
        .insert(outreachRecords)
        .values(record)
        .$returningId();
      const [result] = await tx
        .select()
        .from(outreachRecords)
        .where(
          and(
            eq(outreachRecords.id, created.id),
            eq(outreachRecords.userId, record.userId)
          )
        )
        .limit(1);
      return result;
    },
    { isolationLevel: "read committed" }
  );
}

export async function getOutreachRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(outreachRecords)
    .where(and(eq(outreachRecords.id, id), eq(outreachRecords.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function listOutreachRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ outreach: outreachRecords, prospect: candidateListProjection })
    .from(outreachRecords)
    .innerJoin(prospects, eq(outreachRecords.prospectId, prospects.id))
    .where(
      and(eq(outreachRecords.userId, userId), eq(prospects.userId, userId))
    )
    .orderBy(desc(outreachRecords.updatedAt));
}

export async function updateOutreachRecord(
  id: number,
  userId: number,
  updates: Partial<InsertOutreachRecord>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(outreachRecords)
    .set(updates)
    .where(and(eq(outreachRecords.id, id), eq(outreachRecords.userId, userId)));
  return getOutreachRecord(id, userId);
}

export async function createOutreachDraft(
  input: {
    userId: number;
    prospectId: number;
    matchId?: number;
    body: string;
    idempotencyKey: string;
    requestId: string;
  },
  authorize: (
    prospect: Prospect,
    existing: OutreachRecord | undefined
  ) => OutreachSourceReceipt
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("outreach_storage_unavailable");
    return await db.transaction(
      async tx => {
        // Account -> outreach -> prospect -> match, shared with transitions.
        // The account lock serializes even the first use of a draft key.
        const [owner] = await tx
          .select({
            id: users.id,
            deletionFencedAt: users.deletionFencedAt,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        const [existing] = await tx
          .select()
          .from(outreachRecords)
          .where(
            and(
              eq(outreachRecords.userId, input.userId),
              eq(outreachRecords.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1)
          .for("update");
        const [prospect] = await tx
          .select()
          .from(prospects)
          .where(
            and(
              eq(prospects.id, input.prospectId),
              eq(prospects.userId, input.userId)
            )
          )
          .limit(1)
          .for("share");
        if (!prospect)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Prospect not found",
          });
        if (input.matchId !== undefined) {
          const [match] = await tx
            .select({ id: matches.id })
            .from(matches)
            .where(
              and(
                eq(matches.id, input.matchId),
                eq(matches.userId, input.userId),
                eq(matches.prospectId, input.prospectId)
              )
            )
            .limit(1)
            .for("share");
          if (!match)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Match not found for this prospect",
            });
        }
        if (
          existing &&
          (existing.prospectId !== input.prospectId ||
            existing.body !== input.body ||
            (existing.matchId ?? null) !== (input.matchId ?? null))
        )
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This draft key already belongs to different content. Start a new draft.",
          });
        const sourcePolicy = authorize(prospect, existing);
        // Revalidate the original receipt, but never renew it on a retry.
        if (existing) return { outreach: existing, replayed: true };
        await availableCapacity(tx, "outreach", input.userId);
        const [created] = await tx
          .insert(outreachRecords)
          .values({
            userId: input.userId,
            prospectId: input.prospectId,
            matchId: input.matchId,
            body: input.body,
            idempotencyKey: input.idempotencyKey,
            state: "draft",
            generationMode: "user_authored",
            sourcePolicy,
            destinationUrl: sourcePolicy.destinationUrl,
          })
          .$returningId();
        await appendWorkspaceAudit(tx, {
          userId: input.userId,
          requestId: input.requestId,
          action: "outreach.draft",
          outcome: "success",
          entityType: "outreach",
          entityId: String(created.id),
          metadata: {
            generationMode: "user_authored",
            sourceId: sourcePolicy.sourceId,
            policyVersion: sourcePolicy.version,
          },
        });
        const [outreach] = await tx
          .select()
          .from(outreachRecords)
          .where(
            and(
              eq(outreachRecords.id, created.id),
              eq(outreachRecords.userId, input.userId)
            )
          )
          .limit(1);
        if (!outreach) throw new Error("outreach_create_missing");
        return { outreach, replayed: false };
        // Account locking supplies replay serialization. READ COMMITTED avoids
        // absent-key gap locks coupling unrelated customers' first draft inserts.
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Outreach storage is temporarily unavailable. Please try again.",
    });
  }
}

export async function transitionOutreachRecord(
  input: {
    id: number;
    userId: number;
    requestId: string;
    to: OutreachState;
    updates?: Partial<
      Pick<
        InsertOutreachRecord,
        | "reviewNotes"
        | "approvedAt"
        | "confirmedSentAt"
        | "externalReference"
        | "responseRecordedAt"
        | "followUpAt"
        | "closedAt"
      >
    >;
  },
  authorize: (record: OutreachRecord, prospect: Prospect) => void
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("outreach_storage_unavailable");
    const result = await db.transaction(async tx => {
      // All transitions share account -> outreach -> prospect lock order with
      // draft creation. This serializes quota admission across server processes.
      const [owner] = await tx
        .select({
          id: users.id,
          deletionFencedAt: users.deletionFencedAt,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .for("update");
      if (!owner)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      assertVerifiedWorkspaceWorkAllowed(owner);
      const [current] = await tx
        .select()
        .from(outreachRecords)
        .where(
          and(
            eq(outreachRecords.id, input.id),
            eq(outreachRecords.userId, input.userId)
          )
        )
        .limit(1)
        .for("update");
      if (!current)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Outreach record not found",
        });
      const [prospect] = await tx
        .select()
        .from(prospects)
        .where(
          and(
            eq(prospects.id, current.prospectId),
            eq(prospects.userId, input.userId)
          )
        )
        .limit(1)
        .for("share");
      if (!prospect)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prospect not found",
        });
      authorize(current, prospect);
      const allowed = canTransition(current.state, input.to);
      if (allowed) {
        if (input.to === "manual_action_required") {
          // Only committed successful preparations consume the rolling allowance.
          // Retention must preserve these audit events for at least 24 hours.
          // No earlier snapshot reads: this reads after acquiring the account lock.
          const usage = await tx
            .select({ id: auditEvents.id })
            .from(auditEvents)
            .where(
              and(
                eq(auditEvents.userId, input.userId),
                eq(auditEvents.action, "outreach.transition"),
                eq(auditEvents.outcome, "success"),
                sql`${auditEvents.createdAt} > DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)`,
                sql`JSON_UNQUOTE(JSON_EXTRACT(${auditEvents.metadata}, '$.to')) = 'manual_action_required'`
              )
            )
            .limit(20);
          if (usage.length >= 20)
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Daily assisted-outreach limit reached",
            });
        }
        await tx
          .update(outreachRecords)
          .set({ ...input.updates, state: input.to })
          .where(
            and(
              eq(outreachRecords.id, input.id),
              eq(outreachRecords.userId, input.userId)
            )
          );
      }
      await appendWorkspaceAudit(tx, {
        userId: input.userId,
        requestId: input.requestId,
        action: "outreach.transition",
        outcome: allowed ? "success" : "rejected",
        entityType: "outreach",
        entityId: String(input.id),
        metadata: { from: current.state, to: input.to },
      });
      if (!allowed) return { rejected: true as const, from: current.state };
      const [updated] = await tx
        .select()
        .from(outreachRecords)
        .where(
          and(
            eq(outreachRecords.id, input.id),
            eq(outreachRecords.userId, input.userId)
          )
        )
        .limit(1);
      if (!updated) throw new Error("outreach_update_missing");
      return { rejected: false as const, updated };
    });
    // A rejected-state audit must commit before the API returns the conflict.
    if (result.rejected)
      throw new TRPCError({
        code: "CONFLICT",
        message: `Invalid outreach transition: ${result.from} -> ${input.to}`,
      });
    return result.updated;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Outreach storage is temporarily unavailable. Please try again.",
    });
  }
}

export async function createAuditEvent(event: InsertAuditEvent) {
  // Workspace receipts must be atomic with their owner-locked mutation.
  if (isWorkspaceAuditAction(event.action))
    throw new Error("workspace_audit_requires_mutation_transaction");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(auditEvents).values(event);
}

export async function getUserAuditEvents(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.userId, userId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}

export async function getIdempotencyRecord(
  userId: number,
  operation: string,
  key: string
) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(idempotencyRecords)
    .where(
      and(
        eq(idempotencyRecords.userId, userId),
        eq(idempotencyRecords.operation, operation),
        eq(idempotencyRecords.idempotencyKey, key)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function importProspectsCsv(input: {
  userId: number;
  accountId: number;
  requestId: string;
  csv: string;
  idempotencyKey: string;
  declaration: unknown;
}) {
  if (!Number.isSafeInteger(input.accountId) || input.accountId <= 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A reviewed account is required.",
    });
  if (input.accountId !== input.userId)
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "The signed-in account changed. Reload and review the import for this account.",
    });
  const parsedDeclaration = importDeclarationSchema.safeParse(
    input.declaration
  );
  if (!parsedDeclaration.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Confirm direct-from-person data, processing rights and an opaque evidence reference. Platform exports and scraped/copied member data are not admitted.",
    });
  const declaration = parsedDeclaration.data;
  // Validate the entire bounded file before acquiring any database locks.
  let rows: ReturnType<typeof parseProspectCsv>;
  try {
    rows = parseProspectCsv(input.csv);
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Invalid prospect CSV",
    });
  }
  // Resolve source identity only: opted-out records must remain importable for
  // suppression. This check grants neither platform copying rights nor outreach.
  const sources = rows.map((row, index) => {
    const source = resolveOutreachSource({
      platform: row.platform,
      profileUrl: row.profileUrl,
    });
    if (!source.allowed || !source.sourceId)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `CSV record ${index + 1}: ${source.reason}`,
      });
    return source.sourceId;
  });
  const operation = "prospect.import_csv";
  const version = "2026-09-13-direct-data-v1" as const;
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ version, csv: input.csv, declaration }), "utf8")
    .digest("hex");
  try {
    const db = await getDb();
    if (!db) throw new Error("import_storage_unavailable");
    return await db.transaction(
      async tx => {
        // Shared account-first ordering serializes same-owner imports and retries.
        const [owner] = await tx
          .select({
            id: users.id,
            deletionFencedAt: users.deletionFencedAt,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        const [existing] = await tx
          .select()
          .from(idempotencyRecords)
          .where(
            and(
              eq(idempotencyRecords.userId, input.userId),
              eq(idempotencyRecords.operation, operation),
              eq(idempotencyRecords.idempotencyKey, input.idempotencyKey)
            )
          )
          .limit(1)
          .for("update");
        if (existing) {
          if (existing.result.requestHash !== requestHash)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This import key belongs to different data or an older unverifiable receipt. Review your prospects before starting a new import.",
            });
          const { imported, skipped } = existing.result;
          if (
            typeof imported !== "number" ||
            typeof skipped !== "number" ||
            !Number.isSafeInteger(imported) ||
            !Number.isSafeInteger(skipped) ||
            imported < 0 ||
            skipped < 0 ||
            imported + skipped !== rows.length
          )
            throw new Error("invalid_import_receipt");
          return { imported, skipped, replayed: true };
        }
        let imported = 0;
        let skipped = 0;
        let available: number | undefined;
        const declaredAt = new Date().toISOString();
        for (let index = 0; index < rows.length; index++) {
          const row = rows[index];
          if (row.profileUrl) {
            const [duplicate] = await tx
              .select({ id: prospects.id })
              .from(prospects)
              .where(
                and(
                  eq(prospects.userId, input.userId),
                  eq(prospects.profileUrl, row.profileUrl)
                )
              )
              .limit(1)
              .for("share");
            // Include archived/opted-out records. Never overwrite their data or consent.
            if (duplicate) {
              skipped += 1;
              continue;
            }
          }
          // Count once, only when this batch actually adds a row. Keep the
          // service lock until the whole batch/audit/receipt commits or rolls back.
          available ??= await availableCapacity(tx, "prospects", input.userId);
          if (imported >= available) throwCapacityReached("prospects");
          await tx.insert(prospects).values({
            ...row,
            userId: input.userId,
            sourceKind: "csv",
            importProvenance: {
              ...declaration,
              version,
              actorId: input.userId,
              sourceId: sources[index],
              importKey: input.idempotencyKey,
              requestHash,
              declaredAt,
            },
          });
          imported += 1;
        }
        await appendWorkspaceAudit(tx, {
          userId: input.userId,
          requestId: input.requestId,
          action: operation,
          outcome: "success",
          entityType: "prospect",
          metadata: {
            idempotencyKey: input.idempotencyKey,
            imported,
            skipped,
          },
        });
        await tx.insert(idempotencyRecords).values({
          userId: input.userId,
          operation,
          idempotencyKey: input.idempotencyKey,
          result: { requestHash, imported, skipped },
        });
        return { imported, skipped, replayed: false };
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Import storage is temporarily unavailable. No partial import was saved. Retry the same submission.",
    });
  }
}

export async function createIdempotencyRecord(record: InsertIdempotencyRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(idempotencyRecords)
    .values(record)
    .onDuplicateKeyUpdate({
      // Never overwrite the response from the request that won the race.
      set: { id: sql`${idempotencyRecords.id}` },
    });
  return getIdempotencyRecord(
    record.userId,
    record.operation,
    record.idempotencyKey
  );
}

// ===== Email Verification =====

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function setVerificationToken(
  userId: number,
  token: string,
  expiry: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!/^[A-Za-z0-9_-]{43}$/.test(token) || !Number.isFinite(expiry.getTime()))
    throw new Error("verification_token_input_invalid");
  await db.transaction(async tx => {
    const [owner] = await tx
      .select({ email: users.email, fencedAt: users.deletionFencedAt })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    if (!owner?.email || owner.fencedAt !== null)
      throw new Error("verification_account_unavailable");
    await tx
      .update(users)
      .set({
        verificationToken: createHash("sha256").update(token).digest("hex"),
        verificationEmailDigest: createHash("sha256")
          .update(owner.email.trim().toLowerCase())
          .digest("hex"),
        verificationTokenExpiry: expiry,
      })
      .where(eq(users.id, userId));
  });
}

export async function verifyEmailToken(
  token: string,
  requestId: string = randomUUID()
) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const digest = createHash("sha256").update(token).digest("hex");
  return db.transaction(async tx => {
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.verificationToken, digest))
      .limit(1)
      .for("update");
    if (
      !user?.verificationTokenExpiry ||
      !user.email ||
      !user.verificationEmailDigest ||
      user.verificationEmailDigest !==
        createHash("sha256")
          .update(user.email.trim().toLowerCase())
          .digest("hex") ||
      user.deletionFencedAt !== null ||
      user.verificationTokenExpiry <= new Date()
    )
      return null;
    await tx
      .update(users)
      .set({
        emailVerified: 1,
        verificationToken: null,
        verificationEmailDigest: null,
        verificationTokenExpiry: null,
      })
      .where(eq(users.id, user.id));
    await tx.insert(auditEvents).values({
      userId: user.id,
      requestId,
      action: "auth.email_token_redeemed",
      entityType: "account",
      entityId: String(user.id),
      outcome: "success",
      metadata: {
        version: 2,
        method: "email_token_redemption",
        issuanceAddressBound: true,
        // Pseudonymous private audit material, not anonymized data. Never return
        // this digest in the account API, export or operator inspection output.
        emailDigest: user.email
          ? createHash("sha256")
              .update(user.email.trim().toLowerCase())
              .digest("hex")
          : null,
      },
    });
    return {
      ...user,
      emailVerified: 1,
      verificationToken: null,
      verificationEmailDigest: null,
      verificationTokenExpiry: null,
    };
  });
}

// ===== Saved Searches =====

export async function createSavedSearch(searchData: InsertSavedSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(savedSearches).values(searchData);
  const result = await db
    .select()
    .from(savedSearches)
    .orderBy(desc(savedSearches.id))
    .limit(1);
  return result[0];
}

export async function getUserSavedSearches(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

export async function getSavedSearchById(searchId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.id, searchId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSavedSearch(
  searchId: number,
  updates: Partial<InsertSavedSearch>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(savedSearches)
    .set(updates)
    .where(eq(savedSearches.id, searchId));

  const result = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.id, searchId))
    .limit(1);
  return result[0];
}

export async function deleteSavedSearch(searchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(savedSearches).where(eq(savedSearches.id, searchId));
}

export async function getActiveSavedSearches() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.isActive, 1));
}

// ===== Match Notifications for Saved Searches =====

export async function checkSavedSearchMatches(searchId: number) {
  const db = await getDb();
  if (!db) return [];

  const search = await getSavedSearchById(searchId);
  if (!search) return [];

  // Get all prospects
  const allProspects = await getAllProspects();

  // Filter prospects based on search criteria
  const matchingProspects = allProspects.filter(prospect => {
    // Check skills match
    if (search.skills && search.skills.length > 0) {
      const prospectSkills = prospect.skills || [];
      const hasSkillMatch = search.skills.some(skill =>
        prospectSkills.includes(skill)
      );
      if (!hasSkillMatch) return false;
    }

    // Check industries match
    if (search.industries && search.industries.length > 0) {
      const prospectIndustries = prospect.industries || [];
      const hasIndustryMatch = search.industries.some(industry =>
        prospectIndustries.includes(industry)
      );
      if (!hasIndustryMatch) return false;
    }

    // Check location match (case insensitive)
    if (search.location) {
      if (
        !prospect.location ||
        !prospect.location.toLowerCase().includes(search.location.toLowerCase())
      ) {
        return false;
      }
    }

    // Check experience match
    if (search.experience && prospect.experience !== search.experience) {
      return false;
    }

    // Check startup stage match
    if (search.startupStage && prospect.startupStage !== search.startupStage) {
      return false;
    }

    // Advanced filters (funding stage, team size, equity split) are preference indicators
    // They don't strictly filter out prospects but can be used by AI to rank matches
    // This allows for more flexible matching while still considering user preferences

    return true;
  });

  // Update match count
  await updateSavedSearch(searchId, { matchCount: matchingProspects.length });

  return matchingProspects;
}

export async function getNewMatchesForSearch(searchId: number, since: Date) {
  const db = await getDb();
  if (!db) return [];

  const search = await getSavedSearchById(searchId);
  if (!search) return [];

  // Get prospects added since the last check
  const allProspects = await getAllProspects();
  const newProspects = allProspects.filter(
    p => p.importedAt && p.importedAt > since
  );

  // Filter by search criteria
  const matchingProspects = newProspects.filter(prospect => {
    if (search.skills && search.skills.length > 0) {
      const prospectSkills = prospect.skills || [];
      const hasSkillMatch = search.skills.some(skill =>
        prospectSkills.includes(skill)
      );
      if (!hasSkillMatch) return false;
    }

    if (search.industries && search.industries.length > 0) {
      const prospectIndustries = prospect.industries || [];
      const hasIndustryMatch = search.industries.some(industry =>
        prospectIndustries.includes(industry)
      );
      if (!hasIndustryMatch) return false;
    }

    if (search.location) {
      if (
        !prospect.location ||
        !prospect.location.toLowerCase().includes(search.location.toLowerCase())
      ) {
        return false;
      }
    }

    // Advanced filters are preference indicators for AI ranking
    // They don't strictly filter prospects in the new matches check

    return true;
  });

  return matchingProspects;
}

/**
 * Enrichment Functions
 */

export async function updateProspectEnrichment(
  prospectId: number,
  enrichmentData: {
    enrichmentScore: number;
    linkedInData?: any;
    githubData?: any;
    companyData?: any;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(prospects)
    .set({
      enrichmentScore: enrichmentData.enrichmentScore,
      lastEnriched: new Date(),
      linkedInData: enrichmentData.linkedInData,
      githubData: enrichmentData.githubData,
      companyData: enrichmentData.companyData,
    })
    .where(eq(prospects.id, prospectId));
}

export async function getProspectsNeedingEnrichment(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  // Get prospects that haven't been enriched or were enriched more than 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await db
    .select()
    .from(prospects)
    .where(
      or(
        isNull(prospects.lastEnriched),
        lt(prospects.lastEnriched, thirtyDaysAgo)
      )
    )
    .limit(limit);
}

export async function getEnrichmentStats() {
  const db = await getDb();
  if (!db) return { total: 0, enriched: 0, highQuality: 0, enrichmentRate: 0 };

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects);

  const enriched = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(isNotNull(prospects.lastEnriched));

  const highQuality = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(gte(prospects.enrichmentScore, 70));

  return {
    total: total[0].count,
    enriched: enriched[0].count,
    highQuality: highQuality[0].count,
    enrichmentRate:
      total[0].count > 0 ? (enriched[0].count / total[0].count) * 100 : 0,
  };
}

// Platform Connections Functions
export async function saveLinkedInConnection(
  userId: number,
  linkedinId: string,
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const expiryDate = new Date(Date.now() + expiresIn * 1000);

  await db
    .update(users)
    .set({
      linkedinId,
      linkedinAccessToken: accessToken,
      linkedinRefreshToken: refreshToken || null,
      linkedinTokenExpiry: expiryDate,
      linkedinConnectedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function saveGitHubConnection(
  userId: number,
  githubId: string,
  accessToken: string,
  username: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({
      githubId,
      githubAccessToken: accessToken,
      githubUsername: username,
      githubConnectedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function disconnectLinkedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({
      linkedinId: null,
      linkedinAccessToken: null,
      linkedinRefreshToken: null,
      linkedinTokenExpiry: null,
      linkedinConnectedAt: null,
    })
    .where(eq(users.id, userId));
}

export async function disconnectGitHub(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({
      githubId: null,
      githubAccessToken: null,
      githubUsername: null,
      githubConnectedAt: null,
    })
    .where(eq(users.id, userId));
}

export async function getConnectedAccounts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db
    .select({
      linkedinId: users.linkedinId,
      linkedinConnectedAt: users.linkedinConnectedAt,
      githubId: users.githubId,
      githubUsername: users.githubUsername,
      githubConnectedAt: users.githubConnectedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  return user || null;
}

// Analytics Functions
export async function getEnrichmentStatistics(dateFilter?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get total prospects
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects);

  const totalProspects = totalResult?.count || 0;

  // Get enriched prospects
  const [enrichedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(sql`${prospects.enrichmentScore} > 0`);

  const enrichedProspects = enrichedResult?.count || 0;

  // Get average enrichment score
  const [avgResult] = await db
    .select({ avg: sql<number>`avg(${prospects.enrichmentScore})` })
    .from(prospects)
    .where(sql`${prospects.enrichmentScore} > 0`);

  const averageScore = avgResult?.avg || 0;

  // Get quality distribution
  const qualityDistribution = [
    { range: "0-25%", count: 0 },
    { range: "26-50%", count: 0 },
    { range: "51-75%", count: 0 },
    { range: "76-100%", count: 0 },
  ];

  const allProspects = await db
    .select({ enrichmentScore: prospects.enrichmentScore })
    .from(prospects);

  allProspects.forEach(p => {
    const score = p.enrichmentScore || 0;
    if (score === 0) return;
    if (score <= 25) qualityDistribution[0].count++;
    else if (score <= 50) qualityDistribution[1].count++;
    else if (score <= 75) qualityDistribution[2].count++;
    else qualityDistribution[3].count++;
  });

  // Get recent activity
  const recentActivity = await db
    .select({
      prospectName: prospects.name,
      platform: prospects.platform,
      score: prospects.enrichmentScore,
      enrichedAt: prospects.lastEnriched,
    })
    .from(prospects)
    .where(sql`${prospects.enrichmentScore} > 0`)
    .orderBy(desc(prospects.lastEnriched))
    .limit(10);

  return {
    totalProspects,
    enrichedProspects,
    averageScore,
    qualityDistribution,
    recentActivity: recentActivity.map(a => ({
      prospectName: a.prospectName || "Unknown",
      platform: a.platform || "Unknown",
      score: a.score || 0,
      enrichedAt: a.enrichedAt || new Date(),
    })),
  };
}

export async function getCampaignStatistics(dateFilter?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get total campaigns
  const [totalCampaigns] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaigns);

  // Get total matches
  const [totalMatches] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches);

  // Get prospects discovered (total prospects)
  const [prospectsDiscovered] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects);

  // Get messages sent
  const [messagesSent] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages);

  // Calculate response rate (messages with responses / total messages)
  const allMessages = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
    })
    .from(messages);

  const conversationsWithResponses = new Set<number>();
  allMessages.forEach(msg => {
    // Note: This logic assumes messages from prospects have different senderId than the user
    // This needs actual conversation context to determine sender type
    if (msg.conversationId) {
      conversationsWithResponses.add(msg.conversationId);
    }
  });

  const responseRate =
    messagesSent.count > 0
      ? (conversationsWithResponses.size / messagesSent.count) * 100
      : 0;

  return {
    totalCampaigns: totalCampaigns?.count || 0,
    totalMatches: totalMatches?.count || 0,
    prospectsDiscovered: prospectsDiscovered?.count || 0,
    messagesSent: messagesSent?.count || 0,
    responseRate,
  };
}

export async function getPlatformStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const platforms = ["CoFoundersLab", "FounderCloud", "Y Combinator"];
  const stats = [];

  for (const platform of platforms) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(eq(prospects.platform, platform));

    const [enrichedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(
        sql`${prospects.platform} = ${platform} AND ${prospects.enrichmentScore} > 0`
      );

    const [avgResult] = await db
      .select({ avg: sql<number>`avg(${prospects.enrichmentScore})` })
      .from(prospects)
      .where(
        sql`${prospects.platform} = ${platform} AND ${prospects.enrichmentScore} > 0`
      );

    stats.push({
      name: platform,
      count: countResult?.count || 0,
      enriched: enrichedResult?.count || 0,
      avgScore: avgResult?.avg || 0,
    });
  }

  return stats;
}

// ============================================
// Conversation Starters History Functions
// ============================================

type LegacyTransaction = Parameters<
  Parameters<NonNullable<Awaited<ReturnType<typeof getDb>>>["transaction"]>[0]
>[0];

function requireLegacyId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A valid owned record is required.",
    });
}

async function legacyOwnedWrite<T>(
  userId: number,
  work: (tx: LegacyTransaction) => Promise<T>
) {
  requireLegacyId(userId);
  try {
    const db = await getDb();
    if (!db) throw new Error("legacy_storage_unavailable");
    return await db.transaction(
      async tx => {
        const [owner] = await tx
          .select({
            id: users.id,
            emailVerified: users.emailVerified,
            deletionFencedAt: users.deletionFencedAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .for("update");
        if (!owner)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found.",
          });
        assertVerifiedWorkspaceWorkAllowed(owner);
        return work(tx);
      },
      { isolationLevel: "read committed" }
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Legacy history storage is temporarily unavailable.",
    });
  }
}

async function requireLegacyReference(
  tx: LegacyTransaction,
  userId: number,
  table: typeof prospects | typeof campaigns,
  id: number
) {
  requireLegacyId(id);
  const [owned] = await tx
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .limit(1)
    .for("update");
  if (!owned)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Referenced record not found in this account.",
    });
}

export async function saveConversationStarter(data: {
  userId: number;
  prospectId: number;
  message: string;
  tone: string;
  focusArea: string;
  reasoning?: string;
  compatibilityScore?: number;
  enrichmentScore?: number;
}) {
  return legacyOwnedWrite(data.userId, async tx => {
    await requireLegacyReference(tx, data.userId, prospects, data.prospectId);
    const [result] = await tx.insert(conversationStartersHistory).values(data);
    return result.insertId;
  });
}

async function markOwnedStarter(
  starterId: number,
  userId: number,
  kind: "copied" | "used"
) {
  requireLegacyId(starterId);
  return legacyOwnedWrite(userId, async tx => {
    const owned = and(
      eq(conversationStartersHistory.id, starterId),
      eq(conversationStartersHistory.userId, userId)
    );
    const [starter] = await tx
      .select()
      .from(conversationStartersHistory)
      .where(owned)
      .limit(1)
      .for("update");
    if (!starter)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Starter not found in this account.",
      });
    await requireLegacyReference(tx, userId, prospects, starter.prospectId);
    if (kind === "copied" ? starter.wasCopied : starter.wasUsed) return;
    await tx
      .update(conversationStartersHistory)
      .set(
        kind === "copied"
          ? { wasCopied: 1, copiedAt: new Date() }
          : { wasUsed: 1, usedAt: new Date() }
      )
      .where(owned);
  });
}

export async function markStarterAsCopied(starterId: number, userId: number) {
  return markOwnedStarter(starterId, userId, "copied");
}

export async function markStarterAsUsed(starterId: number, userId: number) {
  return markOwnedStarter(starterId, userId, "used");
}

export async function getConversationStartersHistory(
  userId: number,
  limit = 50
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(conversationStartersHistory)
    .where(eq(conversationStartersHistory.userId, userId))
    .orderBy(desc(conversationStartersHistory.generatedAt))
    .limit(limit);
}

export async function getStarterEffectivenessStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const starters = await db
    .select()
    .from(conversationStartersHistory)
    .where(eq(conversationStartersHistory.userId, userId));

  const total = starters.length;
  const copied = starters.filter(s => s.wasCopied).length;
  const used = starters.filter(s => s.wasUsed).length;

  // Group by tone
  const byTone = starters.reduce(
    (acc, s) => {
      if (!acc[s.tone]) {
        acc[s.tone] = { total: 0, copied: 0, used: 0 };
      }
      acc[s.tone].total++;
      if (s.wasCopied) acc[s.tone].copied++;
      if (s.wasUsed) acc[s.tone].used++;
      return acc;
    },
    {} as Record<string, { total: number; copied: number; used: number }>
  );

  // Group by focus area
  const byFocusArea = starters.reduce(
    (acc, s) => {
      if (!acc[s.focusArea]) {
        acc[s.focusArea] = { total: 0, copied: 0, used: 0 };
      }
      acc[s.focusArea].total++;
      if (s.wasCopied) acc[s.focusArea].copied++;
      if (s.wasUsed) acc[s.focusArea].used++;
      return acc;
    },
    {} as Record<string, { total: number; copied: number; used: number }>
  );

  return {
    total,
    copied,
    used,
    copyRate: total > 0 ? (copied / total) * 100 : 0,
    useRate: total > 0 ? (used / total) * 100 : 0,
    byTone,
    byFocusArea,
  };
}

// ============================================
// Success Metrics Functions
// ============================================

export async function recordSuccessMetric(data: {
  userId: number;
  prospectId?: number;
  campaignId?: number;
  metricType:
    | "message_sent"
    | "message_responded"
    | "meeting_scheduled"
    | "meeting_completed"
    | "partnership_formed"
    | "partnership_failed";
  notes?: string;
  value?: number;
}) {
  return legacyOwnedWrite(data.userId, async tx => {
    if (data.prospectId !== undefined)
      await requireLegacyReference(tx, data.userId, prospects, data.prospectId);
    if (data.campaignId !== undefined)
      await requireLegacyReference(tx, data.userId, campaigns, data.campaignId);
    const [result] = await tx.insert(successMetrics).values(data);
    return result.insertId;
  });
}

export async function getSuccessMetrics(
  userId: number,
  options?: {
    startDate?: Date;
    endDate?: Date;
    metricType?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(successMetrics.userId, userId)];

  if (options?.startDate) {
    conditions.push(gte(successMetrics.recordedAt, options.startDate));
  }

  if (options?.endDate) {
    conditions.push(lte(successMetrics.recordedAt, options.endDate));
  }

  if (options?.metricType) {
    conditions.push(eq(successMetrics.metricType, options.metricType as any));
  }

  return db
    .select()
    .from(successMetrics)
    .where(and(...conditions))
    .orderBy(desc(successMetrics.recordedAt));
}

export async function getSuccessMetricsStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const metrics = await db
    .select()
    .from(successMetrics)
    .where(eq(successMetrics.userId, userId));

  const messagesSent = metrics.filter(
    m => m.metricType === "message_sent"
  ).length;
  const messagesResponded = metrics.filter(
    m => m.metricType === "message_responded"
  ).length;
  const meetingsScheduled = metrics.filter(
    m => m.metricType === "meeting_scheduled"
  ).length;
  const meetingsCompleted = metrics.filter(
    m => m.metricType === "meeting_completed"
  ).length;
  const partnershipsFormed = metrics.filter(
    m => m.metricType === "partnership_formed"
  ).length;
  const partnershipsFailed = metrics.filter(
    m => m.metricType === "partnership_failed"
  ).length;

  const responseRate =
    messagesSent > 0 ? (messagesResponded / messagesSent) * 100 : 0;
  const meetingConversionRate =
    messagesResponded > 0 ? (meetingsScheduled / messagesResponded) * 100 : 0;
  const partnershipSuccessRate =
    partnershipsFormed + partnershipsFailed > 0
      ? (partnershipsFormed / (partnershipsFormed + partnershipsFailed)) * 100
      : 0;

  return {
    messagesSent,
    messagesResponded,
    meetingsScheduled,
    meetingsCompleted,
    partnershipsFormed,
    partnershipsFailed,
    responseRate,
    meetingConversionRate,
    partnershipSuccessRate,
  };
}

/**
 * Notification Preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  preferences: {
    emailNotificationsEnabled?: boolean;
    notifyNewMatches?: boolean;
    notifyMessages?: boolean;
    weeklySummaryEnabled?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(users)
    .set({
      emailNotificationsEnabled:
        preferences.emailNotificationsEnabled !== undefined
          ? preferences.emailNotificationsEnabled
            ? 1
            : 0
          : undefined,
      notifyNewMatches:
        preferences.notifyNewMatches !== undefined
          ? preferences.notifyNewMatches
            ? 1
            : 0
          : undefined,
      notifyMessages:
        preferences.notifyMessages !== undefined
          ? preferences.notifyMessages
            ? 1
            : 0
          : undefined,
      weeklySummaryEnabled:
        preferences.weeklySummaryEnabled !== undefined
          ? preferences.weeklySummaryEnabled
            ? 1
            : 0
          : undefined,
    })
    .where(eq(users.id, userId));
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [user] = await db
    .select({
      emailNotificationsEnabled: users.emailNotificationsEnabled,
      notifyNewMatches: users.notifyNewMatches,
      notifyMessages: users.notifyMessages,
      weeklySummaryEnabled: users.weeklySummaryEnabled,
    })
    .from(users)
    .where(eq(users.id, userId));

  return user
    ? {
        emailNotificationsEnabled: user.emailNotificationsEnabled === 1,
        notifyNewMatches: user.notifyNewMatches === 1,
        notifyMessages: user.notifyMessages === 1,
        weeklySummaryEnabled: user.weeklySummaryEnabled === 1,
      }
    : null;
}

/**
 * Update user profile with imported data
 */
export async function updateUserProfile(
  userId: number,
  profileData: Partial<InsertUserProfile>
) {
  return createOrUpdateProfile(userId, profileData);
}

// ============================================================================
// Timeline Functions
// ============================================================================

export async function createTimelineEvent(data: {
  userId: number;
  prospectId: number;
  type: string;
  title: string;
  description?: string;
  metadata?: string;
  messageId?: number;
  campaignId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(timelineEvents).values(data as any);
  return result.insertId;
}

export async function getTimelineForProspect(
  prospectId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(timelineEvents)
    .where(
      and(
        eq(timelineEvents.prospectId, prospectId),
        eq(timelineEvents.userId, userId)
      )
    )
    .orderBy(desc(timelineEvents.createdAt));
}

export async function getTimelineForUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.userId, userId))
    .orderBy(desc(timelineEvents.createdAt))
    .limit(limit);
}
import { appendWorkspaceAudit, isWorkspaceAuditAction } from "./capacity";
