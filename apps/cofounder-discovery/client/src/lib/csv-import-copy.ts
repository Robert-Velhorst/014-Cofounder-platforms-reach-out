import type { UiLanguage } from "../contexts/LanguageContext";

// Authored interface copy only. CSV keys, submitted bytes and declarations are
// never translated or persisted here.
const english = {
  title: "Import permitted data",
  description:
    "CSV only, for data supplied directly by each person. Required column: name. Use a reviewed platform ID or name, or manual without a platform URL. Separate skills and industries with a vertical bar. Maximum 1,000 records and 512 KiB. Quoted fields may contain line breaks. Platform exports, scraped/copied member profiles, unknown sources and unreviewed private groups are not admitted by this importer.",
  form: "Import permitted prospect CSV",
  csv: "Prospect CSV",
  evidence: "Evidence reference",
  evidenceHelp:
    "An opaque reference to evidence you retain for every row. Use 1–120 letters, numbers, dots, underscores or hyphens. Do not paste names, email addresses, private correspondence, credentials or URLs here.",
  declaration:
    "Each person supplied this data directly, including any profile link. I have reviewed my rights to process every row for this purpose and retained supporting evidence. This is not copied platform member data or a platform export.",
  declarationHelp:
    "We record your declaration, not proof of permission. It does not grant platform access or permission to contact anyone. Opt-out records remain opted out. Changing the CSV or evidence reference requires a fresh acknowledgment.",
  submit: "Import CSV",
  pending: "Importing…",
  retry: "Retry unchanged import",
  committed: "Import committed.",
  recovered:
    "Previously committed result recovered; no new records added by this retry.",
  storageHelp:
    "Imports are all-or-nothing. Existing profile URLs, including archived opt-outs, are left unchanged. After a failed request, retry unchanged data and declaration in this page to reuse its receipt. Do not reload or edit an uncertain submission before checking your prospects: contacts without URLs cannot be deduplicated across new imports. Your CSV and unsent declaration are kept in memory only and lost on reload. A committed declaration is stored with each newly imported prospect; duplicates keep their existing provenance.",
};
const dutch: typeof english = {
  title: "Toegestane gegevens importeren",
  description:
    "Alleen CSV, met gegevens die iedere persoon zelf heeft verstrekt. Verplichte kolom: name. Gebruik een beoordeelde platform-ID of platformnaam, of manual zonder platform-URL. Scheid vaardigheden en sectoren met een verticale streep (|). Maximaal 1.000 gegevensregels en 512 KiB. Velden tussen aanhalingstekens mogen regeleinden bevatten. Platformexports, gescrapete/gekopieerde ledenprofielen, onbekende bronnen en niet-beoordeelde privégroepen worden niet toegelaten door deze importfunctie.",
  form: "Toegestane kandidaten-CSV importeren",
  csv: "Kandidaten-CSV",
  evidence: "Bewijsreferentie",
  evidenceHelp:
    "Een neutrale verwijzing naar bewijs dat je voor elke gegevensregel bewaart. Gebruik 1–120 letters, cijfers, punten, underscores of koppeltekens. Plak hier geen namen, e-mailadressen, privécorrespondentie, inloggegevens of URL's.",
  declaration:
    "Iedere persoon heeft deze gegevens zelf verstrekt, inclusief een eventuele profiellink. Ik heb nagegaan of ik elke gegevensregel voor dit doel mag verwerken en heb ondersteunend bewijs bewaard. Dit zijn geen gekopieerde platformgegevens van leden of gegevens uit een platformexport.",
  declarationHelp:
    "We leggen je verklaring vast, geen bewijs van toestemming. De verklaring geeft geen platformtoegang of toestemming om iemand te benaderen. Afgemelde personen blijven afgemeld. Na wijziging van de CSV of bewijsreferentie is een nieuwe bevestiging nodig.",
  submit: "CSV importeren",
  pending: "Importeren…",
  retry: "Ongewijzigde import opnieuw proberen",
  committed: "Import opgeslagen.",
  recovered:
    "Eerder opgeslagen resultaat teruggevonden; deze nieuwe poging heeft geen gegevens toegevoegd.",
  storageHelp:
    "Een import wordt volledig opgeslagen of helemaal niet. Bestaande profiel-URL's, inclusief gearchiveerde afmeldingen, blijven ongewijzigd. Probeer na een mislukte aanvraag dezelfde gegevens en verklaring op deze pagina opnieuw om het ontvangstbewijs te hergebruiken. Laad de pagina niet opnieuw en bewerk een onzekere inzending niet voordat je je kandidaten hebt gecontroleerd: personen zonder URL kunnen bij nieuwe imports niet worden ontdubbeld. Je CSV en nog niet ingediende verklaring worden alleen in het geheugen bewaard en gaan verloren bij herladen. Een opgeslagen verklaring wordt bij elke nieuw geïmporteerde kandidaat bewaard; duplicaten behouden hun bestaande herkomstgegevens.",
};

export function csvImportCopy(language: UiLanguage) {
  return language === "nl" ? dutch : english;
}
export function csvImportResultText(
  language: UiLanguage,
  result: { imported: number; skipped: number; replayed: boolean }
) {
  const copy = csvImportCopy(language);
  const counts =
    language === "nl"
      ? `${result.imported} geïmporteerd; ${result.skipped} bestaande profielen overgeslagen.`
      : `${result.imported} imported; ${result.skipped} existing profiles skipped.`;
  return `${counts} ${result.replayed ? copy.recovered : copy.committed}`;
}
