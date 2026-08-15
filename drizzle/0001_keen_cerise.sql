CREATE TABLE `alert_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int,
	`alertType` enum('free_time_expiry','demurrage_risk','lc_expiry','eta_overdue','document_missing','info') DEFAULT 'info',
	`title` varchar(300) NOT NULL,
	`message` text,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`read` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bank_lc` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`bankName` varchar(200),
	`paymentType` enum('lc','lc_at_sight','lc_90days','lc_120days','tt','cash_against_documents') DEFAULT 'lc',
	`lcNumber` varchar(100),
	`amount` double DEFAULT 0,
	`currency` varchar(10) DEFAULT 'USD',
	`status` enum('pending_application','submitted_to_bank','issued','amendment','documents_presented','accepted','paid','closed','rejected') DEFAULT 'pending_application',
	`applicationDate` timestamp,
	`issuanceDate` timestamp,
	`expiryDate` timestamp,
	`documentsArrivalDate` timestamp,
	`paymentDate` timestamp,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_lc_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doc_check` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`docName` varchar(200),
	`docType` enum('commercial_invoice','bill_of_lading','certificate_of_origin','packing_list') DEFAULT 'commercial_invoice',
	`fieldName` varchar(200),
	`expectedValue` text,
	`actualValue` text,
	`matches` enum('match','mismatch','missing','pending_review') DEFAULT 'pending_review',
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`resolved` enum('yes','no') DEFAULT 'no',
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doc_check_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `shipments` ADD `freeTimeDays` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `shipments` ADD `arrivalDate` timestamp;--> statement-breakpoint
ALTER TABLE `shipments` ADD `freeTimeExpiry` timestamp;