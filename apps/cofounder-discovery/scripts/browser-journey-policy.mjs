// Pure safety/receipt rules shared by the real driver, fixture runner and native tests.
export const BROWSER_JOURNEY_STAGES = Object.freeze([
  "normal-and-hover-login-text-contrast",
  "responsive-login-headings-and-keyboard-form",
  "real-login-and-compiled-workspace",
  "current-catalogue-alias-search-and-responsive-rules",
  "human-declared-candidate-intake",
  "dutch-candidate-corrections-retain-evidence-and-unsaved-inputs",
  "real-assessment-before-opt-out-enables-retained-progress",
  "original-draft-review-approval-manual-preparation",
  "synthetic-manual-completion-receipt-no-delivery",
  "future-reminder-persists-and-queue-renders",
  "real-http-reminder-account-isolation",
  "response-requires-review-and-clears-reminder",
  "desktop-mobile-history-and-reminder-controls",
  "close-retains-history-and-clears-reminder",
  "dutch-candidate-details-archive-restore-opt-out-retain-evidence",
  "dutch-progress-save-preserves-opt-out-original-notes-and-language-switch",
  "export-requires-current-password-and-explicit-private-review",
  "actual-private-json-download-includes-closed-conversation-not-credentials",
  "real-http-export-account-mismatch-and-anonymous-refusal",
  "dutch-unsent-revision-cancellation-retains-version-history",
  "dutch-csv-guidance-language-switch-preserves-unsent-declaration",
  "committed-csv-lost-response-replays-without-duplicates",
  "rejected-csv-requires-explicit-record-review-before-editing",
  "oversized-retained-export-refused-without-partial-download",
]);

export function validateBrowserFixtureDatabase(value, owner) {
  const refuse = () => {
    throw new Error("browser_journey_config_refused");
  };
  if (
    typeof value !== "string" ||
    !/^mysql:\/\/cofounder:[a-f0-9]{64}@127\.0\.0\.1:3306\/cofounder_test$/.test(
      value
    ) ||
    typeof owner !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      owner
    )
  )
    refuse();
  let url;
  try {
    url = new URL(value);
  } catch {
    refuse();
  }
  if (
    url.protocol !== "mysql:" ||
    url.username !== "cofounder" ||
    !/^[a-f0-9]{64}$/.test(url.password) ||
    url.hostname !== "127.0.0.1" ||
    url.port !== "3306" ||
    url.pathname !== "/cofounder_test" ||
    url.search !== "" ||
    url.hash !== ""
  )
    refuse();
  return url;
}

export function redactBrowserFailure(value, secrets) {
  let text = String(value ?? "unknown_failure");
  for (const secret of secrets)
    if (typeof secret === "string" && secret)
      text = text.replaceAll(secret, "[redacted]");
  return text.slice(0, 2048);
}

export function validateBrowserJourneyReceipt(value) {
  const refuse = () => {
    throw new Error("complete_browser_journey_receipt_refused");
  };
  if (
    !value ||
    value.passed !== true ||
    value.transport !== "isolated-http-loopback" ||
    !Array.isArray(value.stages) ||
    value.stages.length !== BROWSER_JOURNEY_STAGES.length ||
    value.stages.some(
      (name, index) => name !== BROWSER_JOURNEY_STAGES[index]
    ) ||
    value.rpcMocks !== 0 ||
    value.responseFaultsInjected !== 1 ||
    value.externalProviderActions !== 0 ||
    value.realSends !== 0 ||
    value.syntheticCompletionRecords !== 1 ||
    value.verification !== "synthetic-preverified-not-inbox" ||
    typeof value.browser !== "string" ||
    value.browser.length < 3 ||
    !Array.isArray(value.errors) ||
    value.errors.length !== 0 ||
    !Array.isArray(value.external) ||
    value.external.length !== 0
  )
    refuse();
  return value;
}
