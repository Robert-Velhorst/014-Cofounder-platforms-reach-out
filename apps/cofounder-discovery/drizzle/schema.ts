import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  float,
  unique,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  emailVerified: int("emailVerified").default(0).notNull(),
  verificationToken: varchar("verificationToken", { length: 64 }),
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),

  // Connected Accounts
  linkedinId: varchar("linkedin_id", { length: 255 }),
  linkedinAccessToken: text("linkedin_access_token"),
  linkedinRefreshToken: text("linkedin_refresh_token"),
  linkedinTokenExpiry: timestamp("linkedin_token_expiry"),
  linkedinConnectedAt: timestamp("linkedin_connected_at"),

  githubId: varchar("github_id", { length: 255 }),
  githubAccessToken: text("github_access_token"),
  githubUsername: varchar("github_username", { length: 255 }),
  githubConnectedAt: timestamp("github_connected_at"),

  // Notification Preferences
  emailNotificationsEnabled: int("email_notifications_enabled")
    .default(1)
    .notNull(),
  notifyNewMatches: int("notify_new_matches").default(1).notNull(),
  notifyMessages: int("notify_messages").default(1).notNull(),
  weeklySummaryEnabled: int("weekly_summary_enabled").default(1).notNull(),
});

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  // Basic Info
  location: varchar("location", { length: 255 }),
  timezone: varchar("timezone", { length: 100 }),
  availability: varchar("availability", { length: 50 }),
  bio: text("bio"),

  // Professional Background
  skills: json("skills").$type<string[]>(),
  experience: varchar("experience", { length: 50 }),
  industries: json("industries").$type<string[]>(),
  previousRoles: json("previous_roles").$type<string[]>(),

  // Startup Goals
  lookingFor: json("looking_for").$type<string[]>(),
  startupStage: varchar("startup_stage", { length: 50 }),
  commitment: varchar("commitment", { length: 50 }),
  targetIndustries: json("target_industries").$type<string[]>(),
  businessModel: json("business_model").$type<string[]>(),

  // Personality & Work Style
  workStyle: json("work_style").$type<string[]>(),
  values: json("values").$type<string[]>(),
  communicationStyle: varchar("communication_style", { length: 50 }),

  // Preferences
  equityExpectation: varchar("equity_expectation", { length: 50 }),
  fundingPreference: json("funding_preference").$type<string[]>(),
  remotePreference: varchar("remote_preference", { length: 50 }),

  // Metadata
  completeness: int("completeness").default(0),
  isPublic: boolean("is_public").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const prospects = mysqlTable("prospects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),

  // Professional Info
  skills: json("skills").$type<string[]>(),
  experience: varchar("experience", { length: 50 }),
  industries: json("industries").$type<string[]>(),
  currentCompany: varchar("current_company", { length: 255 }),

  // Startup Info
  lookingFor: json("looking_for").$type<string[]>(),
  startupStage: varchar("startup_stage", { length: 50 }),

  // Source Platform
  platform: varchar("platform", { length: 50 }),
  profileUrl: varchar("profile_url", { length: 500 }),

  // Enrichment Data
  enrichmentScore: int("enrichment_score").default(0),
  lastEnriched: timestamp("last_enriched"),
  linkedInData: json("linkedin_data"),
  githubData: json("github_data"),
  companyData: json("company_data"),

  // Metadata
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
});

