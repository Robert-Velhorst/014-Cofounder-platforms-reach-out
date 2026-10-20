import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createCustomerSupportPreview,
  supportChecks,
  supportStatuses,
  type SupportObservation,
} from "@shared/customer-support";

const labels: Record<string, string> = {
  sign_in: "Sign-in",
  email_verification: "Email verification",
  password_recovery: "Password recovery",
  candidate_save: "Candidate saving",
  preset_save: "Private defaults saving",
  draft_save: "Draft saving",
  manual_action: "Manual action preparation",
  account_export: "Account export",
  not_checked: "Not checked",
  pass: "Worked when I checked",
  unavailable: "Unavailable",
  unauthorized: "Sign-in required",
  forbidden: "Not permitted",
  invalid_input: "Input rejected",
  conflict: "Conflicting or outdated change",
  capacity_reached: "Capacity reached",
  not_configured: "Not configured",
};

export function CustomerSupportBundle({ blocked }: { blocked: boolean }) {
  const [observations, setObservations] = useState<SupportObservation[]>([
    { check: "candidate_save", status: "not_checked" },
  ]);
  const [reviewed, setReviewed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const preview = JSON.stringify(
    createCustomerSupportPreview({ observations }),
    null,
    2
  );
  function change(next: SupportObservation[]) {
    setObservations(next);
    setReviewed(false);
    setNotice(null);
    setError(false);
  }
  function download() {
    if (blocked || !reviewed) return;
    setNotice(null);
    setError(false);
    let url: string | undefined;
    try {
      url = URL.createObjectURL(
        new Blob([preview + "\n"], { type: "application/json;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "cofounder-support.json";
      link.click();
      setReviewed(false);
      setNotice(
        "Your browser started the diagnostic download. Nothing was uploaded. Review the saved file before sharing it."
      );
    } catch {
      setError(true);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }
  return (
    <section
      lang="en"
      aria-label="Local support diagnostics"
      className="space-y-4 rounded-xl border p-4"
    >
      <h2 className="text-xl font-semibold">Prepare support diagnostics</h2>
      <p>
        Choose only checks you actually observed. Leave uncertain checks as Not
        checked. This is your report, not an automatic health test or proof that
        the service worked.
      </p>
      <p className="text-sm">
        Only the check/status labels below enter this file. No account details,
        candidate data, messages, logs, credentials, URLs or browser metadata
        are collected. Nothing is uploaded or sent. There is no connected
        support recipient; sharing needs your separate decision. Do not attach a
        private account export automatically.
      </p>
      {blocked ? (
        <p role="alert">
          Your workspace account could not be verified. Refresh before preparing
          a diagnostic download.
        </p>
      ) : null}
      <fieldset disabled={blocked} className="space-y-4 min-w-0">
        <legend className="sr-only">Selected support observations</legend>
        {observations.map((row, index) => (
          <div key={index} className="grid min-w-0 gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor={`support-check-${index}`}>
                Check {index + 1}
              </Label>
              <select
                id={`support-check-${index}`}
                className="w-full rounded-md border bg-background p-2"
                value={row.check}
                onChange={event =>
                  change(
                    observations.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            check: event.target
                              .value as SupportObservation["check"],
                          }
                        : item
                    )
                  )
                }
              >
                {supportChecks.map(value => (
                  <option key={value} value={value}>
                    {labels[value]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`support-status-${index}`}>
                Observed result {index + 1}
              </Label>
              <select
                id={`support-status-${index}`}
                className="w-full rounded-md border bg-background p-2"
                value={row.status}
                onChange={event =>
                  change(
                    observations.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            status: event.target
                              .value as SupportObservation["status"],
                          }
                        : item
                    )
                  )
                }
              >
                {supportStatuses.map(value => (
                  <option key={value} value={value}>
                    {labels[value]}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={observations.length === 1}
              onClick={() => change(observations.filter((_, i) => i !== index))}
            >
              Remove observation {index + 1}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={observations.length >= 20}
          onClick={() =>
            change([
              ...observations,
              { check: "candidate_save", status: "not_checked" },
            ])
          }
        >
          Add observation
        </Button>
        <p className="text-sm">
          {observations.length} of 20 observations. Edits always clear download
          approval.
        </p>
        <details>
          <summary className="cursor-pointer">
            Review exact diagnostic JSON
          </summary>
          <pre
            aria-label="Diagnostic JSON preview"
            className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs"
          >
            {preview}
          </pre>
        </details>
        <Label className="flex items-start gap-3 leading-relaxed">
          <input
            type="checkbox"
            checked={!blocked && reviewed}
            onChange={event => {
              setReviewed(event.target.checked);
              setNotice(null);
            }}
          />
          I reviewed the exact JSON and want to download these selected
          observations locally
        </Label>
        <Button
          type="button"
          className="h-auto whitespace-normal"
          disabled={blocked || !reviewed}
          onClick={download}
        >
          Download support JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          className="ml-2 h-auto whitespace-normal"
          onClick={() =>
            change([{ check: "candidate_save", status: "not_checked" }])
          }
        >
          Reset observations
        </Button>
      </fieldset>
      {!blocked && notice ? <p role="status">{notice}</p> : null}
      {!blocked && error ? (
        <p role="alert">
          The diagnostic download could not be started. No upload was attempted.
          Try again after checking your browser download settings.
        </p>
      ) : null}
      <p className="text-sm">
        Selections stay only in this mounted page; leaving this tab or reloading
        discards them. The downloaded file is unencrypted and contains your
        selected observations. Keep it private until you choose a recipient;
        delete it when no longer needed.
      </p>
    </section>
  );
}
