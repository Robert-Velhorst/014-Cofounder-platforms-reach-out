import { chromium, Browser, BrowserContext, Page } from "playwright";

/**
 * Browser Automation Infrastructure
 * Manages headless browser instances for web scraping
 */

let browserInstance: Browser | null = null;

/**
 * Launch browser instance (singleton pattern)
 */
export async function launchBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  console.log("Launching Chromium browser...");

  browserInstance = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });

  console.log("Browser launched successfully");
  return browserInstance;
}

/**
 * Create new browser context with custom settings
 */
export async function createContext(options?: {
  userAgent?: string;
  viewport?: { width: number; height: number };
  locale?: string;
}): Promise<BrowserContext> {
  const browser = await launchBrowser();

  const context = await browser.newContext({
    userAgent:
      options?.userAgent ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: options?.viewport || { width: 1920, height: 1080 },
    locale: options?.locale || "en-US",
    timezoneId: "America/New_York",
  });

  return context;
}

/**
 * Navigate to URL with retry logic
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Navigating to ${url} (attempt ${attempt}/${maxRetries})`);

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait for page to be interactive
      await page
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => {
          // Ignore timeout, page might still be usable
        });

      console.log(`Successfully navigated to ${url}`);
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(`Navigation attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw new Error(
    `Failed to navigate to ${url} after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Take screenshot for debugging
 */
export async function captureScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const timestamp = Date.now();
  const filename = `/tmp/screenshot-${name}-${timestamp}.png`;

  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);

  return filename;
}

/**
 * Wait for selector with timeout
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`Selector not found: ${selector}`);
    return false;
  }
}

/**
 * Extract text content from selector
 */
export async function extractText(
  page: Page,
  selector: string
): Promise<string | null> {
  try {
    const element = await page.$(selector);
    if (!element) return null;

    const text = await element.textContent();
    return text?.trim() || null;
  } catch (error) {
    console.error(`Failed to extract text from ${selector}:`, error);
    return null;
  }
}

/**
 * Extract multiple text elements
 */
export async function extractTextAll(
  page: Page,
  selector: string
): Promise<string[]> {
  try {
    const elements = await page.$$(selector);
    const texts: string[] = [];

    for (const element of elements) {
      const text = await element.textContent();
      if (text?.trim()) {
        texts.push(text.trim());
      }
    }

    return texts;
  } catch (error) {
    console.error(`Failed to extract texts from ${selector}:`, error);
    return [];
  }
}

/**
 * Extract attribute from selector
 */
export async function extractAttribute(
  page: Page,
  selector: string,
  attribute: string
): Promise<string | null> {
  try {
    const element = await page.$(selector);
    if (!element) return null;

    const value = await element.getAttribute(attribute);
    return value;
  } catch (error) {
    console.error(
      `Failed to extract attribute ${attribute} from ${selector}:`,
      error
    );
    return null;
  }
}

/**
 * Scroll to load more content
 */
export async function scrollToBottom(
  page: Page,
  maxScrolls: number = 5
): Promise<void> {
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for content to load
    await page.waitForTimeout(1000);
  }
}

/**
 * Click element with retry
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.click(selector, { timeout: 5000 });
      return true;
    } catch (error) {
      console.error(`Click attempt ${attempt} failed for ${selector}:`, error);

      if (attempt < maxRetries) {
        await page.waitForTimeout(1000);
      }
    }
  }

  return false;
}

/**
 * Type text with human-like delays
 */
export async function typeHumanLike(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await page.click(selector);
  await page.waitForTimeout(500);

  for (const char of text) {
    await page.keyboard.type(char);
    await page.waitForTimeout(Math.random() * 100 + 50);
  }
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log("Browser closed");
  }
}

/**
 * Rate limiter for scraping
 */
export class RateLimiter {
  private lastRequest: number = 0;
  private minDelay: number;

  constructor(requestsPerMinute: number) {
    this.minDelay = (60 * 1000) / requestsPerMinute;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minDelay) {
      const delay = this.minDelay - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequest = Date.now();
  }
}

/**
 * Session manager for persistent cookies
 */
export class SessionManager {
  private sessions: Map<string, any> = new Map();

  async saveSession(platform: string, cookies: any[]): Promise<void> {
    this.sessions.set(platform, {
      cookies,
      timestamp: Date.now(),
    });
    console.log(`Session saved for ${platform}`);
  }

  async loadSession(platform: string): Promise<any[] | null> {
    const session = this.sessions.get(platform);

    if (!session) return null;

    // Check if session is still valid (24 hours)
    const age = Date.now() - session.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      this.sessions.delete(platform);
      return null;
    }

    return session.cookies;
  }

  clearSession(platform: string): void {
    this.sessions.delete(platform);
    console.log(`Session cleared for ${platform}`);
  }
}

export const sessionManager = new SessionManager();
