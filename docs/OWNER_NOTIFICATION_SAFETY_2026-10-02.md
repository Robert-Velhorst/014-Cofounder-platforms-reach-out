# Inherited owner-notification safety repair

October 2, 2026. Local implementation/test receipt, not provider or launch approval.

## Why this path needed attention

The supported router retains system.notifyOwner under administrator/passkey
step-up. Its helper used the inherited Forge base URL/key independently of
legacy-route or account-mail-worker flags. Credentials could therefore enable
this external content-transfer path. Failure handling read and logged the
provider's response body/status text or raw exception, and had no explicit
request deadline. This was directly inspected code, not a proved live incident.

## Actual changes

The helper now requires ENABLE_OWNER_NOTIFICATIONS=true, a validated runtime
boolean defaulting to false. Missing/invalid flag values do not enable it. Both
local and standalone production Compose hold it false, including when the mail
overlay is used. The controlled tunnel additionally requires its actual container
environment to report false before forwarding. Neither credentials, legacy-route
enablement, mail-worker enablement nor an elevated administrator session alone
can enable this separate provider path.

The API and helper trim and bound title/content to 1,200/20,000 characters.
The operator-configured endpoint must use HTTPS without URL credentials, query
or fragment. Redirects are refused, so this call does not replay its bearer to a
redirect target. A five-second AbortController timer bounds the fetch and is
cleared on completion. Unneeded response bodies are cancelled without reading
their text. No retry or fallback sender was added.

Failures emit only the fixed owner_notification_failed event, a fixed reason
(provider_rejected, timeout or transport_failure), and an HTTP status for a
rejected response. The helper never logs payload/title/content, response body,
status text, endpoint/key, raw exception or stack. Disabled/missing/invalid
configuration fails before network access with bounded tRPC errors; the existing
public error formatter also hides unexpected internal details.

Return true means an accepted HTTP response, not recipient/inbox delivery.
Return false can represent an uncertain attempted operation; a provider might
have accepted content before a timeout. Reconcile with an approved operator path
before any retry. Cached flag/config changes require a process restart and
revalidation; an edited environment file is not an atomic kill switch.

## Verification performed

- Nineteen new tests cover default-off despite configured synthetic credentials,
  real configuration parsing, missing/invalid URLs/keys, empty/oversized input,
  payload/endpoint/redirect settings, fixed log records, response-body avoidance,
  no retries, timer clearing and cancellation handling.
- A real Node HTTP transport test redirects only the test fixture's fetch adapter
  to an owned ephemeral loopback server that never returns headers. The five-second
  deadline aborts that request, its peer connection closes and cleanup completes.
  It uses synthetic content/key, not HTTPS or a real provider/account.
- Final full unit rerun: 725 tests/72 files passed, 109.33 seconds, no skips.
  An earlier 724-test run passed before the extra real-transport test was added.
- All 133 root/operator tests passed without skips; production/mail-overlay and
  tunnel posture assertions now include the owner-notification flag.
- Type check and fresh local build passed. These ran on the observed Windows
  host Node v25.2.1, not the intended production Node 22 container.
- Retained-source traceability passed: all 116 phases Partial, 12 required
  artifacts, completionProven=false. No phase was promoted by green tests.
- The privacy observation's unchanged table digest and three schema/export/
  deletion hashes were checked; its production-definition hash was refreshed
  with the prior value preserved after adding the disabled provider flag.

The initial targeted test run failed three assertions because the installed
Vitest version lacks the chosen combined matcher. Those assertions were replaced
with separate exact-count and argument checks; the repaired targeted and full
runs passed. The initial failed run is not accepted proof.

Selected local source/build inventory: 514 files, 10,317,127 bytes, digest
41aeb3cbcac5af754cbcc21b6a9665edd908932f396a2b529c8bf05818e04ca6.
It excludes root operator sources/docs, installed dependencies/secrets,
host/provider state and container layers. Build provenance, test acceptance and
production acceptance flags remain false. This is a file observation, not a
complete SBOM, signed release or causal source-to-image attestation.

## Remaining gates and explicit non-actions

No actual notification, real provider request, mailbox, paid API, deployment,
public tunnel, purchase, commit, push or merge was performed. No customer DB or
data was accessed. These tests' own loopback connections and test processes were
closed; no live test runner is required to preserve this receipt.

The database suites were not rerun for this change; the earlier 712 packaged
database checks remain a dated receipt, not proof of the changed router/config.
Fresh immutable Node 22 packaging, database/connected-admin acceptance and renewed
whole-product source-bound security review remain required. The saved threat
model's old helper/config/router hashes do not qualify these changed files.

Before any later authorized enablement, approve the actual provider/account,
recipient/purpose, fields/content rights, processor/retention/region/terms,
credential/egress policy, delivery/reconciliation, monitoring/operator ownership
and cost controls. This change supplies no durable fleet-wide attempt/billing
quota or complete DNS/host-SSRF policy. Keep it disabled while those decisions
remain unresolved. The EUR 100/month ceiling is planning-only, not authority to
buy or send. Notification convenience is not a prerequisite for assisted manual
co-founder outreach and must not be presented as a functioning alert service.

The error-handling skill guided fail-fast validation, bounded cancellation and
stable errors. Privacy requirements take precedence over its generic full-context
logging example: raw provider context is deliberately not recorded. The local
Node cancellation API was checked against the
[official observed-version documentation](https://nodejs.org/download/release/v25.2.1/docs/api/globals.html#class-abortcontroller).
