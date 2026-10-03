-- Change only the default; preserve all existing visibility values and rows.
ALTER TABLE `user_profiles` ALTER COLUMN `is_public` SET DEFAULT false;
