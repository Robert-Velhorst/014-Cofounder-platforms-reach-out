# Privacy-impact assessment: review draft

Version: privacy-impact-draft-2026-10-02. Status: **unapproved; launch gates unresolved**.
Audience: Robert/service owner, designated privacy reviewer, operators and developers.

## Executive decision

Do not onboard the public beta solely on the strength of local tests or this
document. Complete controller/processor responsibilities, jurisdiction and
lawful-basis decisions, customer/candidate rights handling, actual provider/store
registers, approved retention/erasure and restoration controls, and residual-risk
review first. This is a substantive assessment draft, not a published privacy
notice, completed statutory DPIA, approval to collect data, or authority to erase it.

The product helps customers privately organize potential co-founders and prepare
individually reviewed outreach. Candidates are people too: the customer's account
ownership does not resolve the candidate's privacy rights, data provenance,
contact permission or notice obligations. A platform catalogue entry grants no
permission to import profiles or contact members.

The full worldwide objective is retained, but country/provider acceptance is
not proven. The €100/month ceiling is planning-only and does not justify dropping
required protection, assuming free providers or starting unapproved processing.

## 1. Assessment boundary and evidence

Directly reviewed: current Drizzle schema, export-projection inventory, deletion
schema manifest, private profile validation, qualification transaction, account
export, suspension command, browser startup/storage references and production
configuration. No real records, customer account, provider account, production
database or contracts were accessed.

The [schema observation](PRIVACY_SCHEMA_INVENTORY_2026-10-02.json) records all
43 current application tables and 505 fields, their SQL names/types/nullability,
owner scope, export-projection membership/exclusion reason, deletion-manifest
references and four source-file hashes. Thirty-eight categories have account/
parent ownership scope; five are shared service categories. It includes 29
JSON-valued fields, some bounded/structured and some unreviewed nested payloads.
Forty fields are excluded from category projections. A field count is not a count
of people, proof that all fields are personal data, legal classification or
inspection of nested content.

Canonical sorted-table observation digest:
`51fb8564020362c42e6942d0fc5b89e98ef9469c2418f56f3ae47624dd743852`.
The actual export operation omits service categories; projection membership alone
does not promise inclusion in a download. Export exclusions do not determine what
must be provided through a reviewed rights request or what may be retained.

