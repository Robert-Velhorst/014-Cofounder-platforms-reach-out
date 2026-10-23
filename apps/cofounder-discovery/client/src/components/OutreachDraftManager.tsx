import { useEffect, useRef, useState } from "react";
import { ConversationControls } from "@/components/ConversationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { outreachReviseSchema } from "@shared/outreach-revision";

type Review =
  inferRouterOutputs<AppRouter>["criticalPath"]["outreach"]["details"];

function RevisionEditor({
  review,
  blocked,
  concealed,
  onDirty,
  onBusy,
  onCancel,
  onSaved,
}: {
  review: Review;
  blocked: boolean;
  concealed: boolean;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  onCancel: () => void;
  onSaved: (id: number) => void;
}) {
  const { language, text } = useLanguage();
  const [body, setBody] = useState(review.outreach.body);
  const [subject, setSubject] = useState(review.outreach.subject ?? "");
  const [authorship, setAuthorship] = useState(false);
  const [notSent, setNotSent] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<
    { message: string } | "save_failed" | null
  >(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const mutation = trpc.criticalPath.outreach.revise.useMutation();
  const dirty =
    body !== review.outreach.body ||
    subject !== (review.outreach.subject ?? "");
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function changed(nextBody: string, nextSubject: string) {
    setBody(nextBody);
    setSubject(nextSubject);
    setAuthorship(false);
    setNotSent(false);
    onDirty(
      nextBody !== review.outreach.body ||
        nextSubject !== (review.outreach.subject ?? "")
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      blocked ||
      concealed ||
      inFlight.current ||
      conflict ||
      !dirty ||
      !authorship ||
      !notSent
    )
      return;
    const payload = {
      id: review.outreach.id,
      accountId: review.outreach.userId,
      expectedRevision: review.revision,
      body: body.trim(),
      subject: subject.trim() || null,
      declaration: {
        humanOriginal: true as const,
        rulesReviewed: true as const,
      },
      notSent: true as const,
    };
    const signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: `revise:${crypto.randomUUID()}` };
    const parsed = outreachReviseSchema.safeParse({
      ...payload,
      idempotencyKey: attempt.current.key,
    });
    if (!parsed.success) {
      setError({
        message: parsed.error.issues.map(issue => issue.message).join("; "),
      });
      return;
    }
    inFlight.current = true;
    onBusy(true);
    setError(null);
    try {
      const result = await mutation.mutateAsync(parsed.data);
      onDirty(false);
      onSaved(result.outreach.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "save_failed"
      );
      if ((caught as { data?: { code?: string } })?.data?.code === "CONFLICT")
        setConflict(true);
    } finally {
      inFlight.current = false;
      onBusy(false);
    }
  }
  // Keep the captured review/draft mounted across transient account failures,
  // while exposing no private DOM when the account cannot be verified.
  if (concealed) return null;
  return (
    <form
      onSubmit={submit}
      aria-label={text(
        "Revise unsent outreach",
        "Niet-verzonden bericht herzien"
      )}
      lang={language}
      className="space-y-4 rounded-md border p-4"
    >
      <h3 className="font-semibold">
        {text("New message revision", "Nieuwe berichtversie")}
      </h3>
      <p className="text-sm text-muted-foreground">
        {text(
          "Saving preserves the old text as a cancelled version and creates a new draft with no approval. Review and preparation must be repeated. Each version counts toward storage capacity.",
          "Opslaan bewaart de oude tekst als geannuleerde versie en maakt een nieuw, niet-goedgekeurd concept. Beoordeling en voorbereiding moeten opnieuw worden uitgevoerd. Elke versie telt mee voor de opslagcapaciteit."
        )}
      </p>
      <div className="space-y-2">
        <Label htmlFor="revision-subject">
          {text("Revised subject (optional)", "Herzien onderwerp (optioneel)")}
        </Label>
        <Input
          id="revision-subject"
          value={subject}
          maxLength={255}
          disabled={blocked || mutation.isPending}
          onChange={event => changed(body, event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="revision-body">
          {text("Revised message", "Herzien bericht")}
        </Label>
        <Textarea
          id="revision-body"
          value={body}
          maxLength={10000}
          required
          className="min-h-40"
          disabled={blocked || mutation.isPending}
          onChange={event => changed(event.target.value, subject)}
        />
      </div>
      <Label className="flex items-start gap-3 leading-relaxed">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0"
          checked={authorship}
          disabled={blocked || mutation.isPending}
          onChange={event => setAuthorship(event.target.checked)}
        />
        {text(
          "This revised text is my original writing. I reviewed the current source rules, eligibility and data-use rights.",
          "Deze herziene tekst is door mijzelf geschreven. Ik heb de actuele bronregels, geschiktheid en rechten voor gegevensgebruik beoordeeld."
        )}
      </Label>
      <Label className="flex items-start gap-3 leading-relaxed">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0"
          checked={notSent}
          disabled={blocked || mutation.isPending}
          onChange={event => setNotSent(event.target.checked)}
        />
        {text(
          "I have not sent this message externally. Any old copied text or opened destination must not be used.",
          "Ik heb dit bericht niet extern verzonden. Eerder gekopieerde tekst of een eerder geopende bestemming mag niet worden gebruikt."
        )}
      </Label>
      <p className="text-xs text-muted-foreground">
        {text(
          "Nothing is sent or retracted. If you already sent the original outside this app, close this view and record that fact first. Unsaved changes and retry keys stay only in this tab.",
          "Er wordt niets verzonden of ingetrokken. Heb je het oorspronkelijke bericht al buiten deze app verzonden? Sluit dit venster en leg dat eerst vast. Niet-opgeslagen wijzigingen en sleutels voor opnieuw proberen blijven alleen in dit tabblad."
        )}
      </p>
      {error ? (
        <p
          role="alert"
          lang={typeof error === "object" ? "en" : language}
          className="break-words"
        >
          {typeof error === "object"
            ? error.message
            : text(
                "Could not save revision. Your text is retained.",
                "De herziene versie kon niet worden opgeslagen. Je tekst blijft behouden."
              )}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={
            blocked ||
            mutation.isPending ||
            conflict ||
            !dirty ||
            !authorship ||
            !notSent
          }
        >
          {mutation.isPending
            ? text("Saving revision…", "Versie opslaan…")
            : text("Save new revision", "Nieuwe versie opslaan")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={onCancel}
        >
          {conflict
            ? text(
                "Discard revision and reload",
                "Wijzigingen verwerpen en opnieuw laden"
              )
            : text("Cancel editing", "Bewerken annuleren")}
        </Button>
      </div>
    </form>
  );
}

export function OutreachDraftManager({
  id,
  accountId,
  accountBlocked,
  onClose,
  onNavigate,
  onChanged,
}: {
  id: number;
  accountId: number;
  accountBlocked: boolean;
  onClose: () => void;
  onNavigate: (id: number) => void;
  onChanged: () => void;
}) {
  const { language, text } = useLanguage();
  function recordedDate(value: Date | string | null) {
    if (!value) return text("Not recorded", "Niet vastgelegd");
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
      return text("Unavailable", "Niet beschikbaar");
    return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
  const stateLabels = {
    draft: text("Draft", "Concept"),
    pending_review: text("Pending review", "In afwachting van beoordeling"),
    approved: text("Approved", "Goedgekeurd"),
    manual_action_required: text(
      "Manual action required",
      "Handmatige actie vereist"
    ),
    confirmed_sent: text("Confirmed sent", "Verzending bevestigd"),
    responded: text("Responded", "Reactie vastgelegd"),
    follow_up_due: text("Follow-up due", "Vervolgactie nodig"),
    closed: text("Closed", "Gesloten"),
    cancelled: text("Cancelled", "Geannuleerd"),
  };
  const detail = trpc.criticalPath.outreach.details.useQuery(
    { id, accountId },
    { enabled: !accountBlocked, retry: false, refetchOnMount: "always" }
  );
  const [editing, setEditing] = useState<Review | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [cancelReview, setCancelReview] = useState<string | null>(null);
  const [error, setError] = useState<
    { message: string } | "cancel_failed" | null
  >(null);
  const [notice, setNotice] = useState<"cancelled" | null>(null);
  const inFlight = useRef(false),
    dirty = useRef(false);
  const cancelMutation = trpc.criticalPath.outreach.cancel.useMutation();
  const current = detail.data;
  const wrongOwner =
    !!current &&
    (current.outreach.id !== id ||
      current.outreach.userId !== accountId ||
      current.prospect.userId !== accountId);
  const concealed = accountBlocked || wrongOwner;
  const blocked = concealed || detail.isError || detail.isFetching || !current;
  const busy = editBusy || cancelMutation.isPending;
  function discard() {
    return (
      !dirty.current ||
      window.confirm(
        text(
          "Discard unsaved outreach revision text?",
          "Niet-opgeslagen wijzigingen aan dit bericht verwerpen?"
        )
      )
    );
  }
  function close() {
    if (!inFlight.current && discard()) onClose();
  }
  function navigate(nextId: number) {
    if (!inFlight.current && discard()) onNavigate(nextId);
  }
  function cancelEditing() {
    if (inFlight.current || !discard()) return;
    dirty.current = false;
    setEditing(null);
    void detail.refetch();
  }
  async function cancel(event: React.FormEvent) {
    event.preventDefault();
    if (
      blocked ||
      inFlight.current ||
      editing ||
      !current?.canChange ||
      cancelReview !== current.revision
    )
      return;
    inFlight.current = true;
    setError(null);
    setNotice(null);
    try {
      await cancelMutation.mutateAsync({
        id,
        accountId,
        expectedRevision: current.revision,
        notSent: true,
      });
      setCancelReview(null);
      setNotice("cancelled");
      onChanged();
      await detail.refetch();
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "cancel_failed"
      );
      setCancelReview(null);
      void detail.refetch();
    } finally {
      inFlight.current = false;
    }
  }
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) close();
      }}
    >
      <DialogContent
        lang={language}
        closeLabel={text("Close", "Sluiten")}
        className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!busy}
        onEscapeKeyDown={event => {
          if (inFlight.current) event.preventDefault();
        }}
        onInteractOutside={event => {
          if (inFlight.current) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {text("Manage outreach", "Bericht en contact beheren")}
          </DialogTitle>
          <DialogDescription>
            {text(
              "Inspect versions, manage conversation reminders, or revise and cancel unsent outreach. This tool does not send messages or retract external contact.",
              "Bekijk versies, beheer gespreksherinneringen of herzie en annuleer niet-verzonden berichten. Deze tool verzendt geen berichten en trekt extern contact niet in."
            )}
          </DialogDescription>
        </DialogHeader>
        {editing && !blocked && current?.replacementId ? (
          <div role="alert" className="space-y-2 rounded-md border p-3">
            <p>
              {text(
                "A replacement already exists for this version. Your last save may have succeeded despite the error. Inspect the replacement before making further changes. Your unsaved text is still retained here.",
                "Voor deze versie bestaat al een vervanging. Je laatste opslag kan ondanks de fout zijn gelukt. Bekijk de vervanging voordat je verdere wijzigingen maakt. Je niet-opgeslagen tekst blijft hier behouden."
              )}
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => navigate(current.replacementId!)}
            >
              {text(
                "Inspect saved replacement",
                "Opgeslagen vervanging bekijken"
              )}
            </Button>
          </div>
        ) : null}
        {editing ? (
          <RevisionEditor
            review={editing}
            concealed={concealed}
            blocked={
              blocked || !current?.canChange || !current.revisionPolicy.allowed
            }
            onDirty={value => {
              dirty.current = value;
            }}
            onBusy={value => {
              inFlight.current = value;
              setEditBusy(value);
            }}
            onCancel={cancelEditing}
            onSaved={nextId => {
              onChanged();
              onNavigate(nextId);
            }}
          />
        ) : null}
        {concealed ? (
          <p role="alert">
            {text(
              "The account could not be verified for this outreach. Private details and actions are hidden until the reviewed account is available.",
              "Het account voor dit bericht kon niet worden geverifieerd. Privégegevens en acties blijven verborgen totdat het beoordeelde account beschikbaar is."
            )}
          </p>
        ) : (
          <>
            {detail.isError ? (
              <div role="alert" className="space-y-2">
                <p lang="en">{detail.error.message}</p>
                <Button
                  variant="outline"
                  disabled={busy || detail.isFetching}
                  onClick={() => void detail.refetch()}
                >
                  {text(
                    "Retry outreach details",
                    "Berichtgegevens opnieuw laden"
                  )}
                </Button>
              </div>
            ) : null}
            {detail.isFetching ? (
              <p role="status">
                {text("Refreshing outreach…", "Berichtgegevens vernieuwen…")}
              </p>
            ) : null}
            {current ? (
              <div className="space-y-4 min-w-0">
                {notice ? (
                  <p role="status">
                    {text(
                      "Draft cancelled. No message was sent or retracted.",
                      "Concept geannuleerd. Er is geen bericht verzonden of ingetrokken."
                    )}
                  </p>
                ) : null}
                {error ? (
                  <p
                    role="alert"
                    lang={typeof error === "object" ? "en" : language}
                  >
                    {typeof error === "object"
                      ? error.message
                      : text(
                          "Could not cancel this draft. Retry safely.",
                          "Dit concept kon niet worden geannuleerd. Je kunt het veilig opnieuw proberen."
                        )}
                  </p>
                ) : null}
                <h2 className="text-lg font-semibold">
                  {text("Outreach", "Bericht")} #{current.outreach.id}
                </h2>
                <p className="break-words">
                  {current.prospect.name} ·{" "}
                  {stateLabels[current.outreach.state]}
                </p>
                {current.outreach.subject ? (
                  <p className="break-words">
                    {text("Subject", "Onderwerp")}: {current.outreach.subject}
                  </p>
                ) : null}
                <pre className="whitespace-pre-wrap break-words rounded-md border p-3 font-sans text-sm">
                  {current.outreach.body}
                </pre>
                <p className="text-sm" lang="en">
                  {current.revisionPolicy.reason}
                </p>
                {current.outreach.state === "closed" ? (
                  <div role="status" className="space-y-1 text-sm">
                    <p>
                      {text(
                        "This conversation is closed. Its history is retained.",
                        "Dit gesprek is gesloten. De geschiedenis blijft bewaard."
                      )}
                    </p>
                    <p>
                      {text(
                        "Sent confirmation recorded",
                        "Verzendbevestiging vastgelegd"
                      )}
                      : {recordedDate(current.outreach.confirmedSentAt)}
                    </p>
                    <p>
                      {text("Response recorded", "Reactie vastgelegd")}:{" "}
                      {recordedDate(current.outreach.responseRecordedAt)}
                    </p>
                    <p>
                      {text("Closed", "Gesloten")}:{" "}
                      {recordedDate(current.outreach.closedAt)}
                    </p>
                  </div>
                ) : null}
                <ConversationControls
                  review={current}
                  blocked={blocked}
                  onBusy={value => {
                    inFlight.current = value;
                    setEditBusy(value);
                  }}
                  onChanged={async () => {
                    onChanged();
                    const refreshed = await detail.refetch();
                    if (refreshed.error) throw refreshed.error;
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {current.outreach.revisesId ? (
                    <Button
                      variant="outline"
                      disabled={busy}
                      aria-label={`${text("View previous version", "Vorige versie bekijken")} ${current.outreach.revisesId}`}
                      onClick={() => navigate(current.outreach.revisesId!)}
                    >
                      {text("Previous version", "Vorige versie")} #
                      {current.outreach.revisesId}
                    </Button>
                  ) : null}
                  {current.replacementId ? (
                    <Button
                      variant="outline"
                      disabled={busy}
                      aria-label={`${text("View replacement", "Vervanging bekijken")} ${current.replacementId}`}
                      onClick={() => navigate(current.replacementId!)}
                    >
                      {text("Replacement", "Vervanging")} #
                      {current.replacementId}
                    </Button>
                  ) : null}
                </div>
                {!current.canChange ? (
                  <p className="text-sm">
                    {text(
                      "This historical or cancelled record cannot be revised or cancelled again. Its text and evidence remain available.",
                      "Dit historische of geannuleerde record kan niet opnieuw worden herzien of geannuleerd. De tekst en bewijsgegevens blijven beschikbaar."
                    )}
                  </p>
                ) : !editing ? (
                  <>
                    <Button
                      variant="outline"
                      disabled={
                        blocked || busy || !current.revisionPolicy.allowed
                      }
                      onClick={() => {
                        if (!inFlight.current) {
                          setEditing(current);
                          setCancelReview(null);
                          setError(null);
                        }
                      }}
                    >
                      {text("Revise message", "Bericht herzien")}
                    </Button>
                    <form
                      onSubmit={cancel}
                      className="space-y-3 rounded-md border p-3"
                    >
                      <p className="text-sm">
                        {text(
                          "Cancellation preserves this record and prevents later preparation or confirmation through its ID. It is available even if the candidate is archived or opted out.",
                          "Annuleren bewaart dit record en voorkomt latere voorbereiding of bevestiging via dit ID. Dit kan ook als de kandidaat is gearchiveerd of geen contact meer wil."
                        )}
                      </p>
                      <Label className="flex items-start gap-3 leading-relaxed">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0"
                          checked={cancelReview === current.revision}
                          disabled={blocked || busy}
                          onChange={event =>
                            setCancelReview(
                              event.target.checked ? current.revision : null
                            )
                          }
                        />
                        {text(
                          "I have not sent this message externally. Cancel this unsent draft and retain its history.",
                          "Ik heb dit bericht niet extern verzonden. Annuleer dit niet-verzonden concept en bewaar de geschiedenis."
                        )}
                      </Label>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={
                          blocked || busy || cancelReview !== current.revision
                        }
                      >
                        {cancelMutation.isPending
                          ? text("Cancelling…", "Annuleren…")
                          : text(
                              "Cancel unsent draft",
                              "Niet-verzonden concept annuleren"
                            )}
                      </Button>
                    </form>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
