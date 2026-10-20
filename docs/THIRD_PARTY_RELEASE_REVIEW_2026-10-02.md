# Packaged dependency and third-party release review — October 2 2026

Status: bounded evidence collected; licensing and third-party service acceptance
remain incomplete. No repository licence grant or distribution approval is made.

## What was directly inspected

The current locally qualified production image
`sha256:f1b6ebc2a59392a4e8039c708ab43d99af1d44dc59b7339851e52fc2eb3cc4a1`
was read in disposable network-disabled, read-only containers without customer
data, secret mounts or application startup. No image was rebuilt or uploaded.

Its pnpm store contains 546 regular package roots and 546 unique name/version
pairs. The [machine-readable observation](DEPENDENCY_LICENSE_INVENTORY_2026-10-02.json)
records every inspected instance, package/version, unchanged declared licence,
package-manifest SHA-256 and conventional root notice-file names/byte counts/hashes.
It includes 538 root notice files. Canonical digest of the sorted records:
`f8014b77878c15928a40c53f5bc2f69cae61f58d5edbf99a4ec58d02fb1be512`.

The probe enumerated each regular store instance's node_modules package roots,
including scoped packages, without following dependency symlinks. It parsed
package.json and hashed regular root files named license/licence, COPYING,
NOTICE or copyright, case-insensitively, including conventional suffixes.
Notice files over two MiB or symlinked notice files would reject collection.
This is a physical installed-package inventory, not a dependency-edge graph,
registry attestation, SPDX SBOM or complete licence-text analysis.
Do not reuse it for a changed image.

