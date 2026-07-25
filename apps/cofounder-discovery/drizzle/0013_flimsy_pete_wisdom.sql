CREATE TABLE `billing_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`total_base_cost` int NOT NULL DEFAULT 0,
	`total_marked_up_cost` int NOT NULL DEFAULT 0,
	`total_usage_count` int NOT NULL DEFAULT 0,
	`status` enum('active','closed','invoiced') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	CONSTRAINT `billing_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_periods_user_id_start_date_unique` UNIQUE(`user_id`,`start_date`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`billing_period_id` int NOT NULL,
	`invoice_number` varchar(50) NOT NULL,
	`subtotal` int NOT NULL,
	`tax` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`issue_date` timestamp NOT NULL,
	`due_date` timestamp NOT NULL,
	`paid_at` timestamp,
	`line_items` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `resource_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`resource_type` enum('llm_api_call','enrichment_linkedin','enrichment_github','enrichment_company','platform_scraping','conversation_starter_generation','semantic_matching','image_generation','voice_transcription') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`token_count` int,
	`base_cost` int NOT NULL,
	`marked_up_cost` int NOT NULL,
	`related_entity_type` varchar(50),
	`related_entity_id` int,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resource_type` varchar(50) NOT NULL,
	`base_cost_per_unit` int NOT NULL,
	`markup` float NOT NULL DEFAULT 2.5,
	`unit_name` varchar(50) NOT NULL,
	`description` text,
	`is_active` int NOT NULL DEFAULT 1,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `usage_pricing_resource_type_unique` UNIQUE(`resource_type`)
);
--> statement-breakpoint
ALTER TABLE `billing_periods` ADD CONSTRAINT `billing_periods_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_billing_period_id_billing_periods_id_fk` FOREIGN KEY (`billing_period_id`) REFERENCES `billing_periods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_usage` ADD CONSTRAINT `resource_usage_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;