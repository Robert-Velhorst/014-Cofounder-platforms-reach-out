# Current 63-source package qualification — October 2, 2026

This is local release-preparation evidence, not deployment approval. The new
images include the Dutch CSV import/export interface and the Communitech catalogue
increment. Earlier package receipts predate these changes and remain historical.
All 116 original phases remain Partial; the full public-beta goal is not complete.

## Exact installed artifacts

Resolved with local image inspection after both builds completed successfully:

- Production runtime: `sha256:cf290a753e0d6d10f2fa658a5da3ecbdb760aa3d938226a666197994b8414334`,
  223,495,473 bytes; user `node`, default command `node dist/start-runtime.js`.
- Integration-test image: `sha256:af27f7a9c3590c7e1a5069dc618755ad89da7ba248c6e8d210b4e7fe099dc0cb`,
  280,760,243 bytes; unset user/default root, test command
  `sh -c pnpm db:migrate && pnpm test:integration`. This is not a production image.
- MySQL fixture image: `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`.

Image IDs are the installed Docker `.Id`, not the build's differently scoped
config digest. New local tags are `cofounder-csv63-runtime:20261002-r1` and
`cofounder-csv63-test:20261002-r1`; no earlier tag was replaced or pushed.
Both images use the existing pinned Node base and locked dependencies, Node
22.23.3. The first network-disabled runtime build failed because Corepack's required
pnpm download was not cached. The normal locked-dependency build succeeded; this
is not a claim of cold-cache offline reproducibility. No dependencies upgraded.

## Build and package evidence

The runtime build's configured typecheck/unit/build/production-dependency chain
completed successfully. The declared unit suite passed **965 tests in 94 files**,
no failures or skips, in 117.49 seconds. Database-dependent files are intentionally
in the separate integration command; this count is not every requirement or test
in the repository. Vite completed in 4.64 seconds for runtime and 4.01 for test.

Three bounded, read-only, nonroot package probes used network-disabled containers
and one external observation-helper mount each, never replacement application
code. Both packages contain identical **116 dist/migration files**, 6,973,038 bytes,
digest `f6cfbe63f12b30360cad9352eec653f9fadc3feba839df97b61785f9743b7a4b`.
The runtime lacks application source, `.env` and the checked development tools.
Direct compiled-server probes passed private invalid-configuration failure,
occupied-port refusal without fallback, real liveness and clean signal exit.
These do not replace the default migration/server startup check below.

Probe containers independently inspected stopped with exit 0, no OOM and no ports:

- Runtime artifact probe `4f61478f009a7cb98e4b9fa9161fafbca8ee40ebf1d7d6ae7e7f386a79618183`.
- Test artifact probe `b8ee210efb33c5925ee1f70367c62b29e0e6454123cd108ff86d0415873001d2`.
- Compiled startup probe `e807e291e6b8e682c925612398de8015da201c2f24b6bab806c4d4adca2505dc`.

## Actual default-command regression

The repository's runtime-startup integration test passed one case without skips in
59,877.6632 milliseconds. A separate connection held the actual MySQL migration
advisory lock while another observer verified waiting/zero tables/another owner.
SIGTERM and SIGINT each cancelled the default runtime without DDL, server launch
or remaining waiter. After releasing the lock, a fresh default-command runtime
applied migrations, served actual health/readiness 200 and drained with child and
parent completion acknowledgments. Application containers had zero mounts and
no public ports; the holder used only the read-only observer helper.

All five exact owned fixtures independently inspected stopped 0/no OOM/no ports:

- TERM runtime `371e8e604ec5957dad86a97fa816f0ff29317d75936d456d1a98b7975ea6a31f`.
- INT runtime `9a99420e805d0da63db40212f035ec00399c6155732d4bf955b1dcd4968c33db`.
- Normal runtime `ec8208afd504a5b168957a263da2d440f9e430baa673b95505af03f78274762e`.
- Holder `e63b400b36737d6e2704a61649d6e8360af2ff3ecbbf75c6ced247ea66627cc3`.
- Database `4c1babae506c3ab5f567d9c102a3ac3b0c7a8ee4b953855673ec121c8fac3b8b`.

