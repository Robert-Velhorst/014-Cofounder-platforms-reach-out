# Oceania co-founder source review — 23 October 2026

## Decision

No new dedicated Australia/New Zealand/Pacific matching record is responsibly
recommended from this bounded review. Retain the existing Lineup hold. There is
useful new Australia-specific evidence for the existing `antler` record, but it
describes co-founder formation inside a selective investment residency, not an
independent matching marketplace. Do not duplicate the brand or expand its
previously reviewed manual-workflow permissions.

This report does not establish worldwide completeness, Pacific-wide coverage,
provider endorsement, admission, integration permission, or production acceptance.
The research subtask changed only this report; it changed no catalogue, tests,
README, Git refs or external metadata. Subsequent parent implementation is
identified separately below.

## Scope and method

Reviewed on **2026-10-23**, against the authoritative catalogue at
`apps/cofounder-discovery/server/platform-catalogue.ts`. Existing
`docs/PLATFORM_SOURCE_REVIEW.md`, especially its twelfth coverage supplement, and
`docs/PLATFORM_COVERAGE_GAPS.md` were read to avoid treating held or existing brands
as new discoveries. Lineup was already held because homepage access failed;
Something New was already held because its direct page was unreadable. This
review does not independently refresh Something New.

Used public web search to identify first-party pages, then direct page reads.
Where the web reader failed, ordinary unauthenticated public HTTP GETs read the
returned HTML, with scripts/styles/SVG removed and text decoded for inspection.
No private API, member directory endpoint, account, profile detail, registration,
form submission, purchase, or contact was used. Incidental marketing sample cards
were not collected into candidate records. A clean-context browser attempt failed
because the connected Chrome profile was already in use; it was not stopped or
reconfigured. No rendered or authenticated provider workflow was verified.

English-language search covered Australian and NZ matching, Pacific matching,
and first-party Antler/Startmate/Fishburners routes. Negative results are not proof
that a service or policy does not exist. This is a targeted review, not a census.

## 1. Lineup — existing held New Zealand lead

