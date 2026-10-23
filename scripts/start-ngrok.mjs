import http from "node:http";
import net from "node:net";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL, fileURLToPath } from "node:url";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const hopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);
export function httpsOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !/^[a-z0-9.-]+$/i.test(url.hostname)
  )
    throw new Error("invalid_https_origin");
  return url.origin;
}
function cleanHeaders(headers) {
  const forbidden = new Set([
    ...hopHeaders,
    ...String(headers.connection ?? "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim()),
  ]);
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) =>
        !forbidden.has(key) &&
        key !== "forwarded" &&
        !key.startsWith("x-forwarded-"),
    ),
  );
}

// Local host processes remain trusted. No network gate-control endpoint exists.
export async function createGate({ upstreamPort = 3014 } = {}) {
  let origin = null;
  let active = 0;
  const pending = new Set();
  const server = http.createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (!origin) {
      response.writeHead(503);
      response.end("Not ready\n");
      return;
    }
    // ngrok appends the actual scheme last; never trust a client-supplied prefix.
    const scheme = String(request.headers["x-forwarded-proto"] ?? "")
      .split(",")
      .at(-1)
      .trim();
    if (
      request.headers.host !== new URL(origin).host ||
      scheme !== "https" ||
      !request.url.startsWith("/") ||
      request.url.startsWith("//")
    ) {
      response.writeHead(400);
      response.end("Invalid ingress\n");
      return;
    }
    if (active >= 32) {
      response.writeHead(503);
      response.end("Busy\n");
      return;
    }
    const headers = cleanHeaders(request.headers);
    headers.host = new URL(origin).host;
    headers["x-forwarded-proto"] = "https";
    // Do not forward claimed client IPs: relay users share the loopback bucket.
    active++;
    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: upstreamPort,
        method: request.method,
        path: request.url,
        headers,
        timeout: 15000,
      },
      (incoming) => {
        response.writeHead(incoming.statusCode, cleanHeaders(incoming.headers));
        incoming.pipe(response);
      },
    );
    pending.add(upstream);
    const deadline = setTimeout(() => upstream.destroy(), 15000);
    upstream.once("close", () => {
      clearTimeout(deadline);
      pending.delete(upstream);
      active--;
    });
    upstream.on("timeout", () => upstream.destroy());
    upstream.on("error", () => {
      if (!response.headersSent) {
        response.writeHead(503);
        response.end("Unavailable\n");
      } else response.destroy();
    });
    request.on("aborted", () => upstream.destroy());
    response.on("close", () => upstream.destroy());
    request.pipe(upstream);
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 15000;
  server.maxConnections = 64;
  server.on("upgrade", (_request, socket) => socket.destroy());
  server.on("connect", (_request, socket) => socket.destroy());
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  function hold() {
    origin = null;
    for (const request of pending) request.destroy();
  }
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    open(value) {
      origin = httpsOrigin(value);
    },
    hold,
    async close() {
      hold();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

export function selectEndpoint(body, gateUrl, requested) {
  const matches = (body.endpoints ?? []).filter(
    (endpoint) => endpoint.upstream?.url === gateUrl,
  );
  if (matches.length !== 1) throw new Error("endpoint_not_bound_to_gate");
  const endpoint = matches[0];
  const origin = httpsOrigin(endpoint.url);
  if (
    endpoint.inspect !== false ||
    endpoint.pooling_enabled === true ||
    endpoint.traffic_policy?.trim()
  )
    throw new Error("unreviewed_agent_policy");
  if (requested && origin !== httpsOrigin(requested))
    throw new Error("unexpected_public_origin");
  return origin;
}

export function checkContainer(container, { origin, image, imageId }) {
  const env = Object.fromEntries(
    container.Config.Env.map((item) => {
      const separator = item.indexOf("=");
      return [item.slice(0, separator), item.slice(separator + 1)];
    }),
  );
  const expected = {
    NODE_ENV: "production",
    APP_MODE: "production",
    PUBLIC_ORIGIN: httpsOrigin(origin),
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
  };
  if (
    Object.entries(expected).some(([key, value]) => env[key] !== value) ||
    [
      "DATABASE_URL",
      "JWT_SECRET",
      "BUILT_IN_FORGE_API_KEY",
      "RESEND_API_KEY",
      "HAI_CONNECTOR_TOKEN",
    ].some((key) => env[key])
  )
    throw new Error("hosted_environment_rejected");
  const host = container.HostConfig;
  const published = Object.entries(container.NetworkSettings.Ports).filter(
    ([, binding]) => binding?.length,
  );
  if (
    !container.State.Running ||
    container.Image !== imageId ||
    container.Config.Image !== image ||
    container.Config.User !== "1000:1000" ||
    !host.ReadonlyRootfs ||
    host.Privileged ||
    host.NetworkMode === "host" ||
    !host.CapDrop?.includes("ALL") ||
    host.CapAdd?.length ||
    !host.SecurityOpt?.includes("no-new-privileges:true") ||
    host.NanoCpus !== 1000000000 ||
    host.Memory !== 536870912 ||
    host.MemorySwap !== 536870912 ||
    host.PidsLimit !== 256 ||
    published.length !== 1 ||
    published[0][0] !== "3000/tcp" ||
    published[0][1].length !== 1 ||
    published[0][1][0].HostIp !== "127.0.0.1" ||
    published[0][1][0].HostPort !== "3014"
  )
    throw new Error("hosted_container_rejected");
  const mounts = container.Mounts.filter((mount) => mount.Type !== "tmpfs");
  if (
    mounts.length !== 2 ||
    ["/run/secrets/database_url", "/run/secrets/jwt_secret"].some(
      (destination) =>
        !mounts.some((mount) => mount.Destination === destination && !mount.RW),
    )
  )
    throw new Error("hosted_secret_mounts_rejected");
}

// Tests inject adapters: ordering/failure proof without Docker or a public tunnel.
export async function activate({
  gate,
  agent,
  discover,
  prepare,
  verify,
  cancelled = () => false,
}) {
  try {
    const origin = await discover();
    if (cancelled() || !agent.alive()) throw new Error("launch_cancelled");
    await prepare(origin);
    await verify(origin);
    if (cancelled() || !agent.alive()) throw new Error("launch_cancelled");
    gate.open(origin);
    return origin;
  } catch (error) {
    gate.hold();
    await agent.stop();
    throw error;
  }
}
async function json(url) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error("probe_failed");
  // Agent metadata is bounded; do not read customer requests or inspection logs.
  let length = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 65536) throw new Error("probe_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function command(args, env, timeout = 180000) {
  // Never print Compose/inspect output or exceptions, which can contain secrets.
  try {
    return (
      await execute("docker", args, {
        cwd: root,
        env,
        windowsHide: true,
        timeout,
        maxBuffer: 1024 * 1024,
      })
    ).stdout.trim();
  } catch {
    throw new Error("docker_operation_failed");
  }
}
export async function main(
  args = process.argv.slice(2),
  environment = process.env,
) {
  let requested;
  let confirmed = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--publish-confirmed") confirmed = true;
    else if (args[index] === "--url" && args[index + 1])
      requested = httpsOrigin(args[++index]);
    else throw new Error("invalid_arguments");
  }
  if (!confirmed) throw new Error("publication_confirmation_required");
  const image = environment.PRODUCTION_APP_IMAGE;
  if (!/^[a-z0-9./:_-]+@sha256:[a-f0-9]{64}$/.test(image ?? ""))
    throw new Error("immutable_production_image_required");
  if (!environment.DATABASE_URL_SECRET_FILE || !environment.JWT_SECRET_FILE)
    throw new Error("protected_production_secret_files_required");
  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", () => reject(new Error("agent_api_port_in_use")));
    reservation.listen(4040, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => reservation.close(resolve));
  const gate = await createGate();
  let cancelled = false;
  let child;
  let exited = false;
  const abort = () => {
    cancelled = true;
    gate.hold();
    child?.kill();
  };
  process.on("SIGINT", abort);
  process.on("SIGTERM", abort);
  const env = { ...environment, TRUST_PROXY: "true" };
  // Isolated standalone definition only. Never starts the example database.
  const compose = [
    "compose",
    "-p",
    "cofounder-hosted",
    "-f",
    "compose.production.yml",
  ];
  let containerId;
  let imageId;
  async function verify(origin) {
    if (cancelled || exited) throw new Error("launch_cancelled");
    const current = await command(
      [...compose, "ps", "--quiet", "app"],
      env,
      5000,
    );
    if (!containerId || current !== containerId)
      throw new Error("hosted_container_changed");
    const [container] = JSON.parse(
      await command(["inspect", containerId], env, 5000),
    );
    checkContainer(container, { origin, image, imageId });
    const [ready, health] = await Promise.all([
      json("http://127.0.0.1:3014/api/ready"),
      json("http://127.0.0.1:3014/api/health"),
    ]);
    if (
      ready.status !== "ready" ||
      health.status !== "ok" ||
      health.mode !== "production" ||
      health.databaseConfigured !== true ||
      health.outreachPaused !== true ||
      health.platformAutomation !== "disabled" ||
      health.legacyRoutes !== "disabled"
    )
      throw new Error("hosted_health_rejected");
    const endpoint = selectEndpoint(
      await json("http://127.0.0.1:4040/api/endpoints"),
      gate.url,
      requested,
    );
    if (endpoint !== origin) throw new Error("endpoint_changed");
  }
  const agent = {
    alive: () => !exited && !!child && child.exitCode === null,
    async stop() {
      if (!child || exited) return;
      child.kill();
      for (let retry = 0; retry < 20 && !exited; retry++) await sleep(100);
      if (!exited) child.kill("SIGKILL");
    },
  };
  try {
    child = spawn(
      "ngrok",
      [
        "http",
        gate.url,
        "--inspect=false",
        ...(requested ? [`--url=${requested}`] : []),
      ],
      { cwd: root, windowsHide: true, stdio: "ignore" },
    );
    child.on("error", abort);
    child.on("exit", () => {
      exited = true;
      abort();
    });
    const origin = await activate({
      gate,
      agent,
      cancelled: () => cancelled,
      async discover() {
        for (let retry = 0; retry < 30; retry++) {
          if (cancelled || !agent.alive()) throw new Error("agent_stopped");
          try {
            return selectEndpoint(
              await json("http://127.0.0.1:4040/api/endpoints"),
              gate.url,
              requested,
            );
          } catch {
            await sleep(1000);
          }
        }
        throw new Error("endpoint_discovery_failed");
      },
      async prepare(origin) {
        env.PUBLIC_ORIGIN = origin;
        imageId = await command(
          ["image", "inspect", "--format", "{{.Id}}", image],
          env,
        );
        await command(
          [
            ...compose,
            "up",
            "--detach",
            "--no-build",
            "--pull",
            "never",
            "--wait",
            "--wait-timeout",
            "120",
            "app",
          ],
          env,
        );
        containerId = await command([...compose, "ps", "--quiet", "app"], env);
      },
      verify,
    });
    console.log(
      JSON.stringify({
        publicUrl: origin,
        registrationEnabled: false,
        ngrokProcessId: child.pid,
        localPostureVerified: true,
        liveProviderAcceptance: false,
        keepCoordinatorOpen: true,
      }),
    );
    while (!cancelled) {
      await sleep(5000);
      if (!cancelled) await verify(origin);
    }
  } finally {
    gate.hold();
    try {
      await gate.close();
    } finally {
      await agent.stop();
      process.off("SIGINT", abort);
      process.off("SIGTERM", abort);
    }
    // The hosted app remains loopback-only for inspection; never enable local
    // registration or recreate a development app automatically after failure.
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error(
      "Hosted tunnel stopped or refused; no local-mode fallback was performed. Review hosted prerequisites.",
    );
    process.exitCode = 1;
  });
}