## Mandatory database acceptance

The new exact test image applied migrations and passed **724 tests in 43 files**,
no failures or skips, in 371.86 seconds (378.082 seconds including command startup).
The fresh MySQL database and test container had no mounts or public ports; the
test ran its own packaged sources/tests, not replacement host source. Cases cover
account/session/login/verification/recovery, ownership fences, shared admission,
candidate intake/import/export/query, review/edit/conversation/preset workflows
and migration/production-secret behavior. Passing these cases is not proof of
every endpoint, business requirement, external provider or hosted path.

Both fixtures independently inspected stopped 0/no OOM/no mounts/no ports:

- Test `b7034dccd47f9ea98eb4407425b50b49e62829160a42b9b64fb0df13642da181`.
- Database `6235008e52b891d4bcc1f19f49198d02e136f59b4d9ebef1e3e093006fb4e9e4`.

## Encrypted restore and restored-application rehearsal

The repository recovery integration test passed one case without skips in
38,723.7098 milliseconds using the exact new test/runtime images. It exercised
full-schema encrypted backup, authenticated-ciphertext refusal, binary/UTF-8
preservation, source-data preservation, empty isolated target/restricted-grant
checks and refusal to overwrite populated/source targets. The restored runtime
passed actual synthetic login for two owners, two owner-scoped candidates and old
session revocation, with zero provider actions. Its one read-only observation
helper mount was not application replacement; no public ports or real data used.

The three exact owned fixtures independently inspected stopped 0/no OOM/no ports:

- Restored app `d477513bb693d24c8f2842926609fad37fd7eee508068ded88732ca608507242`.
- Source `dbc3bf9b9bbf5991efbab724882d4057f9ff773b91c2682b35dba909a1083bd4`.
- Target `627223a645bf89ee2f02ccd1ec529d4546f40b1613569cfba6f9d3a82a5e0538`.

Source/target had zero mounts. The rehearsal removed only its own temporary
test backup/key directory; no user data, existing backup, image or container was
deleted. Off-host backup, independent key custody and actual operator recovery
remain separate production requirements; this local rehearsal does not close them.

## Subsequent exact-image browser qualification

The current exact runtime above subsequently passed 24 connected browser stages,
using its default migration/server command and zero application/source/compiled
replacement mounts. QA used the already-installed isolated Playwright image
`sha256:69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326`;
the Browser plugin and its required skill are absent. No new dependencies installed.
Frontend-testing guidance required real rendered interactions, console checks and
desktop/mobile screenshot inspection, not only build success.

Flow: `/login` -> actual synthetic login -> `/outreach` -> Find platforms ->
Communitech alias/region search and restrictions -> permitted unsent CSV language
switch/download -> committed-response loss -> exact retry -> original receipt.
No RPC responses mocked. One deliberate fault fetched the actual committed server
response then aborted its browser delivery; unchanged payload/key retry recovered
the receipt with one stored candidate. Communitech CSV import returned 403 and
stored zero candidates; explicit record-review confirmation was needed to unlock
editing, then editing cleared the rights declaration and disabled submit.

Catalogue checks found 63 headings, canonical Communitech aliases/region and its
Ontario/12-month eligibility, sold-out free-entry and private-Slack consent limits.
Dedicated-category filtering showed no match for Communitech; held Startup Canada
showed no source or link. Other regional aliases remained tested. Source evidence
and non-integration explanations remained visible; no external provider link opened.
The Dutch CSV interface preserved exact unsent CSV/evidence/declaration through
English/Dutch switching. Actual candidate CSV download excluded foreign-owner and
unsaved-preview records; completion copy changed with language. JSON account export,
oversize refusal without partial download, account fences, intake/duplicate/edit,
draft review/manual preparation, synthetic completion, reminders, response/close,
opt-out, retained history and unsent revision cancellation also passed.

