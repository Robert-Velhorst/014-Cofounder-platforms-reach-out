// Test-only extension of the owned browser fixture. No top-level I/O, new
// account, database address, provider adapter or independent fixture lifecycle.
import assert from "node:assert/strict";
import { BROWSER_ONBOARDING_STAGES } from "./browser-journey-policy.mjs";

export const SYNTHETIC_PROFILE = Object.freeze({
  location: "Synthetic Arnhem — 東京",
  experience: "experienced",
  commitment: "flexible",
  skills: Object.freeze(["Developer"]),
  industries: Object.freeze(["Other"]),
  looking_for: Object.freeze(["Technical Co-Founder"]),
  target_industries: Object.freeze(["Consulting"]),
  work_style: Object.freeze(["Collaborative"]),
  values: Object.freeze(["Transparency"]),
});

// Executed both against real SQL rows in the journey and pure native fixtures.
// Passing this assertion alone is not evidence that a browser or database ran.
export function assertSyntheticPrivateProfile(rows, owner, location, id) {
  assert.equal(rows.length, 1, "one_owned_private_profile_required");
  const row = rows[0];
  assert.ok(Number.isSafeInteger(row.id) && row.id > 0);
  assert.equal(row.user_id, owner);
  if (id !== undefined) assert.equal(row.id, id, "profile_identity_changed");
  assert.equal(row.location, location);
  assert.equal(row.experience, SYNTHETIC_PROFILE.experience);
  assert.equal(row.commitment, SYNTHETIC_PROFILE.commitment);
  assert.ok(row.is_public === 0 || row.is_public === false);
  assert.equal(row.completeness, 100);
  for (const field of [
    "skills",
    "industries",
    "looking_for",
    "target_industries",
    "work_style",
    "values",
  ]) {
    const actual =
      typeof row[field] === "string" ? JSON.parse(row[field]) : row[field];
    assert.deepEqual(
      actual,
      SYNTHETIC_PROFILE[field],
      `profile_signal_changed:${field}`
    );
  }
  return row.id;
}

