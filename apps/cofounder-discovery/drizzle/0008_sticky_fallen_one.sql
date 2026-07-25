CREATE TABLE `conversation_starters_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int NOT NULL,
	`message` text NOT NULL,
	`tone` varchar(50) NOT NULL,
	`focus_area` varchar(100) NOT NULL,
	`reasoning` text,
	`was_copied` int NOT NULL DEFAULT 0,
	`was_used` int NOT NULL DEFAULT 0,
	`copied_at` timestamp,
	`used_at` timestamp,
	`compatibility_score` int,
	`enrichment_score` int,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_starters_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `success_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int,
	`campaign_id` int,
	`metric_type` enum('message_sent','message_responded','meeting_scheduled','meeting_completed','partnership_formed','partnership_failed') NOT NULL,
	`notes` text,
	`value` int,
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `success_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversation_starters_history` ADD CONSTRAINT `conversation_starters_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_starters_history` ADD CONSTRAINT `conversation_starters_history_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `success_metrics` ADD CONSTRAINT `success_metrics_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `success_metrics` ADD CONSTRAINT `success_metrics_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `success_metrics` ADD CONSTRAINT `success_metrics_campaign_id_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;