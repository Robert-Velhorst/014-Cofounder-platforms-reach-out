import { useEffect, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  candidateIntakeSchema,
  type CandidateIntake as IntakeInput,
} from "@shared/candidate-intake";
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

type Preview =
  inferRouterOutputs<AppRouter>["criticalPath"]["prospects"]["previewIntake"];
type Result = inferRouterOutputs<AppRouter>["criticalPath"]["prospects"]["add"];
const fields = [
  ["name", "Candidate name", 255],
  ["title", "Role / title", 255],
  ["location", "Location", 255],
  ["bio", "Background", 10000],
  ["skills", "Skills (one per line)", 5050],
  ["experience", "Experience", 50],
  ["industries", "Industries (one per line)", 5050],
  ["currentCompany", "Current company", 255],
  ["lookingFor", "Looking for (one per line)", 5050],
  ["startupStage", "Startup stage", 50],
  ["platform", "Source platform ID or name", 50],
  ["profileUrl", "Profile URL (optional)", 500],
  ["evidenceReference", "Evidence reference", 120],
] as const;
const listFields = new Set(["skills", "industries", "lookingFor"]);
const dutchFields: Record<(typeof fields)[number][0], string> = {
  name: "Naam kandidaat",
  title: "Rol of titel",
  location: "Locatie",
  bio: "Achtergrond",
  skills: "Vaardigheden (één per regel)",
  experience: "Ervaring",
  industries: "Sectoren (één per regel)",
  currentCompany: "Huidig bedrijf",
  lookingFor: "Zoekt (één per regel)",
  startupStage: "Startupfase",
  platform: "Bronplatform-ID of naam",
  profileUrl: "Profiel-URL (optioneel)",
  evidenceReference: "Bewijsreferentie",
};
const initialFields = Object.fromEntries(
  fields.map(([key]) => [key, key === "platform" ? "manual" : ""])
);

