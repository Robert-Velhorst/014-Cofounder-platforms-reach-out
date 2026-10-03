import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  presetSettingsSchema,
  type PresetSettings,
} from "@shared/workspace-presets";

export function WorkspacePresets({
  settings,
  revision,
  blocked,
  onSave,
}: {
  settings: PresetSettings;
  revision: number;
  blocked: boolean;
  onSave: (
    settings: PresetSettings,
    expectedRevision: number
  ) => Promise<unknown>;
}) {
  const [edits, setEdits] = useState(settings);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [original, setOriginal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  function change(next: PresetSettings) {
    setEdits(next);
    setConfirmed(false);
  }
  function editTemplate(id: string) {
    const template = edits.templates.find(item => item.id === id);
    setSelected(id);
    setName(template?.name ?? "");
    setBody(template?.body ?? "");
    setOriginal(false);
  }
  function stageTemplate() {
    if (!original) return;
    const id = selected || crypto.randomUUID();
    const template = { id, name, body, humanOriginal: true as const };
    const next = {
      ...edits,
      templates: selected
        ? edits.templates.map(item => (item.id === id ? template : item))
        : [...edits.templates, template],
    };
    const parsed = presetSettingsSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    change(parsed.data);
    setError(null);
    editTemplate("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (blocked || inFlight.current || !confirmed) return;
    const parsed = presetSettingsSchema.safeParse(edits);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await onSave(parsed.data, revision);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Save failed. Your edits are retained; retry the same save."
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return (
    <Card aria-label="Private reusable defaults">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Private templates and defaults
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Up to 20 original message templates, 10000 characters each and 80000
          bytes in total. Nothing is sent. Applying text never transfers
          permission or approval. Do not store passwords or other people's
          private details here.
        </p>
        <fieldset disabled={blocked || pending} className="space-y-4">
          <legend className="sr-only">Edit private defaults</legend>
          <Label htmlFor="preset-edit">Edit a template</Label>
          <select
            id="preset-edit"
            value={selected}
            onChange={event => editTemplate(event.target.value)}
            className="w-full rounded border bg-background p-2"
          >
            <option value="">New template</option>
            {edits.templates.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Label htmlFor="preset-name">Template name</Label>
          <Input
            id="preset-name"
            maxLength={80}
            value={name}
            onChange={event => {
              setName(event.target.value);
              setOriginal(false);
            }}
          />
          <Label htmlFor="preset-body">Your reusable message text</Label>
          <Textarea
            id="preset-body"
            maxLength={10000}
            value={body}
            onChange={event => {
              setBody(event.target.value);
              setOriginal(false);
            }}
          />
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={original}
              onChange={event => setOriginal(event.target.checked)}
            />
            I wrote this text myself, without AI-generated or AI-edited wording.
          </label>
          <Button
            type="button"
            disabled={!original || !name.trim() || !body.trim()}
            onClick={stageTemplate}
          >
            {selected ? "Stage template update" : "Add to pending templates"}
          </Button>
          {selected ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                change({
                  ...edits,
                  templates: edits.templates.filter(
                    item => item.id !== selected
                  ),
                  defaultTemplateId:
                    edits.defaultTemplateId === selected
                      ? null
                      : edits.defaultTemplateId,
                });
                editTemplate("");
              }}
            >
              Remove from pending templates
            </Button>
          ) : null}
          <p>
            {edits.templates.length} templates in pending settings. Template
            editor text is not included until you stage it. Nothing is stored
            until you save defaults below.
          </p>
          <form onSubmit={save} className="space-y-4">
            <Label htmlFor="preset-default">
              Preferred template (never automatically inserted)
            </Label>
            <select
              id="preset-default"
              className="w-full rounded border bg-background p-2"
              value={edits.defaultTemplateId ?? ""}
              onChange={event =>
                change({
                  ...edits,
                  defaultTemplateId: event.target.value || null,
                })
              }
            >
              <option value="">No preference</option>
              {edits.templates.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Label htmlFor="preset-search">Default candidate search</Label>
            <Input
              id="preset-search"
              maxLength={100}
              value={edits.search}
              onChange={event =>
                change({ ...edits, search: event.target.value })
              }
            />
            <Label htmlFor="preset-status">Default candidate view</Label>
            <select
              id="preset-status"
              className="w-full rounded border bg-background p-2"
              value={edits.candidateStatus}
              onChange={event =>
                change({
                  ...edits,
                  candidateStatus: event.target
                    .value as PresetSettings["candidateStatus"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
            <label className="flex gap-2">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={event => setConfirmed(event.target.checked)}
              />
              I reviewed the pending settings and any template removals. Save
              this version to my current account.
            </label>
            {error ? <p role="alert">{error}</p> : null}
            <Button type="submit" disabled={!confirmed}>
              {pending ? "Saving defaults…" : "Save private defaults"}
            </Button>
          </form>
        </fieldset>
      </CardContent>
    </Card>
  );
}
