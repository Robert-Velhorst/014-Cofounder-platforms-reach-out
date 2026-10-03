CREATE TABLE `login_attempt_quotas` (
	`quota_key` varchar(64) NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `login_attempt_quotas_quota_key` PRIMARY KEY(`quota_key`)
);
--> statement-breakpoint
CREATE INDEX `login_attempt_quotas_expiry_idx` ON `login_attempt_quotas` (`expires_at`);