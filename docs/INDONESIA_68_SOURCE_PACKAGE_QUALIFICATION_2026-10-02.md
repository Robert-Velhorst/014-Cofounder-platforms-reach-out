# Indonesia 68-source package qualification — October 2, 2026

## Scope and exact packages

Fresh runtime built from the current dirty working tree, not GitHub main or a
published release. Base commit remains `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.
The [source increment](PLATFORM_INDONESIA_REVIEW_2026-10-02.md) adds one Indonesian
community directory without expanding admission, collection/contact permission or
integrations. All 116 original phases remain Partial; no completion claimed.

- Runtime: `sha256:92b0d2481ab62d421f63ce1f9bd52613b383ae7959555a5c62d840b123506216`
- Integration test: `sha256:2bfd069f61fd886993d1776c302bb128b9a994a8b0d25e10dd6b49bc51ad1978`
- MySQL: `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`
- Existing browser QA: `sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`

Runtime build passed typecheck, 1,009 packaged unit cases across 98 files without
skips (97.83 seconds), production compilation and offline production-dependency
packaging (546 reused, zero downloads). Packaged Node 22.23.3, UID 1000. Fresh
runtime/test compiled-migration parity: 117 files, 7,025,921 bytes, digest
`971efb52f0379e1690c4fe378c9a402e7c7c1ae1c3e4aab57c4caba43de9fded`.
Parity covers `dist` and `drizzle`, not a complete dependency/OS/SBOM comparison.
Selected runtime app-source/dev-tool paths are absent.

The full mandatory database suite passed 724 cases across 43 files without skips,
275.26 seconds (owned attachment elapsed 280.482 seconds), against the exact fresh
test package/MySQL IDs above. Migrations and integration tests ran with
`REQUIRE_DATABASE_TESTS=true`, no source mounts, no public ports/external network.

Compiled-server probes passed private invalid-configuration refusal, occupied-port
refusal without fallback, health HTTP 200 and clean SIGTERM exit. Those probes run
`dist/index.js`, not locked-migration cancellation through the default command.
The connected browser below does run the actual default `node dist/start-runtime.js`
and database-backed readiness; the subsequent default-command check below covers
locked-migration cancellation separately.

## Connected catalogue qualification

Frontend-testing guidance required actual interaction and screenshot inspection;
Browser plugin not available, so existing Playwright 1.62.1/Chromium 148.0.7778.0
were used without installing dependencies. Isolated URL `http://localhost:13216`;
desktop 1365×1000, mobile 375×812. Synthetic preverified owner, real HTTP password
login and MySQL; no live registration/inbox/provider acceptance.

| Check                            | Verified result                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity/nonblank/overlay        | `/outreach`, title `CoFounder Outreach`, actual workspace and 68 records from backend, no Vite error overlay                                                                  |
| Indonesian discovery             | `Indonesia`/`founderbro.id` locate exactly the community card; not connected; restrictions, eligibility and source evidence render                                            |
| Retained source regression       | Three French matching cards retain paid commitments, beta/legal-identity and school-gated warnings and evidence                                                               |
| Category/empty-state interaction | Indonesia excluded from dedicated category, included in community; 21 dedicated/24 community; unmatched query empty state; reset restores all 68                              |
| Links                            | Exact provider destination, new tab with `noopener noreferrer`; evidence opens locally and HTTPS links render without navigating externally                                   |
| Responsive/screenshots           | Desktop/mobile first workspace viewports plus source full-page captures; no document-wide horizontal overflow; four selected workspace/Indonesian captures visually inspected |
| Diagnostics/authority            | Zero console warnings/errors, page errors, failed HTTP responses, external requests, RPC mocks or real sends                                                                  |

All seven stages passed. French evidence still requires at least four links per
card; the new Indonesian record requires its actual one homepage containing the
embedded policies. No existing French check or timeout was removed/weakened.
Mobile disclosures remain lengthy and require scrolling; captures do not establish
full accessibility, keyboard or all-device acceptance. No UI styling changed here.

## Evidence

