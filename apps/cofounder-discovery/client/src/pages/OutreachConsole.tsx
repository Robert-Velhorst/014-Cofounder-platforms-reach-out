import { useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  WorkspaceModeBadge,
  WorkspaceSafetyStatus,
} from "@/components/WorkspaceSafetyStatus";
import { trpc } from "@/lib/trpc";
import { csvImportCopy, csvImportResultText } from "@/lib/csv-import-copy";
import {
  candidateWorkspaceCopy,
  candidateDetailsLabel,
  candidatePageLabel,
} from "@/lib/candidate-workspace-copy";
import { importDeclarationSchema } from "@shared/import-declaration";
import { PlatformCatalogue } from "@/components/PlatformCatalogue";
import { CandidateDetails } from "@/components/CandidateDetails";
import { CandidateIntake } from "@/components/CandidateIntake";
import { CandidateExport } from "@/components/CandidateExport";
import { ImportRecoveryNotice } from "@/components/ImportRecoveryNotice";
import { OutreachDraftManager } from "@/components/OutreachDraftManager";
import { OutreachReviewQueue } from "@/components/OutreachReviewQueue";
import { FollowUpQueue } from "@/components/FollowUpQueue";
import { AccountDataExport } from "@/components/AccountDataExport";
import { AccountDeletionRequest } from "@/components/AccountDeletionRequest";
import { CustomerSupportBundle } from "@/components/CustomerSupportBundle";
import type { CandidateSort } from "@shared/candidate-query";
import { WorkspacePresets } from "@/components/WorkspacePresets";
import {
  OutreachComposer,
  type ComposerProspect,
} from "@/components/OutreachComposer";
import { LogOut, Upload, Users } from "lucide-react";

const sampleCsv =
  "name,title,location,skills,industries,platform,profileUrl,consentStatus\nAlex Example,Technical founder,Amsterdam,TypeScript|AI,SaaS,manual,,unknown";
const newKey = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;

