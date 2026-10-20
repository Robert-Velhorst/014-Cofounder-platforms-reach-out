import { useLanguage, type UiLanguage } from "@/contexts/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage, text } = useLanguage();
  return (
    <div className="border-b border-white/10 bg-neutral-950 px-5 py-3 text-neutral-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor="ui-language" className="text-sm">
          {text("Interface language", "Interfacetaal")}
        </label>
        <select
          id="ui-language"
          value={language}
          onChange={event => setLanguage(event.target.value as UiLanguage)}
          className="rounded border border-white/20 bg-neutral-900 px-3 py-2 text-sm"
          aria-describedby="ui-language-scope"
        >
          <option value="en">English</option>
          <option value="nl">Nederlands</option>
        </select>
        <a
          href="/help"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline underline-offset-4"
        >
          {text(
            "Help (opens in a new tab)",
            "Hulp (opent in een nieuw tabblad)"
          )}
        </a>
        <p
          id="ui-language-scope"
          className="max-w-3xl text-xs leading-relaxed text-neutral-400"
        >
          {text(
            "Translation in progress: Dutch is available on home, sign-in/registration, email verification, password recovery, profile setup and not-found screens, plus workspace navigation, safety status, discovery-catalogue controls, candidate-list search/filter/order/pagination controls, reminders/conversations, candidate details/profile corrections, partnership progress, original-message editing, draft management, the review/manual-action queue and private account-export controls. Original downloaded data, candidate content, source/status codes, other detailed workspace tools, admin and server messages remain unchanged/English. Language settings store only your choice in this browser.",
            "Vertaling in ontwikkeling: startpagina, inloggen/registratie, e-mailbevestiging, wachtwoordherstel, profielinstellingen en niet-gevondenpagina, plus werkruimtenavigatie, veiligheidsstatus, bediening van de platformgids, zoeken/filteren/sorteren/pagineren in de kandidatenlijst, herinneringen/gesprekken, kandidaatdetails/profielcorrecties, samenwerkingsvoortgang, oorspronkelijke berichten bewerken, conceptbeheer, de beoordelings-/handmatige-actiewachtrij en bediening van de privé-accountexport zijn beschikbaar in het Nederlands. Oorspronkelijke gedownloade gegevens, kandidaatinhoud, bron-/statuscodes, overige gedetailleerde werkruimtetools, beheer en serverberichten blijven ongewijzigd/Engels. De taalinstelling bewaart alleen je keuze in deze browser."
          )}
        </p>
      </div>
    </div>
  );
}
