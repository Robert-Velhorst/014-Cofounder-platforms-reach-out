CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`request_id` varchar(64) NOT NULL,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(64),
	`entity_id` varchar(64),
	`outcome` enum('success','rejected','failed') NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outreach_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int NOT NULL,
	`match_id` int,
	`subject` varchar(255),
	`body` text NOT NULL,
	`state` enum('draft','pending_review','approved','manual_action_required','confirmed_sent','responded','follow_up_due','closed','cancelled') NOT NULL DEFAULT 'draft',
	`generation_mode` enum('template','ai') NOT NULL DEFAULT 'template',
	`destination_url` varchar(1000),
	`idempotency_key` varchar(80) NOT NULL,
	`external_reference` varchar(500),
	`review_notes` text,
	`approved_at` timestamp,
	`confirmed_sent_at` timestamp,
	`response_recorded_at` timestamp,
	`follow_up_at` timestamp,
	`closed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outreach_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `outreach_records_user_id_idempotency_key_unique` UNIQUE(`user_id`,`idempotency_key`)
);
--> statement-breakpoint
ALTER TABLE `prospects` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `prospects` ADD `source_kind` enum('manual','csv','provider') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `prospects` ADD `consent_status` enum('unknown','legitimate_interest','opted_in','opted_out') DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `prospects` ADD `archived_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_user_id_profile_url_unique` UNIQUE(`user_id`,`profile_url`);--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outreach_records` ADD CONSTRAINT `outreach_records_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outreach_records` ADD CONSTRAINT `outreach_records_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outreach_records` ADD CONSTRAINT `outreach_records_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;