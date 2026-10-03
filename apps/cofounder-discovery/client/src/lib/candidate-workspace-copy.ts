import type { UiLanguage } from "../contexts/LanguageContext";

// Interface labels only: query values, source records and original candidate
// content remain unchanged when the user switches language.
const english = {
  title: "Prospect workspace",
  description:
    "Every row is scoped to your account. Open details to inspect source evidence, correct a profile, archive/restore or record an opt-out. Legacy unowned rows are quarantined.",
  status: "Candidate status",
  active: "Active candidates",
  archived: "Archived candidates",
  all: "All candidates",
  search: "Search candidates",
  searchPlaceholder: "Search name, title, or location",
  order: "Candidate order",
  newest: "Newest added first",
  oldest: "Oldest added first",
  nameAscending: "Name A–Z",
  nameDescending: "Name Z–A",
  searchHelp:
    "Search is literal text in name, title or location; % and _ are not wildcards. Name order follows database collation, with candidate ID breaking ties. Order stays in this page only and is not included in saved search defaults.",
  loadError: "Could not load candidates:",
  retry: "Retry candidates",
  loading: "Loading candidates…",
  name: "Name",
  source: "Source",
  consent: "Consent",
  action: "Action",
  archivedBadge: "Archived",
  noDetails: "No details",
  details: "View details",
  qualify: "Qualify",
  writeDraft: "Write draft",
  sourceNotice: "Source notice",
  noMatches: "No candidates match this search.",
  emptyPage:
    "No candidates on this page. Return to the previous page or refresh.",
  noArchived: "No archived candidates.",
  empty: "Add a candidate or import a permitted CSV to begin.",
  pages: "Candidate pages",
  previousLabel: "Previous candidates",
  nextLabel: "Next candidates",
  previous: "Previous",
  next: "Next",
  savedDefaults: "Apply saved search defaults",
};
const dutch: typeof english = {
  title: "Kandidatenwerkruimte",
  description:
    "Elke rij hoort alleen bij jouw account. Open de details om bronbewijs te bekijken, een profiel te corrigeren, te archiveren/terug te zetten of een afmelding vast te leggen. Oude rijen zonder eigenaar staan in quarantaine.",
  status: "Kandidaatstatus",
  active: "Actieve kandidaten",
  archived: "Gearchiveerde kandidaten",
  all: "Alle kandidaten",
  search: "Kandidaten zoeken",
  searchPlaceholder: "Zoek op naam, functie of locatie",
  order: "Kandidaatvolgorde",
  newest: "Nieuwste eerst",
  oldest: "Oudste eerst",
  nameAscending: "Naam A–Z",
  nameDescending: "Naam Z–A",
  searchHelp:
    "Zoeken gebruikt letterlijke tekst in naam, functie of locatie; % en _ zijn geen jokertekens. Namen volgen de sorteervolgorde van de database; bij gelijke namen bepaalt de kandidaat-ID de volgorde. De volgorde geldt alleen op deze pagina en wordt niet opgenomen in opgeslagen zoekinstellingen.",
  loadError: "Kandidaten konden niet worden geladen:",
  retry: "Kandidaten opnieuw laden",
  loading: "Kandidaten laden…",
  name: "Naam",
  source: "Bron",
  consent: "Toestemming",
  action: "Actie",
  archivedBadge: "Gearchiveerd",
  noDetails: "Geen details",
  details: "Details bekijken",
  qualify: "Beoordelen",
  writeDraft: "Concept schrijven",
  sourceNotice: "Bronmelding",
  noMatches: "Geen kandidaten gevonden voor deze zoekopdracht.",
  emptyPage:
    "Geen kandidaten op deze pagina. Ga naar de vorige pagina of laad opnieuw.",
  noArchived: "Geen gearchiveerde kandidaten.",
  empty:
    "Voeg een kandidaat toe of importeer een toegestane CSV om te beginnen.",
  pages: "Kandidaatpagina's",
  previousLabel: "Vorige kandidaten",
  nextLabel: "Volgende kandidaten",
  previous: "Vorige",
  next: "Volgende",
  savedDefaults: "Opgeslagen zoekinstellingen toepassen",
};

export function candidateWorkspaceCopy(language: UiLanguage) {
  return language === "nl" ? dutch : english;
}

export function candidateDetailsLabel(language: UiLanguage, name: string) {
  return language === "nl"
    ? `Details bekijken voor ${name}`
    : `View details for ${name}`;
}

export function candidatePageLabel(
  language: UiLanguage,
  page: number,
  total?: number
) {
  const prefix = language === "nl" ? `Pagina ${page}` : `Page ${page}`;
  if (total === undefined) return prefix;
  const pages = Math.max(1, Math.ceil(total / 50));
  return language === "nl"
    ? `${prefix} van ${pages} · ${total} kandidaten`
    : `${prefix} of ${pages} · ${total} candidates`;
}
