# Candidate search, order and pages

Open the Prospects tab in a verified signed-in workspace. Every list is scoped to
the current account. Active candidates are shown by default; archived/all filters
do not restore permission to contact an archived or opted-out person.

Search matches a literal substring of name, title or location. Leading/trailing
spaces are trimmed; maximum 100 characters. A percent sign, underscore, equals
sign or backslash is searched as text, not as a user-supplied wildcard or SQL.
Matching sensitivity follows the database's configured collation; there is no
fuzzy, skills/industry or transliterated-name search in this control.

Candidate order offers:

- Newest added first: import time descending, candidate ID descending for ties.
- Oldest added first: import time ascending, candidate ID ascending for ties.
- Name A–Z: database name collation ascending, candidate ID ascending for ties.
- Name Z–A: database name collation descending, candidate ID descending for ties.

Changing search, status or order starts page one. The workspace uses 50 rows per
page; the API accepts 1–100, with page numbers bounded to 1–1,000,000. Out-of-range
valid pages return an empty list and the actual matching total. Extra query fields,
unsupported ordering and malformed bounds are rejected. Old callers omitting order
keep newest-first behavior.

Search/status/order remain in this page's memory. Language switching preserves
them but does not translate customer data. Reload resets them. Saved private search
defaults currently store search/status, not order; applying them does not change
the current order. These detailed controls remain English.

## Consistency and privacy

Each response reads the total and rows in one repeatable-read, read-only
transaction. A concurrent change cannot make the count and rows describe two
different snapshots within that response. This is NOT a persistent snapshot
across separate page requests: additions, edits or deletion between requests may
shift rows; refresh before relying on a page as a fixed inventory.

The list uses the existing allowlisted candidate projection and source-policy
decision. No new profile collection, raw enrichment payload, contact permission,
message generation or sending is introduced. A mismatch between displayed and
signed-in account is refused. Unverified accounts cannot access the list.
Searching/ordering is read-only and does not generate a new per-keystroke audit
record containing search terms.

Implementation: shared/candidate-query.ts defines bounded input and explicit
literal LIKE patterns; server/candidate-query.ts constructs parameterized SQL.
The explicit ESCAPE clause is documented in the
[MySQL reference](https://dev.mysql.com/doc/refman/8.4/en/string-comparison-functions.html).
This does not validate arbitrary deployment SQL modes/collations or provide a
production performance guarantee.

## Verification scope

Unit tests exercise strict input, default/backward-compatible ordering,
parameter binding, literal escaping and deterministic tie-breakers. Real MySQL
tests exercise all orders across pages, literal special characters in each search
field, account isolation, unverified/malformed refusal, archive and opt-out behavior,
and a concurrent delete between count and row retrieval.

Connected browser acceptance uses actual sign-in and isolated synthetic MySQL
accounts/candidates, with no RPC mocks. It checks 56 owned rows across two pages,
all ordering choices, page reset, literal search, preserved opt-outs, desktop/mobile
controls, language switching, and the local support download in that same owner
workspace. Synthetic verification fixtures are not mailbox proof.

Exact current evidence and packaging limitations are in
[the verification report](FINAL_VERIFICATION_REPORT.md). Production-sized load,
hosted/browser diversity, broader filter scope and full phase 022 acceptance remain
open; these improvements do not complete the worldwide beta.
