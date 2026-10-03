import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

const reminderStates: Record<string, readonly [string, string]> = {
  draft: ["Draft", "Concept"],
  pending_review: ["Pending review", "Wacht op beoordeling"],
  approved: ["Approved", "Goedgekeurd"],
  manual_action_required: ["Manual action required", "Handmatige actie nodig"],
  confirmed_sent: ["Manual sending confirmed", "Handmatig verzenden bevestigd"],
  responded: ["Response recorded", "Reactie vastgelegd"],
  follow_up_due: ["Follow-up due", "Vervolgactie nodig"],
  closed: ["Closed", "Gesloten"],
  cancelled: ["Cancelled", "Geannuleerd"],
};
export function FollowUpQueue({
  accountId,
  blocked,
  onManage,
}: {
  accountId: number;
  blocked: boolean;
  onManage: (id: number) => void;
}) {
  const { language, text } = useLanguage();
  const locale = language === "nl" ? "nl-NL" : "en-GB";
  const formatDate = (value: string | Date) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? text("Unavailable", "Niet beschikbaar")
      : date.toLocaleString(locale);
  };
  const [filter, setFilter] = useState<"due" | "scheduled" | "all">("due");
  const [page, setPage] = useState(1);
  const query = trpc.criticalPath.outreach.reminders.useQuery(
    { accountId, filter, page, pageSize: 25 },
    {
      enabled: !blocked,
      retry: false,
      refetchInterval: 60000,
      refetchOnMount: "always",
    }
  );
  const data = query.data?.accountId === accountId ? query.data : undefined;
  if (blocked)
    return (
      <p role="alert" lang={language}>
        {text(
          "Verify your current account to view its private reminders.",
          "Bevestig je huidige account om de bijbehorende privéherinneringen te bekijken."
        )}
      </p>
    );
  return (
    <section
      lang={language}
      aria-label={text("Follow-up reminders", "Vervolgherinneringen")}
      className="space-y-4 rounded-xl border p-4"
    >
      <h2 className="text-xl font-semibold">
        {text("Follow-up reminders", "Vervolgherinneringen")}
      </h2>
      <p>
        {text(
          "These are internal reminders, not scheduled messages or email notifications. Archived and opted-out candidates are excluded. Open a conversation to record a response, change its reminder, or close it.",
          "Dit zijn interne herinneringen, geen geplande berichten of e-mailmeldingen. Gearchiveerde kandidaten en kandidaten die geen contact willen, worden uitgesloten. Open een gesprek om een reactie vast te leggen, de herinnering te wijzigen of het gesprek te sluiten."
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="reminder-filter">
          {text("Show reminders", "Herinneringen tonen")}
        </Label>
        <select
          id="reminder-filter"
          className="rounded border bg-background p-2"
          value={filter}
          onChange={event => {
            setFilter(event.target.value as typeof filter);
            setPage(1);
          }}
        >
          <option value="due">{text("Due now", "Nu aan de beurt")}</option>
          <option value="scheduled">{text("Scheduled", "Gepland")}</option>
          <option value="all">
            {text("All reminders", "Alle herinneringen")}
          </option>
        </select>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {text("Refresh reminders", "Herinneringen vernieuwen")}
        </Button>
      </div>
      {query.isError ? (
        <p role="alert">
          {text(
            "Reminders could not be loaded",
            "Herinneringen konden niet worden geladen"
          )}
          : <span lang="en">{query.error.message}</span>.{" "}
          {text(
            "Use Refresh reminders to retry.",
            "Opnieuw proberen: kies Herinneringen vernieuwen."
          )}
        </p>
      ) : query.isFetching ? (
        <p role="status">
          {text("Refreshing reminders…", "Herinneringen vernieuwen…")}
        </p>
      ) : null}
      {!query.isError && data ? (
        <>
          <p className="text-sm">
            {text("As of", "Stand van")} {formatDate(data.asOf)} ·{" "}
            {text(
              "Refreshes every minute while this tab is open. Times use this device's local time zone.",
              "Wordt elke minuut vernieuwd zolang dit tabblad open is. Tijden gebruiken de lokale tijdzone van dit apparaat."
            )}
          </p>
          {data.items.length ? (
            data.items.map(item => (
              <article key={item.id} className="space-y-2 rounded border p-3">
                <p className="break-words font-semibold">
                  {item.name} · {item.platform}
                </p>
                <p>
                  {item.due
                    ? text("Due", "Aan de beurt")
                    : text("Scheduled", "Gepland")}
                  :{" "}
                  {item.followUpAt
                    ? formatDate(item.followUpAt)
                    : text("Unavailable", "Niet beschikbaar")}{" "}
                  ·{" "}
                  {reminderStates[item.state]
                    ? text(...reminderStates[item.state])
                    : text("Unknown status", "Onbekende status")}
                </p>
                <Button
                  variant="outline"
                  disabled={query.isFetching}
                  aria-label={text(
                    `Manage reminder ${item.id}`,
                    `Herinnering ${item.id} beheren`
                  )}
                  onClick={() => onManage(item.id)}
                >
                  {text("View conversation", "Gesprek bekijken")}
                </Button>
              </article>
            ))
          ) : (
            <p>
              {text(
                "No reminders in this view.",
                "Geen herinneringen in deze weergave."
              )}
            </p>
          )}
          <nav
            aria-label={text("Reminder pages", "Herinneringspagina's")}
            className="flex flex-wrap items-center gap-3"
          >
            <Button
              variant="outline"
              disabled={query.isFetching || page <= 1}
              onClick={() => setPage(value => value - 1)}
            >
              {text("Previous reminders", "Vorige herinneringen")}
            </Button>
            <p>
              {text("Page", "Pagina")} {page} {text("of", "van")}{" "}
              {Math.max(1, Math.ceil(data.total / 25))} · {data.total}{" "}
              {text("reminders", "herinneringen")}
            </p>
            <Button
              variant="outline"
              disabled={query.isFetching || page * 25 >= data.total}
              onClick={() => setPage(value => value + 1)}
            >
              {text("Next reminders", "Volgende herinneringen")}
            </Button>
          </nav>
        </>
      ) : null}
    </section>
  );
}
