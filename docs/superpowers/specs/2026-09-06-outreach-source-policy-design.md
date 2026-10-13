# Outreach source-policy design

Scope: the approved worldwide assisted public beta, specifically source-specific
controls on the existing CSV/draft/review/manual-send workflow. This is not a
replacement for the full release ledger. No purchase, provider write, publication
or shared-host restart is authorized by this design.

## Decision

Use one server-side decision engine backed by the reviewed catalogue, with a
durable, message-bound user declaration. Do not use browser-only warnings or
equate a catalogue listing with an authorized integration. User declarations
record asserted human authorship and current permission for manual participation;
they cannot grant platform/API permission or establish that pasted text was never
AI-generated. All automated integration permissions remain false.

Alternatives considered: UI-only restrictions fail against direct API calls;
blocking every source indefinitely prevents the approved assisted product. A
reviewed source plus a current, narrowly bound declaration permits eligible
human-authored manual work while keeping unknown actions closed.

## Source resolution and decisions

- Resolve exact normalized canonical IDs, names and verified aliases. Preserve
  the existing internal `ycombinator` identifier as YC matching, not HN.
- Inspect destination URL independently. HTTPS only, no URL credentials or
  nonstandard ports. Exact reviewed host or its www spelling, never suffix or
  substring matching. StartHawk resolves to FounderCloud. Reddit requires the
  r/cofounder path boundary; other subreddits are not covered by its rules.
- If supplied label and destination disagree, deny. `manual` cannot override a
  recognized restricted hostname. Unknown labels/hosts deny; no URL fetching or
  redirect following occurs. Humans must verify the actual destination before use.
- Direct personal contacts may use explicit `manual` with no platform URL. They
  are not a reviewed platform or permission to automate email.
- F6S is research-only and denied. Discord/Slack/Facebook channel classes are
  denied until exact private-channel admission/admin permissions are configured.
  Concrete channel registration remains an explicit release requirement.
- Opted-out and archived prospects deny new outreach. Known eligible sources
  require user-authored content and current user declaration; template/AI content
  is denied where permission is unverified, including HN's explicit prohibition.

## Durable declaration

Store a nullable source-policy JSON object and add `user_authored` generation mode
without deleting or relabelling existing rows. The server creates the object from
the owned prospect and body; clients never supply a trusted stored declaration.
Fields: policy version, canonical source ID, normalized destination URL, actor ID,
SHA-256 body digest, human-original and current-rules-reviewed declarations,
review timestamp. Expiry is 30 days; future-dated/invalid/stale objects deny.
Changing owner, source, URL, body or generation mode requires a fresh draft and
declaration. Existing records without provenance remain readable but cannot be
prepared through the new workflow.

## Enforcement and UI

Validate before drafting; recheck on submit-review, approve and prepare; decorate
list rows with server-computed action eligibility so previously prepared records
do not expose copy/open controls after revocation or expiry. Recheck opt-out and
ownership immediately before the mutation. Terminal response/history recording
does not manufacture provider delivery evidence. Atomic transitions and locking
must be tested against concurrent updates as part of reliable-processing work;
an advisory precheck alone is not that acceptance proof.

The draft button opens a human-authored composer showing resolved source and
restrictions. A non-preselected acknowledgement requires original text, current
rules/eligibility and rights to use the supplied data. No generated HN drafts.
Unknown/group-held sources show the reason rather than a disabled button alone.
The catalogue remains discovery-only; no new source connector is activated.

## Verification boundary

Pure decision tests cover domain/alias attacks, path boundaries, content/owner/
destination binding, expiry, stale provenance, opt-outs and source holds. Real
router tests cover no write on rejection, current owned-prospect rechecks and
old idempotency records. MySQL tests prove migration preservation and persistent
provenance across two customers. Browser tests prove usable authoring and blocked
actions. No unit or synthetic UI result establishes provider or public release
acceptance. Docker recovery is separate and must not be hidden by skipped tests.
