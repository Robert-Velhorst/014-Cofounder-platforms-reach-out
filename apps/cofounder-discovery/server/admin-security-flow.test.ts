import { describe, expect, it, vi } from "vitest";

async function fixture() {
  const path = "../client/src/lib/admin-security-flow";
  const module = await import(path).catch(() => null);
  expect(module?.createAdminSecurityFlow).toBeTypeOf("function");
  const calls: string[] = [];
  const api = {
    account: async () => ({ id: 7, role: "admin", emailVerified: 1 }),
    beginEnrollment: async (input: unknown) => {
      calls.push("begin-enroll");
      expect(input).toEqual({
        accountId: 7,
        password: "password",
        grant: "grant",
      });
      return {
        challengeId: "registration",
        options: { challenge: "register" },
      };
    },
    finishEnrollment: async (input: unknown) => {
      calls.push("finish-enroll");
      expect(input).toEqual({
        accountId: 7,
        challengeId: "registration",
        response: { id: "created" },
        label: "My key",
      });
      return { keyId: "saved" };
    },
    beginStepUp: async (input: unknown) => {
      calls.push("begin-verify");
      expect(input).toEqual({ accountId: 7 });
      return { challengeId: "assertion", options: { challenge: "verify" } };
    },
    finishStepUp: async (input: unknown) => {
      calls.push("finish-verify");
      expect(input).toEqual({
        accountId: 7,
        challengeId: "assertion",
        response: { id: "asserted" },
      });
      return { elevatedUntil: "confirmed" };
    },
    removePasskey: async (input: unknown) => {
      calls.push("remove");
      expect(input).toEqual({
        accountId: 7,
        keyId: "backup",
        password: "password",
      });
      return { removed: true };
    },
  };
  const browser = {
    register: async (options: unknown) => {
      calls.push("register");
      expect(options).toEqual({ challenge: "register" });
      return { id: "created" };
    },
    authenticate: async (options: unknown) => {
      calls.push("authenticate");
      expect(options).toEqual({ challenge: "verify" });
      return { id: "asserted" };
    },
    cancel: vi.fn(),
  };
  const phases: string[] = [];
  const flow = module.createAdminSecurityFlow({
    accountId: 7,
    api,
    browser,
    onPhase: (phase: string) => phases.push(phase),
  });
  return { flow, api, browser, phases, calls, module };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("account-bound browser security orchestration", () => {
  it("sends only the enrolled account's challenge and authenticator response for registration", async () => {
    const { flow, calls } = await fixture();
    expect(
      await flow.enroll({
        password: "password",
        grant: "grant",
        label: "My key",
      })
    ).toEqual({ keyId: "saved" });
    expect(calls).toEqual(["begin-enroll", "register", "finish-enroll"]);
  });
  it("does not report verified until the server has committed verification", async () => {
    const { flow, api } = await fixture();
    const saving = deferred<{ elevatedUntil: string }>();
    api.finishStepUp = () => saving.promise;
    let complete = false;
    const run = flow.verify().then(() => {
      complete = true;
    });
    await vi.waitFor(() => expect(flow.phase).toBe("saving"));
    expect(complete).toBe(false);
    expect(flow.cancel()).toBe(false);
    saving.resolve({ elevatedUntil: "confirmed" });
    await run;
    expect(complete).toBe(true);
  });
  it("does not open a prompt when cancellation happens while requesting options", async () => {
    const { flow, api, calls } = await fixture();
    const pending = deferred<any>();
    api.beginStepUp = () => pending.promise;
    const run = flow.verify();
    await vi.waitFor(() => expect(flow.phase).toBe("preparing"));
    expect(flow.cancel()).toBe(true);
    pending.resolve({
      challengeId: "assertion",
      options: { challenge: "verify" },
    });
    await expect(run).rejects.toMatchObject({ code: "CANCELLED" });
    expect(calls).toEqual([]);
  });
  it("does not submit a response arriving after cancellation", async () => {
    const { flow, browser, calls } = await fixture();
    const prompt = deferred<any>();
    browser.authenticate = () => prompt.promise;
    const run = flow.verify();
    await vi.waitFor(() => expect(flow.phase).toBe("prompt"));
    flow.cancel();
    prompt.resolve({ id: "asserted" });
    await expect(run).rejects.toMatchObject({ code: "CANCELLED" });
    expect(calls).toEqual(["begin-verify"]);
  });
  it("rechecks account identity after the device prompt and rejects a changed account", async () => {
    const { flow, browser, api, calls } = await fixture();
    browser.authenticate = async () => {
      api.account = async () => ({ id: 8, role: "admin", emailVerified: 1 });
      return { id: "asserted" };
    };
    await expect(flow.verify()).rejects.toMatchObject({
      code: "ACCOUNT_CHANGED",
    });
    expect(calls).toEqual(["begin-verify"]);
  });
  it.each([
    null,
    { id: 7, role: "user", emailVerified: 1 },
    { id: 7, role: "admin", emailVerified: 0 },
  ])(
    "rejects missing or downgraded account before allocating a challenge: %j",
    async account => {
      const { flow, api, calls } = await fixture();
      api.account = async () => account as any;
      await expect(flow.verify()).rejects.toMatchObject({
        code: "ACCOUNT_CHANGED",
      });
      expect(calls).toEqual([]);
    }
  );
  it("does not send a completion after device rejection", async () => {
    const { flow, browser, calls } = await fixture();
    browser.authenticate = async () => {
      throw new DOMException("private device detail", "NotAllowedError");
    };
    await expect(flow.verify()).rejects.toMatchObject({
      name: "NotAllowedError",
    });
    expect(calls).toEqual(["begin-verify"]);
  });
  it("blocks concurrent actions and does not let an unmounted page finish a proof", async () => {
    const { flow, browser, calls } = await fixture();
    const prompt = deferred<any>();
    browser.authenticate = () => prompt.promise;
    const run = flow.verify();
    await vi.waitFor(() => expect(flow.phase).toBe("prompt"));
    await expect(flow.verify()).rejects.toMatchObject({ code: "BUSY" });
    flow.dispose();
    prompt.resolve({ id: "asserted" });
    await expect(run).rejects.toMatchObject({ code: "CANCELLED" });
    expect(calls).toEqual(["begin-verify"]);
  });
  it("requires current identity before sending password-confirmed removal", async () => {
    const { flow, calls } = await fixture();
    await flow.remove({ keyId: "backup", password: "password" });
    expect(calls).toEqual(["remove"]);
  });
  it("maps failures without echoing arbitrary device or server details", async () => {
    const { module } = await fixture();
    const output = module.adminSecurityError(
      new Error("sensitive raw response")
    );
    expect(output).not.toContain("sensitive");
    expect(output).toContain("again");
  });
});
