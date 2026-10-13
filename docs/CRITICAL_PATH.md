# Critical path

1. Register or sign in locally.
2. Import owned/permitted prospect data using bounded CSV.
3. Qualify a prospect; scoring remains explainable and reviewable.
4. Write a human-original draft. Optionally insert your privately saved template
   into empty text, personalize it, then review the exact message/source rules.
   Applying a template is not approval or a saved draft. Opted-out prospects are blocked.
5. Submit the draft for review and explicitly approve it.
6. Prepare the manual action. The app rate-limits this step and never clicks or sends.
7. Perform the action on the destination platform outside this app.
8. Confirm the send in the app. The audit trail records that this is user-confirmed,
   not provider-confirmed.
9. Record a response, schedule a follow-up, or close the record.
10. Review owner-scoped analytics, export CSV, or ingest the read-only HAI event feed.

All write transitions are authenticated, owner-scoped, validated against the state
machine, and audited with a request ID.

The optional My defaults path stores private human-original templates and
candidate search/view defaults with current-account verification, revision
conflicts and shared audit capacity. It is not an automatic campaign. User-facing
staging, save, explicit application and reload/discard controls are in
[the UI action audit](UI_ACTION_AUDIT.md); exact test receipts and remaining
whole-release gates remain in [the delivery ledger](PUBLIC_BETA_DELIVERY.md).
