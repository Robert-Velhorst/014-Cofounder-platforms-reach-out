import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { eq, sql } from "drizzle-orm";
import {
  users,
  accountSessions,
  auditEvents,
  adminPasskeys,
  prospects,
  outreachRecords,
  userProfiles,
} from "../drizzle/schema";
import { getDb, setVerificationToken, verifyEmailToken } from "./db";
import * as data from "./db";
import { createOrUpdateProfile } from "./db";
import { changeCandidate } from "./candidate-mutations";
import { recordCandidateOptOut } from "./candidate-workspace";
import { addReviewedCandidate } from "./candidate-intake";
import { changeOutreachDraft } from "./outreach-revision";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  requireAccountReverification,
  reviewAccountReverification,
} from "./account-reverification";

let accountId = 0,
  email = "";
const target = () => ({ accountId, expectedEmail: email });
async function approval() {
  const review = await reviewAccountReverification(target());
  return {
    ...target(),
    reviewDigest: review.reviewDigest,
    reviewedAt: review.reviewedAt,
    operationId: randomUUID(),
    operatorRef: "synthetic-operator",
    approvalRef: "synthetic-approval",
    confirmRequireVerification: true as const,
    confirmMailRecoveryReady: true as const,
    confirmAdminAccessLoss: false,
  };
}
const owner = async () =>
  (
    await (await getDb())!.select().from(users).where(eq(users.id, accountId))
  )[0];
