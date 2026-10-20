import { useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Item =
  inferRouterOutputs<AppRouter>["criticalPath"]["outreach"]["list"][number];
type Action = "review" | "approve" | "prepare" | "copy" | "open" | "confirm";
type Handlers = Record<Action, (id: number) => Promise<unknown>>;

function QueueRecord({
  item,
  accountId,
  blocked,
  pending,
  handlers,
  onManage,
}: {
  item: Item;
  accountId: number;
  blocked: boolean;
  pending: boolean;
  handlers: Handlers;
  onManage: (id: number) => void;
}) {
  const { language, text } = useLanguage();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [sentReview, setSentReview] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string } | "failed" | null>(
    null
  );
  const [notice, setNotice] = useState<Action | null>(null);
  const identity = JSON.stringify({
    id: item.outreach.id,
    owner: item.outreach.userId,
    body: item.outreach.body,
    subject: item.outreach.subject,
    state: item.outreach.state,
    updatedAt: item.outreach.updatedAt,
    destination: item.outreach.destinationUrl,
  });
  const unavailable =
    blocked ||
    pending ||
    busy ||
    item.outreach.userId !== accountId ||
    item.prospect.userId !== accountId;
  const allowed = item.actionPolicy?.allowed === true;
  const state = item.outreach.state;
  const labels = {
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
  async function act(action: Action) {
    if (unavailable || inFlight.current) return;
    // Confirmation records an already completed external action, including after
    // suppression. It never authorizes further contact with an opted-out person.
    if (
      action === "confirm"
        ? state !== "manual_action_required" || sentReview !== identity
        : !allowed
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await handlers[action](item.outreach.id);
      setNotice(action);
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "failed"
      );
    } finally {
      setSentReview(null);
      inFlight.current = false;
      setBusy(false);
    }
  }
  if (item.outreach.userId !== accountId || item.prospect.userId !== accountId)
    return null;
  return (
    <article
      aria-label={`${text("Outreach record", "Berichtrecord")} ${item.outreach.id}`}
      className="min-w-0 rounded-xl border border-white/10 p-4"
      aria-busy={busy}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold">{item.prospect.name}</p>
          <Badge variant="outline">{labels[state]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label={`${text("Manage outreach", "Bericht beheren")} ${item.outreach.id}`}
            disabled={unavailable}
            onClick={() => {
              if (!inFlight.current && !unavailable) onManage(item.outreach.id);
            }}
          >
            {text("View / manage", "Bekijken / beheren")}
          </Button>
          {state === "draft" ? (
            <Button
              size="sm"
              disabled={unavailable || !allowed}
              onClick={() => void act("review")}
            >
              {text("Submit review", "Ter beoordeling indienen")}
            </Button>
          ) : null}
          {state === "pending_review" ? (
            <Button
              size="sm"
              disabled={unavailable || !allowed}
              onClick={() => void act("approve")}
            >
              {text("Approve", "Goedkeuren")}
            </Button>
          ) : null}
          {state === "approved" ? (
            <Button
              size="sm"
              disabled={unavailable || !allowed}
              onClick={() => void act("prepare")}
            >
              {text(
                "Prepare manual send",
                "Handmatige verzending voorbereiden"
              )}
            </Button>
          ) : null}
          {state === "manual_action_required" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={unavailable || !allowed}
                onClick={() => void act("copy")}
              >
                {text("Copy message", "Bericht kopiëren")}
              </Button>
              {allowed && item.outreach.destinationUrl ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unavailable}
                  onClick={() => void act("open")}
                >
                  {text("Open destination", "Bestemming openen")}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {!allowed ? (
        <p role="status" className="mt-3 text-sm text-amber-300">
          {item.actionPolicy?.reason ? (
            <span lang="en">{item.actionPolicy.reason} </span>
          ) : (
            text(
              "Action eligibility is not available. Reload before preparing outreach. ",
              "Actiegeschiktheid is niet beschikbaar. Laad opnieuw voordat je contact voorbereidt. "
            )
          )}
          {text(
            "Historical text remains readable; no new send is authorized.",
            "Historische tekst blijft leesbaar; nieuwe verzending is niet toegestaan."
          )}
        </p>
      ) : null}
      <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-black/30 p-4 font-sans text-sm leading-relaxed text-neutral-300">
        {item.outreach.body}
      </pre>
      {state === "manual_action_required" ? (
        <div className="mt-4 space-y-3 rounded-md border border-white/10 p-3">
          <p className="text-sm text-neutral-300">
            {text(
              "Preparation, copying and opening a destination do not send this message. Send it yourself only where the current rules and contact eligibility permit. Record completion only after you actually sent this exact message outside the tool. This record is your declaration, not proof of delivery.",
              "Voorbereiden, kopiëren en een bestemming openen verzenden dit bericht niet. Verzend het zelf, alleen waar de actuele regels en contactgeschiktheid dit toestaan. Leg voltooiing pas vast nadat je dit exacte bericht daadwerkelijk buiten de tool hebt verzonden. Dit record is jouw verklaring, geen bewijs van aflevering."
            )}
          </p>
          <Label className="flex items-start gap-3 leading-relaxed">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0"
              disabled={unavailable}
              checked={sentReview === identity}
              onChange={event =>
                setSentReview(event.target.checked ? identity : null)
              }
            />
            {text(
              "I actually sent this exact message outside this tool. Record that completed action only; do not send anything now.",
              "Ik heb dit exacte bericht daadwerkelijk buiten deze tool verzonden. Leg alleen die voltooide actie vast; verzend nu niets."
            )}
          </Label>
          <Button
            size="sm"
            className="h-auto min-h-9 max-w-full whitespace-normal text-center"
            disabled={unavailable || sentReview !== identity}
            onClick={() => void act("confirm")}
          >
            {text("I sent this", "Ik heb dit verzonden")}
          </Button>
        </div>
      ) : null}
      {busy ? (
        <p role="status" className="mt-3 text-sm">
          {text("Processing this action…", "Deze actie verwerken…")}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-sm">
          {notice === "copy"
            ? text(
                "Message copied. Nothing was sent.",
                "Bericht gekopieerd. Er is niets verzonden."
              )
            : notice === "open"
              ? text(
                  "Reviewed destination opened. Nothing was sent by this tool.",
                  "Beoordeelde bestemming geopend. Deze tool heeft niets verzonden."
                )
              : notice === "confirm"
                ? text(
                    "Your external-send declaration was recorded. Delivery was not verified.",
                    "Je verklaring over externe verzending is vastgelegd. Aflevering is niet geverifieerd."
                  )
                : text(
                    "Workflow state updated. Nothing was sent.",
                    "Werkstap bijgewerkt. Er is niets verzonden."
                  )}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          lang={typeof error === "object" ? "en" : language}
          className="mt-3 break-words text-sm"
        >
          {typeof error === "object"
            ? error.message
            : text(
                "Action failed. Inspect the current record before retrying; nothing was sent by this tool.",
                "Actie mislukt. Bekijk het actuele record voordat je opnieuw probeert; deze tool heeft niets verzonden."
              )}
        </p>
      ) : null}
    </article>
  );
}

export function OutreachReviewQueue({
  items,
  accountId,
  blocked,
  pending,
  handlers,
  onManage,
}: {
  items: Item[] | undefined;
  accountId: number;
  blocked: boolean;
  pending: boolean;
  handlers: Handlers;
  onManage: (id: number) => void;
}) {
  const { language, text } = useLanguage();
  return (
    <Card
      role="region"
      aria-label={text(
        "Review and assisted-send queue",
        "Beoordeling en handmatige contactvoorbereiding"
      )}
      lang={language}
    >
      <CardHeader>
        <CardTitle>
          {text(
            "Review and assisted-send queue",
            "Beoordeling en handmatige contactvoorbereiding"
          )}
        </CardTitle>
        <CardDescription>
          {text(
            "State changes are validated and written to your audit log. This tool never sends messages; an external-send declaration is not delivery proof.",
            "Werkstappen worden gecontroleerd en vastgelegd in je auditlog. Deze tool verzendt nooit berichten; een verklaring over externe verzending bewijst geen aflevering."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocked ? (
          <p role="status">
            {text(
              "The reviewed account or current queue could not be confirmed. Wait for a successful refresh before acting.",
              "Het beoordeelde account of de actuele wachtrij kon niet worden bevestigd. Wacht op een geslaagde vernieuwing voordat je handelt."
            )}
          </p>
        ) : null}
        {items?.map(item => (
          <QueueRecord
            key={`${accountId}:${item.outreach.id}`}
            item={item}
            accountId={accountId}
            blocked={blocked}
            pending={pending}
            handlers={handlers}
            onManage={onManage}
          />
        ))}
        {items?.length === 0 ? (
          <p className="py-12 text-center text-neutral-400">
            {text(
              "Draft a prospect message to start the queue.",
              "Schrijf een kandidaatbericht om de wachtrij te starten."
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
