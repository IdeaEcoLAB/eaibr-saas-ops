import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getActiveSources,
  processFeed,
  procesAllFeeds,
} from "../services/rssService";
import { triggerRssSync } from "../jobs/rssSyncCron";

export const rssRouter = router({
  /**
   * Get all active RSS sources
   */
  getSources: protectedProcedure.query(async () => {
    return getActiveSources();
  }),

  /**
   * Manually trigger RSS sync for a single source
   */
  syncSource: protectedProcedure
    .input(z.object({ sourceId: z.number() }))
    .mutation(async ({ input }) => {
      const sources = await getActiveSources();
      const source = sources.find((s) => s.id === input.sourceId);

      if (!source) {
        throw new Error("Source not found");
      }

      const result = await processFeed(source);
      return result;
    }),

  /**
   * Manually trigger RSS sync for all sources
   */
  syncAll: protectedProcedure.mutation(async () => {
    const result = await procesAllFeeds();
    return result;
  }),

  /**
   * Get RSS sync status
   */
  getStatus: protectedProcedure.query(async () => {
    const sources = await getActiveSources();
    return {
      totalSources: sources.length,
      activeSources: sources.filter((s) => !s.lastFetched).length,
      lastSync: sources.length > 0 ? Math.max(...sources.map((s) => s.lastFetched?.getTime() || 0)) : null,
    };
  }),
});
