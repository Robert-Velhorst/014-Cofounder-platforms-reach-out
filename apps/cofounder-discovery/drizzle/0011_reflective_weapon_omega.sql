CREATE TABLE `timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int NOT NULL,
	`type` enum('message_sent','message_received','message_opened','follow_up_sent','meeting_scheduled','meeting_completed','partnership_formed','partnership_declined','note_added') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`metadata` text,
	`message_id` int,
	`campaign_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeline_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_campaign_id_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;