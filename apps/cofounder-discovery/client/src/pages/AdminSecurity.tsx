import { useEffect, useRef, useState } from "react";
import { Redirect } from "wouter";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnAbortService,
} from "@simplewebauthn/browser";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AdminSecurityPanel } from "@/components/AdminSecurityPanel";
import {
  createAdminSecurityFlow,
  adminSecurityError,
  type SecurityPhase,
} from "@/lib/admin-security-flow";

export default function AdminSecurity() {
  const account = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
  if (account.isError)
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Administrator security</h1>
        <p role="alert">
          Could not check your account. Security controls are unavailable.
        </p>
        <Button onClick={() => void account.refetch()}>
          Retry account check
        </Button>
      </main>
    );
  if (account.isLoading || !account.isFetchedAfterMount)
    return (
      <p role="status" className="p-6">
        Checking your account…
      </p>
    );
  if (!account.data) return <Redirect to="/login" />;
  if (account.data.emailVerified !== 1) return <Redirect to="/verify-email" />;
  if (account.data.role !== "admin")
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Administrator security</h1>
        <p role="alert">
          This page is available only to administrators. Your ordinary workspace
          remains available.
        </p>
        <a className="underline" href="/outreach">
          Back to workspace
        </a>
      </main>
    );
  return (
    <OwnerSecurity
      key={account.data.id}
      accountId={account.data.id}
      accountChecking={account.isFetching}
      refreshAccount={() => account.refetch()}
    />
  );
}
function OwnerSecurity({
  accountId,
  accountChecking,
  refreshAccount,
}: {
  accountId: number;
  accountChecking: boolean;
  refreshAccount: () => Promise<unknown>;
}) {
  const client = trpc.useUtils().client;
  const status = trpc.auth.adminMfa.status.useQuery(
    { accountId },
    { retry: false, refetchOnWindowFocus: true, refetchOnMount: "always" }
  );
  const flow = useRef<ReturnType<typeof createAdminSecurityFlow> | null>(null);
  const live = useRef(false);
  const actionVersion = useRef(0);
  const [phase, setPhase] = useState<SecurityPhase>("idle");
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now);
  const supported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    browserSupportsWebAuthn();
  const ready =
    !accountChecking &&
    status.isFetchedAfterMount &&
    !status.isFetching &&
    !status.isError &&
    status.data?.accountId === accountId;
  useEffect(() => {
    live.current = true;
    const mfa = client.auth.adminMfa;
    const instance = createAdminSecurityFlow({
      accountId,
      onPhase: setPhase,
      api: {
        account: () => client.auth.me.query(),
        beginEnrollment: input => mfa.beginEnrollment.mutate(input),
        finishEnrollment: input => mfa.finishEnrollment.mutate(input),
        beginStepUp: input => mfa.beginStepUp.mutate(input),
        finishStepUp: input => mfa.finishStepUp.mutate(input),
        removePasskey: input => mfa.removePasskey.mutate(input),
      },
      browser: {
        register: optionsJSON => startRegistration({ optionsJSON }),
        authenticate: optionsJSON => startAuthentication({ optionsJSON }),
        cancel: () => WebAuthnAbortService.cancelCeremony(),
      },
    });
    flow.current = instance;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      live.current = false;
      instance.dispose();
      flow.current = null;
      window.clearInterval(timer);
    };
  }, [accountId, client]);
  async function act(
    operation: (instance: NonNullable<typeof flow.current>) => Promise<unknown>,
    success: string
  ) {
    const instance = flow.current;
    if (!instance || !ready || !supported || instance.phase !== "idle") return;
    const version = ++actionVersion.current;
    const current = () =>
      live.current &&
      flow.current === instance &&
      actionVersion.current === version;
    setProblem("");
    setNotice("");
    try {
      await operation(instance);
      if (!current()) return;
      setNotice(success);
    } catch (error) {
      if (!current()) return;
      setProblem(adminSecurityError(error));
    } finally {
      if (current()) {
        await refreshAccount();
        if (current()) await status.refetch();
      }
    }
  }
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6">
        <a
          href="/outreach"
          className="text-sm text-neutral-300 underline underline-offset-4"
        >
          Back to workspace
        </a>
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Administrator security
          </h1>
          <p className="text-neutral-400">
            Protect privileged actions with a passkey. Your normal account
            password remains the first sign-in step.
          </p>
        </header>
        <AdminSecurityPanel
          status={status.data}
          ready={ready}
          supported={supported}
          phase={phase}
          now={now}
          problem={
            status.isError ||
            (status.data && status.data.accountId !== accountId)
              ? "Could not check security status. Controls are paused; refresh before continuing."
              : problem
          }
          notice={notice}
          onRefresh={() => {
            actionVersion.current++;
            setProblem("");
            setNotice("");
            void refreshAccount();
            void status.refetch();
          }}
          onEnroll={input =>
            void act(
              instance => instance.enroll(input),
              "Passkey registered. Verify with it before using administrator actions."
            )
          }
          onVerify={() =>
            void act(
              instance => instance.verify(),
              "The server confirmed your passkey. Current status is shown below."
            )
          }
          onRemove={input =>
            void act(
              instance => instance.remove(input),
              "Passkey removed. Verification ended in all sessions."
            )
          }
          onCancel={() => {
            if (flow.current?.cancel()) {
              actionVersion.current++;
              setNotice("");
              setProblem(
                "Verification cancelled. No new proof was submitted. An unused challenge expires automatically."
              );
            }
          }}
        />
      </div>
    </main>
  );
}
