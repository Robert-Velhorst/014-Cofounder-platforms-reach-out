import cron from "node-cron";
import * as db from "./db";
import { scrapeAllPlatformsReal } from "./platform-scrapers";
import { deduplicateProfiles } from "./scraping-engine";
import { runCampaignDiscovery, runFollowUpSequence } from "./campaign-engine";
import type { CampaignConfig } from "./campaign-engine";
import { enrichProspect } from "./enrichment-engine";

/**
 * Campaign Scheduler
 * Automates prospect discovery and outreach using node-cron
 */

interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  task: ReturnType<typeof cron.schedule>;
  status: "running" | "stopped";
  lastRun?: Date;
  nextRun?: Date;
}

class CampaignScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize scheduler with default jobs
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Scheduler already initialized");
      return;
    }

    console.log("Initializing campaign scheduler...");

    // Daily prospect discovery job (runs at 2 AM every day)
    this.scheduleJob(
      "daily-discovery",
      "Daily Prospect Discovery",
      "0 2 * * *", // 2:00 AM every day
      async () => {
        await this.runProspectDiscovery();
      }
    );

    // Daily campaign automation (runs at 9 AM every day)
    this.scheduleJob(
      "daily-campaigns",
      "Daily Campaign Automation",
      "0 9 * * *", // 9:00 AM every day
      async () => {
        await this.runDailyCampaigns();
      }
    );

    // Follow-up sequence (runs at 3 PM every day)
    this.scheduleJob(
      "daily-followups",
      "Daily Follow-up Sequence",
      "0 15 * * *", // 3:00 PM every day
      async () => {
        await this.runFollowUpSequence();
      }
    );

    // Weekly full scrape (runs at 1 AM every Sunday)
    this.scheduleJob(
      "weekly-full-scrape",
      "Weekly Full Platform Scrape",
      "0 1 * * 0", // 1:00 AM every Sunday
      async () => {
        await this.runFullPlatformScrape();
      }
    );

    // Daily enrichment job (runs at 4 AM every day)
    this.scheduleJob(
      "daily-enrichment",
      "Daily Prospect Enrichment",
      "0 4 * * *", // 4:00 AM every day
      async () => {
        await this.runProspectEnrichment();
      }
    );

    this.isInitialized = true;
    console.log(`Scheduler initialized with ${this.jobs.size} jobs`);
    this.listJobs();
  }

  /**
   * Schedule a new job
   */
  private scheduleJob(
    id: string,
    name: string,
    schedule: string,
    taskFunction: () => Promise<void>
  ): void {
    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    // Create scheduled task
    const task = cron.schedule(
      schedule,
      async () => {
        const job = this.jobs.get(id);
        if (!job) return;

        console.log(`\n[${new Date().toISOString()}] Starting job: ${name}`);
        job.lastRun = new Date();

        try {
          await taskFunction();
          console.log(`[${new Date().toISOString()}] Completed job: ${name}`);
        } catch (error) {
          console.error(
            `[${new Date().toISOString()}] Job failed: ${name}`,
            error
          );
        }
      },
      {
        timezone: "America/New_York",
      }
    );

    this.jobs.set(id, {
      id,
      name,
      schedule,
      task,
      status: "stopped",
    });

    console.log(`Scheduled job: ${name} (${schedule})`);
  }

  /**
   * Start all jobs
   */
  startAll(): void {
    console.log("Starting all scheduled jobs...");

    this.jobs.forEach(job => {
      if (job.status === "stopped") {
        job.task.start();
        job.status = "running";
        console.log(`Started: ${job.name}`);
      }
    });
  }

  /**
   * Stop all jobs
   */
  stopAll(): void {
    console.log("Stopping all scheduled jobs...");

    this.jobs.forEach(job => {
      if (job.status === "running") {
        job.task.stop();
        job.status = "stopped";
        console.log(`Stopped: ${job.name}`);
      }
    });
  }

  /**
   * Start specific job
   */
  startJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) {
      console.error(`Job not found: ${id}`);
      return false;
    }

    if (job.status === "running") {
      console.log(`Job already running: ${job.name}`);
      return true;
    }

    job.task.start();
    job.status = "running";
    console.log(`Started job: ${job.name}`);
    return true;
  }

  /**
   * Stop specific job
   */
  stopJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) {
      console.error(`Job not found: ${id}`);
      return false;
    }

    if (job.status === "stopped") {
      console.log(`Job already stopped: ${job.name}`);
      return true;
    }

    job.task.stop();
    job.status = "stopped";
    console.log(`Stopped job: ${job.name}`);
    return true;
  }

  /**
   * List all jobs
   */
  listJobs(): ScheduledJob[] {
    const jobList = Array.from(this.jobs.values()).map(job => ({
      ...job,
      task: undefined as any, // Don't expose task object
    }));

    console.log("\nScheduled Jobs:");
    jobList.forEach(job => {
      console.log(`  - ${job.name} (${job.id})`);
      console.log(`    Schedule: ${job.schedule}`);
      console.log(`    Status: ${job.status}`);
      if (job.lastRun) {
        console.log(`    Last Run: ${job.lastRun.toISOString()}`);
      }
    });

    return jobList;
  }

  /**
   * Run prospect discovery job
   */
  private async runProspectDiscovery(): Promise<void> {
    console.log("Running prospect discovery...");

    try {
      // Scrape all platforms
      const scrapedProfiles = await scrapeAllPlatformsReal(30);
      console.log(`Scraped ${scrapedProfiles.length} profiles`);

      // Deduplicate and validate
      const uniqueProfiles = deduplicateProfiles(scrapedProfiles);
      console.log(`After deduplication: ${uniqueProfiles.length} profiles`);

      // Save to database
      let savedCount = 0;
      for (const profile of uniqueProfiles) {
        // Basic validation
        if (profile.name && profile.platform && profile.profileUrl) {
          try {
            await db.createProspect(profile);
            savedCount++;
          } catch (error) {
            // Ignore duplicates
            if (!(error as Error).message.includes("Duplicate")) {
              console.error("Error saving prospect:", error);
            }
          }
        }
      }

      console.log(`Saved ${savedCount} new prospects to database`);
    } catch (error) {
      console.error("Prospect discovery failed:", error);
      throw error;
    }
  }

  /**
   * Run daily campaigns for all active users
   */
  private async runDailyCampaigns(): Promise<void> {
    console.log("Running daily campaigns...");

    try {
      // Get all users with active campaigns
      // In production, this would query active campaigns from database
      const activeUserIds = [1]; // Placeholder

      for (const userId of activeUserIds) {
        try {
          const config: CampaignConfig = {
            userId,
            name: "Daily Auto Campaign",
            minCompatibilityScore: 70,
            maxProspectsPerDay: 10,
            autoSendMessages: false, // Set to true when email is configured
            followUpEnabled: true,
            followUpDelayDays: 3,
            targetPlatforms: ["CoFoundersLab", "FounderCloud", "Y Combinator"],
          };

          const result = await runCampaignDiscovery(config);
          console.log(`Campaign for user ${userId}:`, result);
        } catch (error) {
          console.error(`Campaign failed for user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error("Daily campaigns failed:", error);
      throw error;
    }
  }

  /**
   * Run follow-up sequence for all users
   */
  private async runFollowUpSequence(): Promise<void> {
    console.log("Running follow-up sequence...");

    try {
      const activeUserIds = [1]; // Placeholder

      for (const userId of activeUserIds) {
        try {
          const config: CampaignConfig = {
            userId,
            name: "Follow-up Sequence",
            minCompatibilityScore: 70,
            maxProspectsPerDay: 5,
            autoSendMessages: false,
            followUpEnabled: true,
            followUpDelayDays: 3,
            targetPlatforms: [],
          };

          const result = await runFollowUpSequence(config);
          console.log(`Follow-ups for user ${userId}:`, result);
        } catch (error) {
          console.error(`Follow-up failed for user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error("Follow-up sequence failed:", error);
      throw error;
    }
  }

  /**
   * Run full platform scrape (weekly)
   */
  private async runFullPlatformScrape(): Promise<void> {
    console.log("Running full platform scrape...");

    try {
      // Scrape more profiles in weekly full scrape
      const scrapedProfiles = await scrapeAllPlatformsReal(100);
      console.log(`Full scrape: ${scrapedProfiles.length} profiles`);

      const uniqueProfiles = deduplicateProfiles(scrapedProfiles);
      console.log(`After deduplication: ${uniqueProfiles.length} profiles`);

      let savedCount = 0;
      for (const profile of uniqueProfiles) {
        // Basic validation
        if (profile.name && profile.platform && profile.profileUrl) {
          try {
            await db.createProspect(profile);
            savedCount++;
          } catch (error) {
            if (!(error as Error).message.includes("Duplicate")) {
              console.error("Error saving prospect:", error);
            }
          }
        }
      }

      console.log(`Full scrape saved ${savedCount} new prospects`);
    } catch (error) {
      console.error("Full platform scrape failed:", error);
      throw error;
    }
  }

  /**
   * Run prospect enrichment job
   */
  private async runProspectEnrichment(): Promise<void> {
    console.log("Running prospect enrichment...");

    try {
      // Get prospects that need enrichment:
      // 1. Never enriched (enrichmentScore = 0 or null)
      // 2. Stale enrichment (lastEnriched > 30 days ago)
      const prospectsToEnrich = await db.getProspectsNeedingEnrichment(50);
      console.log(
        `Found ${prospectsToEnrich.length} prospects needing enrichment`
      );

      let enrichedCount = 0;
      let failedCount = 0;

      for (const prospect of prospectsToEnrich) {
        try {
          // Extract enrichment sources from prospect
          const sources: any = {};

          // Look for LinkedIn URL in profileUrl or bio
          if (prospect.profileUrl?.includes("linkedin.com")) {
            sources.linkedInUrl = prospect.profileUrl;
          }

          // Look for GitHub URL
          if (prospect.profileUrl?.includes("github.com")) {
            sources.githubUrl = prospect.profileUrl;
          }

          // Use company name if available
          if (prospect.currentCompany) {
            sources.companyName = prospect.currentCompany;
          }

          // Skip if no enrichment sources available
          if (Object.keys(sources).length === 0) {
            console.log(
              `Skipping prospect ${prospect.id}: no enrichment sources`
            );
            continue;
          }

          // Enrich the prospect
          const enrichmentResult = await enrichProspect(prospect, sources);

          // Enrichment data is already saved by enrichProspect function
          enrichedCount++;
          console.log(
            `Enriched prospect ${prospect.id} (${prospect.name}) - Score: ${enrichmentResult.enrichmentScore}`
          );

          // Rate limiting: wait 1 second between enrichments
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          failedCount++;
          console.error(`Failed to enrich prospect ${prospect.id}:`, error);
        }
      }

      console.log(
        `Enrichment complete: ${enrichedCount} succeeded, ${failedCount} failed`
      );
    } catch (error) {
      console.error("Prospect enrichment job failed:", error);
      throw error;
    }
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }

    console.log(`Manually triggering job: ${job.name}`);

    // Get the job's task function based on ID
    const taskMap: Record<string, () => Promise<void>> = {
      "daily-discovery": () => this.runProspectDiscovery(),
      "daily-campaigns": () => this.runDailyCampaigns(),
      "daily-followups": () => this.runFollowUpSequence(),
      "weekly-full-scrape": () => this.runFullPlatformScrape(),
    };

    const taskFunction = taskMap[id];
    if (!taskFunction) {
      throw new Error(`No task function found for job: ${id}`);
    }

    await taskFunction();
  }
}

// Singleton instance
export const campaignScheduler = new CampaignScheduler();

/**
 * Initialize and start scheduler
 */
export async function initializeScheduler(): Promise<void> {
  await campaignScheduler.initialize();
  campaignScheduler.startAll();
  console.log("Campaign scheduler is now running");
}

/**
 * Stop scheduler
 */
export function stopScheduler(): void {
  campaignScheduler.stopAll();
  console.log("Campaign scheduler stopped");
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): any {
  return campaignScheduler.listJobs();
}
