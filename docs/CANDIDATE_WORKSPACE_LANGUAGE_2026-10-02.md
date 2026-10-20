# Candidate-list Dutch/English qualification — October 2, 2026

## Delivered change

The actual candidate list now has authored Dutch/English headings, search and
status/order controls, table headings, row actions, archived badges, empty/error/
loading messages and pagination. The saved-search-defaults button is translated
too. Original names, titles and source/consent codes are not translated or rewritten.
The empty-list instruction now mentions both supported intake paths: adding an
individual candidate and importing permitted CSV.

Copy is selected during render from the existing language context. No locale-driven
effect, remount, new storage key, translation service or dependency was added.
Search/status/order/page state, query inputs, owner binding, action callbacks and
disabled conditions are unchanged. The candidate region declares its selected
language; the mixed route keeps its existing English wrapper. Unchanged protocol
codes and server-error text declare English. The scope banner still explicitly
discloses incomplete translation; this is not a fully Dutch application.

Frontend-testing and React guidance shaped the real interaction checks and the
decision to derive copy without resetting state. The Browser plugin is unavailable;
existing Playwright and Chromium were used without installing a browser/plugin.
The JSON-locale synchronization skill does not apply to this paired TypeScript copy.

## Source and artifact

This is uncommitted local work on `agent/public-saas-beta`, based on
`89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`, preserving the existing dirty tree.
No commit, push, merge, publication, deployment, provider action or spending.

Fresh runtime image, independently inspected and used by both successful runs:
`sha256:e65cbdab07d9c152643093645683d6eb062d4c00d7079711dfcac4c6accec1bd`.
MySQL image:
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.
Existing QA image, used for browser/database libraries only:
`sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`.

The runtime uses its actual default `node dist/start-runtime.js` command as UID 1000. No application, compiled-frontend or compiled-backend replacement mounts.
Fixtures have no public ports and no external network. Each container is
read-only, capability-dropped, no-new-privileges, limited to two CPUs/2 GiB and
256 processes. MySQL uses temporary storage; no actual customer data is present.
The browser has an output/helper mount and two read-only local-font mounts,
unchanged from the preceding isolated QA setup; fonts were not redistributed.

## Verification completed

- Final image build: typecheck, **1,004 unit cases / 98 files**, no skips, production
  compilation and offline production-dependency packaging passed. Unit execution
  was 126.04 seconds. Deliberate unit failure fixtures emit expected diagnostics;
  this is distinct from the zero unexpected diagnostics in connected browser QA.
- Focused language regression: **36 cases / six files**, no skips, 3.70 seconds.
  Covers copy-key parity, original names, page/count boundaries, missing totals,
  literal-search/sort/quarantine disclosures and the truthful scope banner.
- Operator/source checks: **170 cases**, no skips, 5,786.2721 milliseconds before
  final documentation updates; final documentation/source rerun also passed all
  170 cases without skips in 5,666.854 milliseconds. Formatting, diff-whitespace
  and requirements checks passed; all 116 phases remain Partial.
- Final connected run: **seven stages passed**, using real password login, HTTP
  queries and MySQL, **zero RPC mocks**, Chromium **148.0.7778.0**, Playwright
  **1.62.1**, desktop **1365×1000** and mobile **375×812**.

| Check                            | Actual observation                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity/nonblank/overlay        | `/outreach`, title `CoFounder Outreach`, populated account-bound list; no framework overlay                                                                                       |
| Dutch controls and original data | Translated region/labels; original Unicode titles, names and `unknown` codes retained; foreign marker absent                                                                      |
| State preservation               | All-status, name-A–Z, `Synthetic Candidate` search and page 2 retained through Dutch → English → Dutch; identical five row names                                                  |
| Literal search and empty result  | `%_` matched only the literal record, not all candidates; Dutch no-match message; filter changes reset page as before                                                             |
| Opt-out boundary                 | Three archived `opted_out` rows; all qualification buttons disabled                                                                                                               |
| Responsive/keyboard              | No document-wide horizontal overflow; search/order keyboard focus worked; candidate title not covered by sticky header                                                            |
| Mobile row actions               | The table actually scrolled sideways; Dutch details button fit inside the viewport; opening/closing the real details dialog retained status/order/page                            |
| Diagnostics and data             | No console warnings/errors, failed HTTP responses, external requests or unexpected mutation requests; all 60 original candidate rows remained byte-equivalent in the SQL snapshot |

