CREATE TABLE `account_mail_jobs` (
	`id` varchar(36) NOT NULL,
	`quota_key` varchar(64) NOT NULL,
	`kind` enum('password_reset','password_changed') NOT NULL,
	`payload` text,
	`user_id` int,
	`state` enum('queued','sending','accepted','discarded','failed') NOT NULL DEFAULT 'queued',
	`available_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`lease_until` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`provider_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_mail_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `account_mail_quotas` (
	`quota_key` varchar(64) NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `account_mail_quotas_quota_key` PRIMARY KEY(`quota_key`)
);
--> statement-breakpoint
ALTER TABLE `account_mail_jobs` ADD CONSTRAINT `account_mail_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_mail_jobs_ready_idx` ON `account_mail_jobs` (`state`,`available_at`);--> statement-breakpoint
CREATE INDEX `account_mail_jobs_quota_idx` ON `account_mail_jobs` (`quota_key`);--> statement-breakpoint
CREATE INDEX `account_mail_quotas_expiry_idx` ON `account_mail_quotas` (`expires_at`);