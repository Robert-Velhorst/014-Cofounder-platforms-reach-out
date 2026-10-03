# EUR 100 beta operating plan: candidates, not approved commitments

Reviewed October 2, 2026. Robert's ceiling is EUR 100/month initially; retain
EUR 20 reserve and plan within EUR 80. No accounts, subscriptions, purchases,
provider settings or deployments have been created/changed. Existing hosting and
domain preferences have been requested, without asking for credentials.

This is a preparation document, **not** a complete tax-inclusive quote or passing
[budget declaration](OPERATING_BUDGET.md). Actual monthly total remains unknown.
Never change an unknown category to zero merely because a provider advertises a
free tier. A price page is not account eligibility, permission or hard-cap evidence.

## Proposed allocation targets

These are internal planning targets, not provider prices or approved caps. They
sum to EUR 80, excluding the EUR 20 reserve. Reallocate only after the complete
tax-inclusive plan fits the ceiling; do not double-count bundled services.

| Category        |        Planning allocation | Acceptance still required                                                                                                                                       |
| --------------- | -------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting         |                     EUR 40 | App, private database and genuinely separate staging costs; instance, location, IP, disk, tax and billing review; actual host resource/ingress tests            |
| Database        | Included in hosting target | Operator-managed MySQL only if separately approved; persistence, private network, maintenance, backup and restoration ownership; managed DB needs its own quote |
| Email           |                     EUR 10 | Verified sender, account-specific plan/overage settings, deliverability and inbox/security-notice tests; align durable app quotas with the actual provider      |
| Optional AI/API |       EUR 0 while disabled | No external paid model calls in this initial plan; original AI requirements remain unfinished, not removed from scope                                           |
| Storage/backup  |                     EUR 10 | Encrypted off-host snapshots, retention, independent keys, restore/egress/operation costs, region and actual recovery rehearsal                                 |
| Traffic         |                     EUR 10 | Host/proxy/backup traffic and attack/overage consequences; edge controls and alert/exhaustion tests, not merely application rate limits                         |
| Domain          |                      EUR 5 | Existing domain/subdomain preference; registration/renewal/upfront obligations, DNS ownership and tax-inclusive quote                                           |
| Monitoring      |                      EUR 5 | Independent failure notification, log/metric retention, operator escalation and actual delivered-alert tests                                                    |

The free public beta is free for customers, not free infrastructure. This planning
envelope does not establish profitable operations, staffing cost, high availability
or a supported customer count. The local one-CPU/512MiB app and one-CPU/2GiB
database workload receipt does not size staging, OS, TLS, backups, monitoring or
hosted network traffic. Assess all of those together on the selected host.
The subsequent [identity-only CPU diagnostic](SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md#cpu-resource-differential-failing-baseline-changed-resource-return-to-baseline)
failed at one CPU, passed at two, then failed at one again. This is not a priced
hosting requirement or permission to resize; the full one-CPU scheduled-arrival
gate remains failed and wider capacity/host cost still require measurement.
Two subsequent instrumented one-CPU identity samples passed despite measured
throttling. This variability reinforces that no deterministic two-CPU hosting
requirement or capacity purchase is established. The EUR 100 ceiling remains a
planning limit, not spending authorization; preserve the EUR 20 reserve.

## Read-only public-provider evidence

### Hosting candidate: Hetzner Cloud

[Official cloud page](https://www.hetzner.com/cloud/) describes private networking,
firewalls and shared/dedicated resource options. The fetched page exposed a
country/VAT selector but no numerical server quotes; the calculator link returned
the same unpriced page. **No server SKU or EUR monthly price is verified here.**
Do not substitute remembered prices or assume location/capacity availability.
An existing provider may be preferable; this is a candidate, not a selection.

Operator must obtain the exact instance/location quote and review public IPv4,
storage, snapshots/backups, staging, data-transfer overages, taxes, billing alerts
and suspension semantics. Self-managing a database brings maintenance duties;
it is not equivalent to a managed database or independently recoverable backup.

### Email candidate: existing Resend adapter

[Official Resend pricing](https://resend.com/pricing) currently advertises a free
transactional plan at USD 0/month, 3,000 emails/month and 100/day. Pro is USD
20/month for 50,000 emails; paid pay-as-you-go can charge additional buckets.
These are published plan figures, not verified account settings or a EUR quote.
Free-tier suitability requires confirming sender/domain eligibility, quota windows,
all applications sharing the account, renewal/upgrade behavior and actual delivery.
Keep paid overages unenabled unless explicitly approved. Do not spend the EUR 10
allocation automatically. Registration, recovery, verification and security
notifications share the real mail budget; retries and uncertain acknowledgements
must also be reconciled. This is not candidate outreach permission.

### Off-host storage candidate: Cloudflare R2 Standard

[Official R2 pricing](https://developers.cloudflare.com/r2/pricing/) lists Standard
storage at USD 0.015/GB-month, writes/class A at USD 4.50/million and reads/class B
at USD 0.36/million. Its monthly Standard free tier includes 10 GB-month,
one million class A and ten million class B operations; direct R2 egress is free,
but other connected services can charge. Billing uses rounding; infrequent access
has separate retrieval/minimum-retention costs and does not get that free tier.

This is metered storage, **not a verified spending cap**, a selected backup region
or a tested remote recovery target. A provider-account, billing, region/privacy,
retention, independent-key and restore review is still necessary. Do not enable
R2 or upload account data from this research. USD pricing needs an operator-reviewed
EUR tax/currency/overage ceiling before the EUR-only checker can assess it.

## Route to an actual launch decision

1. Confirm existing hosting/domain and whether self-managed MySQL operations are
   acceptable. Keep staging and production origins, databases and secrets separate.
2. Obtain dated, account-specific quotes and reviewed caps/overage consequences
   for all eight categories, including taxes, upfront payments and currency risk.
3. Prepare the actual plan privately; run the budget checker. Public research alone
   cannot make its deliberately incomplete example pass.
4. Obtain explicit purchase/deployment authority before provisioning. Configure
   real HTTPS/proxy trust, sender/DNS, off-host encrypted backup, alert delivery
   and operator support only through the approved path.
5. Exercise actual hosted capacity, failures, mail exhaustion/inbox journeys,
   backup/key recovery, rollback, privacy/retention and customer-pilot gates.
   Local build/test evidence is not acceptance of these provider paths.

This plan advances operating preparation, not complete production readiness.
Worldwide native-platform coverage, source-specific permissions and the original
116-phase requirements remain tracked separately; none is waived to fit the budget.