Two synthetic owners were created, with 59 owned candidates (56 active, three
archived) and one foreign candidate. These are fixtures, not permitted real-world
intake, email-verification/inbox proof or actual customer acceptance. Login itself
has durable effects; the unchanged SQL assertion applies to candidate rows, not
to the entire database. No message was sent and no contact action was performed.

All seven final screenshots were inspected: desktop/mobile first viewports,
Dutch filters, Dutch pagination and the horizontally scrolled mobile actions.
The table scrolls horizontally on mobile; it is not an all-columns-at-once layout.
First-view disclosures remain lengthy on mobile, but no overlapping, broken or
blank interface was found in these captures. This is not an accessibility certification.

## Failed attempts retained and corrected

The initial source build/focused run failed two existing banner-disclosure
assertions. Restored the exact original-download disclosure in the source and
added new candidate-list/code-scope assertions; did not remove existing checks.
Two earlier browser attempts failed incorrect QA assumptions: document-wide
English instead of the actual route-level wrapper, and a generic font-class
selector that also matched badges/buttons. The corrected runner checks both
language layers and only the first-cell name element; expected rows and counts
remain unchanged. A final source pass also gave the translated defaults button
and unchanged codes explicit content-language attributes, then rebuilt the image.

The final image first passed six stages, then a fresh seven-stage run additionally
proved mobile horizontal action access and details-dialog open/close. Earlier
browser failure/success logs and fixtures remain available; no failed receipt was
erased. The first failed source build is recorded in the chat's tool transcript,
not a complete external build log.

## Structural inventory

Reviewed previous versus fresh inventories before regeneration. API handler
digests, boundaries, policy decisions and totals are identical: 165 operations,
58 admitted/107 denied, 54 reachable references, zero unknown hooks. Client
reference positions changed. UI action/event/navigation/disabled/spread shapes
remain identical: 230 action elements, 206 events, 26 navigation elements and
five spreads. The new copy module brings UI inputs to 151 and API inputs to 154.
These are scanner inventories, not exhaustive semantic execution proof.

UI input digest:
`c61f56b9978a551ec04dc1d26a7b0720982d926a2de56acf5108f2eacf82d3e8`.
API input digest:
`50e5058d2dcdd8432cdf3b4dd4a6ccde96d56d7e3af3c2ea1c8dcb4f1f20e523`.

## Evidence and terminal state

