CREATE TABLE `saved_searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`skills` json,
	`industries` json,
	`location` varchar(255),
	`experience` varchar(50),
	`startup_stage` varchar(50),
	`commitment` varchar(50),
	`remote_preference` varchar(50),
	`min_compatibility_score` int DEFAULT 70,
	`notifications_enabled` int NOT NULL DEFAULT 1,
	`email_notifications` int NOT NULL DEFAULT 1,
	`is_active` int NOT NULL DEFAULT 1,
	`lastChecked` timestamp,
	`match_count` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;