import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { eq, sql } from "drizzle-orm";
import { users, auditEvents } from "../drizzle/schema";
import { getDb, setVerificationToken, verifyEmailToken } from "./db";
import { inspectEmailVerificationEvidence } from "./email-verification-evidence";
import { issueBudgetedVerificationToken } from "./account-mail-budget";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

let accountId = 0;
let token = "";
let email = "";
const api = () =>
  appRouter.createCaller({
    user: null,
    req: {},
    res: {},
    requestId: randomUUID(),
  } as TrpcContext);
beforeEach(async () => {
  const db = await getDb();
  if (!db) throw new Error("Disposable database required");
  email = `evidence-${randomUUID()}@example.invalid`;
  const [owner] = await db
    .insert(users)
    .values({ openId: randomUUID(), email, emailVerified: 0 })
    .$returningId();
  accountId = owner.id;
  token = randomBytes(32).toString("base64url");
  await setVerificationToken(accountId, token, new Date(Date.now() + 60000));
});
afterEach(async () => {
  const db = (await getDb())!;
  if (accountId) {
    await db.delete(auditEvents).where(eq(auditEvents.userId, accountId));
    await db.delete(users).where(eq(users.id, accountId));
  }
  accountId = 0;
});
describe("email token redemption evidence with MySQL", () => {
  it("binds budgeted production issuance and refuses a changed recipient", async () => {
    const issued = await issueBudgetedVerificationToken(accountId, email);
    const db = (await getDb())!;
    const [issuedOwner] = await db
      .select()
      .from(users)
      .where(eq(users.id, accountId));
    expect(issuedOwner.verificationEmailDigest).toMatch(/^[a-f0-9]{64}$/);
    await db
      .update(users)
      .set({ email: `new-recipient-${randomUUID()}@example.invalid` })
      .where(eq(users.id, accountId));
    expect(await verifyEmailToken(issued)).toBeNull();
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId))
    ).toHaveLength(0);
  });
  it("does not backfill or consume old unbound links or reset existing verified flags", async () => {
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ verificationEmailDigest: null, emailVerified: 1 })
      .where(eq(users.id, accountId));
    const before = await db.select().from(users).where(eq(users.id, accountId));
    expect(await verifyEmailToken(token)).toBeNull();
    expect(
      await db.select().from(users).where(eq(users.id, accountId))
    ).toEqual(before);
  });
  it("keeps earlier unbound version-one receipts distinguishable from bound redemption evidence", async () => {
    await verifyEmailToken(token);
    const db = (await getDb())!;
    const [record] = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, accountId));
    const { issuanceAddressBound: _bound, ...metadata } = record.metadata!;
    await db
      .update(auditEvents)
      .set({ metadata: { ...metadata, version: 1 } })
      .where(eq(auditEvents.id, record.id));
    expect(await inspectEmailVerificationEvidence(accountId)).toMatchObject({
      evidenceStatus: "unbound_current_email_redemption",
      needsOperatorReview: true,
    });
  });
  it("does not transfer an outstanding verification token to a changed email address", async () => {
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ email: `changed-before-${randomUUID()}@example.invalid` })
      .where(eq(users.id, accountId));
    expect(await verifyEmailToken(token)).toBeNull();
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, accountId));
    expect(owner.emailVerified).toBe(0);
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId))
    ).toHaveLength(0);
  });
  it("does not attribute another account's receipt to this account", async () => {
    const db = (await getDb())!;
    const [other] = await db
      .insert(users)
      .values({
        openId: randomUUID(),
        email: `other-${randomUUID()}@example.invalid`,
      })
      .$returningId();
    try {
      await db.insert(auditEvents).values({
        userId: other.id,
        requestId: randomUUID(),
        action: "auth.email_token_redeemed",
        entityType: "account",
        entityId: String(accountId),
        outcome: "success",
        metadata: { privateMarker: "foreign audit content" },
      });
      const result = await inspectEmailVerificationEvidence(accountId);
      expect(result.evidenceStatus).toBe("missing");
      expect(JSON.stringify(result)).not.toContain("foreign audit content");
    } finally {
      await db.delete(auditEvents).where(eq(auditEvents.userId, other.id));
      await db.delete(users).where(eq(users.id, other.id));
    }
  });
  it("runs the compiled operator inspection without printing private audit material or writing records", async () => {
    await verifyEmailToken(token);
    const db = (await getDb())!;
    const before = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, accountId));
    const result = await promisify(execFile)(
      process.execPath,
      [
        resolve("dist/inspect-email-verification.js"),
        "--read-only",
        "--account-id",
        String(accountId),
      ],
      { timeout: 10000 }
    );
    expect(JSON.parse(result.stdout)).toMatchObject({
      mode: "read-only",
      accountId,
      evidenceStatus: "current_email_redemption",
      reVerificationAuthorized: false,
    });
    expect(result.stdout + result.stderr).not.toContain(email);
    expect(result.stdout + result.stderr).not.toContain(token);
    expect(result.stdout).not.toContain("emailDigest");
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId))
    ).toEqual(before);
  });
  it("reports absent evidence without asserting legacy origin or modifying a verified account", async () => {
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ emailVerified: 1 })
      .where(eq(users.id, accountId));
    const before = await db.select().from(users).where(eq(users.id, accountId));
    const result = await inspectEmailVerificationEvidence(accountId);
    expect(result).toMatchObject({
      verifiedFlag: true,
      evidenceStatus: "missing",
      needsOperatorReview: true,
      reVerificationAuthorized: false,
    });
    expect(result.warning).toContain("cannot distinguish");
    expect(
      await db.select().from(users).where(eq(users.id, accountId))
    ).toEqual(before);
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId))
    ).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain(email);
    expect(JSON.stringify(result)).not.toContain(token);
  });
  it("atomically consumes a token once and records one private receipt under concurrent redemption", async () => {
    const results = await Promise.allSettled([
      api().auth.verifyEmail({ token }),
      api().auth.verifyEmail({ token }),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    const db = (await getDb())!;
    const rows = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, accountId));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: "auth.email_token_redeemed",
      entityId: String(accountId),
      outcome: "success",
    });
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(JSON.stringify(rows)).not.toContain(email);
    expect(await inspectEmailVerificationEvidence(accountId)).toMatchObject({
      verifiedFlag: true,
      evidenceStatus: "current_email_redemption",
      needsOperatorReview: false,
      reVerificationAuthorized: false,
    });
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, accountId));
    expect(owner.verificationToken).toBeNull();
    expect(owner.verificationEmailDigest).toBeNull();
    expect(owner.verificationTokenExpiry).toBeNull();
  });
  it("rolls back verification and token consumption if its audit receipt cannot commit", async () => {
    const db = (await getDb())!;
    const constraint = `evidence_${randomUUID().replaceAll("-", "")}`;
    await db.execute(
      sql.raw(
        `ALTER TABLE audit_events ADD CONSTRAINT ${constraint} CHECK (action <> 'auth.email_token_redeemed')`
      )
    );
    try {
      await expect(api().auth.verifyEmail({ token })).rejects.toThrow();
      const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.id, accountId));
      expect(owner.emailVerified).toBe(0);
      expect(owner.verificationToken).not.toBeNull();
      expect(
        await db
          .select()
          .from(auditEvents)
          .where(eq(auditEvents.userId, accountId))
      ).toHaveLength(0);
    } finally {
      await db.execute(
        sql.raw(`ALTER TABLE audit_events DROP CHECK ${constraint}`)
      );
    }
    await expect(api().auth.verifyEmail({ token })).resolves.toMatchObject({
      success: true,
    });
  });
  it("does not apply old-address or malformed audit evidence to the current address", async () => {
    await verifyEmailToken(token);
    const db = (await getDb())!;
    await db
      .update(users)
      .set({ email: `changed-${randomUUID()}@example.invalid` })
      .where(eq(users.id, accountId));
    expect(await inspectEmailVerificationEvidence(accountId)).toMatchObject({
      evidenceStatus: "different_email_redemption",
      needsOperatorReview: true,
    });
    await db
      .update(auditEvents)
      .set({ metadata: { version: 99, privatePayload: "not returned" } })
      .where(eq(auditEvents.userId, accountId));
    const result = await inspectEmailVerificationEvidence(accountId);
    expect(result.evidenceStatus).toBe("invalid_record");
    expect(JSON.stringify(result)).not.toContain("privatePayload");
  });
  it("refuses expired, fenced and missing-address accounts without a receipt", async () => {
    const db = (await getDb())!;
    await setVerificationToken(accountId, token, new Date(Date.now() - 60000));
    expect(await verifyEmailToken(token)).toBeNull();
    await setVerificationToken(accountId, token, new Date(Date.now() + 60000));
    await db
      .update(users)
      .set({ deletionFencedAt: new Date() })
      .where(eq(users.id, accountId));
    expect(await verifyEmailToken(token)).toBeNull();
    await db
      .update(users)
      .set({ deletionFencedAt: null, email: null })
      .where(eq(users.id, accountId));
    expect(await verifyEmailToken(token)).toBeNull();
    expect(
      await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, accountId))
    ).toHaveLength(0);
  });
  it("rejects malformed token and protected fields before consuming any token", async () => {
    await expect(
      api().auth.verifyEmail({ token: "x".repeat(10000) })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api().auth.verifyEmail({ token, emailVerified: 1 } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await verifyEmailToken("not-a-token")).toBeNull();
    expect(await inspectEmailVerificationEvidence(accountId)).toMatchObject({
      evidenceStatus: "missing",
      verifiedFlag: false,
    });
  });
});
