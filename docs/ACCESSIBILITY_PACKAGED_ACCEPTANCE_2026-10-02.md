# Accessibility repairs: packaged acceptance — October 2, 2026

The deployment-patterns skill guided this local production-image check. No
publication, live provider action, real message delivery or spending occurred.
Robert confirmed the initial EUR 100/month planning ceiling; the existing
EUR 80 operations / EUR 20 reserve allocation remains a planning safeguard,
not purchase authority or provider billing enforcement.

## Build evidence

The first runtime build with `--network=none` failed at Corepack's package-manager
download (registry DNS unavailable). Session 57631 ended with exit 1. No offline
reproducibility is claimed. A normal-network retry reused cached dependencies;
session 14475 ended with exit 0. The build ran type checking, all **827 unit tests
in 82 files without skips** (134.81 seconds), the production build (Vite 5.72
seconds) and offline production-dependency pruning (546 reused, zero downloaded).
This was not a clean-cache supply-chain qualification.

Local tag `cofounder-local-a11y-runtime-20261002-r1` resolves to inspected image ID
`sha256:ac37fba81aaae6ac424de5360059259fd6968aa8dfc953342e53598f7f725c46`.
Its configured user is `node`; reported size is 223,467,998 bytes. The tag alone
is not the identity: the browser runner requires the exact inspected ID.

## Packaged browser evidence

External fixture `outputs/a11y-image-browser-20261002-r1` preserves the previous
16-stage contrast/browser assertions but removes the compiled frontend bind
mount. The application runs its normal migration/server command from the new
image with **zero application-source or frontend mounts**, no public ports and
no outside network access. Database and browser use their previously inspected
exact IDs. Synthetic preverified accounts bypass real inbox verification only
for this disposable test. The browser uses real application HTTP requests, not
RPC mocks. Manual preparation is enabled only in the isolated fixture; its single
completion receipt is synthetic and is not proof of message delivery.

Session **87996 ended with exit 0**, fixture suffix `2081baf7`: all 16 stages
passed, including responsive single-heading/named-form checks, native login
keyboard order, 55-source catalogue searches/rules, human-declared intake,
draft review/approval/manual preparation, reminder persistence, conversation
history, private password-reviewed JSON download, anonymous/cross-account
refusals and oversized-export refusal without partial download. The dark sign-in
button measured contrast **5.431518709948351:1 normally** and
**4.671987609443461:1 on hover**. Four explicitly asserted refusal diagnostics
were expected; no unexpected browser errors or outside requests were recorded.
Real sends and external provider actions were both zero.

The runner hash is
`ff5e94e0d8cf17493d0cfcdce7035904ec673bb156fd5f0524f07939bc5f2c3d`;
browser helper hash is
`357a18b130365ff0a837d6039308311fda8577a0ae79bfde1fd0461c46383449`.
The 375px login screenshot was also visually inspected before credential entry.

Independent post-run inspection confirmed all three owned containers stopped
with exit 0 and no out-of-memory kill:

- Browser: `ac6e206da6a0e61fd9ec51178ad2ad108414db26cf5688928522c5a04b612802`.
- Runtime: `905e5d83f7279dec954be475c9cefc4f6c231b4142dc792a12459c7d4e56c0f5`.
- Database: `3b554f474eec48ee019c96ad506cf1095e2860a2f50d3a07cb9451c14b075c1f`.

The inherited fixture is bounded, non-root, read-only and network-isolated;
Chromium's disposable-test `--no-sandbox` exception remains. No full accessibility
audit, assistive-technology qualification or whole-site contrast acceptance is
claimed. The new image's full database integration/recovery suites have not been
rerun; their earlier image receipts remain historical, not transferred evidence.

## Budget and remaining gates

The 13 budget-check tests passed without skips (609.366ms) this turn. They validate
declarations and reserve handling, not actual quotes, invoices or provider caps.
Controller identity, monitored privacy/support contact, retention-policy approval
and actual erasure remain unresolved. No deletion setting was activated. Hosted
TLS, live inbox delivery, provider permissions, worldwide catalogue completeness,
remote recovery, deployment and whole-prompt acceptance are still separate gates.
The overall goal remains incomplete.
