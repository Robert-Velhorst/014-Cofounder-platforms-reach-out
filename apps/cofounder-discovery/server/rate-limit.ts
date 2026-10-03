import { createHmac, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";

export const LOCAL_RATE_MAX_BUCKETS = 10_000;
const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;
type Options = { limit: number; windowMs: number };
type Bucket = { key: string; count: number; resetAt: number };
export type RateDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  reason?: "quota" | "capacity";
};

export function createLocalRateLimiter(maxBuckets = LOCAL_RATE_MAX_BUCKETS) {
  if (
    !Number.isSafeInteger(maxBuckets) ||
    maxBuckets < 1 ||
    maxBuckets > 100_000
  )
    throw new Error("Invalid local rate-limit capacity");
  const salt = randomBytes(32);
  const buckets = new Map<string, Bucket>();
  const expiry: Bucket[] = [];
  let cleanup: ReturnType<typeof setInterval> | undefined;

  function push(bucket: Bucket) {
    expiry.push(bucket);
    let index = expiry.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (expiry[parent].resetAt <= bucket.resetAt) break;
      expiry[index] = expiry[parent];
      index = parent;
    }
    expiry[index] = bucket;
  }
  function pop(): Bucket {
    const first = expiry[0],
      last = expiry.pop()!;
    if (expiry.length) {
      let index = 0;
      while (index * 2 + 1 < expiry.length) {
        let child = index * 2 + 1;
        if (
          child + 1 < expiry.length &&
          expiry[child + 1].resetAt < expiry[child].resetAt
        )
          child++;
        if (last.resetAt <= expiry[child].resetAt) break;
        expiry[index] = expiry[child];
        index = child;
      }
      expiry[index] = last;
    }
    return first;
  }
  function sweep(now = Date.now()) {
    while (expiry.length && expiry[0].resetAt <= now) buckets.delete(pop().key);
  }
  function consume(
    key: string,
    options: Options,
    now = Date.now()
  ): RateDecision {
    if (
      typeof key !== "string" ||
      !key ||
      Buffer.byteLength(key, "utf8") > 256 ||
      !Number.isSafeInteger(options.limit) ||
      options.limit < 0 ||
      options.limit > 1_000_000 ||
      !Number.isSafeInteger(options.windowMs) ||
      options.windowMs < 1 ||
      options.windowMs > MAX_WINDOW_MS ||
      !Number.isSafeInteger(now) ||
      now < 0 ||
      !Number.isSafeInteger(now + options.windowMs)
    )
      throw new Error("Invalid local rate-limit request");
    sweep(now);
    if (options.limit === 0)
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: options.windowMs,
        reason: "quota",
      };
    // Store per-process salted identifiers, never raw addresses or oversized keys.
    const id = createHmac("sha256", salt).update(key).digest("hex");
    const current = buckets.get(id);
    if (current) {
      if (current.count >= options.limit)
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: current.resetAt - now,
          reason: "quota",
        };
      current.count++;
      return {
        allowed: true,
        remaining: options.limit - current.count,
        retryAfterMs: 0,
      };
    }
    if (buckets.size >= maxBuckets)
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(1, expiry[0].resetAt - now),
        reason: "capacity",
      };
    const bucket = { key: id, count: 1, resetAt: now + options.windowMs };
    buckets.set(id, bucket);
    push(bucket);
    return { allowed: true, remaining: options.limit - 1, retryAfterMs: 0 };
  }
  function stopCleanup() {
    if (cleanup) clearInterval(cleanup);
    cleanup = undefined;
  }
  return {
    consume,
    sweep,
    // Aggregate diagnostics only: no identifiers, addresses or salt.
    stats: () => ({ buckets: buckets.size, expirations: expiry.length }),
    clear: () => {
      buckets.clear();
      expiry.length = 0;
    },
    startCleanup: () => {
      cleanup ??= setInterval(() => sweep(), 60_000);
      cleanup.unref();
      return { stop: stopCleanup };
    },
  };
}
const localRateLimiter = createLocalRateLimiter();
export const consumeRateLimit = localRateLimiter.consume;
export const resetRateLimitsForTests = localRateLimiter.clear;
export const startRateLimitCleanup = localRateLimiter.startCleanup;

export class LocalRateLimitError extends TRPCError {
  readonly retryAfterSeconds: number;
  constructor(decision: RateDecision, message: string) {
    super({
      code:
        decision.reason === "capacity"
          ? "SERVICE_UNAVAILABLE"
          : "TOO_MANY_REQUESTS",
      message:
        decision.reason === "capacity"
          ? "Traffic guard is temporarily busy. Try again later."
          : message,
    });
    this.retryAfterSeconds = Math.max(
      1,
      Math.ceil(decision.retryAfterMs / 1000)
    );
  }
}
export function assertLocalRateLimit(decision: RateDecision, message: string) {
  if (!decision.allowed) throw new LocalRateLimitError(decision, message);
}
export function trafficRetryHeaders(errors: readonly TRPCError[]) {
  const seconds = errors.reduce(
    (maximum, error) =>
      Math.max(
        maximum,
        error instanceof LocalRateLimitError
          ? error.retryAfterSeconds
          : error.code === "SERVICE_UNAVAILABLE"
            ? 1
            : 0
      ),
    0
  );
  return seconds ? { "retry-after": String(seconds) } : {};
}
