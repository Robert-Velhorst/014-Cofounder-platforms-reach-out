# Current CSV-recovery package qualification — October 2, 2026

Subsequent test-only load entry/helper/regressions changed the selected source
inventory to545files/38139f13..., not application routes, compiled runtime or
dependencies. [Current runtime write-load evidence](WORKSPACE_WRITE_LOAD_2026-10-02.md)
includes an unresolved early-startup shutdown observation. This package checkpoint
remains historical evidence, not attestation of newer test sources or public approval.

Status: current bounded local qualification passed, **not an approved public release**. This
receipt supersedes the older combined package for the application checks actually
reported here. It does not supersede the original scope or imply worldwide
coverage, hosted acceptance, publication, spending approval or real outreach.

Robert's initial operating ceiling remains EUR 100/month. The planning allocation
is EUR 80 operations plus EUR 20 reserve, not verified provider pricing or invoice
enforcement. See [budget controls and unknown costs](OPERATING_BUDGET.md).

## Fresh packages and scope

Both Dockerfile targets were built from the dirty local checkout at HEAD
89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb. No commit, merge, push or deployment
occurred. The current application includes the 62-record discovery catalogue,
account-refresh failure controls, bilingual candidate intake and uncertain CSV
import recovery. Application and dependency source did not change during this
qualification. Root readiness-test cleanup changed after the builds, as detailed
below; these images are not an attestation of every current root file.

| Package          | Exact locally inspected runnable image identity                           | Bytes       |
| ---------------- | ------------------------------------------------------------------------- | ----------- |
| Runtime          | `sha256:eaa6752ebb72e68c3bc7b629b9dc1554238291cee77e4deb771470b037626859` | 223,487,857 |
| Integration test | `sha256:580539d67b13db8ce9a6df2164be64f53c489f161a695333a94c8823aa4330a3` | 280,696,385 |

Build commands used the existing `runtime` and `integration-test` targets, tagged
`cofounder-local-csv-recovery-runtime-20261002-r1` and
`cofounder-local-csv-recovery-test-20261002-r1`. Both builds finished exit 0.
Use the inspected identities above, not BuildKit configuration hashes or mutable
tags. An initial probe using a configuration hash failed before creating fixtures;
the actual image identity was then resolved before qualification.

The runtime build passed typecheck, **926 unit tests / 90 files / no skips** in
136.17 seconds and Vite 7.3.6 compilation in 10.47 seconds. This run includes the
final mobile wrapping/assertion missed by the earlier broad-run timing boundary.
The integration-test target compiled in 8.51 seconds. The frozen-lockfile install
downloaded 689 dependencies; pruning used 546 cached dependencies without downloads.
This is not a clean offline-install, deterministic rebuild, signed image, registry
availability or causal committed-source provenance claim.

The selected host inventory remains 543 files, digest
`2e8371057219c5beb0f7a73328990e3a4056265c6d44789c4092fa9f80c5b6ab`.
It explicitly excludes root operator sources/docs, provider state and layers.

## Compiled parity and startup

Exact-image probes passed under Node 22.23.3 / UID 1000, read-only filesystems,
disabled external network, dropped capabilities and bounded resources. Each
mounted one read-only external qualification-helper directory, not application
replacements. Both packages contained the same 115 selected `dist`/`drizzle` files,
6,955,016 bytes, digest
`8cb93a4ea2125dbeae7b6667ea85051b757b76071292ec7abc51957b2a4e991c`.
Listed source, `.env` and development-tool paths were absent from the runtime.
This is selected artifact parity, not all-layer/dependency secret scanning.

Compiled runtime startup rejected invalid configuration without exposing values,
refused an occupied port without switching ports, returned real liveness 200 and
exited cleanly on SIGTERM with shutdown completion. This startup probe uses an
unreachable synthetic database; it does not qualify database readiness or the
default migration command. All three owned probes stopped exit 0 / no OOM.

## Connected browser acceptance

