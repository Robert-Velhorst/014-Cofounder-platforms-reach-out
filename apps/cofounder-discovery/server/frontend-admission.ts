import type { RequestHandler, Response } from "express";
import { ipKeyGenerator, type Options } from "express-rate-limit";
import { createLocalRateLimiter } from "./rate-limit";

import {
  FRONTEND_WINDOW_MS,
  FRONTEND_PROCESS_LIMIT,
  FRONTEND_CLIENT_LIMIT,
  FRONTEND_CLIENT_CAPACITY,
} from "../shared/frontend-admission-policy";
export {
  FRONTEND_WINDOW_MS,
  FRONTEND_PROCESS_LIMIT,
  FRONTEND_CLIENT_LIMIT,
  FRONTEND_CLIENT_CAPACITY,
} from "../shared/frontend-admission-policy";

function refuse(res: Response, status: 429 | 503, seconds: number) {
  res.setHeader("cache-control", "private, no-store");
  res.setHeader("retry-after", String(Math.max(1, Math.ceil(seconds))));
  res.status(status).json({
    error: status === 429 ? "frontend_rate_limited" : "frontend_admission_busy",
  });
}

// One constant key: the library's process-wide store never accumulates IPs.
// Use the real library middleware directly at both route-registration sites so
// the rate-limiting boundary is visible to maintainers and static analysis.
export const FRONTEND_GLOBAL_RATE_OPTIONS = Object.freeze({
  windowMs: FRONTEND_WINDOW_MS,
  limit: FRONTEND_PROCESS_LIMIT,
  keyGenerator: () => "frontend-process",
  requestPropertyName: "frontendRateLimit",
  legacyHeaders: false,
  standardHeaders: false,
  passOnStoreError: false,
  handler: (_req, res) => refuse(res, 429, FRONTEND_WINDOW_MS / 1000),
} satisfies Partial<Options>);

// Independent of auth/API quota storage. Unique-address floods fail closed at
// a fixed capacity; keys are salted HMACs and IPv6 addresses share a /56 budget.
// Expiration is swept on consumption, with no additional lifecycle timer.
export function createFrontendClientAdmission(
  limit = FRONTEND_CLIENT_LIMIT,
  capacity = FRONTEND_CLIENT_CAPACITY,
  windowMs = FRONTEND_WINDOW_MS
): RequestHandler {
  for (const [value, maximum] of [
    [limit, FRONTEND_CLIENT_LIMIT],
    [capacity, FRONTEND_CLIENT_CAPACITY],
    [windowMs, FRONTEND_WINDOW_MS],
  ])
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
      throw new Error("invalid_frontend_admission_bounds");
  const clients = createLocalRateLimiter(capacity);
  return (req, res, next) => {
    const address = req.ip || req.socket.remoteAddress || "unknown";
    const key = ipKeyGenerator(address, 56);
    const decision = clients.consume(key, { limit, windowMs });
    if (!decision.allowed) {
      refuse(
        res,
        decision.reason === "capacity" ? 503 : 429,
        decision.retryAfterMs / 1000
      );
      return;
    }
    next();
  };
}
