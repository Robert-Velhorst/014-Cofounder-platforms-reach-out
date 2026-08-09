# Checkpoints

## Current branch

agent/giant-goal-implementation

## Safe resume order

1. Inspect git status and preserve the current changes.
2. Start MySQL with docker compose up -d db.
3. Set the local DATABASE_URL shown in the root README.
4. Run migrations, typecheck, unit tests, integration tests, build, and audit.
5. Rebuild/recreate the app container and verify /api/ready.
6. Complete in-app browser QA at http://localhost:3014.
7. Update FINAL_VERIFICATION_REPORT.md with exact evidence.
8. Commit, push, and open a draft pull request.

Do not enable imported legacy routes or platform automation to make tests pass.
