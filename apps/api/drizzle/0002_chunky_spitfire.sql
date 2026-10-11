ALTER TABLE `meal_stock` ADD `last_calculated_date` text NOT NULL;--> statement-breakpoint
ALTER TABLE `meal_stock` DROP COLUMN `last_calculated_at`;