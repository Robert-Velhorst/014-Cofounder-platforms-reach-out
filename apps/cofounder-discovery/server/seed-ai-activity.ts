/**
 * Seed AI Activity Log Data
 * Creates realistic AI activity entries for demo purposes
 */

import { getDb } from "./db";
import { aiActivityLog, users, campaigns, matches } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedAIActivity() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("🌱 Seeding AI activity log data...");

  // Get first user
  const allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    console.error("No users found. Please run main seed script first.");
    return;
  }
  const userId = allUsers[0].id;

  // Get campaigns and matches for realistic references
  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, userId))
    .limit(3);
  const userMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, userId))
    .limit(5);

  // Activity types and descriptions
  const activities = [
    {
      activityType: "prospect_discovered",
      activityDescription:
        "Discovered new prospect: Sarah Chen, ML Engineer looking for technical co-founder",
      campaignId: userCampaigns[0]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "High skill match (92%), complementary experience",
        confidence: 0.92,
      }),
      outcome: "success",
      hoursAgo: 2,
    },
    {
      activityType: "match_created",
      activityDescription:
        "Created match with Alex Rodriguez (88% compatibility)",
      campaignId: userCampaigns[0]?.id || null,
      matchId: userMatches[0]?.id || null,
      aiDecision: JSON.stringify({
        reason: "Strong industry alignment, similar startup stage",
        confidence: 0.88,
      }),
      outcome: "success",
      hoursAgo: 3,
    },
    {
      activityType: "message_sent",
      activityDescription: "Sent personalized outreach message to Jessica Park",
      campaignId: userCampaigns[1]?.id || null,
      matchId: userMatches[1]?.id || null,
      aiDecision: JSON.stringify({
        reason: "Optimal timing based on response patterns",
        messageType: "initial_outreach",
        tone: "professional_friendly",
      }),
      outcome: "success",
      hoursAgo: 5,
    },
    {
      activityType: "follow_up_scheduled",
      activityDescription:
        "Scheduled follow-up with Michael Brown for 3 days from now",
      campaignId: userCampaigns[1]?.id || null,
      matchId: userMatches[2]?.id || null,
      aiDecision: JSON.stringify({
        reason: "No response after 7 days, optimal follow-up window",
        predictedResponseTime: "2-3 days",
      }),
      outcome: "pending",
      hoursAgo: 6,
    },
    {
      activityType: "pipeline_moved",
      activityDescription: "Moved Emma Wilson from Cold to Contacted stage",
      campaignId: userCampaigns[0]?.id || null,
      matchId: userMatches[3]?.id || null,
      aiDecision: JSON.stringify({
        reason: "Initial message sent successfully",
        previousStage: "cold",
        newStage: "contacted",
      }),
      outcome: "success",
      hoursAgo: 8,
    },
    {
      activityType: "prospect_discovered",
      activityDescription:
        "Discovered new prospect: David Kim, Product Manager with SaaS experience",
      campaignId: userCampaigns[2]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Matches target criteria: Product + SaaS + 5+ years exp",
        confidence: 0.85,
      }),
      outcome: "success",
      hoursAgo: 10,
    },
    {
      activityType: "message_sent",
      activityDescription:
        "Sent personalized outreach message to Lisa Anderson",
      campaignId: userCampaigns[0]?.id || null,
      matchId: userMatches[4]?.id || null,
      aiDecision: JSON.stringify({
        reason: "High engagement probability (78%)",
        messageType: "initial_outreach",
        personalizedElements: ["shared_industry", "similar_goals"],
      }),
      outcome: "success",
      hoursAgo: 12,
    },
    {
      activityType: "match_created",
      activityDescription: "Created match with Tom Johnson (91% compatibility)",
      campaignId: userCampaigns[1]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Exceptional skill complementarity, aligned vision",
        confidence: 0.91,
      }),
      outcome: "success",
      hoursAgo: 15,
    },
    {
      activityType: "pipeline_moved",
      activityDescription:
        "Moved Rachel Green from Contacted to Responded stage",
      campaignId: userCampaigns[2]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Received positive response",
        previousStage: "contacted",
        newStage: "responded",
      }),
      outcome: "success",
      hoursAgo: 18,
    },
    {
      activityType: "follow_up_scheduled",
      activityDescription:
        "Scheduled follow-up with Chris Martinez for tomorrow",
      campaignId: userCampaigns[0]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Conversation momentum detected, strike while hot",
        predictedResponseTime: "1 day",
      }),
      outcome: "pending",
      hoursAgo: 20,
    },
    {
      activityType: "prospect_discovered",
      activityDescription:
        "Discovered new prospect: Nina Patel, Designer with fintech background",
      campaignId: userCampaigns[1]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Rare skill combination matching user needs",
        confidence: 0.89,
      }),
      outcome: "success",
      hoursAgo: 24,
    },
    {
      activityType: "message_sent",
      activityDescription: "Sent personalized outreach message to Kevin Lee",
      campaignId: userCampaigns[2]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Optimal send time based on timezone analysis",
        messageType: "initial_outreach",
        timezone: "PST",
      }),
      outcome: "success",
      hoursAgo: 30,
    },
    {
      activityType: "match_created",
      activityDescription:
        "Created match with Sophia Taylor (86% compatibility)",
      campaignId: userCampaigns[0]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Strong work style alignment, compatible values",
        confidence: 0.86,
      }),
      outcome: "success",
      hoursAgo: 36,
    },
    {
      activityType: "pipeline_moved",
      activityDescription: "Moved James Wilson from Responded to Meeting stage",
      campaignId: userCampaigns[1]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Meeting scheduled confirmed",
        previousStage: "responded",
        newStage: "meeting",
      }),
      outcome: "success",
      hoursAgo: 48,
    },
    {
      activityType: "prospect_discovered",
      activityDescription:
        "Discovered new prospect: Maria Garcia, Growth Marketer with B2B SaaS expertise",
      campaignId: userCampaigns[2]?.id || null,
      matchId: null,
      aiDecision: JSON.stringify({
        reason: "Perfect match for marketing co-founder role",
        confidence: 0.93,
      }),
      outcome: "success",
      hoursAgo: 60,
    },
  ];

  // Insert activities with timestamps
  const now = new Date();
  for (const activity of activities) {
    const createdAt = new Date(
      now.getTime() - activity.hoursAgo * 60 * 60 * 1000
    );

    await db.insert(aiActivityLog).values({
      userId,
      activityType: activity.activityType,
      activityDescription: activity.activityDescription,
      campaignId: activity.campaignId,
      matchId: activity.matchId,
      aiDecision: activity.aiDecision,
      outcome: activity.outcome,
      createdAt,
    });
  }

  console.log(`✅ Seeded ${activities.length} AI activity log entries`);
  console.log("🎉 AI activity log seeding complete!");
}

// Run if called directly
seedAIActivity()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error seeding AI activity:", error);
    process.exit(1);
  });

export { seedAIActivity };