External evidence is under
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/candidate-workspace-language-20261002-r1`
through `candidate-workspace-language-20261002-r4`. Final build/focused/operator/
inventory-review receipts are in `r3`; final seven-stage `result.json`,
`connected-browser.log`, helper and screenshots are in `r4`.
Final browser-helper SHA-256:
`26dc6f56203968d8872e1f52882f89bedae59d503d747b702a1a83501f81c95c`.
Unchanged owned-fixture runner SHA-256:
`992b84bc3cff3e0a231f6c498f77f80d1228c2efff6774c923418d51ba8414e1`.

Final owner label `15629ec4`; independently inspected final container IDs:

- Browser `8e6f2b80ac48bd791de73be6af89c31ebe2e847156f81e7b09216bfae1a00ce5`
- Runtime `623edd2016f4d12cf2f432fbf91ab5df3fd649a5adf3c4fb176e0056a00712d6`
- Database `4d1128b95cd6a8f20a92a75d3520f0d611028e3210a08e0aac4dc6671ce07f1e`

All final containers are retained stopped, exit 0, no OOM, no public ports.
The preceding successful six-stage run's three containers independently had
the same terminal result. Failed QA containers exited 1; their owned app/database
fixtures stopped successfully. No user material or retained container was deleted.
The final read-only `inspect-fixtures.mjs` independently checked all 12 IDs across
the four browser attempts: exact ownership, expected exits, no running/OOM/public
ports and runtime/default-command/mount constraints. Its generated receipt is
`r4/final-fixture-inspection.json`.

## Subsequent exact-package broader qualification

The unchanged runtime `sha256:e65cbdab07d9c152643093645683d6eb062d4c00d7079711dfcac4c6accec1bd`
subsequently passed the broader connected journey and fresh database/startup
qualification on October 2. No application source, dependencies, permissions or
production behavior changed during this qualification.

Fresh integration-test image:
`sha256:426c657b6d9cbb1008f5fd83e0f780be2e336d267c10ce52d708c7d12ed081b2`.
MySQL and QA images are the exact IDs above. Packaged Node is 22.23.3, runtime UID
1000; the database-test container intentionally has a writable test layer and root
for operator permission tests, not production hardening.

| Gate                      | Verified result                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mandatory database suite  | 724 cases / 43 files, no skips, 355.46 seconds; both owned fixtures stopped exit 0                                                                                                                                       |
| Compiled/migration parity | 117 files, 7,020,698 bytes; identical digest `d257b6128b1266e6fa537c096f568985df5fd01926bfc2136ea7b4777de8af0e`; not full dependency/SBOM parity                                                                         |
| Compiled server probes    | Private invalid configuration refusal; occupied owned port refused without fallback; health 200 and clean signal shutdown                                                                                                |
| Actual default startup    | SIGTERM/SIGINT cancel blocked migrations in 654/632 ms within the unchanged combined 3,000 ms deadline; no DDL, holder lock retained, waiter released; subsequent migration/startup health/readiness 200 and clean drain |
| Broader connected journey | Three fresh full runs, each 24 stages; actual password login, HTTP, MySQL, desktop/mobile, no RPC mocks                                                                                                                  |
| Import uncertainty        | One deliberately lost response after real commit; unchanged CSV/body/idempotency key/declaration retried without duplicate rows                                                                                          |
| Diagnostics and authority | Eight specifically expected refusal/fault diagnostics; zero unexpected diagnostics, external requests, provider actions or real sends; one synthetic manual completion record                                            |
| Terminal inspection       | 19 exact owned containers independently inspected: all stopped exit 0, no OOM or public ports; no retained material deleted                                                                                              |

The journey additionally covers the 67-record discovery catalogue, human-declared
intake and corrections, local assessment, original message review/approval/manual
preparation, reminders and owner isolation, response/history/closure, archive/
restore/opt-out, owner-reported progress, fresh-password private export with actual
download, revision cancellation, Dutch CSV declarations, explicit review before
editing a rejected import and a greater-than-20-MiB export refusal without partial
download. Synthetic preverified accounts do not prove registration or actual inbox
verification. A manual completion receipt is not provider delivery proof.

Frontend-testing guidance prompted visual follow-up despite passing behavioral
checks: the first reminder element capture was cropped under the sticky header.
The second full run captured the page below that header; review then found its
desktop-named reminder retained the mobile viewport. The third full run explicitly
asserted 1365×1000 desktop and 375×812 mobile widths and passed all original stages
again. Final reminder desktop/mobile and uncertain-import mobile captures were
visually inspected, alongside selected earlier captures; not every generated image
was inspected. Only QA captures changed, not application styling or test deadlines.

Evidence directories:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/candidate-language-whole-workflow-20261002-r1`
through `candidate-language-whole-workflow-20261002-r3`. The first contains fresh
`integration-build.log`, `database.log`, `probes.log`, `default-startup.log` and
`final-fixture-inspection.json`; each contains `connected-browser.log` and captures.
Final browser-helper SHA-256:
`c39967c3ed760d64b490384351011de84469187324fb8968322ad30a69ca7b8f`.
After the qualification/documentation update, formatting, diff-whitespace and
requirements checks passed; all 170 operator cases passed without skips in
5,496.8525 ms (`r1/operator.log`). All 116 phases still remain Partial and
`completionProven` remains false.
Owned-fixture runner is unchanged at the SHA-256 recorded above. Final browser
owner is `6f1d9ddf`; its independently inspected IDs are:

