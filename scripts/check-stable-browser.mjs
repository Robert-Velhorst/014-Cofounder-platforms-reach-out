import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/cofounder-discovery/package.json', import.meta.url));
const { chromium } = require('playwright');
if (process.argv.length !== 2) throw new Error('No arguments supported.');
const origin = 'http://127.0.0.1:3014';
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir('output', { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, locale: 'en-US', serviceWorkers: 'block' });
    const errors = [], external = [];
    await context.route('**/*', route => {
      const target = new URL(route.request().url());
      if (['http:', 'https:'].includes(target.protocol) && target.origin !== origin) { external.push(target.origin); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', event => { if (event.type() === 'error') errors.push(event.text()); });
    try {
      assert.equal((await page.goto(origin, { waitUntil: 'networkidle' })).status(), 200);
      await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
      assert.ok((await page.locator('body').innerText()).includes('CoFounder Outreach'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Home has horizontal overflow');
      await page.getByRole('link', { name: /^(Sign in|Inloggen)$/ }).first().click();
      await page.waitForURL(origin + '/login');
      await page.locator('#email').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#email').getAttribute('type'), 'email');
      assert.equal(await page.locator('#password').getAttribute('type'), 'password');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Login has horizontal overflow');
      await page.screenshot({ path: `output/stable-browser-${viewport.width}.png`, fullPage: true });
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
      results.push({ viewport, home: true, loginNavigation: true, realForm: true, horizontalOverflow: false, browserErrors: 0, externalRequests: 0 });
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const report = { browser: 'Chromium via Playwright 1.64.1', origin, syntheticOnly: true, messagesSent: 0, liveProvidersVerified: false, results };
await writeFile('output/stable-browser-verification.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
