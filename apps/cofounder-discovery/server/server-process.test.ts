import { fork } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { TRPC_MAX_BATCH_ITEMS } from "../shared/trpc-transport";

describe("real application signal wiring", () => {
  it.each([
    { signal: "SIGTERM", mode: "test", maximum: "32" },
    { signal: "SIGINT", mode: "test", maximum: "32" },
    { signal: "SIGTERM", mode: "development", maximum: "32" },
    { signal: "SIGTERM", mode: "test", maximum: "0" },
  ] as const)(
    "exits successfully after $signal in $mode with admission $maximum, including an open HMR socket",
    async ({ signal, mode, maximum }) => {
      const probe = createServer();
      await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
      const address = probe.address();
      if (!address || typeof address === "string")
        throw new Error("fixture_address");
      const port = address.port;
      await new Promise<void>(resolve => probe.close(() => resolve()));
      const child = fork(
        fileURLToPath(
          new URL("./test-fixtures/shutdown-server.ts", import.meta.url)
        ),
        {
          execArgv: ["--import", "tsx"],
          env: {
            ...process.env,
            NODE_ENV: mode,
            APP_MODE: "test",
            HOST: "127.0.0.1",
            PORT: String(port),
            API_MAX_ACTIVE_WORK: maximum,
            ENABLE_REGISTRATION: "true",
            DATABASE_URL: "",
            JWT_SECRET:
              "synthetic-http-boundary-test-secret-at-least-32-characters",
            PUBLIC_ORIGIN: `http://127.0.0.1:${port}`,
            ENABLE_ACCOUNT_MAIL_WORKER: "false",
            ENABLE_PLATFORM_AUTOMATION: "false",
            ENABLE_UNSAFE_LEGACY_ROUTES: "false",
            OPENAI_API_KEY: "",
            RESEND_API_KEY: "",
          },
          stdio: ["ignore", "pipe", "pipe", "ipc"],
        }
      );
      let output = "";
      child.stdout?.on("data", chunk => {
        output += String(chunk);
      });
      child.stderr?.on("data", chunk => {
        output += String(chunk);
      });
      const exited = new Promise<{
        code: number | null;
        signal: string | null;
      }>(resolve => {
        child.once("exit", (code, signal) => resolve({ code, signal }));
      });
      let hmr: WebSocket | undefined;
      try {
        await vi.waitFor(
          () => {
            expect(child.exitCode, output).toBe(null);
            expect(output).toContain('"event":"server_started"');
          },
          { timeout: 20_000 }
        );
        // Exercise the actual mounted adapter, not only its isolated factory.
        // Anonymous auth.me requires neither customer data nor external services.
        const base = `http://127.0.0.1:${port}`;
        if (mode === "test" && maximum === "32" && signal === "SIGTERM") {
          // Well-formed registration now requires shared DB admission even for
          // weak passwords. Missing storage must fail closed, never fall back
          // to the former process-local limiter. The real quota/restart path
          // is exercised by registration-admission.integration.test.ts.
          const register = () =>
            fetch(base + "/api/trpc/auth.register", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                json: {
                  name: "Synthetic guard test",
                  email: "guard@example.invalid",
                  password: "weak",
                },
              }),
            });
          for (let attempt = 0; attempt < 6; attempt++) {
            const unavailable = await register();
            expect(unavailable.status).toBe(503);
            expect(unavailable.headers.get("set-cookie")).toBe(null);
            expect(await unavailable.json()).toMatchObject({
              error: {
                json: {
                  message:
                    "Registration is temporarily unavailable. Please try again.",
                  data: { code: "SERVICE_UNAVAILABLE" },
                },
              },
            });
          }
        }
        for (const [path, status, error] of [
          ["/api/not-a-route", 404, "api_not_found"],
          ["/api/trpc/auth.%ZZ", 400, "invalid_request_path"],
        ] as const) {
          const response = await fetch(base + path);
          expect(response.status).toBe(status);
          expect(await response.json()).toMatchObject({ error });
        }
        const malformed = await fetch(base + "/api/trpc/auth.login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-request-id": "private-caller-content",
          },
          body: '{"private-body":',
        });
        expect(malformed.status).toBe(400);
        const requestId = malformed.headers.get("x-request-id");
        expect(requestId).toMatch(/^[a-f0-9-]{36}$/);
        expect(await malformed.json()).toEqual({
          error: "invalid_request_body",
          requestId,
        });
        const largeBody = await fetch(base + "/api/trpc/auth.login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ privateBody: "x".repeat(1024 * 1024) }),
        });
        expect(largeBody.status).toBe(413);
        expect(await largeBody.json()).toMatchObject({
          error: "request_body_too_large",
        });
        const batch = (count: number) =>
          `http://127.0.0.1:${port}/api/trpc/${Array(count).fill("auth.me").join(",")}?batch=1`;
        const oversized = await fetch(batch(TRPC_MAX_BATCH_ITEMS + 1));
        expect(oversized.status).toBe(400);
        expect(await oversized.text()).toContain(
          "Batch call exceeds maximum size"
        );
        const allowed = await fetch(batch(TRPC_MAX_BATCH_ITEMS));
        if (maximum === "0") {
          expect(allowed.status).toBe(503);
          expect(allowed.headers.get("retry-after")).toBe("1");
          const readiness = await fetch(`http://127.0.0.1:${port}/api/ready`);
          expect(readiness.status).toBe(503);
          expect(await readiness.json()).toMatchObject({
            reason: "application_busy",
          });
          const live = await fetch(`http://127.0.0.1:${port}/api/health`);
          expect(live.status).toBe(200);
          expect(await live.json()).toMatchObject({ status: "ok" });
        } else {
          expect(allowed.status).toBe(200);
          expect(await allowed.json()).toHaveLength(TRPC_MAX_BATCH_ITEMS);
        }
        if (mode === "development") {
          const client = await fetch(
            `http://127.0.0.1:${port}/@vite/client`
          ).then(response => response.text());
          const token = client.match(/const wsToken = "([^"]+)"/);
          expect(token).not.toBe(null);
          hmr = new WebSocket(
            `ws://127.0.0.1:${port}/?token=${token![1]}`,
            "vite-hmr"
          );
          await vi.waitFor(() => expect(hmr!.readyState).toBe(WebSocket.OPEN), {
            timeout: 5_000,
          });
        }
        if (process.platform === "win32") child.send(signal);
        else child.kill(signal);
        await vi.waitFor(() => expect(child.exitCode, output).toBe(0), {
          timeout: 5_000,
        });
        expect(await exited).toEqual({ code: 0, signal: null });
        expect(output).toContain('"event":"shutdown_completed"');
        expect(output).not.toContain('"event":"shutdown_failed"');
      } finally {
        hmr?.close();
        if (child.exitCode === null && child.signalCode === null)
          child.kill("SIGKILL");
        await exited;
      }
    },
    30_000
  );
});
