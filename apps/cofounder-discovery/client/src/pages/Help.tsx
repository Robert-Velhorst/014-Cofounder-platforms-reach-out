import { useLanguage } from "@/contexts/LanguageContext";

export default function Help() {
  const { language, text } = useLanguage();
  const sections = [
    {
      id: "access",
      title: text("Getting access", "Toegang krijgen"),
      paragraphs: [
        text(
          "Sign in with your own account. Registration is available only when the operator enables it. New accounts need genuine email verification before protected workspace work. Starting the service does not create a verified account.",
          "Log in met je eigen account. Registreren kan alleen als de beheerder dit toestaat. Nieuwe accounts moeten hun e-mailadres echt bevestigen voordat ze de beveiligde werkruimte kunnen gebruiken. De dienst starten maakt geen bevestigd account aan."
        ),
        text(
          "If verification or recovery mail does not arrive, check your inbox and spam folder, then contact the service operator through the channel they provided. Do not assume an account is verified or that mail was delivered because a request was accepted.",
          "Komt een bevestigings- of herstelmail niet aan? Controleer je inbox en spammap en neem daarna contact op met de beheerder via het opgegeven kanaal. Een ontvangen aanvraag betekent niet dat je account bevestigd is of dat de mail bezorgd is."
        ),
      ],
    },
    {
      id: "workflow",
      title: text(
        "Your first candidate and message",
        "Je eerste kandidaat en bericht"
      ),
      paragraphs: [
        text(
          "Save your private background and preferences in profile setup. Browse Find platforms for possible discovery routes. The catalogue is a guide, not working integrations or a complete worldwide list; check each source's eligibility, costs and rules yourself.",
          "Bewaar je achtergrond en voorkeuren privé bij de profielinstellingen. Bekijk de platformgids voor mogelijke vindplaatsen. Dit is een gids, geen verzameling werkende koppelingen of volledige wereldwijde lijst. Controleer zelf de toelatingseisen, kosten en regels van elke bron."
        ),
        text(
          "Add one candidate or import permitted direct-from-person CSV data with a processing-rights declaration and evidence reference. Inspect details and duplicates, then qualify the candidate. A score or import declaration is not permission to contact someone.",
          "Voeg één kandidaat toe of importeer toegestane CSV-gegevens die rechtstreeks van de persoon komen, met een verklaring over verwerkingsrechten en een bewijsreferentie. Bekijk details en mogelijke dubbelen en beoordeel daarna de kandidaat. Een score of importverklaring geeft geen toestemming om iemand te benaderen."
        ),
        text(
          "Write an original individual draft, review the exact text and source rules, submit it for review and explicitly approve it. Applying a saved template is not approval. Prepare a manual action only when contact is allowed.",
          "Schrijf een oorspronkelijk, persoonlijk concept. Beoordeel de precieze tekst en bronregels, dien het concept ter beoordeling in en keur het expliciet goed. Een opgeslagen sjabloon toepassen is geen goedkeuring. Bereid alleen een handmatige actie voor als het contact is toegestaan."
        ),
        text(
          "Copy the approved message and perform any authorized contact outside this app yourself. Record what actually happened, replies and outcomes. Internal reminders do not send follow-ups. A user-confirmed send is not provider-confirmed delivery.",
          "Kopieer het goedgekeurde bericht en voer toegestaan contact zelf buiten deze app uit. Leg vast wat er echt gebeurde, inclusief reacties en resultaten. Interne herinneringen versturen geen vervolgberichten. Jouw verzendbevestiging is geen bezorgbewijs van het platform."
        ),
      ],
    },
    {
      id: "rights",
      title: text("Permissions and opt-outs", "Toestemming en afmelden"),
      paragraphs: [
        text(
          "The app does not automatically scrape, contact people or click Send. A public profile, private-group membership or saved source card is not consent. Unknown or blocked sources cannot be relabeled as manual data to bypass restrictions.",
          "De app verzamelt niet automatisch gegevens, benadert geen mensen en klikt niet op Verzenden. Een openbaar profiel, lidmaatschap van een privégroep of opgeslagen bronkaart is geen toestemming. Je mag onbekende of geblokkeerde bronnen niet als handmatige gegevens hernoemen om beperkingen te omzeilen."
        ),
        text(
          "Record an opt-out when someone asks not to be contacted. Do not create another candidate to evade it. Archiving hides a record from the active list; restoring it does not remove an opt-out or grant contact rights.",
          "Leg een afmelding vast wanneer iemand niet meer benaderd wil worden. Maak geen nieuwe kandidaat aan om dit te omzeilen. Archiveren verbergt een record in de actieve lijst. Herstellen verwijdert geen afmelding en geeft geen contactrechten."
        ),
      ],
    },
    {
      id: "recovery",
      title: text("When something fails", "Als iets mislukt"),
      paragraphs: [
        text(
          "A busy or unavailable service is not a successful save. Keep your unsent text and retry only when the service is ready. For an uncertain CSV import, keep the exact file, evidence, declaration and retry key; use the interface's unchanged retry rather than creating a different import. Check the stored result before adding duplicates.",
          "Een drukke of onbereikbare dienst betekent niet dat opslaan is gelukt. Bewaar je onverstuurde tekst en probeer het pas opnieuw als de dienst beschikbaar is. Bewaar bij een onzekere CSV-import precies hetzelfde bestand, bewijs, dezelfde verklaring en pogingssleutel. Gebruik de ongewijzigde herhaalpoging in de interface in plaats van een andere import. Controleer het opgeslagen resultaat voordat je dubbelen toevoegt."
        ),
        text(
          "If a candidate changed after your review, reload the latest details and review again before editing. Do not replace someone else's saved change with a stale version. If the signed-in account changed in another tab, sign back into the original account before retrying its unsaved work.",
          "Is een kandidaat na jouw beoordeling gewijzigd? Laad de nieuwste details en beoordeel die opnieuw voordat je bewerkt. Overschrijf geen opgeslagen wijziging met een oude versie. Is in een ander tabblad een ander account ingelogd? Log dan opnieuw in op het oorspronkelijke account voordat je het onverwerkte werk opnieuw probeert."
        ),
        text(
          "If an external send is uncertain, check the destination yourself before sending again. The app cannot establish delivery. Reloading, signing out or closing an editor can lose unsaved work; copy your own draft somewhere private first when needed.",
          "Is een externe verzending onzeker? Controleer zelf de bestemming voordat je opnieuw verstuurt. De app kan bezorging niet vaststellen. Herladen, uitloggen of een editor sluiten kan niet-opgeslagen werk verliezen. Bewaar zo nodig eerst je eigen concept op een privéplek."
        ),
      ],
    },
    {
      id: "data",
      title: text(
        "Exports, deletion and privacy",
        "Exporteren, verwijderen en privacy"
      ),
      paragraphs: [
        text(
          "Active-candidate CSV export includes stored records from your own account, not unsaved previews or other accounts. Formula-risk values receive visible protective prefixes. Account JSON export needs current-password confirmation and has size limits; it is not a complete service backup.",
          "CSV-export van actieve kandidaten bevat opgeslagen records van je eigen account, geen onverwerkte voorbeelden of andere accounts. Waarden met formulerisico krijgen een zichtbare beschermende prefix. JSON-accountexport vereist je huidige wachtwoord en kent groottelimieten. Dit is geen volledige back-up van de dienst."
        ),
        text(
          "A deletion request, when enabled, is review-held intake—not instant erasure. Ask the operator about the actual retention and deletion policy; do not assume archived records, backups or receiver copies were erased. Never remove a database volume to troubleshoot your account.",
          "Een verwijderverzoek, als dit beschikbaar is, wordt aangehouden voor beoordeling en wist niet direct alle gegevens. Vraag de beheerder naar het werkelijke bewaar- en verwijderbeleid. Ga er niet van uit dat gearchiveerde records, back-ups of kopieën bij ontvangers gewist zijn. Verwijder nooit een databasevolume om je account te repareren."
        ),
        text(
          "When asking for support, share the action, time, safe error message and request identifier if shown. Do not send passwords, session cookies, secret files, candidate lists or full exports through an unapproved support channel. No support inbox or response-time promise is configured by this guide.",
          "Deel bij een hulpvraag de handeling, het tijdstip, de veilige foutmelding en de aanvraagcode als die getoond wordt. Stuur geen wachtwoorden, sessiecookies, geheime bestanden, kandidatenlijsten of volledige exports via een niet-goedgekeurd hulpkanaal. Deze gids stelt geen helpdeskadres of beloofde reactietijd in."
        ),
      ],
    },
  ];
  return (
    <main
      id="help-top"
      lang={language}
      className="min-h-screen bg-neutral-950 px-5 py-8 text-neutral-100"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <nav
          aria-label={text("Help navigation", "Hulpnavigatie")}
          className="flex flex-wrap gap-5 text-sm"
        >
          <a href="/" className="underline underline-offset-4">
            {text("Home", "Startpagina")}
          </a>
          <a href="/outreach" className="underline underline-offset-4">
            {text("Open workspace", "Werkruimte openen")}
          </a>
        </nav>
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            {text("Using CoFounder Outreach", "CoFounder Outreach gebruiken")}
          </h1>
          <p className="text-base leading-relaxed text-neutral-300">
            {text(
              "Private research and human-reviewed, manual outreach. The free public beta is still in development, not an approved production service.",
              "Privéonderzoek en handmatig contact na menselijke beoordeling. De gratis openbare bèta is nog in ontwikkeling, geen goedgekeurde productiedienst."
            )}
          </p>
          <p className="text-sm leading-relaxed text-neutral-400">
            {text(
              "Help opens in a new tab so you can read it without leaving an unsaved editor. English and Dutch are available here; other detailed workspace and server text may remain English.",
              "Hulp opent in een nieuw tabblad zodat je een niet-opgeslagen editor niet hoeft te verlaten. Deze gids is beschikbaar in het Engels en Nederlands. Andere gedetailleerde werkruimte- en serverteksten kunnen Engels blijven."
            )}
          </p>
        </header>
        <nav aria-label={text("Guide topics", "Onderwerpen in de gids")}>
          <ul className="space-y-2">
            {sections.map(section => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="underline underline-offset-4"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {sections.map(section => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className="scroll-mt-5 space-y-4 border-t border-white/10 pt-7"
          >
            <h2 id={`${section.id}-title`} className="text-xl font-semibold">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-base leading-relaxed text-neutral-300"
              >
                {paragraph}
              </p>
            ))}
            <a
              href="#help-top"
              className="inline-block text-sm underline underline-offset-4"
            >
              {text("Back to top", "Terug naar boven")}
            </a>
          </section>
        ))}
      </div>
    </main>
  );
}
