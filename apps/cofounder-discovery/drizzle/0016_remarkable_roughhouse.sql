ALTER TABLE `matches` ADD `matched_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `conversation_id` int;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;