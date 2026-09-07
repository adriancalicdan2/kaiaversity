CREATE TABLE `featured_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`video_id` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`score` real NOT NULL,
	`passed` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_stream_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`video_id` text NOT NULL,
	`one_minute_awarded` integer DEFAULT false NOT NULL,
	`completed_awarded` integer DEFAULT false NOT NULL,
	`one_minute_awarded_at` integer,
	`completed_awarded_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_stream_rewards_user_video_unique` ON `user_stream_rewards` (`user_id`,`video_id`);