External directory:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/indonesia68-package-20261002-r1`.
Receipts: `runtime-build.log`, `integration-build.log`, `connected-browser.log`,
`probes.log`, `database.log`, helpers and screenshots. Runtime and test packages
were built with the repository Dockerfile using their respective targets; browser
runner received the exact runtime ID and the existing read-only local font mount.
No source/compiled application replacement mounts, public ports or external network.
QA font remains local, not redistributed. Temporary helpers/captures are outside
the repository.

Browser helper SHA-256:
`e049d5fd97949cb3e35cfe147959a556e46697df62d578c3dc6e581248eaad0e`.
Browser owner `0a1db2b5`; its three retained fixtures stopped exit 0/no OOM:

- QA `4a0ac4f8fe2e96867bcf661199ef2e6265f8bfae0342f6c8ff161b91d9cbb072`
- Runtime `875ca827d28999cbdce8c08d14c4ee742fa3eccace59200afae1eabeea176c34`
- Database `f13d7b53c91e727748b1ad6d00ae5f2ef523a80f54615668463979194bf34442`

Runtime/database non-root read-only fixtures have two CPU/2-GiB limits and 256 PIDs.
Compiled probes have two CPU/1-GiB limits, 128 PIDs and one read-only helper mount.
Database integration tests intentionally use a writable test layer/root for
operator permission tests; they are not the production-hardening model.

Final independent read-only inspection checked all eight exact retained IDs from
browser, parity/startup probes and database-suite terminal receipts: matching
owner-labelled names, expected image set, all stopped exit 0/no OOM/no public ports.
Receipt: `final-fixture-inspection.json`. No containers or user material deleted.
After documentation updates, all 170 operator cases passed without skips in
3,340.1896 ms (`operator.log`). Formatting, diff-whitespace and requirements checks
passed; all 116 phases remain Partial, with `completionProven:false`.
Probe owner `3f2015ea`; database-suite owner `136cce2a`. Two database-suite IDs:

- Test `39b8a456c6a42c78fe7870306941e0c66285ed6b9d6b521630b25d0025991282`
- Database `60dc477c7f879f699d704fa3a5db99079c3bd437ac69c2fe0eb62f5785814a4b`

## Subsequent broader journey and default-command qualification

The same exact runtime/MySQL IDs passed the retained 24-stage customer journey:
real HTTP password login, human-declared intake and duplicate refusal, Dutch
candidate corrections, assessment, original draft review/approval/manual
preparation, one synthetic manual-completion record, reminders and conversation
history, archive/restore/opt-out, progress notes, current-password private export,
owner/anonymous refusal, unsent revision/cancellation and CSV review/retry. One
lost response was injected only after a real committed import; unchanged retry
did not duplicate records. Oversized export was refused without partial download.
Zero RPC mocks, external requests/provider actions, real sends or unexpected
browser diagnostics; eight specific expected refusal diagnostics were retained.
Synthetic preverified accounts do not prove registration or inbox acceptance.

Existing Playwright/Chromium and the actual default startup command were used at
the isolated URL above. Desktop 1365×1000 and mobile 375×812 first viewports,
reminder captures and the mobile uncertain-import state were visually inspected
(five selected images, not every generated screenshot). No clipping/overlap was
observed in these samples; mobile translation disclosures still occupy much of
the first viewport and require scrolling. No styling change or all-device/full
accessibility acceptance is claimed. The helper changed only four expected
catalogue counts from 67 to 68; no earlier assertion or deadline was removed.

The maintained default-startup integration case passed without skips in
34,400.5725 ms (process elapsed 34,581.1046 ms). SIGTERM cancellation took 1,089 ms
and SIGINT 883 ms, within the unchanged combined 3,000-ms process-exit/database-
waiter-release deadline. The independent lock holder retained ownership, no DDL
was applied during cancellation, then normal default startup returned health and
readiness HTTP 200 and drained cleanly with exit 0. This is local synthetic proof,
not hosted deployment acceptance.

External evidence:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/indonesia68-whole-workflow-20261002-r1`.
Files: `browser-run.log`, `default-startup.log`, `final-fixture-inspection.json`,
helpers and screenshots. Browser helper SHA-256
`e3498cd6bc5b3a47ba0b8773160a23ea48e3f258cb41a1b733e31e37334c6d32`;
unchanged runner SHA-256
`992b84bc3cff3e0a231f6c498f77f80d1228c2efff6774c923418d51ba8414e1`.
Browser owner `d0af0281`, startup owner `34ce2a6b`. Independent read-only inspection
checked all eight new exact IDs against terminal receipts and owner labels: all
stopped exit 0/no OOM/no public ports, with the expected runtime/MySQL/QA image
set and non-root users. Browser app/database have no application mounts; QA has
the output helper and two read-only local fonts. Startup apps have no mounts;
the lock holder has one read-only probe mount. Nothing deleted or published.
After these documentation updates, all 170 operator cases passed without skips
in 3,225.6598 ms (`operator.log`). Formatting, diff-whitespace and requirements
checks passed; all 116 phases remain Partial and `completionProven:false`.

## Subsequent exact-image encrypted recovery

