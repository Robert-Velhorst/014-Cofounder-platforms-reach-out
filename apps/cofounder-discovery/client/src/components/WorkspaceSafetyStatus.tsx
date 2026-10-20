import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { PauseCircle, ShieldCheck } from "lucide-react";

type SafetyState = {
  paused?: boolean;
  failed: boolean;
  fetching: boolean;
  retry: () => unknown;
};

export function WorkspaceModeBadge({
  paused,
  failed,
  fetching,
}: Omit<SafetyState, "retry">) {
  const { language, text } = useLanguage();
  const known = !failed && !fetching && typeof paused === "boolean";
  return (
    <Badge
      lang={language}
      className="hidden sm:inline-flex"
      variant={known && paused ? "destructive" : "secondary"}
    >
      {!known
        ? text("Safety status unknown", "Veiligheidsstatus onbekend")
        : paused
          ? text("Outreach paused", "Contact opnemen gepauzeerd")
          : text("Assisted mode", "Ondersteunde modus")}
    </Badge>
  );
}

export function WorkspaceSafetyStatus({
  paused,
  failed,
  fetching,
  retry,
}: SafetyState) {
  const { language, text } = useLanguage();
  if (failed || fetching || typeof paused !== "boolean")
    return (
      <Alert lang={language} variant={failed ? "destructive" : "default"}>
        <ShieldCheck />
        <AlertTitle className="line-clamp-none break-words">
          {failed
            ? text(
                "Could not check outreach safety status",
                "De veiligheidsstatus kon niet worden gecontroleerd"
              )
            : text(
                "Checking outreach safety status",
                "De veiligheidsstatus wordt gecontroleerd"
              )}
        </AlertTitle>
        <AlertDescription>
          {text(
            "The operator pause state is unknown. This screen does not confirm that preparing a manual send is available; the server checks permission for each action.",
            "De pauzestatus van de beheerder is onbekend. Dit scherm bevestigt niet dat je een handmatige verzending kunt voorbereiden; de server controleert de toestemming voor elke actie."
          )}
          <Button
            className="mt-3"
            variant="outline"
            disabled={fetching}
            onClick={retry}
          >
            {text("Retry safety check", "Veiligheid opnieuw controleren")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  return paused ? (
    <Alert lang={language} variant="destructive">
      <PauseCircle />
      <AlertTitle className="line-clamp-none break-words">
        {text("Safety stop is active", "Veiligheidsstop is actief")}
      </AlertTitle>
      <AlertDescription>
        {text(
          "Drafting and review remain available, but preparing a manual send is blocked by the operator.",
          "Concepten schrijven en beoordelen blijven beschikbaar, maar de beheerder blokkeert het voorbereiden van een handmatige verzending."
        )}
      </AlertDescription>
    </Alert>
  ) : (
    <Alert lang={language}>
      <ShieldCheck />
      <AlertTitle className="line-clamp-none break-words">
        {text("No autonomous send", "Geen automatische verzending")}
      </AlertTitle>
      <AlertDescription>
        {text(
          "The platform prepares copy and opens the known destination. You perform the external action and explicitly confirm the result.",
          "Het platform bereidt de tekst voor en opent de bekende bestemming. Je voert de externe actie zelf uit en bevestigt daarna uitdrukkelijk het resultaat."
        )}
      </AlertDescription>
    </Alert>
  );
}
