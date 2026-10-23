import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RecoveryFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-950 p-6 text-neutral-50">
      <Card className="w-full max-w-md border-white/10 bg-neutral-900 text-neutral-50">
        <CardHeader>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </main>
  );
}

export function ForgotPassword() {
  const { text } = useLanguage();
  const [email, setEmail] = useState("");
  const request = trpc.auth.requestPasswordReset.useMutation();
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!request.isPending) request.mutate({ email });
  }
  return (
    <RecoveryFrame
      title={text("Recover your account", "Je account herstellen")}
      description={text(
        "Enter the email address you used to register. You do not need your old password.",
        "Vul het e-mailadres in waarmee je je hebt geregistreerd. Je oude wachtwoord is niet nodig."
      )}
    >
      {request.isSuccess ? (
        <p role="status" lang="en">
          {request.data.message}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {request.error ? (
            <p role="alert" lang="en" className="text-red-300">
              {request.error.message}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="recovery-email">
              {text("Email", "E-mailadres")}
            </Label>
            <Input
              id="recovery-email"
              type="email"
              autoComplete="email"
              maxLength={320}
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={request.isPending}>
            {request.isPending
              ? text("Requesting link…", "Link aanvragen…")
              : text("Request reset link", "Herstellink aanvragen")}
          </Button>
        </form>
      )}
      {request.isSuccess ? (
        <Button variant="outline" onClick={() => request.reset()}>
          {text(
            "Use a different email or try again",
            "Een ander e-mailadres gebruiken of opnieuw proberen"
          )}
        </Button>
      ) : null}
      <p>
        <Link href="/login" className="underline">
          {text("Back to sign-in", "Terug naar inloggen")}
        </Link>
      </p>
    </RecoveryFrame>
  );
}

function readResetToken() {
  if (typeof window === "undefined") return null;
  const tokens = new URLSearchParams(window.location.hash.slice(1)).getAll(
    "token"
  );
  return tokens.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(tokens[0])
    ? tokens[0]
    : null;
}

export function ResetPassword() {
  const { text, language } = useLanguage();
  const [token, setToken] = useState(readResetToken);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState<"password-mismatch" | null>(null);
  const reset = trpc.auth.resetPassword.useMutation();
  const resetMutation = reset.reset;
  useEffect(() => {
    const readLink = () => {
      if (!window.location.hash) return;
      setToken(readResetToken());
      setPassword("");
      setConfirmation("");
      setFormError(null);
      resetMutation();
      // Keep the bearer secret in memory only, never in history or storage.
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      );
    };
    readLink();
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, [resetMutation]);
  const succeeded = reset.isSuccess && reset.variables?.token === token;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!token || reset.isPending) return;
    if (password !== confirmation) {
      setFormError("password-mismatch");
      return;
    }
    setFormError(null);
    reset.mutate(
      { token, password },
      {
        onSuccess: () => {
          setPassword("");
          setConfirmation("");
        },
      }
    );
  }
  return (
    <RecoveryFrame
      title={
        succeeded
          ? text("Password changed", "Wachtwoord gewijzigd")
          : text("Choose a new password", "Kies een nieuw wachtwoord")
      }
      description={
        succeeded
          ? text(
              "All previous sessions have been signed out. Sign in with your new password.",
              "Alle eerdere sessies zijn afgemeld. Log in met je nieuwe wachtwoord."
            )
          : text(
              "The link expires 30 minutes after your request and can only be used once.",
              "De link verloopt 30 minuten na je aanvraag en kan maar één keer worden gebruikt."
            )
      }
    >
      {succeeded ? (
        <p role="status">
          <Link href="/login" className="underline">
            {text(
              "Sign in with your new password",
              "Inloggen met je nieuwe wachtwoord"
            )}
          </Link>
        </p>
      ) : token ? (
        <form onSubmit={submit} className="space-y-4">
          {formError || reset.error ? (
            <p
              role="alert"
              lang={formError ? language : "en"}
              className="text-red-300"
            >
              {formError
                ? text(
                    "The passwords do not match.",
                    "De wachtwoorden komen niet overeen."
                  )
                : reset.error?.message}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {text("New password", "Nieuw wachtwoord")}
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              aria-describedby="password-policy"
            />
          </div>
          <p id="password-policy" className="text-sm text-neutral-300">
            {text(
              "Use 12 or more characters, including uppercase, lowercase and a number.",
              "Gebruik minstens 12 tekens, met hoofdletters, kleine letters en een cijfer."
            )}
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {text("Confirm new password", "Nieuw wachtwoord bevestigen")}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={reset.isPending}>
            {reset.isPending
              ? text("Changing password…", "Wachtwoord wijzigen…")
              : text("Change password", "Wachtwoord wijzigen")}
          </Button>
        </form>
      ) : (
        <p role="alert">
          {text(
            "This reset link is missing or invalid. Open the complete link from your email, or request a new one.",
            "Deze herstellink ontbreekt of is ongeldig. Open de volledige link uit je e-mail of vraag een nieuwe aan."
          )}
        </p>
      )}
      {!succeeded ? (
        <p>
          <Link href="/forgot-password" className="underline">
            {text(
              "Request a new reset link",
              "Een nieuwe herstellink aanvragen"
            )}
          </Link>
        </p>
      ) : null}
    </RecoveryFrame>
  );
}