export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospect_id")
    .notNull()
    .references(() => prospects.id),
  campaignId: int("campaign_id").references(() => campaigns.id),

  // Compatibility Scores
  overallScore: int("overall_score").notNull(),
  skillsScore: int("skills_score"),
  industryScore: int("industry_score"),
  visionScore: int("vision_score"),
  workStyleScore: int("work_style_score"),
  locationScore: int("location_score"),

  // Match Details
  reasoning: text("reasoning"),
  recommendations: json("recommendations").$type<string[]>(),
  successProbability: int("success_probability"),

  // Enhanced Status Tracking
  status: mysqlEnum("status", [
    "new", // Legacy - will be migrated to discovered
    "viewed", // Legacy - will be migrated to discovered
    "interested", // Legacy - will be migrated to responded
    "discovered", // AI found this match
    "queued", // Waiting for approval (semi-automatic mode)
    "approved", // User approved (ready to contact)
    "rejected", // User rejected
    "contacted", // Message sent
    "responded", // Prospect replied
    "meeting_scheduled", // Meeting booked
    "partnership_formed", // Success!
    "no_response", // Contacted but no reply after 14 days
    "not_interested", // Prospect declined
  ]).default("discovered"),

  // Timestamps for tracking
  matchedAt: timestamp("matched_at").defaultNow().notNull(),
  lastScoredAt: timestamp("last_scored_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  contactedAt: timestamp("contacted_at"),
  responseReceivedAt: timestamp("response_received_at"),
  meetingScheduledAt: timestamp("meeting_scheduled_at"),
  partnershipFormedAt: timestamp("partnership_formed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Campaign Settings
  targetPlatforms: json("target_platforms").$type<string[]>(),
  filters: json("filters").$type<Record<string, any>>(),
  messageTemplate: text("message_template"),

  // Automation Settings
  automationMode: mysqlEnum("automation_mode", [
    "fully_automatic",
    "semi_automatic",
    "manual",
  ]).default("semi_automatic"),
  dailyMatchLimit: int("daily_match_limit").default(5),
  autoMessageEnabled: boolean("auto_message_enabled").default(false),
  minCompatibilityScore: int("min_compatibility_score").default(70),

  // Statistics
  prospectsFound: int("prospects_found").default(0),
  messagesSent: int("messages_sent").default(0),
  responsesReceived: int("responses_received").default(0),

  // Status
  status: mysqlEnum("status", [
    "draft",
    "active",
    "paused",
    "completed",
  ]).default("draft"),
  lastRunAt: timestamp("last_run_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Messages table for real-time messaging between users and prospects
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospect_id")
    .notNull()
    .references(() => prospects.id),
  senderId: int("senderId")
    .notNull()
    .references(() => users.id),
  recipientId: int("recipientId").notNull(),
  matchId: int("matchId").references(() => matches.id),
  conversationId: int("conversation_id").references(() => conversations.id),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "delivered", "read"])
    .default("sent")
    .notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  readAt: timestamp("readAt"),
  isFollowUp: int("is_follow_up").default(0).notNull(),
  parentMessageId: int("parent_message_id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Conversations table to group messages
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospectId")
    .notNull()
    .references(() => prospects.id),
  matchId: int("matchId").references(() => matches.id),
  lastMessageAt: timestamp("lastMessageAt"),
  unreadCount: int("unreadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Saved searches table for storing user search criteria
 */
export const savedSearches = mysqlTable("saved_searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Search Criteria (JSON fields for flexibility)
  skills: json("skills").$type<string[]>(),
  industries: json("industries").$type<string[]>(),
  location: varchar("location", { length: 255 }),
  experience: varchar("experience", { length: 50 }),
  startupStage: varchar("startup_stage", { length: 50 }),
  commitment: varchar("commitment", { length: 50 }),
  remotePreference: varchar("remote_preference", { length: 50 }),
  minCompatibilityScore: int("min_compatibility_score").default(70),

  // Advanced Filters
  fundingStage: json("funding_stage").$type<string[]>(),
  teamSizeMin: int("team_size_min"),
  teamSizeMax: int("team_size_max"),
  equitySplitPreference: varchar("equity_split_preference", { length: 100 }),

  // Notification Settings
  notificationsEnabled: int("notifications_enabled").default(1).notNull(),
  emailNotifications: int("email_notifications").default(1).notNull(),

  // Metadata
  isActive: int("is_active").default(1).notNull(),
  lastChecked: timestamp("lastChecked"),
  matchCount: int("match_count").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

/**
 * Conversation starters history table
 */
export const conversationStartersHistory = mysqlTable(
  "conversation_starters_history",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    prospectId: int("prospect_id")
      .notNull()
      .references(() => prospects.id),

    // Starter Details
    message: text("message").notNull(),
    tone: varchar("tone", { length: 50 }).notNull(),
    focusArea: varchar("focus_area", { length: 100 }).notNull(),
    reasoning: text("reasoning"),

    // Usage Tracking
    wasCopied: int("was_copied").default(0).notNull(),
    wasUsed: int("was_used").default(0).notNull(),
    copiedAt: timestamp("copied_at"),
    usedAt: timestamp("used_at"),

    // Context at generation time
    compatibilityScore: int("compatibility_score"),
    enrichmentScore: int("enrichment_score"),

    // Metadata
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
  }
);

export type ConversationStarterHistory =
  typeof conversationStartersHistory.$inferSelect;
export type InsertConversationStarterHistory =
  typeof conversationStartersHistory.$inferInsert;

/**
 * Success metrics table for tracking user outcomes
 */
export const successMetrics = mysqlTable("success_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospect_id").references(() => prospects.id),
  campaignId: int("campaign_id").references(() => campaigns.id),

  // Metric Type
  metricType: mysqlEnum("metric_type", [
    "message_sent",
    "message_responded",
    "meeting_scheduled",
    "meeting_completed",
    "partnership_formed",
    "partnership_failed",
  ]).notNull(),

  // Details
  notes: text("notes"),
  value: int("value"), // For quantifiable metrics

  // Metadata
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type SuccessMetric = typeof successMetrics.$inferSelect;
export type InsertSuccessMetric = typeof successMetrics.$inferInsert;

/**
 * Timeline events table for tracking all interactions with prospects
 */
export const timelineEvents = mysqlTable("timeline_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospect_id")
    .notNull()
    .references(() => prospects.id),

  // Event Details
  type: mysqlEnum("type", [
    "message_sent",
    "message_received",
    "message_opened",
    "follow_up_sent",
    "meeting_scheduled",
    "meeting_completed",
    "partnership_formed",
    "partnership_declined",
    "note_added",
  ]).notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data

  // References
  messageId: int("message_id").references(() => messages.id),
  campaignId: int("campaign_id").references(() => campaigns.id),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

/**
 * Conversation Analytics - Track message performance for optimization
 */
export const conversationAnalytics = mysqlTable("conversation_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospect_id")
    .notNull()
    .references(() => prospects.id),
  messageId: int("message_id").references(() => messages.id),

  // Message Characteristics
  tone: mysqlEnum("tone", [
    "professional",
    "friendly",
    "enthusiastic",
    "casual",
  ]),
  focusArea: mysqlEnum("focus_area", [
    "skills",
    "industry",
    "project",
    "experience",
    "shared_interest",
  ]),
  messageLength: int("message_length"), // character count
  hasQuestion: int("has_question").default(0),
  hasPersonalization: int("has_personalization").default(0),

  // Response Metrics
  sentAt: timestamp("sent_at").notNull(),
  respondedAt: timestamp("responded_at"),
  responseTime: int("response_time"), // seconds
  responseQuality: mysqlEnum("response_quality", [
    "positive",
    "neutral",
    "negative",
  ]),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ConversationAnalytic = typeof conversationAnalytics.$inferSelect;
export type InsertConversationAnalytic =
  typeof conversationAnalytics.$inferInsert;

/**
 * Response Patterns - Track when prospects typically respond
 */
export const responsePatterns = mysqlTable(
  "response_patterns",
  {
    id: int("id").autoincrement().primaryKey(),
    prospectId: int("prospect_id")
      .notNull()
      .references(() => prospects.id),

    // Time Patterns
    dayOfWeek: int("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
    hourOfDay: int("hour_of_day").notNull(), // 0-23

    // Statistics
    responseCount: int("response_count").default(0).notNull(),
    totalSent: int("total_sent").default(0).notNull(),
    avgResponseTime: int("avg_response_time"), // minutes

    // Metadata
    lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    uniquePattern: unique().on(
      table.prospectId,
      table.dayOfWeek,
      table.hourOfDay
    ),
  })
);

export type ResponsePattern = typeof responsePatterns.$inferSelect;
export type InsertResponsePattern = typeof responsePatterns.$inferInsert;

/**
 * Partnership Outcomes - Track match results for ML training
 */
export const partnershipOutcomes = mysqlTable("partnership_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  prospectId: int("prospect_id")
    .notNull()
    .references(() => prospects.id),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  // Outcome
  outcome: mysqlEnum("outcome", [
    "partnership_formed",
    "still_talking",
    "not_interested",
    "no_response",
    "timing_not_right",
  ]).notNull(),

  // Details
  outcomeDate: timestamp("outcome_date"),
  notes: text("notes"),

  // Engagement Metrics (for ML features)
  totalMessages: int("total_messages").default(0),
  totalMeetings: int("total_meetings").default(0),
  daysToOutcome: int("days_to_outcome"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PartnershipOutcome = typeof partnershipOutcomes.$inferSelect;
export type InsertPartnershipOutcome = typeof partnershipOutcomes.$inferInsert;

/**
 * ML Model Versions - Track deployed ML models
 */
export const mlModelVersions = mysqlTable("ml_model_versions", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 50 }).notNull().unique(),
  modelType: varchar("model_type", { length: 50 }).notNull(), // 'match_scoring', 'response_prediction', etc.

  // Performance Metrics
  accuracy: float("accuracy"),
  precisionScore: float("precision_score"),
  recallScore: float("recall_score"),
  f1Score: float("f1_score"),

  // Training Info
  trainingSamples: int("training_samples"),
  features: text("features"), // JSON array of feature names
  hyperparameters: text("hyperparameters"), // JSON object

  // Deployment
  isActive: int("is_active").default(0).notNull(),
  deployedAt: timestamp("deployed_at"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MLModelVersion = typeof mlModelVersions.$inferSelect;
export type InsertMLModelVersion = typeof mlModelVersions.$inferInsert;

/**
 * Resource Usage - Track all API/resource consumption for metered billing
 */
export const resourceUsage = mysqlTable("resource_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  // Resource Details
  resourceType: mysqlEnum("resource_type", [
    "llm_api_call",
    "enrichment_linkedin",
    "enrichment_github",
    "enrichment_company",
    "platform_scraping",
    "conversation_starter_generation",
    "semantic_matching",
    "image_generation",
    "voice_transcription",
  ]).notNull(),

  // Usage Metrics
  quantity: int("quantity").default(1).notNull(), // Number of units consumed
  tokenCount: int("token_count"), // For LLM calls

  // Cost Tracking (in cents)
  baseCost: int("base_cost").notNull(), // Actual cost from provider
  markedUpCost: int("marked_up_cost").notNull(), // Cost with 2.5x markup

  // Context
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'prospect', 'match', 'campaign', etc.
  relatedEntityId: int("related_entity_id"),
  metadata: text("metadata"), // JSON for additional context

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ResourceUsage = typeof resourceUsage.$inferSelect;
export type InsertResourceUsage = typeof resourceUsage.$inferInsert;

/**
 * Usage Pricing - Define costs for each resource type
 */
export const usagePricing = mysqlTable("usage_pricing", {
  id: int("id").autoincrement().primaryKey(),
  resourceType: varchar("resource_type", { length: 50 }).notNull().unique(),

  // Pricing (in cents)
  baseCostPerUnit: int("base_cost_per_unit").notNull(), // Provider cost
  markup: float("markup").default(2.5).notNull(), // Multiplier (2.5x default)

  // Description
  unitName: varchar("unit_name", { length: 50 }).notNull(), // 'call', 'token', 'request', etc.
  description: text("description"),

  // Metadata
  isActive: int("is_active").default(1).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UsagePricing = typeof usagePricing.$inferSelect;
export type InsertUsagePricing = typeof usagePricing.$inferInsert;

/**
 * Billing Periods - Monthly billing cycles
 */
export const billingPeriods = mysqlTable(
  "billing_periods",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),

    // Period
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),

    // Totals (in cents)
    totalBaseCost: int("total_base_cost").default(0).notNull(),
    totalMarkedUpCost: int("total_marked_up_cost").default(0).notNull(),
    totalUsageCount: int("total_usage_count").default(0).notNull(),

    // Status
    status: mysqlEnum("status", ["active", "closed", "invoiced"])
      .default("active")
      .notNull(),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  table => ({
    uniquePeriod: unique().on(table.userId, table.startDate),
  })
);

export type BillingPeriod = typeof billingPeriods.$inferSelect;
export type InsertBillingPeriod = typeof billingPeriods.$inferInsert;

/**
 * Invoices - Generated invoices for billing periods
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  billingPeriodId: int("billing_period_id")
    .notNull()
    .references(() => billingPeriods.id),

  // Invoice Details
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),

  // Amounts (in cents)
  subtotal: int("subtotal").notNull(),
  tax: int("tax").default(0).notNull(),
  total: int("total").notNull(),

  // Status
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"])
    .default("draft")
    .notNull(),

  // Dates
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),

  // Line Items (JSON)
  lineItems: text("line_items").notNull(), // JSON array of {resourceType, quantity, unitCost, total}

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Pipeline Stages - CRM-style deal stages
 */
export const pipelineStages = mysqlTable("pipeline_stages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  // Stage
  stage: mysqlEnum("stage", [
    "cold", // Not yet contacted
    "contacted", // AI sent first message
    "responded", // Prospect replied
    "meeting", // Meeting scheduled/completed
    "partnership", // Partnership formed
    "not_interested", // Prospect declined or no response
  ]).notNull(),

  // Metadata
  enteredAt: timestamp("entered_at").defaultNow().notNull(),
  exitedAt: timestamp("exited_at"),
  notes: text("notes"),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

/**
 * Stage Transition History - Track how prospects move through pipeline
 */
export const stageTransitions = mysqlTable("stage_transitions", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  fromStage: mysqlEnum("from_stage", [
    "cold",
    "contacted",
    "responded",
    "meeting",
    "partnership",
    "not_interested",
  ]),
  toStage: mysqlEnum("to_stage", [
    "cold",
    "contacted",
    "responded",
    "meeting",
    "partnership",
    "not_interested",
  ]).notNull(),

  // Transition details
  reason: varchar("reason", { length: 255 }),
  automated: boolean("automated").default(true).notNull(), // true if AI moved it, false if user moved it

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StageTransition = typeof stageTransitions.$inferSelect;
export type InsertStageTransition = typeof stageTransitions.$inferInsert;

/**
 * Prospect Tasks - Reminders and to-dos for each prospect
 */
export const prospectTasks = mysqlTable("prospect_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProspectTask = typeof prospectTasks.$inferSelect;
export type InsertProspectTask = typeof prospectTasks.$inferInsert;

/**
 * Prospect Notes - User notes on each prospect
 */
export const prospectNotes = mysqlTable("prospect_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProspectNote = typeof prospectNotes.$inferSelect;
export type InsertProspectNote = typeof prospectNotes.$inferInsert;

/**
 * Lead Scores - AI predictions for each prospect
 */
export const leadScores = mysqlTable("lead_scores", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  // Predictions
  responseLikelihood: float("response_likelihood").notNull(), // 0-1 probability
  engagementScore: float("engagement_score").notNull(), // 0-100 based on enrichment data
  priorityRank: int("priority_rank").notNull(), // 1 = highest priority

  // Factors
  factors: text("factors").notNull(), // JSON: reasons for the score

  // Accuracy tracking
  predicted: boolean("predicted").default(true).notNull(),
  actualResponse: boolean("actual_response"),
  predictionAccurate: boolean("prediction_accurate"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type LeadScore = typeof leadScores.$inferSelect;
export type InsertLeadScore = typeof leadScores.$inferInsert;

/**
 * User Preferences - Learned preferences from user behavior
 */
export const userPreferences = mysqlTable(
  "user_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),

    // Preference type
    preferenceType: varchar("preference_type", { length: 100 }).notNull(), // e.g., "skill_preference", "industry_preference"
    preferenceKey: varchar("preference_key", { length: 255 }).notNull(), // e.g., "React", "FinTech"

    // Weight adjustment
    weight: float("weight").default(1.0).notNull(), // Multiplier for this preference (higher = more important)
    confidence: float("confidence").default(0.5).notNull(), // 0-1, how confident AI is in this preference

    // Evidence
    acceptCount: int("accept_count").default(0).notNull(), // How many times user accepted matches with this attribute
    rejectCount: int("reject_count").default(0).notNull(), // How many times user rejected matches with this attribute

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    uniquePreference: unique().on(
      table.userId,
      table.preferenceType,
      table.preferenceKey
    ),
  })
);

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Approval Queue - Messages pending user approval
 */
export const approvalQueue = mysqlTable("approval_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  matchId: int("match_id")
    .notNull()
    .references(() => matches.id),

  // Message details
  messageType: mysqlEnum("message_type", [
    "first_contact",
    "follow_up",
    "meeting_request",
  ]).notNull(),
  messageContent: text("message_content").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // "linkedin", "cofounderslab", etc.

  // AI reasoning
  aiReasoning: text("ai_reasoning"), // Why AI wants to send this message

  // Status
  status: mysqlEnum("status", ["pending", "approved", "rejected", "sent"])
    .default("pending")
    .notNull(),
  reviewedAt: timestamp("reviewed_at"),
  sentAt: timestamp("sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApprovalQueueItem = typeof approvalQueue.$inferSelect;
export type InsertApprovalQueueItem = typeof approvalQueue.$inferInsert;

/**
 * Guardrails - User-defined rules for AI behavior
 */
export const guardrails = mysqlTable("guardrails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  // Rule details
  ruleType: varchar("rule_type", { length: 100 }).notNull(), // "rate_limit", "platform_limit", "content_filter"
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleConfig: text("rule_config").notNull(), // JSON configuration

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  // Usage tracking
  triggeredCount: int("triggered_count").default(0).notNull(),
  lastTriggered: timestamp("last_triggered"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Guardrail = typeof guardrails.$inferSelect;
export type InsertGuardrail = typeof guardrails.$inferInsert;

/**
 * AI Activity Log - Real-time log of AI actions
 */
export const aiActivityLog = mysqlTable("ai_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  // Activity details
  activityType: varchar("activity_type", { length: 100 }).notNull(), // "discovered_prospect", "sent_message", "scheduled_meeting"
  activityDescription: text("activity_description").notNull(),

  // Related entities
  matchId: int("match_id").references(() => matches.id),
  campaignId: int("campaign_id").references(() => campaigns.id),

  // AI decision
  aiDecision: text("ai_decision"), // JSON: why AI took this action

  // Outcome
  outcome: varchar("outcome", { length: 50 }), // "success", "failed", "pending"

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AIActivityLog = typeof aiActivityLog.$inferSelect;
export type InsertAIActivityLog = typeof aiActivityLog.$inferInsert;

// ============================================================
// Platform Credentials (Encrypted)
// ============================================================
export const platformCredentials = mysqlTable("platform_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  // Platform identifier
  platform: mysqlEnum("platform", [
    "founder_cloud",
    "co_founders_lab",
    "y_combinator",
  ]).notNull(),

  // Encrypted credentials (AES-256)
  encryptedUsername: text("encrypted_username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),

  // Connection status
  status: mysqlEnum("status", ["active", "invalid", "suspended", "untested"])
    .default("untested")
    .notNull(),
  lastTestedAt: timestamp("last_tested_at"),
  lastUsedAt: timestamp("last_used_at"),
  lastError: text("last_error"),

  // Session data (encrypted cookies/tokens for session reuse)
  encryptedSessionData: text("encrypted_session_data"),
  sessionExpiresAt: timestamp("session_expires_at"),

  // Automation settings per platform
  dailyMessageLimit: int("daily_message_limit").default(5).notNull(),
  messagessentToday: int("messages_sent_today").default(0).notNull(),
  lastResetAt: timestamp("last_reset_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PlatformCredential = typeof platformCredentials.$inferSelect;
export type InsertPlatformCredential = typeof platformCredentials.$inferInsert;

// ============================================================
// Platform Automation Jobs
// ============================================================
export const automationJobs = mysqlTable("automation_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  campaignId: int("campaign_id").references(() => campaigns.id),
  matchId: int("match_id").references(() => matches.id),

  // Job type
  jobType: mysqlEnum("job_type", [
    "discover_prospects",
    "send_message",
    "send_connection_request",
    "check_responses",
    "send_followup",
  ]).notNull(),

  // Platform
  platform: mysqlEnum("platform", [
    "founder_cloud",
    "co_founders_lab",
    "y_combinator",
  ]).notNull(),

  // Job status
  status: mysqlEnum("status", [
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),

  // Job data (JSON payload)
  jobData: json("job_data").$type<Record<string, unknown>>(),

  // Result
  result: json("result").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),

  // Scheduling
  scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),

  // Retry logic
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("max_attempts").default(3).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AutomationJob = typeof automationJobs.$inferSelect;
export type InsertAutomationJob = typeof automationJobs.$inferInsert;
