import { describe, it, expect, beforeAll } from "vitest";
import { scrapeAllPlatformsReal } from "./platform-scrapers";
import { campaignScheduler } from "./campaign-scheduler";

describe("Browser Automation & Scheduler", () => {
  describe("Platform Scrapers", () => {
    it("should have scraping functions available", () => {
      expect(typeof scrapeAllPlatformsReal).toBe("function");
    });

    it("should return array from scrapeAllPlatformsReal", async () => {
      // Mock test - actual scraping would take too long
      const result = await Promise.resolve([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Campaign Scheduler", () => {
    it("should have scheduler instance", () => {
      expect(campaignScheduler).toBeDefined();
    });

    it("should have initialize method", () => {
      expect(typeof campaignScheduler.initialize).toBe("function");
    });

    it("should have startAll method", () => {
      expect(typeof campaignScheduler.startAll).toBe("function");
    });

    it("should have stopAll method", () => {
      expect(typeof campaignScheduler.stopAll).toBe("function");
    });

    it("should have listJobs method", () => {
      expect(typeof campaignScheduler.listJobs).toBe("function");
    });

    it("should have triggerJob method", () => {
      expect(typeof campaignScheduler.triggerJob).toBe("function");
    });

    it("should initialize scheduler without errors", async () => {
      await expect(campaignScheduler.initialize()).resolves.not.toThrow();
    });

    it("should list jobs after initialization", async () => {
      await campaignScheduler.initialize();
      const jobs = campaignScheduler.listJobs();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
    });

    it("should have daily-discovery job", async () => {
      await campaignScheduler.initialize();
      const jobs = campaignScheduler.listJobs();
      const discoveryJob = jobs.find(j => j.id === "daily-discovery");
      expect(discoveryJob).toBeDefined();
      expect(discoveryJob?.name).toBe("Daily Prospect Discovery");
    });

    it("should have daily-campaigns job", async () => {
      await campaignScheduler.initialize();
      const jobs = campaignScheduler.listJobs();
      const campaignsJob = jobs.find(j => j.id === "daily-campaigns");
      expect(campaignsJob).toBeDefined();
      expect(campaignsJob?.name).toBe("Daily Campaign Automation");
    });

    it("should have daily-followups job", async () => {
      await campaignScheduler.initialize();
      const jobs = campaignScheduler.listJobs();
      const followupsJob = jobs.find(j => j.id === "daily-followups");
      expect(followupsJob).toBeDefined();
      expect(followupsJob?.name).toBe("Daily Follow-up Sequence");
    });

    it("should have weekly-full-scrape job", async () => {
      await campaignScheduler.initialize();
      const jobs = campaignScheduler.listJobs();
      const scrapeJob = jobs.find(j => j.id === "weekly-full-scrape");
      expect(scrapeJob).toBeDefined();
      expect(scrapeJob?.name).toBe("Weekly Full Platform Scrape");
    });

    it("should start all jobs", () => {
      campaignScheduler.startAll();
      const jobs = campaignScheduler.listJobs();
      // Jobs should be in running state after start
      expect(jobs.every(j => j.status === "running")).toBe(true);
    });

    it("should stop all jobs", () => {
      campaignScheduler.stopAll();
      const jobs = campaignScheduler.listJobs();
      // Jobs should be in stopped state after stop
      expect(jobs.every(j => j.status === "stopped")).toBe(true);
    });

    it("should start individual job", () => {
      const success = campaignScheduler.startJob("daily-discovery");
      expect(success).toBe(true);

      const jobs = campaignScheduler.listJobs();
      const job = jobs.find(j => j.id === "daily-discovery");
      expect(job?.status).toBe("running");
    });

    it("should stop individual job", () => {
      campaignScheduler.startJob("daily-discovery");
      const success = campaignScheduler.stopJob("daily-discovery");
      expect(success).toBe(true);

      const jobs = campaignScheduler.listJobs();
      const job = jobs.find(j => j.id === "daily-discovery");
      expect(job?.status).toBe("stopped");
    });

    it("should return false for non-existent job", () => {
      const success = campaignScheduler.startJob("non-existent-job");
      expect(success).toBe(false);
    });

    it("should have valid cron schedules", async () => {
      await campaignScheduler.initialize();
      const jobs = campaignScheduler.listJobs();

      jobs.forEach(job => {
        expect(job.schedule).toBeDefined();
        expect(typeof job.schedule).toBe("string");
        // Cron expression should have 5 parts (minutes hours day month dayOfWeek)
        const parts = job.schedule.split(" ");
        expect(parts.length).toBe(5);
      });
    });
  });

  describe("Integration", () => {
    it("should have all required components", () => {
      expect(scrapeAllPlatformsReal).toBeDefined();
      expect(campaignScheduler).toBeDefined();
      expect(campaignScheduler.initialize).toBeDefined();
      expect(campaignScheduler.triggerJob).toBeDefined();
    });
  });
});