Observed branch: agent/public-saas-beta; HEAD
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`; dirty source.
[Packaged regression](LOCAL_PACKAGED_REGRESSION_2026-10-02.md) is local synthetic
technical evidence, not current hosted/customer/privacy acceptance.
[Retention draft](ACCOUNT_RETENTION_ERASURE_POLICY.md) remains the authoritative
place for proposed category periods and execution-state distinctions; no period
is approved or enabled by this assessment.

Scope exclusions: actual deployment/provider configurations and contracts,
operator device/backups/exports, every historical payload and legacy route,
all nested JSON/free-text contents, screenshots/support attachments and
jurisdiction-specific legal review. Inherited records may exist even when their
feature is currently disabled. Empty test fixtures prove nothing about live data.

## 2. People, purposes and data flows

| People/process                 | Actual or potential data                                                                                    | Purpose and boundary to review                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account holders                | Identity, email, private founder profile, preferences, sessions and security state                          | Account access and private workspace; establish controller role, minimal fields and lawful basis                                                         |
| Candidates and correspondents  | Profile/source facts, skills, locations, biographies, contact/provenance, opt-out, notes/tasks and messages | Customer-directed discovery/contact preparation; establish candidate rights, permitted source/intake and responsibility independently of account consent |
| Founder evaluation             | Matches, reasons, preferences, ranks, outcomes and legacy AI/analytics fields                               | Assisted comparison; verify purpose, accuracy, fairness, explanation/correction and future changes                                                       |
| Administrators/operators       | Passkey/security state, audit/review/approval references and diagnostics                                    | Privileged access/accountability; minimize data and identify actual responsible roles                                                                    |
| Other people mentioned in text | Names, employers, relationships or sensitive information in notes/messages/templates/payloads               | Incidental data may exceed the intended founder purpose; minimize, review and handle rights rather than assuming ownership                               |
| Service operation              | Quota digests, capacity rows, mail jobs, replay/audit records and legacy usage/invoices                     | Security and operation; shared/pseudonymous is not automatically anonymous or exempt from review                                                         |

Current supported flow: customer enters a private profile or a permitted candidate
record/import -> authenticated owner-scoped storage -> explicit local qualification
or human-original draft -> review/approval/manual preparation -> customer-performed
platform contact -> customer-recorded outcome. Opt-out restrictions are checked by
supported qualification/outreach paths. Neither an imported record nor an approval
proves that an independent platform actually delivered a message.

Possible external flows must remain separately documented:

- The administrator `system.notifyOwner` path can disclose title/content to the
  configured inherited provider only after administrator/passkey authorization
  and explicit ENABLE_OWNER_NOTIFICATIONS opt-in. Both Compose definitions keep
  it false. This is separate from the legacy-route/account-mail switches; no
  recipient, processor agreement, cost or actual delivery is approved. Local
  timeout/log safeguards do not establish necessity or lawful disclosure.
- Enabled account email can disclose destination/email-message information to the
  configured mail provider. A synthetic acknowledgement does not establish inbox
  delivery, real processing terms or deletion.
- The optional HAI feed can disclose reviewed account metadata and, if explicitly
  configured, content to the authorized receiver. Fixed-owner/token protection does
  not prove the receiver's subsequent handling.
- Legacy Forge LLM/data/storage and platform automation helpers require separate
  provider/rights approval; disabled supported routes do not erase historical data.
- Browser memory/cache, downloaded JSON/CSV, clipboard, manual contact on a platform,
  operator/support material and backups create copies outside ordinary database
  row handling. Theme/sidebar-width local storage was found in the inspected client;
  no claim is made that every browser/device store has been exhaustively audited.
- Published catalogue links describe services, not member ingestion. Google Fonts
  references in the HTML are comments, not active font requests.

The [third-party boundary review](THIRD_PARTY_RELEASE_REVIEW_2026-10-02.md) identifies
source-level providers; it is not an actual processor/transfer register.
The controller must record actual recipient, fields/purpose, region/subprocessors,
contract/safeguards, retention and rights/deletion method for each enabled flow.

## 3. Necessity, proportionality and safer alternatives

These are proposed design decisions, not accepted legal conclusions:

| Proposed processing       | Necessity question                                                                               | Less intrusive alternative / required decision                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account/security          | Which identity and security fields are needed for the supported login/workspace?                 | Keep private defaults; do not require unneeded connected-platform IDs or credentials                                                              |
| Candidate intake          | Why retain each source fact/contact detail instead of only a permitted reference?                | Minimum facts and provenance; no permissionless profile collection; review importing third-party free text                                        |
| Preferences/qualification | Which signals help the customer decide, and what can be misleading?                              | Optional minimal professional tags and human review; exclude protected/sensitive inferences unless separately justified and allowed               |
| Drafts/messages/outcomes  | Which original text and receipts are necessary, and for how long?                                | Minimize quoted private third-party text and copies; bounded original templates are not permission to reuse sensitive content                     |
| Abuse control/audit       | Which linkable identifiers and metadata are necessary for each window/incident?                  | Purpose-separated digests, minimized metadata and reviewed expiry; preserving active limits is distinct from indefinite retention                 |
| Export/support            | What information can the holder receive safely without disclosing another person or credentials? | Safe automated export plus separate supported review of excluded/third-party material; never equate the allowlist with a complete rights response |
| Backups                   | Which copies are necessary and how will restrictions survive rollback?                           | Approved bounded backup lifetime, isolated restores and independent suppression before promotion                                                  |

Current qualification is not an AI probability model. The inspected transaction
compares the owner's lookingFor/targetIndustries tags with candidate skills/
industries, lowercases/trims them, and computes a capped score from overlap plus
a biography-presence increment. It stores reasons and review recommendations,
preserves historical matches and blocks opted-out candidates. These implementation
facts do not validate success likelihood, cultural/language fairness or factual
accuracy. The biography increment can favor richer profiles regardless of actual
compatibility; treat it as a review signal, not a validated finding about a person.
See [qualification transaction](../apps/cofounder-discovery/server/db.ts) and
[private profile validation](../apps/cofounder-discovery/shared/profile-input.ts).

Free-text bio, values, notes, templates and message content can contain sensitive
personal information even without a dedicated sensitive-data column. This is a
plausible content risk, not evidence that actual health, belief or other protected
data were collected. Review what must be prohibited, minimized or handled under
an appropriate separately established basis. Do not infer nationality, religion,
health, ethnicity or political views from names, language, location or “values”.

## 4. DPIA screening and legal decision record

The EDPB explains that a DPIA precedes processing likely to produce high risk to
people's rights/freedoms, and unresolved high risk can require consultation with
the competent authority. Its data-protection-by-design guidance emphasizes
appropriate effective safeguards throughout processing, not just a configuration
or document. These are general EU-context requirements; applicability and the
competent controller/authority remain to be established here.
[EDPB DPIA guidance](https://www.edpb.europa.eu/topics/accountability-and-compliance-tools/data-protection-impact-assessment_en),
[Article 25 final guidance, executive summary and section 2.1.1](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201904_dataprotection_by_design_and_by_default_v2.0_en.pdf).

Screening determination: **pending qualified controller review**, not “not required”.
Relevant product indicators to evaluate include founder scoring/evaluation,
combining imported source facts and private notes, potential sensitive free text,
non-customer candidates, planned worldwide reach and future AI/automation.
Small initial budget, human review and paused automation are safeguards or scope
facts, not a recorded exemption. Current actual population, scale, countries,
children/vulnerable-person handling and authority-specific screening lists were
not verified. No statutory DPIA necessity decision or accepted residual risk is
invented.

Required decision record:

- Identify controller entity, establishment, responsible privacy/support roles,
  customer/service controller/processor allocation and supported jurisdictions.
- Document each purpose and lawful basis, notices for account holders and
  candidates, source/intake permission and any exceptions with reviewer/evidence.
- Determine sensitive-data and age eligibility rules, profiling/automated-decision
  implications, applicable DPIA screening and any necessary consultation.
- Record actual recipients/transfers, retention clocks, rights workflow,
  incident response and evidence for every accepted safeguard.
- Record reviewer, version/source hashes, date, unresolved items, accountable
  decision owner and explicit go/hold outcome. Approval of text is not deployment
  or authorization for a particular live operation.

The official EUR-Lex GDPR text could not be read in this turn because its reader
returned an anti-bot JavaScript challenge; this draft does not claim a refreshed
direct statute read. The accessible EDPB sources above support the narrow
statements made here. The previous retention draft's legal citations are dated
evidence, not silently refreshed worldwide legal advice.

## 5. Risk register and remaining acceptance

Qualitative impact concerns below are plausible scenarios, not observed incidents.
Likelihood, final severity and residual-risk acceptability need controller review;
no numerical probability or “low risk” certification is asserted.

| Risk                                         | Existing bounded control/evidence                                                     | Unresolved consequence and release acceptance                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 Cross-owner exposure/mutation             | Owner-scoped APIs, lock/fence checks and synthetic isolation tests                    | Complete current endpoint/history/operator review and real multi-user acceptance; identify third-party-rights boundaries                                                      |
| R2 Unauthorized source/contact use           | Source policies, discovery-only catalogue and opt-out checks                          | Customer attestations cannot prove rights; verify sources, candidate information/objection handling and platform permissions                                                  |
| R3 Misleading/unfair evaluation              | Explicit local tag method, preserved historical assessment and human review           | Explain limitations, prove correction/reassessment and prevent sensitive inference; review language/cultural bias and any expanded profiling                                  |
| R4 Sensitive or excessive text               | Bounded fields/templates and private profiles                                         | Bounds are not minimization/content approval; establish guidance, permitted content, review/removal and actual nested-payload handling                                        |
| R5 Excess retention/incomplete erasure       | Request/preflight/suspension paths, opt-in mail cleanup                               | Final general erasure/expiry, justified exceptions, processor reconciliation and holder/candidate notices remain unaccepted                                                   |
| R6 Restore resurrects access/messages/data   | Encrypted isolated recovery rehearsal; workers disabled in tests                      | Approved suppression outside rollback horizon, quota preservation and promotion checks are not implemented/accepted as a complete live path                                   |
| R7 Export/support leaks or denies rights     | Password/revision/account checks, bounded allowlist exports and strict support bundle | Operator-reviewed excluded data/third-party rights, support identity, retention and safe actual sharing need acceptance                                                       |
| R8 Provider/transfer misuse                  | Provider workers/legacy routes off in standalone production defaults; scoped HAI      | Actual contracts/regions/content choice, costs, consent/permissions and provider deletion require review; enabling flags is not acceptance                                    |
| R9 Privileged misuse/credential compromise   | Revocable sessions, administrator passkeys/elevation and non-root restricted runtime  | Actual operator authorization, host ACL/secret rotation, incident response and hosted TLS/topology still require verification                                                 |
| R10 Untracked copies and misleading promises | Private/no-store responses and local diagnostic boundaries                            | Browser console/errors, clipboard/downloads, support artifacts, remote backups/logs and user/platform-held copies require an actual store register and truthful scope notices |

Archive, cancellation, processing suspension and zero rows in synthetic fixtures
do not mean erasure. The current processing command expressly does not erase data.
Encryption or keyed quota digests alone do not make data anonymous. Neither the
draft nor its controls establish deletion at an independent platform/receiver.

## 6. Launch and change-control checklist

Recommended outcome remains **hold public onboarding until gates are closed**.

The reviewed standalone production definition sets ENABLE_REGISTRATION=false.
This is a source-level default, not inspection of an actually deployed block,
and it does not by itself enforce every legal or operational gate. The broader
hold in this assessment is a recommendation awaiting accountable release review.

| Gate                                     | Accountable role to assign                                         | Required decision/evidence                                                    |
| ---------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Controller, scope and lawful bases       | Actual controller with qualified privacy reviewer                  | Recorded entity/roles, purpose/jurisdiction/age/basis decisions               |
| Minimization and actual stores           | Controller with implementation maintainer and operator             | Reviewed fields/content and real source/provider/copy register                |
| Notices and rights                       | Controller with designated privacy/support lead                    | Accurate notices, safe rights response and post-suspension support acceptance |
| Retention, erasure and restoration       | Controller with authorized database/backup operators               | Approved policy and real execution/suppression/promotion evidence             |
| Hosted/provider/customer acceptance      | Release owner with authorized operators                            | Accepted final artifact, real topology/provider and customer journeys         |
| DPIA, residual risk and any consultation | Actual controller with qualified reviewer and DPO where applicable | Recorded necessity/risk/consultation determination and go/hold decision       |

These are role assignments still to be made, not named authorized people or proof
that Robert personally occupies every role. A role label does not grant access.

1. Assign actual controller/privacy/support/operator responsibilities and record
   jurisdiction, age and lawful-basis decisions for each processing purpose.
2. Finish field/content minimization and actual source/provider/store registers,
   including credentials, shared state, logs, exports and backup copies.
3. Approve accurate holder/candidate notices, access/correction/objection/restriction/
   erasure handling and identity verification with post-suspension support.
4. Implement and verify approved retention/erasure and suppression-before-restore
   promotion, with safe partial/exception statuses; do not activate guessed periods.
5. Accept hosted security, real provider, rights-request and customer/operator
   journeys against the final release, not merely synthetic tests.
6. Complete DPIA applicability and residual-risk/consultation decisions and record
   an accountable reviewed release outcome before enabling the public service.

Reassess on new schema/nested payloads, country/source/platform, recipient/region,
AI/profiling, public-directory publication, automation/sending, scale/children,
retention/backup or security changes. Keep review evidence versioned. A code/schema
change should reopen affected decisions rather than inheriting an old approval.

## 7. Preparation verification

On October 2, the schema-only probe was repeated against the saved inventory:
43 tables/505 fields, export/deletion column reconciliation and all four source
hashes matched exactly. Canonical sorted-table JSON SHA-256:
`51fb8564020362c42e6942d0fc5b89e98ef9469c2418f56f3ae47624dd743852`.
The production-definition hash was refreshed after adding the disabled owner
notification flag; its prior hash remains in the observation. The three schema/
export/deletion source hashes and canonical table digest still match. This is a
source refresh, not new live data inspection or approval of an external flow.
No database connection, live record or nested-payload inspection was involved.

The retained-source requirements check and all fourteen requirement-traceability
tests passed after the documentation update; formatting and whitespace checks
passed. These are structural documentation checks, not privacy-law acceptance or
new application/runtime testing.

An independent reader answered ten comprehension questions and reviewed revisions
clarifying unresolved launch gates, registration defaults versus deployed
enforcement, and accountable roles. No remaining material comprehension issue was
reported. This was document comprehension, not human legal review, factual-source
validation, controller approval or evidence of production acceptance.

## 8. Reader questions and limits

- Is this a public privacy notice or a completed approved DPIA? No.
- Did this inspect people or live database rows? No; schema/source only.
- Are 505 fields all personal data or legally classified? No.
- Does a permitted account export settle a candidate's rights? No.
- Are source attestation, encryption or manual review enough to approve all use? No.
- Does the deletion-processing command erase the account? No; it prepares/suspends.
- Is the privacy retention draft approved or cleanup activated? No.
- Is GDPR/worldwide applicability or DPIA necessity decided? No.
- Does the €100 budget waive protection or authorize purchases? No.

Prepared using the documentation-coauthoring skill's context/structure/reader
checks, adapted to Robert's autonomous-work instruction. No code, live data,
retention setting, licence, provider, purchase, publication or permission changed.
