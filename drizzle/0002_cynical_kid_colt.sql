ALTER TABLE `documents` ADD `extractionStatus` enum('none','running','done','failed') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `documents` ADD `extractedData` text;