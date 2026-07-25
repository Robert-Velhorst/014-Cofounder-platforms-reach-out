CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prospectId` int NOT NULL,
	`matchId` int,
	`lastMessageAt` timestamp,
	`unreadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`matchId` int,
	`subject` varchar(255),
	`body` text NOT NULL,
	`status` enum('draft','sent','delivered','read') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_prospectId_prospects_id_fk` FOREIGN KEY (`prospectId`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;