Deployment guidance led to requalification of exact packaged application bytes;
frontend-testing guidance defined a real end-to-end flow. Browser plugin was
unavailable, so the existing isolated Playwright fixture was used without installing
anything. Environment: Playwright 1.62.1, Chromium 148.0.7778.0, Node 22.23.2,
MySQL 8.4.11. The runtime used its real default migration/start command, UID 1000,
read-only storage and **zero application/source/compiled replacement mounts**.
The browser's writable output/helper mount is not an application replacement.
Its executable temporary directory and Chromium sandbox exception are QA-only,
not production or shared-host settings.

Execution 4311 passed all **23 stages**. Flow: login -> catalogue -> permitted
candidate intake/corrections and duplicate preservation -> assessment/opt-out ->
individual draft/review/manual preparation -> synthetic completion/history ->
reminders/response/close -> private export and account isolation -> CSV recovery.
No fabricated RPC results, no outside origins, no real sends/provider actions.
One deliberate browser-response abort followed a real committed CSV result;
unchanged payload/key replay recovered the receipt with exactly one candidate.
Rejected source stored nothing; declining edit release kept the lock, accepting
only enabled editing and changed CSV required fresh rights acknowledgment.

Eight expected network/forbidden/oversized-export diagnostics were explained;
zero unexpected errors. Preverified synthetic accounts do not prove inbox
verification. The one synthetic manual-completion record does not prove delivery.
Desktop 1365x1000 and mobile 375x812 screenshots were inspected; Dutch recovery
controls wrap and neither capture shows horizontal overflow.

| Rendered check    | Result                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Identity          | Internal `http://localhost:13216/outreach`, CoFounder Outreach title                            |
| Not blank         | Real account workspace, candidate/import forms and recovery notice                              |
| Framework overlay | No Vite error overlay                                                                           |
| Console           | Eight expected refusal/fault diagnostics, zero unexpected errors                                |
| Visual evidence   | Desktop/mobile captures inspected, mobile wrapping retained                                     |
| Interaction       | Real committed-response loss, byte-identical retry, one record and explicit edit release passed |

External evidence is in `outputs/current-csv-packaged-20261002-r1/`, including
`import-uncertain-desktop.png` and `import-uncertain-mobile.png`. Final fixtures
510514de: browser 5b6cd02b..., runtime 1013e412..., database ce89c9f4... . All three
stopped exit 0 / no OOM / no published ports and were retained, not deleted.

## Database qualification and recovery

The first mandatory database suite completed **723 passed / 1 failed / 724 tests /
43 files / no skips**, 406.37 seconds. The fresh-process login-admission case ran
10,802 ms with a configured 10,000 ms subprocess deadline while builds were
concurrent. The rendered error did not expose the subprocess exit/signal; timing
pressure is an inference, not a diagnosed root cause or a passing suite.
Owned fixtures 50f1ab36 stopped: test exit 1, database exit 0, neither OOM; no ports
or source mounts. Unchanged full-suite repeat13629 subsequently passed **724 tests /
43 files / no skips**,399.08seconds (helper407.987seconds), including the failed
fresh-process login-admission case. Fresh bf36f8b0 fixtures test7c33bc8e... and
database59654ebc... independently stopped0/noOOM/noports/zero source mounts. The
test container uses the integration target's root default and writable test
filesystem, with bounded CPU/memory/PIDs; it is not the hardened runtime model.
Passing this repeat does not diagnose or erase the first failure, prove repeatable
timing under production load, or qualify live-provider/customer behavior.

Current encrypted full-schema recovery execution49349 passed one mandatory test /
no skips in54,171.5478ms using the exact current test/runtime images above. It
restored into an empty isolated target, preserved binary00FFA0 and UTF-8 values,
schema/index/migration metadata, and source records. Corrupt/existing/unsafe-target,
nontransactional-table, broad/delegated-grant and active-role refusals passed.
Historical sessions were retained for audit but expired and lost privileged
elevation, so post-backup revocation was not undone. The restored runtime supported
real password login for two synthetic owners, owner-scoped candidates, cross-owner
refusal and logout/revocation. Windows backup-wrapper verification also passed.
Provider actions were zero. The runtime had a read-only probe-helper mount, not
replacement application bytes; no ports were published. This is a local temporary
key/snapshot exercise, not independent off-host backup/key custody, recovery-time
SLA, customer-data restoration or hosted disaster recovery acceptance.

