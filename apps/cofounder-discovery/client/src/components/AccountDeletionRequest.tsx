import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export function AccountDeletionRequest({
  accountId,
  accountBlocked,
}: {
  accountId: number;
  accountBlocked: boolean;
}) {
  const { language, text } = useLanguage();
  const utils = trpc.useUtils();
  const status = trpc.accountData.deletionStatus.useQuery(
    { accountId },
    {
      enabled: !accountBlocked,
      retry: false,
      staleTime: 0,
      gcTime: 0,
    }
  );
  const request = trpc.accountData.requestDeletion.useMutation({
    retry: false,
    gcTime: 0,
  });
  const withdraw = trpc.accountData.withdrawDeletion.useMutation({
    retry: false,
    gcTime: 0,
  });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState<{
    action: "request" | "withdraw";
    revision: number;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<
    | { kind: "original"; message: string }
    | { kind: "account_changed" | "failed" }
    | null
  >(null);
  const mounted = useRef(false),
    inFlight = useRef(false);
  const current = useRef({ accountId, accountBlocked });
  current.current = { accountId, accountBlocked };
  const intent = useRef<{
    action: "request" | "withdraw";
    revision: number;
    requestKey: string;
  } | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const row = status.data?.accountId === accountId ? status.data : undefined;
  const withdrawing = row?.status === "pending_review";
  const confirmed =
    confirmation?.revision === row?.revision &&
    confirmation?.action === (withdrawing ? "withdraw" : "request");
  const unavailable =
    accountBlocked || status.isError || status.isFetching || !row;
  const blocked =
    unavailable || pending || (!withdrawing && !row?.requestsEnabled);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || blocked || !row || !password || !confirmed) return;
    const action = withdrawing ? "withdraw" : "request";
    if (
      !intent.current ||
      intent.current.action !== action ||
      intent.current.revision !== row.revision
    )
      intent.current = {
        action,
        revision: row.revision,
        requestKey: withdrawing ? row.requestKey! : crypto.randomUUID(),
      };
    const command = {
      accountId,
      password,
      expectedRevision: intent.current.revision,
      requestKey: intent.current.requestKey,
    };
    inFlight.current = true;
    setPending(true);
    setError(null);
    setPassword("");
    setConfirmation(null);
    try {
      const result =
        action === "request"
          ? await request.mutateAsync({
              ...command,
              confirmation: "REQUEST ACCOUNT DELETION",
            })
          : await withdraw.mutateAsync({ ...command, confirmation: true });
      if (!mounted.current) return;
      await utils.auth.me.cancel();
      const fresh = await utils.auth.me.fetch(undefined, { staleTime: 0 });
      if (!mounted.current) return;
      if (
        fresh?.id !== accountId ||
        fresh.emailVerified !== 1 ||
        result.accountId !== accountId ||
        current.current.accountId !== accountId ||
        current.current.accountBlocked
      ) {
        setError({ kind: "account_changed" });
        return;
      }
      await utils.accountData.deletionStatus.cancel({ accountId });
      utils.accountData.deletionStatus.setData({ accountId }, result);
      intent.current = null;
    } catch (caught) {
      if (mounted.current)
        setError(
          caught instanceof Error
            ? { kind: "original", message: caught.message }
            : { kind: "failed" }
        );
    } finally {
      request.reset();
      withdraw.reset();
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <section
      aria-label={text(
        "Account deletion request",
        "Verzoek om accountverwijdering"
      )}
      lang={language}
      className="space-y-4 rounded-xl border p-4"
    >
      <h2 className="text-xl font-semibold">
        {text("Request account deletion", "Accountverwijdering aanvragen")}
      </h2>
      <p>
        {text(
          "This records a request for the service operator to review. It does not delete data, stop your account, or promise a completion date. Automated deletion is not enabled. Retention exceptions, external services and backups still require review. Export anything you need before deletion is eventually processed.",
          "Dit legt een verzoek vast dat de beheerder moet beoordelen. Het verwijdert geen gegevens, blokkeert je account niet en belooft geen afrondingsdatum. Automatische verwijdering is niet ingeschakeld. Bewaaruitzonderingen, externe diensten en back-ups moeten nog worden beoordeeld. Exporteer wat je nodig hebt voordat een eventuele verwijdering wordt uitgevoerd."
        )}
      </p>
      <p className="text-sm">
        {text(
          "You can withdraw a pending request here before processing begins. Requests and withdrawals share five password-confirmation attempts per 15 minutes, including incorrect passwords. No email or platform message is sent.",
          "Je kunt een openstaand verzoek hier intrekken voordat de verwerking begint. Verzoeken en intrekkingen delen een limiet van vijf wachtwoordbevestigingen per 15 minuten, inclusief onjuiste wachtwoorden. Er wordt geen e-mail of platformbericht verstuurd."
        )}
      </p>
      {accountBlocked ? (
        <p role="alert">
          {text(
            "Your account could not be verified. Refresh your workspace.",
            "Je account kon niet worden geverifieerd. Vernieuw je werkruimte."
          )}
        </p>
      ) : status.isError ? (
        <p role="alert">
          {text(
            "Service message (original): ",
            "Originele melding van de dienst: "
          )}
          <span lang="en">{status.error.message}</span>
        </p>
      ) : !row ? (
        <p role="status">
          {text(
            "Loading deletion request status…",
            "Status van het verwijderverzoek laden…"
          )}
        </p>
      ) : (
        <div className="space-y-2" role="status">
          <p>
            {row.status === "pending_review"
              ? text(
                  "Awaiting operator review. Nothing has been deleted.",
                  "Nog te beoordelen door de beheerder. Er is niets verwijderd."
                )
              : row.status === "withdrawn"
                ? text(
                    "Request withdrawn. Your account has not been deleted.",
                    "Verzoek ingetrokken. Je account is niet verwijderd."
                  )
                : text(
                    "No deletion request is recorded.",
                    "Er is geen verwijderverzoek vastgelegd."
                  )}
          </p>
          {row.requestKey ? (
            <p className="break-all text-sm">
              {text("Request reference: ", "Referentie van het verzoek: ")}
              {row.requestKey}
            </p>
          ) : null}
          {row.requestedAt ? (
            <p className="text-sm">
              {text("Requested: ", "Ingediend: ")}
              <time dateTime={row.requestedAt}>
                {new Date(row.requestedAt).toLocaleString(
                  language === "nl" ? "nl-NL" : "en-GB"
                )}
              </time>
            </p>
          ) : null}
          {row.withdrawnAt ? (
            <p className="text-sm">
              {text("Withdrawn: ", "Ingetrokken: ")}
              <time dateTime={row.withdrawnAt}>
                {new Date(row.withdrawnAt).toLocaleString(
                  language === "nl" ? "nl-NL" : "en-GB"
                )}
              </time>
            </p>
          ) : null}
          {!row.requestsEnabled ? (
            <p>
              {text(
                "New request intake is disabled by the operator. Existing pending requests can still be withdrawn.",
                "Nieuwe verzoeken zijn uitgeschakeld door de beheerder. Bestaande openstaande verzoeken kun je nog intrekken."
              )}
            </p>
          ) : null}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={accountBlocked || pending || status.isFetching}
        onClick={() => {
          setPassword("");
          setConfirmation(null);
          setError(null);
          void status.refetch();
        }}
      >
        {text("Refresh request status", "Status van het verzoek vernieuwen")}
      </Button>
      {!accountBlocked && error ? (
        <p role="alert">
          {error.kind === "original" ? (
            <>
              {text(
                "Service message (original): ",
                "Originele melding van de dienst: "
              )}
              <span lang="en">{error.message}</span>
            </>
          ) : error.kind === "account_changed" ? (
            text(
              "Your account changed. Refresh and inspect the original account's request status; this response is not displayed for another account.",
              "Je account is gewijzigd. Vernieuw de status en controleer het verzoek van het oorspronkelijke account; dit antwoord wordt niet voor een ander account getoond."
            )
          ) : (
            text(
              "The request could not be confirmed. Refresh its status before retrying.",
              "Het verzoek kon niet worden bevestigd. Vernieuw de status voordat je het opnieuw probeert."
            )
          )}
        </p>
      ) : null}
      <form onSubmit={submit} className="space-y-3">
        <fieldset disabled={blocked} className="space-y-3">
          <Label htmlFor={`deletion-request-password-${accountId}`}>
            {text(
              "Current password for deletion requests",
              "Huidig wachtwoord voor verwijderverzoeken"
            )}
          </Label>
          <Input
            id={`deletion-request-password-${accountId}`}
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={accountBlocked ? "" : password}
            onChange={event => setPassword(event.target.value)}
          />
          <Label className="flex items-start gap-3 leading-relaxed">
            <input
              type="checkbox"
              checked={!accountBlocked && confirmed}
              onChange={event =>
                setConfirmation(
                  event.target.checked && row
                    ? {
                        action: withdrawing ? "withdraw" : "request",
                        revision: row.revision,
                      }
                    : null
                )
              }
            />
            {withdrawing
              ? text(
                  "I want to withdraw this pending deletion request",
                  "Ik wil dit openstaande verwijderverzoek intrekken"
                )
              : text(
                  "I request deletion of this account and understand it is held for operator review",
                  "Ik vraag verwijdering van dit account aan en begrijp dat de beheerder het verzoek eerst moet beoordelen"
                )}
          </Label>
          <Button
            type="submit"
            variant={withdrawing ? "outline" : "destructive"}
            disabled={blocked || !password || !confirmed}
          >
            {pending
              ? text("Saving request…", "Verzoek opslaan…")
              : withdrawing
                ? text(
                    "Withdraw deletion request",
                    "Verwijderverzoek intrekken"
                  )
                : text("Submit deletion request", "Verwijderverzoek indienen")}
          </Button>
        </fieldset>
      </form>
    </section>
  );
}
