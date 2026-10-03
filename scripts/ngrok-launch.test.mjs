import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFileSync } from "node:fs";
import {
  activate,
  createGate,
  httpsOrigin,
  selectEndpoint,
  checkContainer,
  main,
} from "./start-ngrok.mjs";

const origin = "https://beta.example.test";
const image = "registry.example.test/cofounder@sha256:" + "a".repeat(64);
const imageId = "sha256:" + "b".repeat(64);
const endpoint = (gate) => ({
  endpoints: [
    {
      url: origin,
      upstream: { url: gate },
      inspect: false,
      pooling_enabled: false,
    },
  ],
});
function container() {
  return {
    State: { Running: true },
    Image: imageId,
    Config: {
      Image: image,
      User: "1000:1000",
      Env: Object.entries({
        NODE_ENV: "production",
        APP_MODE: "production",
        PUBLIC_ORIGIN: origin,
        TRUST_PROXY: "true",
        ENABLE_REGISTRATION: "false",
        OUTREACH_PAUSED: "true",
        ENABLE_PLATFORM_AUTOMATION: "false",
        ENABLE_UNSAFE_LEGACY_ROUTES: "false",
        ENABLE_ACCOUNT_MAIL_WORKER: "false",
        ENABLE_ACCOUNT_MAIL_RETENTION: "false",
        ENABLE_OWNER_NOTIFICATIONS: "false",
        ENABLE_ACCOUNT_DELETION_REQUESTS: "false",
        DATABASE_URL_FILE: "/run/secrets/database_url",
        JWT_SECRET_FILE: "/run/secrets/jwt_secret",
      }).map(([key, value]) => key + "=" + value),
    },
    HostConfig: {
      ReadonlyRootfs: true,
      Privileged: false,
      NetworkMode: "bridge",
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges:true"],
      NanoCpus: 1000000000,
      Memory: 536870912,
      MemorySwap: 536870912,
      PidsLimit: 256,
    },
    NetworkSettings: {
      Ports: { "3000/tcp": [{ HostIp: "127.0.0.1", HostPort: "3014" }] },
    },
    Mounts: [
      { Destination: "/run/secrets/database_url", RW: false, Type: "bind" },
      { Destination: "/run/secrets/jwt_secret", RW: false, Type: "bind" },
    ],
  };
}
const options = { origin, image, imageId };
const send = (gate, headers = {}) =>
  new Promise((resolve, reject) => {
    const request = http.get(
      gate.url + "/private?x=1",
      {
        headers: {
          host: "beta.example.test",
          "x-forwarded-proto": "https",
          ...headers,
        },
        timeout: 3000,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            text: async () => Buffer.concat(chunks).toString("utf8"),
          }),
        );
        response.on("error", reject);
      },
    );
    request.on("error", reject);
    request.on("timeout", () => request.destroy(Error("fixture_timeout")));
  });