For comparison, the actual locked pnpm 10.4.1 command
`pnpm licenses list --prod --json` reported the same 546 name/version observations,
grouped under 530 package entries (multiple versions can share an entry).
Its raw host paths and author metadata were not copied into the saved inventory.
The advisory command's 549-dependency count measures a different scope and is
not interchangeable. No upgrade to the current pnpm documentation version occurred.
The [official command reference](https://pnpm.io/cli/licenses) describes production/
optional filtering and JSON output; actual installed-version behavior was checked.

## Manifest declarations, not compliance decisions

| Declaration             | Inspected package/version records |
| ----------------------- | --------------------------------: |
| MIT                     |                               458 |
| ISC                     |                                46 |
| Apache-2.0              |                                23 |
| BSD-3-Clause            |                                10 |
| BSD-2-Clause            |                                 2 |
| Unlicense               |                                 2 |
| 0BSD                    |                                 2 |
| (MPL-2.0 OR Apache-2.0) |                                 1 |
| MIT AND ISC             |                                 1 |
| Missing declaration     |                                 1 |
| Total                   |                               546 |

Do not silently simplify multi-licence expressions or assume one repository
licence covers dependencies. npm documents SPDX identifiers and expressions
and the separate-file form; the SPDX list identifies licence texts, not a release
approval. [npm metadata](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#license),
[SPDX identification](https://spdx.org/licenses/).

### Missing declaration resolved to a text observation

khroma 2.1.0 has no license field in its packaged manifest or the corresponding
upstream-tag manifest. Its packaged lowercase license file is 1,105 bytes,
SHA-256 `66b333b0f66759a0b710459e03f7029abe17f4358114a128d2c972e642961b49`.
That actual file was read in full and identifies MIT, naming Fabio Spampinato
and Andrew Maney. The matching upstream tag's lowercase file was also read.
An uppercase LICENSE lookup returned 404; that was not treated as absence of
a licence. The saved declaration remains null rather than changing upstream data.
[Tagged manifest](https://raw.githubusercontent.com/fabiospampinato/khroma/v2.1.0/package.json),
[tagged licence](https://raw.githubusercontent.com/fabiospampinato/khroma/v2.1.0/license).

### Notice-file follow-up

Fourteen roots have no conventionally named notice file at their package root:

- @puppeteer/browsers 3.1.0; puppeteer-core 25.5.0; drizzle-orm 0.45.2.
- embla-carousel, embla-carousel-react and embla-carousel-reactive-utils 8.6.0.
- hast 1.0.0; input-otp 1.4.2; react-remove-scroll-bar 2.3.8.
- react-resizable-panels 3.0.6; rehype-katex 7.0.1; remark-math 6.0.0.
- victory-vendor 36.9.2; wouter 3.10.0.

A bounded recursive filename check, excluding symlinks/dependency directories,
found thirteen nested vendored LICENSE files in victory-vendor. Their relative
names are saved in the observation. No conventionally named nested notice file
was found in the other thirteen examined packages. README text, source headers
or other filenames may carry notices; those alternatives were not exhaustively
reviewed. Neither list proves unlawful distribution or that all notices are absent.

Before redistribution, obtain exact-version upstream notice/copyright evidence
where the package distribution is insufficient, review vendored/modified code,
and assemble the applicable preserved notices for both server packages and
browser bundles. Do not fabricate copyright ownership or merely paste generic
licence text without attributable provenance. MIT and Apache redistribution
terms make notice preservation relevant, but deciding applicability to the
actual distribution requires complete review.
[MIT text](https://spdx.org/licenses/MIT.html),
[Apache 2.0 redistribution terms](https://spdx.org/licenses/Apache-2.0.html).

## Repository and imported materials

Both current package manifests declare MIT, but the source search found no
standalone repository LICENSE/NOTICE file. This is recorded as intent metadata,
not verified authorship, a completed grant, or acceptance of all imported rights.
The ZIP/demo history, contributor ownership, copied assets and external content
still require provenance and intended licence confirmation. No LICENSE file,
copyright holder, year, permission, contributor agreement or blanket licence
decision was invented. Robert was asked whether MIT is intended; no response
is assumed.

## Third-party service boundaries inspected in code

This is a code-derived boundary map, not reviewed current provider terms,
accounts, contracts, DPAs, quotas or permission grants.

| Boundary                     | Direct source evidence                                                                                                          | Required acceptance before enabling                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account email                | server/account-mail.ts posts to api.resend.com/emails                                                                           | Approved account/sender, terms/data handling, verified inbox/delivery, retention and cost limits                                                               |
| Inherited owner notification | server/_core/notification.ts uses the configured Forge base/key, separately gated by ENABLE_OWNER_NOTIFICATIONS (default false) | Actual provider/recipient, purpose/content transfer, terms/retention and cost/delivery acceptance; administrator step-up or credentials alone are not approval |
| Legacy LLM/data helpers      | server/_core/llm.ts and dataApi.ts use Forge URL/key; LLM defaults to forge.manus.im                                            | Confirm actual provider, endpoint/key ownership, content rights and processing/cost policy; do not infer OpenAI use from the misleading missing-key error text |
| Legacy storage proxy         | server/storage.ts uses the configured Forge base/key for upload/download URLs                                                   | Approved storage provider, data ownership/access, retention/export/erasure and terms                                                                           |
| Legacy OAuth                 | server/_core/env.ts accepts OAUTH_SERVER_URL                                                                                    | Verify the actual operator/provider and supported use; configuration is not authentication acceptance                                                          |
| HAI inbound feed             | server/hai-connector.ts requires token and fixed owner                                                                          | Approved receiving party, scope/content choice, owner consent, retention and connector acceptance                                                              |
| Co-founder source platforms  | platform catalogue/source-policy code                                                                                           | Each platform's current permitted access/contact method, data rights, account eligibility and source-specific constraints                                      |
| Database/base/hosting        | MySQL 8.4 and pinned Node/Debian base; standalone production definition                                                         | Separate OS/native/software notice review, actual host/service contracts, region/security/backup and budget approval                                           |

The HTML contains Google Fonts links only inside a comment; they are not active
requests. No remote-font service was enabled or disabled during this review.
No live service was queried with credentials, enabled, purchased or approved.

## What remains outside this inventory

Development/build dependencies, OS/native packages, Node/base-image notices,
font/media/assets, bundled/minified or nested vendored code, dependency edges,
service contracts, original ZIP provenance and actual deployed content are not
completely covered. Package manifests and root notice-file presence/hashes do not
prove SPDX-expression validity, compatibility, complete attribution, data rights
or legal compliance. Both legalApproval and completeSbom remain false.

## Verification of this increment

A second independent read of the same immutable runtime image reproduced every
record and the canonical digest exactly. The saved JSON parsed successfully;
record count, digest and explicit false approval/SBOM flags were checked. All
fourteen structural traceability tests, source-bound phase/artifact validation,
formatting and whitespace checks passed. Structural checks do not approve
licences or prove phase completion. No application suite was rerun for these
documentation-only changes. The selected application/build inventory digest
remains unchanged, so this increment does not silently requalify different code.

The deployment-patterns skill guided actual-artifact inspection and explicit
release gates. This is substantive but partial evidence for phase 067, not a
completed licence/service review. No application/runtime code, lockfile, licence
choice, publication, account, permission, provider setting, purchase or real data
changed. Original worldwide scope and public-beta launch gates remain open.
