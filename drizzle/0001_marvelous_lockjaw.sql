CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(500),
	`icon` varchar(255),
	`thumbnail` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `tournaments` RENAME COLUMN `game` TO `gameName`;--> statement-breakpoint
ALTER TABLE `tournaments` MODIFY COLUMN `gameName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_gameName_games_name_fk` FOREIGN KEY (`gameName`) REFERENCES `games`(`name`) ON DELETE no action ON UPDATE no action;