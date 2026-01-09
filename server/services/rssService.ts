import Parser from "rss-parser";
import { getDb } from "../db";
import { contentItems, contentSources } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent":
      "eAI-BR-Ops/1.0 (Podcast Content Curator; +https://eaibr.lovable.app)",
  },
});

export interface RSSFeedConfig {
  id: number;
  name: string;
  url: string;
  region: "brasil" | "usa" | "china" | "global";
  sourceType: "rss" | "newsletter" | "website" | "social";
  lastFetched?: Date | null;
}

export interface ParsedFeedItem {
  title: string;
  description: string;
  content?: string;
  url: string;
  pubDate: Date;
  author?: string;
  categories?: string[];
  sourceId: number;
  region: string;
}

/**
 * Fetch and parse a single RSS feed
 */
export async function parseFeed(feed: RSSFeedConfig): Promise<ParsedFeedItem[]> {
  try {
    const feedData = await parser.parseURL(feed.url);

    const items: ParsedFeedItem[] = (feedData.items || [])
      .slice(0, 20)
      .map((item) => ({
        title: item.title || "Untitled",
        description: item.contentSnippet || item.summary || "",
        content: item.content || item.description || "",
        url: item.link || "",
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        author: item.creator || item.author || "",
        categories: item.categories || [],
        sourceId: feed.id,
        region: feed.region,
      }))
      .filter((item) => item.url);

    console.log(`[RSS] Successfully parsed ${feed.name}: ${items.length} items`);
    return items;
  } catch (error) {
    console.error(`[RSS] Failed to parse feed ${feed.name}:`, error);
    throw error;
  }
}

/**
 * Check if content item already exists (deduplication)
 */
export async function contentItemExists(url: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.url, url))
      .limit(1);

    return existing.length > 0;
  } catch (error) {
    console.error("[RSS] Error checking for duplicate content:", error);
    return false;
  }
}

/**
 * Save parsed feed items to database
 */
export async function saveContentItems(
  items: ParsedFeedItem[]
): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[RSS] Database not available");
    return 0;
  }

  let savedCount = 0;

  for (const item of items) {
    try {
      const exists = await contentItemExists(item.url);
      if (exists) {
        console.log(`[RSS] Skipping duplicate: ${item.title}`);
        continue;
      }

      await db.insert(contentItems).values({
        sourceId: item.sourceId,
        title: item.title,
        description: item.description,
        content: item.content,
        url: item.url,
        publishedAt: item.pubDate,
        fetchedAt: new Date(),
      });

      savedCount++;
    } catch (error) {
      console.error(`[RSS] Failed to save item "${item.title}":`, error);
    }
  }

  return savedCount;
}

/**
 * Update source's last fetched timestamp on success
 */
export async function updateSourceSuccess(sourceId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(contentSources)
      .set({
        lastFetched: new Date(),
      })
      .where(eq(contentSources.id, sourceId));
  } catch (error) {
    console.error(`[RSS] Failed to update source ${sourceId}:`, error);
  }
}

/**
 * Mark source as last fetched
 */
export async function updateSourceFailure(sourceId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(contentSources)
      .set({
        lastFetched: new Date(),
      })
      .where(eq(contentSources.id, sourceId));
  } catch (error) {
    console.error(`[RSS] Failed to update source ${sourceId}:`, error);
  }
}

/**
 * Fetch all active RSS sources
 */
export async function getActiveSources(): Promise<RSSFeedConfig[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const sources = await db
      .select()
      .from(contentSources)
      .where(eq(contentSources.isActive, true));

    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      region: s.region as "brasil" | "usa" | "china" | "global",
      sourceType: s.sourceType as "rss" | "newsletter" | "website" | "social",
      lastFetched: s.lastFetched || undefined,
    }));
  } catch (error) {
    console.error("[RSS] Failed to fetch active sources:", error);
    return [];
  }
}

/**
 * Process a single feed with error handling and deduplication
 */
export async function processFeed(
  feed: RSSFeedConfig
): Promise<{ success: boolean; itemsAdded: number; error?: string }> {
  try {
    const items = await parseFeed(feed);
    const savedCount = await saveContentItems(items);

    if (items.length > 0) {
      await updateSourceSuccess(feed.id);
    }

    return { success: true, itemsAdded: savedCount };
  } catch (error) {
    await updateSourceFailure(feed.id);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[RSS] Error processing feed ${feed.name}:`, errorMessage);
    return { success: false, itemsAdded: 0, error: errorMessage };
  }
}

/**
 * Process all active feeds
 */
export async function procesAllFeeds(): Promise<{
  totalProcessed: number;
  totalAdded: number;
  successCount: number;
  failureCount: number;
}> {
  console.log("[RSS] Starting feed sync...");
  const sources = await getActiveSources();

  let totalAdded = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const source of sources) {
    const result = await processFeed(source);
    totalAdded += result.itemsAdded;

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(
    `[RSS] Sync complete: ${successCount}/${sources.length} successful, ${totalAdded} items added`
  );

  return {
    totalProcessed: sources.length,
    totalAdded,
    successCount,
    failureCount,
  };
}