| Rendered check | Result |
| --- | --- |
| Page identity | `/outreach`, CoFounder Outreach title |
| Not blank | Real catalogue, candidate and form content |
| Framework overlay | No Vite error overlay |
| Console health | Zero unexpected errors; eight expected refusal/fault diagnostics |
| Screenshots | Current catalogue and CSV desktop/mobile captures inspected |
| Interaction | Real HTTP/database state changes/refusals; 24 stages passed |

Environment: internal `http://localhost:13216`, Chromium 148.0.7778.0,
desktop 1365x1000 and mobile 375x812; catalogue/tablet 768x1024 and login at
375/768/1440 widths. No claim of all tablet/browser/accessibility coverage. Inspected
screens show readable wrapped text and no horizontal overflow; mobile cost and
submit controls require vertical scrolling. Other workspace/server copy remains
partly English. Accounts were directly seeded preverified synthetic fixtures;
this does not test public signup or inbox verification. Eight expected diagnostics,
zero unexpected errors, zero outside-origin requests/provider actions, zero real
sends; one synthetic manual-completion record is not delivery proof.

All three owned fixtures independently inspected stopped 0/no OOM/no public ports:

- Browser `d6a5f98c8fddb7313c3f4a7b793d69a006daab143a9d3fc01956c80fbe20c5b6`.
- Runtime `b763f4191e0688d45226147503dbd7042d29fed2169c348cc3d1e31095bc593b`.
- Database `efd9c4cfb2d9e5abf642f1dc29a6535c01f2e08cd116af40e2cdca19f156a2d3`.

Runtime/database mounts: zero. Browser mounted only its external driver/output
folder. No fixtures deleted. External evidence directory:
`outputs/csv63-browser-20261002-r1/` (catalogue-desktop/mobile/tablet.png,
csv-import-dutch-desktop/mobile.png, import-uncertain-desktop/mobile.png and raw log).
Driver SHA256 `ff49c1463b4f67d2f0f0af4d58ef716f33b254f2326b3e3ec6e5eee3fdc320b4`;
runner `cb576911df7f896b40e7df0fd0cd21e6e05b8bb8145decc68a54f16b5cf82c39`.
Selected host inventory still matched the pre-build 552-file digest, without
promoting that comparison to causal provenance or release approval.
After recording the browser results, all 168 host operator/audit cases passed
again without skips in 4103.6002 milliseconds; whitespace checks passed. No
application source was changed in this browser qualification turn.

## Subsequent exact-image bounded load qualification

The exact runtime `cf290a753e0d6d10f2fa658a5da3ecbdb760aa3d938226a666197994b8414334`
passed a fresh 30,000-request closed-loop synthetic read/write run. The application
used its default command, one CPU, 512 MiB memory, UID 1000 and a read-only filesystem;
only two read-only synthetic secret files were mounted, with zero application
replacement mounts. MySQL used the exact database image above, one CPU, 2 GiB
memory and 1 GiB temporary storage. No public ports or provider actions.

Direct fixtures created 100 preverified synthetic accounts and 10,000 candidates.
This bypasses signup, inbox verification and intake. All 100 real HTTP logins
passed, followed by 600 warmup reads and 300 cross-owner read refusals.

| Workload | Concurrent actor loops | Requests | Successful p95 / p99 | Result |
| --- | --- | --- | --- | --- |
| Reads | 5 | 6,000 | 97.56 / 147.03 ms | All 200; 42.35 seconds |
| Reads | 20 | 6,000 | 209.95 / 323.07 ms | All 200; 29.77 seconds |
| Read overload | 100 | 6,000 | 914.65 / 1303.72 ms | 1,024 success; 4,976 busy 503; 9.51 seconds |
| Write workflows | 5 | 6,000 | 69.61 / 111.95 ms | 5,000 success; 1,000 expected stale 409; 34.14 seconds |
| Write workflows | 20 | 6,000 | 323.28 / 454.08 ms | 5,000 success; 1,000 expected stale 409; 41.21 seconds |

