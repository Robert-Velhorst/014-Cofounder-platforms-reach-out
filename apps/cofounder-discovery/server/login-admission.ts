import { admitAuthenticationAttempt } from "./auth-attempt-admission";

export function admitLoginAttempt(email: string, ip: string | undefined) {
  return admitAuthenticationAttempt("login", email, ip);
}