- Browser `43692e4cd8bac560e32cd153aee325f5a6ba467f51eafb5c36c2cb6f143304ff`
- Runtime `75fb875a19e63202c060df924183fb6386a931d478181bb9fb577a985503b271`
- Database `e26a2cabcfe30ca3ac3cdc38c5b943d79ff109edb21fa1f6e128c81936a7f49d`

## Subsequent exact-package encrypted recovery

The unchanged maintained `scripts/database-recovery.integration.test.mjs` passed
against the exact runtime/test/MySQL image IDs above: one full case, no skips,
73,805.8162 ms total (73,711.5899 ms test body). The recovery-tool unit suite passed
34 cases, no skips, 2,141.6775 ms. These local test durations are not a promised
operational recovery time or recovery-point objective.

Deployment-readiness guidance kept the evidence bound to exact installed images,
separate synthetic targets, readiness and explicit production/reconciliation
limits. No application or recovery-tool code changed during this qualification.

The synthetic source was migrated using the current test package; authenticated
AES-256-GCM backup was restored to a separately owned empty database using confined
database-only grants. The actual Windows encrypted-backup wrapper also ran and its
artifact verified. Backup refused nontransactional tables and replacement of an
existing artifact. Restore refused tampering, wrong target identity, source as
target, nonempty target, binary logging, enabled event scheduling, server-wide
privileges, grant delegation and active roles before unsafe import.

| Requirement         | Actual result and proof boundary                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema/data         | Migration journal, columns and indexes matched; synthetic binary/Unicode values preserved                                                                                                                              |
| Database objects    | One view, procedure, trigger and scheduled-event definition retained; view/procedure reads and trigger insertion behavior checked                                                                                      |
| Scheduled execution | Scheduler remained off; event never inserted its sentinel; not live scheduler acceptance                                                                                                                               |
| Restored authority  | Historical session rows retained but expired and step-up authority cleared; reset/verification links expired and refused through actual compiled HTTP routes                                                           |
| Application         | Current runtime started against restored database; two synthetic owners logged in, saw only their own candidate, received forged-owner refusals and logged out                                                         |
| Mail                | Four restored pending jobs expired/discarded; original terminal history retained; zero provider attempts or new delivery-budget reservations; guarded worker observation used test-package source, not a live provider |

