import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  emptyPresetSettings,
  presetSettingsSchema,
  presetsSaveSchema,
} from "../shared/workspace-presets";
import { WorkspacePresets } from "../client/src/components/WorkspacePresets";
import { OutreachComposer } from "../client/src/components/OutreachComposer";
const template = () => ({
  id: randomUUID(),
  name: "My introduction",
  body: "My original introduction",
  humanOriginal: true as const,
});
describe("private reusable settings contract and initial controls", () => {
  it("returns fresh safe empty defaults", () => {
    const first = emptyPresetSettings();
    first.templates.push(template());
    expect(emptyPresetSettings().templates).toEqual([]);
  });
  it("normalizes original text and permits a selected existing template", () => {
    const item = template();
    expect(
      presetSettingsSchema.parse({
        ...emptyPresetSettings(),
        templates: [{ ...item, body: "  Hello  " }],
        defaultTemplateId: item.id,
      }).templates[0].body
    ).toBe("Hello");
  });
  it("rejects a dangling default", () => {
    expect(
      presetSettingsSchema.safeParse({
        ...emptyPresetSettings(),
        defaultTemplateId: randomUUID(),
      }).success
    ).toBe(false);
  });
  it("rejects duplicate IDs", () => {
    const item = template();
    expect(
      presetSettingsSchema.safeParse({
        ...emptyPresetSettings(),
        templates: [item, { ...item, name: "Other" }],
      }).success
    ).toBe(false);
  });
  it("rejects case-insensitive duplicate names", () => {
    expect(
      presetSettingsSchema.safeParse({
        ...emptyPresetSettings(),
        templates: [template(), { ...template(), name: "MY INTRODUCTION" }],
      }).success
    ).toBe(false);
  });
  it("rejects generated text declarations and extra properties", () => {
    for (const item of [
      { ...template(), humanOriginal: false },
      { ...template(), consentStatus: "consented" },
    ])
      expect(
        presetSettingsSchema.safeParse({
          ...emptyPresetSettings(),
          templates: [item],
        }).success
      ).toBe(false);
  });
  it("bounds per-template content", () => {
    for (const body of ["", " ", "x".repeat(10001)])
      expect(
        presetSettingsSchema.safeParse({
          ...emptyPresetSettings(),
          templates: [{ ...template(), body }],
        }).success
      ).toBe(false);
  });
  it("bounds total UTF-8 bytes, not just character count", () => {
    const templates = Array.from({ length: 3 }, (_, i) => ({
      ...template(),
      name: String(i),
      body: "界".repeat(10000),
    }));
    expect(
      presetSettingsSchema.safeParse({ ...emptyPresetSettings(), templates })
        .success
    ).toBe(false);
  });
  it("bounds count, revision and requires exact save confirmation", () => {
    const base = {
      accountId: 1,
      expectedRevision: 0,
      settings: emptyPresetSettings(),
      confirmation: true,
    };
    for (const value of [
      { ...base, expectedRevision: -1 },
      { ...base, expectedRevision: 2147483647 },
      { ...base, confirmation: false },
      {
        ...base,
        settings: {
          ...base.settings,
          templates: Array.from({ length: 21 }, (_, i) => ({
            ...template(),
            name: String(i),
          })),
        },
      },
    ])
      expect(presetsSaveSchema.safeParse(value).success).toBe(false);
  });
  it("provides labelled pending edit controls without claiming they are stored", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspacePresets, {
        settings: emptyPresetSettings(),
        revision: 0,
        blocked: false,
        onSave: async () => {},
      })
    );
    expect(html).toContain("Save private defaults");
    expect(html).toContain("Nothing is stored until you save");
    expect(html).toContain('for="preset-body"');
    expect(html).toContain("disabled");
  });
  it("blocks the whole preset editor when account checks fail", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspacePresets, {
        settings: emptyPresetSettings(),
        revision: 0,
        blocked: true,
        onSave: async () => {},
      })
    );
    expect(html).toMatch(/<fieldset[^>]*disabled/);
  });
  it("offers explicit non-overwriting insertion without pre-filling or approving a draft", () => {
    const item = template();
    const html = renderToStaticMarkup(
      createElement(OutreachComposer, {
        prospect: {
          id: 1,
          name: "Synthetic",
          draftPolicy: {
            allowed: true,
            reason: "Human review required",
            sourceId: "manual",
          },
        },
        presets: {
          ...emptyPresetSettings(),
          templates: [item],
          defaultTemplateId: item.id,
        },
        onSave: async () => {},
        onCancel: () => {},
      })
    );
    expect(html).toContain("Insert into empty message");
    expect(html).not.toContain(item.body);
    expect(html).not.toMatch(/id="outreach-declaration"[^>]*checked/);
  });
});
