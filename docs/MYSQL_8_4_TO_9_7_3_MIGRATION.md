# MySQL 8.4 to 9.7.3 LTS upgrade

This historical checklist targets MySQL 9.7.3. The current Compose and CI stack instead pin MySQL 26.7.0; this checklist is not acceptance evidence for migrating to that version. MySQL 9.7 is the next LTS series after MySQL 8.4. The official upgrade guidance supports upgrading from 8.4 LTS to 9.7 LTS; use MySQL Shell's Upgrade Checker and rehearse against a restored copy before changing any persistent database.

This guide describes an operator-controlled migration. It does not run during application startup or deploy a database to Hetzner.

1. Stop application and worker writes. Take an encrypted backup outside the host, then restore it into an isolated database and verify the restore.
2. Run MySQL Shell's Upgrade Checker against the restored 8.4 database, targeting 9.7.3. Resolve reported blockers and review the 9.7 upgrade notes before proceeding.
3. Create a separate MySQL 9.7.3 instance with a new empty data volume. Migrate the verified copy using a supported method, such as a logical dump and load. Keep the original 8.4 volume untouched for rollback.
4. Verify the 9.7.3 database: confirm the Drizzle migration journal and expected schema, compare representative row counts, run the application against the copy, and take and verify a new backup.
5. Only after operator review and acceptance, update the database endpoint and resume writes. Keep the original 8.4 volume and backups offline through the agreed recovery window. Do not start an older server against a 9.7 data directory.

References: [MySQL 9.7.3 release notes](https://dev.mysql.com/doc/relnotes/mysql/9.7/en/news-9-7-3.html), [MySQL 9.7 upgrade paths](https://dev.mysql.com/doc/refman/9.7/en/upgrade-paths.html), and [Oracle's MySQL Community Server container documentation](https://dev.mysql.com/doc/refman/9.7/en/docker-mysql-getting-started.html).
