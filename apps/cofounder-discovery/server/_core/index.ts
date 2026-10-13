import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import net from "net";
import { createBoundedTrpcMiddleware } from "../trpc-transport";
import { TRPCError } from "@trpc/server";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getConfig, publicRuntimeStatus } from "../config";
import { closeDb, getDb } from "../db";
import { sql } from "drizzle-orm";
import {
  requestCorrelation,
  validateRequestPath,
  apiNotFound,
  safeHttpError,
} from "../http-boundary";
import { createTrpcRouteAdmission } from "../route-policy";
import { haiFeedHandler } from "../hai-connector";
import { startAccountMailWorker } from "../account-mail-worker";
import { startAccountMailRetentionWorker } from "../account-mail-retention-worker";
import { createServerShutdown } from "../server-shutdown";
import { applicationWork } from "../server-work";
import { startRateLimitCleanup, trafficRetryHeaders } from "../rate-limit";
import { listenForStartup, reportStartupFailure } from "../server-startup";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const config = getConfig();
  const app = express();
  const server = createServer(app);
  let accountMailWorker: ReturnType<typeof startAccountMailWorker> | undefined;
  let trafficCleanup: ReturnType<typeof startRateLimitCleanup> | undefined;
  let accountMailRetentionWorker:
    ReturnType<typeof startAccountMailRetentionWorker> | undefined;
  let developmentServer: Awaited<ReturnType<typeof setupVite>> | undefined;
  const lifecycle = createServerShutdown({
    server,
    // HMR sockets share this HTTP server. Drain their close promise alongside
    // HTTP and backend work; keep the rest of Vite alive until requests finish.
    stopUpgradedConnections: async () => {
      await developmentServer?.ws.close();
    },
    stopWorker: async () => {
      trafficCleanup?.stop();
      await Promise.all([
        accountMailWorker?.stop(),
        accountMailRetentionWorker?.stop(),
        applicationWork.stop(),
      ]);
    },
    closeResources: async () => {
      await developmentServer?.close();
      await closeDb();
    },
  });
  // Existing keep-alive sockets may submit another request while draining.
  app.use((_req, res, next) => {
    if (!lifecycle.started) return next();
    res.setHeader("connection", "close");
    res.status(503).json({ error: "server_shutting_down" });
  });
  if (config.TRUST_PROXY) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(requestCorrelation);
  app.use((req, res, next) => {
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("x-frame-options", "DENY");
    res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "permissions-policy",
      "camera=(), microphone=(), geolocation=()"
    );
    res.setHeader(
      "content-security-policy",
      "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
    next();
  });
  app.use((req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    const origin = req.header("origin");
    if (!origin || !config.PUBLIC_ORIGIN || config.NODE_ENV !== "production")
      return next();
    if (origin === config.PUBLIC_ORIGIN) return next();
    res.status(403).json({
      error: "origin_rejected",
      requestId: res.getHeader("x-request-id"),
    });
  });
  app.use(compression());
  app.use(validateRequestPath);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", ...publicRuntimeStatus(config) })
  );
  app.get("/api/ready", async (_req, res) => {
    try {
      await applicationWork.run(async () => {
        const db = await getDb();
        if (!db) throw new Error("database_not_configured");
        await db.execute(sql`select 1`);
      });
      res.json({ status: "ready" });
    } catch (error) {
      res
        .status(503)
        .setHeader("retry-after", "1")
        .json({
          status: "not_ready",
          reason:
            error instanceof TRPCError && error.code === "SERVICE_UNAVAILABLE"
              ? "application_busy"
              : "database_unavailable",
        });
    }
  });
  app.get("/api/integrations/hai/feed", (req, res, next) => {
    void applicationWork
      .run(() => haiFeedHandler(req, res, next))
      .catch(() => {
        if (!res.headersSent)
          res.status(503).json({ error: "service_unavailable" });
        else res.end();
      });
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createTrpcRouteAdmission(config.ENABLE_UNSAFE_LEGACY_ROUTES)
  );
  app.use(
    "/api/trpc",
    createBoundedTrpcMiddleware({
      router: appRouter,
      createContext: options =>
        applicationWork.run(() => createContext(options)),
      responseMeta: ({ errors }) => ({ headers: trafficRetryHeaders(errors) }),
    })
  );
  app.use("/api", apiNotFound);
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    developmentServer = await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(safeHttpError);

  const preferredPort = config.PORT;
  const port =
    config.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  await listenForStartup(server, port, config.HOST);
  console.log(
    JSON.stringify({
      level: "info",
      event: "server_started",
      host: config.HOST,
      port,
      mode: config.APP_MODE,
    })
  );
  accountMailWorker = startAccountMailWorker(config);
  trafficCleanup = startRateLimitCleanup();
  accountMailRetentionWorker = startAccountMailRetentionWorker(config);
  const stop = () => {
    if (lifecycle.started) return;
    console.log(JSON.stringify({ level: "info", event: "shutdown_started" }));
    void lifecycle.shutdown().then(success => {
      const event = success ? "shutdown_completed" : "shutdown_failed";
      // Flush this bounded, non-sensitive event before exiting. All shared
      // resources are already drained on success; failure leaves leases intact.
      process.stdout.write(
        JSON.stringify({ level: success ? "info" : "error", event }) + "\n",
        () => process.exit(success ? 0 : 1)
      );
      // A blocked log destination must not defeat the shutdown deadline.
      setTimeout(() => process.exit(success ? 0 : 1), 1_000).unref();
    });
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

startServer().catch(() => {
  reportStartupFailure();
  process.exitCode = 1;
});
