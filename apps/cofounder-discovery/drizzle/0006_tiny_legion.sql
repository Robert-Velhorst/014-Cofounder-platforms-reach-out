ALTER TABLE `prospects` ADD `enrichment_score` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospects` ADD `last_enriched` timestamp;--> statement-breakpoint
ALTER TABLE `prospects` ADD `linkedin_data` json;--> statement-breakpoint
ALTER TABLE `prospects` ADD `github_data` json;--> statement-breakpoint
ALTER TABLE `prospects` ADD `company_data` json;