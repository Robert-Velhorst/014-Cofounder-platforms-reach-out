CREATE TABLE `conversation_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int NOT NULL,
	`message_id` int,
	`tone` enum('professional','friendly','enthusiastic','casual'),
	`focus_area` enum('skills','industry','project','experience','shared_interest'),
	`message_length` int,
	`has_question` int DEFAULT 0,
	`has_personalization` int DEFAULT 0,
	`sent_at` timestamp NOT NULL,
	`responded_at` timestamp,
	`response_time` int,
	`response_quality` enum('positive','neutral','negative'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ml_model_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(50) NOT NULL,
	`model_type` varchar(50) NOT NULL,
	`accuracy` float,
	`precision_score` float,
	`recall_score` float,
	`f1_score` float,
	`training_samples` int,
	`features` text,
	`hyperparameters` text,
	`is_active` int NOT NULL DEFAULT 0,
	`deployed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ml_model_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ml_model_versions_version_unique` UNIQUE(`version`)
);
--> statement-breakpoint
CREATE TABLE `partnership_outcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prospect_id` int NOT NULL,
	`match_id` int NOT NULL,
	`outcome` enum('partnership_formed','still_talking','not_interested','no_response','timing_not_right') NOT NULL,
	`outcome_date` timestamp,
	`notes` text,
	`total_messages` int DEFAULT 0,
	`total_meetings` int DEFAULT 0,
	`days_to_outcome` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnership_outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prospect_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`hour_of_day` int NOT NULL,
	`response_count` int NOT NULL DEFAULT 0,
	`total_sent` int NOT NULL DEFAULT 0,
	`avg_response_time` int,
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_patterns_id` PRIMARY KEY(`id`),
	CONSTRAINT `response_patterns_prospect_id_day_of_week_hour_of_day_unique` UNIQUE(`prospect_id`,`day_of_week`,`hour_of_day`)
);
--> statement-breakpoint
ALTER TABLE `conversation_analytics` ADD CONSTRAINT `conversation_analytics_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_analytics` ADD CONSTRAINT `conversation_analytics_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_analytics` ADD CONSTRAINT `conversation_analytics_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnership_outcomes` ADD CONSTRAINT `partnership_outcomes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnership_outcomes` ADD CONSTRAINT `partnership_outcomes_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnership_outcomes` ADD CONSTRAINT `partnership_outcomes_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `response_patterns` ADD CONSTRAINT `response_patterns_prospect_id_prospects_id_fk` FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE no action ON UPDATE no action;