import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Users } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/outreach");
    },
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/outreach");
    },
  });
  const mutation = mode === "login" ? login : register;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "login") await login.mutateAsync({ email, password });
    else await register.mutateAsync({ name, email, password });
  }

  return (
    <main className="grid min-h-screen bg-neutral-950 text-neutral-50 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.2),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.2),_transparent_38%)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold"><Users className="size-6 text-orange-400" /> CoFounder Outreach</div>
        <div className="max-w-xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-300">Review-first workflow</p>
          <h1 className="text-5xl font-semibold leading-tight">Find the right conversation. Keep the final action human.</h1>
          <p className="text-lg leading-relaxed text-neutral-300">Import only data you are allowed to use, qualify prospects, review every draft, and record what actually happened. The system never claims a message was delivered without your confirmation.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-400"><ShieldCheck className="size-4 text-emerald-400" /> Local accounts · isolated workspaces · assisted outreach</div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-white/10 bg-neutral-900/80 text-neutral-50 shadow-2xl">
          <CardHeader>
            <CardTitle>{mode === "login" ? "Sign in" : "Create an account"}</CardTitle>
            <CardDescription>{mode === "login" ? "Continue to your private outreach workspace." : "Registration may be restricted by the operator."}</CardDescription>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              {mutation.error ? <Alert variant="destructive"><AlertTitle>Could not continue</AlertTitle><AlertDescription>{mutation.error.message}</AlertDescription></Alert> : null}
              {mode === "register" ? <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required minLength={2} /></div> : null}
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} required minLength={mode === "register" ? 12 : 1} /><p className="text-xs text-neutral-400">New passwords need 12+ characters, upper/lowercase, and a number.</p></div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</Button>
              <Button className="w-full" type="button" variant="ghost" onClick={() => setMode(current => current === "login" ? "register" : "login")}>{mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}</Button>
            </CardFooter>
          </form>
        </Card>
      </section>
    </main>
  );
}
