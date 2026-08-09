import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { and, asc, eq, gt, or, like } from "drizzle-orm";
import { auditEvents } from "../drizzle/schema";
import { getConfig } from "./config";
import { getDb } from "./db";
import { consumeRateLimit } from "./rate-limit";

const MAX_ITEMS = 100;

function secureTokenMatch(actual: string, expected: string) {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export const haiFeedHandler: RequestHandler = async (req, res) => {
  const config = getConfig();
  if (!config.HAI_CONNECTOR_TOKEN || !config.HAI_CONNECTOR_USER_ID) {
    res.status(503).json({ error: "hai_connector_disabled" });
    return;
  }
  const rate = consumeRateLimit(`hai:${req.ip}`, { limit: 60, windowMs: 60_000 });
  if (!rate.allowed) {
    res.setHeader("retry-after", Math.max(1, Math.ceil(rate.retryAfterMs / 1000)));
    res.status(429).json({ error: "rate_limited" });
    return;
  }
  const authorization = req.header("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!supplied || !secureTokenMatch(supplied, config.HAI_CONNECTOR_TOKEN)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const parsedCursor = Number.parseInt(String(req.query.cursor ?? "0"), 10);
  const cursor = Number.isSafeInteger(parsedCursor) && parsedCursor >= 0 ? parsedCursor : 0;
  const db = await getDb();
  if (!db) {
    res.status(503).json({ error: "database_unavailable" });
    return;
  }
  const rows = await db
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.userId, config.HAI_CONNECTOR_USER_ID),
        gt(auditEvents.id, cursor),
        or(
          like(auditEvents.action, "outreach.%"),
          like(auditEvents.action, "prospect.%")
        )
      )
    )
    .orderBy(asc(auditEvents.id))
    .limit(MAX_ITEMS);

  const nextCursor = rows.at(-1)?.id ?? cursor;
  const sourceUri = config.PUBLIC_ORIGIN ? `${config.PUBLIC_ORIGIN}/outreach` : undefined;
  res.setHeader("cache-control", "private, no-store");
  res.json({
    cursor: String(nextCursor),
    items: rows.map(event => ({
      externalId: `cofounder-event:${event.id}`,
      threadId: `cofounder-${event.entityType ?? "activity"}:${event.entityId ?? event.id}`,
      title: `Co-founder workflow: ${event.action.replaceAll(".", " ")}`,
      content: config.HAI_CONNECTOR_INCLUDE_CONTENT
        ? JSON.stringify({ action: event.action, outcome: event.outcome, metadata: event.metadata }, null, 2)
        : `${event.action} completed with outcome ${event.outcome}. Detailed metadata is withheld by the connector privacy setting.`,
      sourceUri,
      itemType: "message",
      provider: "generic_json_feed",
      accountLabel: "cofounder_outreach",
      projectKey: "014-cofounder-platforms-reach-out",
      receivedAt: event.createdAt.toISOString(),
      metadata: {
        eventId: event.id,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        outcome: event.outcome,
        providerConfirmed: false,
        contentIncluded: config.HAI_CONNECTOR_INCLUDE_CONTENT,
      },
    })),
  });
};
