/**
 * Automatic Follow-up System
 * Sends follow-up messages after 7 days of no response
 */

import { getDb } from "./db";
import { messages, prospects, users } from "../drizzle/schema";
import { eq, and, lt, isNull, sql } from "drizzle-orm";
import { generatePersonalizedMessage } from "./messaging-engine";

interface PendingFollowUp {
  messageId: number;
  userId: number;
  prospectId: number;
  prospectName: string;
  originalMessage: string;
  sentAt: Date;
}

/**
 * Find messages that need follow-ups
 * (sent 7+ days ago, no response, no follow-up sent yet)
 */
export async function findPendingFollowUps(): Promise<PendingFollowUp[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingMessages = await db
    .select({
      messageId: messages.id,
      userId: messages.userId,
      prospectId: messages.prospectId,
      prospectName: prospects.name,
      originalMessage: messages.content,
      sentAt: messages.sentAt,
    })
    .from(messages)
    .innerJoin(prospects, eq(messages.prospectId, prospects.id))
    .where(
      and(
        eq(messages.status, "sent"),
        lt(messages.sentAt, sevenDaysAgo),
        isNull(messages.respondedAt),
        eq(messages.isFollowUp, 0)
      )
    );

  // Check if follow-up already exists for each message
  const result: PendingFollowUp[] = [];

  for (const msg of pendingMessages) {
    const existingFollowUp = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, msg.userId),
          eq(messages.prospectId, msg.prospectId),
          eq(messages.isFollowUp, 1),
          eq(messages.parentMessageId, msg.messageId)
        )
      )
      .limit(1);

    if (existingFollowUp.length === 0) {
      result.push({
        messageId: msg.messageId,
        userId: msg.userId,
        prospectId: msg.prospectId,
        prospectName: msg.prospectName || "Unknown",
        originalMessage: msg.originalMessage,
        sentAt: msg.sentAt,
      });
    }
  }

  return result;
}

/**
 * Generate follow-up message using AI
 */
async function generateFollowUpMessage(params: {
  prospectName: string;
  originalMessage: string;
}): Promise<string> {
  const { prospectName, originalMessage } = params;

  // Use the messaging engine to generate a contextual follow-up
  const followUpMessage = await generatePersonalizedMessage({
    prospectName,
    userProfile: {
      skills: [],
      industries: [],
      experience: "mid",
    },
    prospectProfile: {
      skills: [],
      industries: [],
      bio: "",
    },
    compatibilityScore: 0,
    messageType: "follow_up",
    context: `Original message: "${originalMessage}"`,
  });

  return followUpMessage.message;
}

/**
 * Send a follow-up message
 */
export async function sendFollowUpMessage(params: {
  userId: number;
  prospectId: number;
  prospectName: string;
  originalMessageId: number;
  originalMessage: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const {
    userId,
    prospectId,
    prospectName,
    originalMessageId,
    originalMessage,
  } = params;

  // Generate follow-up message
  const followUpContent = await generateFollowUpMessage({
    prospectName,
    originalMessage,
  });

  // Save follow-up message to database
  const [result] = await db.insert(messages).values({
    userId,
    prospectId,
    senderId: userId,
    recipientId: prospectId,
    content: followUpContent,
    body: followUpContent,
    status: "sent",
    sentAt: new Date(),
    isFollowUp: 1,
    parentMessageId: originalMessageId,
  });

  console.log(
    `[FOLLOW-UP] Sent follow-up message to ${prospectName} (prospect ${prospectId})`
  );

  return result.insertId;
}

/**
 * Process all pending follow-ups
 * Called by the campaign scheduler
 */
export async function processFollowUps(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log("[FOLLOW-UP] Starting follow-up processing...");

  const pendingFollowUps = await findPendingFollowUps();
  console.log(
    `[FOLLOW-UP] Found ${pendingFollowUps.length} messages needing follow-up`
  );

  let sent = 0;
  let failed = 0;

  for (const followUp of pendingFollowUps) {
    try {
      await sendFollowUpMessage({
        userId: followUp.userId,
        prospectId: followUp.prospectId,
        prospectName: followUp.prospectName,
        originalMessageId: followUp.messageId,
        originalMessage: followUp.originalMessage,
      });
      sent++;
    } catch (error) {
      console.error(
        `[FOLLOW-UP] Failed to send follow-up for message ${followUp.messageId}:`,
        error
      );
      failed++;
    }
  }

  console.log(`[FOLLOW-UP] Completed: ${sent} sent, ${failed} failed`);

  return {
    processed: pendingFollowUps.length,
    sent,
    failed,
  };
}

/**
 * Get follow-up statistics for a user
 */
export async function getFollowUpStats(userId: number): Promise<{
  totalFollowUpsSent: number;
  followUpsWithResponse: number;
  responseRate: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const followUpMessages = await db
    .select({
      id: messages.id,
      respondedAt: messages.respondedAt,
    })
    .from(messages)
    .where(and(eq(messages.userId, userId), eq(messages.isFollowUp, 1)));

  const totalFollowUpsSent = followUpMessages.length;
  const followUpsWithResponse = followUpMessages.filter(
    m => m.respondedAt !== null
  ).length;
  const responseRate =
    totalFollowUpsSent > 0
      ? Math.round((followUpsWithResponse / totalFollowUpsSent) * 100)
      : 0;

  return {
    totalFollowUpsSent,
    followUpsWithResponse,
    responseRate,
  };
}
