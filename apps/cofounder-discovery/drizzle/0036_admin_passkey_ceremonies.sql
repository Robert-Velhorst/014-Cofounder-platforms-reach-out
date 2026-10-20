CREATE TABLE `admin_mfa_state` (
	`user_id` int NOT NULL,
	`user_handle` varchar(86) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`attempt_window_expires_at` timestamp NOT NULL,
	`bootstrap_digest` varchar(64),
	`bootstrap_expires_at` timestamp,
	`challenge_id` varchar(36),
	`challenge` varchar(43),
	`purpose` enum('bootstrap','enroll','authenticate'),
	`session_digest` varchar(64),
	`origin` varchar(512),
	`challenge_expires_at` timestamp,
	CONSTRAINT `admin_mfa_state_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `admin_passkeys` (
	`key_id` varchar(36) NOT NULL,
	`credential_digest` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`credential_id` text NOT NULL,
	`public_key` text NOT NULL,
	`counter` int unsigned NOT NULL DEFAULT 0,
	`label` varchar(80) NOT NULL,
	`transports` json,
	`device_type` varchar(16) NOT NULL,
	`backed_up` boolean NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_used_at` timestamp,
	CONSTRAINT `admin_passkeys_key_id` PRIMARY KEY(`key_id`),
	CONSTRAINT `admin_passkeys_credential_digest_unique` UNIQUE(`credential_digest`)
);
--> statement-breakpoint
ALTER TABLE `account_sessions` ADD `admin_verified_until` timestamp;--> statement-breakpoint
ALTER TABLE `admin_mfa_state` ADD CONSTRAINT `admin_mfa_state_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_passkeys` ADD CONSTRAINT `admin_passkeys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_passkeys_owner_idx` ON `admin_passkeys` (`user_id`);