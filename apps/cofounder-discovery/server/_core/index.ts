import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getConfig, publicRuntimeStatus } from "../config";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { permitsTrpcUrl } from "../route-policy";
import { haiFeedHandler } from "../hai-connector";

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
  if (config.TRUST_PROXY) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const requestId = req.header("x-request-id")?.slice(0, 64) || randomUUID();
    res.setHeader("x-request-id", requestId);
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("x-frame-options", "DENY");
    res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
    res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("content-security-policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    next();
  });
  app.use((req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    const origin = req.header("origin");
    if (!origin || !config.PUBLIC_ORIGIN || config.NODE_ENV !== "production") return next();
    if (origin === config.PUBLIC_ORIGIN) return next();
    res.status(403).json({ error: "origin_rejected", requestId: res.getHeader("x-request-id") });
  });
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", ...publicRuntimeStatus(config) }));
  app.get("/api/ready", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("database_not_configured");
      await db.execute(sql`select 1`);
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "not_ready", reason: "database_unavailable" });
    }
  });
  app.get("/api/integrations/hai/feed", haiFeedHandler);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use("/api/trpc", (req, res, next) => {
    if (permitsTrpcUrl(req.url, config.ENABLE_UNSAFE_LEGACY_ROUTES)) return next();
    res.status(403).json({
      error: "legacy_route_disabled",
      message: "This imported prototype route is disabled. Use /outreach and the criticalPath API.",
      requestId: res.getHeader("x-request-id"),
    });
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = config.PORT;
  const port = config.NODE_ENV === "production" ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, config.HOST, () => {
    console.log(JSON.stringify({ level: "info", event: "server_started", host: config.HOST, port, mode: config.APP_MODE }));
  });
}

startServer().catch(error => {
  console.error(JSON.stringify({ level: "fatal", event: "startup_failed", message: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
