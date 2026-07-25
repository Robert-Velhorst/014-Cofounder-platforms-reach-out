CREATE TABLE `automation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`campaign_id` int,
	`match_id` int,
	`job_type` enum('discover_prospects','send_message','send_connection_request','check_responses','send_followup') NOT NULL,
	`platform` enum('founder_cloud','co_founders_lab','y_combinator') NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`job_data` json,
	`result` json,
	`error_message` text,
	`scheduled_at` timestamp NOT NULL DEFAULT (now()),
	`started_at` timestamp,
	`completed_at` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 3,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`platform` enum('founder_cloud','co_founders_lab','y_combinator') NOT NULL,
	`encrypted_username` text NOT NULL,
	`encrypted_password` text NOT NULL,
	`status` enum('active','invalid','suspended','untested') NOT NULL DEFAULT 'untested',
	`last_tested_at` timestamp,
	`last_used_at` timestamp,
	`last_error` text,
	`encrypted_session_data` text,
	`session_expires_at` timestamp,
	`daily_message_limit` int NOT NULL DEFAULT 5,
	`messages_sent_today` int NOT NULL DEFAULT 0,
	`last_reset_at` timestamp DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `automation_jobs` ADD CONSTRAINT `automation_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automation_jobs` ADD CONSTRAINT `automation_jobs_campaign_id_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automation_jobs` ADD CONSTRAINT `automation_jobs_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platform_credentials` ADD CONSTRAINT `platform_credentials_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;