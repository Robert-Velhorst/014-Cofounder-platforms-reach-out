// Test-only extension of the existing owned fixture. SQL observes; all request
// transitions use the real UI/API. No independent lifecycle or erasure executor.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { BROWSER_ACCOUNT_RIGHTS_STAGES } from "./browser-journey-policy.mjs";

const uuid =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

// Pure observation assertions also exercised by native fixtures. They are not
// proof that SQL, a browser or the product ran when used against native doubles.
export function assertSyntheticDeletionRow(rows, accountId, expected) {
  assert.equal(rows.length, 1, "one_owned_deletion_request_required");
  const row = rows[0];
  assert.equal(row.user_id, accountId);
  for (const field of ["status", "revision", "attempts"])
    assert.equal(row[field], expected[field], `deletion_row_${field}_mismatch`);
  assert.match(row.request_key, uuid);
  if (expected.requestKey !== undefined)
    assert.equal(
      row.request_key,
      expected.requestKey,
      "deletion_request_key_changed"
    );
  assert.ok(
    row.requested_at !== null &&
      Number.isFinite(new Date(row.requested_at).getTime())
  );
  if (expected.status === "withdrawn")
    assert.ok(
      row.withdrawn_at !== null &&
        Number.isFinite(new Date(row.withdrawn_at).getTime())
    );
  else {
    assert.equal(expected.status, "pending_review");
    assert.equal(row.withdrawn_at, null);
  }
  return row.request_key;
}

// Observe the actual httpBatchLink command, including the canonical token in
// either UI language. Never log the body, password or full request object.
export function assertSyntheticDeletionWire(request, expected) {
  assert.ok(["request", "withdraw"].includes(expected.action));
  const operation =
    expected.action === "request" ? "requestDeletion" : "withdrawDeletion";
  const url = new URL(request.url);
  assert.equal(url.origin, "http://localhost:13216");
  assert.equal(url.pathname, `/api/trpc/accountData.${operation}`);
  assert.equal(url.search, "?batch=1");
  assert.equal(request.method, "POST");
  assert.deepEqual(Object.keys(request.body), ["0"]);
  const command = request.body["0"].json;
  assert.deepEqual(Object.keys(command).sort(), [
    "accountId",
    "confirmation",
    "expectedRevision",
    "password",
    "requestKey",
  ]);
  assert.equal(command.accountId, expected.accountId);
  assert.equal(command.expectedRevision, expected.revision);
  assert.ok(
    command.password === expected.password,
    "deletion_wire_password_mismatch"
  );
  assert.equal(
    command.confirmation,
    expected.action === "request" ? "REQUEST ACCOUNT DELETION" : true
  );
  assert.match(command.requestKey, uuid);
  if (expected.requestKey !== undefined)
    assert.equal(command.requestKey, expected.requestKey);
  return command.requestKey;
}

