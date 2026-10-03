# Task graph

## Current full-scope dependency map October 2

The exact 116 original phases and their remaining acceptance criteria are in
[the completion matrix](GOAL_COMPLETION_MATRIX.md), not the old broad-range labels.
This graph is a dependency map, not proof that any workstream is complete.

1. Preserve source and exact requirements; complete current audits, licensing,
   threat/privacy reviews and requirement-specific evidence.
2. Complete supported customer features and connected acceptance, including
   reusable owner presets, Dutch/English readiness, support diagnostics and
   release/version history. These are not removed merely because security tests pass.
3. Obtain controller/support/retention decisions before final erasure and backup/
   receiver handling; complete lifecycle, real mailbox and operator continuity.
4. Complete worldwide country/language/channel discovery and separately qualify
   each permissible provider capability. Assisted/manual paths remain first-class;
   public discovery is neither profile ingestion permission nor provider acceptance.
5. Prepare hosting/private database/TLS/remote encrypted backups/alerts/restore/
   rollback within the EUR 100 ceiling; actual costs and enforcement require
   approved providers and real operational evidence, not declarations alone.
6. Qualify the final source/lockfile/immutable artifact with full current regression,
   fresh-clone, connected customer/operator, performance, adversarial and hosted
   acceptance. Close every original phase and additional user requirement.
7. Commit, consolidate PRs, publish documentation/images and deploy only under
   the applicable explicit authority. Record actual source/artifact/remote results;
   never substitute local preparation or a planned action for performed publication.

The historical graph below describes the assisted-core implementation sequence.
Safe local implementation can proceed while decision-dependent external gates are
unresolved; those gates do not make unrelated local work impossible.
It does not remove the broader beta, provider, privacy or final readiness gates.

## Historical assisted-core sequence

    source audit
      -> canonical workspace
      -> auth/config/security
      -> owner-scoped schema + migrations
      -> critical-path API
      -> critical-path UI
      -> unit + MySQL integration tests
      -> production build + dependency audit
      -> Windows container acceptance
      -> browser/accessibility acceptance
      -> ngrok/HAI operator gates
      -> final verification + release

Provider-authorized automation is a separate future branch of work and is not a
dependency of the supported assisted workflow.
