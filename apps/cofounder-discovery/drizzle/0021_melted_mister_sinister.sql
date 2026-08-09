CREATE TABLE `idempotency_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`operation` varchar(100) NOT NULL,
	`idempotency_key` varchar(80) NOT NULL,
	`result` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `idempotency_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `idempotency_records_user_id_operation_idempotency_key_unique` UNIQUE(`user_id`,`operation`,`idempotency_key`)
);
--> statement-breakpoint
ALTER TABLE `idempotency_records` ADD CONSTRAINT `idempotency_records_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idempotency_owner_created_idx` ON `idempotency_records` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_owner_id_idx` ON `audit_events` (`user_id`,`id`);--> statement-breakpoint
CREATE INDEX `audit_owner_created_idx` ON `audit_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `matches_owner_status_score_idx` ON `matches` (`user_id`,`status`,`overall_score`);--> statement-breakpoint
CREATE INDEX `outreach_owner_state_updated_idx` ON `outreach_records` (`user_id`,`state`,`updated_at`);--> statement-breakpoint
CREATE INDEX `prospects_owner_imported_idx` ON `prospects` (`user_id`,`imported_at`);