All tiers passed their predefined criteria without retries or raised thresholds:
zero transport/correctness errors and valid overload retry headers. Normal-tier
successful-response p95 remained below the fixed 2,000 ms limit. Six read routes
cover identity, profile, candidate list/details, runtime status and source catalogue.
Each write tier performs 1,000 review/edit/unchanged-replay/stale-conflict/archive/
restore cycles: 3,000 committed changes, 1,000 unchanged replays and 1,000 conflicts.
Independent database reconnection verified all 10,000 candidate rows after each
tier, including 9,900 untouched rows, restored archive state and allowed title
changes. Per-owner/action audit counts matched; aggregate counts are not causal
exactly-once proof. Finally, 400 wrong-owner mutations were refused and full
snapshots confirmed all 10,000 candidate rows and 6,000 audit rows unchanged.

Application cgroup peak was 266,190,848 bytes; database peak 759,476,224 bytes
(including temporary storage). No cgroup max/OOM events. Post-load health and
readiness both returned 200. Actual application logs acknowledged child shutdown
and parent stop. Independent inspection confirmed these owned fixtures stopped
with exit 0, no OOM and no public ports; none were deleted:

- Runner `407bebbf118ff50c01644c66368c4e65717fddea635dd3fcd921fa307affb3fa`.
- Runtime `8442f9e2d0290fd277cf05e8fb115602a254c8dbc8b172b79ce5194f72911bbe`.
- Database `9e153ee98d456bd9dc09b746d576fa3258a5bcd6d93c353df5386092b15a6568`.

Raw evidence: external `outputs/csv63-load-20261002-r1/load-run.log`. Fresh bundled
helper SHA256 `d4a40bdbda583712d1e1fbe0073fd43ccb09ad590d1fac16d5c56ff287807bea`;
runner `3a6bc1fa29846beff8b813ffeb27d3eba1b61d79172ed658ed45985196993d9b`.
The current helper passed standalone strict typechecking and seven focused harness
tests without skips. No application source was changed for this qualification.
After documenting the results, all 168 host operator/audit tests passed again
without skips in 4198.1935 ms; whitespace checks passed. Requirement traceability
remained valid with all 116 phases Partial and completion not proven.

This is not 100-user successful capacity, open-loop arrival-rate testing,
same-account competing-writer testing, a multi-day soak, representative signup/
import/export/outreach/mail/deletion load, live hosting or a customer pilot.
Observed local latency and memory do not establish EUR 100/month hosting capacity.

## Subsequent same-account competing-write qualification

A later run against the same exact packaged runtime added two independent
keep-alive HTTP connections per synthetic account, sharing its actual authenticated
session. Both mutation requests had to finish sending before either received
response headers, with distinct local socket ports. This establishes overlapping
client requests, not a server-side transaction barrier or deterministic lock order.
Five account pairs ran concurrently. All 100 different-title races produced one
changed 200 and one stale 409; all 100 identical-title races produced one changed
200 and one unchanged 200 with the same revision. No automatic retries. Subsequent
HTTP reads verified the winner's title/revision and owner. Both possible winning
connections are covered by the helper's focused regression tests.

An independent database connection verified all 10,000 persisted candidate rows:
100 final titles changed, 9,900 rows untouched, all other fields preserved except
normal update timestamps. All preexisting audit rows were byte-value equivalent;
exactly 200 new successful edit audits matched the winning HTTP response request
IDs, account, candidate entity, action and title-only metadata, one apiece. Losing
and unchanged requests introduced no extra audit. This is bounded request-to-audit
receipt evidence, not a universal exactly-once guarantee.

