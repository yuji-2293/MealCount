CREATE TABLE `meal_stock` (
	`id` integer PRIMARY KEY NOT NULL,
	`daily_meal_count` integer DEFAULT 3 NOT NULL,
	`current_meal_stock` integer DEFAULT 0 NOT NULL,
	`last_calculated_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "current_meal_stock_nonnegative" CHECK("meal_stock"."current_meal_stock" >= 0),
	CONSTRAINT "daily_meal_count_nonnegative" CHECK("meal_stock"."daily_meal_count" >= 0)
);
