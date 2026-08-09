CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(200) NOT NULL,
	`module` varchar(100),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`code` varchar(50),
	`address` text,
	`phone` varchar(50),
	`email` varchar(320),
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int,
	`freightCost` double DEFAULT 0,
	`insuranceCost` double DEFAULT 0,
	`customsCost` double DEFAULT 0,
	`transportationCost` double DEFAULT 0,
	`storageCost` double DEFAULT 0,
	`demurrageCost` double DEFAULT 0,
	`detentionCost` double DEFAULT 0,
	`handlingCost` double DEFAULT 0,
	`otherCharges` double DEFAULT 0,
	`budget` double DEFAULT 0,
	`currency` varchar(10) DEFAULT 'USD',
	`totalCost` double DEFAULT 0,
	`landedCost` double DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int,
	`acidNumber` varchar(50),
	`ucrNumber` varchar(100),
	`declarationNumber` varchar(100),
	`broker` varchar(200),
	`arrivalDate` timestamp,
	`inspectionDate` timestamp,
	`releaseDate` timestamp,
	`clearanceTime` int,
	`status` enum('pending_acid','acid_issued','arrived','under_inspection','released','cleared') DEFAULT 'pending_acid',
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`companyId` int DEFAULT 0,
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int,
	`docType` enum('commercial_invoice','packing_list','certificate_of_origin','bill_of_lading','air_waybill','insurance','msds','coa','inspection_cert','other') DEFAULT 'commercial_invoice',
	`fileName` varchar(300),
	`fileUrl` text,
	`uploadDate` timestamp,
	`version` varchar(20) DEFAULT '1.0',
	`status` enum('pending','uploaded','verified','rejected','missing') DEFAULT 'pending',
	`expiryDate` timestamp,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`category` varchar(100),
	`subject` text,
	`body` text,
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `freight` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int,
	`bookingRef` varchar(100),
	`shippingLine` varchar(200),
	`forwarderName` varchar(200),
	`airline` varchar(200),
	`containerType` varchar(50),
	`containerNo` varchar(100),
	`originPort` varchar(100),
	`destinationPort` varchar(100),
	`transitTime` int,
	`freightCost` double,
	`currency` varchar(10) DEFAULT 'USD',
	`blNumber` varchar(100),
	`etd` timestamp,
	`eta` timestamp,
	`status` enum('quotation','booked','in_transit','arrived','delayed') DEFAULT 'booked',
	`delayDays` int DEFAULT 0,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `freight_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`category` varchar(100),
	`content` text NOT NULL,
	`orderIndex` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`companyId` int DEFAULT 0,
	`address` text,
	`phone` varchar(50),
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prNumber` varchar(100),
	`poNumber` varchar(100),
	`supplierId` int,
	`supplierName` varchar(200),
	`material` varchar(300),
	`quantity` double,
	`unit` varchar(50),
	`unitPrice` double,
	`totalValue` double,
	`currency` varchar(10) DEFAULT 'USD',
	`requestedDeliveryDate` timestamp,
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`status` enum('rfq_sent','quotation_received','under_review','approved','po_issued','shipped','received','rejected') DEFAULT 'rfq_sent',
	`approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`rfqDate` timestamp,
	`quotationDate` timestamp,
	`poDate` timestamp,
	`shipmentId` int,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procurement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100),
	`key` varchar(200) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentNo` varchar(50) NOT NULL,
	`companyId` int DEFAULT 0,
	`plantId` int DEFAULT 0,
	`supplierName` varchar(200),
	`poNumber` varchar(100),
	`material` varchar(300),
	`incoterm` varchar(50),
	`originCountry` varchar(100),
	`originPort` varchar(100),
	`destinationCountry` varchar(100),
	`destinationPort` varchar(100),
	`transportMode` enum('sea','air','land','rail'),
	`forwarderName` varchar(200),
	`shippingLine` varchar(200),
	`bookingRef` varchar(100),
	`containerNo` varchar(100),
	`containerType` varchar(50),
	`blAwbNumber` varchar(100),
	`etd` timestamp,
	`eta` timestamp,
	`ata` timestamp,
	`status` enum('draft','confirmed','in_transit','arrived','customs','cleared','delivered','cancelled','delayed') DEFAULT 'draft',
	`owner` varchar(100),
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`cargoValue` double,
	`currency` varchar(10) DEFAULT 'USD',
	`weight` double,
	`volume` double,
	`healthScore` int DEFAULT 100,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`code` varchar(50),
	`country` varchar(100),
	`city` varchar(100),
	`contactPerson` varchar(200),
	`email` varchar(320),
	`phone` varchar(50),
	`rating` int DEFAULT 0,
	`performance` enum('excellent','good','average','poor') DEFAULT 'average',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`owner` varchar(200),
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`dueDate` timestamp,
	`status` enum('not_started','in_progress','completed','on_hold','cancelled') DEFAULT 'not_started',
	`progress` int DEFAULT 0,
	`completionDate` timestamp,
	`shipmentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
