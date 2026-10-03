import { admitAuthenticationAttempt } from "./auth-attempt-admission";

export function admitVerificationRedemptionAttempt(
  token: string,
  ip: string | undefined
) {
  return admitAuthenticationAttempt("verificationRedemption", token, ip);
}
