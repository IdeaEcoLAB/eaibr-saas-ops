import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  decimal,
  json,
  longtext
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Editorial Pillars - Main content categories
 */
export const editorialPillars = mysqlTable("editorial_pillars", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EditorialPillar = typeof editorialPillars.$inferSelect;
export type InsertEditorialPillar = typeof editorialPillars.$inferInsert;

/**
 * Content Sources - RSS feeds, newsletters, and curated sources
 */
export const contentSources = mysqlTable("content_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  sourceType: mysqlEnum("sourceType", ["rss", "newsletter", "website", "social"]).notNull(),
  region: mysqlEnum("region", ["brasil", "usa", "china", "global"]).notNull(),
  pillarId: int("pillarId"),
  isActive: boolean("isActive").default(true).notNull(),
  lastFetched: timestamp("lastFetched"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentSource = typeof contentSources.$inferSelect;
export type InsertContentSource = typeof contentSources.$inferInsert;

/**
 * Raw Content Items - Articles/items collected from sources
 */
export const contentItems = mysqlTable("content_items", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: longtext("description"),
  url: varchar("url", { length: 500 }).notNull().unique(),
  content: longtext("content"),
  publishedAt: timestamp("publishedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = typeof contentItems.$inferInsert;

/**
 * AI Pre-Curation Analysis - Automated classification
 */
export const preCurationAnalysis = mysqlTable("pre_curation_analysis", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("contentItemId").notNull().unique(),
  theme: varchar("theme", { length: 100 }),
  maturityLevel: mysqlEnum("maturityLevel", ["beginner", "intermediate", "advanced"]),
  practicalImpact: mysqlEnum("practicalImpact", ["low", "medium", "high"]),
  relevanceScore: decimal("relevanceScore", { precision: 3, scale: 2 }),
  summary: longtext("summary"),
  suggestedPillar: int("suggestedPillar"),
  aiAnalysis: json("aiAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PreCurationAnalysis = typeof preCurationAnalysis.$inferSelect;
export type InsertPreCurationAnalysis = typeof preCurationAnalysis.$inferInsert;

/**
 * Episodes - Podcast episodes
 */
export const episodes = mysqlTable("episodes", {
  id: int("id").autoincrement().primaryKey(),
  episodeNumber: int("episodeNumber").notNull().unique(),
  title: varchar("title", { length: 255 }),
  scheduledDate: timestamp("scheduledDate").notNull(),
  liveTime: varchar("liveTime", { length: 10 }).default("07:00").notNull(), // HH:MM format
  status: mysqlEnum("status", ["planning", "curation", "scripting", "review", "published"]).default("planning").notNull(),
  curationProgress: decimal("curationProgress", { precision: 3, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = typeof episodes.$inferInsert;

/**
 * Episode Curations - Selected content items for an episode
 */
export const episodeCurations = mysqlTable("episode_curations", {
  id: int("id").autoincrement().primaryKey(),
  episodeId: int("episodeId").notNull(),
  contentItemId: int("contentItemId").notNull(),
  pillarId: int("pillarId").notNull(),
  section: mysqlEnum("section", ["radar_global", "tema_central", "ferramenta", "aplicacao"]).notNull(),
  notes: longtext("notes"),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EpisodeCuration = typeof episodeCurations.$inferSelect;
export type InsertEpisodeCuration = typeof episodeCurations.$inferInsert;

/**
 * Podcast Scripts - Generated scripts for episodes
 */
export const podcastScripts = mysqlTable("podcast_scripts", {
  id: int("id").autoincrement().primaryKey(),
  episodeId: int("episodeId").notNull().unique(),
  radarGlobal: longtext("radarGlobal"),
  temaCentral: longtext("temaCentral"),
  ferramentaQuinzena: longtext("ferramentaQuinzena"),
  aplicacaoPratica: longtext("aplicacaoPratica"),
  fullScript: longtext("fullScript"),
  estimatedDuration: int("estimatedDuration"), // in minutes
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PodcastScript = typeof podcastScripts.$inferSelect;
export type InsertPodcastScript = typeof podcastScripts.$inferInsert;

/**
 * Blog Posts - Generated blog content from scripts
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  episodeId: int("episodeId").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: longtext("content"),
  excerpt: text("excerpt"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Social Media Microcontents - Suggestions for social posts
 */
export const socialMicrocontents = mysqlTable("social_microcontents", {
  id: int("id").autoincrement().primaryKey(),
  episodeId: int("episodeId").notNull(),
  platform: mysqlEnum("platform", ["twitter", "linkedin", "instagram", "tiktok"]).notNull(),
  content: longtext("content"),
  characterCount: int("characterCount"),
  suggestedHashtags: varchar("suggestedHashtags", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialMicrocontent = typeof socialMicrocontents.$inferSelect;
export type InsertSocialMicrocontent = typeof socialMicrocontents.$inferInsert;

/**
 * Editorial Tags - Flexible tagging system
 */
export const editorialTags = mysqlTable("editorial_tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EditorialTag = typeof editorialTags.$inferSelect;
export type InsertEditorialTag = typeof editorialTags.$inferInsert;

/**
 * Content Item Tags - Many-to-many relationship
 */
export const contentItemTags = mysqlTable("content_item_tags", {
  id: int("id").autoincrement().primaryKey(),
  contentItemId: int("contentItemId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentItemTag = typeof contentItemTags.$inferSelect;
export type InsertContentItemTag = typeof contentItemTags.$inferInsert;
