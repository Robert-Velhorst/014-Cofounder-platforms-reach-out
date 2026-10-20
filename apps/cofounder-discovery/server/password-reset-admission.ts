import { admitAuthenticationAttempt } from "./auth-attempt-admission";

export function admitPasswordResetAttempt(
  token: string,
  ip: string | undefined
) {
  return admitAuthenticationAttempt("passwordReset", token, ip);
}
