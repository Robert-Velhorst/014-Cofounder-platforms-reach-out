import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export function CandidateExport({
  accountId,
  accountBlocked,
}: {
  accountId: number;
  accountBlocked: boolean;
}) {
  const { language, text } = useLanguage();
  const utils = trpc.useUtils();
  const exportCsv = trpc.criticalPath.prospects.exportCsv.useMutation();
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const current = useRef({ accountId, accountBlocked });
  current.current = { accountId, accountBlocked };
  const [notice, setNotice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function exportMine() {
    if (inFlight.current || accountBlocked) return;
    inFlight.current = true;
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const result = await exportCsv.mutateAsync({ accountId });
      if (!mounted.current) return;
      // Never reuse a cached account result or an older in-flight identity check.
      await utils.auth.me.cancel();
      const fresh = await utils.auth.me.fetch(undefined, { staleTime: 0 });
      if (!mounted.current) return;
      if (
        result.accountId !== accountId ||
        fresh?.id !== accountId ||
        fresh.emailVerified !== 1 ||
        current.current.accountId !== accountId ||
        current.current.accountBlocked
      )
        throw new Error(
          "The signed-in account changed or could not be verified. No file was downloaded. Refresh before exporting."
        );
      const url = URL.createObjectURL(
        new Blob([result.csv], { type: "text/csv;charset=utf-8" })
      );
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.filename;
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      setNotice(result.rowCount);
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Export failed. No file was downloaded."
        );
    } finally {
      exportCsv.reset();
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <section
      lang={language}
      className="space-y-2"
      aria-label={text("Candidate CSV export", "CSV-export van kandidaten")}
    >
      <Button
        type="button"
        variant="outline"
        className="h-auto max-w-full whitespace-normal text-left"
        disabled={pending || accountBlocked}
        onClick={() => void exportMine()}
      >
        <Download className="size-4" />{" "}
        {pending
          ? text("Preparing export…", "Export voorbereiden…")
          : text("Export active candidates", "Actieve kandidaten exporteren")}
      </Button>
      <p className="text-xs text-neutral-400">
        {text(
          "All active candidates in this account, including opt-outs; excludes archived candidates and ignores the current search. Formula-like or whitespace-prefixed values receive a visible “text: ” prefix. This CSV is for viewing, not a lossless backup or full privacy export. Maximum 10,000 rows / 8 MiB; larger exports fail without a partial file.",
          "Alle actieve kandidaten in dit account, inclusief afgemelde personen; gearchiveerde kandidaten worden uitgesloten en de huidige zoekopdracht wordt genegeerd. Formuleachtige waarden en waarden met witruimte aan het begin krijgen het zichtbare voorvoegsel ‘text: ’. Deze CSV is bedoeld om te bekijken, niet als verliesvrije back-up of volledige privacy-export. Maximaal 10.000 regels / 8 MiB; grotere exports worden geweigerd zonder gedeeltelijk bestand."
        )}
      </p>
      {!accountBlocked && notice !== null ? (
        <p role="status" className="text-sm">
          {text(
            `CSV generated for ${notice} active candidates. Your browser started the download.`,
            `CSV gemaakt voor ${notice} actieve kandidaten. Je browser heeft de download gestart.`
          )}
        </p>
      ) : null}
      {accountBlocked ? (
        <p role="alert" className="text-sm text-red-300">
          {text(
            "Could not verify your account. Refresh your workspace before exporting. Export is unavailable until your account can be verified.",
            "Je account kon niet worden geverifieerd. Vernieuw je werkruimte voordat je exporteert. Exporteren is niet beschikbaar totdat je account kan worden geverifieerd."
          )}
        </p>
      ) : null}
      {!accountBlocked && error ? (
        <p role="alert" lang="en" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
