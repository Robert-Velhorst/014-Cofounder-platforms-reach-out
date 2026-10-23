-- Additive and nullable: existing data remains unchanged and unverified.
-- Forward rollback: retain the column and stop new imports; do not erase evidence.
ALTER TABLE `prospects` ADD `import_provenance` json;
