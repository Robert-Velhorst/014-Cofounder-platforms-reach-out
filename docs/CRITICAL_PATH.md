# Critical path

1. Register or sign in locally.
2. Import owned/permitted prospect data using bounded CSV.
3. Qualify a prospect; scoring remains explainable and reviewable.
4. Create a template draft. Opted-out prospects are blocked.
5. Submit the draft for review and explicitly approve it.
6. Prepare the manual action. The app rate-limits this step and never clicks or sends.
7. Perform the action on the destination platform outside this app.
8. Confirm the send in the app. The audit trail records that this is user-confirmed,
   not provider-confirmed.
9. Record a response, schedule a follow-up, or close the record.
10. Review owner-scoped analytics, export CSV, or ingest the read-only HAI event feed.

All write transitions are authenticated, owner-scoped, validated against the state
machine, and audited with a request ID.
