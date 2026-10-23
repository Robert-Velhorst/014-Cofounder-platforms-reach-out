import { afterEach, describe, expect, it, vi } from "vitest";
import { sendVerification } from "./account-mail";
import { resetConfigForTests } from "./config";
import * as mailBudget from "./account-mail-budget";

describe("verification email transport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetConfigForTests();
  });

  function configured() {
    vi.stubEnv("RESEND_API_KEY", "private-test-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://cofounder.example.invalid");
    resetConfigForTests();
    vi.spyOn(mailBudget, "issueBudgetedVerificationToken").mockResolvedValue(
      "a".repeat(43)
    );
  }

  it("refuses to simulate delivery when mail is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    resetConfigForTests();
    await expect(
      sendVerification({ id: 1, email: "test@example.invalid" })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("requires a provider acknowledgement rather than accepting any successful HTTP response", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 }))
    );
    await expect(
      sendVerification({ id: 1, email: "test@example.invalid" })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("reports a network failure without leaking request details", async () => {
    configured();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("private-test-key and private-token");
      })
    );
    await expect(
      sendVerification({ id: 1, email: "test@example.invalid" })
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Verification email could not be confirmed. Please try sending a new link.",
    });
  });

  it("sends the verification secret only in the email link fragment", async () => {
    configured();
    let sent: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        expect(url).toBe("https://api.resend.com/emails");
        sent = JSON.parse(String(init.body));
        return new Response('{"id":"test-acknowledgement"}', { status: 200 });
      })
    );
    const result = await sendVerification({
      id: 1,
      email: "test@example.invalid",
    });
    expect(result).toEqual({
      success: true,
      status: "accepted_by_email_provider",
    });
    expect(sent).toMatchObject({
      from: "accounts@example.invalid",
      to: ["test@example.invalid"],
    });
    const link = String(sent!.text).match(/https:\/\/\S+/)![0];
    const url = new URL(link);
    expect(url.origin).toBe("https://cofounder.example.invalid");
    expect(url.search).toBe("");
    expect(url.hash).toMatch(/^#token=[A-Za-z0-9_-]{43}$/);
  });
});
