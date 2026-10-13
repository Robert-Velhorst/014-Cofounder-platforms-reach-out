/** Test-only connection pool. Never retries requests or changes application policy. */
import { Agent } from "node:http";

export function createSyntheticHttpAgent(localAddress: string) {
  // A finite pool timeout lets Node apply the peer's shorter keep-alive hint.
  // Each active request still has its existing 10-second deadline; no retries.
  return new Agent({
    keepAlive: true,
    maxSockets: 1,
    localAddress,
    timeout: 10_000,
  });
}
