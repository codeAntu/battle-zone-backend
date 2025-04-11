CREATE TABLE `admin` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationCode` varchar(255) NOT NULL,
	`verificationCodeExpires` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `deposit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deposit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tournamentId` int NOT NULL,
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournament_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`game` enum('PUBG','FREEFIRE') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255),
	`roomId` varchar(255) DEFAULT '0',
	`entryFee` int NOT NULL,
	`prize` int NOT NULL,
	`perKillPrize` int NOT NULL,
	`maxParticipants` int NOT NULL,
	`currentParticipants` int NOT NULL DEFAULT 0,
	`scheduledAt` datetime NOT NULL,
	`isEnded` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `entry_fee_non_negative` CHECK(`tournaments`.`entryFee` >= 0),
	CONSTRAINT `prize_non_negative` CHECK(`tournaments`.`prize` >= 0),
	CONSTRAINT `per_kill_prize_non_negative` CHECK(`tournaments`.`perKillPrize` >= 0),
	CONSTRAINT `current_participants_non_negative` CHECK(`tournaments`.`currentParticipants` >= 0),
	CONSTRAINT `current_participants_max` CHECK(`tournaments`.`currentParticipants` <= `tournaments`.`maxParticipants`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT '',
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationCode` varchar(255) NOT NULL,
	`verificationCodeExpires` datetime NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `balance_non_negative` CHECK(`users`.`balance` >= 0)
);
--> statement-breakpoint
CREATE TABLE `winnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tournamentId` int NOT NULL,
	`amount` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `winnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdraw_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`withdrawId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdraw_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdraw` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tournamentId` int NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdraw_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `deposit` ADD CONSTRAINT `deposit_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tournament_participants` ADD CONSTRAINT `tournament_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournament_participants` ADD CONSTRAINT `tournament_participants_tournamentId_tournaments_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_adminId_admin_id_fk` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `winnings` ADD CONSTRAINT `winnings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `winnings` ADD CONSTRAINT `winnings_tournamentId_tournaments_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdraw_history` ADD CONSTRAINT `withdraw_history_adminId_admin_id_fk` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdraw_history` ADD CONSTRAINT `withdraw_history_withdrawId_withdraw_id_fk` FOREIGN KEY (`withdrawId`) REFERENCES `withdraw`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdraw` ADD CONSTRAINT `withdraw_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdraw` ADD CONSTRAINT `withdraw_tournamentId_tournaments_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE no action ON UPDATE no action;