export default function OutreachConsole() {
  const { language, text } = useLanguage();
  const importCopy = csvImportCopy(language);
  const candidateCopy = candidateWorkspaceCopy(language);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [csv, setCsv] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [importReviewedBy, setImportReviewedBy] = useState<number | null>(null);
  const importAttempt = useRef<{ signature: string; key: string } | null>(null);
  const importInFlight = useRef(false);
  const [importUncertain, setImportUncertain] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    replayed: boolean;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [candidateSort, setCandidateSort] = useState<CandidateSort>("newest");
  const [page, setPage] = useState(1);
  const [candidateStatus, setCandidateStatus] = useState<
    "active" | "archived" | "all"
  >("active");
  const [intakeAccount, setIntakeAccount] = useState<number | null>(null);
  const [candidate, setCandidate] = useState<{
    id: number;
    accountId: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("prospects");
  const [presetReload, setPresetReload] = useState(0);
  const [managedOutreach, setManagedOutreach] = useState<{
    id: number;
    accountId: number;
  } | null>(null);
  const [composing, setComposing] = useState<ComposerProspect | null>(null);
  const qualificationKeys = useRef(new Map<number, string>());
  const qualificationInFlight = useRef(false);
  const qualifiedMatches = useRef(new Map<number, number>());
  const [assessment, setAssessment] = useState<{
    name: string;
    score: number | null;
    reasoning: string | null;
    recommendations: string[] | null;
    replayed: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const account = trpc.auth.me.useQuery(undefined, { retry: false });
  const importDeclaration = importDeclarationSchema.safeParse({
    collectionMethod: "direct_from_person",
    rightsConfirmed:
      importReviewedBy !== null && importReviewedBy === account.data?.id,
    evidenceReference,
  });
  const importBlocked =
    !csv.trim() || !importDeclaration.success || account.isError;
  const enabled = account.data?.emailVerified === 1;
  const presets = trpc.criticalPath.presets.read.useQuery(
    { accountId: account.data?.id ?? 0 },
    {
      enabled,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );
  const savePresets = trpc.criticalPath.presets.save.useMutation();
  const status = trpc.criticalPath.status.useQuery(undefined, { enabled });
  const platforms = trpc.criticalPath.platforms.useQuery(undefined, {
    enabled: enabled && activeTab === "providers",
    staleTime: 60_000,
  });
  const prospects = trpc.criticalPath.prospects.list.useQuery(
    {
      query: search,
      page,
      pageSize: 50,
      accountId: account.data?.id,
      status: candidateStatus,
      sort: candidateSort,
    },
    { enabled }
  );
  const outreach = trpc.criticalPath.outreach.list.useQuery(
    account.data ? { accountId: account.data.id } : undefined,
    {
      enabled,
    }
  );
  const analytics = trpc.criticalPath.analytics.useQuery(undefined, {
    enabled,
  });
  const importCsv = trpc.criticalPath.prospects.importCsv.useMutation({
    onSuccess: () => prospects.refetch(),
  });
  const importInputsLocked = importCsv.isPending || importUncertain;
  useEffect(() => {
    if (!importUncertain && !importCsv.isPending) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [importUncertain, importCsv.isPending]);
  const qualify = trpc.criticalPath.qualify.useMutation();
  const draft = trpc.criticalPath.outreach.draft.useMutation({
    onSuccess: () => outreach.refetch(),
  });
  const submitReview = trpc.criticalPath.outreach.submitReview.useMutation({
    onSuccess: () => outreach.refetch(),
  });
  const approve = trpc.criticalPath.outreach.approve.useMutation({
    onSuccess: () => outreach.refetch(),
  });
  const prepare = trpc.criticalPath.outreach.prepareManualSend.useMutation({
    onSuccess: () => outreach.refetch(),
  });
  const confirm = trpc.criticalPath.outreach.confirmSent.useMutation({
    onSuccess: async () => {
      await outreach.refetch();
      await analytics.refetch();
    },
  });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/login");
    },
  });
  const mutationError = useMemo(
    () =>
      error ||
      importCsv.error?.message ||
      qualify.error?.message ||
      draft.error?.message ||
      submitReview.error?.message ||
      approve.error?.message ||
      prepare.error?.message ||
      confirm.error?.message,
    [
      error,
      importCsv.error,
      qualify.error,
      draft.error,
      submitReview.error,
      approve.error,
      prepare.error,
      confirm.error,
    ]
  );

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    }
  }

  async function submitImport(event: React.FormEvent) {
    event.preventDefault();
    if (
      importInFlight.current ||
      importBlocked ||
      !importDeclaration.success ||
      !account.data
    )
      return;
    importInFlight.current = true;
    setImportResult(null);
    // Preserve the exact bytes and key after an uncertain response. State and
    // refs live above the tabs so switching views does not lose a retry receipt.
    const payload = {
      csv,
      declaration: importDeclaration.data,
      accountId: account.data.id,
    };
    const signature = JSON.stringify(payload);
    if (importAttempt.current?.signature !== signature)
      importAttempt.current = { signature, key: newKey("csv") };
    const attempt = importAttempt.current;
    setError(null);
    try {
      const result = await importCsv.mutateAsync({
        ...payload,
        idempotencyKey: attempt.key,
      });
      setImportResult(result);
      setImportUncertain(false);
    } catch (caught) {
      // A transport failure does not prove the transaction failed. Even server
      // refusals stay locked until unchanged retry or explicit record review.
      setImportUncertain(true);
      setError(
        caught instanceof Error
          ? caught.message
          : "Import result could not be confirmed"
      );
    } finally {
      importInFlight.current = false;
    }
  }

  async function qualifyProspect(prospect: ComposerProspect) {
    if (qualificationInFlight.current || composing) return;
    qualificationInFlight.current = true;
    setAssessment(null);
    let key = qualificationKeys.current.get(prospect.id);
    if (!key) {
      key = newKey("qualify");
      qualificationKeys.current.set(prospect.id, key);
    }
    const idempotencyKey = key;
    try {
      await run(async () => {
        const result = await qualify.mutateAsync({
          prospectId: prospect.id,
          idempotencyKey,
        });
        qualifiedMatches.current.set(prospect.id, result.match.id);
        setAssessment({
          name: prospect.name,
          score: result.match.overallScore,
          reasoning: result.match.reasoning,
          recommendations: result.match.recommendations,
          replayed: result.replayed,
        });
      });
    } finally {
      qualificationInFlight.current = false;
    }
  }

  async function openDestination(id: number) {
    // Reserve a blank tab during the click; never navigate before fresh review.
    const destination = window.open("about:blank", "_blank");
    if (!destination) {
      throw new Error(
        "Allow pop-ups for this app, then try opening the destination again."
      );
    }
    destination.opener = null;
    try {
      const action = await utils.criticalPath.outreach.manualAction.fetch(
        { id },
        { staleTime: 0 }
      );
      if (!action.destinationUrl)
        throw new Error("This contact has no reviewed destination URL.");
      destination.location.replace(action.destinationUrl);
    } catch (caught) {
      destination.close();
      throw caught;
    }
  }

  if (account.isLoading)
    return (
      <p role="status" lang={language} className="p-6">
        {text("Checking account…", "Je account wordt gecontroleerd…")}
      </p>
    );
  if (account.isError && !account.data)
    return (
      <p role="alert" lang={language} className="p-6">
        {text(
          "Could not check your account. Please reload to try again.",
          "Je account kon niet worden gecontroleerd. Laad de pagina opnieuw om het nogmaals te proberen."
        )}
      </p>
    );
  if (!account.data) return <Redirect to="/login" />;
  if (!enabled) return <Redirect to="/verify-email" />;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {intakeAccount !== null ? (
        <CandidateIntake
          key={intakeAccount}
          accountId={intakeAccount}
          accountBlocked={account.isError || account.data.id !== intakeAccount}
          onClose={() => setIntakeAccount(null)}
          onOpen={id => {
            setCandidate({ id, accountId: intakeAccount });
            setIntakeAccount(null);
          }}
          onChanged={() => {
            void prospects.refetch();
          }}
        />
      ) : null}
      {managedOutreach ? (
        <OutreachDraftManager
          key={`${managedOutreach.accountId}:${managedOutreach.id}`}
          {...managedOutreach}
          accountBlocked={
            account.isError || account.data.id !== managedOutreach.accountId
          }
          onClose={() => setManagedOutreach(null)}
          onNavigate={id =>
            setManagedOutreach({ id, accountId: managedOutreach.accountId })
          }
          onChanged={() => {
            void outreach.refetch();
            void analytics.refetch();
            void utils.criticalPath.outreach.reminders.invalidate();
          }}
        />
      ) : null}
      {candidate ? (
        <CandidateDetails
          key={`${candidate.accountId}:${candidate.id}`}
          {...candidate}
          accountBlocked={
            account.isError || account.data.id !== candidate.accountId
          }
          onClose={() => setCandidate(null)}
          onChanged={() => {
            void prospects.refetch();
            void outreach.refetch();
          }}
        />
      ) : null}
      <header
        lang={language}
        className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-violet-600">
              <Users className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">CoFounder Outreach</p>
              <p className="text-xs text-neutral-400">
                {text("Operator console", "Werkruimte")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {account.data.role === "admin" ? (
              <a
                href="/admin/security"
                className="text-sm underline underline-offset-4"
              >
                {text("Security", "Beveiliging")}
              </a>
            ) : null}
            <WorkspaceModeBadge
              paused={status.data?.outreachPaused}
              failed={status.isError}
              fetching={status.isFetching}
            />
            <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
              <LogOut className="size-4" /> {text("Sign out", "Uitloggen")}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Button
          lang={language}
          disabled={account.isError}
          onClick={() => setIntakeAccount(account.data!.id)}
        >
          {text("Add individual candidate", "Individuele kandidaat toevoegen")}
        </Button>
        <p lang={language} className="text-sm text-neutral-400">
          {text(
            "Navigation, safety status, platform-catalogue controls, candidate-list search/filter/order/pagination controls, reminders/conversations, individual candidate intake and duplicate review, candidate details/profile corrections, partnership progress, original-message editing, draft management and the review/manual-action queue support Dutch. Original candidate content and source/status codes stay unchanged; other detailed workspace tools and server messages remain English. A dash in statistics means that current values could not be confirmed.",
            "Navigatie, veiligheidsstatus, bediening van de platformgids, zoeken/filteren/sorteren/pagineren in de kandidatenlijst, herinneringen/gesprekken, individuele kandidaatinvoer en duplicatencontrole, kandidaatdetails/profielcorrecties, samenwerkingsvoortgang, oorspronkelijke berichten bewerken, conceptbeheer en de beoordelings-/handmatige-actiewachtrij zijn beschikbaar in het Nederlands. Oorspronkelijke kandidaatinhoud en bron-/statuscodes blijven ongewijzigd; andere gedetailleerde werkruimtetools en serverberichten blijven Engels. Een streepje in de statistieken betekent dat actuele waarden niet konden worden bevestigd."
          )}
        </p>
        <section
          lang={language}
          aria-label={text("Workspace statistics", "Werkruimtestatistieken")}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card>
            <CardHeader>
              <CardDescription>
                {text("Owned prospects", "Kandidaten in je account")}
              </CardDescription>
              <CardTitle className="text-3xl">
                {!prospects.isError && !prospects.isFetching && prospects.data
                  ? prospects.data.total
                  : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>
                {text(
                  "User-confirmed sends",
                  "Door jou bevestigde verzendingen"
                )}
              </CardDescription>
              <CardTitle className="text-3xl">
                {!analytics.isError && !analytics.isFetching && analytics.data
                  ? analytics.data.confirmedSent
                  : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>
                {text(
                  "Recorded response rate",
                  "Geregistreerd reactiepercentage"
                )}
              </CardDescription>
              <CardTitle className="text-3xl">
                {!analytics.isError && !analytics.isFetching && analytics.data
                  ? `${analytics.data.responseRate}%`
                  : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>
        <WorkspaceSafetyStatus
          paused={status.data?.outreachPaused}
          failed={status.isError}
          fetching={status.isFetching}
          retry={() => status.refetch()}
        />
        {mutationError ? (
          <Alert variant="destructive">
            <AlertTitle>Action did not complete</AlertTitle>
            <AlertDescription>{mutationError}</AlertDescription>
          </Alert>
        ) : null}

        {account.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not check your account</AlertTitle>
            <AlertDescription>
              Your unsaved work is retained. Workspace actions are paused until
              your account can be checked again.
              <Button
                className="mt-3"
                variant="outline"
                disabled={account.isFetching}
                onClick={() => account.refetch()}
              >
                Retry account check
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        <fieldset disabled={account.isError} className="min-w-0">
          <legend className="sr-only">Outreach workspace</legend>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              lang={language}
              className="grid h-auto w-full grid-cols-2 sm:w-auto sm:grid-cols-6"
            >
              <TabsTrigger value="prospects">
                {text("Prospects", "Kandidaten")}
              </TabsTrigger>
              <TabsTrigger value="outreach" disabled={composing !== null}>
                {text("Review queue", "Beoordelingswachtrij")}
              </TabsTrigger>
              <TabsTrigger value="followups" disabled={composing !== null}>
                {text("Follow-ups", "Vervolgcontact")}
              </TabsTrigger>
              <TabsTrigger value="account-data" disabled={composing !== null}>
                {text("Account data", "Accountgegevens")}
              </TabsTrigger>
              <TabsTrigger value="providers" disabled={composing !== null}>
                {text("Find platforms", "Platforms zoeken")}
              </TabsTrigger>
              <TabsTrigger value="presets" disabled={composing !== null}>
                {text("My defaults", "Mijn standaardinstellingen")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="prospects" className="space-y-6">
              <Button
                lang={language}
                variant="outline"
                disabled={
                  !presets.data || presets.isError || composing !== null
                }
                onClick={() => {
                  if (presets.data && !presets.isError) {
                    setSearch(presets.data.settings.search);
                    setCandidateStatus(presets.data.settings.candidateStatus);
                    setPage(1);
                  }
                }}
              >
                {candidateCopy.savedDefaults}
              </Button>
              {assessment ? (
                <Card role="region" aria-label="Saved fit assessment">
                  <CardHeader>
                    <CardTitle>
                      Saved assessment for {assessment.name}
                    </CardTitle>
                    <CardDescription>
                      {assessment.replayed
                        ? "Existing assessment recovered."
                        : "Assessment saved."}{" "}
                      Qualifying again reopens the saved assessment; profile
                      changes do not automatically rescore it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3" aria-live="polite">
                    <p className="text-2xl font-semibold">
                      {assessment.score === null
                        ? "No score recorded"
                        : `${assessment.score} / 100`}
                    </p>
                    <p className="break-words">
                      {assessment.reasoning ||
                        "No reasoning recorded. Review this prospect manually."}
                    </p>
                    {assessment.recommendations?.length ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {assessment.recommendations.map((item, index) => (
                          <li key={index} className="break-words">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="text-sm text-neutral-400">
                      This score is a review aid, not a probability of
                      co-founder success or permission to contact someone. New
                      assessments use local profile signals, not an external AI
                      service. Source rules and mutual interest still need
                      checking.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
              {composing ? (
                <OutreachComposer
                  key={composing.id}
                  prospect={composing}
                  presets={presets.isError ? undefined : presets.data?.settings}
                  onCancel={() => setComposing(null)}
                  onSave={async input => {
                    await draft.mutateAsync(input);
                    setComposing(null);
                    setActiveTab("outreach");
                  }}
                />
              ) : null}
              <Card lang={language}>
                <CardHeader>
                  <CardTitle>{importCopy.title}</CardTitle>
                  <CardDescription>{importCopy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={submitImport}
                    className="space-y-4"
                    aria-label={importCopy.form}
                  >
                    <Label htmlFor="csv">{importCopy.csv}</Label>
                    <Textarea
                      id="csv"
                      className="min-h-40 font-mono text-xs"
                      value={csv}
                      placeholder={sampleCsv}
                      disabled={importInputsLocked}
                      onChange={event => {
                        setCsv(event.target.value);
                        setImportReviewedBy(null);
                        setImportResult(null);
                      }}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="import-evidence">
                        {importCopy.evidence}
                      </Label>
                      <Input
                        id="import-evidence"
                        value={evidenceReference}
                        maxLength={120}
                        pattern={"[A-Za-z0-9][A-Za-z0-9._\\-]*"}
                        placeholder="contact-record-001"
                        required
                        aria-describedby="import-evidence-help"
                        disabled={importInputsLocked}
                        onChange={event => {
                          setEvidenceReference(event.target.value);
                          setImportReviewedBy(null);
                          setImportResult(null);
                        }}
                      />
                      <p
                        id="import-evidence-help"
                        className="text-xs text-neutral-400"
                      >
                        {importCopy.evidenceHelp}
                      </p>
                    </div>
                    <Label className="flex items-start gap-3 text-sm leading-relaxed">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 shrink-0"
                        checked={importReviewedBy === account.data.id}
                        disabled={importInputsLocked}
                        onChange={event =>
                          setImportReviewedBy(
                            event.target.checked
                              ? (account.data?.id ?? null)
                              : null
                          )
                        }
                      />
                      {importCopy.declaration}
                    </Label>
                    <p className="text-xs text-neutral-400">
                      {importCopy.declarationHelp}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        lang={language}
                        className="h-auto max-w-full whitespace-normal text-left"
                        type="submit"
                        disabled={importCsv.isPending || importBlocked}
                      >
                        <Upload className="size-4" />{" "}
                        {importCsv.isPending
                          ? importCopy.pending
                          : importUncertain
                            ? importCopy.retry
                            : importCopy.submit}
                      </Button>
                    </div>
                    <ImportRecoveryNotice
                      uncertain={importUncertain}
                      busy={importCsv.isPending || account.isError}
                      onRelease={() => {
                        if (importInFlight.current || account.isError) return;
                        if (
                          window.confirm(
                            text(
                              "Have you checked your candidates and the previous import outcome? Editing may create duplicates for people without profile URLs. Allow editing?",
                              "Heb je je kandidaten en het vorige importresultaat gecontroleerd? Bewerken kan duplicaten veroorzaken voor personen zonder profiel-URL. Bewerken toestaan?"
                            )
                          )
                        )
                          setImportUncertain(false);
                      }}
                    />
                    <CandidateExport
                      key={account.data.id}
                      accountId={account.data.id}
                      accountBlocked={account.isError}
                    />
                    {importResult ? (
                      <p role="status" className="text-sm">
                        {csvImportResultText(language, importResult)}
                      </p>
                    ) : null}
                    <p className="text-xs text-neutral-400">
                      {importCopy.storageHelp}
                    </p>
                  </form>
                </CardContent>
              </Card>
              <Card
                lang={language}
                role="region"
                aria-label={candidateCopy.title}
              >
                <CardHeader>
                  <CardTitle>{candidateCopy.title}</CardTitle>
                  <CardDescription>{candidateCopy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-2">
                    <Label htmlFor="candidate-status">
                      {candidateCopy.status}
                    </Label>
                    <select
                      id="candidate-status"
                      className="block rounded-md border bg-background px-3 py-2 text-foreground"
                      value={candidateStatus}
                      onChange={event => {
                        setCandidateStatus(
                          event.target.value as "active" | "archived" | "all"
                        );
                        setPage(1);
                      }}
                    >
                      <option value="active">{candidateCopy.active}</option>
                      <option value="archived">{candidateCopy.archived}</option>
                      <option value="all">{candidateCopy.all}</option>
                    </select>
                  </div>
                  <Input
                    className="mb-4 max-w-sm"
                    placeholder={candidateCopy.searchPlaceholder}
                    aria-label={candidateCopy.search}
                    maxLength={100}
                    value={search}
                    onChange={event => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />
                  <div className="mb-4 space-y-2">
                    <Label htmlFor="candidate-sort">
                      {candidateCopy.order}
                    </Label>
                    <select
                      id="candidate-sort"
                      className="block w-full max-w-sm rounded-md border bg-background px-3 py-2 text-foreground"
                      value={candidateSort}
                      onChange={event => {
                        setCandidateSort(event.target.value as CandidateSort);
                        setPage(1);
                      }}
                    >
                      <option value="newest">{candidateCopy.newest}</option>
                      <option value="oldest">{candidateCopy.oldest}</option>
                      <option value="name_asc">
                        {candidateCopy.nameAscending}
                      </option>
                      <option value="name_desc">
                        {candidateCopy.nameDescending}
                      </option>
                    </select>
                    <p className="text-xs text-neutral-400">
                      {candidateCopy.searchHelp}
                    </p>
                  </div>
                  {prospects.isError ? (
                    <div role="alert" className="mb-4 space-y-2">
                      <p>
                        {candidateCopy.loadError}{" "}
                        <span lang="en">{prospects.error.message}</span>
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => void prospects.refetch()}
                        disabled={prospects.isFetching}
                      >
                        {candidateCopy.retry}
                      </Button>
                    </div>
                  ) : null}
                  {prospects.isFetching ? (
                    <p role="status" className="mb-4 text-sm">
                      {candidateCopy.loading}
                    </p>
                  ) : null}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{candidateCopy.name}</TableHead>
                          <TableHead>{candidateCopy.source}</TableHead>
                          <TableHead>{candidateCopy.consent}</TableHead>
                          <TableHead className="text-right">
                            {candidateCopy.action}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prospects.data?.items.map(prospect => (
                          <TableRow key={prospect.id}>
                            <TableCell>
                              <div className="font-medium">{prospect.name}</div>
                              {prospect.archivedAt ? (
                                <Badge variant="outline">
                                  {candidateCopy.archivedBadge}
                                </Badge>
                              ) : null}
                              <div className="text-xs text-neutral-400">
                                {prospect.title ||
                                  prospect.location ||
                                  candidateCopy.noDetails}
                              </div>
                            </TableCell>
                            <TableCell lang="en">
                              {prospect.sourceKind}
                            </TableCell>
                            <TableCell>
                              <Badge
                                lang="en"
                                variant={
                                  prospect.consentStatus === "opted_out"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {prospect.consentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  aria-label={candidateDetailsLabel(
                                    language,
                                    prospect.name
                                  )}
                                  disabled={
                                    account.isError || prospects.isFetching
                                  }
                                  onClick={() => {
                                    if (account.data)
                                      setCandidate({
                                        id: prospect.id,
                                        accountId: account.data.id,
                                      });
                                  }}
                                >
                                  {candidateCopy.details}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    qualify.isPending ||
                                    composing !== null ||
                                    prospect.archivedAt !== null ||
                                    prospect.consentStatus === "opted_out"
                                  }
                                  onClick={() => qualifyProspect(prospect)}
                                >
                                  {candidateCopy.qualify}
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={
                                    composing !== null || qualify.isPending
                                  }
                                  onClick={() =>
                                    setComposing({
                                      ...prospect,
                                      matchId: qualifiedMatches.current.get(
                                        prospect.id
                                      ),
                                    })
                                  }
                                >
                                  {prospect.draftPolicy?.allowed
                                    ? candidateCopy.writeDraft
                                    : candidateCopy.sourceNotice}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {prospects.data?.items.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-12 text-center text-neutral-400"
                            >
                              {search
                                ? candidateCopy.noMatches
                                : page > 1
                                  ? candidateCopy.emptyPage
                                  : candidateStatus === "archived"
                                    ? candidateCopy.noArchived
                                    : candidateCopy.empty}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                  <nav
                    aria-label={candidateCopy.pages}
                    className="mt-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <Button
                      variant="outline"
                      aria-label={candidateCopy.previousLabel}
                      disabled={page <= 1 || prospects.isFetching}
                      onClick={() => setPage(value => Math.max(1, value - 1))}
                    >
                      {candidateCopy.previous}
                    </Button>
                    <p className="text-sm" aria-live="polite">
                      {candidatePageLabel(
                        language,
                        page,
                        prospects.data?.total
                      )}
                    </p>
                    <Button
                      variant="outline"
                      aria-label={candidateCopy.nextLabel}
                      disabled={
                        prospects.isFetching ||
                        prospects.isError ||
                        !prospects.data ||
                        page * 50 >= prospects.data.total
                      }
                      onClick={() => setPage(value => value + 1)}
                    >
                      {candidateCopy.next}
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="outreach">
              <OutreachReviewQueue
                items={account.isError ? undefined : outreach.data}
                accountId={account.data.id}
                blocked={
                  account.isError || outreach.isFetching || outreach.isError
                }
                pending={
                  submitReview.isPending ||
                  approve.isPending ||
                  prepare.isPending ||
                  confirm.isPending
                }
                onManage={id => {
                  if (account.data && !account.isError)
                    setManagedOutreach({ id, accountId: account.data.id });
                }}
                handlers={{
                  review: id => submitReview.mutateAsync({ id }),
                  approve: id => approve.mutateAsync({ id }),
                  prepare: id => prepare.mutateAsync({ id }),
                  confirm: id =>
                    confirm.mutateAsync({ id, confirmation: true }),
                  open: openDestination,
                  copy: async id => {
                    const action =
                      await utils.criticalPath.outreach.manualAction.fetch(
                        { id },
                        { staleTime: 0 }
                      );
                    await navigator.clipboard.writeText(action.body);
                  },
                }}
              />
            </TabsContent>
            <TabsContent value="followups">
              {account.data ? (
                <FollowUpQueue
                  key={account.data.id}
                  accountId={account.data.id}
                  blocked={account.isError || account.data.emailVerified !== 1}
                  onManage={id =>
                    setManagedOutreach({ id, accountId: account.data!.id })
                  }
                />
              ) : null}
            </TabsContent>
            <TabsContent value="account-data" className="space-y-6">
              {account.data ? (
                <CustomerSupportBundle
                  key={`support-${account.data.id}-${account.data.emailVerified}-${account.isError}`}
                  blocked={account.isError || account.data.emailVerified !== 1}
                />
              ) : null}
              {account.data ? (
                <AccountDeletionRequest
                  key={`deletion-${account.data.id}`}
                  accountId={account.data.id}
                  accountBlocked={
                    account.isError || account.data.emailVerified !== 1
                  }
                />
              ) : null}
              {account.data ? (
                <AccountDataExport
                  key={account.data.id}
                  accountId={account.data.id}
                  accountBlocked={
                    account.isError || account.data.emailVerified !== 1
                  }
                />
              ) : null}
            </TabsContent>
            <TabsContent value="presets" className="space-y-4">
              <Button
                variant="outline"
                className="h-auto whitespace-normal text-left"
                disabled={presets.isFetching || savePresets.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Reload saved defaults? Pending template and search edits will be discarded. Copy any unsaved text before continuing."
                    )
                  )
                    void presets.refetch().then(result => {
                      if (!result.isError) setPresetReload(value => value + 1);
                    });
                }}
              >
                Reload saved defaults (discard pending edits)
              </Button>
              {presets.isLoading ? (
                <p role="status">Loading your private defaults…</p>
              ) : null}
              {presets.isError ? (
                <div role="alert">
                  <p>
                    Could not refresh saved defaults. Existing edits are
                    retained; saving is paused.
                  </p>
                  <Button variant="outline" onClick={() => presets.refetch()}>
                    Retry loading defaults
                  </Button>
                </div>
              ) : null}
              {presets.data ? (
                <WorkspacePresets
                  key={`${account.data.id}:${presets.data.revision}:${presetReload}`}
                  settings={presets.data.settings}
                  revision={presets.data.revision}
                  blocked={account.isError || presets.isError}
                  onSave={async (settings, expectedRevision) => {
                    const actorId = account.data!.id;
                    const result = await savePresets.mutateAsync({
                      accountId: actorId,
                      settings,
                      expectedRevision,
                      confirmation: true,
                    });
                    utils.criticalPath.presets.read.setData(
                      { accountId: actorId },
                      { revision: result.revision, settings: result.settings }
                    );
                  }}
                />
              ) : null}
              <p>
                Reloading a newer saved revision replaces pending edits. Copy
                unsaved text before reloading after a conflict.
              </p>
            </TabsContent>
            <TabsContent value="providers" lang={language}>
              {platforms.isError ? (
                <Alert variant="destructive">
                  <AlertTitle className="line-clamp-none">
                    {text(
                      "Catalogue could not be loaded",
                      "De gids kon niet worden geladen"
                    )}
                  </AlertTitle>
                  <AlertDescription>
                    <p>
                      {text(
                        "No connection or permission status can be confirmed. Please try again.",
                        "Er kan geen koppelings- of toestemmingsstatus worden bevestigd. Probeer het opnieuw."
                      )}
                    </p>
                    <Button
                      className="mt-3"
                      variant="outline"
                      disabled={platforms.isFetching}
                      onClick={() => platforms.refetch()}
                    >
                      {text("Retry catalogue", "Gids opnieuw laden")}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : platforms.data ? (
                <PlatformCatalogue records={platforms.data} />
              ) : (
                <p role="status">
                  {text(
                    "Loading discovery catalogue…",
                    "De platformgids wordt geladen…"
                  )}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </fieldset>
      </div>
    </main>
  );
}
