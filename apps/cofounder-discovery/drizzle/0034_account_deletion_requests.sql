CREATE TABLE `account_deletion_requests` (
	`user_id` int NOT NULL,
	`request_key` varchar(36),
	`status` enum('none','pending_review','withdrawn') NOT NULL DEFAULT 'none',
	`revision` int NOT NULL DEFAULT 0,
	`requested_at` timestamp,
	`withdrawn_at` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`attempt_window_expires_at` timestamp NOT NULL,
	CONSTRAINT `account_deletion_requests_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `account_deletion_requests` ADD CONSTRAINT `account_deletion_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;