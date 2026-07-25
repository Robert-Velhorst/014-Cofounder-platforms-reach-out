ALTER TABLE `users` ADD `emailVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `verificationTokenExpiry` timestamp;