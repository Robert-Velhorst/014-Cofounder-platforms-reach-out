// Maintained synthetic journey, adapted from the reviewed 68-source archive.
// No provider traffic, production database, registration delivery or real send.
// Execute only through the owned network-none fixture harness.
import { createRequire } from "node:module";
import {
  BROWSER_JOURNEY_STAGES,
  validateBrowserFixtureDatabase,
  redactBrowserFailure,
} from "./browser-journey-policy.mjs";
import { runSyntheticOnboardingJourney } from "./browser-onboarding-journey.mjs";
const require = createRequire(import.meta.url);
const { randomUUID, randomBytes, scryptSync } = require("node:crypto"),
  assert = require("node:assert/strict");
if (process.env.RUN_SYNTHETIC_BROWSER_JOURNEY !== "true")
  throw new Error("synthetic_browser_journey_not_authorized");
const fs = require("node:fs/promises");
const secretValues = [];
let activeStage = "startup";
function redact(value) {
  return redactBrowserFailure(value, secretValues);
}
for (const kind of ["unhandledRejection", "uncaughtException"])
  process.on(kind, () => {
    console.error(
      JSON.stringify({
        event: "browser_journey_process_failure",
        kind,
        stage: activeStage,
      })
    );
    process.exit(1);
  });
const watchdog = setTimeout(() => {
  console.error(
    JSON.stringify({ event: "browser_journey_timeout", stage: activeStage })
  );
  process.exit(1);
}, 540000);
watchdog.unref();
const req = createRequire("/app/apps/cofounder-discovery/package.json"),
  { chromium: pw } = req("playwright"),
  mysql = req("mysql2/promise");
const catalogue = req(
  "./dist/synthetic-browser-catalogue.cjs"
).publicPlatformCatalogue();
assert.equal(catalogue.length, 69, "review_browser_catalogue_increment");
assert.equal(
  catalogue.filter(row => row.workflowReview === "manual-reviewed").length,
  23
);
assert.equal(
  catalogue.filter(row => row.workflowReview === "discovery-only").length,
  46
);
const origin = "http://localhost:13216",
  stages = [],
  errors = [],
  expectedDiagnostics = [],
  external = [];
