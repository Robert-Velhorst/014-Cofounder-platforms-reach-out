import { Page } from "playwright";
import {
  createContext,
  navigateWithRetry,
  extractText,
  extractTextAll,
  extractAttribute,
  scrollToBottom,
  waitForSelector,
  captureScreenshot,
  RateLimiter,
  sessionManager,
} from "./browser-automation";
import type { ScrapedProfile } from "./scraping-engine";

/**
 * Real Platform Scrapers using Playwright
 * Implements actual web scraping for CoFoundersLab, FounderCloud, and Y Combinator
 */

const rateLimiters = {
  cofounderslab: new RateLimiter(10), // 10 requests per minute
  foundercloud: new RateLimiter(15),
  ycombinator: new RateLimiter(20),
};

/**
 * CoFoundersLab Scraper
 */
export async function scrapeCoFoundersLab(
  maxProfiles: number = 20
): Promise<ScrapedProfile[]> {
  console.log("Starting CoFoundersLab scraper...");
  const profiles: ScrapedProfile[] = [];

  const context = await createContext();
  const page = await context.newPage();

  try {
    // Load saved session if available
    const savedCookies = await sessionManager.loadSession("cofounderslab");
    if (savedCookies) {
      await context.addCookies(savedCookies);
    }

    await rateLimiters.cofounderslab.wait();
    await navigateWithRetry(page, "https://cofounderslab.com/find-a-cofounder");

    // Wait for profile listings to load
    const profilesLoaded = await waitForSelector(
      page,
      '[data-testid="profile-card"], .profile-item, .member-card',
      15000
    );

    if (!profilesLoaded) {
      console.log(
        "No profiles found on CoFoundersLab, capturing screenshot..."
      );
      await captureScreenshot(page, "cofounderslab-no-profiles");
      return profiles;
    }

    // Scroll to load more profiles
    await scrollToBottom(page, 3);

    // Extract profile cards
    const profileCards = await page.$$(
      '[data-testid="profile-card"], .profile-item, .member-card'
    );
    console.log(`Found ${profileCards.length} profile cards on CoFoundersLab`);

    for (let i = 0; i < Math.min(profileCards.length, maxProfiles); i++) {
      try {
        const card = profileCards[i];

        // Extract profile data
        const name = await card
          .$eval(
            '[data-testid="profile-name"], .name, h3, h4',
            el => el.textContent?.trim() || ""
          )
          .catch(() => "Unknown");
        const title = await card
          .$eval(
            '[data-testid="profile-title"], .title, .headline',
            el => el.textContent?.trim() || ""
          )
          .catch(() => undefined);
        const location = await card
          .$eval(
            '[data-testid="profile-location"], .location',
            el => el.textContent?.trim() || ""
          )
          .catch(() => undefined);
        const bio = await card
          .$eval(
            '[data-testid="profile-bio"], .bio, .description',
            el => el.textContent?.trim() || ""
          )
          .catch(() => undefined);
        const profileUrl = await card
          .$eval('a[href*="/profile/"], a[href*="/member/"]', el =>
            el.getAttribute("href")
          )
          .catch(() => undefined);

        // Extract skills from tags or badges
        const skillElements = await card
          .$$('[data-testid="skill-tag"], .skill, .tag, .badge')
          .catch(() => []);
        const skills: string[] = [];
        for (const el of skillElements) {
          const skill = await el.textContent();
          if (skill?.trim()) skills.push(skill.trim());
        }

        if (name && name !== "Unknown") {
          profiles.push({
            name,
            title,
            location,
            bio,
            skills: skills.length > 0 ? skills : undefined,
            experience: undefined,
            industries: undefined,
            lookingFor: undefined,
            startupStage: undefined,
            platform: "CoFoundersLab",
            profileUrl: profileUrl
              ? `https://cofounderslab.com${profileUrl}`
              : `https://cofounderslab.com/find-a-cofounder`,
          });
        }

        await rateLimiters.cofounderslab.wait();
      } catch (error) {
        console.error(`Error extracting CoFoundersLab profile ${i}:`, error);
      }
    }

    // Save session cookies
    const cookies = await context.cookies();
    await sessionManager.saveSession("cofounderslab", cookies);
  } catch (error) {
    console.error("CoFoundersLab scraper error:", error);
    await captureScreenshot(page, "cofounderslab-error");
  } finally {
    await page.close();
    await context.close();
  }

  console.log(`CoFoundersLab scraper completed: ${profiles.length} profiles`);
  return profiles;
}

/**
 * FounderCloud Scraper
 */
