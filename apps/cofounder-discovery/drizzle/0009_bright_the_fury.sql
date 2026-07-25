ALTER TABLE `users` ADD `email_notifications_enabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_new_matches` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_messages` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `weekly_summary_enabled` int DEFAULT 1 NOT NULL;