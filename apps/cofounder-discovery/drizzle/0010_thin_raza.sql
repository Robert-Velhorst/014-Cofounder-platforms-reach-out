ALTER TABLE `messages` ADD `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `prospect_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `content` text NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `respondedAt` timestamp;--> statement-breakpoint
ALTER TABLE `messages` ADD `is_follow_up` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `parent_message_id` int;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;