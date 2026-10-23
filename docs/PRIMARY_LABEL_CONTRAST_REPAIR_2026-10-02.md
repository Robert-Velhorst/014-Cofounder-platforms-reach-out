# Primary label contrast repair — October 2, 2026

The accessibility skill guided a targeted browser measurement and local repair.
The dark-theme sign-in button uses14px text: measured old light foreground
RGB250/250/250 on orange255/53/0 had contrast3.4922105044213057:1, below the
[W3C normal-text minimum4.5:1](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
This was a confirmed rendered issue, not an estimate from screenshot appearance.

## Change and regression checks

Only dark --primary-foreground and --sidebar-primary-foreground changed to
#0a0a0a. Orange backgrounds, light-theme blue tokens, disabled behaviour,
authentication/backend and explicit page-specific overrides remain unchanged.
Shared primary labels use a near-black foreground; no global white-text replacement.
Three new CSS-token guard tests bind the reviewed pair/sidebar consistency and
unchanged light tokens. They are static guards, not numerical/browser contrast
proof. Initially2 failed/1 passed; after repair37tests/4files/no skips6.46seconds
passed (theme, login-session, catalogue and interface-language). Typecheck/build
85334 terminal0; Vite5.74seconds. Full unit/database/operator suites not rerun.

## Browser evidence

External outputs/contrast-browser-20261002-r1 copies the preserved heading fixture;
only the additional contrast stage changed. Measurement uses computed ancestor
solid backgrounds composited through browser sRGB canvas, then foreground colour
and standard relative-luminance formula. Gradients fail explicitly rather than
receiving a false estimate. One sign-in control/dark theme/default plus stable
hover measured after250ms; quantized8-bit sRGB and tested ancestors only, not a
whole-page/axe or independent colour-instrument audit. No text pixels/antialiasing
sampling and no rounding before threshold assertion.

Before repair99739 terminal1, fixture9fa3be66: contrast assertion failed as
expected; first-run-low-contrast.png/logs retained. Browser
2ce25a9cb8d6f4aa03008b283c2266b1082f2a89adbe7e41030d62bbbdc3c076 stopped1;
appc2dd30164ea51ada9e251021bcf81cea6c28114b1e413f44675284b5cfbcc5fb
and DB5520b166c6bc1cac86feb58d02ac9fe84f7f157a8bf1e68a74564a8fdc340d20
independently stopped0/noOOM. No deadlines/assertions relaxed.

After repair82443 terminal0,16stages, Chromium148.0.7778.0:

- Normal: near-black10/10/10 over255/53/0, ratio5.431518709948351.
- Hover:10/10/10 over234/50/2, ratio4.671987609443461.
- Prior responsive heading/named form/keyboard registration-mode and14 actual
  catalogue/intake/draft/conversation/reminder/private-export/refusal stages passed.

Zero unexpected errors/external requests/RPC mocks/real sends; four exact expected
password/oversized-export refusal diagnostics. One synthetic manual-completion
record, not actual delivery. New login-375.png inspected; no credentials visible.
No assertion that sidebar instances, custom gradient buttons, links/destructive
controls, every hover surface or light-theme contrast were browser-tested.

Current frontend readonlymounted at/app/dist/public in retained runtime
sha256:38cb3b67b13dee889ab3f0e1e80fb7184f4a87f77e306f66f45019f4347b7da8;
not a new immutable image. QA69de0b530fa6c3e025d9ee197c04f88332d7e517b94d158e807e8d2ab9ed5326
and MySQLb3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb
(sha256 identities, --pull=never) unchanged. Helper hashes:
runner43dd0280e04fbce463b203be08249846d37d0a0ef8aee60ed20b046437f49815;
browser357a18b130365ff0a837d6039308311fda8577a0ae79bfde1fd0461c46383449.

Owned1b610d30 independently stopped/exit0/noOOM:
browser56817fbde181471832a74dcd52100007fefc9ca3bc1998637a804efa0956a095,
app260f98f10738750363265e6222d62b6bc9b332713e2dec6f56f78cc7d166f6d7,
DB3f7a3c13198b8faea0b46bafc9aae1b0e198c81575cff3b4161627880f3d223e.
Same bounded/no-public-port/network-isolated synthetic fixture as
[heading verification](RESPONSIVE_HEADING_REPAIR_2026-10-02.md#rendered-and-keyboard-qualification),
including one read-only compiled frontend mount, writable QA/output mount,
UID1000app/browser/UID999DB,2CPU2GiB256PIDs/capdrop/read-only and browser-only
exec tmpfs/no-sandbox exception. No source/dependency mounts or provider calls.
Pause=false only in temporary manual-preparation fixture; no live switch changed.

Selected source/build inventory533files/10,501,840bytes/
b1fc5fbf18c82753c33810bf91192ad5b84fefdfbe50333f95a0823f99ffc93e.
Compiled-public tree30files/1,885,394bytes/
06a7c1a19a9adfa7390d80ab13ba5c2747dcc0341c953bd8b1a1725e768fb2ee
(host observation, not independent signed build provenance). API source audit
digest unchanged6c9a32abd1954532a315be138fb728f06ded42ad44a5e2e317008f80c15fac8d:
its structural scope does not include this CSS file; unchanged is not CSS acceptance.

Whole-site contrast/screen-reader/focus/zoom/axe/performance, current immutable
image and hosted/privacy/provider gates remain open. Formal visual regression is
INCONCLUSIVE without baseline comparison; production DO NOT SHIP until full gates.
All116 original phases remain Partial. No commits/publication/deployment/spending.