Receipts:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/candidate-language-recovery-20261002-r1/recovery.log`,
`recovery-unit.log` and `final-fixture-inspection.json` in that directory.
Executed `node --test scripts/database-recovery.integration.test.mjs` with
`RECOVERY_TEST_RUNTIME_IMAGE`, `RECOVERY_TEST_APP_IMAGE` and
`RECOVERY_TEST_DATABASE_IMAGE` set to the exact IDs above; separately executed
`node --test scripts/database-recovery.test.mjs`. No image pull or deployment.

Source SHA-256 values independently rechecked before execution:

- Integration fixture: `4c79bfbba262194b9ad55cc805e334a6b03c323a67b8e1d121b75ccf32acf2de`
- Recovery tool: `85819a0dbcc9d9bdfe9936704355e7f4ac4c4f1aed80e21f28f6da69bb418034`
- Application probe: `fd403ff2e9f17bfac54d6c529f2808fd8749289207ed739d03f72ee2b46ce8f2`
- Mail probe: `87e0b566827f3d81a982c6978145c05af3a0cae7f9151ef4047e903a285246d8`

Owner `cf481f6b`; independently inspected retained IDs:

- Runtime `9f53cab0892f1b36607f1f3c8edcb5503c9543aea245d67925831b3e5a9c9b1d`
- Source `3f46bbcfc5b183a8eca4cc81a5451300ca3f4fb03cf40b8836330997cdcd0264`
- Target `dbbca026577f245e15b954199967ca7317125c05f52d42752ae4be32374cc20e`
- Unsafe binary-log target `3dd2bfe59e89de085d1a33d4adf927662ed05e8bec1939beea02d772925f434e`

All four stopped exit 0/no OOM/no public ports with exact owner/image checks.
Runtime UID 1000, databases UID 999, read-only roots and no external network; no
database host mounts, one read-only runtime observation-helper mount. The fixture
removed only its own canonical, non-junction temporary scratch directory after
validating its exact resolved parent/prefix; retained containers were not deleted.
No user/customer data or live provider was involved.

After recording recovery results, all 170 operator cases passed without skips in
6,990.993 ms (`candidate-language-recovery-20261002-r1/operator.log`). Formatting,
diff-whitespace and requirements checks passed; all 116 phases remain Partial,
with `completionProven:false`. No commit, push, merge, publication or spending.

Remote encrypted storage, independent key custody, production-sized restore,
actual operator rehearsal, approved host promotion and reconciliation of
post-snapshot deletion/consent/provider actions remain unproven. A synthetic
restore is not permission to restore real personal data or revive rights/consent
that changed after the snapshot. The subsequent load section below records the
separate current-image qualification, not evidence derived from this restore.

## Subsequent exact-package read/write load

The unchanged runtime above subsequently passed the maintained synthetic
read/write baseline on October 2: 100 directly seeded preverified accounts,
100 private profiles, 10,000 manual candidates, 100 real HTTP logins consuming
exactly 100 durable global admissions, 600 warmup requests and 300 wrong-owner
read refusals. Fixture setup bypasses registration, inbox verification and real
intake permission; no provider was called.

Predefined rules stayed unchanged: normal read/write successful-response p95
below 2,000 ms; only expected stale-edit conflicts in write tiers; overload may
return bounded 503 with a positive integer Retry-After. No automatic retries,
capacity increase or application source/dependency changes.

| Tier                  | Requests/results                        | Successful p95 / p99   | Elapsed |
| --------------------- | --------------------------------------- | ---------------------- | ------- |
| Read, concurrency 5   | 6,000 HTTP 200                          | 80 / 118.56 ms         | 34.92 s |
| Read, concurrency 20  | 6,000 HTTP 200                          | 284.53 / 458.37 ms     | 34.84 s |
| Read, overload 100    | 861 HTTP 200; 5,139 controlled HTTP 503 | 1,925.16 / 3,141.39 ms | 10.35 s |
| Write, concurrency 5  | 5,000 HTTP 200; 1,000 expected HTTP 409 | 102.47 / 158.80 ms     | 42.99 s |
| Write, concurrency 20 | 5,000 HTTP 200; 1,000 expected HTTP 409 | 346.50 / 503.82 ms     | 41.30 s |

All five tiers passed their predefined rules: zero transport/correctness errors
and no invalid overload retry headers. Overload is orderly rejection, not support
for 100 simultaneous successful operations; some successful operation-specific
overload p95 values exceeded two seconds. Full per-operation/all-response metrics
are retained in the log, not replaced by aggregate values.

Each write tier had 3,000 committed changes, 1,000 unchanged replays and 1,000 stale
conflicts across review/edit/replay/conflict/archive/restore. A new independent
database connection checked all 10,000 original rows and per-owner/action audit
counts after each tier. Those count checks alone do not prove each audit's causal
identity; the following separate race check does verify winning-request receipts.

The paired-edit check passed 100 different-patch and 100 identical-patch races,
400 actual edit requests, 200 changes, 100 stale conflicts and 100 unchanged
replays. Separate TCP sockets and overlapping request-on-wire intervals were
asserted, not a database execution barrier or universal exactly-once guarantee.
Independent persisted-row review and all 200 winning request IDs matched one
owner/entity/action/success/field-metadata audit receipt each. Subsequently 400
wrong-owner mutations were refused; all 10,000 candidate rows and 6,200 audit
rows stayed identical to the immediate pre-refusal snapshot.

Application envelope: one CPU, 512 MiB memory/swap, 320 MiB Node old-space,
UID 1000, read-only root, capability removal, no-new-privileges, 256 PIDs. Actual
default startup command; only two read-only synthetic secret mounts, zero
application replacement mounts. Database: one CPU, 2 GiB memory/swap, UID 999,
1 GiB temporary database storage, no host mounts. Runner: separate one-CPU/512-MiB
container with one read-only helper and two synthetic secret mounts. All join
the network-disabled database's loopback namespace; no published ports.

Peak cgroup memory: app 244,162,560 bytes; database 761,430,016 bytes. All observed
low/high/max/OOM/OOM-kill counters zero. Post-load health/readiness both HTTP 200.
These are local fixture observations, not production database sizing or an SLO.

Evidence directory:
`C:/Users/NO/Documents/Codex/2026-07-26/01/outputs/candidate-language-load-20261002-r1`.
Receipts: `load.log`, `helper-tests.log`, `final-fixture-inspection.json`.
The copied external bundle was independently rebuilt from current maintained
source with existing esbuild and matched byte-for-byte by SHA-256:
`c012c1bcf4a1d2dfb826c226ee7bde9b8e3ce13253e15b789243974b1cc9de64`.
The initial app-directory comparison differed only in generated source-path
comments; the subsequent root-directory build gave the exact same digest.
Unchanged owned runner SHA-256:
`3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
Executed `node runner.mjs` with `QUALIFICATION_RUNTIME_IMAGE` set to the exact
runtime above. Three helper suites passed 17 unit cases, no skips, 2.32 seconds.
No new dependencies or provider credentials. Secret contents were not logged.

