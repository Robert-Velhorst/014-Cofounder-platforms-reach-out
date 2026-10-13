import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { eq } from "drizzle-orm";
import {
  accountExportQuotas,
  accountDeletionRequests,
  accountMailJobs,
  accountSessions,
  auditEvents,
  idempotencyRecords,
  matches,
  outreachRecords,
  prospects,
  userProfiles,
  users,
  type User,
} from "../drizzle/schema";
import * as data from "./db";
import {
  createAccountSession,
  isAccountSessionActive,
} from "./account-sessions";
import { completePasswordReset } from "./password-recovery";
import { issueBudgetedVerificationToken } from "./account-mail-budget";
import {
  processNextAccountMail,
  queuePasswordChanged,
} from "./account-mail-queue";
import { resetConfigForTests } from "./config";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as fences from "./account-work-fence";
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from "mysql2/promise";

async function waitForAccountLockWait(observer: Connection) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const [rows] = await observer.query<RowDataPacket[]>(
      "SHOW FULL PROCESSLIST"
    );
    if (
      rows.some(
        row =>
          typeof row.Info === "string" &&
          row.Info.includes("from `users`") &&
          row.Info.includes("for update")
      )
    )
      return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error("account_query_never_reached_held_lock");
}

let owner: User;
let candidateId: number;
let draftId: number;
const caller = () =>
  appRouter.createCaller({
    user: owner,
    requestId: randomUUID(),
    req: {},
    res: {},
  } as TrpcContext);
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const resetToken = "synthetic-reset-token";
const verifyToken = "synthetic-verify-token";
async function processingCommand(args: string[]) {
  const child = spawn(
    process.execPath,
    ["dist/process-account-deletion.js", ...args],
    {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 12000,
    }
  );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", data => (stdout += data.toString()));
  child.stderr.on("data", data => (stderr += data.toString()));
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  return { code, stdout, stderr, report: () => JSON.parse(stdout) };
}
const fence = async () =>
  (await data.getDb())!
    .update(users)
    .set({ deletionFencedAt: new Date() })
    .where(eq(users.id, owner.id));