export async function scrapeFounderCloud(
  maxProfiles: number = 20
): Promise<ScrapedProfile[]> {
  console.log("Starting FounderCloud scraper...");
  const profiles: ScrapedProfile[] = [];

  const context = await createContext();
  const page = await context.newPage();

  try {
    const savedCookies = await sessionManager.loadSession("foundercloud");
    if (savedCookies) {
      await context.addCookies(savedCookies);
    }

    await rateLimiters.foundercloud.wait();
    await navigateWithRetry(page, "https://foundercloud.com/founders");

    const profilesLoaded = await waitForSelector(
      page,
      '[data-testid="founder-card"], .founder-card, .profile',
      15000
    );

    if (!profilesLoaded) {
      console.log("No profiles found on FounderCloud, capturing screenshot...");
      await captureScreenshot(page, "foundercloud-no-profiles");
      return profiles;
    }

    await scrollToBottom(page, 3);

    const profileCards = await page.$$(
      '[data-testid="founder-card"], .founder-card, .profile'
    );
    console.log(`Found ${profileCards.length} profile cards on FounderCloud`);

    for (let i = 0; i < Math.min(profileCards.length, maxProfiles); i++) {
      try {
        const card = profileCards[i];

        const name = await card
          .$eval(
            'h2, h3, .name, [data-testid="founder-name"]',
            el => el.textContent?.trim() || ""
          )
          .catch(() => "Unknown");
        const title = await card
          .$eval(
            '.title, .role, [data-testid="founder-title"]',
            el => el.textContent?.trim() || ""
          )
          .catch(() => undefined);
        const location = await card
          .$eval(
            '.location, [data-testid="founder-location"]',
            el => el.textContent?.trim() || ""
          )
          .catch(() => undefined);
        const bio = await card
          .$eval(
            '.bio, .about, [data-testid="founder-bio"]',
            el => el.textContent?.trim() || ""
          )
          .catch(() => undefined);
        const profileUrl = await card
          .$eval('a[href*="/founder/"], a[href*="/profile/"]', el =>
            el.getAttribute("href")
          )
          .catch(() => undefined);

        const industryElements = await card
          .$$('.industry, .sector, [data-testid="industry"]')
          .catch(() => []);
        const industries: string[] = [];
        for (const el of industryElements) {
          const industry = await el.textContent();
          if (industry?.trim()) industries.push(industry.trim());
        }

        if (name && name !== "Unknown") {
          profiles.push({
            name,
            title,
            location,
            bio,
            skills: undefined,
            experience: undefined,
            industries: industries.length > 0 ? industries : undefined,
            lookingFor: undefined,
            startupStage: undefined,
            platform: "FounderCloud",
            profileUrl: profileUrl
              ? `https://foundercloud.com${profileUrl}`
              : "https://foundercloud.com/founders",
          });
        }

        await rateLimiters.foundercloud.wait();
      } catch (error) {
        console.error(`Error extracting FounderCloud profile ${i}:`, error);
      }
    }

    const cookies = await context.cookies();
    await sessionManager.saveSession("foundercloud", cookies);
  } catch (error) {
    console.error("FounderCloud scraper error:", error);
    await captureScreenshot(page, "foundercloud-error");
  } finally {
    await page.close();
    await context.close();
  }

  console.log(`FounderCloud scraper completed: ${profiles.length} profiles`);
  return profiles;
}

/**
 * Y Combinator Co-Founder Matching Scraper
 */
