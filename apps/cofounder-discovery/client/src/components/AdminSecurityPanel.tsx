import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SecurityPhase } from "@/lib/admin-security-flow";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

export type AdminSecurityStatus =
  inferRouterOutputs<AppRouter>["auth"]["adminMfa"]["status"];
type Props = {
  status: AdminSecurityStatus | undefined;
  ready: boolean;
  supported: boolean;
  phase: SecurityPhase;
  now: number;
  problem: string;
  notice: string;
  onEnroll: (input: {
    password: string;
    grant?: string;
    label: string;
  }) => void;
  onVerify: () => void;
  onRemove: (input: { keyId: string; password: string }) => void;
  onCancel: () => void;
  onRefresh: () => void;
};
const section =
  "space-y-4 rounded-xl border border-white/10 bg-neutral-900/50 p-5 sm:p-6";
export function AdminSecurityPanel(props: Props) {
  const { status, ready, supported, phase, now, problem, notice } = props;
  const busy = phase !== "idle";
  const keys = ready ? (status?.passkeys ?? []) : [];
  const elevated =
    ready && !!status?.elevatedUntil && Date.parse(status.elevatedUntil) > now;
  return (
    <div className="space-y-6">
      {problem ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 p-4 text-red-200"
        >
          {problem}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-emerald-200">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-neutral-300">
          {!ready
            ? "Checking security status…"
            : elevated
              ? "Verification active for this session"
              : "Verification required for administrator actions"}
        </p>
        <Button variant="outline" disabled={busy} onClick={props.onRefresh}>
          Refresh security status
        </Button>
      </div>
      {elevated ? (
        <p className="text-sm text-neutral-400">
          Expires {new Date(status!.elevatedUntil!).toLocaleTimeString()}. The
          server rechecks every privileged action; this display is not an
          authorization token.
        </p>
      ) : null}
      {!supported ? (
        <p role="alert" className="text-amber-200">
          Passkeys require a supported secure browser. Open this application
          over HTTPS (or localhost for development). No weaker sign-in method is
          offered here.
        </p>
      ) : null}
      {busy ? (
        <div role="status" className={section}>
          <p>
            {phase === "preparing"
              ? "Checking your account and requesting a challenge…"
              : phase === "prompt"
                ? "Complete the passkey prompt on your device. Never enter its PIN into this page."
                : "Waiting for the server to confirm this action. A submitted change cannot be cancelled here."}
          </p>
          {phase !== "saving" ? (
            <Button variant="outline" onClick={props.onCancel}>
              Cancel device prompt
            </Button>
          ) : null}
        </div>
      ) : null}
      {ready && keys.length > 0 ? (
        <section className={section} aria-labelledby="registered-passkeys">
          <h2 id="registered-passkeys" className="text-lg font-semibold">
            Registered passkeys
          </h2>
          <ul className="divide-y divide-white/10">
            {keys.map(key => (
              <li key={key.keyId} className="space-y-1 py-3">
                <p className="break-words font-medium">{key.label}</p>
                <p className="text-sm text-neutral-400">
                  Added {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt
                    ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                    : " · Not used for verification yet"}
                </p>
                <p className="text-sm text-neutral-400">
                  {key.backedUp
                    ? "Authenticator reports this passkey is backed up."
                    : "Authenticator does not report a backup."}
                </p>
              </li>
            ))}
          </ul>
          {supported ? (
            <Button onClick={props.onVerify} disabled={busy}>
              {elevated ? "Verify again with passkey" : "Verify with passkey"}
            </Button>
          ) : null}
          <p className="text-sm text-neutral-400">
            Verification lasts up to five minutes in this browser session. A new
            login needs new verification.
          </p>
        </section>
      ) : null}
      {ready &&
      supported &&
      (keys.length === 0 || elevated) &&
      keys.length < 5 ? (
        <section className={section} aria-labelledby="add-passkey">
          <h2 id="add-passkey" className="text-lg font-semibold">
            {keys.length
              ? "Add a backup passkey"
              : "Register your first passkey"}
          </h2>
          <p className="text-sm text-neutral-400">
            {keys.length
              ? "Adding a key ends verification in all sessions. Verify again afterward."
              : "An operator must approve first enrollment. Your password alone cannot enable administrator access."}
          </p>
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const input = {
                label: String(data.get("label") ?? "").trim(),
                password: String(data.get("password") ?? ""),
                ...(keys.length
                  ? {}
                  : { grant: String(data.get("grant") ?? "").trim() }),
              };
              form.reset();
              props.onEnroll(input);
            }}
          >
            <fieldset className="space-y-4" disabled={busy}>
              <div className="space-y-2">
                <Label htmlFor="passkey-label">Passkey label</Label>
                <Input
                  id="passkey-label"
                  name="label"
                  required
                  maxLength={80}
                  autoComplete="off"
                  placeholder="For example: laptop or backup key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enrollment-password">
                  Current account password
                </Label>
                <Input
                  id="enrollment-password"
                  name="password"
                  type="password"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                />
              </div>
              {keys.length === 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="enrollment-grant">
                    Operator enrollment approval
                  </Label>
                  <Input
                    id="enrollment-grant"
                    name="grant"
                    type="password"
                    required
                    minLength={43}
                    maxLength={43}
                    pattern={"[A-Za-z0-9_\\-]{43}"}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <p className="text-sm text-neutral-400">
                    Paste the short-lived approval privately. Do not put it in a
                    URL or send your password to the operator.
                  </p>
                </div>
              ) : null}
              <Button type="submit">Register passkey</Button>
            </fieldset>
          </form>
        </section>
      ) : null}
      {ready && keys.length >= 5 ? (
        <p className="text-sm text-neutral-400">
          Five passkeys are registered. Remove an unused backup before adding
          another.
        </p>
      ) : null}
      {ready && keys.length === 1 ? (
        <p className="text-sm text-neutral-400">
          Keep at least one passkey. Verify first to add an independently usable
          backup before public operator acceptance.
        </p>
      ) : null}
      {ready && supported && elevated && keys.length > 1 ? (
        <section className={section} aria-labelledby="remove-passkey">
          <h2 id="remove-passkey" className="text-lg font-semibold">
            Remove an unused passkey
          </h2>
          <p className="text-sm text-neutral-400">
            Removal ends verification in all sessions. Ensure another passkey
            still works first.
          </p>
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const input = {
                keyId: String(data.get("keyId") ?? ""),
                password: String(data.get("password") ?? ""),
              };
              form.reset();
              props.onRemove(input);
            }}
          >
            <fieldset className="space-y-4" disabled={busy}>
              <div className="space-y-2">
                <Label htmlFor="remove-key">Passkey to remove</Label>
                <select
                  id="remove-key"
                  name="keyId"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-white/20 bg-neutral-950 p-2 text-sm"
                >
                  <option value="" disabled>
                    Choose a passkey
                  </option>
                  {keys.map(key => (
                    <option key={key.keyId} value={key.keyId}>
                      {key.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="removal-password">
                  Current account password
                </Label>
                <Input
                  id="removal-password"
                  name="password"
                  type="password"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" required className="mt-1" />I have
                another usable passkey and want to remove the selected key.
              </label>
              <Button type="submit" variant="destructive">
                Confirm removal
              </Button>
            </fieldset>
          </form>
        </section>
      ) : null}
      <section
        className="space-y-2 border-t border-white/10 pt-5 text-sm text-neutral-400"
        aria-labelledby="lost-passkeys"
      >
        <h2 id="lost-passkeys" className="font-semibold text-neutral-200">
          Lost access to your passkeys?
        </h2>
        <p>
          Use another registered passkey if available. Password reset does not
          remove administrator MFA. Otherwise contact the service operator for
          identity review; self-service factor reset is not available.
        </p>
        <p>
          This page never asks for your authenticator PIN, biometric data or
          private key. Keep a separately usable backup and protect access to
          your devices.
        </p>
      </section>
    </div>
  );
}