describe("durable account work fence with isolated MySQL", () => {
  async function approval() {
    const requestKey = randomUUID();
    await (await data.getDb())!.insert(accountDeletionRequests).values({
      userId: owner.id,
      status: "pending_review",
      requestKey,
      revision: 1,
      requestedAt: new Date(),
      attemptWindowExpiresAt: new Date(),
    });
    return {
      expectedEmail: owner.email!,
      requestKey,
      expectedRevision: 1,
      operatorRef: "operator-42",
      approvalRef: "review-42",
      confirmSuspend: true as const,
    };
  }
  it("executes the compiled operator check and reviewed suspension without leaking email or erasing data", async () => {
    const review = await approval();
    const target = [
      "--account-id",
      String(owner.id),
      "--expected-email",
      owner.email!,
      "--request-key",
      review.requestKey,
      "--expected-revision",
      "1",
    ];
    const checked = await processingCommand(["--check", ...target]);
    expect(checked.code, checked.stderr).toBe(0);
    expect(checked.report()).toMatchObject({
      mode: "read-only",
      accountFenced: false,
      deletionAuthorized: false,
    });
    expect(checked.stdout + checked.stderr).not.toContain(owner.email);
    const args = [
      "--suspend",
      ...target,
      "--operator-ref",
      review.operatorRef,
      "--approval-ref",
      review.approvalRef,
      "--confirm-suspend-account",
    ];
    const suspended = await processingCommand(args);
    expect(suspended.code, suspended.stderr).toBe(0);
    expect(suspended.report()).toMatchObject({
      mode: "suspend",
      accountFenced: true,
      dataErased: false,
      alreadyStarted: false,
    });
    expect(suspended.stdout + suspended.stderr).not.toContain(owner.email);
    expect(await data.getAllProspects(owner.id)).toHaveLength(1);
    const repeated = await processingCommand(args);
    expect(repeated.code, repeated.stderr).toBe(0);
    expect(repeated.report()).toMatchObject({
      alreadyStarted: true,
      fencedAt: suspended.report().fencedAt,
    });
  });
  it("refuses suspension of an account already fenced without the matching reviewed receipt", async () => {
    const review = await approval();
    await fence();
    await expect(
      fences.beginReviewedDeletionProcessing({
        userId: owner.id,
        credentialHash: owner.passwordHash!,
        requestId: randomUUID(),
        approval: review,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await data.getAllProspects(owner.id)).toHaveLength(1);
  });
  it("starts reviewed processing exactly once, revokes access and preserves customer records", async () => {
    const review = await approval();
    const input = {
      userId: owner.id,
      credentialHash: owner.passwordHash!,
      requestId: randomUUID(),
      approval: review,
    };
    await createAccountSession(
      owner.openId,
      owner.passwordHash!,
      "synthetic-reviewed-session",
      new Date(Date.now() + 60000)
    );
    const results = await Promise.all([
      fences.beginReviewedDeletionProcessing(input),
      fences.beginReviewedDeletionProcessing(input),
    ]);
    expect(results[0].fencedAt).toEqual(results[1].fencedAt);
    expect(results.map(r => r.alreadyStarted).sort()).toEqual([false, true]);
    expect(
      await isAccountSessionActive(owner.id, "synthetic-reviewed-session")
    ).toBe(false);
    expect(await data.getAllProspects(owner.id)).toHaveLength(1);
    expect(await data.getOutreachRecord(draftId, owner.id)).not.toBeNull();
    const events = await (await data.getDb())!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, owner.id));
    const receipts = events.filter(
      e => e.action === "account.deletion.processing_started"
    );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].metadata).toMatchObject({
      revision: 1,
      operatorRef: review.operatorRef,
      approvalRef: review.approvalRef,
    });
    expect(JSON.stringify(receipts)).not.toContain(owner.email);
  });
  it("refuses stale, withdrawn, mismatched or unconfirmed processing reviews without changing account access", async () => {
    const review = await approval();
    const input = {
      userId: owner.id,
      credentialHash: owner.passwordHash!,
      requestId: randomUUID(),
      approval: review,
    };
    for (const changes of [
      { expectedRevision: 2 },
      { requestKey: randomUUID() },
      { expectedEmail: "other@example.invalid" },
      { confirmSuspend: false },
    ])
      await expect(
        fences.beginReviewedDeletionProcessing({
          ...input,
          approval: { ...review, ...changes },
        } as any)
      ).rejects.toBeDefined();
    await (await data.getDb())!
      .update(accountDeletionRequests)
      .set({ status: "withdrawn", revision: 2, withdrawnAt: new Date() })
      .where(eq(accountDeletionRequests.userId, owner.id));
    await expect(
      fences.beginReviewedDeletionProcessing(input)
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await data.getUserById(owner.id))!.deletionFencedAt).toBeNull();
    expect((await data.getUserById(owner.id))!.passwordResetToken).toBe(
      digest(resetToken)
    );
  });
  it("rolls back suspension and token revocation if its processing audit cannot commit", async () => {
    const review = await approval();
    await expect(
      fences.beginReviewedDeletionProcessing({
        userId: owner.id,
        credentialHash: owner.passwordHash!,
        requestId: "x".repeat(1000),
        approval: review,
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect((await data.getUserById(owner.id))!.deletionFencedAt).toBeNull();
    expect((await data.getUserById(owner.id))!.passwordResetToken).toBe(
      digest(resetToken)
    );
  });
  beforeEach(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (url.hostname !== "127.0.0.1" || url.pathname !== "/cofounder_test")
      throw new Error("isolated_database_required");
    vi.stubEnv(
      "AUTH_MAIL_ENCRYPTION_SECRET",
      "synthetic-fence-secret-with-more-than-32-characters"
    );
    vi.stubEnv("RESEND_API_KEY", "synthetic-key");
    vi.stubEnv("AUTH_EMAIL_FROM", "accounts@example.invalid");
    vi.stubEnv("PUBLIC_ORIGIN", "https://example.invalid");
    resetConfigForTests();
    // Any unexpected transport is intercepted; never send mail from this suite.
    vi.stubGlobal("fetch", async () => {
      throw new Error("unexpected_mail_transport");
    });
    const db = (await data.getDb())!;
    const [created] = await db
      .insert(users)
      .values({
        openId: `work-fence-${randomUUID()}`,
        email: `${randomUUID()}@example.invalid`,
        passwordHash: "synthetic-credential-hash",
        emailVerified: 1,
        passwordResetToken: digest(resetToken),
        passwordResetTokenExpiry: new Date(Date.now() + 600_000),
        verificationToken: digest(verifyToken),
        verificationTokenExpiry: new Date(Date.now() + 600_000),
      })
      .$returningId();
    owner = (await data.getUserById(created.id))!;
    const [candidate] = await db
      .insert(prospects)
      .values({
        userId: owner.id,
        name: "Synthetic candidate",
        platform: "manual",
        consentStatus: "opted_in",
      })
      .$returningId();
    candidateId = candidate.id;
    await data.createOrUpdateProfile(owner.id, {
      location: "Original location",
    });
    const draft = await caller().criticalPath.outreach.draft({
      prospectId: candidateId,
      body: "Original human-written introduction.",
      declaration: { humanOriginal: true, rulesReviewed: true },
      idempotencyKey: randomUUID(),
    });
    draftId = draft.outreach.id;
  });
  afterEach(async () => {
    const db = (await data.getDb())!;
    if (owner) {
      for (const table of [
        auditEvents,
        idempotencyRecords,
        accountMailJobs,
        outreachRecords,
        matches,
        prospects,
        userProfiles,
      ])
        await db.delete(table).where(eq(table.userId, owner.id));
      await db.delete(users).where(eq(users.id, owner.id));
    }
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    resetConfigForTests();
  });

  it("refuses new sessions despite an unchanged password hash", async () => {
    await fence();
    await expect(
      createAccountSession(
        owner.openId,
        owner.passwordHash!,
        randomUUID(),
        new Date(Date.now() + 60_000)
      )
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("rejects an otherwise live session if its account is fenced", async () => {
    const token = randomUUID();
    await createAccountSession(
      owner.openId,
      owner.passwordHash!,
      token,
      new Date(Date.now() + 60_000)
    );
    await fence();
    expect(await isAccountSessionActive(owner.id, token)).toBe(false);
  });
  it("does not save a profile through an already authenticated context", async () => {
    const stale = caller();
    await fence();
    await expect(
      stale.profile.update({ location: "Must not persist" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getUserProfile(owner.id)).toMatchObject({
      location: "Original location",
    });
  });
  it("waits for the owner lock and refuses a stale verified write after flag loss commits", async () => {
    const stale = caller();
    const blocker = await createConnection(process.env.DATABASE_URL!);
    let pending: Promise<{ code: string }> | undefined;
    let settled = false;
    try {
      await blocker.beginTransaction();
      await blocker.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [
        owner.id,
      ]);
      await blocker.execute("UPDATE users SET emailVerified = 0 WHERE id = ?", [
        owner.id,
      ]);
      pending = stale.profile
        .update({ location: "Must not persist behind reset" })
        .then(
          () => ({ code: "unexpected_write" }),
          error => ({ code: error.code })
        )
        .finally(() => {
          settled = true;
        });
      await waitForAccountLockWait(blocker);
      expect(settled).toBe(false);
      await blocker.commit();
      expect(await pending).toEqual({ code: "FORBIDDEN" });
      expect(await data.getUserProfile(owner.id)).toMatchObject({
        location: "Original location",
      });
    } finally {
      await blocker.rollback();
      await blocker.end();
      if (pending) await pending;
    }
  }, 20000);
  it("blocks candidate admission inside its transaction", async () => {
    await fence();
    await expect(
      data.createProspect({ userId: owner.id, name: "Blocked candidate" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getAllProspects(owner.id)).toHaveLength(1);
  });
  it("blocks qualification before creating a match", async () => {
    await fence();
    await expect(
      caller().criticalPath.qualify({
        prospectId: candidateId,
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getUserMatches(owner.id)).toHaveLength(0);
  });
  it("blocks a previously reviewed candidate archive", async () => {
    const input = { id: candidateId, accountId: owner.id };
    const details = await caller().criticalPath.prospects.details(input);
    await fence();
    await expect(
      caller().criticalPath.prospects.archive({
        ...input,
        expectedRevision: details.revision,
        confirmed: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getProspectById(candidateId, owner.id)).toMatchObject({
      archivedAt: null,
    });
  });
  it("blocks opt-out writes after the fence", async () => {
    await fence();
    await expect(
      caller().criticalPath.prospects.optOut({
        id: candidateId,
        accountId: owner.id,
        confirmed: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getProspectById(candidateId, owner.id)).toMatchObject({
      consentStatus: "opted_in",
    });
  });
  it("blocks draft creation from a stale authenticated request", async () => {
    await fence();
    await expect(
      caller().criticalPath.outreach.draft({
        prospectId: candidateId,
        body: "Must not persist",
        declaration: { humanOriginal: true, rulesReviewed: true },
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks outreach transitions after the fence", async () => {
    await fence();
    await expect(
      caller().criticalPath.outreach.submitReview({ id: draftId })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getOutreachRecord(draftId, owner.id)).toMatchObject({
      state: "draft",
    });
  });
  it("blocks a previously reviewed draft cancellation", async () => {
    const input = { id: draftId, accountId: owner.id };
    const details = await caller().criticalPath.outreach.details(input);
    await fence();
    await expect(
      caller().criticalPath.outreach.cancel({
        ...input,
        expectedRevision: details.revision,
        notSent: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getOutreachRecord(draftId, owner.id)).toMatchObject({
      state: "draft",
    });
  });
  it("refuses a still-valid recovery token", async () => {
    await fence();
    await expect(
      completePasswordReset(resetToken, "ReplacementPassword42")
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await data.getUserById(owner.id)).toMatchObject({
      passwordHash: owner.passwordHash,
    });
  });
  it("blocks a reviewed candidate intake", async () => {
    const input = {
      accountId: owner.id,
      candidate: {
        name: "New person",
        platform: "manual",
        consentStatus: "unknown" as const,
      },
      declaration: {
        collectionMethod: "direct_from_person" as const,
        rightsConfirmed: true as const,
        evidenceReference: "meeting-001",
      },
    };
    const preview = await caller().criticalPath.prospects.previewIntake(input);
    await fence();
    await expect(
      caller().criticalPath.prospects.add({
        ...input,
        reviewToken: preview.reviewToken,
        resolution: { kind: "create_new", distinctPersonConfirmed: true },
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks CSV import before inserting candidates", async () => {
    await fence();
    await expect(
      caller().criticalPath.prospects.importCsv({
        accountId: owner.id,
        csv: "name,platform\nNew person,manual",
        idempotencyKey: randomUUID(),
        declaration: {
          collectionMethod: "direct_from_person",
          rightsConfirmed: true,
          evidenceReference: "meeting-001",
        },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getAllProspects(owner.id)).toHaveLength(1);
  });
  it("blocks candidate exports before writing a download audit", async () => {
    await fence();
    await expect(
      caller().criticalPath.prospects.exportCsv({ accountId: owner.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks account export before password attempts are charged", async () => {
    await fence();
    await expect(
      caller().accountData.export({
        accountId: owner.id,
        password: "unused",
        confirmation: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await (await data.getDb())!
        .select()
        .from(accountExportQuotas)
        .where(eq(accountExportQuotas.userId, owner.id))
    ).toHaveLength(0);
  });
  it("blocks conversation changes reviewed before the fence", async () => {
    await (await data.getDb())!
      .update(outreachRecords)
      .set({ state: "confirmed_sent", confirmedSentAt: new Date() })
      .where(eq(outreachRecords.id, draftId));
    const input = { id: draftId, accountId: owner.id };
    const detail = await caller().criticalPath.outreach.details(input);
    await fence();
    await expect(
      caller().criticalPath.outreach.conversation({
        ...input,
        expectedRevision: detail.revision,
        action: "close",
        confirmed: true,
        idempotencyKey: randomUUID(),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("refuses a still-valid verification token", async () => {
    await fence();
    expect(await data.verifyEmailToken(verifyToken)).toBeNull();
  });
  it("refuses verification-token issuance before reserving mail capacity", async () => {
    await fence();
    await expect(
      issueBudgetedVerificationToken(owner.id, owner.email!)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await data.getUserById(owner.id)).toMatchObject({
      verificationToken: digest(verifyToken),
    });
  });
  it("discards queued account mail without attempting transport", async () => {
    const db = (await data.getDb())!;
    await db.transaction(tx =>
      queuePasswordChanged(tx, { id: owner.id, email: owner.email! })
    );
    await fence();
    expect(await processNextAccountMail()).toBe("discarded");
    const [job] = await db
      .select()
      .from(accountMailJobs)
      .where(eq(accountMailJobs.userId, owner.id));
    expect(job).toMatchObject({
      state: "discarded",
      attempts: 0,
      payload: null,
    });
  });
  it("atomically establishes a retry-stable fence and revokes sessions and recovery links", async () => {
    await (await data.getDb())!
      .update(users)
      .set({ verificationEmailDigest: digest("synthetic-bound-address") })
      .where(eq(users.id, owner.id));
    const token = randomUUID();
    await createAccountSession(
      owner.openId,
      owner.passwordHash!,
      token,
      new Date(Date.now() + 60_000)
    );
    const result = await fences.fenceAccountForDeletion({
      userId: owner.id,
      credentialHash: owner.passwordHash!,
    });
    expect(result).toEqual({
      fencedAt: expect.any(Date),
      deletionAuthorized: false,
    });
    expect(await data.getUserById(owner.id)).toMatchObject({
      deletionFencedAt: result.fencedAt,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      verificationToken: null,
      verificationTokenExpiry: null,
      verificationEmailDigest: null,
    });
    expect(
      await (await data.getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, owner.id))
    ).toHaveLength(0);
    expect(
      await fences.fenceAccountForDeletion({
        userId: owner.id,
        credentialHash: owner.passwordHash!,
      })
    ).toEqual(result);
    expect(await data.getUserProfile(owner.id)).toMatchObject({
      location: "Original location",
    });
    expect(await data.getOutreachRecord(draftId, owner.id)).toMatchObject({
      body: "Original human-written introduction.",
    });
  });
  it("refuses to fence the account after its authenticated credentials changed", async () => {
    await expect(
      fences.fenceAccountForDeletion({
        userId: owner.id,
        credentialHash: "outdated-hash",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(await data.getUserById(owner.id)).toMatchObject({
      deletionFencedAt: null,
      passwordResetToken: digest(resetToken),
    });
  });
  it("rolls back the fence if session invalidation fails", async () => {
    const db = (await data.getDb())!,
      run = db.transaction.bind(db);
    const token = randomUUID();
    await createAccountSession(
      owner.openId,
      owner.passwordHash!,
      token,
      new Date(Date.now() + 60_000)
    );
    const interception = vi
      .spyOn(db, "transaction")
      .mockImplementation((callback, config) =>
        run(async tx => {
          const remove = tx.delete.bind(tx);
          vi.spyOn(tx, "delete").mockImplementation(table => {
            if (table === accountSessions)
              throw new Error("synthetic_session_delete_failure");
            return remove(table);
          });
          return callback(tx);
        }, config)
      );
    try {
      await expect(
        fences.fenceAccountForDeletion({
          userId: owner.id,
          credentialHash: owner.passwordHash!,
        })
      ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    } finally {
      interception.mockRestore();
    }
    expect(await data.getUserById(owner.id)).toMatchObject({
      deletionFencedAt: null,
      passwordResetToken: digest(resetToken),
    });
    expect(await isAccountSessionActive(owner.id, token)).toBe(true);
  });
  it.each(["profile", "session"] as const)(
    "rechecks the fence after a %s request waits for the account lock",
    async kind => {
      const blocker = await createConnection(process.env.DATABASE_URL!);
      let pending: Promise<unknown> | undefined;
      try {
        await blocker.beginTransaction();
        await blocker.execute(
          "UPDATE users SET deletion_fenced_at = CURRENT_TIMESTAMP WHERE id = ?",
          [owner.id]
        );
        const request =
          kind === "profile"
            ? caller().profile.update({ location: "Must not persist" })
            : createAccountSession(
                owner.openId,
                owner.passwordHash!,
                randomUUID(),
                new Date(Date.now() + 60_000)
              );
        pending = request.then(
          () => ({ wronglyAllowed: true }),
          error => ({ code: error.code })
        );
        await waitForAccountLockWait(blocker);
        await blocker.commit();
        expect(await pending).toEqual({
          code: kind === "profile" ? "FORBIDDEN" : "UNAUTHORIZED",
        });
        expect(await data.getUserProfile(owner.id)).toMatchObject({
          location: "Original location",
        });
      } finally {
        await blocker.rollback();
        await blocker.end();
        await pending;
      }
    }
  );
  it("waits for earlier owner work to commit before fencing, without erasing it", async () => {
    const writer = await createConnection(process.env.DATABASE_URL!);
    let pending: ReturnType<typeof fences.fenceAccountForDeletion> | undefined;
    try {
      await writer.beginTransaction();
      await writer.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [
        owner.id,
      ]);
      await writer.execute(
        "UPDATE user_profiles SET location = 'Earlier committed work' WHERE user_id = ?",
        [owner.id]
      );
      pending = fences.fenceAccountForDeletion({
        userId: owner.id,
        credentialHash: owner.passwordHash!,
      });
      await waitForAccountLockWait(writer);
      await writer.commit();
      expect(await pending).toMatchObject({
        deletionAuthorized: false,
        fencedAt: expect.any(Date),
      });
      expect(await data.getUserProfile(owner.id)).toMatchObject({
        location: "Earlier committed work",
      });
    } finally {
      await writer.rollback();
      await writer.end();
      await pending;
    }
  });
  it("rechecks the fence when export generation begins after admission", async () => {
    const db = (await data.getDb())!,
      run = db.transaction.bind(db);
    const interception = vi
      .spyOn(db, "transaction")
      .mockImplementation(async (callback, config) => {
        if (config?.isolationLevel === "repeatable read") await fence();
        return run(callback, config);
      });
    try {
      await expect(
        caller().accountData.export({
          accountId: owner.id,
          password: "unused",
          confirmation: true,
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Account work is suspended pending deletion review.",
      });
    } finally {
      interception.mockRestore();
    }
  });
});