let browser, db, page;
async function stage(name, run) {
  assert.equal(
    name,
    BROWSER_JOURNEY_STAGES[stages.length],
    "browser_stage_order_changed"
  );
  activeStage = name;
  await run();
  stages.push(name);
  console.log(JSON.stringify({ stage: name }));
}
(async () => {
  try {
    assert.equal(process.getuid(), 1000);
    assert.equal(
      process.env.E2E_DISPOSABLE_CONFIRM,
      "local-isolated-mysql-test"
    );
    if (process.env.DATABASE_URL !== undefined)
      throw new Error("inline_browser_database_url_refused");
    const databaseUrl = await fs.readFile("/run/secrets/database_url", "utf8");
    secretValues.push(databaseUrl);
    const u = validateBrowserFixtureDatabase(
      databaseUrl,
      process.env.BROWSER_JOURNEY_OWNER
    );
    secretValues.push(u.password);
    let ready = false;
    for (let i = 0; i < 150; i++) {
      try {
        if (
          (
            await fetch(origin + "/api/ready", {
              signal: AbortSignal.timeout(2000),
            })
          ).ok
        ) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    assert.ok(ready, "runtime ready");
    db = await mysql.createConnection(databaseUrl);
    const email = `conversation-${randomUUID()}@example.invalid`,
      password = randomBytes(32).toString("base64url"),
      salt = randomBytes(16),
      hash =
        "scrypt$" +
        salt.toString("base64url") +
        "$" +
        scryptSync(password, salt, 64).toString("base64url");
    secretValues.push(password, hash, salt.toString("base64url"));
    const [created] = await db.execute(
      "INSERT INTO users (openId,name,email,password_hash,emailVerified,loginMethod) VALUES (?,?,?,?,1,'local')",
      [randomUUID(), "Synthetic conversation owner", email, hash]
    );
    const owner = created.insertId;
    const foreignEmail = randomUUID() + "@example.invalid";
    const [foreign] = await db.execute(
      "INSERT INTO users (openId,name,email,password_hash,emailVerified,loginMethod) VALUES (?,?,?,?,1,'local')",
      [randomUUID(), "Synthetic foreign owner", foreignEmail, hash]
    );
    await db.execute(
      "INSERT INTO prospects (user_id,name,platform,source_kind,consent_status) VALUES (?,'Foreign export exclusion marker','manual','manual','unknown')",
      [foreign.insertId]
    );
    browser = await pw.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
      headless: true,
    });
    const context = await browser.newContext({
      acceptDownloads: true,
      serviceWorkers: "block",
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: { width: 1365, height: 1000 },
      timezoneId: "Europe/Amsterdam",
    });
    await context.route("**/*", async route => {
      if (new URL(route.request().url()).origin !== origin) {
        external.push(route.request().url());
        await route.abort();
      } else await route.continue();
    });
    context.setDefaultTimeout(12000);
    context.setDefaultNavigationTimeout(20000);
    context.on("page", observed => {
      observed.on("pageerror", e => errors.push(e.message));
      observed.on("console", e => {
        if (["error", "warning"].includes(e.type())) errors.push(e.text());
      });
    });
    page = await context.newPage();
    page.setDefaultTimeout(12000);
    let candidate, id;
    await stage("normal-and-hover-login-text-contrast", async () => {
      await page.goto(origin + "/login");
      const button = page.getByRole("button", { name: "Sign in", exact: true });
      await button.waitFor();
      async function measure(state) {
        const proof = await button.evaluate(el => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          const chain = [];
          for (let p = el; p; p = p.parentElement) chain.unshift(p);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 1, 1);
          for (const p of chain) {
            const s = getComputedStyle(p);
            if (s.backgroundImage !== "none")
              throw Error("Gradient needs separate contrast analysis");
            ctx.fillStyle = s.backgroundColor;
            ctx.fillRect(0, 0, 1, 1);
          }
          const bg = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
          const style = getComputedStyle(el);
          ctx.fillStyle = style.color;
          ctx.fillRect(0, 0, 1, 1);
          const fg = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
          const luminance = rgb =>
            rgb
              .map(v => v / 255)
              .map(v =>
                v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
              )
              .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
          const a = luminance(fg),
            b = luminance(bg);
          return {
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            foreground: fg,
            background: bg,
            fontSize: style.fontSize,
            theme: document.documentElement.className,
          };
        });
        console.log(JSON.stringify({ contrast: state, ...proof }));
        assert.ok(
          proof.ratio >= 4.5,
          `${state} button text contrast ${proof.ratio} < 4.5`
        );
      }
      await measure("normal");
      await button.hover();
      await page.waitForTimeout(250);
      await measure("hover");
      await page.mouse.move(0, 0);
    });
    await stage("responsive-login-headings-and-keyboard-form", async () => {
      await page.goto(origin + "/login");
      const title = page.getByRole("heading", {
        level: 1,
        name: "Sign in",
        exact: true,
      });
      const form = page.getByRole("form", { name: "Sign in", exact: true });
      await title.waitFor();
      for (const [width, height] of [
        [375, 812],
        [768, 1024],
        [1440, 1000],
      ]) {
        await page.setViewportSize({ width, height });
        assert.equal(await title.isVisible(), true);
        assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        await page.screenshot({ path: `/task-output/login-${width}.png` });
      }
      // Native keyboard traversal from a fresh document; no forced focus.
      await page.reload();
      await title.waitFor();
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .getByLabel("Interface language", { exact: true })
          .evaluate(el => el === document.activeElement),
        true
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .getByRole("link", { name: "Help (opens in a new tab)", exact: true })
          .evaluate(el => el === document.activeElement),
        true
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await form
          .getByLabel("Email", { exact: true })
          .evaluate(el => el === document.activeElement),
        true
      );
      await page.keyboard.type(email);
      await page.keyboard.press("Tab");
      assert.equal(
        await form
          .getByLabel("Password", { exact: true })
          .evaluate(el => el === document.activeElement),
        true
      );
      await page.keyboard.type(password);
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .getByRole("link", { name: "Forgot your password?", exact: true })
          .evaluate(el => el === document.activeElement),
        true
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .getByRole("button", { name: "Sign in", exact: true })
          .evaluate(el => el === document.activeElement),
        true
      );
      // Inspect registration title without submitting an account request.
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await page
        .getByRole("heading", {
          level: 1,
          name: "Create an account",
          exact: true,
        })
        .waitFor();
      await page
        .getByRole("form", { name: "Create an account", exact: true })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Already have an account? Sign in",
          exact: true,
        })
        .click();
      await title.waitFor();
      await page.setViewportSize({ width: 1365, height: 1000 });
    });
    await stage("real-login-and-compiled-workspace", async () => {
      await page.goto(origin + "/login");
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page
        .getByRole("button", { name: "Add individual candidate", exact: true })
        .waitFor();
      assert.equal(await page.title(), "CoFounder Outreach");
      assert.equal(new URL(page.url()).pathname, "/outreach");
      assert.equal(await page.locator("vite-error-overlay").count(), 0);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: "/task-output/workspace-desktop.png" });
      await page.setViewportSize({ width: 375, height: 812 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({ path: "/task-output/workspace-mobile.png" });
      await page.setViewportSize({ width: 1365, height: 1000 });
    });
    await stage(
      "current-catalogue-alias-search-and-responsive-rules",
      async () => {
        await page
          .getByRole("tab", { name: "Find platforms", exact: true })
          .click();
        const section = page.getByRole("region", {
          name: "Co-founder discovery catalogue",
          exact: true,
        });
        await section
          .getByRole("status")
          .getByText(
            `${catalogue.length} of ${catalogue.length} discovery records. No verified live integrations.`,
            { exact: true }
          )
          .waitFor();
        const search = section.getByLabel(
          "Search name, alias, audience or region",
          { exact: true }
        );
        assert.equal(
          await section.getByRole("heading", { level: 3 }).count(),
          catalogue.length
        );
        for (const [query, name, href] of [
          ["WASL Network", "WASL Network (MENA)", "https://wasl-network.com/"],
          [
            "wasl-network.com",
            "WASL Network (MENA)",
            "https://wasl-network.com/",
          ],
          ["founderbro", "founderbro (Indonesia)", "https://founderbro.id/"],
          [
            "Cofondateur.fr",
            "Cofondateur.fr (France)",
            "https://www.cofondateur.fr/",
          ],
          ["cofoundr.fr", "Cofoundr (France beta)", "https://cofoundr.fr/"],
          [
            "CoFoundry étudiants",
            "CoFoundry (France students)",
            "https://www.cofoundry.fr/etudiants",
          ],
          [
            "Cyberport",
            "Cyberport / CSAA (Hong Kong)",
            "https://www.cyberport.hk/entrepreneurship/cyberport_network/",
          ],
          [
            "數碼港",
            "Cyberport / CSAA (Hong Kong)",
            "https://www.cyberport.hk/entrepreneurship/cyberport_network/",
          ],
          [
            "CSAA",
            "Cyberport / CSAA (Hong Kong)",
            "https://www.cyberport.hk/entrepreneurship/cyberport_network/",
          ],
          [
            "Communitech",
            "Communitech (Ontario, Canada)",
            "https://www.communitech.ca/founders/apply/",
          ],
          [
            "Communitech Founder Connect",
            "Communitech (Ontario, Canada)",
            "https://www.communitech.ca/founders/apply/",
          ],
          [
            "Ontario Canada",
            "Communitech (Ontario, Canada)",
            "https://www.communitech.ca/founders/apply/",
          ],
          [
            "iHUB Nairobi",
            "CcHUB / iHUB (Nigeria and Kenya)",
            "https://cchub.africa/",
          ],
          [
            "CcHUB Nigeria",
            "CcHUB / iHUB (Nigeria and Kenya)",
            "https://cchub.africa/",
          ],
          [
            "IHN",
            "Impact Hub Nairobi (Kenya)",
            "https://nairobi.impacthub.net/memberships/",
          ],
          [
            "ImpactHub Nairobi",
            "Impact Hub Nairobi (Kenya)",
            "https://nairobi.impacthub.net/memberships/",
          ],
          [
            "DSG Denmark",
            "Danish Startup Group (Denmark)",
            "https://www.danishstartupgroup.com/",
          ],
          [
            "København",
            "Danish Startup Group (Denmark)",
            "https://www.danishstartupgroup.com/",
          ],
          [
            "Norrsken Stockholm",
            "Norrsken House Stockholm (Sweden)",
            "https://www.norrsken.org/houses/stockholm",
          ],
          [
            "Sverige",
            "Norrsken House Stockholm (Sweden)",
            "https://www.norrsken.org/houses/stockholm",
          ],
          [
            "Startup Lab Norway",
            "Startuplab (Norway)",
            "https://www.startuplab.no/incubator",
          ],
          [
            "Norge",
            "Startuplab (Norway)",
            "https://www.startuplab.no/incubator",
          ],
          [
            "Startuplab Bergen",
            "Startuplab (Norway)",
            "https://www.startuplab.no/incubator",
          ],
          [
            "NZ startup noticeboard",
            "startups.org.nz (Aotearoa New Zealand)",
            "https://startups.org.nz/",
          ],
          [
            "Fishburners Founder Passport",
            "Fishburners (Australia)",
            "https://fishburners.org/",
          ],
          [
            "Fiji Innovation Activator",
            "Fiji Innovation Hub",
            "https://fijiinnovationhub.com/",
          ],
          [
            "Астана Хаб",
            "Astana Hub (Kazakhstan)",
            "https://astanahub.com/en/startup/",
          ],
          [
            "Қазақстан",
            "Astana Hub (Kazakhstan)",
            "https://astanahub.com/en/startup/",
          ],
          [
            "O‘zbekiston",
            "Startup Base (Uzbekistan)",
            "https://startupbase.uz/en",
          ],
          [
            "Узбекистан",
            "Startup Base (Uzbekistan)",
            "https://startupbase.uz/en",
          ],
          [
            "Tech Beach Retreat",
            "TechBeach Retreat (Caribbean)",
            "https://www.techbeach.net/",
          ],
          [
            "TBR Lab",
            "TechBeach Retreat (Caribbean)",
            "https://www.techbeach.net/",
          ],
          [
            "P18 Puerto Rico",
            "Parallel18 (Puerto Rico)",
            "https://parallel18.com/",
          ],
          ["Xpand", "Parallel18 (Puerto Rico)", "https://parallel18.com/"],
        ]) {
          await search.fill(query);
          await section
            .getByRole("status")
            .getByText(
              `1 of ${catalogue.length} discovery records. No verified live integrations.`,
              { exact: true }
            )
            .waitFor();
          const link = section.getByRole("link", {
            name: `Visit ${name} (new tab)`,
            exact: true,
          });
          assert.equal(await link.getAttribute("href"), href);
          assert.equal(await link.getAttribute("target"), "_blank");
          assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
          assert.equal(
            await section.getByText("Not connected", { exact: true }).count(),
            1
          );
          const evidence = section.getByText(
            "Source evidence and review limitations",
            { exact: true }
          );
          // Repeated alias searches can retain the same keyed card's open panel.
          if (!(await evidence.evaluate(el => el.closest("details").open)))
            await evidence.click();
          await section
            .getByText(/Public-page review, not an authenticated workflow test/)
            .waitFor();
        }
        await search.fill("Cyberport");
        await section
          .getByRole("heading", {
            level: 3,
            name: "Cyberport / CSAA (Hong Kong)",
            exact: true,
          })
          .waitFor();
        await section
          .getByText(/CSAA corporate membership is restricted/)
          .waitFor();
        await section.getByText(/HKD 400,000/).waitFor();
        await section
          .getByText(
            /Public privacy policy is not third-party reuse permission/
          )
          .waitFor();
        const cdp = await context.newCDPSession(page);
        await cdp.send("DOM.enable");
        await cdp.send("CSS.enable");
        await cdp.send("DOM.getDocument", { depth: -1 });
        const { result: aliasNode } = await cdp.send("Runtime.evaluate", {
          expression:
            'Array.from(document.querySelectorAll("p")).find(p => p.textContent.startsWith("Also known as: Cyberport"))',
        });
        assert.ok(aliasNode.objectId);
        const { nodeId: aliasId } = await cdp.send("DOM.requestNode", {
          objectId: aliasNode.objectId,
        });
        const { fonts: renderedFonts } = await cdp.send(
          "CSS.getPlatformFontsForNode",
          { nodeId: aliasId }
        );
        console.log(
          JSON.stringify({
            checkpoint: "actual_alias_platform_fonts",
            fonts: renderedFonts,
          })
        );
        assert.ok(
          renderedFonts.some(
            font =>
              /^NotoSansCJK/i.test(font.postScriptName) && font.glyphCount === 3
          ),
          "test-image CJK font renders the three Traditional Chinese alias glyphs"
        );
        await cdp.detach();
        assert.equal(
          await section
            .getByRole("button", { name: /^(Connect|Generate|Send)$/ })
            .count(),
          0
        );
        await section.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/hong-kong-catalogue-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await section.scrollIntoViewIfNeeded();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          true
        );
        await page.screenshot({
          path: "/task-output/hong-kong-catalogue-mobile.png",
        });
        await section
          .getByText(
            /Public privacy policy is not third-party reuse permission/
          )
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/hong-kong-restrictions-mobile.png",
        });
        await page.setViewportSize({ width: 1365, height: 1000 });
        await search.fill("Communitech");
        await section
          .getByRole("link", { name: /Visit Communitech/ })
          .waitFor();
        await section
          .getByText(
            /CAD 0, marked Sold out; free availability not established/
          )
          .waitFor();
        await section
          .getByText(/Incorporation expected within 12 months/)
          .waitFor();
        await section
          .getByText(/Private Slack access is not consent/)
          .waitFor();
        await section.scrollIntoViewIfNeeded();
        await page.screenshot({ path: "/task-output/catalogue-desktop.png" });
        await page.setViewportSize({ width: 375, height: 812 });
        await section.scrollIntoViewIfNeeded();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        await page.screenshot({ path: "/task-output/catalogue-mobile.png" });
        await page.setViewportSize({ width: 768, height: 1024 });
        await section.scrollIntoViewIfNeeded();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        await page.screenshot({ path: "/task-output/catalogue-tablet.png" });
        await section
          .getByLabel("Source category", { exact: true })
          .selectOption("dedicated");
        await section
          .getByText(
            "No sources match these filters. Try another name or region, or choose all categories.",
            { exact: true }
          )
          .waitFor();
        await section
          .getByLabel("Source category", { exact: true })
          .selectOption("all");
        await search.fill("Startup Canada");
        await section
          .getByText(
            "No sources match these filters. Try another name or region, or choose all categories.",
            { exact: true }
          )
          .waitFor();
        assert.equal(
          await section.locator('a[href*="startupcan.ca"]').count(),
          0
        );
        await search.fill("");
        await section
          .getByRole("status")
          .getByText(
            `${catalogue.length} of ${catalogue.length} discovery records. No verified live integrations.`,
            { exact: true }
          )
          .waitFor();
        await page.setViewportSize({ width: 1365, height: 1000 });
        await page.getByRole("tab", { name: "Prospects", exact: true }).click();
      }
    );
    await stage("human-declared-candidate-intake", async () => {
      await page.locator("#ui-language").selectOption("nl");
      await page
        .getByRole("button", {
          name: "Individuele kandidaat toevoegen",
          exact: true,
        })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Kandidaat toevoegen",
        exact: true,
      });
      await dialog
        .getByLabel("Naam kandidaat", { exact: true })
        .fill("Synthetic conversation candidate");
      await dialog
        .getByLabel("Bewijsreferentie", { exact: true })
        .fill("synthetic-local-fixture-only");
      await dialog
        .getByRole("checkbox", {
          name: /Deze persoon heeft deze gegevens rechtstreeks verstrekt/,
        })
        .check();
      await dialog
        .getByRole("button", {
          name: "Mogelijke duplicaten bekijken",
          exact: true,
        })
        .click();
      await dialog
        .getByText(/Geen overeenkomende kandidaten gevonden/)
        .waitFor();
      assert.equal(await dialog.getAttribute("lang"), "nl");
      assert.equal(
        await dialog
          .getByRole("button", {
            name: "Invoerbeslissing bevestigen",
            exact: true,
          })
          .isDisabled(),
        true
      );
      await page.screenshot({
        path: "/task-output/intake-review-dutch-desktop.png",
      });
      await page.setViewportSize({ width: 375, height: 812 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      );
      await page.screenshot({
        path: "/task-output/intake-review-dutch-mobile.png",
      });
      await page.setViewportSize({ width: 1365, height: 1000 });
      await dialog
        .getByRole("button", { name: "Invoer bewerken", exact: true })
        .click();
      assert.equal(
        await dialog.getByLabel("Naam kandidaat", { exact: true }).inputValue(),
        "Synthetic conversation candidate"
      );
      assert.equal(
        await dialog
          .getByLabel("Bewijsreferentie", { exact: true })
          .inputValue(),
        "synthetic-local-fixture-only"
      );
      assert.equal(
        await dialog
          .getByRole("checkbox", { name: /Deze persoon heeft/ })
          .isChecked(),
        false
      );
      assert.equal(
        await dialog
          .getByRole("button", {
            name: "Mogelijke duplicaten bekijken",
            exact: true,
          })
          .isDisabled(),
        true
      );
      await dialog
        .getByRole("checkbox", { name: /Deze persoon heeft/ })
        .check();
      await dialog
        .getByRole("button", {
          name: "Mogelijke duplicaten bekijken",
          exact: true,
        })
        .click();
      await dialog
        .getByText(/Geen overeenkomende kandidaten gevonden/)
        .waitFor();
      await dialog
        .getByRole("radio", {
          name: "Een afzonderlijke kandidaat maken",
          exact: true,
        })
        .check();
      await dialog
        .getByRole("checkbox", {
          name: /Ik heb de suggesties gecontroleerd en bevestig/,
        })
        .check();
      await dialog
        .getByRole("button", {
          name: "Invoerbeslissing bevestigen",
          exact: true,
        })
        .click();
      await dialog
        .getByText("Kandidaat opgeslagen. Er is niets verzonden.", {
          exact: true,
        })
        .waitFor();
      const [[p]] = await db.execute(
        "SELECT id FROM prospects WHERE user_id=?",
        [owner]
      );
      candidate = p.id;
      await page.keyboard.press("Escape");
      const [[retainedBefore]] = await db.execute(
        "SELECT * FROM prospects WHERE id=?",
        [candidate]
      );
      await page
        .getByRole("button", {
          name: "Individuele kandidaat toevoegen",
          exact: true,
        })
        .click();
      const reuse = page.getByRole("dialog", {
        name: "Kandidaat toevoegen",
        exact: true,
      });
      await reuse
        .getByLabel("Naam kandidaat", { exact: true })
        .fill("Synthetic conversation candidate");
      await reuse
        .getByLabel("Rol of titel", { exact: true })
        .fill("Must not overwrite retained title");
      await reuse
        .getByLabel("Bewijsreferentie", { exact: true })
        .fill("synthetic-reuse-not-new-evidence");
      await reuse.getByRole("checkbox", { name: /Deze persoon heeft/ }).check();
      await reuse
        .getByRole("button", {
          name: "Mogelijke duplicaten bekijken",
          exact: true,
        })
        .click();
      await reuse
        .getByRole("radio", {
          name: `Bestaande kandidaat gebruiken ${candidate}`,
          exact: true,
        })
        .check();
      await reuse
        .getByRole("button", {
          name: "Invoerbeslissing bevestigen",
          exact: true,
        })
        .click();
      await reuse
        .getByText(
          "Bestaande kandidaat geselecteerd. Profiel, bewijs en contactstatus zijn niet gewijzigd.",
          { exact: true }
        )
        .waitFor();
      const [[retainedAfter]] = await db.execute(
        "SELECT * FROM prospects WHERE id=?",
        [candidate]
      );
      assert.deepEqual(retainedAfter, retainedBefore);
      const [[retainedCount]] = await db.execute(
        "SELECT COUNT(*) AS total FROM prospects WHERE user_id=?",
        [owner]
      );
      assert.equal(retainedCount.total, 1);
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", {
          name: "Individuele kandidaat toevoegen",
          exact: true,
        })
        .click();
      const unsaved = page.getByRole("dialog", {
        name: "Kandidaat toevoegen",
        exact: true,
      });
      await unsaved
        .getByLabel("Naam kandidaat", { exact: true })
        .fill("Retain this unsaved draft");
      page.once("dialog", async confirmation => {
        assert.match(
          confirmation.message(),
          /Deze niet-opgeslagen invoer verwerpen/
        );
        await confirmation.dismiss();
      });
      await page.keyboard.press("Escape");
      assert.equal(
        await unsaved
          .getByLabel("Naam kandidaat", { exact: true })
          .inputValue(),
        "Retain this unsaved draft"
      );
      page.once("dialog", confirmation => confirmation.accept());
      await page.keyboard.press("Escape");
      await unsaved.waitFor({ state: "hidden" });
      await page.locator("#ui-language").selectOption("en");
    });
    await stage(
      "dutch-candidate-corrections-retain-evidence-and-unsaved-inputs",
      async () => {
        const metadata =
          "SELECT name,user_id,platform,profile_url,source_kind,import_provenance,consent_status,imported_at,archived_at FROM prospects WHERE id=?";
        const [[before]] = await db.execute(metadata, [candidate]);
        await page.locator("#ui-language").selectOption("nl");
        const open = async () => {
          await page
            .getByRole("button", {
              name: "Details bekijken voor Synthetic conversation candidate",
              exact: true,
            })
            .click();
          await page
            .getByRole("dialog", {
              name: /^(Candidate details|Kandidaatdetails)$/,
              exact: true,
            })
            .getByRole("button", { name: "Profiel bewerken", exact: true })
            .click();
        };
        await open();
        const editor = () =>
          page.getByRole("form", {
            name: "Kandidaatprofiel bewerken",
            exact: true,
          });
        assert.equal(await editor().getAttribute("lang"), "nl");
        assert.equal(
          await editor()
            .getByRole("button", { name: "Correcties opslaan", exact: true })
            .isDisabled(),
          true
        );
        assert.equal(
          await editor()
            .getByLabel("Biografie", { exact: true })
            .evaluate(e => e.maxLength),
          10000
        );
        const biography =
          "Zelf ingevoerde notitie — café 🌍. Geen echt contact.";
        await editor()
          .getByLabel("Rol of titel", { exact: true })
          .fill("Synthetic corrected role");
        await editor().getByLabel("Biografie", { exact: true }).fill(biography);
        await editor()
          .getByLabel("Vaardigheden (één per regel)", { exact: true })
          .fill("TypeScript\nTesten");
        let confirmation = false;
        page.once("dialog", async d => {
          assert.equal(d.type(), "confirm");
          assert.equal(
            d.message(),
            "Niet-opgeslagen kandidaatcorrecties verwerpen en de nieuwste registratie laden?"
          );
          confirmation = true;
          await d.dismiss();
        });
        await editor()
          .getByRole("button", { name: "Bewerken annuleren", exact: true })
          .click();
        assert.equal(confirmation, true);
        assert.equal(
          await editor().getByLabel("Biografie", { exact: true }).inputValue(),
          biography
        );
        await page
          .getByRole("dialog", {
            name: /^(Candidate details|Kandidaatdetails)$/,
            exact: true,
          })
          .evaluate(e => {
            e.scrollTop = 0;
          });
        await page.screenshot({
          path: "/task-output/candidate-editor-dutch-desktop-viewport.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          true
        );
        await page
          .getByRole("dialog", {
            name: /^(Candidate details|Kandidaatdetails)$/,
            exact: true,
          })
          .evaluate(e => {
            e.scrollTop = 0;
          });
        await page.screenshot({
          path: "/task-output/candidate-editor-dutch-mobile-viewport.png",
        });
        await editor()
          .getByRole("button", { name: "Correcties opslaan", exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/candidate-editor-dutch-mobile-actions.png",
        });
        await editor()
          .getByRole("button", { name: "Correcties opslaan", exact: true })
          .click();
        await page
          .getByRole("dialog", {
            name: /^(Candidate details|Kandidaatdetails)$/,
            exact: true,
          })
          .getByText("Profielcorrecties opgeslagen.", { exact: true })
          .waitFor();
        const [[saved]] = await db.execute(
          "SELECT title,bio,skills FROM prospects WHERE id=?",
          [candidate]
        );
        assert.equal(saved.title, "Synthetic corrected role");
        assert.equal(saved.bio, biography);
        assert.deepEqual(
          typeof saved.skills === "string"
            ? JSON.parse(saved.skills)
            : saved.skills,
          ["TypeScript", "Testen"]
        );
        const [[after]] = await db.execute(metadata, [candidate]);
        assert.deepEqual(after, before);
        await page.keyboard.press("Escape");
        await page.reload();
        await open();
        assert.equal(
          await editor().getByLabel("Biografie", { exact: true }).inputValue(),
          biography
        );
        await page.keyboard.press("Escape");
        await page.locator("#ui-language").selectOption("en");
        await page.setViewportSize({ width: 1365, height: 1000 });
      }
    );
    await stage(
      "real-assessment-before-opt-out-enables-retained-progress",
      async () => {
        const row = page
          .getByRole("row")
          .filter({ hasText: "Synthetic conversation candidate" });
        await row.getByRole("button", { name: "Qualify", exact: true }).click();
        await page.getByText("Assessment saved.", { exact: false }).waitFor();
        const [assessments] = await db.execute(
          "SELECT id,user_id,prospect_id FROM matches WHERE user_id=? AND prospect_id=?",
          [owner, candidate]
        );
        assert.equal(assessments.length, 1);
      }
    );
    await stage(
      "original-draft-review-approval-manual-preparation",
      async () => {
        const row = page
          .getByRole("row")
          .filter({ hasText: "Synthetic conversation candidate" });
        await row
          .getByRole("button", { name: "Write draft", exact: true })
          .click();
        await page.locator("#ui-language").selectOption("nl");
        let composer = page.getByRole("region", {
          name: "Zelfgeschreven concept",
          exact: true,
        });
        await composer.waitFor();
        assert.equal(await composer.getAttribute("lang"), "nl");
        assert.equal(
          await composer
            .getByRole("button", { name: "Concept opslaan", exact: true })
            .isDisabled(),
          true
        );
        await composer
          .getByLabel("Je oorspronkelijke bericht", { exact: true })
          .fill("Synthetic cancel test only. Do not save.");
        await composer
          .getByRole("button", { name: "Concept annuleren", exact: true })
          .click();
        assert.equal(await composer.count(), 0);
        const [[cancelled]] = await db.execute(
          "SELECT COUNT(*) AS total FROM outreach_records WHERE user_id=?",
          [owner]
        );
        assert.equal(cancelled.total, 0);
        await row
          .getByRole("button", { name: "Concept schrijven", exact: true })
          .click();
        composer = page.getByRole("region", {
          name: "Zelfgeschreven concept",
          exact: true,
        });
        const message = "Synthetic QA message. No real contact or delivery.";
        assert.equal(
          await composer
            .getByLabel("Je oorspronkelijke bericht", { exact: true })
            .inputValue(),
          ""
        );
        await composer
          .getByLabel("Je oorspronkelijke bericht", { exact: true })
          .fill(message);
        await composer
          .getByRole("checkbox", { name: /Ik heb deze tekst zelf geschreven/ })
          .check();
        const workspaceUrl = page.url();
        const helpPopup = page.waitForEvent("popup");
        await page
          .getByRole("link", {
            name: "Hulp (opent in een nieuw tabblad)",
            exact: true,
          })
          .click();
        const help = await helpPopup;
        await help.waitForLoadState("domcontentloaded");
        assert.equal(new URL(help.url()).pathname, "/help");
        assert.equal(await help.title(), "CoFounder Outreach");
        await help
          .getByRole("heading", {
            level: 1,
            name: "CoFounder Outreach gebruiken",
            exact: true,
          })
          .waitFor();
        assert.equal(await help.evaluate(() => window.opener === null), true);
        await help.close();
        assert.equal(page.url(), workspaceUrl);
        assert.equal(
          await composer
            .getByLabel("Je oorspronkelijke bericht", { exact: true })
            .inputValue(),
          message
        );
        assert.equal(
          await composer
            .getByRole("checkbox", {
              name: /Ik heb deze tekst zelf geschreven/,
            })
            .isChecked(),
          true
        );
        console.log(
          JSON.stringify({
            checkpoint: "help_preserves_unsaved_original_and_declaration",
            newTab: true,
            openerNull: true,
            externalActions: 0,
          })
        );
        await page.locator("#ui-language").selectOption("en");
        const english = page.getByRole("region", {
          name: "Human-authored draft",
          exact: true,
        });
        assert.equal(
          await english
            .getByLabel("Your original message", { exact: true })
            .inputValue(),
          message
        );
        assert.equal(
          await english
            .getByRole("checkbox", { name: /I wrote this text myself/ })
            .isChecked(),
          true
        );
        await page.locator("#ui-language").selectOption("nl");
        await composer
          .getByLabel("Je oorspronkelijke bericht", { exact: true })
          .fill(message + " Edit test.");
        assert.equal(await composer.getByRole("checkbox").isChecked(), false);
        assert.equal(
          await composer
            .getByRole("button", { name: "Concept opslaan", exact: true })
            .isDisabled(),
          true
        );
        await composer
          .getByLabel("Je oorspronkelijke bericht", { exact: true })
          .fill(message);
        await composer.getByRole("checkbox").check();
        await page.setViewportSize({ width: 1365, height: 1000 });
        await composer.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/composer-dutch-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await composer.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/composer-dutch-mobile.png",
        });
        await composer
          .getByRole("button", { name: "Concept opslaan", exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/composer-dutch-mobile-actions.png",
        });
        await composer
          .getByRole("button", { name: "Concept opslaan", exact: true })
          .click();
        await composer.waitFor({ state: "hidden" });
        const [[saved]] = await db.execute(
          "SELECT body,state,confirmed_sent_at FROM outreach_records WHERE user_id=?",
          [owner]
        );
        assert.equal(saved.body, message);
        assert.equal(saved.state, "draft");
        assert.equal(saved.confirmed_sent_at, null);
        const queue = page.getByRole("region", {
          name: "Beoordeling en handmatige contactvoorbereiding",
          exact: true,
        });
        await queue
          .getByRole("button", {
            name: "Ter beoordeling indienen",
            exact: true,
          })
          .click();
        await queue
          .getByRole("button", { name: "Goedkeuren", exact: true })
          .click();
        await queue
          .getByRole("button", {
            name: "Handmatige verzending voorbereiden",
            exact: true,
          })
          .click();
        const sent = queue.getByRole("button", {
          name: "Ik heb dit verzonden",
          exact: true,
        });
        await sent.waitFor();
        assert.equal(await sent.isDisabled(), true);
        assert.equal(
          await queue
            .getByRole("checkbox", {
              name: /Ik heb dit exacte bericht daadwerkelijk/,
            })
            .isChecked(),
          false
        );
        await queue
          .getByRole("button", { name: "Bericht kopiëren", exact: true })
          .click();
        await queue
          .getByText("Bericht gekopieerd. Er is niets verzonden.", {
            exact: true,
          })
          .waitFor();
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          message
        );
        assert.equal(await sent.isDisabled(), true);
        await queue
          .getByRole("checkbox", {
            name: /Ik heb dit exacte bericht daadwerkelijk/,
          })
          .check();
        await page.locator("#ui-language").selectOption("en");
        const englishQueue = page.getByRole("region", {
          name: "Review and assisted-send queue",
          exact: true,
        });
        assert.equal(
          await englishQueue
            .getByRole("checkbox", {
              name: /I actually sent this exact message outside/,
            })
            .isChecked(),
          true
        );
        assert.equal(
          await englishQueue
            .getByRole("button", { name: "I sent this", exact: true })
            .isEnabled(),
          true
        );
        await page.locator("#ui-language").selectOption("nl");
        await page.setViewportSize({ width: 1365, height: 1000 });
        await queue.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/review-queue-dutch-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await sent.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/review-queue-dutch-mobile.png",
        });
        await page.locator("#ui-language").selectOption("en");
        const [[r]] = await db.execute(
          "SELECT id,state,confirmed_sent_at FROM outreach_records WHERE user_id=?",
          [owner]
        );
        id = r.id;
        assert.equal(r.state, "manual_action_required");
        assert.equal(r.confirmed_sent_at, null);
      }
    );
    await stage("synthetic-manual-completion-receipt-no-delivery", async () => {
      await page
        .getByRole("button", { name: "I sent this", exact: true })
        .click();
      await page
        .getByRole("button", { name: `Manage outreach ${id}`, exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Manage outreach",
        exact: true,
      });
      await dialog
        .getByRole("region", {
          name: "Conversation history and reminders",
          exact: true,
        })
        .waitFor();
      const [[r]] = await db.execute(
        "SELECT state,confirmed_sent_at FROM outreach_records WHERE id=?",
        [id]
      );
      assert.equal(r.state, "confirmed_sent");
      assert.ok(r.confirmed_sent_at);
    });
    const region = () =>
      page.getByRole("region", {
        name: /^(Conversation history and reminders|Gespreksgeschiedenis en herinneringen)$/,
        exact: true,
      });
    const localTime = () => {
      const d = new Date(Date.now() + 86400000);
      return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Amsterdam",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(d)
        .replace(" ", "T");
    };
    await stage("future-reminder-persists-and-queue-renders", async () => {
      const requestedTime = localTime();
      const expectedUtc = await page.evaluate(
        time => new Date(time).toISOString(),
        requestedTime
      );
      await region()
        .getByLabel("Reminder date and time", { exact: true })
        .fill(requestedTime);
      await region()
        .getByRole("button", { name: "Save reminder", exact: true })
        .click();
      await region()
        .getByRole("button", { name: "Cancel reminder", exact: true })
        .waitFor();
      const [[r]] = await db.execute(
        "SELECT follow_up_at FROM outreach_records WHERE id=?",
        [id]
      );
      assert.ok(r.follow_up_at);
      assert.equal(r.follow_up_at.toISOString(), expectedUtc);
      await page.keyboard.press("Escape");
      await page.getByRole("tab", { name: "Follow-ups", exact: true }).click();
      await page
        .getByLabel("Show reminders", { exact: true })
        .selectOption("scheduled");
      await page
        .getByRole("button", { name: `Manage reminder ${id}`, exact: true })
        .waitFor();
      await page.locator("#ui-language").selectOption("nl");
      const reminders = page.getByRole("region", {
        name: "Vervolgherinneringen",
        exact: true,
      });
      await reminders.waitFor();
      assert.equal(await reminders.getAttribute("lang"), "nl");
      assert.equal(
        await reminders.locator("#reminder-filter").inputValue(),
        "scheduled"
      );
      assert.ok(
        (await reminders.innerText()).includes("geen geplande berichten")
      );
      assert.ok((await reminders.innerText()).includes("lokale tijdzone"));
      assert.ok(
        (await reminders.innerText()).includes("Handmatig verzenden bevestigd")
      );
      await reminders
        .getByRole("button", { name: `Herinnering ${id} beheren`, exact: true })
        .waitFor();
      const positionReminderHeading = async () => {
        await reminders.evaluate(el => {
          const header = [...document.querySelectorAll("header")].find(
            node => getComputedStyle(node).position === "sticky"
          );
          window.scrollTo(
            0,
            Math.max(
              0,
              el.getBoundingClientRect().top +
                scrollY -
                (header?.getBoundingClientRect().height ?? 0) -
                12
            )
          );
        });
        assert.ok(
          await reminders.evaluate(el => {
            const header = [...document.querySelectorAll("header")].find(
              node => getComputedStyle(node).position === "sticky"
            );
            return (
              el.getBoundingClientRect().top >=
              (header?.getBoundingClientRect().bottom ?? 0)
            );
          }),
          "reminder heading visible below sticky header"
        );
      };
      await page.setViewportSize({ width: 1365, height: 1000 });
      assert.equal(await page.evaluate(() => innerWidth), 1365);
      await positionReminderHeading();
      await page.screenshot({
        path: "/task-output/reminders-dutch-desktop.png",
      });
      await page.setViewportSize({ width: 375, height: 812 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        true
      );
      await positionReminderHeading();
      assert.equal(await page.evaluate(() => innerWidth), 375);
      await page.screenshot({
        path: "/task-output/reminders-dutch-mobile.png",
      });
      await page.locator("#ui-language").selectOption("en");
      await page.setViewportSize({ width: 1365, height: 1000 });
      assert.equal(
        await page.locator("#reminder-filter").inputValue(),
        "scheduled"
      );
      await page.locator("#ui-language").selectOption("nl");
      await page
        .getByRole("button", { name: `Herinnering ${id} beheren`, exact: true })
        .click();
      await region().waitFor();
    });
    await stage("real-http-reminder-account-isolation", async () => {
      const path =
        "/api/trpc/criticalPath.outreach.reminders?input=" +
        encodeURIComponent(
          JSON.stringify({
            json: {
              accountId: foreign.insertId,
              filter: "all",
              page: 1,
              pageSize: 25,
            },
          })
        );
      assert.equal((await context.request.get(origin + path)).status(), 403);
      assert.equal(
        (await fetch(origin + path, { signal: AbortSignal.timeout(5000) }))
          .status,
        401
      );
    });
    await stage("response-requires-review-and-clears-reminder", async () => {
      assert.equal(
        await region()
          .getByRole("button", { name: "Reactie vastleggen", exact: true })
          .isDisabled(),
        true
      );
      await region()
        .getByRole("checkbox", {
          name: "Ik heb buiten deze tool een reactie ontvangen",
          exact: true,
        })
        .check();
      await region()
        .getByRole("button", { name: "Reactie vastleggen", exact: true })
        .click();
      await region()
        .getByText(/Reactie vastgelegd:/)
        .waitFor();
      assert.equal(await region().getAttribute("lang"), "nl");
      await region()
        .getByRole("status")
        .getByText(
          "Gesprek bijgewerkt. Er is geen bericht of melding verzonden.",
          { exact: true }
        )
        .waitFor();
      const [[r]] = await db.execute(
        "SELECT state,response_recorded_at,follow_up_at FROM outreach_records WHERE id=?",
        [id]
      );
      assert.equal(r.state, "responded");
      assert.ok(r.response_recorded_at);
      assert.equal(r.follow_up_at, null);
    });
    await stage("desktop-mobile-history-and-reminder-controls", async () => {
      await region().screenshot({
        path: "/task-output/conversation-desktop.png",
      });
      await page.setViewportSize({ width: 375, height: 812 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        ),
        false
      );
      await region().screenshot({
        path: "/task-output/conversation-mobile.png",
      });
      await region()
        .getByLabel("Herinneringsdatum en -tijd", { exact: true })
        .fill(localTime());
      await region()
        .getByRole("button", { name: "Herinnering opslaan", exact: true })
        .click();
      await region()
        .getByRole("button", { name: "Herinnering annuleren", exact: true })
        .waitFor();
    });
    await stage("close-retains-history-and-clears-reminder", async () => {
      await region()
        .getByRole("checkbox", {
          name: "Gesprek sluiten en de geschiedenis bewaren",
          exact: true,
        })
        .check();
      await region()
        .getByRole("button", { name: "Gesprek sluiten", exact: true })
        .click();
      await region().waitFor({ state: "hidden" });
      const [[r]] = await db.execute(
        "SELECT state,body,confirmed_sent_at,response_recorded_at,closed_at,follow_up_at FROM outreach_records WHERE id=?",
        [id]
      );
      assert.equal(r.state, "closed");
      assert.ok(r.confirmed_sent_at);
      assert.ok(r.response_recorded_at);
      assert.ok(r.closed_at);
      assert.equal(r.follow_up_at, null);
      assert.equal(
        r.body,
        "Synthetic QA message. No real contact or delivery."
      );
      await page.keyboard.press("Escape");
      await page.locator("#ui-language").selectOption("en");
      await page
        .getByRole("button", { name: "Refresh reminders", exact: true })
        .click();
      await page
        .getByText("No reminders in this view.", { exact: true })
        .waitFor();
      await page.reload();
      await page
        .getByRole("tab", { name: "Review queue", exact: true })
        .click();
      await page
        .getByText("Synthetic QA message. No real contact or delivery.", {
          exact: true,
        })
        .waitFor();
    });
    await stage(
      "dutch-candidate-details-archive-restore-opt-out-retain-evidence",
      async () => {
        await page.getByRole("tab", { name: "Prospects", exact: true }).click();
        await page.locator("#ui-language").selectOption("nl");
        await page
          .getByRole("button", {
            name: "Details bekijken voor Synthetic conversation candidate",
            exact: true,
          })
          .click();
        const dialog = page.getByRole("dialog", {
          name: "Kandidaatdetails",
          exact: true,
        });
        await dialog.waitFor();
        assert.equal(await dialog.getAttribute("lang"), "nl");
        assert.equal(
          await dialog
            .getByRole("button", { name: "Sluiten", exact: true })
            .count(),
          1
        );
        const metadata =
          "SELECT user_id,name,title,bio,platform,profile_url,source_kind,import_provenance,imported_at FROM prospects WHERE id=?";
        const [[before]] = await db.execute(metadata, [candidate]);
        const archive = dialog.getByRole("region", {
          name: "Kandidaatarchief",
          exact: true,
        });
        assert.equal(
          await archive
            .getByRole("button", { name: "Kandidaat archiveren", exact: true })
            .isDisabled(),
          true
        );
        await archive
          .getByRole("checkbox", {
            name: "Archiveer deze kandidaat en behoud de registraties in mijn werkruimte.",
            exact: true,
          })
          .check();
        await archive
          .getByRole("button", { name: "Kandidaat archiveren", exact: true })
          .click();
        await dialog
          .getByText(
            "Kandidaat gearchiveerd. Er zijn geen gegevens verwijderd.",
            { exact: true }
          )
          .waitFor();
        const [[archived]] = await db.execute(
          "SELECT archived_at FROM prospects WHERE id=?",
          [candidate]
        );
        assert.ok(archived.archived_at);
        assert.equal(
          await archive
            .getByRole("button", { name: "Kandidaat herstellen", exact: true })
            .isDisabled(),
          true
        );
        await archive
          .getByRole("checkbox", {
            name: "Herstel deze kandidaat in mijn actieve lijst zonder contactbeperkingen te wijzigen.",
            exact: true,
          })
          .check();
        await archive
          .getByRole("button", { name: "Kandidaat herstellen", exact: true })
          .click();
        await dialog
          .getByText(
            "Kandidaat hersteld. Contactbeperkingen zijn ongewijzigd.",
            { exact: true }
          )
          .waitFor();
        const contact = dialog.getByRole("region", {
          name: "Contacttoestemming",
          exact: true,
        });
        assert.equal(
          await contact
            .getByRole("button", { name: "Opt-out registreren", exact: true })
            .isDisabled(),
          true
        );
        await contact
          .getByRole("checkbox", {
            name: "Deze kandidaat mag niet worden gecontacteerd. Registreer een opt-out in mijn werkruimte.",
            exact: true,
          })
          .check();
        await contact
          .getByRole("button", { name: "Opt-out registreren", exact: true })
          .click();
        await contact
          .getByText(
            "Opt-out geregistreerd. Nieuwe beoordelingen, concepten en ondersteunde contactacties zijn geblokkeerd voor deze kandidaat.",
            { exact: true }
          )
          .waitFor();
        assert.equal(
          await contact
            .getByRole("button", { name: "Opt-out registreren", exact: true })
            .count(),
          0
        );
        const [[state]] = await db.execute(
          "SELECT archived_at,consent_status FROM prospects WHERE id=?",
          [candidate]
        );
        assert.equal(state.archived_at, null);
        assert.equal(state.consent_status, "opted_out");
        const [[after]] = await db.execute(metadata, [candidate]);
        assert.deepEqual(after, before);
        await contact.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/candidate-details-contact-mobile.png",
        });
        await page.setViewportSize({ width: 1365, height: 1000 });
        await contact.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/candidate-details-contact-desktop.png",
        });
        await dialog
          .getByRole("button", { name: "Sluiten", exact: true })
          .click();
        await page.locator("#ui-language").selectOption("en");
      }
    );
    await stage(
      "dutch-progress-save-preserves-opt-out-original-notes-and-language-switch",
      async () => {
        await page.locator("#ui-language").selectOption("nl");
        await page
          .getByRole("button", {
            name: "Details bekijken voor Synthetic conversation candidate",
            exact: true,
          })
          .click();
        const dialog = page.getByRole("dialog", {
          name: "Kandidaatdetails",
          exact: true,
        });
        const progress = dialog.getByRole("region", {
          name: "Voortgang van de samenwerking",
          exact: true,
        });
        await progress.waitFor();
        assert.equal(await progress.getAttribute("lang"), "nl");
        const savedBefore = await db.execute(
          "SELECT user_id,prospect_id,outcome,notes,outcome_date FROM partnership_outcomes WHERE prospect_id=?",
          [candidate]
        );
        assert.equal(savedBefore[0].length, 0);
        const sendBefore = await db.execute(
          "SELECT state,confirmed_sent_at,response_recorded_at,closed_at,follow_up_at FROM outreach_records WHERE id=?",
          [id]
        );
        const notes =
          "Oorspronkelijke privénotitie — café 🌍. Synthetic fixture only.";
        const save = progress.getByRole("button", {
          name: "Voortgang vastleggen",
          exact: true,
        });
        assert.equal(await save.isDisabled(), true);
        await progress
          .getByLabel("Mijn gerapporteerde voortgang", { exact: true })
          .selectOption("still_talking");
        await progress
          .getByLabel("Privévoortgangsnotities (optioneel)", { exact: true })
          .fill(notes);
        await progress.getByRole("checkbox").check();
        // Cancelling the parent's Dutch discard dialog must preserve inputs/approval.
        page.once("dialog", async prompt => {
          assert.equal(
            prompt.message(),
            "Niet-opgeslagen kandidaatcorrecties of voortgangsinvoer verwerpen?"
          );
          await prompt.dismiss();
        });
        await dialog
          .getByRole("button", { name: "Sluiten", exact: true })
          .click();
        assert.equal(
          await progress
            .getByLabel("Privévoortgangsnotities (optioneel)", { exact: true })
            .inputValue(),
          notes
        );
        assert.equal(await progress.getByRole("checkbox").isChecked(), true);
        await save.click();
        await progress
          .getByText(
            "Voortgang vastgelegd. Er is geen bericht verstuurd of contactbeperking gewijzigd.",
            { exact: true }
          )
          .waitFor();
        await progress.getByText(notes, { exact: true }).waitFor();
        const emojiSession = await context.newCDPSession(page);
        await emojiSession.send("DOM.enable");
        await emojiSession.send("CSS.enable");
        await emojiSession.send("DOM.getDocument", { depth: -1 });
        const { result: noteNode } = await emojiSession.send(
          "Runtime.evaluate",
          {
            expression: `Array.from(document.querySelectorAll("p")).find(p => p.textContent === ${JSON.stringify(notes)})`,
          }
        );
        assert.ok(
          noteNode.objectId,
          "stored Unicode note is actually rendered"
        );
        const { nodeId: noteId } = await emojiSession.send("DOM.requestNode", {
          objectId: noteNode.objectId,
        });
        const { fonts: noteFonts } = await emojiSession.send(
          "CSS.getPlatformFontsForNode",
          { nodeId: noteId }
        );
        console.log(
          JSON.stringify({
            checkpoint: "actual_stored_note_emoji_platform_fonts",
            fonts: noteFonts,
          })
        );
        assert.ok(
          noteFonts.some(
            font =>
              /^NotoColorEmoji/i.test(font.postScriptName) &&
              font.glyphCount === 1
          ),
          "test-image emoji font renders the actual stored globe glyph"
        );
        await emojiSession.detach();
        assert.equal(await progress.getByRole("checkbox").isChecked(), false);
        const [[record]] = await db.execute(
          "SELECT user_id,prospect_id,outcome,notes,outcome_date FROM partnership_outcomes WHERE prospect_id=?",
          [candidate]
        );
        assert.equal(record.user_id, owner);
        assert.equal(record.prospect_id, candidate);
        assert.equal(record.outcome, "still_talking");
        assert.equal(record.notes, notes);
        assert.ok(record.outcome_date);
        const [[prospect]] = await db.execute(
          "SELECT consent_status FROM prospects WHERE id=?",
          [candidate]
        );
        assert.equal(prospect.consent_status, "opted_out");
        const sendAfter = await db.execute(
          "SELECT state,confirmed_sent_at,response_recorded_at,closed_at,follow_up_at FROM outreach_records WHERE id=?",
          [id]
        );
        assert.deepEqual(sendAfter[0], sendBefore[0]);
        await progress.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/progress-dutch-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await progress.scrollIntoViewIfNeeded();
        const panelBounds = await progress.boundingBox();
        const reloadBounds = await progress
          .getByRole("button", {
            name: "Voortgangsgeschiedenis opnieuw laden",
            exact: true,
          })
          .boundingBox();
        assert.ok(
          reloadBounds.x >= panelBounds.x &&
            reloadBounds.x + reloadBounds.width <=
              panelBounds.x + panelBounds.width
        );
        await page.screenshot({
          path: "/task-output/progress-dutch-mobile.png",
        });
        await progress
          .getByRole("button", { name: "Voortgang vastleggen", exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/progress-dutch-mobile-actions.png",
        });
        await dialog
          .getByRole("button", { name: "Sluiten", exact: true })
          .click();
        await page.locator("#ui-language").selectOption("en");
        await page
          .getByRole("button", {
            name: "View details for Synthetic conversation candidate",
            exact: true,
          })
          .click();
        const english = page.getByRole("dialog", {
          name: "Candidate details",
          exact: true,
        });
        await english
          .getByRole("region", { name: "Partnership progress", exact: true })
          .getByText(notes, { exact: true })
          .waitFor();
        await english
          .getByRole("button", { name: "Close", exact: true })
          .click();
      }
    );
    const exportSection = () =>
      page.getByRole("region", {
        name: /^(Private account export|Privé-export van accountgegevens)$/,
      });
    const downloads = [];
    page.on("download", d => downloads.push(d));
    // Retained-history fixtures are inserted only into this disposable database.
    await db.execute(
      "INSERT INTO prospects (user_id,name,platform,source_kind,consent_status,archived_at) VALUES (?,'Synthetic archived candidate','manual','manual','unknown',CURRENT_TIMESTAMP),(?,'Synthetic opted-out candidate','manual','manual','opted_out',NULL)",
      [owner, owner]
    );
    await stage(
      "export-requires-current-password-and-explicit-private-review",
      async () => {
        assert.deepEqual(errors, []);
        await page.locator("#ui-language").selectOption("nl");
        await page
          .getByRole("tab", { name: "Accountgegevens", exact: true })
          .click();
        const section = exportSection(),
          button = section.getByRole("button", {
            name: "Accountgegevens als JSON downloaden",
            exact: true,
          });
        await button.waitFor();
        assert.equal(await section.getAttribute("lang"), "nl");
        await section.getByText(/De download is niet versleuteld/).waitFor();
        assert.equal(await button.isDisabled(), true);
        await section
          .getByLabel("Huidig wachtwoord", { exact: true })
          .fill("Synthetic-Incorrect42!");
        assert.equal(await button.isDisabled(), true);
        await section
          .getByRole("checkbox", {
            name: "Ik begrijp dat dit bestand privégegevens van mijn account en kandidaten bevat",
            exact: true,
          })
          .check();
        await button.click();
        await section
          .getByRole("alert")
          .getByText(
            "Password confirmation failed. Check your current password and try again.",
            { exact: true }
          )
          .waitFor();
        assert.equal(
          await section.getByRole("alert").getAttribute("lang"),
          "en"
        );
        await page.locator("#ui-language").selectOption("en");
        await exportSection()
          .getByRole("alert")
          .getByText(
            "Password confirmation failed. Check your current password and try again.",
            { exact: true }
          )
          .waitFor();
        assert.equal(
          await exportSection().getByRole("checkbox").isChecked(),
          true
        );
        await page.locator("#ui-language").selectOption("nl");
        assert.equal(
          await section
            .getByLabel("Huidig wachtwoord", { exact: true })
            .inputValue(),
          ""
        );
        assert.equal(downloads.length, 0);
        const [[quota]] = await db.execute(
          "SELECT attempts FROM account_export_quotas WHERE user_id=?",
          [owner]
        );
        assert.equal(quota.attempts, 1);
        // Account for this deliberately exercised refusal, not arbitrary errors.
        assert.equal(errors.length, 2);
        assert.equal(
          errors[0],
          "Failed to load resource: the server responded with a status of 403 (Forbidden)"
        );
        assert.match(
          errors[1],
          /^\[API Mutation Error\] TRPCClientError: Password confirmation failed\. Check your current password and try again\./
        );
        expectedDiagnostics.push(...errors.splice(0));
      }
    );
    await stage(
      "actual-private-json-download-includes-closed-conversation-not-credentials",
      async () => {
        const section = exportSection();
        await section
          .getByLabel("Huidig wachtwoord", { exact: true })
          .fill(password);
        const waiting = page.waitForEvent("download");
        await section
          .getByRole("button", {
            name: "Accountgegevens als JSON downloaden",
            exact: true,
          })
          .click();
        const downloaded = await waiting;
        assert.match(
          downloaded.suggestedFilename(),
          /^cofounder-account-\d{4}-\d{2}-\d{2}\.json$/
        );
        const text = await fs.readFile(await downloaded.path(), "utf8"),
          payload = JSON.parse(text);
        assert.equal(payload.format, "cofounder-account-v1");
        assert.equal(payload.accountId, owner);
        assert.equal(payload.data.users.length, 1);
        assert.equal(payload.data.users[0].id, owner);
        assert.equal(payload.data.prospects.length, 3);
        assert.ok(payload.data.prospects.some(p => p.id === candidate));
        assert.ok(
          payload.data.prospects.some(
            p => p.name === "Synthetic archived candidate" && p.archivedAt
          )
        );
        assert.ok(
          payload.data.prospects.some(
            p =>
              p.name === "Synthetic opted-out candidate" &&
              p.consentStatus === "opted_out"
          )
        );
        assert.equal(payload.data.outreachRecords.length, 1);
        assert.equal(payload.data.partnershipOutcomes.length, 1);
        assert.equal(
          payload.data.partnershipOutcomes[0].outcome,
          "still_talking"
        );
        assert.equal(
          payload.data.partnershipOutcomes[0].notes,
          "Oorspronkelijke privénotitie — café 🌍. Synthetic fixture only."
        );
        const record = payload.data.outreachRecords[0];
        assert.equal(record.id, id);
        assert.equal(record.state, "closed");
        assert.ok(record.confirmedSentAt);
        assert.ok(record.responseRecordedAt);
        assert.ok(record.closedAt);
        assert.equal(record.followUpAt, null);
        assert.equal(text.includes("Foreign export exclusion marker"), false);
        assert.equal(text.includes(password), false);
        assert.equal(text.includes(hash), false);
        assert.ok(payload.categories.users.excludedFields.passwordHash);
        assert.ok(
          payload.categories.accountSessions.excludedFields.tokenDigest
        );
        for (const row of payload.data.accountSessions)
          assert.equal(Object.hasOwn(row, "tokenDigest"), false);
        assert.ok(Object.keys(payload.categories).length >= 43);
        assert.equal(
          await section
            .getByLabel("Huidig wachtwoord", { exact: true })
            .inputValue(),
          ""
        );
        const [[quota]] = await db.execute(
          "SELECT attempts FROM account_export_quotas WHERE user_id=?",
          [owner]
        );
        assert.equal(quota.attempts, 2);
        const [[audit]] = await db.execute(
          "SELECT COUNT(*) AS total FROM audit_events WHERE user_id=? AND action='account.export' AND outcome='success'",
          [owner]
        );
        assert.equal(audit.total, 1);
        await section.getByRole("status").waitFor();
        await section
          .getByRole("status")
          .getByText(
            "Je browser heeft de JSON-download van je account gestart. Bewaar het bestand veilig.",
            { exact: true }
          )
          .waitFor();
        await page.setViewportSize({ width: 375, height: 812 });
        await section.scrollIntoViewIfNeeded();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        await page.screenshot({ path: "/task-output/export-mobile.png" });
        await section
          .getByRole("button", {
            name: "Accountgegevens als JSON downloaden",
            exact: true,
          })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/export-mobile-actions.png",
        });
        await page.setViewportSize({ width: 1365, height: 1000 });
        await section.scrollIntoViewIfNeeded();
        await page.screenshot({ path: "/task-output/export-desktop.png" });
        await page.locator("#ui-language").selectOption("en");
        await exportSection()
          .getByRole("status")
          .getByText(
            "Your browser started the account JSON download. Store it securely.",
            { exact: true }
          )
          .waitFor();
        assert.equal(downloads.length, 1);
        assert.equal(
          await exportSection().getByRole("checkbox").isChecked(),
          true
        );
      }
    );
    await stage(
      "real-http-export-account-mismatch-and-anonymous-refusal",
      async () => {
        const url = origin + "/api/trpc/accountData.export";
        const body = {
          json: { accountId: foreign.insertId, password, confirmation: true },
        };
        assert.equal(
          (
            await context.request.post(url, { data: body, headers: { origin } })
          ).status(),
          403
        );
        assert.equal(
          (
            await fetch(url, {
              signal: AbortSignal.timeout(5000),
              method: "POST",
              headers: { origin, "content-type": "application/json" },
              body: JSON.stringify(body),
            })
          ).status,
          401
        );
        assert.equal(downloads.length, 1);
      }
    );
    await stage(
      "dutch-unsent-revision-cancellation-retains-version-history",
      async () => {
        await page.goto(origin + "/outreach");
        await page.locator("#ui-language").selectOption("en");
        await page
          .getByRole("button", {
            name: "Add individual candidate",
            exact: true,
          })
          .click();
        const intake = page.getByRole("dialog", {
          name: "Add candidate",
          exact: true,
        });
        await intake
          .getByLabel("Candidate name", { exact: true })
          .fill("Synthetic revision candidate");
        await intake
          .getByLabel("Evidence reference", { exact: true })
          .fill("synthetic-revision-fixture-only");
        await intake
          .getByRole("checkbox", {
            name: /This person supplied this data directly/,
          })
          .check();
        await intake
          .getByRole("button", {
            name: "Preview possible duplicates",
            exact: true,
          })
          .click();
        await intake.getByText(/No matching candidates found/).waitFor();
        await intake
          .getByRole("radio", {
            name: "Create a separate candidate",
            exact: true,
          })
          .check();
        await intake
          .getByRole("checkbox", {
            name: /I reviewed the suggestions and confirm/,
          })
          .check();
        await intake
          .getByRole("button", { name: "Confirm intake decision", exact: true })
          .click();
        await intake
          .getByText("Candidate saved. Nothing was sent.", { exact: true })
          .waitFor();
        await page.keyboard.press("Escape");
        await page
          .getByRole("row")
          .filter({ hasText: "Synthetic revision candidate" })
          .getByRole("button", { name: "Write draft", exact: true })
          .click();
        const composer = page.getByRole("region", {
          name: "Human-authored draft",
          exact: true,
        });
        const original =
          "Synthetic original revision message. No external contact.";
        const revised =
          "Synthetic revised message — café. No external contact.";
        await composer
          .getByLabel("Your original message", { exact: true })
          .fill(original);
        await composer
          .getByRole("checkbox", { name: /I wrote this text myself/ })
          .check();
        await composer
          .getByRole("button", { name: "Save draft", exact: true })
          .click();
        await composer.waitFor({ state: "hidden" });
        const [[old]] = await db.execute(
          "SELECT id FROM outreach_records WHERE user_id=? AND body=?",
          [owner, original]
        );
        await page.locator("#ui-language").selectOption("nl");
        await page
          .getByRole("button", {
            name: `Bericht beheren ${old.id}`,
            exact: true,
          })
          .click();
        let manager = page.getByRole("dialog", {
          name: "Bericht en contact beheren",
          exact: true,
        });
        await manager
          .getByRole("button", { name: "Bericht herzien", exact: true })
          .click();
        const editor = manager.getByRole("form", {
          name: "Niet-verzonden bericht herzien",
          exact: true,
        });
        await editor
          .getByLabel("Herzien bericht", { exact: true })
          .fill(revised);
        assert.equal(
          await editor
            .getByRole("button", { name: "Nieuwe versie opslaan", exact: true })
            .isDisabled(),
          true
        );
        await editor
          .getByRole("checkbox", {
            name: /Deze herziene tekst is door mijzelf geschreven/,
          })
          .check();
        await editor
          .getByRole("checkbox", {
            name: /Ik heb dit bericht niet extern verzonden/,
          })
          .check();
        page.once("dialog", async dialog => {
          assert.equal(
            dialog.message(),
            "Niet-opgeslagen wijzigingen aan dit bericht verwerpen?"
          );
          await dialog.dismiss();
        });
        await page.keyboard.press("Escape");
        assert.equal(
          await editor
            .getByLabel("Herzien bericht", { exact: true })
            .inputValue(),
          revised
        );
        assert.equal(
          await editor.getByRole("checkbox").first().isChecked(),
          true
        );
        await editor
          .getByLabel("Herzien bericht", { exact: true })
          .fill(revised + " Edit test.");
        assert.equal(
          await editor.getByRole("checkbox").first().isChecked(),
          false
        );
        assert.equal(
          await editor.getByRole("checkbox").last().isChecked(),
          false
        );
        await editor
          .getByLabel("Herzien bericht", { exact: true })
          .fill(revised);
        await editor.getByRole("checkbox").first().check();
        await editor.getByRole("checkbox").last().check();
        await page.setViewportSize({ width: 1365, height: 1000 });
        await editor.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/revision-dutch-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await editor
          .getByRole("button", { name: "Nieuwe versie opslaan", exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/revision-dutch-mobile.png",
        });
        await editor
          .getByRole("button", { name: "Nieuwe versie opslaan", exact: true })
          .click();
        await editor.waitFor({ state: "hidden" });
        const [[replacement]] = await db.execute(
          "SELECT id,body,state,confirmed_sent_at,revises_id FROM outreach_records WHERE user_id=? AND revises_id=?",
          [owner, old.id]
        );
        assert.equal(replacement.body, revised);
        assert.equal(replacement.state, "draft");
        assert.equal(replacement.confirmed_sent_at, null);
        const [[retained]] = await db.execute(
          "SELECT body,state,confirmed_sent_at FROM outreach_records WHERE id=?",
          [old.id]
        );
        assert.equal(retained.body, original);
        assert.equal(retained.state, "cancelled");
        assert.equal(retained.confirmed_sent_at, null);
        await manager
          .getByRole("button", {
            name: `Vorige versie bekijken ${old.id}`,
            exact: true,
          })
          .click();
        await manager
          .getByRole("heading", { name: `Bericht #${old.id}`, exact: true })
          .waitFor();
        await manager
          .getByText(/Dit historische of geannuleerde record/)
          .waitFor();
        assert.equal(
          await manager
            .getByRole("button", { name: "Bericht herzien", exact: true })
            .count(),
          0
        );
        await manager
          .getByRole("button", {
            name: `Vervanging bekijken ${replacement.id}`,
            exact: true,
          })
          .click();
        await manager
          .getByRole("heading", {
            name: `Bericht #${replacement.id}`,
            exact: true,
          })
          .waitFor();
        const cancel = manager.getByRole("button", {
          name: "Niet-verzonden concept annuleren",
          exact: true,
        });
        assert.equal(await cancel.isDisabled(), true);
        await manager
          .getByRole("checkbox", {
            name: /Annuleer dit niet-verzonden concept/,
          })
          .check();
        await cancel.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/cancellation-dutch-mobile.png",
        });
        await cancel.click();
        await manager
          .getByText(
            "Concept geannuleerd. Er is geen bericht verzonden of ingetrokken.",
            { exact: true }
          )
          .waitFor();
        const [[cancelled]] = await db.execute(
          "SELECT body,state,confirmed_sent_at,revises_id FROM outreach_records WHERE id=?",
          [replacement.id]
        );
        assert.equal(cancelled.body, revised);
        assert.equal(cancelled.state, "cancelled");
        assert.equal(cancelled.confirmed_sent_at, null);
        assert.equal(cancelled.revises_id, old.id);
        await manager
          .getByText(/Dit historische of geannuleerde record/)
          .waitFor();
        await manager
          .getByRole("button", { name: "Sluiten", exact: true })
          .click();
        await manager.waitFor({ state: "hidden" });
        await page.locator("#ui-language").selectOption("en");
        await page
          .getByRole("tab", { name: "Account data", exact: true })
          .click();
        await exportSection()
          .getByRole("checkbox", {
            name: "I understand this file contains private account and candidate data",
            exact: true,
          })
          .check();
      }
    );
    await stage(
      "dutch-csv-guidance-language-switch-preserves-unsent-declaration",
      async () => {
        await page.setViewportSize({ width: 1365, height: 1000 });
        await page.getByRole("tab", { name: "Prospects", exact: true }).click();
        const form = page.getByRole("form", {
          name: /^(Import permitted prospect CSV|Toegestane kandidaten-CSV importeren)$/,
        });
        const csv = "name,platform\nDutch preview only,manual";
        await form.getByLabel("Prospect CSV", { exact: true }).fill(csv);
        await form
          .getByLabel("Evidence reference", { exact: true })
          .fill("synthetic-dutch-preview");
        await form
          .getByRole("checkbox", { name: /Each person supplied/ })
          .check();
        await page.locator("#ui-language").selectOption("nl");
        const dutchForm = page.getByRole("form", {
          name: "Toegestane kandidaten-CSV importeren",
          exact: true,
        });
        assert.equal(
          await dutchForm
            .getByLabel("Kandidaten-CSV", { exact: true })
            .inputValue(),
          csv
        );
        assert.equal(
          await dutchForm
            .getByLabel("Bewijsreferentie", { exact: true })
            .inputValue(),
          "synthetic-dutch-preview"
        );
        assert.equal(
          await dutchForm
            .getByRole("checkbox", {
              name: /Iedere persoon heeft deze gegevens zelf verstrekt/,
            })
            .isChecked(),
          true
        );
        assert.equal(
          await dutchForm
            .getByRole("button", { name: "CSV importeren", exact: true })
            .isDisabled(),
          false
        );
        assert.equal(
          await dutchForm.evaluate(el => el.closest("[lang]").lang),
          "nl"
        );
        await page
          .getByText("Toegestane gegevens importeren", { exact: true })
          .scrollIntoViewIfNeeded();
        await page
          .getByText("Toegestane gegevens importeren", { exact: true })
          .evaluate(el =>
            window.scrollTo(
              0,
              el.getBoundingClientRect().top + window.scrollY - 85
            )
          );
        await page.screenshot({
          path: "/task-output/csv-import-dutch-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await page
          .getByText("Toegestane gegevens importeren", { exact: true })
          .scrollIntoViewIfNeeded();
        await page
          .getByText("Toegestane gegevens importeren", { exact: true })
          .evaluate(el =>
            window.scrollTo(
              0,
              el.getBoundingClientRect().top + window.scrollY - 85
            )
          );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth
          ),
          false
        );
        await page.screenshot({
          path: "/task-output/csv-import-dutch-mobile.png",
        });
        const csvExport = dutchForm.getByRole("region", {
          name: "CSV-export van kandidaten",
          exact: true,
        });
        const exported = page.waitForEvent("download");
        await csvExport
          .getByRole("button", {
            name: "Actieve kandidaten exporteren",
            exact: true,
          })
          .click();
        const csvDownload = await exported;
        const exportedCsv = await fs.readFile(await csvDownload.path(), "utf8");
        assert.match(exportedCsv, /name.*platform/);
        assert.doesNotMatch(
          exportedCsv,
          /Foreign export exclusion marker|Dutch preview only/
        );
        await csvExport
          .getByRole("status")
          .getByText(/CSV gemaakt voor/)
          .waitFor();
        await page.locator("#ui-language").selectOption("en");
        await form
          .getByRole("status")
          .getByText(/CSV generated for/)
          .waitFor();
        assert.equal(
          await form.getByLabel("Prospect CSV", { exact: true }).inputValue(),
          csv
        );
        assert.equal(
          await form
            .getByRole("checkbox", { name: /Each person supplied/ })
            .isChecked(),
          true
        );
        const [[unsaved]] = await db.execute(
          "SELECT COUNT(*) AS total FROM prospects WHERE user_id=? AND name='Dutch preview only'",
          [owner]
        );
        assert.equal(unsaved.total, 0);
        await page
          .getByRole("tab", { name: "Account data", exact: true })
          .click();
      }
    );
    await stage(
      "committed-csv-lost-response-replays-without-duplicates",
      async () => {
        await page.setViewportSize({ width: 1365, height: 1000 });
        await page.getByRole("tab", { name: "Prospects", exact: true }).click();
        const form = page.getByRole("form", {
          name: /^(Import permitted prospect CSV|Toegestane kandidaten-CSV importeren)$/,
        });
        const csvInput = form.getByLabel(/^(Prospect CSV|Kandidaten-CSV)$/);
        const evidence = form.getByLabel("Evidence reference", { exact: true });
        const rights = form.getByRole("checkbox", {
          name: /Each person supplied/,
        });
        const requestBodies = [];
        const lostReply = async route => {
          requestBodies.push(route.request().postData());
          if (requestBodies.length === 1) {
            const committed = await route.fetch();
            assert.equal(committed.ok(), true);
            await route.abort("failed");
          } else await route.continue();
        };
        await page.route(
          "**/api/trpc/criticalPath.prospects.importCsv**",
          lostReply
        );
        await csvInput.fill(
          "name,platform,consentStatus\nCSV uncertain synthetic,manual,unknown"
        );
        await evidence.fill("synthetic-csv-lost-response");
        await rights.check();
        await form
          .getByRole("button", { name: "Import CSV", exact: true })
          .click();
        await form.getByText(/No confirmed import result/).waitFor();
        assert.equal(await csvInput.isDisabled(), true);
        assert.equal(await evidence.isDisabled(), true);
        assert.equal(await rights.isDisabled(), true);
        const [[stored]] = await db.execute(
          "SELECT COUNT(*) AS total FROM prospects WHERE user_id=? AND name='CSV uncertain synthetic'",
          [owner]
        );
        assert.equal(stored.total, 1);
        await page.locator("#ui-language").selectOption("nl");
        await form.getByText(/Geen bevestigd importresultaat/).waitFor();
        await form
          .getByText(/Geen bevestigd importresultaat/)
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "/task-output/import-uncertain-desktop.png",
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await form
          .getByText(/Geen bevestigd importresultaat/)
          .scrollIntoViewIfNeeded();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth
          ),
          false
        );
        await page.screenshot({
          path: "/task-output/import-uncertain-mobile.png",
        });
        await page.setViewportSize({ width: 1365, height: 1000 });
        await form
          .getByRole("button", {
            name: "Ongewijzigde import opnieuw proberen",
            exact: true,
          })
          .click();
        await form
          .getByText(/Eerder opgeslagen resultaat teruggevonden/)
          .waitFor();
        assert.equal(requestBodies.length, 2);
        assert.equal(requestBodies[0], requestBodies[1]);
        const [[after]] = await db.execute(
          "SELECT COUNT(*) AS total FROM prospects WHERE user_id=? AND name='CSV uncertain synthetic'",
          [owner]
        );
        assert.equal(after.total, 1);
        assert.equal(await csvInput.isDisabled(), false);
        assert.equal(
          await form.getByText(/Geen bevestigd importresultaat/).count(),
          0
        );
        await page.unroute(
          "**/api/trpc/criticalPath.prospects.importCsv**",
          lostReply
        );
        assert.ok(errors.length >= 1);
        for (const message of errors)
          assert.match(
            message,
            /net::ERR_FAILED|\[API Mutation Error\] TRPCClientError: Failed to fetch/
          );
        expectedDiagnostics.push(...errors.splice(0));
        await page.locator("#ui-language").selectOption("en");
        await page
          .getByRole("tab", { name: "Account data", exact: true })
          .click();
      }
    );
    await stage(
      "rejected-csv-requires-explicit-record-review-before-editing",
      async () => {
        await page.getByRole("tab", { name: "Prospects", exact: true }).click();
        const form = page.getByRole("form", {
          name: "Import permitted prospect CSV",
          exact: true,
        });
        await form
          .getByLabel("Prospect CSV", { exact: true })
          .fill("name,platform\nForbidden CSV synthetic,Communitech");
        await form
          .getByLabel("Evidence reference", { exact: true })
          .fill("synthetic-rejected-csv");
        await form
          .getByRole("checkbox", { name: /Each person supplied/ })
          .check();
        await form
          .getByRole("button", { name: "Import CSV", exact: true })
          .click();
        await form.getByText(/No confirmed import result/).waitFor();
        const [[stored]] = await db.execute(
          "SELECT COUNT(*) AS total FROM prospects WHERE user_id=? AND name='Forbidden CSV synthetic'",
          [owner]
        );
        assert.equal(stored.total, 0);
        const release = form.getByRole("button", {
          name: "Allow editing after checking records",
          exact: true,
        });
        page.once("dialog", async confirmation => {
          assert.match(
            confirmation.message(),
            /Have you checked your candidates/
          );
          await confirmation.dismiss();
        });
        await release.click();
        assert.equal(
          await form.getByLabel("Prospect CSV", { exact: true }).isDisabled(),
          true
        );
        page.once("dialog", confirmation => confirmation.accept());
        await release.click();
        assert.equal(
          await form.getByLabel("Prospect CSV", { exact: true }).isDisabled(),
          false
        );
        await form
          .getByLabel("Prospect CSV", { exact: true })
          .fill("name,platform\nCorrected but unsaved,manual");
        assert.equal(
          await form
            .getByRole("checkbox", { name: /Each person supplied/ })
            .isChecked(),
          false
        );
        assert.equal(
          await form
            .getByRole("button", { name: "Import CSV", exact: true })
            .isDisabled(),
          true
        );
        assert.equal(errors.length, 2);
        assert.match(errors[0], /server responded with a status of 403/);
        assert.match(errors[1], /^\[API Mutation Error\] TRPCClientError:/);
        expectedDiagnostics.push(...errors.splice(0));
        await page
          .getByRole("tab", { name: "Account data", exact: true })
          .click();
      }
    );
    await stage(
      "oversized-retained-export-refused-without-partial-download",
      async () => {
        assert.deepEqual(errors, []);
        for (let batch = 0; batch < 3; batch++)
          await db.execute(
            "INSERT INTO prospects (user_id,name,bio,platform,source_kind,consent_status) WITH RECURSIVE seq AS (SELECT 1 AS n UNION ALL SELECT n+1 FROM seq WHERE n<710) SELECT ?,CONCAT('Synthetic capacity candidate ',?, '-',n),REPEAT('x',10000),'manual','manual','unknown' FROM seq",
            [owner, batch]
          );
        const [[size]] = await db.execute(
          "SELECT SUM(OCTET_LENGTH(bio)) AS bytes FROM prospects WHERE user_id=?",
          [owner]
        );
        assert.ok(Number(size.bytes) > 20 * 1024 * 1024);
        const section = exportSection();
        await section
          .getByRole("checkbox", {
            name: "I understand this file contains private account and candidate data",
            exact: true,
          })
          .check();
        await section
          .getByLabel("Current password", { exact: true })
          .fill(password);
        await section
          .getByRole("button", { name: "Download account JSON", exact: true })
          .click();
        await section
          .getByRole("alert")
          .getByText(
            "Account export exceeds 20 MiB or 100000 records. No partial file was produced. An operator-assisted export is required.",
            { exact: true }
          )
          .waitFor();
        assert.equal(downloads.length, 2);
        assert.equal(
          await section
            .getByLabel("Current password", { exact: true })
            .inputValue(),
          ""
        );
        const [[quota]] = await db.execute(
          "SELECT attempts FROM account_export_quotas WHERE user_id=?",
          [owner]
        );
        assert.equal(quota.attempts, 3);
        const [[audits]] = await db.execute(
          "SELECT COUNT(*) AS total FROM audit_events WHERE user_id=? AND action='account.export' AND outcome='success'",
          [owner]
        );
        assert.equal(audits.total, 1);
        assert.equal(errors.length, 2);
        assert.equal(
          errors[0],
          "Failed to load resource: the server responded with a status of 413 (Payload Too Large)"
        );
        assert.match(
          errors[1],
          /^\[API Mutation Error\] TRPCClientError: Account export exceeds 20 MiB or 100000 records\./
        );
        expectedDiagnostics.push(...errors.splice(0));
      }
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    const onboardingStages = await runSyntheticOnboardingJourney({
      page,
      context,
      db,
      origin,
      owner,
      foreignOwner: foreign.insertId,
      email,
      foreignEmail,
      password,
      onStage: name => {
        activeStage = name;
      },
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      JSON.stringify({
        passed: true,
        transport: "isolated-http-loopback",
        stages,
        onboardingStages,
        rpcMocks: 0,
        responseFaultsInjected: 1,
        externalProviderActions: 0,
        syntheticCompletionRecords: 1,
        realSends: 0,
        verification: "synthetic-preverified-not-inbox",
        browser: browser.version(),
        errors,
        expectedRefusalDiagnostics: expectedDiagnostics.length,
        external,
      })
    );
  } catch (error) {
    if (page)
      await page
        .screenshot({ path: "/task-output/failure.png" })
        .catch(() => {});
    console.error(
      JSON.stringify({
        event: "browser_journey_failed",
        stage: activeStage,
        completedStages: stages,
        error: redact(error?.message),
        consoleErrorCount: errors.length,
        externalRequestCount: external.length,
      })
    );
    throw error;
  } finally {
    if (browser) await browser.close();
    if (db) await db.end();
    clearTimeout(watchdog);
  }
})().catch(e => {
  console.error(
    JSON.stringify({
      event: "browser_journey_rejected",
      stage: activeStage,
      error: redact(e?.message),
    })
  );
  process.exitCode = 1;
});
