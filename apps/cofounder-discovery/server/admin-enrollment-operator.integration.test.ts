import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdtemp,
  chmod,
  readFile,
  stat,
  writeFile,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { getDb, createLocalUser } from "./db";
import {
  users,
  accountSessions,
  adminMfaState,
  adminPasskeys,
  auditEvents,
} from "../drizzle/schema";
import { hashPassword } from "./auth-password";
import { createAccountSession } from "./account-sessions";
import {
  beginAdminEnrollment,
  finishAdminEnrollment,
  issueInitialAdminEnrollmentGrant,
} from "./admin-mfa";
import { passkeyFixture } from "./test-fixtures/passkey";
import { resetConfigForTests } from "./config";

const origin = "https://cofounder.example.invalid";
const password = "Synthetic-Operator-Password!42";
async function command(args: string[], env: Record<string, string> = {}) {
  const child = spawn(process.execPath, ["dist/admin-enrollment.js", ...args], {
    env: { ...process.env, PUBLIC_ORIGIN: origin, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 12000,
  });
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

describe("operator initial administrator enrollment command", () => {
  let owner: number, email: string, credentialHash: string, folder: string;
  const base = () => [
    "--account-id",
    String(owner),
    "--expected-email",
    email,
    "--expected-origin",
    origin,
  ];
  const issue = (output = join(folder, "approval.admin-grant")) => [
    "--issue",
    ...base(),
    "--operator-ref",
    "operator-42",
    "--approval-ref",
    "review-2026-42",
    "--output",
    output,
    "--confirm-initial-enrollment",
  ];
  beforeEach(async () => {
    vi.stubEnv("PUBLIC_ORIGIN", origin);
    resetConfigForTests();
    const url = new URL(process.env.DATABASE_URL!);
    if (
      url.hostname !== "127.0.0.1" ||
      url.pathname !== "/cofounder_test" ||
      process.platform === "win32"
    )
      throw new Error("isolated_posix_database_required");
    folder = await mkdtemp(join(tmpdir(), "cofounder-operator-"));
    await chmod(folder, 0o700);
    email = `operator-${randomUUID()}@example.invalid`;
    credentialHash = await hashPassword(password);
    const user = await createLocalUser({
      openId: randomUUID(),
      email,
      name: "Synthetic operator target",
      passwordHash: credentialHash,
      emailVerified: 1,
      loginMethod: "local",
    });
    owner = user!.id;
    await (await getDb())!
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, owner));
  });
  afterEach(async () => {
    const db = (await getDb())!;
    await db.delete(auditEvents).where(eq(auditEvents.userId, owner));
    await db.delete(users).where(eq(users.id, owner));
    if (folder) await rm(folder, { recursive: true, force: true });
    vi.unstubAllEnvs();
    resetConfigForTests();
  });
  it("inspects eligibility without issuing a grant, creating security state or exposing personal data", async () => {
    const result = await command(["--check", ...base()]);
    expect(result.code, result.stderr).toBe(0);
    expect(result.report()).toMatchObject({
      mode: "check",
      accountId: owner,
      origin,
      eligible: true,
      reason: null,
      grantWritten: false,
    });
    expect(result.stdout).not.toContain(email);
    expect(result.stdout).not.toContain(credentialHash);
    expect(
      await (await getDb())!
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, owner))
    ).toHaveLength(0);
    expect(
      await (await getDb())!
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owner))
    ).toHaveLength(0);
  });
  async function enrolledTarget() {
    const user = (await getDb())!;
    const tokenId = randomUUID();
    const [account] = await user
      .select()
      .from(users)
      .where(eq(users.id, owner));
    await createAccountSession(
      account.openId,
      credentialHash,
      tokenId,
      new Date(Date.now() + 3600000)
    );
    const actor = {
      userId: owner,
      credentialHash,
      tokenId,
      requestId: randomUUID(),
    };
    const grant = await issueInitialAdminEnrollmentGrant(actor);
    const start = await beginAdminEnrollment(actor, {
      password,
      grant: grant.token,
    });
    const key = passkeyFixture();
    await finishAdminEnrollment(actor, {
      challengeId: start.challengeId,
      label: "Lost key",
      response: key.registration({ challenge: start.options.challenge }),
    });
  }
  const recover = (
    reviewDigest: string,
    output = join(folder, "replacement.admin-grant")
  ) => [
    "--recover",
    ...base(),
    "--operator-ref",
    "operator-42",
    "--approval-ref",
    "lost-factor-review-42",
    "--review-digest",
    reviewDigest,
    "--output",
    output,
    "--confirm-all-passkeys-lost",
  ];
  it("runs reviewed recovery through the compiled CLI with private secret output and token-free receipts", async () => {
    await enrolledTarget();
    const review = await command(["--recovery-check", ...base()]);
    expect(review.code, review.stderr).toBe(0);
    expect(review.report()).toMatchObject({
      eligible: true,
      passkeyCount: 1,
      grantWritten: false,
    });
    expect(review.stdout).not.toContain(email);
    const result = await command(recover(review.report().reviewDigest));
    expect(result.code, result.stderr).toBe(0);
    const path = join(folder, "replacement.admin-grant");
    const saved = JSON.parse(await readFile(path, "utf8"));
    expect(saved.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(result.stdout + result.stderr).not.toContain(saved.token);
    expect(result.report()).toMatchObject({
      mode: "recover",
      grantWritten: true,
    });
    expect(
      await (await getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, owner))
    ).toHaveLength(0);
    expect(
      await (await getDb())!
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, owner))
    ).toHaveLength(0);
    const replay = await command(
      recover(review.report().reviewDigest, join(folder, "replay.admin-grant"))
    );
    expect(replay.code).toBe(1);
    expect(replay.report().grantWritten).toBe(false);
  });
  it("refuses stale CLI review or unsafe recovery output without removing any keys or sessions", async () => {
    await enrolledTarget();
    const review = (await command(["--recovery-check", ...base()])).report();
    const path = join(folder, "replacement.admin-grant");
    await writeFile(path, "existing-data");
    expect((await command(recover(review.reviewDigest))).code).toBe(1);
    expect(await readFile(path, "utf8")).toBe("existing-data");
    const stale = await command(
      recover("0".repeat(64), join(folder, "stale.admin-grant"))
    );
    expect(stale.code).toBe(1);
    expect(stale.report().error).toBe("recovery_review_stale");
    expect(
      await (await getDb())!
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, owner))
    ).toHaveLength(1);
    expect(
      await (await getDb())!
        .select()
        .from(accountSessions)
        .where(eq(accountSessions.userId, owner))
    ).toHaveLength(1);
  });
  it("writes one private approval file and an audited digest without printing the token", async () => {
    const result = await command(issue());
    expect(result.code, result.stderr).toBe(0);
    const output = join(folder, "approval.admin-grant");
    const grant = JSON.parse(await readFile(output, "utf8"));
    expect(grant.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(grant).toMatchObject({
      accountId: owner,
      origin,
      requestId: result.report().requestId,
    });
    expect(result.report()).toMatchObject({
      mode: "issue",
      grantWritten: true,
      accountId: owner,
      expiresAt: grant.expiresAt,
    });
    expect((await stat(output)).mode & 0o777).toBe(0o600);
    expect(result.stdout + result.stderr).not.toContain(grant.token);
    expect(result.stdout + result.stderr).not.toContain(credentialHash);
    const [state] = await (await getDb())!
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner));
    expect(state.bootstrapDigest).toBe(
      createHash("sha256").update(grant.token).digest("hex")
    );
    const [audit] = await (await getDb())!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, owner));
    expect(audit).toMatchObject({
      action: "admin.mfa.bootstrap_approved",
      requestId: grant.requestId,
      metadata: {
        operatorRef: "operator-42",
        approvalRef: "review-2026-42",
        origin,
      },
    });
    expect(JSON.stringify(audit)).not.toContain(grant.token);
  });
  it("refuses another active approval rather than silently invalidating the first", async () => {
    expect((await command(issue())).code).toBe(0);
    const before = await (await getDb())!
      .select()
      .from(adminMfaState)
      .where(eq(adminMfaState.userId, owner));
    const second = await command(issue(join(folder, "second.admin-grant")));
    expect(second.code).toBe(1);
    expect(second.report().error).toBe("enrollment_approval_active");
    expect(
      await (await getDb())!
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, owner))
    ).toEqual(before);
    const check = await command(["--check", ...base()]);
    expect(check.report()).toMatchObject({
      eligible: false,
      reason: "approval_active",
    });
  });
  it("serializes simultaneous operator approvals so only one token is issued", async () => {
    const results = await Promise.all([
      command(issue(join(folder, "one.admin-grant"))),
      command(issue(join(folder, "two.admin-grant"))),
    ]);
    expect(results.map(r => r.code).sort()).toEqual([0, 1]);
    expect(results.find(r => r.code === 1)!.report().error).toBe(
      "enrollment_approval_active"
    );
    expect(
      await (await getDb())!
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.userId, owner))
    ).toHaveLength(1);
  });
  it.each(["email", "origin", "role", "verification", "fence"])(
    "refuses a mismatched or ineligible target: %s",
    async kind => {
      const db = (await getDb())!;
      if (kind === "email")
        await db
          .update(users)
          .set({ email: "changed@example.invalid" })
          .where(eq(users.id, owner));
      if (kind === "role")
        await db.update(users).set({ role: "user" }).where(eq(users.id, owner));
      if (kind === "verification")
        await db
          .update(users)
          .set({ emailVerified: 0 })
          .where(eq(users.id, owner));
      if (kind === "fence")
        await db
          .update(users)
          .set({ deletionFencedAt: new Date() })
          .where(eq(users.id, owner));
      const result = await command(
        issue(),
        kind === "origin"
          ? { PUBLIC_ORIGIN: "https://other.example.invalid" }
          : {}
      );
      expect(result.code).toBe(1);
      expect(result.report().grantWritten).toBe(false);
      expect(
        await db
          .select()
          .from(adminMfaState)
          .where(eq(adminMfaState.userId, owner))
      ).toHaveLength(0);
    }
  );
  it("refuses existing files and symlinks without changing their contents or issuing approval", async () => {
    const existing = join(folder, "existing.admin-grant"),
      link = join(folder, "link.admin-grant");
    await writeFile(existing, "preserve-me", { mode: 0o600 });
    await symlink(existing, link);
    for (const target of [existing, link]) {
      const result = await command(issue(target));
      expect(result.code).toBe(1);
      expect(result.report().error).toBe("enrollment_output_unsafe");
    }
    expect(await readFile(existing, "utf8")).toBe("preserve-me");
    expect(
      await (await getDb())!
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, owner))
    ).toHaveLength(0);
  });
  it("refuses a broadly readable output directory before issuing approval", async () => {
    await chmod(folder, 0o755);
    const result = await command(issue());
    expect(result.code).toBe(1);
    expect(result.report().error).toBe("enrollment_output_unsafe");
    expect(
      await (await getDb())!
        .select()
        .from(adminMfaState)
        .where(eq(adminMfaState.userId, owner))
    ).toHaveLength(0);
  });
  it("provides a usable grant but never resets an already enrolled administrator", async () => {
    expect((await command(issue())).code).toBe(0);
    const grant = JSON.parse(
      await readFile(join(folder, "approval.admin-grant"), "utf8")
    );
    const actor = {
      userId: owner,
      credentialHash,
      tokenId: randomUUID(),
      requestId: randomUUID(),
    };
    const [user] = await (await getDb())!
      .select()
      .from(users)
      .where(eq(users.id, owner));
    await createAccountSession(
      user.openId,
      credentialHash,
      actor.tokenId,
      new Date(Date.now() + 3600000)
    );
    // The fixture's origin must match the test process's configured origin too.
    const fixture = passkeyFixture();
    const start = await beginAdminEnrollment(actor, {
      password,
      grant: grant.token,
    });
    await finishAdminEnrollment(actor, {
      challengeId: start.challengeId,
      response: fixture.registration({ challenge: start.options.challenge }),
      label: "Operator-issued first key",
    });
    expect(
      await (await getDb())!
        .select()
        .from(adminPasskeys)
        .where(eq(adminPasskeys.userId, owner))
    ).toHaveLength(1);
    const result = await command(issue(join(folder, "forbidden.admin-grant")));
    expect(result.code).toBe(1);
    expect(result.report().error).toBe("enrollment_already_enrolled");
    expect((await command(["--check", ...base()])).report()).toMatchObject({
      eligible: false,
      reason: "already_enrolled",
    });
  });
});
