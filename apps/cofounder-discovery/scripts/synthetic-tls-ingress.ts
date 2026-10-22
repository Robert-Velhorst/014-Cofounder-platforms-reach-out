/** Real TLS/HTTP/MySQL acceptance in an owned synthetic fixture only. */
import assert from "node:assert/strict";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import type { IncomingMessage, IncomingHttpHeaders } from "node:http";
import type { RequestOptions } from "node:https";
import type { TLSSocket } from "node:tls";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import mysql from "mysql2/promise";
import { hashPassword } from "../server/auth-password";
import { readRuntimeSecret } from "../server/runtime-secrets";

assert.equal(process.env.RUN_SYNTHETIC_TLS_INGRESS, "true");
const mode = process.env.TLS_PROBE_PHASE;
assert.ok(mode === "seed" || mode === "client" || mode === "verify");
const origin = "https://cofounder.test",
  source = "127.0.2.17";
let db: mysql.Connection | undefined;
const ca = mode === "client" ? readFileSync("/qa/root.crt") : undefined;
let phase: string = mode,
  cookie = "";
type Response = {
  status: number;
  headers: IncomingHttpHeaders;
  data: any;
  authorized: boolean;
};
async function call(
  path: string,
  input?: unknown,
  extra: Record<string, string> = {},
  plain = false
): Promise<Response> {
  return await new Promise((resolve, reject) => {
    const body =
      input === undefined ? undefined : JSON.stringify({ json: input });
    const request = plain ? httpRequest : httpsRequest;
    const options: RequestOptions = {
      hostname: "127.0.0.1",
      port: plain ? 8080 : 8443,
      localAddress: source,
      servername: "cofounder.test",
      ca,
      rejectUnauthorized: true,
      path,
      method: body === undefined ? "GET" : "POST",
      agent: false,
      headers: {
        host: "cofounder.test",
        ...(cookie ? { cookie } : {}),
        ...(body
          ? {
              origin,
              "content-type": "application/json",
              "content-length": String(Buffer.byteLength(body)),
            }
          : {}),
        ...extra,
      },
    };
    const req = request(options, (res: IncomingMessage) => {
      const authorized = plain || Boolean((res.socket as TLSSocket).authorized);
      const chunks: Buffer[] = [];
      let length = 0;
      res.on("data", chunk => {
        length += chunk.length;
        if (length > 1_000_000) res.destroy(new Error("response_limit"));
        else chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => {
        try {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            data: text.startsWith("{") ? JSON.parse(text) : text,
            authorized,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.setTimeout(5000, () => req.destroy(new Error("tls_request_timeout")));
    req.on("error", reject);
    req.end(body);
  });
}
function sessionHeader(response: Response) {
  const values = response.headers["set-cookie"];
  assert.ok(Array.isArray(values) && values.length === 1);
  const value = values[0] as string;
  for (const attribute of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"])
    assert.ok(value.split("; ").includes(attribute));
  assert.doesNotMatch(value, /;\s*Domain=/i);
  return value;
}
try {
  if (mode !== "client") {
    const url = new URL(readRuntimeSecret("DATABASE_URL") ?? "invalid:");
    assert.equal(url.protocol, "mysql:");
    assert.equal(url.hostname, "127.0.0.1");
    assert.equal(url.pathname, "/cofounder_test");
    db = await mysql.createConnection(url.toString());
  }
  if (mode === "seed") {
    const [existing] = await db!.query<any[]>(
      "SELECT COUNT(*) AS n FROM users"
    );
    assert.equal(Number(existing[0].n), 0);
    const password = readFileSync("/qa/password", "utf8");
    await db!.execute(
      "INSERT INTO users (id,openId,name,email,loginMethod,password_hash,emailVerified) VALUES (1,'synthetic-tls-owner','Synthetic TLS owner','tls-owner@example.invalid','email',?,1)",
      [await hashPassword(password)]
    );
    console.log(
      JSON.stringify({
        event: "tls_fixture_seeded",
        accounts: 1,
        emailDeliveryVerified: false,
      })
    );
  } else if (mode === "verify") {
    // Verify actual admission state through the isolated DB namespace. The
    // external-client probe has no database network or database credentials.
    const subkey = createHmac("sha256", readRuntimeSecret("JWT_SECRET")!)
      .update("cofounder-login-admission-v1")
      .digest();
    const key = (ip: string) =>
      createHmac("sha256", subkey)
        .update(JSON.stringify(["ip", ip]))
        .digest("hex");
    const [actual] = await db!.execute<any[]>(
      "SELECT used FROM login_attempt_quotas WHERE quota_key = ?",
      [key(source)]
    );
    const [spoofed] = await db!.execute<any[]>(
      "SELECT used FROM login_attempt_quotas WHERE quota_key = ?",
      [key("203.0.113.55")]
    );
    assert.equal(Number(actual[0]?.used), 1);
    assert.equal(spoofed.length, 0);
    console.log(
      JSON.stringify({
        event: "tls_source_admission_verified",
        actualSourceUsed: 1,
        spoofedSourceRows: 0,
      })
    );
  } else {
    phase = "https_readiness";
    let ready: Response | undefined;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      try {
        ready = await call("/api/ready");
        if (ready.status === 200) break;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready);
    assert.equal(ready.status, 200);
    assert.equal(ready.authorized, true);
    assert.equal(
      ready.headers["strict-transport-security"],
      "max-age=31536000"
    );
    assert.equal(ready.headers["x-content-type-options"], "nosniff");
    assert.equal(ready.headers["x-frame-options"], "DENY");
    const policy = ready.headers["content-security-policy"];
    assert.ok(
      typeof policy === "string" && policy.includes("frame-ancestors 'none'")
    );
    phase = "http_redirect";
    const redirect = await call(
      "/api/trpc/auth.login",
      { email: "never@example.invalid", password: "Not-submitted-A1" },
      { "x-forwarded-proto": "https" },
      true
    );
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.location, origin + "/api/trpc/auth.login");
    assert.equal(redirect.headers["set-cookie"], undefined);
    const password = readFileSync("/qa/password", "utf8");
    const email = "tls-owner@example.invalid";
    phase = "https_login_with_hostile_forwarding_headers";
    const login = await call(
      "/api/trpc/auth.login",
      { email, password },
      {
        "x-forwarded-proto": "http",
        "x-forwarded-for": "203.0.113.55",
        "x-real-ip": "203.0.113.55",
        forwarded: "for=203.0.113.55;proto=http",
      }
    );
    assert.equal(login.status, 200);
    assert.equal(login.data.result.data.json.id, 1);
    const setCookie = sessionHeader(login);
    cookie = setCookie.split(";")[0];
    phase = "authenticated_session";
    const me = await call("/api/trpc/auth.me?input=%7B%22json%22%3Anull%7D");
    assert.equal(me.status, 200);
    assert.equal(me.data.result.data.json.id, 1);
    phase = "cross_origin_mutation_refusal";
    const denied = await call("/api/trpc/auth.logout", null, {
      origin: "https://other.example.invalid",
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers["set-cookie"], undefined);
    const stillSignedIn = await call(
      "/api/trpc/auth.me?input=%7B%22json%22%3Anull%7D"
    );
    assert.equal(stillSignedIn.data.result.data.json.id, 1);
    phase = "https_logout";
    const logout = await call("/api/trpc/auth.logout", null);
    assert.equal(logout.status, 200);
    assert.equal(logout.data.result.data.json.success, true);
    const cleared = sessionHeader(logout);
    assert.match(cleared, /(?:Max-Age=0|Expires=Thu, 01 Jan 1970)/);
    const revoked = await call(
      "/api/trpc/auth.me?input=%7B%22json%22%3Anull%7D"
    );
    assert.equal(revoked.status, 200);
    assert.equal(revoked.data.result.data.json, null);
    console.log(
      JSON.stringify({
        event: "tls_ingress_acceptance",
        certificateVerified: true,
        httpRedirect: 308,
        httpsReady: 200,
        secureCookieAndLogoutScope: true,
        hostileProtocolHeaderRefused: true,
        crossOriginMutationRefused: true,
        revokedSessionRefused: true,
        providerActions: 0,
      })
    );
  }
} catch {
  console.log(JSON.stringify({ event: "tls_ingress_failed", phase }));
  process.exitCode = 1;
} finally {
  await db?.end();
}
