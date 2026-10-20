# Indonesia discovery review — October 2, 2026

## Decision and delivered source

Added founderbro as one community discovery record, not dedicated matching.
Catalogue source is now 68 records: 21 dedicated, 24 community/channel and 23
programme/event/ecosystem. There remain 23 previously manual-reviewed and 45
discovery-only records; no integration is enabled. This is not worldwide coverage.

The public [founderbro directory and embedded terms/privacy](https://founderbro.id/)
describe curated Indonesian startup listings and prohibit scraping/bulk export.
The card preserves those limits. No individual profile, account or contact data
was imported; no form, signup or message submitted. Account and native-language
workflows remain untested. Provider identity/security claims are not endorsed.

## Counterevidence and held leads

- [Antler Indonesia](https://www.antler.co/location/indonesia): current FAQ requires
  at least two co-founders and full-time in-person Jakarta residency. It offers
  pre-application community help; not an open solo-founder residency matcher.
  Keep as regional research, not a duplicate Antler card or expanded action grant.
- [HUB.ID summit](https://www.hub.id/global-summit/): commercial/investor networking;
  startup criteria include Indonesian operations/founder, 12-month product history
  and traction. Not evidence of dedicated founder matching. No public card added.
- Kawal Bisnis Lokal: search lead only; direct homepage returned HTTP 502. No
  current access/policy claim or public card justified.
- Foundersbase's Indonesian landing page is an existing brand, not a distinct
  matching pool. Search discovery alone did not qualify local access or policy.
- Vietnam search returned no sufficiently verified local source in this pass;
  no negative claim about whether one exists. Further native-language discovery,
  country/channel coverage and member access remain required.

## Implementation and bounded checks

`server/platform-catalogue.ts` adds the record and searchable aliases.
`server/platform-catalogue.test.ts` asserts category, eligibility, anti-harvesting
warning, uniqueness, counts and all-false integration flags. The existing regional
admission suite adds four aliases/host variants; each must refuse CSV import,
individual intake, source declaration and manual destination resolution, including
attempted manual-source bypass. No admission allowlist or backend route changed.

Focused catalogue/admission: 147 cases in two files, no skips, 14.51 seconds.
Typecheck and production build passed. Full host unit suite passed 1,009 cases
across 98 files, no skips, 122.11 seconds; this is not packaged-image execution.
All 170 operator cases passed without skips in 3,969.1869 ms. Formatting,
diff-whitespace and requirements checks passed. Catalogue source SHA-256:
`ddef9d7982f37e21d381d426451774b11c3c814c17cf6760fee08499ab0d3268`.
Subsequent [fresh package qualification](INDONESIA_68_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
passed 1,009 packaged units, 724 database cases, compiled parity, compiled-server
startup probes and seven connected desktop/mobile catalogue stages, then the
24-stage customer journey and actual default-startup cancellation/readiness/drain.
Subsequent bounded local encrypted recovery and read/write load passed;
whole-product/hosted load and remote/operator recovery acceptance remain open. The
preceding [candidate-language package](CANDIDATE_WORKSPACE_LANGUAGE_2026-10-02.md)
retains its exact-image receipts; they do not transfer automatically to this build.

Structural comparison: all API routes/input digest unchanged; UI actions,
references and totals unchanged. Only the imported catalogue input bytes changed
in the UI inventory; its updated digest is recorded in the UI action audit.
No customer/operator acceptance or release approval. All 116 phases remain Partial.

Market-research guidance required first-party evidence and explicit counterevidence
instead of treating commercial matching or search snippets as co-founder access.
No GitHub commit, push, merge, publication, deployment, provider change or spending.

External receipts: `outputs/indonesia-directory-focused-20261002.log`,
`indonesia-directory-units-20261002.log`, `indonesia-api-inventory-20261002.json`
and `indonesia-ui-inventory-20261002.json` beside this checkout.
Operator receipt: `outputs/indonesia-directory-operator-20261002.log`.
