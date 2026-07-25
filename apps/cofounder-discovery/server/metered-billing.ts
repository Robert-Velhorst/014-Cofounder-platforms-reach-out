/**
 * Metered Billing System
 * Tracks resource usage and calculates costs with 2.5x markup
 */

import { getDb } from "./db";
import {
  resourceUsage,
  usagePricing,
  billingPeriods,
  invoices,
  type InsertResourceUsage,
  type InsertUsagePricing,
} from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const getDbInstance = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
};

export type ResourceType =
  | "llm_api_call"
  | "enrichment_linkedin"
  | "enrichment_github"
  | "enrichment_company"
  | "platform_scraping"
  | "conversation_starter_generation"
  | "semantic_matching"
  | "image_generation"
  | "voice_transcription";

export interface UsageContext {
  relatedEntityType?: string;
  relatedEntityId?: number;
  metadata?: Record<string, any>;
}

/**
 * Track resource usage with automatic cost calculation
 */
export async function trackUsage(
  userId: number,
  resourceType: ResourceType,
  quantity: number = 1,
  tokenCount?: number,
  context?: UsageContext
): Promise<void> {
  const db = await getDbInstance();

  // Get pricing for this resource type
  const pricing = await db
    .select()
    .from(usagePricing)
    .where(
      and(
        eq(usagePricing.resourceType, resourceType),
        eq(usagePricing.isActive, 1)
      )
    )
    .limit(1);

  if (pricing.length === 0) {
    console.warn(
      `[Billing] No pricing found for resource type: ${resourceType}`
    );
    return;
  }

  const { baseCostPerUnit, markup } = pricing[0];

  // Calculate costs (in cents)
  const baseCost = baseCostPerUnit * quantity;
  const markedUpCost = Math.round(baseCost * markup);

  // Log usage
  await db.insert(resourceUsage).values({
    userId,
    resourceType,
    quantity,
    tokenCount: tokenCount || null,
    baseCost,
    markedUpCost,
    relatedEntityType: context?.relatedEntityType || null,
    relatedEntityId: context?.relatedEntityId || null,
    metadata: context?.metadata ? JSON.stringify(context.metadata) : null,
  });

  // Update current billing period
  await updateBillingPeriod(userId, baseCost, markedUpCost);
}

/**
 * Initialize default pricing for all resource types
 */
export async function initializePricing(): Promise<void> {
  const db = await getDbInstance();

  const defaultPricing: Array<Omit<InsertUsagePricing, "id" | "updatedAt">> = [
    {
      resourceType: "llm_api_call",
      baseCostPerUnit: 10, // $0.10 per 1000 tokens (10 cents)
      markup: 2.5,
      unitName: "1k tokens",
      description: "LLM API calls for matching, conversation generation, etc.",
      isActive: 1,
    },
    {
      resourceType: "enrichment_linkedin",
      baseCostPerUnit: 50, // $0.50 per profile
      markup: 2.5,
      unitName: "profile",
      description: "LinkedIn profile enrichment",
      isActive: 1,
    },
    {
      resourceType: "enrichment_github",
      baseCostPerUnit: 30, // $0.30 per profile
      markup: 2.5,
      unitName: "profile",
      description: "GitHub profile enrichment",
      isActive: 1,
    },
    {
      resourceType: "enrichment_company",
      baseCostPerUnit: 40, // $0.40 per company
      markup: 2.5,
      unitName: "company",
      description: "Company data enrichment",
      isActive: 1,
    },
    {
      resourceType: "platform_scraping",
      baseCostPerUnit: 20, // $0.20 per scrape
      markup: 2.5,
      unitName: "scrape",
      description: "Platform scraping (CoFoundersLab, Y Combinator, etc.)",
      isActive: 1,
    },
    {
      resourceType: "conversation_starter_generation",
      baseCostPerUnit: 15, // $0.15 per generation
      markup: 2.5,
      unitName: "generation",
      description: "AI-generated conversation starters",
      isActive: 1,
    },
    {
      resourceType: "semantic_matching",
      baseCostPerUnit: 5, // $0.05 per match
      markup: 2.5,
      unitName: "match",
      description: "Semantic skill matching and compatibility scoring",
      isActive: 1,
    },
    {
      resourceType: "image_generation",
      baseCostPerUnit: 100, // $1.00 per image
      markup: 2.5,
      unitName: "image",
      description: "AI image generation",
      isActive: 1,
    },
    {
      resourceType: "voice_transcription",
      baseCostPerUnit: 25, // $0.25 per minute
      markup: 2.5,
      unitName: "minute",
      description: "Voice transcription service",
      isActive: 1,
    },
  ];

  for (const pricing of defaultPricing) {
    // Check if exists
    const existing = await db
      .select()
      .from(usagePricing)
      .where(eq(usagePricing.resourceType, pricing.resourceType))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(usagePricing).values(pricing);
    }
  }
}

/**
 * Get or create current billing period for user
 */
