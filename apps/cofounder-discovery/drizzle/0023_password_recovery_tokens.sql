ALTER TABLE `users` ADD `password_reset_token` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `password_reset_token_expiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_password_reset_token_unique` UNIQUE(`password_reset_token`);