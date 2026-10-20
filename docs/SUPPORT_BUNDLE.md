# Local support bundle

## Customer workspace download

Signed-in verified users can open Account data -> Prepare support diagnostics.
Select 1–20 check/status observations, leave untested checks as Not checked, expand
Review exact diagnostic JSON, approve it and click Download support JSON.
The browser starts an unencrypted cofounder-support.json download. A success notice
means the browser started the download, not that the file was saved or delivered.
Edits, addition, removal, reset and successful download clear approval. Switching
away from the tab/reloading discards selections; changing account or verification
identity remounts the controls. Failed/unverified account state blocks controls.

Format cofounder-customer-support/v1 is deliberately distinct from the operator
cofounder-support/v1 below. It includes only selected check/status labels plus fixed
format/evidence/exclusion/sharing descriptions. No request IDs, user identifiers,
browser metadata, timestamps, logs, addresses, tokens, messages or account exports
are included. No network request is made by these controls; workspace queries still
operate normally. There is no automatic health test, ticket, inbox or recipient.
Do not infer a platform connection or verified incident from manual observations.
The choices are kept in component memory, not database/localStorage.

Inspect the exact file before sharing, choose an authorized recipient separately,
keep the local copy private and delete it when no longer needed. Approved support
ownership, recipient handling/retention, automatic allowlisted authenticated
collection and hosted incident acceptance remain unfinished. This is a functioning
customer-selected diagnostic path, not completion of the wider support service.

Implementation: CustomerSupportBundle.tsx and shared/customer-support.ts. Strict
schemas reject extra keys/arbitrary content and out-of-bounds observations.
13 focused tests and four browser stages verify defaults, exact preview, approval
invalidation, actual downloaded contents, reset/unmount and desktop/mobile controls.
Focused browser authentication uses synthetic read-only RPC fixtures, no DB proof.
Current artifact/release limitations are in FINAL_VERIFICATION_REPORT.md.

This operator utility creates reviewable diagnostic JSON, not a log archive or
account export. Nothing is uploaded or collected from the application, database,
provider accounts or network. Owner authorization must be confirmed before input
is read. This is an operator declaration, not independent identity verification
or permission to share the output.

## Prepare and review

Prepare local JSON containing only selected observations. Do not copy raw server
responses, doctor output, logs, stack traces, configuration, private addresses,
message text, candidate details, tokens or credentials into it.

```json
{
  "version": 1,
  "ownerAuthorized": true,
  "area": "workspace",
  "observations": [
    { "check": "preset_save", "status": "conflict", "requestId": null }
  ]
}
```

This example is a format illustration, not an observed incident. Use
`not_checked` when a check was not performed; assumptions must not become `pass`.

From the repository root, in a shell supporting input redirection:

```sh
pnpm support:bundle --help
pnpm support:bundle --confirm-owner-authorized < reviewed-observations.json
```

PowerShell instead uses a reviewed input file outside committed source:

```powershell
Get-Content -LiteralPath 'C:\private-support\reviewed-observations.json' -Raw |
  node scripts/support-bundle.mjs --confirm-owner-authorized
```

The illustrative path is operator-selected; the tool creates no directory or
file. Review output before saving or sharing. A saved copy needs controlled host
permissions and a retention decision. Sharing requires separate authorization
for the owner and recipient. There is no support-ticket or email integration.

## Exact accepted fields

Extra or missing keys, arbitrary text and unsupported values are rejected.
Input is limited to 16 KiB of UTF-8 and 1–20 observations.

| Field       | Allowed values                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `area`      | `authentication`, `workspace`, `export`, `outreach`, `administration`, `deployment`                                                                                            |
| `check`     | `sign_in`, `email_verification`, `password_recovery`, `candidate_save`, `preset_save`, `draft_save`, `manual_action`, `account_export`, `admin_step_up`, `health`, `readiness` |
| `status`    | `pass`, `unavailable`, `unauthorized`, `forbidden`, `invalid_input`, `conflict`, `capacity_reached`, `not_configured`, `not_checked`                                           |
| `requestId` | `null`, or a UUIDv4 from the affected response                                                                                                                                 |

A request identifier may correlate with a private audit record: this is not an
anonymity guarantee. Use `null` unless correlation is authorized and useful.
Manual observations cannot prove their own accuracy. Node version, platform and
architecture describe the **local generator**, not necessarily the deployed
server. No paths, hostname, account identifier, environment variables, secrets
or free-text errors enter the bundle.

The SHA-256 digest checks canonical payload integrity, not operator identity or
observation authenticity. Rejection returns only a fixed safe error, not the
input or raw exception. Explicit authorization is required even for unknown
states; malformed arguments are never echoed.

## Verification and remaining scope

`pnpm test:support` covers construction, strict input, authorization before read,
size/UTF-8 rejection, no reflection and the real CLI. Root tests and CI include
this gate. Local tests do not prove a hosted CI run or operator acceptance.

This bounded working diagnostic path does not complete the support experience.
Automatic authenticated in-app collection, approved support recipients,
receiver access controls, retention/erasure and hosted incident acceptance remain open.
Private account exports must not be attached automatically. The repaired doctor
command withholds raw errors and configured addresses, but reports deployment
states and performs a read-only database probe; this utility deliberately does
not ingest its output. Review operational metadata before sharing it.

## Runtime diagnostic command

`pnpm doctor` validates configuration and attempts authenticated `SELECT 1`.
It does not migrate, modify account data, contact email/platform providers or
prove hosted acceptance. Its report contains fixed check descriptions and bounded
public runtime states, not configured addresses, secret values or raw exceptions.
Database cleanup is attempted on every diagnostic path; cleanup failure is fatal.
Unknown or repeated command flags are rejected before environment/secret loading.

`--allow-missing-runtime` is a build-time convenience. It may yield `ok: true`
with warnings and exit 0 despite absent/invalid runtime configuration or storage.
`runtimeChecksPassed: false` makes that distinction explicit; every report sets
`productionAcceptanceProven: false`. Do not use the relaxed command as a release
or readiness gate. Even successful checks cover only configuration and SELECT 1,
not migrations, write privileges, TLS, mailbox delivery or customer journeys.
