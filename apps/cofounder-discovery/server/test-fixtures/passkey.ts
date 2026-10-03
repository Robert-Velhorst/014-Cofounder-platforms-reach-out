import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto";

// Independent synthetic authenticator: real P-256/RSA keys and signatures,
// manually encoded COSE/CBOR, not a mock of the production verifier.
export function passkeyFixture(algorithm: "ES256" | "RS256" = "ES256") {
  const { privateKey, publicKey } =
    algorithm === "RS256"
      ? generateKeyPairSync("rsa", { modulusLength: 2048 })
      : generateKeyPairSync("ec", {
          namedCurve: "prime256v1",
        });
  const jwk = publicKey.export({ format: "jwk" });
  const cose =
    algorithm === "RS256"
      ? Buffer.concat([
          Buffer.from("a401030339010020590100", "hex"),
          Buffer.from(jwk.n!, "base64url"),
          Buffer.from("2143", "hex"),
          Buffer.from(jwk.e!, "base64url"),
        ])
      : Buffer.concat([
          Buffer.from("a5010203262001215820", "hex"),
          Buffer.from(jwk.x!, "base64url"),
          Buffer.from("225820", "hex"),
          Buffer.from(jwk.y!, "base64url"),
        ]);
  const id = randomBytes(32).toString("base64url");
  const userHandle = randomBytes(32).toString("base64url");
  const challenge = randomBytes(32).toString("base64url");
  const origin = "https://cofounder.example.invalid";
  const rpID = "cofounder.example.invalid";
  function data(
    type: string,
    options: {
      challenge?: string;
      origin?: string;
      crossOrigin?: boolean;
      topOrigin?: string;
    }
  ) {
    return Buffer.from(
      JSON.stringify({
        type,
        challenge,
        origin,
        crossOrigin: false,
        ...options,
      })
    );
  }
  function authData(flags: number, counter: number, rp = rpID) {
    const suffix = Buffer.alloc(5);
    suffix[0] = flags;
    suffix.writeUInt32BE(counter, 1);
    return Buffer.concat([createHash("sha256").update(rp).digest(), suffix]);
  }
  function registration(
    options: {
      packed?: boolean;
      flags?: number;
      rpID?: string;
      challenge?: string;
      origin?: string;
      crossOrigin?: boolean;
      topOrigin?: string;
    } = {}
  ) {
    const credentialId = Buffer.from(id, "base64url");
    const length = Buffer.alloc(2);
    length.writeUInt16BE(credentialId.length);
    const authenticatorData = Buffer.concat([
      authData(options.flags ?? 0x45, 0, options.rpID),
      Buffer.alloc(16),
      length,
      credentialId,
      cose,
    ]);
    const byteStringLength = Buffer.alloc(3);
    byteStringLength[0] = 0x59;
    byteStringLength.writeUInt16BE(authenticatorData.length, 1);
    const clientData = data("webauthn.create", options);
    const signature = sign(
      "sha256",
      Buffer.concat([
        authenticatorData,
        createHash("sha256").update(clientData).digest(),
      ]),
      privateKey
    );
    const attestation = Buffer.concat([
      ...(options.packed
        ? [
            Buffer.from(
              "a363666d74667061636b65646761747453746d74a263616c672663736967",
              "hex"
            ),
            Buffer.from([0x58, signature.length]),
            signature,
            Buffer.from("686175746844617461", "hex"),
          ]
        : [
            Buffer.from(
              "a363666d74646e6f6e656761747453746d74a0686175746844617461",
              "hex"
            ),
          ]),
      byteStringLength,
      authenticatorData,
    ]);
    return {
      id,
      rawId: id,
      type: "public-key" as const,
      response: {
        clientDataJSON: clientData.toString("base64url"),
        attestationObject: attestation.toString("base64url"),
        transports: ["internal" as const],
      },
      clientExtensionResults: {},
    };
  }
  function authentication(
    options: {
      flags?: number;
      counter?: number;
      rpID?: string;
      challenge?: string;
      origin?: string;
      crossOrigin?: boolean;
      topOrigin?: string;
      userHandle?: string | null;
    } = {}
  ) {
    const clientData = data("webauthn.get", options);
    const authenticatorData = authData(
      options.flags ?? 5,
      options.counter ?? 1,
      options.rpID
    );
    const signed = Buffer.concat([
      authenticatorData,
      createHash("sha256").update(clientData).digest(),
    ]);
    return {
      id,
      rawId: id,
      type: "public-key" as const,
      response: {
        clientDataJSON: clientData.toString("base64url"),
        authenticatorData: authenticatorData.toString("base64url"),
        signature: sign("sha256", signed, privateKey).toString("base64url"),
        userHandle:
          options.userHandle === null
            ? undefined
            : (options.userHandle ?? userHandle),
      },
      clientExtensionResults: {},
    };
  }
  return {
    id,
    userHandle,
    challenge,
    origin,
    rpID,
    publicKey: new Uint8Array(cose),
    registration,
    authentication,
  };
}
