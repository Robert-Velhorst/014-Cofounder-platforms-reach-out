# UI action audit

| Action | Backend/database effect | Safety behavior |
|---|---|---|
| Register/sign in | Local user plus signed session | Password never returned; cookie HTTP-only |
| Import CSV | Owner-scoped prospects and replay record | 1 MB/row/field limits; duplicate profiles skipped |
| Qualify | Owner-scoped match | Deterministic, explainable score |
| Draft | Outreach row | Blocks opt-out; template mode disclosed |
| Submit/approve | State transition and audit event | Invalid transitions rejected |
| Prepare manual send | State transition only | Pause switch and per-user daily rate limit |
| Confirm sent | Timestamp/reference and audit | Requires literal confirmation; no provider claim |
| Record response/follow-up/close | State transition and audit | Owner-scoped |
| Export | In-memory owner CSV | Escapes spreadsheet formula prefixes |

The interface contains no button that silently scrapes, connects a provider, sends a
message, or reports a provider success.
