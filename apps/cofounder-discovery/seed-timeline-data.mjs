import { drizzle } from "drizzle-orm/mysql2";
import { timelineEvents, prospects, users } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function seedTimelineData() {
  console.log("🌱 Seeding timeline data...");

  try {
    // Get first user and first few prospects
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      console.log("❌ No users found. Please run user seed first.");
      return;
    }

    const prospectList = await db.select().from(prospects).limit(5);
    if (prospectList.length === 0) {
      console.log("❌ No prospects found. Please run prospect seed first.");
      return;
    }

    // Clear existing timeline events for this user
    await db.delete(timelineEvents).where(eq(timelineEvents.userId, user.id));

    // Create timeline events for first prospect (Sarah Chen) - Full journey to partnership
    const prospect1 = prospectList[0];
    await db.insert(timelineEvents).values([
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "message_sent",
        title: "Initial Outreach",
        description:
          "Sent personalized introduction message highlighting shared interest in SaaS products.",
        metadata: JSON.stringify({
          platform: "CoFoundersLab",
          messageLength: 250,
        }),
        createdAt: new Date("2024-01-15T10:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "message_received",
        title: "Positive Response",
        description:
          "Sarah responded enthusiastically, interested in learning more about the project.",
        metadata: JSON.stringify({
          responseTime: "2 hours",
          sentiment: "positive",
        }),
        createdAt: new Date("2024-01-15T12:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "meeting_scheduled",
        title: "Discovery Call Scheduled",
        description:
          "Scheduled 30-minute video call to discuss vision and compatibility.",
        metadata: JSON.stringify({ platform: "Zoom", duration: "30 minutes" }),
        createdAt: new Date("2024-01-16T14:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "meeting_completed",
        title: "Discovery Call Completed",
        description:
          "Great chemistry! Discussed product vision, roles, and next steps.",
        metadata: JSON.stringify({
          outcome: "positive",
          nextSteps: "technical deep dive",
        }),
        createdAt: new Date("2024-01-18T15:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "meeting_scheduled",
        title: "Technical Deep Dive Scheduled",
        description:
          "Scheduled follow-up meeting to review technical architecture and roadmap.",
        metadata: JSON.stringify({
          platform: "Google Meet",
          duration: "60 minutes",
        }),
        createdAt: new Date("2024-01-20T10:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "meeting_completed",
        title: "Technical Deep Dive Completed",
        description:
          "Aligned on technical approach and division of responsibilities.",
        metadata: JSON.stringify({
          outcome: "excellent",
          decision: "move forward",
        }),
        createdAt: new Date("2024-01-22T16:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect1.id,
        type: "partnership_formed",
        title: "Partnership Formed! 🎉",
        description:
          "Officially became co-founders! Signed founder agreement and started building together.",
        metadata: JSON.stringify({
          equitySplit: "50/50",
          startDate: "2024-02-01",
        }),
        createdAt: new Date("2024-01-25T12:00:00Z"),
      },
    ]);

    // Create timeline events for second prospect (Marcus Rodriguez) - In progress
    const prospect2 = prospectList[1];
    await db.insert(timelineEvents).values([
      {
        userId: user.id,
        prospectId: prospect2.id,
        type: "message_sent",
        title: "Initial Outreach",
        description:
          "Reached out about potential collaboration on AI-powered fintech project.",
        metadata: JSON.stringify({
          platform: "Y Combinator",
          messageLength: 200,
        }),
        createdAt: new Date("2024-02-01T09:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect2.id,
        type: "message_received",
        title: "Response Received",
        description:
          "Marcus replied with interest, asking for more details about the business model.",
        metadata: JSON.stringify({
          responseTime: "1 day",
          sentiment: "interested",
        }),
        createdAt: new Date("2024-02-02T10:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect2.id,
        type: "message_sent",
        title: "Follow-up Message",
        description: "Shared detailed business plan and market analysis.",
        metadata: JSON.stringify({
          attachments: ["business_plan.pdf", "market_analysis.pdf"],
        }),
        createdAt: new Date("2024-02-03T14:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect2.id,
        type: "meeting_scheduled",
        title: "Intro Call Scheduled",
        description:
          "Scheduled call to discuss project vision and potential collaboration.",
        metadata: JSON.stringify({ platform: "Zoom", duration: "45 minutes" }),
        createdAt: new Date("2024-02-05T11:00:00Z"),
      },
    ]);

    // Create timeline events for third prospect (Emily Watson) - Early stage
    const prospect3 = prospectList[2];
    await db.insert(timelineEvents).values([
      {
        userId: user.id,
        prospectId: prospect3.id,
        type: "message_sent",
        title: "Initial Outreach",
        description:
          "Sent introduction highlighting complementary skills in growth and marketing.",
        metadata: JSON.stringify({
          platform: "FounderCloud",
          messageLength: 180,
        }),
        createdAt: new Date("2024-02-10T13:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect3.id,
        type: "message_opened",
        title: "Message Opened",
        description: "Emily viewed the message but hasn't responded yet.",
        metadata: JSON.stringify({ openedAt: "2024-02-11T09:00:00Z" }),
        createdAt: new Date("2024-02-11T09:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect3.id,
        type: "follow_up_sent",
        title: "Follow-up Sent",
        description:
          "Sent gentle follow-up after 7 days with additional context about the opportunity.",
        metadata: JSON.stringify({ daysSinceInitial: 7, automated: true }),
        createdAt: new Date("2024-02-17T10:00:00Z"),
      },
    ]);

    // Create timeline events for fourth prospect (David Kim) - No response
    const prospect4 = prospectList[3];
    await db.insert(timelineEvents).values([
      {
        userId: user.id,
        prospectId: prospect4.id,
        type: "message_sent",
        title: "Initial Outreach",
        description:
          "Reached out about healthcare tech collaboration opportunity.",
        metadata: JSON.stringify({
          platform: "CoFoundersLab",
          messageLength: 220,
        }),
        createdAt: new Date("2024-02-15T11:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect4.id,
        type: "follow_up_sent",
        title: "Follow-up Sent",
        description: "Automated follow-up sent after 7 days with no response.",
        metadata: JSON.stringify({ daysSinceInitial: 7, automated: true }),
        createdAt: new Date("2024-02-22T10:00:00Z"),
      },
    ]);

    // Create timeline events for fifth prospect (Priya Patel) - Declined
    const prospect5 = prospectList[4];
    await db.insert(timelineEvents).values([
      {
        userId: user.id,
        prospectId: prospect5.id,
        type: "message_sent",
        title: "Initial Outreach",
        description: "Sent message about potential Web3 collaboration.",
        metadata: JSON.stringify({
          platform: "Y Combinator",
          messageLength: 190,
        }),
        createdAt: new Date("2024-02-20T14:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect5.id,
        type: "message_received",
        title: "Response Received",
        description:
          "Priya responded politely declining, already committed to another project.",
        metadata: JSON.stringify({
          responseTime: "3 hours",
          sentiment: "polite_decline",
        }),
        createdAt: new Date("2024-02-20T17:00:00Z"),
      },
      {
        userId: user.id,
        prospectId: prospect5.id,
        type: "partnership_declined",
        title: "Partnership Declined",
        description:
          "Marked as not pursuing further. Priya is already committed to another venture.",
        metadata: JSON.stringify({
          reason: "already_committed",
          keepInTouch: true,
        }),
        createdAt: new Date("2024-02-20T18:00:00Z"),
      },
    ]);

    console.log("✅ Timeline data seeded successfully!");
    console.log(
      `   - Created timeline events for ${prospectList.length} prospects`
    );
    console.log(`   - User: ${user.name} (ID: ${user.id})`);
    console.log(
      `   - Prospect 1 (${prospect1.name}): Partnership formed (7 events)`
    );
    console.log(`   - Prospect 2 (${prospect2.name}): In progress (4 events)`);
    console.log(`   - Prospect 3 (${prospect3.name}): Early stage (3 events)`);
    console.log(`   - Prospect 4 (${prospect4.name}): No response (2 events)`);
    console.log(`   - Prospect 5 (${prospect5.name}): Declined (3 events)`);
  } catch (error) {
    console.error("❌ Error seeding timeline data:", error);
    throw error;
  }

  process.exit(0);
}

seedTimelineData();
