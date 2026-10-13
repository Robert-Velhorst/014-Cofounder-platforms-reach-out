// Run via stdin inside a network-disabled test container at the application's
// working directory: node --import tsx --expose-gc --input-type=module
// This exercises only the traffic primitive, not customer/database load.
import assert from "node:assert/strict";
import {
  createLocalRateLimiter,
  LOCAL_RATE_MAX_BUCKETS,
} from "./server/rate-limit.ts";

assert.equal(process.env.NODE_ENV, "test");
for (const key of [
  "DATABASE_URL",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "OPENAI_API_KEY",
])
  assert.equal(
    process.env[key],
    undefined,
    "synthetic fixture must not inherit credentials",
  );
const limiter = createLocalRateLimiter();
global.gc?.();
const initial = process.memoryUsage();
const start = performance.now();
let accepted = 0,
  denied = 0;
for (let index = 0; index < 200_000; index++) {
  const decision = limiter.consume(
    `synthetic-client:${index}`,
    { limit: 2, windowMs: 3_600_000 },
    0,
  );
  if (decision.allowed) accepted++;
  else denied++;
}
assert.equal(accepted, LOCAL_RATE_MAX_BUCKETS);
assert.equal(denied, 200_000 - LOCAL_RATE_MAX_BUCKETS);
assert.deepEqual(limiter.stats(), {
  buckets: LOCAL_RATE_MAX_BUCKETS,
  expirations: LOCAL_RATE_MAX_BUCKETS,
});
assert.equal(
  limiter.consume("synthetic-client:0", { limit: 2, windowMs: 3_600_000 }, 1)
    .allowed,
  true,
);
assert.equal(
  limiter.consume("synthetic-client:0", { limit: 2, windowMs: 3_600_000 }, 2)
    .allowed,
  false,
);
global.gc?.();
const full = process.memoryUsage();
const admissionMs = performance.now() - start;
limiter.sweep(3_600_000);
assert.deepEqual(limiter.stats(), { buckets: 0, expirations: 0 });
global.gc?.();
console.log(
  JSON.stringify({
    event: "synthetic_traffic_guard_stress_passed",
    attempts: 200_000,
    accepted,
    denied,
    admissionMs: Math.round(admissionMs),
    initialHeapBytes: initial.heapUsed,
    fullHeapBytes: full.heapUsed,
    fullRssBytes: full.rss,
    cleanupHeapBytes: process.memoryUsage().heapUsed,
    customerLoadAcceptance: false,
  }),
);
