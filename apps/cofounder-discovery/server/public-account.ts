import type { User } from "../drizzle/schema";

/** Explicit allowlist: new database columns never become public by accident. */
export function publicAccount(user: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    loginMethod: user.loginMethod,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn,
  };
}
