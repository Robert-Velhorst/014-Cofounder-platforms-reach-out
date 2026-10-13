import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

export type SecurityPhase = "idle" | "preparing" | "prompt" | "saving";
type Enrollment = { password: string; grant?: string; label: string };
export type SecurityApi = {
  account: () => Promise<{
    id: number;
    role: string;
    emailVerified: number;
  } | null>;
  beginEnrollment: (input: {
    accountId: number;
    password: string;
    grant?: string;
  }) => Promise<{
    challengeId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
  }>;
  finishEnrollment: (input: {
    accountId: number;
    challengeId: string;
    response: unknown;
    label: string;
  }) => Promise<{ keyId: string }>;
  beginStepUp: (input: { accountId: number }) => Promise<{
    challengeId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  }>;
  finishStepUp: (input: {
    accountId: number;
    challengeId: string;
    response: unknown;
  }) => Promise<{ elevatedUntil: string }>;
  removePasskey: (input: {
    accountId: number;
    password: string;
    keyId: string;
  }) => Promise<{ removed: true }>;
};
type Browser = {
  register: (
    options: PublicKeyCredentialCreationOptionsJSON
  ) => Promise<RegistrationResponseJSON>;
  authenticate: (
    options: PublicKeyCredentialRequestOptionsJSON
  ) => Promise<AuthenticationResponseJSON>;
  cancel: () => void;
};
class FlowError extends Error {
  constructor(readonly code: "CANCELLED" | "ACCOUNT_CHANGED" | "BUSY") {
    super(code);
  }
}

/** A page-scoped lifecycle, not an authorization boundary. The server still
 * checks cookie/account/session ownership and every factor mutation. */
export function createAdminSecurityFlow({
  accountId,
  api,
  browser,
  onPhase,
}: {
  accountId: number;
  api: SecurityApi;
  browser: Browser;
  onPhase: (phase: SecurityPhase) => void;
}) {
  let generation = 0,
    disposed = false,
    phase: SecurityPhase = "idle";
  const setPhase = (next: SecurityPhase) => {
    phase = next;
    if (!disposed) onPhase(next);
  };
  const current = (epoch: number) => {
    if (disposed || epoch !== generation) throw new FlowError("CANCELLED");
  };
  const account = async (epoch: number) => {
    current(epoch);
    const owner = await api.account();
    current(epoch);
    if (
      !owner ||
      owner.id !== accountId ||
      owner.role !== "admin" ||
      owner.emailVerified !== 1
    )
      throw new FlowError("ACCOUNT_CHANGED");
  };
  async function run<T>(operation: (epoch: number) => Promise<T>): Promise<T> {
    if (disposed) throw new FlowError("CANCELLED");
    if (phase !== "idle") throw new FlowError("BUSY");
    const epoch = ++generation;
    setPhase("preparing");
    try {
      await account(epoch);
      const result = await operation(epoch);
      current(epoch);
      return result;
    } finally {
      if (!disposed && epoch === generation) setPhase("idle");
    }
  }
  return {
    get phase() {
      return phase;
    },
    enroll(input: Enrollment) {
      return run(async epoch => {
        const { label, ...credentials } = input;
        const start = await api.beginEnrollment({ accountId, ...credentials });
        await account(epoch);
        setPhase("prompt");
        const response = await browser.register(start.options);
        await account(epoch);
        setPhase("saving");
        return api.finishEnrollment({
          accountId,
          challengeId: start.challengeId,
          response,
          label,
        });
      });
    },
    verify() {
      return run(async epoch => {
        const start = await api.beginStepUp({ accountId });
        await account(epoch);
        setPhase("prompt");
        const response = await browser.authenticate(start.options);
        await account(epoch);
        setPhase("saving");
        return api.finishStepUp({
          accountId,
          challengeId: start.challengeId,
          response,
        });
      });
    },
    remove(input: { keyId: string; password: string }) {
      return run(async epoch => {
        current(epoch);
        setPhase("saving");
        return api.removePasskey({ accountId, ...input });
      });
    },
    cancel() {
      if (phase === "idle" || phase === "saving") return false;
      generation++;
      browser.cancel();
      setPhase("idle");
      return true;
    },
    dispose() {
      disposed = true;
      generation++;
      browser.cancel();
    },
  };
}

export function adminSecurityError(error: unknown): string {
  const value = error as {
    code?: string;
    name?: string;
    data?: { code?: string };
  } | null;
  if (value?.code === "ACCOUNT_CHANGED")
    return "Your account changed or is no longer a verified administrator. Reload this page.";
  if (value?.code === "CANCELLED" || value?.name === "AbortError")
    return "Verification cancelled. No new proof was submitted.";
  if (value?.code === "BUSY")
    return "Another security action is still running.";
  if (value?.name === "NotAllowedError")
    return "The device prompt was cancelled or timed out. Try again when ready.";
  if (value?.name === "InvalidStateError")
    return "That passkey may already be registered. Try a different authenticator.";
  if (value?.data?.code === "TOO_MANY_REQUESTS")
    return "Too many security attempts. Wait for the 15-minute limit window to reset before trying again.";
  if (value?.data?.code === "FORBIDDEN" || value?.data?.code === "UNAUTHORIZED")
    return "Your session, password, enrollment approval or verification is no longer valid. Refresh and verify again.";
  return "The security action could not be confirmed. Refresh the status before trying again.";
}