Recovery fixture suffix a5c215ca: source d147fed3..., target842b0a2b...,
runtime6d3fff8d... . Independent final inspection confirmed all three stopped
exit0/noOOM/no published ports; no unrelated/user database was accessed.

## Operator tooling and readiness

Current Windows-host operator/audit run passed **165 tests / 11 files / no skips**,
7,278.9526 ms, after the readiness harness change. A Linux test-image attempt of
all 165 host-oriented checks returned 153 passed / 11 failed / 1 skipped: the image
has no Docker CLI for 11 Compose model tests, and no PowerShell for the legacy
backup-entrypoint check. No Docker socket was exposed and no safeguard bypassed.
The host run covers those host-specific paths; neither run is hosted CI acceptance.

A correctly scoped Linux portable run passed **50 tests / no skips**, 4,809.962289 ms:
API 11, UI 5, budget 17, selected release inventory 17. This includes real Linux
symlink/FIFO input refusal. Non-root/read-only/network-disabled helper fixture
c346d14c... stopped exit 0 / no OOM; prior wrong-scope 1c0fecd7... stopped exit 1.

Readiness execution 55123 first timed out at the Docker image-availability check,
before creating fixtures. Repeat 13220 failed during cleanup: its client deadline
was 10 seconds, equal to the daemon's 10-second shutdown grace. Cleanup could mask
the primary failure and stop before cleaning the second owned fixture. The root
test harness now allows 30 seconds specifically for stop, skips redundant stops,
attempts all owned cleanups and preserves earlier failures. Actual readiness-probe
deadlines, health commands and production application code are unchanged.

The remaining owned socket-only fixture was identified by the exact shared fixture
label f66d6f58-c8c5-434c-9600-84d9b0e7de8e, network-none/tmpfs/no-port settings, then
stopped by its full ID 60984a32...; normal f52eed50... was already stopped. Both
independently exited 0 / no OOM. No unrelated fixture was stopped or removed.
After the harness change, execution 2220 passed in 30,677.7365 ms: authenticated
CI/local/integration commands, bad credentials, missing schema, socket-only refusal
and the misleading legacy ping examples. This is local modeled-CI command evidence,
not proof that a hosted CI job ran.

The passing readiness fixtures64ee7b10.../fb1c2051... were independently inspected
stopped0/noOOM/no ports. Final root readiness-test SHA256 is
`b8719a0b9075497048bd907af2def2c33880e74ce47212ff619acc4d12499ae8`.
In total17 completed owned fixtures from the artifact/browser/operator/first-DB/
readiness/recovery checks were independently inspected: all stopped/noOOM/no ports;
the first-DB and wrong-scope operator containers retain their truthful exit1.
The two repeat-DB fixtures were then independently inspected with the same result,
bringing the current completed owned total to19; no running fixture remains from
this increment and none was deleted.

## Remaining acceptance

The trace verifier still reports **116 Partial / 0 Implemented /
completionProven false**. This structural matrix is not semantic completion proof.
Worldwide platform coverage, permission/private-access verification, remaining
EN/NL workflows, cross-session import recovery and other browser/fault timings
remain open. So do legal controller/retention/privacy-contact decisions, reviewed
provider cost/caps, real email delivery, hosted TLS/private database, off-host
encrypted backup/independent key custody, load/customer/privacy acceptance,
registry/signature/provenance, hosted CI and authorized GitHub publication.

No public launch, provider signup, purchase, real contact, credential exposure,
permission change, commit, merge or upload occurred in this qualification.
