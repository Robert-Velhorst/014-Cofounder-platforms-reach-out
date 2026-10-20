CREATE TABLE `workspace_presets` (
  `user_id` int NOT NULL,
  `revision` int NOT NULL,
  `settings` json NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `workspace_presets_user_id` PRIMARY KEY (`user_id`),
  CONSTRAINT `workspace_presets_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
