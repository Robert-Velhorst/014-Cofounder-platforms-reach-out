/**
 * AI Guardrails and Approval Workflows
 * Control what the AI can do autonomously vs what requires human approval
 */

import { getDb } from "./db";
import { guardrails, approvalQueue } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface Guardrail {
  id: number;
  userId: number;
  ruleType:
    | "rate_limit"
    | "approval_required"
    | "forbidden_action"
    | "content_filter";
  config: Record<string, any>;
  enabled: boolean;
}

export interface ApprovalRequest {
  id: number;
  userId: number;
  matchId: number;
  messageType: "first_contact" | "follow_up" | "meeting_request";
  messageContent: string;
  platform: string;
  aiReasoning: string | null;
  status: "pending" | "approved" | "rejected" | "sent";
  reviewedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
}

/**
 * Default guardrails for new users
 */
export const DEFAULT_GUARDRAILS = [
  {
    ruleType: "rate_limit" as const,
    config: {
      maxMessagesPerDay: 20,
      maxMessagesPerHour: 5,
      maxNewConnectionsPerDay: 10,
    },
    enabled: true,
  },
  {
    ruleType: "approval_required" as const,
    config: {
      requireApprovalFor: ["schedule_meeting", "share_profile"],
      autoApproveAfterDays: 30, // Auto-approve after 30 days of good behavior
    },
    enabled: true,
  },
  {
    ruleType: "content_filter" as const,
    config: {
      forbiddenWords: ["spam", "scam", "guaranteed", "urgent"],
      requireProfessionalTone: true,
      maxMessageLength: 500,
    },
    enabled: true,
  },
];

/**
 * Check if an action is allowed by guardrails
 */
export async function checkGuardrails(
  userId: number,
  actionType: string,
  actionData: Record<string, any>
): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user's active guardrails
  const userGuardrails = await db
    .select()
    .from(guardrails)
    .where(and(eq(guardrails.userId, userId), eq(guardrails.isActive, true)));

  // Check rate limits
  for (const guardrail of userGuardrails) {
    if (guardrail.ruleType === "rate_limit") {
      const config = JSON.parse(guardrail.ruleConfig) as any;

      if (actionType === "send_message") {
        // Check daily and hourly limits
        const now = new Date();
        const dayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const hourStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours()
        );

        // TODO: Query actual message counts from database
        // For now, assume limits are not exceeded
        const messagesThisDay = 0;
        const messagesThisHour = 0;

        if (messagesThisDay >= config.maxMessagesPerDay) {
          return {
            allowed: false,
            reason: `Daily message limit reached (${config.maxMessagesPerDay} messages)`,
          };
        }

        if (messagesThisHour >= config.maxMessagesPerHour) {
          return {
            allowed: false,
            reason: `Hourly message limit reached (${config.maxMessagesPerHour} messages)`,
          };
        }
      }
    }

    // Check if approval is required
    if (guardrail.ruleType === "approval_required") {
      const config = JSON.parse(guardrail.ruleConfig) as any;

      if (config.requireApprovalFor?.includes(actionType)) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: `This action requires your approval`,
        };
      }
    }

    // Check content filters
    if (
      guardrail.ruleType === "content_filter" &&
      actionType === "send_message"
    ) {
      const config = JSON.parse(guardrail.ruleConfig) as any;
      const messageContent = actionData.content?.toLowerCase() || "";

      // Check forbidden words
      for (const word of config.forbiddenWords || []) {
        if (messageContent.includes(word.toLowerCase())) {
          return {
            allowed: false,
            reason: `Message contains forbidden word: "${word}"`,
          };
        }
      }

      // Check message length
      if (
        config.maxMessageLength &&
        messageContent.length > config.maxMessageLength
      ) {
        return {
          allowed: false,
          reason: `Message exceeds maximum length (${config.maxMessageLength} characters)`,
        };
      }
    }

    // Check forbidden actions
    if (guardrail.ruleType === "forbidden_action") {
      const config = JSON.parse(guardrail.ruleConfig) as any;

      if (config.forbiddenActions?.includes(actionType)) {
        return {
          allowed: false,
          reason: `This action is forbidden by your guardrails`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Create an approval request for an action
 */
export async function createApprovalRequest(
  userId: number,
  actionType: string,
  actionData: Record<string, any>,
  reason?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(approvalQueue).values({
    userId,
    matchId: actionData.matchId || 0,
    messageType: actionType as any,
    messageContent: actionData.content || "",
    platform: actionData.platform || "unknown",
    aiReasoning: reason || null,
    status: "pending",
    createdAt: new Date(),
  });

  // Return a placeholder ID (in production, you'd get this from the result)
  return 1;
}

/**
 * Get pending approval requests for a user
 */
export async function getPendingApprovals(
  userId: number
): Promise<ApprovalRequest[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(approvalQueue)
    .where(
      and(eq(approvalQueue.userId, userId), eq(approvalQueue.status, "pending"))
    )
    .orderBy(approvalQueue.createdAt);
}

/**
 * Approve or reject an approval request
 */
export async function processApproval(
  approvalId: number,
  status: "approved" | "rejected",
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(approvalQueue)
    .set({
      status,
      reviewedAt: new Date(),
    })
    .where(
      and(eq(approvalQueue.id, approvalId), eq(approvalQueue.userId, userId))
    );
}

/**
 * Initialize default guardrails for a new user
 */
export async function initializeDefaultGuardrails(
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const guardrail of DEFAULT_GUARDRAILS) {
    await db.insert(guardrails).values({
      userId,
      ruleType: guardrail.ruleType,
      ruleName: `Default ${guardrail.ruleType}`,
      ruleConfig: JSON.stringify(guardrail.config),
      isActive: guardrail.enabled,
      createdAt: new Date(),
    });
  }
}

/**
 * Update a guardrail
 */
export async function updateGuardrail(
  guardrailId: number,
  userId: number,
  updates: Partial<{ config: Record<string, any>; enabled: boolean }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { updatedAt: new Date() };
  if (updates.config) {
    updateData.ruleConfig = JSON.stringify(updates.config);
  }
  if (updates.enabled !== undefined) {
    updateData.isActive = updates.enabled;
  }

  await db
    .update(guardrails)
    .set(updateData)
    .where(and(eq(guardrails.id, guardrailId), eq(guardrails.userId, userId)));
}
