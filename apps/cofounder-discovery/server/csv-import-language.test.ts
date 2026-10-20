import { describe, expect, it } from "vitest";
import {
  csvImportCopy,
  csvImportResultText,
} from "../client/src/lib/csv-import-copy";

describe("authored English/Dutch CSV interface copy", () => {
  it("provides every authored control/guidance key in both languages", () => {
    const en = csvImportCopy("en"),
      nl = csvImportCopy("nl");
    expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(nl[key]).not.toBe(en[key]);
      expect(nl[key].trim()).not.toBe("");
    }
    expect(nl.csv).toBe("Kandidaten-CSV");
    expect(nl.form).toBe("Toegestane kandidaten-CSV importeren");
    expect(nl.evidence).toBe("Bewijsreferentie");
    expect(en.submit).toBe("Import CSV");
    expect(nl.pending).toBe("Importeren…");
    expect(nl.retry).toBe("Ongewijzigde import opnieuw proberen");
  });
  it("retains protocol keys, limits and restrictive source/permission scope", () => {
    const nl = csvImportCopy("nl");
    for (const term of [
      "name",
      "manual",
      "(|)",
      "1.000",
      "512 KiB",
      "Platformexports",
      "ledenprofielen",
      "onbekende bronnen",
      "privégroepen",
    ])
      expect(nl.description).toContain(term);
    for (const term of [
      "1–120",
      "e-mailadressen",
      "privécorrespondentie",
      "inloggegevens",
      "URL's",
    ])
      expect(nl.evidenceHelp).toContain(term);
    expect(nl.declaration).toContain("ondersteunend bewijs bewaard");
    expect(nl.declarationHelp).toContain("geen platformtoegang of toestemming");
    expect(nl.declarationHelp).toContain("Afgemelde personen blijven afgemeld");
    expect(nl.storageHelp).toContain("gaan verloren bij herladen");
    expect(nl.storageHelp).toContain("niet worden ontdubbeld");
    expect(nl.storageHelp).toContain(
      "duplicaten behouden hun bestaande herkomstgegevens"
    );
  });
  it.each(["en", "nl"] as const)(
    "formats committed and recovered counts in %s without changing the result",
    language => {
      const result = { imported: 12, skipped: 3, replayed: false };
      const original = { ...result };
      const committed = csvImportResultText(language, result);
      expect(committed).toContain(
        language === "nl"
          ? "12 geïmporteerd; 3 bestaande profielen overgeslagen."
          : "12 imported; 3 existing profiles skipped."
      );
      expect(committed).toContain(csvImportCopy(language).committed);
      expect(committed).not.toContain(csvImportCopy(language).recovered);
      expect(
        csvImportResultText(language, { ...result, replayed: true })
      ).toContain(csvImportCopy(language).recovered);
      expect(result).toEqual(original);
    }
  );
  it("zero-row recovered results do not claim a fresh commit", () => {
    const message = csvImportResultText("nl", {
      imported: 0,
      skipped: 0,
      replayed: true,
    });
    expect(message).toContain(
      "0 geïmporteerd; 0 bestaande profielen overgeslagen."
    );
    expect(message).toContain(csvImportCopy("nl").recovered);
    expect(message).not.toContain(csvImportCopy("nl").committed);
  });
});