beforeEach(async () => {
  email = `reverification-${randomUUID()}@example.invalid`;
  const db = (await getDb())!;
  if (!db) throw new Error("Disposable database required");
  const [row] = await db
    .insert(users)
    .values({
      openId: randomUUID(),
      email,
      emailVerified: 1,
      name: "Preserved workspace owner",
      passwordHash: "synthetic-unchanged-credential",
      linkedinAccessToken: "synthetic-preserved-connected-account",
      passwordResetToken: randomBytes(32).toString("hex"),
      passwordResetTokenExpiry: new Date(Date.now() + 60000),
    })
    .$returningId();
  accountId = row.id;
  await setVerificationToken(
    accountId,
    randomBytes(32).toString("base64url"),
    new Date(Date.now() + 60000)
  );
  await db.insert(accountSessions).values({
    userId: accountId,
    tokenDigest: randomBytes(32).toString("hex"),
    expiresAt: new Date(Date.now() + 60000),
  });
});
afterEach(async () => {
  const db = (await getDb())!;
  if (accountId) {
    await db.delete(userProfiles).where(eq(userProfiles.userId, accountId));
    await db.delete(auditEvents).where(eq(auditEvents.userId, accountId));
    await db
      .delete(outreachRecords)
      .where(eq(outreachRecords.userId, accountId));
    await db.delete(prospects).where(eq(prospects.userId, accountId));
    await db.delete(users).where(eq(users.id, accountId));
  }
  accountId = 0;
});
describe("reviewed single-account re-verification with MySQL", () => {
  it.each([
    "create candidate",
    "qualify candidate",
    "create outreach record",
    "create draft",
    "transition draft",
    "CSV import",
    "edit candidate",
    "opt out candidate",
    "reviewed candidate intake",
    "cancel draft",
  ])(
    "refuses %s under the owner lock after reviewed re-verification",
    async operation => {
      const db = (await getDb())!;
      const [candidate] = await db
        .insert(prospects)
        .values({
          userId: accountId,
          name: "Preserved candidate",
          platform: "manual",
          consentStatus: "opted_in",
        })
        .$returningId();
      const [draft] = await db
        .insert(outreachRecords)
        .values({
          userId: accountId,
          prospectId: candidate.id,
          body: "Preserved draft",
          idempotencyKey: randomUUID(),
        })
        .$returningId();
      const approved = await approval();
      await requireAccountReverification(approved);
      const beforeCandidates = await db
        .select()
        .from(prospects)
        .where(eq(prospects.userId, accountId));
      const beforeDrafts = await db
        .select()
        .from(outreachRecords)
        .where(eq(outreachRecords.userId, accountId));
      const beforeAudit = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId));
      const requestId = randomUUID(),
        key = randomUUID(),
        review = "a".repeat(64);
      const declaration = {
        collectionMethod: "direct_from_person" as const,
        rightsConfirmed: true as const,
        evidenceReference: "synthetic-reviewed-source",
      };
      const commands: Record<string, () => Promise<unknown>> = {
        "create candidate": () =>
          data.createProspect({ userId: accountId, name: "Must not persist" }),
        "qualify candidate": () =>
          data.qualifyProspect({
            userId: accountId,
            accountId,
            prospectId: candidate.id,
            requestId,
            idempotencyKey: key,
          }),
        "create outreach record": () =>
          data.createOutreachRecord({
            userId: accountId,
            prospectId: candidate.id,
            body: "Must not persist",
            idempotencyKey: key,
          }),
        "create draft": () =>
          data.createOutreachDraft(
            {
              userId: accountId,
              prospectId: candidate.id,
              body: "Must not persist",
              idempotencyKey: key,
              requestId,
            },
            () => {
              throw new Error(
                "Authorization callback must not run after verification loss"
              );
            }
          ),
        "transition draft": () =>
          data.transitionOutreachRecord(
            {
              id: draft.id,
              userId: accountId,
              requestId,
              to: "pending_review",
            },
            () => {
              throw new Error(
                "Authorization callback must not run after verification loss"
              );
            }
          ),
        "CSV import": () =>
          data.importProspectsCsv({
            userId: accountId,
            accountId,
            requestId,
            idempotencyKey: key,
            csv: "name,platform\nMust not persist,manual",
            declaration,
          }),
        "edit candidate": () =>
          changeCandidate({
            id: candidate.id,
            userId: accountId,
            accountId,
            requestId,
            expectedRevision: review,
            action: "edit",
            patch: { bio: "Must not persist" },
          }),
        "opt out candidate": () =>
          recordCandidateOptOut({
            id: candidate.id,
            userId: accountId,
            accountId,
            requestId,
            confirmed: true,
          }),
        "reviewed candidate intake": () =>
          addReviewedCandidate(
            {
              accountId,
              candidate: {
                name: "Must not persist",
                platform: "manual",
                consentStatus: "unknown",
              },
              declaration,
              reviewToken: review,
              resolution: { kind: "create_new", distinctPersonConfirmed: true },
              idempotencyKey: key,
            },
            accountId,
            requestId
          ),
        "cancel draft": () =>
          changeOutreachDraft(
            {
              id: draft.id,
              userId: accountId,
              accountId,
              requestId,
              expectedRevision: review,
              notSent: true,
            },
            "cancel"
          ),
      };
      await expect(commands[operation]()).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Verify the current account before changing the workspace.",
      });
      expect(
        await db.select().from(prospects).where(eq(prospects.userId, accountId))
      ).toEqual(beforeCandidates);
      expect(
        await db
          .select()
          .from(outreachRecords)
          .where(eq(outreachRecords.userId, accountId))
      ).toEqual(beforeDrafts);
      expect(
        await db
          .select()
          .from(auditEvents)
          .where(eq(auditEvents.userId, accountId))
      ).toEqual(beforeAudit);
    }
  );
  it("refuses a profile write from an already admitted verified request after application", async () => {
    await createOrUpdateProfile(accountId, { bio: "Original private profile" });
    const stale = appRouter.createCaller({
      user: await owner(),
      req: {},
      res: {},
      requestId: randomUUID(),
    } as TrpcContext);
    const approved = await approval();
    await requireAccountReverification(approved);
    await expect(
      stale.profile.update({ bio: "Must not persist after reset" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await (await getDb())!
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, accountId))
    ).toMatchObject([{ bio: "Original private profile" }]);
  });
  it("applies and retries the compiled operator command for one reviewed fixture", async () => {
    const approved = await approval();
    const args = [
      "dist/require-account-reverification.js",
      "--apply",
      "--account-id",
      String(accountId),
      "--expected-email",
      email,
      "--operation-id",
      approved.operationId,
      "--review-digest",
      approved.reviewDigest,
      "--reviewed-at",
      approved.reviewedAt,
      "--operator-ref",
      approved.operatorRef,
      "--approval-ref",
      approved.approvalRef,
      "--confirm-require-verification",
      "--confirm-mail-recovery-ready",
    ];
    for (const alreadyApplied of [false, true]) {
      const { stdout } = await promisify(execFile)(process.execPath, args);
      expect(JSON.parse(stdout)).toMatchObject({
        applied: true,
        alreadyApplied,
        mailSent: false,
      });
      expect(stdout).not.toContain(email);
    }
  });
  it("is read-only and exposes no identity, credential, token or private snapshot", async () => {
    const before = await owner();
    const result = await reviewAccountReverification(target());
    expect(result).toMatchObject({
      eligible: true,
      applied: false,
      mailSent: false,
      sessionRecordCount: 1,
    });
    expect(JSON.stringify(result)).not.toMatch(
      /example.invalid|synthetic-unchanged|synthetic-preserved|verificationToken|passwordResetToken/
    );
    expect(await owner()).toEqual(before);
  });
  it("atomically revokes links/sessions and preserves unrelated account fields", async () => {
    const db = (await getDb())!;
    const [candidate] = await db
      .insert(prospects)
      .values({
        userId: accountId,
        name: "Synthetic preserved candidate",
        bio: "Private supplied biography",
      })
      .$returningId();
    await db.insert(outreachRecords).values({
      userId: accountId,
      prospectId: candidate.id,
      body: "Preserved individualized draft",
      idempotencyKey: randomUUID(),
    });
    const candidatesBefore = await db
      .select()
      .from(prospects)
      .where(eq(prospects.userId, accountId));
    const draftsBefore = await db
      .select()
      .from(outreachRecords)
      .where(eq(outreachRecords.userId, accountId));
    const before = await owner(),
      approved = await approval();
    expect(await requireAccountReverification(approved)).toMatchObject({
      alreadyApplied: false,
      currentVerifiedFlag: false,
      mailSent: false,
    });
    const after = await owner();
    expect(after).toMatchObject({
      emailVerified: 0,
      verificationToken: null,
      verificationTokenExpiry: null,
      verificationEmailDigest: null,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    });
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      if (
        ![
          "updatedAt",
          "emailVerified",
          "verificationToken",
          "verificationTokenExpiry",
          "verificationEmailDigest",
          "passwordResetToken",
          "passwordResetTokenExpiry",
        ].includes(key)
      )
        expect(after[key]).toEqual(before[key]);
    }
    expect(
      await db.select().from(prospects).where(eq(prospects.userId, accountId))
    ).toEqual(candidatesBefore);
    expect(
      await db
        .select()
        .from(outreachRecords)
        .where(eq(outreachRecords.userId, accountId))
    ).toEqual(draftsBefore);
    expect(
      await db
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, accountId))
    ).toHaveLength(0);
    const receipts = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, accountId));
    expect(receipts).toHaveLength(1);
    expect(JSON.stringify(receipts)).not.toContain(email);
  });
  it("concurrent exact retries commit one receipt", async () => {
    const approved = await approval();
    const results = await Promise.all([
      requireAccountReverification(approved),
      requireAccountReverification(approved),
    ]);
    expect(results.map(r => r.alreadyApplied).sort()).toEqual([false, true]);
    expect(
      await (await getDb())!
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId))
    ).toHaveLength(1);
  });
  it("receipt retry never resets a subsequently re-verified account", async () => {
    const approved = await approval();
    await requireAccountReverification(approved);
    const token = randomBytes(32).toString("base64url");
    await setVerificationToken(accountId, token, new Date(Date.now() + 60000));
    expect(await verifyEmailToken(token)).toMatchObject({ emailVerified: 1 });
    expect(await requireAccountReverification(approved)).toMatchObject({
      alreadyApplied: true,
      currentVerifiedFlag: true,
    });
    expect((await owner()).emailVerified).toBe(1);
  });
  it("rejects altered approval references on a used operation", async () => {
    const approved = await approval();
    await requireAccountReverification(approved);
    await expect(
      requireAccountReverification({ ...approved, approvalRef: "different" })
    ).rejects.toThrow("operation_conflict");
  });
  it.each(["account", "session", "audit"])(
    "rejects a stale %s review without mutation",
    async changed => {
      const approved = await approval(),
        db = (await getDb())!;
      if (changed === "account")
        await db
          .update(users)
          .set({ name: "Changed after review" })
          .where(eq(users.id, accountId));
      if (changed === "session")
        await db.insert(accountSessions).values({
          userId: accountId,
          tokenDigest: randomBytes(32).toString("hex"),
          expiresAt: new Date(Date.now() + 60000),
        });
      if (changed === "audit")
        await db.insert(auditEvents).values({
          userId: accountId,
          requestId: randomUUID(),
          action: "synthetic.review.changed",
          outcome: "success",
        });
      const before = await owner();
      await expect(requireAccountReverification(approved)).rejects.toThrow(
        "review_stale"
      );
      expect(await owner()).toEqual(before);
    }
  );
  it("refuses expired/future reviews, wrong identity, missing confirmations and suspended/unverified targets", async () => {
    const approved = await approval();
    for (const reviewedAt of [
      new Date(Date.now() - 600001).toISOString(),
      new Date(Date.now() + 60000).toISOString(),
    ]) {
      await expect(
        requireAccountReverification({ ...approved, reviewedAt })
      ).rejects.toThrow("review_stale");
    }
    await expect(
      requireAccountReverification({
        ...approved,
        expectedEmail: "wrong@example.invalid",
      })
    ).rejects.toThrow("target_ineligible");
    await expect(
      requireAccountReverification({
        ...approved,
        confirmRequireVerification: false as true,
      })
    ).rejects.toThrow();
    await expect(
      requireAccountReverification({
        ...approved,
        confirmMailRecoveryReady: false as true,
      })
    ).rejects.toThrow();
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ deletionFencedAt: new Date() })
      .where(eq(users.id, accountId));
    expect((await reviewAccountReverification(target())).eligible).toBe(false);
    await expect(requireAccountReverification(approved)).rejects.toThrow(
      "target_ineligible"
    );
    await db
      .update(users)
      .set({ deletionFencedAt: null, emailVerified: 0 })
      .where(eq(users.id, accountId));
    expect((await reviewAccountReverification(target())).eligible).toBe(false);
    await expect(requireAccountReverification(approved)).rejects.toThrow(
      "target_ineligible"
    );
  });
  it("requires admin access-loss acknowledgement and preserves passkeys", async () => {
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, accountId));
    await db.insert(adminPasskeys).values({
      keyId: randomUUID(),
      credentialDigest: randomBytes(32).toString("hex"),
      userId: accountId,
      credentialId: "synthetic-credential-id",
      publicKey: "synthetic-public-key",
      label: "Synthetic retained key",
      deviceType: "singleDevice",
      backedUp: false,
    });
    const keys = await db
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, accountId)),
      approved = await approval();
    await expect(requireAccountReverification(approved)).rejects.toThrow(
      "admin_acknowledgement_required"
    );
    await requireAccountReverification({
      ...approved,
      confirmAdminAccessLoss: true,
    });
    expect(
      await db
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, accountId))
    ).toEqual(keys);
  });
  it("audit failure rolls back the flag, links and session revocation", async () => {
    const db = (await getDb())!,
      approved = await approval(),
      before = await owner();
    const constraint = `synthetic_reverify_${randomBytes(6).toString("hex")}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE audit_events ADD CONSTRAINT ${constraint} CHECK (action <> 'account.reverification.required')`
      )
    );
    try {
      await expect(requireAccountReverification(approved)).rejects.toThrow();
      expect(await owner()).toEqual(before);
      expect(
        await db
          .select()
          .from(accountSessions)
          .where(eq(accountSessions.userId, accountId))
      ).toHaveLength(1);
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE audit_events DROP CHECK ${constraint}`)
      );
    }
    await requireAccountReverification(approved);
  });
  it("compiled operator check is read-only; missing apply confirmation fails without secrets", async () => {
    const before = await owner();
    const { stdout } = await promisify(execFile)(process.execPath, [
      "dist/require-account-reverification.js",
      "--check",
      "--account-id",
      String(accountId),
      "--expected-email",
      email,
    ]);
    expect(JSON.parse(stdout)).toMatchObject({
      applied: false,
      eligible: true,
    });
    expect(stdout).not.toContain(email);
    expect(await owner()).toEqual(before);
    try {
      await promisify(execFile)(process.execPath, [
        "dist/require-account-reverification.js",
        "--apply",
        "--account-id",
        String(accountId),
        "--expected-email",
        email,
      ]);
      throw new Error("Command unexpectedly succeeded");
    } catch (error) {
      expect((error as { stdout: string }).stdout).toContain('"applied":false');
      expect((error as { stdout: string }).stdout).not.toContain(email);
    }
    expect(await owner()).toEqual(before);
  });
});
