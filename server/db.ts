import { eq, desc, and, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  episodes,
  contentSources,
  contentItems,
  preCurationAnalysis,
  episodeCurations,
  podcastScripts,
  blogPosts,
  editorialPillars,
  editorialTags,
  socialMicrocontents,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ EPISODES ============

export async function getUpcomingEpisode() {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(episodes)
    .where(gte(episodes.scheduledDate, new Date()))
    .orderBy(episodes.scheduledDate)
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getEpisodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(episodes)
    .where(eq(episodes.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEpisodes(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(episodes)
    .orderBy(desc(episodes.scheduledDate))
    .limit(limit)
    .offset(offset);
}

export async function createEpisode(episodeNumber: number, scheduledDate: Date, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(episodes).values({
    episodeNumber,
    scheduledDate,
    title: title || `Episódio ${episodeNumber}`,
  });
  
  return result;
}

export async function updateEpisodeStatus(episodeId: number, status: string, progress?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (progress !== undefined) {
    updateData.curationProgress = progress;
  }
  
  return db
    .update(episodes)
    .set(updateData)
    .where(eq(episodes.id, episodeId));
}

// ============ CONTENT SOURCES ============

export async function getAllContentSources(onlyActive = true) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = onlyActive ? [eq(contentSources.isActive, true)] : [];
  
  return db
    .select()
    .from(contentSources)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(contentSources.name);
}

export async function getContentSourcesByRegion(region: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(contentSources)
    .where(and(
      eq(contentSources.region, region as any),
      eq(contentSources.isActive, true)
    ))
    .orderBy(contentSources.name);
}

export async function createContentSource(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(contentSources).values(data);
}

// ============ CONTENT ITEMS ============

export async function getRecentContentItems(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(contentItems)
    .orderBy(desc(contentItems.fetchedAt))
    .limit(limit);
}

export async function createContentItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(contentItems).values(data);
}

// ============ PRE-CURATION ANALYSIS ============

export async function getPreCurationAnalysisByContentId(contentItemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(preCurationAnalysis)
    .where(eq(preCurationAnalysis.contentItemId, contentItemId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createPreCurationAnalysis(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(preCurationAnalysis).values(data);
}

// ============ EPISODE CURATIONS ============

export async function getEpisodeCurations(episodeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(episodeCurations)
    .where(eq(episodeCurations.episodeId, episodeId))
    .orderBy(episodeCurations.order);
}

export async function createEpisodeCuration(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(episodeCurations).values(data);
}

// ============ PODCAST SCRIPTS ============

export async function getPodcastScriptByEpisodeId(episodeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(podcastScripts)
    .where(eq(podcastScripts.episodeId, episodeId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdatePodcastScript(episodeId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getPodcastScriptByEpisodeId(episodeId);
  
  if (existing) {
    return db
      .update(podcastScripts)
      .set(data)
      .where(eq(podcastScripts.episodeId, episodeId));
  } else {
    return db.insert(podcastScripts).values({ episodeId, ...data });
  }
}

// ============ BLOG POSTS ============

export async function getBlogPostByEpisodeId(episodeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.episodeId, episodeId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateBlogPost(episodeId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getBlogPostByEpisodeId(episodeId);
  
  if (existing) {
    return db
      .update(blogPosts)
      .set(data)
      .where(eq(blogPosts.episodeId, episodeId));
  } else {
    return db.insert(blogPosts).values({ episodeId, ...data });
  }
}

// ============ EDITORIAL PILLARS ============

export async function getAllEditorialPillars() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(editorialPillars).orderBy(editorialPillars.name);
}

export async function createEditorialPillar(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(editorialPillars).values(data);
}

// ============ SOCIAL MICROCONTENTS ============

export async function getSocialMicrocontentsByEpisodeId(episodeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(socialMicrocontents)
    .where(eq(socialMicrocontents.episodeId, episodeId));
}

export async function createSocialMicrocontent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(socialMicrocontents).values(data);
}