export function CandidateIntake({
  accountId,
  accountBlocked,
  onClose,
  onOpen,
  onChanged,
}: {
  accountId: number;
  accountBlocked: boolean;
  onClose: () => void;
  onOpen: (id: number) => void;
  onChanged: () => void;
}) {
  const { language, text } = useLanguage();
  const [values, setValues] = useState(initialFields);
  const [consent, setConsent] = useState("unknown");
  const [rights, setRights] = useState(false);
  const [review, setReview] = useState<{
    input: IntakeInput;
    result: Preview;
  } | null>(null);
  const [resolution, setResolution] = useState<number | "new" | null>(null);
  const [distinct, setDistinct] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<
    { message: string } | "preview_failed" | "save_failed" | null
  >(null);
  const [result, setResult] = useState<Result | null>(null);
  const preview = trpc.criticalPath.prospects.previewIntake.useMutation();
  const add = trpc.criticalPath.prospects.add.useMutation();
  const inFlight = useRef(false),
    attempt = useRef<{ signature: string; key: string } | null>(null);
  const busy = preview.isPending || add.isPending;
  const dirty =
    !result &&
    (rights ||
      consent !== "unknown" ||
      fields.some(([key]) => values[key] !== initialFields[key]));
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function close() {
    if (
      !inFlight.current &&
      (!dirty ||
        window.confirm(
          text(
            "Discard this unsaved intake? If a save was uncertain, inspect existing candidates before starting again.",
            "Deze niet-opgeslagen invoer verwerpen? Als opslaan onzeker was, controleer dan bestaande kandidaten voordat je opnieuw begint."
          )
        ))
    )
      onClose();
  }
  function change(key: string, value: string) {
    setValues(previous => ({ ...previous, [key]: value }));
    setRights(false);
    setReview(null);
    setError(null);
  }
  async function doPreview(event?: React.FormEvent) {
    event?.preventDefault();
    if (accountBlocked || inFlight.current || !rights) return;
    const candidate = Object.fromEntries(
      fields
        .filter(([key]) => key !== "evidenceReference")
        .map(([key]) => [
          key,
          listFields.has(key)
            ? values[key]
                .split(/\r?\n/)
                .map(item => item.trim())
                .filter(Boolean)
            : values[key].trim() || (key === "profileUrl" ? null : undefined),
        ])
    );
    const parsed = candidateIntakeSchema.safeParse({
      accountId,
      candidate: { ...candidate, consentStatus: consent },
      declaration: {
        collectionMethod: "direct_from_person",
        rightsConfirmed: rights,
        evidenceReference: values.evidenceReference,
      },
    });
    if (!parsed.success) {
      setError({
        message: parsed.error.issues.map(issue => issue.message).join("; "),
      });
      return;
    }
    inFlight.current = true;
    setError(null);
    setResolution(null);
    setDistinct(false);
    try {
      const checked = await preview.mutateAsync(parsed.data);
      setReview({ input: parsed.data, result: checked });
      setConflict(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "preview_failed"
      );
    } finally {
      inFlight.current = false;
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (
      accountBlocked ||
      inFlight.current ||
      !review ||
      conflict ||
      resolution === null ||
      (resolution === "new" &&
        (!distinct ||
          review.result.hasMore ||
          review.result.exactProfileId !== null))
    )
      return;
    const payload = {
      ...review.input,
      reviewToken: review.result.reviewToken,
      resolution:
        resolution === "new"
          ? {
              kind: "create_new" as const,
              distinctPersonConfirmed: true as const,
            }
          : { kind: "use_existing" as const, candidateId: resolution },
    };
    const signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: `intake:${crypto.randomUUID()}` };
    inFlight.current = true;
    setError(null);
    try {
      const saved = await add.mutateAsync({
        ...payload,
        idempotencyKey: attempt.current.key,
      });
      setResult(saved);
      onChanged();
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "save_failed"
      );
      if ((caught as { data?: { code?: string } })?.data?.code === "CONFLICT")
        setConflict(true);
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
            {text("Add candidate", "Kandidaat toevoegen")}
          </DialogTitle>
          <DialogDescription>
            {text(
              "Record data supplied directly by a person, review possible duplicates, then save or reuse an existing record. Nothing is sent.",
              "Leg gegevens vast die een persoon rechtstreeks heeft verstrekt, controleer mogelijke duplicaten en sla daarna op of gebruik een bestaande kandidaat. Er wordt niets verzonden."
            )}
          </DialogDescription>
        </DialogHeader>
        {accountBlocked ? (
          <p role="alert">
            {text(
              "Private intake details are hidden until the reviewed account is available. Your input is retained in this tab.",
              "Privégegevens zijn verborgen totdat het gecontroleerde account beschikbaar is. Je invoer blijft in dit tabblad behouden."
            )}
          </p>
        ) : (
          <>
            {error ? (
              <p role="alert" className="break-words">
                {typeof error === "object" ? (
                  <span lang="en">{error.message}</span>
                ) : error === "preview_failed" ? (
                  text(
                    "Could not preview candidates. Your input is retained.",
                    "Kandidaten konden niet worden gecontroleerd. Je invoer blijft behouden."
                  )
                ) : (
                  text(
                    "Could not save intake. Retry the same submission.",
                    "De invoer kon niet worden opgeslagen. Probeer dezelfde inzending opnieuw."
                  )
                )}
              </p>
            ) : null}
            {result ? (
              <div className="space-y-3">
                <p role="status">
                  {result.created
                    ? text(
                        "Candidate saved. Nothing was sent.",
                        "Kandidaat opgeslagen. Er is niets verzonden."
                      )
                    : text(
                        "Existing candidate selected. No profile, evidence or contact status was changed.",
                        "Bestaande kandidaat geselecteerd. Profiel, bewijs en contactstatus zijn niet gewijzigd."
                      )}
                </p>
                <Button onClick={() => onOpen(result.candidateId)}>
                  {text("Open candidate", "Kandidaat openen")} #
                  {result.candidateId}
                </Button>
              </div>
            ) : review ? (
              <form onSubmit={save} className="space-y-4">
                <h2 className="font-semibold">
                  {text(
                    "Review possible duplicates",
                    "Mogelijke duplicaten controleren"
                  )}
                </h2>
                <p className="break-words">
                  {text("Intake", "Invoer")}: {review.input.candidate.name} ·{" "}
                  {review.input.candidate.platform} ·{" "}
                  {review.input.candidate.consentStatus}
                </p>
                <p className="text-sm">
                  {text(
                    "Names are suggestions, not proof of identity. URL comparison follows stored database matching; aliases and different URLs may be missed. Reusing a record never overwrites its evidence, archive or opt-out status.",
                    "Namen zijn suggesties, geen identiteitsbewijs. URL-vergelijking volgt de opgeslagen databasevergelijking; aliassen en andere URL’s kunnen worden gemist. Hergebruik overschrijft nooit bewijs, archiefstatus of opt-out."
                  )}
                </p>
                {review.result.exactProfileId ? (
                  <p role="status">
                    {text(
                      "This profile already exists. Reuse candidate",
                      "Dit profiel bestaat al. Gebruik kandidaat"
                    )}{" "}
                    #{review.result.exactProfileId}
                    {text(
                      "; do not substitute a name-only match.",
                      "; kies geen andere kandidaat alleen op basis van de naam."
                    )}
                  </p>
                ) : null}
                {review.result.candidates.length === 0 ? (
                  <p>
                    {text(
                      "No matching candidates found. This is not proof that the person is new.",
                      "Geen overeenkomende kandidaten gevonden. Dit bewijst niet dat de persoon nieuw is."
                    )}
                  </p>
                ) : (
                  review.result.candidates.map(row => (
                    <Label
                      key={row.id}
                      className="flex items-start gap-3 rounded-md border p-3 leading-relaxed"
                    >
                      <input
                        type="radio"
                        name="intake-resolution"
                        className="mt-1 shrink-0"
                        aria-label={`${text("Use existing candidate", "Bestaande kandidaat gebruiken")} ${row.id}`}
                        checked={resolution === row.id}
                        disabled={
                          busy ||
                          conflict ||
                          (review.result.exactProfileId !== null &&
                            review.result.exactProfileId !== row.id)
                        }
                        onChange={() => {
                          setResolution(row.id);
                          setDistinct(false);
                        }}
                      />
                      <span className="min-w-0 break-words">
                        #{row.id} {row.name}
                        <br />
                        {row.title} {row.location}
                        <br />
                        {row.platform} · {row.consentStatus}
                        {row.archivedAt
                          ? text(" · archived", " · gearchiveerd")
                          : ""}
                        <br />
                        {row.profileUrl ??
                          text("No profile URL", "Geen profiel-URL")}{" "}
                        ·{" "}
                        {row.matchKind === "profile_url"
                          ? text("matching profile", "overeenkomend profiel")
                          : text("matching name", "overeenkomende naam")}
                      </span>
                    </Label>
                  ))
                )}
                {review.result.hasMore ? (
                  <p role="alert">
                    {text(
                      "More than 20 possible duplicates match. Reuse a reviewed candidate or refine the input; adding another is blocked.",
                      "Meer dan 20 mogelijke duplicaten gevonden. Gebruik een gecontroleerde kandidaat of verfijn de invoer; een nieuwe toevoegen is geblokkeerd."
                    )}
                  </p>
                ) : null}
                <Label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="intake-resolution"
                    aria-label={text(
                      "Create a separate candidate",
                      "Een afzonderlijke kandidaat maken"
                    )}
                    checked={resolution === "new"}
                    disabled={
                      busy ||
                      conflict ||
                      review.result.hasMore ||
                      review.result.exactProfileId !== null
                    }
                    onChange={() => {
                      setResolution("new");
                      setDistinct(false);
                    }}
                  />
                  {text(
                    "Create a separate candidate",
                    "Een afzonderlijke kandidaat maken"
                  )}
                </Label>
                {resolution === "new" ? (
                  <Label className="flex items-start gap-3 leading-relaxed">
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={distinct}
                      disabled={busy || conflict}
                      onChange={event => setDistinct(event.target.checked)}
                    />
                    {text(
                      "I reviewed the suggestions and confirm this is a separate person, not a replacement for an existing opt-out or archived record.",
                      "Ik heb de suggesties gecontroleerd en bevestig dat dit een andere persoon is, geen vervanging voor een bestaande opt-out of gearchiveerde kandidaat."
                    )}
                  </Label>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {text(
                    "Input and retry identity stay only in this tab. If a save result is uncertain, retry unchanged before editing or starting again. A new record uses capacity; reusing does not grant permission to contact.",
                    "Invoer en herhaalidentiteit blijven alleen in dit tabblad. Als het opslagresultaat onzeker is, probeer ongewijzigd opnieuw voordat je bewerkt of opnieuw begint. Een nieuwe kandidaat gebruikt capaciteit; hergebruik geeft geen contacttoestemming."
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={
                      busy ||
                      conflict ||
                      resolution === null ||
                      (resolution === "new" && !distinct)
                    }
                  >
                    {add.isPending
                      ? text("Saving intake…", "Invoer opslaan…")
                      : text(
                          "Confirm intake decision",
                          "Invoerbeslissing bevestigen"
                        )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void doPreview()}
                  >
                    {preview.isPending
                      ? text("Refreshing…", "Vernieuwen…")
                      : text(
                          "Refresh duplicate review",
                          "Duplicatencontrole vernieuwen"
                        )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setReview(null);
                      setRights(false);
                      setError(null);
                    }}
                  >
                    {text("Edit input", "Invoer bewerken")}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={doPreview} className="space-y-4">
                <p className="text-sm">
                  {text(
                    "No scraping, copied member profiles or platform exports. Use a reviewed source ID/name, or manual without a platform URL. Keep supporting evidence yourself; enter only an opaque reference, not correspondence or secrets. Blank optional profile fields stay empty.",
                    "Geen scraping, gekopieerde ledenprofielen of platformexports. Gebruik een gecontroleerd bron-ID of naam, of manual zonder platform-URL. Bewaar ondersteunend bewijs zelf; voer alleen een niet-inhoudelijke referentie in, geen correspondentie of geheimen. Lege optionele profielvelden blijven leeg."
                  )}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map(([key, label, limit]) => (
                    <div
                      key={key}
                      className={
                        key === "bio" ? "space-y-2 sm:col-span-2" : "space-y-2"
                      }
                    >
                      <Label htmlFor={`intake-${key}`}>
                        {text(label, dutchFields[key])}
                      </Label>
                      {key === "bio" || listFields.has(key) ? (
                        <Textarea
                          id={`intake-${key}`}
                          maxLength={limit}
                          value={values[key]}
                          disabled={busy}
                          onChange={event => change(key, event.target.value)}
                        />
                      ) : (
                        <Input
                          id={`intake-${key}`}
                          maxLength={limit}
                          value={values[key]}
                          required={[
                            "name",
                            "platform",
                            "evidenceReference",
                          ].includes(key)}
                          disabled={busy}
                          onChange={event => change(key, event.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-consent">
                    {text(
                      "Recorded contact status",
                      "Vastgelegde contactstatus"
                    )}
                  </Label>
                  <select
                    id="intake-consent"
                    className="w-full rounded-md border bg-background p-2"
                    value={consent}
                    disabled={busy}
                    onChange={event => {
                      setConsent(event.target.value);
                      setRights(false);
                    }}
                  >
                    <option value="unknown">
                      {text(
                        "Unknown — no assumption of permission",
                        "Onbekend — geen toestemming verondersteld"
                      )}
                    </option>
                    <option value="legitimate_interest">
                      {text(
                        "Legitimate interest — owner's recorded assessment",
                        "Gerechtvaardigd belang — vastgelegde beoordeling van de eigenaar"
                      )}
                    </option>
                    <option value="opted_in">
                      {text(
                        "Opted in — evidence retained by owner",
                        "Aangemeld — bewijs bewaard door eigenaar"
                      )}
                    </option>
                    <option value="opted_out">
                      {text(
                        "Opted out — suppress contact",
                        "Afgemeld — niet contacteren"
                      )}
                    </option>
                  </select>
                </div>
                <Label className="flex items-start gap-3 leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-1 shrink-0"
                    checked={rights}
                    disabled={busy}
                    onChange={event => setRights(event.target.checked)}
                  />
                  {text(
                    "This person supplied this data directly. I have reviewed the processing rights and retained evidence under the reference above. This declaration is not platform approval or permission to send messages.",
                    "Deze persoon heeft deze gegevens rechtstreeks verstrekt. Ik heb de verwerkingsrechten gecontroleerd en bewijs bewaard onder bovenstaande referentie. Deze verklaring is geen platformgoedkeuring of toestemming om berichten te versturen."
                  )}
                </Label>
                <Button type="submit" disabled={busy || !rights}>
                  {preview.isPending
                    ? text("Checking candidates…", "Kandidaten controleren…")
                    : text(
                        "Preview possible duplicates",
                        "Mogelijke duplicaten bekijken"
                      )}
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
