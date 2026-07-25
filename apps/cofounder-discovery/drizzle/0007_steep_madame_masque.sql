ALTER TABLE `users` ADD `linkedin_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedin_access_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `linkedin_refresh_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `linkedin_token_expiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `linkedin_connected_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `github_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `github_access_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `github_username` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `github_connected_at` timestamp;