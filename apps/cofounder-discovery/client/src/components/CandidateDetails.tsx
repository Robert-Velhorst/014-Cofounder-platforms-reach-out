import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CandidateEditor, type CandidateReview } from "./CandidateEditor";
import { PartnershipProgress } from "./PartnershipProgress";

export function CandidateDetails({
  id,
  accountId,
  accountBlocked,
  onClose,
  onChanged,
}: {
  id: number;
  accountId: number;
  accountBlocked: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { language, text } = useLanguage();
  function dateLabel(value: Date | string | null) {
    if (!value) return text("Not recorded", "Niet geregistreerd");
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? text("Unrecognized date", "Onherkenbare datum")
      : new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
  }
  function listLabel(value: unknown) {
    if (value === null || value === undefined)
      return text("Not recorded", "Niet geregistreerd");
    if (!Array.isArray(value) || !value.every(item => typeof item === "string"))
      return text(
        "Unrecognized stored list; original data is preserved.",
        "Onherkenbare opgeslagen lijst; de oorspronkelijke gegevens blijven behouden."
      );
    return value.join(", ") || text("Not recorded", "Niet geregistreerd");
  }
  const detail = trpc.criticalPath.prospects.details.useQuery(
    { id, accountId },
    {
      enabled: !accountBlocked,
      retry: false,
      refetchOnMount: "always",
    }
  );
  const mutation = trpc.criticalPath.prospects.optOut.useMutation();
  const archiveMutation = trpc.criticalPath.prospects.archive.useMutation();
  const restoreMutation = trpc.criticalPath.prospects.restore.useMutation();
  const [editing, setEditing] = useState<CandidateReview | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const dirty = useRef(false);
  const progressDirty = useRef(false);
  const [progressBusy, setProgressBusy] = useState(false);
  const [archiveReviewed, setArchiveReviewed] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    | "Profile corrections saved."
    | "Candidate restored. Contact restrictions are unchanged."
    | "Candidate archived. No data was deleted."
    | null
  >(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<
    { message: string } | "archive_failed" | "opt_out_failed" | null
  >(null);
  const inFlight = useRef(false);
  const row = detail.data?.prospect;
  const wrongOwner =
    row !== undefined && (row.id !== id || row.userId !== accountId);
  const blocked =
    accountBlocked || wrongOwner || detail.isError || detail.isFetching || !row;
  const optedOut = saved || row?.consentStatus === "opted_out";
  const busy =
    mutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    editBusy ||
    progressBusy;
  function close() {
    if (inFlight.current || progressBusy) return;
    if (
      (dirty.current || progressDirty.current) &&
      !window.confirm(
        text(
          "Discard unsaved candidate corrections or progress inputs?",
          "Niet-opgeslagen kandidaatcorrecties of voortgangsinvoer verwerpen?"
        )
      )
    )
      return;
    onClose();
  }
  function cancelEditing() {
    if (inFlight.current) return;
    if (
      dirty.current &&
      !window.confirm(
        text(
          "Discard unsaved candidate corrections and reload the latest record?",
          "Niet-opgeslagen kandidaatcorrecties verwerpen en de nieuwste registratie laden?"
        )
      )
    )
      return;
    dirty.current = false;
    setEditing(null);
    void detail.refetch();
  }
  async function changeArchive(event: React.FormEvent) {
    event.preventDefault();
    if (
      blocked ||
      inFlight.current ||
      editing ||
      !detail.data ||
      archiveReviewed !== detail.data.revision
    )
      return;
    inFlight.current = true;
    setError(null);
    setNotice(null);
    try {
      const command = {
        id,
        accountId,
        confirmed: true as const,
        expectedRevision: detail.data.revision,
      };
      if (row?.archivedAt) await restoreMutation.mutateAsync(command);
      else await archiveMutation.mutateAsync(command);
      setArchiveReviewed(null);
      setNotice(
        row?.archivedAt
          ? "Candidate restored. Contact restrictions are unchanged."
          : "Candidate archived. No data was deleted."
      );
      onChanged();
      await detail.refetch();
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "archive_failed"
      );
      setArchiveReviewed(null);
      void detail.refetch();
    } finally {
      inFlight.current = false;
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (blocked || inFlight.current || editing || optedOut || !acknowledged)
      return;
    inFlight.current = true;
    setError(null);
    try {
      await mutation.mutateAsync({ id, accountId, confirmed: true });
      setSaved(true);
      setAcknowledged(false);
      onChanged();
      void detail.refetch();
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "opt_out_failed"
      );
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
          if (inFlight.current || progressBusy) event.preventDefault();
        }}
        onInteractOutside={event => {
          if (inFlight.current || progressBusy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {text("Candidate details", "Kandidaatdetails")}
          </DialogTitle>
          <DialogDescription>
            {text(
              "Private candidate data, recorded source evidence and contact status. Closing this view preserves your workspace inputs.",
              "Privégegevens van de kandidaat, geregistreerd bronbewijs en contactstatus. Bij het sluiten van dit venster blijft je werkruimte-invoer behouden."
            )}
          </DialogDescription>
        </DialogHeader>
        {editing ? (
          <CandidateEditor
            review={editing}
            blocked={blocked}
            concealed={accountBlocked || wrongOwner}
            onDirty={value => {
              dirty.current = value;
            }}
            onBusy={value => {
              inFlight.current = value;
              setEditBusy(value);
            }}
            onCancel={cancelEditing}
            onSaved={async () => {
              setNotice("Profile corrections saved.");
              onChanged();
              await detail.refetch();
              setEditing(null);
            }}
          />
        ) : null}
        {accountBlocked || wrongOwner ? (
          <p role="alert">
            {text(
              "The account could not be verified for this candidate. Close this view and refresh your account before continuing.",
              "Het account kon niet worden geverifieerd voor deze kandidaat. Sluit dit venster en vernieuw je account voordat je doorgaat."
            )}
          </p>
        ) : (
          <>
            {detail.isError ? (
              <div role="alert" className="space-y-2">
                <p lang="en">{detail.error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => void detail.refetch()}
                  disabled={detail.isFetching || busy}
                >
                  {text("Retry candidate", "Kandidaat opnieuw laden")}
                </Button>
              </div>
            ) : null}
            {detail.isFetching ? (
              <p role="status">
                {text("Refreshing candidate…", "Kandidaat wordt vernieuwd…")}
              </p>
            ) : null}
            {row ? (
              <div className="space-y-6 min-w-0">
                {notice ? (
                  <p role="status">
                    {notice === "Profile corrections saved."
                      ? text(notice, "Profielcorrecties opgeslagen.")
                      : notice ===
                          "Candidate restored. Contact restrictions are unchanged."
                        ? text(
                            notice,
                            "Kandidaat hersteld. Contactbeperkingen zijn ongewijzigd."
                          )
                        : text(
                            notice,
                            "Kandidaat gearchiveerd. Er zijn geen gegevens verwijderd."
                          )}
                  </p>
                ) : null}
                {!editing ? (
                  <Button
                    lang={language}
                    variant="outline"
                    disabled={blocked || busy}
                    onClick={() => {
                      if (!blocked && !inFlight.current && detail.data) {
                        setNotice(null);
                        setArchiveReviewed(null);
                        setEditing(detail.data);
                      }
                    }}
                  >
                    {text("Edit profile", "Profiel bewerken")}
                  </Button>
                ) : null}
                <section
                  className="space-y-2"
                  aria-label={text("Candidate profile", "Kandidaatprofiel")}
                >
                  <h2 className="text-xl font-semibold break-words">
                    {row.name}
                  </h2>
                  <p className="break-words">
                    {[row.title, row.location].filter(Boolean).join(" · ") ||
                      text(
                        "No role or location recorded",
                        "Geen rol of locatie geregistreerd"
                      )}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {row.bio ||
                      text(
                        "No biography recorded",
                        "Geen biografie geregistreerd"
                      )}
                  </p>
                  <dl className="text-sm space-y-2">
                    <div>
                      <dt className="font-medium">
                        {text("Skills", "Vaardigheden")}
                      </dt>
                      <dd className="break-words">{listLabel(row.skills)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">
                        {text("Industries", "Sectoren")}
                      </dt>
                      <dd className="break-words">
                        {listLabel(row.industries)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">
                        {text("Experience / company", "Ervaring / bedrijf")}
                      </dt>
                      <dd className="break-words">
                        {[row.experience, row.currentCompany]
                          .filter(Boolean)
                          .join(" · ") ||
                          text("Not recorded", "Niet geregistreerd")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">
                        {text("Looking for / stage", "Zoekt / fase")}
                      </dt>
                      <dd className="break-words">
                        {[listLabel(row.lookingFor), row.startupStage]
                          .filter(Boolean)
                          .join(" · ") ||
                          text("Not recorded", "Niet geregistreerd")}
                      </dd>
                    </div>
                  </dl>
                  {row.archivedAt ? (
                    <p className="text-sm">
                      {text("Archived", "Gearchiveerd")}:{" "}
                      {dateLabel(row.archivedAt)}.{" "}
                      {text(
                        "Viewing this record does not restore it.",
                        "Het bekijken van deze registratie herstelt deze niet."
                      )}
                    </p>
                  ) : null}
                </section>
                <div lang={language}>
                  <PartnershipProgress
                    key={`${accountId}:${id}`}
                    accountId={accountId}
                    prospectId={id}
                    blocked={
                      blocked ||
                      editing !== null ||
                      editBusy ||
                      mutation.isPending ||
                      archiveMutation.isPending ||
                      restoreMutation.isPending
                    }
                    onBusy={setProgressBusy}
                    onDirty={value => {
                      progressDirty.current = value;
                    }}
                  />
                </div>
                <section
                  className="space-y-3"
                  aria-label={text("Candidate archive", "Kandidaatarchief")}
                >
                  <h3 className="font-semibold">
                    {text("Archive status", "Archiefstatus")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {text(
                      "Archiving hides this candidate from the active list and blocks new qualification and assisted contact actions. It does not delete records or free storage capacity. Restoring keeps all opt-outs and does not send anything.",
                      "Archiveren verbergt deze kandidaat in de actieve lijst en blokkeert nieuwe beoordelingen en ondersteunde contactacties. Het verwijdert geen registraties en maakt geen opslagruimte vrij. Herstellen behoudt alle opt-outs en verstuurt niets."
                    )}
                  </p>
                  <form onSubmit={changeArchive} className="space-y-3">
                    <Label className="flex items-start gap-3 leading-relaxed">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 shrink-0"
                        checked={
                          archiveReviewed !== null &&
                          archiveReviewed === detail.data?.revision
                        }
                        disabled={blocked || busy || editing !== null}
                        onChange={event =>
                          setArchiveReviewed(
                            event.target.checked
                              ? (detail.data?.revision ?? null)
                              : null
                          )
                        }
                      />
                      {row.archivedAt
                        ? text(
                            "Restore this candidate to my active list without changing contact restrictions.",
                            "Herstel deze kandidaat in mijn actieve lijst zonder contactbeperkingen te wijzigen."
                          )
                        : text(
                            "Archive this candidate and keep their records in my workspace.",
                            "Archiveer deze kandidaat en behoud de registraties in mijn werkruimte."
                          )}
                    </Label>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={
                        blocked ||
                        busy ||
                        editing !== null ||
                        !archiveReviewed ||
                        archiveReviewed !== detail.data?.revision
                      }
                    >
                      {archiveMutation.isPending || restoreMutation.isPending
                        ? text(
                            "Saving archive status…",
                            "Archiefstatus wordt opgeslagen…"
                          )
                        : row.archivedAt
                          ? text("Restore candidate", "Kandidaat herstellen")
                          : text("Archive candidate", "Kandidaat archiveren")}
                    </Button>
                  </form>
                </section>
                <section
                  className="space-y-2"
                  aria-label={text("Source record", "Bronregistratie")}
                >
                  <h3 className="font-semibold">
                    {text("Source record", "Bronregistratie")}
                  </h3>
                  <dl className="text-sm space-y-2">
                    <div>
                      <dt className="font-medium">
                        {text("Source / intake method", "Bron / invoermethode")}
                      </dt>
                      <dd className="break-words">
                        {row.platform ||
                          text("Not recorded", "Niet geregistreerd")}{" "}
                        / {row.sourceKind}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">
                        {text(
                          "Recorded profile URL",
                          "Geregistreerde profiel-URL"
                        )}
                      </dt>
                      <dd className="break-all">
                        {row.profileUrl ||
                          text("Not recorded", "Niet geregistreerd")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">
                        {text(
                          "Added to this workspace",
                          "Toegevoegd aan deze werkruimte"
                        )}
                      </dt>
                      <dd>{dateLabel(row.importedAt)}</dd>
                    </div>
                  </dl>
                  <p lang="en" className="text-sm">
                    {detail.data?.sourcePolicy.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {text(
                      "A source match is not permission to copy platform data, contact someone or automate a platform. URLs are shown as records, not outbound actions.",
                      "Een bronovereenkomst geeft geen toestemming om platformgegevens te kopiëren, iemand te contacteren of een platform te automatiseren. URL's worden als registraties getoond, niet als uitgaande acties."
                    )}
                  </p>
                  {row.importProvenance ? (
                    <div className="space-y-2 rounded-md border p-3 text-sm">
                      <h4 className="font-medium">
                        {text(
                          "Recorded import declaration",
                          "Geregistreerde importverklaring"
                        )}
                      </h4>
                      <p>
                        {text(
                          "Data declared as supplied directly by the person. Processing rights were asserted by account",
                          "Volgens de verklaring zijn de gegevens rechtstreeks door de persoon verstrekt. Verwerkingsrechten zijn verklaard door account"
                        )}{" "}
                        {row.importProvenance.actorId};{" "}
                        {text(
                          "they are not independently verified.",
                          "ze zijn niet onafhankelijk geverifieerd."
                        )}
                      </p>
                      <dl className="space-y-2">
                        <div>
                          <dt className="font-medium">
                            {text("Evidence reference", "Bewijsreferentie")}
                          </dt>
                          <dd className="break-all">
                            {row.importProvenance.evidenceReference}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">
                            {text("Declared at", "Verklaard op")}
                          </dt>
                          <dd>{dateLabel(row.importProvenance.declaredAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium">
                            {text("Source at import", "Bron bij import")}
                          </dt>
                          <dd className="break-words">
                            {row.importProvenance.sourceId}
                          </dd>
                        </div>
                      </dl>
                      <p className="text-xs text-muted-foreground">
                        {text(
                          "Supporting evidence is retained by the importer, not uploaded here. This declaration does not establish outreach consent.",
                          "Ondersteunend bewijs wordt door de importeur bewaard, niet hier geüpload. Deze verklaring stelt geen contacttoestemming vast."
                        )}
                      </p>
                      <details>
                        <summary className="cursor-pointer">
                          {text(
                            "Import receipt identifiers",
                            "Identificatoren van het importbewijs"
                          )}
                        </summary>
                        <dl className="space-y-2 pt-2 text-xs">
                          <div>
                            <dt>{text("Policy version", "Beleidsversie")}</dt>
                            <dd className="break-all">
                              {row.importProvenance.version}
                            </dd>
                          </div>
                          <div>
                            <dt>{text("Import key", "Importsleutel")}</dt>
                            <dd className="break-all">
                              {row.importProvenance.importKey}
                            </dd>
                          </div>
                          <div>
                            <dt>{text("Request hash", "Verzoekhash")}</dt>
                            <dd className="break-all">
                              {row.importProvenance.requestHash}
                            </dd>
                          </div>
                        </dl>
                      </details>
                    </div>
                  ) : (
                    <p className="rounded-md border p-3 text-sm">
                      {detail.data?.provenanceStatus === "invalid"
                        ? text(
                            "The stored provenance could not be validated for this account. It is not presented as a verified declaration. Operator review is required.",
                            "De opgeslagen herkomst kon niet worden gevalideerd voor dit account. Deze wordt niet als geverifieerde verklaring gepresenteerd. Beoordeling door de beheerder is vereist."
                          )
                        : text(
                            "No import declaration was recorded for this candidate. Older data has not been retroactively verified.",
                            "Voor deze kandidaat is geen importverklaring geregistreerd. Oudere gegevens zijn niet achteraf geverifieerd."
                          )}
                    </p>
                  )}
                </section>
                <section
                  className="space-y-3"
                  aria-label={text("Contact permission", "Contacttoestemming")}
                >
                  <h3 className="font-semibold">
                    {text("Contact status", "Contactstatus")}
                  </h3>
                  <p className="font-medium">
                    {optedOut
                      ? text("Do not contact", "Niet contacteren")
                      : row.consentStatus === "legitimate_interest"
                        ? text(
                            "Legitimate interest recorded (not independently verified)",
                            "Gerechtvaardigd belang geregistreerd (niet onafhankelijk geverifieerd)"
                          )
                        : row.consentStatus === "opted_in"
                          ? text(
                              "Opt-in recorded (not independently verified)",
                              "Opt-in geregistreerd (niet onafhankelijk geverifieerd)"
                            )
                          : text(
                              "Permission not established",
                              "Toestemming niet vastgesteld"
                            )}
                  </p>
                  {saved ? (
                    <p role="status">
                      {text(
                        "Opt-out recorded. New qualification, drafts and assisted contact actions are blocked for this candidate.",
                        "Opt-out geregistreerd. Nieuwe beoordelingen, concepten en ondersteunde contactacties zijn geblokkeerd voor deze kandidaat."
                      )}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {text(
                      "Recording an opt-out keeps this candidate and their source evidence. It does not retract text already copied or contact already made outside this app. Re-enabling contact is not available in this view.",
                      "Een opt-out registreren behoudt deze kandidaat en het bronbewijs. Het trekt geen eerder gekopieerde tekst of contact buiten deze app terug. Contact opnieuw inschakelen is niet beschikbaar in dit venster."
                    )}
                  </p>
                  {error ? (
                    <p
                      role="alert"
                      lang={typeof error === "object" ? "en" : language}
                    >
                      {typeof error === "object"
                        ? error.message
                        : error === "archive_failed"
                          ? text(
                              "Could not change archive status. Retry safely.",
                              "De archiefstatus kon niet worden gewijzigd. Probeer veilig opnieuw."
                            )
                          : text(
                              "Could not record the opt-out. Retry safely.",
                              "De opt-out kon niet worden geregistreerd. Probeer veilig opnieuw."
                            )}
                    </p>
                  ) : null}
                  {!optedOut ? (
                    <form onSubmit={submit} className="space-y-3">
                      <Label className="flex items-start gap-3 leading-relaxed">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0"
                          checked={acknowledged}
                          disabled={blocked || busy || editing !== null}
                          onChange={event =>
                            setAcknowledged(event.target.checked)
                          }
                        />
                        {text(
                          "This candidate must not be contacted. Record an opt-out in my workspace.",
                          "Deze kandidaat mag niet worden gecontacteerd. Registreer een opt-out in mijn werkruimte."
                        )}
                      </Label>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={
                          blocked || busy || editing !== null || !acknowledged
                        }
                      >
                        {mutation.isPending
                          ? text("Recording…", "Wordt geregistreerd…")
                          : text("Record opt-out", "Opt-out registreren")}
                      </Button>
                    </form>
                  ) : null}
                  <div className="text-sm space-y-2">
                    <h4 className="font-medium">
                      {text(
                        "Recorded opt-out events",
                        "Geregistreerde opt-outgebeurtenissen"
                      )}
                    </h4>
                    {detail.data?.optOutEvents.length ? (
                      <ul className="list-disc pl-5">
                        {detail.data.optOutEvents.map(event => (
                          <li key={event.id}>{dateLabel(event.createdAt)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        {text(
                          "No separate opt-out event recorded. An imported contact status may already contain an opt-out.",
                          "Geen afzonderlijke opt-outgebeurtenis geregistreerd. Een geïmporteerde contactstatus kan al een opt-out bevatten."
                        )}
                      </p>
                    )}
                  </div>
                </section>
                <section
                  className="space-y-2 text-sm"
                  aria-label={text(
                    "Candidate change history",
                    "Wijzigingsgeschiedenis van de kandidaat"
                  )}
                >
                  <h3 className="font-semibold">
                    {text(
                      "Recent candidate changes",
                      "Recente kandidaatwijzigingen"
                    )}
                  </h3>
                  <p className="text-muted-foreground">
                    {text(
                      "Up to 20 successful recorded changes, newest first. Corrections record field names, not previous personal values. This is not a full version history or an undo function.",
                      "Maximaal 20 succesvol geregistreerde wijzigingen, de nieuwste eerst. Correcties registreren veldnamen, niet eerdere persoonlijke waarden. Dit is geen volledige versiegeschiedenis of functie om wijzigingen ongedaan te maken."
                    )}
                  </p>
                  {detail.data?.history?.length ? (
                    <ul className="list-disc space-y-1 pl-5">
                      {detail.data.history.map(event => (
                        <li key={event.id}>
                          {dateLabel(event.createdAt)} —{" "}
                          {event.action === "prospect.edit"
                            ? `${text("Profile corrected", "Profiel gecorrigeerd")}${event.fields.length ? ` (${event.fields.join(", ")})` : ""}`
                            : event.action === "prospect.archive"
                              ? text(
                                  "Candidate archived",
                                  "Kandidaat gearchiveerd"
                                )
                              : event.action === "prospect.restore"
                                ? text(
                                    "Candidate restored",
                                    "Kandidaat hersteld"
                                  )
                                : text(
                                    "Opt-out recorded",
                                    "Opt-out geregistreerd"
                                  )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      {text(
                        "No local candidate changes recorded.",
                        "Geen lokale kandidaatwijzigingen geregistreerd."
                      )}
                    </p>
                  )}
                </section>
              </div>
            ) : !detail.isFetching && !detail.isError ? (
              <p role="status">
                {text("Loading candidate…", "Kandidaat wordt geladen…")}
              </p>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
