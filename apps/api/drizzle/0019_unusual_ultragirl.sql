CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` text,
	`refreshTokenExpiresAt` text,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);

CREATE TABLE `meal_stock` (
	`id` integer PRIMARY KEY NOT NULL,
	`daily_meal_count` integer DEFAULT 3 NOT NULL,
	`current_meal_stock` integer DEFAULT 0 NOT NULL,
	`last_calculated_date` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "current_meal_stock_nonnegative" CHECK("current_meal_stock" >= 0),
	CONSTRAINT "daily_meal_count_nonnegative" CHECK("daily_meal_count" >= 0)
);
CREATE UNIQUE INDEX `meal_stock_userId_unique` ON `meal_stock` (`userId`);--> statement-breakpoint

CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY NOT NULL,
	`purchase_date` text NOT NULL,
	`same_day_amount` integer NOT NULL,
	`planned_amount` integer NOT NULL,
	`monthly_amount` integer NOT NULL,
	`purchased_meal_count` integer NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "amount_nonnegative_check" CHECK("purchases"."same_day_amount" >= 0 AND "purchases"."planned_amount" >= 0 AND "purchases"."monthly_amount" >= 0),
	CONSTRAINT "meal_count_positive_check" CHECK("purchases"."purchased_meal_count" > 0)
);