The earlier 30,000-request baseline also passed in this run with unchanged rules.
Read p95 at five/twenty actor loops: 102.61/219.74 ms; write p95: 95.91/394.53 ms.
Overload: 888 success/5,112 valid busy 503; successful p95/p99 1303.85/2268.88 ms.
Some individual overload read operations exceeded two seconds; no successful
100-user SLO is claimed. After the races, 400 foreign-owner mutations preserved
all 10,000 candidate rows and 6,200 audit rows. Health/readiness remained 200.
Application/database memory peaks: 242,794,496/756,871,168 bytes; no max/OOM events.
Parent/child shutdown acknowledged. Three exact owned fixtures independently
inspected stopped 0/no OOM/no public ports, none deleted:

- Runner `ef55788e1d559e7400a064cde30eb6f9049dbee5ea1179b594abaa422bcb8d91`.
- Runtime `8479adb5c5d2c36ae9df875d3c9d89724f4bc5ee6d0fc8dc0b56ee429b946264`.
- Database `ce749f9fd1d1cf720b3e3aeaf15b777e19f5cd1c64f77ba5789a2b89b4905080`.

Runtime mounts were two read-only synthetic secret files only; database had zero
mounts. Runner mounted only those secrets and the external test helper. No app
replacement, real provider action, purchase, deployment or GitHub publication.
Raw evidence: `outputs/csv63-competing-20261002-r1/load-run.log`.
Helper bundle SHA256 `9247e9dd4aa8e36210329bde90ac975374956b024c3aabcd3ff35f78f550753a`;
entry `f4aec6164c0ff5101fbd2064b48dd970e3e764da5bee5120c282c6fd37a1e144`;
finite race helper `7908647f44c1249b63ffbdd8cdced1ea0e83b9a050e0e0dbba3356b27b511a3c`.
Only test harness sources changed; the runtime artifact was not rebuilt or
represented as containing the new helper. A standalone typecheck first found an
unsupported Node Agent property in test setup; explicit source-address tracking
fixed it, then standalone strict and full app typechecks passed. Fifteen focused
harness tests passed without skips (eight new race cases, seven existing load
cases). All 168 host checks passed without skips in 7209.6011 ms. Source-derived
API/UI snapshots stayed current. This increment still leaves archive/restore
races, more than two writers, account-fence races, open-loop traffic, multi-day
soak and representative whole-product workload acceptance unproven.

## Scope, provenance and remaining acceptance

Production dependency audit completed 0 with no known vulnerabilities found.
All 168 current host operator/audit checks passed without skips in 3551.2627
milliseconds. Their source-derived snapshots remain current; this is separate
host evidence, not a hosted CI execution or image-build provenance assertion.
This is a point-in-time advisory check, not a security guarantee. The selected host
inventory captured 552 files, digest
`7c7fb1adc2a5bc7e9387ed87cff952723d373e6d605a942162f9fe42842af3a9`;
its scope excludes root operator sources/docs, dependencies and host/provider state.
It explicitly does not prove causal build provenance, full-checkout identity,
authenticated release receipts or production acceptance. No source code changed
during these builds; this qualification document was written afterward.

Broader browser/accessibility/locale coverage, representative whole-product load/soak,
hosted CI, independent operator review, controller/privacy/retention decisions,
real inbox/provider access, TLS/private hosting/alerts/off-host backup and worldwide
source/native-language coverage remain open. Earlier image receipts cannot close
these current-package gates. EUR 100/month remains planning-only (80 operating,
20 reserve), not provider billing enforcement or spending authority.

No public deployment, purchase, provider membership, real outreach, account
permission change, commit, push, merge or GitHub publication occurred. Existing
shared services, earlier images, test containers and user changes were preserved.
Raw generated logs and reused observation helpers are under the task's external
`outputs/csv63-package-20261002-r1/` directory, not committed application source.
