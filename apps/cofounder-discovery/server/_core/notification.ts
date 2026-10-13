import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import { getConfig } from "../config";

export type NotificationPayload = {
  title: string;
  content: string;
};

export const TITLE_MAX_LENGTH = 1200;
export const CONTENT_MAX_LENGTH = 20000;
export const OWNER_NOTIFICATION_TIMEOUT_MS = 5000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildEndpointUrl = (baseUrl: string): string => {
  // This is operator configuration, never a request-supplied provider URL.
  // Never forward credentials over plaintext, URL credentials or redirects.
  const base = new URL(baseUrl);
  if (
    base.protocol !== "https:" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error("notification_endpoint_invalid");
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Dispatches a project-owner notification through the Manus Notification Service.
 * Returns true for an accepted HTTP response, not a delivery receipt. A failure
 * is uncertain: do not automatically retry or fall back to another sending
 * channel. Disabled/unconfigured/invalid input throws before provider access.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!getConfig().ENABLE_OWNER_NOTIFICATIONS) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Owner notifications are disabled.",
    });
  }

  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service is not configured.",
    });
  }

  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service is not configured.",
    });
  }

  let endpoint: string;
  try {
    endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service configuration is invalid.",
    });
  }

  const controller = new AbortController();
  const deadline = setTimeout(
    () => controller.abort(),
    OWNER_NOTIFICATION_TIMEOUT_MS
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });

    // We do not need the body for acceptance. Cancel it without reading private
    // provider text, and without waiting on a streaming body or cleanup failure.
    void response.body?.cancel().catch(() => undefined);
    if (!response.ok) {
      console.warn(
        JSON.stringify({
          event: "owner_notification_failed",
          reason: "provider_rejected",
          status: response.status,
        })
      );
      return false;
    }

    return true;
  } catch {
    console.warn(
      JSON.stringify({
        event: "owner_notification_failed",
        reason: controller.signal.aborted ? "timeout" : "transport_failure",
      })
    );
    return false;
  } finally {
    clearTimeout(deadline);
  }
}
