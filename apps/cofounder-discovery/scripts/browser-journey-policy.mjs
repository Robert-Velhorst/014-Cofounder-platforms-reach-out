// Pure safety/receipt rules shared by the real driver, fixture runner and native tests.
import {
  COLD_ASSET_PHASE,
  validateColdAssetEvidence,
} from "./browser-cold-assets.mjs";
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

export const BROWSER_ONBOARDING_STAGES = Object.freeze([
  "private-profile-first-run-language-and-responsive-review",
  "private-profile-real-save-retains-canonical-private-data",
  "private-profile-unsaved-edit-roundtrip-and-reload",
  "private-profile-second-save-and-fresh-session",
  "private-profile-http-owner-and-publication-refusals",
  "private-profile-cross-account-browser-boundary",
]);

export const BROWSER_ACCOUNT_RIGHTS_STAGES = Object.freeze([
  "account-deletion-english-request-refresh-and-reload",
  "account-deletion-dutch-withdraw-retains-account",
  "account-deletion-dutch-rerequest-and-english-withdraw",
  "account-deletion-http-owner-and-anonymous-refusals",
]);

// Both are OS CJK fonts in the reviewed Debian/Playwright test environment.
// Retain actual three-glyph coverage; reject custom/last-resort font reports.
export function hasSyntheticCjkGlyphs(fonts) {
  return (
    Array.isArray(fonts) &&
    fonts.some(
      font =>
        font &&
        typeof font.postScriptName === "string" &&
        /^(?:NotoSansCJK|WenQuanYiZenHei$)/i.test(font.postScriptName) &&
        font.isCustomFont === false &&
        font.glyphCount === 3
    )
  );
}

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

// Docker stderr is not a trusted diagnostic stream. Publish only the driver's
// known failure envelopes, never arbitrary CLI output, stack traces or fields.
export function browserJourneyFailureDiagnostics(stderr, secrets = []) {
  if (typeof stderr !== "string") return [];
  const diagnostics = [];
  const events = new Set([
    "browser_journey_failed",
    "browser_journey_rejected",
    "browser_journey_process_failure",
    "browser_journey_timeout",
  ]);
  for (const line of stderr.split(/\r?\n/)) {
    if (line.length > 16384) continue;
    let value;
    try {
      value = JSON.parse(line);
    } catch {
      continue;
    }
    if (!value || typeof value !== "object" || !events.has(value.event))
      continue;
    if (
      value.stage !== "startup" &&
      !BROWSER_JOURNEY_STAGES.includes(value.stage) &&
      !BROWSER_ONBOARDING_STAGES.includes(value.stage) &&
      !BROWSER_ACCOUNT_RIGHTS_STAGES.includes(value.stage) &&
      value.stage !== COLD_ASSET_PHASE
    )
      continue;
    const diagnostic = { event: value.event, stage: value.stage };
    if (typeof value.error === "string")
      diagnostic.error = redactBrowserFailure(value.error, secrets);
    if (["unhandledRejection", "uncaughtException"].includes(value.kind))
      diagnostic.kind = value.kind;
    for (const field of ["consoleErrorCount", "externalRequestCount"])
      if (
        Number.isSafeInteger(value[field]) &&
        value[field] >= 0 &&
        value[field] <= 1000000
      )
        diagnostic[field] = value[field];
    diagnostics.push(diagnostic);
    if (diagnostics.length === 8) break;
  }
  return diagnostics;
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
    !Array.isArray(value.onboardingStages) ||
    value.onboardingStages.length !== BROWSER_ONBOARDING_STAGES.length ||
    value.onboardingStages.some(
      (name, index) => name !== BROWSER_ONBOARDING_STAGES[index]
    ) ||
    !Array.isArray(value.accountRightsStages) ||
    value.accountRightsStages.length !== BROWSER_ACCOUNT_RIGHTS_STAGES.length ||
    value.accountRightsStages.some(
      (name, index) => name !== BROWSER_ACCOUNT_RIGHTS_STAGES[index]
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
  validateColdAssetEvidence(value.coldAssets);
  return value;
}
