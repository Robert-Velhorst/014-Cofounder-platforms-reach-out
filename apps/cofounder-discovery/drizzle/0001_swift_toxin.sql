CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`target_platforms` json,
	`filters` json,
	`message_template` text,
	`prospects_found` int DEFAULT 0,
	`messages_sent` int DEFAULT 0,
	`responses_received` int DEFAULT 0,
	`status` enum('draft','active','paused','completed') DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int NOT NULL,
	`overall_score` int NOT NULL,
	`skills_score` int,
	`industry_score` int,
	`vision_score` int,
	`work_style_score` int,
	`location_score` int,
	`reasoning` text,
	`recommendations` json,
	`success_probability` int,
	`status` enum('new','viewed','contacted','interested','not_interested') DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255),
	`location` varchar(255),
	`bio` text,
	`skills` json,
	`experience` varchar(50),
	`industries` json,
	`looking_for` json,
	`startup_stage` varchar(50),
	`platform` varchar(50),
	`profile_url` varchar(500),
	`imported_at` timestamp NOT NULL DEFAULT (now()),
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`location` varchar(255),
	`timezone` varchar(100),
	`availability` varchar(50),
	`skills` json,
	`experience` varchar(50),
	`industries` json,
	`previous_roles` json,
	`looking_for` json,
	`startup_stage` varchar(50),
	`commitment` varchar(50),
	`target_industries` json,
	`business_model` json,
	`work_style` json,
	`values` json,
	`communication_style` varchar(50),
	`equity_expectation` varchar(50),
	`funding_preference` json,
	`remote_preference` varchar(50),
	`completeness` int DEFAULT 0,
	`is_public` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;