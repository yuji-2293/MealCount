CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `meal_stock` ADD `user_id` integer REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `purchases` ADD `user_id` integer REFERENCES user(id);