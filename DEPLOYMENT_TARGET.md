

# Deployment target

The concrete stack, preparation, staging, migration and rollback handoff is in
[the Hetzner deployment guide](docs/HETZNER_DEPLOYMENT.md). Its checks and files do
not themselves establish a public deployment or approve a purchase/cutover.

Hetzner is the target for production deployment. New production deployments must be prepared for Hetzner. Existing production services must be inventoried and migrated to Hetzner before retirement; do not claim a migration or cutover until the running service, data, secrets, security controls, backups, and rollback path have been verified.

Preserve local development and test tooling when it is still needed, but do not use platforms other than Hetzner for new production deployments. Document the Hetzner architecture, required infrastructure, deployment steps, data and database migration, DNS/TLS, secrets, monitoring, backups, and rollback in the project deployment guide before cutover. Keep credentials and private data out of this file.
