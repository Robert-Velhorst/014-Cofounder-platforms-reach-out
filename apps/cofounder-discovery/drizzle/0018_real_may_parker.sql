ALTER TABLE `matches` MODIFY COLUMN `status` enum('new','viewed','interested','discovered','queued','approved','rejected','contacted','responded','meeting_scheduled','partnership_formed','no_response','not_interested') DEFAULT 'discovered';--> statement-breakpoint
ALTER TABLE `campaigns` ADD `automation_mode` enum('fully_automatic','semi_automatic','manual') DEFAULT 'semi_automatic';--> statement-breakpoint
ALTER TABLE `campaigns` ADD `daily_match_limit` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `auto_message_enabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `min_compatibility_score` int DEFAULT 70;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `last_run_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD `campaign_id` int;--> statement-breakpoint
ALTER TABLE `matches` ADD `last_scored_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` ADD `approved_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD `rejected_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD `contacted_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD `response_received_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD `meeting_scheduled_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD `partnership_formed_at` timestamp;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_campaign_id_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;