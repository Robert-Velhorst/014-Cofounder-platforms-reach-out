import { useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isOpenConversation,
  type ConversationCommand,
} from "@shared/outreach-conversation";
type Review =
  inferRouterOutputs<AppRouter>["criticalPath"]["outreach"]["details"];

export function ConversationControls({
  review,
  blocked,
  onBusy,
  onChanged,
}: {
  review: Review;
  blocked: boolean;
  onBusy: (busy: boolean) => void;
  onChanged: () => Promise<unknown>;
}) {
  const { language, text } = useLanguage();
  const formatDate = (value: string | Date) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? text("Unavailable", "Niet beschikbaar")
      : date.toLocaleString(language === "nl" ? "nl-NL" : "en-GB");
  };
  const mutation = trpc.criticalPath.outreach.conversation.useMutation();
  const inFlight = useRef(false);
  const [attempt, setAttempt] = useState<ConversationCommand | null>(null);
  const [responseReview, setResponseReview] = useState<string | null>(null);
  const [closeReview, setCloseReview] = useState<string | null>(null);
  const [date, setDate] = useState({ value: "", revision: "" });
  const [error, setError] = useState<
    | { kind: "server"; message: string }
    | { kind: "save_unknown" | "reload_failed" | "invalid_date" }
    | null
  >(null);
  const [notice, setNotice] = useState<"replayed" | "updated" | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const record = review.outreach;
  if (
    !isOpenConversation(record.state) ||
    !record.confirmedSentAt ||
    record.closedAt
  )
    return null;
  const suppressed =
    !!review.prospect.archivedAt ||
    review.prospect.consentStatus === "opted_out";
  const disabled = blocked || mutation.isPending || !!attempt || needsReview;
  function base() {
    return {
      id: record.id,
      accountId: record.userId,
      expectedRevision: review.revision,
      idempotencyKey: crypto.randomUUID(),
    };
  }
  async function execute(command: ConversationCommand) {
    if (blocked || inFlight.current) return;
    inFlight.current = true;
    onBusy(true);
    setError(null);
    setNotice(null);
    setAttempt(command);
    try {
      const result = await mutation.mutateAsync(command);
      setAttempt(null);
      setResponseReview(null);
      setCloseReview(null);
      setDate({ value: "", revision: "" });
      setNotice(result.replayed ? "replayed" : "updated");
      await onChanged();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? { kind: "server", message: caught.message }
          : { kind: "save_unknown" }
      );
      if ((caught as { data?: { code?: string } })?.data?.code === "CONFLICT") {
        setAttempt(null);
        setNeedsReview(true);
      }
    } finally {
      inFlight.current = false;
      onBusy(false);
    }
  }
  async function refresh() {
    if (blocked || inFlight.current) return;
    inFlight.current = true;
    onBusy(true);
    try {
      await onChanged();
      setAttempt(null);
      setNeedsReview(false);
      setError(null);
      setResponseReview(null);
      setCloseReview(null);
      setDate({ value: "", revision: "" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? { kind: "server", message: caught.message }
          : { kind: "reload_failed" }
      );
    } finally {
      inFlight.current = false;
      onBusy(false);
    }
  }
  return (
    <section
      lang={language}
      aria-label={text(
        "Conversation history and reminders",
        "Gespreksgeschiedenis en herinneringen"
      )}
      className="space-y-4 rounded-md border p-3"
    >
      <h3 className="font-semibold">
        {text("Conversation and follow-up", "Gesprek en vervolgactie")}
      </h3>
      <p className="text-sm">
        {text(
          "Internal records only. No messages or notifications are sent. A reminder never re-approves this message for sending.",
          "Alleen interne registraties. Er worden geen berichten of meldingen verzonden. Een herinnering keurt dit bericht nooit opnieuw goed voor verzending."
        )}
      </p>
      <p className="text-sm">
        {text("Sent confirmation recorded", "Verzendbevestiging vastgelegd")}:{" "}
        {formatDate(record.confirmedSentAt)}
        {record.responseRecordedAt
          ? ` · ${text("Response recorded", "Reactie vastgelegd")}: ${formatDate(record.responseRecordedAt)}`
          : ""}
      </p>
      <p className="text-sm">
        {record.followUpAt
          ? `${text("Reminder", "Herinnering")}: ${formatDate(record.followUpAt)}`
          : text("No reminder scheduled.", "Geen herinnering gepland.")}
      </p>
      {notice ? (
        <p role="status">
          {notice === "replayed"
            ? text(
                "This action was already saved. Showing the latest conversation.",
                "Deze actie was al opgeslagen. Het meest recente gesprek wordt getoond."
              )
            : text(
                "Conversation updated. No message or notification was sent.",
                "Gesprek bijgewerkt. Er is geen bericht of melding verzonden."
              )}
        </p>
      ) : null}
      {error ? (
        <p role="alert">
          {error.kind === "server" ? (
            <span lang="en">{error.message}</span>
          ) : error.kind === "save_unknown" ? (
            text(
              "Could not confirm whether this action was saved.",
              "Het is niet bevestigd of deze actie is opgeslagen."
            )
          ) : error.kind === "reload_failed" ? (
            text(
              "Could not reload the conversation.",
              "Het gesprek kon niet opnieuw worden geladen."
            )
          ) : (
            text(
              "Choose a valid local date and time.",
              "Kies een geldige lokale datum en tijd."
            )
          )}
        </p>
      ) : null}
      {(!mutation.isPending && attempt) || needsReview ? (
        <div className="space-y-2">
          <p className="text-sm">
            {attempt
              ? text(
                  "The save result is uncertain. Retry this exact action safely, or reload and inspect the current record before starting another action.",
                  "Het opslagresultaat is onzeker. Probeer veilig precies dezelfde actie opnieuw, of laad opnieuw en controleer de huidige registratie voordat je een andere actie begint."
                )
              : text(
                  "Reload and review the changed record before continuing.",
                  "Laad opnieuw en beoordeel de gewijzigde registratie voordat je verdergaat."
                )}
          </p>
          {attempt ? (
            <Button
              disabled={blocked || mutation.isPending}
              onClick={() => void execute(attempt)}
            >
              {text(
                "Retry last conversation action",
                "Laatste gespreksactie opnieuw proberen"
              )}
            </Button>
          ) : null}
          <Button
            variant="outline"
            disabled={blocked || mutation.isPending}
            onClick={() => void refresh()}
          >
            {text("Reload conversation", "Gesprek opnieuw laden")}
          </Button>
        </div>
      ) : null}
      <fieldset disabled={disabled} className="space-y-4">
        {!record.responseRecordedAt ? (
          <div className="space-y-2">
            <Label className="flex items-start gap-2 leading-relaxed">
              <input
                type="checkbox"
                checked={responseReview === review.revision}
                onChange={event =>
                  setResponseReview(
                    event.target.checked ? review.revision : null
                  )
                }
              />
              {text(
                "I received a response outside this tool",
                "Ik heb buiten deze tool een reactie ontvangen"
              )}
            </Label>
            <Button
              disabled={disabled || responseReview !== review.revision}
              onClick={() =>
                void execute({
                  ...base(),
                  action: "record_response",
                  confirmed: true,
                })
              }
            >
              {text("Record response", "Reactie vastleggen")}
            </Button>
            <p className="text-sm">
              {text(
                "Records your acknowledgment now, not the original reply time or content, and clears the existing reminder.",
                "Legt je bevestiging nu vast, niet het oorspronkelijke tijdstip of de inhoud van de reactie, en wist de bestaande herinnering."
              )}
            </p>
          </div>
        ) : null}
        {suppressed ? (
          <p className="text-sm">
            {text(
              "New reminders are unavailable for archived or opted-out candidates. You can still record history, cancel a reminder, or close the conversation.",
              "Nieuwe herinneringen zijn niet beschikbaar voor gearchiveerde kandidaten of kandidaten die geen contact willen. Je kunt nog wel geschiedenis vastleggen, een herinnering annuleren of het gesprek sluiten."
            )}
          </p>
        ) : (
          <form
            className="space-y-2"
            onSubmit={event => {
              event.preventDefault();
              if (disabled || date.revision !== review.revision) return;
              const at = new Date(date.value);
              if (!Number.isFinite(at.getTime())) {
                setError({ kind: "invalid_date" });
                return;
              }
              void execute({
                ...base(),
                action: "schedule_reminder",
                followUpAt: at.toISOString(),
              });
            }}
          >
            <Label htmlFor={`reminder-date-${record.id}`}>
              {text("Reminder date and time", "Herinneringsdatum en -tijd")}
            </Label>
            <Input
              id={`reminder-date-${record.id}`}
              type="datetime-local"
              required
              value={date.value}
              onChange={event =>
                setDate({
                  value: event.target.value,
                  revision: review.revision,
                })
              }
            />
            <p className="text-sm">
              {text("Your time zone", "Je tijdzone")}:{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}.{" "}
              {text(
                "Choose a future time within 366 days. Check the saved reminder time after saving.",
                "Kies een toekomstig tijdstip binnen 366 dagen. Controleer na het opslaan het opgeslagen tijdstip van de herinnering."
              )}
            </p>
            {date.value && date.revision !== review.revision ? (
              <p role="alert">
                {text(
                  "The record changed. Re-enter the reminder time after reviewing the latest details.",
                  "De registratie is gewijzigd. Voer het herinneringstijdstip opnieuw in nadat je de meest recente gegevens hebt gecontroleerd."
                )}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={
                disabled || !date.value || date.revision !== review.revision
              }
            >
              {text("Save reminder", "Herinnering opslaan")}
            </Button>
          </form>
        )}
        {record.followUpAt ? (
          <Button
            variant="outline"
            onClick={() =>
              void execute({ ...base(), action: "cancel_reminder" })
            }
          >
            {text("Cancel reminder", "Herinnering annuleren")}
          </Button>
        ) : null}
        <div className="space-y-2">
          <Label className="flex items-start gap-2 leading-relaxed">
            <input
              type="checkbox"
              checked={closeReview === review.revision}
              onChange={event =>
                setCloseReview(event.target.checked ? review.revision : null)
              }
            />
            {text(
              "Close this conversation and retain its history",
              "Gesprek sluiten en de geschiedenis bewaren"
            )}
          </Label>
          <Button
            variant="outline"
            disabled={disabled || closeReview !== review.revision}
            onClick={() =>
              void execute({ ...base(), action: "close", confirmed: true })
            }
          >
            {text("Close conversation", "Gesprek sluiten")}
          </Button>
          <p className="text-sm">
            {text(
              "Clears the reminder and ends this record’s workflow. It does not delete history, retract contact, or opt the candidate out.",
              "Wist de herinnering en beëindigt het werkproces van deze registratie. Dit verwijdert geen geschiedenis, trekt contact niet terug en meldt de kandidaat niet af."
            )}
          </p>
        </div>
      </fieldset>
    </section>
  );
}
