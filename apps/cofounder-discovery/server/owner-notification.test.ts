import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import {
  notifyOwner,
  OWNER_NOTIFICATION_TIMEOUT_MS,
} from "./_core/notification";

const fixture = vi.hoisted(() => ({
  enabled: false,
  env: {
    forgeApiUrl: "https://provider.example.test/api/",
    forgeApiKey: "synthetic-key-never-real",
  },
}));
vi.mock("./_core/env", () => ({ ENV: fixture.env }));
vi.mock("./config", () => ({
  getConfig: () => ({ ENABLE_OWNER_NOTIFICATIONS: fixture.enabled }),
}));

const payload = { title: "Synthetic title", content: "Synthetic content" };
const nativeFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof vi.fn>;
let warning: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  fixture.enabled = false;
  fixture.env.forgeApiUrl = "https://provider.example.test/api/";
  fixture.env.forgeApiKey = "synthetic-key-never-real";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  warning = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("review-gated inherited owner notification", () => {
  it("requires explicit opt-in even with configured provider credentials", async () => {
    await expect(notifyOwner(payload)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });
  it("validates the real runtime flag as false by default and rejects ambiguous values", async () => {
    const { getConfig } =
      await vi.importActual<typeof import("./config")>("./config");
    expect(getConfig({ NODE_ENV: "test" }).ENABLE_OWNER_NOTIFICATIONS).toBe(
      false
    );
    expect(
      getConfig({ NODE_ENV: "test", ENABLE_OWNER_NOTIFICATIONS: "true" })
        .ENABLE_OWNER_NOTIFICATIONS
    ).toBe(true);
    for (const value of ["", "yes", "1", "TRUE"])
      expect(() =>
        getConfig({ NODE_ENV: "test", ENABLE_OWNER_NOTIFICATIONS: value })
      ).toThrow();
  });
  for (const field of ["forgeApiUrl", "forgeApiKey"] as const) {
    it("refuses missing " + field + " before fetching", async () => {
      fixture.enabled = true;
      fixture.env[field] = "";
      await expect(notifyOwner(payload)).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  }
  for (const url of [
    "http://provider.example.test",
    "https://user:password@provider.example.test",
    "https://provider.example.test?token=private",
    "https://provider.example.test#private",
    "not-a-url",
  ]) {
    it(
      "refuses an unreviewable endpoint without leaking it: " + url,
      async () => {
        fixture.enabled = true;
        fixture.env.forgeApiUrl = url;
        await expect(notifyOwner(payload)).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Notification service configuration is invalid.",
        });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(warning).not.toHaveBeenCalled();
      }
    );
  }
  for (const input of [
    { title: " ", content: "valid" },
    { title: "valid", content: " " },
    { title: "x".repeat(1201), content: "valid" },
    { title: "valid", content: "x".repeat(20001) },
  ]) {
    it("rejects empty/oversized input without a provider call", async () => {
      fixture.enabled = true;
      await expect(notifyOwner(input)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  }
  it("uses only the configured HTTPS endpoint, bounded signal and no redirect/retry", async () => {
    fixture.enabled = true;
    const cancel = vi.fn().mockResolvedValue(undefined);
    const text = vi.fn();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 202,
      body: { cancel },
      text,
    });
    expect(
      await notifyOwner({
        title: "  Synthetic title  ",
        content: " Synthetic content ",
      })
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://provider.example.test/api/webdevtoken.v1.WebDevService/SendNotification"
    );
    expect(options.redirect).toBe("error");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(text).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });
  it("never reads or logs rejected provider bodies/status text", async () => {
    fixture.enabled = true;
    const text = vi
      .fn()
      .mockResolvedValue("private customer text and credential");
    const cancel = vi.fn().mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "private-secret",
      text,
      body: { cancel },
    });
    expect(await notifyOwner(payload)).toBe(false);
    expect(text).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      JSON.stringify({
        event: "owner_notification_failed",
        reason: "provider_rejected",
        status: 503,
      })
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("logs only a fixed transport reason, never raw exceptions", async () => {
    fixture.enabled = true;
    fetchMock.mockRejectedValue(Error("secret URL token customer content"));
    expect(await notifyOwner(payload)).toBe(false);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      JSON.stringify({
        event: "owner_notification_failed",
        reason: "transport_failure",
      })
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("aborts a stalled call after five seconds without retries and clears the timer", async () => {
    fixture.enabled = true;
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener(
            "abort",
            () => reject(Error("private abort detail")),
            { once: true }
          );
        })
    );
    const result = notifyOwner(payload);
    await vi.advanceTimersByTimeAsync(OWNER_NOTIFICATION_TIMEOUT_MS - 1);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBe(false);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      JSON.stringify({
        event: "owner_notification_failed",
        reason: "timeout",
      })
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("clears the deadline after acceptance and safely handles body-cancel rejection", async () => {
    fixture.enabled = true;
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: true,
      body: { cancel: vi.fn().mockRejectedValue(Error("private")) },
    });
    expect(await notifyOwner(payload)).toBe(true);
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
    expect(warning).not.toHaveBeenCalled();
  });
  it("the real Node HTTP transport releases a stalled loopback fixture on abort", async () => {
    fixture.enabled = true;
    let hits = 0;
    let releasePeer: () => void;
    const peerClosed = new Promise<void>(resolve => {
      releasePeer = resolve;
    });
    const server = createServer((_request, response) => {
      hits++;
      response.once("close", () => releasePeer());
      // Intentionally never return response headers. No real provider is used.
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw Error("fixture_address_invalid");
    fetchMock.mockImplementation((_configuredUrl, options) =>
      nativeFetch(`http://127.0.0.1:${address.port}/fixture`, options)
    );
    try {
      expect(await notifyOwner(payload)).toBe(false);
      expect(hits).toBe(1);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
      let cleanupDeadline: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          peerClosed,
          new Promise((_, reject) => {
            cleanupDeadline = setTimeout(
              () => reject(Error("fixture_peer_not_released")),
              2000
            );
          }),
        ]);
      } finally {
        clearTimeout(cleanupDeadline);
      }
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning).toHaveBeenCalledWith(
        JSON.stringify({
          event: "owner_notification_failed",
          reason: "timeout",
        })
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
