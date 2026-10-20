import { useRef, useState } from "react";
import { z } from "zod";
import { progressRecordSchema } from "@shared/partnership-progress";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

type Command = z.infer<typeof progressRecordSchema>;
type ProgressError =
  | { message: string }
  | "saved_refresh_failed"
  | "uncertain"
  | "reload_failed_preserved"
  | "reload_failed";

export function PartnershipProgress({
  accountId,
  prospectId,
  blocked,
  onBusy,
  onDirty,
}: {
  accountId: number;
  prospectId: number;
  blocked: boolean;
  onBusy: (value: boolean) => void;
  onDirty: (value: boolean) => void;
}) {
  const { language, text } = useLanguage();
  const labels = {
    partnership_formed: text(
      "Partnership formed (my report)",
      "Samenwerking gevormd (mijn rapport)"
    ),
    still_talking: text("Still talking", "Nog in gesprek"),
    not_interested: text("Not interested", "Geen interesse"),
    no_response: text("No response", "Geen reactie"),
    timing_not_right: text("Timing not right", "Nu niet het juiste moment"),
  };
  function recordedDate(value: Date | string | null) {
    if (!value) return text("Date not recorded", "Datum niet vastgelegd");
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date)
      : text("Date unavailable", "Datum niet beschikbaar");
  }
  const [before, setBefore] = useState<number | undefined>();
  const history = trpc.criticalPath.progress.list.useQuery(
    { accountId, prospectId, beforeId: before },
    { enabled: !blocked, retry: false, refetchOnMount: "always" }
  );
  const mutation = trpc.criticalPath.progress.record.useMutation();
  const [outcome, setOutcome] = useState<Command["outcome"]>("still_talking");
  const [notes, setNotes] = useState("");
  const [confirmedReview, setConfirmedReview] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Command | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [error, setError] = useState<ProgressError | null>(null);
  const [notice, setNotice] = useState<"replayed" | "saved" | null>(null);
  const errorMessage =
    error === null
      ? null
      : typeof error === "object"
        ? error.message
        : {
            saved_refresh_failed: text(
              "Your report was saved, but history could not be refreshed. Reload before recording another report.",
              "Je rapport is opgeslagen, maar de geschiedenis kon niet worden vernieuwd. Laad opnieuw voordat je een ander rapport vastlegt."
            ),
            uncertain: text(
              "Could not confirm whether progress was saved.",
              "Er kon niet worden bevestigd of de voortgang is opgeslagen."
            ),
            reload_failed_preserved: text(
              "History could not be refreshed. Inputs were preserved.",
              "De geschiedenis kon niet worden vernieuwd. De invoer is behouden."
            ),
            reload_failed: text(
              "History could not be refreshed.",
              "De geschiedenis kon niet worden vernieuwd."
            ),
          }[error];
  const flight = useRef(false);
  const view = history.data;
  const concealed =
    blocked ||
    (!!view &&
      (view.accountId !== accountId || view.prospectId !== prospectId));
  const disabled =
    concealed ||
    history.isFetching ||
    history.isError ||
    !view ||
    mutation.isPending ||
    !!attempt ||
    needsReview;

  async function execute(command: Command) {
    if (concealed || flight.current) return;
    flight.current = true;
    onBusy(true);
    onDirty(true);
    setAttempt(command);
    setError(null);
    setNotice(null);
    try {
      const result = await mutation.mutateAsync(command);
      setAttempt(null);
      setNotes("");
      setConfirmedReview(null);
      onDirty(false);
      setNotice(result.replayed ? "replayed" : "saved");
      setBefore(undefined);
      const refreshed = await history.refetch();
      if (refreshed.isError) setError("saved_refresh_failed");
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "uncertain"
      );
      if ((caught as { data?: { code?: string } })?.data?.code === "CONFLICT") {
        setAttempt(null);
        setNeedsReview(true);
        setConfirmedReview(null);
      }
    } finally {
      flight.current = false;
      onBusy(false);
    }
  }
  async function reload() {
    if (concealed || flight.current) return;
    if (
      (notes || attempt) &&
      !window.confirm(
        text(
          "Discard unsaved progress inputs and inspect the saved history?",
          "Niet-opgeslagen voortgangsinvoer verwerpen en de opgeslagen geschiedenis bekijken?"
        )
      )
    )
      return;
    flight.current = true;
    onBusy(true);
    try {
      const result = await history.refetch();
      if (result.isError) {
        setError("reload_failed_preserved");
        return;
      }
      setAttempt(null);
      setNeedsReview(false);
      setConfirmedReview(null);
      setNotes("");
      setError(null);
      onDirty(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "reload_failed"
      );
    } finally {
      flight.current = false;
      onBusy(false);
    }
  }
  if (concealed)
    return (
      <p role="alert" lang={language}>
        {text(
          "Progress is hidden until this account and candidate can be checked.",
          "Voortgang is verborgen totdat dit account en deze kandidaat kunnen worden gecontroleerd."
        )}
      </p>
    );
  return (
    <section
      aria-label={text("Partnership progress", "Voortgang van de samenwerking")}
      lang={language}
      className="space-y-3 rounded-md border p-3 min-w-0"
    >
      <h3 className="font-semibold">
        {text("Partnership progress", "Voortgang van de samenwerking")}
      </h3>
      <p className="text-sm">
        {text(
          "Your private report, not a verified agreement, legal partnership or the other person's consent. No messages are sent. Opt-outs remain unchanged; record contact restrictions separately.",
          "Je privérapport, geen geverifieerde overeenkomst, juridische samenwerking of toestemming van de andere persoon. Er worden geen berichten verstuurd. Opt-outs blijven ongewijzigd; leg contactbeperkingen afzonderlijk vast."
        )}
      </p>
      <p className="text-sm" lang="en">
        {view?.notice}
      </p>
      <p className="text-xs">
        {text(
          "History is retained. Limits: 50 reports per candidate and 500 per account. Notes stay in this tab until saved; closing unsaved inputs requires confirmation.",
          "De geschiedenis wordt bewaard. Limieten: 50 rapporten per kandidaat en 500 per account. Notities blijven in dit tabblad totdat ze zijn opgeslagen; sluiten met niet-opgeslagen invoer vereist bevestiging."
        )}
      </p>
      {notice ? (
        <p role="status">
          {notice === "replayed"
            ? text(
                "This report was already saved. No duplicate was created.",
                "Dit rapport was al opgeslagen. Er is geen duplicaat aangemaakt."
              )
            : text(
                "Progress recorded. No message was sent or contact restriction changed.",
                "Voortgang vastgelegd. Er is geen bericht verstuurd of contactbeperking gewijzigd."
              )}
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" lang={typeof error === "object" ? "en" : language}>
          {errorMessage}
        </p>
      ) : null}
      {history.isError ? (
        <p role="alert">
          {text(
            "Progress history could not be checked. Refresh before continuing.",
            "De voortgangsgeschiedenis kon niet worden gecontroleerd. Vernieuw voordat je verdergaat."
          )}
        </p>
      ) : null}
      {history.isFetching ? (
        <p role="status">
          {text(
            "Checking progress history…",
            "Voortgangsgeschiedenis controleren…"
          )}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-9 max-w-full whitespace-normal text-center"
        disabled={mutation.isPending || history.isFetching}
        onClick={() => void reload()}
      >
        {text(
          "Reload progress history",
          "Voortgangsgeschiedenis opnieuw laden"
        )}
      </Button>
      {attempt && !mutation.isPending ? (
        <div className="space-y-2">
          <p>
            {text(
              "The save result is uncertain. Retry the same report safely, or reload and inspect history before starting another.",
              "Het opslagresultaat is onzeker. Probeer hetzelfde rapport veilig opnieuw, of laad en controleer de geschiedenis voordat je een ander rapport begint."
            )}
          </p>
          <Button
            className="h-auto min-h-9 max-w-full whitespace-normal text-center"
            disabled={mutation.isPending}
            onClick={() => void execute(attempt)}
          >
            {text(
              "Retry exact progress report",
              "Exact voortgangsrapport opnieuw proberen"
            )}
          </Button>
        </div>
      ) : null}
      {needsReview ? (
        <p role="alert">
          {text(
            "The reviewed record changed. Reload and review it before recording another report.",
            "De beoordeelde registratie is gewijzigd. Laad en beoordeel deze opnieuw voordat je een ander rapport vastlegt."
          )}
        </p>
      ) : null}
      {view && !history.isError ? (
        <>
          <h4 className="font-medium">
            {text("Recorded history", "Vastgelegde geschiedenis")}
          </h4>
          {view.history.length ? (
            <ul className="space-y-3">
              {view.history.map(row => (
                <li key={row.id} className="text-sm break-words">
                  <p>
                    {labels[row.outcome]} —{" "}
                    {text("Recorded here:", "Hier vastgelegd:")}{" "}
                    {recordedDate(row.outcomeDate)}
                  </p>
                  {row.notes ? (
                    <p className="whitespace-pre-wrap">{row.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {text(
                "No progress reports on this page.",
                "Geen voortgangsrapporten op deze pagina."
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {before ? (
              <Button
                variant="outline"
                disabled={history.isFetching || mutation.isPending || !!attempt}
                onClick={() => {
                  setBefore(undefined);
                  setConfirmedReview(null);
                }}
              >
                {text("Newest reports", "Nieuwste rapporten")}
              </Button>
            ) : null}
            {view.nextBeforeId ? (
              <Button
                variant="outline"
                disabled={history.isFetching || mutation.isPending || !!attempt}
                onClick={() => {
                  setBefore(view.nextBeforeId!);
                  setConfirmedReview(null);
                }}
              >
                {text("Older reports", "Oudere rapporten")}
              </Button>
            ) : null}
          </div>
          {!view.assessmentAvailable ? (
            <p>
              {text(
                "Assess this candidate before recording progress.",
                "Beoordeel deze kandidaat voordat je voortgang vastlegt."
              )}
            </p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={event => {
                event.preventDefault();
                if (
                  disabled ||
                  confirmedReview !== view.review ||
                  flight.current
                )
                  return;
                void execute({
                  accountId,
                  prospectId,
                  expectedReview: view.review,
                  outcome,
                  notes,
                  confirmation: true,
                  idempotencyKey: crypto.randomUUID(),
                });
              }}
            >
              <fieldset disabled={disabled} className="space-y-3">
                <Label htmlFor={`progress-outcome-${prospectId}`}>
                  {text(
                    "My reported progress",
                    "Mijn gerapporteerde voortgang"
                  )}
                </Label>
                <select
                  id={`progress-outcome-${prospectId}`}
                  className="w-full border rounded-md p-2 bg-background"
                  value={outcome}
                  onChange={event => {
                    setOutcome(event.target.value as Command["outcome"]);
                    setConfirmedReview(null);
                    onDirty(true);
                  }}
                >
                  {Object.entries(labels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <Label htmlFor={`progress-notes-${prospectId}`}>
                  {text(
                    "Private progress notes (optional)",
                    "Privévoortgangsnotities (optioneel)"
                  )}
                </Label>
                <Textarea
                  id={`progress-notes-${prospectId}`}
                  value={notes}
                  maxLength={2000}
                  onChange={event => {
                    setNotes(event.target.value);
                    setConfirmedReview(null);
                    onDirty(true);
                  }}
                />
                <p className="text-xs">
                  {notes.length}/
                  {text(
                    "2,000 characters. Avoid unnecessary sensitive information. Recorded time is when you save here, not an external event date.",
                    "2.000 tekens. Vermijd onnodige gevoelige informatie. De vastgelegde tijd is het moment waarop je hier opslaat, niet de datum van een externe gebeurtenis."
                  )}
                </p>
                <Label className="flex gap-2 items-start">
                  <input
                    type="checkbox"
                    checked={confirmedReview === view.review}
                    onChange={event => {
                      setConfirmedReview(
                        event.target.checked ? view.review : null
                      );
                      onDirty(true);
                    }}
                  />
                  {text(
                    "I reviewed this candidate, history and report. Record my private progress without changing contact permission.",
                    "Ik heb deze kandidaat, de geschiedenis en dit rapport beoordeeld. Leg mijn privévoortgang vast zonder de contacttoestemming te wijzigen."
                  )}
                </Label>
                <Button
                  type="submit"
                  disabled={disabled || confirmedReview !== view.review}
                >
                  {mutation.isPending
                    ? text("Recording progress…", "Voortgang vastleggen…")
                    : text("Record progress", "Voortgang vastleggen")}
                </Button>
              </fieldset>
            </form>
          )}
        </>
      ) : null}
    </section>
  );
}
