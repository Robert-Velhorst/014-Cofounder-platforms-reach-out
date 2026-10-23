# MySQL 26.10 deployment qualification

The deployment target is MySQL 26.10.0, pinned to the official image digest. A configuration change or green CI run is not proof that an existing database can be upgraded or safely recovered.

Before changing an existing data directory:

1. Record the actual server version, compatibility lineage, architecture, database sizes and application migration state. Repository pins do not establish what is running.
2. Read the official upgrade rules and run MySQL Shell's Upgrade Checker for the actual source and target. Sequential releases must pass through MySQL 9.7 LTS before entering the calendar-versioned lineage; do not mount an 8.4 data directory directly under 26.10.
3. Take a consistent application backup plus database dump, checksums and required encryption material. Preserve the original volume and runtime artifact. Keep backup files and credentials outside Git.
4. Restore into a separate isolated environment, rehearse the supported upgrade sequence, apply tracked application migrations, and reconcile row counts, schema, constraints and representative data. Exercise application reads/writes, authentication, jobs and backup/restore.
5. Record acceptance and rollback evidence for the actual source copy before a separately authorized cutover. Do not treat starting the newer image against a production volume as an upgrade rehearsal.

Rollback must use the preserved original database/backup with the compatible old runtime; do not point an older server at a data directory already upgraded by a newer server. No live migration is performed by this PR.

Official references: [MySQL 26.10.0 release](https://dev.mysql.com/doc/relnotes/mysql/26.10/en/news-26-10-0.html), [upgrade paths and compatibility lineages](https://dev.mysql.com/doc/refman/26.10/en/upgrade-paths.html).

## Local synthetic rehearsal — 23 October 2026

A disposable, network-disabled local Docker Desktop rehearsal upgraded the exact pinned MySQL 26.7.0 image to the pinned 26.10.0 image. Two synthetic tables retained Unicode text, JSON, fixed-precision decimal values, microsecond timestamps and binary content. A pre-upgrade logical dump exported BLOBs in hexadecimal form; byte-preserving restore into a separate database on 26.10.0 reproduced those records and the foreign-key definition. The uniquely labelled test containers and volume were removed after recording the result; real database volumes were not used.

Application migrations, representative production datasets, operational load and recovery using real backups still require qualification before cutover.