export async function runSyntheticAccountRightsJourney({
  page,
  context,
  db,
  origin,
  owner,
  foreignOwner,
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
  assert.ok(
    typeof password === "string" &&
      password.length >= 16 &&
      password.length <= 128
  );
  assert.equal(typeof onStage, "function");
  // Onboarding ended in the existing second account. Do not create another one.
  const accountId = foreignOwner;
  const stages = [];
  const panel = () =>
    page.getByRole("region", {
      name: /^(Account deletion request|Verzoek om accountverwijdering)$/,
    });
  const passwordInput = () =>
    panel().getByLabel(
      /^(Current password for deletion requests|Huidig wachtwoord voor verwijderverzoeken)$/
    );
  const confirmation = () => panel().getByRole("checkbox");
  async function language(value) {
    await page.locator("#ui-language").selectOption(value);
    assert.equal(await panel().getAttribute("lang"), value);
  }
  async function openAccountTab() {
    await page
      .getByRole("tab", { name: /^(Account data|Accountgegevens)$/ })
      .click();
    await panel().waitFor();
  }
  async function rows(userId = accountId) {
    const [result] = await db.execute(
      "SELECT user_id,request_key,status,revision,requested_at,withdrawn_at,attempts FROM account_deletion_requests WHERE user_id=?",
      [userId]
    );
    return result;
  }
  async function retainedState() {
    const [users] = await db.execute(
      "SELECT id,deletion_fenced_at FROM users WHERE id IN (?,?) ORDER BY id",
      [owner, accountId]
    );
    assert.equal(users.length, 2);
    assert.ok(users.every(row => row.deletion_fenced_at === null));
    const counts = {};
    for (const table of [
      "users",
      "prospects",
      "user_profiles",
      "account_mail_jobs",
    ]) {
      const [[row]] = await db.execute(
        `SELECT COUNT(*) AS total FROM ${table}`
      );
      counts[table] = row.total;
    }
    const [audits] = await db.execute(
      "SELECT user_id,action,entity_id,outcome,metadata FROM audit_events WHERE action IN ('account.deletion.request','account.deletion.withdraw') ORDER BY id"
    );
    return { users, counts, audits };
  }
  async function stage(name, run) {
    assert.equal(name, BROWSER_ACCOUNT_RIGHTS_STAGES[stages.length]);
    onStage(name);
    await run();
    stages.push(name);
    console.log(JSON.stringify({ accountRightsStage: name }));
  }
  async function clearControls() {
    assert.equal(await passwordInput().inputValue(), "");
    assert.equal(await confirmation().isChecked(), false);
    assert.equal(
      await panel()
        .getByRole("button", {
          name: /^(Submit deletion request|Verwijderverzoek indienen|Withdraw deletion request|Verwijderverzoek intrekken)$/,
        })
        .isDisabled(),
      true
    );
  }
  async function submit(action, locale, revision, requestKey) {
    const button = panel().getByRole("button", {
      name:
        action === "request"
          ? locale === "nl"
            ? "Verwijderverzoek indienen"
            : "Submit deletion request"
          : locale === "nl"
            ? "Verwijderverzoek intrekken"
            : "Withdraw deletion request",
      exact: true,
    });
    await passwordInput().fill(password);
    assert.equal(await button.isDisabled(), true);
    await confirmation().check();
    assert.equal(await button.isDisabled(), false);
    const operation =
      action === "request" ? "requestDeletion" : "withdrawDeletion";
    const [response] = await Promise.all([
      page.waitForResponse(
        response =>
          new URL(response.url()).pathname ===
            `/api/trpc/accountData.${operation}` &&
          response.request().method() === "POST",
        { timeout: 10000 }
      ),
      button.press("Enter"),
    ]);
    assert.equal(response.status(), 200);
    const request = response.request();
    const key = assertSyntheticDeletionWire(
      {
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON(),
      },
      {
        action,
        accountId,
        revision,
        password,
        ...(requestKey ? { requestKey } : {}),
      }
    );
    await panel()
      .getByText(
        action === "request"
          ? locale === "nl"
            ? "Nog te beoordelen door de beheerder. Er is niets verwijderd."
            : "Awaiting operator review. Nothing has been deleted."
          : locale === "nl"
            ? "Verzoek ingetrokken. Je account is niet verwijderd."
            : "Request withdrawn. Your account has not been deleted.",
        { exact: true }
      )
      .waitFor();
    await clearControls();
    assertSyntheticDeletionRow(await rows(), accountId, {
      status: action === "request" ? "pending_review" : "withdrawn",
      revision: revision + 1,
      attempts: revision + 1,
      requestKey: key,
    });
    assert.deepEqual(await rows(owner), []);
    return key;
  }
  async function responsiveCapture(name) {
    assert.equal(await page.title(), "CoFounder Outreach");
    assert.equal(new URL(page.url()).pathname, "/outreach");
    assert.equal(await page.locator("vite-error-overlay").count(), 0);
    await clearControls();
    for (const [width, height] of [
      [1365, 1000],
      [375, 812],
    ]) {
      await page.setViewportSize({ width, height });
      await panel().scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      );
      await page.screenshot({ path: `/task-output/${name}-${width}.png` });
    }
    await page.setViewportSize({ width: 1365, height: 1000 });
  }
  let initial, firstKey, secondKey;
  await stage(
    "account-deletion-english-request-refresh-and-reload",
    async () => {
      initial = await retainedState();
      assert.deepEqual(initial.audits, []);
      assert.deepEqual(await rows(), []);
      assert.deepEqual(await rows(owner), []);
      await page.goto(origin + "/outreach");
      await openAccountTab();
      await language("en");
      await panel()
        .getByText("No deletion request is recorded.", { exact: true })
        .waitFor();
      assert.equal(await panel().locator("fieldset").isDisabled(), false);
      await clearControls();
      // Neither the checkbox alone nor a password alone may enable submission.
      await confirmation().check();
      assert.equal(
        await panel()
          .getByRole("button", { name: "Submit deletion request", exact: true })
          .isDisabled(),
        true
      );
      await confirmation().uncheck();
      await passwordInput().fill(password);
      await language("nl");
      assert.ok(
        (await passwordInput().inputValue()) === password,
        "password_lost_on_language_switch"
      );
      assert.equal(await confirmation().isChecked(), false);
      await language("en");
      firstKey = await submit("request", "en", 0);
      const [refreshed] = await Promise.all([
        page.waitForResponse(
          response =>
            new URL(response.url()).pathname ===
              "/api/trpc/accountData.deletionStatus" &&
            response.request().method() === "GET",
          { timeout: 10000 }
        ),
        panel()
          .getByRole("button", { name: "Refresh request status", exact: true })
          .click(),
      ]);
      assert.equal(refreshed.status(), 200);
      await panel()
        .getByText(`Request reference: ${firstKey}`, { exact: true })
        .waitFor();
      await page.reload();
      await openAccountTab();
      await panel()
        .getByText(`Request reference: ${firstKey}`, { exact: true })
        .waitFor();
      await clearControls();
      assertSyntheticDeletionRow(await rows(), accountId, {
        status: "pending_review",
        revision: 1,
        attempts: 1,
        requestKey: firstKey,
      });
    }
  );
  await stage("account-deletion-dutch-withdraw-retains-account", async () => {
    await language("nl");
    await panel()
      .getByText(/Automatische verwijdering is niet ingeschakeld/)
      .waitFor();
    await panel()
      .getByText(/Er wordt geen e-mail of platformbericht verstuurd/)
      .waitFor();
    await responsiveCapture("account-deletion-pending-nl");
    await submit("withdraw", "nl", 1, firstKey);
    const state = await retainedState();
    assert.deepEqual(state.users, initial.users);
    assert.deepEqual(state.counts, initial.counts);
  });
  await stage(
    "account-deletion-dutch-rerequest-and-english-withdraw",
    async () => {
      secondKey = await submit("request", "nl", 2);
      assert.notEqual(secondKey, firstKey);
      await language("en");
      await panel()
        .getByText("Awaiting operator review. Nothing has been deleted.", {
          exact: true,
        })
        .waitFor();
      await submit("withdraw", "en", 3, secondKey);
      await responsiveCapture("account-deletion-withdrawn-en");
      const state = await retainedState();
      assert.deepEqual(state.users, initial.users);
      assert.deepEqual(state.counts, initial.counts);
      assert.equal(state.audits.length, 4);
      for (const [index, row] of state.audits.entries()) {
        assert.equal(row.user_id, accountId);
        assert.equal(
          row.action,
          index % 2 === 0
            ? "account.deletion.request"
            : "account.deletion.withdraw"
        );
        assert.equal(row.entity_id, index < 2 ? firstKey : secondKey);
        assert.equal(row.outcome, "success");
        const metadata =
          typeof row.metadata === "string"
            ? JSON.parse(row.metadata)
            : row.metadata;
        assert.deepEqual(metadata, { revision: index + 1 });
      }
    }
  );
  await stage(
    "account-deletion-http-owner-and-anonymous-refusals",
    async () => {
      const before = {
        retained: await retainedState(),
        requests: await rows(),
        foreignRequests: await rows(owner),
      };
      const path = id =>
        origin +
        "/api/trpc/accountData.deletionStatus?input=" +
        encodeURIComponent(JSON.stringify({ json: { accountId: id } }));
      const own = await context.request.get(path(accountId), {
        timeout: 10000,
      });
      assert.equal(own.status(), 200);
      const status = (await own.json()).result.data.json;
      assert.deepEqual(
        {
          accountId: status.accountId,
          status: status.status,
          revision: status.revision,
          requestKey: status.requestKey,
          requestsEnabled: status.requestsEnabled,
          deletionEnabled: status.deletionEnabled,
        },
        {
          accountId,
          status: "withdrawn",
          revision: 4,
          requestKey: secondKey,
          requestsEnabled: true,
          deletionEnabled: false,
        }
      );
      const foreign = await context.request.get(path(owner), {
        timeout: 10000,
      });
      assert.equal(foreign.status(), 403);
      assert.ok(!(await foreign.text()).includes(secondKey));
      assert.equal(
        (await fetch(path(accountId), { signal: AbortSignal.timeout(5000) }))
          .status,
        401
      );
      for (const action of ["requestDeletion", "withdrawDeletion"]) {
        const command = {
          accountId: owner,
          password,
          expectedRevision: 0,
          requestKey: randomUUID(),
          confirmation:
            action === "requestDeletion" ? "REQUEST ACCOUNT DELETION" : true,
        };
        const endpoint = origin + `/api/trpc/accountData.${action}`;
        const response = await context.request.post(endpoint, {
          data: { json: command },
          headers: { origin },
          timeout: 10000,
        });
        assert.equal(response.status(), 403);
        assert.equal(
          (
            await fetch(endpoint, {
              method: "POST",
              headers: { origin, "content-type": "application/json" },
              body: JSON.stringify({ json: { ...command, accountId } }),
              signal: AbortSignal.timeout(5000),
            })
          ).status,
          401
        );
      }
      // Translated UI text must never become a valid translated wire command.
      assert.equal(
        (
          await context.request.post(
            origin + "/api/trpc/accountData.requestDeletion",
            {
              data: {
                json: {
                  accountId,
                  password,
                  expectedRevision: 4,
                  requestKey: randomUUID(),
                  confirmation: "ACCOUNTVERWIJDERING AANVRAGEN",
                },
              },
              headers: { origin },
              timeout: 10000,
            }
          )
        ).status(),
        400
      );
      assert.deepEqual(
        {
          retained: await retainedState(),
          requests: await rows(),
          foreignRequests: await rows(owner),
        },
        before
      );
    }
  );
  assert.deepEqual(stages, BROWSER_ACCOUNT_RIGHTS_STAGES);
  return stages;
}
