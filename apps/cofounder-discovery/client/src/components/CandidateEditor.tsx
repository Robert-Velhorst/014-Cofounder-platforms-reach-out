import { useEffect, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  candidatePatchSchema,
  type CandidatePatch,
} from "@shared/candidate-input";

export type CandidateReview =
  inferRouterOutputs<AppRouter>["criticalPath"]["prospects"]["details"];
const dutchLabels: Record<keyof CandidatePatch, string> = {
  name: "Naam kandidaat",
  title: "Rol of titel",
  location: "Locatie",
  bio: "Biografie",
  skills: "Vaardigheden (één per regel)",
  experience: "Ervaring",
  industries: "Sectoren (één per regel)",
  currentCompany: "Huidig bedrijf",
  lookingFor: "Zoekt (één per regel)",
  startupStage: "Startupfase",
};
const fields: {
  key: keyof CandidatePatch;
  label: string;
  max: number;
  list?: boolean;
  multiline?: boolean;
}[] = [
  { key: "name", label: "Candidate name", max: 255 },
  { key: "title", label: "Role or title", max: 255 },
  { key: "location", label: "Location", max: 255 },
  { key: "bio", label: "Biography", max: 10000, multiline: true },
  { key: "skills", label: "Skills (one per line)", max: 5050, list: true },
  { key: "experience", label: "Experience", max: 50 },
  {
    key: "industries",
    label: "Industries (one per line)",
    max: 5050,
    list: true,
  },
  { key: "currentCompany", label: "Current company", max: 255 },
  {
    key: "lookingFor",
    label: "Looking for (one per line)",
    max: 5050,
    list: true,
  },
  { key: "startupStage", label: "Startup stage", max: 50 },
];
const validList = (value: unknown) =>
  value == null ||
  (Array.isArray(value) && value.every(item => typeof item === "string"));
const initialValues = (review: CandidateReview) =>
  Object.fromEntries(
    fields.map(field => {
      const value = review.prospect[field.key];
      return [
        field.key,
        field.list
          ? Array.isArray(value) && validList(value)
            ? value.join("\n")
            : ""
          : (value ?? ""),
      ];
    })
  ) as Record<keyof CandidatePatch, string>;

export function CandidateEditor({
  review,
  blocked,
  concealed,
  onDirty,
  onBusy,
  onCancel,
  onSaved,
}: {
  review: CandidateReview;
  blocked: boolean;
  concealed: boolean;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const { language, text } = useLanguage();
  // The parent captures this review once on Edit. Refetch never rebases a draft.
  const [initial] = useState(() => initialValues(review));
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<
    { message: string } | "save_failed" | null
  >(null);
  const [conflict, setConflict] = useState(false);
  const mutation = trpc.criticalPath.prospects.edit.useMutation();
  const inFlight = useRef(false);
  const dirty = fields.some(field => values[field.key] !== initial[field.key]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (blocked || concealed || inFlight.current || conflict || !dirty) return;
    const patch = Object.fromEntries(
      fields
        .filter(field => values[field.key] !== initial[field.key])
        .map(field => [
          field.key,
          field.list
            ? values[field.key]
                .split("\n")
                .map(item => item.trim())
                .filter(Boolean)
            : field.key === "name"
              ? values[field.key]
              : values[field.key].trim() || null,
        ])
    );
    const parsed = candidatePatchSchema.safeParse(patch);
    if (!parsed.success) {
      setError({
        message: parsed.error.issues
          .map(issue => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      });
      return;
    }
    inFlight.current = true;
    onBusy(true);
    setError(null);
    try {
      await mutation.mutateAsync({
        id: review.prospect.id,
        accountId: review.prospect.userId!,
        expectedRevision: review.revision,
        patch: parsed.data,
      });
      onDirty(false);
      await onSaved();
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
  // Keep the captured draft in memory across temporary account-check failures,
  // but render no private inputs or values until the reviewed account returns.
  if (concealed) return null;
  return (
    <form
      lang={language}
      onSubmit={submit}
      aria-label={text("Edit candidate profile", "Kandidaatprofiel bewerken")}
      className="space-y-4 rounded-md border p-4"
    >
      <h3 className="font-semibold">
        {text("Correct candidate profile", "Kandidaatprofiel corrigeren")}
      </h3>
      <p className="text-sm text-muted-foreground">
        {text(
          "Only changed profile fields are saved. Source records, import evidence and contact permission cannot be changed here. Existing assessments and drafts are not rewritten.",
          "Alleen gewijzigde profielvelden worden opgeslagen. Brongegevens, importbewijs en contacttoestemming kunnen hier niet worden gewijzigd. Bestaande beoordelingen en conceptberichten worden niet herschreven."
        )}
      </p>
      {fields.map(field => {
        const invalid = field.list && !validList(review.prospect[field.key]);
        const props = {
          id: `candidate-edit-${field.key}`,
          value: values[field.key],
          maxLength: field.max,
          disabled: blocked || mutation.isPending || invalid,
          required: field.key === "name",
          onChange: (
            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => {
            const next = { ...values, [field.key]: event.target.value };
            setValues(next);
            onDirty(fields.some(item => next[item.key] !== initial[item.key]));
          },
        };
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={props.id}>
              {text(field.label, dutchLabels[field.key])}
            </Label>
            {field.multiline || field.list ? (
              <Textarea {...props} />
            ) : (
              <Input {...props} />
            )}
            {invalid ? (
              <p className="text-xs">
                {text(
                  "Unrecognized stored list; original data is preserved. This field needs separate review.",
                  "Onherkende opgeslagen lijst; oorspronkelijke gegevens blijven behouden. Dit veld vereist afzonderlijke beoordeling."
                )}
              </p>
            ) : null}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {text(
          "Lists allow up to 50 entries of 100 characters each. Unsaved corrections stay only in this tab.",
          "Lijsten bevatten maximaal 50 items van elk 100 tekens. Niet-opgeslagen correcties blijven alleen in dit tabblad."
        )}
      </p>
      {error ? (
        <p role="alert" className="break-words">
          {error === "save_failed" ? (
            text(
              "Could not save corrections. Retry safely.",
              "Correcties konden niet worden opgeslagen. Probeer het veilig opnieuw."
            )
          ) : (
            <span lang="en">{error.message}</span>
          )}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={blocked || mutation.isPending || conflict || !dirty}
        >
          {mutation.isPending
            ? text("Saving corrections…", "Correcties opslaan…")
            : text("Save corrections", "Correcties opslaan")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={onCancel}
        >
          {conflict
            ? text(
                "Discard changes and reload latest",
                "Wijzigingen verwerpen en nieuwste gegevens laden"
              )
            : text("Cancel editing", "Bewerken annuleren")}
        </Button>
      </div>
    </form>
  );
}
