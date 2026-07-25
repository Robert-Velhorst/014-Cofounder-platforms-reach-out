CREATE TABLE `ai_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`activity_type` varchar(100) NOT NULL,
	`activity_description` text NOT NULL,
	`match_id` int,
	`campaign_id` int,
	`ai_decision` text,
	`outcome` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`match_id` int NOT NULL,
	`message_type` enum('first_contact','follow_up','meeting_request') NOT NULL,
	`message_content` text NOT NULL,
	`platform` varchar(50) NOT NULL,
	`ai_reasoning` text,
	`status` enum('pending','approved','rejected','sent') NOT NULL DEFAULT 'pending',
	`reviewed_at` timestamp,
	`sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardrails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`rule_type` varchar(100) NOT NULL,
	`rule_name` varchar(255) NOT NULL,
	`rule_config` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`triggered_count` int NOT NULL DEFAULT 0,
	`last_triggered` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guardrails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`match_id` int NOT NULL,
	`response_likelihood` float NOT NULL,
	`engagement_score` float NOT NULL,
	`priority_rank` int NOT NULL,
	`factors` text NOT NULL,
	`predicted` boolean NOT NULL DEFAULT true,
	`actual_response` boolean,
	`prediction_accurate` boolean,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`match_id` int NOT NULL,
	`stage` enum('cold','contacted','responded','meeting','partnership','not_interested') NOT NULL,
	`entered_at` timestamp NOT NULL DEFAULT (now()),
	`exited_at` timestamp,
	`notes` text,
	CONSTRAINT `pipeline_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospect_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`match_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospect_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospect_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`match_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`due_date` timestamp,
	`completed` boolean NOT NULL DEFAULT false,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospect_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stage_transitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`match_id` int NOT NULL,
	`from_stage` enum('cold','contacted','responded','meeting','partnership','not_interested'),
	`to_stage` enum('cold','contacted','responded','meeting','partnership','not_interested') NOT NULL,
	`reason` varchar(255),
	`automated` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stage_transitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`preference_type` varchar(100) NOT NULL,
	`preference_key` varchar(255) NOT NULL,
	`weight` float NOT NULL DEFAULT 1,
	`confidence` float NOT NULL DEFAULT 0.5,
	`accept_count` int NOT NULL DEFAULT 0,
	`reject_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_user_id_preference_type_preference_key_unique` UNIQUE(`user_id`,`preference_type`,`preference_key`)
);
--> statement-breakpoint
ALTER TABLE `ai_activity_log` ADD CONSTRAINT `ai_activity_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_activity_log` ADD CONSTRAINT `ai_activity_log_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_activity_log` ADD CONSTRAINT `ai_activity_log_campaign_id_campaigns_id_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_queue` ADD CONSTRAINT `approval_queue_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_queue` ADD CONSTRAINT `approval_queue_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guardrails` ADD CONSTRAINT `guardrails_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_scores` ADD CONSTRAINT `lead_scores_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD CONSTRAINT `pipeline_stages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD CONSTRAINT `pipeline_stages_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prospect_notes` ADD CONSTRAINT `prospect_notes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prospect_notes` ADD CONSTRAINT `prospect_notes_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prospect_tasks` ADD CONSTRAINT `prospect_tasks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prospect_tasks` ADD CONSTRAINT `prospect_tasks_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stage_transitions` ADD CONSTRAINT `stage_transitions_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;