/**
 * Platform Automation Engine
 * Credential-aware automation for co-founder platforms
 * Uses Playwright (already installed) for headless browser control
 */

import { chromium, type Browser, type Page } from "playwright";
import { getDb } from "./db";
import {
  platformCredentials,
  automationJobs,
  aiActivityLog,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { decrypt, encrypt } from "./encryption";

// ============================================================
// Types
// ============================================================

export interface ProspectData {
  name: string;
  title?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  lookingFor?: string[];
  profileUrl?: string;
  platform: string;
  externalId?: string;
}

export interface AutomationResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

function isPlatformAutomationEnabled(): boolean {
  return process.env.ENABLE_PLATFORM_AUTOMATION === "true";
}

function automationDisabledResult(): AutomationResult {
  return {
    success: false,
    error:
      "Platform automation is disabled. Set ENABLE_PLATFORM_AUTOMATION=true only after confirming platform authorization and Terms of Service.",
  };
}

// ============================================================
// Credential Management
// ============================================================

export async function getCredentials(
  userId: number,
  platform: "founder_cloud" | "co_founders_lab" | "y_combinator"
): Promise<{
  username: string;
  password: string;
  credentialId: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const cred = await db
    .select()
    .from(platformCredentials)
    .where(
      and(
        eq(platformCredentials.userId, userId),
        eq(platformCredentials.platform, platform)
      )
    )
    .limit(1);

  if (!cred || cred.length === 0) return null;

  // Allow untested credentials too (first use)
  if (cred[0].status === "invalid" || cred[0].status === "suspended") {
    return null;
  }

  try {
    const username = decrypt(cred[0].encryptedUsername);
    const password = decrypt(cred[0].encryptedPassword);
    return { username, password, credentialId: cred[0].id };
  } catch {
    return null;
  }
}

export async function updateCredentialStatus(
  credentialId: number,
  status: "active" | "invalid" | "suspended" | "untested",
  error?: string,
  sessionCookies?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(platformCredentials)
    .set({
      status,
      lastTestedAt: new Date(),
      lastError: error || null,
      encryptedSessionData: sessionCookies
        ? encrypt(sessionCookies)
        : undefined,
      sessionExpiresAt: sessionCookies
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : undefined,
    })
    .where(eq(platformCredentials.id, credentialId));
}

export async function canSendMessage(credentialId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const cred = await db
    .select({
      count: platformCredentials.messagessentToday,
      limit: platformCredentials.dailyMessageLimit,
      lastReset: platformCredentials.lastResetAt,
    })
    .from(platformCredentials)
    .where(eq(platformCredentials.id, credentialId))
    .limit(1);

  if (!cred || cred.length === 0) return false;

  const today = new Date();
  const lastReset = cred[0].lastReset ? new Date(cred[0].lastReset) : null;
  const shouldReset =
    !lastReset || lastReset.toDateString() !== today.toDateString();

  if (shouldReset) return true;
  return (cred[0].count || 0) < (cred[0].limit || 5);
}

export async function incrementMessageCount(
  credentialId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const cred = await db
    .select({
      count: platformCredentials.messagessentToday,
      lastReset: platformCredentials.lastResetAt,
    })
    .from(platformCredentials)
    .where(eq(platformCredentials.id, credentialId))
    .limit(1);

  if (!cred || cred.length === 0) return;

  const today = new Date();
  const lastReset = cred[0].lastReset ? new Date(cred[0].lastReset) : null;
  const shouldReset =
    !lastReset || lastReset.toDateString() !== today.toDateString();

  await db
    .update(platformCredentials)
    .set({
      messagessentToday: shouldReset ? 1 : (cred[0].count || 0) + 1,
      lastResetAt: shouldReset ? today : undefined,
      lastUsedAt: today,
    })
    .where(eq(platformCredentials.id, credentialId));
}

// ============================================================
// Browser Helpers
// ============================================================

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min = 1500, max = 4000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function humanType(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await page.click(selector);
  await randomDelay(300, 700);
  for (const char of text) {
    await page.keyboard.type(char);
    await new Promise(r => setTimeout(r, Math.random() * 80 + 30));
  }
}

async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

// ============================================================
// Founder Cloud Automation
// ============================================================

export async function founderCloudLogin(
  username: string,
  password: string
): Promise<{ success: boolean; cookies?: string; error?: string }> {
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    await page.goto("https://foundercloud.io/login", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    // Fill login form
    const emailSelector =
      'input[type="email"], input[name="email"], input[placeholder*="email" i]';
    const passwordSelector = 'input[type="password"]';

    await page.waitForSelector(emailSelector, { timeout: 10000 });
    await humanType(page, emailSelector, username);
    await randomDelay(500, 1000);
    await humanType(page, passwordSelector, password);
    await randomDelay(500, 1000);

    // Submit
    await page.keyboard.press("Enter");
    await page
      .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
      .catch(() => {});
    await randomDelay(1000, 2000);

    // Check for successful login
    const currentUrl = page.url();
    const isLoggedIn =
      !currentUrl.includes("/login") && !currentUrl.includes("/signin");

    if (!isLoggedIn) {
      return { success: false, error: "Login failed - check credentials" };
    }

    // Save cookies
    const cookies = await context.cookies();
    await browser.close();
    return { success: true, cookies: JSON.stringify(cookies) };
  } catch (error) {
    await browser?.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function founderCloudDiscoverProspects(
  username: string,
  password: string,
  searchCriteria: {
    skills?: string[];
    industries?: string[];
    location?: string;
    maxResults?: number;
  }
): Promise<ProspectData[]> {
  let browser: Browser | null = null;
  const prospects: ProspectData[] = [];

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    // Login first
    await page.goto("https://foundercloud.io/login", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    const emailSelector = 'input[type="email"], input[name="email"]';
    const passwordSelector = 'input[type="password"]';

    try {
      await page.waitForSelector(emailSelector, { timeout: 10000 });
      await humanType(page, emailSelector, username);
      await randomDelay(500, 1000);
      await humanType(page, passwordSelector, password);
      await randomDelay(500, 1000);
      await page.keyboard.press("Enter");
      await page
        .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
        .catch(() => {});
      await randomDelay(2000, 3000);
    } catch {
      await browser.close();
      return [];
    }

    // Navigate to co-founder search
    await page.goto("https://foundercloud.io/cofounders", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(2000, 3000);

    // Scroll to load profiles
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await randomDelay(1500, 2500);
    }

    // Extract profile cards
    const profileData = await page.evaluate(() => {
      const cards: Array<{
        name: string;
        title?: string;
        location?: string;
        bio?: string;
        skills?: string[];
        profileUrl?: string;
      }> = [];

      // Generic selectors that may match profile cards
      const cardSelectors = [
        '[class*="profile-card"]',
        '[class*="founder-card"]',
        '[class*="member-card"]',
        '[class*="user-card"]',
        ".card",
      ];

      let cardElements: NodeListOf<Element> | null = null;
      for (const sel of cardSelectors) {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          cardElements = found;
          break;
        }
      }

      if (!cardElements) return cards;

      cardElements.forEach(card => {
        const nameEl = card.querySelector('h2, h3, [class*="name"]');
        const titleEl = card.querySelector(
          '[class*="title"], [class*="role"], p'
        );
        const locationEl = card.querySelector('[class*="location"]');
        const bioEl = card.querySelector(
          '[class*="bio"], [class*="description"]'
        );
        const linkEl = card.querySelector(
          'a[href*="/profile"], a[href*="/user"]'
        );
        const skillEls = card.querySelectorAll(
          '[class*="skill"], [class*="tag"]'
        );

        if (nameEl?.textContent?.trim()) {
          cards.push({
            name: nameEl.textContent.trim(),
            title: titleEl?.textContent?.trim(),
            location: locationEl?.textContent?.trim(),
            bio: bioEl?.textContent?.trim(),
            skills: Array.from(skillEls)
              .map(el => el.textContent?.trim() || "")
              .filter(Boolean),
            profileUrl: linkEl?.getAttribute("href") || undefined,
          });
        }
      });

      return cards;
    });

    for (const p of profileData.slice(0, searchCriteria.maxResults || 20)) {
      prospects.push({
        ...p,
        platform: "founder_cloud",
      });
    }

    await browser.close();
  } catch (error) {
    await browser?.close();
    console.error("Founder Cloud discovery error:", error);
  }

  return prospects;
}

export async function founderCloudSendMessage(
  username: string,
  password: string,
  profileUrl: string,
  message: string
): Promise<AutomationResult> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    // Login
    await page.goto("https://foundercloud.io/login", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    const emailSelector = 'input[type="email"], input[name="email"]';
    const passwordSelector = 'input[type="password"]';

    await page.waitForSelector(emailSelector, { timeout: 10000 });
    await humanType(page, emailSelector, username);
    await randomDelay(500, 1000);
    await humanType(page, passwordSelector, password);
    await randomDelay(500, 1000);
    await page.keyboard.press("Enter");
    await page
      .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
      .catch(() => {});
    await randomDelay(2000, 3000);

    // Navigate to profile
    const fullUrl = profileUrl.startsWith("http")
      ? profileUrl
      : `https://foundercloud.io${profileUrl}`;
    await page.goto(fullUrl, { timeout: 30000, waitUntil: "domcontentloaded" });
    await randomDelay(2000, 3000);

    // Find and click message button
    const msgButtonSelectors = [
      'button[class*="message"]',
      'a[class*="message"]',
      'button:has-text("Message")',
      'button:has-text("Connect")',
      '[data-action="message"]',
    ];

    let clicked = false;
    for (const sel of msgButtonSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        clicked = true;
        break;
      } catch {}
    }

    if (!clicked) {
      await browser.close();
      return {
        success: false,
        error: "Could not find message button on profile",
      };
    }

    await randomDelay(1000, 2000);

    // Find message textarea and type message
    const textareaSelectors = [
      'textarea[placeholder*="message" i]',
      'textarea[name="message"]',
      'div[contenteditable="true"]',
      "textarea",
    ];

    let typed = false;
    for (const sel of textareaSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        await humanType(page, sel, message);
        typed = true;
        break;
      } catch {}
    }

    if (!typed) {
      await browser.close();
      return { success: false, error: "Could not find message input field" };
    }

    await randomDelay(1000, 2000);

    // Submit message
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button:has-text("Submit")',
    ];

    for (const sel of submitSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        break;
      } catch {}
    }

    await randomDelay(2000, 3000);
    await browser.close();

    return {
      success: true,
      message: "Message sent successfully on Founder Cloud",
    };
  } catch (error) {
    await browser?.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Co-Founders Lab Automation
// ============================================================

export async function coFoundersLabLogin(
  username: string,
  password: string
): Promise<{ success: boolean; cookies?: string; error?: string }> {
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    await page.goto("https://www.cofounderslab.com/login", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    await page.waitForSelector('input[name="email"], input[type="email"]', {
      timeout: 10000,
    });
    await humanType(page, 'input[name="email"], input[type="email"]', username);
    await randomDelay(500, 1000);
    await humanType(page, 'input[type="password"]', password);
    await randomDelay(500, 1000);

    await page.click('button[type="submit"], input[type="submit"]');
    await page
      .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
      .catch(() => {});
    await randomDelay(1500, 2500);

    const currentUrl = page.url();
    const isLoggedIn =
      !currentUrl.includes("/login") && !currentUrl.includes("/signin");

    if (!isLoggedIn) {
      await browser.close();
      return { success: false, error: "Login failed - check credentials" };
    }

    const cookies = await context.cookies();
    await browser.close();
    return { success: true, cookies: JSON.stringify(cookies) };
  } catch (error) {
    await browser?.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function coFoundersLabSendMessage(
  username: string,
  password: string,
  profileUrl: string,
  message: string
): Promise<AutomationResult> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    // Login
    await page.goto("https://www.cofounderslab.com/login", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    await page.waitForSelector('input[name="email"], input[type="email"]', {
      timeout: 10000,
    });
    await humanType(page, 'input[name="email"], input[type="email"]', username);
    await randomDelay(500, 1000);
    await humanType(page, 'input[type="password"]', password);
    await randomDelay(500, 1000);
    await page.click('button[type="submit"], input[type="submit"]');
    await page
      .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
      .catch(() => {});
    await randomDelay(2000, 3000);

    // Navigate to profile
    const fullUrl = profileUrl.startsWith("http")
      ? profileUrl
      : `https://www.cofounderslab.com${profileUrl}`;
    await page.goto(fullUrl, { timeout: 30000, waitUntil: "domcontentloaded" });
    await randomDelay(2000, 3000);

    // Click message/connect button
    const msgSelectors = [
      'a:has-text("Message")',
      'button:has-text("Message")',
      'a:has-text("Connect")',
      'button:has-text("Connect")',
      '[class*="message-btn"]',
    ];

    let clicked = false;
    for (const sel of msgSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        clicked = true;
        break;
      } catch {}
    }

    if (!clicked) {
      await browser.close();
      return { success: false, error: "Could not find message/connect button" };
    }

    await randomDelay(1000, 2000);

    // Type message
    const textareaSelectors = [
      "textarea",
      'div[contenteditable="true"]',
      'input[type="text"]',
    ];
    let typed = false;
    for (const sel of textareaSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        await humanType(page, sel, message);
        typed = true;
        break;
      } catch {}
    }

    if (!typed) {
      await browser.close();
      return { success: false, error: "Could not find message input" };
    }

    await randomDelay(1000, 2000);

    // Send
    try {
      await page.click('button[type="submit"], button:has-text("Send")', {
        timeout: 5000,
      });
    } catch {}

    await randomDelay(2000, 3000);
    await browser.close();

    return { success: true, message: "Message sent on Co-Founders Lab" };
  } catch (error) {
    await browser?.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Y Combinator Automation
// ============================================================

export async function ycombinatorLogin(
  username: string,
  password: string
): Promise<{ success: boolean; cookies?: string; error?: string }> {
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    await page.goto("https://account.ycombinator.com/sign-in", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    });
    await humanType(page, 'input[type="email"], input[name="email"]', username);
    await randomDelay(500, 1000);
    await humanType(page, 'input[type="password"]', password);
    await randomDelay(500, 1000);

    await page.click('button[type="submit"]');
    await page
      .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
      .catch(() => {});
    await randomDelay(1500, 2500);

    const currentUrl = page.url();
    const isLoggedIn =
      !currentUrl.includes("/sign-in") && !currentUrl.includes("/login");

    if (!isLoggedIn) {
      await browser.close();
      return { success: false, error: "Login failed - check credentials" };
    }

    const cookies = await context.cookies();
    await browser.close();
    return { success: true, cookies: JSON.stringify(cookies) };
  } catch (error) {
    await browser?.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function ycombinatorSendMessage(
  username: string,
  password: string,
  profileUrl: string,
  message: string
): Promise<AutomationResult> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    // Login to YC
    await page.goto("https://account.ycombinator.com/sign-in", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(1000, 2000);

    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    });
    await humanType(page, 'input[type="email"], input[name="email"]', username);
    await randomDelay(500, 1000);
    await humanType(page, 'input[type="password"]', password);
    await randomDelay(500, 1000);
    await page.click('button[type="submit"]');
    await page
      .waitForNavigation({ timeout: 15000, waitUntil: "networkidle" })
      .catch(() => {});
    await randomDelay(2000, 3000);

    // Navigate to co-founder matching
    await page.goto("https://www.ycombinator.com/cofounder-matching", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
    await randomDelay(2000, 3000);

    // Navigate to specific profile if URL provided
    if (profileUrl) {
      const fullUrl = profileUrl.startsWith("http")
        ? profileUrl
        : `https://www.ycombinator.com${profileUrl}`;
      await page.goto(fullUrl, {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      });
      await randomDelay(2000, 3000);
    }

    // Find and click message button
    const msgSelectors = [
      'button:has-text("Message")',
      'a:has-text("Message")',
      'button:has-text("Connect")',
      '[class*="message"]',
    ];

    let clicked = false;
    for (const sel of msgSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        clicked = true;
        break;
      } catch {}
    }

    if (!clicked) {
      await browser.close();
      return {
        success: false,
        error: "Could not find message button on YC profile",
      };
    }

    await randomDelay(1000, 2000);

    // Type message
    const textareaSelectors = ["textarea", 'div[contenteditable="true"]'];
    let typed = false;
    for (const sel of textareaSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        await humanType(page, sel, message);
        typed = true;
        break;
      } catch {}
    }

    if (!typed) {
      await browser.close();
      return { success: false, error: "Could not find message input" };
    }

    await randomDelay(1000, 2000);

    // Send
    try {
      await page.click('button[type="submit"], button:has-text("Send")', {
        timeout: 5000,
      });
    } catch {}

    await randomDelay(2000, 3000);
    await browser.close();

    return { success: true, message: "Message sent on Y Combinator" };
  } catch (error) {
    await browser?.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Unified Outreach Function
// ============================================================

export async function sendPlatformMessage(
  userId: number,
  platform: "founder_cloud" | "co_founders_lab" | "y_combinator",
  profileUrl: string,
  message: string
): Promise<AutomationResult> {
  if (!isPlatformAutomationEnabled()) {
    return automationDisabledResult();
  }

  // Get credentials
  const creds = await getCredentials(userId, platform);
  if (!creds) {
    return {
      success: false,
      error: `No active credentials found for ${platform}`,
    };
  }

  // Check daily limit
  const canSend = await canSendMessage(creds.credentialId);
  if (!canSend) {
    return {
      success: false,
      error: "Daily message limit reached for this platform",
    };
  }

  // Execute platform-specific send
  let result: AutomationResult;
  switch (platform) {
    case "founder_cloud":
      result = await founderCloudSendMessage(
        creds.username,
        creds.password,
        profileUrl,
        message
      );
      break;
    case "co_founders_lab":
      result = await coFoundersLabSendMessage(
        creds.username,
        creds.password,
        profileUrl,
        message
      );
      break;
    case "y_combinator":
      result = await ycombinatorSendMessage(
        creds.username,
        creds.password,
        profileUrl,
        message
      );
      break;
    default:
      return { success: false, error: "Unknown platform" };
  }

  // Update counters if successful
  if (result.success) {
    await incrementMessageCount(creds.credentialId);
    await updateCredentialStatus(creds.credentialId, "active");
  } else if (
    result.error?.includes("Login failed") ||
    result.error?.includes("credentials")
  ) {
    await updateCredentialStatus(creds.credentialId, "invalid", result.error);
  }

  return result;
}

// ============================================================
// Test Login Function
// ============================================================

export async function testPlatformLogin(
  userId: number,
  platform: "founder_cloud" | "co_founders_lab" | "y_combinator"
): Promise<AutomationResult> {
  if (!isPlatformAutomationEnabled()) {
    return automationDisabledResult();
  }

  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  const cred = await db
    .select()
    .from(platformCredentials)
    .where(
      and(
        eq(platformCredentials.userId, userId),
        eq(platformCredentials.platform, platform)
      )
    )
    .limit(1);

  if (!cred || cred.length === 0) {
    return { success: false, error: "No credentials found" };
  }

  let username: string, password: string;
  try {
    username = decrypt(cred[0].encryptedUsername);
    password = decrypt(cred[0].encryptedPassword);
  } catch {
    return { success: false, error: "Failed to decrypt credentials" };
  }

  let loginResult: { success: boolean; cookies?: string; error?: string };

  switch (platform) {
    case "founder_cloud":
      loginResult = await founderCloudLogin(username, password);
      break;
    case "co_founders_lab":
      loginResult = await coFoundersLabLogin(username, password);
      break;
    case "y_combinator":
      loginResult = await ycombinatorLogin(username, password);
      break;
    default:
      return { success: false, error: "Unknown platform" };
  }

  // Update credential status
  await updateCredentialStatus(
    cred[0].id,
    loginResult.success ? "active" : "invalid",
    loginResult.error,
    loginResult.cookies
  );

  return {
    success: loginResult.success,
    message: loginResult.success
      ? "Login successful! Credentials are valid."
      : "Login failed",
    error: loginResult.error,
  };
}
