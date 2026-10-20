import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type WebAuthnCredential,
} from "@simplewebauthn/server";
import { decodeAttestationObject } from "@simplewebauthn/server/helpers";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getConfig } from "./config";

// This module verifies cryptographic evidence, NOT authorization. Callers must
// consume a server-created, expiring challenge exactly once under a DB lock,
// bind it to the current account/session/purpose, and persist the new counter.
// None of these stateless functions alone grants an administrator session.
const binary = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/^[A-Za-z0-9_-]+$/)
    .refine(
      value => Buffer.from(value, "base64url").toString("base64url") === value
    );
const credentialID = binary(1400); // At most 1023 credential bytes, checked below.
const handle = binary(86).refine(
  value => Buffer.from(value, "base64url").length <= 64
);
const challengeValue = binary(43).refine(
  value => Buffer.from(value, "base64url").length === 32
);
const transports = z
  .array(
    z.enum(["ble", "cable", "hybrid", "internal", "nfc", "smart-card", "usb"])
  )
  .max(7);
const envelope = {
  id: credentialID,
  rawId: credentialID,
  type: z.literal("public-key"),
  authenticatorAttachment: z.enum(["platform", "cross-platform"]).optional(),
  // Extensions are not used for authorization; ignore browser-provided outputs.
  clientExtensionResults: z.object({}).default({}),
};
const registrationSchema = z.object({
  ...envelope,
  response: z.object({
    clientDataJSON: binary(4096),
    attestationObject: binary(32768),
    transports: transports.optional(),
  }),
});
const authenticationSchema = z.object({
  ...envelope,
  response: z.object({
    clientDataJSON: binary(4096),
    authenticatorData: binary(8192),
    signature: binary(8192),
    userHandle: handle.nullish(),
  }),
});

function relyingParty() {
  try {
    const configured = getConfig().PUBLIC_ORIGIN;
    if (!configured) throw new Error();
    const url = new URL(configured);
    if (
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && url.hostname === "localhost")
    )
      throw new Error();
    return { origin: url.origin, rpID: url.hostname };
  } catch {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Administrator passkeys require a configured HTTPS origin (or localhost for testing).",
    });
  }
}

function validIDs(ids: string[]) {
  return z
    .array(
      credentialID.refine(id => Buffer.from(id, "base64url").length <= 1023)
    )
    .max(5)
    .parse(ids);
}

export async function adminRegistrationOptions(input: {
  userHandle: string;
  userName: string;
  credentialIds: string[];
}) {
  const { rpID } = relyingParty();
  return generateRegistrationOptions({
    rpName: "CoFounder Outreach",
    rpID,
    userID: new Uint8Array(
      Buffer.from(handle.parse(input.userHandle), "base64url")
    ),
    userName: z.string().min(1).max(320).parse(input.userName),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
    supportedAlgorithmIDs: [-7, -257],
    timeout: 60000,
    excludeCredentials: validIDs(input.credentialIds).map(id => ({ id })),
  });
}

export async function adminAuthenticationOptions(credentialIds: string[]) {
  const { rpID } = relyingParty();
  if (!credentialIds.length)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No administrator passkey is enrolled.",
    });
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: validIDs(credentialIds).map(id => ({ id })),
    userVerification: "required",
    timeout: 60000,
  });
}

function firstPartyClientData(encoded: string) {
  const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  // Registration's upstream verifier does not enforce the embedding boundary.
  // This admin flow supports only top-level/same-origin ceremonies, never iframes
  // from another origin or an explicitly supplied topOrigin.
  if (
    !data ||
    typeof data !== "object" ||
    (data.crossOrigin !== undefined && data.crossOrigin !== false) ||
    data.topOrigin !== undefined
  )
    throw new Error();
}
function failed() {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: "Passkey verification failed. Start again.",
  });
}

export async function verifyAdminRegistration(input: {
  response: unknown;
  challenge: string;
}) {
  const { origin, rpID } = relyingParty();
  try {
    const response = registrationSchema.parse(input.response);
    validIDs([response.id]);
    firstPartyClientData(response.response.clientDataJSON);
    // This flow requests privacy-preserving none attestation. Do not enter
    // certificate/metadata trust paths or claim a hardware provenance guarantee.
    const attestation = decodeAttestationObject(
      new Uint8Array(
        Buffer.from(response.response.attestationObject, "base64url")
      )
    );
    if (
      attestation.get("fmt") !== "none" ||
      attestation.get("attStmt").size !== 0
    )
      throw new Error();
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeValue.parse(input.challenge),
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserPresence: true,
      requireUserVerification: true,
      supportedAlgorithmIDs: [-7, -257],
    });
    if (!result.verified || !result.registrationInfo.userVerified)
      throw new Error();
    const info = result.registrationInfo;
    // The outer browser ID must identify the credential inside attested data.
    if (info.credential.id !== response.id) throw new Error();
    return {
      ...info.credential,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
    };
  } catch {
    throw failed();
  }
}

export async function verifyAdminAuthentication(input: {
  response: unknown;
  challenge: string;
  credential: WebAuthnCredential;
  userHandle: string;
}) {
  const { origin, rpID } = relyingParty();
  try {
    const response = authenticationSchema.parse(input.response);
    validIDs([response.id]);
    const expectedHandle = handle.parse(input.userHandle);
    if (
      response.id !== input.credential.id ||
      (response.response.userHandle != null &&
        response.response.userHandle !== expectedHandle)
    )
      throw new Error();
    if (
      !Number.isSafeInteger(input.credential.counter) ||
      input.credential.counter < 0 ||
      input.credential.counter > 0xffffffff ||
      input.credential.publicKey.length > 4096
    )
      throw new Error();
    firstPartyClientData(response.response.clientDataJSON);
    const result = await verifyAuthenticationResponse({
      response: {
        ...response,
        response: {
          ...response.response,
          userHandle: response.response.userHandle ?? undefined,
        },
      },
      expectedChallenge: challengeValue.parse(input.challenge),
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: input.credential,
      requireUserVerification: true,
    });
    if (!result.verified || !result.authenticationInfo.userVerified)
      throw new Error();
    return {
      counter: result.authenticationInfo.newCounter,
      deviceType: result.authenticationInfo.credentialDeviceType,
      backedUp: result.authenticationInfo.credentialBackedUp,
    };
  } catch {
    throw failed();
  }
}
