import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import {
  monitorOptions,
  probeRuntime,
  createMonitorState,
  runMonitor,
} from "./production-monitor.mjs";

const servers = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
async function fixture(handler) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
function json(res, value, status = 200) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value));
}
const healthy = { status: "ok", mode: "production" };

test("origin and finite resource bounds fail closed; remote HTTPS requires explicit opt-in", () => {
  assert.equal(monitorOptions([]).origin, "http://127.0.0.1:3000");
  for (const args of [
    ["--origin", "http://example.invalid"],
    ["--origin", "https://example.invalid"],
    ["--allow-remote", "--origin", "http://example.invalid"],
    ["--origin", "http://user:private-value@127.0.0.1"],
    ["--origin", "http://127.0.0.1/private"],
    ["--origin", "http://127.0.0.1/?secret=private"],
    ["--origin", "http://127.0.0.1/#private"],
    ["--samples", "0"],
    ["--samples", "2881"],
    ["--interval-ms", "999"],
    ["--timeout-ms", "10001"],
    ["--samples", "1.5"],
    ["--failure-threshold", "101"],
    ["--unknown", "private"],
    ["--origin"],
    ["--samples", "1", "--samples", "2"],
  ])
    assert.throws(() => monitorOptions(args));
  assert.equal(
    monitorOptions(["--allow-remote", "--origin", "https://example.invalid"])
      .origin,
    "https://example.invalid",
  );
});

test("reads fixed production health/readiness endpoints without credentials or private output", async () => {
  const requests = [];
  const origin = await fixture((req, res) => {
    requests.push(req.url);
    assert.equal(req.method, "GET");
    assert.equal(req.headers.cookie, undefined);
    assert.equal(req.headers.authorization, undefined);
    json(
      res,
      req.url === "/api/health"
        ? { ...healthy, private: "synthetic-private-body" }
        : { status: "ready", private: "synthetic-private-body" },
    );
  });
  const result = await probeRuntime({ origin, timeoutMs: 1000 });
  assert.equal(result.healthy, true);
  assert.deepEqual(requests, ["/api/health", "/api/ready"]);
  assert.doesNotMatch(
    JSON.stringify(result),
    /synthetic-private-body|127\.0\.0\.1|cookie|authorization/,
  );
});

test("an HTTP-ready liveness endpoint does not hide database unavailability", async () => {
  const origin = await fixture((req, res) =>
    json(
      res,
      req.url === "/api/health"
        ? healthy
        : { status: "not_ready", secret: "synthetic-private" },
      req.url === "/api/health" ? 200 : 503,
    ),
  );
  const result = await probeRuntime({ origin, timeoutMs: 1000 });
  assert.equal(result.healthy, false);
  assert.equal(result.health.ok, true);
  assert.equal(result.readiness.status, 503);
  assert.doesNotMatch(JSON.stringify(result), /synthetic-private/);
});

for (const [name, contentType, body] of [
  ["HTML fallback", "text/html", "<html>synthetic-private</html>"],
  ["malformed JSON", "application/json", "synthetic-private-malformed"],
  [
    "wrong environment",
    "application/json",
    JSON.stringify({ status: "ok", mode: "development" }),
  ],
  [
    "oversized JSON",
    "application/json",
    JSON.stringify({ ...healthy, private: "x".repeat(4096) }),
  ],
])
  test(`rejects ${name} without echoing body`, async () => {
    const origin = await fixture((req, res) => {
      if (req.url === "/api/ready") return json(res, { status: "ready" });
      res.writeHead(200, { "content-type": contentType });
      res.end(body);
    });
    const result = await probeRuntime({ origin, timeoutMs: 1000 });
    assert.equal(result.healthy, false);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-private|xxxx/);
  });

test("redirects cannot escape the reviewed target", async () => {
  let redirected = 0;
  const other = await fixture((_req, res) => {
    redirected++;
    json(res, healthy);
  });
  const origin = await fixture((_req, res) => {
    res.writeHead(302, { location: other });
    res.end();
  });
  assert.equal(
    (await probeRuntime({ origin, timeoutMs: 1000 })).healthy,
    false,
  );
  assert.equal(redirected, 0);
});

