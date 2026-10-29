PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meal_stock` (
	`id` integer PRIMARY KEY NOT NULL,
	`daily_meal_count` integer DEFAULT 3 NOT NULL,
	`current_meal_stock` integer DEFAULT 0 NOT NULL,
	`last_calculated_date` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "current_meal_stock_nonnegative" CHECK("__new_meal_stock"."current_meal_stock" >= 0),
	CONSTRAINT "daily_meal_count_nonnegative" CHECK("__new_meal_stock"."daily_meal_count" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_meal_stock`("id", "daily_meal_count", "current_meal_stock", "last_calculated_date", "updated_at", "user_id") SELECT "id", "daily_meal_count", "current_meal_stock", "last_calculated_date", "updated_at", "user_id" FROM `meal_stock`;--> statement-breakpoint
DROP TABLE `meal_stock`;--> statement-breakpoint
ALTER TABLE `__new_meal_stock` RENAME TO `meal_stock`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `meal_stock_user_id_unique` ON `meal_stock` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_purchases` (
	`id` integer PRIMARY KEY NOT NULL,
	`purchase_date` text NOT NULL,
	`same_day_amount` integer NOT NULL,
	`planned_amount` integer NOT NULL,
	`monthly_amount` integer NOT NULL,
	`purchased_meal_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "amount_nonnegative_check" CHECK("__new_purchases"."same_day_amount" >= 0 AND "__new_purchases"."planned_amount" >= 0 AND "__new_purchases"."monthly_amount" >= 0),
	CONSTRAINT "meal_count_positive_check" CHECK("__new_purchases"."purchased_meal_count" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_purchases`("id", "purchase_date", "same_day_amount", "planned_amount", "monthly_amount", "purchased_meal_count", "created_at", "updated_at", "user_id") SELECT "id", "purchase_date", "same_day_amount", "planned_amount", "monthly_amount", "purchased_meal_count", "created_at", "updated_at", "user_id" FROM `purchases`;--> statement-breakpoint
DROP TABLE `purchases`;--> statement-breakpoint
ALTER TABLE `__new_purchases` RENAME TO `purchases`;