import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PresetSettings } from "@shared/workspace-presets";
import { useLanguage } from "@/contexts/LanguageContext";

export type ComposerProspect = {
  id: number;
  name: string;
  matchId?: number;
  platform?: string | null;
  draftPolicy?: { allowed: boolean; reason: string; sourceId: string | null };
};
type DraftInput = {
  prospectId: number;
  matchId?: number;
  body: string;
  idempotencyKey: string;
  declaration: { humanOriginal: true; rulesReviewed: true };
};

export function OutreachComposer({
  prospect,
  onSave,
  onCancel,
  presets,
}: {
  prospect: ComposerProspect;
  onSave: (input: DraftInput) => Promise<unknown>;
  onCancel: () => void;
  presets?: PresetSettings;
}) {
  const { language, text } = useLanguage();
  const [body, setBody] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(
    presets?.defaultTemplateId ?? ""
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<
    { message: string } | "save_failed" | null
  >(null);
  const inFlight = useRef(false);
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const eligible = prospect.draftPolicy?.allowed === true;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || !eligible || !acknowledged || !body.trim()) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    const trimmed = body.trim();
    if (attempt.current?.body !== trimmed)
      attempt.current = { body: trimmed, key: `draft:${crypto.randomUUID()}` };
    try {
      await onSave({
        prospectId: prospect.id,
        matchId: prospect.matchId,
        body: trimmed,
        idempotencyKey: attempt.current.key,
        declaration: { humanOriginal: true, rulesReviewed: true },
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? { message: caught.message } : "save_failed"
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return (
    <Card
      role="region"
      aria-label={text("Human-authored draft", "Zelfgeschreven concept")}
      lang={language}
    >
      <CardHeader>
        <CardTitle>
          {text("Write to", "Schrijf aan")} {prospect.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {prospect.matchId ? (
          <p className="text-sm">
            {text(
              "Linked saved assessment",
              "Gekoppelde opgeslagen beoordeling"
            )}{" "}
            #{prospect.matchId}
          </p>
        ) : null}
        <p className="text-sm">
          {text("Source:", "Bron:")}{" "}
          {prospect.draftPolicy?.sourceId ??
            prospect.platform ??
            text("Not reviewed", "Niet beoordeeld")}
        </p>
        <p
          className="text-sm"
          role={eligible ? undefined : "alert"}
          lang={prospect.draftPolicy?.reason ? "en" : language}
        >
          {prospect.draftPolicy?.reason ??
            text(
              "Source eligibility could not be checked. Reload the prospect list before drafting.",
              "De geschiktheid van de bron kon niet worden gecontroleerd. Laad de kandidatenlijst opnieuw voordat je een concept schrijft."
            )}
        </p>
        {eligible ? (
          <form onSubmit={submit} className="space-y-4">
            {presets?.templates.length ? (
              <div className="space-y-2">
                <Label htmlFor="outreach-preset">
                  {text("Private message template", "Privéberichtsjabloon")}
                </Label>
                <select
                  id="outreach-preset"
                  disabled={pending}
                  value={selectedPreset}
                  onChange={event => setSelectedPreset(event.target.value)}
                  className="w-full rounded border bg-background p-2"
                >
                  <option value="">
                    {text("Choose a template", "Kies een sjabloon")}
                  </option>
                  {presets.templates.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-9 max-w-full whitespace-normal text-center"
                  disabled={pending || !selectedPreset || body.length > 0}
                  onClick={() => {
                    const template = presets.templates.find(
                      item => item.id === selectedPreset
                    );
                    if (template && !body.length) {
                      setBody(template.body);
                      setAcknowledged(false);
                    }
                  }}
                >
                  {text(
                    "Insert into empty message",
                    "Invoegen in een leeg bericht"
                  )}
                </Button>
                <p className="text-sm">
                  {text(
                    "Existing text is never overwritten. Personalize this template and review the exact message and source rules again. No draft is saved or approved by insertion.",
                    "Bestaande tekst wordt nooit overschreven. Personaliseer dit sjabloon en beoordeel het exacte bericht en de bronregels opnieuw. Invoegen slaat geen concept op en keurt het niet goed."
                  )}
                </p>
              </div>
            ) : null}
            <Label htmlFor="outreach-body">
              {text("Your original message", "Je oorspronkelijke bericht")}
            </Label>
            <Textarea
              id="outreach-body"
              autoFocus
              required
              maxLength={10000}
              disabled={pending}
              value={body}
              onChange={event => {
                setBody(event.target.value);
                setAcknowledged(false);
              }}
              className="min-h-40"
            />
            <div className="flex items-start gap-3">
              <input
                id="outreach-declaration"
                type="checkbox"
                required
                checked={acknowledged}
                disabled={pending}
                className="mt-1 size-4 shrink-0"
                onChange={event => setAcknowledged(event.target.checked)}
              />
              <Label
                htmlFor="outreach-declaration"
                className="text-sm leading-relaxed"
              >
                {text(
                  "I wrote this text myself, without generated or AI-edited wording. I checked the current source rules, my eligibility to participate and my rights to use this person's data. This acknowledgement does not grant API or platform permission.",
                  "Ik heb deze tekst zelf geschreven, zonder gegenereerde of door AI bewerkte formuleringen. Ik heb de actuele bronregels, mijn geschiktheid om deel te nemen en mijn rechten om de gegevens van deze persoon te gebruiken gecontroleerd. Deze verklaring verleent geen API- of platformtoestemming."
                )}
              </Label>
            </div>
            {error ? (
              <p
                role="alert"
                className="text-sm text-red-400"
                lang={typeof error === "object" ? "en" : language}
              >
                {typeof error === "object"
                  ? error.message
                  : text(
                      "Draft could not be saved. Your text has been retained.",
                      "Het concept kon niet worden opgeslagen. Je tekst is behouden."
                    )}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={pending || !body.trim() || !acknowledged}
              >
                {pending
                  ? text("Saving draft…", "Concept opslaan…")
                  : text("Save draft", "Concept opslaan")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onCancel}
              >
                {text("Cancel draft", "Concept annuleren")}
              </Button>
            </div>
            <p className="text-xs text-neutral-400">
              {text(
                "Nothing is sent. Your declaration is recorded with this exact message and expires after 30 days. Changing the message or destination requires a fresh review.",
                "Er wordt niets verstuurd. Je verklaring wordt met dit exacte bericht vastgelegd en vervalt na 30 dagen. Als het bericht of de bestemming verandert, is een nieuwe beoordeling vereist."
              )}
            </p>
          </form>
        ) : (
          <Button variant="outline" onClick={onCancel}>
            {text("Close source notice", "Bronmelding sluiten")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
