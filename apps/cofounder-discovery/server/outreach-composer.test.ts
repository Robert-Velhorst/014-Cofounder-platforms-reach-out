import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const language = vi.hoisted(() => ({ value: "en" }));
vi.mock("../client/src/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: language.value,
    text: (en: string, nl: string) => (language.value === "nl" ? nl : en),
  }),
}));
beforeEach(() => {
  language.value = "en";
});

async function composer(props = {}) {
  const path = "../client/src/components/OutreachComposer";
  const module = await import(path).catch(() => null);
  expect(module?.OutreachComposer).toBeTypeOf("function");
  return renderToStaticMarkup(
    createElement(module!.OutreachComposer, {
      prospect: {
        id: 7,
        name: "Synthetic Collaborator",
        platform: "HN",
        draftPolicy: {
          allowed: true,
          reason: "Human-original participation only.",
          sourceId: "hacker-news",
        },
      },
      onSave: vi.fn(),
      onCancel: vi.fn(),
      ...props,
    })
  );
}

describe("human-authored outreach composer", () => {
  it("renders Dutch original-message controls and unchanged eligibility disclosure", async () => {
    language.value = "nl";
    const html = await composer();
    expect(html).toContain('lang="nl"');
    expect(html).toContain('aria-label="Zelfgeschreven concept"');
    expect(html).toContain("Schrijf aan Synthetic Collaborator");
    expect(html).toContain("Je oorspronkelijke bericht");
    expect(html).toContain(
      "Ik heb deze tekst zelf geschreven, zonder gegenereerde of door AI bewerkte formuleringen"
    );
    expect(html).toContain("Er wordt niets verstuurd");
    expect(html).toContain("30 dagen");
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(/<textarea[^>]*><\/textarea>/);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Concept opslaan<\/button>/);
    expect(html).toContain('lang="en">Human-original participation only.');
  });
  it("keeps Dutch source holds closed and original policy reasons unchanged", async () => {
    language.value = "nl";
    const html = await composer({
      prospect: {
        id: 8,
        name: "Original group",
        draftPolicy: {
          allowed: false,
          reason: "Exact group permission required.",
          sourceId: "discord-founder-groups",
        },
      },
    });
    expect(html).toContain("Exact group permission required.");
    expect(html).toContain("Bronmelding sluiten");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("Concept opslaan");
  });
  it("translates the unchecked-source fallback without manufacturing eligibility", async () => {
    language.value = "nl";
    const html = await composer({
      prospect: { id: 9, name: "Original candidate" },
    });
    expect(html).toContain("Niet beoordeeld");
    expect(html).toContain(
      "De geschiktheid van de bron kon niet worden gecontroleerd"
    );
    expect(html).not.toContain("<form");
  });
  it("translates Dutch template controls, preserving private names and insertion safeguards", async () => {
    language.value = "nl";
    const html = await composer({
      presets: {
        defaultTemplateId: "private-id",
        templates: [
          {
            id: "private-id",
            name: "Original café template",
            body: "Original private message",
          },
        ],
      },
    });
    expect(html).toContain("Privéberichtsjabloon");
    expect(html).toContain("Kies een sjabloon");
    expect(html).toContain("Invoegen in een leeg bericht");
    expect(html).toContain("Bestaande tekst wordt nooit overschreven");
    expect(html).toContain("Original café template");
    expect(html).not.toContain("Original private message");
  });
  it("starts with an empty labelled message and an unchecked authorship/rules acknowledgement", async () => {
    const html = await composer();
    expect(html).toContain('id="outreach-body"');
    expect(html).toContain('id="outreach-declaration"');
    expect(html).toContain("Human-original participation only.");
    expect(html).toContain("I wrote this text myself");
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(/<textarea[^>]*><\/textarea>/);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Save draft<\/button>/);
  });
  it("explains a source hold without presenting an enabled authoring form", async () => {
    const html = await composer({
      prospect: {
        id: 8,
        name: "Group",
        draftPolicy: {
          allowed: false,
          reason: "Exact group permission required.",
          sourceId: "discord-founder-groups",
        },
      },
    });
    expect(html).toContain("Exact group permission required.");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("Save draft");
  });
});
