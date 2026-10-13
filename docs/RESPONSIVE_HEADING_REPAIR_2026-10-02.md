# Responsive heading repair — October 2, 2026

Local implementation, not full accessibility or release acceptance. The
accessibility skill guided semantic heading inspection and regression checks.
No provider, account, publication, deployment or spending action.

## Confirmed issues and changes

The sign-in page's only h1 was inside a marketing section hidden below the large
breakpoint. Its always-visible form title was a div. Login now uses one h1 for
the localized sign-in/registration title and names the form with aria-labelledby.
The optional desktop marketing title is h2. Existing styles, labels, mutation
handling, credentials and account-cache handoff are preserved.

The catalogue section had an h2, but its source-card titles were divs. Each card
now contains an h3, preserving appearance, record identity, evidence details,
filters, external links and discovery-only restrictions. The shared CardTitle
component was not globally changed; other pages' heading levels are unaffected.

Native headings provide a navigable content structure; this is an improvement,
not a finding that a particular user's screen-reader experience was tested or
that every WCAG criterion is satisfied. Primary guidance:
[W3C structural navigation guidance](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html).

## Verification and limits

Before the fix: focused26 tests produced23 passes/3 failures (two added English/
Dutch login-heading tests and the strengthened catalogue-heading assertion).
After the fix:34 tests/3 files/zero failures or skips,4.20seconds; login-session,
platform-catalogue and interface-language suites. Checks include one localized
form h1, form-title association, marketing h2 and55 source h3 headings. Static
rendering checks are not browser layout, keyboard or assistive-technology proof;
registration mode uses the same title markup but was not interactively switched.

TypeScript and production build completed session7384 exit0; Vite6.26seconds.
The first inventory observation overlapped Vite's output replacement and failed
ENOENT; no receipt was accepted from that observation. After terminal build,
selected inventory532 files/10,500,806 bytes/digest
87f3d792dc2bb3793fab17523501ea622229ded0375a1257633e0f36ff3c7803.
It excludes root operator/docs/dependency/image bytes, not signed build provenance.

API snapshot refreshed using source-derived output:165 operations/58 admitted/
107 denied/54 reachable references/0 unknown; input digest
6c9a32abd1954532a315be138fb728f06ded42ad44a5e2e317008f80c15fac8d.
All11 scanner tests passed/no skips,1.0562814seconds. One attempted mechanical
snapshot patch was refused by its structural guard because unformatted JSON had
a different line count; no edit occurred. Formatting the generated JSON before
diffing produced the reviewed mechanical hash/reference-line changes.

Full unit/database/operator suites were not rerun for these frontend-only changes.
Earlier current-image database/recovery/browser acceptance in
[the packaged receipt](CENTRAL_ASIA_GATE_PACKAGED_ACCEPTANCE_2026-10-02.md) predates
this repair; those immutable images do not contain the new headings. Fresh current-
byte browser/keyboard checks and image qualification are needed. No axe package
was found in the inspected local app dependency paths; no audit was fabricated.
Full screen-reader, contrast, zoom, focus order, target-size and performance review
remain open. All116 original phases remain Partial; the whole goal is unfinished.

## Rendered and keyboard qualification

Subsequent browser-QA skill verification used actual compiled frontend files,
mounted read-only into the retained backend runtime, not a rebuilt immutable image.
Host/container frontend tree equality:30files/1,885,412bytes/SHA256
b60c4a1b7f1791bdff458bef6045a77e7d1e2fb291ca9167c7153354f2c65926.
Backend image38cb3b67b13dee889ab3f0e1e80fb7184f4a87f77e306f66f45019f4347b7da8,
QA image69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326,
MySQLb3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb
(all sha256 local identities, --pull=never). Runtime serves /app/dist/public.

First30721 exited1: harness incorrectly mounted /app/apps/cofounder-discovery/
dist/public, leaving packaged old frontend active. Heading assertion correctly
failed; screenshot, Dockerfile and static-server path confirmed fixture error.
No product edit or assertion weakening. Its three owned fixtures241e6cbc stopped:
browserf264f21edab1e5a3d6378d83bbbf22a8f1bc173d07290d76ea44ded630725fc1 exit1;
app6f2447a5784eaf5144f8042dc60d660d0fcec078179a2571a7a66ef41ff41790 exit0;
DB114f3289f88736a5e0f7c6254c8f30ea3db2fc49a139e5db147778260a0e80a2 exit0.
first-run-wrong-mount.png retained. Corrected only external mount destination and
keyboard expectations to include the actual first control, Interface language.

Fresh35060 exited0:15stages, zero unexpected browser errors/external requests,
four exact expected password/oversized-export diagnostics. One visible form h1
at375x812/768x1024/1440x1000, named form and no horizontal overflow; inspected
login-375.png/login-1440.png (no credentials entered in screenshots). From freshly
reloaded page, native Tab traversal confirmed language selector→email→password→
recovery link→submit→mode switch; keyboard Enter switched to registration and its
named form/heading without submitting registration. All55 catalogue h3 headings
were present. Actual login and all14 earlier catalogue/intake/draft/conversation/
reminder/export/refusal stages passed on this mounted frontend. No RPC mocks or
real sends; one deliberate synthetic manual-completion record only.

Helpers outputs/heading-browser-20261002-r1:
runner SHA25643dd0280e04fbce463b203be08249846d37d0a0ef8aee60ed20b046437f49815;
browser SHA256eb12516ad1c477a3172efcf5bc3114c973771883bfdaf4f52d064ed27fa691fc.
Temporary fixtures30d27056 independently inspected stopped/exit0/noOOM:
browsercbab76df46ce0426072941810c4ab9a566dd79c40e7d5de20ccd9c86380b6f32,
appce31b8a3bfeabf235f46ac3f64b3d8f3f8f2219200b341213fb06e4f08eb585e,
DB76671027069a3180ceb9d681b071c08f2f8d125193e580d78b5fb0be3adb6f95.
One read-only compiled-frontend mount in app; writable QA/output mount in browser;
no source/dependencies mounted. DBnetworknone, app/browser share only its loopback,
no public ports; each2CPU2GiB256PIDs/read-only/capdrop/no-new-privileges, UID999DB/
UID1000app/browser. Browser512MiBexec tmpfs and --no-sandbox remain disposable QA
exceptions, not production browser-executor acceptance. Registration/mail/platform
automation/deletion/legacy disabled; pause=false only for isolated manual preparation.
Synthetic DB contents discarded on stop; no real data/providers modified.

A slow Docker read-only listing64286 remained live and was resumed, not restarted;
it eventually returned before final independent stopped-state inspection. The
additional networknone/read-only --rm file-tree probe passed with UID1000/2CPU/
1GiB/128PIDs. These prove the stated rendered repair and bounded keyboard path,
not all keyboard/focus/screen-reader/axe/contrast/zoom/performance coverage.
Formal visual baseline remains INCONCLUSIVE; production DO NOT SHIP until broader
gates are met. Fresh immutable-image qualification remains open. No full unit/
database/recovery/operator suite rerun implied by this browser qualification.
