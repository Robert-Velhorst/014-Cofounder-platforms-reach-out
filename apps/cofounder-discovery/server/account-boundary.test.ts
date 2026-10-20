import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { resetConfigForTests } from "./config";
import { resetRateLimitsForTests } from "./rate-limit";
import type { TrpcContext } from "./_core/context";
import * as sessions from "./account-sessions";
import * as mailBudget from "./account-mail-budget";
import * as registrationAdmission from "./registration-admission";

describe("public account boundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetConfigForTests();
    resetRateLimitsForTests();
  });

  it("creates an unverified account until email ownership is proved", async () => {
    vi.stubEnv("ENABLE_REGISTRATION", "true");
    vi.stubEnv("JWT_SECRET", "test-account-session-secret-with-32-characters");
    resetConfigForTests();
    // Shared MySQL admission has real integration coverage; this test isolates
    // the account's unverified creation and session response boundary.
    vi.spyOn(
      registrationAdmission,
      "admitRegistrationAttempt"
    ).mockResolvedValue();
    vi.spyOn(db, "getUserByEmail").mockResolvedValue(undefined);
    vi.spyOn(sessions, "createAccountSession").mockResolvedValue();
    let created: unknown;
    vi.spyOn(db, "createLocalUser").mockImplementation(async input => {
      created = input;
      return { ...input, id: 42 } as Awaited<
        ReturnType<typeof db.createLocalUser>
      >;
    });
    const caller = appRouter.createCaller({
      user: null,
      req: { ip: "test", headers: {} },
      res: { cookie: vi.fn() },
      requestId: "test",
    } as unknown as TrpcContext);
    await caller.auth.register({
      name: "Founder",
      email: "test@example.invalid",
      password: "AccountTestPassword42",
    });
    expect(created).toMatchObject({ emailVerified: 0 });
  });

  it("does not expose a verification token in its response", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "http://localhost:3014");
    resetConfigForTests();
    vi.spyOn(mailBudget, "issueBudgetedVerificationToken").mockResolvedValue(
      "a".repeat(43)
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ id: "test-id" }), { status: 200 })
      )
    );
    const caller = appRouter.createCaller({
      user: { id: 42, email: "test@example.invalid", emailVerified: 0 },
      req: {},
      res: {},
      requestId: "test",
    } as unknown as TrpcContext);
    expect(await caller.auth.sendVerificationEmail()).not.toHaveProperty(
      "token"
    );
  });
  it("never returns password material, provider credentials or verification tokens", async () => {
    const user = {
      id: 42,
      name: "Founder",
      email: "founder@example.invalid",
      role: "user",
      openId: "local:private",
      passwordHash: "private-password-hash",
      verificationToken: "private-email-token",
      linkedinAccessToken: "private-linkedin-token",
      githubAccessToken: "private-github-token",
      futureSecret: "must-not-leak",
      emailVerified: 0,
      loginMethod: "local",
      createdAt: new Date(0),
      lastSignedIn: new Date(0),
    };
    const caller = appRouter.createCaller({
      user,
      req: {},
      res: {},
      requestId: "test",
    } as unknown as TrpcContext);
    const result = await caller.auth.me();
    expect(result).toEqual({
      id: 42,
      name: "Founder",
      email: "founder@example.invalid",
      role: "user",
      emailVerified: 0,
      loginMethod: "local",
      createdAt: new Date(0),
      lastSignedIn: new Date(0),
    });
  });

  it("returns null for an anonymous account query", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {},
      res: {},
      requestId: "test",
    } as unknown as TrpcContext);
    expect(await caller.auth.me()).toBeNull();
  });

  it("requires verified email before exposing the outreach workspace", async () => {
    const caller = appRouter.createCaller({
      user: { id: 42, emailVerified: 0 },
      req: {},
      res: {},
      requestId: "test",
    } as unknown as TrpcContext);
    await expect(caller.criticalPath.status()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("does not claim that a rejected email was sent", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "http://localhost:3014");
    resetConfigForTests();
    vi.spyOn(mailBudget, "issueBudgetedVerificationToken").mockResolvedValue(
      "a".repeat(43)
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("private provider error", { status: 403 }))
    );
    const caller = appRouter.createCaller({
      user: { id: 42, email: "test@example.invalid" },
      req: {},
      res: {},
      requestId: "test",
    } as unknown as TrpcContext);
    await expect(caller.auth.sendVerificationEmail()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
