CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` longtext,
	`excerpt` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_episodeId_unique` UNIQUE(`episodeId`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `content_item_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentItemId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_item_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` longtext,
	`url` varchar(500) NOT NULL,
	`content` longtext,
	`publishedAt` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_items_url_unique` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `content_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`sourceType` enum('rss','newsletter','website','social') NOT NULL,
	`region` enum('brasil','usa','china','global') NOT NULL,
	`pillarId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastFetched` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_sources_url_unique` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `editorial_pillars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3B82F6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `editorial_pillars_id` PRIMARY KEY(`id`),
	CONSTRAINT `editorial_pillars_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `editorial_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `editorial_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `editorial_tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `episode_curations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeId` int NOT NULL,
	`contentItemId` int NOT NULL,
	`pillarId` int NOT NULL,
	`section` enum('radar_global','tema_central','ferramenta','aplicacao') NOT NULL,
	`notes` longtext,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `episode_curations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeNumber` int NOT NULL,
	`title` varchar(255),
	`scheduledDate` timestamp NOT NULL,
	`liveTime` varchar(10) NOT NULL DEFAULT '07:00',
	`status` enum('planning','curation','scripting','review','published') NOT NULL DEFAULT 'planning',
	`curationProgress` decimal(3,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `episodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `episodes_episodeNumber_unique` UNIQUE(`episodeNumber`)
);
--> statement-breakpoint
CREATE TABLE `podcast_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeId` int NOT NULL,
	`radarGlobal` longtext,
	`temaCentral` longtext,
	`ferramentaQuinzena` longtext,
	`aplicacaoPratica` longtext,
	`fullScript` longtext,
	`estimatedDuration` int,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `podcast_scripts_id` PRIMARY KEY(`id`),
	CONSTRAINT `podcast_scripts_episodeId_unique` UNIQUE(`episodeId`)
);
--> statement-breakpoint
CREATE TABLE `pre_curation_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentItemId` int NOT NULL,
	`theme` varchar(100),
	`maturityLevel` enum('beginner','intermediate','advanced'),
	`practicalImpact` enum('low','medium','high'),
	`relevanceScore` decimal(3,2),
	`summary` longtext,
	`suggestedPillar` int,
	`aiAnalysis` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pre_curation_analysis_id` PRIMARY KEY(`id`),
	CONSTRAINT `pre_curation_analysis_contentItemId_unique` UNIQUE(`contentItemId`)
);
--> statement-breakpoint
CREATE TABLE `social_microcontents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`episodeId` int NOT NULL,
	`platform` enum('twitter','linkedin','instagram','tiktok') NOT NULL,
	`content` longtext,
	`characterCount` int,
	`suggestedHashtags` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_microcontents_id` PRIMARY KEY(`id`)
);
