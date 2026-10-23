# Outreach Source Policy Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task inline. Request bounded read-only review after each completed deliverable.

**Goal:** Enforce source-specific limits and message-bound human declarations in assisted outreach.

**Architecture:** A pure server decision engine resolves source/URL and validates
declarations. Persist its server-created receipt on outreach rows, consume its
decisions in verified-account procedures, and expose those decisions to the UI.

**Tech Stack:** TypeScript, Zod, SHA-256, tRPC, Drizzle/MySQL, React, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-06-outreach-source-policy-design.md`

## Global Constraints

- No purchase, provider write, publication or shared-host restart.
- Preserve old outreach rows; nullable provenance fails closed, not deletion.
- No automated integration permission inferred from a user declaration.
- Expiry is 30 days; future-dated/invalid/stale objects deny.
- Direct personal contacts require explicit `manual` and no platform URL.
- Use actual current source records and bounded synthetic test data only.
- Work stays uncommitted on the current beta branch until release integration is authorized and verified.

## Task 1: Tested policy engine

Files: create `apps/cofounder-discovery/server/outreach-source-policy.ts` and
`server/outreach-source-policy.test.ts`; consume `server/platform-catalogue.ts`.

Interfaces:

```ts
type SourceProspect = {
  platform?: string | null; profileUrl?: string | null;
  consentStatus?: string | null; archivedAt?: Date | null;
};
type SourcePolicyInput = {
  prospect: SourceProspect; actorId: number; body: string;
  generationMode: "template" | "ai" | "user_authored";
};
type PolicyDecision = { allowed: boolean; reason: string; sourceId: string | null };
// resolveOutreachSource(prospect) -> PolicyDecision plus destinationUrl
// declareOutreachSource(input, {humanOriginal:true,rulesReviewed:true}, now)
//   -> server receipt or FORBIDDEN
// assessOutreachSource(input, receipt:unknown, now) -> PolicyDecision
```

- [ ] Write failing table-driven source/URL tests. Literal examples:

```ts
expect(resolveOutreachSource({platform:"HN",profileUrl:"https://news.ycombinator.com/user?id=example"}).sourceId).toBe("hacker-news");
expect(resolveOutreachSource({platform:"manual",profileUrl:"https://news.ycombinator.com/"}).allowed).toBe(false);
expect(resolveOutreachSource({platform:"StartHawk",profileUrl:"https://www.foundercloud.com/"}).sourceId).toBe("foundercloud");
```

- [ ] Run `vitest run server/outreach-source-policy.test.ts`; establish missing behavior.
- [ ] Implement exact source lookup, URL host/path validation and deny decisions.
- [ ] Write receipt tests using a fixed date and fixed human body. Assert generated
  HN content denied; body/actor/source/URL changes deny; exact 30-day boundary,
  future dates, invalid receipt and opt-out deny. Declare a valid human receipt
  and assess it successfully without network/database access.
- [ ] Implement Zod receipt parsing, server-created SHA-256 digest, policy version,
  exact bindings and timestamps. Run focused tests and TypeScript.
- [ ] Source-review Task 1 before customer action wiring.

## Task 2: Persistence and existing workflow enforcement

Files: modify `drizzle/schema.ts`, generate additive migration 0025 and snapshot;
modify `server/critical-path-router.ts`; add `server/outreach-policy.test.ts` and
extend `server/critical-path.integration.test.ts`.

Consume Task 1 functions. Persist `sourcePolicy` (typed nullable JSON), add enum
value `user_authored`. Draft input requires `body` plus declaration for reviewed
sources. Generate receipt server-side, store it with the row and audit metadata.

```ts
const receipt = declareOutreachSource({prospect, actorId:ctx.user.id, body:input.body,
  generationMode:"user_authored"}, input.declaration, new Date());
// createOutreachRecord({..., body:input.body, generationMode:"user_authored", sourcePolicy:receipt})
// Before gated transitions and list action eligibility:
const decision = assessOutreachSource({prospect, actorId:ctx.user.id,
  body:record.body, generationMode:record.generationMode}, record.sourcePolicy, new Date());
```

- [ ] Write real-router tests replacing only database storage transport: an HN
  generated draft creates no record; another customer's prospect yields NOT_FOUND;
  opted-out/archived/current-source changes reject prepare; legacy receipts reject;
  idempotency replay does not bypass revalidation or substitute another prospect.
- [ ] Watch tests fail, implement owned-prospect checks and receipt persistence,
  expose server action decisions, run tests and TypeScript.
- [ ] Generate migration with `drizzle-kit generate --name outreach_source_policy`;
  inspect SQL for additive-only enum/column changes and journal/snapshot consistency.
- [ ] Extend real MySQL test: create two owners, persist/read receipt, change source
  or opt-out between review and prepare, prove rejection and unchanged state.
  Run only against the explicitly isolated test database once Docker is available.
- [ ] Do not call the migration or storage path verified until the real DB test passes.

## Task 3: Human composer and action feedback

Files: create `client/src/components/OutreachComposer.tsx`; modify
`client/src/pages/OutreachConsole.tsx`; add `server/outreach-composer.test.ts`.

Composer receives an owned prospect and closes only after successful draft save.
State includes body and an initially false declaration checkbox. Submit calls:

```ts
draft.mutateAsync({prospectId:prospect.id, body,
  declaration:{humanOriginal:true,rulesReviewed:true}, idempotencyKey:newKey("draft")});
```

- [ ] Write failing rendered tests for labelled body, initial unchecked consent,
  explicit policy warning and pending state. Implement accessible composer.
- [ ] Use server action eligibility to disable review/approve/prepare/copy/open
  with visible reasons; preserve readable history and customer-entered content.
- [ ] Test API rejection, successful save, duplicate prevention, retained input on
  failure and keyboard/mobile operation in a real browser. No provider writes.
- [ ] Run focused suites, TypeScript and application build; obtain bounded review.
- [ ] Update README/source review/delivery ledger with actual implemented boundaries,
  migration requirement and remaining full-suite/MySQL/provider acceptance gates.

## Self-review

Execution checkpoint (2026-09-06): Task 1 is implemented and source-reviewed;
37 engine tests pass. Task 2 application wiring and additive migration generation
are implemented; 21 real-router tests with substituted storage pass, including
fresh Copy/Open, operator pause, optional-match ownership and revocation checks.
The MySQL test was updated but remains unrun; migration 0025 is not DB-verified.
Task 3 composer is implemented; two rendered tests plus real-browser checks pass
for failure retention, acknowledgement changes, same-key retry, account-refetch
recovery, fresh denied Copy/Open and mobile overflow. Independent review's one
text-loss finding was reproduced before fixing and passed afterward. TypeScript,
production build and tracked diff whitespace checks pass. Keyboard-specific
acceptance, rapid duplicate-click acceptance, complete DB workflow and all release
gates outside this increment are not claimed. See PUBLIC_BETA_DELIVERY.md for
exact test results and the Docker Engine failure preventing current DB tests.

Tasks 1-3 cover source resolution, provenance, API decisions, persistence and UI.
Concrete private-channel registration, custom-source approval and atomic locking
remain named requirements in the full release ledger, not claimed by this increment.
