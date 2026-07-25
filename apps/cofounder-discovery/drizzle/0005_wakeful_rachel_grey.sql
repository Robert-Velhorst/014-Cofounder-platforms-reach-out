ALTER TABLE `saved_searches` ADD `funding_stage` json;--> statement-breakpoint
ALTER TABLE `saved_searches` ADD `team_size_min` int;--> statement-breakpoint
ALTER TABLE `saved_searches` ADD `team_size_max` int;--> statement-breakpoint
ALTER TABLE `saved_searches` ADD `equity_split_preference` varchar(100);