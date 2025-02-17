CREATE TABLE `features` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by_id` text NOT NULL,
	`updated_by_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by_id` text NOT NULL,
	`updated_by_id` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`session_data` text NOT NULL,
	`request_info` text NOT NULL,
	`expires_at` integer NOT NULL,
	`active` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`last_updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`avatar` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`tester` integer NOT NULL,
	`super_admin` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by_id` text,
	`updated_by_id` text,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `users` 
    (id, avatar, first_name, last_name, email, hashed_password, tester, super_admin, created_at, updated_at, created_by_id, updated_by_id)
VALUES
    ('0000-0000-0000-0000', '', 'System', 'Administrator', 'denver02.james14@gmail.com', '$2a$10$Vkngx8aWEOE3k0mNuae2UObdz3D5sGHPcn3NTL4bFehcnKxU5sPCm', 0, 1, unixepoch(), unixepoch(), '0000-0000-0000-0000', '0000-0000-0000-0000');


--> statement-breakpoint
INSERT INTO `features` 
    (id, created_at, created_by_id, updated_at, updated_by_id, name, status)
VALUES
    ('feat_0001', unixepoch(), '0000-0000-0000-0000', unixepoch(), '0000-0000-0000-0000', 'login', 'on');
