CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY NOT NULL,
	`purchase_date` text NOT NULL,
	`same_day_amount` integer NOT NULL,
	`planned_amount` integer NOT NULL,
	`monthly_amount` integer NOT NULL,
	`purchased_meal_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "amount_nonnegative_check" CHECK("purchases"."same_day_amount" >= 0 AND "purchases"."planned_amount" >= 0 AND "purchases"."monthly_amount" >= 0),
	CONSTRAINT "meal_count_positive_check" CHECK("purchases"."purchased_meal_count" > 0)
);
