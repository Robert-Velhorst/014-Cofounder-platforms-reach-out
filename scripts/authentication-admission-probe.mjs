// Only the self-created network-disabled fixture may use this root observer.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
import { createRequire } from "node:module";
const mysql = createRequire("/app/package.json")("mysql2/promise");
const origin = "http://127.0.0.1:13218";
let phase = "fixture_configuration";
async function main() {
  assert.equal(process.env.AUTH_ADMISSION_FIXTURE, "isolated-synthetic-mysql");
  assert.equal(process.getuid(), 1000);
  const url = new URL(
    readFileSync(process.env.DATABASE_URL_FILE, "utf8").trim(),
  );
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.pathname, "/cofounder_test");
  assert.equal(url.username, "cofounder");
  assert.equal(url.password, "synthetic-auth-admission-only-password");
  let locker,
    observer,
    locked = false,
    held,
    aborted;
  const controller = new AbortController();
  async function until(check, label) {
    const end = Date.now() + 12000;
    while (Date.now() < end) {
      if (await check()) return;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    throw new Error(label);
  }
  const call = (path, cookie = "", body, signal) =>
    fetch(origin + "/api/trpc/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        origin,
        ...(cookie ? { cookie } : {}),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify({ json: body }) }),
      signal: signal ?? AbortSignal.timeout(15000),
    });
  async function blockedUsers() {
    const [rows] = await observer.query("SHOW FULL PROCESSLIST");
    // Never serialize SQL text, credentials, cookies or private row data.
    return rows.filter(
      (row) =>
        row.User === "cofounder" &&
        typeof row.Info === "string" &&
        /^select\b/i.test(row.Info) &&
        /from\s+`users`/i.test(row.Info),
    ).length;
  }
  async function busy(cookie) {
    const response = await call("auth.me", cookie);
    assert.equal(response.status, 503);
    assert.ok(Number(response.headers.get("retry-after")) > 0);
    const text = await response.text();
    assert.match(text, /Server is busy/);
    assert.doesNotMatch(text, /synthetic-auth|mysql:\/\//);
  }
  try {
    phase = "readiness";
    await until(async () => {
      try {
        return (await fetch(origin + "/api/ready")).status === 200;
      } catch {
        return false;
      }
    }, "runtime_not_ready");
    const rootUrl = new URL(url);
    rootUrl.username = "root";
    locker = await mysql.createConnection(rootUrl.href);
    observer = await mysql.createConnection(rootUrl.href);
    phase = "synthetic_login";
    const email = `auth-admission-${randomUUID()}@example.invalid`,
      password = "Synthetic-Admission-Only42!";
    const salt = randomBytes(16),
      hash = `scrypt$${salt.toString("base64url")}$${scryptSync(password, salt, 64).toString("base64url")}`;
    const [insert] = await locker.execute(
      "INSERT INTO users(openId,name,email,password_hash,emailVerified,loginMethod) VALUES (?, 'Synthetic admission owner',?,?,1,'local')",
      [randomUUID(), email, hash],
    );
    const login = await call("auth.login", "", { email, password });
    assert.equal(login.status, 200);
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(cookie);
    assert.equal(
      (await (await call("auth.me", cookie)).json()).result.data.json.id,
      insert.insertId,
    );
    phase = "held_authentication";
    await locker.query("LOCK TABLES users WRITE");
    locked = true;
    aborted = call("auth.me", cookie, undefined, controller.signal).then(
      (response) => response.status,
      (error) => error.name,
    );
    // Observe rejection immediately, including deliberate negative/mutation runs.
    held = call("auth.me", cookie).then(
      async (response) => ({
        status: response.status,
        value: (await response.json()).result?.data?.json?.id,
      }),
      () => ({ failed: true }),
    );
    await until(
      async () => (await blockedUsers()) === 2,
      "two_authentication_queries_not_observed",
    );
    phase = "excess_before_database";
    await busy(cookie);
    assert.equal(await blockedUsers(), 2);
    console.log(
      JSON.stringify({
        event: "authentication_admission_before_database",
        configuredSlots: 2,
        blockedAuthenticationQueries: 2,
        excessStatus: 503,
        retryHeader: true,
      }),
    );
    phase = "disconnect_accounting";
    controller.abort();
    assert.equal(await aborted, "AbortError");
    await busy(cookie);
    assert.equal(await blockedUsers(), 2);
    console.log(
      JSON.stringify({
        event: "disconnected_authentication_stays_counted",
        clientAborted: true,
        blockedAuthenticationQueries: 2,
        excessStatus: 503,
      }),
    );
    phase = "settlement_and_reuse";
    await locker.query("UNLOCK TABLES");
    locked = false;
    assert.deepEqual(await held, { status: 200, value: insert.insertId });
    await until(async () => {
      const response = await call("auth.me", cookie);
      if (response.status === 503) return false;
      assert.equal(response.status, 200);
      assert.equal(
        (await response.json()).result.data.json.id,
        insert.insertId,
      );
      return true;
    }, "capacity_not_released_after_authentication_settled");
    assert.equal(await blockedUsers(), 0);
    for (const path of ["/api/health", "/api/ready"])
      assert.equal((await fetch(origin + path)).status, 200);
    console.log(
      JSON.stringify({
        event: "authentication_admission_passed",
        realHttp: true,
        realJwt: true,
        realMysql: true,
        providerActions: 0,
        settledWorkReleasesCapacity: true,
        healthAndReadiness: true,
      }),
    );
  } finally {
    controller.abort();
    if (locked && locker) await locker.query("UNLOCK TABLES");
    await Promise.allSettled([held, aborted].filter(Boolean));
    await locker?.end();
    await observer?.end();
  }
}
main().catch(() => {
  console.error(
    JSON.stringify({ event: "authentication_admission_failed", phase }),
  );
  process.exitCode = 1;
});
