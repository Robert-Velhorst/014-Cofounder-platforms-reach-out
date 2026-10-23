import { pathToFileURL } from "node:url";

export function monitorOptions(args) {
  const options = {
    origin: "http://127.0.0.1:3000",
    samples: 1,
    intervalMs: 30000,
    failureThreshold: 3,
    timeoutMs: 3000,
  };
  let remote = false;
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (seen.has(key)) throw new Error("invalid_monitor_options");
    seen.add(key);
    if (key === "--allow-remote") {
      remote = true;
      continue;
    }
    const fields = {
      "--origin": "origin",
      "--samples": "samples",
      "--interval-ms": "intervalMs",
      "--failure-threshold": "failureThreshold",
      "--timeout-ms": "timeoutMs",
    };
    if (!fields[key] || !args[i + 1])
      throw new Error("invalid_monitor_options");
    const value = args[++i];
    options[fields[key]] = key === "--origin" ? value : Number(value);
  }
  const url = new URL(options.origin);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("invalid_monitor_options");
  const loopback = ["127.0.0.1", "[::1]"].includes(url.hostname);
  if (!loopback && (!remote || url.protocol !== "https:"))
    throw new Error("remote_monitor_not_authorized");
  for (const [key, min, max] of [
    ["samples", 1, 2880],
    ["intervalMs", 1000, 3600000],
    ["failureThreshold", 1, 100],
    ["timeoutMs", 100, 10000],
  ]) {
    if (
      !Number.isInteger(options[key]) ||
      options[key] < min ||
      options[key] > max
    )
      throw new Error("invalid_monitor_options");
  }
  options.origin = url.origin;
  return options;
}

// Fixed endpoints only; no cookies, credentials, customer data or response bodies
// enter the report. Response size and total fetch/body time are both bounded.
async function checkEndpoint(origin, path, timeoutMs, expected) {
  try {
    const response = await fetch(origin + path, {
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
    });
    if (response.status !== 200) {
      await response.body?.cancel();
      return { ok: false, reason: "http_status", status: response.status };
    }
    if (
      !/^application\/json(?:;|$)/i.test(
        response.headers.get("content-type") ?? "",
      )
    ) {
      await response.body?.cancel();
      return { ok: false, reason: "invalid_response" };
    }
    const reader = response.body?.getReader();
    if (!reader) return { ok: false, reason: "invalid_response" };
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) {
          await reader.cancel();
          return { ok: false, reason: "invalid_response" };
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return expected(data)
      ? { ok: true, reason: "ok", status: 200 }
      : { ok: false, reason: "invalid_response" };
  } catch {
    return { ok: false, reason: "transport_or_response_failure" };
  }
}

export async function probeRuntime({ origin, timeoutMs }) {
  const health = await checkEndpoint(
    origin,
    "/api/health",
    timeoutMs,
    (data) => data?.status === "ok" && data?.mode === "production",
  );
  const readiness = await checkEndpoint(
    origin,
    "/api/ready",
    timeoutMs,
    (data) => data?.status === "ready",
  );
  return { healthy: health.ok && readiness.ok, health, readiness };
}

export function createMonitorState(failureThreshold) {
  if (
    !Number.isInteger(failureThreshold) ||
    failureThreshold < 1 ||
    failureThreshold > 100
  )
    throw new Error("invalid_monitor_options");
  let failures = 0,
    alerting = false;
  return {
    observe(healthy) {
      if (healthy) {
        failures = 0;
        if (alerting) {
          alerting = false;
          return { event: "runtime_recovered", consecutiveFailures: 0 };
        }
        return null;
      }
      failures = Math.min(failureThreshold, failures + 1);
      if (!alerting && failures === failureThreshold) {
        alerting = true;
        return { event: "runtime_alert", consecutiveFailures: failures };
      }
      return null;
    },
  };
}

export async function runMonitor(
  options,
  {
    emit = (value) => console.log(JSON.stringify(value)),
    signal,
    pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {},
) {
  const state = createMonitorState(options.failureThreshold);
  let latestHealthy = false,
    completed = 0;
  for (let i = 0; i < options.samples && !signal?.aborted; i++) {
    const result = await probeRuntime(options);
    latestHealthy = result.healthy;
    completed++;
    emit({
      event: "runtime_probe",
      observedAt: new Date().toISOString(),
      ...result,
    });
    const transition = state.observe(latestHealthy);
    if (transition)
      emit({ ...transition, observedAt: new Date().toISOString() });
    if (i + 1 < options.samples && !signal?.aborted)
      await pause(options.intervalMs);
  }
  // Latest status is not whole-run availability or proof of notification delivery.
  return {
    exitCode: signal?.aborted || !completed || !latestHealthy ? 1 : 0,
    completed,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let options;
  try {
    options = monitorOptions(process.argv.slice(2));
  } catch {
    console.error(
      JSON.stringify({ event: "runtime_monitor_configuration_failed" }),
    );
    process.exitCode = 2;
  }
  if (options) {
    const controller = new AbortController();
    const stop = () => controller.abort();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    try {
      const { exitCode } = await runMonitor(options, {
        signal: controller.signal,
        pause: (ms) =>
          new Promise((resolve) => {
            if (controller.signal.aborted) return resolve();
            const done = () => {
              clearTimeout(timer);
              controller.signal.removeEventListener("abort", done);
              resolve();
            };
            const timer = setTimeout(done, ms);
            controller.signal.addEventListener("abort", done, { once: true });
          }),
      });
      process.exitCode = exitCode;
    } catch {
      console.error(JSON.stringify({ event: "runtime_monitor_failed" }));
      process.exitCode = 1;
    } finally {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
    }
  }
}