Owner `a3f9c231`; independently inspected retained IDs:

- Database `4ded354d7391b3d8b6dab20d57d95cf977a71a1ec8ac6540ca410bfac8808781`
- Application `838c0d0250fa772ae29f5de5ed61bb47cb1b45663d217ae39712abc247bbaed7`
- Runner `45be3d70d13417f698887baef2a835d4c93adb84fe3cac9b937688095b69dd98`

All three stopped exit 0/no OOM/no public ports, with exact owner/image checks;
none deleted. After the documentation update, all 170 operator cases passed
without skips in 3,383.8237 ms (`operator.log` in the load evidence directory).
Formatting, diff-whitespace and requirements checks passed; all 116 phases remain
Partial and `completionProven:false`. No GitHub commit/push/merge/publication,
deployment or spending. Deployment-readiness guidance kept resource limits and acceptance
distinct from hosted capacity. This closed-loop workload does not qualify open-loop
arrival rates, extended soak/fairness, UI/static assets, every retained API/worker,
simultaneous registration/intake/export/deletion/mail workloads, multi-instance
behavior, live hosting/TLS/provider delivery or the EUR 100/month operating budget.

## Limits and next acceptance

The earlier [67-source package](FRANCE_67_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md)
retains its own 724-case database, 24-stage workflow, recovery and load receipts.
They are **not fresh acceptance of this new runtime image**. The subsequent checks
above now qualify its mandatory database suite, broader customer journey and
startup/cancellation probes. The subsequent recovery section now qualifies bounded
local encrypted recovery on this exact artifact. The subsequent read/write load
section now qualifies its bounded closed-loop baseline and paired-edit races;
whole-product mixed/open-loop/soak and actual hosted capacity remain open, as does
remote/operator recovery.
Retry/loading copy is implemented and unit-covered, but connected failure/loading
injection was not performed here. Saved-defaults application, every status/sort
combination, other browsers/devices and all retained UI/API/worker paths are not
exhaustively qualified by this seven-stage flow.

Worldwide discovery completeness, live provider permissions/inbox, real customer/
operator acceptance, privacy/licensing decisions, actual hosting/TLS/alerts,
off-host recovery and enforced tax-inclusive operating costs remain open. The
EUR 100/month ceiling is planning only, not permission to spend. All 116 original
phases remain Partial; no complete or production-ready release is claimed.