async function getCurrentBillingPeriod(userId: number) {
  const db = await getDbInstance();
  const now = new Date();

  // Get first day of current month
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get first day of next month
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Check if period exists
  const existing = await db
    .select()
    .from(billingPeriods)
    .where(
      and(
        eq(billingPeriods.userId, userId),
        eq(billingPeriods.startDate, startDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new period
  const result = await db.insert(billingPeriods).values({
    userId,
    startDate,
    endDate,
    totalBaseCost: 0,
    totalMarkedUpCost: 0,
    totalUsageCount: 0,
    status: "active",
  });

  // Fetch the newly created period
  const [newPeriod] = await db
    .select()
    .from(billingPeriods)
    .where(
      and(
        eq(billingPeriods.userId, userId),
        eq(billingPeriods.startDate, startDate)
      )
    )
    .limit(1);

  return newPeriod;
}

/**
 * Update billing period totals
 */
async function updateBillingPeriod(
  userId: number,
  baseCost: number,
  markedUpCost: number
): Promise<void> {
  const db = await getDbInstance();
  const period = await getCurrentBillingPeriod(userId);

  await db
    .update(billingPeriods)
    .set({
      totalBaseCost: sql`${billingPeriods.totalBaseCost} + ${baseCost}`,
      totalMarkedUpCost: sql`${billingPeriods.totalMarkedUpCost} + ${markedUpCost}`,
      totalUsageCount: sql`${billingPeriods.totalUsageCount} + 1`,
    })
    .where(eq(billingPeriods.id, period.id));
}

/**
 * Get usage summary for a user in current billing period
 */
export async function getCurrentUsageSummary(userId: number) {
  const db = await getDbInstance();
  const period = await getCurrentBillingPeriod(userId);

  // Get usage breakdown by resource type
  const usageByType = await db
    .select({
      resourceType: resourceUsage.resourceType,
      count: sql<number>`COUNT(*)`,
      totalBaseCost: sql<number>`SUM(${resourceUsage.baseCost})`,
      totalMarkedUpCost: sql<number>`SUM(${resourceUsage.markedUpCost})`,
    })
    .from(resourceUsage)
    .where(
      and(
        eq(resourceUsage.userId, userId),
        gte(resourceUsage.createdAt, period.startDate),
        lte(resourceUsage.createdAt, period.endDate)
      )
    )
    .groupBy(resourceUsage.resourceType);

  return {
    period: {
      startDate: period.startDate,
      endDate: period.endDate,
      totalBaseCost: period.totalBaseCost,
      totalMarkedUpCost: period.totalMarkedUpCost,
      totalUsageCount: period.totalUsageCount,
    },
    breakdown: usageByType.map(item => ({
      resourceType: item.resourceType,
      count: Number(item.count),
      totalBaseCost: Number(item.totalBaseCost),
      totalMarkedUpCost: Number(item.totalMarkedUpCost),
    })),
  };
}

/**
 * Get usage history for a user
 */
export async function getUsageHistory(
  userId: number,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
) {
  const db = await getDbInstance();

  const conditions = [eq(resourceUsage.userId, userId)];

  if (startDate) {
    conditions.push(gte(resourceUsage.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(resourceUsage.createdAt, endDate));
  }

  const usage = await db
    .select()
    .from(resourceUsage)
    .where(and(...conditions))
    .orderBy(sql`${resourceUsage.createdAt} DESC`)
    .limit(limit);

  return usage;
}

/**
 * Generate invoice for a billing period
 */
export async function generateInvoice(userId: number, billingPeriodId: number) {
  const db = await getDbInstance();

  // Get billing period
  const [period] = await db
    .select()
    .from(billingPeriods)
    .where(eq(billingPeriods.id, billingPeriodId))
    .limit(1);

  if (!period) {
    throw new Error("Billing period not found");
  }

  // Get usage breakdown
  const usageByType = await db
    .select({
      resourceType: resourceUsage.resourceType,
      count: sql<number>`COUNT(*)`,
      totalMarkedUpCost: sql<number>`SUM(${resourceUsage.markedUpCost})`,
    })
    .from(resourceUsage)
    .where(
      and(
        eq(resourceUsage.userId, userId),
        gte(resourceUsage.createdAt, period.startDate),
        lte(resourceUsage.createdAt, period.endDate)
      )
    )
    .groupBy(resourceUsage.resourceType);

  // Build line items
  const lineItems = usageByType.map(item => ({
    resourceType: item.resourceType,
    quantity: Number(item.count),
    unitCost: Math.round(Number(item.totalMarkedUpCost) / Number(item.count)),
    total: Number(item.totalMarkedUpCost),
  }));

  // Calculate totals
  const subtotal = period.totalMarkedUpCost;
  const tax = 0; // TODO: Calculate tax based on user location
  const total = subtotal + tax;

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}-${userId}`;

  // Create invoice
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

  await db.insert(invoices).values({
    userId,
    billingPeriodId,
    invoiceNumber,
    subtotal,
    tax,
    total,
    status: "draft",
    issueDate,
    dueDate,
    paidAt: null,
    lineItems: JSON.stringify(lineItems),
  });

  // Mark billing period as invoiced
  await db
    .update(billingPeriods)
    .set({ status: "invoiced" })
    .where(eq(billingPeriods.id, billingPeriodId));

  return {
    invoiceNumber,
    subtotal,
    tax,
    total,
    lineItems,
  };
}

/**
 * Format cents to dollar string
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get pricing for a resource type
 */
export async function getResourcePricing(resourceType: ResourceType) {
  const db = await getDbInstance();

  const [pricing] = await db
    .select()
    .from(usagePricing)
    .where(eq(usagePricing.resourceType, resourceType))
    .limit(1);

  return pricing;
}

/**
 * Get all active pricing
 */
export async function getAllPricing() {
  const db = await getDbInstance();

  return db.select().from(usagePricing).where(eq(usagePricing.isActive, 1));
}