export async function runSyntheticOnboardingJourney({
  page,
  context,
  db,
  origin,
  owner,
  foreignOwner,
  email,
  foreignEmail,
  password,
  onStage,
}) {
  assert.equal(origin, "http://localhost:13216");
  assert.ok(Number.isSafeInteger(owner) && owner > 0);
  assert.ok(
    Number.isSafeInteger(foreignOwner) &&
      foreignOwner > 0 &&
      foreignOwner !== owner
  );
  const stages = [];
  const originalLocation = SYNTHETIC_PROFILE.location;
  const savedLocation = "Synthetic corrected city — 東京";
  let profileId;
  const fields =
    "id,user_id,location,experience,commitment,skills,industries,looking_for,target_industries,work_style,`values`,is_public,completeness";
  async function rows(userId = owner) {
    const [result] = await db.execute(
      `SELECT ${fields} FROM user_profiles WHERE user_id=? ORDER BY id`,
      [userId]
    );
    return result;
  }
  async function auditCount() {
    const [[result]] = await db.execute(
      "SELECT COUNT(*) AS total FROM audit_events WHERE user_id=? AND action='profile.save' AND outcome='success'",
      [owner]
    );
    return result.total;
  }
  async function stage(name, run) {
    assert.equal(name, BROWSER_ONBOARDING_STAGES[stages.length]);
    onStage(name);
    await run();
    stages.push(name);
    console.log(JSON.stringify({ onboardingStage: name }));
  }
  const editor = () =>
    page.getByRole("group", {
      name: /^(Private profile editor|Privéprofiel bewerken)$/,
    });
  async function language(value) {
    await page.locator("#ui-language").selectOption(value);
  }
  async function responsiveCapture(name) {
    assert.equal(await page.title(), "CoFounder Outreach");
    assert.equal(new URL(page.url()).pathname, "/onboarding");
    assert.equal(await page.locator("vite-error-overlay").count(), 0);
    await editor().waitFor();
    for (const [width, height] of [
      [1365, 1000],
      [375, 812],
    ]) {
      await page.setViewportSize({ width, height });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `/task-output/${name}-${width}.png` });
    }
    await page.setViewportSize({ width: 1365, height: 1000 });
  }
  async function login(userEmail) {
    await page.goto(origin + "/login");
    await language("en");
    await page.getByLabel("Email", { exact: true }).fill(userEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("button", { name: "Add individual candidate", exact: true })
      .waitFor();
  }
  async function advanceToReview() {
    for (let step = 0; step < 3; step++)
      await editor().getByRole("button", { name: "Next", exact: true }).click();
    await editor()
      .getByRole("heading", { name: "Review Your Profile", exact: true })
      .waitFor();
  }
  await stage(
    "private-profile-first-run-language-and-responsive-review",
    async () => {
      assert.deepEqual(await rows(), []);
      assert.deepEqual(await rows(foreignOwner), []);
      assert.equal(await auditCount(), 0);
      await page.goto(origin + "/onboarding");
      await language("en");
      await page
        .getByRole("heading", {
          level: 1,
          name: "Your co-founder search profile",
          exact: true,
        })
        .waitFor();
      await page
        .getByText(/it does not publish it or send it to co-founder platforms/)
        .waitFor();
      const form = editor();
      assert.equal(
        await form.getByLabel("Location", { exact: true }).inputValue(),
        ""
      );
      await form.getByLabel("Location", { exact: true }).fill(originalLocation);
      await form
        .getByLabel("Experience Level", { exact: true })
        .selectOption("experienced");
      await form
        .getByRole("button", { name: "Developer", exact: true })
        .click();
      await form.getByRole("button", { name: "Other", exact: true }).click();
      await language("nl");
      assert.equal(
        await form.getByLabel("Locatie", { exact: true }).inputValue(),
        originalLocation
      );
      assert.equal(
        await form.getByLabel("Ervaringsniveau", { exact: true }).inputValue(),
        "experienced"
      );
      assert.equal(
        await form
          .getByRole("button", { name: "Softwareontwikkelaar", exact: true })
          .getAttribute("aria-pressed"),
        "true"
      );
      assert.equal(
        await form
          .getByRole("button", { name: "Overig", exact: true })
          .getAttribute("aria-pressed"),
        "true"
      );
      await responsiveCapture("onboarding-basic-nl");
      await form
        .getByRole("button", { name: "Volgende", exact: true })
        .press("Enter");
      await form
        .getByRole("heading", { name: "Wat je zoekt", exact: true })
        .waitFor();
      await form
        .getByRole("button", { name: "Technische medeoprichter", exact: true })
        .click();
      await form.getByRole("button", { name: "Advies", exact: true }).click();
      await form
        .getByLabel("Beschikbare inzet", { exact: true })
        .selectOption("flexible");
      await form.getByRole("button", { name: "Volgende", exact: true }).click();
      await form
        .getByRole("heading", { name: "Werkstijl en waarden", exact: true })
        .waitFor();
      await form
        .getByRole("button", { name: "Samenwerkend", exact: true })
        .click();
      await form
        .getByRole("button", { name: "Transparantie", exact: true })
        .click();
      await form.getByRole("button", { name: "Volgende", exact: true }).click();
      await form
        .getByRole("heading", { name: "Controleer je profiel", exact: true })
        .waitFor();
      for (const value of [
        originalLocation,
        "Ervaren oprichter",
        "Flexibel",
        "Softwareontwikkelaar",
        "Technische medeoprichter",
        "Advies",
        "Samenwerkend",
        "Transparantie",
        "Overig",
      ])
        await form.getByText(value, { exact: true }).waitFor();
      assert.deepEqual(await rows(), []);
      await responsiveCapture("onboarding-review-nl");
    }
  );
  await stage(
    "private-profile-real-save-retains-canonical-private-data",
    async () => {
      await editor()
        .getByRole("button", { name: "Privéprofiel opslaan", exact: true })
        .click();
      await page.waitForURL(url => url.pathname === "/outreach");
      profileId = assertSyntheticPrivateProfile(
        await rows(),
        owner,
        originalLocation
      );
      assert.equal(await auditCount(), 1);
      assert.deepEqual(await rows(foreignOwner), []);
      await language("en");
      await page
        .getByRole("button", { name: "Add individual candidate", exact: true })
        .waitFor();
    }
  );
  await stage("private-profile-unsaved-edit-roundtrip-and-reload", async () => {
    await page.goto(origin + "/onboarding");
    const form = editor();
    assert.equal(
      await form.getByLabel("Location", { exact: true }).inputValue(),
      originalLocation
    );
    const unsaved = "Synthetic unsaved local edit";
    await form.getByLabel("Location", { exact: true }).fill(unsaved);
    await form
      .getByLabel("Experience Level", { exact: true })
      .selectOption("first-time");
    await language("nl");
    await form.getByRole("button", { name: "Volgende", exact: true }).click();
    await form.getByRole("button", { name: "Terug", exact: true }).click();
    assert.equal(
      await form.getByLabel("Locatie", { exact: true }).inputValue(),
      unsaved
    );
    assert.equal(
      await form.getByLabel("Ervaringsniveau", { exact: true }).inputValue(),
      "first-time"
    );
    assertSyntheticPrivateProfile(
      await rows(),
      owner,
      originalLocation,
      profileId
    );
    assert.equal(await auditCount(), 1);
    await responsiveCapture("onboarding-unsaved-nl");
    await page.reload();
    assert.equal(
      await form.getByLabel("Locatie", { exact: true }).inputValue(),
      originalLocation
    );
    assert.equal(
      await form.getByLabel("Ervaringsniveau", { exact: true }).inputValue(),
      "experienced"
    );
    await language("en");
  });
  await stage("private-profile-second-save-and-fresh-session", async () => {
    await editor().getByLabel("Location", { exact: true }).fill(savedLocation);
    await advanceToReview();
    await editor()
      .getByRole("button", { name: "Save private profile", exact: true })
      .click();
    await page.waitForURL(url => url.pathname === "/outreach");
    assertSyntheticPrivateProfile(
      await rows(),
      owner,
      savedLocation,
      profileId
    );
    assert.equal(await auditCount(), 2);
    await context.clearCookies();
    await page.goto(origin + "/onboarding");
    await page
      .getByRole("heading", { level: 1, name: "Sign in", exact: true })
      .waitFor();
    await login(email);
    await page.goto(origin + "/onboarding");
    assert.equal(
      await editor().getByLabel("Location", { exact: true }).inputValue(),
      savedLocation
    );
    assert.equal(
      await editor()
        .getByRole("button", { name: "Developer", exact: true })
        .getAttribute("aria-pressed"),
      "true"
    );
    assertSyntheticPrivateProfile(
      await rows(),
      owner,
      savedLocation,
      profileId
    );
    await responsiveCapture("onboarding-fresh-session-en");
  });
  await stage(
    "private-profile-http-owner-and-publication-refusals",
    async () => {
      const path = accountId =>
        origin +
        "/api/trpc/profile.get?input=" +
        encodeURIComponent(JSON.stringify({ json: { accountId } }));
      const ownedResponse = await context.request.get(path(owner), {
        timeout: 10000,
      });
      assert.equal(ownedResponse.status(), 200);
      const ownedProfile = (await ownedResponse.json()).result.data.json;
      assert.equal(ownedProfile.userId, owner);
      assert.equal(ownedProfile.location, savedLocation);
      assert.equal(ownedProfile.isPublic, false);
      const foreignResponse = await context.request.get(path(foreignOwner), {
        timeout: 10000,
      });
      assert.equal(foreignResponse.status(), 403);
      assert.ok(!(await foreignResponse.text()).includes(savedLocation));
      assert.equal(
        (await fetch(path(owner), { signal: AbortSignal.timeout(5000) }))
          .status,
        401
      );
      for (const [input, expected] of [
        [
          {
            accountId: foreignOwner,
            location: "Synthetic refused foreign patch",
          },
          403,
        ],
        [{ accountId: owner, isPublic: true }, 400],
      ])
        assert.equal(
          (
            await context.request.post(origin + "/api/trpc/profile.create", {
              data: { json: input },
              headers: { origin },
              timeout: 10000,
            })
          ).status(),
          expected
        );
      assertSyntheticPrivateProfile(
        await rows(),
        owner,
        savedLocation,
        profileId
      );
      assert.deepEqual(await rows(foreignOwner), []);
      assert.equal(await auditCount(), 2);
    }
  );
  await stage("private-profile-cross-account-browser-boundary", async () => {
    await context.clearCookies();
    await login(foreignEmail);
    await page.goto(origin + "/onboarding");
    const form = editor();
    assert.equal(
      await form.getByLabel("Location", { exact: true }).inputValue(),
      ""
    );
    assert.equal(
      await form.getByLabel("Experience Level", { exact: true }).inputValue(),
      ""
    );
    assert.equal(
      await form
        .getByRole("button", { name: "Developer", exact: true })
        .getAttribute("aria-pressed"),
      "false"
    );
    assert.equal(
      await page.getByText(savedLocation, { exact: true }).count(),
      0
    );
    await responsiveCapture("onboarding-foreign-owner-en");
    assertSyntheticPrivateProfile(
      await rows(),
      owner,
      savedLocation,
      profileId
    );
    assert.deepEqual(await rows(foreignOwner), []);
    assert.equal(await auditCount(), 2);
  });
  assert.deepEqual(stages, BROWSER_ONBOARDING_STAGES);
  return stages;
}
