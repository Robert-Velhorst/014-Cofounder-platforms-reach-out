import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardCheck, Download, LogOut, PauseCircle, RefreshCw, ShieldCheck, Upload, Users } from "lucide-react";

const sampleCsv = "name,title,location,skills,industries,platform,profileUrl,consentStatus\nAlex Example,Technical founder,Amsterdam,TypeScript|AI,SaaS,manual,https://example.com/alex,unknown";
const newKey = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;

function download(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function OutreachConsole() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [csv, setCsv] = useState(sampleCsv);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const status = trpc.criticalPath.status.useQuery();
  const prospects = trpc.criticalPath.prospects.list.useQuery({ query: search, page: 1, pageSize: 50 });
  const outreach = trpc.criticalPath.outreach.list.useQuery();
  const analytics = trpc.criticalPath.analytics.useQuery();
  const exportCsv = trpc.criticalPath.prospects.exportCsv.useQuery(undefined, { enabled: false });
  const importCsv = trpc.criticalPath.prospects.importCsv.useMutation({ onSuccess: () => prospects.refetch() });
  const qualify = trpc.criticalPath.qualify.useMutation();
  const draft = trpc.criticalPath.outreach.draft.useMutation({ onSuccess: () => outreach.refetch() });
  const submitReview = trpc.criticalPath.outreach.submitReview.useMutation({ onSuccess: () => outreach.refetch() });
  const approve = trpc.criticalPath.outreach.approve.useMutation({ onSuccess: () => outreach.refetch() });
  const prepare = trpc.criticalPath.outreach.prepareManualSend.useMutation({ onSuccess: () => outreach.refetch() });
  const confirm = trpc.criticalPath.outreach.confirmSent.useMutation({ onSuccess: async () => { await outreach.refetch(); await analytics.refetch(); } });
  const response = trpc.criticalPath.outreach.recordResponse.useMutation({ onSuccess: async () => { await outreach.refetch(); await analytics.refetch(); } });
  const logout = trpc.auth.logout.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); navigate("/login"); } });
  const mutationError = useMemo(() => error || importCsv.error?.message || qualify.error?.message || draft.error?.message || submitReview.error?.message || approve.error?.message || prepare.error?.message || confirm.error?.message || response.error?.message, [error, importCsv.error, qualify.error, draft.error, submitReview.error, approve.error, prepare.error, confirm.error, response.error]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try { await action(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Action failed"); }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-violet-600"><Users className="size-5" /></div><div className="min-w-0"><p className="truncate font-semibold">CoFounder Outreach</p><p className="text-xs text-neutral-400">Operator console</p></div></div>
          <div className="flex shrink-0 items-center gap-2"><Badge className="hidden sm:inline-flex" variant={status.data?.outreachPaused ? "destructive" : "secondary"}>{status.data?.outreachPaused ? "Outreach paused" : "Assisted mode"}</Badge><Button variant="ghost" size="sm" onClick={() => logout.mutate()}><LogOut className="size-4" /> Sign out</Button></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardDescription>Owned prospects</CardDescription><CardTitle className="text-3xl">{prospects.data?.total ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>User-confirmed sends</CardDescription><CardTitle className="text-3xl">{analytics.data?.confirmedSent ?? 0}</CardTitle></CardHeader></Card>
          <Card><CardHeader><CardDescription>Recorded response rate</CardDescription><CardTitle className="text-3xl">{analytics.data?.responseRate ?? 0}%</CardTitle></CardHeader></Card>
        </section>
        {status.data?.outreachPaused ? <Alert variant="destructive"><PauseCircle /><AlertTitle>Safety stop is active</AlertTitle><AlertDescription>Drafting and review remain available, but preparing a manual send is blocked by the operator.</AlertDescription></Alert> : <Alert><ShieldCheck /><AlertTitle>No autonomous send</AlertTitle><AlertDescription>The platform prepares copy and opens the known destination. You perform the external action and explicitly confirm the result.</AlertDescription></Alert>}
        {mutationError ? <Alert variant="destructive"><AlertTitle>Action did not complete</AlertTitle><AlertDescription>{mutationError}</AlertDescription></Alert> : null}

        <Tabs defaultValue="prospects">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto"><TabsTrigger value="prospects">Prospects</TabsTrigger><TabsTrigger value="outreach">Review queue</TabsTrigger><TabsTrigger value="providers">Providers</TabsTrigger></TabsList>
          <TabsContent value="prospects" className="space-y-6">
            <Card><CardHeader><CardTitle>Import permitted data</CardTitle><CardDescription>CSV only. Required column: name. Separate skills and industries with a vertical bar.</CardDescription></CardHeader><CardContent className="space-y-4"><Label htmlFor="csv">Prospect CSV</Label><Textarea id="csv" className="min-h-40 font-mono text-xs" value={csv} onChange={event => setCsv(event.target.value)} /><div className="flex flex-wrap gap-2"><Button onClick={() => run(() => importCsv.mutateAsync({ csv, idempotencyKey: newKey("csv") }))} disabled={importCsv.isPending}><Upload className="size-4" /> Import CSV</Button><Button variant="outline" onClick={() => run(async () => { const result = await exportCsv.refetch(); if (result.data) download(result.data.filename, result.data.csv); })}><Download className="size-4" /> Export mine</Button></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Prospect workspace</CardTitle><CardDescription>Every row is scoped to your account. Legacy unowned rows are quarantined.</CardDescription></CardHeader><CardContent><Input className="mb-4 max-w-sm" placeholder="Search name, title, or location" value={search} onChange={event => setSearch(event.target.value)} /><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Consent</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{prospects.data?.items.map(prospect => <TableRow key={prospect.id}><TableCell><div className="font-medium">{prospect.name}</div><div className="text-xs text-neutral-400">{prospect.title || prospect.location || "No details"}</div></TableCell><TableCell>{prospect.sourceKind}</TableCell><TableCell><Badge variant={prospect.consentStatus === "opted_out" ? "destructive" : "outline"}>{prospect.consentStatus}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => run(() => qualify.mutateAsync({ prospectId: prospect.id, idempotencyKey: newKey("qualify") }))}>Qualify</Button><Button size="sm" disabled={prospect.consentStatus === "opted_out"} onClick={() => run(() => draft.mutateAsync({ prospectId: prospect.id, idempotencyKey: newKey("draft") }))}>Draft</Button></div></TableCell></TableRow>)}{prospects.data?.items.length === 0 ? <TableRow><TableCell colSpan={4} className="py-12 text-center text-neutral-400">Import a permitted CSV to begin.</TableCell></TableRow> : null}</TableBody></Table></div></CardContent></Card>
          </TabsContent>
          <TabsContent value="outreach"><Card><CardHeader><CardTitle>Review and assisted-send queue</CardTitle><CardDescription>State changes are validated and written to your audit log.</CardDescription></CardHeader><CardContent className="space-y-4">{outreach.data?.map(item => <article key={item.outreach.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.prospect.name}</p><Badge variant="outline">{item.outreach.state.replaceAll("_", " ")}</Badge></div><div className="flex flex-wrap gap-2">{item.outreach.state === "draft" ? <Button size="sm" onClick={() => run(() => submitReview.mutateAsync({ id: item.outreach.id }))}><ClipboardCheck className="size-4" /> Submit review</Button> : null}{item.outreach.state === "pending_review" ? <Button size="sm" onClick={() => run(() => approve.mutateAsync({ id: item.outreach.id }))}><CheckCircle2 className="size-4" /> Approve</Button> : null}{item.outreach.state === "approved" ? <Button size="sm" onClick={() => run(() => prepare.mutateAsync({ id: item.outreach.id }))}>Prepare manual send</Button> : null}{item.outreach.state === "manual_action_required" ? <><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(item.outreach.body)}>Copy message</Button>{item.outreach.destinationUrl ? <Button size="sm" variant="outline" asChild><a href={item.outreach.destinationUrl} target="_blank" rel="noreferrer">Open destination</a></Button> : null}<Button size="sm" onClick={() => run(() => confirm.mutateAsync({ id: item.outreach.id, confirmation: true }))}>I sent this</Button></> : null}{item.outreach.state === "confirmed_sent" || item.outreach.state === "follow_up_due" ? <Button size="sm" onClick={() => run(() => response.mutateAsync({ id: item.outreach.id }))}>Record response</Button> : null}</div></div><pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black/30 p-4 font-sans text-sm leading-relaxed text-neutral-300">{item.outreach.body}</pre></article>)}{outreach.data?.length === 0 ? <div className="py-12 text-center text-neutral-400"><RefreshCw className="mx-auto mb-3 size-5" />Draft a prospect message to start the queue.</div> : null}</CardContent></Card></TabsContent>
          <TabsContent value="providers"><div className="grid gap-4 md:grid-cols-3">{status.data?.providers.map(provider => <Card key={provider.id}><CardHeader><div className="flex items-center justify-between"><CardTitle className="capitalize">{provider.id}</CardTitle><Badge variant="outline">Not connected</Badge></div><CardDescription>{provider.reason}</CardDescription></CardHeader><CardContent className="text-sm text-neutral-400">Mode: {provider.mode.replaceAll("_", " ")}. No provider delivery or credential status is simulated.</CardContent></Card>)}</div></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
