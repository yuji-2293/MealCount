PRAGMA defer_foreign_keys=TRUE;
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
INSERT INTO "purchases" ("id","purchase_date","same_day_amount","planned_amount","monthly_amount","purchased_meal_count","created_at","updated_at") VALUES(1,'2026-10-05',2,2,2,2,'2026-10-05T08:32:33.226Z','2026-10-05T08:32:57.424Z');
INSERT INTO "purchases" ("id","purchase_date","same_day_amount","planned_amount","monthly_amount","purchased_meal_count","created_at","updated_at") VALUES(2,'2026-10-05',3,3,3,4,'2026-10-05T08:32:36.041Z','2026-10-05T08:33:23.660Z');
CREATE TABLE `meal_stock` (
	`id` integer PRIMARY KEY NOT NULL,
	`daily_meal_count` integer DEFAULT 3 NOT NULL,
	`current_meal_stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL, `last_calculated_date` text NOT NULL,
	CONSTRAINT "current_meal_stock_nonnegative" CHECK("meal_stock"."current_meal_stock" >= 0),
	CONSTRAINT "daily_meal_count_nonnegative" CHECK("meal_stock"."daily_meal_count" >= 0)
);
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
DELETE FROM sqlite_sequence;
