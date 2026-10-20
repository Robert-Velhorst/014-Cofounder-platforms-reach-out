CREATE TABLE `account_export_quotas` (
	`user_id` int NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `account_export_quotas_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `account_export_quotas` ADD CONSTRAINT `account_export_quotas_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;