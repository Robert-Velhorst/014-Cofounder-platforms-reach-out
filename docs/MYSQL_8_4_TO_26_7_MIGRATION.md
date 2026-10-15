# MySQL 8.4 to 26.7 upgrade

The Compose stack now uses the official MySQL 26.7.0 image, pinned to its multi-platform manifest digest. MySQL 26.7.0 is an Innovation release and is production-grade, but it cannot directly open an 8.4 data directory. MySQL's supported path is 8.4 LTS → 9.7 LTS → 26.7.0. The newest official Docker image available for the 26.7 line is 26.7.0; do not substitute an unpublished tag. Do not skip the 9.7 step.

This guide describes an operator-controlled migration. It does not run during application startup. Use a maintenance window and rehearse the full procedure on a restored copy before changing a live database.

1. Stop application and worker writes. Take an encrypted backup outside the host, then verify that the backup can be restored into an isolated database. Keep the original named volume untouched.
2. Run MySQL Shell's upgrade checker against the source and review the results for both target releases. Resolve blockers before proceeding.
3. Create a separate 9.7 LTS instance and an empty data volume. Migrate a copy of the 8.4 database to MySQL 9.7.2 using a supported logical dump and load or another method listed in MySQL's upgrade documentation. Do not reuse the 8.4 data directory as the 9.7 directory.
4. Verify the 9.7 copy: apply the application's committed Drizzle migrations, compare expected schema and representative row counts, and run the application against that copy. Take and verify a new backup from 9.7.
5. Create a separate MySQL 26.7.0 instance and empty data volume. Migrate the verified 9.7 copy to 26.7.0 using a supported method. Keep the 9.7 instance and its backup until the 26.7 database passes the same schema, application, and restore checks.
6. Only after verification, update the production database endpoint and resume writes. Keep the original 8.4 volume and backups offline through the agreed recovery window. Never attempt to downgrade a 26.7 data directory by starting an older server against it.

For MySQL's release model and exact upgrade-path rules, see the [MySQL release model](https://dev.mysql.com/doc/refman/26.7/en/mysql-releases.html), [upgrade paths](https://dev.mysql.com/doc/refman/26.7/en/upgrade-paths.html), and [Docker image](https://hub.docker.com/_/mysql).