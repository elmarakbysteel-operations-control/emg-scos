CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventKey` varchar(80) NOT NULL,
	`enabled` enum('yes','no') NOT NULL DEFAULT 'yes',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
