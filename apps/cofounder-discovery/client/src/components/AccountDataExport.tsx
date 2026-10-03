import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export function AccountDataExport({
  accountId,
  accountBlocked,
}: {
  accountId: number;
  accountBlocked: boolean;
}) {
  const { language, text } = useLanguage();
  const utils = trpc.useUtils();
  // Remove detached mutation data immediately; never persist the password/export.
  const mutation = trpc.accountData.export.useMutation({
    gcTime: 0,
    retry: false,
  });
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<
    | { kind: "original"; message: string }
    | { kind: "account_changed" | "failed" }
    | null
  >(null);
  const [notice, setNotice] = useState(false);
  const inFlight = useRef(false),
    mounted = useRef(false);
  const current = useRef({ accountId, accountBlocked });
  current.current = { accountId, accountBlocked };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function download(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || accountBlocked || !confirmed || !password) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setNotice(false);
    const submittedPassword = password;
    setPassword("");
    try {
      const result = await mutation.mutateAsync({
        accountId,
        password: submittedPassword,
        confirmation: true,
      });
      if (!mounted.current) return;
      await utils.auth.me.cancel();
      const fresh = await utils.auth.me.fetch(undefined, { staleTime: 0 });
      if (!mounted.current) return;
      if (
        result.accountId !== accountId ||
        fresh?.id !== accountId ||
        fresh.emailVerified !== 1 ||
        current.current.accountId !== accountId ||
        current.current.accountBlocked
      ) {
        setError({ kind: "account_changed" });
        return;
      }
      const url = URL.createObjectURL(
        new Blob([result.json], { type: "application/json;charset=utf-8" })
      );
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      setNotice(true);
    } catch (caught) {
      if (mounted.current)
        setError(
          caught instanceof Error
            ? { kind: "original", message: caught.message }
            : { kind: "failed" }
        );
    } finally {
      mutation.reset();
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <section
      aria-label={text(
        "Private account export",
        "Privé-export van accountgegevens"
      )}
      lang={language}
      className="space-y-4 rounded-xl border p-4"
    >
      <h2 className="text-xl font-semibold">
        {text("Your account data", "Je accountgegevens")}
      </h2>
      <p>
        {text(
          "Download a machine-readable JSON snapshot of retained records belonging to this account: profile, active and archived candidates, opt-outs, messages, reminders, notes, assessments, preferences, recorded billing and audit history, and connection metadata. Empty and excluded categories are listed in the file.",
          "Download een machineleesbare JSON-momentopname van bewaarde gegevens van dit account: profiel, actieve en gearchiveerde kandidaten, contactweigeringen, berichten, herinneringen, notities, beoordelingen, voorkeuren, vastgelegde facturerings- en auditgeschiedenis en verbindingsmetadata. Lege en uitgesloten categorieën staan in het bestand."
        )}
      </p>
      <p className="text-sm">
        {text(
          "Passwords, tokens, encrypted credentials and unreviewed provider/execution payloads are excluded with reasons. Shared service data and unowned legacy records are not included. This is not a database backup or a complete legal access-response determination; excluded payloads and data outside this database need operator review.",
          "Wachtwoorden, tokens, versleutelde toegangsgegevens en niet-beoordeelde provider-/uitvoeringsgegevens zijn uitgesloten, met redenen. Gedeelde servicegegevens en oude gegevens zonder vastgestelde eigenaar ontbreken. Dit is geen databaseback-up en geen volledige beoordeling van een juridisch inzageverzoek; uitgesloten gegevens en gegevens buiten deze database moeten door de beheerder worden beoordeeld."
        )}
      </p>
      <p className="text-sm">
        {text(
          "The download is not encrypted and may contain other people’s details. Keep it private. Maximum 20 MiB / 100,000 records; oversized exports fail without a partial file. Five attempts per 15 minutes, including incorrect passwords. No email, provider action or deletion is triggered.",
          "De download is niet versleuteld en kan gegevens van anderen bevatten. Houd het bestand privé. Maximaal 20 MiB / 100.000 gegevensrecords; te grote exports mislukken zonder gedeeltelijk bestand. Vijf pogingen per 15 minuten, inclusief onjuiste wachtwoorden. Er wordt geen e-mail verstuurd, provideractie uitgevoerd of verwijdering gestart."
        )}
      </p>
      {accountBlocked ? (
        <p role="alert">
          {text(
            "Your account could not be verified. Refresh your workspace before exporting private data.",
            "Je account kon niet worden geverifieerd. Vernieuw je werkruimte voordat je privégegevens exporteert."
          )}
        </p>
      ) : null}
      {!accountBlocked && error ? (
        <p role="alert" lang={error.kind === "original" ? "en" : language}>
          {error.kind === "original"
            ? error.message
            : error.kind === "account_changed"
              ? text(
                  "Your account changed or could not be verified. This export was not downloaded. Refresh before trying again.",
                  "Je account is gewijzigd of kon niet worden geverifieerd. Deze export is niet gedownload. Vernieuw de werkruimte voordat je opnieuw probeert."
                )
              : text(
                  "Account export failed. No file was downloaded.",
                  "De accountexport is mislukt. Er is geen bestand gedownload."
                )}
        </p>
      ) : null}
      {!accountBlocked && notice ? (
        <p role="status">
          {text(
            "Your browser started the account JSON download. Store it securely.",
            "Je browser heeft de JSON-download van je account gestart. Bewaar het bestand veilig."
          )}
        </p>
      ) : null}
      <form onSubmit={download} className="space-y-3">
        <fieldset disabled={pending || accountBlocked} className="space-y-3">
          <Label htmlFor={`account-export-password-${accountId}`}>
            {text("Current password", "Huidig wachtwoord")}
          </Label>
          <Input
            id={`account-export-password-${accountId}`}
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
            value={accountBlocked ? "" : password}
            onChange={event => setPassword(event.target.value)}
          />
          <Label className="flex items-start gap-3 leading-relaxed">
            <input
              type="checkbox"
              checked={!accountBlocked && confirmed}
              onChange={event => setConfirmed(event.target.checked)}
            />
            {text(
              "I understand this file contains private account and candidate data",
              "Ik begrijp dat dit bestand privégegevens van mijn account en kandidaten bevat"
            )}
          </Label>
          <Button
            type="submit"
            disabled={pending || accountBlocked || !password || !confirmed}
          >
            {pending
              ? text("Preparing private export…", "Privé-export voorbereiden…")
              : text(
                  "Download account JSON",
                  "Accountgegevens als JSON downloaden"
                )}
          </Button>
        </fieldset>
      </form>
      <p className="text-sm">
        {text(
          "Account deletion is not enabled here yet. Exporting does not delete, archive or change your records.",
          "Accountverwijdering is hier nog niet ingeschakeld. Exporteren verwijdert, archiveert of wijzigt je gegevens niet."
        )}
      </p>
    </section>
  );
}
