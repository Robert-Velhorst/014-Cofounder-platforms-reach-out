# API usage audit

## Current structural inventory — October 2, 2026

Read-only TypeScript syntax-tree inspection of the actual appRouter and imported
routers finds **165 declared tRPC operations**. Default route-policy projection
admits **58** and denies **107**. There are **54 direct hook/simple imperative
client references in App.tsx's runtime-import graph**, zero unknown referenced
operations and zero references from that graph to default-denied operations.
Import-graph membership is not proof that a control renders for every user or
that its handler is authorized. Counts include duplicate references to an operation.

[Complete inventory](API_SURFACE_INVENTORY_2026-10-20.json) records all 165 operations,
query/mutation kind, procedure boundary, aliases, source line/handler digest,
policy decision, client reference locations and all 154 inspected source hashes,
including the procedure-boundary and HTTP-wrapper source files.
Input digest: `3a01f6cb36391385554c3117896672f5b8ff60c188c3b34c1f4aa58781768099`.
Latest refresh: candidate-list Dutch/English interface labels and content-language
attributes, plus one imported copy module. Compared the prior snapshot: all API
handler digests, boundaries, policy decisions, totals and client references remain
unchanged except source positions. All 170 operator cases passed without skips.
Earlier source refresh: [uncertain CSV recovery](CSV_IMPORT_RECOVERY_2026-10-02.md).
Only the inspected client input hashes changed; declared operations, admission
and hook counts are unchanged. No new endpoint or authorization was added.
No app modules or handlers are executed by the scanner. Direct hooks and simple
imperative aliases are covered; arbitrary dynamic clients, computed references,
external callers, runtime module conditions and background jobs are not an
exhaustive call graph. Whole `import type` declarations are excluded; individual
type-only named specifiers and conditional imports may over-approximate the graph.

The default policy now admits exactly the 58 named operations below, not entire
auth/profile/criticalPath/system prefixes. Future siblings/suffixes and mixed
reviewed/unreviewed batches refuse until the policy receives an explicit review.
All existing admitted declarations remain available. Admission is not public authorization:
publicProcedure has application-work admission; protectedProcedure additionally
requires a session; verifiedProcedure requires verified email; adminIdentityProcedure
adds live administrator identity; adminProcedure also requires persistent step-up.
Handler-level credential freshness, owner locks/fences, input bounds, transaction
semantics and feature flags require separate inspection/test evidence. In particular,
criticalPath's locally named protectedProcedure imports **verifiedProcedure**; the
scanner resolves that alias instead of understating the boundary. MFA owned alias
adds its explicit account check; the base boundary column is not the whole middleware.

### Every default-policy-admitted declaration

