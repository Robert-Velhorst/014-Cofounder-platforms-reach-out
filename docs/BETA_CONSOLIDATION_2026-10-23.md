# Combined beta candidate — October 23, 2026

Status: source consolidated for qualification, **not merged into main or released**.
The full worldwide beta goal and all 116 original phase requirements remain open.
No public deployment, registry publication, provider action, spending or privacy/
operator approval is established by this source consolidation.

## Preserved source and conflict review

Candidate branch: `codex/production-beta-consolidation-2026-10-23`.
Ordinary local merges preserve the complete histories of:

| Source PR                                                                            | Exact preserved head                       | Scope                                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| [113](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/113) | `3b3e86cca653985c6da30684fc663ff96ede57ac` | Private Hetzner stack, TLS rehearsal, fail-closed preflight and harness corrections |
| [114](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/114) | `4b337facab7beb7f5ef91635128417373151f8ff` | Held Egypt discovery evidence; no runtime catalogue or permission changes           |
| [115](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/115) | `c355ee06b97ffc81e33d14bc224b962ece9f39bb` | Read-only migration/history startup prerequisite and nine new MySQL/app cases       |

Merge checkpoint: `6a773e5`. Git ancestry checks confirmed all three heads are
ancestors. README and production-runbook conflicts were resolved by preserving
both deployment and migration guidance; no source behavior was discarded. Package
scripts retain both the TLS gate and `db:verify` command.

## Additional byte-policy repair and local evidence

Commit `2233b619964bb0901b74dd255bd4a020b348c430` adds explicit LF checkout rules
for TypeScript and a native Git-attribute regression. The release inventory now
requires and hashes `.gitattributes`, with change/missing-input tests.

Initial Windows API/UI checks failed because local CRLF copies disagreed with the
existing LF-bound snapshots. Only tracked local TypeScript copies whose Git blobs
were already LF were mechanically normalized. Git confirmed no TypeScript content
diff; original snapshot files/digests were retained, not regenerated or weakened.
No SQL migrations or database contents were changed by this repair.

All **182 root native operator tests** passed together, with no failures or skips,
in 8,800.2643 ms on local Node 25.2.1. This includes API/UI inventories, requirements,
release contracts/inventory, production/Hetzner models, preflight, recovery helpers,
monitoring, budget-declaration and support-bundle checks. The external parser cache
uses the pinned `@typescript/typescript6` 6.0.2 compatibility package backed by the
lockfile's TypeScript 6.0.3 compiler; the repository's
dependency tree was not reinstalled. Native model checks do not start containers.

These results do not prove full TypeScript checking, application units/build,
database cases, actual TLS/session behavior, full customer load or current-image
recovery. The required CI runtime is Node 26.12.0; whole combined-head CI remains
required. Earlier green main and partial/failed PR runs retain their source scope.

## Fresh-database local hardening checkpoint

Subsequent fresh-database hardening explicitly sets `MYSQL_ROOT_HOST=localhost`.
The unchanged 182 root native cases passed again in 9,850.0765 ms. The maintained
synthetic rehearsal now also checks aggregate root-account scope inside its own
database, verifies ordinary schema-user connectivity from the app-side namespace,
and accepts only explicit root authentication/host rejection there. No real
database account was changed. At that local-only checkpoint these probes had not
executed; the CI observation below now supplies their bounded synthetic evidence,
not hosted acceptance.

## Failed CI at 74e4e40 and public-certificate transport correction

[CI run 39877471835](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/39877471835)
tested exact source `74e4e40e861017d0286294d854001b2866f3f4f1` on Node 26.12.0.
Overall conclusion: **failure**, not a green or mergeable release qualification.
Container smoke and CodeQL passed. The main verification job passed operator
gates, application TypeScript/build, 1,036 app units in 102 files and 735 database
cases in 43 files, including all 43 migration-startup cases. Database readiness,
encrypted recovery, startup and authentication-admission rehearsals passed.

The unchanged full 100-account/10,000-candidate customer workload passed. At 150
scheduled arrivals/second all 1,500 requests returned 200, without errors, drops,
refusals or automatic retries; service p95 was 7.62 ms and scheduled p95 8.26 ms.
Both 6,000-request write tiers and competing-write/owner-isolation checks passed.
Overload tiers retained their bounded refusal behavior rather than a promise of
every request succeeding. These are CI observations, not sustained hosted capacity.
The tested runtime image was
`sha256:c4d48398c35ba62910923fca805e54781ba3b99ff3f3d5f19010505bbc22da0f`.

The TLS fixture started the actual isolated three-service graph and passed local
root-account scope, explicit remote-root refusal and synthetic account seeding.
It then failed at `docker cp` of the public CA certificate from `/data` tmpfs,
before the HTTPS client ran. This matches Docker's documented
[tmpfs copy limitation](https://docs.docker.com/reference/cli/docker/container/cp/#corner-cases).
All three exact CI fixture-removal events reported exit 0/no OOM; no additional
cleanup failure was reported. This does not resolve the separately retained local
database fixture whose cleanup was policy-blocked.

The correction reads only the fixed public `root.crt` path inside the inspected
edge's mounted namespace with a 16 KiB limit and one bounded observation deadline.
It validates one currently valid self-signed CA, verifies its signature, writes
only that public certificate and emits its fingerprint. Private keys, arbitrary
paths, insecure TLS and replacement containers are not used. Existing hostname,
session, forwarding, resource, workload and cleanup assertions are retained.
All 185 root native tests passed locally after this correction, including malformed,
oversized, expired/future, signature-corrupted and transient-read cases. The full
corrected CI/TLS workflow remains required; native checks do not prove this fix
has passed the actual HTTPS rehearsal. The final dependency audit was skipped
after the failed TLS step and must also complete on the corrected candidate.

## Remaining release conditions

Keep this candidate draft until its exact head passes the complete maintained
workflow and substantive receipts are reviewed. Merge normally against the pinned
head under Robert's existing consolidation authority, preserving source histories.
Do not bypass a red/pending check or treat queued checks as execution evidence.

The deployment stack still defaults to a shared schema migration/runtime user;
the opt-in verification path does not itself provision separate credentials.
Actual role isolation, approved host/DNS/public TLS, off-host backup/restore,
mailbox delivery, privacy/support identity and retention decisions, provider and
customer/operator acceptance, worldwide discovery and EUR 100/month operational
acceptance remain separate unfinished requirements.
