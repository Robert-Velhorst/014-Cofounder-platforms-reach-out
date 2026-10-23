import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { passkeyFixture } from "./test-fixtures/passkey";
import { resetConfigForTests } from "./config";
import {
  adminRegistrationOptions,
  adminAuthenticationOptions,
  verifyAdminRegistration,
  verifyAdminAuthentication,
} from "./admin-webauthn";

describe("administrator passkey cryptographic boundary", () => {
  let fixture: ReturnType<typeof passkeyFixture>;
  beforeEach(() => {
    fixture = passkeyFixture();
    vi.stubEnv("PUBLIC_ORIGIN", fixture.origin);
    resetConfigForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetConfigForTests();
  });
  const failed = {
    code: "BAD_REQUEST",
    message: "Passkey verification failed. Start again.",
  };
  function registration(response: unknown = fixture.registration()) {
    return verifyAdminRegistration({ response, challenge: fixture.challenge });
  }
  function authentication(
    response: unknown = fixture.authentication(),
    counter = 0
  ) {
    return verifyAdminAuthentication({
      response,
      challenge: fixture.challenge,
      credential: { id: fixture.id, publicKey: fixture.publicKey, counter },
      userHandle: fixture.userHandle,
    });
  }
  it("generates unique challenges bound to the configured origin with mandatory user verification", async () => {
    const options = await adminRegistrationOptions({
      userHandle: fixture.userHandle,
      userName: "admin@example.invalid",
      credentialIds: [fixture.id],
    });
    expect(options.rp).toEqual({
      name: "CoFounder Outreach",
      id: fixture.rpID,
    });
    expect(options.user.id).toBe(fixture.userHandle);
    expect(options.authenticatorSelection?.userVerification).toBe("required");
    expect(options.attestation).toBe("none");
    expect(options.excludeCredentials).toContainEqual({
      id: fixture.id,
      type: "public-key",
    });
    const auth = await adminAuthenticationOptions([fixture.id]);
    expect(auth.rpId).toBe(fixture.rpID);
    expect(auth.userVerification).toBe("required");
    expect(auth.allowCredentials).toContainEqual({
      id: fixture.id,
      type: "public-key",
    });
    expect(auth.challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(auth.challenge).not.toBe(options.challenge);
  });
  it("accepts real registration bytes and verifies a real signature with the extracted public key", async () => {
    const enrolled = await registration();
    expect(enrolled.id).toBe(fixture.id);
    expect(Buffer.from(enrolled.publicKey)).toEqual(
      Buffer.from(fixture.publicKey)
    );
    expect(enrolled.counter).toBe(0);
    const verified = await verifyAdminAuthentication({
      response: fixture.authentication(),
      challenge: fixture.challenge,
      credential: enrolled,
      userHandle: fixture.userHandle,
    });
    expect(verified.counter).toBe(1);
  });
  it.each([
    ["absent user verification", { flags: 0x41 }],
    ["absent user presence", { flags: 0x44 }],
    ["wrong origin", { origin: "https://attacker.example.invalid" }],
    ["wrong relying party", { rpID: "attacker.example.invalid" }],
    ["wrong challenge", { challenge: "x".repeat(43) }],
    [
      "cross-origin embedding",
      { crossOrigin: true, topOrigin: "https://attacker.example.invalid" },
    ],
  ])("rejects registration with %s", async (_name, options) => {
    await expect(
      registration(fixture.registration(options))
    ).rejects.toMatchObject(failed);
  });
  it.each([
    ["absent user verification", { flags: 1 }],
    ["absent user presence", { flags: 4 }],
    ["wrong origin", { origin: "https://attacker.example.invalid" }],
    ["wrong relying party", { rpID: "attacker.example.invalid" }],
    ["wrong challenge", { challenge: "x".repeat(43) }],
    ["different account handle", { userHandle: "x".repeat(43) }],
    [
      "cross-origin embedding",
      { crossOrigin: true, topOrigin: "https://attacker.example.invalid" },
    ],
  ])("rejects assertion with %s", async (_name, options) => {
    await expect(
      authentication(fixture.authentication(options))
    ).rejects.toMatchObject(failed);
  });
  it("rejects a signature from another authenticator", async () => {
    const foreign = passkeyFixture().authentication({
      challenge: fixture.challenge,
      userHandle: fixture.userHandle,
    });
    foreign.id = fixture.id;
    foreign.rawId = fixture.id;
    await expect(authentication(foreign)).rejects.toMatchObject(failed);
  });
  it("rejects equal or lower nonzero counters", async () => {
    await expect(
      authentication(fixture.authentication({ counter: 1 }), 1)
    ).rejects.toMatchObject(failed);
    await expect(
      authentication(fixture.authentication({ counter: 1 }), 2)
    ).rejects.toMatchObject(failed);
  });
  it("supports counterless authenticators without inventing replay protection", async () => {
    await expect(
      authentication(fixture.authentication({ counter: 0 }))
    ).resolves.toMatchObject({ counter: 0 });
  });
  it("allows an omitted handle only with the expected credential and a valid signature", async () => {
    await expect(
      authentication(fixture.authentication({ userHandle: null }))
    ).resolves.toMatchObject({ counter: 1 });
  });
  it("rejects a mismatching raw credential ID", async () => {
    const response = fixture.authentication();
    response.rawId = "x".repeat(43);
    await expect(authentication(response)).rejects.toMatchObject(failed);
  });
  it.each([
    null,
    {},
    { id: "a".repeat(100000) },
    { response: { clientDataJSON: "private-malformed-token" } },
  ])(
    "returns only a bounded safe failure for malformed responses",
    async response => {
      await expect(registration(response)).rejects.toMatchObject(failed);
      await expect(authentication(response)).rejects.toMatchObject(failed);
    }
  );
  it.each(["", "http://public.example.invalid"])(
    "fails closed without a secure configured origin: %s",
    async origin => {
      vi.stubEnv("PUBLIC_ORIGIN", origin);
      resetConfigForTests();
      await expect(
        adminAuthenticationOptions([fixture.id])
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    }
  );
  it("does not offer discoverable login when no administrator credential is enrolled", async () => {
    await expect(adminAuthenticationOptions([])).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });
  it("verifies the offered RS256 algorithm using a real RSA signature", async () => {
    fixture = passkeyFixture("RS256");
    const enrolled = await registration();
    await expect(
      verifyAdminAuthentication({
        response: fixture.authentication(),
        challenge: fixture.challenge,
        credential: enrolled,
        userHandle: fixture.userHandle,
      })
    ).resolves.toMatchObject({ counter: 1 });
  });
  it("rejects even valid packed attestation rather than entering unused certificate trust paths", async () => {
    await expect(
      registration(fixture.registration({ packed: true }))
    ).rejects.toMatchObject(failed);
  });
  it("does not make external requests during successful registration or assertion verification", async () => {
    vi.stubGlobal("fetch", () => {
      throw new Error("unexpected_external_request");
    });
    await expect(registration()).resolves.toMatchObject({ id: fixture.id });
    await expect(authentication()).resolves.toMatchObject({ counter: 1 });
  });
  it("rejects an outer registration ID that differs from attested credential data", async () => {
    const response = fixture.registration();
    response.id = passkeyFixture().id;
    response.rawId = response.id;
    await expect(registration(response)).rejects.toMatchObject(failed);
  });
  it("rejects a padded noncanonical raw ID", async () => {
    const response = fixture.authentication();
    response.rawId += "=";
    response.id += "=";
    await expect(authentication(response)).rejects.toMatchObject(failed);
  });
  it("rejects an authenticator response that claims an unregistered ID even when signed by the expected key", async () => {
    const response = fixture.authentication();
    response.id = passkeyFixture().id;
    response.rawId = response.id;
    await expect(authentication(response)).rejects.toMatchObject(failed);
  });
  it("supports secure localhost development without accepting public HTTP origins", async () => {
    vi.stubEnv("PUBLIC_ORIGIN", "http://localhost:3014");
    resetConfigForTests();
    expect((await adminAuthenticationOptions([fixture.id])).rpId).toBe(
      "localhost"
    );
  });
});
