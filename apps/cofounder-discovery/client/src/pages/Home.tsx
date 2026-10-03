import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  ClipboardCheck,
  Database,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { text } = useLanguage();
  const steps = [
    {
      icon: Database,
      title: text("Import responsibly", "Verantwoord importeren"),
      body: text(
        "Bring permitted CSV or manual prospect data into your private workspace.",
        "Voeg alleen toegestane CSV- of handmatig verzamelde kandidaatgegevens toe aan je privéwerkruimte."
      ),
    },
    {
      icon: Users,
      title: text("Qualify", "Geschiktheid beoordelen"),
      body: text(
        "Review structured compatibility signals and decide who merits a conversation.",
        "Beoordeel gestructureerde signalen over de samenwerking en bepaal met wie je wilt spreken."
      ),
    },
    {
      icon: ClipboardCheck,
      title: text("Approve every draft", "Elk concept goedkeuren"),
      body: text(
        "Nothing leaves the product without an explicit human review step.",
        "Vóór een externe handeling is een expliciete menselijke beoordeling nodig."
      ),
    },
    {
      icon: MessageSquareText,
      title: text("Send with context", "Versturen met context"),
      body: text(
        "Copy the approved message, open the destination, and record the real outcome.",
        "Kopieer het goedgekeurde bericht, open de bestemming en leg het werkelijke resultaat vast."
      ),
    },
  ];
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3 font-semibold">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-violet-600">
              <Users className="size-5" />
            </div>{" "}
            CoFounder Outreach
          </div>
          <Button asChild>
            <Link href={isAuthenticated ? "/outreach" : "/login"}>
              {isAuthenticated
                ? text("Open console", "Werkruimte openen")
                : text("Sign in", "Inloggen")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div className="space-y-7">
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-300"
          >
            <ShieldCheck className="size-3" />{" "}
            {text(
              "Review-first assisted outreach",
              "Begeleid contact, na beoordeling"
            )}
          </Badge>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            {text(
              "Turn co-founder research into thoughtful, accountable conversations.",
              "Maak van je zoektocht naar een medeoprichter zorgvuldige gesprekken die je kunt verantwoorden."
            )}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-neutral-300">
            {text(
              "A controlled workspace for prospect import, qualification, message drafting, human approval, assisted sending, follow-up, and measurable outcomes. No fake provider connections. No autonomous posting by default.",
              "Een gecontroleerde werkruimte voor kandidaten importeren en beoordelen, berichten opstellen, menselijke goedkeuring, begeleid versturen, opvolging en meetbare resultaten. Geen fictieve providerverbindingen. Geen automatische berichten als standaard."
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={isAuthenticated ? "/outreach" : "/login"}>
                {isAuthenticated
                  ? text("Continue your work", "Verder werken")
                  : text("Start securely", "Veilig beginnen")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/api/health">
                {text("Service health", "Servicestatus")}
              </a>
            </Button>
          </div>
        </div>
        <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-violet-500/10">
          <CardHeader>
            <CardTitle>
              {text("What “assisted” means", "Wat ‘begeleid’ betekent")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-neutral-300">
            <p>
              {text(
                "The product can prepare and organize the work. You remain responsible for platform permission, the final message, and the external send action.",
                "Het product kan het werk voorbereiden en organiseren. Jij blijft verantwoordelijk voor toestemming op het platform, de definitieve tekst en het daadwerkelijk versturen buiten dit product."
              )}
            </p>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="font-medium text-white">
                {text("Truthful delivery state", "Eerlijke verzendstatus")}
              </p>
              <p className="mt-1">
                {text(
                  "A message is counted as sent only after you explicitly confirm that you completed the external action.",
                  "Een bericht telt pas als verstuurd nadat je expliciet bevestigt dat je de externe handeling hebt uitgevoerd."
                )}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="font-medium text-white">
                {text("Safety stop", "Veiligheidspauze")}
              </p>
              <p className="mt-1">
                {text(
                  "Operators can pause all send preparation while leaving research and review available.",
                  "Beheerders kunnen de verzendvoorbereiding pauzeren terwijl onderzoek en beoordeling beschikbaar blijven."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <p className="mb-8 text-sm font-medium uppercase tracking-[0.22em] text-neutral-400">
            {text("Critical path", "Van onderzoek naar contact")}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="border-white/10">
                <CardHeader>
                  <div className="mb-5 flex items-center justify-between">
                    <step.icon className="size-5 text-orange-400" />
                    <span className="text-xs text-neutral-500">
                      0{index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-neutral-400">
                  {step.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {text(
            "CoFounder Outreach · production-safe assisted workflow",
            "CoFounder Outreach · gecontroleerde, begeleide werkwijze"
          )}
        </span>
        <span>
          {text(
            "Privacy by ownership · audit by default",
            "Eigen gegevens afgeschermd · handelingen vastgelegd"
          )}
        </span>
      </footer>
    </main>
  );
}
