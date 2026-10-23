# Operating-budget declaration check

Robert's initial ceiling is **EUR 100/month**, with **EUR 80 operating allocation**
and **EUR 20 reserve**. This document and checker do not authorize purchases,
subscriptions, public deployment or changes to real provider limits.

The [dated candidate plan](OPERATING_BUDGET_CANDIDATES_2026-10-02.md) allocates the
EUR 80 planning envelope and records read-only provider evidence and missing quotes.
It is not an approved provider choice, a passing declaration or spending authority.

## What the tool actually checks

`scripts/production-budget.mjs` assesses a local operator-declared monthly maximum.
It requires all eight categories: hosting, database, email, optional AI/API,
storage/backup, traffic, domain and monitoring. Include fees, tax, currency risk,
overages, retained storage and recovery costs in their reviewed ceilings. Do not
divide an annual charge by twelve and pretend that the upfront payment or renewal
commitment disappeared. Provider contracts and account settings need real review.

This tool does **not** query invoices, configure provider caps, disable resources,
authenticate evidence, enforce spending or monitor continuously. Passing means only
that the supplied declarations are structurally complete, dated within the review
window and fit the declared envelope. The report always says
`providerEnforcementVerified: false`. It is not public-launch acceptance.

## Prepare a local plan

Start from [the deliberately incomplete example](production-budget.example.json).
Keep actual reviewed plans and commercial evidence outside committed source; do
not put credentials, customer data or billing-account secrets in either file.
Fill the plan only from real tax-inclusive quotes and reviewed hard-cap evidence.
There is no automatic quote fetching or price assumption.

Each category has exactly one state:

| State          | Meaning and required fields                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unconfigured` | Unknown service/cost. It is not zero; the assessment cannot pass.                                                                                                                                          |
| `disabled`     | Only optional `ai_api` may pass as disabled/zero. Other launch services cannot be omitted this way. This declaration does not switch any runtime setting.                                                  |
| `capped`       | `monthlyCeilingCents` (integer EUR cents), `taxInclusive` (boolean), `reviewedAt` (UTC `YYYY-MM-DD`), `evidenceReference` (a short local reference, not credentials). A zero ceiling still needs evidence. |
| `included`     | `includedIn` names the category whose declared cap includes this service. Chains resolve to a capped category; cycles or unknown/disabled underlying services cannot pass.                                 |

Example structure for a **hypothetical** capped row, not a price recommendation:

```json
{
  "category": "hosting",
  "status": "capped",
  "monthlyCeilingCents": 2500,
  "taxInclusive": true,
  "reviewedAt": "2026-10-02",
  "evidenceReference": "operator-reviewed-quote-and-provider-hard-cap"
}
```

The reference is an operator assertion, not proof that the cap exists. Review the
actual provider's billing consequences, alerts, suspension semantics, tax and
overage settings separately. Email/API usage needs durable application quotas as
well as the provider review; a local plan cannot substitute for them.

## Run the check

From the repository root with Node 22:

```sh
node scripts/production-budget.mjs --plan docs/production-budget.example.json
```

The example must return **exit 1 / incomplete**, with the total **null**, because
real provider costs and caps have not been supplied. It never outputs a false
zero-budget or within-budget assertion for unknown costs.

For an actual local plan, replace the file argument with its reviewed path.
The equivalent package command is `pnpm budget:check --plan <path>`.
No command here creates accounts, spends money or changes runtime admission.

Exit codes:

- **0:** `within_declared_envelope` — complete declarations total at most EUR 80;
  EUR 20 reserve remains. Not invoice enforcement or purchase approval.
- **1:** `incomplete` or `over_envelope` — unresolved declarations or a complete
  total above EUR 80. Do not spend the reserve merely to clear this check.
- **2:** malformed arguments/plan, unreadable input or invalid structure — fixed
  content-free failure, without printing supplied paths or underlying errors.

Reviews at 30 UTC calendar days are due; invalid/future dates are unresolved.
The reference date uses the running machine's UTC clock. Check that clock if
suspect. The hard EUR 100/80/20 allocation is not overridable through a plan.
Input is restricted to regular files with strict UTF-8 decoding and read at most
32 KiB plus one byte; oversized or malformed-encoding input is rejected. The
final path component must not be a symbolic link/junction. File identity is
checked again after opening; Linux uses no-follow/nonblocking flags. These checks
do not ban linked parent directories or provide a sandbox against a privileged
concurrent filesystem writer. Keep reviewed plans in a trusted private location
and do not modify them while checking. Unknown fields/categories, duplicate categories,
non-EUR currency, fractional/negative money and inclusion cycles are rejected.
The tool outputs only totals, fixed category/reason codes and assessment state,
never evidence text or private provider data. It does not persist assessment logs.

## Launch evidence still needed

An authorized operator must verify and document actual pricing, taxes, provider
hard caps, thresholds and invoice visibility; test budget exhaustion, alerts and
recovery on the approved host; and approve any paid commitment. Cross-provider
costs must be reconciled against the full ceiling without double counting.
Changing the ceiling needs Robert's explicit decision and code/policy review.
The complete monthly safeguard remains open until this is real, not just declared.

Local tests: `pnpm test:budget`, including money boundaries, incomplete/disabled
states, bundled cost accounting, stale evidence, actual files/CLI exit codes,
bounded reads and content-free errors. No provider or billing acceptance is implied.

## October 2 input-safety acceptance

Four added checks prove malformed UTF-8 refusal with content-free CLI errors,
linked-final-input refusal, valid original Unicode/exact32KiB acceptance with
one-extra-byte refusal, and special-file refusal before a blocking open. The
malformed-text regression initially failed (14pass/1fail) on the old decoder;
it passed after strict decoding was implemented. The Windows link fixture is an
unprivileged directory junction, not proof of Linux file-symlink behavior.

Current full host operator/audit suite passed165tests/11files/no skips/6283.9776ms.
All17budget cases separately passed on LinuxNode22 in an isolated container,
759.933586ms, including an actual file symlink and FIFO input with no writer.
Both owned fixtures independently inspected stopped/exit0/noOOM; network-none,
UID1000/read-only/2CPU/512MiB/64PIDs, read-only external root-script mount and
32MiB noexec temporary storage. This tests current host scripts using the older
a187faca... image's Node runtime; it is not a new packaged-application receipt.

Final budget-tool SHA256:
`d224d3d6898197ed890fa8ed8dc70c629fcf6533b8eaaa84f365ec8e8c47ca69`;
tests `b85423654ff49d32fecec51fcae1e498f1d99fd2e07225d218f8533c8135ca34`.
Only fresh synthetic temporary fixtures were removed by these tests. No reviewed
commercial plan, provider account, user file, host configuration or cost ceiling
was changed. Deployment guidance informed fail-closed local validation and scoped
evidence; provider-cap, invoice, hosted exhaustion and alert acceptance remain open.