for (const bodyStarted of [false, true])
  test(`times out ${bodyStarted ? "streaming body" : "missing headers"}`, async () => {
    const origin = await fixture((req, res) => {
      if (req.url === "/api/ready") return json(res, { status: "ready" });
      if (bodyStarted) {
        res.writeHead(200, { "content-type": "application/json" });
        res.write("{");
      }
    });
    const start = Date.now();
    assert.equal(
      (await probeRuntime({ origin, timeoutMs: 100 })).healthy,
      false,
    );
    assert.ok(Date.now() - start < 2000);
  });

test("failure streaks are bounded, transient failures reset, alerts/recovery emit once per transition", () => {
  const state = createMonitorState(3);
  assert.equal(state.observe(false), null);
  assert.equal(state.observe(true), null);
  assert.equal(state.observe(false), null);
  assert.equal(state.observe(false), null);
  assert.deepEqual(state.observe(false), {
    event: "runtime_alert",
    consecutiveFailures: 3,
  });
  for (let i = 0; i < 10000; i++) assert.equal(state.observe(false), null);
  assert.deepEqual(state.observe(true), {
    event: "runtime_recovered",
    consecutiveFailures: 0,
  });
  assert.equal(state.observe(true), null);
  assert.throws(() => createMonitorState(0));
});

test("finite real HTTP sampling emits one outage/recovery and returns the final status", async () => {
  let sample = 0,
    outstanding = 0,
    peak = 0;
  const origin = await fixture((req, res) => {
    peak = Math.max(peak, ++outstanding);
    res.once("finish", () => outstanding--);
    if (req.url === "/api/health") return json(res, healthy);
    sample++;
    json(
      res,
      { status: sample <= 3 ? "not_ready" : "ready" },
      sample <= 3 ? 503 : 200,
    );
  });
  const emitted = [];
  const result = await runMonitor(
    { ...monitorOptions([]), origin, samples: 5 },
    { emit: (value) => emitted.push(value), pause: async () => {} },
  );
  assert.deepEqual(result, { exitCode: 0, completed: 5 });
  assert.equal(peak, 1);
  assert.deepEqual(
    emitted
      .filter((row) => row.event !== "runtime_probe")
      .map((row) => row.event),
    ["runtime_alert", "runtime_recovered"],
  );
});

test("CLI reports invalid options without printing supplied secrets or contacting a target", async () => {
  const child = spawn(process.execPath, [
    "scripts/production-monitor.mjs",
    "--origin",
    "http://private:synthetic-private@127.0.0.1",
  ]);
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const code = await new Promise((resolve) => child.once("exit", resolve));
  assert.equal(code, 2);
  assert.doesNotMatch(output, /synthetic-private/);
  assert.deepEqual(JSON.parse(output), {
    event: "runtime_monitor_configuration_failed",
  });
});

for (const ready of [true, false])
  test(`CLI exit reflects actual readiness ${ready}`, async () => {
    const origin = await fixture((req, res) =>
      json(
        res,
        req.url === "/api/health"
          ? healthy
          : { status: ready ? "ready" : "not_ready" },
        req.url === "/api/health" || ready ? 200 : 503,
      ),
    );
    const child = spawn(process.execPath, [
      "scripts/production-monitor.mjs",
      "--origin",
      origin,
    ]);
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    const code = await new Promise((resolve) => child.once("close", resolve));
    assert.equal(code, ready ? 0 : 1);
    assert.equal(JSON.parse(output).event, "runtime_probe");
    assert.equal(JSON.parse(output).healthy, ready);
  });

test("aborted monitor admits no probes and is not reported as healthy", async () => {
  const controller = new AbortController();
  controller.abort();
  assert.deepEqual(
    await runMonitor(monitorOptions([]), {
      signal: controller.signal,
      emit: () => assert.fail("unexpected probe"),
    }),
    { exitCode: 1, completed: 0 },
  );
});