The maintained full-schema encrypted recovery case passed without skips in
106,328.8392 ms (process 106,410.0184 ms), using the runtime/integration/MySQL IDs
listed above. All 34 recovery-unit cases also passed without skips in
1,715.7333 ms. No recovery code, assertion, timeout or fixture data was changed
to obtain this result.

Authenticated encryption and the Windows PowerShell backup wrapper were exercised.
Columns/indexes/migration history, binary/Unicode values, view/procedure/trigger
and scheduled-event definitions were preserved; event execution remained off.
Tampered artifacts, wrong/same/nonempty targets, broad grants/delegation/active
roles, binary-logged restore targets, active schedulers and nontransactional
source tables were refused. Existing artifacts were not overwritten.

The restored compiled runtime passed real HTTP logins for two preverified
synthetic owners, owner-specific candidate retrieval, forged-account/anonymous
refusal and logout. Restored session/admin approvals and reset/verification links
were expired, with historical identities and already-expired timestamps retained.
Four restored pending mail jobs were discarded by the test-package worker with
zero provider attempts or quota reservations; terminal history was retained.
Worker proof is not live delivery or proof of a hosted production worker.

External evidence:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/indonesia68-recovery-20261002-r1`.
Receipts: `recovery.log`, `recovery-unit.log`, `helper-hashes.json` and
`final-fixture-inspection.json`. Test SHA-256
`4c79bfbba262194b9ad55cc805e334a6b03c323a67b8e1d121b75ccf32acf2de`;
CLI `85819a0dbcc9d9bdfe9936704355e7f4ac4c4f1aed80e21f28f6da69bb418034`;
application probe `fd403ff2e9f17bfac54d6c529f2808fd8749289207ed739d03f72ee2b46ce8f2`;
mail probe `87e0b566827f3d81a982c6978145c05af3a0cae7f9151ef4047e903a285246d8`.
Owner `c90ec0f3`; four exact retained fixtures independently inspected stopped
exit 0/no OOM/no public ports, matching expected image/user/owner identities:

- Runtime `76925df5159ebf3eddc89a6028fc0e7d9896ede6cf84edcaaab5c1ca728e7cdc`
- Source `17f44f5a9aeac452667d339cd7fd46eb56db9e86c9e4e63fb33788ec450a17fd`
- Target `267df41a0c700b47dffcb3c4b8a869df68a29aaab1ae8b8d12c38edb0851f91d`
- Binary-logged negative target `abee49eb54f9cc72aaa91e85ccb641507ef9b1c5d9d4455901500f4f54d9b875`

Databases use network-none/read-only/non-root/2CPU/2GiB/1GiB tmpfs; runtime uses
the isolated target loopback, read-only/non-root/2CPU/1GiB and one read-only HTTP
probe mount. No app source/dist replacement mounts. The fixture removed only its
own guarded temporary synthetic key/backup scratch; stopped containers retained.
No customer material deleted. These are small local fixtures, not production-sized
restore timing, independent key/off-host recovery or post-backup erasure,
suppression/password/address/verified-status/provider-budget reconciliation.
After recovery documentation updates, all 170 operator cases passed without
skips in 3,798.9161 ms (`operator.log` in the recovery evidence directory).
Formatting, diff-whitespace and requirements checks passed; all 116 phases remain
Partial, `completionProven:false`. No commit, publication, deployment or spending.

## Subsequent exact-runtime read/write load

The exact runtime/MySQL IDs above passed the unchanged closed-loop workload: 100
synthetic accounts, 100 private profiles and 10,000 manual candidates. Setup
bypasses registration, inbox verification and intake; all 100 real HTTP logins
still consumed one durable admission each. The fixed rules require all normal
read successes, successful p95 below 2,000 ms, only expected stale-edit conflicts
in normal writes, and overload responses limited to HTTP 200 or HTTP 503 with a
positive Retry-After. No threshold, timeout, resource limit or assertion relaxed.

| Tier                             | Responses                               | Successful p95 / p99   | Tier elapsed |
| -------------------------------- | --------------------------------------- | ---------------------- | ------------ |
| Reads, concurrency 5             | 6,000 HTTP 200                          | 78.69 / 108.91 ms      | 33.18 s      |
| Reads, concurrency 20            | 6,000 HTTP 200                          | 191.93 / 292.73 ms     | 26.24 s      |
| Reads, overload 100              | 619 HTTP 200; 5,381 controlled HTTP 503 | 1,037.82 / 1,700.73 ms | 7.53 s       |
| Workspace writes, concurrency 5  | 5,000 HTTP 200; 1,000 expected HTTP 409 | 110.34 / 179.03 ms     | 45.28 s      |
| Workspace writes, concurrency 20 | 5,000 HTTP 200; 1,000 expected HTTP 409 | 359.11 / 521.26 ms     | 42.92 s      |

All five tiers passed, 30,000 baseline requests, zero transport/correctness errors
and no automatic retries. Overload mostly refused work: this is **not** successful
100-user capacity. Reads sample identity/profile/candidate-list/details/runtime
status/catalogue. Each write tier committed 3,000 edit/archive/restore changes,
with 1,000 unchanged replays and 1,000 stale conflicts; independent database
connections verified all 10,000 rows and per-owner/action audit counts.

The 200 paired-edit races (100 different, 100 identical patches, 400 edit requests)
verified independent sockets and overlapping wire times: exactly 200 changes,
100 stale conflicts and 100 unchanged replays. Independent stored rows and each
winning request's owner/entity/action/outcome/metadata audit receipt matched.
Wire overlap is not a database barrier or proof of every possible schedule.
All 400 wrong-owner mutation attempts were refused; 10,000 candidate rows and
6,200 audit rows stayed unchanged. Earlier 600 warmup reads and 300 cross-owner
read refusals also passed. Health/readiness returned HTTP 200 after load.

Application: non-root/read-only, one CPU/512 MiB/320-MiB Node old-space, only two
read-only synthetic credential mounts, no application replacement mount. Database:
non-root/read-only, one CPU/2 GiB/1-GiB tmpfs, no host mounts. Peak charged cgroup
memory was 246,059,008 bytes for app and 761,303,040 for MySQL; all recorded memory
events were zero. These are local container measurements, not host sizing or
tax-inclusive budget proof. No public ports, external services or provider actions.

Evidence directory:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/indonesia68-load-20261002-r1`.
Receipts: `load.log`, `final-fixture-inspection.json`, `helper-hashes.json` and
`helper-tests-corrected.log`. Seventeen helper cases across three files passed
without skips in 1.09 s. Initial helper invocation used wrong `scripts/` paths and
found no tests (exit 1); retained in `helper-tests.log`, corrected to the actual
`server/` tests without code changes. The fresh esbuild bundle differs from the
preceding bundle only in generated source-path comments; runtime/assertions are
unchanged. Current helper SHA-256
`0f6da811b6ea6c8eddd55a0a5e83ac507887e7cdf7827d1eebe2cc2e693d1493`;
unchanged runner `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.

Owner `b45e8ad9`; independent inspection of three exact retained fixtures checked
image/owner/user identities, stopped exit 0/no OOM/no public ports:

- Runner `a8306462faba908c592922042c789fc44a2b708eddce33fa31681f655785f98d`
- App `d821d4d500dcc0e3b86396a898849932580b806606cb48c626e24e05c9c8e248`
- Database `2e6c38d0a01daac96500ac54e0d8427107b0b288d70c061a0149fdb6600c68de`

No material deleted; synthetic credential fixture files remain private local QA
outputs and are not published or listed by value. This workload does not cover
open-loop arrivals, longer soak, all routes/UI/assets/workers, simultaneous large
exports, fairness across instances, hosted TLS, realistic network latency or cost.
After these documentation updates, all 170 operator cases passed without skips
in 3,464.9636 ms (`operator.log` in the load evidence directory). Formatting,
diff-whitespace and requirements checks passed. All 116 phases remain Partial,
`completionProven:false`; no commit, publication, deployment or spending.

## Remaining acceptance

Subsequent [scheduled-arrival test](SYNTHETIC_SCHEDULED_ARRIVALS_2026-10-02.md)
against this same runtime failed its 150/s all-success gate with 65 busy refusals.
The preceding closed-loop load pass remains valid only for its narrower workload;
no overall capacity acceptance is inferred. Developer-only scheduler/source tests
passed 1,019 units; this is not a rebuilt runtime or a passing load gate.

The preceding [candidate-language package](CANDIDATE_WORKSPACE_LANGUAGE_2026-10-02.md)
retains its own broader customer journey, encrypted recovery, startup-cancellation
and load receipts. They are not automatically transferred to these new IDs.
Whole-product/open-loop/longer-soak/hosted load, all retained
surfaces, live inbox/provider rights, customer/operator acceptance, hosting/TLS/
alerting, remote recovery, privacy/licensing decisions, enforced tax-inclusive
EUR 100/month costs and worldwide completeness remain unproven. No GitHub commit,
push, merge, publication, deployment, provider action or spending occurred.
