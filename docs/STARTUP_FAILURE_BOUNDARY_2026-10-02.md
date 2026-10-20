# Controlled startup failure boundary

October 2, 2026. Local source repair; no deployment or new image qualification.

## Repair and scope

The actual server entrypoint previously scheduled listening through a callback
without awaiting socket errors. An occupied production port could therefore
emit an unhandled Node error instead of the application's controlled failure
event. The outer startup rejection handler also printed raw exception messages.

The entrypoint now awaits the actual socket listening event before announcing
server_started, starting workers/cleanup or installing running-server signal
handlers. Async bind failures and synchronous listen exceptions reject startup;
only this helper's temporary listeners are removed. Existing Node/consumer
listeners are preserved. Production never falls back to another port.

Caught startup failures emit only {level: fatal, event: startup_failed} and set
exitCode1. No exception message, cause, host/configuration value, filesystem path
or database credential is copied into this event. The helper does not inspect
the exception. This intentionally follows the error-handling skill's separation
of actionable operator events and user/private data, without adopting its generic
raw-error logging examples. Not a whole-product logging sanitization or new
startup deadline; module-initialization failures and legacy loggers remain outside
this asynchronous entrypoint boundary. Operator diagnostics remain separately
reviewed and must not be replaced with a raw-error dump.

## Verification

- Four helper tests cover real loopback HTTP listening, actual occupied port,
  synchronous rejection, exact private event and listener cleanup/preservation.
- Two real-process tests compile the current application entrypoint freshly
  with esbuild, then launch it with bounded subprocess lifetime, isolated dotenv
  configuration and synthetic settings. Invalid configuration and real occupied
  port each exit1, no signal, empty stdout and exactly the fixed fatal stderr event.
  An empty fixture public directory only permits static route registration;
  no client is served and no browser/customer acceptance is claimed by these tests.
  The occupied-port owner remains listening; no database connection/provider is used.
- Corrected targeted six tests/two files passed (4.35 seconds).
- Existing four actual process/signal tests passed, including SIGTERM/SIGINT,
  development HMR socket closure and admission-paused shutdown.
- Type checking and full local application compilation passed, terminal0.
- All 133 root/operator tests passed, no skips (3.23 seconds).
- Full corrected application regression: all 731 tests/74 files passed without
  skips, 107.85 seconds, terminal exit 0. This is the complete rerun after fixture repair.

Initial helper assertions incorrectly expected Node's own listening listener to
be absent. They were corrected to prove preservation of the baseline listeners.
The first command test launched production-mode source directly, using a source
relative static path and adding a missing-build warning. It is not occupied-port
acceptance. The corrected compiled-entrypoint fixture tests the real production
asset-path semantics, not a relaxed stderr assertion. The initial full run had
730 passed/one failed (111.31s) on that source-runner fixture and is not acceptance.
The full suite is rerun, not just the corrected group.

Host Nodev25.2.1, not production Node22. The previously qualified Node22 image
705185 and its 712 database/ten browser-stage receipts remain dated evidence for
the earlier contents only. They do not contain this startup repair. Fresh image,
database/browser, hosted HTTPS/provider/operator/security acceptance is required.

Selected local inventory after rebuild: 517 files/10,325,362 bytes, digest
54fe0c3351f8cd75f40011c4e0b883de49c29496fd0c643960f30c2471a0f08f.
Build-provenance/test/production acceptance flags remain false; this selected
inventory excludes root operator/docs/dependencies/secrets/image/provider state
and is not causal build attestation. Retained-source traceability remains 116 Partial,
zero Missing/Implemented, 12 required artifacts, completionProven=false.

No purchases, provider send, deployment, public endpoint, permission change,
commit, push or merge. Existing work/images/apps preserved. EUR100/month budget
remains planning-only. Full worldwide/platform/116-phase goal remains incomplete.
