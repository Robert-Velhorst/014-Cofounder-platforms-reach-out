import { TRPCError } from "@trpc/server";
import { getConfig } from "./config";
import { issueBudgetedVerificationToken } from "./account-mail-budget";

export function requireAccountMail() {
  const config = getConfig();
  if (
    !config.RESEND_API_KEY ||
    !config.AUTH_EMAIL_FROM ||
    !config.PUBLIC_ORIGIN
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Account email is not configured. Contact the service operator.",
    });
  }
  return {
    key: config.RESEND_API_KEY,
    from: config.AUTH_EMAIL_FROM,
    origin: config.PUBLIC_ORIGIN,
  };
}

export async function sendVerification(user: {
  id: number;
  email: string | null;
}) {
  const config = requireAccountMail();
  if (!user.email)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Account has no email address",
    });
  const token = await issueBudgetedVerificationToken(user.id, user.email);
  // Fragments avoid placing the secret in HTTP access logs or referrer headers.
  const url = new URL("/verify-email", config.origin);
  url.hash = `token=${token}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: config.from,
        to: [user.email],
        subject: "Verify your CoFounder Outreach account",
        text: `Confirm your email address using this link:\n${url}\n\nThis link expires in 24 hours and can only be used once. If you did not request it, ignore this message.`,
      }),
    });
    if (!response.ok) throw new Error("provider_rejected");
    const acknowledgement: unknown = await response.json();
    if (
      !acknowledgement ||
      typeof acknowledgement !== "object" ||
      !("id" in acknowledgement) ||
      typeof acknowledgement.id !== "string" ||
      !acknowledgement.id
    ) {
      throw new Error("provider_acknowledgement_missing");
    }
    return {
      success: true as const,
      status: "accepted_by_email_provider" as const,
    };
  } catch {
    // Never echo provider bodies, credentials, addresses or token-bearing URLs.
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "Verification email could not be confirmed. Please try sending a new link.",
    });
  }
}