The directly readable [homepage](https://www.lineup.nz/) advertises a NZ-focused
co-founder directory: profiles, projects, shared skill/stage/time fields, and
requests/replies inside Lineup without exchanging email addresses. Free joining
is advertised. The footer names **Noaur Group Oy** as maker; this is a provider
identification, not an independently checked company-register record. Global
eligibility is unverified; an Australian example and ANZ partner wording do not
establish admission from every country. Dedicated discovery is advertised, not
tested matching or verified member availability.

Current access improves on the previous homepage failure, but **does not resolve
the policy/access hold**:

| Public URL checked                                      | Direct observation on 2026-10-23                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Homepage](https://www.lineup.nz/)                      | HTTP 200, readable marketing text.                                                    |
| [Privacy link](https://www.lineup.nz/privacy)           | HTTP 200, the same normalized homepage text, not a retrieved privacy notice.          |
| [Terms link](https://www.lineup.nz/terms)               | HTTP 200, the same normalized homepage text, not retrieved terms.                     |
| [Signup destination](https://platform.lineup.nz/signup) | HTTP 200, JavaScript shell with title only in the text extraction; no form submitted. |

For all three www marketing/policy responses, decoded normalized text length was
7,351 characters and SHA-256 was
`c8653313a4512b09ed47e69abdd0c8957dbffc77f89edba49d0fe721f91fabfb`.
This fingerprints observed text only, not a saved page archive. Bare-domain policy
requests also redirected to www and returned the homepage. A client-rendered policy
could still exist; no claim of absent policies is made.

**Held research fields, not a customer listing:** proposed id `lineup-nz`; name
`Lineup (New Zealand)`; category `dedicated`; pricing status `free-entry` only if
later policy/access review permits listing. Evidence URLs are the four above;
review date `2026-10-23`. Age, accepted countries, entitlement limits, paid tiers,
legal privacy terms, retention, export/API rights, and external-contact rights
remain unresolved. Keep all import, outreach, automation and AI-posting abilities
disabled. Provider-generated openings do not authorize this application to send
or paste drafts. Public advertising is not candidate-data reuse or contact consent.

## 2. Antler Australia — existing program, bounded enrichment possible

The [Australia location page](https://www.antler.co/location/australia) explicitly
advertises co-founder matching inside an eight-week residency. Its FAQ accepts
solo entrants but says investment is for teams; it is not an open matching pool.
The [current cohort page](https://www.antler.co/cohort-start-dates) lists
**8 February 2027**, Brisbane/Sydney/Melbourne, explicitly a start date, not an
application deadline. Selection and actual availability remain untested.

The provider's [7 April 2026 residency article](https://www.antler.co/blog/behind-the-scenes-a-look-inside-antlers-residency-in-australia)
describes full-time participation and AU$260,000 for 12% equity for backed teams.
This is advertised investment, not a free matching subscription or guaranteed
funding. Current signed terms, Australian participation fees, travel/living costs,
visa/work authorization, and eligibility of NZ/Pacific/other foreign applicants
remain unverified. Do not inherit MENAP's no-fee or visa statements into Australia.

The [privacy notice](https://www.antler.co/legal/privacy-policy) identifies Antler
Innovation Pte Ltd, associates and international offices; it does not by itself
establish the particular Australian contracting entity. It covers founder
applications and personal-data processing, including service-provider sharing,
and says consent is sought before disclosure to investors/advisers/partners.
Those are Antler's own processing statements, not a licence for this app to
reuse founder information or contact people. No application submitted and no
founder/member profiles opened.

General website/service terms were not established: trial paths
`/terms-and-conditions`, `/legal/terms-of-use`, and
`/legal/terms-and-conditions` returned HTTP 404 in direct requests. This is not
evidence that participation terms are absent. Signed documents require separate
review before any commitment. No legal opinion or privacy/security certification
is offered.

### Recommended fields for an independently reviewed update

Keep `id: antler`, existing name/URL, category `program`, and
`pricingStatus: investment-terms`. Optional aliases: `Antler Australia`,
`Antler Sydney`, `Antler Melbourne`, `Antler Brisbane`. Add an Australia-specific
audience/access/pricing paragraph using only the bounded observations above;
retain MENAP text as region-specific, not a global promise. Append the four
first-party evidence URLs above and set `reviewedAt: 2026-10-23` if the parent
reviewer independently confirms them. Do not create `antler-australia`, recategorize
the whole brand as dedicated matching, or change assistance/intake/outreach flags.

## Other leads screened, not admitted

- **ASIHUB:** search surfaced a claimed Australian-connected warm-introduction
  route at [Find Your Co-Founder](https://asihub.com.au/find-cofounder). Actual
  homepage/form reads failed with web-reader 502 and direct DNS lookup failure.
  A search extract is not a page read: operator, policies, price, eligibility,
  present operation and matching access are **not verified**. Hold; do not cite the
  cached description as accepted service evidence.
- **Aussie Founders Club / AFC Connect:**
  [public homepage](https://aussiefoundersclub.com/) and
  [Connect route](https://aussiefoundersclub.com/connect) returned HTTP 200 but only
  a JavaScript shell/title through direct and web-reader access. Search described
  a prototype with co-founder filtering, which was not independently read as a
  functioning service. Hold pending rendered access, operator and policy review;
  do not promote it from community/prototype to dedicated matching.
- **ConnectX:** [Sydney landing route](https://getconnectx.app/find-a-cofounder-sydney)
  and [homepage](https://getconnectx.app/) likewise returned only a JavaScript
  shell/title. A city-specific search extract is not proof of a locally focused
  independent pool, operator identity or admission. Not recommended here.
- **Foundersbase country variants:** existing brand, not new Australian/NZ pools
  established by this review. No duplicate record recommended.
- **Startmate, Fishburners and Pacific ecosystems:** no newly established dedicated
  route in this review. Existing community/program classifications and Pacific
  gaps remain; lack of a new result is not proof that no route exists.

## Remaining acceptance boundary

No new dedicated listing passes this review. Antler can improve Australian
program-discovery specificity, while Lineup remains a credible but held NZ lead.
The next safe work is independent evidence review and, if feasible, public
rendered policy inspection. Accounts, applications, correspondence, payments,
provider commitments and any candidate-data collection require their own explicit
authority and acceptance checks. The review does not close ANZ/Pacific dedicated
matching coverage or any worldwide production-readiness requirement.

## Independent parent review and adopted source changes

The parent independently read the four Antler Australia/cohort/article/privacy
pages above and rechecked the existing [MENAP FAQ](https://www.antler.co/location/menap).
The latter still describes ten weeks, in-person/full-time participation, MENAP
venture focus, no residency fee and founder-managed visas without sponsorship.
These remain MENAP-specific; the Australian record does not inherit them.
The served privacy page displays **Last Updated: 11 December 2020**. Reading it
today does not establish that its legal or operational declarations are current.

The existing `antler` card is enriched with independently confirmed Australian
program discovery, dated advertised investment/cohort details and explicit
unverified access/contract/fee limits. It stays category `program`, not a new
dedicated matcher. No action-label aliases are added. Catalogue totals stay 70,
with 23 manual-reviewed and 47 discovery-only records; no workflow permission,
account access, contact right or integration status changes. Search tests and
the existing browser search stage now include Antler plus the Australian cities.
Actual compiled/browser/member acceptance remains unverified.

Six focused actual-module Oceania cases pass, covering programme classification,
dated source limits, the four city/region searches, unchanged admission totals,
unpublished held leads and no new action-label aliases. The broader 69-case
source-policy/Oceania/Spain suite and all 232 native checks pass. Scoped strict
TypeScript 6.0.3 reports zero diagnostics for the three production policy/catalogue
roots. These are local source checks, not provider, member, rendered-browser,
whole-workspace build or production acceptance. Current qualification details
are in the [delivery ledger](PUBLIC_BETA_DELIVERY.md).
