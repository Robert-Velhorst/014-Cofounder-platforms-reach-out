import { admitAuthenticationAttempt } from "./auth-attempt-admission";

export function admitRegistrationAttempt(
  email: string,
  ip: string | undefined
) {
  return admitAuthenticationAttempt("registration", email, ip);
}
