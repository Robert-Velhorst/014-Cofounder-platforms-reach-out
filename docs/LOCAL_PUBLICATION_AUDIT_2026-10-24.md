# Local publication and evidence audit — October 24, 2026

This is a public-safe preservation checkpoint, not certification that every local
file has been published or removed. Raw private archives, credentials, database
contents, machine-specific path inventories and personal data are not attached.

## Exact candidate and GitHub evidence

The inspected [PR #127](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/pull/127)
head was `3c69446d4cd34c35c4d7e11b3dfa8025feab1efb`, independently read from local
Git, the remote branch and PR metadata. The working tree was clean before this
documentation update. Main remained `9e15816b2f34b06e69635ea475f2aa55f03c02d2`.

- [CI run 40029010718](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40029010718): successful `verify` and `container-smoke` jobs.
- [CodeQL run 40029006585](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40029006585): successful JavaScript/TypeScript and Actions analyses. Workflow success does not itself establish zero findings or closure of main alerts.

The inspected CI step results include successful dependency advisory checks,
type checking, release/requirements/API/UI contracts, the actual synthetic Docker
context privacy check, application unit tests and build, database migration and
integration tests, readiness, fresh database-role boundaries, backup/recovery,
startup and authentication admission, the complete synthetic customer workload,
actual HTTPS/session checks, and the complete synthetic browser journey. The
browser screenshot-retention step also succeeded. This audit did not visually
review those screenshots or independently inspect every assertion in those
jobs. It does not claim real-user, provider, production-host or operator acceptance.

These results belong to the exact source head above, not automatically to later
documentation or code commits. Fresh checks must be read for any later head.
The former Antler date failure was corrected from October 2 to October 23 in its
test assertion; no catalogue permission or production data was changed by that fix.
No local Docker build was performed for this follow-up.

### Follow-up documentation head: advisory gate failed

The documentation-only head `4c72d7b625e849fb7c8b8f73ac6e5f3eade77e18` was pushed
and read back from PR #127. Its
[CI run 40035740275](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40035740275)
failed at `Check production and development dependency advisories`.
`pnpm audit --audit-level moderate` reported one high-severity `body-parser`
finding, [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828),
through the Express dependency paths. It exited with code 1. This was not a
README assertion failure; the later verify steps did not run. Container smoke
and [CodeQL run 40035737235](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/actions/runs/40035737235)
passed. No dependency change, audit suppression, local rebuild or merge was made
as part of recording this result. The previous source-head pass must not be
presented as current dependency-security clearance.

## Recovered container source comparison

Six previously preserved source copies were compared byte-for-byte against the
published candidate. All six match its tracked source: three copies of the
monitor, its test, the synthetic write-load script and its corresponding test.
They require no duplicate code port.

| Published source | SHA-256 of matching bytes |
| --- | --- |
| `scripts/production-monitor.mjs` | `f6299d77d53f2e954c2ed65ee361602317ad0ca7931a532b0af5e235f647f604` |
| `scripts/production-monitor.test.mjs` | `a3d37586e842ff4e52914efe9f54ac74873828071b9ac3c26681ae1c09367799` |
| `apps/cofounder-discovery/scripts/synthetic-workspace-write-load.ts` | `b9c223890331e473330a527a226e569e9a618f3fe29e992c1506063d26b6d858` |
| `apps/cofounder-discovery/server/synthetic-workspace-load.test.ts` | `e9382bda1d5e17c20059b5a9f0381cf025dc07c2c04b7f849baa010462bcd518` |

Compiled bundles and generated production dependency manifests were not treated
as new source merely because their bytes differ between builds. Their complete
disposition, along with other archives, still requires a separate preservation
review; this six-copy comparison does not cover all local artifacts.

## Historical Git recovery

The inspected older source checkpoint contains 736 manifest entries. Every
original file's size and SHA-256 was verified against that checkpoint manifest.
Its complete, byte-exact source tree is now preserved at
[`9b0b21c59c3ed93124597da8a31f512825b0ab0d`](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/tree/9b0b21c59c3ed93124597da8a31f512825b0ab0d),
under tag `archive/local-preservation-20261024/source-checkpoint-20261003`.
The archive contains the 736 original source files plus a
[public-safe checksum manifest](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/blob/9b0b21c59c3ed93124597da8a31f512825b0ab0d/PRESERVATION_MANIFEST.json).
The tag and commit tree were read back independently from GitHub. The recursive
remote tree was not truncated: all 737 blob entries were present, and each original
path, Git mode and raw blob ID matched the locally verified snapshot tree.

The initial history comparison used Git clean filters. Nine legacy dashboard
files appeared absent under that transformation, but their raw bytes already
matched published blobs exactly. Conversely, 16 other files were present only
in line-ending-normalized form in the inspected history. Their content after
CRLF-to-LF conversion matched existing public blobs; the archive preserves their
original bytes as well. No unrelated source content was added through that step.

One initial archive attempt produced an empty tree because Windows native-pipe
CRLF input made Git ignore the index paths. Its remote verification failed, so
it was not accepted as preservation. Only that newly created empty tag was
removed after checking its exact target and empty tree. The corrected import
uses explicit UTF-8/LF input and verifies every local tree entry before pushing,
then repeats the path/blob/mode checks against GitHub. No local source was deleted.

This source-tree proof does not cover every separate patch file, archive,
database, credential, screenshot or embedded record elsewhere on the device.
The broader local-removal goal therefore remains open.

The original 934,467-byte unstaged recovery patch was subsequently checked in a
temporary Git index against its recorded base, without changing the working
application or its source files. Its SHA-256 is
`90c74c43c567a6d504198e873b5f3d94635dfb0743bac9c1a428807f2709b25d`.
It applies successfully to `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.
All 65 affected paths have exact matching postimage blob IDs in the published
source archive `9b0b21c59c3ed93124597da8a31f512825b0ab0d`. Thus its source changes
are preserved; the raw patch file itself was not uploaded. This does not settle
the disposition of private archives, databases or unrelated project data.

Of its four distinct bundled Git heads, these are ancestors of the inspected
PR #127 head:

- `2400c98cd47d7495e702136f9080124e8cdb8678`;
- `861f67eda01f94667f75ea6fa9c9858f498a256b`;
- `89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb`.

The fourth, `1d0ff22b6ba4aa20613c25204c9c4101a5875872`, is not an ancestor of that
candidate. Its six divergent historical commits remain preserved by the remotely
verified annotated tag
`archive/consolidation-20261018/feature/project-based-messaging`, whose peeled
target is exactly that commit. Remote tag preservation is not a claim that the
legacy implementation was integrated into the current application.

### Other discovered checkouts

At inventory time, 17 co-founder Git checkouts reported no tracked or ordinary
untracked changes. This does not classify ignored files as disposable or establish
that the checkouts contain no credentials, database data or test artifacts.

Three divergent historical heads were reachable by GitHub commit comparison but
did not yet have demonstrated durable ref coverage. Explicit archival tags were
created and their exact targets read back from the remote:

| Archive tag under `archive/local-preservation-20261024/` | Exact target |
| --- | --- |
| `pr-consolidation-6eb2715` | `6eb271559ba0fe02022f5a36309a7cc1fce2d31e` |
| `vercel-removal-7e5a34f` | `7e5a34fcc97f06ba9db71fa5940a917c67b62f37` |
| `ngrok-removal-9b30258` | `9b302588000d49849a647967756f89477c64b118` |

These tags preserve the earlier launcher tests, deployment-documentation merge
and hosting-reference removals without merging obsolete code or documentation
back into the active application. They are not production releases.

## Local search and cleanup boundaries

A completed filesystem-name/metadata inventory started at both local drives and
exhausted its directory queue: 8,451,261 files and 1,193,872 directories. It recorded
903 co-founder name/generated-path matches, skipped 97,206 reparse points, and
encountered 121 access-denied and 301 disappeared/unavailable directories. Relevant
candidate contents were inspected separately. This is not a content search of
every file, an archive-by-archive audit, or proof that no local data remains.

Verified cleanup removed an obsolete dependency store of 34,807 files and
477,712,815 logical bytes while retaining and hash-checking surrounding source,
Git files and the separate test cache. A standalone historical desktop bundle
was compressed from 47,902,508 to 18,132,788 bytes; every archived entry matched
the original SHA-256 before the expanded copy was removed. Its recovery archive
still exists locally and has not been published. Combined logical file-size
reduction was 507,482,535 bytes, approximately 484 MiB. Physical space reclaimed
cannot be inferred from that figure amid hard links and concurrent disk activity.

Source repositories, backups, private data, database volumes, secrets, recovery
checkpoints and protected cleanup targets were not removed by this audit.
Other local dependency folders disappeared during concurrent activity and are
not counted as removals by this audit. No Docker mutations occurred in this cleanup.

The private local test archive was inspected by entry names, not uploaded. It
contains entries explicitly stored as database and JWT secret files. Their values
were not printed or published, and the archive cannot be copied wholesale into
this public repository. Separate database/runtime data and secret files also
remain local. Their destination or erasure authority still needs resolution.

## Authorized permanent erasure — subsequent October 24 checkpoint

The operator subsequently clarified the scope as **co-founder only** and selected
controlled permanent erasure. Changepreneurship is excluded. This supersedes the
earlier unresolved scope/private-destination questions above. Private archives,
database contents and secret values were not uploaded to the public repository.

Completed and verified absent after native deletion:

| Item | Verified result |
| --- | --- |
| Fourteen inactive source checkouts/worktrees | Deleted; 737,069,000 logical bytes. Heads were verified on remote refs or as ancestors of the published candidate. Three linked worktrees also received file-level source comparison before deletion. |
| Historical source checkpoint, old D-drive checkout, diagnostic folder, fresh test checkout, synthetic secret directory and browser screenshots | Six exact project directories deleted; 322,096,454 logical bytes. All 736 checkpoint source SHA-256 values were checked against the remotely verified preservation manifest before removal. |
| Private local-test archive and obsolete desktop recovery archive | Deleted with their manifest sidecars; archive payloads totaled 147,063,712 bytes. No replacement private backup was created. |
| Project Docker containers | Three remaining containers deleted, including the synthetic database-role fixture. |
| Project database volume | The dedicated named MySQL volume was deleted after checking consumers. |
| Project Docker images | Five unconsumed project images, represented by seven tags, were removed using native Docker commands. Shared base images were retained. |
| Project Docker networks | Two empty project networks deleted after inspecting ownership and attached containers. |

The file groups above total **1,206,229,166 logical bytes**, excluding archive
sidecars and Docker storage. This is not a measured physical-disk reclamation
figure. Concurrent activity, shared image layers and Docker's virtual disk affect
physical space. No local Docker images were built or dependencies reinstalled.

The working checkout's stash was also compared against the verified published
Git graph, including its index and untracked trees: no additional unpublished
blob was found. A separate consolidation bundle contains thirteen distinct heads;
each was verified either as a published ancestor or an exact remote ref. These
checks do not imply those remaining local objects were deleted.

### Remaining exceptions — removal is not complete

- The execution security layer rejected a subsequent deletion command containing
  the remaining test cache and consolidation Git bundle. That command did not
  execute. It was not retried through another tool or by deleting their parents.
- The control checkout remains, including its Git history/stash and test cache.
- The roughly 23.7 MB imported-source archive initially remained for review. That
  review and its subsequent deletion are now complete; see the next section. The
  archive itself was never uploaded.
- Local cleanup receipts and remaining recovery/code artifacts still exist in the
  dedicated audit directory. The separately verified consolidation bundle remains.
- Shared Codex histories, memories, browser profiles and anonymous Docker volumes
  were not erased wholesale. No exclusive co-founder ownership was established for
  remaining anonymous volumes. Unrelated applications and Changepreneurship were
  not cleanup targets.
- The earlier drive inventory's inaccessible directories and skipped reparse points
  remain coverage limitations. No claim is made that every file's contents were
  searched or that no embedded co-founder records remain in shared stores.

Permanent deletion here means normal filesystem/native Docker removal. It is not
forensic SSD/media sanitization, secure overwrite, credential revocation or proof
that remote/third-party copies do not exist.

## Imported archive review and erasure — completed October 24

The operator explicitly requested review of the remaining import archive,
publication of relevant unique co-founder source, then removal of unneeded local
material, with other projects excluded.

The original ZIP was 23,741,829 bytes, SHA-256
`1033690f97cb91c6cda3e1439d9798b747863d43fd037354a98af76e0b2f8d1f`.
It contained eleven nested ZIPs. Recursive entry classification recorded 4,512
leaf entries: 253 exact published blobs, 3,737 generated/vendor entries, 500 text
entries requiring review, 21 binary/private documents and one private environment
file. Repeated text entries are not unique features. The code subset reduced to
184 distinct candidate blobs after duplicate removal.

Eleven useful historical source files were selected for preservation: profile
completeness/compatibility, feedback-weighted matching, duplicate normalization,
message-template personalization/library, analytics, campaign design, AI
draft/conversation design, synthetic cost experiments, and an experimental
contribution/equity calculator. Their original bytes are available in the
[historical import reference](https://github.com/Robert-Velhorst/014-Cofounder-platforms-reach-out/tree/69ca0941a82df7a79d6fcfda357bfc6dc1070fb0),
tag `archive/local-preservation-20261024/import-reference`, commit
`69ca0941a82df7a79d6fcfda357bfc6dc1070fb0`.

This is deliberately an **inert historical archive, not active app integration**.
The selected code totals 277,775 bytes. The tag contains eleven source files plus
a warning/provenance README and checksum manifest. Every selected blob and byte
count, plus both documentation blobs, was checked against GitHub's recursive
tree after publication; the remote tag was rechecked immediately before deletion.
All eleven files passed `node --check`. Pattern checks found no selected private
keys, credential literals, credential-bearing URLs or personal contact literals;
the only selected email literals were two reserved-domain `example.com` examples
in the calculator's explicit example block. These checks are not a full security
assessment or runtime/provider acceptance.

No historical module was executed, installed, wired into the app or deployed.
The archive README specifically warns about unfinished/in-memory implementations,
unproven ML claims, simulated benchmarks, potentially obsolete provider APIs,
background processing, missing current security boundaries and the calculator's
non-advisory status. Current authentication, permissions and disabled platform
automation remain unchanged.

Unselected items were redundant/superseded app revisions, generated metadata,
vendor code, packaged executables, private/runtime/seed data, unsupported
automation/auth/billing variants, incomplete mobile shells, original prompts and
design prose rather than runnable source. For example, one purported JavaScript
integration file was only an XML `AccessDenied` response. None of the private
environment file, database query output, original prompt or full ZIP was uploaded.

After remote preservation verification, native deletion removed the original ZIP,
its manifest sidecar and all 184 temporary code-review copies: **186 files,
26,475,900 logical bytes**. All three exact targets were verified absent afterward.
No replacement archive or private backup was created. Small local review scripts
and metadata receipts remain; the separate control checkout, blocked test cache,
consolidation bundle and shared-store exceptions above are outside this completed
import-archive deletion. Other projects and Docker resources were not modified by
this follow-up.

## Remaining cache, bundle and checkout — subsequent explicit review

The operator explicitly requested a fresh review of these three co-founder-only
targets and deletion where safe. The inspected checkout head was
`6c3b369dc35c9c89bf735b097c4dc0cfef81ce95`; its working tree was clean. No other
linked worktree or non-shell process referencing the project checkout was found.
This observation is not an exhaustive open-file-handle test.

- The consolidation bundle passed `git bundle verify`. All thirteen distinct
  heads (sixteen ref entries) were verified against exact remote refs or ancestry
  of the published candidate. Its size was 131,473,511 bytes.
- All nineteen local branch heads were likewise covered by remote refs or the
  published candidate's history. The stash's working, index and untracked trees
  contained 795 distinct blobs, all present in the verified published object graph.
  No new source publication was necessary for those branches/stash trees.
- The test cache held sixty files, totaling 1,920,274 bytes. All fifty-eight
  compiled cache entries had inline source maps. Fifty-five embedded originals
  matched the published graph; the other three were compared with current source.
  They contained older catalogue/test variants and a Vite variant missing current
  frontend admission/rate-limit middleware. These are not useful changes to port.
- `git fsck --full --no-reflogs --unreachable` completed without integrity errors.
  Including all twenty-seven locally available, remotely verified graph roots left
  one unreferenced commit absent from that graph: the earlier empty-tree checkpoint
  attempt, not an additional source snapshot. Of 145 remaining orphan blobs, 133
  matched entries in the already-reviewed import inventory. The other twelve were
  intermediate documentation, test and legacy helper candidates; several had no
  surviving tree-path association and needed content comparison. This audit does
  not certify every orphan object's exact bytes as disposable or publicly preserved.
- Two ignored runtime-test secret files were found inside the checkout. Their
  values were not printed or uploaded. They remain local along with the checkout.

A fresh native deletion command for the exact bundle and test-cache targets was
**rejected by the execution security layer before execution**. Neither target was
deleted. No alternate deletion method was attempted. The containing checkout was
not deleted, because that would also remove the blocked cache through its parent.
Three source-map copies were temporarily created for comparison in the dedicated
audit directory. Their separate cleanup command was also rejected before execution;
those three copies remain locally and no alternative removal was attempted. The
original cache remains intact. Other projects and Docker were not modified.

Before this documentation update, the checkout contained 2,146 files and
164,064,380 logical bytes, including its cache and Git storage. That checkout
figure overlaps the cache figure and must not be added to it. The remaining
bundle/cache/checkout deletion is therefore still blocked, not complete. The
operator has already provided scope and deletion authority; asking for the same
approval again does not resolve an execution-layer restriction.

## Still required before claiming complete local removal

1. Resolve the earlier execution-layer deletion restriction without bypassing it.
   The import archive review/deletion is complete. Scope and private erasure authority
   are already resolved; they do not require the operator to choose again.
2. Compare every relevant remaining snapshot, local modification, archive and
   Git ref; port unique useful source or preserve approved historical material.
3. Verify remote preservation of each relevant source item before removing its local copies.
4. Separately review remaining Docker consumers/volumes, application state and
   embedded records in shared stores; never delete an entire shared store to
   remove one project's data.
5. Repeat the local audit after deletion, recording inaccessible locations and
   any remaining exceptions. Until then, the all-local-data-removal goal is open.

Passing CI and publishing this document do not complete those steps, approve a
public deployment, authorize purchases or messages, or complete the original
product's 116 phases.