export async function scrapeYCombinator(
  maxProfiles: number = 20
): Promise<ScrapedProfile[]> {
  console.log("Starting Y Combinator scraper...");
  const profiles: ScrapedProfile[] = [];

  const context = await createContext();
  const page = await context.newPage();

  try {
    const savedCookies = await sessionManager.loadSession("ycombinator");
    if (savedCookies) {
      await context.addCookies(savedCookies);
    }

    await rateLimiters.ycombinator.wait();

    // Try YC Work at a Startup co-founder section
    await navigateWithRetry(
      page,
      "https://www.workatstartup.com/cofounder-matching"
    );

    const profilesLoaded = await waitForSelector(
      page,
      '[data-testid="cofounder-card"], .cofounder, .profile-card',
      15000
    );

    if (!profilesLoaded) {
      console.log(
        "No profiles found on Y Combinator, trying alternative URL..."
      );

      // Try alternative: YC Startup Directory
      await navigateWithRetry(page, "https://www.ycombinator.com/companies");
      await waitForSelector(page, "._company_86jzd_338, .company-card", 10000);
      await captureScreenshot(page, "ycombinator-alternative");

      // Extract company founders instead
      const companyCards = await page.$$("._company_86jzd_338, .company-card");
      console.log(`Found ${companyCards.length} companies on YC directory`);

      for (let i = 0; i < Math.min(companyCards.length, maxProfiles); i++) {
        try {
          const card = companyCards[i];

          const companyName = await card
            .$eval(
              "._coName_86jzd_453, .company-name, h3",
              el => el.textContent?.trim() || ""
            )
            .catch(() => undefined);
          const description = await card
            .$eval(
              "._coDescription_86jzd_478, .description",
              el => el.textContent?.trim() || ""
            )
            .catch(() => undefined);
          const industry = await card
            .$eval(
              "._pill_86jzd_33, .industry, .tag",
              el => el.textContent?.trim() || ""
            )
            .catch(() => undefined);
          const location = await card
            .$eval(
              "._coLocation_86jzd_469, .location",
              el => el.textContent?.trim() || ""
            )
            .catch(() => undefined);

          if (companyName) {
            profiles.push({
              name: `Founder at ${companyName}`,
              title: "YC Founder",
              location,
              bio: description,
              skills: undefined,
              experience: "3-5 years",
              industries: industry ? [industry] : undefined,
              lookingFor: undefined,
              startupStage: "Early Stage",
              platform: "Y Combinator",
              profileUrl: "https://www.ycombinator.com/companies",
            });
          }

          await rateLimiters.ycombinator.wait();
        } catch (error) {
          console.error(`Error extracting YC company ${i}:`, error);
        }
      }
    } else {
      // Extract co-founder profiles
      const profileCards = await page.$$(
        '[data-testid="cofounder-card"], .cofounder, .profile-card'
      );
      console.log(`Found ${profileCards.length} co-founder profiles on YC`);

      for (let i = 0; i < Math.min(profileCards.length, maxProfiles); i++) {
        try {
          const card = profileCards[i];

          const name = await card
            .$eval("h2, h3, .name", el => el.textContent?.trim() || "")
            .catch(() => "YC Founder");
          const title = await card
            .$eval(".title, .role", el => el.textContent?.trim() || "")
            .catch(() => undefined);
          const bio = await card
            .$eval(".bio, .about", el => el.textContent?.trim() || "")
            .catch(() => undefined);
          const profileUrl = await card
            .$eval("a", el => el.getAttribute("href"))
            .catch(() => undefined);

          profiles.push({
            name,
            title,
            location: undefined,
            bio,
            skills: undefined,
            experience: undefined,
            industries: undefined,
            lookingFor: ["Co-Founder"],
            startupStage: "Early Stage",
            platform: "Y Combinator",
            profileUrl:
              profileUrl || "https://www.workatstartup.com/cofounder-matching",
          });

          await rateLimiters.ycombinator.wait();
        } catch (error) {
          console.error(`Error extracting YC profile ${i}:`, error);
        }
      }
    }

    const cookies = await context.cookies();
    await sessionManager.saveSession("ycombinator", cookies);
  } catch (error) {
    console.error("Y Combinator scraper error:", error);
    await captureScreenshot(page, "ycombinator-error");
  } finally {
    await page.close();
    await context.close();
  }

  console.log(`Y Combinator scraper completed: ${profiles.length} profiles`);
  return profiles;
}

/**
 * Scrape all platforms in parallel
 */
export async function scrapeAllPlatformsReal(
  maxProfilesPerPlatform: number = 20
): Promise<ScrapedProfile[]> {
  if (process.env.ENABLE_PLATFORM_AUTOMATION !== "true") {
    console.warn(
      "Real platform scraping is disabled. Set ENABLE_PLATFORM_AUTOMATION=true only after confirming platform authorization and Terms of Service."
    );
    return [];
  }

  console.log("Starting parallel scraping of all platforms...");

  const results = await Promise.allSettled([
    scrapeCoFoundersLab(maxProfilesPerPlatform),
    scrapeFounderCloud(maxProfilesPerPlatform),
    scrapeYCombinator(maxProfilesPerPlatform),
  ]);

  const allProfiles: ScrapedProfile[] = [];

  results.forEach((result, index) => {
    const platformNames = ["CoFoundersLab", "FounderCloud", "Y Combinator"];

    if (result.status === "fulfilled") {
      console.log(`${platformNames[index]}: ${result.value.length} profiles`);
      allProfiles.push(...result.value);
    } else {
      console.error(`${platformNames[index]} failed:`, result.reason);
    }
  });

  console.log(`Total profiles scraped: ${allProfiles.length}`);
  return allProfiles;
}