| Operation                                 | Kind     | Procedure boundary     | App-import-graph references | Source                                                                     |
| ----------------------------------------- | -------- | ---------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `accountData.deletionStatus`              | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L133)              |
| `accountData.export`                      | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L160)              |
| `accountData.requestDeletion`             | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L142)              |
| `accountData.withdrawDeletion`            | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L151)              |
| `auth.adminMfa.beginEnrollment`           | mutation | adminIdentityProcedure | 1                           | [Inspect](../apps/cofounder-discovery/server/admin-mfa-router.ts#L32)      |
| `auth.adminMfa.beginStepUp`               | mutation | adminIdentityProcedure | 1                           | [Inspect](../apps/cofounder-discovery/server/admin-mfa-router.ts#L52)      |
| `auth.adminMfa.finishEnrollment`          | mutation | adminIdentityProcedure | 1                           | [Inspect](../apps/cofounder-discovery/server/admin-mfa-router.ts#L43)      |
| `auth.adminMfa.finishStepUp`              | mutation | adminIdentityProcedure | 1                           | [Inspect](../apps/cofounder-discovery/server/admin-mfa-router.ts#L55)      |
| `auth.adminMfa.removePasskey`             | mutation | adminIdentityProcedure | 1                           | [Inspect](../apps/cofounder-discovery/server/admin-mfa-router.ts#L58)      |
| `auth.adminMfa.status`                    | query    | adminIdentityProcedure | 1                           | [Inspect](../apps/cofounder-discovery/server/admin-mfa-router.ts#L29)      |
| `auth.checkVerificationStatus`            | query    | protectedProcedure     | 0                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L305)              |
| `auth.login`                              | mutation | publicProcedure        | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L230)              |
| `auth.logout`                             | mutation | publicProcedure        | 2                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L260)              |
| `auth.me`                                 | query    | publicProcedure        | 5                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L174)              |
| `auth.register`                           | mutation | publicProcedure        | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L175)              |
| `auth.requestPasswordReset`               | mutation | publicProcedure        | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L284)              |
| `auth.resetPassword`                      | mutation | publicProcedure        | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L291)              |
| `auth.sendVerificationEmail`              | mutation | protectedProcedure     | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L266)              |
| `auth.verifyEmail`                        | mutation | publicProcedure        | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L269)              |
| `criticalPath.analytics`                  | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L605) |
| `criticalPath.audit`                      | query    | verifiedProcedure      | 0                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L638) |
| `criticalPath.outreach.approve`           | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L513) |
| `criticalPath.outreach.cancel`            | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L393) |
| `criticalPath.outreach.close`             | mutation | verifiedProcedure      | 0                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L579) |
| `criticalPath.outreach.confirmSent`       | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L539) |
| `criticalPath.outreach.conversation`      | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L589) |
| `criticalPath.outreach.details`           | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L380) |
| `criticalPath.outreach.draft`             | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L451) |
| `criticalPath.outreach.list`              | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L436) |
| `criticalPath.outreach.manualAction`      | query    | verifiedProcedure      | 0                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L401) |
| `criticalPath.outreach.prepareManualSend` | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L524) |
| `criticalPath.outreach.recordResponse`    | mutation | verifiedProcedure      | 0                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L559) |
| `criticalPath.outreach.reminders`         | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L598) |
| `criticalPath.outreach.revise`            | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L385) |
| `criticalPath.outreach.scheduleFollowUp`  | mutation | verifiedProcedure      | 0                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L569) |
| `criticalPath.outreach.submitReview`      | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L497) |
| `criticalPath.platforms`                  | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L171) |
| `criticalPath.presets.read`               | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L153) |
| `criticalPath.presets.save`               | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L160) |
| `criticalPath.progress.list`              | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L348) |
| `criticalPath.progress.record`            | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L355) |
| `criticalPath.prospects.add`              | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L201) |
| `criticalPath.prospects.archive`          | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L335) |
| `criticalPath.prospects.details`          | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L226) |
| `criticalPath.prospects.edit`             | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L206) |
| `criticalPath.prospects.exportCsv`        | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L326) |
| `criticalPath.prospects.importCsv`        | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L308) |
| `criticalPath.prospects.list`             | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L255) |
| `criticalPath.prospects.optOut`           | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L238) |
| `criticalPath.prospects.previewIntake`    | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L198) |
| `criticalPath.prospects.restore`          | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L216) |
| `criticalPath.qualify`                    | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L367) |
| `criticalPath.status`                     | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/critical-path-router.ts#L172) |
| `profile.create`                          | mutation | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L325)              |
| `profile.get`                             | query    | verifiedProcedure      | 1                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L312)              |
| `profile.update`                          | mutation | verifiedProcedure      | 0                           | [Inspect](../apps/cofounder-discovery/server/routers.ts#L337)              |
| `system.health`                           | query    | publicProcedure        | 0                           | [Inspect](../apps/cofounder-discovery/server/_core/systemRouter.ts#L10)    |
| `system.notifyOwner`                      | mutation | adminProcedure         | 0                           | [Inspect](../apps/cofounder-discovery/server/_core/systemRouter.ts#L20)    |

Zero client references does not make an admitted route inaccessible. Audit,
compatibility conversation/manual-action methods, profile.update, auth status and
system actions still require API-only review. Current UI records responses,
reminders and closure through criticalPath.outreach.conversation, rather than the
older separate methods. MFA UI imperative calls are counted alongside React hooks.

### Non-tRPC production HTTP surface

- GET /api/health: process/runtime status, not database readiness.
- GET /api/ready: real bounded database readiness query; failure is not liveness failure.
- GET /api/integrations/hai/feed: separately configured, bearer-authenticated,
  owner-scoped read-only feed; default unavailable, no provider delivery.
- /api/trpc: path/origin/HTTP body/work-admission and default route-policy middleware
  wrap tRPC handlers. Mixed batches must be wholly admitted. Unknown /api paths
  use the fixed not-found envelope. Static client/assets are a separate surface.

This HTTP list was inspected in server/_core/index.ts; it is not mechanically
extracted by the tRPC scanner. Provider workers, operator CLI and OS/network ingress
are separate surfaces. Enabling unsafe legacy routes is not supported production
configuration and would expose declarations currently denied by policy.

### Maintaining the audit

Run `node scripts/api-surface-audit.mjs` to inspect current JSON and
`node --test scripts/api-surface-audit.test.mjs` to check the current snapshot,
actual pure policy agreement, aliases, client references, source positions,
determinism and refusal of unsupported router shapes. After relevant source edits,
regenerate/review the snapshot; do not remove its drift check to make CI green.
The production gate is `createTrpcRouteAdmission` from route-policy.ts, wired before
the bounded tRPC middleware. Its loopback HTTP fixture tests admission/refusal
without running real endpoint handlers. This does not substitute for current
compiled-production database/browser/recovery acceptance after this source edit.
CI contains this test step, but no hosted CI execution or branch-protection proof
is claimed. Structural green tests do not close original phases 009/073/074.

## Private reusable defaults (October 2 increment)

`criticalPath.presets.read` takes the exact `accountId` and returns the current
revision/settings or virtual empty defaults (revision 0, no row allocated).
`criticalPath.presets.save` takes accountId, expectedRevision, bounded settings
and literal confirmation. Settings contain human-original templates, optional
preferred template ID, candidate search and status. Inputs reject extra fields;
clients cannot supply another owner, grants, consent or outreach state.

Both routes require current authenticated credentials, live verified owner and
an unfenced account under its SHARE/UPDATE transaction lock. Saves serialize
per-owner and use the shared workspace audit resource last; exhaustion rolls back
both settings and audit. Conflicts preserve the existing version. Exact immediate
retry recovers the next identical revision without another receipt. Error paths
fail closed with content-free service errors, not SQL or stored template text.
The one-document/20-template/80000-byte bound limits retained settings, not all
request traffic or provider invoices. Export and deletion preflight explicitly
review all new fields and the account reference. Neither route sends, generates,
approves outreach, changes consent or grants platform access.

## Supported public surface

- /api/health and /api/ready
- /api/trpc/auth._, /api/trpc/profile._
- /api/trpc/criticalPath.*
- /api/trpc/system.*
- The four explicit accountData export/deletion operations, not all accountData.*
- /api/integrations/hai/feed when explicitly configured

All other imported tRPC procedures are denied by default. Setting
ENABLE_UNSAFE_LEGACY_ROUTES=true expands that surface and is not a supported
production configuration.

There is no provider delivery API on the supported surface. HAI is read-only and
bearer-authenticated; content is withheld unless an operator opts in.
