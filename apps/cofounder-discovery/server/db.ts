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
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function createLocalUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values(user);
  return getUserByOpenId(user.openId);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== User Profile Management =====

export async function createOrUpdateProfile(
  userId: number,
  profileData: Partial<InsertUserProfile>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set(profileData)
      .where(eq(userProfiles.userId, userId));
    const updated = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return updated[0];
  } else {
    await db.insert(userProfiles).values({ userId, ...profileData });
    const newProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return newProfile[0];
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Prospects Management =====

export async function createProspect(prospectData: InsertProspect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!prospectData.userId) throw new Error("Prospect owner is required");

  await db.insert(prospects).values(prospectData);
  const allProspects = await db
    .select()
    .from(prospects)
    .where(eq(prospects.userId, prospectData.userId))
    .orderBy(desc(prospects.id))
    .limit(1);
  return allProspects[0];
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
    .where(and(eq(prospects.id, id), eq(prospects.userId, userId), isNull(prospects.archivedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== Matches Management =====

export async function createMatch(matchData: InsertMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(matches).values(matchData);
  const allMatches = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.id))
    .limit(1);
  return allMatches[0];
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

export async function getConversationMessages(conversationId: number, userId?: number) {
  const db = await getDb();
  if (!db || !userId) return [];

  // Find messages by matching conversation's matchId
  const conv = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);
  if (conv.length === 0) return [];

  const result = await db
    .select()
    .from(messages)
    .where(and(eq(messages.userId, userId), eq(messages.conversationId, conversationId)))
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
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
}

// ===== Production-safe assisted outreach =====

export async function findOutreachByIdempotency(userId: number, key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(outreachRecords)
    .where(and(eq(outreachRecords.userId, userId), eq(outreachRecords.idempotencyKey, key)))
    .limit(1);
  return result[0] ?? null;
}

export async function createOutreachRecord(record: InsertOutreachRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(outreachRecords).values(record);
  return findOutreachByIdempotency(record.userId, record.idempotencyKey);
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
    .select({ outreach: outreachRecords, prospect: prospects })
    .from(outreachRecords)
    .innerJoin(prospects, eq(outreachRecords.prospectId, prospects.id))
    .where(and(eq(outreachRecords.userId, userId), eq(prospects.userId, userId)))
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

export async function createAuditEvent(event: InsertAuditEvent) {
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

export async function createIdempotencyRecord(record: InsertIdempotencyRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(idempotencyRecords).values(record).onDuplicateKeyUpdate({
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

  await db
    .update(users)
    .set({
      verificationToken: token,
      verificationTokenExpiry: expiry,
    })
    .where(eq(users.id, userId));
}

export async function verifyEmailToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  if (result.length === 0) return null;

  const user = result[0];

  // Check if token is expired
  if (
    user.verificationTokenExpiry &&
    user.verificationTokenExpiry < new Date()
  ) {
    return null;
  }

  // Mark email as verified
  await db
    .update(users)
    .set({
      emailVerified: 1,
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(users.id, user.id));

  return user;
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(conversationStartersHistory).values(data);
  return result.insertId;
}

export async function markStarterAsCopied(starterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(conversationStartersHistory)
    .set({ wasCopied: 1, copiedAt: new Date() })
    .where(eq(conversationStartersHistory.id, starterId));
}

export async function markStarterAsUsed(starterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(conversationStartersHistory)
    .set({ wasUsed: 1, usedAt: new Date() })
    .where(eq(conversationStartersHistory.id, starterId));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(successMetrics).values(data);
  return result.insertId;
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if profile exists
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing profile
    await db
      .update(userProfiles)
      .set(profileData)
      .where(eq(userProfiles.userId, userId));
  } else {
    // Create new profile
    await db.insert(userProfiles).values({
      ...profileData,
      userId,
    } as InsertUserProfile);
  }
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
