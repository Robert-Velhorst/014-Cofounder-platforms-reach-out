import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  filterPlatforms,
  platformReviewFreshness,
  PLATFORM_REVIEW_REMINDER_DAYS,
  type PlatformCategory,
  type PlatformRecord,
} from "@shared/platform-catalogue";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = {
  dedicated: ["Dedicated matching", "Gericht matchen"],
  community: ["Communities and channels", "Gemeenschappen en kanalen"],
  program: [
    "Programs, events and ecosystems",
    "Programma’s, evenementen en ecosystemen",
  ],
} as const;
const modes = {
  "manual-discovery": ["Manual discovery", "Handmatige ontdekking"],
  "human-original": [
    "Human-original participation",
    "Deelname met zelfgeschreven inhoud",
  ],
  "permission-required": [
    "Exact channel permission required",
    "Toestemming voor het specifieke kanaal vereist",
  ],
} as const;

export function PlatformCatalogue({ records }: { records: PlatformRecord[] }) {
  const { language, text } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlatformCategory | "all">("all");
  const visible = filterPlatforms(records, query, category);
  const asOf = new Date().toISOString().slice(0, 10);
  return (
    <section
      lang={language}
      aria-label={text(
        "Co-founder discovery catalogue",
        "Gids voor het vinden van een medeoprichter"
      )}
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {text(
            "Where to find a co-founder",
            "Waar vind je een medeoprichter?"
          )}
        </h2>
        <p className="text-sm text-neutral-300">
          {text(
            "A reviewed starting list, not every platform worldwide. Coverage is stronger for English-language and European/global sources. Listings are not integrations, endorsements or guarantees of access.",
            "Een beoordeelde startlijst, niet alle platforms wereldwijd. De dekking is sterker voor Engelstalige en Europese/wereldwijde bronnen. Vermeldingen zijn geen integraties, aanbevelingen of garanties voor toegang."
          )}
        </p>
        <p className="text-sm text-neutral-300">
          {text(
            "Discovery only: no account connection, harvesting, posting or sending is enabled here. Read current provider and group rules before use. Free signup does not mean every feature is free; external costs are not included in this beta.",
            "Alleen ontdekken: accounts koppelen, gegevens verzamelen, berichten plaatsen of verzenden is hier niet ingeschakeld. Lees vóór gebruik de actuele platform- en groepsregels. Gratis registratie betekent niet dat elke functie gratis is; externe kosten zijn niet inbegrepen in deze bèta."
          )}
        </p>
        <p className="text-xs text-neutral-400">
          {text(
            "Review reminders use your device's UTC date",
            "Beoordelingsherinneringen gebruiken de UTC-datum van je apparaat"
          )}{" "}
          ({asOf}).{" "}
          {text("A review is due after", "Een beoordeling is nodig na")}{" "}
          {PLATFORM_REVIEW_REMINDER_DAYS}{" "}
          {text(
            "days; reminders refresh when this view renders. This is a maintenance reminder, not evidence that a source is unavailable. Even recent reviews do not grant permission or guarantee current access.",
            "dagen; herinneringen worden bijgewerkt wanneer deze weergave opnieuw wordt weergegeven. Dit is een onderhoudsherinnering, geen bewijs dat een bron niet beschikbaar is. Ook recente beoordelingen geven geen toestemming of garantie voor actuele toegang."
          )}
        </p>
      </div>
      <p className="text-xs text-neutral-400">
        {text(
          "Controls and explanations support Dutch. Original source summaries and restrictions remain English; search uses those original records, not translated synonyms.",
          "Bediening en uitleg zijn beschikbaar in het Nederlands. Oorspronkelijke bronsamenvattingen en beperkingen blijven Engels; zoeken gebruikt die oorspronkelijke vermeldingen, niet vertaalde synoniemen."
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="platform-search">
            {text(
              "Search name, alias, audience or region",
              "Zoek op naam, alias, doelgroep of regio"
            )}
          </Label>
          <Input
            id="platform-search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={text(
              "For example: StartHawk or Amsterdam",
              "Bijvoorbeeld: StartHawk of Amsterdam"
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-category">
            {text("Source category", "Broncategorie")}
          </Label>
          <select
            id="platform-category"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={category}
            onChange={event =>
              setCategory(event.target.value as PlatformCategory | "all")
            }
          >
            <option value="all">
              {text("All categories", "Alle categorieën")}
            </option>
            {Object.entries(categories).map(([value, label]) => (
              <option key={value} value={value}>
                {text(label[0], label[1])}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p role="status" className="text-sm text-neutral-400">
        {visible.length} {text("of", "van")} {records.length}{" "}
        {text(
          "discovery records. No verified live integrations.",
          "vermeldingen. Geen geverifieerde live-integraties."
        )}
      </p>
      {visible.length === 0 ? (
        <p className="rounded-lg border border-white/10 p-6">
          {text(
            "No sources match these filters. Try another name or region, or choose all categories.",
            "Geen bronnen passen bij deze filters. Probeer een andere naam of regio, of kies alle categorieën."
          )}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map(record => {
          const freshness = platformReviewFreshness(record.reviewedAt, asOf);
          return (
            <Card key={record.id} className="min-w-0">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle>
                    <h3>{record.name}</h3>
                  </CardTitle>
                  <Badge variant="outline">
                    {text("Not connected", "Niet gekoppeld")}
                  </Badge>
                </div>
                <CardDescription>
                  {text(
                    categories[record.category][0],
                    categories[record.category][1]
                  )}
                  {record.kind === "channel-template"
                    ? text(
                        " · Channel template, not a verified group",
                        " · Kanaalsjabloon, geen geverifieerde groep"
                      )
                    : ""}
                </CardDescription>
                <p lang="en" className="text-sm">
                  {record.audience}
                </p>
                {record.aliases.length > 0 ? (
                  <p className="text-xs text-neutral-400">
                    {text("Also known as:", "Ook bekend als:")}{" "}
                    {record.aliases.join(", ")}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1 rounded-md border border-white/10 p-3">
                  <p>
                    {text(
                      "Public-page review:",
                      "Beoordeling van openbare pagina’s:"
                    )}{" "}
                    {record.reviewedAt}
                    {freshness.ageDays !== null
                      ? ` · ${freshness.ageDays} ${text(freshness.ageDays === 1 ? "day ago" : "days ago", freshness.ageDays === 1 ? "dag geleden" : "dagen geleden")}`
                      : ""}
                  </p>
                  {freshness.state !== "within-window" ? (
                    <p className="font-semibold text-amber-300">
                      {freshness.state === "review-due"
                        ? text(
                            "Review due — recheck access, cost and rules",
                            "Beoordeling nodig — controleer toegang, kosten en regels opnieuw"
                          )
                        : text(
                            "Review date needs checking",
                            "Beoordelingsdatum moet worden gecontroleerd"
                          )}
                    </p>
                  ) : null}
                </div>
                <dl className="space-y-3">
                  <div>
                    <dt className="font-semibold">
                      {text("Access", "Toegang")}
                    </dt>
                    <dd lang="en" className="text-neutral-300">
                      {record.access}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{text("Cost", "Kosten")}</dt>
                    <dd lang="en" className="text-neutral-300">
                      {record.pricing}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">
                      {text(
                        modes[record.assistance][0],
                        modes[record.assistance][1]
                      )}
                    </dt>
                    <dd lang="en" className="text-neutral-300">
                      {record.restrictions}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">
                      {text(
                        "Posting and integration permissions",
                        "Toestemming voor berichten en integraties"
                      )}
                    </dt>
                    <dd className="text-neutral-300">
                      {record.aiPostDrafts === "prohibited"
                        ? text(
                            "Generated/AI-edited posts prohibited.",
                            "Gegenereerde of met AI bewerkte berichten zijn verboden."
                          )
                        : text(
                            "AI posting permission unverified; not enabled by this catalogue.",
                            "Toestemming voor AI-berichten is niet geverifieerd; deze gids schakelt dit niet in."
                          )}{" "}
                      {text(
                        "Provider permission not verified; integration not implemented or live-tested.",
                        "Toestemming van het platform is niet geverifieerd; de integratie is niet geïmplementeerd of live getest."
                      )}
                    </dd>
                  </div>
                </dl>
                <a
                  className="inline-block underline underline-offset-4"
                  href={record.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {text("Visit", "Bezoek")} {record.name}{" "}
                  {text("(new tab)", "(nieuw tabblad)")}
                </a>
                <details className="text-xs text-neutral-400">
                  <summary className="cursor-pointer">
                    {text(
                      "Source evidence and review limitations",
                      "Bronbewijs en beperkingen van de beoordeling"
                    )}
                  </summary>
                  <p className="mt-2">
                    <span lang="en">{record.reviewer}</span>.{" "}
                    {text(
                      "Public-page review, not an authenticated workflow test. Some access or rule checks remain unresolved as noted above. Recheck before use.",
                      "Beoordeling van openbare pagina’s, geen ingelogde praktijktest. Sommige controles van toegang of regels blijven onopgelost, zoals hierboven vermeld. Controleer deze opnieuw vóór gebruik."
                    )}
                  </p>
                  <ul className="mt-2 list-disc space-y-2 pl-5">
                    {record.evidence.map((url, index) => (
                      <li key={url}>
                        <a
                          className="break-all underline"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {text("Source", "Bron")} {index + 1}: {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
