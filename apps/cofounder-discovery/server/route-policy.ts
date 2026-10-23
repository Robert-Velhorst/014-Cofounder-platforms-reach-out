import type { RequestHandler } from "express";

// Explicit reviewed declarations: a group prefix never admits future endpoints.
// Handler authentication, ownership and feature flags still apply.
const SAFE_OPERATIONS: readonly string[] = [
  "accountData.deletionStatus",
  "accountData.export",
  "accountData.requestDeletion",
  "accountData.withdrawDeletion",
  "auth.adminMfa.beginEnrollment",
  "auth.adminMfa.beginStepUp",
  "auth.adminMfa.finishEnrollment",
  "auth.adminMfa.finishStepUp",
  "auth.adminMfa.removePasskey",
  "auth.adminMfa.status",
  "auth.checkVerificationStatus",
  "auth.login",
  "auth.logout",
  "auth.me",
  "auth.register",
  "auth.requestPasswordReset",
  "auth.resetPassword",
  "auth.sendVerificationEmail",
  "auth.verifyEmail",
  "criticalPath.analytics",
  "criticalPath.audit",
  "criticalPath.outreach.approve",
  "criticalPath.outreach.cancel",
  "criticalPath.outreach.close",
  "criticalPath.outreach.confirmSent",
  "criticalPath.outreach.conversation",
  "criticalPath.outreach.details",
  "criticalPath.outreach.draft",
  "criticalPath.outreach.list",
  "criticalPath.outreach.manualAction",
  "criticalPath.outreach.prepareManualSend",
  "criticalPath.outreach.recordResponse",
  "criticalPath.outreach.reminders",
  "criticalPath.outreach.revise",
  "criticalPath.outreach.scheduleFollowUp",
  "criticalPath.outreach.submitReview",
  "criticalPath.platforms",
  "criticalPath.presets.read",
  "criticalPath.presets.save",
  "criticalPath.progress.list",
  "criticalPath.progress.record",
  "criticalPath.prospects.add",
  "criticalPath.prospects.archive",
  "criticalPath.prospects.details",
  "criticalPath.prospects.edit",
  "criticalPath.prospects.exportCsv",
  "criticalPath.prospects.importCsv",
  "criticalPath.prospects.list",
  "criticalPath.prospects.optOut",
  "criticalPath.prospects.previewIntake",
  "criticalPath.prospects.restore",
  "criticalPath.qualify",
  "criticalPath.status",
  "profile.create",
  "profile.get",
  "profile.update",
  "system.health",
  "system.notifyOwner",
];
const safeOperationNames = new Set(SAFE_OPERATIONS);

export function getTrpcOperationNames(url: string): string[] {
  const path = decodeURIComponent(url.split("?")[0] ?? "").replace(/^\/+/, "");
  return path.split(",").filter(Boolean);
}

export function isSafeOperation(name: string) {
  return safeOperationNames.has(name);
}

export function permitsTrpcUrl(url: string, legacyEnabled: boolean) {
  if (legacyEnabled) return true;
  const names = getTrpcOperationNames(url);
  return names.length > 0 && names.every(isSafeOperation);
}

/** Production's exact HTTP gate, kept testable without executing app handlers. */
export function createTrpcRouteAdmission(
  legacyEnabled: boolean
): RequestHandler {
  return (req, res, next) => {
    res.setHeader("cache-control", "private, no-store");
    if (permitsTrpcUrl(req.url, legacyEnabled)) return next();
    res.status(403).json({
      error: "legacy_route_disabled",
      message:
        "This imported prototype route is disabled. Use /outreach and the criticalPath API.",
      requestId: res.getHeader("x-request-id"),
    });
  };
}
