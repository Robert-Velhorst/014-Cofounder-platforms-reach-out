// Runs only inside the self-created, isolated recovery runtime. No provider work.
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:13214";
let phase = "fixture_configuration";
async function main() {
  assert.equal(
    process.env.RECOVERY_APPLICATION_FIXTURE,
    "isolated-synthetic-restore",
  );
  assert.equal(process.env.NODE_ENV, "production");
  assert.equal(process.getuid(), 1000);
  const ids = [process.env.RECOVERY_OWNER_A, process.env.RECOVERY_OWNER_B].map(
    Number,
  );
  assert.ok(ids.every((id) => Number.isSafeInteger(id) && id > 0));
  assert.notEqual(ids[0], ids[1]);
  const emails = [process.env.RECOVERY_EMAIL_A, process.env.RECOVERY_EMAIL_B];
  assert.ok(
    emails.every((email) =>
      /^recovery-[ab]-[a-f0-9]{8}@example\.invalid$/.test(email || ""),
    ),
  );
  const password = "Synthetic-Restored-Login42!";
  const revokedResetToken = process.env.RECOVERY_REVOKED_RESET_TOKEN;
  assert.match(revokedResetToken ?? "", /^[A-Za-z0-9_-]{43}$/);
  const revokedVerificationToken =
    process.env.RECOVERY_REVOKED_VERIFICATION_TOKEN;
  assert.match(revokedVerificationToken ?? "", /^[A-Za-z0-9_-]{43}$/);
  const request = (path, cookie = "", body) =>
    fetch(origin + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        origin,
        ...(cookie ? { cookie } : {}),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify({ json: body }) }),
      signal: AbortSignal.timeout(3000),
    });
  phase = "readiness";
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await request("/api/ready")).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready);
  const home = await request("/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /\/assets\/[^"<>]+\.js/);
  assert.equal(
    (await request("/api/trpc/criticalPath.prospects.list")).status,
    401,
  );
  const sessions = [];
  phase = "revoked_password_reset";
  const reset = await request("/api/trpc/auth.resetPassword", "", {
    token: revokedResetToken,
    password: "Synthetic-Blocked-Reset42!",
  });
  assert.equal(reset.status, 400);
  assert.equal(
    (await reset.json()).error.json.message,
    "Invalid or expired password reset link. Request a new link.",
  );
  phase = "revoked_email_verification";
  const verification = await request("/api/trpc/auth.verifyEmail", "", {
    token: revokedVerificationToken,
  });
  assert.equal(verification.status, 400);
  assert.equal(
    (await verification.json()).error.json.message,
    "Invalid or expired verification token",
  );
  for (let i = 0; i < 2; i++) {
    phase = "login";
    const login = await request("/api/trpc/auth.login", "", {
      email: emails[i],
      password,
    });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).result.data.json.id, ids[i]);
    const setCookies = login.headers.getSetCookie();
    assert.ok(setCookies.some((c) => /HttpOnly/i.test(c)));
    const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    assert.ok(cookie);
    sessions.push(cookie);
    const me = await request("/api/trpc/auth.me", cookie);
    assert.equal((await me.json()).result.data.json.id, ids[i]);
    const input = encodeURIComponent(
      JSON.stringify({ json: { accountId: ids[i] } }),
    );
    const list = await request(
      "/api/trpc/criticalPath.prospects.list?input=" + input,
      cookie,
    );
    assert.equal(list.status, 200);
    const data = (await list.json()).result.data.json;
    phase = "owner_data";
    assert.equal(data.total, 1);
    assert.equal(data.items.length, 1);
    assert.equal(
      data.items[0].name,
      "Restored owner " + (i === 0 ? "A" : "B") + " candidate",
    );
    const forged = encodeURIComponent(
      JSON.stringify({ json: { accountId: ids[1 - i] } }),
    );
    assert.equal(
      (
        await request(
          "/api/trpc/criticalPath.prospects.list?input=" + forged,
          cookie,
        )
      ).status,
      403,
    );
  }
  phase = "logout";
  for (const cookie of sessions) {
    assert.equal(
      (await request("/api/trpc/auth.logout", cookie, {})).status,
      200,
    );
    assert.equal(
      (await (await request("/api/trpc/auth.me", cookie)).json()).result.data
        .json,
      null,
    );
  }
  console.log(
    JSON.stringify({
      event: "restored_application_passed",
      owners: 2,
      ownerScopedCandidates: 2,
      realLogin: true,
      revokedSessions: true,
      revokedResetLink: true,
      revokedVerificationLink: true,
      providerActions: 0,
    }),
  );
}
main().catch(() => {
  console.error(
    JSON.stringify({ event: "restored_application_failed", phase }),
  );
  process.exitCode = 1;
});
