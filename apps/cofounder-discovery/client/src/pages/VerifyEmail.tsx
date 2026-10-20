import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// null means no link; empty string means an invalid supplied fragment. Keep
// invalid links distinct from the signed-in account's independent verified flag.
function readVerificationToken(): string | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const tokens = new URLSearchParams(window.location.hash.slice(1)).getAll(
    "token"
  );
  return tokens.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(tokens[0])
    ? tokens[0]
    : "";
}

export default function VerifyEmail() {
  const { text } = useLanguage();
  const utils = trpc.useUtils();
  const account = trpc.auth.me.useQuery(undefined, { retry: false });
  const [token, setToken] = useState(readVerificationToken);
  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const resend = trpc.auth.sendVerificationEmail.useMutation();
  const resetVerification = verify.reset;
  useEffect(() => {
    const readLink = () => {
      if (!window.location.hash) return;
      setToken(readVerificationToken());
      resetVerification();
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      );
    };
    readLink();
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, [resetVerification]);
  // An email link can belong to someone other than the signed-in account.
  const accountAvailable = Boolean(
    account.data && !account.error && !account.isLoading
  );
  const hasLink = token !== null;
  const currentAttempt = Boolean(token && verify.variables?.token === token);
  const verified = hasLink
    ? Boolean(token && currentAttempt && verify.isSuccess)
    : Boolean(accountAvailable && account.data?.emailVerified === 1);
  const verificationError = currentAttempt ? verify.error : null;
  const canOpenWorkspace = Boolean(
    accountAvailable &&
    (!hasLink || (currentAttempt && verify.data?.email === account.data?.email))
  );
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-950 p-6 text-neutral-50">
      <Card className="w-full max-w-lg border-white/10 bg-neutral-900 text-neutral-50">
        <CardHeader>
          <CardTitle>
            {verified
              ? text("Email verified", "E-mailadres bevestigd")
              : text("Verify your email address", "Bevestig je e-mailadres")}
          </CardTitle>
          <CardDescription>
            {verified
              ? hasLink
                ? text(
                    "The email address from this link is confirmed.",
                    "Het e-mailadres uit deze link is bevestigd."
                  )
                : text(
                    "Your email address is confirmed.",
                    "Je e-mailadres is bevestigd."
                  )
              : text(
                  "Confirm ownership of your email address before using the outreach workspace.",
                  "Bevestig dat het e-mailadres van jou is voordat je de werkruimte gebruikt."
                )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationError || resend.error || account.error ? (
            <p role="alert" lang="en" className="text-red-300">
              {verificationError?.message ||
                resend.error?.message ||
                account.error?.message}
            </p>
          ) : null}
          {resend.isSuccess ? (
            <p role="status">
              {text(
                "The email provider accepted your verification email. Check your inbox and spam folder. The link expires in 24 hours.",
                "De e-mailprovider heeft je bevestigingsmail geaccepteerd. Controleer je inbox en spammap. De link verloopt na 24 uur."
              )}
            </p>
          ) : null}
          {account.error ? (
            <div className="space-y-2">
              <p role="status" className="text-sm text-neutral-300">
                {text(
                  "Account-dependent actions are paused until your account can be checked again. Confirming an email link is a separate action.",
                  "Accountacties zijn gepauzeerd totdat je account opnieuw gecontroleerd kan worden. Een e-maillink bevestigen is een aparte actie."
                )}
              </p>
              <Button
                variant="outline"
                disabled={account.isFetching}
                onClick={() => void account.refetch()}
              >
                {account.isFetching
                  ? text("Checking account…", "Account controleren…")
                  : text("Check account again", "Account opnieuw controleren")}
              </Button>
            </div>
          ) : null}
          {verified && (hasLink || accountAvailable) ? (
            <Button asChild>
              <Link href={canOpenWorkspace ? "/outreach" : "/login"}>
                {canOpenWorkspace
                  ? text("Open workspace", "Werkruimte openen")
                  : text(
                      "Sign in to verified account",
                      "Inloggen bij het bevestigde account"
                    )}
              </Link>
            </Button>
          ) : hasLink && !token ? (
            <p role="alert">
              {text(
                "This verification link is invalid. Open the complete link from your email, or request a new one.",
                "Deze bevestigingslink is ongeldig. Open de volledige link uit je e-mail of vraag een nieuwe aan."
              )}
            </p>
          ) : token ? (
            <Button
              disabled={currentAttempt && verify.isPending}
              onClick={() => {
                if (!currentAttempt || !verify.isPending)
                  verify.mutate({ token });
              }}
            >
              {currentAttempt && verify.isPending
                ? text("Verifying…", "Bevestigen…")
                : text("Confirm email address", "E-mailadres bevestigen")}
            </Button>
          ) : account.error ? null : (
            <p className="text-sm text-neutral-300">
              {text(
                "Request a verification link below, then open it from your email. If a link has expired, request a new one.",
                "Vraag hieronder een bevestigingslink aan en open die vanuit je e-mail. Is de link verlopen, vraag dan een nieuwe aan."
              )}
            </p>
          )}
          {!verified && accountAvailable ? (
            <Button
              variant="outline"
              disabled={resend.isPending}
              onClick={() => resend.mutate()}
            >
              {resend.isPending
                ? text("Requesting email…", "E-mail aanvragen…")
                : text(
                    "Send a new verification link",
                    "Een nieuwe bevestigingslink versturen"
                  )}
            </Button>
          ) : null}
          {!verified &&
          !account.data &&
          !account.isLoading &&
          !account.error ? (
            <p>
              <Link href="/login" className="underline">
                {text("Sign in", "Inloggen")}
              </Link>{" "}
              {text(
                "to request another verification link.",
                "om een nieuwe bevestigingslink aan te vragen."
              )}
            </p>
          ) : null}
          {account.isLoading ? (
            <p role="status">
              {text("Checking account…", "Account controleren…")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