test("publication requires confirmation before any network/command use", async () => {
  await assert.rejects(main([], {}), /publication_confirmation_required/);
  await assert.rejects(
    main(["--publish-confirmed"], {}),
    /immutable_production_image_required/,
  );
  await assert.rejects(
    main(["--publish-confirmed"], { PRODUCTION_APP_IMAGE: image }),
    /protected_production_secret_files_required/,
  );
});
test("public origin accepts only an HTTPS origin without credentials/path/port", () => {
  assert.equal(httpsOrigin(origin + "/"), origin);
  for (const value of [
    "http://example.test",
    "https://u:p@example.test",
    origin + "/other",
    origin + "?secret=x",
    origin + "#fragment",
    origin + ":3000",
  ])
    assert.throws(() => httpsOrigin(value));
});
test("discovery is bound to the exact relay, HTTPS, requested URL and reviewable policy", () => {
  const body = endpoint("http://127.0.0.1:12345");
  assert.equal(selectEndpoint(body, "http://127.0.0.1:12345", origin), origin);
  assert.throws(() => selectEndpoint(body, "http://127.0.0.1:54321"));
  assert.throws(() =>
    selectEndpoint(body, "http://127.0.0.1:12345", "https://other.test"),
  );
  for (const mutation of [
    (b) => b.endpoints.push(structuredClone(b.endpoints[0])),
    (b) => {
      b.endpoints[0].url = "http://beta.example.test";
    },
    (b) => {
      b.endpoints[0].inspect = true;
    },
    (b) => {
      delete b.endpoints[0].inspect;
    },
    (b) => {
      b.endpoints[0].pooling_enabled = true;
    },
    (b) => {
      b.endpoints[0].traffic_policy = "unreviewed";
    },
  ]) {
    const copy = structuredClone(body);
    mutation(copy);
    assert.throws(() => selectEndpoint(copy, "http://127.0.0.1:12345"));
  }
});
test("actual container evidence must match the reviewed hosted posture", () => {
  checkContainer(container(), options);
  for (const mutation of [
    (c) => {
      c.State.Running = false;
    },
    (c) => {
      c.Image = "wrong";
    },
    (c) => {
      c.Config.Image = "mutable:latest";
    },
    (c) => {
      c.Config.User = "0:0";
    },
    (c) => {
      c.HostConfig.ReadonlyRootfs = false;
    },
    (c) => {
      c.HostConfig.Privileged = true;
    },
    (c) => {
      c.HostConfig.NetworkMode = "host";
    },
    (c) => {
      c.HostConfig.CapDrop = [];
    },
    (c) => {
      c.HostConfig.CapAdd = ["SYS_ADMIN"];
    },
    (c) => {
      c.HostConfig.SecurityOpt = [];
    },
    (c) => {
      c.HostConfig.NanoCpus = 0;
    },
    (c) => {
      c.HostConfig.Memory = 0;
    },
    (c) => {
      c.HostConfig.MemorySwap = -1;
    },
    (c) => {
      c.HostConfig.PidsLimit = -1;
    },
    (c) => {
      c.NetworkSettings.Ports["3000/tcp"][0].HostIp = "0.0.0.0";
    },
    (c) => {
      c.NetworkSettings.Ports["3000/tcp"].push({
        HostIp: "::",
        HostPort: "3014",
      });
    },
    (c) => {
      c.NetworkSettings.Ports["3030/tcp"] = [
        { HostIp: "0.0.0.0", HostPort: "3030" },
      ];
    },
    (c) => {
      c.Mounts[0].RW = true;
    },
    (c) => {
      c.Mounts.push({ Destination: "/app", RW: false });
    },
    (c) => {
      c.Config.Env.push("JWT_SECRET=unexpected");
    },
    (c) => {
      c.Config.Env.push("BUILT_IN_FORGE_API_KEY=unexpected");
    },
  ]) {
    const c = container();
    mutation(c);
    assert.throws(() => checkContainer(c, options));
  }
  for (const key of [
    "APP_MODE",
    "PUBLIC_ORIGIN",
    "TRUST_PROXY",
    "ENABLE_REGISTRATION",
    "OUTREACH_PAUSED",
    "ENABLE_PLATFORM_AUTOMATION",
    "ENABLE_UNSAFE_LEGACY_ROUTES",
    "ENABLE_ACCOUNT_MAIL_WORKER",
    "ENABLE_ACCOUNT_MAIL_RETENTION",
    "ENABLE_OWNER_NOTIFICATIONS",
    "ENABLE_ACCOUNT_DELETION_REQUESTS",
    "DATABASE_URL_FILE",
    "JWT_SECRET_FILE",
  ]) {
    const c = container();
    c.Config.Env = c.Config.Env.filter((item) => !item.startsWith(key + "="));
    assert.throws(() => checkContainer(c, options), key);
  }
});
test("socket gate blocks all app access before verification and after hold", async (t) => {
  let hits = 0;
  let seen;
  const upstream = http.createServer((request, response) => {
    hits++;
    seen = request.headers;
    response.end("private fixture");
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    upstream.closeAllConnections();
    upstream.close();
  });
  const gate = await createGate({ upstreamPort: upstream.address().port });
  t.after(() => gate.close());
  assert.equal((await send(gate)).status, 503);
  assert.equal(hits, 0);
  gate.open(origin);
  for (const headers of [
    { "x-forwarded-proto": "https, http" },
    { "x-forwarded-proto": "" },
    { host: "wrong.test" },
  ])
    assert.equal((await send(gate, headers)).status, 400);
  assert.equal(hits, 0);
  const response = await send(gate, {
    "x-forwarded-proto": "http, https",
    "x-forwarded-for": "untrusted-client",
    "x-forwarded-host": "wrong.test",
    forwarded: "proto=http;host=wrong.test",
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "private fixture");
  assert.equal(hits, 1);
  assert.equal(seen["x-forwarded-proto"], "https");
  assert.equal(seen["x-forwarded-for"], undefined);
  assert.equal(seen["x-forwarded-host"], undefined);
  assert.equal(seen.forwarded, undefined);
  gate.hold();
  assert.equal((await send(gate)).status, 503);
  assert.equal(hits, 1);
});
test("verification completes before opening the gate", async () => {
  const events = [];
  const gate = {
    open: () => events.push("open"),
    hold: () => events.push("hold"),
  };
  const agent = { alive: () => true, stop: async () => events.push("stop") };
  assert.equal(
    await activate({
      gate,
      agent,
      discover: async () => {
        events.push("discover");
        return origin;
      },
      prepare: async () => events.push("prepare"),
      verify: async () => events.push("verify"),
    }),
    origin,
  );
  assert.deepEqual(events, ["discover", "prepare", "verify", "open"]);
});
test("cancellation during verification cannot open the gate", async () => {
  let cancelled = false;
  const events = [];
  await assert.rejects(
    activate({
      gate: {
        open: () => events.push("open"),
        hold: () => events.push("hold"),
      },
      agent: { alive: () => true, stop: async () => events.push("stop") },
      discover: async () => origin,
      prepare: async () => {},
      verify: async () => {
        cancelled = true;
      },
      cancelled: () => cancelled,
    }),
    /launch_cancelled/,
  );
  assert.deepEqual(events, ["hold", "stop"]);
});
test("holding the gate interrupts pending requests and capacity overflow does not reach the app", async (t) => {
  let hits = 0;
  let reachedCapacity;
  const capacity = new Promise((resolve) => {
    reachedCapacity = resolve;
  });
  const upstream = http.createServer(() => {
    if (++hits === 32) reachedCapacity();
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    upstream.closeAllConnections();
    upstream.close();
  });
  const gate = await createGate({ upstreamPort: upstream.address().port });
  t.after(() => gate.close());
  gate.open(origin);
  const pending = Array.from({ length: 32 }, () => send(gate));
  await Promise.race([
    capacity,
    new Promise((_, reject) => {
      const timeout = setTimeout(
        () => reject(Error("capacity_fixture_timeout")),
        2000,
      );
      timeout.unref();
    }),
  ]);
  assert.equal((await send(gate)).status, 503);
  assert.equal(hits, 32);
  gate.hold();
  const responses = await Promise.all(pending);
  assert.equal(
    responses.every((response) => response.status === 503),
    true,
  );
  assert.equal((await send(gate)).status, 503);
  assert.equal(hits, 32);
});
for (const failure of ["discover", "prepare", "verify", "cancel", "agent"]) {
  test(
    failure + " failure holds before stopping only the owned agent",
    async () => {
      const events = [];
      const step = async (name) => {
        events.push(name);
        if (failure === name) throw Error("fixture");
        return origin;
      };
      await assert.rejects(
        activate({
          gate: {
            open: () => events.push("open"),
            hold: () => events.push("hold"),
          },
          agent: {
            alive: () => failure !== "agent",
            stop: async () => events.push("stop"),
          },
          discover: () => step("discover"),
          prepare: () => step("prepare"),
          verify: () => step("verify"),
          cancelled: () => failure === "cancel",
        }),
      );
      assert.equal(events.includes("open"), false);
      assert.deepEqual(events.slice(-2), ["hold", "stop"]);
    },
  );
}
test("launcher keeps local demo startup and fallback out of its command path", () => {
  const source = readFileSync(
    new URL("./start-ngrok.mjs", import.meta.url),
    "utf8",
  );
  const wrapper = readFileSync(
    new URL("./start-ngrok.ps1", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    wrapper,
    /Start-Process|docker compose|start-windows|APP_MODE/,
  );
  assert.match(source, /"compose.production.yml"/);
  assert.match(source, /"--no-build",\s*"--pull",\s*"never"/);
  assert.match(source, /"--inspect=false"/);
});
