import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function ImportRecoveryNotice({
  uncertain,
  busy,
  onRelease,
}: {
  uncertain: boolean;
  busy: boolean;
  onRelease: () => void;
}) {
  const { language, text } = useLanguage();
  if (!uncertain) return null;
  return (
    <section
      role="alert"
      lang={language}
      className="space-y-3 rounded-md border p-3"
    >
      <p>
        {text(
          "No confirmed import result. The records may already have been saved. Your CSV and declaration are locked so you can retry the same submission safely.",
          "Geen bevestigd importresultaat. De gegevens kunnen al zijn opgeslagen. Je CSV en verklaring zijn vergrendeld zodat je dezelfde inzending veilig opnieuw kunt proberen."
        )}
      </p>
      <p className="text-sm">
        {text(
          "Do not reload before resolving this result. If you need to change the submission, check your candidates first: rows without profile URLs cannot be deduplicated across a new import.",
          "Laad de pagina niet opnieuw voordat dit resultaat is opgehelderd. Als je de inzending moet wijzigen, controleer dan eerst je kandidaten: regels zonder profiel-URL kunnen bij een nieuwe import niet worden ontdubbeld."
        )}
      </p>
      <Button
        className="h-auto max-w-full whitespace-normal text-left"
        type="button"
        variant="outline"
        disabled={busy}
        onClick={onRelease}
      >
        {text(
          "Allow editing after checking records",
          "Bewerken toestaan na controle van kandidaten"
        )}
      </Button>
    </section>
  );
}
