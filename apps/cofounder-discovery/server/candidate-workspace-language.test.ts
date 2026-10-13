import { describe, expect, it } from "vitest";
import {
  candidateWorkspaceCopy,
  candidateDetailsLabel,
  candidatePageLabel,
} from "../client/src/lib/candidate-workspace-copy";

describe("candidate workspace interface copy", () => {
  it("provides both languages for every authored label", () => {
    const en = candidateWorkspaceCopy("en");
    const nl = candidateWorkspaceCopy("nl");
    expect(Object.keys(nl)).toEqual(Object.keys(en));
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(en[key].trim()).not.toBe("");
      expect(nl[key].trim()).not.toBe("");
      expect(nl[key]).not.toBe(en[key]);
    }
  });
  it("keeps original names including punctuation and multilingual characters", () => {
    const name = "Élodie 王 <private> 🌍";
    expect(candidateDetailsLabel("en", name)).toBe(`View details for ${name}`);
    expect(candidateDetailsLabel("nl", name)).toBe(
      `Details bekijken voor ${name}`
    );
  });
  it.each([
    [1, 0, "Page 1 of 1 · 0 candidates", "Pagina 1 van 1 · 0 kandidaten"],
    [1, 50, "Page 1 of 1 · 50 candidates", "Pagina 1 van 1 · 50 kandidaten"],
    [2, 51, "Page 2 of 2 · 51 candidates", "Pagina 2 van 2 · 51 kandidaten"],
  ])(
    "preserves page and count semantics for page %i, total %i",
    (page, total, en, nl) => {
      expect(candidatePageLabel("en", page, total)).toBe(en);
      expect(candidatePageLabel("nl", page, total)).toBe(nl);
    }
  );
  it("does not invent a total while the query is unavailable", () => {
    expect(candidatePageLabel("en", 3)).toBe("Page 3");
    expect(candidatePageLabel("nl", 3)).toBe("Pagina 3");
  });
  it("preserves literal search, local-only sorting and quarantine disclosures", () => {
    for (const language of ["en", "nl"] as const) {
      const copy = candidateWorkspaceCopy(language);
      expect(copy.searchHelp).toContain("%");
      expect(copy.searchHelp).toContain("_");
      expect(copy.searchHelp).toContain("ID");
      expect(copy.description).toMatch(/quarantined|quarantaine/);
      expect(copy.searchHelp).toMatch(
        /not included in saved|niet opgenomen in opgeslagen/
      );
    }
  });
});
